# Map Functions Extraction Plan

## Overview
The map-related functionality in `script.js` comprises approximately **2,500+ lines** across **40+ functions**. This document outlines the complete extraction plan for `ui-map.js`.

## Map Functions to Extract

### Core Map Objects (Lines 28-218)
- **MapManager** object (lines 28-146) - Centralized map lifecycle management
- **MarkerCache** object (lines 149-218) - Marker caching and synchronization

### Map Initialization & Cleanup (Lines 378-4206)
- `cleanupMapState()` (line 378) - Clean up map state and global variables
- `closeMapInstructions()` (line 3771) - Close map instructions card
- `initializeMap()` (lines 3779-4099) - Main map initialization function
- `initializeMapInStep()` (lines 4101-4206) - Initialize map in step 6
- `setupMapStep()` (line 3761) - Setup map step UI

### Map Clearing & Reload (Lines 4206-4244)
- `clearMapPoints()` (lines 4206-4240) - Clear all activity markers
- `reloadMap()` (line 4241) - Reload map instance

### Custom Points (Lines 4247-4454)
- `addCustomMapPoint()` (lines 4247-4308) - Add custom point with geocoding
- `geocodeLocation()` (lines 4310-4346) - Geocode location using Nominatim API
- `removeCustomPoint()` (lines 4348-4363) - Remove custom point
- `saveCustomPoints()` (lines 4365-4372) - Save to localStorage
- `loadCustomPoints()` (lines 4374-4385) - Load from localStorage
- `showCustomPointStatus()` (lines 4387-4401) - Show status message
- `hideCustomPointStatus()` (lines 4403-4408) - Hide status message
- `addCustomPointToMap()` (lines 4410-4454) - Add custom point marker to map

### Popup Creation (Lines 4457-4523)
- `createEnhancedPopup()` (lines 4457-4523) - Create rich activity popup with restaurant info

### Activity Display on Map (Lines 4524-4725)
- `showActivityMap()` (lines 4524-4691) - Display selected activities as markers
- `showRouteBetweenPoints()` (lines 4726-4741) - Show route between two selected points

### Grouped Activities (Lines 5578-5734)
- `showGroupedActivitiesOnMap()` (lines 5578-5734) - Display grouped activities with clustering

### Marker Creation (Lines 5897-6182)
- `createMarkerWithConnectFunction()` (lines 5897-6162) - Create interactive marker with click handling
- `resetSelection()` (lines 6166-6181) - Reset point selection

### Route Drawing (Lines 6183-6420)
- `drawRouteBetweenPoints()` (lines 6183-6420) - Draw route line with distance/time popup
- `resetMarkerAppearance()` - Reset marker to default appearance

### Day Filtering (Lines 6512-6587)
- `updateMapDayFilter()` (line 6512) - Update day filter checkbox
- `selectAllDays()` (line 6528) - Select all day checkboxes
- `deselectAllDays()` (line 6535) - Deselect all day checkboxes
- `applyDayFilter()` (line 6541) - Apply day filter to map markers

### Helper Functions
- `groupActivitiesByProximity()` - DBSCAN clustering for geographic grouping
- `renderCurrentStep()` - Re-render current step content

## Module State Variables
```javascript
let selectedPointA = null;  // First selected point (line 5801)
let selectedPointB = null;  // Second selected point (line 5802)
let currentRouteLine = null; // Current route polyline (line 5803)
```

## Dependencies
The map module will need to import:
- **From data.js**: `calculateDistance`, `getCityCoordinates`, `COLOR_PALETTE`
- **From scheduler.js**: `getDayColor`, `getGroupColor`
- **From ui.js**: `showToast`
- **Global**: `window.state`, `window.travelMap`, `L` (Leaflet library)

## Export Requirements
All functions must be exported for:
1. Import by other modules (core.js, main.js)
2. Window exports for HTML onclick handlers

## Implementation Notes
1. **Pure Refactor**: NO logic changes, preserve exact behavior
2. **Preserve Comments**: Keep all Greek console.log messages
3. **Function Signatures**: No parameter changes
4. **Global Access**: MapManager and MarkerCache should remain accessible globally

## Estimated Lines
- **Total**: ~2,500 lines
- **Functions**: 40+
- **Objects**: 2 (MapManager, MarkerCache)

## Status
- ✅ Documented
- ⏳ Extraction pending (deferred due to size - can be completed in follow-up)

## Recommendation
Given the size and complexity, consider extracting map functions in a dedicated session focused solely on map module creation. This allows thorough testing of map functionality without impacting other Phase 2 deliverables.
