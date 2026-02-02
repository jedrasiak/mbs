import type {
  Stop,
  Platform,
  Route,
  Line,
  Direction,
  Trip,
  Schedule,
  Departure,
  DayType,
  DirectionInfo,
  StopId,
  PlatformId,
  LineId,
  DirectionId,
  TripId,
  PlatformDirection,
} from '@/types';
import { getPlatformDirection } from '@/types';
import { getDayType, getMinutesUntil, isPastTime, getServiceStatus } from './timeCalculations';

// Import all new JSON data files
import stopsData from '@/assets/data/stops.json';
import platformsData from '@/assets/data/platforms.json';
import routesData from '@/assets/data/routes.json';
import linesData from '@/assets/data/lines.json';
import directionsData from '@/assets/data/directions.json';
import tripsData from '@/assets/data/trips.json';
import schedulesData from '@/assets/data/schedules.json';

// Type assertions for JSON imports
const stops = stopsData as Stop[];
const platforms = platformsData as Platform[];
const routes = routesData as Route[];
const allLines = linesData as Line[];
const allDirections = directionsData as Direction[];
const allTrips = tripsData as Trip[];
const schedules = schedulesData as Schedule[];

// ==========================================
// Schedule Validity Functions
// ==========================================

/**
 * Get the currently valid schedule based on today's date.
 * Returns the schedule with the most recent valid_from date that is not in the future.
 */
export function getCurrentSchedule(referenceDate: Date = new Date()): Schedule | null {
  const today = referenceDate.toISOString().split('T')[0]!;

  // Filter schedules where valid_from <= today
  const validSchedules = schedules.filter(schedule => schedule.valid_from <= today);

  if (validSchedules.length === 0) {
    return null;
  }

  // Sort by valid_from descending and return the most recent
  validSchedules.sort((a, b) => b.valid_from.localeCompare(a.valid_from));
  return validSchedules[0] ?? null;
}

/**
 * Check if there is a valid schedule for the given date.
 */
export function hasValidSchedule(referenceDate: Date = new Date()): boolean {
  return getCurrentSchedule(referenceDate) !== null;
}

/**
 * Get the set of line IDs that are active in the current schedule.
 */
function getActiveLineIds(): Set<LineId> {
  const currentSchedule = getCurrentSchedule();
  if (!currentSchedule) {
    // Fallback: if no valid schedule, use all lines
    return new Set(allLines.map(l => l.id));
  }
  return new Set(currentSchedule.lines);
}

// Get active line IDs for filtering
const activeLineIds = getActiveLineIds();

// Filter data based on active schedule
const lines = allLines.filter(l => activeLineIds.has(l.id));
const directions = allDirections.filter(d => activeLineIds.has(d.parent_line));
const activeDirectionIds = new Set(directions.map(d => d.id));
const trips = allTrips.filter(t => activeDirectionIds.has(t.parent_direction));

// ==========================================
// Lookup Maps for O(1) access
// ==========================================

const stopsById = new Map<StopId, Stop>(stops.map(s => [s.id, s]));
const platformsById = new Map<PlatformId, Platform>(platforms.map(p => [p.id, p]));
const linesById = new Map<LineId, Line>(lines.map(l => [l.id, l]));
const directionsById = new Map<DirectionId, Direction>(directions.map(d => [d.id, d]));
const tripsById = new Map<TripId, Trip>(trips.map(t => [t.id, t]));

// Build platform-to-platform route lookup for quick coordinate retrieval
const routesByPlatforms = new Map<string, Route>();
for (const route of routes) {
  const key = `${route.parent_platform_start}--${route.parent_platform_end}`;
  routesByPlatforms.set(key, route);
}

// Build platforms by stop lookup
const platformsByStop = new Map<StopId, Platform[]>();
for (const platform of platforms) {
  const existing = platformsByStop.get(platform.parent_stop) ?? [];
  existing.push(platform);
  platformsByStop.set(platform.parent_stop, existing);
}

// Build trips by direction lookup
const tripsByDirection = new Map<DirectionId, Trip[]>();
for (const trip of trips) {
  const existing = tripsByDirection.get(trip.parent_direction) ?? [];
  existing.push(trip);
  tripsByDirection.set(trip.parent_direction, existing);
}

// Build directions by line lookup
const directionsByLine = new Map<LineId, Direction[]>();
for (const direction of directions) {
  const existing = directionsByLine.get(direction.parent_line) ?? [];
  existing.push(direction);
  directionsByLine.set(direction.parent_line, existing);
}

