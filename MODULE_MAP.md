# ES Module Refactoring - Module Map

**Status:** Phase 1 Complete (4/5 modules extracted)
**Date:** 2026-01-12
**Total Extracted:** ~1,258 lines, 41 functions

---

## Module Structure

```
src/
├── scheduler.js    (238 lines, 8 functions)
├── data.js         (143 lines, 6 exports)
├── combo.js        (290 lines, 4 functions)
└── ui.js           (587 lines, 23 functions) - Phase 1
```

---

## 1. scheduler.js (238 lines)

**Purpose:** Effort-based scheduling algorithm for geographic trip planning

**Exports (8 functions):**
1. `distributeGroupsToDays(groups, totalDays)` - Main effort-based distribution
2. `calculateGroupEffort(group)` - Calculates effort score
3. `getIntensityMultiplier(category)` - Returns intensity multiplier
4. `findBestDayForGroup(days, group, totalDays)` - Optimal day selection
5. `calculateDayCenter(groups)` - Geographic center calculation
6. `balanceDaysIfNeeded(days)` - Logs effort imbalance warnings
7. `getDayColor(dayNumber)` - Day color from palette
8. `getGroupColor(index)` - Group color from palette

**Dependencies:**
- Imports: `calculateDistance`, `COLOR_PALETTE` from `./data.js`

**Usage:**
```javascript
import {
    distributeGroupsToDays,
    calculateGroupEffort,
    getDayColor
} from './scheduler.js';
```

---

## 2. data.js (143 lines)

**Purpose:** Constants, city data, and utility functions

**Exports (1 constant + 5 functions):**
1. `COLOR_PALETTE` - 8-color array for UI elements
2. `calculateDistance(point1, point2)` - Haversine distance formula
3. `getCityCoordinates(cityId)` - Returns [lat, lng] for 22 cities
4. `translateCategory(cat)` - English to Greek translation
5. `getActivityIcon(category)` - FontAwesome icon class
6. `getActivityEmoji(category)` - Emoji for activity category

**Dependencies:** None (self-contained)

**Usage:**
```javascript
import {
    COLOR_PALETTE,
    calculateDistance,
    getCityCoordinates,
    getActivityEmoji
} from './data.js';
```

---

## 3. combo.js (290 lines)

**Purpose:** Smart combo/discount calculations for activity bundles

**Exports (4 functions):**
1. `calculateFamilyCost(prices)` - Family pricing calculation
2. `calculateSmartCombos()` - Combo entry point with loading UI
3. `simulateComboCalculation()` - 10-15% discount simulation
4. `applyComboDiscount(discount)` - Apply discount to activities

**Global Dependencies (accessed, not imported):**
- `state` - Global state object
- `showToast` - From ui.js
- `updateActivitiesTotal` - From ui.js
- `calculateTotalSpent` - From ui.js

**Usage:**
```javascript
import {
    calculateFamilyCost,
    calculateSmartCombos,
    applyComboDiscount
} from './combo.js';
```

---

## 4. ui.js (587 lines) - **Phase 1**

**Purpose:** Core UI functions for display, updates, and user interactions

**Exports (23 functions):**

### Toast & Modals (3)
1. `showToast(message, type)` - Toast notifications
2. `showSavedTripModal(message)` - Saved trip modal
3. `closeSavedTripModal()` - Close saved trip modal

### Display & Render (2)
4. `displayGeographicProgram(daysProgram, activityGroups)` - Main program display
5. `forceRefreshProgram()` - Manual program refresh

### Activity Selection (3)
6. `toggleActivitySelection(activityId)` - Toggle activity selection
7. `clearSelectedActivities()` - Clear all selections
8. `recalculateSelectedActivityPrices()` - Recalculate after age changes

### Cost Display (3)
9. `updateActivitiesTotal()` - Update total cost display
10. `updateActivitiesCost()` - Update cost summary
11. `calculateTotalSpent()` - Sum all activity costs

