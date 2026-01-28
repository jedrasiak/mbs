# Municipal Bus Schedule PWA - Technical Specification

## Project Overview

Build a Progressive Web App for tracking municipal bus schedules. Two bus lines, multiple stops, optimized for daily commuters. Focus: speed, offline capability, simplicity.

---

## Tech Stack

### Core
- React 18+ with Vite
- TypeScript (strict mode)
- Material UI (MUI) v5 with Material Design 3
- React Router v6 for navigation

### PWA
- Workbox 7+ for service worker
- vite-plugin-pwa for build integration

### Map
- Leaflet.js with react-leaflet
- OpenStreetMap tiles (free, no API key needed)

### State Management
- React Context API (sufficient for this scale)
- localStorage for user preferences

### Utilities
- date-fns for time calculations
- zustand (optional, lightweight alternative to Context)

---

## Project Structure
```
bus-schedule-pwa/
├── public/
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   └── manifest.json
├── src/
│   ├── assets/
│   │   └── data/
│   │       └── schedules.json
│   ├── components/
│   │   ├── common/
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Header.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── home/
│   │   │   ├── StopSelector.tsx
│   │   │   ├── CurrentTime.tsx
│   │   │   ├── DepartureCard.tsx
│   │   │   └── DepartureList.tsx
│   │   ├── schedule/
│   │   │   ├── LineTabs.tsx
│   │   │   ├── DirectionToggle.tsx
│   │   │   └── TimeTable.tsx
│   │   ├── map/
│   │   │   ├── BusMap.tsx
│   │   │   ├── StopMarker.tsx
│   │   │   └── RouteLayer.tsx
│   │   └── settings/
│   │       └── SettingsForm.tsx
│   ├── contexts/
│   │   ├── ScheduleContext.tsx
│   │   └── SettingsContext.tsx
│   ├── hooks/
│   │   ├── useNextDepartures.ts
│   │   ├── useCurrentTime.ts
│   │   └── useGeolocation.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── SchedulePage.tsx
│   │   ├── MapPage.tsx
│   │   └── SettingsPage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── timeCalculations.ts
│   │   ├── scheduleParser.ts
│   │   └── storage.ts
│   ├── theme/
│   │   └── muiTheme.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## Data Schema

### schedules.json
```typescript
interface BusSchedule {
  lines: Line[];
  stops: Stop[];
  schedules: {
    weekday: Schedule;
    weekend: Schedule;
  };
}

interface Line {
  id: number;
  name: string;
  color: string; // hex color
  route: number[]; // array of stop IDs in order
}

