import type { UserSettings, StopId } from '@/types';

const SETTINGS_KEY = 'bus-schedule-settings';
const SETTINGS_VERSION_KEY = 'bus-schedule-settings-version';
const CURRENT_VERSION = 2; // Version 2 = string IDs

export const DEFAULT_SETTINGS: UserSettings = {
  defaultStopId: null,
  favoriteStops: [],
  timeFormat: '24h',
  darkMode: false,
  language: null, // null means use browser default
};

// Migration map from old numeric IDs to new string IDs
const STOP_ID_MIGRATION: Record<number, StopId> = {
  1: 'kazimierza-wielkiego',
  2: 'jerozolimska',
  3: 'plac-pilsudskiego',
  4: 'mila',
  5: 'sadowa-willowa',
  6: 'willowa',
  7: 'ogrodowa',
  8: 'sadowa-ogrodowa',
  9: 'kosciuszki',
  10: 'kosciuszki-liceum',
  11: 'kosciuszki-szkola',
  12: 'tomaszowska-cmentarz',
  13: 'tomaszowska-adar',
  14: 'orzeszkowej',
  15: 'katowicka-aquarium',
  16: 'katowicka-osiedle',
  17: 'katowicka-mrowka',
  18: 'aleksandrowka-1',
  19: 'aleksandrowka-2',
  20: 'zamkowa-wola',
  21: 'mszczonowska',
  22: 'targowa',
  23: 'przemyslowa',
  24: 'zwolinskiego',
  25: '1-maja',
  26: 'ksieze-domki-zalew',
  27: 'ksieze-domki-granica',
  28: 'mickiewicza',
  29: 'kolejowa',
};

interface OldUserSettings {
  defaultStopId: number | null;
  favoriteStops: number[];
  timeFormat: '12h' | '24h';
  darkMode: boolean;
  language: 'en' | 'pl' | 'uk' | null;
}

function isOldSettings(settings: unknown): settings is OldUserSettings {
  if (!settings || typeof settings !== 'object') return false;
  const obj = settings as Record<string, unknown>;

  // If defaultStopId is a number, it's old format
  if (typeof obj.defaultStopId === 'number') return true;

  // If any favoriteStop is a number, it's old format
  if (Array.isArray(obj.favoriteStops) && obj.favoriteStops.some(s => typeof s === 'number')) {
    return true;
  }

  return false;
}

function migrateOldSettings(old: OldUserSettings): UserSettings {
  return {
    defaultStopId: old.defaultStopId !== null
      ? STOP_ID_MIGRATION[old.defaultStopId] ?? null
      : null,
    favoriteStops: old.favoriteStops
      .map(id => STOP_ID_MIGRATION[id])
      .filter((id): id is StopId => id !== undefined),
    timeFormat: old.timeFormat,
    darkMode: old.darkMode,
    language: old.language,
  };
}

export function loadSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    const version = localStorage.getItem(SETTINGS_VERSION_KEY);

    if (stored) {
      const parsed = JSON.parse(stored);

      // Check if we need to migrate from old format
      if (isOldSettings(parsed) || version === null || parseInt(version, 10) < CURRENT_VERSION) {
        if (isOldSettings(parsed)) {
          const migrated = migrateOldSettings(parsed as OldUserSettings);
          // Save migrated settings
          saveSettings(migrated);
          return migrated;
        }
      }

      return { ...DEFAULT_SETTINGS, ...parsed as Partial<UserSettings> };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    localStorage.setItem(SETTINGS_VERSION_KEY, String(CURRENT_VERSION));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
