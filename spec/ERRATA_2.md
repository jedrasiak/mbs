# Specification Change: Stop Platform Coordinates

## The Real Structure

**Key Insight:** A physical bus stop location has exactly TWO platforms (one on each side of the street), regardless of how many lines serve it.

**Example:**
- "Plac Piłsudskiego" has Platform A (north side) and Platform B (south side)
- Line 1 towards Mrówka uses Platform A
- Line 1 towards Zamkowa Wola uses Platform B
- Line 2 towards Domki uses Platform A (same platform as Line 1 to Mrówka!)
- Line 2 towards Mszczonowska uses Platform B

So we need 2 coordinates per stop, not 2×number_of_lines.

---

## Updated Data Structure

### Stop Schema
```json
{
  "id": 3,
  "name": "Plac Piłsudskiego",
  "platforms": {
    "A": {
      "lat": 51.7520,
      "lng": 20.5020,
      "description": "North side, towards Mrówka/Domki"
    },
    "B": {
      "lat": 51.7522,
      "lng": 20.5018,
      "description": "South side, towards Zamkowa Wola/Mszczonowska"
    }
  }
}
```

### Line Direction Schema (Updated)

Instead of just listing stop IDs, each stop entry specifies which platform to use:
```json
{
  "id": 1,
  "name": "Linia 1",
  "color": "#1976D2",
  "directions": [
    {
      "id": "1-to-mrowka",
      "name": "PSB Mrówka",
      "stops": [
        { "stopId": 1, "platform": "A" },
        { "stopId": 2, "platform": "A" },
        { "stopId": 3, "platform": "A" }
      ]
    },
    {
      "id": "1-from-mrowka",
      "name": "Zamkowa Wola",
      "stops": [
        { "stopId": 11, "platform": "B" },
        { "stopId": 10, "platform": "B" },
        { "stopId": 3, "platform": "B" }
      ]
    }
  ]
}
```

---

## Why This Structure Works

### 1. Reflects Physical Reality
- One stop name = one location
- Two platforms per location (opposite sides of street)
- Multiple lines share platforms when going same direction

### 2. Data Efficiency
- Only 2 coordinates per stop
- No redundant coordinate duplication
- Clear mapping from line-direction to physical location

### 3. Maintenance Simplicity
- Update coordinates once per stop (not per line-direction)
- Easy to verify all lines use correct platforms
- Clear which platform serves which geographic direction

---

## Alternative Naming Conventions

Choose the naming that makes most sense for your city:

### Option A: A/B (Generic)
```json
"platforms": {
  "A": { "lat": ..., "lng": ... },
  "B": { "lat": ..., "lng": ... }
}
```
**Pros:** Simple, no assumptions about geography  
**Cons:** Need to remember which is which

### Option B: Cardinal Directions
```json
"platforms": {
  "north": { "lat": ..., "lng": ... },
  "south": { "lat": ..., "lng": ... }
}
```
**Pros:** Intuitive for straight-line routes  
**Cons:** Doesn't work if route curves or goes east-west

### Option C: Numbered
```json
"platforms": {
  "1": { "lat": ..., "lng": ... },
  "2": { "lat": ..., "lng": ... }
}
```
**Pros:** Neutral numbering  
**Cons:** Same as A/B but numbers

### Option D: Directional Description
```json
"platforms": {
  "eastbound": { "lat": ..., "lng": ... },
  "westbound": { "lat": ..., "lng": ... }
}
```
**Pros:** Descriptive  
**Cons:** Must match actual geography

**Recommendation:** Use **Option A (A/B)** as it's simple and universal. Then add description field for clarity.

---

## Complete TypeScript Types
```typescript
interface Platform {
  lat: number;
  lng: number;
  description?: string; // Optional: "North side", "Towards city center", etc.
}

interface Stop {
  id: number;
  name: string;
  platforms: {
    A: Platform;
    B: Platform;
  };
}

interface StopInRoute {
  stopId: number;
  platform: 'A' | 'B';
}

interface Direction {
  id: string;
  name: string;
  stops: StopInRoute[];
}

interface Line {
  id: number;
  name: string;
  color: string;
  operatingDays?: string[];
  directions: Direction[];
}
```

