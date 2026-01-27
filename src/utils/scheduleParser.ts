import type { ScheduleData, Stop, Line, Departure } from '@/types';
import { isWeekend, getMinutesUntil, isPastTime } from './timeCalculations';
import schedulesData from '@/assets/data/schedules.json';

const data = schedulesData as ScheduleData;

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

export function getLinesForStop(stopId: number): Line[] {
  return data.lines.filter(line => line.route.includes(stopId));
}

export function getScheduleForLine(
  lineId: number,
  isWeekendDay: boolean = isWeekend()
): Record<string, string[]> | undefined {
  const scheduleType = isWeekendDay ? 'weekend' : 'weekday';
  return data.schedules[scheduleType][String(lineId)];
}

export function getTimesForStop(
  lineId: number,
  stopId: number,
  isWeekendDay: boolean = isWeekend()
): string[] {
  const schedule = getScheduleForLine(lineId, isWeekendDay);
  if (!schedule) return [];
  return schedule[String(stopId)] ?? [];
}

export function getNextDepartures(
  stopId: number,
  limit: number = 5,
  now: Date = new Date()
): Departure[] {
  const lines = getLinesForStop(stopId);
  const isWeekendDay = isWeekend(now);
  const departures: Departure[] = [];

  for (const line of lines) {
    const times = getTimesForStop(line.id, stopId, isWeekendDay);

    for (const time of times) {
      if (!isPastTime(time, now)) {
        departures.push({
          lineId: line.id,
          lineName: line.name,
          lineColor: line.color,
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

export function getStopsForLine(lineId: number): Stop[] {
  const line = getLineById(lineId);
  if (!line) return [];

  return line.route
    .map(stopId => getStopById(stopId))
    .filter((stop): stop is Stop => stop !== undefined);
}

export function getRouteCoordinates(lineId: number): [number, number][] {
  const stops = getStopsForLine(lineId);
  return stops.map(stop => [stop.lat, stop.lng]);
}

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
