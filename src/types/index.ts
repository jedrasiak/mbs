// Platform coordinates for a single side of a stop
export interface Platform {
  lat: number;
  lng: number;
  description?: string;
}

// Stop with two platforms (A and B)
export interface Stop {
  id: number;
  name: string;
  platforms: {
    A: Platform;
    B: Platform;
  };
}

// Reference to a stop within a route, specifying which platform
export interface StopInRoute {
  stopId: number;
  platform: 'A' | 'B';
}

// Direction of a line (e.g., "to Mrówka" or "from Mrówka")
export interface Direction {
  id: string;
  name: string; // Destination name, e.g., "PSB Mrówka"
  stops: StopInRoute[];
}

// Bus line with two directions
export interface Line {
  id: number;
  name: string;
  color: string;
  operatingDays?: ('weekday' | 'weekend')[]; // If undefined, operates every day
  directions: Direction[];
}

// Schedule keyed by direction ID, then stop ID
export interface DirectionSchedule {
  [stopId: string]: string[];
}

export interface Schedule {
  [directionId: string]: DirectionSchedule;
}

// Non-operating day definitions
export interface FixedHoliday {
  month: number;
  day: number;
  name: string;
}

export interface VariableHoliday {
  name: string;
  note: string;
}

export interface NonOperatingDays {
  fixed: FixedHoliday[];
  variable: VariableHoliday[];
}

// Schedule metadata
export interface ScheduleMetadata {
  cityName: string;
  timezone: string;
  lastUpdated: string;
  nonOperatingDays: NonOperatingDays;
}

// Complete schedule data structure
export interface ScheduleData {
  metadata: ScheduleMetadata;
  lines: Line[];
  stops: Stop[];
  schedules: {
    weekday: Schedule;
    weekend: Schedule;
  };
}

// Day type for schedule lookup
export type DayType = 'weekday' | 'weekend';

// Departure information with direction
export interface Departure {
  lineId: number;
  lineName: string;
  lineColor: string;
  directionId: string;
  destinationName: string;
  time: string;
  minutesUntil: number;
}

// Service status for a given date
export interface ServiceStatus {
  isOperating: boolean;
  dayType: DayType | null;
  reason?: string; // e.g., "Christmas", "Easter Sunday"
}

// User settings
export interface UserSettings {
  defaultStopId: number | null;
  favoriteStops: number[];
  timeFormat: '12h' | '24h';
  darkMode: boolean;
}

// Geolocation state
export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

// Direction info for display (used in map/bottom sheet)
export interface DirectionInfo {
  lineId: number;
  lineName: string;
  lineColor: string;
  directionId: string;
  directionName: string;
}
