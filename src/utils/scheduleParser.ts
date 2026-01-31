import type {
  ScheduleData,
  Stop,
  Line,
  Direction,
  Departure,
  DayType,
  Platform,
  DirectionInfo,
  Trip,
  PlatformId,
} from '@/types';
import { getDayType, getMinutesUntil, isPastTime, getServiceStatus } from './timeCalculations';
import schedulesData from '@/assets/data/schedules.json';

const data = schedulesData as ScheduleData;

// ==========================================
// Basic Data Access
// ==========================================

export function getAllStops(): Stop[] {
  return data.stops;
}

export function getStopById(id: number): Stop | undefined {
  return data.stops.find(stop => stop.id === id);
}

export function getAllLines(): Line[] {
  return data.lines;
}

export function getLineById(id: number): Line | undefined {
  return data.lines.find(line => line.id === id);
}

export function getMetadata() {
  return data.metadata;
}

// ==========================================
// Direction Functions
// ==========================================

export function getDirectionById(directionId: string): Direction | undefined {
  for (const line of data.lines) {
    const direction = line.directions.find(d => d.id === directionId);
    if (direction) return direction;
  }
  return undefined;
}

export function getLineForDirection(directionId: string): Line | undefined {
  return data.lines.find(line =>
    line.directions.some(d => d.id === directionId)
  );
}

export function getDirectionsForLine(lineId: number): Direction[] {
  const line = getLineById(lineId);
  return line?.directions ?? [];
}

// ==========================================
// Trip Functions
// ==========================================

/**
 * Get all trips for a direction on a given day type.
 */
export function getTripsForDirection(
  directionId: string,
  dayType: DayType
): Trip[] {
  const direction = getDirectionById(directionId);
  if (!direction) return [];

  const daySchedule = direction.schedules[dayType];
  return daySchedule?.trips ?? [];
}

/**
 * Get a specific trip by ID.
 */
export function getTripById(
  directionId: string,
  tripId: string,
  dayType: DayType
): Trip | undefined {
  const trips = getTripsForDirection(directionId, dayType);
  return trips.find(t => t.tripId === tripId);
}

/**
 * Find the trip that contains a specific stop at a specific time.
 */
export function getTripByStopAndTime(
  directionId: string,
  stopId: number,
  time: string,
  dayType: DayType
): Trip | undefined {
  const trips = getTripsForDirection(directionId, dayType);
  return trips.find(trip =>
    trip.stops.some(s => s.stopId === stopId && s.time === time)
  );
}

/**
 * Get all unique stops for a direction (union of all trips' stops).
 * Returns stops sorted chronologically based on their positions in trips.
 * Uses the longest trip as the base order, then merges additional stops
 * from other trips in their proper chronological positions.
 */
export function getStopsForDirection(directionId: string, dayType: DayType = 'weekday'): Stop[] {
  const trips = getTripsForDirection(directionId, dayType);
  if (trips.length === 0) return [];

  // Find the longest trip to use as the base order
  const longestTrip = trips.reduce((longest, current) =>
    current.stops.length > longest.stops.length ? current : longest
  );

  // Build the base order from the longest trip (only first occurrence of each stop)
  const stopOrder: number[] = [];
  const seenStops = new Set<number>();

  for (const tripStop of longestTrip.stops) {
    if (!seenStops.has(tripStop.stopId)) {
      seenStops.add(tripStop.stopId);
      stopOrder.push(tripStop.stopId);
    }
  }

  // Collect any additional stops from other trips that aren't in the base order
  // and find their proper insertion position based on neighboring stops
  for (const trip of trips) {
    if (trip.tripId === longestTrip.tripId) continue;

    for (let i = 0; i < trip.stops.length; i++) {
      const tripStop = trip.stops[i];
      if (!tripStop || seenStops.has(tripStop.stopId)) continue;

      // Find the best position to insert this stop
      // Look for the nearest preceding stop that exists in our order
      let insertIndex = stopOrder.length; // Default to end

      // Search backward to find a preceding stop that's in our order
      for (let j = i - 1; j >= 0; j--) {
        const precedingStop = trip.stops[j];
        if (!precedingStop) continue;
        const precedingIndex = stopOrder.indexOf(precedingStop.stopId);
        if (precedingIndex !== -1) {
          insertIndex = precedingIndex + 1;
          break;
        }
      }

      // Insert the stop at the found position
      stopOrder.splice(insertIndex, 0, tripStop.stopId);
      seenStops.add(tripStop.stopId);
    }
  }

  return stopOrder
    .map(stopId => getStopById(stopId))
    .filter((stop): stop is Stop => stop !== undefined);
}

