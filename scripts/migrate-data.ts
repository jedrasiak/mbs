/**
 * Migration script: Convert old monolithic schedules.json + shapes.json
 * to new relational database-like structure with 7 separate JSON files.
 *
 * Run with: npx ts-node scripts/migrate-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================================
// Types for OLD data structure
// ==========================================

interface OldPlatform {
  lat: number;
  lng: number;
  description?: string;
}

interface OldStop {
  id: number;
  name: string;
  platforms: {
    A?: OldPlatform;
    B?: OldPlatform;
  };
}

interface OldTripStop {
  stopId: number;
  platform: 'A' | 'B';
  time: string;
}

interface OldTrip {
  tripId: string;
  stops: OldTripStop[];
}

interface OldDaySchedule {
  trips: OldTrip[];
}

interface OldDirection {
  id: string;
  name: string;
  schedules: {
    weekday?: OldDaySchedule;
    weekend?: OldDaySchedule;
  };
}

interface OldLine {
  id: number;
  name: string;
  color: string;
  operatingDays?: ('weekday' | 'weekend')[];
  directions: OldDirection[];
}

interface OldNonOperatingDay {
  day: number;
  month: number;
  year: number;
  name: string;
}

interface OldScheduleData {
  metadata: {
    cityName: string;
    timezone: string;
    lastUpdated: string;
    nonOperatingDays: OldNonOperatingDay[];
  };
  stops: OldStop[];
  lines: OldLine[];
}

interface OldShapeSegment {
  description?: string;
  coordinates: [number, number][];
}

interface OldTripShape {
  description?: string;
  segments: string[];
  tripIds: {
    weekday?: string[];
    weekend?: string[];
  };
}

interface OldShapesData {
  metadata: {
    description: string;
    lastUpdated: string;
  };
  segments: Record<string, OldShapeSegment>;
  tripShapes: Record<string, OldTripShape>;
}

// ==========================================
// Types for NEW data structure
// ==========================================

interface NewStop {
  id: string;
  name: string;
}

interface NewPlatform {
  id: string;
  parent_stop: string;
  lat: number;
  lng: number;
  description?: string;
}

interface NewRoute {
  id: string;
  parent_platform_start: string;
  parent_platform_end: string;
  coordinates: [number, number][];
}

interface NewLine {
  id: string;
  name: string;
  color: string;
}

interface NewDirection {
  id: string;
  name: string;
  parent_line: string;
}

interface NewStage {
  platform: string;
  time: string;
}

interface NewTrip {
  id: string;
  name: string;
  parent_direction: string;
  stages: NewStage[];
  daysGroup?: 'weekday' | 'weekend';
  daysInclude?: string[];
  daysExclude?: string[];
}

interface NewSchedule {
  id: string;
  updated_at: string;
  valid_from: string;
  lines: string[];
}

// ==========================================
// Helper functions
// ==========================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Convert old platform 'A'/'B' to new direction format 'south'/'north'
 * Platform A (towards Mrówka/Księże Domki) → south
 * Platform B (towards Kazimierza Wielkiego/Mszczonowska) → north
 */
function platformToDirection(platform: 'A' | 'B'): 'south' | 'north' {
  return platform === 'A' ? 'south' : 'north';
}

/**
 * Generate stop ID from name
 */
function generateStopId(name: string): string {
  return slugify(name);
}

/**
 * Generate platform ID from stop ID and direction
 */
function generatePlatformId(stopId: string, direction: 'south' | 'north'): string {
  return `${stopId}:${direction}`;
}

/**
 * Generate route ID from start and end platform IDs
 */
function generateRouteId(startPlatformId: string, endPlatformId: string): string {
  return `${startPlatformId}--${endPlatformId}`;
}

/**
 * Generate line ID
 */
function generateLineId(lineNumber: number): string {
  return `line${lineNumber}`;
}

/**
 * Generate direction ID
 */
