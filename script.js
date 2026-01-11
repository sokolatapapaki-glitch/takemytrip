// ==================== GLOBAL STATE ====================
const state = {
    selectedDestination: null,
    selectedDestinationId: null,
    selectedDays: 0,
    familyMembers: [
        { name: "Ενήλικας 1", age: "" },
        { name: "Ενήλικας 2", age: "" }
    ],
    currentStep: 'destination',
    currentCityActivities: [],
    customPoints: JSON.parse(localStorage.getItem('travel_custom_points')) || [],
    selectedActivities: []
};
// ==================== COLOR PALETTE ====================
const COLOR_PALETTE = [
    '#4F46E5', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316'  // Orange
];

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

// ==================== MARKER CACHE ====================
const MarkerCache = {
    cache: new Map(), // Map<activityId, marker>

    addOrUpdate(activityId, marker) {
        // If marker already exists for this ID, remove old one first
        if (this.cache.has(activityId)) {
            const oldMarker = this.cache.get(activityId);
            if (window.travelMap && oldMarker) {
                window.travelMap.removeLayer(oldMarker);
            }
        }

        // Add new marker to cache
        this.cache.set(activityId, marker);
        console.log(`📍 MarkerCache: Cached marker for activity ${activityId}`);
    },

    remove(activityId) {
        const marker = this.cache.get(activityId);
        if (marker && window.travelMap) {
            window.travelMap.removeLayer(marker);
            this.cache.delete(activityId);
            console.log(`🗑️ MarkerCache: Removed marker for activity ${activityId}`);
        }
    },

    clear() {
        // Remove all cached markers from map
        if (window.travelMap) {
            this.cache.forEach(marker => {
                window.travelMap.removeLayer(marker);
            });
        }
        this.cache.clear();
        console.log('🧹 MarkerCache: Cleared all cached markers');
    },

    sync(currentActivityIds) {
        // Remove markers for activities no longer in the list
        const idsToRemove = [];

        this.cache.forEach((marker, activityId) => {
            if (!currentActivityIds.has(activityId)) {
                idsToRemove.push(activityId);
            }
        });

        idsToRemove.forEach(id => this.remove(id));

        if (idsToRemove.length > 0) {
            console.log(`🔄 MarkerCache: Synced - removed ${idsToRemove.length} old markers`);
        }
    },

    has(activityId) {
        return this.cache.has(activityId);
    },

    get(activityId) {
        return this.cache.get(activityId);
    },

    size() {
        return this.cache.size;
    },

    getAllMarkers() {
        return Array.from(this.cache.values());
    }
};

// ==================== STATE VALIDATOR ====================
const StateValidator = {
    validateFamilyMember(member) {
        if (!member || typeof member !== 'object') {
            return false;
        }

        // Name must be a string
        if (typeof member.name !== 'string' || member.name.trim() === '') {
            return false;
        }

        // Age can be empty string or valid number
        if (member.age === '' || member.age === null || member.age === undefined) {
            return true; // Empty age is valid (user hasn't set it yet)
        }

        const age = typeof member.age === 'number' ? member.age : parseInt(member.age);
        return !isNaN(age) && age >= 0 && age <= 120;
    },

    validateActivity(activity) {
        if (!activity || typeof activity !== 'object') {
            return false;
        }

        // Must have valid ID
        if (activity.id === undefined || activity.id === null) {
            return false;
        }

        // Must have name
        if (typeof activity.name !== 'string' || activity.name.trim() === '') {
            return false;
        }

        // Price can be 0 but must be a valid number if present
        if (activity.price !== undefined && activity.price !== null) {
            const price = parseFloat(activity.price);
            if (isNaN(price) || price < 0) {
                return false;
            }
        }

        return true;
    },

    validateDays(days) {
        const parsed = parseInt(days);
        return !isNaN(parsed) && parsed >= 0 && parsed <= 30;
    },

    validateDestination(destination) {
        if (!destination) return true; // null/undefined is valid (not selected yet)
        return typeof destination === 'string' && destination.trim() !== '';
    },

    sanitizeData(data) {
        const errors = [];
        const cleaned = { ...data };

        // Validate destination
        if (cleaned.selectedDestinationName && !this.validateDestination(cleaned.selectedDestinationName)) {
            errors.push('Invalid destination name');
            cleaned.selectedDestinationName = null;
        }

        if (cleaned.selectedDestinationId && !this.validateDestination(cleaned.selectedDestinationId)) {
            errors.push('Invalid destination ID');
            cleaned.selectedDestinationId = null;
        }

        // Validate days
        if (cleaned.selectedDaysStay !== undefined && !this.validateDays(cleaned.selectedDaysStay)) {
            errors.push(`Invalid days: ${cleaned.selectedDaysStay}`);
            cleaned.selectedDaysStay = 0;
        }

        // Validate and filter family members
        if (cleaned.familyMembers && Array.isArray(cleaned.familyMembers)) {
            const originalLength = cleaned.familyMembers.length;
            cleaned.familyMembers = cleaned.familyMembers.filter(member => {
                const valid = this.validateFamilyMember(member);
                if (!valid) {
                    errors.push(`Invalid family member: ${JSON.stringify(member)}`);
                }
                return valid;
            });

            if (cleaned.familyMembers.length !== originalLength) {
                console.warn(`⚠️ StateValidator: Removed ${originalLength - cleaned.familyMembers.length} invalid family members`);
            }

            // Ensure at least default members
            if (cleaned.familyMembers.length === 0) {
                cleaned.familyMembers = [
                    { name: "Ενήλικας 1", age: "" },
                    { name: "Ενήλικας 2", age: "" }
                ];
                console.log('✅ StateValidator: Reset to default family members');
            }
        } else {
            cleaned.familyMembers = [
                { name: "Ενήλικας 1", age: "" },
                { name: "Ενήλικας 2", age: "" }
            ];
        }

        // Validate and filter selected activities
        if (cleaned.selectedActivities && Array.isArray(cleaned.selectedActivities)) {
            const originalLength = cleaned.selectedActivities.length;
            cleaned.selectedActivities = cleaned.selectedActivities.filter(activity => {
                const valid = this.validateActivity(activity);
                if (!valid) {
                    errors.push(`Invalid activity: ${JSON.stringify(activity)}`);
                }
                return valid;
            });

            if (cleaned.selectedActivities.length !== originalLength) {
                console.warn(`⚠️ StateValidator: Removed ${originalLength - cleaned.selectedActivities.length} invalid activities`);
            }
        } else {
            cleaned.selectedActivities = [];
        }

        // Validate geographic program (light validation)
        if (cleaned.geographicProgram !== null &&
            cleaned.geographicProgram !== undefined &&
            typeof cleaned.geographicProgram !== 'object') {
            errors.push('Invalid geographic program');
            cleaned.geographicProgram = null;
        }

        // Validate current city activities
        if (cleaned.currentCityActivities && !Array.isArray(cleaned.currentCityActivities)) {
            errors.push('Invalid city activities');
            cleaned.currentCityActivities = [];
        }

        if (errors.length > 0) {
            console.warn('⚠️ StateValidator: Data validation errors:', errors);
        } else {
            console.log('✅ StateValidator: Data validation passed');
        }

        return cleaned;
    }
};

// ==================== GLOBAL MAP VARIABLES (ΑΠΟ ΤΟ ΠΑΛΙΟ ΧΑΡΤΗ) ====================
window.firstPoint = null;
window.secondPoint = null;
window.currentRoutePolyline = null;
window.selectedMarkers = []; // Για ενώσεις σημείων
window.routeResetTimer = null; // Timer για reset διαδρομής

// Centralized cleanup function για αποφυγή memory leaks
function cleanupMapState() {
    // Cleanup timers
    if (window.routeResetTimer) {
        clearTimeout(window.routeResetTimer);
        window.routeResetTimer = null;
    }

    // Cleanup global map variables
    window.firstPoint = null;
    window.secondPoint = null;
    window.currentRoutePolyline = null;
    window.selectedMarkers = [];

    // Cleanup module-level variables (if defined)
    if (typeof selectedPointA !== 'undefined') selectedPointA = null;
    if (typeof selectedPointB !== 'undefined') selectedPointB = null;
    if (typeof currentRouteLine !== 'undefined') currentRouteLine = null;

    // Clear marker cache
    if (typeof MarkerCache !== 'undefined') {
        MarkerCache.clear();
    }

    console.log('🧹 Map state cleaned up');
}
// ==================== MAIN INITIALIZATION FUNCTION ====================
function initApp() {
    console.log('🚀 Εκκίνηση εφαρμογής...');
    
    // 1. Φόρτωση αποθηκευμένων δεδομένων
    loadSavedData();
    
    // 2. Ρύθμιση mobile navigation
    setupMobileNavigation();
    
    // 3. Ρύθμιση navigation για βήματα
    setupStepNavigation();
    
    // 4. Ρύθμιση event listeners
    setupEventListeners();
    
    // 5. Fix για κουμπιά προορισμού
    fixDestinationButtons();
    
    // 6. Εμφάνιση του σωστού βήματος
    setTimeout(() => {
        showStep(state.currentStep);
        console.log('✅ Εφαρμογή αρχικοποιήθηκε');
    }, 100);
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Εφαρμογή φορτώνεται...');
    
    // Άμεση εκκίνηση (χωρίς καθυστέρηση)
    initApp();
    
    // Αφαίρεση του παλιού timeout για διπλά κουμπιά
    // (τώρα γίνεται μέσα στην initApp)
});


// ==================== MOBILE NAVIGATION ====================
function setupMobileNavigation() {
    console.log('📱 Ρύθμιση mobile navigation');
    
    const mobileSelector = document.getElementById('mobile-step-selector');
    if (!mobileSelector) return;
    
    // Βεβαιώσου ότι το dropdown έχει όλες τις επιλογές
    if (mobileSelector.options.length === 0) {
        const steps = ['destination', 'flight', 'hotel', 'activities', 'summary', 'map'];
        steps.forEach(step => {
            const option = document.createElement('option');
            option.value = step;
            option.textContent = getStepName(step);
            mobileSelector.appendChild(option);
        });
    }
    
    // Ενημέρωση τιμής όταν αλλάζει βήμα
    const originalShowStep = showStep;
    showStep = function(stepName) {
        originalShowStep(stepName);
        if (mobileSelector && mobileSelector.value !== stepName) {
            mobileSelector.value = stepName;
        }
    };
}
function getStepName(stepId) {
    const stepNames = {
        'destination': '📍 Προορισμός',
        'flight': '✈️ Πτήσεις', 
        'hotel': '🏨 Ξενοδοχεία',
        'activities': '🎫 Δραστηριότητες',
        'summary': '📅 Πρόγραμμα',
        'map': '🗺️ Χάρτης'
    };
    return stepNames[stepId] || stepId;
}
// ==================== LOAD SAVED DATA ====================
function loadSavedData() {
    const saved = localStorage.getItem('travelPlannerData');
    
    if (saved && !sessionStorage.getItem('userChoiceMade')) {
        setTimeout(() => {
            const userChoice = confirm(
                'Βρέθηκε προηγούμενο ταξίδι!\n\n' +
                'Κάντε κλικ:\n' +
                '• "OK" για να συνεχίσετε το προηγούμενο ταξίδι\n' +
                '• "Cancel" για να ξεκινήσετε νέο ταξίδι'
            );
            
            sessionStorage.setItem('userChoiceMade', 'true');
            
            if (!userChoice) {
                localStorage.removeItem('travelPlannerData');
                localStorage.removeItem('travel_custom_points');
                console.log('🆕 Ξεκινάει νέο ταξίδι');
                return;
            }
            
            loadSavedDataNow(saved);
        }, 1000);
    } else if (saved) {
        loadSavedDataNow(saved);
    }
}

function loadSavedDataNow(saved) {
    try {
        let data = JSON.parse(saved);

        // Validate and sanitize data before loading
        data = StateValidator.sanitizeData(data);

        state.selectedDestination = data.selectedDestinationName || null;
        state.selectedDestinationId = data.selectedDestinationId || null;
        state.selectedDays = data.selectedDaysStay || 0;
        state.familyMembers = data.familyMembers || state.familyMembers;
        state.selectedActivities = data.selectedActivities || [];

        // Restore persisted program data
        state.geographicProgram = data.geographicProgram || null;
        state.currentCityActivities = data.currentCityActivities || [];

        // Update display with null check for DOM element
        if (state.selectedDestination) {
            const el = document.getElementById('current-destination-display');
            if (el) {
                el.textContent = state.selectedDestination;
            }
        }

        console.log('📂 Φορτώθηκαν αποθηκευμένα δεδομένα:', {
            destination: state.selectedDestination,
            days: state.selectedDays,
            activities: state.selectedActivities.length,
            familyMembers: state.familyMembers.length,
            hasProgram: !!state.geographicProgram,
            lastSaved: data.lastSaved
        });

        // Show enhanced notification about loaded trip with navigation help
        showSavedTripNotification(data);

        // Add visual indicators to sidebar steps
        updateSidebarCompletionIndicators();

    } catch (error) {
        console.error('Σφάλμα φόρτωσης δεδομένων:', error);
        // Don't throw - fall back to default state
    }
}

// ==================== SAVED TRIP NOTIFICATION & NAVIGATION ====================
function showSavedTripNotification(data) {
    // Determine which steps are completed
    const completedSteps = [];
    if (state.selectedDestination) completedSteps.push('Προορισμός');
    if (state.selectedActivities.length > 0) completedSteps.push('Δραστηριότητες');
    if (state.geographicProgram) completedSteps.push('Πρόγραμμα');

    const message = `
        <div style="max-width: 450px; text-align: left; font-family: 'Roboto', sans-serif;">
            <h3 style="margin: 0 0 15px 0; color: #4F46E5; font-size: 20px;">
                <i class="fas fa-suitcase-rolling"></i> Καλώς ήρθατε πίσω!
            </h3>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #4F46E5;">
                <div style="font-size: 15px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">
                    📍 ${state.selectedDestination || 'Προορισμός'}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; color: #475569;">
                    <div>
                        <i class="fas fa-calendar-alt" style="color: #10B981; margin-right: 5px;"></i>
                        <strong>${state.selectedDays || 0}</strong> μέρες
                    </div>
                    <div>
                        <i class="fas fa-users" style="color: #F59E0B; margin-right: 5px;"></i>
                        <strong>${state.familyMembers.length}</strong> άτομα
                    </div>
                    <div>
                        <i class="fas fa-map-marked-alt" style="color: #EF4444; margin-right: 5px;"></i>
                        <strong>${state.selectedActivities.length}</strong> δραστηριότητες
                    </div>
                    <div>
                        <i class="fas fa-route" style="color: #8B5CF6; margin-right: 5px;"></i>
                        ${state.geographicProgram ? '<strong>✅ Πρόγραμμα</strong>' : '<span style="color: #94a3b8;">Χωρίς πρόγραμμα</span>'}
                    </div>
                </div>
            </div>

            <div style="background: #FEF3C7; padding: 12px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #F59E0B;">
                <div style="font-weight: bold; color: #92400e; margin-bottom: 8px; font-size: 14px;">
                    <i class="fas fa-compass" style="margin-right: 5px;"></i>
                    Πλοήγηση στα Βήματα:
                </div>
                <div style="font-size: 13px; color: #78350f; line-height: 1.6;">
                    • Χρησιμοποιήστε την <strong>αριστερή πλευρική μπάρα</strong> για να μεταβείτε μεταξύ βημάτων<br>
                    • Τα ολοκληρωμένα βήματα εμφανίζονται με <strong style="color: #10B981;">✓ πράσινο</strong> σημάδι<br>
                    • Συνεχίστε από εκεί που σταματήσατε!
                </div>
            </div>

            ${completedSteps.length > 0 ? `
                <div style="background: #D1FAE5; padding: 10px; border-radius: 8px; border-left: 4px solid #10B981;">
                    <div style="font-size: 13px; color: #065f46;">
                        <i class="fas fa-check-circle" style="margin-right: 5px;"></i>
                        <strong>Ολοκληρωμένα:</strong> ${completedSteps.join(', ')}
                    </div>
                </div>
            ` : ''}

            <div style="margin-top: 15px; text-align: center; font-size: 12px; color: #64748b;">
                <i class="fas fa-info-circle"></i> Αποθηκεύεται αυτόματα σε κάθε αλλαγή
            </div>
        </div>
    `;

    showToast(message, 'info', 8000);
}

function updateSidebarCompletionIndicators() {
    // Add completion indicators to sidebar steps
    const steps = document.querySelectorAll('.step');

    steps.forEach(step => {
        const stepName = step.dataset.step;
        let isCompleted = false;
        let icon = step.querySelector('i');

        // Determine if step is completed
        switch(stepName) {
            case 'destination':
                isCompleted = state.selectedDestination && state.selectedDays > 0;
                break;
            case 'flight':
            case 'hotel':
                // These are optional external links, always show as available
                isCompleted = false;
                break;
            case 'activities':
                isCompleted = state.selectedActivities.length > 0;
                break;
            case 'summary':
                isCompleted = state.geographicProgram !== null;
                break;
            case 'map':
                isCompleted = state.selectedActivities.length > 0 || (state.customPoints && state.customPoints.length > 0);
                break;
        }

        // Remove existing indicators
        const existingIndicator = step.querySelector('.completion-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Add completion indicator
        if (isCompleted) {
            step.style.position = 'relative';
            const indicator = document.createElement('span');
            indicator.className = 'completion-indicator';
            indicator.innerHTML = '<i class="fas fa-check-circle"></i>';
            indicator.style.cssText = 'position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: #10B981; font-size: 14px;';
            step.appendChild(indicator);

            // Add subtle background to completed steps
            if (!step.classList.contains('active')) {
                step.style.background = 'linear-gradient(90deg, transparent 0%, #D1FAE510 100%)';
            }
        }
    });
}

// ==================== STEP MANAGEMENT ====================
function setupStepNavigation() {
    console.log('📍 Ρύθμιση navigation για βήματα...');
    
    // 1. Για τα κουμπιά στο desktop menu
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', function() {
            const stepName = this.dataset.step;
            console.log(`📱 Επιλογή βήματος: ${stepName}`);
            showStep(stepName);
        });
    });
    
    // 2. Για το mobile dropdown
    const mobileSelector = document.getElementById('mobile-step-selector');
    if (mobileSelector) {
        mobileSelector.addEventListener('change', function() {
            const stepName = this.value;
            if (stepName) {
                console.log(`📱 Mobile επιλογή: ${stepName}`);
                showStep(stepName);
            }
        });
    }
    
    console.log('✅ Step navigation ρυθμίστηκε');
}

function showStep(stepName) {
    console.log(`📱 Εμφάνιση βήματος: ${stepName}`);

    state.currentStep = stepName;
    updateStepUI(stepName);
    loadStepContent(stepName);
    document.getElementById('mobile-step-selector').value = stepName;
    saveState();

    // Update sidebar completion indicators
    updateSidebarCompletionIndicators();

     // 🔵 ΑΠΕΝΕΡΓΟΠΟΙΗΣΗ ΑΥΤΟΜΑΤΟΥ SCROLL
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant'  // Ή 'auto'
        });
    }, 100);
}

function updateStepUI(activeStep) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    const activeElement = document.querySelector(`.step[data-step="${activeStep}"]`);
    if (activeElement) {
        activeElement.classList.add('active');
    }
}
function loadStepContent(stepName) {
    const stepContent = document.getElementById('step-content');

    // Cleanup map when leaving map step (using MapManager)
    if (stepName !== 'map') {
        MapManager.cleanup();
        window.travelMap = null; // Clear global reference
    }

    switch(stepName) {
        case 'destination':
            stepContent.innerHTML = getDestinationStepHTML();
            setupDestinationStep();
            break;
        case 'flight':
            stepContent.innerHTML = getFlightStepHTML();
            break;
        case 'hotel':
            stepContent.innerHTML = getHotelStepHTML();
            // setupHotelStep(); // ΑΠΕΝΕΡΓΟΠΟΙΗΜΕΝΗ - ΔΕΝ ΧΡΕΙΑΖΕΤΑΙ ΠΙΑ
            break;
       case 'activities':
    stepContent.innerHTML = getActivitiesStepHTML();
    setupActivitiesStep();
    break;
        case 'summary':
    stepContent.innerHTML = getSummaryStepHTML();
    // ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΣΥΓΚΕΚΡΙΜΕΝΗ ΣΥΝΑΡΤΗΣΗ, ΟΧΙ setupSummaryStep()
    setTimeout(() => {
        setupSummaryStep();
    }, 50);
    break;
        case 'map':
    stepContent.innerHTML = getMapStepHTML();
    setTimeout(() => {
        if (typeof L !== 'undefined') {
            // ΠΡΟΣΘΕΣΑΜΕ TRY-CATCH ΓΙΑ ΝΑ ΜΗΝ ΚΡΑΣΑΡΕΙ Η ΕΦΑΡΜΟΓΗ
            try {
                initializeMapInStep();
            } catch (error) {
                console.error('❌ Σφάλμα αρχικοποίησης χάρτη:', error);
                document.getElementById('map-container').innerHTML = `
                    <div style="padding: 40px; text-align: center; color: #666;">
                        <i class="fas fa-exclamation-triangle fa-3x"></i>
                        <h3>Σφάλμα φόρτωσης χάρτη</h3>
                        <p>${error.message}</p>
                        <button onclick="showStep('summary')" class="btn btn-primary">
                            <i class="fas fa-arrow-left"></i> Επιστροφή
                        </button>
                    </div>
                `;
            }
        } else {
            console.error('❌ Leaflet library not loaded');
        }
    }, 500);
    break;
    } // Τέλος του switch
    
} // Τέλος της loadStepContent function


// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    document.getElementById('reset-all').addEventListener('click', function() {
        if (confirm('⚠️ Θέλετε να διαγράψετε όλα τα δεδομένα;')) {
            localStorage.clear();
            location.reload();
        }
    });
    
    console.log('✅ Event listeners εγκαταστάθηκαν');
}

// ==================== BUTTON FIX ====================
function fixDestinationButtons() {
    console.log('🔧 Εφαρμογή fix για κουμπιά προορισμού...');
    
    document.addEventListener('click', function(event) {
        let target = event.target;
        
        while (target && !target.classList.contains('btn')) {
            target = target.parentElement;
        }
        
        if (!target) return;
        
        const buttonText = target.textContent || '';
        
        if (buttonText.includes('ΑΝΑΖΗΤΗΣΗ') && buttonText.includes('ΠΡΟΟΡΙΣΜΩΝ')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('🔍 Κουμπί ΑΝΑΖΗΤΗΣΗΣ πατήθηκε');
            filterDestinations();
            return false;
        }
        
        if (buttonText.includes('ΕΧΩ ΗΔΗ ΒΡΕΙ')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('🚀 Κουμπί ΕΧΩ ΗΔΗ ΒΡΕΙ πατήθηκε');
            showManualDestinationModal();
            return false;
        }
        
        if (buttonText.includes('Γρήγορες Προτάσεις')) {
            event.preventDefault();
            event.stopPropagation();
            showQuickRecommendations();
            return false;
        }
        
        if (buttonText.includes('Επαναφορά')) {
            event.preventDefault();
            event.stopPropagation();
            resetFilters();
            return false;
        }
    });
}

// ==================== STEP 1: DESTINATION ====================
function getDestinationStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-map-marked-alt"></i> Επιλογή Προορισμού</h1>
            <p class="card-subtitle">Βρείτε την τέλεια πόλη για τις οικογενειακές σας διακοπές</p>
            
            <div class="grid grid-3">
                <!-- ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΝΕΟ ΦΙΛΤΡΟ ΣΤΗ ΘΕΣΗ ΤΟΥ ΠΑΛΙΟΥ -->
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-baby-carriage"></i> Φιλική για Καρότσι</label>
                    <select class="form-control" id="stroller-friendly-filter">
                        <option value="">Όλες οι πόλεις (προεπιλογή)</option>
                        <option value="true">✅ Ναι, εύκολη πρόσβαση με καρότσι</option>
                        <option value="false">Όχι απαραίτητα</option>
                    </select>
                    <small class="text-muted">Ανοίξιμα πεζοδρόμια, άνετες μετακινήσεις</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-plane"></i> Απόσταση πτήσης</label>
                    <select class="form-control" id="distance">
                        <option value="">Όλες οι αποστάσεις</option>
                        <option value="1.5">Έως 1.5 ώρες</option>
                        <option value="2.5">Έως 2.5 ώρες</option>
                        <option value="5">Έως 5 ώρες</option>
                        <option value="10">Οποιαδήποτε απόσταση</option>
                    </select>
                    <small class="text-muted">Από Αθήνα</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-umbrella-beach"></i> Τύπος Διακοπών</label>
                    <select class="form-control" id="vacation-type">
                        <option value="">Όλοι οι τύποι</option>
                        <option value="Πολιτισμός">🏛️ Πολιτισμός & Μουσεία</option>
                        <option value="Θάλασσα">🏖️ Θάλασσα & Παραλίες</option>
                        <option value="Βουνό">🏔️ Βουνό & Χιονοδρομικά</option>
                        <option value="Φυσική">🌳 Φυσική Ομορφία</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-3">
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-wallet"></i> Επίπεδο Κόστους</label>
                    <select class="form-control" id="cost-level">
                        <option value="">Όλα τα επίπεδα</option>
                        <option value="Οικονομικό">💰 Οικονομικό</option>
                        <option value="Μέτριο">💰💰 Μέτριο</option>
                        <option value="Ακριβό">💰💰💰 Ακριβό</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-ferris-wheel"></i> Θεματικά Πάρκα & Διασκέδαση</label>
                    <select class="form-control" id="theme-parks">
                        <option value="">Όλα (με ή χωρίς)</option>
                        <option value="has-parks">🎡 Με θεματικά πάρκα</option>
                        <option value="disney">👑 Με Disneyland</option>
                    </select>
                    <small class="text-muted">Ιδανικό για οικογένειες με παιδιά</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">&nbsp;</label>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="filterDestinations()" style="flex: 1;">
                            <i class="fas fa-search"></i> Αναζήτηση
                        </button>
                        <button class="btn btn-outline" onclick="resetFilters()" style="flex: 1;">
                            <i class="fas fa-redo"></i> Επαναφορά
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Οι γρήγορες επιλογές, το κουμπί αναζήτησης και τα αποτελέσματα παραμένουν ΑΜΕΤΑΒΛΗΤΑ -->
            <div id="main-buttons-container" style="text-align: center; margin: 30px 0;">
    <button class="btn btn-primary main-already-btn" 
            style="padding: 14px 25px; font-size: 16px; width: 90%; max-width: 300px; border-radius: 8px;">
        <i class="fas fa-map-marker-alt"></i> ΕΧΩ ΗΔΗ ΒΡΕΙ ΠΡΟΟΡΙΣΜΟ
    </button>
    
    <p style="margin-top: 15px; color: var(--gray); font-size: 14px;">
        <i class="fas fa-info-circle"></i> Ή χρησιμοποίησε τα φίλτρα πάνω για αναζήτηση
    </p>
</div>
            
            <div id="destination-results">
                <!-- ΕΔΩ ΘΑ ΕΜΦΑΝΙΖΟΝΤΑΙ ΤΑ ΑΠΟΤΕΛΕΣΜΑΤΑ -->
            </div>
        </div>
    `;
}

function setupDestinationStep() {
    console.log('📍 Ρύθμιση βήματος προορισμού');
    
    if (state.selectedDestination) {
        showSelectedDestination();
    }
    
    fixDestinationButtons();
    
    setTimeout(function() {
        const mainSearchBtn = document.querySelector('.main-search-btn');
        const mainAlreadyBtn = document.querySelector('.main-already-btn');
        
        if (mainSearchBtn) {
            mainSearchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔍 Κεντρικό κουμπί ΑΝΑΖΗΤΗΣΗΣ πατήθηκε');
                filterDestinations();
            });
        }
        
        if (mainAlreadyBtn) {
            mainAlreadyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚀 Κεντρικό κουμπί ΕΧΩ ΗΔΗ ΒΡΕΙ πατήθηκε');
                showManualDestinationModal();
            });
        }
        
        console.log('✅ Κουμπιά εγκαταστάθηκαν');
    }, 100);
}

// ==================== STEP 2: FLIGHT ====================
function getFlightStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-plane"></i> Αναζήτηση Πτήσεων</h1>
            <p class="card-subtitle">Βρείτε τις καλύτερες πτήσεις για το ταξίδι σας</p>
            
            <!-- ΕΝΑ ΜΟΝΟ GRID ΜΕ 2 ΣΤΗΛΕΣ -->
            <div class="grid grid-2">
                <div class="form-group">
                    <label class="form-label">Από</label>
                    <input type="text" class="form-control" value="Αθήνα" readonly>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Προς</label>
                    <input type="text" class="form-control" id="flight-destination" 
                           value="${state.selectedDestination || ''}" ${state.selectedDestination ? 'readonly' : ''}>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <h3 style="margin-bottom: 20px; color: var(--dark);">🔍 Αναζήτηση στις πλατφόρμες:</h3>
                
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
                    <a href="https://www.google.com/flights" target="_blank" class="btn btn-primary" style="min-width: 180px; padding: 14px;">
                        <i class="fas fa-globe"></i> Google Flights
                    </a>
                    
                    <a href="https://www.skyscanner.net" target="_blank" class="btn btn-secondary" style="min-width: 180px; padding: 14px;">
                        <i class="fas fa-plane-departure"></i> Skyscanner
                    </a>
                    
                    <a href="https://www.kayak.com" target="_blank" class="btn btn-accent" style="min-width: 180px; padding: 14px;">
                        <i class="fas fa-search"></i> Kayak
                    </a>
                </div>
                
                <!-- ΚΟΥΜΠΙ ΣΥΝΕΧΕΙΑΣ (ΠΙΟ ΠΑΝΩ ΤΩΡΑ) -->
                <button class="btn btn-primary" onclick="showStep('hotel')" 
                        style="padding: 14px 40px; font-size: 16px; border-radius: 8px;">
                    <i class="fas fa-arrow-right"></i> Συνέχεια στα Ξενοδοχεία
                </button>
            </div>
        </div>
    `;
}