### Family Management (5)
12. `updateFamilyMemberName(index, name)` - Update member name
13. `updateFamilyMemberAge(index, age)` - Update member age
14. `addFamilyMember()` - Add new family member
15. `removeFamilyMember(index)` - Remove family member
16. `updateFamilyMembers()` - Batch update UI

### Program Days (2)
17. `updateProgramDays()` - Update days count
18. `suggestDaysFromGroups(groups)` - Suggest optimal days

### Price Formatting (2)
19. `getPriceInfo(prices)` - Format price information
20. `getPriceForAge(prices, age)` - Get price for specific age

### State Management (1)
21. `saveState()` - Save to localStorage

**Global Dependencies:**
- `state` - Global state object
- `calculateFamilyCost` - From combo.js
- `getDayColor` - From scheduler.js
- `getActivityEmoji` - From data.js

**Usage:**
```javascript
import {
    showToast,
    displayGeographicProgram,
    toggleActivitySelection,
    updateActivitiesTotal
} from './ui.js';
```

**Note:** Phase 1 includes core functions. Additional functions to be added:
- HTML template generators (get*StepHTML functions)
- Map functions (25+ functions)
- Destination functions (12 functions)
- Step navigation functions
- Full event handler suite

---

## 5. main.js (Pending)

**Purpose:** Application initialization, imports, and window exports

**Will include:**
- Global state object initialization
- Imports from all modules
- Window exports for HTML onclick handlers (70+ exports)
- Event listener setup
- Application lifecycle management

**Critical:** All functions must be re-exported to `window` object for HTML onclick compatibility.

---

## Dependencies Graph

```
main.js
├─> data.js (no dependencies)
├─> scheduler.js
│   └─> data.js (calculateDistance, COLOR_PALETTE)
├─> combo.js
│   └─> (accesses globals: state, showToast, updateActivitiesTotal)
└─> ui.js
    ├─> combo.js (calculateFamilyCost)
    ├─> scheduler.js (getDayColor)
    └─> data.js (getActivityEmoji)
```

---

## Function Signature Preservation

**✅ CRITICAL:** All 41 exported functions maintain 100% identical signatures to original script.js:
- No parameter changes
- No return type changes
- All console.logs preserved
- All comments preserved
- Global state access preserved

**Example:**
```javascript
// Original (script.js:5849)
function showToast(message, type = 'info') { ... }

// Module (ui.js)
export function showToast(message, type = 'info') { ... }
// ✅ Identical signature, only added 'export'
```

---

## Window Exports (Required)

All functions must be exported to `window` object in main.js for HTML onclick handlers:

```javascript
// Example in main.js
import { showToast, toggleActivitySelection } from './ui.js';

window.showToast = showToast;
window.toggleActivitySelection = toggleActivitySelection;
// ... 70+ more exports
```

---

## Testing Strategy

1. **Import Validation:** Verify all imports resolve correctly
2. **Function Calls:** Test each function with original parameters
3. **Console Logs:** Verify all logs appear as before
4. **UI Interactions:** Test button clicks, form submissions
5. **State Persistence:** Verify localStorage operations
6. **Behavior Match:** Ensure 100% identical behavior to original script.js

---

## Next Steps

1. ✅ Create main.js with:
   - State initialization
   - All imports
   - Window exports
   - Event listeners

2. ⏳ Test integration:
   - Load modules in browser
   - Verify all onclick handlers work
   - Test full application flow

3. ⏳ Expand ui.js (if needed):
   - Add remaining HTML templates
   - Add remaining map functions
   - Add destination functions

---

**Total Progress:**
- ✅ scheduler.js - Complete
- ✅ data.js - Complete
- ✅ combo.js - Complete
- ✅ ui.js - Phase 1 Complete (core functions)
- ⏳ main.js - In Progress

**Lines Extracted:** 1,258 / ~7,407 (17%)
**Functions Extracted:** 41 / ~126 (33%)
