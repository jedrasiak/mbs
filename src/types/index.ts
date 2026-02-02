// ==========================================
// New string-based ID types
// ==========================================

export type StopId = string;
export type PlatformId = string;
export type RouteId = string;
export type LineId = string;
export type DirectionId = string;
export type TripId = string;
export type ScheduleId = string;

// ==========================================
// Core Data Types (new relational structure)
// ==========================================

export interface Stop {
  id: StopId;
  name: string;
}

export interface Platform {
  id: PlatformId;
  parent_stop: StopId;
  lat: number;
  lng: number;
  description?: string;
}

export interface Route {
  id: RouteId;
  parent_platform_start: PlatformId;
  parent_platform_end: PlatformId;
  coordinates: [number, number][];
}

export interface Line {
  id: LineId;
  name: string;
  color: string;
}

export interface Direction {
  id: DirectionId;
  name: string;
  parent_line: LineId;
}

export interface Stage {
  platform: PlatformId;
  time: string;
}

export interface Trip {
  id: TripId;
  name: string;
  parent_direction: DirectionId;
  stages: Stage[];
  daysGroup?: DaysGroup;
  daysInclude?: string[];  // YYYY-MM-DD
  daysExclude?: string[];  // YYYY-MM-DD
}

export interface Schedule {
  id: ScheduleId;
  updated_at: string;
  valid_from: string;
  lines: LineId[];
}

// ==========================================
// Day type and schedule types
// ==========================================

export type DaysGroup = 'weekday' | 'weekend';
export type DayType = 'weekday' | 'weekend';

// ==========================================
// Departure and Service Types
// ==========================================

export interface Departure {
  lineId: LineId;
  lineName: string;
  lineColor: string;
  directionId: DirectionId;
  destinationName: string;
  platformId: PlatformId;
  time: string;
  minutesUntil: number;
}

export interface ServiceStatus {
  isOperating: boolean;
  dayType: DayType | null;
  reason?: string;
}

// ==========================================
// Direction info for display
// ==========================================

export interface DirectionInfo {
  lineId: LineId;
  lineName: string;
  lineColor: string;
  directionId: DirectionId;
  directionName: string;
}

// ==========================================
// User Settings
// ==========================================

export type Language = 'en' | 'pl' | 'uk';

export interface UserSettings {
  defaultStopId: StopId | null;
  favoriteStops: StopId[];
  timeFormat: '12h' | '24h';
  darkMode: boolean;
  language: Language | null;
}

export interface ScheduleSelection {
  lineId: LineId;
  dayType: DayType;
  directionId: DirectionId;
}

// ==========================================
// Geolocation
// ==========================================

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

// ==========================================
// Platform direction type (for map display)
// ==========================================

export type PlatformDirection = 'south' | 'north';

/**
 * Extract the direction part from a platform ID
 * e.g., "kazimierza-wielkiego:south" -> "south"
 */
export function getPlatformDirection(platformId: PlatformId): PlatformDirection {
  const parts = platformId.split(':');
  const direction = parts[parts.length - 1];
  return direction as PlatformDirection;
}
