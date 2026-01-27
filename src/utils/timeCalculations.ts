import { isWeekend as dateFnsIsWeekend, format, parse, getYear, getMonth, getDate } from 'date-fns';
import type { DayType, ServiceStatus } from '@/types';

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

/**
 * Calculate Easter Sunday date for a given year using the Anonymous Gregorian algorithm.
 * This is a computus algorithm that determines the date of Easter.
 */
export function calculateEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Check if a date is Easter Sunday.
 */
export function isEasterSunday(date: Date): boolean {
  const year = getYear(date);
  const easter = calculateEasterDate(year);

  return (
    getYear(date) === getYear(easter) &&
    getMonth(date) === getMonth(easter) &&
    getDate(date) === getDate(easter)
  );
}

/**
 * Check if a date is a fixed non-operating day (Christmas or New Year).
 */
export function isFixedNonOperatingDay(date: Date): { isHoliday: boolean; name?: string } {
  const month = getMonth(date) + 1; // getMonth is 0-indexed
  const day = getDate(date);

  // Christmas - December 25
  if (month === 12 && day === 25) {
    return { isHoliday: true, name: 'Christmas' };
  }

  // New Year - January 1
  if (month === 1 && day === 1) {
    return { isHoliday: true, name: 'New Year' };
  }

  return { isHoliday: false };
}

/**
 * Check if a date is a non-operating day (no bus service).
 * Non-operating days: December 25, January 1, Easter Sunday.
 */
export function isNonOperatingDay(date: Date = new Date()): { isNonOperating: boolean; reason?: string } {
  // Check fixed holidays
  const fixedHoliday = isFixedNonOperatingDay(date);
  if (fixedHoliday.isHoliday) {
    return { isNonOperating: true, reason: fixedHoliday.name };
  }

  // Check Easter Sunday
  if (isEasterSunday(date)) {
    return { isNonOperating: true, reason: 'Easter Sunday' };
  }

  return { isNonOperating: false };
}

/**
 * Get the day type for schedule lookup.
 * Returns null if it's a non-operating day.
 */
export function getDayType(date: Date = new Date()): DayType | null {
  // First check if it's a non-operating day
  const nonOperating = isNonOperatingDay(date);
  if (nonOperating.isNonOperating) {
    return null;
  }

  // Then check weekend vs weekday
  return isWeekend(date) ? 'weekend' : 'weekday';
}

/**
 * Get complete service status for a given date.
 * Includes whether service is operating and what type of day it is.
 */
export function getServiceStatus(date: Date = new Date()): ServiceStatus {
  const nonOperating = isNonOperatingDay(date);

  if (nonOperating.isNonOperating) {
    return {
      isOperating: false,
      dayType: null,
      reason: nonOperating.reason,
    };
  }

  const dayType = isWeekend(date) ? 'weekend' : 'weekday';

  return {
    isOperating: true,
    dayType,
  };
}

/**
 * Format a date for display.
 */
export function formatDate(date: Date): string {
  return format(date, 'EEEE, MMMM d, yyyy');
}

/**
 * Get the next operating day after a non-operating day.
 */
export function getNextOperatingDay(fromDate: Date = new Date()): Date {
  const nextDay = new Date(fromDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Keep incrementing until we find an operating day
  while (isNonOperatingDay(nextDay).isNonOperating) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}