/**
 * Get all unique stop IDs for a direction.
 */
export function getStopIdsForDirection(directionId: string, dayType: DayType = 'weekday'): number[] {
  const stops = getStopsForDirection(directionId, dayType);
  return stops.map(s => s.id);
}

// ==========================================
// Line Operating Status
// ==========================================

/**
 * Check if a line operates on a given day type.
 * Lines without operatingDays specified run every day.
 */
export function doesLineOperateOnDayType(line: Line, dayType: DayType): boolean {
  // If no restriction, line operates every day
  if (!line.operatingDays || line.operatingDays.length === 0) {
    return true;
  }
  return line.operatingDays.includes(dayType);
}

/**
 * Check if a line is operating on a given date.
 */
export function isLineOperating(lineId: number, date: Date = new Date()): boolean {
  const line = getLineById(lineId);
  if (!line) return false;

  const dayType = getDayType(date);
  if (dayType === null) return false; // Non-operating day

  return doesLineOperateOnDayType(line, dayType);
}

/**
 * Get all lines that are operating on a given date.
 */
export function getOperatingLines(date: Date = new Date()): Line[] {
  const dayType = getDayType(date);
  if (dayType === null) return []; // Non-operating day

  return data.lines.filter(line => doesLineOperateOnDayType(line, dayType));
}

// ==========================================
// Stop and Platform Functions
// ==========================================

/**
 * Get the first available platform for a stop.
 * Returns 'A' if available, otherwise 'B', or null if no platforms exist.
 */
export function getFirstAvailablePlatform(stop: Stop): PlatformId | null {
  if (stop.platforms.A) return 'A';
  if (stop.platforms.B) return 'B';
  return null;
}

/**
 * Check if a stop has a specific platform.
 */
export function hasPlaftorm(stop: Stop, platform: PlatformId): boolean {
  return stop.platforms[platform] !== undefined;
}

/**
 * Get platform coordinates safely, returning null if platform doesn't exist.
 */
export function getPlatformCoordinates(stop: Stop, platform: PlatformId): Platform | null {
  return stop.platforms[platform] ?? null;
}

/**
 * Get the platform coordinates for a stop in a specific direction.
 * Uses the first trip to determine the platform.
 */
export function getStopCoordinates(
  stopId: number,
  directionId: string,
  dayType: DayType = 'weekday'
): Platform | null {
  const trips = getTripsForDirection(directionId, dayType);
  if (trips.length === 0) return null;

  // Find the stop in any trip
  for (const trip of trips) {
    const tripStop = trip.stops.find(s => s.stopId === stopId);
    if (tripStop) {
      const stop = getStopById(stopId);
      if (!stop) return null;
      return getPlatformCoordinates(stop, tripStop.platform);
    }
  }

  return null;
}

/**
 * Get route coordinates for a direction (for drawing polylines).
 * Uses the first trip's stop order.
 */
export function getRouteCoordinates(directionId: string, dayType: DayType = 'weekday'): [number, number][] {
  const trips = getTripsForDirection(directionId, dayType);
  if (trips.length === 0) return [];

  // Use the first trip for the route
  const firstTrip = trips[0];
  if (!firstTrip) return [];

  return firstTrip.stops
    .map(tripStop => {
      const stop = getStopById(tripStop.stopId);
      if (!stop) return null;
      const platform = getPlatformCoordinates(stop, tripStop.platform);
      if (!platform) return null;
      return [platform.lat, platform.lng] as [number, number];
    })
    .filter((coord): coord is [number, number] => coord !== null);
}

