// ==================== DESTINATIONS MODULE ====================
// Destination filtering, selection, and recommendation functions
// Dependencies: window.state, saveState, showStep

// Access global state
const state = window.state;

// ==================== DESTINATION FILTERING ====================
export async function filterDestinations() {
    console.log('🔍 Εκκίνηση αναζήτησης προορισμών με φίλτρα...');

    const resultsDiv = document.getElementById('destination-results');
    if (!resultsDiv) {
        console.error('❌ Δεν βρέθηκε το results div');
        return;
    }

    resultsDiv.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
            <div class="loading">
                <i class="fas fa-search fa-spin fa-3x" style="color: var(--primary); margin-bottom: 20px;"></i>
                <h3 style="color: var(--dark); margin-bottom: 10px;">Αναζήτηση Προορισμών</h3>
                <p style="color: var(--gray);">Εφαρμογή φίλτρων και φόρτωση δεδομένων...</p>
            </div>
        </div>
    `;

    await new Promise(resolve => setTimeout(resolve, 800));

    // Διαβάζουμε ΟΛΑ τα φίλτρα (το νέο και τα παλιά)
    const distance = document.getElementById('distance').value;
    const vacationType = document.getElementById('vacation-type').value;
    const costLevel = document.getElementById('cost-level').value;
    const themeParks = document.getElementById('theme-parks').value;
    // 🆕 ΝΕΟ ΦΙΛΤΡΟ (αντικατέστησε το travel-type):
    const strollerFilter = document.getElementById('stroller-friendly-filter').value;

    console.log('🎯 Εφαρμογή φίλτρων:', {
        distance, vacationType, costLevel, themeParks, strollerFilter
    });

    // 📊 ΟΛΟΚΛΗΡΩΜΕΝΟΣ ΠΙΝΑΚΑΣ ΠΟΛΕΩΝ (22 πόλεις με το νέο πεδίο strollerFriendly)
    const allCities = [
        {
            id: 'amsterdam', name: 'Άμστερνταμ', emoji: '🌷',
            hasJSON: true, distance: 3.5, cost: 'Ακριβό',
            country: 'Ολλανδία', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 9, hasDisney: false,
            strollerFriendly: true
        },
        {
            id: 'paris', name: 'Παρίσι', emoji: '🗼',
            hasJSON: true, distance: 3.0, cost: 'Ακριβό',
            country: 'Γαλλία', vacationType: 'Πολιτισμός',
            themeParks: ['disney', 'has-parks'], familyScore: 10, hasDisney: true,
            strollerFriendly: false
        },
        {
            id: 'london', name: 'Λονδίνο', emoji: '🎡',
            hasJSON: true, distance: 3.8, cost: 'Ακριβό',
            country: 'ΗΒ', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 9, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'berlin', name: 'Βερολίνο', emoji: '🧱',
            hasJSON: true, distance: 2.5, cost: 'Μέτριο',
            country: 'Γερμανία', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 8, hasDisney: false,
            strollerFriendly: true
        },
        {
            id: 'prague', name: 'Πράγα', emoji: '🏰',
            hasJSON: true, distance: 2.2, cost: 'Οικονομικό',
            country: 'Τσεχία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 7, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'budapest', name: 'Βουδαπέστη', emoji: '♨️',
            hasJSON: true, distance: 2.0, cost: 'Οικονομικό',
            country: 'Ουγγαρία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 6, hasDisney: false,
            strollerFriendly: true
        },
        {
            id: 'vienna', name: 'Βιέννη', emoji: '🎻',
            hasJSON: true, distance: 2.3, cost: 'Μέτριο',
            country: 'Αυστρία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 7, hasDisney: false,
            strollerFriendly: true
        },
        {
            id: 'rome', name: 'Ρώμη', emoji: '🏛️',
            hasJSON: false, distance: 2.5, cost: 'Μέτριο',
            country: 'Ιταλία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'barcelona', name: 'Βαρκελώνη', emoji: '🏖️',
            hasJSON: false, distance: 3.0, cost: 'Μέτριο',
            country: 'Ισπανία', vacationType: 'Θάλασσα',
            themeParks: ['has-parks'], familyScore: 8, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'madrid', name: 'Μαδρίτη', emoji: '🐂',
            hasJSON: true, distance: 3.2, cost: 'Μέτριο',
            country: 'Ισπανία', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 8, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'lisbon', name: 'Λισαβόνα', emoji: '🌊',
            hasJSON: true, distance: 4.0, cost: 'Οικονομικό',
            country: 'Πορτογαλία', vacationType: 'Θάλασσα',
            themeParks: [], familyScore: 6, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'istanbul', name: 'Κωνσταντινούπολη', emoji: '🕌',
            hasJSON: true, distance: 1.5, cost: 'Οικονομικό',
            country: 'Τουρκία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 7, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'brussels', name: 'Βρυξέλλες', emoji: '🍫',
            hasJSON: false, distance: 3.0, cost: 'Μέτριο',
            country: 'Βέλγιο', vacationType: 'Πόλη',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'copenhagen', name: 'Κοπεγχάγη', emoji: '🧜‍♀️',
            hasJSON: false, distance: 3.5, cost: 'Ακριβό',
            country: 'Δανία', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 9, hasDisney: false,
            strollerFriendly: true
        },
        {
            id: 'dublin', name: 'Δουβλίνο', emoji: '🍀',
            hasJSON: false, distance: 4.0, cost: 'Ακριβό',
            country: 'Ιρλανδία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: true
        },
        {
            id: 'edinburgh', name: 'Εδιμβούργο', emoji: '🏰',
            hasJSON: false, distance: 4.0, cost: 'Ακριβό',
            country: 'Σκωτία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'florence', name: 'Φλωρεντία', emoji: '🎨',
            hasJSON: false, distance: 2.3, cost: 'Μέτριο',
            country: 'Ιταλία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 4, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'munich', name: 'Μόναχο', emoji: '🍺',
            hasJSON: false, distance: 2.2, cost: 'Μέτριο',
            country: 'Γερμανία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: true
        },
        {
            id: 'venice', name: 'Βενετία', emoji: '🛶',
            hasJSON: false, distance: 2.0, cost: 'Ακριβό',
            country: 'Ιταλία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 4, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'warsaw', name: 'Βαρσοβία', emoji: '🦅',
            hasJSON: false, distance: 2.5, cost: 'Οικονομικό',
            country: 'Πολωνία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: true
        },
        {
            id: 'krakow', name: 'Κρακοβία', emoji: '🐉',
            hasJSON: false, distance: 2.0, cost: 'Οικονομικό',
            country: 'Πολωνία', vacationType: ['Πολιτισμός', 'Βουνό'],
            themeParks: ['has-parks'], familyScore: 8, hasDisney: false,
            strollerFriendly: false
        },
        {
            id: 'zurich', name: 'Ζυρίχη', emoji: '🏔️',
            hasJSON: false, distance: 2.5, cost: 'Ακριβό',
            country: 'Ελβετία', vacationType: 'Βουνό',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: true
        }
    ];

    // 🎯 ΛΟΓΙΚΗ ΦΙΛΤΡΑΡΙΣΜΑΤΟΥ
    const filteredCities = allCities.filter(city => {
        // 1. Φίλτρο απόστασης
        if (distance && city.distance > parseFloat(distance)) {
            return false;
        }

        // 3. Φίλτρο κόστους
        if (costLevel && city.cost !== costLevel) {
            return false;
        }

        // 4. Φίλτρο τύπου διακοπών (supports both string and array)
        if (vacationType) {
            const cityVacationTypes = Array.isArray(city.vacationType)
                ? city.vacationType
                : [city.vacationType];
            if (!cityVacationTypes.includes(vacationType)) {
                return false;
            }
        }

        // 🆕 5. ΝΕΟ ΦΙΛΤΡΟ: "Φιλική για καρότσι"
        if (strollerFilter === 'true' && !city.strollerFriendly) {
            return false; // Φίλτρο: Ναι, αλλά η πόλη δεν είναι
        }
        if (strollerFilter === 'false' && city.strollerFriendly) {
            return false; // Φίλτρο: Όχι απαραίτητα, αλλά η πόλη είναι
        }

        // 6. Φίλτρο θεματικών πάρκων
        if (themeParks === 'disney' && !city.hasDisney) {
            return false; // Ζητάει Disney, αλλά η πόλη δεν έχει
        }
        if (themeParks === 'has-parks' && !city.themeParks.includes('has-parks')) {
            return false; // Ζητάει πάρκα, αλλά η πόλη δεν έχει
        }

        return true; // Η πόλη περνάει όλα τα φίλτρα
    });

    console.log(`📊 Αποτελέσματα: ${filteredCities.length} από ${allCities.length} πόλεις`);

    // 🔧 ΕΜΦΑΝΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
    let html = '';

    if (filteredCities.length === 0) {
        html = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <div style="font-size: 64px; margin-bottom: 20px;">😕</div>
                <h2 style="color: var(--dark); margin-bottom: 15px;">Δεν βρέθηκαν αποτελέσματα</h2>
                <p style="color: var(--gray); max-width: 600px; margin: 0 auto 30px;">
                    Κανένας προορισμός δεν ταιριάζει με τα επιλεγμένα φίλτρα.
                    <br>
                    <strong>Συμβουλή:</strong> Χαλαρώστε κάποιο κριτήριο ή δοκιμάστε "Γρήγορες Προτάσεις".
                </p>
                <button class="btn btn-primary" onclick="resetFilters()">
                    <i class="fas fa-redo"></i> Επαναφορά Φίλτρων
                </button>
                <button class="btn btn-outline" onclick="showQuickRecommendations()" style="margin-left: 10px;">
                    <i class="fas fa-bolt"></i> Γρήγορες Προτάσεις
                </button>
            </div>
        `;
    } else {
        filteredCities.forEach(city => {
            html += `
                <div class="destination-card" onclick="selectDestination('${city.name}', '${city.id}')">
                    <div class="destination-emoji">
                        ${city.emoji}
                    </div>

                    <h3 class="destination-name">${city.name}</h3>
                    <div class="destination-country">
                        <i class="fas fa-globe-europe"></i>
                        ${city.country}
                    </div>

                    <div class="destination-info-grid">
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fas fa-plane"></i> Απόσταση
                            </div>
                            <div class="info-value">${city.distance} ώρες</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fas fa-wallet"></i> Κόστος
                            </div>
                            <div class="info-value">${city.cost}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">
                                <i class="fas fa-baby-carriage"></i> Καρότσι
                            </div>
                            <div class="info-value">${city.strollerFriendly ? '✅ Εύκολη' : '⚠️ Προσοχή'}</div>
                        </div>
                    </div>

                    <!-- Πληροφορίες Πάρκων -->
                    <div style="margin: 10px 0; padding: 8px; background: #f0f9ff; border-radius: 6px; font-size: 13px;">
                        <i class="fas fa-ferris-wheel"></i>
                        ${city.hasDisney ? '👑 Disneyland' :
                          city.themeParks.includes('has-parks') ? '🎡 Με θεματικό πάρκο' : '🏙️ Χωρίς θεματικό πάρκο'}
                    </div>

                    <div class="destination-status">
                        <div class="status-badge ${city.hasJSON ? 'success' : 'warning'}">
                            ${city.hasJSON ? '✅ Πλήρης Υποστήριξη' : '🛠️ Σύντομα θα ολοκληρωθεί'}
                        </div>
                    </div>

                    <button class="destination-btn" onclick="selectDestination('${city.name}', '${city.id}'); event.stopPropagation();">
                        <i class="fas fa-map-marker-alt"></i>
                        Επιλογή Προορισμού
                    </button>
                </div>
            `;
        });
    }

    resultsDiv.innerHTML = `
        <h2 style="grid-column: 1/-1; margin-bottom: 20px;">
            🎯 Αποτελέσματα Αναζήτησης
            <span style="font-size: 16px; color: var(--gray); font-weight: normal;">
                (${filteredCities.length} πόλεις)
            </span>
        </h2>
        <div class="destinations-grid">
            ${html}
        </div>
    `;

    console.log('✅ Αναζήτηση ολοκληρώθηκε με φίλτρα');
}