/**
 * Get stop ID from a platform ID using the platform's parent_stop property.
 */
function getStopIdForPlatform(platformId: PlatformId): StopId | undefined {
  const platform = platformsById.get(platformId);
  return platform?.parent_stop;
}

// ==========================================
// Basic Data Access
// ==========================================

export function getAllStops(): Stop[] {
  return stops;
}

export function getStopById(id: StopId): Stop | undefined {
  return stopsById.get(id);
}

export function getAllPlatforms(): Platform[] {
  return platforms;
}

export function getPlatformById(id: PlatformId): Platform | undefined {
  return platformsById.get(id);
}

export function getPlatformsForStop(stopId: StopId): Platform[] {
  return platformsByStop.get(stopId) ?? [];
}

export function getAllLines(): Line[] {
  return lines;
}

export function getLineById(id: LineId): Line | undefined {
  return linesById.get(id);
}

export function getAllDirections(): Direction[] {
  return directions;
}

export function getDirectionById(id: DirectionId): Direction | undefined {
  return directionsById.get(id);
}

export function getAllTrips(): Trip[] {
  return trips;
}

export function getTripByFullId(id: TripId): Trip | undefined {
  return tripsById.get(id);
}

export function getAllSchedules(): Schedule[] {
  return schedules;
}

export function getMetadata() {
  // Return the currently valid schedule as metadata
  const currentSchedule = getCurrentSchedule();
  return {
    id: currentSchedule?.id ?? '',
    lastUpdated: currentSchedule?.updated_at ?? '',
    validFrom: currentSchedule?.valid_from ?? '',
  };
}

// ==========================================
// Direction Functions
// ==========================================

export function getLineForDirection(directionId: DirectionId): Line | undefined {
  const direction = directionsById.get(directionId);
  if (!direction) return undefined;
  return linesById.get(direction.parent_line);
}

export function getDirectionsForLine(lineId: LineId): Direction[] {
  return directionsByLine.get(lineId) ?? [];
}

// ==========================================
// Trip Functions
// ==========================================

/**
 * Get all trips for a direction on a given day type.
 * Filters by daysGroup and checks daysExclude/daysInclude.
 */
export function getTripsForDirection(
  directionId: DirectionId,
  dayType: DayType
): Trip[] {
  const dirTrips = tripsByDirection.get(directionId) ?? [];

  return dirTrips.filter(trip => {
    // Filter by daysGroup
    if (trip.daysGroup && trip.daysGroup !== dayType) {
      return false;
    }
    return true;
  });
}

/**
 * Get a specific trip by direction, trip name, and day type.
 */
export function getTripById(
  directionId: DirectionId,
  tripName: string,
  dayType: DayType
): Trip | undefined {
  const trips = getTripsForDirection(directionId, dayType);
  return trips.find(t => t.name === tripName);
}

/**
 * Find the trip that contains a specific platform at a specific time.
 */
export function getTripByPlatformAndTime(
  directionId: DirectionId,
  platformId: PlatformId,
  time: string,
  dayType: DayType
): Trip | undefined {
  const trips = getTripsForDirection(directionId, dayType);
  return trips.find(trip =>
    trip.stages.some(s => s.platform === platformId && s.time === time)
  );
}

/**
 * Get all unique stops for a direction (union of all trips' stops).
 * Returns stops sorted chronologically based on their positions in trips.
 */
