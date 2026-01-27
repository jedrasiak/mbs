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

// A stop within a trip, with departure time
export interface TripStop {
  stopId: number;
  platform: 'A' | 'B';
  time: string;
}

// A single trip (one bus run through the route)
export interface Trip {
  tripId: string; // Roman numeral: "I", "II", "III", etc.
  stops: TripStop[];
}

// Schedule for a day type (weekday/weekend)
export interface DaySchedule {
  trips: Trip[];
}

// Direction schedules by day type
export interface DirectionSchedules {
  weekday?: DaySchedule;
  weekend?: DaySchedule;
}

// Direction of a line (e.g., "to Mrówka" or "from Mrówka")
export interface Direction {
  id: string;
  name: string; // Destination name, e.g., "PSB Mrówka"
  schedules: DirectionSchedules;
}

// Bus line with two directions
export interface Line {
  id: number;
  name: string;
  color: string;
  operatingDays?: ('weekday' | 'weekend')[]; // If undefined, operates every day
  directions: Direction[];
}

// Explicit non-operating day definition
export interface NonOperatingDay {
  day: number;
  month: number;
  year: number;
  name: string;
}

// Schedule metadata
export interface ScheduleMetadata {
  cityName: string;
  timezone: string;
  lastUpdated: string;
  nonOperatingDays: NonOperatingDay[];
}

// Complete schedule data structure
export interface ScheduleData {
  metadata: ScheduleMetadata;
  lines: Line[];
  stops: Stop[];
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