// ==================== STEP 3: HOTEL ====================
function getHotelStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-hotel"></i> Αναζήτηση Ξενοδοχείων</h1>
            
            <!-- ULTRA-COMPACT FORM -->
            <div style="margin-bottom: 20px;">
                <!-- ΠΡΟΟΡΙΣΜΟΣ -->
                <div class="form-group" style="margin-bottom: 12px;">
                    <label class="form-label" style="font-size: 13px;">📍 Προορισμός</label>
                    <input type="text" class="form-control" id="hotel-destination" 
                           value="${state.selectedDestination || ''}" 
                           style="padding: 10px; height: 42px;">
                </div>
                
                <!-- HORIZONTAL ROW -->
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                    <!-- CHECK-IN -->
                    <div style="flex: 1; min-width: 120px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">📅 Check-in</label>
                        <input type="date" class="form-control" id="hotel-checkin" 
                               style="padding: 8px; height: 38px; width: 100%;">
                    </div>
                    
                    <!-- CHECK-OUT -->
                    <div style="flex: 1; min-width: 120px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">📅 Check-out</label>
                        <input type="date" class="form-control" id="hotel-checkout" 
                               style="padding: 8px; height: 38px; width: 100%;">
                    </div>
                    
                    <!-- ΕΝΗΛΙΚΟΙ -->
                    <div style="flex: 1; min-width: 80px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">👨 Ενήλ.</label>
                        <select class="form-control" id="hotel-adults" 
                                style="padding: 8px; height: 38px; width: 100%;">
                            <option value="2" selected>2</option>
                            <option value="1">1</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>
                    
                    <!-- ΠΑΙΔΙΑ -->
                    <div style="flex: 1; min-width: 80px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">🧒 Παιδ.</label>
                        <select class="form-control" id="hotel-children" 
                                style="padding: 8px; height: 38px; width: 100%;">
                            <option value="0" selected>0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>
                    
                    <!-- ΔΩΜΑΤΙΑ -->
                    <div style="flex: 1; min-width: 80px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">🚪 Δωμ.</label>
                        <select class="form-control" id="hotel-rooms" 
                                style="padding: 8px; height: 38px; width: 100%;">
                            <option value="1" selected>1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- ΜΙΚΡΗ ΕΝΔΕΙΞΗ -->
            <div style="background: #fff3cd; padding: 8px 10px; border-radius: 6px; margin: 10px 0; font-size: 12px;">
                <i class="fas fa-external-link-alt" style="color: #ff9800;"></i>
                <span style="margin-left: 5px;">Ανακατεύθυνση σε Booking/Expedia</span>
            </div>

            <!-- ΚΟΥΜΠΙΑ ΜΕ RESPONSIVE DESIGN ΚΑΙ ΚΕΙΜΕΝΑ -->
            <div style="text-align: center; margin: 15px 0;">
                <div class="hotel-buttons-container" style="
                    display: flex; 
                    flex-direction: column; 
                    gap: 8px; 
                    align-items: center;
                ">
                    <!-- BOOKING.COM -->
                    <div style="width: 100%; max-width: 320px;">
                        <button class="btn btn-primary" onclick="searchBookingHotels()" 
                                style="
                                    width: 100%;
                                    padding: 12px 15px; 
                                    font-size: 15px; 
                                    font-weight: 600;
                                    border: none;
                                    border-radius: 8px;
                                ">
                            <i class="fas fa-search"></i> Αναζήτηση σε Booking.com
                        </button>
                    </div>
                    
                    <!-- EXPEDIA -->
                    <div style="width: 100%; max-width: 320px;">
                        <button class="btn" onclick="searchExpediaHotels()" 
                                style="
                                    width: 100%;
                                    padding: 12px 15px; 
                                    font-size: 15px; 
                                    font-weight: 600;
                                    background: linear-gradient(135deg, #ff9800, #ff5722); 
                                    color: white; 
                                    border: none;
                                    border-radius: 8px;
                                ">
                            <i class="fas fa-hotel"></i> Αναζήτηση σε Expedia
                        </button>
                        <div style="
                            font-size: 11px; 
                            color: #555; 
                            background: #f9f9f9; 
                            padding: 6px 8px; 
                            border-radius: 4px; 
                            margin-top: 5px;
                            border-left: 3px solid #ff9800;
                        ">
                            <i class="fas fa-info-circle" style="color: #ff9800; margin-right: 4px;"></i>
                            Αν κλείσεις μέσω EXPEDIA, η εφαρμογή μας θα πάρει μια μικρή προμήθεια 
                            <strong>χωρίς επιπλέον κόστος για σένα</strong>.
                        </div>
                    </div>
                    
                    <!-- TICKETSELLER -->
                    <div style="width: 100%; max-width: 320px;">
                        <button class="btn" onclick="window.open('https://ticketseller.gr/el/home-2/', '_blank')" 
                                style="
                                    width: 100%;
                                    padding: 12px 15px; 
                                    font-size: 15px; 
                                    font-weight: 600;
                                    background: linear-gradient(135deg, #4CAF50, #2E7D32); 
                                    color: white; 
                                    border: none;
                                    border-radius: 8px;
                                ">
                            <i class="fas fa-ticket-alt"></i> Αναζήτηση σε TicketSeller
                        </button>
                        <div style="
                            font-size: 11px; 
                            color: #555; 
                            background: #f9f9f9; 
                            padding: 6px 8px; 
                            border-radius: 4px; 
                            margin-top: 5px;
                            border-left: 3px solid #4CAF50;
                        ">
                            <i class="fas fa-percentage" style="color: #4CAF50; margin-right: 4px;"></i>
                            Αν κλείσεις μέσω <strong>TicketSeller</strong>, έχεις έκπτωση!
                            <br>
                            <small>Στείλε email στο: <strong>takethekids2@gmail.com</strong></small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- MEDIA QUERY ΓΙΑ DESKTOP -->
            <style>
                @media (min-width: 768px) {
                    .hotel-buttons-container {
                        flex-direction: row !important;
                        justify-content: center !important;
                        flex-wrap: wrap !important;
                        gap: 15px !important;
                    }
                    
                    .hotel-buttons-container > div {
                        width: auto !important;
                        min-width: 250px !important;
                        max-width: 280px !important;
                        margin: 0 !important;
                    }
                }
            </style>
            
            <!-- ΣΥΝΕΧΕΙΑ -->
            <div style="text-align: center; margin-top: 15px;">
                <button class="btn btn-primary" onclick="showStep('activities')" 
                        style="padding: 10px 25px; font-size: 14px; border-radius: 8px;">
                    <i class="fas fa-arrow-right"></i> Συνέχεια στις Δραστηριότητες
                </button>
            </div>
        </div>
    `;
}
// ==================== STEP 4: ACTIVITIES ====================
function getActivitiesStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-ticket-alt"></i> Οικογενειακές Δραστηριότητες</h1>
            <p class="card-subtitle">${state.selectedDestination ? 'Επιλέξτε δραστηριότητες για: ' + state.selectedDestination : 'Πρώτα επιλέξτε προορισμό'}</p>
            
            ${!state.selectedDestination ? `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Δεν έχετε επιλέξει προορισμό. Παρακαλώ επιστρέψτε στο βήμα 1.
                    <button class="btn btn-primary" onclick="showStep('destination')" style="margin-top: 10px;">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            ` : `
             <!-- Family Members Section -->
<div class="card" style="background: #f8f9fa; margin-bottom: 30px;">
    <h3><i class="fas fa-users"></i> Τα Μέλη Της Οικογένειας</h3>
    
    <div id="family-members-container" class="family-member-container">
        ${state.familyMembers.map((member, index) => `
            <div class="family-member">
                <!-- Πρώτη γραμμή: Όνομα και Εικονίδιο -->
                <div class="family-member-row">
                    <div class="family-member-icon">
                        ${index === 0 ? '👨' : index === 1 ? '👩' : '🧒'}
                    </div>
                    <input type="text" 
                           class="form-control family-input" 
                           value="${member.name}" 
                           onchange="updateFamilyMemberName(${index}, this.value)"
                           placeholder="Όνομα">
                </div>
                
                <!-- Δεύτερη γραμμή: Ηλικία και Κουμπί Διαγραφής -->
                <div class="family-member-row">
                    <div class="family-age-container">
                        <input type="number" 
                               class="form-control family-input" 
                               value="${member.age}" 
                               min="0" 
                               max="120" 
                               placeholder="Ηλικία"
                               onchange="updateFamilyMemberAge(${index}, this.value)">
                        <span class="age-label">ετών</span>
                    </div>
                    <button class="btn btn-outline family-delete-btn" 
                            onclick="removeFamilyMember(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('')}
    </div>
    
    <!-- Κουμπιά Δράσης -->
    <div class="family-actions">
        <div class="family-add-buttons">
            <button class="btn btn-outline" onclick="addFamilyMember('adult')">
                <i class="fas fa-plus"></i> Προσθήκη Ενήλικα
            </button>
            <button class="btn btn-outline" onclick="addFamilyMember('child')">
                <i class="fas fa-plus"></i> Προσθήκη Παιδιού
            </button>
        </div>
        <button class="btn btn-primary family-update-btn" onclick="updateFamilyMembers()">
            <i class="fas fa-save"></i> Ενημέρωση Οικογένειας
        </button>
    </div>
</div>
              <div style="margin: 20px 0; padding: 12px; background: linear-gradient(to bottom, #f0f9ff, #ffffff); border-radius: 10px; border: 2px solid #E0F2FE; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    
    <!-- ΚΕΦΑΛΙ -->
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <div style="font-size: 24px; color: #4F46E5; background: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            💡
        </div>
        <h4 style="margin: 0; color: #1A202C; font-size: 16px;">
            <i class="fas fa-info-circle" style="color: #4F46E5; margin-right: 6px;"></i> 
            Σημαντικές Πληροφορίες
        </h4>
    </div>
    
    <!-- ΠΕΡΙΕΧΟΜΕΝΟ -->
    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #E2E8F0;">
        
        <!-- ΠΑΡΑΓΡΑΦΟΣ 1 -->
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #e2e8f0;">
            <div style="color: #4F46E5; font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                📊 Οι τιμές είναι ενδεικτικές
            </div>
            <div style="color: #4A5568; font-size: 14px; line-height: 1.5;">
                Μπορεί να υπάρχουν διαφορές λόγω εποχικότητας, προσφορών ή ηλικιακών κατηγοριών.
            </div>
        </div>
        
        <!-- ΠΑΡΑΓΡΑΦΟΣ 2 -->
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #e2e8f0;">
            <div style="color: #10B981; font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                ✅ Προτείνουμε
            </div>
            <div style="color: #4A5568; font-size: 14px; line-height: 1.5;">
                Να ελέγχετε πάντα τις <strong>τελικές τιμές</strong> στα επίσημα site ή στα ταμεία πριν από κράτηση/αγορά.
            </div>
        </div>
        
        <!-- ΠΑΡΑΓΡΑΦΟΣ 3 -->
        <div style="color: #F59E0B; font-size: 13px; line-height: 1.5;">
            <i class="fas fa-lightbulb" style="margin-right: 6px;"></i>
            <strong>Χρήσιμη συμβουλή:</strong> Κλείστε online για καλύτερες τιμές!
        </div>
        
    </div>
</div>
                <!-- Activities Container -->
                <div id="activities-list" class="grid grid-3">
                    <div class="loading" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Φόρτωση δραστηριοτήτων...</p>
                    </div>
                </div>
                
                <!-- Smart Combo Button και Καθαρισμός -->
                <div style="display: flex; flex-direction: column; gap: 12px; margin: 25px 0;">
    
    <!-- Κουμπί 1: Έξυπνο Combo -->
    <button class="btn btn-accent" onclick="calculateSmartCombos()" 
            id="smart-combo-btn"
            style="
                padding: 16px 20px; 
                font-size: 16px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                border: none; 
                border-radius: 10px;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                white-space: nowrap;
            ">
        <i class="fas fa-calculator"></i> 
        <span>🧮 Έξυπνο Combo</span>
    </button>
    
    <!-- Κουμπί 2: Καθαρισμός -->
    <button class="btn btn-outline" onclick="clearSelectedActivities()" 
            style="
                padding: 16px 20px; 
                font-size: 16px; 
                border: 2px solid var(--danger); 
                color: var(--danger);
                background: transparent;
                border-radius: 10px;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                white-space: nowrap;
            ">
        <i class="fas fa-trash-alt"></i> 
        <span>Καθαρισμός Επιλογών</span>
    </button>
    
</div>
                
                <!-- Total Cost -->
                <div class="card" style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; text-align: center; border: none;">
                    <h3 style="color: white; margin-bottom: 10px;">Συνολικό Κόστος</h3>
                    <h1 id="activities-total" style="font-size: 48px; margin: 0;">0€</h1>
                    <p style="opacity: 0.9;">Για ${state.familyMembers.length} άτομα</p>
                </div>
                
                <!-- Next Button -->
                <div style="text-align: center; margin-top: 40px;">
                    <button class="btn btn-primary" onclick="showStep('summary')" style="padding: 18px 50px; font-size: 18px;">
                        <i class="fas fa-arrow-right"></i> Συνέχεια στο Πρόγραμμα
                    </button>
                </div>
            `}
        </div>
    `;
}


// ==================== STEP 5: SUMMARY ====================
function getSummaryStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-route"></i> Γεωγραφικός Προγραμματισμός</h1>
            <p class="card-subtitle">${state.selectedDestination ? 'Ομαδοποίηση δραστηριοτήτων με βάση την τοποθεσία' : 'Δεν έχετε επιλέξει προορισμό'}</p>
            
            ${!state.selectedDestination ? `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Δεν έχετε επιλέξει προορισμό. Παρακαλώ επιστρέψτε στο βήμα 1.
                </div>
            ` : `
                <!-- Επιλογή Ημερών + Κουμπί Δημιουργίας (ΣΕ ΜΙΑ ΓΡΑΜΜΗ) -->
                <div class="card" style="margin: 30px 0; background: #f0f7ff; border-left: 4px solid var(--primary);">
                    <h3><i class="fas fa-calendar-alt"></i> Διάρκεια Ταξιδιού</h3>
                    <p style="color: var(--gray); margin-bottom: 15px;">
                        Επιλέξτε πόσες μέρες θα διαρκέσει το ταξίδι σας. Το πρόγραμμα δημιουργείται αυτόματα.  
                    </p>
                    
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <!-- Dropdown Ημερών -->
                        <select class="form-control" id="program-days" style="flex: 1; min-width: 200px; font-size: 16px; padding: 12px;">
                            <option value="0" ${state.selectedDays === 0 ? 'selected disabled' : 'disabled'}>-- Επιλέξτε μέρες --</option>
                            <option value="2" ${state.selectedDays === 2 ? 'selected' : ''}>2 μέρες</option>
                            <option value="3" ${state.selectedDays === 3 ? 'selected' : ''}>3 μέρες</option>
                            <option value="4" ${state.selectedDays === 4 ? 'selected' : ''}>4 μέρες</option>
                            <option value="5" ${state.selectedDays === 5 ? 'selected' : ''}>5 μέρες</option>
                            <option value="7" ${state.selectedDays === 7 ? 'selected' : ''}>7 μέρες</option>
                            <option value="10" ${state.selectedDays === 10 ? 'selected' : ''}>10 μέρες</option>
                            <option value="14" ${state.selectedDays === 14 ? 'selected' : ''}>14 μέρες</option>
                        </select>
                        
                        <!-- ΚΟΥΜΠΙ ΔΗΜΙΟΥΡΓΙΑΣ -->
                        <button onclick="generateGeographicProgram()" class="btn btn-primary" style="flex: 1; min-width: 200px; padding: 12px 25px; font-size: 16px;">
                            <i class="fas fa-map-marked-alt"></i> ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ
                        </button>
                    </div>
                    
                    <!-- ΜΟΝΟ ΜΙΚΡΟ STATUS -->
                    <div id="days-display" style="margin-top: 10px; font-size: 14px; color: var(--success); font-weight: bold;">
                        ${state.selectedDays > 0 ? '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν' : '⚠️ Επιλέξτε πρώτα μέρες'}
                    </div>
                </div>
                
                <!-- Geographic Program - ΤΩΡΑ ΕΜΦΑΝΙΖΕΤΑΙ ΕΔΩ ΚΑΤΩ -->
                <div class="card" id="geographic-program-section" style="margin-top: 30px; display: none;">
                    <h3><i class="fas fa-route"></i> Γεωγραφικό Πρόγραμμα</h3>
                    
                    <!-- ΕΔΩ ΘΑ ΕΜΦΑΝΙΖΕΤΑΙ ΤΟ ΔΗΜΙΟΥΡΓΗΜΕΝΟ ΠΡΟΓΡΑΜΜΑ -->
                    <div id="geographic-program" 
                         style="min-height: 150px; padding: 20px; border-radius: 15px; background: #f0f7ff; border: 2px dashed var(--primary-light); text-align: center;">
                        
                        ${state.selectedActivities.length === 0 ? `
                            <div style="padding: 40px 20px;">
                                <div style="font-size: 64px; margin-bottom: 20px; color: var(--primary-light);">🗺️</div>
                                <h4 style="color: var(--dark); margin-bottom: 10px;">Δεν υπάρχουν δραστηριότητες</h4>
                                <p style="color: var(--gray); margin-bottom: 20px;">
                                    Επιλέξτε δραστηριότητες για να δημιουργηθεί το γεωγραφικό πρόγραμμα
                                </p>
                            </div>
                        ` : state.selectedDays === 0 ? `
                            <div style="padding: 40px 20px;">
                                <div style="font-size: 64px; margin-bottom: 20px; color: #F59E0B;">📅</div>
                                <h4 style="color: var(--dark); margin-bottom: 10px;">Παρακαλώ επιλέξτε ημέρες</h4>
                                <p style="color: var(--gray); margin-bottom: 20px;">
                                    Επιλέξτε πρώτα πόσες μέρες θα διαρκέσει το ταξίδι σας
                                </p>
                            </div>
                        ` : `
                            <div style="padding: 30px 20px;">
                                <div style="font-size: 48px; margin-bottom: 15px; color: var(--primary);">📍</div>
                                <h4 style="color: var(--dark); margin-bottom: 10px;">Έτοιμο για Προγραμματισμό!</h4>
                                <p style="color: var(--gray); margin-bottom: 20px;">
                                    Πατήστε "ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ" παραπάνω<br>
                                    για να ομαδοποιήσουμε τις ${state.selectedActivities.length} δραστηριότητες<br>
                                    σε ${state.selectedDays} μέρες με βάση την τοποθεσία τους
                                </p>
                            </div>
                        `}
                    </div>
                </div>
                
                <!-- ΚΟΥΜΠΙΑ -->
                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn btn-primary" onclick="showStep('map')" style="margin-right: 10px;">
                        <i class="fas fa-map-marked-alt"></i> Συνέχεια στον Χάρτη
                    </button>
                    <button class="btn btn-outline" onclick="showStep('activities')">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            `}
        </div>
    `;
}

// ==================== ΒΟΗΘΗΤΙΚΗ ΣΥΝΑΡΤΗΣΗ ΓΙΑ GEOGRAPHIC PROGRAM ====================
function getFullActivitiesWithLocation() {
    return state.selectedActivities.map(selected => {
        const original = state.currentCityActivities.find(a => a.id === selected.id);
        return original ? {
            ...selected,
            ...original,
            location: original.location || null
        } : null;
    }).filter(a => a !== null && a.location);
}
function displayGeographicProgram(daysProgram, activityGroups) {
    const programSection = document.getElementById('geographic-program-section');
    const programDiv = document.getElementById('geographic-program');
    
    if (!programSection || !programDiv) {
        console.error('❌ Δεν βρέθηκαν τα στοιχεία για εμφάνιση');
        return;
    }
    
    if (activityGroups.length === 0) {
        programDiv.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px; color: #9CA3AF;">🧭</div>
                <h4 style="color: var(--dark); margin-bottom: 10px;">Δεν βρέθηκαν πληροφορίες τοποθεσίας</h4>
                <p style="color: var(--gray);">
                    Οι επιλεγμένες δραστηριότητες δεν έχουν πληροφορίες τοποθεσίας.<br>
                    Δοκιμάστε να τις δείτε στον χάρτη πρώτα.
                </p>
                <button onclick="showStep('map')" class="btn btn-primary" style="margin-top: 15px;">
                    <i class="fas fa-map"></i> Προβολή στον Χάρτη
                </button>
            </div>
        `;
    } else {
        programDiv.innerHTML = generateProgramHTMLOld(daysProgram, activityGroups);
    }
    
    programSection.style.display = 'block';
    
    // ΑΥΤΟΜΑΤΟ SCROLL ΚΑΙ ANIMATION
    setTimeout(() => {
        if (programSection && programSection.scrollIntoView) {
            programSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start'
            });
        }
    }, 300);
}
function generateProgramHTMLOld(daysProgram, activityGroups) {
    let html = '';
    
    // Εμφάνιση κάθε μέρας
    daysProgram.forEach((day, dayIndex) => {
        const dayNumber = dayIndex + 1;
        const groupCount = day.groups.length;
        const activityCount = day.totalActivities;
        const dayCost = day.totalCost || 0;
        const dayTime = day.estimatedTime || day.groups.reduce((sum, g) => 
            sum + g.activities.reduce((time, a) => time + (parseFloat(a.duration_hours) || 1), 0), 0);
        
        html += `
            <div class="day-card" style="
                margin-bottom: 25px; 
                padding: 20px; 
                background: white; 
                border-radius: 12px; 
                border: 2px solid ${getDayColor(dayNumber)};
                box-shadow: 0 3px 10px rgba(0,0,0,0.08);
            ">
                <!-- ΗΜΕΡΑ HEADER -->
                <div style="
                    background: ${getDayColor(dayNumber)}; 
                    color: white; 
                    padding: 15px; 
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: center;
                ">
                    <h3 style="margin: 0; color: white; font-size: 20px;">
                        ΜΕΡΑ ${dayNumber}
                        <span style="font-size: 14px; opacity: 0.9; margin-left: 10px;">
                            (${activityCount} δραστηριότητα${activityCount !== 1 ? 'τες' : ''})
                        </span>
                    </h3>
                    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 14px;">
                        <span><i class="fas fa-clock"></i> ~${Math.round(dayTime)} ώρες</span>
                        <span><i class="fas fa-euro-sign"></i> ${dayCost.toFixed(2)}€</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${groupCount} περιοχή${groupCount !== 1 ? 'ές' : ''}</span>
                    </div>
                </div>
                
                <!-- ΛΙΣΤΑ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ -->
                <div style="padding: 0 10px;">
                    ${day.groups.map((group, groupIndex) => `
                        <div style="margin-bottom: 20px;">
                            <h4 style="color: var(--dark); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #E5E7EB;">
                                <i class="fas fa-map-pin" style="color: ${getGroupColor(groupIndex)};"></i>
                                Περιοχή ${groupIndex + 1}
                                <span style="font-size: 13px; color: var(--gray); margin-left: 8px;">
                                    (${group.activities.length} δραστηριότητα${group.activities.length !== 1 ? 'τες' : ''})
                                </span>
                            </h4>
                            
                            ${group.activities.map(activity => `
                                <div style="
                                    padding: 12px; 
                                    margin-bottom: 8px; 
                                    background: #F9FAFB; 
                                    border-radius: 8px;
                                    border-left: 3px solid ${getGroupColor(groupIndex)};
                                ">
                                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: bold; color: var(--dark); margin-bottom: 5px;">
                                                ${activity.name}
                                            </div>
                                            <div style="font-size: 13px; color: var(--gray);">
                                                ${activity.category ? `${translateCategory(activity.category)} • ` : ''}
                                                ${activity.duration_hours || '1-2'} ώρες
                                            </div>
                                        </div>
                                        <div style="text-align: right; min-width: 80px;">
                                            <div style="font-weight: bold; color: ${getGroupColor(groupIndex)}; font-size: 18px;">
    ${(activity.price || 0).toFixed(2)}€
</div>
                                               
                                            <div style="font-size: 12px; color: var(--gray);">
                                                <i class="fas fa-clock"></i> ${activity.duration_hours || '?'}h
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
                
                <!-- ΣΥΝΟΛΟ ΜΕΡΑΣ -->
                <div style="
                    margin-top: 20px; 
                    padding: 15px; 
                    background: #F0F9FF; 
                    border-radius: 8px;
                    text-align: center;
                    border: 1px solid ${getDayColor(dayNumber)}40;
                ">
                    <div style="font-weight: bold; color: ${getDayColor(dayNumber)}; margin-bottom: 5px;">
                        <i class="fas fa-check-circle"></i> ΣΥΝΟΛΟ ΜΕΡΑΣ ${dayNumber}
                    </div>
                    <div style="display: flex; justify-content: center; gap: 20px; font-size: 14px; color: var(--gray);">
                        <span>${activityCount} δραστηριότητες</span>
                        <span>•</span>
                        <span>~${Math.round(dayTime)} ώρες</span>
                        <span>•</span>
                        <span>${dayCost.toFixed(2)}€</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    // ΣΥΝΟΛΙΚΟ ΣΤΑΤΙΣΤΙΚΟ
    const totalActivities = daysProgram.reduce((sum, day) => sum + day.totalActivities, 0);
    const totalCost = daysProgram.reduce((sum, day) => sum + (day.totalCost || 0), 0);
    const totalTime = daysProgram.reduce((sum, day) => sum + (day.estimatedTime || 0), 0);
    
    html += `
        <div style="
            margin-top: 30px; 
            padding: 20px; 
            background: linear-gradient(135deg, #1A202C, #2D3748); 
            color: white; 
            border-radius: 12px;
        ">
            <h4 style="color: white; margin-bottom: 15px; text-align: center;">
                <i class="fas fa-chart-bar"></i> ΣΥΝΟΛΙΚΟ ΣΤΑΤΙΣΤΙΚΟ
            </h4>
            <div class="stats-grid">
    <div class="stat-item">
        <div class="stat-number" style="color: #4F46E5;">${state.selectedDays}</div>
        <div class="stat-label">Μέρες</div>
    </div>
    <div class="stat-item">
        <div class="stat-number" style="color: #10B981;">${activityGroups.length}</div>
        <div class="stat-label">Περιοχές</div>
    </div>
    <div class="stat-item">
        <div class="stat-number" style="color: #F59E0B;">${totalActivities}</div>
        <div class="stat-label">Δραστηριότητες</div>
    </div>
    <div class="stat-item">
        <div class="stat-number" style="color: #EF4444;">${totalCost.toFixed(2)}€</div>
        <div class="stat-label">Συνολικό κόστος</div>
    </div>
</div>
            <p style="text-align: center; margin-top: 15px; font-size: 13px; opacity: 0.8;">
                <i class="fas fa-lightbulb"></i> Οι δραστηριότητες ομαδοποιήθηκαν με βάση την απόσταση για ελάχιστες μετακινήσεις
            </p>
        </div>
    `;
    
    return html;
}
// ==================== ΑΠΛΟΠΟΙΗΜΕΝΗ ΣΥΝΑΡΤΗΣΗ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ ====================
function generateGeographicProgram() {
    console.log('🎯 ========== ΑΡΧΗ generateGeographicProgram ==========');
    
    // 🔴 ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: ΔΙΑΒΑΣΕ ΤΙΣ ΗΜΕΡΕΣ ΑΠΟ ΤΟ DROPDOWN
    const daysSelect = document.getElementById('program-days');
    console.log('🔍 Dropdown value:', daysSelect ? daysSelect.value : 'NOT FOUND');
    
    if (!daysSelect) {
        alert('❌ Σφάλμα: Δεν βρέθηκε η επιλογή ημερών.');
        return;
    }
    
    if (!daysSelect.value || daysSelect.value === '0') {
        alert('⚠️ Παρακαλώ επιλέξτε πρώτα πόσες μέρες θα διαρκέσει το ταξίδι');
        return;
    }
    
    // Ενημέρωση state με την τρέχουσα τιμή
    state.selectedDays = parseInt(daysSelect.value);
    console.log('📅 Επιλέχθηκαν:', state.selectedDays, 'μέρες');
    
    console.log('📊 State:', {
        selectedDestinationId: state.selectedDestinationId,
        selectedActivities: state.selectedActivities.length,
        currentCityActivities: state.currentCityActivities?.length || 0,
        selectedDays: state.selectedDays
    });
    
    // Έλεγχος βασικών προϋποθέσεων
    if (state.selectedActivities.length === 0) {
        alert('⚠️ Δεν υπάρχουν επιλεγμένες δραστηριότητες');
        return;
    }
    
    // 🔴 ΝΕΟ ΕΛΕΓΧΟΣ: ΟΧΙ ΠΡΟΓΡΡΑΜΜΑ ΧΩΡΙΣ ΗΛΙΚΙΕΣ
    const hasAnyAge = state.familyMembers.some(member => {
        const age = parseInt(member.age);
        return !isNaN(age) && age >= 0 && age <= 120;
    });
    
    if (!hasAnyAge) {
        alert('⚠️ ΠΡΟΣΟΧΗ: Δεν έχετε εισάγει ηλικίες!\n\nΠαρακαλώ:\n1. Επιστρέψτε στο βήμα "Δραστηριότητες"\n2. Εισάγετε ηλικίες για τουλάχιστον 1 άτομο\n3. Επιστρέψτε εδώ για δημιουργία προγράμματος');
        return;
    }
    
    if (!state.selectedDays || state.selectedDays < 1) {
        alert('⚠️ Παρακαλώ επιλέξτε πρώτα πόσες μέρες θα διαρκέσει το ταξίδι σας');
        return;
    }
    
    console.log(`🗺️ Δημιουργία γεωγραφικού προγράμματος...`);
    console.log(`   📅 Μέρες: ${state.selectedDays}`);
    console.log(`   📊 Δραστηριότητες: ${state.selectedActivities.length}`);
    
    // 1. ΔΙΑΒΑΣΕ ΤΙΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ ΑΠΟ ΤΟ JSON ΑΝ ΔΕΝ ΥΠΑΡΧΟΥΝ
    if (!state.currentCityActivities || state.currentCityActivities.length === 0) {
        console.log('⚠️ currentCityActivities είναι άδειο, προσπαθώ να φορτώσω ξανά...');
        loadActivitiesForProgram();
        return; // Η loadActivitiesForProgram() θα ξανακαλέσει αυτή τη συνάρτηση
    }
    
   // 2. Βρες τις πλήρεις πληροφορίες για τις επιλεγμένες δραστηριότητες
const fullActivities = getFullActivitiesWithLocation();
console.log(`📍 Δραστηριότητες με location: ${fullActivities.length}/${state.selectedActivities.length}`);
    
    console.log(`📍 Δραστηριότητες με location: ${fullActivities.length}/${state.selectedActivities.length}`);
    
    if (fullActivities.length === 0) {
        alert('⚠️ Δεν βρέθηκαν πληροφορίες τοποθεσίας για τις επιλεγμένες δραστηριότητες.\n\nΠαρακαλώ επιστρέψτε στις Δραστηριότητες και επιλέξτε ξανά.');
        return;
    }
    
// 3. ΔΗΜΙΟΥΡΓΙΑ ΓΕΩΓΡΑΦΙΚΩΝ ΣΥΣΤΑΔΩΝ (με νέα συνάρτηση)
let activityGroups = [];

if (fullActivities.length > 0) {
    // Χρησιμοποιούμε την ΝΕΑ σωστή ομαδοποίηση
    activityGroups = groupActivitiesByProximity(fullActivities, 1.5);
    
    // ΛΟΓΗ ΕΝΤΕΛΩΣ ΝΕΑ: Αν έχουμε περισσότερες συστάδες από μέρες
    if (activityGroups.length > state.selectedDays) {
        console.log(`⚠️ Εχουμε ${activityGroups.length} συστάδες αλλα μόνο ${state.selectedDays} μέρες`);
        console.log(`ℹ️ Θα συνενώσουμε τις μικρότερες συστάδες`);
        
        // Ταξινόμηση από μικρότερη προς μεγαλύτερη
        const sortedClusters = [...activityGroups].sort((a, b) => a.count - b.count);
        
        // Συνένωση των μικρότερων συστάδων
        while (sortedClusters.length > state.selectedDays) {
            const smallest = sortedClusters.shift(); // Η μικρότερη
            const secondSmallest = sortedClusters[0]; // Η επόμενη μικρότερη
            
            if (smallest && secondSmallest) {
                // Συνένωσέ τες
                secondSmallest.activities.push(...smallest.activities);
                secondSmallest.count += smallest.count;
                
                // Επανυπολογισμός κέντρου αν έχουν location
                const activitiesWithLoc = secondSmallest.activities.filter(a => a.location);
                if (activitiesWithLoc.length > 0) {
                    secondSmallest.center = [
                        activitiesWithLoc.reduce((sum, a) => sum + a.location.lat, 0) / activitiesWithLoc.length,
                        activitiesWithLoc.reduce((sum, a) => sum + a.location.lng, 0) / activitiesWithLoc.length
                    ];
                }
                
                console.log(`   🔗 Συνένωση: ${smallest.count} + ${secondSmallest.count - smallest.count} = ${secondSmallest.count} δραστηριότητες`);
            }
        }
        
        activityGroups = sortedClusters;
    }
} else {
    // Αν καμία δεν έχει location, δημιούργησε μια ομάδα για κάθε δραστηριότητα
    activityGroups = fullActivities.map(activity => ({
        center: null,
        activities: [activity],
        count: 1,
        radius: 0
    }));
}
    
    console.log(`📍 Βρέθηκαν ${activityGroups.length} γεωγραφικές περιοχές/ομάδες`);
    
    // 4. Αν δεν έχουμε ομάδες, δημιούργησε μία ομάδα για κάθε δραστηριότητα
    if (activityGroups.length === 0) {
        activityGroups = fullActivities.map(activity => ({
            center: null,
            activities: [activity],
            count: 1,
            radius: 0
        }));
    }
    
    // 5. Κατανομή ομάδων στις μέρες που επέλεξε ο χρήστης
    const daysProgram = distributeGroupsToDays(activityGroups, state.selectedDays);
    
    // 7. ΕΜΦΑΝΙΣΗ ΤΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ
displayGeographicProgram(daysProgram, activityGroups);
    // Ενημέρωση status
    const statusDiv = document.getElementById('program-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Δημιουργήθηκε πρόγραμμα ${state.selectedDays} ημερών`;
        statusDiv.style.background = '#D1FAE5';
        statusDiv.style.color = '#065F46';
    }
    
    // Ενημέρωση του days-display
    const daysDisplay = document.getElementById('days-display');
    if (daysDisplay) {
        daysDisplay.textContent = '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν';
        daysDisplay.style.color = 'var(--success)';
    }
    
    // Εμφάνιση μηνύματος
    showToast(`✅ Δημιουργήθηκε γεωγραφικό πρόγραμμα για ${state.selectedDays} μέρες`, 'success');
    // 🔴 ΒΗΜΑ 1: ΑΠΟΘΗΚΕΥΣΗ ΠΡΟΓΡΑΜΜΑΤΟΣ ΓΙΑ ΤΟΝ ΧΑΡΤΗ
    state.geographicProgram = {
        days: daysProgram,           // Το πρόγραμμα ανά ημέρα
        groups: activityGroups,      // Οι ομάδες δραστηριοτήτων
        totalDays: state.selectedDays, // Πόσες μέρες
        generatedAt: new Date().toISOString()
    };
    
    console.log('💾 Αποθηκεύτηκε το πρόγραμμα για τον χάρτη:', {
        daysCount: daysProgram.length,
        totalActivities: fullActivities.length
    });
    console.log(`✅ Το πρόγραμμα δημιουργήθηκε επιτυχώς για ${state.selectedDays} μέρες`);
    console.log('🎯 ========== ΤΕΛΟΣ generateGeographicProgram ==========');
}
// 🔴 ΝΕΑ ΣΥΝΑΡΤΗΣΗ: Φόρτωση δραστηριοτήτων για το πρόγραμμα
// AbortController for cancelling pending fetch requests
let activitiesFetchController = null;

function loadActivitiesForProgram() {
    console.log('🔄 Φόρτωση δραστηριοτήτων για το πρόγραμμα...');

    if (!state.selectedDestinationId) {
        alert('❌ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }

    // Cancel any pending fetch request to prevent race conditions
    if (activitiesFetchController) {
        activitiesFetchController.abort();
    }
    activitiesFetchController = new AbortController();

    fetch(`data/${state.selectedDestinationId}.json`, {
        signal: activitiesFetchController.signal
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        })
        .then(cityData => {
            // Validate data structure
            if (!cityData || !Array.isArray(cityData.activities)) {
                throw new Error('Invalid data structure: missing activities array');
            }

            state.currentCityActivities = cityData.activities;
            console.log('✅ Δραστηριότητες φορτώθηκαν:', state.currentCityActivities.length);

            // Clear the controller since fetch completed
            activitiesFetchController = null;

            // Ξανακάλεσε τη generateGeographicProgram τώρα που έχουμε τα δεδομένα
            setTimeout(() => {
                generateGeographicProgram();
            }, 500);
        })
        .catch(error => {
            // Ignore abort errors (user triggered new fetch)
            if (error.name === 'AbortError') {
                console.log('⚠️ Fetch aborted (new request started)');
                return;
            }
            console.error('❌ Σφάλμα φόρτωσης:', error);
            alert(`⚠️ Δεν μπορούν να φορτωθούν οι δραστηριότητες: ${error.message}`);
            activitiesFetchController = null;
        });
}
// ==================== FORCE REFRESH PROGRAM ====================
function forceRefreshProgram() {
    console.log('🔄 Αναγκαστική ανανέωση προγράμματος');
    
    // Επαναφόρτωση των ημερών από το dropdown
    const daysSelect = document.getElementById('program-days');
    if (daysSelect && daysSelect.value) {
        state.selectedDays = parseInt(daysSelect.value);
        saveState();
    }
    
    // Ενημέρωση UI
    const daysDisplay = document.getElementById('days-display');
    if (daysDisplay) {
        daysDisplay.textContent = '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν';
        daysDisplay.style.color = 'var(--success)';
    }
    
    // Γέμισμα με loading indicator
    const programDiv = document.getElementById('geographic-program');
    if (programDiv) {
        programDiv.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <div class="loading-spinner" style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px auto;
                "></div>
                <h4 style="color: var(--dark); margin-bottom: 10px;">Επαναϋπολογισμός...</h4>
                <p style="color: var(--gray);">Ομαδοποίηση δραστηριοτήτων για ${state.selectedDays} μέρες</p>
            </div>
        `;
    }
    
    // Καλέσε το πρόγραμμα με καθυστέρηση
    setTimeout(() => {
        generateGeographicProgram();
        showToast(`✅ Το πρόγραμμα ανανεώθηκε για ${state.selectedDays} μέρες`, 'success');
    }, 800);
}
// ==================== ΣΥΝΑΡΤΗΣΕΙΣ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΥ ====================

// ΑΝΤΙ για αυτό που έχεις τώρα (γραμμές 2500-2570):
// if (activitiesCount >= 8) neededDays = 3;
// else if (activitiesCount >= 5) neededDays = 2;

// ΚΑΙ το slicing:
// const sliceActivities = group.activities.slice(startIdx, endIdx);

// ΑΛΛΑΞΕ ΤΟ ΣΕ ΑΥΤΟ:
// ==================== IMPROVED BALANCED DISTRIBUTION ALGORITHM ====================
function distributeGroupsToDays(groups, totalDays) {
    console.log(`📅 Βελτιωμένη κατανομή ${groups.length} ομάδων σε ${totalDays} μέρες`);

    if (groups.length === 0 || totalDays < 1) {
        console.error('❌ Μη έγκυρα δεδομένα για κατανομή');
        return [];
    }

    const days = Array.from({ length: totalDays }, () => ({
        groups: [],
        totalActivities: 0,
        totalCost: 0,
        estimatedTime: 0,
        center: null // Geographic center of day's activities
    }));

    // 1. Sort groups by size and geographic spread
    const sortedGroups = [...groups].sort((a, b) => {
        // Prioritize larger groups first for better balance
        if (b.count !== a.count) return b.count - a.count;
        // Then by radius (tighter clusters first)
        return (a.radius || 0) - (b.radius || 0);
    });

    console.log('🎯 ΣΤΟΧΟΣ: Ισορροπημένη κατανομή με γεωγραφική συνοχή');

    // 2. Distribute groups using improved algorithm
    sortedGroups.forEach((group, index) => {
        // Find best day for this group considering:
        // - Activity balance
        // - Time constraints
        // - Geographic proximity to existing groups in the day
        const bestDayIndex = findBestDayForGroup(days, group, totalDays);

        // Add group to best day
        days[bestDayIndex].groups.push(group);
        days[bestDayIndex].totalActivities += group.count;

        // Calculate cost and time
        let groupCost = 0;
        let groupTime = 0;

        group.activities.forEach(activity => {
            groupCost += (parseFloat(activity.price) || 0);
            groupTime += (parseFloat(activity.duration_hours) || 1.5);
        });

        // Travel time within cluster
        const travelTime = (group.activities.length - 1) * 0.3;

        days[bestDayIndex].totalCost += groupCost;
        days[bestDayIndex].estimatedTime += groupTime + travelTime;

        // Update day's geographic center
        days[bestDayIndex].center = calculateDayCenter(days[bestDayIndex].groups);

        console.log(`   📦 Cluster ${index + 1} (${group.count} δρ., ${groupTime.toFixed(1)}h) → Μέρα ${bestDayIndex + 1} (σύνολο: ${days[bestDayIndex].totalActivities} δρ., ${days[bestDayIndex].estimatedTime.toFixed(1)}h)`);
    });

    // 3. Optimize distribution: rebalance if needed
    balanceDaysIfNeeded(days);

    console.log(`✅ Βελτιωμένη κατανομή σε ${totalDays} μέρες:`);
    days.forEach((day, i) => {
        if (day.totalActivities > 0) {
            console.log(`   Μ${i+1}: ${day.groups.length} clusters, ${day.totalActivities} δραστηριότητες, ~${day.estimatedTime.toFixed(1)}h`);
        } else {
            console.log(`   Μ${i+1}: (ελεύθερη μέρα)`);
        }
    });

    return days;
}

// Find the best day for a group considering balance and geography
function findBestDayForGroup(days, group, totalDays) {
    const MAX_ACTIVITIES_PER_DAY = 8;  // Reasonable daily limit
    const MAX_HOURS_PER_DAY = 10;      // Reasonable time limit (excluding breaks)

    let bestDayIndex = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < totalDays; i++) {
        const day = days[i];

        // Skip if this would exceed reasonable limits
        const projectedActivities = day.totalActivities + group.count;
        const projectedTime = day.estimatedTime + (group.activities.length * 1.5);

        if (projectedActivities > MAX_ACTIVITIES_PER_DAY || projectedTime > MAX_HOURS_PER_DAY) {
            continue; // This day is too full
        }

        // Calculate score for this day
        let score = 0;

        // 1. Balance factor: prefer emptier days (higher score for fewer activities)
        const balanceFactor = (MAX_ACTIVITIES_PER_DAY - projectedActivities) * 10;
        score += balanceFactor;

        // 2. Geographic proximity factor: prefer days with nearby groups
        if (day.groups.length > 0 && day.center && group.center) {
            const distanceToDay = calculateDistance(day.center, group.center);
            // Closer groups get higher score (inverse distance)
            const proximityFactor = Math.max(0, 100 - distanceToDay * 10);
            score += proximityFactor;
        } else {
            // If day is empty, give moderate score
            score += 50;
        }

        // 3. Time balance factor: prefer days with more time available
        const timeFactor = (MAX_HOURS_PER_DAY - projectedTime) * 5;
        score += timeFactor;

        if (score > bestScore) {
            bestScore = score;
            bestDayIndex = i;
        }
    }

    return bestDayIndex;
}

// Calculate geographic center of all groups in a day
function calculateDayCenter(groups) {
    const validGroups = groups.filter(g => g.center);
    if (validGroups.length === 0) return null;

    const totalLat = validGroups.reduce((sum, g) => sum + g.center[0], 0);
    const totalLng = validGroups.reduce((sum, g) => sum + g.center[1], 0);

    return [totalLat / validGroups.length, totalLng / validGroups.length];
}

// Rebalance days if there's significant imbalance
function balanceDaysIfNeeded(days) {
    const nonEmptyDays = days.filter(d => d.totalActivities > 0);
    if (nonEmptyDays.length === 0) return;

    const avgActivities = nonEmptyDays.reduce((sum, d) => sum + d.totalActivities, 0) / nonEmptyDays.length;
    const maxImbalance = avgActivities * 1.5; // Allow up to 50% more than average

    // Check if any day is significantly overloaded
    nonEmptyDays.forEach(day => {
        if (day.totalActivities > maxImbalance && day.groups.length > 1) {
            console.log(`   ⚖️ Μέρα με ${day.totalActivities} δραστηριότητες είναι υπερφορτωμένη (μέσος: ${avgActivities.toFixed(1)})`);
            // Could implement splitting logic here if needed, but current algorithm should prevent this
        }
    });

    // Log balance statistics
    const min = Math.min(...nonEmptyDays.map(d => d.totalActivities));
    const max = Math.max(...nonEmptyDays.map(d => d.totalActivities));
    console.log(`   📊 Ισορροπία: ${min}-${max} δραστ/μέρα (μέσος: ${avgActivities.toFixed(1)})`);
}

function getDayColor(dayNumber) {
    return COLOR_PALETTE[(dayNumber - 1) % COLOR_PALETTE.length];
}

function getGroupColor(index) {
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
}


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

                <!-- CUSTOM MAP POINTS SECTION -->
                <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);">
                    <h4 style="margin: 0 0 15px 0; color: var(--dark);">
                        <i class="fas fa-map-marker-alt"></i> Προσθήκη Προσωπικών Σημείων
                    </h4>
                    <p style="color: var(--gray); margin-bottom: 15px; font-size: 14px;">
                        Προσθέστε ξενοδοχείο, εστιατόρια ή άλλα σημεία ενδιαφέροντος στον χάρτη
                    </p>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                        <input type="text"
                               id="custom-point-name"
                               placeholder="π.χ. Hotel Grande, Eiffel Tower"
                               style="flex: 1; min-width: 250px; padding: 10px 15px; border: 2px solid var(--primary-light); border-radius: 8px; font-size: 14px;"
                               onkeypress="if(event.key === 'Enter') addCustomMapPoint()">
                        <button onclick="addCustomMapPoint()" class="btn btn-primary">
                            <i class="fas fa-plus-circle"></i> Προσθήκη
                        </button>
                    </div>

                    <div id="custom-points-status" style="display: none; padding: 8px; background: #fff; border-radius: 6px; font-size: 13px; margin-bottom: 10px;">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span id="custom-points-status-text">Αναζήτηση τοποθεσίας...</span>
                    </div>

                    <!-- List of custom points -->
                    <div id="custom-points-list" style="max-height: 200px; overflow-y: auto;">
                        ${(state.customPoints || []).length > 0 ? state.customPoints.map((point, index) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid var(--accent);">
                                <div>
                                    <i class="fas fa-map-marker-alt" style="color: var(--accent); margin-right: 8px;"></i>
                                    <strong>${point.name}</strong>
                                    <span style="color: var(--gray); font-size: 12px; margin-left: 10px;">
                                        (${point.location.lat.toFixed(4)}, ${point.location.lng.toFixed(4)})
                                    </span>
                                </div>
                                <button onclick="removeCustomPoint(${index})"
                                        class="btn btn-outline"
                                        style="padding: 4px 8px; font-size: 12px;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('') : `
                            <div style="padding: 15px; text-align: center; color: var(--gray); font-size: 13px; background: white; border-radius: 6px; border: 2px dashed #ddd;">
                                <i class="fas fa-map-marked-alt" style="font-size: 24px; opacity: 0.5; margin-bottom: 8px; display: block;"></i>
                                Δεν έχετε προσθέσει προσωπικά σημεία ακόμα
                            </div>
                        `}
                    </div>
                </div>

                <!-- 🔴 ΒΗΜΑ 2: ΦΙΛΤΡΟ ΗΜΕΡΩΝ (ΕΜΦΑΝΙΖΕΤΑΙ ΜΟΝΟ ΑΝ ΥΠΑΡΧΕΙ ΠΡΟΓΡΑΜΜΑ) -->
                ${state.geographicProgram ? `
                <div id="day-filter-container" class="card" style="margin-bottom: 20px; background: #f8f9fa;">
                    <h4 style="margin: 0 0 15px 0; color: var(--dark);">
                        <i class="fas fa-calendar-alt"></i> Εμφάνιση ανά Ημέρα
                    </h4>
                    <p style="color: var(--gray); margin-bottom: 12px; font-size: 14px;">
                        Επιλέξτε ποιες μέρες του προγράμματός σας να εμφανιστούν στον χάρτη:
                    </p>
                    
                    <div id="day-checkboxes" style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; cursor: pointer; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid #ddd;">
                            <input type="checkbox" class="day-checkbox" value="all" checked 
                                   onchange="updateMapDayFilter(this)" 
                                   style="margin-right: 8px;">
                            <span style="font-weight: bold; color: var(--primary);">Όλες οι μέρες</span>
                        </label>
                        
                        ${Array.from({ length: state.geographicProgram.totalDays }, (_, i) => i + 1).map(day => `
                            <label style="display: flex; align-items: center; cursor: pointer; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid ${getDayColor(day)};">
                                <input type="checkbox" class="day-checkbox" value="day${day}" 
                                       onchange="updateMapDayFilter(this)"
                                       style="margin-right: 8px;">
                                <span style="font-weight: bold; color: ${getDayColor(day)};">
                                    Μέρα ${day}
                                </span>
                                <span style="margin-left: 8px; font-size: 12px; color: var(--gray);">
                                    (${state.geographicProgram.days[day-1]?.totalActivities || 0} δραστηριότητες)
                                </span>
                            </label>
                        `).join('')}
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick="selectAllDays()" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;">
                            <i class="fas fa-check-square"></i> Επιλογή όλων
                        </button>
                        <button onclick="deselectAllDays()" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;">
                            <i class="fas fa-square"></i> Αποεπιλογή όλων
                        </button>
                        <button onclick="applyDayFilter()" class="btn btn-primary" style="padding: 6px 12px; font-size: 13px;">
                            <i class="fas fa-filter"></i> Εφαρμογή φίλτρου
                        </button>
                    </div>
                    
                    <div id="day-filter-status" style="margin-top: 10px; padding: 8px; background: #e0f2fe; border-radius: 6px; font-size: 12px; display: none;">
                        <i class="fas fa-sync-alt fa-spin"></i>
                        <span>Ενημέρωση χάρτη...</span>
                    </div>
                </div>
                ` : `
                <!-- Αν δεν υπάρχει πρόγραμμα, εμφάνισε απλή πληροφορία -->
                <div class="alert alert-info" style="margin-bottom: 20px;">
                    <i class="fas fa-info-circle"></i>
                    <strong>Πληροφορία:</strong> Δεν έχετε δημιουργήσει πρόγραμμα στο βήμα 5. 
                    Θα δείτε όλες τις δραστηριότητες μαζί στον χάρτη.
                </div>
                `}
                
<!-- ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ ΧΑΡΤΗ -->
<div class="map-instructions-card" id="map-instructions-card">
    <div class="map-instructions-header">
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-graduation-cap"></i>
            <h4 style="margin: 0;">Οδηγίες Χρήσης Χάρτη</h4>
        </div>
        <button onclick="closeMapInstructions()"
                style="background: none; border: none; color: #666; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;"
                onmouseover="this.style.color='#EF4444'"
                onmouseout="this.style.color='#666'"
                title="Κλείσιμο οδηγιών">
            <i class="fas fa-times"></i>
        </button>
    </div>

    <div class="map-instructions-content">
        <p><i class="fas fa-map-pin" style="color: #4F46E5;"></i>
           <strong>1. Πατήστε "Προβολή Σημείων"</strong> για να φορτώσετε τις δραστηριότητες σας</p>

        <p><i class="fas fa-mouse-pointer" style="color: #10B981;"></i>
           <strong>2. Κάντε κλικ σε 2 πινέζες</strong> για επιλογή
           <span class="step-from">ΑΠΟ</span> και <span class="step-to">ΠΡΟΣ</span></p>

        <p><i class="fas fa-route" style="color: #F59E0B;"></i>
           <strong>3. Η διαδρομή θα σχεδιαστεί αυτόματα</strong> με απόσταση και χρόνους</p>

        <p><i class="fas fa-directions" style="color: #EF4444;"></i>
           <strong>4. Πατήστε στο κουμπί:</strong> Διαδρομή για Google Maps οδηγίες</p>
    </div>

    <div class="map-instructions-tip">
        <i class="fas fa-lightbulb"></i>
        <span>Οι πινέζες γίνονται <span class="step-from">πράσινες</span> για ΑΠΟ και
              <span class="step-to">κόκκινες</span> για ΠΡΟΣ!</span>
    </div>
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
// ==================== MANUAL DESTINATION MODAL ====================
function showManualDestinationModal() {
    console.log('📋 Άνοιγμα dropdown για χειροκίνητη επιλογή');
    
    if (isDropdownVisible && destinationDropdown) {
        closeManualDestinationModal();
        return;
    }
    
    if (!destinationDropdown) {
        createDestinationDropdown();
    }
    
    showDropdownNearButton();
}

function closeManualDestinationModal() {
    if (destinationDropdown) {
        destinationDropdown.style.display = 'none';
    }
    isDropdownVisible = false;
    removeDropdownOverlay();
}

function saveManualDestination() {
    const citySelect = document.getElementById('manual-city-select');
    
    if (!citySelect.value) {
        alert('⚠️ Παρακαλώ επιλέξτε πόλη από τη λίστα');
        return;
    }
    
    const cityName = citySelect.options[citySelect.selectedIndex].text;
    const cityId = citySelect.value;
    
    const citiesWithoutJSON = ['rome', 'barcelona', 'brussels', 'copenhagen', 'dublin', 
                              'edinburgh', 'florence', 'munich', 'venice', 'warsaw', 'zurich'];
    
    if (citiesWithoutJSON.includes(cityId)) {
        const confirmContinue = confirm(
            `ℹ️ Η πόλη "${cityName}" δεν έχει πλήρη υποστήριξη ακόμα.\n\n` +
            `• Δεν υπάρχουν προτεινόμενες δραστηριότητες\n` +
            `• Ο χάρτης μπορεί να μην έχει λεπτομέρειες\n\n` +
            `Θέλετε να συνεχίσετε;`
        );
        
        if (!confirmContinue) {
            return;
        }
    }
    
    // 🔴 ΑΛΛΑΓΗ: ΔΕΝ ΠΑΙΡΝΟΥΜΕ ΗΜΕΡΕΣ ΑΠΟ INPUT
    // Απλά θέτουμε 0 ώστε να επιλέξει ο χρήστης στο βήμα 5
    state.selectedDestination = cityName;
    state.selectedDestinationId = cityId;
    state.selectedDays = 0; // <-- ΒΑΖΟΥΜΕ 0, Ο ΧΡΗΣΤΗΣ ΘΑ ΤΙΣ ΕΠΙΛΕΞΕΙ ΣΤΟ ΒΗΜΑ 5

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
        destDisplay.textContent = cityName;
    }
    updateActivitiesCost();
    
    closeManualDestinationModal();
    
    alert(`✅ Επιλέξατε: ${cityName}\n\nΣυνέχεια στις πτήσεις. Μπορείτε να ορίσετε τις μέρες στο βήμα "Πρόγραμμα".`);
    
    saveState();
    
    setTimeout(() => {
        showStep('flight');
    }, 1000);
}

// ==================== FILTER DESTINATIONS ====================
async function filterDestinations() {
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
            country: 'Πολωνία', vacationType: 'Πολιτισμός',
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
        
        // 4. Φίλτρο τύπου διακοπών
        if (vacationType && city.vacationType !== vacationType) {
            return false;
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

function selectDestination(destinationName, destinationId) {
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
    
    saveState();
}

// ==================== QUICK RECOMMENDATIONS ====================
function showQuickRecommendations() {
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

function resetFilters() {
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

function showPopularDestinations() {
    document.getElementById('distance').value = '3.5';
    document.getElementById('vacationType').value = 'Πόλη';
    filterDestinations();
}

function showBudgetDestinations() {
    document.getElementById('cost-level').value = 'Οικονομικό';
    document.getElementById('distance').value = '2.5';
    filterDestinations();
}

function showFamilyDestinations() {
    console.log('👨‍👩‍👧‍👦 Φιλτράρισμα για οικογένειες');
    
    document.getElementById('theme-parks').value = 'has-parks';
    document.getElementById('cost-level').value = 'Μέτριο';
    document.getElementById('vacation-type').value = 'Πόλη';
    
    filterDestinations();
}

// ==================== SUPPORTING FUNCTIONS ====================
function searchBookingHotels() {
    const destination = document.getElementById('hotel-destination').value;
    const checkin = document.getElementById('hotel-checkin').value;
    const checkout = document.getElementById('hotel-checkout').value;
    const adults = document.getElementById('hotel-adults').value;
    const children = document.getElementById('hotel-children').value;
    const rooms = document.getElementById('hotel-rooms').value;
    
    if (!destination) {
        alert('⚠️ Παρακαλώ επιλέξτε προορισμό πρώτα');
        return;
    }
    
    // Δημιουργία URL για Booking.com
    const bookingUrl = `https://www.booking.com/searchresults.el.html?ss=${encodeURIComponent(destination)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&group_children=${children}&no_rooms=${rooms}`;
    
    // Επιβεβαίωση πριν την ανακατεύθυνση
    const userConfirmed = confirm(
        '🔍 Αναζήτηση Ξενοδοχείων\n\n' +
        `Θα ανοίξει νέα καρτέλα με ταξίδι σε: ${destination}\n` +
        `Check-in: ${checkin} | Check-out: ${checkout}\n` +
        `Άτομα: ${adults} ενήλικοι, ${children} παιδιά | Δωμάτια: ${rooms}\n\n` +
        'Θέλετε να συνεχίσετε στην ιστοσελίδα Booking.com;'
    );
    
    if (userConfirmed) {
        window.open(bookingUrl, '_blank');
    }
}

function searchExpediaHotels() {
    const destination = document.getElementById('hotel-destination').value;
    const checkin = document.getElementById('hotel-checkin').value;
    const checkout = document.getElementById('hotel-checkout').value;
    const adults = document.getElementById('hotel-adults').value;
    const children = document.getElementById('hotel-children').value;
    const rooms = document.getElementById('hotel-rooms').value;
    
    if (!destination) {
        alert('⚠️ Παρακαλώ επιλέξτε προορισμό πρώτα');
        return;
    }
    
    // Σημαντικό: Χρησιμοποιώ το affiliate link
    let expediaBaseUrl = `https://www.anrdoezrs.net/click-101567630-14574920?url=https%3A%2F%2Fwww.expedia.co.uk%2FHotel-Search%3F`;
    
    expediaBaseUrl += `locale=el_GR&currency=EUR`;
    expediaBaseUrl += `&destination=${encodeURIComponent(destination)}`;
    expediaBaseUrl += `&startDate=${checkin}`;
    expediaBaseUrl += `&endDate=${checkout}`;
    expediaBaseUrl += `&adults=${adults}`;
    
    if (children > 0) {
        expediaBaseUrl += `&children=${children}`;
    }
    expediaBaseUrl += `&rooms=${rooms}`;
    
    // Επιβεβαίωση πριν την ανακατεύθυνση
    const userConfirmed = confirm(
        '🏨 Αναζήτηση Ξενοδοχείων - Expedia\n\n' +
        `Προορισμός: ${destination}\n` +
        `Check-in: ${checkin} | Check-out: ${checkout}\n` +
        `Άτομα: ${adults} ενήλικοι, ${children} παιδιά | Δωμάτια: ${rooms}\n\n` +
        'Θα ανοίξει νέα καρτέλα στην ιστοσελίδα Expedia.'
    );
    
    if (userConfirmed) {
        window.open(expediaBaseUrl, '_blank');
    }
}

async function setupActivitiesStep() {
    console.log('🎯 Ρύθμιση βήματος δραστηριοτήτων για:', state.selectedDestinationId);
    
    if (!state.selectedDestinationId) {
        console.log('⚠️ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    const activitiesList = document.getElementById('activities-list');
    if (!activitiesList) {
        console.error('❌ Δεν βρέθηκε activities-list');
        return;
    }
    
    // LOADING INDICATOR
    activitiesList.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
            <div class="loading">
                <i class="fas fa-ticket-alt fa-spin fa-3x" style="color: var(--primary); margin-bottom: 20px;"></i>
                <h3 style="color: var(--dark); margin-bottom: 10px;">Φόρτωση Δραστηριοτήτων</h3>
                <p style="color: var(--gray);">Φόρτωση δραστηριοτήτων για ${state.selectedDestination}...</p>
                <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    Αναζήτηση: <code>data/${state.selectedDestinationId}.json</code>
                </p>
            </div>
        </div>
    `;
    
    try {
        // ΒΗΜΑ: Φόρτωσε το JSON
        console.log(`📂 Προσπαθώ να φορτώσω: data/${state.selectedDestinationId}.json`);
        
        const response = await fetch(`data/${state.selectedDestinationId}.json`);
        
        if (!response.ok) {
            throw new Error(`Δεν βρέθηκε το αρχείο (${response.status})`);
        }
        
        const cityData = await response.json();
        console.log('✅ JSON φορτώθηκε:', cityData.city);
        
        if (!cityData.activities || !Array.isArray(cityData.activities)) {
            throw new Error('Το JSON δεν έχει πίνακα activities');
        }
        
        // Αποθήκευσε τις δραστηριότητες στο state
        state.currentCityActivities = cityData.activities;
        console.log(`📊 Βρέθηκαν ${cityData.activities.length} δραστηριότητες`);
        
        // ΒΗΜΑ: Δημιούργησε τις κάρτες δραστηριοτήτων
        let html = '';
        if (state.currentCityActivities.length === 0) {
            html = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <p>Δεν βρέθηκαν διαθέσιμες δραστηριότητες για την πόλη ${cityData.city}.</p>
                    </div>
                </div>
            `;
       } else {
    // ΤΑΞΙΝΟΜΗΣΗ: TOP πρώτα, μετά οι υπόλοιπες
    const sortedActivities = [...state.currentCityActivities].sort((a, b) => {
        // Αν η a είναι top και η b όχι → a πρώτη
        if (a.top && !b.top) return -1;
        // Αν η b είναι top και η a όχι → b πρώτη
        if (!a.top && b.top) return 1;
        // Αν και οι δύο είναι top ή και οι δύο δεν είναι → αλφαβητική
        return a.name.localeCompare(b.name);
    });
    
    sortedActivities.forEach((activity) => {
        // Υπολόγισε το κόστος για την οικογένεια
        const familyCost = calculateFamilyCost(activity.prices);
        const isSelected = state.selectedActivities.some(a => a.id === activity.id);
        
        html += `
            <div class="activity-card ${isSelected ? 'selected' : ''} ${activity.top ? 'top-activity' : ''}" 
                 onclick="toggleActivitySelection(${activity.id})" 
                 data-activity-id="${activity.id}">
        
        <div class="activity-header">
            <div class="activity-emoji">${getActivityEmoji(activity.category)}</div>
            <div class="activity-title">
                ${activity.name}
                ${activity.top ? '<span class="top-badge"></span>' : ''}
            </div>
            <div class="activity-star">${isSelected ? '⭐' : '☆'}</div>
        </div>
                        
                        <div class="activity-description">
                            ${activity.description || 'Δραστηριότητα για οικογένειες'}
                        </div>
                        
                        <div style="font-size: 12px; color: var(--gray); margin: 10px 0;">
                            <i class="fas fa-clock"></i> ${activity.duration_hours || '?'} ώρες
                            <span style="margin-left: 15px;">
                                <i class="fas fa-tag"></i> ${activity.category || 'Γενική'}
                            </span>
                        </div>
                         <!-- ΚΑΙΝΟΥΡΓΙΟ: ΠΡΟΤΕΙΝΟΜΕΝΟ ΕΣΤΙΑΤΟΡΙΟ -->
            ${activity.restaurant ? `
                <div class="restaurant-recommendation">
                    <div class="restaurant-header">
                        <i class="fas fa-utensils"></i>
                        <span class="restaurant-title">ΣΥΝΙΣΤΩΜΕΝΟ ΕΣΤΙΑΤΟΡΙΟ</span>
                    </div>
                    <div class="restaurant-content">
                        <p>${activity.restaurant.replace(/<a /g, '<a target="_blank" rel="noopener" ')}</p>
                        <small class="restaurant-tip">
                            <i class="fas fa-lightbulb"></i> Κοντινό στην δραστηριότητα, ιδανικό για φαγητό μετά
                        </small>
                    </div>
                </div>
            ` : ''}
                        
                        <!-- ΤΙΜΕΣ -->
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0;">
                            <div style="font-size: 12px; color: var(--gray); margin-bottom: 8px;">
                                <i class="fas fa-money-bill-wave"></i> 
                                ${getPriceInfo(activity.prices)}
                            </div>
                            
                            <!-- ΤΙΜΕΣ ΓΙΑ ΚΑΘΕ ΜΕΛΟΣ ΤΗΣ ΟΙΚΟΓΕΝΕΙΑΣ -->
                            ${state.familyMembers.map(member => {
                                const age = member.age;
                                let price = '?';

                                // Βρες τιμή για την συγκεκριμένη ηλικία
                                if (activity.prices[age] !== undefined) {
                                    price = activity.prices[age] === 0 ? 'ΔΩΡΕΑΝ' : Number(activity.prices[age]).toFixed(2) + '€';
                                }
                                // Για ενήλικες, χρησιμοποίησε 'adult' αν υπάρχει
                                else if (age >= 16 && activity.prices.adult !== undefined) {
                                    price = Number(activity.prices.adult).toFixed(2) + '€';
                                }
                                // Για παιδιά 5-15, ψάξε για κοινές ηλικίες
                                else if (age >= 5 && age <= 15) {
                                    if (activity.prices['10'] !== undefined) {
                                        price = Number(activity.prices['10']).toFixed(2) + '€';
                                    } else if (activity.prices['5'] !== undefined) {
                                        price = Number(activity.prices['5']).toFixed(2) + '€';
                                    }
                                }
                                // Για βρέφη 0-4, χρησιμοποίησε '0'
                                else if (age <= 4 && activity.prices['0'] !== undefined) {
                                    price = activity.prices['0'] === 0 ? 'ΔΩΡΕΑΝ' : Number(activity.prices['0']).toFixed(2) + '€';
                                }
                                
                                return `
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 4px; padding: 2px 0;">
                                    <span>${member.name} (${age}):</span>
                                    <span><strong>${price}</strong></span>
                                </div>`;
                            }).join('')}
                            
                            <!-- ΠΛΗΡΟΦΟΡΙΕΣ ΑΠΟ ΤΟ JSON -->
                            ${activity.notes && activity.notes.length > 0 ? `
                                <div style="font-size: 11px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ddd;">
                                    <i class="fas fa-info-circle"></i>
                                    ${activity.notes.join(' • ')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <!-- ΣΥΝΟΛΙΚΟ ΚΟΣΤΟΣ ΓΙΑ ΟΙΚΟΓΕΝΕΙΑ -->
                        <div class="activity-total" style="background: var(--primary); color: white; padding: 12px; border-radius: 8px; text-align: center; font-weight: bold; margin-top: 10px;">
                            <i class="fas fa-users"></i> ${Number(familyCost).toFixed(2)}€ για ${state.familyMembers.length} άτομα
                        </div>
                    </div>
                `;
            });
        }
        
        activitiesList.innerHTML = html;
        
        // Ενημέρωση συνολικού κόστους
        updateActivitiesTotal();
        
        console.log('✅ Δραστηριότητες εμφανίστηκαν επιτυχώς');
             // 🔴 ΝΕΟ: ΑΠΟΘΗΚΕΥΣΗ ΤΩΝ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ ΓΙΑ ΤΟ ΒΗΜΑ 5
        console.log('💾 Αποθηκεύτηκαν', state.currentCityActivities.length, 'δραστηριότητες για το πρόγραμμα');
        saveState();   
    } catch (error) {
        console.error('❌ Σφάλμα φόρτωσης:', error);
        
        activitiesList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Σφάλμα φόρτωσης δραστηριοτήτων</h4>
                    <p>${error.message}</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
                        <strong>Πληροφορίες σφάλματος:</strong><br>
                        • Αρχείο: <code>data/${state.selectedDestinationId}.json</code><br>
                        • Προορισμός: ${state.selectedDestination || 'Άγνωστο'}<br>
                        • ID: ${state.selectedDestinationId}
                    </div>
                    <button onclick="setupActivitiesStep()" class="btn btn-primary" style="margin-top: 15px;">
                        <i class="fas fa-sync-alt"></i> Δοκιμή ξανά
                    </button>
                    <button onclick="showStep('destination')" class="btn btn-outline" style="margin-top: 15px; margin-left: 10px;">
                        <i class="fas fa-arrow-left"></i> Επιστροφή σε Προορισμό
                    </button>
                </div>
            </div>
        `;
    }
}


function calculateFamilyCost(prices) {
    if (!prices || typeof prices !== 'object') {
        console.log('❌ prices είναι άκυρο:', prices);
        return 0;
    }
    
    console.log('💰 Διαθέσιμες τιμές:', Object.keys(prices).map(k => `${k}: ${prices[k]}€`).join(', '));
    console.log('👨‍👩‍👧‍👦 Μέλη:', state.familyMembers);
    
    let total = 0;
    let membersWithAge = 0;
    
    state.familyMembers.forEach((member) => {
        let age = member.age;
        
        // 🔴 ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Αγνόησε ΤΕΛΕΙΩΣ τα μέλη με κενή/μη έγκυρη ηλικία
        if (age === "" || age === null || age === undefined) {
            console.log(`⚠️ Μέλος "${member.name}" δεν έχει ηλικία - ΑΓΝΟΕΙΤΑΙ ΟΛΟΚΛΗΡΩΣ`);
            return; // Αυτό είναι το κλειδί - επιστροφή χωρίς να προσθέσει τίποτα
        }
        
        age = parseInt(age);
        if (isNaN(age) || age < 0 || age > 120) {
            console.log(`⚠️ Μέλος "${member.name}" έχει μη έγκυρη ηλικία "${member.age}" - ΑΓΝΟΕΙΤΑΙ`);
            return; // Αγνόησε και αυτό
        }
        
        let price = 0;
        
        // Προσπάθησε να βρεις ακριβή τιμή για την ηλικία
        if (prices[age] !== undefined && prices[age] !== null) {
            price = prices[age];
        }
        // Αν δεν βρέθηκε ακριβής τιμή, δοκίμασε γενικές κατηγορίες
        else if (age >= 18 && prices.adult !== undefined) {
            price = prices.adult;
        }
        else if (age >= 5 && age <= 17) {
            if (prices.child !== undefined) {
                price = prices.child;
            } else if (prices['10'] !== undefined) {
                price = prices['10'];
            } else if (prices['5'] !== undefined) {
                price = prices['5'];
            }
        }
        else if (age <= 4 && prices['0'] !== undefined) {
            price = prices['0']; // Μπορεί να είναι 0 (δωρεάν) ή κάποια τιμή
        }
        else {
            // Αν δεν βρέθηκε τιμή, χρησιμοποίησε μια προκαθορισμένη
            console.warn(`⚠️ Δεν βρέθηκε τιμή για ηλικία ${age}. Στο JSON υπάρχουν: ${Object.keys(prices).join(', ')}`);
            price = 0; // Προεπιλογή στο 0 αντί για undefined
        }
        
        total += price;
        membersWithAge++;
        
        console.log(`  👤 ${member.name} (${age}): ${price}€`);
    });
    
    console.log(`💰 Συνολικό κόστος: ${total}€ για ${membersWithAge} από τα ${state.familyMembers.length} άτομα`);
    
    // 🔴 ΕΝΗΜΕΡΩΣΗ: Αν δεν έχουμε κανένα μέλος με έγκυρη ηλικία, επέστρεψε 0
    if (membersWithAge === 0) {
        console.log('⚠️ Κανένα μέλος δεν έχει έγκυρη ηλικία! Επιστροφή 0€');
        return 0;
    }
    
    return total;
}

function toggleActivitySelection(activityId) {
    console.log(`🎫 Toggle activity: ${activityId}`);
    
    const activity = state.currentCityActivities.find(a => a.id === activityId);
    
    if (!activity) {
        console.error('❌ Δραστηριότητα δεν βρέθηκε:', activityId);
        return;
    }
    
    // 🔴 ΒΕΛΤΙΩΣΗ: Υπολόγισε πάντα το κόστος από την αρχή
    const familyCost = calculateFamilyCost(activity.prices);
    
    const existingIndex = state.selectedActivities.findIndex(a => a.id === activityId);
    
    if (existingIndex > -1) {
        state.selectedActivities.splice(existingIndex, 1);
        console.log(`➖ Αφαίρεση: ${activity.name}`);
    } else {
        state.selectedActivities.push({
            id: activityId,
            name: activity.name,
            price: familyCost, // Χρησιμοποίησε την νέα τιμή
            duration: activity.duration_hours,
            category: activity.category
        });
        console.log(`➕ Προσθήκη: ${activity.name} - ${familyCost}€`);
    }
    
    const activityCard = document.querySelector(`.activity-card[data-activity-id="${activityId}"]`);
    if (activityCard) {
        const isNowSelected = state.selectedActivities.some(a => a.id === activityId);
        activityCard.classList.toggle('selected', isNowSelected);
        
        const star = activityCard.querySelector('.activity-star');
        if (star) {
            star.textContent = isNowSelected ? '⭐' : '☆';
        }
    }
    
    updateActivitiesTotal();
    saveState();
}

function updateActivitiesTotal() {
    let total = 0;

    state.selectedActivities.forEach(activity => {
        const price = parseFloat(activity.price);
        total += isNaN(price) ? 0 : price;
    });

    // Add null check for DOM element
    const totalElement = document.getElementById('activities-total');
    if (totalElement) {
        totalElement.textContent = total.toFixed(2) + '€';
    }
    updateActivitiesCost();
}

// Recalculate prices for selected activities when family ages change
function recalculateSelectedActivityPrices() {
    if (!state.currentCityActivities || state.currentCityActivities.length === 0) {
        console.log('⚠️ No city activities loaded, cannot recalculate prices');
        return;
    }

    state.selectedActivities.forEach(selected => {
        const original = state.currentCityActivities.find(a => a.id === selected.id);
        if (original && original.prices) {
            const newPrice = calculateFamilyCost(original.prices);
            if (selected.price !== newPrice) {
                console.log(`💰 Price updated for ${selected.name}: ${selected.price}€ → ${newPrice}€`);
                selected.price = newPrice;
            }
        }
    });

    updateActivitiesTotal();
}


// ==================== STEP 5: SETUP SUMMARY ====================
function setupSummaryStep() {
    console.log('📋 Ρύθμιση summary βήματος');
    
    if (!state.selectedDestination) {
        console.log('⚠️ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    
    // 🔴 ΠΡΟΣΘΗΚΗ: ΑΥΤΟΜΑΤΗ ΠΡΟΤΑΣΗ ΗΜΕΡΩΝ ΑΠΟ ΟΜΑΔΟΠΟΙΗΣΗ
    if (state.selectedActivities.length > 0) {
        const suggestedDays = suggestDaysFromGroups();
        if (suggestedDays > 0 && state.selectedDays !== suggestedDays) {
            console.log(`📅 Πρόταση από ομαδοποίηση: ${suggestedDays} μέρες`);
            
            // Μόνο προτροπή, όχι αυτόματη αλλαγή
            const daysSelect = document.getElementById('program-days');
            if (daysSelect && daysSelect.querySelector(`option[value="${suggestedDays}"]`)) {
                // Μην αλλάξεις αυτόματα, απλά ενημέρωσε
                console.log(`💡 Πρόταση: ${suggestedDays} μέρες`);
            }
        }
    }
    
    setTimeout(() => {
        // 1. Ρύθμιση dropdown ημερών
        const daysSelect = document.getElementById('program-days');
        if (daysSelect) {
            // Βεβαιώσου ότι η τιμή είναι έγκυρη
            daysSelect.value = state.selectedDays;
            
            console.log(`📅 Ρύθμιση dropdown στην τιμή: ${state.selectedDays}`);
            
            // Αφαίρεση παλιών event listeners
            const newDaysSelect = daysSelect.cloneNode(true);
            daysSelect.parentNode.replaceChild(newDaysSelect, daysSelect);
            
            // Προσθήκη νέου event listener
            newDaysSelect.addEventListener('change', function() {
                const selectedDays = parseInt(this.value);
                console.log(`📅 Dropdown changed to: ${selectedDays}`);
                
                if (selectedDays > 0) {
                    state.selectedDays = selectedDays;
                    
                    const daysDisplay = document.getElementById('days-display');
                    if (daysDisplay) {
                        daysDisplay.textContent = '✅ ' + selectedDays + ' μέρες επιλέχθηκαν';
                        daysDisplay.style.color = 'var(--success)';
                    }
                    
                    saveState();
                    
                    console.log(`📅 Αλλαγή μέσω dropdown σε ${selectedDays} μέρες`);
                    
                    // Ενημέρωση status
                    const statusDiv = document.getElementById('program-status');
                    if (statusDiv) {
                        statusDiv.innerHTML = `<i class="fas fa-clock"></i> Ενημερώνεται για ${selectedDays} μέρες`;
                        statusDiv.style.background = '#FEF3C7';
                        statusDiv.style.color = '#92400E';
                    }
                    
                    // 🔴 ΚΡΙΤΙΚΟ: ΜΗΝ καλείς generateGeographicProgram() εδώ!
                    // Απλά ενημέρωσε το UI και περίμενε το κλικ του χρήστη
                    
                    // Εμφάνιση μηνύματος
                    showToast(`📅 Οι ημέρες ενημερώθηκαν σε ${selectedDays}. Πατήστε "Δημιουργία Προγράμματος"`, 'success');
                   // 🔵 🔵 🔵 ΠΡΟΣΘΗΚΗ: Αυτόματη ανανέωση προγράμματος
                }
            });
        }
        
        // 2. Ενημέρωση εμφάνισης ημερών
        const daysDisplay = document.getElementById('days-display');
        if (daysDisplay) {
            daysDisplay.textContent = state.selectedDays > 0 
                ? '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν'
                : '⚠️ Δεν έχετε επιλέξει ακόμα';
            daysDisplay.style.color = state.selectedDays > 0 ? 'var(--success)' : 'var(--warning)';
        }
        
        // 3. Δημιουργία προγράμματος ΜΟΝΟ αν υπάρχουν δραστηριότητες ΚΑΙ μέρες
       // 3. Δημιουργία προγράμματος ΜΟΝΟ αν υπάρχουν δραστηριότητες
if (state.selectedActivities.length > 0) { 
    console.log(`📊 Έτοιμος για δημιουργία προγράμματος: ${state.selectedActivities.length} δραστηριότητες, ${state.selectedDays} μέρες`);
    
    // Εμφάνιση μηνύματος ετοιμότητας, ΟΧΙ loading ή duplicate button
    const programDiv = document.getElementById('geographic-program');
    if (programDiv) {
        programDiv.innerHTML = `
            <div style="padding: 30px 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px; color: var(--primary);">📍</div>
                <h4 style="color: var(--dark); margin-bottom: 10px;">Έτοιμο για Προγραμματισμό!</h4>
                <p style="color: var(--gray); margin-bottom: 20px;">
                    Πατήστε "ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ" παραπάνω<br>
                    για να ομαδοποιήσουμε τις ${state.selectedActivities.length} δραστηριότητες<br>
                    σε ${state.selectedDays} μέρες με βάση την τοποθεσία τους
                </p>
            </div>
        `;
    }
    
    // Ενημέρωση status
    const statusDiv = document.getElementById('program-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Έτοιμο για δημιουργία προγράμματος`;
        statusDiv.style.background = '#D1FAE5';
        statusDiv.style.color = '#065F46';
    }
} else {
    console.log('⚠️ Δεν υπάρχουν αρκετά δεδομένα για πρόγραμμα');
}
        
        // 4. Ενημέρωση συνολικού κόστους
        updateActivitiesCost();
        
        // 5. 🔴 ΚΡΙΤΙΚΟ: Δημιουργία προτεινόμενου προγράμματος
        createSuggestedProgram();
       
            
    }, 100);
}

// ==================== ΒΟΗΘΗΤΙΚΗ ΣΥΝΑΡΤΗΣΗ: CREATE SUGGESTED PROGRAM ====================
function createSuggestedProgram() {
    // Αυτό δημιουργεί ένα απλό προτεινόμενο πρόγραμμα χωρίς να καλεί τη γενική συνάρτηση
     // ΑΣΦΑΛΕΙΑ: Ορισμός COLOR_PALETTE εδώ για την περίπτωση που δεν έχει φορτωθεί
    const COLOR_PALETTE = [
        '#4F46E5', '#10B981', '#F59E0B', '#EF4444', 
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];
    const programDiv = document.getElementById('geographic-program');
    if (!programDiv || state.selectedActivities.length === 0 || state.selectedDays === 0) {
        return;
    }
    
    const activitiesCount = state.selectedActivities.length;
    const daysCount = state.selectedDays;
    const activitiesPerDay = Math.ceil(activitiesCount / daysCount);
    
    let html = `
        <div style="padding: 20px;">
            <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="color: var(--primary); margin-bottom: 10px;">📅 Πρόγραμμα Ταξιδιού</h3>
                <p style="color: var(--gray);">
                    ${activitiesCount} δραστηριότητες διανεμήθηκαν σε ${daysCount} μέρες
                </p>
            </div>
    `;
    
    // Δημιούργησε μια απλή κατανομή
    for (let day = 1; day <= daysCount; day++) {
        const startIndex = (day - 1) * activitiesPerDay;
        const endIndex = Math.min(startIndex + activitiesPerDay, activitiesCount);
        const dayActivities = state.selectedActivities.slice(startIndex, endIndex);
        const dayCost = dayActivities.reduce((sum, act) => sum + (act.price || 0), 0);
        
        html += `
            <div style="
                margin-bottom: 20px; 
                padding: 15px; 
                background: white; 
                border-radius: 10px;
                border-left: 4px solid ${getDayColor(day)};
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="color: ${getDayColor(day)}; margin: 0;">
                        ΜΕΡΑ ${day}
                    </h4>
                    <span style="background: ${getDayColor(day)}20; color: ${getDayColor(day)}; padding: 4px 10px; border-radius: 20px; font-size: 12px;">
                        ${dayActivities.length} δραστηριότητες
                    </span>
                </div>
                
                <div style="margin-top: 10px;">
                    ${dayActivities.map(activity => `
                        <div style="
                            display: flex;
                            justify-content: space-between;
                            padding: 8px 0;
                            border-bottom: 1px solid #f0f0f0;
                        ">
                            <span style="color: var(--dark);">${activity.name}</span>
                            <span style="color: var(--primary); font-weight: bold;">${Number(activity.price || 0).toFixed(2)}€</span>
                        </div>
                    `).join('')}
                </div>

                <div style="
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px dashed #ddd;
                    display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                ">
                    <span>ΣΥΝΟΛΟ ΜΕΡΑΣ:</span>
                    <span style="color: ${getDayColor(day)};">${dayCost.toFixed(2)}€</span>
                </div>
            </div>
        `;
    }
    
    const totalCost = state.selectedActivities.reduce((sum, act) => sum + (act.price || 0), 0);
    
    html += `
            <div style="
                margin-top: 25px; 
                padding: 15px; 
                background: linear-gradient(135deg, var(--primary), #4F46E5); 
                color: white; 
                border-radius: 10px;
                text-align: center;
            ">
                <h4 style="color: white; margin-bottom: 10px;">
                    <i class="fas fa-calculator"></i> ΣΥΝΟΛΙΚΟ ΚΟΣΤΟΣ
                </h4>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="text-align: left;">
                        <div style="font-size: 14px; opacity: 0.9;">${activitiesCount} δραστηριότητες</div>
                        <div style="font-size: 14px; opacity: 0.9;">${daysCount} μέρες</div>
                    </div>
                    <div style="font-size: 36px; font-weight: bold;">${totalCost.toFixed(2)}€</div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 20px;">
                <p style="color: var(--gray); font-size: 13px; margin-top: 10px;">
                    💡 Πατήστε "ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ" παραπάνω για βελτιστοποιημένο πρόγραμμα με βάση τις τοποθεσίες
                </p>
            </div>
        </div>
    `;
    
    programDiv.innerHTML = html;
}

// ==================== ΒΟΗΘΗΤΙΚΗ ΣΥΝΑΡΤΗΣΗ: SUGGEST DAYS FROM GROUPS ====================
function suggestDaysFromGroups() {
    if (state.selectedActivities.length === 0) return 0;
    
    // Πάρε τις πλήρεις πληροφορίες για τις επιλεγμένες δραστηριότητες
    const selectedFullActivities = state.selectedActivities.map(selected => 
        state.currentCityActivities.find(a => a.id === selected.id)
    ).filter(a => a !== undefined);
    
    const groups = groupActivitiesByProximity(selectedFullActivities, 2.0);
    
    if (groups.length === 0) return 0;
    
    // Υπολόγισε προτεινόμενες μέρες
    let suggestedDays = groups.length;
    
    // Αν υπάρχουν πολλές δραστηριότητες σε μία ομάδα, πρόσθεσε μέρες
    groups.forEach(group => {
        if (group.count >= 3) suggestedDays += 1;
        if (group.count >= 5) suggestedDays += 1;
    });
    
    // Μίνιμουμ 2 μέρες, μέγιστο 7
    suggestedDays = Math.max(2, Math.min(suggestedDays, 7));
    
    console.log(`📅 Προτεινόμενες μέρες από ομαδοποίηση: ${suggestedDays}`);
    
    return suggestedDays;
}


// ==================== MAP FUNCTIONS ====================
function setupMapStep() {
    console.log('🗺️ Ρύθμιση χάρτη για:', state.selectedDestination);

    if (!state.selectedDestination) return;

    setTimeout(() => {
        initializeMap();
    }, 300);
}

function closeMapInstructions() {
    const instructionsCard = document.getElementById('map-instructions-card');
    if (instructionsCard) {
        instructionsCard.style.display = 'none';
        console.log('✅ Οδηγίες χάρτη έκλεισαν');
    }
}

function initializeMap() {
    console.log('🗺️ Αρχικοποίηση χάρτη...');
    const mapElement = document.getElementById('map');
    
    if (!mapElement) {
        console.error('❌ Δεν βρέθηκε το map element');
        document.getElementById('map-container').innerHTML = `
            <div style="height: 500px; display: flex; align-items: center; justify-content: center; background: var(--light); color: var(--gray);">
                <div style="text-align: center;">
                    <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom: 15px; color: var(--danger);"></i>
                    <h4>Σφάλμα φόρτωσης χάρτη</h4>
                    <p>Το στοιχείο του χάρτη δεν βρέθηκε</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Καθαρισμός του χάρτη αν υπάρχει ήδη
    if (window.travelMap) {
        try {
            window.travelMap.remove();
            console.log('🗺️ Παλιός χάρτης διαγράφηκε');
        } catch(e) {
            console.log('ℹ️ Δεν υπήρχε ενεργός χάρτης');
        }
    }
    
    // Καθαρισμός των global μεταβλητών
    window.firstPoint = null;
    window.secondPoint = null;
    window.currentRoutePolyline = null;
    window.selectedMarkers = [];
    selectedPointA = null;
    selectedPointB = null;
    currentRouteLine = null;
    
    try {
        if (typeof L === 'undefined') {
            throw new Error('Η βιβλιοθήκη Leaflet δεν φορτώθηκε. Παρακαλώ ανανεώστε τη σελίδα.');
        }
        
        const cityCoords = getCityCoordinates(state.selectedDestinationId);
        
        if (!cityCoords) {
            throw new Error(`Δεν βρέθηκαν συντεταγμένες για την πόλη: ${state.selectedDestination}`);
        }
        
        console.log(`📍 Συντεταγμένες πόλης: ${cityCoords[0]}, ${cityCoords[1]}`);
        
        // Δημιουργία χάρτη
        window.travelMap = L.map('map', {
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
        
        // Προσθήκη fullscreen control (αν υπάρχει η βιβλιοθήκη)
        if (L.control.fullscreen) {
            L.control.fullscreen({
                position: 'topright',
                title: 'Πλήρης οθόνη',
                titleCancel: 'Έξοδος πλήρους οθόνης',
                forceSeparateButton: true
            }).addTo(window.travelMap);
        }
        
        // Προσθήκη custom controls
        const customControl = L.Control.extend({
            options: { position: 'topleft' },
            onAdd: function(map) {
                const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control custom-control');
                container.innerHTML = `
                    <div style="
                        background: white;
                        border-radius: 8px;
                        padding: 8px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        font-family: 'Roboto', sans-serif;
                        font-size: 12px;
                        color: #333;
                        min-width: 180px;
                    ">
                        <div style="display: flex; align-items: center; margin-bottom: 5px;">
                            <div style="width: 12px; height: 12px; background: #4F46E5; border-radius: 50%; margin-right: 8px;"></div>
                            <span>🏙️ Κέντρο πόλης</span>
                        </div>
                        <div style="display: flex; align-items: center; margin-bottom: 5px;">
                            <div style="width: 12px; height: 12px; background: #10B981; border-radius: 50%; margin-right: 8px;"></div>
                            <span>📍 Σημείο ΑΠΟ</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div style="width: 12px; height: 12px; background: #EF4444; border-radius: 50%; margin-right: 8px;"></div>
                            <span>🎯 Σημείο ΠΡΟΣ</span>
                        </div>
                        <hr style="margin: 8px 0; border-color: #eee;">
                        <div style="font-weight: bold; color: #4F46E5; text-align: center;">
                            ${state.selectedDestination}
                        </div>
                    </div>
                `;
                
                // Αποτροπή κλικ στο container να επηρεάζει τον χάρτη
                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });
        
        window.travelMap.addControl(new customControl());
        
        // Προσθήκη loading animation για 1 δευτερόλεπτο (για οπτική επαλήθευση)
        const loadingDiv = L.DomUtil.create('div', 'map-loading-overlay');
        loadingDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            z-index: 1000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-md);
        `;
        loadingDiv.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">🗺️</div>
                <h3 style="color: var(--primary); margin-bottom: 10px;">Φόρτωση Χάρτη</h3>
                <p style="color: var(--gray);">${state.selectedDestination}</p>
                <div class="loading-spinner" style="
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                "></div>
            </div>
        `;
        
        mapElement.appendChild(loadingDiv);
        
        // Αφαίρεση loading animation μετά από 1 δευτερόλεπτο
        setTimeout(() => {
            if (loadingDiv.parentNode) {
                loadingDiv.style.opacity = '0';
                loadingDiv.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (loadingDiv.parentNode) {
                        loadingDiv.remove();
                    }
                }, 300);
            }
            
            // Εμφάνιση οδηγιών χρήσης
            showToast(`
                <div style="max-width: 350px; text-align: left;">
                    <strong style="color: #4F46E5; font-size: 16px;">🗺️ Οδηγίες Χρήσης Χάρτη</strong><br><br>
                    
                    <div style="background: #F0F9FF; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                        <strong>1️⃣ Πρώτα:</strong><br>
                        Κάντε κλικ στο κουμπί <strong>"Προβολή Σημείων"</strong> για να φορτώσετε τις δραστηριότητες
                    </div>
                    
                    <div style="background: #FEF3C7; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                        <strong>2️⃣ Επιλογή:</strong><br>
                        Κάντε κλικ σε 2 πινέζες για να επιλέξετε <span style="color: #10B981;">ΑΠΟ</span> και <span style="color: #EF4444;">ΠΡΟΣ</span>
                    </div>
                    
                    <div style="background: #E0F2FE; padding: 10px; border-radius: 8px;">
                        <strong>3️⃣ Διαδρομή:</strong><br>
                        Θα εμφανιστεί <strong>αυτόματα</strong> με απόσταση, χρόνους και κουμπιά Google Maps
                    </div>
                    
                    <div style="margin-top: 10px; padding: 8px; background: #4F46E5; color: white; border-radius: 6px; text-align: center; font-weight: bold;">
                        🎯 Έτοιμο για χρήση!
                    </div>
                </div>
            `, 'info');
            
            console.log('✅ Χάρτης φορτώθηκε πλήρως');
            
        }, 1000);
        
        // Προσθήκη animation για το marker της πόλης
        setTimeout(() => {
            if (cityMarker && cityMarker._icon) {
                cityMarker._icon.style.animation = 'bounce 0.5s ease 2';
            }
        }, 1500);
        
        // Προσθήκη CSS animations αν δεν υπάρχουν
        if (!document.querySelector('#map-animations')) {
            const style = document.createElement('style');
            style.id = 'map-animations';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-10px) scale(1.1); }
                }
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
                @keyframes pulse-red {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .leaflet-control.custom-control {
                    background: transparent;
                    border: none;
                    box-shadow: none;
                }
                .selected-marker-a {
                    animation: pulse 1.5s infinite !important;
                }
                .selected-marker-b {
                    animation: pulse-red 1.5s infinite !important;
                }
            `;
            document.head.appendChild(style);
        }
        
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
                    <button onclick="initializeMap()" class="btn btn-primary" style="padding: 10px 20px;">
                        <i class="fas fa-sync-alt"></i> Δοκιμή ξανά
                    </button>
                    <button onclick="showStep('summary')" class="btn btn-outline" style="padding: 10px 20px;">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
                <div style="margin-top: 30px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #6f42c1; text-align: left; max-width: 500px;">
                    <strong><i class="fas fa-lightbulb"></i> Συμβουλές επίλυσης:</strong>
                    <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                        <li>Ελέγξτε τη σύνδεση στο internet</li>
                        <li>Ανανεώστε τη σελίδα (F5)</li>
                        <li>Δοκιμάστε άλλο πρόγραμμα περιήγησης</li>
                        <li>Επικοινωνήστε με την υποστήριξη αν το πρόβλημα συνεχίζεται</li>
                    </ul>
                </div>
            </div>
        `;
    }
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
    
    // Καθαρισμός προηγούμενου χάρτη με ασφαλή τρόπο
    if (window.travelMap) {
        try {
            window.travelMap.remove();
        } catch (e) {
            console.warn('⚠️ Error removing previous map:', e);
        }
        window.travelMap = null;
    }

    // Χρήση centralized cleanup για αποφυγή memory leaks
    cleanupMapState();

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

    // Clear all activity markers using MarkerCache
    MarkerCache.clear();

    // Clear selectedMarkers array for backward compatibility
    window.selectedMarkers = [];

    // Note: City marker is managed by MapManager and not affected by MarkerCache

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
function reloadMap() {
    initializeMap();
}

// ==================== CUSTOM MAP POINTS WITH GEOCODING ====================

async function addCustomMapPoint() {
    const input = document.getElementById('custom-point-name');
    const pointName = input ? input.value.trim() : '';

    if (!pointName) {
        showToast('⚠️ Παρακαλώ εισάγετε όνομα σημείου', 'warning');
        return;
    }

    // Show loading status
    showCustomPointStatus('Αναζήτηση τοποθεσίας...', true);

    try {
        // Geocode the point name using Nominatim API
        const location = await geocodeLocation(pointName);

        if (!location) {
            showCustomPointStatus('❌ Δεν βρέθηκε η τοποθεσία. Δοκιμάστε πιο συγκεκριμένο όνομα.', false);
            setTimeout(() => hideCustomPointStatus(), 3000);
            return;
        }

        // Add to state
        if (!state.customPoints) {
            state.customPoints = [];
        }

        const customPoint = {
            id: `custom-${Date.now()}`,
            name: pointName,
            location: location,
            type: 'custom'
        };

        state.customPoints.push(customPoint);

        // Save to localStorage
        saveCustomPoints();

        // Clear input
        if (input) input.value = '';

        // Show success and hide after delay
        showCustomPointStatus(`✅ Προστέθηκε: ${pointName}`, false);
        setTimeout(() => hideCustomPointStatus(), 2000);

        // Refresh the map step to update the list
        renderCurrentStep();

        // If map is loaded, add marker immediately
        if (window.travelMap) {
            addCustomPointToMap(customPoint);
        }

        console.log(`✅ Custom point added: ${pointName} at (${location.lat}, ${location.lng})`);

    } catch (error) {
        console.error('❌ Error adding custom point:', error);
        showCustomPointStatus('❌ Σφάλμα κατά την προσθήκη. Δοκιμάστε ξανά.', false);
        setTimeout(() => hideCustomPointStatus(), 3000);
    }
}

async function geocodeLocation(query) {
    try {
        // Use Nominatim API (OpenStreetMap geocoding - free, no API key needed)
        // Include destination city in query for better results
        const searchQuery = state.selectedDestination ?
            `${query}, ${state.selectedDestination}` :
            query;

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'TakeMyTrip Travel Planner'
            }
        });

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                displayName: data[0].display_name
            };
        }

        return null;

    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

function removeCustomPoint(index) {
    if (!state.customPoints || index < 0 || index >= state.customPoints.length) {
        return;
    }

    const removed = state.customPoints.splice(index, 1)[0];
    console.log(`🗑️ Removed custom point: ${removed.name}`);

    // Save to localStorage
    saveCustomPoints();

    // Refresh the map step to update the list
    renderCurrentStep();

    showToast(`🗑️ Αφαιρέθηκε: ${removed.name}`, 'success');
}

function saveCustomPoints() {
    try {
        localStorage.setItem('travel_custom_points', JSON.stringify(state.customPoints || []));
        console.log('💾 Custom points saved to localStorage');
    } catch (error) {
        console.error('❌ Error saving custom points:', error);
    }
}

function loadCustomPoints() {
    try {
        const saved = localStorage.getItem('travel_custom_points');
        if (saved) {
            state.customPoints = JSON.parse(saved);
            console.log(`📍 Loaded ${state.customPoints.length} custom points from localStorage`);
        }
    } catch (error) {
        console.error('❌ Error loading custom points:', error);
        state.customPoints = [];
    }
}

function showCustomPointStatus(message, isLoading) {
    const statusDiv = document.getElementById('custom-points-status');
    const statusText = document.getElementById('custom-points-status-text');

    if (statusDiv && statusText) {
        statusDiv.style.display = 'block';
        statusText.textContent = message;

        if (isLoading) {
            statusDiv.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${message}</span>`;
        } else {
            statusDiv.innerHTML = `<span>${message}</span>`;
        }
    }
}

function hideCustomPointStatus() {
    const statusDiv = document.getElementById('custom-points-status');
    if (statusDiv) {
        statusDiv.style.display = 'none';
    }
}

function addCustomPointToMap(point) {
    if (!window.travelMap || !point.location) return;

    // Create marker with custom icon
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: '<div style="background: #F59E0B; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 16px;"><i class="fas fa-star"></i></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const marker = L.marker([point.location.lat, point.location.lng], {
        icon: customIcon
    }).addTo(window.travelMap);

    // Create popup
    const popupContent = `
        <div style="max-width: 250px; font-family: 'Roboto', sans-serif; padding: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #F59E0B; font-size: 16px; font-weight: 700;">
                <i class="fas fa-star" style="margin-right: 8px;"></i>
                ${point.name}
            </h4>
            <div style="font-size: 12px; color: #6B7280; background: #FEF3C7; padding: 6px; border-radius: 4px; margin: 8px 0;">
                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                Προσωπικό σημείο
            </div>
            ${point.location.displayName ? `
                <div style="font-size: 11px; color: #9CA3AF; margin-top: 6px;">
                    ${point.location.displayName}
                </div>
            ` : ''}
            <a href="https://www.google.com/maps/search/?api=1&query=${point.location.lat},${point.location.lng}"
               target="_blank"
               rel="noopener"
               style="display: inline-flex; align-items: center; padding: 6px 10px; background: #F59E0B; color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; margin-top: 10px;">
                <i class="fas fa-external-link-alt" style="margin-right: 6px;"></i>
                Google Maps
            </a>
        </div>
    `;

    marker.bindPopup(popupContent);

    console.log(`📍 Added custom point to map: ${point.name}`);
}

// ==================== ENHANCED MAP FUNCTIONS (FROM OLD MAP) ====================
function createEnhancedPopup(activity) {
    console.log('🗺️ Δημιουργία enhanced popup για:', activity.name);
    
    // Google Maps URL για τη δραστηριότητα
    const googleMapsUrl = activity.location ? 
        `https://www.google.com/maps/search/?api=1&query=${activity.location.lat},${activity.location.lng}` :
        `https://www.google.com/maps/search/${encodeURIComponent(activity.name + ' ' + state.selectedDestination)}`;
    
    return `
        <div style="max-width: 300px; font-family: 'Roboto', sans-serif; padding: 8px;">
            <!-- ΤΙΤΛΟΣ -->
            <h4 style="margin: 0 0 8px 0; color: #4F46E5; font-size: 16px; font-weight: 700;">
                <i class="fas fa-map-marker-alt" style="margin-right: 8px;"></i>
                ${activity.name}
            </h4>
            
            <!-- ΠΕΡΙΓΡΑΦΗ -->
            ${activity.description ? `
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #4B5563; line-height: 1.4;">
                ${activity.description}
            </p>` : ''}
            
            <!-- ΚΟΣΤΟΣ -->
            ${activity.price || activity.prices ? `
            <div style="background: rgba(46, 204, 113, 0.1); padding: 8px; border-radius: 6px; margin: 8px 0; font-size: 13px;">
                <i class="fas fa-tag" style="color: #10B981; margin-right: 6px;"></i>
                <strong>Κόστος:</strong> ${activity.price ? Number(activity.price).toFixed(2) + '€' : 'Δείτε τις τιμές'}
            </div>` : ''}
            
            <!-- ΚΑΙΝΟΥΡΓΙΟ: ΠΡΟΤΕΙΝΟΜΕΝΟ ΕΣΤΙΑΤΟΡΙΟ -->
            ${activity.restaurant ? `
            <div style="background: rgba(239, 68, 68, 0.08); padding: 10px; border-radius: 6px; margin: 10px 0; border-left: 3px solid #EF4444;">
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                    <i class="fas fa-utensils" style="color: #EF4444; margin-right: 8px; font-size: 14px;"></i>
                    <strong style="color: #1F2937; font-size: 13px;">Κοντινό Εστιατόριο:</strong>
                </div>
                <div style="font-size: 13px; color: #374151; line-height: 1.4;">
                    ${activity.restaurant.replace(/<a /g, '<a target="_blank" rel="noopener" style="color: #3B82F6; text-decoration: none; font-weight: 600;" ')}
                </div>
                <div style="font-size: 11px; color: #6B7280; margin-top: 6px; display: flex; align-items: center;">
                    <i class="fas fa-lightbulb" style="margin-right: 4px; color: #F59E0B;"></i>
                    Ιδανικό για φαγητό μετά την επίσκεψη
                </div>
            </div>` : ''}
            
            <!-- ΠΛΗΡΟΦΟΡΙΕΣ -->
            <div style="font-size: 12px; color: #6B7280; background: #F9FAFB; padding: 6px; border-radius: 4px; margin: 8px 0;">
                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                ${activity.duration_hours ? `Διάρκεια: ${activity.duration_hours} ώρες • ` : ''}
                ${activity.category ? `Κατηγορία: ${translateCategory(activity.category)}` : ''}
            </div>
            
            <!-- ΚΟΥΜΠΙ GOOGLE MAPS -->
            <a href="${googleMapsUrl}" 
               target="_blank" 
               rel="noopener"
               style="display: inline-flex; align-items: center; padding: 8px 12px; background: #4F46E5; color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; margin-top: 10px;">
                <i class="fas fa-external-link-alt" style="margin-right: 6px;"></i>
                Άνοιγμα Google Maps
            </a>
        </div>
    `;
}


// 4. ΒΕΛΤΙΩΜΕΝΗ showActivityMap() (ΜΕ ΤΑ ΝΕΑ POPUPS ΚΑΙ ΕΝΩΣΕΙΣ)
// ==================== ΒΕΛΤΙΩΜΕΝΗ showActivityMap() ====================
function showActivityMap() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    console.log('📍 Προσθήκη πινέζων για τις επιλεγμένες δραστηριότητες');

    // 1. Sync marker cache (remove only markers no longer needed)
    const currentActivityIds = new Set(state.selectedActivities.map(a => a.id));
    MarkerCache.sync(currentActivityIds);
    
    // 2. Αφαίρεση τυχόν διαδρομών
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }
    
    // 3. Επαναφορά επιλογών
    selectedPointA = null;
    selectedPointB = null;
    
    // 4. Προσθήκη πινέζας για την πόλη
    const cityCoords = getCityCoordinates(state.selectedDestinationId);
    if (cityCoords) {
        L.marker(cityCoords)
            .addTo(window.travelMap)
            .bindPopup(`<b>${state.selectedDestination}</b><br>Κύκλος πόλης`)
            .openPopup();
            
        // Ζουμάρισμα στο κέντρο της πόλης
        window.travelMap.setView(cityCoords, 13);
    }
    
    if (state.selectedActivities.length === 0) {
        alert('⚠️ Δεν έχετε επιλέξει καμία δραστηριότητα ακόμα\n\nΠαρακαλώ πηγαίνετε στο βήμα "Δραστηριότητες" και επιλέξτε κάποιες.');
        return;
    }
    
    let activityCount = 0;
    // markers array already exists globally as window.selectedMarkers

    
    // 5. Προσθήκη πινέζας για ΚΑΘΕ επιλεγμένη δραστηριότητα
    state.selectedActivities.forEach(activity => {
        const fullActivity = state.currentCityActivities.find(a => a.id === activity.id);
        
        let coords;
        let markerTitle = activity.name;
        let activityData = fullActivity || activity;
        
        if (fullActivity && fullActivity.location) {
            // Έχει location στο JSON
            coords = [fullActivity.location.lat, fullActivity.location.lng];
            console.log(`📍 Βρήκα location για ${activity.name}:`, coords);
        } else {
            // Δεν έχει location - χρησιμοποίησε τυχαίες συντεταγμένες κοντά στο κέντρο
            if (cityCoords) {
                const randomLat = cityCoords[0] + (Math.random() - 0.5) * 0.03;
                const randomLng = cityCoords[1] + (Math.random() - 0.5) * 0.03;
                coords = [randomLat, randomLng];
                console.log(`📍 Χωρίς location για ${activity.name} - τυχαίες συντεταγμένες:`, coords);
            } else {
                coords = [51.5074, -0.1278]; // Default: Λονδίνο
            }
            
            // Βεβαιώσου ότι το activityData έχει τα απαραίτητα πεδία
            activityData = {
                ...activityData,
                name: activity.name,
                description: fullActivity?.description || 'Επιλεγμένη δραστηριότητα',
                price: activity.price || 0,
                duration_hours: fullActivity?.duration_hours || '?',
                category: fullActivity?.category || 'attraction',
                location: {
                    lat: coords[0],
                    lng: coords[1]
                }
            };
        }
        
        // Βεβαιώσου ότι το activityData έχει location
        if (!activityData.location) {
            activityData.location = {
                lat: coords[0],
                lng: coords[1]
            };
        }
        
        // Create or reuse marker from cache
        if (!MarkerCache.has(activity.id)) {
            // Marker doesn't exist in cache, create new one
            const marker = createMarkerWithConnectFunction(coords, markerTitle, activityData);
            if (marker) {
                MarkerCache.addOrUpdate(activity.id, marker);
                window.selectedMarkers.push(marker);  // Backward compatibility
                activityCount++;
            }
        } else {
            // Marker already exists in cache, just count it
            activityCount++;
        }
    });
    
    // 6. Αν έχουμε markers, προσπάθησε να ζουμάρεις να τα δείξεις όλα
if (window.selectedMarkers.length > 0 && cityCoords) {
    try {
        // Φίλτραρε μόνο τα έγκυρα markers
        const validMarkers = window.selectedMarkers.filter(marker => 
            marker && typeof marker.getLatLng === 'function'
        );
        
        if (validMarkers.length > 0) {
            // Δημιούργησε bounds που περιλαμβάνουν όλα τα markers
            const bounds = L.latLngBounds([]);
            validMarkers.forEach(marker => {
                bounds.extend(marker.getLatLng());
            });
            
            window.travelMap.fitBounds(bounds.pad(0.1));
            console.log(`✅ Ζουμάρισμα σε ${validMarkers.length} markers`);
        }
    } catch (error) {
        console.error('❌ Σφάλμα ζουμαρίσματος:', error);
        // Απλό ζουμάρισμα στο κέντρο αν αποτύχει
        window.travelMap.setView(cityCoords, 13);
    }
}

    // 7. Display custom points on map
    if (state.customPoints && state.customPoints.length > 0) {
        state.customPoints.forEach(point => {
            addCustomPointToMap(point);
        });
        console.log(`⭐ Added ${state.customPoints.length} custom points to map`);
    }

    // 8. Ενημέρωση χρήστη με τα νέα οδηγία
    showToast(`
        <div style="text-align: left; max-width: 350px;">
            <strong style="font-size: 16px; color: #4F46E5;">🗺️ Οδηγίες Χρήσης Χάρτη</strong><br><br>
            
           <div style="background: #F0F9FF; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
    <strong style="color: #000000;">🎯 Βήμα 1: Επιλογή Σημείων</strong><br>
    <span style="color: #000000;">• Κάντε κλικ σε μια πινέζα για <span style="color: #10B981; font-weight: bold;">ΑΠΟ</span></span><br>
    <span style="color: #000000;">• Κάντε κλικ σε άλλη για <span style="color: #EF4444; font-weight: bold;">ΠΡΟΣ</span></span>
</div>
            
            <div style="background: #FEF3C7; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
    <strong style="color: #000000;">🛣️ Βήμα 2: Διαδρομή</strong><br>
    <span style="color: #000000;">• Η διαδρομή θα σχεδιαστεί <strong>αυτόματα</strong></span><br>
    <span style="color: #000000;">• Θα δείτε απόσταση και χρόνους</span>
</div>
            
           <div style="background: #E0F2FE; padding: 10px; border-radius: 8px;">
    <strong style="color: #000000;">📱 Βήμα 3: Οδηγίες</strong><br>
    <span style="color: #000000;">• Πατήστε κουμπιά Google Maps για <strong>πραγματικές οδηγίες</strong></span><br>
    <span style="color: #000000;">• Επιλέξτε μεταφορικό μέσο (περπάτημα, αυτοκίνητο, ΜΜΜ, ποδήλατο)</span>
</div>
            
            <div style="margin-top: 10px; padding: 8px; background: #4F46E5; color: white; border-radius: 6px; text-align: center; font-weight: bold;">
                ✅ Εμφανίστηκαν ${activityCount} πινέζες
            </div>
        </div>
    `, 'info');
    
    console.log(`✅ Εμφανίστηκαν ${activityCount} πινέζες δραστηριοτήτων`);
}
function getCityCoordinates(cityId) {
    const coordinates = {
        'amsterdam': [52.3702, 4.8952],
        'paris': [48.8566, 2.3522],
        'london': [51.5074, -0.1278],
        'berlin': [52.5200, 13.4050],
        'prague': [50.0755, 14.4378],
        'budapest': [47.4979, 19.0402],
        'vienna': [48.2082, 16.3738],
        'rome': [41.9028, 12.4964],
        'barcelona': [41.3851, 2.1734],
        'madrid': [40.4168, -3.7038],
        'lisbon': [38.7223, -9.1393],
        'istanbul': [41.0082, 28.9784],
        'brussels': [50.8503, 4.3517],
        'copenhagen': [55.6761, 12.5683],
        'dublin': [53.3498, -6.2603],
        'edinburgh': [55.9533, -3.1883],
        'florence': [43.7696, 11.2558],
        'munich': [48.1351, 11.5820],
        'venice': [45.4408, 12.3155],
        'warsaw': [52.2297, 21.0122],
        'krakow': [50.0647, 19.9450],
        'zurich': [47.3769, 8.5417]
    };
    
    if (!coordinates[cityId]) {
        console.error(`❌ Δεν βρέθηκαν συντεταγμένες για πόλη: ${cityId}`);
        return null;
    }
    
    return coordinates[cityId];
}

function showRouteBetweenPoints() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    // ΕΝΗΜΕΡΩΣΗ: Άνοιξε πληροφορίες διαδρομής αν υπάρχουν σημεία
    if (selectedPointA && selectedPointB) {
        // Απλά ανοίγει το popup της διαδρομής
        if (currentRouteLine) {
            currentRouteLine.openPopup();
        }
    } else {
        alert('🛣️ Παρακαλώ επιλέξτε δύο σημεία πρώτα\n\n1. Κάντε κλικ σε μια πινέζα (γίνεται πράσινη)\n2. Κάντε κλικ σε άλλη πινέζα (γίνεται κόκκινη)');
    }
}

// ==================== HELPER FUNCTIONS ====================
function updateActivitiesCost() {
    const totalCost = calculateTotalSpent();
    
    const activitiesTotalEl = document.getElementById('activities-total');
    if (activitiesTotalEl) {
        activitiesTotalEl.textContent = totalCost + '€';
    }
    
    const summarySection = document.querySelector('#selected-activities-section');
    if (summarySection) {
        summarySection.innerHTML += `
            <div style="margin-top: 20px; padding: 15px; background: var(--primary-light); color: white; border-radius: 8px; text-align: center;">
                <h4 style="color: white; margin-bottom: 5px;">
                    <i class="fas fa-money-bill-wave"></i> Συνολικό Κόστος Δραστηριοτήτων
                </h4>
                <h2 style="font-size: 36px; margin: 0;">${totalCost}€</h2>
                <p style="opacity: 0.9; margin: 5px 0 0 0;">
                    Για ${state.familyMembers.length} άτομα
                </p>
            </div>
        `;
    }
    
    console.log('💰 Συνολικό κόστος δραστηριοτήτων:', totalCost + '€');
}

function calculateTotalSpent() {
    let total = 0;
    state.selectedActivities.forEach(activity => {
        total += activity.price || 0;
    });
    return total;
}

function saveState() {
    let data = {
        selectedDestinationName: state.selectedDestination,
        selectedDestinationId: state.selectedDestinationId,
        selectedDaysStay: state.selectedDays,
        familyMembers: state.familyMembers,
        selectedActivities: state.selectedActivities,
        // Persist program data to avoid regenerating after page refresh
        geographicProgram: state.geographicProgram || null,
        currentCityActivities: state.currentCityActivities || [],
        lastSaved: new Date().toISOString()
    };

    // Validate data before saving (defensive programming)
    data = StateValidator.sanitizeData(data);

    try {
        localStorage.setItem('travelPlannerData', JSON.stringify(data));
    } catch (error) {
        console.error('❌ Failed to save state:', error);
        // Handle quota exceeded
        if (error.name === 'QuotaExceededError') {
            console.warn('⚠️ localStorage quota exceeded, clearing old data');
            // Clear program data to save space
            data.geographicProgram = null;
            data.currentCityActivities = [];
            try {
                localStorage.setItem('travelPlannerData', JSON.stringify(data));
            } catch (e) {
                console.error('❌ Still cannot save state:', e);
            }
        }
    }
}

function getActivityEmoji(category) {
    const emojiMap = {
        'attraction': '🎡',
        'castle': '🏰',
        'museum': '🏛️',
        'landmark': '🗼',
        'theme_park': '🎢',
        'zoo': '🐯',
        'aquarium': '🐠',
        'garden': '🌳',
        'palace': '👑',
        'church': '⛪',
        'tower': '🗼',
        'wheel': '🎡',
        'bridge': '🌉',
        'square': '⛲',
        'cruise': '🚢',
        'tour': '🚌',
        'experience': '🎭',
        'art': '🎨',
        'history': '📜',
        'science': '🔬',
        'nature': '🌿'
    };
    
    return emojiMap[category] || '📍';
}

// ==================== FAMILY FUNCTIONS ====================
function updateFamilyMemberName(index, name) {
    state.familyMembers[index].name = name;
}

function updateFamilyMemberAge(index, age) {
    if (age === "" || isNaN(parseInt(age))) {
        state.familyMembers[index].age = "";
    } else {
        state.familyMembers[index].age = parseInt(age);
    }
    // Recalculate prices when ages change (fixes stale prices issue)
    recalculateSelectedActivityPrices();
}

function addFamilyMember(type) {
    const newMember = {
        name: type === 'adult' ? 'Νέο Μέλος' : 'Νέο Παιδί',
        age: type === 'adult' ? 30 : 10
    };
    state.familyMembers.push(newMember);
    recalculateSelectedActivityPrices(); // Recalculate with new member
    showStep('activities');
}

function removeFamilyMember(index) {
    if (state.familyMembers.length > 0) {
        state.familyMembers.splice(index, 1);
        recalculateSelectedActivityPrices(); // Recalculate with removed member
        showStep('activities');
        console.log(`➖ Αφαιρέθηκε μέλος. Μένησαν: ${state.familyMembers.length} άτομα`);
    } else {
        alert("ℹ️ Δεν υπάρχουν άλλα μέλη για διαγραφή");
    }
}

function updateFamilyMembers() {
    console.log('👨‍👩‍👧‍👦 Ενημέρωση οικογενειακών μελών...');
    
    // 1. Φίλτραρε κενά μέλη
    const originalLength = state.familyMembers.length;
    state.familyMembers = state.familyMembers.filter(member => {
        const hasValidName = member.name && member.name.trim() !== "";
        const ageNum = parseInt(member.age);
        const hasValidAge = !isNaN(ageNum) && ageNum >= 0 && ageNum <= 120;
        return hasValidName && hasValidAge;
    });
    
    // 2. Αποθήκευση
    saveState();
    
    // 3. Ανανέωση τιμών επιλεγμένων δραστηριοτήτων
    state.selectedActivities.forEach(activity => {
        const original = state.currentCityActivities.find(a => a.id === activity.id);
        if (original) {
            activity.price = calculateFamilyCost(original.prices);
        }
    });
    
    // 4. Ανανέωση εμφάνισης
    updateActivitiesTotal();
    
    // 5. Επαναφόρτωση βήματος (αν είναι ανοιχτό)
    if (state.currentStep === 'activities') {
        setTimeout(() => {
            setupActivitiesStep();
        }, 100);
    }
    
    // 6. Μήνυμα
    const removed = originalLength - state.familyMembers.length;
    alert(`✅ Ενημέρωση ολοκληρώθηκε!\n\n` +
          (removed > 0 ? `🧹 Αφαιρέθηκαν ${removed} κενά μέλη.\n\n` : '') +
          `👨‍👩‍👧‍👦 Τώρα έχετε ${state.familyMembers.length} έγκυρα μέλη.`);
}

// ==================== SMART COMBO CALCULATOR ====================
function calculateSmartCombos() {
    console.log('🧮 Έναρξη έξυπνου υπολογισμού combo...');
    
    // ΕΛΕΓΧΟΙ:
    if (!state.selectedActivities || state.selectedActivities.length === 0) {
        alert('⚠️ Δεν έχετε επιλέξει δραστηριότητες!\n\nΠαρακαλώ επιλέξτε πρώτα δραστηριότητες από τη λίστα.');
        return;
    }
    
    if (!state.familyMembers || state.familyMembers.length === 0) {
        alert('⚠️ Δεν έχετε ορίσει τα μέλη της οικογένειας!\n\nΠαρακαλώ ενημερώστε τις ηλικίες στο βήμα των Δραστηριοτήτων.');
        return;
    }
    
    if (!state.selectedDestination) {
        alert('⚠️ Δεν έχετε επιλέξει προορισμό!\n\nΠαρακαλώ επιλέξτε πρώτα προορισμό.');
        return;
    }
    
    console.log('📊 Δεδομένα για combo υπολογισμό:', {
        activities: state.selectedActivities.length,
        familyMembers: state.familyMembers.length,
        destination: state.selectedDestination
    });
    
    // ΔΗΜΙΟΥΡΓΙΑ LOADING STATE
    const activitiesList = document.getElementById('activities-list');
    if (activitiesList) {
        activitiesList.innerHTML += `
            <div id="combo-calculating" style="grid-column: 1/-1; text-align: center; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin: 20px 0;">
                <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; margin: 0 auto 20px; animation: spin 1s linear infinite;"></div>
                <h3 style="margin: 0 0 10px 0; color: white;">🧮 Υπολογισμός Combos...</h3>
                <p style="margin: 0; opacity: 0.9;">
                    Αναζήτηση καλύτερων εκπτωτικών πακέτων για ${state.selectedActivities.length} δραστηριότητες
                </p>
            </div>
        `;
    }
    
    // ΚΛΗΣΗ ΤΗΣ ΠΡΑΓΜΑΤΙΚΗΣ ΣΥΝΑΡΤΗΣΗΣ ΑΠΟ ΤΟ combo-calculator.js
    // (Αυτή η κλήση γίνεται όταν το combo-calculator.js έχει φορτωθεί)
    setTimeout(() => {
        try {
            // Αν η συνάρτηση υπάρχει στο global scope
            if (typeof window.calculateSmartCombosReal === 'function') {
                console.log('🎯 Καλείται η πραγματική συνάρτηση combo...');
                window.calculateSmartCombosReal();
            } else {
                // Διαφορετικά, δείξε μήνυμα
                alert('ℹ️ Η λειτουργία combo υπολογισμού βρίσκεται υπό ανάπτυξη.\n\nΣύντομα θα ενσωματώσουμε έξυπνα πακέτα για: Disneyland, Merlin Pass, κλπ.');
                simulateComboCalculation();
            }
        } catch (error) {
            console.error('❌ Σφάλμα combo υπολογισμού:', error);
            alert('⚠️ Προσωρινό σφάλμα στον υπολογισμό combos.\n\nΠαρακαλώ δοκιμάστε ξανά ή επικοινωνήστε με την υποστήριξη.');
        }
        
        // Αφαίρεση loading
        const loadingDiv = document.getElementById('combo-calculating');
        if (loadingDiv) loadingDiv.remove();
        
    }, 1500);
}

// ΠΡΟΣΩΡΙΝΗ ΣΥΝΑΡΤΗΣΗ ΜΕΧΡΙ ΝΑ ΕΝΣΩΜΑΤΩΘΕΙ ΤΟ combo-calculator.js
function simulateComboCalculation() {
    if (!state.selectedActivities || state.selectedActivities.length < 2) {
        alert('ℹ️ Χρειάζονται τουλάχιστον 2 επιλεγμένες δραστηριότητες για combo υπολογισμό.');
        return;
    }
    
    // Υπολογισμός τρέχοντος κόστους
    const currentCost = state.selectedActivities.reduce((sum, activity) => sum + (activity.price || 0), 0);
    
    // Προσομοίωση έκπτωσης
    let discount = 0;
    let comboName = '';
    
    if (state.selectedActivities.length >= 3) {
        discount = currentCost * 0.15; // 15% έκπτωση
        comboName = '🎁 Πακέτο 3+ Δραστηριοτήτων';
    } else if (state.selectedActivities.length === 2) {
        discount = currentCost * 0.10; // 10% έκπτωση
        comboName = '🤝 Διπλό Πακέτο';
    }
    
    const newCost = currentCost - discount;
    
    // Δημιουργία modal με τα αποτελέσματα
    const modalHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Roboto', sans-serif;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <h2 style="color: var(--primary); text-align: center; margin-top: 0;">
                    🧮 Αποτελέσματα Έξυπνου Combo
                </h2>
                
                <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: var(--dark); margin-top: 0;">${comboName}</h3>
                    
                    <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 10px; background: white; border-radius: 8px;">
                        <span><strong>Κανονικό Κόστος:</strong></span>
                        <span style="color: var(--danger); text-decoration: line-through; font-weight: bold;">
                            ${currentCost.toFixed(2)}€
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 10px; background: white; border-radius: 8px;">
                        <span><strong>Έκπτωση:</strong></span>
                        <span style="color: var(--success); font-weight: bold;">
                            -${discount.toFixed(2)}€
                        </span>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 15px; background: linear-gradient(135deg, var(--primary), #4F46E5); color: white; border-radius: 8px;">
                        <span><strong>Νέο Κόστος:</strong></span>
                        <span style="font-size: 24px; font-weight: bold;">
                            ${newCost.toFixed(2)}€
                        </span>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <p style="color: var(--gray); font-size: 14px;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Συμβουλή:</strong> Για περισσότερες επιλογές combos, επιλέξτε δραστηριότητες από την ίδια εταιρεία ή πόλη.
                    </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="applyComboDiscount(${discount})" style="
                        padding: 12px 30px;
                        background: var(--primary);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-right: 10px;
                    ">
                        ✅ Εφαρμογή Έκπτωσης
                    </button>
                    
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        padding: 12px 30px;
                        background: var(--light);
                        color: var(--dark);
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                    ">
                        Κλείσιμο
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Προσθήκη modal στο DOM
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
}

// ΣΥΝΑΡΤΗΣΗ ΓΙΑ ΕΦΑΡΜΟΓΗ ΕΚΠΤΩΣΗΣ
function applyComboDiscount(discount) {
    console.log(`💰 Εφαρμογή έκπτωσης: ${discount}€`);
    
    // Ενημέρωση state
    state.selectedActivities.forEach(activity => {
        // Εφαρμογή αναλογικής έκπτωσης σε κάθε δραστηριότητα
        const originalPrice = activity.price || 0;
        const discountPercentage = discount / state.selectedActivities.reduce((sum, act) => sum + (act.price || 0), 0);
        activity.discountedPrice = originalPrice * (1 - discountPercentage);
    });
    
    // Ενημέρωση εμφάνισης
    updateActivitiesTotal();
    
    // Κλείσιμο modal
    document.querySelectorAll('[style*="position: fixed"][style*="background: rgba(0,0,0,0.8)"]').forEach(el => el.remove());
    
    // Εμφάνιση μηνύματος επιτυχίας
    showToast(`✅ Εφαρμόστηκε έκπτωση ${discount.toFixed(2)}€! Το νέο κόστος είναι ${calculateTotalSpent().toFixed(2)}€`, 'success');
}

function clearSelectedActivities() {
    if (state.selectedActivities.length === 0) {
        alert('ℹ️ Δεν έχετε επιλέξει καμία δραστηριότητα!');
        return;
    }
    
    if (confirm('⚠️ Θέλετε να καταργήσετε ΟΛΕΣ τις επιλεγμένες δραστηριότητες;')) {
        state.selectedActivities = [];
        
        document.querySelectorAll('.activity-card.selected').forEach(card => {
            card.classList.remove('selected');
            const star = card.querySelector('.activity-star');
            if (star) star.textContent = '☆';
        });
        
        updateActivitiesTotal();
        saveState();
        
        alert('✅ Οι επιλογές καθαρίστηκαν!');
    }
}

// ==================== DROPDOWN FUNCTIONS ====================
let destinationDropdown = null;
let isDropdownVisible = false;

function createDestinationDropdown() {
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'destination-dropdown-container';
    dropdownContainer.style.cssText = `
        position: fixed;
        z-index: 1000;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        width: 380px;
        max-width: 90vw;
        padding: 20px;
        border: 2px solid #4F46E5;
        display: none;
        animation: fadeIn 0.3s ease;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    `;
    
    if (!document.querySelector('#dropdown-animation')) {
        const style = document.createElement('style');
        style.id = 'dropdown-animation';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -48%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
        `;
        document.head.appendChild(style);
    }
    
    dropdownContainer.innerHTML = `
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="margin: 0; color: #1A202C; font-size: 18px;">
                <i class="fas fa-map-marker-alt" style="color: #4F46E5; margin-right: 8px;"></i>
                Επιλογή Προορισμού
            </h3>
            <button class="modal-close" onclick="closeManualDestinationModal()" 
                    style="background: none; border: none; font-size: 24px; cursor: pointer; color: #718096; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                &times;
            </button>
        </div>
        
        <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" style="display: block; margin-bottom: 8px; color: #1A202C; font-weight: 500;">
                Επιλέξτε Πόλη Από Την Λίστα Μας
            </label>
            <select class="form-control" id="manual-city-select" 
                    style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; background: white;">
                <option value="">-- Επιλέξτε πόλη --</option>
               <optgroup label="✅ Πλήρης Υποστήριξη">
    <option value="amsterdam">Άμστερνταμ (Ολλανδία)</option>
    <option value="vienna">Βιέννη (Αυστρία)</option>
    <option value="berlin">Βερολίνο (Γερμανία)</option>
    <option value="budapest">Βουδαπέστη (Ουγγαρία)</option>
    <option value="istanbul">Κωνσταντινούπολη (Τουρκία)</option>
    <option value="lisbon">Λισαβόνα (Πορτογαλία)</option>
    <option value="london">Λονδίνο (ΗΒ)</option>
    <option value="madrid">Μαδρίτη (Ισπανία)</option>
    <option value="paris">Παρίσι (Γαλλία)</option>
    <option value="prague">Πράγα (Τσεχία)</option>
</optgroup>
<optgroup label="🛠️ Σύντομα Διαθέσιμες">
    <option value="barcelona">Βαρκελώνη (Ισπανία)</option>
    <option value="warsaw">Βαρσοβία (Πολωνία)</option>
    <option value="brussels">Βρυξέλλες (Βέλγιο)</option>
    <option value="venice">Βενετία (Ιταλία)</option>
    <option value="dublin">Δουβλίνο (Ιρλανδία)</option>
    <option value="edinburgh">Εδιμβούργο (Σκωτία)</option>
    <option value="zurich">Ζυρίχη (Ελβετία)</option>
    <option value="copenhagen">Κοπεγχάγη (Δανία)</option>
    <option value="krakow">Κρακοβία (Πολωνία)</option>
    <option value="munich">Μόναχο (Γερμανία)</option>
    <option value="rome">Ρώμη (Ιταλία)</option>
    <option value="florence">Φλωρεντία (Ιταλία)</option>
 </optgroup>
            </select>
            <small style="display: block; margin-top: 6px; color: #666; font-size: 13px;">
                Μόνο πόλεις από την λίστα μας. ✅ = πλήρης υποστήριξη, 🛠️ = σύντομα
            </small>
        </div>  
              
        <div style="display: flex; gap: 12px; margin-top: 25px;">
            <button onclick="saveManualDestination()" 
                    style="flex: 1; padding: 14px; background: #4F46E5; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i class="fas fa-check"></i>
                Αποθήκευση Προορισμού
            </button>
            <button onclick="closeManualDestinationModal()" 
                    style="flex: 1; padding: 14px; background: white; color: #1A202C; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <i class="fas fa-times"></i>
                Ακύρωση
            </button>
        </div>
    `;
    
    document.body.appendChild(dropdownContainer);
    destinationDropdown = dropdownContainer;
    
    document.addEventListener('click', function(event) {
        if (isDropdownVisible && destinationDropdown && 
            !destinationDropdown.contains(event.target) && 
            !event.target.closest('.main-already-btn')) {
            closeManualDestinationModal();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (isDropdownVisible && event.key === 'Escape') {
            closeManualDestinationModal();
        }
    });
}

function showDropdownNearButton() {
    if (!destinationDropdown) return;
    
    destinationDropdown.style.display = 'block';
    isDropdownVisible = true;
    addDropdownOverlay();
}

function addDropdownOverlay() {
    let overlay = document.querySelector('.dropdown-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'dropdown-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            animation: fadeIn 0.3s ease;
        `;
        overlay.onclick = closeManualDestinationModal;
        document.body.appendChild(overlay);
    }
}

function removeDropdownOverlay() {
    const overlay = document.querySelector('.dropdown-overlay');
    if (overlay) {
        overlay.remove();
    }
}

function showSelectedDestination() {
    console.log('📍 Επιλεγμένος προορισμός:', state.selectedDestination);
}

// ==================== GEOGRAPHIC PLANNING HELPERS ====================
function translateCategory(cat) {
    const translations = {
        'attraction': 'Αξιοθέατα',
        'museum': 'Μουσεία',
        'landmark': 'Μνημεία',
        'theme_park': 'Πάρκα',
        'zoo': 'Ζωολογικός',
        'palace': 'Ανάκτορα',
        'church': 'Εκκλησίες',
        'garden': 'Πάρκα/Κήποι',
        'science': 'Επιστήμη'
    };
    return translations[cat] || cat;
}

function getActivityIcon(category) {
    const icons = {
        'museum': 'fa-university',
        'science': 'fa-flask',
        'art': 'fa-palette',
        'history': 'fa-landmark',
        'theme_park': 'fa-ferris-wheel',
        'zoo': 'fa-paw',
        'garden': 'fa-tree',
        'attraction': 'fa-star'
    };
    return icons[category] || 'fa-map-marker-alt';
}
// ==================== ΥΠΟΛΟΓΙΣΜΟΣ ΑΠΟΣΤΑΣΗΣ ====================
function calculateDistance(point1, point2) {
    const R = 6371; // Ακτίνα Γης σε km
    
    const lat1 = point1[0] * Math.PI / 180;
    const lat2 = point2[0] * Math.PI / 180;
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Απόσταση σε km
}



// ==================== PROGRAM DAYS UPDATE (FIXED) ====================
function updateProgramDays() {
    const daysSelect = document.getElementById('program-days');
    if (!daysSelect) return;
    
    const selectedValue = daysSelect.value;
    
    if (!selectedValue || selectedValue === '0') {
        alert('⚠️ Παρακαλώ επιλέξτε αριθμό ημερών από το dropdown');
        return;
    }
    
    const selectedDays = parseInt(selectedValue);
    
    if (selectedDays > 0) {
        state.selectedDays = selectedDays;
        
        const daysDisplay = document.getElementById('days-display');
        if (daysDisplay) {
            daysDisplay.textContent = '✅ ' + selectedDays + ' μέρες επιλέχθηκαν';
            daysDisplay.style.color = 'var(--success)';
        }
        
        saveState();
        
        // 🚨 ΑΦΑΙΡΕΣΑ ΤΗΝ ΚΛΗΣΗ: generateGeographicProgram();
        // Τώρα η generateGeographicProgram() θα καλείται ΜΟΝΟ όταν ο χρήστης πατήσει "ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ"
        
        console.log(`📅 Ενημέρωση ημερών σε: ${selectedDays}`);
        
        showToast(`📅 Οι ημέρες ενημερώθηκαν σε ${selectedDays}. Πατήστε "Δημιουργία Προγράμματος"`, 'success');
    }
}
// ==================== IMPROVED GROUP ACTIVITIES BY PROXIMITY ====================
function groupActivitiesByProximity(activities, maxDistanceKm = 2) {
    console.log(`📍 Βελτιωμένη ομαδοποίηση ${activities.length} δραστηριοτήτων (έως ${maxDistanceKm} km)`);

    if (!activities || activities.length === 0) {
        console.log('⚠️ Δεν υπάρχουν δραστηριότητες για ομαδοποίηση');
        return [];
    }

    // Φίλτραρε μόνο δραστηριότητες με valid location
    const activitiesWithLocation = activities.filter(activity =>
        activity && activity.location &&
        typeof activity.location.lat === 'number' &&
        typeof activity.location.lng === 'number' &&
        !isNaN(activity.location.lat) &&
        !isNaN(activity.location.lng)
    );

    // Activities without location - create individual groups for them
    const activitiesWithoutLocation = activities.filter(activity =>
        !activity || !activity.location ||
        typeof activity.location.lat !== 'number' ||
        typeof activity.location.lng !== 'number'
    );

    console.log(`📊 ${activitiesWithLocation.length} από ${activities.length} έχουν τοποθεσία`);

    // Use improved DBSCAN-like clustering for better geographic grouping
    const groups = clusterActivitiesDBSCAN(activitiesWithLocation, maxDistanceKm);

    // Add activities without location as individual groups
    activitiesWithoutLocation.forEach(activity => {
        if (activity) {
            console.log(`⚠️ Activity without location: ${activity.name}`);
            groups.push({
                center: null,
                activities: [activity],
                count: 1,
                radius: 0
            });
        }
    });

    console.log(`✅ Δημιουργήθηκαν ${groups.length} ομάδες με βελτιωμένο clustering`);

    return groups;
}

// ==================== DBSCAN-LIKE CLUSTERING ALGORITHM ====================
function clusterActivitiesDBSCAN(activities, maxDistanceKm) {
    if (activities.length === 0) return [];

    const groups = [];
    const processed = new Set();
    const noise = [];

    // For each unprocessed activity
    for (let i = 0; i < activities.length; i++) {
        if (processed.has(i)) continue;

        const activity = activities[i];
        const neighbors = findNeighbors(activities, i, maxDistanceKm);

        // If not enough neighbors, mark as noise (will be singleton group)
        if (neighbors.length === 0) {
            noise.push(activity);
            processed.add(i);
            continue;
        }

        // Create new cluster
        const cluster = [activity];
        processed.add(i);

        // Expand cluster with neighbors
        const queue = [...neighbors];
        while (queue.length > 0) {
            const neighborIdx = queue.shift();

            if (processed.has(neighborIdx)) continue;
            processed.add(neighborIdx);

            const neighbor = activities[neighborIdx];
            cluster.push(neighbor);

            // Find neighbors of this neighbor (expansion)
            const neighborNeighbors = findNeighbors(activities, neighborIdx, maxDistanceKm);
            for (const nnIdx of neighborNeighbors) {
                if (!processed.has(nnIdx) && !queue.includes(nnIdx)) {
                    queue.push(nnIdx);
                }
            }
        }

        // Create group from cluster
        groups.push({
            center: calculateGroupCenter(cluster),
            activities: cluster,
            count: cluster.length,
            radius: calculateClusterRadius(cluster)
        });

        console.log(`   🎯 Cluster ${groups.length}: ${cluster.length} δραστηριότητες (${cluster.map(a => a.name).join(', ')})`);
    }

    // Add noise activities as singleton groups
    noise.forEach(activity => {
        groups.push({
            center: [activity.location.lat, activity.location.lng],
            activities: [activity],
            count: 1,
            radius: 0
        });
    });

    return groups;
}

// Find all neighbors within maxDistance
function findNeighbors(activities, index, maxDistanceKm) {
    const neighbors = [];
    const activity = activities[index];

    for (let i = 0; i < activities.length; i++) {
        if (i === index) continue;

        const distance = calculateDistance(
            [activity.location.lat, activity.location.lng],
            [activities[i].location.lat, activities[i].location.lng]
        );

        if (distance <= maxDistanceKm) {
            neighbors.push(i);
        }
    }

    return neighbors;
}

// Calculate actual radius of cluster (max distance from center)
function calculateClusterRadius(activities) {
    if (activities.length <= 1) return 0;

    const center = calculateGroupCenter(activities);
    if (!center) return 0;

    let maxRadius = 0;
    activities.forEach(activity => {
        const distance = calculateDistance(
            center,
            [activity.location.lat, activity.location.lng]
        );
        maxRadius = Math.max(maxRadius, distance);
    });

    return maxRadius;
}

// Βοηθητική συνάρτηση για υπολογισμό κέντρου ομάδας
function calculateGroupCenter(activities) {
    if (!activities || activities.length === 0) return null;

    // Filter only activities with valid location data
    const validActivities = activities.filter(a =>
        a && a.location &&
        typeof a.location.lat === 'number' &&
        typeof a.location.lng === 'number' &&
        !isNaN(a.location.lat) &&
        !isNaN(a.location.lng)
    );

    if (validActivities.length === 0) {
        console.warn('⚠️ No valid locations found in group');
        return null;
    }

    if (validActivities.length === 1) {
        return [validActivities[0].location.lat, validActivities[0].location.lng];
    }

    let totalLat = 0;
    let totalLng = 0;

    validActivities.forEach(activity => {
        totalLat += activity.location.lat;
        totalLng += activity.location.lng;
    });

    return [totalLat / validActivities.length, totalLng / validActivities.length];
}
// NOTE: getGroupColor is defined earlier in the file (uses COLOR_PALETTE)
// Συνάρτηση για εμφάνιση ομαδοποιημένων δραστηριοτήτων στο χάρτη
function showGroupedActivitiesOnMap() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    if (state.selectedActivities.length === 0) {
        alert('Δεν έχετε επιλέξει καμία δραστηριότητα');
        return;
    }
    
    // Πάρε τις πλήρεις πληροφορίες για τις επιλεγμένες δραστηριότητες
    const selectedFullActivities = state.selectedActivities.map(selected => 
        state.currentCityActivities.find(a => a.id === selected.id)
    ).filter(a => a !== undefined);
    
    // Ομαδοποίησε με βάση την τοποθεσία
    const groups = groupActivitiesByProximity(selectedFullActivities, 1.5); // 1.5 km radius
    
    if (groups.length === 0) {
        alert('Δεν βρέθηκαν ομάδες δραστηριοτήτων');
        return;
    }
    
    // Καθαρισμός χάρτη και selectedMarkers array
    window.travelMap.eachLayer(layer => {
        if (layer instanceof L.Marker) window.travelMap.removeLayer(layer);
    });
    window.selectedMarkers = []; // Clear array to prevent memory leak

    // Προσθήκη κάθε ομάδας στον χάρτη
    groups.forEach((group, index) => {
        // Skip groups without valid center
        if (!group.center || !Array.isArray(group.center) || group.center.length !== 2) {
            console.warn(`⚠️ Skipping group ${index + 1} - invalid center:`, group.center);
            return;
        }

        const color = getGroupColor(index);

        // Προσθήκη marker για το κέντρο της ομάδας
        const groupMarker = L.marker(group.center, {
            icon: L.divIcon({
                html: `
                    <div style="
                        background: ${color}; 
                        color: white; 
                        width: 60px; 
                        height: 60px; 
                        border-radius: 50%; 
                        display: flex; 
                        align-items: center; 
                        justify-content: center;
                        font-weight: bold;
                        font-size: 20px;
                        border: 3px solid white;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                        cursor: pointer;
                    ">
                        ${group.count}📍
                    </div>
                `,
                iconSize: [60, 60],
                iconAnchor: [30, 60]
            })
        }).addTo(window.travelMap);
        
        // Popup για την ομάδα
        let popupContent = `
            <div style="max-width: 300px; padding: 10px;">
                <h4 style="margin: 0 0 10px 0; color: ${color};">
                    <i class="fas fa-layer-group"></i> Ομάδα ${index + 1}
                </h4>
                <p style="margin: 0 0 15px 0; color: #666;">
                    <strong>${group.count} δραστηριότητες</strong> σε ακτίνα ${group.radius} km
                </p>
        `;
        
        group.activities.forEach((activity, i) => {
            popupContent += `
                <div style="
                    padding: 8px; 
                    margin-bottom: 5px; 
                    background: #f8f9fa; 
                    border-radius: 6px;
                    border-left: 3px solid ${color};
                ">
                    <strong>${i + 1}. ${activity.name}</strong><br>
                    <small style="color: #666;">
                        <i class="fas fa-clock"></i> ${activity.duration_hours || '?'} ώρες • 
                        <i class="fas fa-tag"></i> ${activity.price || '0'}€
                    </small>
                </div>
            `;
        });
        
        popupContent += `
                <hr style="margin: 10px 0;">
                <div style="font-size: 12px; color: #888; text-align: center;">
                    <i class="fas fa-lightbulb"></i> <strong>Συμβουλή:</strong> Επισκεφτείτε όλες σε μία μέρα!
                </div>
            </div>
        `;
        
        groupMarker.bindPopup(popupContent);
        
        // Προσθήκη circle για την ακτίνα της ομάδας
        if (group.radius > 0 && group.count > 1) {
            L.circle(group.center, {
                radius: group.radius * 1000, // Μετατροπή σε μέτρα
                color: color,
                fillColor: color,
                fillOpacity: 0.1,
                weight: 2
            }).addTo(window.travelMap);
        }
        
        // Προσθήκη markers για κάθε δραστηριότητα της ομάδας
        group.activities.forEach(activity => {
            // Skip activities without valid location
            if (!activity || !activity.location ||
                typeof activity.location.lat !== 'number' ||
                typeof activity.location.lng !== 'number') {
                console.warn('⚠️ Skipping activity without valid location:', activity?.name);
                return;
            }

            createMarkerWithConnectFunction(
                [activity.location.lat, activity.location.lng],
                activity.name,
                activity
            );
        });
    });
    
    // Ενημέρωση χρήστη
    showToast(`
        <div style="max-width: 350px; text-align: left;">
            <strong style="color: #4F46E5;">📍 Ομαδοποιήθηκαν οι δραστηριότητες!</strong><br><br>
            
            <div style="background: #F0F9FF; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                <strong>🎯 ${groups.length} ομάδες βρέθηκαν:</strong><br>
                ${groups.map((g, i) => 
                    `<div style="display: flex; align-items: center; margin-top: 5px;">
                        <div style="width: 12px; height: 12px; background: ${getGroupColor(i)}; border-radius: 50%; margin-right: 8px;"></div>
                        Ομάδα ${i + 1}: <strong>${g.count} δραστηριότητες</strong>
                    </div>`
                ).join('')}
            </div>
            
            <div style="background: #E0F2FE; padding: 10px; border-radius: 8px;">
                <strong>💡 Συμβουλή:</strong><br>
                Οι δραστηριότητες της ίδιας ομάδας μπορούν να επισκεφτούν σε μία μέρα!
            </div>
        </div>
    `, 'info');
}


// ==================== HELPER FUNCTIONS ====================
function getPriceInfo(prices) {
    if (!prices || typeof prices !== 'object') {
        return 'Άγνωστες τιμές';
    }
    
    if (prices['0'] === 0 && prices['4'] === 0) {
        return 'Βρέφη δωρεάν (0-4)';
    }
    if (prices['0'] === 0 && prices['18'] === 0) {
        return 'Παιδιά δωρεάν (0-18)';
    }
    
    const allPrices = Object.values(prices)
        .filter(p => typeof p === 'number' && !isNaN(p));
    
    if (allPrices.length === 0) {
        return 'Άγνωστες τιμές';
    }
    
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);

    if (min === max) {
        return `${min.toFixed(2)}€ για όλους`;
    } else if (min === 0) {
        return `${max.toFixed(2)}€ (βρέφη δωρεάν)`;
    } else {
        return `${min.toFixed(2)}-${max.toFixed(2)}€`;
    }
}

function getPriceForAge(prices, age) {
    if (!prices) return '?';

    if (prices[age] !== undefined && prices[age] !== null) {
        return Number(prices[age]).toFixed(2) + '€';
    }

    if (age >= 18 && prices.adult !== undefined) {
        return Number(prices.adult).toFixed(2) + '€';
    }

    if (age >= 5 && age <= 17) {
        if (prices.child !== undefined) return Number(prices.child).toFixed(2) + '€';
        if (prices['10'] !== undefined) return Number(prices['10']).toFixed(2) + '€';
        if (prices['5'] !== undefined) return Number(prices['5']).toFixed(2) + '€';
    }

    if (age <= 4 && prices['0'] !== undefined) {
        return prices['0'] === 0 ? 'ΔΩΡΕΑΝ' : Number(prices['0']).toFixed(2) + '€';
    }

    for (let i = age; i >= 0; i--) {
        if (prices[i] !== undefined) {
            return Number(prices[i]).toFixed(2) + '€';
        }
    }

    return '?';
}
// ==================== SIMPLIFIED CLICK-TO-CONNECT SYSTEM ====================

// Καθαρά στοιχεία για το click-to-connect
let selectedPointA = null;  // Πρώτο επιλεγμένο σημείο
let selectedPointB = null;  // Δεύτερο επιλεγμένο σημείο
let currentRouteLine = null; // Τρέχουσα γραμμή διαδρομής

function addConnectStyles() {
    if (!document.querySelector('#connect-styles')) {
        const style = document.createElement('style');
        style.id = 'connect-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .clickable-marker:hover {
                transform: scale(1.1);
                transition: transform 0.2s ease;
            }
            
            .selected-marker-a {
                animation: pulse-green 1s infinite;
            }
            
            .selected-marker-b {
                animation: pulse-red 1s infinite;
            }
            
            @keyframes pulse-green {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            
            @keyframes pulse-red {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
        `;
        document.head.appendChild(style);
    }
}

function showToast(message, type = 'info') {
    // Δημιουργία toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#4F46E5'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-family: 'Roboto', sans-serif;
        animation: slideIn 0.3s ease;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div style="font-size: 20px;">
                ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div style="flex: 1; font-size: 14px; line-height: 1.4;">
                ${message}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0 0 0 10px;">
                &times;
            </button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Αυτόματη αφαίρεση μετά από 5 δευτερόλεπτα
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

function createMarkerWithConnectFunction(coords, title, activityData) {
    // Validate coords before proceeding
    if (!coords || !Array.isArray(coords) || coords.length !== 2 ||
        typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
        isNaN(coords[0]) || isNaN(coords[1])) {
        console.warn('⚠️ Invalid coordinates for marker:', coords, 'title:', title);
        return null;
    }

    console.log('🔍 [DEBUG] Δεδομένα για popup:', {
        name: title,
        hasRestaurant: !!activityData?.restaurant,
        restaurant: activityData?.restaurant,
        fullData: activityData
    });
    
    // ========== ΔΗΜΙΟΥΡΓΙΑ ΝΕΟΥ ΑΝΤΙΚΕΙΜΕΝΟΥ ΜΕ RESTAURANT ==========
    let enhancedData = { ...activityData }; // Δημιουργία αντιγράφου
    
    // Αν δεν έχει restaurant, ψάξε το από τα αρχικά δεδομένα
    if (!enhancedData?.restaurant) {
        // 1. Ψάξε με βάση το όνομα
        let originalActivity = state.currentCityActivities?.find(a => 
            a.name === title || 
            (a.name && title && a.name.includes(title.substring(0, 20))) || 
            (a.name && title && title.includes(a.name.substring(0, 20)))
        );
        
        // 2. Αν δεν βρέθηκε, ψάξε με βάση το ID
        if (!originalActivity && enhancedData?.id) {
            originalActivity = state.currentCityActivities?.find(a => a.id === enhancedData.id);
        }
        
        // 3. Αν βρέθηκε, προσθέσε το restaurant
        if (originalActivity?.restaurant) {
            enhancedData.restaurant = originalActivity.restaurant;
            console.log('✅ Βρέθηκε restaurant για:', title, '=', originalActivity.restaurant);
        } else {
            console.log('⚠️ Δεν βρέθηκε restaurant για:', title);
        }
    }
    
    // Βεβαιώσου ότι το enhancedData έχει τα απαραίτητα πεδία
    const safeActivityData = {
        name: title,
        description: enhancedData?.description || 'Επιλεγμένη δραστηριότητα',
        price: enhancedData?.price || 0,
        duration_hours: enhancedData?.duration_hours || '?',
        category: enhancedData?.category || 'attraction',
        location: enhancedData?.location || { lat: coords[0], lng: coords[1] },
        restaurant: enhancedData?.restaurant || null
    };
    
    console.log('📍 Δημιουργία marker για:', title, 'με restaurant:', !!safeActivityData.restaurant);
    
    if (!window.travelMap) {
        console.error('❌ Χάρτης δεν είναι διαθέσιμος');
        return null;
    }
    
    // Χρώμα πινέζας ανάλογα με την κατάσταση
    const getMarkerColor = () => {
        if (selectedPointA && selectedPointA.title === title) return '#10B981'; // Πράσινο για Α
        if (selectedPointB && selectedPointB.title === title) return '#EF4444'; // Κόκκινο για Β
        return '#4F46E5'; // Μπλε για κανονικό
    };
    
    const getMarkerLetter = () => {
        if (selectedPointA && selectedPointA.title === title) return 'A';
        if (selectedPointB && selectedPointB.title === title) return 'B';
        return '📍';
    };
    
    const marker = L.marker(coords, {
        icon: L.divIcon({
            html: `
                <div style="
                    background: ${getMarkerColor()}; 
                    color: white; 
                    width: 42px; 
                    height: 42px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-weight: bold;
                    font-size: 18px;
                    border: 3px solid white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    ${getMarkerLetter()}
                </div>
            `,
            className: 'clickable-marker',
            iconSize: [42, 42],
            iconAnchor: [21, 42]
        })
    }).addTo(window.travelMap);
    
    // Αποθήκευση δεδομένων
    marker.options.activityData = safeActivityData;
    marker.options.originalTitle = title;
    marker.options.coords = coords;
    
    // Συνάρτηση που καλείται όταν κάνουμε κλικ
    const handleMarkerClick = function(e) {
        console.log(`📍 Κλικ στο: ${title}`, e.latlng);
        
        // Αν δεν έχουμε επιλέξει πρώτο σημείο
        if (!selectedPointA) {
            selectedPointA = {
                marker: marker,
                coords: coords,
                title: title,
                data: safeActivityData,
                latlng: e.latlng
            };
            
            // Ανανέωση εμφάνισης
            updateMarkerAppearance();
            
            showToast(`
                <div style="background: #D1FAE5; padding: 12px; border-radius: 8px; border-left: 4px solid #10B981;">
                    <strong style="color: #065F46;">✅ Επιλέχθηκε ως σημείο ΑΠΟ:</strong><br>
                    <span style="font-weight: bold;">${title}</span><br>
                    <small style="color: #047857;">Κάντε κλικ σε άλλη πινέζα για επιλογή προορισμού</small>
                </div>
            `, 'info');
            
        } 
        // Αν έχουμε ήδη πρώτο σημείο και κάνουμε κλικ σε διαφορετικό
        else if (!selectedPointB && selectedPointA.marker !== marker) {
            selectedPointB = {
                marker: marker,
                coords: coords,
                title: title,
                data: safeActivityData,
                latlng: e.latlng
            };
            
            // Ανανέωση εμφάνισης
            updateMarkerAppearance();
            
            // Σχεδίαση διαδρομής
            setTimeout(() => {
                drawRouteBetweenPoints();
            }, 300);
            
        } 
        // Αν κάνουμε κλικ στο ίδιο σημείο ξανά
        else if (selectedPointA && selectedPointA.marker === marker) {
            showToast(`ℹ️ Έχετε ήδη επιλέξει το <strong>${title}</strong> ως σημείο ΑΠΟ`, 'warning');
        }
        // Αν κάνουμε κλικ στο δεύτερο σημείο ξανά
        else if (selectedPointB && selectedPointB.marker === marker) {
            showToast(`ℹ️ Έχετε ήδη επιλέξει το <strong>${title}</strong> ως σημείο ΠΡΟΣ`, 'warning');
        }
        // Αν έχουμε ήδη δύο σημεία και κάνουμε κλικ σε τρίτο
        else if (selectedPointA && selectedPointB) {
            // Επαναφορά
            resetSelection();
            
            // Ξεκινάμε από το αρχικό
            selectedPointA = {
                marker: marker,
                coords: coords,
                title: title,
                data: safeActivityData,
                latlng: e.latlng
            };
            
            // Ανανέωση εμφάνισης
            updateMarkerAppearance();
            
            showToast(`
                <div style="background: #FEF3C7; padding: 12px; border-radius: 8px; border-left: 4px solid #F59E0B;">
                    <strong style="color: #92400E;">🔄 Νέα επιλογή:</strong><br>
                    <span style="font-weight: bold;">${title}</span> ως νέο σημείο ΑΠΟ<br>
                    <small style="color: #B45309;">Κάντε κλικ σε άλλη πινέζα για προορισμό</small>
                </div>
            `, 'info');
        }
    };
    
    // Συνάρτηση ανανέωσης εμφάνισης
    function updateMarkerAppearance() {
        try {
            const isPointA = selectedPointA && selectedPointA.marker === marker;
            const isPointB = selectedPointB && selectedPointB.marker === marker;

            const color = isPointA ? '#10B981' : isPointB ? '#EF4444' : '#4F46E5';
            const letter = isPointA ? 'A' : isPointB ? 'B' : '📍';
            const size = isPointA || isPointB ? '50px' : '42px';
            const fontSize = isPointA || isPointB ? '20px' : '18px';

            marker.setIcon(L.divIcon({
                html: `
                    <div style="
                        background: ${color};
                        color: white;
                        width: ${size};
                        height: ${size};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: bold;
                        font-size: ${fontSize};
                        border: 3px solid white;
                        box-shadow: 0 3px 15px ${color}80;
                        cursor: pointer;
                        animation: ${isPointA || isPointB ? 'pulse 1.5s infinite' : 'none'};
                    ">
                        ${letter}
                    </div>
                `,
                className: isPointA ? 'selected-marker-a' : isPointB ? 'selected-marker-b' : 'clickable-marker',
                iconSize: [parseInt(size), parseInt(size)],
                iconAnchor: [parseInt(size)/2, parseInt(size)]
            }));

            // Ενημέρωση popup - with fallback for errors
            let popupContent;
            try {
                popupContent = isPointA ?
                    `<div style="text-align: center; padding: 10px;">
                        <h4 style="margin: 0 0 10px 0; color: #10B981;">📍 ΑΠΟ</h4>
                        <p style="margin: 0; font-weight: bold;">${title}</p>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                            ✅ Επιλέχθηκε ως σημείο εκκίνησης
                        </p>
                    </div>` :
                    isPointB ?
                    `<div style="text-align: center; padding: 10px;">
                        <h4 style="margin: 0 0 10px 0; color: #EF4444;">🎯 ΠΡΟΣ</h4>
                        <p style="margin: 0; font-weight: bold;">${title}</p>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                            ✅ Επιλέχθηκε ως προορισμός
                        </p>
                    </div>` :
                    createEnhancedPopup(safeActivityData);
            } catch (popupError) {
                console.warn('Error creating popup:', popupError);
                popupContent = `<div><strong>${title || 'Activity'}</strong></div>`;
            }

            marker.bindPopup(popupContent);

            if (isPointA || isPointB) {
                marker.openPopup();
            }
        } catch (error) {
            console.error('Error updating marker appearance:', error);
        }
    }
    
    // Επισύναψη event listener
    marker.on('click', handleMarkerClick);
    
    // Αρχικό popup
    marker.bindPopup(createEnhancedPopup(safeActivityData));
    
    return marker;
}
    
   
// Βοηθητική συνάρτηση για επαναφορά επιλογών
function resetSelection() {
    if (selectedPointA && selectedPointA.marker) {
        resetMarkerAppearance(selectedPointA.marker);
    }
    if (selectedPointB && selectedPointB.marker) {
        resetMarkerAppearance(selectedPointB.marker);
    }
    
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }
    
    selectedPointA = null;
    selectedPointB = null;
}

function drawRouteBetweenPoints() {
    console.log('🔍 ΕΛΕΓΧΟΣ: drawRouteBetweenPoints καλείται');
    console.log('📍 selectedPointA:', selectedPointA);
    console.log('📍 selectedPointB:', selectedPointB);
    console.log('📍 window.travelMap:', window.travelMap);
    
    if (!selectedPointA || !selectedPointB || !window.travelMap) {
        console.error('❌ ΛΕΙΠΟΥΝ ΣΤΟΙΧΕΙΑ:', {
            selectedPointA: !!selectedPointA,
            selectedPointB: !!selectedPointB,
            travelMap: !!window.travelMap
        });
        return;
    }
    
    // Καταργήστε τυχόν προηγούμενη γραμμή
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
    }
    
    // Υπολογίστε απόσταση
    const distance = calculateDistance(
        selectedPointA.coords,
        selectedPointB.coords
    ).toFixed(1);
    
    const walkTime = Math.round(distance * 15);  // 4 km/h
    const carTime = Math.round(distance * 3);    // 20 km/h
    // Αμέσως πριν από το routePopup, μετά το walkTime και carTime:
const transitTime = Math.round(distance * 5);   // ΜΜΜ
const bikeTime = Math.round(distance * 8);      // Ποδήλατο
    
    // Σχεδίαση νέας γραμμής
    currentRouteLine = L.polyline([selectedPointA.coords, selectedPointB.coords], {
        color: '#FF6B6B',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round'
    }).addTo(window.travelMap);
    
    // Δημιουργία popup για τη γραμμή
    const middlePoint = [
        (selectedPointA.coords[0] + selectedPointB.coords[0]) / 2,
        (selectedPointA.coords[1] + selectedPointB.coords[1]) / 2
    ];
    
    const routePopup = L.popup()
    .setLatLng(middlePoint)
    .setContent(`
        <div style="min-width: 280px; font-family: 'Roboto', sans-serif; padding: 5px;">
            <h4 style="margin: 0 0 12px 0; color: #1A202C; text-align: center; font-size: 16px;">
                🛣️ Πληροφορίες Διαδρομής
            </h4>
            
            <div style="background: #F7FAFC; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span><strong>📍 Από:</strong></span>
                    <span style="color: #10B981; font-weight: bold;">${selectedPointA.title}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span><strong>🎯 Προς:</strong></span>
                    <span style="color: #EF4444; font-weight: bold;">${selectedPointB.title}</span>
                </div>
            </div>
            
            <div style="background: #E6FFFA; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                <div style="text-align: center; font-size: 24px; font-weight: bold; color: #0D9488;">
                    ${distance} km
                </div>
                <div style="text-align: center; font-size: 12px; color: #4A5568;">
                    Ευθεία γραμμή (περίπου)
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h5 style="color: var(--dark); margin-bottom: 8px; font-size: 14px;">
                    <i class="fas fa-clock"></i> Εκτιμώμενος Χρόνος:
                </h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div style="text-align: center; padding: 8px; background: #e3f2fd; border-radius: 4px;">
                        <div style="font-size: 18px;">🚶</div>
                        <div style="font-size: 14px; font-weight: bold;">${walkTime} λεπτά</div>
                        <div style="font-size: 10px; color: var(--gray);">Περπάτημα*</div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: #fff3e0; border-radius: 4px;">
                        <div style="font-size: 18px;">🚗</div>
                        <div style="font-size: 14px; font-weight: bold;">${carTime} λεπτά</div>
                        <div style="font-size: 10px; color: var(--gray);">Αυτοκίνητο*</div>
                    </div>
                        <div style="text-align: center; padding: 8px; background: #e8f5e9; border-radius: 4px;">
        <div style="font-size: 18px;">🚇</div>
        <div style="font-size: 14px; font-weight: bold;">~${Math.round(distance * 5)} λεπτά</div>
        <div style="font-size: 10px; color: var(--gray);">ΜΜΜ*</div>
    </div>
    <div style="text-align: center; padding: 8px; background: #f3e5f5; border-radius: 4px;">
        <div style="font-size: 18px;">🚲</div>
        <div style="font-size: 14px; font-weight: bold;">~${Math.round(distance * 8)} λεπτά</div>
        <div style="font-size: 10px; color: var(--gray);">Ποδήλατο*</div>
    </div>
                </div>
                <p style="font-size: 10px; color: #666; text-align: center; margin-top: 8px; margin-bottom: 0;">
                    *Εκτίμηση. Για πραγματικές οδηγίες πατήστε ένα κουμπί.
                </p>
            </div>
            
            <!-- ΚΟΥΜΠΙΑ ΜΕΤΑΦΟΡΑΣ -->
            <div style="border-top: 1px solid #eee; padding-top: 15px;">
                <h5 style="color: #1A202C; margin-bottom: 10px; font-size: 14px; text-align: center;">
                    <i class="fas fa-directions"></i> Άνοιγμα Google Maps
                </h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${selectedPointA.coords[0]},${selectedPointA.coords[1]}&destination=${selectedPointB.coords[0]},${selectedPointB.coords[1]}&travelmode=walking"
                       target="_blank"
                       style="text-align: center; padding: 10px; background: #10B981; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; flex-direction: column; align-items: center; font-size: 13px;">
                        <i class="fas fa-walking" style="font-size: 16px; margin-bottom: 5px;"></i>
                        <span>Περπάτημα</span>
                    </a>
                    
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${selectedPointA.coords[0]},${selectedPointA.coords[1]}&destination=${selectedPointB.coords[0]},${selectedPointB.coords[1]}&travelmode=driving"
                       target="_blank"
                       style="text-align: center; padding: 10px; background: #3B82F6; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; flex-direction: column; align-items: center; font-size: 13px;">
                        <i class="fas fa-car" style="font-size: 16px; margin-bottom: 5px;"></i>
                        <span>Αυτοκίνητο</span>
                    </a>
                    
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${selectedPointA.coords[0]},${selectedPointA.coords[1]}&destination=${selectedPointB.coords[0]},${selectedPointB.coords[1]}&travelmode=transit"
                       target="_blank"
                       style="text-align: center; padding: 10px; background: #8B5CF6; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; flex-direction: column; align-items: center; font-size: 13px;">
                        <i class="fas fa-bus" style="font-size: 16px; margin-bottom: 5px;"></i>
                        <span>ΜΜΜ</span>
                    </a>
                    
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${selectedPointA.coords[0]},${selectedPointA.coords[1]}&destination=${selectedPointB.coords[0]},${selectedPointB.coords[1]}&travelmode=bicycling"
                       target="_blank"
                       style="text-align: center; padding: 10px; background: #F59E0B; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; flex-direction: column; align-items: center; font-size: 13px;">
                        <i class="fas fa-bicycle" style="font-size: 16px; margin-bottom: 5px;"></i>
                        <span>Ποδήλατο</span>
                    </a>
                </div>
                <p style="font-size: 11px; color: #666; text-align: center; margin-top: 5px; margin-bottom: 0;">
                    Ανοίγει Google Maps με πλήρεις οδηγίες και πραγματικό χρόνο.
                </p>
            </div>
        </div>
    `);

// Προσθήκη popup στη γραμμή
currentRouteLine.bindPopup(routePopup);
    
    // Ενημέρωση χρήστη
    showToast(`✅ Διαδρομή δημιουργήθηκε!<br><strong>${selectedPointA.title}</strong> → <strong>${selectedPointB.title}</strong><br>Απόσταση: ${distance} km`, 'success');
    
    // Αυτόματη απελευθέρωση μετά από 30 δευτερόλεπτα
    // Clear any existing timer first to prevent stacking
    if (window.routeResetTimer) {
        clearTimeout(window.routeResetTimer);
    }

    window.routeResetTimer = setTimeout(() => {
        if (selectedPointA && selectedPointB) {
            resetMarkerAppearance(selectedPointA.marker);
            resetMarkerAppearance(selectedPointB.marker);

            if (currentRouteLine) {
                window.travelMap.removeLayer(currentRouteLine);
                currentRouteLine = null;
            }

            selectedPointA = null;
            selectedPointB = null;

            showToast('🔄 Επαναφορά επιλογών διαδρομής', 'info');
        }
        window.routeResetTimer = null;
    }, 30000);
}

function resetMarkerAppearance(marker) {
    if (!marker) return;
    
    marker.setIcon(L.divIcon({
        html: `
            <div style="
                background: #4F46E5; 
                color: white; 
                width: 40px; 
                height: 40px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-weight: bold;
                font-size: 16px;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                cursor: pointer;
            ">
                📍
            </div>
        `,
        className: 'clickable-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    }));
    
    // Επανάφερε το αρχικό popup (αν υπάρχουν δεδομένα)
    if (marker.options && marker.options.activityData) {
        marker.bindPopup(createEnhancedPopup(marker.options.activityData));
    }
}

// Καλείται κατά την αρχικοποίηση
addConnectStyles();
// ==================== ΠΑΛΙΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ΠΟΥ ΧΡΕΙΑΖΟΝΤΑΙ ΑΚΟΜΑ ====================

function createDailyProgram() {
    console.log('📅 createDailyProgram καλείται (παλιά έκδοση)');
    // Απλή έκδοση που απλά ενημερώνει πως δεν χρησιμοποιείται πια
    const dailyProgram = document.getElementById('daily-program');
    if (dailyProgram) {
        dailyProgram.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-info-circle fa-3x" style="margin-bottom: 20px;"></i>
                <h4>Αυτό το πρόγραμμα αντικαταστάθηκε</h4>
                <p>Χρησιμοποιήστε το <strong>Γεωγραφικό Πρόγραμμα</strong> παραπάνω</p>
            </div>
        `;
    }
}

function calculateOptimalDays() {
    console.log('🧮 calculateOptimalDays καλείται');
    // Απλή έκδοση που δείχνει μήνυμα
    alert('ℹ️ Η λειτουργία αυτόματου υπολογισμού απενεργοποιήθηκε.\n\nΕπιλέξτε μόνοι σας τις μέρες από το dropdown.');
    return 0;
}
// ==================== SIMPLIFIED MAP FUNCTIONS ====================

function clearMap() {
    alert('🗺️ Η λειτουργία καθαρισμού θα προστεθεί στο επόμενο βήμα');
}

 // ==================== SIMPLE MAP INITIALIZATION ====================
function initializeSimpleMap() {
    console.log('🗺️ Αρχικοποίηση απλού χάρτη για:', state.selectedDestination);
    
    const mapElement = document.getElementById('simple-map');
    if (!mapElement) {
        console.error('❌ Δεν βρέθηκε map element');
        return;
    }
    
    // 1. Καθαρισμός προηγούμενου χάρτη
    if (window.simpleMap) {
        window.simpleMap.remove();
    }
    
    // 2. Βρες συντεταγμένες πόλης
    const cityCoords = getCityCoordinates(state.selectedDestinationId);
    if (!cityCoords) {
        mapElement.innerHTML = `
            <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#f8f9fa; color:#666;">
                <div style="text-align:center;">
                    <i class="fas fa-map-marked-alt fa-2x" style="margin-bottom:15px;"></i>
                    <h4>Δεν βρέθηκαν συντεταγμένες</h4>
                    <p>Για την πόλη: ${state.selectedDestination}</p>
                </div>
            </div>
        `;
        return;
    }
    
    // 3. Δημιουργία χάρτη
    window.simpleMap = L.map('simple-map').setView(cityCoords, 13);
    
    // 4. Προσθήκη χάρτη OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(window.simpleMap);
    
    // 5. Προσθήκη marker για την πόλη
    L.marker(cityCoords)
        .addTo(window.simpleMap)
        .bindPopup(`
            <div style="text-align:center; padding:10px;">
                <h4 style="margin:0 0 5px 0; color:#4F46E5;">${state.selectedDestination}</h4>
                <p style="margin:0; color:#666; font-size:14px;">Κέντρο πόλης</p>
                <p style="margin:5px 0 0 0; color:#888; font-size:12px;">
                    <i class="fas fa-info-circle"></i> Πατήστε "Φόρτωση Δραστηριοτήτων"
                </p>
            </div>
        `)
        .openPopup();
    
    console.log('✅ Απλός χάρτης αρχικοποιήθηκε');
    
    // 6. Ενημέρωση status
    const statusEl = document.getElementById('map-status');
    if (statusEl) {
        statusEl.innerHTML = `
            <i class="fas fa-check-circle" style="color: #10B981;"></i>
            <strong>Έτοιμο:</strong> Χάρτης φορτώθηκε για ${state.selectedDestination}
        `;
    }
} 
// ==================== SIMPLIFIED MAP FUNCTIONS ====================

function loadActivitiesOnMap() {
    alert('📌 Θα φορτώσουμε τις δραστηριότητες στο επόμενο βήμα!\n\nΓια τώρα, ο χάρτης είναι σε λειτουργία.');
    
    // Προς το παρών, απλά ενημέρωση
    const statusEl = document.getElementById('map-status');
    if (statusEl) {
        statusEl.innerHTML = `
            <i class="fas fa-check-circle" style="color: #10B981;"></i>
            <strong>Έτοιμο:</strong> Ο χάρτης είναι έτοιμος για χρήση
        `;
    }
}

// ==================== SIMPLIFIED MAP FUNCTIONS ====================

function clearMap() {
    alert('🗺️ Η λειτουργία καθαρισμού θα προστεθεί στο επόμενο βήμα');
}
// ==================== ΗΜΕΡΕΣ ΧΑΡΤΗ ====================

function updateMapDayFilter(checkbox) {
    // Ενημερώνει τα checkboxes όταν αλλάζει κάποιο
    console.log('📅 Checkbox changed:', checkbox.value, checkbox.checked);
    
    if (checkbox.value === 'all' && checkbox.checked) {
        // Αν επιλέχθηκε "Όλες οι μέρες", αποεπιλογή των υπολοίπων
        document.querySelectorAll('.day-checkbox:not([value="all"])').forEach(cb => {
            cb.checked = false;
        });
    } else if (checkbox.value !== 'all' && checkbox.checked) {
        // Αν επιλέχθηκε συγκεκριμένη μέρα, αποεπιλογή του "all"
        const allCheckbox = document.querySelector('.day-checkbox[value="all"]');
        if (allCheckbox) allCheckbox.checked = false;
    }
}

function selectAllDays() {
    document.querySelectorAll('.day-checkbox').forEach(cb => {
        cb.checked = true;
    });
    showToast('✅ Επιλέχθηκαν όλες οι μέρες', 'success');
}

function deselectAllDays() {
    document.querySelectorAll('.day-checkbox').forEach(cb => {
        cb.checked = false;
    });
    showToast('🧹 Αποεπιλέχθηκαν όλες οι μέρες', 'info');
}
function applyDayFilter() {
    console.log('🎯 applyDayFilter - Αρχή φιλτραρίσματος χάρτη');
    
    // 1. ΕΛΕΓΧΟΣ: Υπάρχει πρόγραμμα;
    if (!state.geographicProgram || !state.geographicProgram.days) {
        showToast('⚠️ Δεν υπάρχει προγραμματισμένο πρόγραμμα', 'warning');
        return;
    }
    
    // 2. ΕΛΕΓΧΟΣ: Υπάρχει χάρτης;
    if (!window.travelMap) {
        showToast('⚠️ Παρακαλώ πρώτα φορτώστε τον χάρτη', 'warning');
        return;
    }
    
    // 3. ΔΙΑΒΑΣΜΑ ΕΠΙΛΕΓΜΕΝΩΝ ΗΜΕΡΩΝ
    const selectedDays = [];
    const allCheckbox = document.querySelector('.day-checkbox[value="all"]');
    
    if (allCheckbox && allCheckbox.checked) {
        // Αν είναι επιλεγμένο το "Όλες οι μέρες"
        for (let i = 1; i <= state.geographicProgram.totalDays; i++) {
            selectedDays.push(i);
        }
    } else {
        // Διάβασμα επιλεγμένων συγκεκριμένων ημερών
        document.querySelectorAll('.day-checkbox:checked').forEach(cb => {
            if (cb.value !== 'all') {
                const dayNum = parseInt(cb.value.replace('day', ''));
                if (!isNaN(dayNum)) {
                    selectedDays.push(dayNum);
                }
            }
        });
    }
    
    console.log('📅 Επιλεγμένες μέρες:', selectedDays);
    
    if (selectedDays.length === 0) {
        showToast('⚠️ Παρακαλώ επιλέξτε τουλάχιστον μία μέρα', 'warning');
        return;
    }
    
    // 4. ΕΜΦΑΝΙΣΗ ΚΑΤΑΣΤΑΣΗΣ
    const statusDiv = document.getElementById('day-filter-status');
    if (statusDiv) {
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> Εμφάνιση ${selectedDays.length} ημερών...`;
    }
    
    // 5. ΚΑΘΑΡΙΣΜΟΣ ΧΑΡΤΗ
    // Αφαίρεση όλων των markers (εκτός city marker)
    window.travelMap.eachLayer(function(layer) {
        if (layer instanceof L.Marker && !layer.options.className?.includes('city-marker')) {
            window.travelMap.removeLayer(layer);
        }
    });
    
    // Αφαίρεση διαδρομών
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }
    
    // Επαναφορά επιλογών
    selectedPointA = null;
    selectedPointB = null;
    
    // 6. ΠΡΟΣΘΗΚΗ ΜΟΝΟ ΤΩΝ ΕΠΙΛΕΓΜΕΝΩΝ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ
    let totalActivitiesAdded = 0;
    
    selectedDays.forEach(dayNumber => {
        const dayIndex = dayNumber - 1; // Μετατροπή σε index (0-based)
        const dayProgram = state.geographicProgram.days[dayIndex];
        
        if (!dayProgram || !dayProgram.groups) {
            console.warn(`⚠️ Ημέρα ${dayNumber} δεν έχει δεδομένα`);
            return;
        }
        
        console.log(`📌 Προσθήκη Ημέρας ${dayNumber}: ${dayProgram.totalActivities} δραστηριότητες`);
        
        // Χρώμα για αυτή τη μέρα
        const dayColor = getDayColor(dayNumber);
        
        // Πέρασμα από όλες τις ομάδες της ημέρας
        dayProgram.groups.forEach(group => {
            group.activities.forEach(activity => {
                // Βρες τις πλήρεις πληροφορίες της δραστηριότητας
                const fullActivity = state.currentCityActivities?.find(a => 
                    a.id === activity.id || a.name === activity.name
                ) || activity;
                
                let coords;
                
                if (fullActivity.location) {
                    coords = [fullActivity.location.lat, fullActivity.location.lng];
                } else {
                    // Χωρίς location - τυχαία συντεταγμένες κοντά στο κέντρο
                    const cityCoords = getCityCoordinates(state.selectedDestinationId);
                    if (cityCoords) {
                        coords = [
                            cityCoords[0] + (Math.random() - 0.5) * 0.03,
                            cityCoords[1] + (Math.random() - 0.5) * 0.03
                        ];
                    } else {
                        coords = [51.5074, -0.1278]; // Default Λονδίνο
                    }
                }
                
                // Δημιουργία marker με ειδικό χρώμα για τη μέρα
                const marker = L.marker(coords, {
                    icon: L.divIcon({
                        html: `
                            <div style="
                                background: ${dayColor}; 
                                color: white; 
                                width: 42px; 
                                height: 42px; 
                                border-radius: 50%; 
                                display: flex; 
                                align-items: center; 
                                justify-content: center;
                                font-weight: bold;
                                font-size: 16px;
                                border: 3px solid white;
                                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                                cursor: pointer;
                            ">
                                ${dayNumber}
                            </div>
                        `,
                        className: 'day-marker',
                        iconSize: [42, 42],
                        iconAnchor: [21, 42]
                    })
                }).addTo(window.travelMap);
                
                // Αποθήκευση πληροφοριών
                marker.options.day = dayNumber;
                marker.options.activityData = fullActivity;
                marker.options.originalTitle = fullActivity.name;
                
                // Enhanced popup με πληροφορίες ημέρας
                const popupContent = `
                    <div style="max-width: 300px; font-family: 'Roboto', sans-serif; padding: 8px;">
                        <div style="background: ${dayColor}; color: white; padding: 8px; border-radius: 6px; margin-bottom: 10px; text-align: center;">
                            <strong><i class="fas fa-calendar-day"></i> ΜΕΡΑ ${dayNumber}</strong>
                        </div>
                        ${createEnhancedPopup(fullActivity)}
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                
                // Συνάρτηση κλικ (για διαδρομές)
                marker.on('click', function(e) {
                    handleMarkerClickForDay(e, marker, dayNumber, fullActivity);
                });
                
                totalActivitiesAdded++;
            });
        });
    });
    
    // 7. ΕΝΗΜΕΡΩΣΗ ΧΡΗΣΤΗ
    setTimeout(() => {
        if (statusDiv) {
            statusDiv.innerHTML = `<i class="fas fa-check-circle" style="color: #10B981;"></i> Εμφανίστηκαν ${totalActivitiesAdded} δραστηριότητες από ${selectedDays.length} μέρες`;
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
        
        showToast(`✅ Εμφανίστηκαν ${totalActivitiesAdded} δραστηριότητες από ${selectedDays.length} μέρες`, 'success');
        
        console.log(`✅ Φιλτράρισμα ολοκληρώθηκε: ${totalActivitiesAdded} δραστηριότητες`);
    }, 500);
}

// Βοηθητική συνάρτηση για το κλικ σε markers ημερών
function handleMarkerClickForDay(event, marker, dayNumber, activityData) {
    console.log(`📍 Κλικ στη Μέρα ${dayNumber}: ${activityData.name}`);
    
    // Υλοποίηση επιλογής για διαδρομές (όπως πριν)
    if (!selectedPointA) {
        selectedPointA = {
            marker: marker,
            coords: marker.getLatLng(),
            title: activityData.name,
            data: activityData,
            day: dayNumber
        };
        
        // Ενημέρωση εμφάνισης
        updateDayMarkerAppearance(marker, 'A');
        
        showToast(`✅ Επιλέχθηκε <strong>${activityData.name}</strong> (Μέρα ${dayNumber}) ως σημείο ΑΠΟ`, 'info');
        
    } else if (!selectedPointB && selectedPointA.marker !== marker) {
        selectedPointB = {
            marker: marker,
            coords: marker.getLatLng(),
            title: activityData.name,
            data: activityData,
            day: dayNumber
        };
        
        updateDayMarkerAppearance(marker, 'B');
        
        // Σχεδίαση διαδρομής
        setTimeout(() => {
            drawRouteBetweenPoints();
        }, 300);
    }
}

// Ενημέρωση εμφάνισης marker ανά ημέρα
function updateDayMarkerAppearance(marker, pointType) {
    const dayNumber = marker.options.day;
    const dayColor = getDayColor(dayNumber);
    
    const isPointA = pointType === 'A';
    const color = isPointA ? '#10B981' : '#EF4444';
    const letter = isPointA ? 'A' : 'B';
    
    marker.setIcon(L.divIcon({
        html: `
            <div style="
                background: ${color}; 
                color: white; 
                width: 50px; 
                height: 50px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-weight: bold;
                font-size: 20px;
                border: 3px solid white;
                box-shadow: 0 3px 15px ${color}80;
                cursor: pointer;
                animation: pulse 1.5s infinite;
            ">
                ${letter}
            </div>
        `,
        className: isPointA ? 'selected-marker-a' : 'selected-marker-b',
        iconSize: [50, 50],
        iconAnchor: [25, 50]
    }));
}

window.showStep = showStep;
window.filterDestinations = filterDestinations;
window.resetFilters = resetFilters;
window.selectDestination = selectDestination;
window.showManualDestinationModal = showManualDestinationModal;
window.closeManualDestinationModal = closeManualDestinationModal;
window.saveManualDestination = saveManualDestination;
window.showQuickRecommendations = showQuickRecommendations;
window.showPopularDestinations = showPopularDestinations;
window.showBudgetDestinations = showBudgetDestinations;
window.showFamilyDestinations = showFamilyDestinations;
window.searchBookingHotels = searchBookingHotels;
window.searchExpediaHotels = searchExpediaHotels;
window.setupActivitiesStep = setupActivitiesStep;
window.toggleActivitySelection = toggleActivitySelection;
window.setupSummaryStep = setupSummaryStep;
window.setupMapStep = setupMapStep;
window.initializeMap = initializeMap;
window.reloadMap = reloadMap;
window.addCustomPoint = addCustomPoint;
window.showActivityMap = showActivityMap;
window.showRouteBetweenPoints = showRouteBetweenPoints;
window.updateFamilyMemberName = updateFamilyMemberName;
window.updateFamilyMemberAge = updateFamilyMemberAge;
window.addFamilyMember = addFamilyMember;
window.removeFamilyMember = removeFamilyMember;
window.updateFamilyMembers = updateFamilyMembers;
window.calculateSmartCombos = calculateSmartCombos;
window.clearSelectedActivities = clearSelectedActivities;
window.updateProgramDays = updateProgramDays;
window.groupActivitiesByProximity = groupActivitiesByProximity; 
window.showGroupedActivitiesOnMap = showGroupedActivitiesOnMap;
window.suggestDaysFromGroups = suggestDaysFromGroups;
window.calculateDistance = calculateDistance;
window.translateCategory = translateCategory;
window.createEnhancedPopup = createEnhancedPopup;
window.getPriceForAge = getPriceForAge;

// ========== ΝΕΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ΧΑΡΤΗ ==========
window.createMarkerWithConnectFunction = createMarkerWithConnectFunction;
window.drawRouteBetweenPoints = drawRouteBetweenPoints;
window.showToast = showToast;
window.resetMarkerAppearance = resetMarkerAppearance;
window.resetSelection = resetSelection;
window.updateMapDayFilter = updateMapDayFilter;
window.selectAllDays = selectAllDays;
window.deselectAllDays = deselectAllDays;
window.applyDayFilter = applyDayFilter;

window.showStep = showStep;
window.filterDestinations = filterDestinations;

// ========== ΕΠΙΠΛΕΟΝ ΠΟΥ ΜΠΟΡΕΙ ΝΑ ΧΡΕΙΑΖΟΝΤΑΙ ==========
window.getCityCoordinates = getCityCoordinates;
window.getActivityEmoji = getActivityEmoji;
window.calculateFamilyCost = calculateFamilyCost;
window.updateActivitiesTotal = updateActivitiesTotal;
window.saveState = saveState;
window.initializeSimpleMap = initializeSimpleMap;
window.loadActivitiesOnMap = loadActivitiesOnMap;
window.clearMap = clearMap;
window.initializeMapInStep = initializeMapInStep;
window.cleanupMapState = cleanupMapState;
window.recalculateSelectedActivityPrices = recalculateSelectedActivityPrices;
window.clearMapPoints = clearMapPoints;
window.forceRefreshProgram = forceRefreshProgram;
window.createSuggestedProgram = createSuggestedProgram;
window.getDayColor = getDayColor;
// 🔵 ΠΡΟΣΘΗΚΗ ΕΔΩ:
window.createGeographicClusters = createGeographicClusters;
window.calculateClusterCenter = calculateClusterCenter;
window.distributeClustersToDays = distributeGroupsToDays;

// ==================== CSS ANIMATIONS FOR PROGRAM ====================
// Προσθήκη CSS animation για το spinner (για το βήμα 5)
if (!document.querySelector('#program-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'program-spinner-style';
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid var(--primary);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
    `;
    document.head.appendChild(style);
}
// 🔵🔵🔵 ΠΡΟΣΘΕΣΕ ΑΥΤΟ ΓΙΑ ΤΟ ΝΕΟ ΠΡΟΓΡΑΜΜΑ 🔵🔵🔵
if (!document.querySelector('#program-animations')) {
    const style = document.createElement('style');
    style.id = 'program-animations';
    style.textContent = `
        @keyframes pulse {
            0% { 
                box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4);
            }
            70% { 
                box-shadow: 0 0 0 15px rgba(79, 70, 229, 0);
            }
            100% { 
                box-shadow: 0 0 0 0 rgba(79, 70, 229, 0);
            }
        }
        
        @keyframes slideDown {
            from { 
                opacity: 0;
                transform: translateY(-20px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        #geographic-program-section {
            display: block !important;
            animation: slideDown 0.5s ease-out;
            border: 3px solid #4F46E5;
            background: linear-gradient(to bottom, #ffffff, #f8faff);
            margin-top: 30px;
            border-radius: 15px;
        }
        
        .day-card {
            transition: all 0.3s ease;
            animation: slideDown 0.6s ease-out;
            animation-fill-mode: both;
            margin-bottom: 25px;
            padding: 20px;
            background: white;
            border-radius: 12px;
            border-left: 4px solid #4F46E5;
            box-shadow: 0 3px 10px rgba(0,0,0,0.08);
        }
        
        .day-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }
    `;
    document.head.appendChild(style);
}

// ==================== EXPORT FUNCTIONS TO WINDOW ====================
// (ΟΠΟΥ ΕΧΕΙΣ ΟΛΑ ΤΑ window.* = ... ΤΩΡΑ)

window.showStep = showStep;
window.filterDestinations = filterDestinations;
// ... όλα τα υπόλοιπα window.* ...


// ==================== DYNAMIC LOADING OF COMBO CALCULATOR ====================
function loadComboCalculator() {
    const script = document.createElement('script');
    script.src = 'combo-calculator.js';
    script.onload = function() {
        console.log('✅ combo-calculator.js loaded successfully');
        // Ρύθμιση global function για πρόσβαση
        window.calculateSmartCombosReal = window.calculateSmartCombos;
    };
    script.onerror = function() {
        console.warn('⚠️ combo-calculator.js failed to load, using fallback');
    };
    document.head.appendChild(script);
}

// Αυτόματη φόρτωση όταν η σελίδα είναι έτοιμη
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComboCalculator);
} else {
    loadComboCalculator();
}
// ==================== ΒΕΛΤΙΣΤΟΠΟΙΗΜΕΝΗ INITIALIZATION ====================
async function initApp() {
    console.log('🚀 Αρχικοποίηση εφαρμογής (βελτιστοποιημένη)...');
    
    try {
        // 1. ΜΕΤΡΗΣΗ ΧΡΟΝΟΥ ΑΡΧΙΚΟΠΟΙΗΣΗΣ
        const initStartTime = performance.now();
        
        // 2. ΤΑΥΤΟΧΡΟΝΗ ΦΟΡΤΩΣΗ (Παράλληλη εκτέλεση πολλών εργασιών)
        await Promise.all([
            loadSavedData(),
            setupMobileNavigation(),
            setupStepNavigation() // 🚨 ΠΡΟΣΘΗΚΗ ΕΔΩ!
        ]);
        
        // 3. ΡΥΘΜΙΣΗ EVENT LISTENERS (Χωρίς να περιμένουμε)
        setTimeout(() => setupEventListeners(), 0);
        
        // 4. ΕΜΦΑΝΙΣΗ ΤΟΥ ΣΩΣΤΟΥ ΒΗΜΑΤΟΣ
        showStep(state.currentStep);
        
        // 5. ΑΝΑΝΕΩΣΗ ΚΟΣΤΟΥΣ
        updateActivitiesCost();
        
        // 6. ΑΠΟΚΡΥΨΗ LOADING ΜΕΤΑ ΑΠΟ ΣΥΓΚΕΚΡΙΜΕΝΟ ΧΡΟΝΟ
        setTimeout(() => {
            const loadingOverlay = document.getElementById('loading-overlay');
            if (loadingOverlay) {
                loadingOverlay.style.opacity = '0';
                loadingOverlay.style.transition = 'opacity 0.5s ease';
                
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                    console.log('✅ Αεροπλάνακι κρύφτηκε (ομαλά)');
                    
                    // Επιπλέον cleanup αν χρειάζεται
                    cleanupDuplicateButtons();
                    
                }, 500);
            }
        }, 1000); // Μειώσαμε το χρόνο από 1500 σε 1000ms
        
        // 7. ΕΚΤΥΠΩΣΗ ΣΤΑΤΙΣΤΙΚΩΝ
        const initEndTime = performance.now();
        console.log(`✅ Αρχικοποίηση ολοκληρώθηκε σε ${(initEndTime - initStartTime).toFixed(0)}ms`);
        
    } catch (error) {
        console.error('❌ ΚΡΙΤΙΚΟ ΣΦΑΛΜΑ αρχικοποίησης:', error);
        
        // 8. ΕΜΦΑΝΙΣΗ ΦΙΛΙΚΟΥ ΜΗΝΥΜΑΤΟΣ ΣΦΑΛΜΑΤΟΣ
        showEmergencyError(
            'Σφάλμα φόρτωσης εφαρμογής',
            'Παρακαλώ ανανεώστε τη σελίδα ή επικοινωνήστε με την υποστήριξη.',
            error.message
        );
        
        // 9. ΠΑΡΑΜΕΝΟΥΜΕ ΣΤΟ LOADING STATE
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div style="text-align: center; padding: 40px; color: white;">
                    <div style="font-size: 64px; margin-bottom: 20px;">⚠️</div>
                    <h3 style="color: white; margin-bottom: 15px;">Σφάλμα Φόρτωσης</h3>
                    <p style="margin-bottom: 25px;">${error.message}</p>
                    <button onclick="location.reload()" 
                            style="padding: 12px 30px; background: white; color: #4F46E5; 
                                   border: none; border-radius: 8px; font-weight: bold; 
                                   cursor: pointer;">
                        <i class="fas fa-redo"></i> Ανανέωση Σελίδας
                    </button>
                </div>
            `;
        }
    }
}

// ==================== ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ====================

function cleanupDuplicateButtons() {
    console.log('🧹 Καθαρισμός διπλών κουμπιών...');
    
    const duplicateButtons = document.getElementById('search-buttons-container');
    if (duplicateButtons) {
        duplicateButtons.style.display = 'none';
        console.log('✅ Διπλά κουμπιά αφαιρέθηκαν');
    }
}

function showEmergencyError(title, message, technicalDetails = '') {
    // Απλοποιημένη έκδοση - θα την ολοκληρώσουμε στο επόμενο βήμα
    alert(`⚠️ ${title}\n\n${message}\n\nΛεπτομέρειες: ${technicalDetails}`);
}

// Απλοποιημένη version για τώρα
function setupEventListeners() {
    console.log('🔧 Ρύθμιση event listeners...');
    
    try {
        const resetButton = document.getElementById('reset-all');
        if (resetButton) {
            resetButton.addEventListener('click', function() {
                if (confirm('⚠️ Θέλετε να διαγράψετε όλα τα δεδομένα;')) {
                    localStorage.clear();
                    sessionStorage.clear();
                    location.reload();
                }
            });
        }
        
        console.log('✅ Event listeners εγκαταστάθηκαν');
    } catch (error) {
        console.warn('⚠️ Μερικά event listeners απέτυχαν:', error);
    }
}
// ==================== ΕΝΗΜΕΡΩΣΗ ΣΥΜΒΑΤΟΤΗΤΑΣ ====================
console.log('🔄 Συμβατότητα: createSmartClusters → createGeographicClusters');

// Έλεγχος ότι οι νέες συναρτήσεις είναι διαθέσιμες
if (typeof createGeographicClusters === 'function') {
    console.log('✅ createGeographicClusters είναι διαθέσιμη');
} else {
    console.error('❌ createGeographicClusters ΔΕΝ βρέθηκε!');
}

if (typeof calculateClusterCenter === 'function') {
    console.log('✅ calculateClusterCenter είναι διαθέσιμη');
} else {
    console.error('❌ calculateClusterCenter ΔΕΝ βρέθηκε!');
}

console.log('✅ Script.js loaded successfully!');
// ==================== ΝΕΑ ΣΥΝΑΡΤΗΣΗ SMART CLUSTERING ====================
// ΑΝΤΙ για αυτή τη μεγάλη createSmartClusters() (γραμμές 2330-2480)
// Δημιούργησε μια ΝΕΑ συνάρτηση:
function createGeographicClusters(activities, maxDistanceKm = 1.5, minPoints = 2) {
    console.log('📍 Δημιουργία γεωγραφικών συστάδων (DBSCAN-like)...');
    
    if (!activities || activities.length === 0) {
        console.log('⚠️ Δεν υπάρχουν δραστηριότητες');
        return [];
    }
    
    // 1. Φίλτραρε μόνο δραστηριότητες με location
    const activitiesWithLocation = activities.filter(act => 
        act.location && 
        typeof act.location.lat === 'number' && 
        typeof act.location.lng === 'number'
    );
    
    console.log(`📊 ${activitiesWithLocation.length} από ${activities.length} έχουν τοποθεσία`);
    
    if (activitiesWithLocation.length === 0) {
        // Επιστροφή μονών δραστηριοτήτων
        return activities.map(act => ({
            center: null,
            activities: [act],
            count: 1,
            radius: 0
        }));
    }
    
    // 2. DBSCAN Algorithm
    const clusters = [];
    const visited = new Set();
    const noise = new Set();
    
    // Βοηθητική: Βρες γείτονες
    function findNeighbors(pointIndex, points) {
        const neighbors = [];
        const point = points[pointIndex];
        
        points.forEach((other, otherIndex) => {
            if (pointIndex === otherIndex) return;
            
            const distance = calculateDistance(
                [point.location.lat, point.location.lng],
                [other.location.lat, other.location.lng]
            );
            
            if (distance <= maxDistanceKm) {
                neighbors.push(otherIndex);
            }
        });
        
        return neighbors;
    }
    
    // Expand cluster (πραγματικό DBSCAN expansion)
    function expandCluster(pointIndex, neighbors, cluster, points) {
        cluster.push(points[pointIndex]);
        visited.add(pointIndex);
        
        // Για κάθε γείτονα
        for (let i = 0; i < neighbors.length; i++) {
            const neighborIndex = neighbors[i];
            
            if (!visited.has(neighborIndex)) {
                visited.add(neighborIndex);
                
                const neighborNeighbors = findNeighbors(neighborIndex, points);
                if (neighborNeighbors.length >= minPoints - 1) {
                    // Προσθήκη νέων γειτόνων
                    neighbors.push(...neighborNeighbors.filter(n => !neighbors.includes(n)));
                }
            }
            
           // Αν δεν ανήκει ήδη σε ΑΥΤΗΝ ΤΗΝ cluster, πρόσθεσε τον
const alreadyInThisCluster = cluster.includes(points[neighborIndex]);

if (!alreadyInThisCluster) {
    cluster.push(points[neighborIndex]);
}
        }
    }
    
    // Κύριος αλγόριθμος
    activitiesWithLocation.forEach((point, pointIndex) => {
        if (visited.has(pointIndex)) return;
        
        visited.add(pointIndex);
        
        const neighbors = findNeighbors(pointIndex, activitiesWithLocation);
        
        if (neighbors.length < minPoints - 1) {
            // Noise point - θα το χειριστούμε αργότερα
            noise.add(pointIndex);
        } else {
            // Δημιούργησε νέα σύσταδα
            const cluster = [];
            expandCluster(pointIndex, neighbors, cluster, activitiesWithLocation);
            
            if (cluster.length > 0) {
                // Υπολογισμός κέντρου
                const center = calculateClusterCenter(cluster);
                
                clusters.push({
                    center: center,
                    activities: cluster,
                    count: cluster.length,
                    radius: maxDistanceKm
                });
            }
        }
    });
    
    // 3. Χειρισμός noise points (μονές δραστηριότητες)
    noise.forEach(noiseIndex => {
        const noiseActivity = activitiesWithLocation[noiseIndex];
        
        // Ψάξε την πιο κοντινή σύσταδα
        let nearestCluster = null;
        let minDistance = Infinity;
        
        clusters.forEach(cluster => {
            if (cluster.center) {
                const distance = calculateDistance(
                    cluster.center,
                    [noiseActivity.location.lat, noiseActivity.location.lng]
                );
                
                if (distance < minDistance && distance <= maxDistanceKm * 3) {
                    minDistance = distance;
                    nearestCluster = cluster;
                }
            }
        });
        
        if (nearestCluster) {
            // Βάλε την στην κοντινή σύσταδα
            nearestCluster.activities.push(noiseActivity);
            nearestCluster.count++;
            // Επανυπολόγισε το κέντρο
            nearestCluster.center = calculateClusterCenter(nearestCluster.activities);
        } else {
            // Δημιούργησε νέα σύσταδα για μονή δραστηριότητα
            clusters.push({
                center: [noiseActivity.location.lat, noiseActivity.location.lng],
                activities: [noiseActivity],
                count: 1,
                radius: 0
            });
        }
    });
    
    // 4. Δραστηριότητες χωρίς location (προσθήκη σε τυχαία σύσταδα)
    const activitiesWithoutLocation = activities.filter(act => 
        !act.location || 
        typeof act.location.lat !== 'number' || 
        typeof act.location.lng !== 'number'
    );
    
    if (activitiesWithoutLocation.length > 0) {
    console.log(`➕ Προσθήκη ${activitiesWithoutLocation.length} δραστηριοτήτων χωρίς location`);
    
    activitiesWithoutLocation.forEach((act, index) => {
        // Βάλε μόνο αν αυτή η δραστηριότητα ΔΕΝ είναι ήδη σε κάποια σύσταδα
        let alreadyInCluster = false;
        for (const cluster of clusters) {
            if (cluster.activities.some(a => a.id === act.id || a.name === act.name)) {
                alreadyInCluster = true;
                break;
            }
        }
        
        if (!alreadyInCluster) {
            if (clusters.length > 0) {
                // Βάλε στην πιο μικρή σύσταδα για ισορροπία
                const smallestCluster = clusters.reduce((min, cluster) => 
                    cluster.count < min.count ? cluster : min
                );
                smallestCluster.activities.push(act);
                smallestCluster.count++;
            } else {
                // Δημιούργησε νέα σύσταδα
                clusters.push({
                    center: null,
                    activities: [act],
                    count: 1,
                    radius: 0
                });
            }
        }
    });
}
    
    // 5. Ταξινόμηση συστάδων (μεγαλύτερες πρώτες)
    clusters.sort((a, b) => b.count - a.count);
    
    console.log(`✅ Δημιουργήθηκαν ${clusters.length} γεωγραφικές συστάδες:`);
    clusters.forEach((cluster, i) => {
        console.log(`   Σύσταδα ${i + 1}: ${cluster.count} δραστηριότητες`);
    });
    
    return clusters;
}

// Βοηθητική συνάρτηση για κέντρο συστάδας
function calculateClusterCenter(cluster) {
    if (!cluster || cluster.length === 0) return null;
    
    const activitiesWithLocation = cluster.filter(act => act.location);
    if (activitiesWithLocation.length === 0) return null;
    
    let totalLat = 0;
    let totalLng = 0;
    
    activitiesWithLocation.forEach(act => {
        totalLat += act.location.lat;
        totalLng += act.location.lng;
    });
    
    return [
        totalLat / activitiesWithLocation.length,
        totalLng / activitiesWithLocation.length
    ];
}

// ==================== ΤΕΛΟΣ ΝΕΑΣ ΣΥΝΑΡΤΗΣΗΣ ====================
function testNewClustering() {
    console.log('🧪 === ΣΥΓΚΡΙΣΗ ΠΑΛΙΑΣ vs ΝΕΑΣ ΜΕΘΟΔΟΥ ===');
    
    // Έλεγχος ότι έχουμε δεδομένα
    if (!state.selectedActivities || state.selectedActivities.length === 0) {
        alert('⚠️ Δεν έχετε επιλέξει δραστηριότητες!\nΠαρακαλώ πηγαίνετε στο βήμα 4.');
        return;
    }
    
    if (!state.currentCityActivities || state.currentCityActivities.length === 0) {
        alert('⚠️ Δεν υπάρχουν πληροφορίες για τις δραστηριότητες!');
        return;
    }
    
    // 1. Πάρε τις πλήρεις πληροφορίες για τις επιλεγμένες δραστηριότητες
    const fullActivities = state.selectedActivities.map(selected => {
        const original = state.currentCityActivities.find(a => a.id === selected.id);
        return original ? {
            ...selected,
            ...original,
            location: original.location || null
        } : null;
    }).filter(a => a !== null);
    
    console.log(`📊 Σύνολο: ${fullActivities.length} δραστηριότητες`);
    console.log(`📍 Με location: ${fullActivities.filter(a => a.location).length}`);
    
    const days = state.selectedDays || 3;
    console.log(`📅 Ημέρες: ${days}`);
    
    // 2. ΔΟΚΙΜΗ ΠΑΛΙΑΣ ΜΕΘΟΔΟΥ
    console.log('\n🔄 === ΠΑΛΙΑ ΜΕΘΟΔΟΥ (groupActivitiesByProximity) ===');
    let oldGroups = [];
    if (typeof groupActivitiesByProximity === 'function') {
        oldGroups = groupActivitiesByProximity(fullActivities, 2.5);
        console.log(`✅ Βρέθηκαν ${oldGroups.length} ομάδες:`);
        oldGroups.forEach((group, i) => {
            console.log(`   Ομάδα ${i+1}: ${group.count} δραστηριότητες`);
        });
    } else {
        console.log('❌ Η παλιά συνάρτηση δεν υπάρχει!');
    }
    
    // 3. ΔΟΚΙΜΗ ΝΕΑΣ ΜΕΘΟΔΟΥ
    console.log('\n🧠 === ΝΕΑ ΜΕΘΟΔΟΥ (createSmartClusters) ===');
    const newClusters = createSmartClusters(fullActivities, days);
    console.log(`✅ Δημιουργήθηκαν ${newClusters.length} ομάδες:`);
    newClusters.forEach((cluster, i) => {
        console.log(`   Ομάδα ${i+1}: ${cluster.length} δραστηριότητες`);
        // Εμφάνιση ονομάτων (μόνο τα πρώτα 3)
        cluster.slice(0, 3).forEach((act, j) => {
            console.log(`     ${j+1}. ${act.name.substring(0, 40)}${act.name.length > 40 ? '...' : ''}`);
        });
        if (cluster.length > 3) {
            console.log(`     ... και ${cluster.length - 3} ακόμη`);
        }
    });
    
    // 4. ΣΥΓΚΡΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
    console.log('\n📈 === ΣΥΓΚΡΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ ===');
    console.log(`🔹 Παλιά μέθοδος: ${oldGroups.length} ομάδες, συνολικά ${oldGroups.reduce((sum, g) => sum + g.count, 0)} δραστηριότητες`);
    console.log(`🔹 Νέα μέθοδος: ${newClusters.length} ομάδες, συνολικά ${newClusters.reduce((sum, c) => sum + c.length, 0)} δραστηριότητες`);
    
    // 5. ΑΠΟΤΕΛΕΣΜΑ ΣΕ ΑΛΕΡΤ
    alert(`🧪 Σύγκριση ολοκληρώθηκε!\n\n` +
          `📊 Σύνολο: ${fullActivities.length} δραστηριότητες\n` +
          `🔄 Παλιά μέθοδος: ${oldGroups.length} ομάδες\n` +
          `🧠 Νέα μέθοδος: ${newClusters.length} ομάδες\n\n` +
          `📖 Άνοιξε την Console (F12) για λεπτομέρειες.`);
    
    console.log('✅ === ΤΕΛΟΣ ΣΥΓΚΡΙΣΗΣ ===');
}
