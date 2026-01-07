// ==================== STEP 6: MAP (FIXED) ====================
function getMapStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-map"></i> Διαδραστικός Χάρτης</h1>
            <p class="card-subtitle">${state.selectedDestination ? 'Χάρτης για: ' + state.selectedDestination : 'Δεν έχετε επιλέξει προορισμό'}</p>
            
            ${!state.selectedDestination ? `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Δεν έχετε επιλέξει προορισμό. Παρακαλώ επιστρέψτε στο βήμα 1.
                    <button class="btn btn-primary" onclick="showStep('destination')" style="margin-top: 10px;">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            ` : `
                <!-- ΧΑΡΤΗΣ -->
                <div id="map-container" style="height: 600px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px; border: 2px solid var(--border);">
                    <div id="travel-map" style="height: 100%; width: 100%;"></div>
                </div>
                
                <!-- ΚΟΥΜΠΙΑ ΕΛΕΓΧΟΥ -->
                <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="showActivityMap()">
                        <i class="fas fa-map-pin"></i> Προβολή Σημείων
                    </button>
                    
                    <button class="btn btn-accent" onclick="showGroupedActivitiesOnMap()">
                        <i class="fas fa-layer-group"></i> Ομαδοποίηση
                    </button>
                    
                    <button class="btn btn-secondary" onclick="clearMapPoints()">
                        <i class="fas fa-trash"></i> Καθαρισμός
                    </button>
                    
                    <button class="btn btn-outline" onclick="showRouteBetweenPoints()">
                        <i class="fas fa-route"></i> Διαδρομή
                    </button>
                    
                    <div id="map-status" style="flex: 1; padding: 10px; background: #f0f7ff; border-radius: 6px; font-size: 13px;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Ετοιμότητα:</strong> Πατήστε "Προβολή Σημείων" για τις δραστηριότητες σας
                    </div>
                </div>
                
                <!-- ΟΔΗΓΙΕΣ -->
                <div class="alert alert-info">
                    <i class="fas fa-graduation-cap"></i>
                    <strong>Οδηγίες Χρήσης:</strong><br>
                    1. Πατήστε "Προβολή Σημείων" για να φορτώσετε τις δραστηριότητες σας<br>
                    2. Κάντε κλικ σε 2 πινέζες για επιλογή <span style="color: #10B981;">ΑΠΟ</span> και <span style="color: #EF4444;">ΠΡΟΣ</span><br>
                    3. Η διαδρομή θα σχεδιαστεί αυτόματα με απόσταση και χρόνους<br>
                    4. Πατήστε στο κουμπί: Διαδρομή για Google Maps οδηγίες
                </div>
                
                <!-- ΕΠΙΣΤΡΟΦΗ -->
                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn btn-outline" onclick="showStep('summary')">
                        <i class="fas fa-arrow-left"></i> Επιστροφή στο Πρόγραμμα
                    </button>
                </div>
            `}
        </div>
    `;
}

// ==================== INITIALIZE MAP IN STEP 6 ====================
function initializeMapInStep() {
    console.log('🗺️ Αρχικοποίηση χάρτη στο βήμα 6...');
    
    const mapElement = document.getElementById('travel-map');
    if (!mapElement) {
        console.error('❌ Δεν βρέθηκε το travel-map element');
        document.getElementById('map-container').innerHTML = `
            <div style="height:600px; display:flex; align-items:center; justify-content:center; background:#f8f9fa; color:#666; text-align:center; padding:40px;">
                <div>
                    <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom:20px;"></i>
                    <h4>Σφάλμα φόρτωσης χάρτη</h4>
                    <p>Το στοιχείο του χάρτη δεν βρέθηκε</p>
                    <button onclick="initializeMapInStep()" class="btn btn-primary" style="margin-top:15px;">
                        <i class="fas fa-sync-alt"></i> Δοκιμή ξανά
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Καθαρισμός προηγούμενου
    if (window.travelMap) {
        window.travelMap.remove();
        window.travelMap = null;
    }
    
    // Επαναφορά επιλογών
    window.firstPoint = null;
    window.secondPoint = null;
    window.currentRoutePolyline = null;
    window.selectedMarkers = [];
    selectedPointA = null;
    selectedPointB = null;
    currentRouteLine = null;
    
    try {
        // Έλεγχος αν φορτώθηκε το Leaflet
        if (typeof L === 'undefined') {
            throw new Error('Η βιβλιοθήκη Leaflet δεν φορτώθηκε. Παρακαλώ ανανεώστε τη σελίδα.');
        }
        
        const cityCoords = getCityCoordinates(state.selectedDestinationId);
        
        if (!cityCoords) {
            throw new Error(`Δεν βρέθηκαν συντεταγμένες για την πόλη: ${state.selectedDestination}`);
        }
        
        console.log(`📍 Συντεταγμένες πόλης: ${cityCoords[0]}, ${cityCoords[1]}`);
        
        // Δημιουργία χάρτη
        window.travelMap = L.map('travel-map', {
            zoomControl: true,
            scrollWheelZoom: true,
            doubleClickZoom: true,
            touchZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
            attributionControl: true
        }).setView(cityCoords, 13);
        
        console.log('✅ Χάρτης δημιουργήθηκε');
        
        // Προσθήκη OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            minZoom: 3
        }).addTo(window.travelMap);
        
        // Προσθήκη marker για την πόλη
        const cityMarker = L.marker(cityCoords, {
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
        }).addTo(window.travelMap);
        
        cityMarker.bindPopup(`
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
        `).openPopup();
        
        // Προσθήκη scale control
        L.control.scale({ imperial: false, metric: true }).addTo(window.travelMap);
        
        // Ενημέρωση status
        const statusEl = document.getElementById('map-status');
        if (statusEl) {
            statusEl.innerHTML = `
                <i class="fas fa-check-circle" style="color: #10B981;"></i>
                <strong>Έτοιμο:</strong> Χάρτης φορτώθηκε. Πατήστε "Προβολή Σημείων"
            `;
        }
        
        console.log('✅ Χάρτης φορτώθηκε επιτυχώς');
        
    } catch (error) {
        console.error('❌ Σφάλμα αρχικοποίησης χάρτη:', error);
        
        mapElement.innerHTML = `
            <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#f8f9fa; color:#666; text-align:center; padding: 40px;">
                <div style="font-size: 64px; margin-bottom: 20px; color: #dc3545;">🗺️</div>
                <h4 style="margin: 0 0 15px 0; color: #343a40;">Σφάλμα φόρτωσης χάρτη</h4>
                <p style="margin: 0 0 20px 0; color: #6c757d; max-width: 500px;">
                    ${error.message}
                </p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button onclick="initializeMapInStep()" class="btn btn-primary" style="padding: 10px 20px;">
                        <i class="fas fa-sync-alt"></i> Δοκιμή ξανά
                    </button>
                    <button onclick="showStep('summary')" class="btn btn-outline" style="padding: 10px 20px;">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            </div>
        `;
    }
}

// ==================== CLEAR MAP POINTS ====================
function clearMapPoints() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    // Καθαρισμός όλων των markers (εκτός από τον city marker)
    window.travelMap.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            // Μην διαγράψεις τον city marker
            if (layer.options && layer.options.className === 'city-marker') {
                return;
            }
            window.travelMap.removeLayer(layer);
        }
    });
    
    // Καθαρισμός διαδρομών
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }
    
    // Επαναφορά επιλογών
    selectedPointA = null;
    selectedPointB = null;
    
    // Ενημέρωση
    const statusEl = document.getElementById('map-status');
    if (statusEl) {
        statusEl.innerHTML = `
            <i class="fas fa-broom" style="color: #F59E0B;"></i>
            <strong>Καθαρισμός:</strong> Όλα τα σημεία διαγράφηκαν
        `;
    }
    
    showToast('🧹 Όλα τα σημεία καθαρίστηκαν από τον χάρτη', 'info');
}
