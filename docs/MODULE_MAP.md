# ES Module Map - Travel Planner Application

## Overview
This document maps all ES modules extracted from `script.js` as part of the Phase 1 and Phase 2 modularization effort.

**Total Modules Created:** 6
**Lines Extracted:** ~2,700 (36% of original script.js)
**Functions Modularized:** 50+

---

## Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         index.html                          │
│                 <script type="module" src="src/main.js">    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   main.js      │  ← Entry point
                    │  (wiring)      │
                    └───┬────────────┘
                        │
        ┌───────────────┼───────────────┬──────────────┐
        │               │               │              │
        ▼               ▼               ▼              ▼
  ┌─────────┐    ┌──────────┐   ┌──────────┐  ┌──────────────┐
  │ data.js │    │combo.js  │   │  ui.js   │  │ui-templates.js│
  │ (utils) │    │(calcs)   │   │ (core)   │  │   (HTML)     │
  └────┬────┘    └─────┬────┘   └────┬─────┘  └──────┬───────┘
       │               │             │               │
       │         ┌─────┴─────────────┴───────────────┘
       │         │
       ▼         ▼
  ┌──────────────────┐
  │  scheduler.js    │
  │  (geographic)    │
  └──────────────────┘
            │
            ▼
  ┌──────────────────┐
  │destinations.js   │
  │  (filtering)     │
  └──────────────────┘
