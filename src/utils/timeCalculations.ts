import { isWeekend as dateFnsIsWeekend, format, parse } from 'date-fns';

export function isWeekend(date: Date = new Date()): boolean {
  return dateFnsIsWeekend(date);
}

export function getMinutesUntil(timeString: string, now: Date = new Date()): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  if (hours === undefined || minutes === undefined) return -1;

  const targetDate = new Date(now);
  targetDate.setHours(hours, minutes, 0, 0);

  const diffMs = targetDate.getTime() - now.getTime();
  return Math.floor(diffMs / 60000);
}

export function isPastTime(timeString: string, now: Date = new Date()): boolean {
  return getMinutesUntil(timeString, now) < 0;
}

export function formatTime(timeString: string, use24Hour: boolean): string {
  if (use24Hour) {
    return timeString;
  }

  const date = parse(timeString, 'HH:mm', new Date());
  return format(date, 'h:mm a');
}

export function formatMinutesUntil(minutes: number): string {
  if (minutes < 0) return 'Departed';
  if (minutes === 0) return 'Now';
  if (minutes === 1) return '1 min';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hr' : `${hours} hrs`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function getCurrentTimeString(): string {
  return format(new Date(), 'HH:mm');
}

export function formatCurrentTime(use24Hour: boolean): string {
  const formatStr = use24Hour ? 'HH:mm' : 'h:mm a';
  return format(new Date(), formatStr);
}