/**
 * Check if a stop is served by a specific direction.
 */
export function isStopServedBy(
  stopId: number,
  directionId: string,
  dayType: DayType = 'weekday'
): boolean {
  const trips = getTripsForDirection(directionId, dayType);
  return trips.some(trip => trip.stops.some(s => s.stopId === stopId));
}

/**
 * Check if a stop is served by a specific line (in any direction).
 */
export function isStopServedByLine(stopId: number, lineId: number, dayType: DayType = 'weekday'): boolean {
  const line = getLineById(lineId);
  if (!line) return false;

  return line.directions.some(direction => isStopServedBy(stopId, direction.id, dayType));
}

/**
 * Get all directions that serve a specific stop.
 */
export function getDirectionsServingStop(stopId: number, dayType: DayType = 'weekday'): DirectionInfo[] {
  const result: DirectionInfo[] = [];

  for (const line of data.lines) {
    for (const direction of line.directions) {
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
 * Get all directions that serve a specific platform at a stop.
 */
export function getDirectionsServingPlatform(
  stopId: number,
  platform: PlatformId,
  dayType: DayType = 'weekday'
): DirectionInfo[] {
  const result: DirectionInfo[] = [];

  for (const line of data.lines) {
    for (const direction of line.directions) {
      const trips = getTripsForDirection(direction.id, dayType);
      const servesThisPlatform = trips.some(trip =>
        trip.stops.some(s => s.stopId === stopId && s.platform === platform)
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
 * Useful for displaying all lines that ever serve a stop.
 */
export function getAllDirectionsServingPlatform(
  stopId: number,
  platform: PlatformId
): DirectionInfo[] {
  const weekdayDirs = getDirectionsServingPlatform(stopId, platform, 'weekday');
  const weekendDirs = getDirectionsServingPlatform(stopId, platform, 'weekend');

  // Merge and deduplicate by directionId
  const seen = new Set<string>();
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
 * Get lines that serve a stop (for backward compatibility and map display).
 */
export function getLinesForStop(stopId: number, dayType: DayType = 'weekday'): Line[] {
  return data.lines.filter(line =>
    line.directions.some(direction => isStopServedBy(stopId, direction.id, dayType))
  );
}

// ==========================================
// Schedule Functions (Trip-based)
// ==========================================

/**
 * Get departure times for a stop in a specific direction.
 * Returns all times from all trips where this stop appears.
 */
export function getTimesForStopInDirection(
  stopId: number,
  directionId: string,
  dayType: DayType
): string[] {
  const trips = getTripsForDirection(directionId, dayType);
  const times: string[] = [];

  for (const trip of trips) {
    for (const tripStop of trip.stops) {
      if (tripStop.stopId === stopId) {
        times.push(tripStop.time);
      }
    }
  }

  return times.sort();
}

/**
 * Get the time for a specific stop on a specific trip.
 */
export function getTimeForStopOnTrip(
  stopId: number,
  directionId: string,
  tripId: string,
  dayType: DayType
): string | null {
  const trip = getTripById(directionId, tripId, dayType);
  if (!trip) return null;

  // A stop might appear multiple times in a trip (loop routes)
  // Return the first occurrence
  const tripStop = trip.stops.find(s => s.stopId === stopId);
  return tripStop?.time ?? null;
}

/**
 * Get all times for a stop on a trip (for loop routes where stop appears multiple times).
 */
export function getAllTimesForStopOnTrip(
  stopId: number,
  directionId: string,
  tripId: string,
  dayType: DayType
): string[] {
  const trip = getTripById(directionId, tripId, dayType);
  if (!trip) return [];

  return trip.stops
    .filter(s => s.stopId === stopId)
    .map(s => s.time);
}

/**
 * Get departure times for a stop (backward compatibility).
 */
export function getTimesForStop(
  directionId: string,
  stopId: number,
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
 * This is the main function for the home page.
 */
export function getNextDepartures(
  stopId: number,
  limit: number = 5,
  now: Date = new Date()
): Departure[] {
  const serviceStatus = getServiceStatus(now);

  // No service on non-operating days
  if (!serviceStatus.isOperating || !serviceStatus.dayType) {
    return [];
  }

  const dayType = serviceStatus.dayType;
  const departures: Departure[] = [];

  // Get all directions serving this stop
  const directionsInfo = getDirectionsServingStop(stopId, dayType);

  for (const dirInfo of directionsInfo) {
    // Check if the line operates on this day type
    const line = getLineById(dirInfo.lineId);
    if (!line || !doesLineOperateOnDayType(line, dayType)) {
      continue;
    }

    // Get times for this stop in this direction
    const times = getTimesForStopInDirection(stopId, dirInfo.directionId, dayType);

    for (const time of times) {
      if (!isPastTime(time, now)) {
        departures.push({
          lineId: dirInfo.lineId,
          lineName: dirInfo.lineName,
          lineColor: dirInfo.lineColor,
          directionId: dirInfo.directionId,
          destinationName: dirInfo.directionName,
          time,
          minutesUntil: getMinutesUntil(time, now),
        });
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
  stopId: number,
  directionId: string,
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

  // Check if line operates on this day
  if (!doesLineOperateOnDayType(line, dayType)) {
    return [];
  }

  const times = getTimesForStopInDirection(stopId, directionId, dayType);
  const departures: Departure[] = [];

  for (const time of times) {
    if (!isPastTime(time, now)) {
      departures.push({
        lineId: line.id,
        lineName: line.name,
        lineColor: line.color,
        directionId: direction.id,
        destinationName: direction.name,
        time,
        minutesUntil: getMinutesUntil(time, now),
      });
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
  const R = 6371e3; // Earth radius in meters
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
 * Calculate distance to a stop's platform from user location.
 * Falls back to first available platform if requested platform doesn't exist.
 */
export function calculateDistanceToStop(
  userLat: number,
  userLng: number,
  stopId: number,
  platform: PlatformId = 'A'
): number | null {
  const stop = getStopById(stopId);
  if (!stop) return null;

  // Try requested platform first, then fall back to first available
  let platformCoords = getPlatformCoordinates(stop, platform);
  if (!platformCoords) {
    const fallbackPlatform = getFirstAvailablePlatform(stop);
    if (!fallbackPlatform) return null;
    platformCoords = getPlatformCoordinates(stop, fallbackPlatform);
  }
  if (!platformCoords) return null;

  return calculateDistance(userLat, userLng, platformCoords.lat, platformCoords.lng);
}

// ==========================================
// Utility Functions for Map
// ==========================================

/**
 * Get all unique platforms that need markers.
 * Returns an array of { stopId, platform, lat, lng, stopName }.
 */
export function getAllPlatformMarkers(dayType: DayType = 'weekday'): Array<{
  stopId: number;
  platform: PlatformId;
  lat: number;
  lng: number;
  stopName: string;
  directions: DirectionInfo[];
}> {
  const markers: Array<{
    stopId: number;
    platform: PlatformId;
    lat: number;
    lng: number;
    stopName: string;
    directions: DirectionInfo[];
  }> = [];

  const seenPlatforms = new Set<string>();

  for (const line of data.lines) {
    for (const direction of line.directions) {
      const trips = getTripsForDirection(direction.id, dayType);

      for (const trip of trips) {
        for (const tripStop of trip.stops) {
          const key = `${tripStop.stopId}-${tripStop.platform}`;

          if (seenPlatforms.has(key)) continue;
          seenPlatforms.add(key);

          const stop = getStopById(tripStop.stopId);
          if (!stop) continue;

          const platform = getPlatformCoordinates(stop, tripStop.platform);
          if (!platform) continue; // Skip if platform doesn't exist

          const directions = getDirectionsServingPlatform(
            tripStop.stopId,
            tripStop.platform,
            dayType
          );

          markers.push({
            stopId: tripStop.stopId,
            platform: tripStop.platform,
            lat: platform.lat,
            lng: platform.lng,
            stopName: stop.name,
            directions,
          });
        }
      }
    }
  }

  return markers;
}

/**
 * Get the center point for the map based on all stops.
 * Uses first available platform from each stop.
 */
export function getMapCenter(): [number, number] {
  if (data.stops.length === 0) {
    return [51.75, 20.5]; // Default center
  }

  let totalLat = 0;
  let totalLng = 0;
  let count = 0;

  for (const stop of data.stops) {
    const platformId = getFirstAvailablePlatform(stop);
    if (!platformId) continue;

    const platform = getPlatformCoordinates(stop, platformId);
    if (!platform) continue;

    totalLat += platform.lat;
    totalLng += platform.lng;
    count++;
  }

  if (count === 0) {
    return [51.75, 20.5]; // Default center if no valid platforms
  }

  return [totalLat / count, totalLng / count];
}

// ==========================================
// Shape Functions (Road-following routes)
// ==========================================

import shapesData from '@/assets/data/shapes.json';

interface ShapeSegment {
  description?: string;
  coordinates: [number, number][];
}

interface TripShape {
  description?: string;
  segments: string[];
  tripIds: {
    weekday?: string[];
    weekend?: string[];
  };
}

interface ShapesData {
  metadata: {
    description: string;
    lastUpdated: string;
  };
  segments: Record<string, ShapeSegment>;
  tripShapes: Record<string, TripShape>;
}

const shapes = shapesData as unknown as ShapesData;

/**
 * Parse a segment key to extract stop IDs and platforms.
 * Format: "fromStopId-fromPlatform_toStopId-toPlatform" (e.g., "1-A_2-A")
 */
function parseSegmentKey(segmentKey: string): {
  fromStopId: number;
  fromPlatform: PlatformId;
  toStopId: number;
  toPlatform: PlatformId;
} | null {
  const match = segmentKey.match(/^(\d+)-([AB])_(\d+)-([AB])$/);
  if (!match || match.length < 5) return null;

  const [, fromStop, fromPlat, toStop, toPlat] = match;
  if (!fromStop || !fromPlat || !toStop || !toPlat) return null;

  return {
    fromStopId: parseInt(fromStop, 10),
    fromPlatform: fromPlat as PlatformId,
    toStopId: parseInt(toStop, 10),
    toPlatform: toPlat as PlatformId,
  };
}

/**
 * Get coordinates for a single segment, including start and end stop coordinates.
 * The segment's coordinates array contains only the middle points (road path).
 * Start/end coordinates are fetched from the actual stop data.
 */
function getSegmentCoordinates(segmentKey: string): [number, number][] {
  const parsed = parseSegmentKey(segmentKey);
  if (!parsed) {
    console.warn(`Invalid segment key format: ${segmentKey}`);
    return [];
  }

  const segment = shapes.segments[segmentKey];
  const coordinates: [number, number][] = [];

  // Get start stop coordinates
  const fromStop = getStopById(parsed.fromStopId);
  if (fromStop) {
    const fromPlatform = getPlatformCoordinates(fromStop, parsed.fromPlatform);
    if (fromPlatform) {
      coordinates.push([fromPlatform.lat, fromPlatform.lng]);
    }
  }

  // Add middle points from shape (if segment exists)
  if (segment) {
    for (const coord of segment.coordinates) {
      coordinates.push(coord);
    }
  }

  // Get end stop coordinates
  const toStop = getStopById(parsed.toStopId);
  if (toStop) {
    const toPlatform = getPlatformCoordinates(toStop, parsed.toPlatform);
    if (toPlatform) {
      coordinates.push([toPlatform.lat, toPlatform.lng]);
    }
  }

  return coordinates;
}

/**
 * Find the shape pattern key for a specific trip.
 * Returns the tripShapes key (e.g., "1-to-mrowka-standard") or null if not found.
 */
export function getShapePatternForTrip(
  directionId: string,
  tripId: string,
  dayType: DayType
): string | null {
  for (const [patternKey, tripShape] of Object.entries(shapes.tripShapes)) {
    // Skip comment entries
    if (patternKey.startsWith('comment')) continue;

    const tripIdsForDayType = tripShape.tripIds[dayType];
    if (tripIdsForDayType?.includes(tripId)) {
      // Verify this pattern is for the correct direction
      if (patternKey.startsWith(directionId.replace(/-/g, '-'))) {
        return patternKey;
      }
      // Also check if direction matches the pattern naming convention
      // e.g., "1-to-mrowka" matches "1-to-mrowka-standard"
      const directionPrefix = directionId;
      if (patternKey.startsWith(directionPrefix)) {
        return patternKey;
      }
    }
  }
  return null;
}

/**
 * Get the full coordinates for a shape pattern by joining all its segments.
 * Stop coordinates are automatically fetched from stop data.
 * Segment coordinates contain only the middle points (road path between stops).
 * Returns an array of [lat, lng] tuples suitable for Leaflet Polyline.
 */
export function getShapeCoordinates(shapePatternKey: string): [number, number][] {
  const tripShape = shapes.tripShapes[shapePatternKey];
  if (!tripShape) return [];

  const coordinates: [number, number][] = [];

  for (const segmentKey of tripShape.segments) {
    const segmentCoords = getSegmentCoordinates(segmentKey);

    // Add segment coordinates, avoiding duplicate points at segment boundaries
    for (let i = 0; i < segmentCoords.length; i++) {
      const coord = segmentCoords[i];
      if (!coord) continue;

      // Skip the first point if it matches the last point we added (segment boundary)
      if (i === 0 && coordinates.length > 0) {
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

  return coordinates;
}

/**
 * Get route coordinates for a specific trip, using shapes if available.
 * Falls back to straight lines between stops if no shape is defined.
 */
export function getTripRouteCoordinates(
  directionId: string,
  tripId: string,
  dayType: DayType
): [number, number][] {
  // Try to find a shape pattern for this trip
  const shapePattern = getShapePatternForTrip(directionId, tripId, dayType);

  if (shapePattern) {
    const shapeCoords = getShapeCoordinates(shapePattern);
    if (shapeCoords.length > 0) {
      return shapeCoords;
    }
  }

  // Fall back to stop-to-stop straight lines
  const trip = getTripById(directionId, tripId, dayType);
  if (!trip) return [];

  return trip.stops
    .map(tripStop => {
      const stop = getStopById(tripStop.stopId);
      if (!stop) return null;
      const platform = getPlatformCoordinates(stop, tripStop.platform);
      if (!platform) return null;
      return [platform.lat, platform.lng] as [number, number];
    })
    .filter((coord): coord is [number, number] => coord !== null);
}

/**
 * Check if a shape is defined for a specific trip.
 */
export function hasShapeForTrip(
  directionId: string,
  tripId: string,
  dayType: DayType
): boolean {
  return getShapePatternForTrip(directionId, tripId, dayType) !== null;
}

/**
 * Get all available shape patterns for a direction.
 */
export function getShapePatternsForDirection(directionId: string): string[] {
  return Object.keys(shapes.tripShapes).filter(
    key => !key.startsWith('comment') && key.startsWith(directionId)
  );
}

/**
 * Get segment data for debugging/visualization.
 */
export function getSegment(segmentKey: string): ShapeSegment | null {
  return shapes.segments[segmentKey] ?? null;
}

/**
 * Get all segment keys.
 */
export function getAllSegmentKeys(): string[] {
  return Object.keys(shapes.segments).filter(key => !key.startsWith('comment'));
}
