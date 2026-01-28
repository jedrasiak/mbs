# Technical Specification - Changes & Clarifications

## Document Purpose
This document describes necessary changes to the original technical specification based on the actual bus schedule data structure and real-world operational requirements.

---

## Major Changes Required

### 1. Bidirectional Schedules Are Not Symmetric

**Original Assumption:** The specification assumed bus lines simply reverse their route, visiting the same stops in opposite order.

**Reality:** Each direction of a line has its own distinct schedule and may follow different paths:
- Some stops are only served in one direction
- Detour routes exist where buses take extended paths through additional neighborhoods
- Stop sequences differ between directions beyond simple reversal

**Required Change:** 
- Lines must have explicit direction definitions, each with its own stop sequence
- Schedule data must be keyed by direction ID, not just line ID
- Each direction needs a name (destination) for UI display
- Stop lists for each direction must be stored independently

---

### 2. Schedule Keys Must Include Direction Information

**Original Assumption:** Schedules could be organized by line number, with the same stop having the same schedule regardless of direction.

**Reality:** The same physical stop has completely different departure times depending on which direction the bus is traveling.

**Required Change:**
- Schedule keys must combine line ID and direction (e.g., "1-to-mrowka" instead of just "1")
- When looking up departure times, you must specify both the stop and the direction
- UI components must track and display which direction is being shown

---

### 3. Sparse Schedules and Optional Stops

**Original Assumption:** All buses on a line stop at all stops on that line.

**Reality:** Some stops are only served by specific trips:
- Line 1 has detour routes that add 6 extra stops, but only a few buses per day take this route
- Most trips skip these detour stops entirely
- This creates "sparse" schedules where many stop/time combinations are empty

**Required Change:**
- Schedule tables must handle missing data gracefully (not all stops have times)
- UI must clearly indicate when a stop is not served ("—" or empty cell)
- Map view should show which stops are served by which direction
- Departure calculations must skip stops that aren't served on a given route

---

### 4. Holiday and Non-Operating Days

**Original Assumption:** Not explicitly addressed in original spec.