interface Stop {
  id: number;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface Schedule {
  [lineId: string]: {
    [stopId: string]: string[]; // array of departure times "HH:MM"
  };
}
```

### Example Data
```json
{
  "lines": [
    {
      "id": 1,
      "name": "Line 1",
      "color": "#1976D2",
      "route": [1, 2, 3, 4, 5]
    },
    {
      "id": 2,
      "name": "Line 2",
      "color": "#388E3C",
      "route": [1, 6, 7, 8, 3]
    }
  ],
  "stops": [
    {
      "id": 1,
      "name": "Main Station",
      "coordinates": { "lat": 50.0000, "lng": 19.0000 }
    },
    {
      "id": 2,
      "name": "City Center",
      "coordinates": { "lat": 50.0010, "lng": 19.0010 }
    }
  ],
  "schedules": {
    "weekday": {
      "1": {
        "1": ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"],
        "2": ["06:15", "07:15", "08:15", "09:15", "10:15", "11:15", "12:15", "13:15", "14:15", "15:15", "16:15", "17:15", "18:15", "19:15", "20:15"]
      },
      "2": {
        "1": ["06:30", "07:30", "08:30", "09:30", "10:30", "11:30", "12:30", "13:30", "14:30", "15:30", "16:30", "17:30", "18:30", "19:30", "20:30"]
      }
    },
    "weekend": {
      "1": {
        "1": ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"]
      },
      "2": {
        "1": ["08:30", "10:30", "12:30", "14:30", "16:30", "18:30", "20:30"]
      }
    }
  }
}
```

---

## TypeScript Types

### src/types/index.ts
```typescript
export interface Line {
  id: number;
  name: string;
  color: string;
  route: number[];
}

export interface Stop {
  id: number;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Schedule {
  [lineId: string]: {
    [stopId: string]: string[];
  };
}

export interface BusSchedule {
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
  stopId: number;
  stopName: string;
  departureTime: string; // "HH:MM"
  minutesUntil: number;
  destination: string;
}

export interface UserSettings {
  defaultStopId: number | null;
  favoriteStops: number[];
  timeFormat: '12h' | '24h';
  notificationsEnabled: boolean;
}
```

---

## Core Components Specifications

### 1. HomePage Component

**File:** `src/pages/HomePage.tsx`

**Requirements:**
- Display stop selector at top (MUI Select component)
- Show current time updating every minute
- List next 3-4 departures from selected stop
- Auto-select default stop from settings
- Pull-to-refresh functionality
- Show "No more buses today" if no upcoming departures

**Logic:**
- Use `useNextDepartures()` hook to calculate upcoming buses
- Filter departures by selected stop
- Sort by time, show only future departures
- Update countdown every minute

---

### 2. SchedulePage Component

**File:** `src/pages/SchedulePage.tsx`

**Requirements:**
- Material tabs for Line 1 / Line 2
- Direction toggle (if bidirectional routes exist)
- Day type toggle: Weekday / Weekend
- Scrollable time table with all departures
- Highlight current time window
- Gray out past times

**Logic:**
- Load schedule based on selected line, direction, day type
- Calculate current time and highlight appropriate row
- Make table responsive with horizontal scroll if needed

---

### 3. MapPage Component

**File:** `src/pages/MapPage.tsx`

**Requirements:**
- Full-screen Leaflet map
- Show all bus stops as markers (colored by lines that serve them)
- Draw route lines for both bus lines
- Click marker to show bottom sheet with:
  - Stop name
  - Next 3 departures
  - "View full schedule" button
- Floating action button for user location
- Center map on city by default

**Map Config:**
- Use OpenStreetMap tiles
- Default zoom level: 13-14
- Marker cluster if many stops (unlikely with small city)

---

### 4. SettingsPage Component

**File:** `src/pages/SettingsPage.tsx`

**Requirements:**
- Form with MUI components:
  - Default stop selector (Autocomplete)
  - Favorite stops (Checkbox list, max 3)
  - Time format toggle (Switch: 12h/24h)
  - Notifications toggle (Switch)
  - App version display
- Save button persists to localStorage
- Show success toast on save

---

## Custom Hooks

### useNextDepartures Hook

**File:** `src/hooks/useNextDepartures.ts`
```typescript
interface UseNextDeparturesParams {
  stopId: number | null;
  limit?: number; // default 4
}

interface UseNextDeparturesReturn {
  departures: Departure[];
  loading: boolean;
  error: string | null;
}

// Calculates next N departures from given stop
// Filters by current time
// Returns sorted array with minutesUntil calculated
```

### useCurrentTime Hook

**File:** `src/hooks/useCurrentTime.ts`
```typescript
// Returns current time, updates every minute
// Returns: Date object
// Used to trigger departure recalculation
```

---

## Utilities

### timeCalculations.ts
```typescript
// Functions:
// - getMinutesUntil(departureTime: string): number
// - isWeekend(date: Date): boolean
// - formatTime(time: string, format: '12h' | '24h'): string
// - isPastTime(time: string, now: Date): boolean
// - getNextDepartures(schedule, stopId, currentTime, limit): Departure[]
```

### storage.ts
```typescript
// Functions:
// - saveSettings(settings: UserSettings): void
// - loadSettings(): UserSettings | null
// - clearSettings(): void
```

---

## PWA Configuration

### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'Bus Schedule Helper',
        short_name: 'Bus Helper',
        description: 'Municipal bus schedule assistant',
        theme_color: '#1976D2',
        background_color: '#FFFFFF',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ]
});
```

---

## MUI Theme Configuration

### src/theme/muiTheme.ts
```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1976D2',
    },
    secondary: {
      main: '#388E3C',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F5F5',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: 'Roboto, sans-serif',
    h1: {
      fontSize: '24px',
      fontWeight: 500,
    },
    h2: {
      fontSize: '20px',
      fontWeight: 500,
    },
    body1: {
      fontSize: '16px',
    },
    body2: {
      fontSize: '14px',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
```

---

## Routing Configuration

### src/App.tsx
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Routes:
// / -> HomePage
// /schedule -> SchedulePage
// /map -> MapPage
// /settings -> SettingsPage

// Each page includes BottomNav component
// Use Layout wrapper component for consistent structure
```

---

## Development Requirements

### 1. Responsive Design
- Mobile-first approach
- Breakpoints: 320px (mobile), 768px (tablet)
- Touch targets minimum 48x48px
- High contrast for outdoor visibility

### 2. Performance
- Initial load < 2 seconds
- Lazy load map components
- Memoize expensive calculations
- Virtual scrolling for long time tables (react-window if needed)

### 3. Accessibility
- Semantic HTML
- ARIA labels for icons
- Keyboard navigation support
- Screen reader friendly

### 4. Testing
- Unit tests for utility functions (Vitest)
- Component tests for critical paths
- PWA lighthouse score > 90

---

## Installation Commands
```bash
npm create vite@latest bus-schedule-pwa -- --template react-ts
cd bus-schedule-pwa
npm install @mui/material @emotion/react @emotion/styled
npm install react-router-dom
npm install leaflet react-leaflet
npm install @types/leaflet
npm install date-fns
npm install workbox-window
npm install vite-plugin-pwa -D
```

---

## Deployment

- Build: `npm run build`
- Preview: `npm run preview`
- Deploy to: Cloudflare Pages, Netlify, or Vercel
- Ensure HTTPS enabled
- Test PWA installation on mobile devices

---

## Future Enhancements (Optional)

- Push notifications 15 min before favorite bus
- Real-time GPS tracking (if API available)
- Trip planner (find route between two stops)
- Offline schedule updates via background sync
- Analytics for most-used stops

---

## Design Specifications

### Color Scheme
- Primary: Blue `#1976D2` for Line 1
- Secondary: Green `#388E3C` for Line 2
- Background: White `#FFFFFF`
- Surface: Light gray `#F5F5F5`
- Text: Dark gray `#212121`
- Accent: Orange `#FF9800` for active/highlighted items

### Typography
- Headings: Roboto Medium, 20-24px
- Body: Roboto Regular, 16px
- Times: Roboto Bold, 24px
- Helper text: Roboto Regular, 14px

### Key User Flows
1. Quick check: Open app → see next bus (0 taps)
2. Different stop: Tap dropdown → select stop (2 taps)
3. Plan ahead: Tap Schedule → select line/time (2-3 taps)
4. Find stop: Tap Map → tap marker → see times (2 taps)

---

## Implementation Notes

- Prioritize HomePage implementation first (core use case)
- Use sample data initially, make it easy to replace with real schedule
- Ensure offline functionality works from first load
- Keep bundle size small (< 500KB initial load)
- Comment complex time calculation logic
- Add console warnings for invalid schedule data
- Make coordinates configurable (city center) for easy adaptation to other cities

---

**Version:** 1.0  
**Last Updated:** January 2026  
**Author:** Lukasz Jedrasiak