export function getStopsForDirection(directionId: DirectionId, dayType: DayType = 'weekday'): Stop[] {
  const trips = getTripsForDirection(directionId, dayType);
  if (trips.length === 0) return [];

  // Find the longest trip to use as the base order
  const longestTrip = trips.reduce((longest, current) =>
    current.stages.length > longest.stages.length ? current : longest
  );

  // Build the base order from the longest trip (only first occurrence of each stop)
  const stopOrder: StopId[] = [];
  const seenStops = new Set<StopId>();

  for (const stage of longestTrip.stages) {
    const stopId = getStopIdForPlatform(stage.platform);
    if (!stopId || seenStops.has(stopId)) continue;
    seenStops.add(stopId);
    stopOrder.push(stopId);
  }

  // Collect any additional stops from other trips
  for (const trip of trips) {
    if (trip.id === longestTrip.id) continue;

    for (let i = 0; i < trip.stages.length; i++) {
      const stage = trip.stages[i];
      if (!stage) continue;

      const stopId = getStopIdForPlatform(stage.platform);
      if (!stopId || seenStops.has(stopId)) continue;

      // Find the best position to insert this stop
      let insertIndex = stopOrder.length;

      for (let j = i - 1; j >= 0; j--) {
        const precedingStage = trip.stages[j];
        if (!precedingStage) continue;
        const precedingStopId = getStopIdForPlatform(precedingStage.platform);
        if (!precedingStopId) continue;
        const precedingIndex = stopOrder.indexOf(precedingStopId);
        if (precedingIndex !== -1) {
          insertIndex = precedingIndex + 1;
          break;
        }
      }

      stopOrder.splice(insertIndex, 0, stopId);
      seenStops.add(stopId);
    }
  }

  return stopOrder
    .map(stopId => getStopById(stopId))
    .filter((stop): stop is Stop => stop !== undefined);
}

/**
 * Get all unique stop IDs for a direction.
 */
export function getStopIdsForDirection(directionId: DirectionId, dayType: DayType = 'weekday'): StopId[] {
  const stops = getStopsForDirection(directionId, dayType);
  return stops.map(s => s.id);
}

/**
 * Stop entry for schedule display, including position for loop routes.
 */
export interface StopEntry {
  stop: Stop;
  position: number; // Position in the trip (0-indexed)
  platformId: PlatformId;
}

/**
 * Get the full stop sequence for a direction including duplicates for loop routes.
 * Uses the longest trip as the reference for the stop sequence.
 */
export function getStopSequenceForDirection(directionId: DirectionId, dayType: DayType = 'weekday'): StopEntry[] {
  const trips = getTripsForDirection(directionId, dayType);
  if (trips.length === 0) return [];

  // Find the longest trip to use as the reference sequence
  const longestTrip = trips.reduce((longest, current) =>
    current.stages.length > longest.stages.length ? current : longest
  );

  return longestTrip.stages
    .map((stage, index) => {
      const stopId = getStopIdForPlatform(stage.platform);
      if (!stopId) return null;
      const stop = getStopById(stopId);
      if (!stop) return null;
      return {
        stop,
        position: index,
        platformId: stage.platform,
      };
    })
    .filter((entry): entry is StopEntry => entry !== null);
}

/**
 * Build a mapping from canonical positions to trip stage times.
 * Maps each trip's stages to positions in the canonical sequence by matching platforms in order.
 * This correctly handles loop routes where the same stop appears multiple times.
 */
export function buildTripPositionMap(
  canonicalSequence: StopEntry[],
  trip: Trip
): Map<number, string> {
  const positionToTime = new Map<number, string>();
  const usedCanonicalPositions = new Set<number>();

  // For each stage in the trip, find the next matching canonical position
  for (const stage of trip.stages) {
    // Find the first unused canonical position with the same platform
    for (const entry of canonicalSequence) {
      if (entry.platformId === stage.platform && !usedCanonicalPositions.has(entry.position)) {
        positionToTime.set(entry.position, stage.time);
        usedCanonicalPositions.add(entry.position);
        break;
      }
    }
  }

  return positionToTime;
}

/**
 * Get times for all positions in a trip, mapped to the canonical sequence.
 */
export function getTripTimesForCanonicalSequence(
  directionId: DirectionId,
  tripName: string,
  dayType: DayType
): Map<number, string> {
  const trip = getTripById(directionId, tripName, dayType);
  if (!trip) return new Map();

  const canonicalSequence = getStopSequenceForDirection(directionId, dayType);
  return buildTripPositionMap(canonicalSequence, trip);
}

// ==========================================
// Line Operating Status
// ==========================================

/**
 * Check if a line operates on a given day type.
 * With the new structure, we check if there are any trips for that day type.
 */
