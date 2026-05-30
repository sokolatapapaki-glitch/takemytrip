# BATCH 1: MapManager Foundation

## Changes Summary

### 1. Add MapManager (after line 25, after COLOR_PALETTE)

```javascript
// ==================== MAP MANAGER ====================
const MapManager = {
    instance: null,
    cityMarker: null,

    initialize(containerId, center, zoom = 13) {
        console.log('🗺️ MapManager: Initializing map');

        // Cleanup any existing instance first
        this.cleanup();

        try {
            // Create new map instance with same options as before
            this.instance = L.map(containerId, {
                zoomControl: true,
                scrollWheelZoom: true,
                doubleClickZoom: true,
                touchZoom: true,
                boxZoom: true,
                keyboard: true,
                dragging: true,
                attributionControl: true
            }).setView(center, zoom);

            // Add tile layer (same as before)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
                minZoom: 3
            }).addTo(this.instance);

            // Add scale control (same as before)
            L.control.scale({ imperial: false, metric: true }).addTo(this.instance);

            console.log('✅ MapManager: Map initialized');
            return this.instance;

        } catch (error) {
            console.error('❌ MapManager: Initialization failed:', error);
            throw error;
        }
    },

    cleanup() {
        console.log('🧹 MapManager: Cleaning up');

        // Clear city marker reference
        this.cityMarker = null;

        // Remove map instance
        if (this.instance) {
            try {
                this.instance.remove();
            } catch (e) {
                console.log('ℹ️ MapManager: No active map to remove');
            } finally {
                this.instance = null;
            }
        }

        // Call existing cleanupMapState() to preserve current behavior
        if (typeof cleanupMapState === 'function') {
            cleanupMapState();
        }
    },

    get() {
        return this.instance;
    },

    isInitialized() {
        return this.instance !== null;
    },

    setCityMarker(coords, popupContent) {
        if (!this.instance) {
            console.warn('MapManager: Cannot add city marker - map not initialized');
            return null;
        }

        // Remove old city marker if exists
        if (this.cityMarker && this.instance) {
            this.instance.removeLayer(this.cityMarker);
        }

        // Create city marker (exact same code as before)
        this.cityMarker = L.marker(coords, {
            icon: L.divIcon({
                html: `
                    <div style="
                        background: #4F46E5;
                        color: white;
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: 24px;
                        border: 3px solid white;
                        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
                        cursor: pointer;
                    ">
                        🏙️
                    </div>
                `,
                className: 'city-marker',
                iconSize: [50, 50],
                iconAnchor: [25, 50]
            })
        }).addTo(this.instance);

        if (popupContent) {
            this.cityMarker.bindPopup(popupContent).openPopup();
        }

        return this.cityMarker;
    }
};
```

### 2. Update initializeMapInStep() (line ~3340)

**REPLACE the map initialization section (lines 3362-3424) with:**

```javascript
        // Δημιουργία χάρτη using MapManager
        const map = MapManager.initialize('travel-map', cityCoords, 13);

        // Set global reference for backward compatibility
        window.travelMap = map;

        console.log('✅ Χάρτης δημιουργήθηκε');

        // Προσθήκη marker για την πόλη using MapManager
        MapManager.setCityMarker(cityCoords, `
            <div style="text-align: center; padding: 10px; min-width: 200px;">
                <h3 style="margin: 0 0 5px 0; color: #4F46E5;">${state.selectedDestination}</h3>
                <p style="margin: 0; color: #666;">
                    <i class="fas fa-map-marker-alt"></i> Κέντρο πόλης
                </p>
                <hr style="margin: 10px 0;">
                <p style="margin: 0; font-size: 12px; color: #888;">
                    👆 Κάντε κλικ στο κουμπί <strong>"Προβολή Σημείων"</strong> για τις δραστηριότητες
                </p>
            </div>
        `);
```

### 3. Update loadStepContent() (line 251-258)

**REPLACE:**
```javascript
    if (window.travelMap && stepName !== 'map') {
        try {
            window.travelMap.remove();
            window.travelMap = null;
        } catch(e) {
            console.log('ℹ️ Δεν υπήρχε ενεργός χάρτης');
        }
    }
```

**WITH:**
```javascript
    if (stepName !== 'map') {
        MapManager.cleanup();
        window.travelMap = null; // Clear global reference
    }
```

---

## Benefits:

1. ✅ **Single source of truth** for map lifecycle
2. ✅ **Easier debugging** - all map operations logged
3. ✅ **Prevents double-initialization** bugs
4. ✅ **Preserves ALL existing behavior** (city marker, controls, etc.)
5. ✅ **Backward compatible** - keeps `window.travelMap` reference

## What Stays EXACTLY the Same:

- Map rendering and appearance
- City marker behavior and styling
- All user interactions
- Error handling flow
- All other functions work unchanged

## Testing:

After applying:
1. Navigate to map step → should initialize correctly
2. Navigate away from map → should cleanup
3. Return to map → should re-initialize
4. City marker → should appear and work as before
5. Check console → should see MapManager logs