// ==================== DESTINATION SELECTION ====================
export function selectDestination(destinationName, destinationId) {
    console.log(`📍 Επιλογή προορισμού: ${destinationName} (${destinationId})`);

    state.selectedDestination = destinationName;
    state.selectedDestinationId = destinationId;

    // 🔴 ΚΑΘΑΡΙΣΜΟΣ ΔΕΔΟΜΕΝΩΝ ΠΡΟΗΓΟΥΜΕΝΗΣ ΠΟΛΗΣ
    state.selectedActivities = [];
    state.currentCityActivities = null;
    state.geographicProgram = null;
    window.selectedMarkers = [];

    // Καθαρισμός χάρτη αν υπάρχει
    if (window.travelMap) {
        window.travelMap.eachLayer(function(layer) {
            if (layer instanceof L.Marker && layer.options?.className !== 'city-marker') {
                window.travelMap.removeLayer(layer);
            }
        });
    }

    console.log('🧹 Καθαρισμός δεδομένων προηγούμενης πόλης');

    // Update display with null check
    const destDisplay = document.getElementById('current-destination-display');
    if (destDisplay) {
        destDisplay.textContent = destinationName;
    }

    const resultsDiv = document.getElementById('destination-results');
    if (!resultsDiv) return;
    resultsDiv.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
            <h2>Επιλέξατε: ${destinationName}</h2>
            <p style="margin: 20px 0;">Προχωρήστε στο επόμενο βήμα για πτήσεις</p>
            <button class="btn btn-primary" onclick="showStep('flight')">
                <i class="fas fa-arrow-right"></i> Συνέχεια στις Πτήσεις
            </button>
        </div>
    `;

    window.saveState();
}

// ==================== QUICK RECOMMENDATIONS ====================
export function showQuickRecommendations() {
    console.log('🎯 Εμφάνιση γρήγορων προτάσεων');

    const recommendations = [
        { name: 'Παρίσι', emoji: '🗼', reason: 'Disneyland & πολιτισμός' },
        { name: 'Λονδίνο', emoji: '🇬🇧', reason: 'Ιδανικό για οικογένειες' },
        { name: 'Πράγα', emoji: '🏰', reason: 'Οικονομικό & όμορφο' },
        { name: 'Άμστερνταμ', emoji: '🌷', reason: 'Καναλόπολη για όλες τις ηλικίες' }
    ];

    const resultsDiv = document.getElementById('destination-results');
    let html = '<h2 style="grid-column: 1/-1; margin-bottom: 20px;">🎯 Γρήγορες Προτάσεις</h2>';

    recommendations.forEach(rec => {
        html += `
            <div class="card" style="grid-column: span 1; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px;">${rec.emoji}</div>
                <h3 style="color: var(--primary); margin-bottom: 10px;">${rec.name}</h3>
                <p style="color: var(--gray); margin-bottom: 15px;">${rec.reason}</p>
                <button class="btn btn-primary" onclick="selectDestination('${rec.name}', '${rec.name.toLowerCase()}')">
                    <i class="fas fa-map-marker-alt"></i> Επιλογή
                </button>
            </div>
        `;
    });

    resultsDiv.innerHTML = `<div class="grid grid-4">${html}</div>`;
}

// ==================== RESET FILTERS ====================
export function resetFilters() {
    console.log('🔄 Επαναφορά φίλτρων');

    document.getElementById('distance').value = '';
    document.getElementById('vacation-type').value = '';
    document.getElementById('cost-level').value = '';
    document.getElementById('theme-parks').value = '';
    document.getElementById('stroller-friendly-filter').value = '';

    const resultsDiv = document.getElementById('destination-results');
    if (resultsDiv) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: var(--light); border-radius: var(--radius-lg); margin-top: 20px;">
                <div style="font-size: 64px; margin-bottom: 20px; color: var(--primary);">🗺️</div>
                <h2 style="color: var(--dark); margin-bottom: 15px;">Φίλτρα Επαναφέρθηκαν</h2>
                <p style="color: var(--gray);">Χρησιμοποιήστε τα φίλτρα για νέα αναζήτηση</p>
            </div>
        `;
    }
}

// ==================== PRESET FILTERS ====================
export function showPopularDestinations() {
    document.getElementById('distance').value = '3.5';
    document.getElementById('vacationType').value = 'Πόλη';
    filterDestinations();
}

export function showBudgetDestinations() {
    document.getElementById('cost-level').value = 'Οικονομικό';
    document.getElementById('distance').value = '2.5';
    filterDestinations();
}

export function showFamilyDestinations() {
    console.log('👨‍👩‍👧‍👦 Φιλτράρισμα για οικογένειες');

    document.getElementById('theme-parks').value = 'has-parks';
    document.getElementById('cost-level').value = 'Μέτριο';
    document.getElementById('vacation-type').value = 'Πόλη';

    filterDestinations();
}