function generateDirectionId(lineId: string, directionSuffix: string): string {
  return `${lineId}:${directionSuffix}`;
}

/**
 * Generate trip ID
 */
function generateTripId(directionId: string, daysGroup: 'weekday' | 'weekend', tripName: string): string {
  return `${directionId}:${daysGroup}:${tripName}`;
}

/**
 * Convert non-operating days to YYYY-MM-DD format
 */
function nonOperatingDayToDate(day: OldNonOperatingDay): string {
  const month = day.month.toString().padStart(2, '0');
  const d = day.day.toString().padStart(2, '0');
  return `${day.year}-${month}-${d}`;
}

// ==========================================
// Migration logic
// ==========================================

function migrate() {
  const dataDir = path.join(__dirname, '../src/assets/data');

  // Read old data
  const oldSchedules: OldScheduleData = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'schedules.json'), 'utf-8')
  );
  const oldShapes: OldShapesData = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'shapes.json'), 'utf-8')
  );

  // Create ID mappings
  const stopIdMap = new Map<number, string>(); // old numeric ID -> new string ID
  const platformIdMap = new Map<string, string>(); // "oldStopId-platform" -> new platform ID

  // ==========================================
  // Generate stops.json
  // ==========================================
  const newStops: NewStop[] = [];

  for (const oldStop of oldSchedules.stops) {
    const newId = generateStopId(oldStop.name);
    stopIdMap.set(oldStop.id, newId);

    newStops.push({
      id: newId,
      name: oldStop.name,
    });
  }

  console.log(`Generated ${newStops.length} stops`);

  // ==========================================
  // Generate platforms.json
  // ==========================================
  const newPlatforms: NewPlatform[] = [];

  for (const oldStop of oldSchedules.stops) {
    const stopId = stopIdMap.get(oldStop.id)!;

    if (oldStop.platforms.A) {
      const platformId = generatePlatformId(stopId, 'south');
      platformIdMap.set(`${oldStop.id}-A`, platformId);

      newPlatforms.push({
        id: platformId,
        parent_stop: stopId,
        lat: oldStop.platforms.A.lat,
        lng: oldStop.platforms.A.lng,
        ...(oldStop.platforms.A.description && { description: oldStop.platforms.A.description }),
      });
    }

    if (oldStop.platforms.B) {
      const platformId = generatePlatformId(stopId, 'north');
      platformIdMap.set(`${oldStop.id}-B`, platformId);

      newPlatforms.push({
        id: platformId,
        parent_stop: stopId,
        lat: oldStop.platforms.B.lat,
        lng: oldStop.platforms.B.lng,
        ...(oldStop.platforms.B.description && { description: oldStop.platforms.B.description }),
      });
    }
  }

  console.log(`Generated ${newPlatforms.length} platforms`);

  // ==========================================
  // Generate routes.json (from shapes.json segments)
  // ==========================================
  const newRoutes: NewRoute[] = [];

  for (const [segmentKey, segment] of Object.entries(oldShapes.segments)) {
    // Skip comment entries
    if (segmentKey.startsWith('comment')) continue;

    // Parse old segment key format: "fromStopId-fromPlatform_toStopId-toPlatform"
    const match = segmentKey.match(/^(\d+)-([AB])_(\d+)-([AB])$/);
    if (!match) {
      console.warn(`Skipping invalid segment key: ${segmentKey}`);
      continue;
    }

    const [, fromStopIdStr, fromPlatform, toStopIdStr, toPlatform] = match;
    const fromStopId = parseInt(fromStopIdStr, 10);
    const toStopId = parseInt(toStopIdStr, 10);

    const startPlatformId = platformIdMap.get(`${fromStopId}-${fromPlatform}`);
    const endPlatformId = platformIdMap.get(`${toStopId}-${toPlatform}`);

    if (!startPlatformId || !endPlatformId) {
      console.warn(`Could not map segment ${segmentKey}: missing platform IDs`);
      continue;
    }

    const routeId = generateRouteId(startPlatformId, endPlatformId);

    newRoutes.push({
      id: routeId,
      parent_platform_start: startPlatformId,
      parent_platform_end: endPlatformId,
      coordinates: segment.coordinates,
    });
  }

  console.log(`Generated ${newRoutes.length} routes`);

  // ==========================================
  // Generate lines.json
  // ==========================================
  const newLines: NewLine[] = [];

  for (const oldLine of oldSchedules.lines) {
    const lineId = generateLineId(oldLine.id);

    newLines.push({
      id: lineId,
      name: oldLine.name,
      color: oldLine.color,
    });
  }

  console.log(`Generated ${newLines.length} lines`);

  // ==========================================
  // Generate directions.json
  // ==========================================
  const newDirections: NewDirection[] = [];
  const directionIdMap = new Map<string, string>(); // old direction ID -> new direction ID

  for (const oldLine of oldSchedules.lines) {
    const lineId = generateLineId(oldLine.id);

    for (const oldDirection of oldLine.directions) {
      // Determine direction suffix based on old direction ID
      let directionSuffix: string;
      if (oldDirection.id.includes('to-mrowka') || oldDirection.id.includes('to-domki')) {
        directionSuffix = 'south';
      } else if (oldDirection.id.includes('from-mrowka') || oldDirection.id.includes('from-domki')) {
        directionSuffix = 'north';
      } else {
        // Fallback: use slugified direction name
        directionSuffix = slugify(oldDirection.name);
      }

      const newDirectionId = generateDirectionId(lineId, directionSuffix);
      directionIdMap.set(oldDirection.id, newDirectionId);

      newDirections.push({
        id: newDirectionId,
        name: oldDirection.name,
        parent_line: lineId,
      });
    }
  }

  console.log(`Generated ${newDirections.length} directions`);

  // ==========================================
  // Generate trips.json
  // ==========================================
  const newTrips: NewTrip[] = [];

  // Collect all non-operating days as daysExclude
  const nonOperatingDates = oldSchedules.metadata.nonOperatingDays.map(nonOperatingDayToDate);

  for (const oldLine of oldSchedules.lines) {
    for (const oldDirection of oldLine.directions) {
      const newDirectionId = directionIdMap.get(oldDirection.id)!;

      // Process weekday trips
      if (oldDirection.schedules.weekday) {
        for (const oldTrip of oldDirection.schedules.weekday.trips) {
          const tripId = generateTripId(newDirectionId, 'weekday', oldTrip.tripId);

          const stages: NewStage[] = oldTrip.stops.map(stop => {
            const platformKey = `${stop.stopId}-${stop.platform}`;
            let platformId = platformIdMap.get(platformKey);

            // Fallback: if requested platform doesn't exist, try the other one
            if (!platformId) {
              const alternatePlatform = stop.platform === 'A' ? 'B' : 'A';
              const altKey = `${stop.stopId}-${alternatePlatform}`;
              platformId = platformIdMap.get(altKey);
              if (platformId) {
                console.warn(`Using alternate platform ${alternatePlatform} for stop ${stop.stopId} (requested ${stop.platform})`);
              }
            }

            if (!platformId) {
              console.warn(`Missing platform mapping for ${platformKey}`);
              return null;
            }
            return {
              platform: platformId,
              time: stop.time,
            };
          }).filter((s): s is NewStage => s !== null);

          newTrips.push({
            id: tripId,
            name: oldTrip.tripId,
            parent_direction: newDirectionId,
            stages,
            daysGroup: 'weekday',
            daysExclude: nonOperatingDates,
          });
        }
      }

      // Process weekend trips
      if (oldDirection.schedules.weekend) {
        for (const oldTrip of oldDirection.schedules.weekend.trips) {
          const tripId = generateTripId(newDirectionId, 'weekend', oldTrip.tripId);

          const stages: NewStage[] = oldTrip.stops.map(stop => {
            const platformKey = `${stop.stopId}-${stop.platform}`;
            let platformId = platformIdMap.get(platformKey);

            // Fallback: if requested platform doesn't exist, try the other one
            if (!platformId) {
              const alternatePlatform = stop.platform === 'A' ? 'B' : 'A';
              const altKey = `${stop.stopId}-${alternatePlatform}`;
              platformId = platformIdMap.get(altKey);
              if (platformId) {
                console.warn(`Using alternate platform ${alternatePlatform} for stop ${stop.stopId} (requested ${stop.platform})`);
              }
            }

            if (!platformId) {
              console.warn(`Missing platform mapping for ${platformKey}`);
              return null;
            }
            return {
              platform: platformId,
              time: stop.time,
            };
          }).filter((s): s is NewStage => s !== null);

          newTrips.push({
            id: tripId,
            name: oldTrip.tripId,
            parent_direction: newDirectionId,
            stages,
            daysGroup: 'weekend',
            daysExclude: nonOperatingDates,
          });
        }
      }
    }
  }

  console.log(`Generated ${newTrips.length} trips`);

  // ==========================================
  // Generate schedules.json
  // ==========================================
  const newSchedules: NewSchedule[] = [
    {
      id: '2025-v1',
      updated_at: oldSchedules.metadata.lastUpdated,
      valid_from: '2025-01-01',
      lines: newLines.map(l => l.id),
    },
  ];

  console.log(`Generated ${newSchedules.length} schedule(s)`);

  // ==========================================
  // Write output files
  // ==========================================

  fs.writeFileSync(
    path.join(dataDir, 'stops.json'),
    JSON.stringify(newStops, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'platforms.json'),
    JSON.stringify(newPlatforms, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'routes.json'),
    JSON.stringify(newRoutes, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'lines.json'),
    JSON.stringify(newLines, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'directions.json'),
    JSON.stringify(newDirections, null, 2)
  );

  fs.writeFileSync(
    path.join(dataDir, 'trips.json'),
    JSON.stringify(newTrips, null, 2)
  );

  // Rename old schedules.json first, then write new one
  const oldSchedulesPath = path.join(dataDir, 'schedules.json');
  const backupSchedulesPath = path.join(dataDir, 'schedules.old.json');

  // Backup old files
  if (fs.existsSync(oldSchedulesPath)) {
    fs.renameSync(oldSchedulesPath, backupSchedulesPath);
    console.log('Backed up old schedules.json to schedules.old.json');
  }

  fs.writeFileSync(
    path.join(dataDir, 'schedules.json'),
    JSON.stringify(newSchedules, null, 2)
  );

  // Backup shapes.json
  const oldShapesPath = path.join(dataDir, 'shapes.json');
  const backupShapesPath = path.join(dataDir, 'shapes.old.json');
  if (fs.existsSync(oldShapesPath)) {
    fs.renameSync(oldShapesPath, backupShapesPath);
    console.log('Backed up old shapes.json to shapes.old.json');
  }

  // Generate and write ID migration map for user settings
  const stopIdMigration: Record<number, string> = {};
  for (const [oldId, newId] of stopIdMap) {
    stopIdMigration[oldId] = newId;
  }

  fs.writeFileSync(
    path.join(dataDir, 'stop-id-migration.json'),
    JSON.stringify(stopIdMigration, null, 2)
  );
  console.log('Generated stop-id-migration.json for user settings migration');

  console.log('\nMigration complete!');
  console.log('New files created:');
  console.log('  - stops.json');
  console.log('  - platforms.json');
  console.log('  - routes.json');
  console.log('  - lines.json');
  console.log('  - directions.json');
  console.log('  - trips.json');
  console.log('  - schedules.json');
  console.log('  - stop-id-migration.json');
  console.log('\nOld files backed up:');
  console.log('  - schedules.old.json');
  console.log('  - shapes.old.json');
}

// Run migration
migrate();