export function doesLineOperateOnDayType(line: Line, dayType: DayType): boolean {
  const lineDirections = getDirectionsForLine(line.id);

  for (const direction of lineDirections) {
    const dirTrips = getTripsForDirection(direction.id, dayType);
    if (dirTrips.length > 0) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a line is operating on a given date.
 */
export function isLineOperating(lineId: LineId, date: Date = new Date()): boolean {
  const line = getLineById(lineId);
  if (!line) return false;

  const dayType = getDayType(date);
  if (dayType === null) return false;

  return doesLineOperateOnDayType(line, dayType);
}

/**
 * Check if a trip should run on a specific date.
 * Handles daysGroup, daysInclude, and daysExclude.
 */
export function isTripOperatingOnDate(trip: Trip, date: Date): boolean {
  const dayType = getDayType(date);
  if (dayType === null) return false;

  // Check daysGroup
  if (trip.daysGroup && trip.daysGroup !== dayType) {
    return false;
  }

  const dateStr = date.toISOString().split('T')[0]!;

  // Check daysExclude
  if (trip.daysExclude?.includes(dateStr)) {
    return false;
  }

  // Check daysInclude (overrides daysGroup)
  if (trip.daysInclude?.includes(dateStr)) {
    return true;
  }

  return true;
}

/**
 * Get all lines that are operating on a given date.
 */
export function getOperatingLines(date: Date = new Date()): Line[] {
  const dayType = getDayType(date);
  if (dayType === null) return [];

  return lines.filter(line => doesLineOperateOnDayType(line, dayType));
}

// ==========================================
// Platform Functions
// ==========================================

/**
 * Get the first available platform for a stop.
 */
export function getFirstAvailablePlatform(stop: Stop): Platform | null {
  const stopPlatforms = platformsByStop.get(stop.id) ?? [];
  // Prefer south platform first (like old 'A')
  const southPlatform = stopPlatforms.find(p => p.id.endsWith(':south'));
  if (southPlatform) return southPlatform;
  return stopPlatforms[0] ?? null;
}

/**
 * Get the first available platform ID for a stop.
 */
export function getFirstAvailablePlatformId(stopId: StopId): PlatformId | null {
  const stop = getStopById(stopId);
  if (!stop) return null;
  const platform = getFirstAvailablePlatform(stop);
  return platform?.id ?? null;
}

/**
 * Check if a stop has a platform in a specific direction.
 */
export function hasPlatformDirection(stopId: StopId, direction: PlatformDirection): boolean {
  const platformId = `${stopId}:${direction}`;
  return platformsById.has(platformId);
}

/**
 * Get platform by stop and direction.
 */
export function getPlatformByStopAndDirection(
  stopId: StopId,
  direction: PlatformDirection
): Platform | null {
  const platformId = `${stopId}:${direction}`;
  return platformsById.get(platformId) ?? null;
}

/**
 * Get the platform coordinates for a stop in a specific direction.
 * Uses the first trip to determine the platform.
 */
export function getStopCoordinates(
  stopId: StopId,
  directionId: DirectionId,
  dayType: DayType = 'weekday'
): { lat: number; lng: number } | null {
  const trips = getTripsForDirection(directionId, dayType);
  if (trips.length === 0) return null;

  // Find the platform in any trip
  for (const trip of trips) {
    for (const stage of trip.stages) {
      const stageStopId = getStopIdForPlatform(stage.platform);
      if (stageStopId === stopId) {
        const platform = platformsById.get(stage.platform);
        if (platform) {
          return { lat: platform.lat, lng: platform.lng };
        }
      }
    }
  }

  return null;
}

/**
 * Get route coordinates for a direction (for drawing polylines).
 * Uses the first trip's stop order.
 */
export function getRouteCoordinates(directionId: DirectionId, dayType: DayType = 'weekday'): [number, number][] {
  const trips = getTripsForDirection(directionId, dayType);
  if (trips.length === 0) return [];

  const firstTrip = trips[0];
  if (!firstTrip) return [];

  return firstTrip.stages
    .map(stage => {
      const platform = platformsById.get(stage.platform);
      if (!platform) return null;
      return [platform.lat, platform.lng] as [number, number];
    })
    .filter((coord): coord is [number, number] => coord !== null);
}

/**
 * Check if a stop is served by a specific direction.
 */
export function isStopServedBy(
  stopId: StopId,
  directionId: DirectionId,
  dayType: DayType = 'weekday'
): boolean {
  const trips = getTripsForDirection(directionId, dayType);
  return trips.some(trip =>
    trip.stages.some(s => getStopIdForPlatform(s.platform) === stopId)
  );
}

/**
 * Check if a stop is served by a specific line (in any direction).
 */
export function isStopServedByLine(stopId: StopId, lineId: LineId, dayType: DayType = 'weekday'): boolean {
  const lineDirections = getDirectionsForLine(lineId);
  return lineDirections.some(direction => isStopServedBy(stopId, direction.id, dayType));
}

/**
 * Get all directions that serve a specific stop.
 */
export function getDirectionsServingStop(stopId: StopId, dayType: DayType = 'weekday'): DirectionInfo[] {
  const result: DirectionInfo[] = [];

  for (const line of lines) {
    const lineDirections = getDirectionsForLine(line.id);
    for (const direction of lineDirections) {
      if (isStopServedBy(stopId, direction.id, dayType)) {
        result.push({
          lineId: line.id,
          lineName: line.name,
          lineColor: line.color,
          directionId: direction.id,
          directionName: direction.name,
        });
      }
    }
  }

  return result;
}

/**
 * Get all directions that serve a specific platform.
 */
export function getDirectionsServingPlatform(
  platformId: PlatformId,
  dayType: DayType = 'weekday'
): DirectionInfo[] {
  const result: DirectionInfo[] = [];

  for (const line of lines) {
    const lineDirections = getDirectionsForLine(line.id);
    for (const direction of lineDirections) {
      const trips = getTripsForDirection(direction.id, dayType);
      const servesThisPlatform = trips.some(trip =>
        trip.stages.some(s => s.platform === platformId)
      );

      if (servesThisPlatform) {
        result.push({
          lineId: line.id,
          lineName: line.name,
          lineColor: line.color,
          directionId: direction.id,
          directionName: direction.name,
        });
      }
    }
  }

  return result;
}

/**
 * Get all directions serving a platform regardless of day type.
 */
export function getAllDirectionsServingPlatform(platformId: PlatformId): DirectionInfo[] {
  const weekdayDirs = getDirectionsServingPlatform(platformId, 'weekday');
  const weekendDirs = getDirectionsServingPlatform(platformId, 'weekend');

  const seen = new Set<DirectionId>();
  const result: DirectionInfo[] = [];

  for (const dir of [...weekdayDirs, ...weekendDirs]) {
    if (!seen.has(dir.directionId)) {
      seen.add(dir.directionId);
      result.push(dir);
    }
  }

  return result;
}

/**
 * Get lines that serve a stop.
 */
export function getLinesForStop(stopId: StopId, dayType: DayType = 'weekday'): Line[] {
  return lines.filter(line => isStopServedByLine(stopId, line.id, dayType));
}

// ==========================================
// Schedule Functions (Trip-based)
// ==========================================

/**
 * Get departure times for a stop in a specific direction.
 */
export function getTimesForStopInDirection(
  stopId: StopId,
  directionId: DirectionId,
  dayType: DayType
): string[] {
  const trips = getTripsForDirection(directionId, dayType);
  const times: string[] = [];

  for (const trip of trips) {
    for (const stage of trip.stages) {
      const stageStopId = getStopIdForPlatform(stage.platform);
      if (stageStopId === stopId) {
        times.push(stage.time);
      }
    }
  }

  return times.sort();
}

/**
 * Get the time for a specific stop on a specific trip.
 */
export function getTimeForStopOnTrip(
  stopId: StopId,
  directionId: DirectionId,
  tripName: string,
  dayType: DayType
): string | null {
  const trip = getTripById(directionId, tripName, dayType);
  if (!trip) return null;

  const stage = trip.stages.find(s => getStopIdForPlatform(s.platform) === stopId);
  return stage?.time ?? null;
}

/**
 * Get all times for a stop on a trip (for loop routes where stop appears multiple times).
 */
export function getAllTimesForStopOnTrip(
  stopId: StopId,
  directionId: DirectionId,
  tripName: string,
  dayType: DayType
): string[] {
  const trip = getTripById(directionId, tripName, dayType);
  if (!trip) return [];

  return trip.stages
    .filter(s => getStopIdForPlatform(s.platform) === stopId)
    .map(s => s.time);
}

/**
 * Get departure times for a stop (backward compatibility).
 */
export function getTimesForStop(
  directionId: DirectionId,
  stopId: StopId,
  isWeekendDay: boolean
): string[] {
  const dayType: DayType = isWeekendDay ? 'weekend' : 'weekday';
  return getTimesForStopInDirection(stopId, directionId, dayType);
}

// ==========================================
// Departure Calculations
// ==========================================

/**
 * Get next departures from a stop for all directions.
 */
export function getNextDepartures(
  stopId: StopId,
  limit: number = 5,
  now: Date = new Date()
): Departure[] {
  const serviceStatus = getServiceStatus(now);

  if (!serviceStatus.isOperating || !serviceStatus.dayType) {
    return [];
  }

  const dayType = serviceStatus.dayType;
  const departures: Departure[] = [];

  const directionsInfo = getDirectionsServingStop(stopId, dayType);

  for (const dirInfo of directionsInfo) {
    const line = getLineById(dirInfo.lineId);
    if (!line || !doesLineOperateOnDayType(line, dayType)) {
      continue;
    }

    // Get all trips for this direction
    const trips = getTripsForDirection(dirInfo.directionId, dayType);

    for (const trip of trips) {
      for (const stage of trip.stages) {
        // Check if this stage is at the requested stop
        const stageStopId = getStopIdForPlatform(stage.platform);
        if (stageStopId !== stopId) continue;

        if (!isPastTime(stage.time, now)) {
          departures.push({
            lineId: dirInfo.lineId,
            lineName: dirInfo.lineName,
            lineColor: dirInfo.lineColor,
            directionId: dirInfo.directionId,
            destinationName: dirInfo.directionName,
            platformId: stage.platform,
            time: stage.time,
            minutesUntil: getMinutesUntil(stage.time, now),
          });
        }
      }
    }
  }

  return departures
    .sort((a, b) => a.minutesUntil - b.minutesUntil)
    .slice(0, limit);
}

/**
 * Get next departures for a specific direction from a stop.
 */
export function getNextDeparturesForDirection(
  stopId: StopId,
  directionId: DirectionId,
  limit: number = 5,
  now: Date = new Date()
): Departure[] {
  const serviceStatus = getServiceStatus(now);

  if (!serviceStatus.isOperating || !serviceStatus.dayType) {
    return [];
  }

  const dayType = serviceStatus.dayType;
  const line = getLineForDirection(directionId);
  const direction = getDirectionById(directionId);

  if (!line || !direction) return [];

  if (!doesLineOperateOnDayType(line, dayType)) {
    return [];
  }

  const trips = getTripsForDirection(directionId, dayType);
  const departures: Departure[] = [];

  for (const trip of trips) {
    for (const stage of trip.stages) {
      const stageStopId = getStopIdForPlatform(stage.platform);
      if (stageStopId !== stopId) continue;

      if (!isPastTime(stage.time, now)) {
        departures.push({
          lineId: line.id,
          lineName: line.name,
          lineColor: line.color,
          directionId: direction.id,
          destinationName: direction.name,
          platformId: stage.platform,
          time: stage.time,
          minutesUntil: getMinutesUntil(stage.time, now),
        });
      }
    }
  }

  return departures
    .sort((a, b) => a.minutesUntil - b.minutesUntil)
    .slice(0, limit);
}

// ==========================================
// Distance Calculations
// ==========================================

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Calculate distance to a platform from user location.
 */
export function calculateDistanceToPlatform(
  userLat: number,
  userLng: number,
  platformId: PlatformId
): number | null {
  const platform = platformsById.get(platformId);
  if (!platform) return null;

  return calculateDistance(userLat, userLng, platform.lat, platform.lng);
}

/**
 * Calculate distance to a stop (using first available platform).
 */
export function calculateDistanceToStop(
  userLat: number,
  userLng: number,
  stopId: StopId,
  preferredDirection?: PlatformDirection
): number | null {
  const stop = getStopById(stopId);
  if (!stop) return null;

  // Try preferred direction first
  if (preferredDirection) {
    const platform = getPlatformByStopAndDirection(stopId, preferredDirection);
    if (platform) {
      return calculateDistance(userLat, userLng, platform.lat, platform.lng);
    }
  }

  // Fall back to first available
  const platform = getFirstAvailablePlatform(stop);
  if (!platform) return null;

  return calculateDistance(userLat, userLng, platform.lat, platform.lng);
}

// ==========================================
// Map Utility Functions
// ==========================================

/**
 * Get all unique platforms that need markers.
 */
export function getAllPlatformMarkers(dayType: DayType = 'weekday'): Array<{
  platformId: PlatformId;
  stopId: StopId;
  lat: number;
  lng: number;
  stopName: string;
  platformDirection: PlatformDirection;
  directions: DirectionInfo[];
}> {
  const markers: Array<{
    platformId: PlatformId;
    stopId: StopId;
    lat: number;
    lng: number;
    stopName: string;
    platformDirection: PlatformDirection;
    directions: DirectionInfo[];
  }> = [];

  const seenPlatforms = new Set<PlatformId>();

  for (const line of lines) {
    const lineDirections = getDirectionsForLine(line.id);
    for (const direction of lineDirections) {
      const dirTrips = getTripsForDirection(direction.id, dayType);

      for (const trip of dirTrips) {
        for (const stage of trip.stages) {
          if (seenPlatforms.has(stage.platform)) continue;
          seenPlatforms.add(stage.platform);

          const platform = platformsById.get(stage.platform);
          if (!platform) continue;

          const stop = stopsById.get(platform.parent_stop);
          if (!stop) continue;

          const platformDir = getPlatformDirection(stage.platform);
          const directions = getDirectionsServingPlatform(stage.platform, dayType);

          markers.push({
            platformId: stage.platform,
            stopId: platform.parent_stop,
            lat: platform.lat,
            lng: platform.lng,
            stopName: stop.name,
            platformDirection: platformDir,
            directions,
          });
        }
      }
    }
  }

  return markers;
}

/**
 * Get the center point for the map based on all platforms.
 */
export function getMapCenter(): [number, number] {
  if (platforms.length === 0) {
    return [51.75, 20.5];
  }

  let totalLat = 0;
  let totalLng = 0;

  for (const platform of platforms) {
    totalLat += platform.lat;
    totalLng += platform.lng;
  }

  return [totalLat / platforms.length, totalLng / platforms.length];
}

// ==========================================
// Route/Shape Functions
// ==========================================

/**
 * Get route coordinates between two platforms.
 */
export function getRouteBetweenPlatforms(
  startPlatformId: PlatformId,
  endPlatformId: PlatformId
): [number, number][] {
  const routeKey = `${startPlatformId}--${endPlatformId}`;
  const route = routesByPlatforms.get(routeKey);

  const coordinates: [number, number][] = [];

  // Get start platform coordinates
  const startPlatform = platformsById.get(startPlatformId);
  if (startPlatform) {
    coordinates.push([startPlatform.lat, startPlatform.lng]);
  }

  // Add route middle coordinates
  if (route) {
    for (const coord of route.coordinates) {
      coordinates.push(coord);
    }
  }

  // Get end platform coordinates
  const endPlatform = platformsById.get(endPlatformId);
  if (endPlatform) {
    coordinates.push([endPlatform.lat, endPlatform.lng]);
  }

  return coordinates;
}

/**
 * Get route coordinates for a specific trip.
 * Builds the full route by connecting all consecutive platforms.
 */
export function getTripRouteCoordinates(
  directionId: DirectionId,
  tripName: string,
  dayType: DayType
): [number, number][] {
  const trip = getTripById(directionId, tripName, dayType);
  if (!trip || trip.stages.length === 0) return [];

  const coordinates: [number, number][] = [];

  for (let i = 0; i < trip.stages.length; i++) {
    const stage = trip.stages[i];
    if (!stage) continue;

    if (i === 0) {
      // For first stage, add the platform coordinates
      const platform = platformsById.get(stage.platform);
      if (platform) {
        coordinates.push([platform.lat, platform.lng]);
      }
    } else {
      // Get route from previous to current platform
      const prevStage = trip.stages[i - 1];
      if (!prevStage) continue;

      const segmentCoords = getRouteBetweenPlatforms(prevStage.platform, stage.platform);

      // Add segment coordinates, avoiding duplicates at boundaries
      for (let j = 0; j < segmentCoords.length; j++) {
        const coord = segmentCoords[j];
        if (!coord) continue;

        // Skip first point if it matches last point (boundary)
        if (j === 0 && coordinates.length > 0) {
          const lastCoord = coordinates[coordinates.length - 1];
          if (lastCoord &&
              Math.abs(lastCoord[0] - coord[0]) < 0.000001 &&
              Math.abs(lastCoord[1] - coord[1]) < 0.000001) {
            continue;
          }
        }

        coordinates.push(coord);
      }
    }
  }

  return coordinates;
}

/**
 * Check if a route is defined between two platforms.
 */
export function hasRouteBetweenPlatforms(
  startPlatformId: PlatformId,
  endPlatformId: PlatformId
): boolean {
  const routeKey = `${startPlatformId}--${endPlatformId}`;
  return routesByPlatforms.has(routeKey);
}

/**
 * Get all route segments.
 */
export function getAllRoutes(): Route[] {
  return routes;
}