**Reality:** The bus system does not operate on three specific days each year:
- December 25 (Christmas)
- January 1 (New Year's Day)
- Easter Sunday (first day of Easter, date varies yearly)

**Required Change:**
- Add holiday detection logic to check current date against non-operating days
- Easter Sunday requires either a calculation algorithm or a lookup table (updated yearly)
- When a non-operating day is detected, show clear messaging instead of schedules
- Disable all schedule-related functionality on these days
- Consider showing next operating day's schedule as alternative

---

### 5. Line-Specific Operating Days

**Original Assumption:** All lines operate on the same schedule (weekdays and weekends).

**Reality:** Line 2 only operates Monday through Friday. It does not run on weekends at all.

**Required Change:**
- Lines need an optional "operating days" restriction property
- Before showing any line data, check if that line operates on the current day
- On weekends, Line 2 should be:
  - Hidden or grayed out in selectors
  - Not shown on maps (or marked as "not operating")
  - Display "This line only operates on weekdays" message
- Filter available lines based on current day before showing any departures

---

### 6. Day Type Detection Complexity

**Original Assumption:** Simple check: Saturday/Sunday = weekend, all others = weekday.

**Reality:** Day type determination has multiple steps:
1. First check if it's a non-operating holiday (no service at all)
2. Then check if it's Saturday or Sunday (weekend schedule)
3. Otherwise use weekday schedule
4. Also verify the specific line operates on that day type

**Required Change:**
- Implement priority-based day type checking
- Non-operating days override everything
- Weekend vs weekday distinction comes second
- Per-line restrictions checked last
- Handle case where no service is available with appropriate UI

---

### 7. Stop Serving Logic

**Original Assumption:** If a stop exists, it's served by all lines that pass through that area.

**Reality:** 
- Some stops are only served by one line
- Some stops are only served in one direction of a line
- Some stops are only served by certain trips (detour routes)

**Required Change:**
- When showing departures at a stop, check each line/direction combination
- Map markers should indicate which lines serve each stop
- Stop selector might need filtering based on selected line
- "No departures" at a stop might mean the selected line doesn't serve it, not that there are no buses today

---

### 8. Direction Naming and Destination Display

**Original Assumption:** Simple "outbound/inbound" or "direction A/B" naming would suffice.

**Reality:** Directions are best identified by their final destination:
- "PSB Mrówka" (destination)
- "Os. Zamkowa Wola" (destination)
- "Księże Domki" (destination)
- "Mszczonowska" (destination)

**Required Change:**
- Each direction should have a user-friendly destination name
- Display format: "Line 1 to PSB Mrówka" instead of "Line 1 Direction B"
- Schedule tabs should show destinations, not generic "Direction 1/2"
- Helps users instantly identify which bus they need

---

## Updated Data Relationships

### Lines to Directions
- One line has exactly two directions
- Each direction is a complete entity with its own stop list and schedule
- Directions have unique IDs and destination names

### Directions to Stops
- A direction defines an ordered list of stops
- The same stop can appear in multiple directions
- Stop order matters (it's the route sequence)

### Schedules to Directions
- Schedules are organized by day type (weekday/weekend)
- Within day type, organized by direction ID
- Within direction, organized by stop ID
- Each stop/direction combination has an array of departure times
- Some combinations have empty arrays (stop not served)

### Lines to Operating Days
- Most lines operate every day (weekdays and weekends)
- Some lines only operate on specific day types
- This is a property of the line, not the schedule

---

## UI Component Impact

### HomePage - Next Departures
- Must filter lines by operating status before showing anything
- Must check if selected stop is served by available lines
- Must handle multiple directions of same line showing different times
- Must show destination (direction name) not just line number

### SchedulePage - Full Timetable
- Must allow selection of specific direction, not just line
- Must display destination name in UI
- Must handle empty cells where stops aren't served
- Must show different tabs for weekday vs weekend
- Must hide/disable weekend tab for weekday-only lines

### MapPage - Stop Markers
- Must filter visible stops based on selected line/direction
- Must show which lines serve each stop when marker is clicked
- Must handle stops that are only served in one direction
- Route polylines should follow actual stop sequence for each direction

### SettingsPage
- No major changes needed
- Consider adding "show all stops" vs "show stops for my favorite lines" toggle

---

## New Utility Functions Needed

1. **isNonOperatingDay(date)** - Check if buses run on this date
2. **isLineOperating(line, date)** - Check if specific line runs on this date  
3. **getDayType(date)** - Return 'weekday', 'weekend', or null for non-operating
4. **getDirectionSchedule(lineId, directionId, dayType)** - Get schedule for specific direction
5. **getStopDepartures(stopId, directionId, dayType)** - Get times for stop in direction
6. **isStopServedBy(stopId, lineId, directionId)** - Check if stop is on route
7. **calculateEasterDate(year)** - Determine Easter Sunday for given year

---

## Testing Scenarios to Cover

1. **Non-operating day (Dec 25, Jan 1, Easter)**
   - No schedules should display
   - Clear "No service today" message
   - Show next available service date

2. **Weekend day**
   - Line 2 should not appear anywhere
   - Line 1 should show weekend schedule
   - Correct day type detected

3. **Weekday**
   - All lines available
   - Correct schedules loaded
   - Sparse stops show empty/dash

4. **Stop not served by selected line**
   - Clear messaging
   - Don't show "no departures" (confusing)
   - Show "This stop is not served by Line X"

5. **Detour route stops**
   - Show limited departure times (3-5 per day)
   - Don't show as unavailable
   - Clear indication of reduced service

6. **Direction selection**
   - Changing direction changes entire schedule
   - Correct destination name displayed
   - Map updates to show correct route

---

## Data Maintenance Considerations

### Annual Updates Required
- Add next year's Easter date to lookup table (or implement calculation)
- Verify non-operating days haven't changed
- Update schedule data if routes/times change

### When Routes Change
- Update direction stop sequences
- Update schedule times
- Update line metadata (colors, names)
- Increment version number

### Coordinate Updates
- Replace placeholder coordinates with real GPS data
- Test map centering and zoom levels
- Verify route polylines connect correctly

---

## Implementation Priority

### Phase 1 (Core Functionality)
1. Implement direction-based schedule structure
2. Add non-operating day detection
3. Add line operating day restrictions
4. Update departure calculation logic

### Phase 2 (UI Polish)
1. Direction selectors with destination names
2. Proper messaging for non-operating scenarios
3. Map filtering by line/direction
4. Sparse schedule display (empty cells)

### Phase 3 (Enhancement)
1. Easter date calculation algorithm
2. Show next available service on holidays
3. Route polyline animations
4. Schedule version checking

---

**Summary:** The main conceptual shift is from treating lines as simple bidirectional routes to understanding them as pairs of distinct directional services with complex operating rules and sparse stop coverage. The application must be direction-aware throughout, and must handle multiple layers of service availability checking (holidays, day types, line restrictions, direction-specific stops).

**Version:** 1.0  
**Last Updated:** January 2026  
**Author:** Lukasz Jedrasiak