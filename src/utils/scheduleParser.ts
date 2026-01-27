import type {
  ScheduleData,
  Stop,
  Line,
  Direction,
  Departure,
  DayType,
  Platform,
  DirectionInfo,
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
 */
export function getStopCoordinates(
  stopId: number,
  directionId: string
): Platform | null {
  const direction = getDirectionById(directionId);
  if (!direction) return null;

  const stopInRoute = direction.stops.find(s => s.stopId === stopId);
  if (!stopInRoute) return null;

  const stop = getStopById(stopId);
  if (!stop) return null;

  return stop.platforms[stopInRoute.platform];
}

/**
 * Get route coordinates for a direction (for drawing polylines).
 */
export function getRouteCoordinates(directionId: string): [number, number][] {
  const direction = getDirectionById(directionId);
  if (!direction) return [];

  return direction.stops
    .map(stopInRoute => {
      const stop = getStopById(stopInRoute.stopId);
      if (!stop) return null;
      const platform = stop.platforms[stopInRoute.platform];
      return [platform.lat, platform.lng] as [number, number];
    })
    .filter((coord): coord is [number, number] => coord !== null);
}

/**
 * Check if a stop is served by a specific direction.
 */
export function isStopServedBy(
  stopId: number,
  directionId: string
): boolean {
  const direction = getDirectionById(directionId);
  if (!direction) return false;
  return direction.stops.some(s => s.stopId === stopId);
}

/**
 * Check if a stop is served by a specific line (in any direction).
 */
export function isStopServedByLine(stopId: number, lineId: number): boolean {
  const line = getLineById(lineId);
  if (!line) return false;

  return line.directions.some(direction =>
    direction.stops.some(s => s.stopId === stopId)
  );
}

/**
 * Get all directions that serve a specific stop.
 */
export function getDirectionsServingStop(stopId: number): DirectionInfo[] {
  const result: DirectionInfo[] = [];

  for (const line of data.lines) {
    for (const direction of line.directions) {
      if (direction.stops.some(s => s.stopId === stopId)) {
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
  platform: 'A' | 'B'
): DirectionInfo[] {
  const result: DirectionInfo[] = [];

  for (const line of data.lines) {
    for (const direction of line.directions) {
      const stopInRoute = direction.stops.find(
        s => s.stopId === stopId && s.platform === platform
      );
      if (stopInRoute) {
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
export function getLinesForStop(stopId: number): Line[] {
  return data.lines.filter(line =>
    line.directions.some(direction =>
      direction.stops.some(s => s.stopId === stopId)
    )
  );
}

/**
 * Get stops for a specific direction (in route order).
 */
export function getStopsForDirection(directionId: string): Stop[] {
  const direction = getDirectionById(directionId);
  if (!direction) return [];

  return direction.stops
    .map(stopInRoute => getStopById(stopInRoute.stopId))
    .filter((stop): stop is Stop => stop !== undefined);
}

/**
 * Get stop IDs for a direction (in route order).
 */
export function getStopIdsForDirection(directionId: string): number[] {
  const direction = getDirectionById(directionId);
  if (!direction) return [];
  return direction.stops.map(s => s.stopId);
}

// ==========================================
// Schedule Functions
// ==========================================

/**
 * Get schedule for a specific direction and day type.
 */
export function getDirectionSchedule(
  directionId: string,
  dayType: DayType
): Record<string, string[]> | undefined {
  return data.schedules[dayType]?.[directionId];
}

/**
 * Get departure times for a stop in a specific direction.
 */
export function getTimesForStopInDirection(
  stopId: number,
  directionId: string,
  dayType: DayType
): string[] {
  const schedule = getDirectionSchedule(directionId, dayType);
  if (!schedule) return [];
  return schedule[String(stopId)] ?? [];
}

/**
 * Get departure times for a stop (backward compatibility).
 * Note: This now requires a direction ID since schedules are direction-based.
 */
export function getTimesForStop(
  directionId: string,
  stopId: number,
  isWeekendDay: boolean
): string[] {
  const dayType: DayType = isWeekendDay ? 'weekend' : 'weekday';
  return getTimesForStopInDirection(stopId, directionId, dayType);
}

/**
 * Get all departure times for a direction on a given day type.
 * Returns a map of stopId -> times array.
 */
export function getAllTimesForDirection(
  directionId: string,
  dayType: DayType
): Map<number, string[]> {
  const result = new Map<number, string[]>();
  const schedule = getDirectionSchedule(directionId, dayType);

  if (!schedule) return result;

  for (const [stopId, times] of Object.entries(schedule)) {
    result.set(Number(stopId), times);
  }

  return result;
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
  const directionsInfo = getDirectionsServingStop(stopId);

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
export function getAllPlatformMarkers(): Array<{
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
      for (const stopInRoute of direction.stops) {
        const key = `${stopInRoute.stopId}-${stopInRoute.platform}`;

        if (seenPlatforms.has(key)) continue;
        seenPlatforms.add(key);

        const stop = getStopById(stopInRoute.stopId);
        if (!stop) continue;

        const platform = stop.platforms[stopInRoute.platform];
        const directions = getDirectionsServingPlatform(
          stopInRoute.stopId,
          stopInRoute.platform
        );

        markers.push({
          stopId: stopInRoute.stopId,
          platform: stopInRoute.platform,
          lat: platform.lat,
          lng: platform.lng,
          stopName: stop.name,
          directions,
        });
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