```

---

## Phase 1 Modules (Completed)

### 1. data.js (143 lines, 6 exports)
**Purpose:** Core utilities and constants

**Dependencies:** None (self-contained)

**Exports:**
- `COLOR_PALETTE` - 8 colors for UI elements
- `calculateDistance(point1, point2)` - Haversine distance calculation
- `getCityCoordinates(cityId)` - Get lat/lng for 22 cities
- `translateCategory(cat)` - Category translations (Greek)
- `getActivityIcon(category)` - FontAwesome icon mapping
- `getActivityEmoji(category)` - Emoji mapping for categories

**Location:** `src/data.js`

---

### 2. scheduler.js (238 lines, 8 exports)
**Purpose:** Effort-based geographic scheduling algorithm

**Dependencies:**
- Imports: `calculateDistance`, `COLOR_PALETTE` from `data.js`
- Global: `window.state`

**Exports:**
- `distributeGroupsToDays(groups, totalDays)` - Main scheduling function
- `calculateGroupEffort(group)` - Calculate effort score for activity group
- `getIntensityMultiplier(category)` - Get category intensity (1.0-2.0)
- `findBestDayForGroup(days, group, totalDays)` - Find optimal day assignment
- `calculateDayCenter(day)` - Calculate geographic center of day
- `balanceDaysIfNeeded(days)` - Balance workload across days
- `getDayColor(dayNumber)` - Get color for day visualization
- `getGroupColor(index)` - Get color for activity group

**Key Algorithm:** DBSCAN clustering + effort-based distribution (NO hard activity caps)

**Location:** `src/scheduler.js`

---

### 3. combo.js (290 lines, 4 exports)
**Purpose:** Smart combo and family pricing calculations

**Dependencies:**
- Global: `window.state`, `showToast`, `updateActivitiesTotal`

**Exports:**
- `calculateFamilyCost(prices)` - Calculate total cost for family
- `calculateSmartCombos()` - Find optimal activity combos
- `simulateComboCalculation()` - Simulate combo discounts
- `applyComboDiscount(discount)` - Apply discount to activities

**Pricing Logic:**
- Age-specific pricing with fallbacks
- Adult/child category support
- Free admission for babies (age 0-4)
- Handles missing age data gracefully

**Location:** `src/combo.js`

---

### 4. ui.js (587 lines, 23 exports) - Phase 1
**Purpose:** Core UI functions for interactions and display

**Dependencies:**
- Imports: All from `combo.js`, `scheduler.js`
- Global: `window.state`, `localStorage`

**Exports:**
- `showToast(message, type)` - Toast notifications
- `showSavedTripModal()` / `closeSavedTripModal()` - Trip modals
- `displayGeographicProgram(daysProgram, activityGroups)` - Show itinerary
- `forceRefreshProgram()` - Force program regeneration
- `toggleActivitySelection(activityId)` - Select/deselect activity
- `clearSelectedActivities()` - Clear all selections
- `recalculateSelectedActivityPrices()` - Recalc prices when family changes
- `updateActivitiesTotal()` - Update cost display
- `updateActivitiesCost()` - Legacy cost update
- `calculateTotalSpent()` - Calculate total selected cost
- `updateFamilyMemberName/Age(index, value)` - Update family data
- `addFamilyMember(type)` / `removeFamilyMember(index)` - Family CRUD
- `updateFamilyMembers()` - Save family changes
- `updateProgramDays(days)` - Update selected days
- `suggestDaysFromGroups(groups)` - Suggest optimal day count
- `getPriceInfo(prices)` - Format price display
- `getPriceForAge(prices, age)` - Get price for specific age
- `saveState()` - Save to localStorage

**Location:** `src/ui.js`

---

### 5. main.js (102 → 200 lines)
**Purpose:** Application entry point and module wiring

**Dependencies:** Imports ALL modules

**Responsibilities:**
1. Import all modules
2. Initialize `window.state` global object
3. Export all functions to `window` for HTML onclick compatibility
4. Log initialization status

**Window Exports:** 60+ functions

**Location:** `src/main.js`

---

## Phase 2 Modules (In Progress)

### 6. ui-templates.js (863 lines, 7 exports) ✅ COMPLETED
**Purpose:** HTML generation functions for all application steps

**Dependencies:**
- Imports: `getDayColor` from `scheduler.js`, `COLOR_PALETTE` from `data.js`
- Global: `window.state`

**Exports:**
- `getStepName(stepId)` - Get Greek name for step
- `getDestinationStepHTML()` - Step 1: Destination selection (~95 lines)
- `getFlightStepHTML()` - Step 2: Flight search (~48 lines)
- `getHotelStepHTML()` - Step 3: Hotel search (~190 lines)
- `getActivitiesStepHTML()` - Step 4: Activities selection (~187 lines)
- `getSummaryStepHTML()` - Step 5: Program summary (~97 lines)
- `getMapStepHTML()` - Step 6: Interactive map (~203 lines)

**Key Features:**
- Complete Greek localization
- Responsive design with inline styles
- Integration with Booking.com, Expedia, TicketSeller
- Family member management UI
- Day filter UI for map
- Custom map points UI

**Location:** `src/ui-templates.js`

**Status:** ✅ Extracted, committed

---

### 7. destinations.js (445 lines, 7 exports) ✅ COMPLETED
**Purpose:** Destination filtering and selection logic

**Dependencies:**
- Global: `window.state`, `window.saveState`

**Exports:**
- `filterDestinations()` - Filter 22 cities by criteria
- `selectDestination(name, id)` - Select destination and clear old data
- `showQuickRecommendations()` - Show 4 preset recommendations
- `resetFilters()` - Clear all filter selections
- `showPopularDestinations()` - Preset: Popular cities
- `showBudgetDestinations()` - Preset: Budget-friendly cities
- `showFamilyDestinations()` - Preset: Family-friendly cities

**City Data:**
- 22 European cities
- Filters: distance, vacation type, cost, theme parks, stroller-friendly
- Full support: 10 cities with JSON data
- Coming soon: 12 cities

**Location:** `src/destinations.js`

**Status:** ✅ Extracted, committed

---

### 8. ui-map.js (~2,500 lines, 40+ functions) 📋 DOCUMENTED
**Purpose:** All map-related functionality (Leaflet.js integration)

**Status:** 📋 Extraction plan documented in `MAP_EXTRACTION_PLAN.md`

**Reason for Deferral:** Extremely large size (~2,500 lines), requires dedicated extraction session

**Key Components:**
- MapManager object - Centralized map lifecycle
- MarkerCache object - Marker caching system
- Map initialization functions
- Activity marker creation
- Route drawing and navigation
- Custom points with geocoding
- Day filtering for map
- DBSCAN clustering visualization

**Dependencies:**
- Imports: `calculateDistance`, `getCityCoordinates`, `getDayColor`, `getGroupColor`, `showToast`
- External: Leaflet.js library (L global)
- Global: `window.state`, `window.travelMap`

**Recommendation:** Extract in future dedicated session

**Location:** Documented in `docs/MAP_EXTRACTION_PLAN.md`

---

### 9. core.js (TBD)
**Purpose:** Navigation, initialization, and step management

**Status:** ⏳ Planned extraction

**Expected Functions:**
- `initApp()` - Application initialization
- `setupEventListeners()` - Global event listeners
- `showStep(stepId)` - Navigate between steps
- `setupDestinationStep()` - Initialize destination step
- `setupActivitiesStep()` - Initialize activities step
- `setupMapStep()` - Initialize map step
- `loadActivities(cityId)` - Load city activity data
- `renderCurrentStep()` - Re-render current step
- Navigation helpers

**Dependencies:** All modules

**Estimated Size:** ~400-600 lines

**Location:** `src/core.js` (pending)

---

## Module Statistics

### Phase 1 (Completed)
| Module | Lines | Functions | Exports | Status |
|--------|-------|-----------|---------|--------|
| data.js | 143 | 6 | 6 | ✅ |
| scheduler.js | 238 | 8 | 8 | ✅ |
| combo.js | 290 | 4 | 4 | ✅ |
| ui.js | 587 | 23 | 23 | ✅ |
| main.js | 102 | 0 | N/A | ✅ |
| **Total** | **1,360** | **41** | **41** | **100%** |

### Phase 2 (In Progress)
| Module | Lines | Functions | Exports | Status |
|--------|-------|-----------|---------|--------|
| ui-templates.js | 863 | 7 | 7 | ✅ |
| destinations.js | 445 | 7 | 7 | ✅ |
| ui-map.js | ~2,500 | ~40 | ~40 | 📋 |
| core.js | ~500 | ~15 | ~15 | ⏳ |
| **Total** | **~4,308** | **~69** | **~69** | **46%** |

### Overall Progress
- **Original script.js:** 7,407 lines, 126 functions
- **Extracted so far:** 2,668 lines (36%)
- **Remaining:** 4,739 lines (64%)

---

## Dependency Graph

```
data.js (no dependencies)
  ↓
