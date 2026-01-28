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
      return stop.platforms[tripStop.platform];
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
      const platform = stop.platforms[tripStop.platform];
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
  platform: 'A' | 'B',
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
 */
export function calculateDistanceToStop(
  userLat: number,
  userLng: number,
  stopId: number,
  platform: 'A' | 'B' = 'A'
): number | null {
  const stop = getStopById(stopId);
  if (!stop) return null;

  const platformCoords = stop.platforms[platform];
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
  platform: 'A' | 'B';
  lat: number;
  lng: number;
  stopName: string;
  directions: DirectionInfo[];
}> {
  const markers: Array<{
    stopId: number;
    platform: 'A' | 'B';
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

          const platform = stop.platforms[tripStop.platform];
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
 */
export function getMapCenter(): [number, number] {
  if (data.stops.length === 0) {
    return [51.75, 20.5]; // Default center
  }

  let totalLat = 0;
  let totalLng = 0;
  let count = 0;

  for (const stop of data.stops) {
    totalLat += stop.platforms.A.lat;
    totalLng += stop.platforms.A.lng;
    count++;
  }

  return [totalLat / count, totalLng / count];
}