---

## How to Assign Platform Letters

### Method 1: Based on First Line Direction

1. Look at Line 1's "to-mrowka" direction
2. The platforms it uses become "A"
3. The opposite platforms become "B"
4. All other lines follow the same assignment

### Method 2: Based on Geography

1. Stand at the stop location
2. Platform serving buses going north/east = "A"
3. Platform serving buses going south/west = "B"
4. Consistent across all stops

### Method 3: Based on Street Side

1. Platform on right side of street (facing north) = "A"
2. Platform on left side = "B"
3. Depends on street orientation

**Recommendation:** Use Method 1 (based on Line 1) for consistency and simplicity.

---

## Implementation Logic Changes

### Getting Stop Coordinates for Direction
```typescript
function getStopCoordinates(stopId: number, directionId: string): Coordinates | null {
  // Find the line and direction
  const line = lines.find(l => 
    l.directions.some(d => d.id === directionId)
  );
  const direction = line?.directions.find(d => d.id === directionId);
  
  // Find this stop in the direction's route
  const stopInRoute = direction?.stops.find(s => s.stopId === stopId);
  if (!stopInRoute) return null;
  
  // Get the stop data
  const stop = stops.find(s => s.id === stopId);
  if (!stop) return null;
  
  // Return coordinates for the specified platform
  return stop.platforms[stopInRoute.platform];
}
```

### Drawing Route Polyline
```typescript
function drawRoute(directionId: string) {
  const line = lines.find(l => 
    l.directions.some(d => d.id === directionId)
  );
  const direction = line?.directions.find(d => d.id === directionId);
  
  const coordinates = direction.stops.map(stopInRoute => {
    const stop = stops.find(s => s.id === stopInRoute.stopId);
    return stop.platforms[stopInRoute.platform];
  });
  
  drawPolyline(coordinates, { color: line.color });
}
```

### Placing Map Markers
```typescript
function placeMarkers() {
  // Track which platforms we've already placed markers for
  const placedMarkers = new Set<string>();
  
  lines.forEach(line => {
    line.directions.forEach(direction => {
      direction.stops.forEach(stopInRoute => {
        const stop = stops.find(s => s.id === stopInRoute.stopId);
        const platform = stopInRoute.platform;
        const markerId = `${stop.id}-${platform}`;
        
        // Only place one marker per physical platform
        if (placedMarkers.has(markerId)) {
          return; // Already placed
        }
        
        const coords = stop.platforms[platform];
        
        // Find all line-directions that use this platform
        const servingDirections = getAllDirectionsServingPlatform(
          stop.id, 
          platform
        );
        
        createMarker({
          position: coords,
          stopName: stop.name,
          servingDirections: servingDirections,
          onClick: () => showStopInfo(stop.id, platform)
        });
        
        placedMarkers.add(markerId);
      });
    });
  });
}

function getAllDirectionsServingPlatform(
  stopId: number, 
  platform: 'A' | 'B'
): DirectionInfo[] {
  const result = [];
  
  lines.forEach(line => {
    line.directions.forEach(direction => {
      const hasStop = direction.stops.some(
        s => s.stopId === stopId && s.platform === platform
      );
      
      if (hasStop) {
        result.push({
          lineId: line.id,
          lineName: line.name,
          lineColor: line.color,
          directionId: direction.id,
          directionName: direction.name
        });
      }
    });
  });
  
  return result;
}
```

### Stop Info Panel

