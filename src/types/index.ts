export interface Line {
  id: number;
  name: string;
  color: string;
  route: number[];
}

export interface Stop {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

export interface Schedule {
  [lineId: string]: {
    [stopId: string]: string[];
  };
}

export interface ScheduleData {
  lines: Line[];
  stops: Stop[];
  schedules: {
    weekday: Schedule;
    weekend: Schedule;
  };
}

export interface Departure {
  lineId: number;
  lineName: string;
  lineColor: string;
  time: string;
  minutesUntil: number;
}

export interface UserSettings {
  defaultStopId: number | null;
  favoriteStops: number[];
  timeFormat: '12h' | '24h';
  darkMode: boolean;
}

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}
