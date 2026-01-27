import type { UserSettings } from '@/types';

const SETTINGS_KEY = 'bus-schedule-settings';

export const DEFAULT_SETTINGS: UserSettings = {
  defaultStopId: null,
  favoriteStops: [],
  timeFormat: '24h',
  darkMode: false,
};

export function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<UserSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