When user clicks a marker:
```typescript
function showStopInfo(stopId: number, platform: 'A' | 'B') {
  const stop = stops.find(s => s.id === stopId);
  const servingDirections = getAllDirectionsServingPlatform(stopId, platform);
  
  // Get next departures from ALL directions serving this platform
  const allDepartures = [];
  
  servingDirections.forEach(dirInfo => {
    const departures = getNextDeparturesForDirection(
      stopId,
      dirInfo.directionId,
      3
    );
    
    allDepartures.push(...departures);
  });
  
  // Sort by time
  allDepartures.sort((a, b) => a.minutesUntil - b.minutesUntil);
  
  displayPanel({
    stopName: stop.name,
    platform: platform,
    platformDescription: stop.platforms[platform].description,
    directions: servingDirections,
    nextBuses: allDepartures.slice(0, 5)
  });
}
```

---

## Schedule Data (No Change)

Schedules remain keyed by direction ID and stop ID:
```json
"schedules": {
  "weekday": {
    "1-to-mrowka": {
      "3": ["08:00", "09:00", "10:00"]
    },
    "1-from-mrowka": {
      "3": ["08:15", "09:15", "10:15"]
    }
  }
}
```

The platform information is only used for:
- Map coordinates
- Route drawing
- Marker placement

The schedule system doesn't need to know about platforms.

---

## Data Collection Checklist

For each stop:

1. **Identify the stop location** - Find on Google Maps
2. **Locate Platform A** - Usually the first platform you encounter
3. **Record Platform A coordinates** - Right-click → "What's here?"
4. **Locate Platform B** - Cross the street, find opposite platform
5. **Record Platform B coordinates**
6. **Add description** - Note which direction each platform serves
7. **Verify with Street View** - Confirm physical bus stop signs exist

For each line direction:

1. **List stops in order** - From schedule PDFs
2. **Assign platform letters** - Based on geographic direction
3. **Verify consistency** - All northbound buses use same platforms
4. **Check detours** - Detour stops still follow A/B pattern

---

## Example: Complete Stop Entry
```json
{
  "id": 3,
  "name": "Plac Piłsudskiego",
  "platforms": {
    "A": {
      "lat": 51.7520,
      "lng": 20.5020,
      "description": "North side of square - towards Mrówka/Domki"
    },
    "B": {
      "lat": 51.7522,
      "lng": 20.5018,
      "description": "South side of square - towards Zamkowa Wola/Mszczonowska"
    }
  }
}
```

---

## Example: Stop Served by Both Lines
```json
{
  "id": 1,
  "name": "ul. Kazimierza Wielkiego",
  "platforms": {
    "A": {
      "lat": 51.7500,
      "lng": 20.5000,
      "description": "Platform serving Line 1 to Mrówka, Line 2 to Domki"
    },
    "B": {
      "lat": 51.7501,
      "lng": 20.4999,
      "description": "Platform serving Line 1 to Zamkowa Wola, Line 2 to Mszczonowska"
    }
  }
}
```

Then in line definitions:
```json
{
  "id": 1,
  "directions": [{
    "id": "1-to-mrowka",
    "stops": [
      { "stopId": 1, "platform": "A" }
    ]
  }]
},
{
  "id": 2,
  "directions": [{
    "id": "2-to-domki",
    "stops": [
      { "stopId": 1, "platform": "A" }  // Same platform!
    ]
  }]
}
```

---

## Migration from Old Structure

If you already have single coordinates per stop:

1. Duplicate the coordinate into both A and B initially
2. Use Google Maps to find the actual opposite platform
3. Update B coordinate with correct location
4. Add platform assignments to line directions
5. Test that routes draw correctly
6. Verify all markers appear at correct locations

---

## Summary

- Each stop has exactly 2 platforms (A and B)
- Each platform has its own GPS coordinates
- Line directions specify which platform they use at each stop
- Multiple lines can share the same platform when going the same direction
- Map markers placed at physical platform locations
- One marker can show multiple lines/directions that share that platform

This structure is efficient, maintainable, and reflects the physical reality of bus systems.

**Version:** 1.1  
**Last Updated:** January 2026  
**Author:** Lukasz