scheduler.js (imports: data.js)
  ↓
combo.js (global: state, showToast, updateActivitiesTotal)
  ↓
ui.js (imports: combo.js, scheduler.js)
  ↓
ui-templates.js (imports: scheduler.js, data.js)
  ↓
destinations.js (global: state, saveState)
  ↓
[ui-map.js] (imports: data.js, scheduler.js, ui.js)
  ↓
[core.js] (imports: ALL modules)
  ↓
main.js (imports: ALL modules, creates window exports)
```

---

## Window Exports

All functions are exported to `window` object for HTML onclick compatibility:

### Data & Utilities (6)
- `COLOR_PALETTE`, `calculateDistance`, `getCityCoordinates`
- `translateCategory`, `getActivityIcon`, `getActivityEmoji`

### Scheduler (8)
- `distributeGroupsToDays`, `calculateGroupEffort`, `getIntensityMultiplier`
- `findBestDayForGroup`, `calculateDayCenter`, `balanceDaysIfNeeded`
- `getDayColor`, `getGroupColor`

### Combo (4)
- `calculateFamilyCost`, `calculateSmartCombos`
- `simulateComboCalculation`, `applyComboDiscount`

### UI Core (23)
- Toast, modals, display functions
- Activity selection and management
- Family member CRUD
- State management

### UI Templates (7)
- `getStepName`, `getDestinationStepHTML`, `getFlightStepHTML`
- `getHotelStepHTML`, `getActivitiesStepHTML`, `getSummaryStepHTML`, `getMapStepHTML`

### Destinations (7)
- `filterDestinations`, `selectDestination`, `showQuickRecommendations`
- `resetFilters`, `showPopularDestinations`, `showBudgetDestinations`, `showFamilyDestinations`

**Total Window Exports:** 55+ functions

---

## Integration Notes

### HTML Changes Required
Update `index.html` to use ES modules:
```html
<script type="module" src="src/main.js"></script>
```

### Global Dependencies
- `window.state` - Application state object
- `window.travelMap` - Leaflet map instance
- `L` - Leaflet library (external)
- `localStorage` - Browser storage API

### No Changes Required
- All function signatures preserved exactly
- All console.log messages preserved
- All HTML onclick handlers remain functional
- 100% behavior preservation

---

## Testing Checklist

### Phase 1 ✅
- [x] ES module imports work
- [x] Window exports functional
- [x] State management intact
- [x] Distance calculations correct
- [x] Scheduling algorithm works
- [x] Family pricing accurate
- [x] UI interactions functional
- [x] localStorage persistence works

### Phase 2 🔄
- [x] HTML templates render correctly
- [x] Destination filtering works
- [x] City selection functional
- [ ] Map functions operational (pending extraction)
- [ ] Navigation between steps works
- [ ] Activity loading functional

---

## Future Enhancements

### Optional Refactoring (Post Phase 2)
1. **TypeScript Migration:** Add type safety
2. **State Management:** Consider Zustand or Jotai
3. **Build Process:** Add Vite or Rollup bundler
4. **Code Splitting:** Lazy load modules
5. **Testing:** Add unit tests with Vitest
6. **Documentation:** Generate JSDoc documentation

### Maintaining Backward Compatibility
- Keep window exports for existing HTML
- Gradual migration to event listeners
- Preserve function signatures during refactoring

---

## References

- **Original File:** `script.js` (7,407 lines)
- **Module Directory:** `src/`
- **Documentation:** `docs/`
- **Phase 1 Summary:** `docs/REFACTOR_SUMMARY.md`
- **Phase 2 Plan:** This document
- **Map Extraction Plan:** `docs/MAP_EXTRACTION_PLAN.md`

---

**Last Updated:** 2026-01-12
**Status:** Phase 2 In Progress (ui-templates.js ✅, destinations.js ✅, ui-map.js 📋, core.js ⏳)
