// ==================== CORE MODULE ====================
// Navigation, initialization, and app startup functions
// Dependencies: All other modules

import { saveState, showToast, showSavedTripModal, closeSavedTripModal } from './ui.js';
import {
    getStepName,
    getDestinationStepHTML,
    getFlightStepHTML,
    getHotelStepHTML,
    getActivitiesStepHTML,
    getSummaryStepHTML,
    getMapStepHTML
} from './ui-templates.js';
import {
    filterDestinations,
    selectDestination,
    showQuickRecommendations,
    resetFilters
} from './destinations.js';
import { getCityCoordinates } from './data.js';

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

// ==================== MAP CLEANUP ====================
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

// ==================== INITIALIZATION ====================
export function initApp() {
    console.log('🚀 Εκκίνηση εφαρμογής...');

    // Safety check: ensure state exists
    if (!window.state) {
        console.error('❌ CRITICAL: State not initialized! Creating default state...');
        window.state = {
            selectedDestination: null,
            selectedDestinationId: null,
            selectedDays: 0,
            familyMembers: [
                { name: "Ενήλικας 1", age: "" },
                { name: "Ενήλικας 2", age: "" }
            ],
            currentStep: 'destination',
            currentCityActivities: [],
            customPoints: [],
            selectedActivities: [],
            geographicProgram: null
        };
    }

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
        showStep(window.state.currentStep || 'destination');
        console.log('✅ Εφαρμογή αρχικοποιήθηκε');
    }, 100);

    // 7. Απόκρυψη loading overlay (airplane animation)
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            loadingOverlay.style.transition = 'opacity 0.5s ease';

            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                console.log('✅ Loading overlay hidden');
            }, 500);
        }
    }, 1000);
}

// ==================== MOBILE NAVIGATION ====================
export function setupMobileNavigation() {
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

// ==================== LOAD SAVED DATA ====================
export function loadSavedData() {
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

export function loadSavedDataNow(saved) {
    try {
        // Safety check: ensure state exists
        if (!window.state) {
            console.error('❌ State not initialized! Cannot load saved data.');
            return;
        }

        let data = JSON.parse(saved);

        // Validate and sanitize data before loading
        data = StateValidator.sanitizeData(data);

        // Safe property assignments with explicit state reference
        window.state.selectedDestination = data.selectedDestinationName || null;
        window.state.selectedDestinationId = data.selectedDestinationId || null;
        window.state.selectedDays = data.selectedDaysStay || 0;
        window.state.familyMembers = data.familyMembers || window.state.familyMembers;
        window.state.selectedActivities = data.selectedActivities || [];

        // Restore persisted program data
        window.state.geographicProgram = data.geographicProgram || null;
        window.state.currentCityActivities = data.currentCityActivities || [];

        // Update display with null check for DOM element
        if (window.state.selectedDestination) {
            const el = document.getElementById('current-destination-display');
            if (el) {
                el.textContent = window.state.selectedDestination;
            }
        }

        console.log('📂 Φορτώθηκαν αποθηκευμένα δεδομένα:', {
            destination: window.state.selectedDestination,
            days: window.state.selectedDays,
            activities: window.state.selectedActivities.length,
            familyMembers: window.state.familyMembers.length,
            hasProgram: !!window.state.geographicProgram,
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

export function showSavedTripNotification(data) {
    // Safety check: ensure state exists
    if (!window.state) {
        console.warn('⚠️ State not initialized in showSavedTripNotification');
        return;
    }

    // Determine which steps are completed
    const completedSteps = [];
    if (window.state.selectedDestination) completedSteps.push('Προορισμός');
    if (window.state.selectedActivities && window.state.selectedActivities.length > 0) completedSteps.push('Δραστηριότητες');
    if (window.state.geographicProgram) completedSteps.push('Πρόγραμμα');

    const message = `
        <div style="max-width: 450px; text-align: left; font-family: 'Roboto', sans-serif;">
            <h3 style="margin: 0 0 15px 0; color: #4F46E5; font-size: 20px;">
                <i class="fas fa-suitcase-rolling"></i> Καλώς ήρθατε πίσω!
            </h3>

            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 15px; border-radius: 10px; margin-bottom: 15px; border-left: 4px solid #4F46E5;">
                <div style="font-size: 15px; font-weight: bold; color: #1e293b; margin-bottom: 10px;">
                    📍 ${window.state.selectedDestination || 'Προορισμός'}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; color: #475569;">
                    <div>
                        <i class="fas fa-calendar-alt" style="color: #10B981; margin-right: 5px;"></i>
                        <strong>${window.state.selectedDays || 0}</strong> μέρες
                    </div>
                    <div>
                        <i class="fas fa-users" style="color: #F59E0B; margin-right: 5px;"></i>
                        <strong>${window.state.familyMembers ? window.state.familyMembers.length : 0}</strong> άτομα
                    </div>
                    <div>
                        <i class="fas fa-map-marked-alt" style="color: #EF4444; margin-right: 5px;"></i>
                        <strong>${window.state.selectedActivities ? window.state.selectedActivities.length : 0}</strong> δραστηριότητες
                    </div>
                    <div>
                        <i class="fas fa-route" style="color: #8B5CF6; margin-right: 5px;"></i>
                        ${window.state.geographicProgram ? '<strong>✅ Πρόγραμμα</strong>' : '<span style="color: #94a3b8;">Χωρίς πρόγραμμα</span>'}
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

    // Use modal instead of toast - requires user action to close
    showSavedTripModal(message);
}

export function updateSidebarCompletionIndicators() {
    // Safety check: ensure state exists
    if (!window.state) {
        console.warn('⚠️ State not initialized in updateSidebarCompletionIndicators');
        return;
    }

    // Add completion indicators to sidebar steps
    const steps = document.querySelectorAll('.step');

    steps.forEach(step => {
        const stepName = step.dataset.step;
        let isCompleted = false;
        let icon = step.querySelector('i');

        // Determine if step is completed
        switch(stepName) {
            case 'destination':
                isCompleted = window.state.selectedDestination && window.state.selectedDays > 0;
                break;
            case 'flight':
            case 'hotel':
                // These are optional external links, always show as available
                isCompleted = false;
                break;
            case 'activities':
                isCompleted = window.state.selectedActivities.length > 0;
                break;
            case 'summary':
                isCompleted = window.state.geographicProgram !== null;
                break;
            case 'map':
                isCompleted = window.state.selectedActivities.length > 0 || (window.state.customPoints && window.state.customPoints.length > 0);
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
export function setupStepNavigation() {
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

export function showStep(stepName) {
    console.log(`📱 Εμφάνιση βήματος: ${stepName}`);

    // Safety check: ensure state exists
    if (!window.state) {
        console.error('❌ State not initialized in showStep!');
        return;
    }

    window.state.currentStep = stepName;
    updateStepUI(stepName);
    loadStepContent(stepName);
    const mobileSelector = document.getElementById('mobile-step-selector');
    if (mobileSelector) {
        mobileSelector.value = stepName;
    }
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

export function updateStepUI(activeStep) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    const activeElement = document.querySelector(`.step[data-step="${activeStep}"]`);
    if (activeElement) {
        activeElement.classList.add('active');
    }
}

export function loadStepContent(stepName) {
    const stepContent = document.getElementById('step-content');

    // Cleanup map when leaving map step (using MapManager)
    if (stepName !== 'map') {
        if (window.MapManager) {
            window.MapManager.cleanup();
        }
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
            break;
       case 'activities':
    stepContent.innerHTML = getActivitiesStepHTML();
    setupActivitiesStep();
    break;
        case 'summary':
    stepContent.innerHTML = getSummaryStepHTML();
    setTimeout(() => {
        setupSummaryStep();
    }, 50);
    break;
        case 'map':
    stepContent.innerHTML = getMapStepHTML();
    setTimeout(() => {
        if (typeof L !== 'undefined') {
            setupMapStep();
        } else {
            console.error('❌ Leaflet δεν φορτώθηκε');
            stepContent.innerHTML = `
                <div class="card">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Σφάλμα φόρτωσης χάρτη: Η βιβλιοθήκη Leaflet δεν φορτώθηκε</p>
                    </div>
                </div>
            `;
        }
    }, 300);
    break;
        default:
            stepContent.innerHTML = `<div class="card"><p>Άγνωστο βήμα: ${stepName}</p></div>`;
    }
}

// ==================== EVENT LISTENERS ====================
export function setupEventListeners() {
    document.getElementById('reset-all').addEventListener('click', function() {
        if (confirm('⚠️ Θέλετε να διαγράψετε όλα τα δεδομένα;')) {
            localStorage.clear();
            location.reload();
        }
    });

    console.log('✅ Event listeners εγκαταστάθηκαν');
}

// ==================== BUTTON FIX ====================
export function fixDestinationButtons() {
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

// ==================== STEP SETUP FUNCTIONS ====================

export function setupDestinationStep() {
    console.log('📍 Ρύθμιση βήματος προορισμού');

    // Safety check: ensure state exists
    if (window.state && window.state.selectedDestination) {
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

export function showSelectedDestination() {
    // Safety check: ensure state exists
    if (!window.state) {
        console.warn('⚠️ State not initialized in showSelectedDestination');
        return;
    }

    console.log('📍 Επιλεγμένος προορισμός:', window.state.selectedDestination);
}

// These functions are called from loadStepContent and need to be imported from script.js
// For now, we'll export placeholder functions and import the real ones later
export async function setupActivitiesStep() {
    console.log('🎯 Ρύθμιση βήματος δραστηριοτήτων για:', window.state?.selectedDestinationId);

    // SAFETY CHECK: Ensure state exists
    if (!window.state) {
        console.error('❌ State not initialized in setupActivitiesStep!');
        return;
    }

    if (!window.state.selectedDestinationId) {
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
                <p style="color: var(--gray);">Φόρτωση δραστηριοτήτων για ${window.state.selectedDestination}...</p>
                <p style="font-size: 14px; color: #666; margin-top: 10px;">
                    Αναζήτηση: <code>data/${window.state.selectedDestinationId}.json</code>
                </p>
            </div>
        </div>
    `;

    try {
        // ΒΗΜΑ: Φόρτωσε το JSON
        console.log(`📂 Προσπαθώ να φορτώσω: data/${window.state.selectedDestinationId}.json`);

        const response = await fetch(`data/${window.state.selectedDestinationId}.json`);

        if (!response.ok) {
            throw new Error(`Δεν βρέθηκε το αρχείο (${response.status})`);
        }

        const cityData = await response.json();
        console.log('✅ JSON φορτώθηκε:', cityData.city);

        if (!cityData.activities || !Array.isArray(cityData.activities)) {
            throw new Error('Το JSON δεν έχει πίνακα activities');
        }

        // Αποθήκευσε τις δραστηριότητες στο state
        window.state.currentCityActivities = cityData.activities;
        console.log(`📊 Βρέθηκαν ${cityData.activities.length} δραστηριότητες`);

        // ΒΗΜΑ: Δημιούργησε τις κάρτες δραστηριοτήτων
        let html = '';
        if (window.state.currentCityActivities.length === 0) {
            html = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        <p>Δεν βρέθηκαν διαθέσιμες δραστηριότητες για την πόλη ${cityData.city}.</p>
                    </div>
                </div>
            `;
       } else {
    // ==================== HELPER FUNCTIONS ====================

    // Helper: Check if activity is free for all ages
    function isActivityFreeForAll(prices) {
        return Object.values(prices).every(p => p === 0);
    }

    // Helper: Get free age range text
    function getFreeAgeRange(prices) {
        const freeAges = Object.entries(prices)
            .filter(([age, price]) => price === 0 && age !== 'adult')
            .map(([age]) => parseInt(age))
            .filter(age => !isNaN(age));

        if (freeAges.length === 0) return null;

        const maxFreeAge = Math.max(...freeAges);
        return `ΔΩΡΕΑΝ ΓΙΑ ΚΑΤΩ ΤΩΝ ${maxFreeAge + 1} ΕΤΩΝ`;
    }

    // Helper: Categorize activity for sorting (returns priority number)
    function categorizeActivity(activity) {
        const isPlayground = activity.tags?.includes('playground') || activity.activityType === 'playground';
        const isMuseum = activity.category === 'museum';

        if (activity.top) return 1;      // Top activities first
        if (isMuseum) return 2;          // Museums second
        if (isPlayground) return 5;      // Playgrounds fourth
        return 3;                        // Other activities third
    }

    // ==================== REQUIRED USER NOTICE ====================
    html += `
        <div class="required-notice" style="grid-column: 1/-1; background: linear-gradient(135deg, #FFF3CD 0%, #FFF8E1 100%); border: 2px solid #F59E0B; border-radius: 12px; padding: 20px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);">
            <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="font-size: 32px; flex-shrink: 0;">⚠️</div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 10px 0; color: #92400E; font-size: 18px;">
                        <i class="fas fa-exclamation-circle"></i> Απαιτούμενες Ενέργειες
                    </h3>
                    <p style="margin: 0; color: #78350F; font-size: 15px; line-height: 1.6;">
                        Για να υπολογιστεί σωστά το κόστος, πρέπει να δηλωθεί υποχρεωτικά η σύνθεση των ταξιδιωτών (ηλικίες).
                        Για να μπορέσει να δημιουργηθεί το πρόγραμμα στο επόμενο βήμα, πρέπει να επιλεγούν όλες οι δραστηριότητες, συμπεριλαμβανομένων και των δωρεάν.
                    </p>
                </div>
            </div>
        </div>
    `;

    // ==================== CITY PASS INFO (if available) ====================
    if (cityData.cityPass) {
        html += `
            <div class="city-pass-info card" style="grid-column: 1/-1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-bottom: 20px;">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <i class="fas fa-ticket-alt fa-3x"></i>
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 5px 0; font-size: 20px;">${cityData.cityPass.name}</h3>
                        <p style="margin: 0; opacity: 0.95; font-size: 14px;">${cityData.cityPass.description}</p>
                        <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 16px;">
                            💰 Έως ${cityData.cityPass.discountPercent}% έκπτωση
                        </p>
                        ${cityData.cityPass.url ? `
                            <a href="${cityData.cityPass.url}" target="_blank" rel="noopener"
                               style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: white; color: #667eea; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                                <i class="fas fa-external-link-alt"></i> Περισσότερες Πληροφορίες
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== INFO BOXES (if available) ====================
    console.log('🔍 Checking for infoBoxes:', cityData.infoBoxes);
    if (cityData.infoBoxes && Array.isArray(cityData.infoBoxes)) {
        console.log('✅ Found infoBoxes, rendering:', cityData.infoBoxes.length);
        cityData.infoBoxes.forEach((infoBox) => {
            console.log('📦 Rendering infoBox:', infoBox.title);
            // Define color schemes for different box types
            const colorSchemes = {
                turquoise: {
                    background: 'linear-gradient(135deg, #40E0D0 0%, #48D1CC 100%)',
                    border: '#20B2AA',
                    text: '#ffffff',
                    linkBg: '#ffffff',
                    linkText: '#20B2AA'
                },
                purple: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: '#5a67d8',
                    text: '#ffffff',
                    linkBg: '#ffffff',
                    linkText: '#667eea'
                },
                blue: {
                    background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                    border: '#1D4ED8',
                    text: '#ffffff',
                    linkBg: '#ffffff',
                    linkText: '#2563EB'
                },
                green: {
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    border: '#047857',
                    text: '#ffffff',
                    linkBg: '#ffffff',
                    linkText: '#059669'
                },
                orange: {
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    border: '#B45309',
                    text: '#ffffff',
                    linkBg: '#ffffff',
                    linkText: '#D97706'
                }
            };

            const colorScheme = colorSchemes[infoBox.color] || colorSchemes.turquoise;

            html += `
                <div class="info-box" style="grid-column: 1/-1; background: ${colorScheme.background}; color: ${colorScheme.text}; border: 2px solid ${colorScheme.border}; border-radius: 12px; padding: 20px; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <h3 style="margin: 0; font-size: 20px; font-weight: bold;">
                            ${infoBox.title}
                        </h3>
                        <p style="margin: 0; font-size: 15px; line-height: 1.6; opacity: 0.95;">
                            ${infoBox.body}
                        </p>
                        ${infoBox.links && infoBox.links.length > 0 ? `
                            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 5px;">
                                ${infoBox.links.map(link => `
                                    <a href="${link.url}" target="_blank" rel="noopener noreferrer"
                                       style="display: inline-block; padding: 8px 16px; background: ${colorScheme.linkBg}; color: ${colorScheme.linkText}; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; transition: transform 0.2s, box-shadow 0.2s;">
                                        <i class="fas fa-external-link-alt"></i> ${link.text}
                                    </a>
                                `).join('')}
                            </div>
                        ` : ''}
                        ${infoBox.closingLine ? `
                            <p style="margin: 0; font-size: 15px; font-style: italic; opacity: 0.9; margin-top: 5px;">
                                ${infoBox.closingLine}
                            </p>
                        ` : ''}
                    </div>
                </div>
            `;
        });
    } else {
        console.log('⚠️ No infoBoxes found in cityData');
    }

    // ==================== SORT ACTIVITIES BY CATEGORY ====================
    const sortedActivities = [...window.state.currentCityActivities].sort((a, b) => {
        const catA = categorizeActivity(a);
        const catB = categorizeActivity(b);

        if (catA !== catB) return catA - catB;
        return a.name.localeCompare(b.name);
    });

    // ==================== RENDER WITH SECTION HEADERS ====================
    let currentCategory = null;

    sortedActivities.forEach((activity) => {
        const category = categorizeActivity(activity);
        const isPlayground = activity.tags?.includes('playground') || activity.activityType === 'playground';
        const isFreeForAll = isActivityFreeForAll(activity.prices);
        const freeAgeRange = getFreeAgeRange(activity.prices);
        const cityPassEligible = cityData.cityPass?.applicableActivities?.includes(activity.id);

        // Add section header when category changes
        if (category !== currentCategory) {
            const headers = {
                1: { title: '⭐ TOP ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ', note: null },
                2: { title: '🏛️ ΜΟΥΣΕΙΑ', note: null },
                3: { title: '🎯 ΑΛΛΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ', note: null },
                5: { title: '🎠 ΠΑΙΔΙΚΕΣ ΧΑΡΕΣ', note: null }
            };

            const header = headers[category];
            html += `
                <div class="activity-section-header">
                    <h2>${header.title}</h2>
                    ${header.note ? `
                        <div class="activity-section-note">
                            <i class="fas fa-info-circle"></i> ${header.note}
                        </div>
                    ` : ''}
                </div>
            `;
            currentCategory = category;
        }

        // ==================== RENDER ACTIVITY CARD ====================
        // Υπολόγισε το κόστος για την οικογένεια (using window.calculateFamilyCost)
        const familyCost = window.calculateFamilyCost ? window.calculateFamilyCost(activity.prices) : 0;
        const isSelected = window.state.selectedActivities?.some(a => a.id === activity.id) || false;

        html += `
            <div class="activity-card ${isSelected ? 'selected' : ''} ${activity.top ? 'top-activity' : ''}"
                 onclick="toggleActivitySelection(${activity.id})"
                 data-activity-id="${activity.id}">

            <div class="activity-header">
                <div class="activity-emoji">${window.getActivityEmoji ? window.getActivityEmoji(activity.category) : '🎯'}</div>
                <div class="activity-title">
                    ${activity.website ?
                        `<a href="${activity.website}" target="_blank" rel="noopener" class="activity-link" onclick="event.stopPropagation()">
                            ${activity.name}
                            <i class="fas fa-external-link-alt"></i>
                         </a>`
                        : activity.name
                    }
                    ${activity.top ? '<span class="top-badge"><span class="top-emoji">🔝</span><span class="top-emoji">💯</span></span>' : ''}
                    ${cityPassEligible && cityData.cityPass ? (cityData.cityPass.url ?
                        `<a href="${cityData.cityPass.url}" target="_blank" rel="noopener" onclick="event.stopPropagation()" class="city-pass-badge" style="text-decoration: none;">🎫 Pass</a>` :
                        '<span class="city-pass-badge">🎫 Pass</span>') : ''}
                </div>
                <div class="activity-star">${isSelected ? '⭐' : '☆'}</div>
            </div>

            <!-- FREE PRICE LABEL (Horizontal) -->
            ${!isPlayground && (isFreeForAll || freeAgeRange) ? `
                <div class="free-price-label ${freeAgeRange ? 'free-price-label-conditional' : ''}">
                    ${isFreeForAll ? 'ΔΩΡΕΑΝ' : freeAgeRange}
                </div>
            ` : ''}

            <!-- PLAYGROUND LABEL -->
            ${isPlayground ? `
                <div class="playground-label">
                    <i class="fas fa-child"></i> ΠΑΙΔΙΚΗ ΧΑΡΑ
                </div>
            ` : ''}

            <div class="activity-description">
                ${activity.description || 'Δραστηριότητα για οικογένειες'}
            </div>

            <div style="font-size: 12px; color: var(--gray); margin: 10px 0;">
                <i class="fas fa-clock"></i> ${activity.duration_hours || '?'} ώρες
                <span style="margin-left: 15px;">
                    <i class="fas fa-tag"></i> ${activity.category || 'Γενική'}
                </span>
            </div>

            <!-- RESTAURANT/CAFE RECOMMENDATION -->
            ${activity.restaurant ? `
                <div class="restaurant-recommendation">
                    <div class="restaurant-header">
                        <i class="fas fa-utensils"></i>
                        <span class="restaurant-title">ΣΥΝΙΣΤΩΜΕΝΟ ${activity.restaurantType === 'cafe' ? 'ΚΑΦΕ' : 'ΕΣΤΙΑΤΟΡΙΟ'}</span>
                    </div>
                    <div class="restaurant-content">
                        <p>${activity.restaurant.replace(/<a /g, '<a target="_blank" rel="noopener" ')}</p>
                        <small class="restaurant-tip">
                            <i class="fas fa-walking"></i>
                            ${activity.restaurantType === 'cafe' ? 'καφέ' : 'εστιατόριο'} /
                            ${activity.restaurantDistance === 0 ? 'εντός του ίδιου χώρου' : `${activity.restaurantDistance} λεπτά με τα πόδια`}
                        </small>
                    </div>
                </div>
            ` : ''}

            <!-- ΤΙΜΕΣ -->
            ${window.state.familyMembers && window.state.familyMembers.length > 0 && window.state.familyMembers.every(m => m.age !== undefined && m.age !== null && m.age !== '') ? `
            <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0;">
                <div style="font-size: 12px; color: var(--gray); margin-bottom: 8px;">
                    <i class="fas fa-money-bill-wave"></i>
                    ${window.getPriceInfo ? window.getPriceInfo(activity.prices) : ''}
                </div>

                <!-- ΤΙΜΕΣ ΓΙΑ ΚΑΘΕ ΜΕΛΟΣ ΤΗΣ ΟΙΚΟΓΕΝΕΙΑΣ -->
                ${(window.state.familyMembers || []).map(member => {
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
                <i class="fas fa-users"></i> ${Number(familyCost).toFixed(2)}€ για ${window.state.familyMembers.length} ${window.state.familyMembers.length === 1 ? 'άτομο' : 'άτομα'}
            </div>
            ` : ''}
        </div>
        `;
    });
        }

        activitiesList.innerHTML = html;

        // Ενημέρωση συνολικού κόστους
        if (window.updateActivitiesTotal) {
            window.updateActivitiesTotal();
        }

        console.log('✅ Δραστηριότητες εμφανίστηκαν επιτυχώς');

        // 🔴 ΝΕΟ: ΑΠΟΘΗΚΕΥΣΗ ΤΩΝ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ ΓΙΑ ΤΟ ΒΗΜΑ 5
        console.log('💾 Αποθηκεύτηκαν', window.state.currentCityActivities.length, 'δραστηριότητες για το πρόγραμμα');

        if (window.saveState) {
            window.saveState();
        }
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
                        • Αρχείο: <code>data/${window.state?.selectedDestinationId || 'unknown'}.json</code><br>
                        • Προορισμός: ${window.state?.selectedDestination || 'Άγνωστο'}<br>
                        • ID: ${window.state?.selectedDestinationId || 'unknown'}
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

// ==================== STEP 5: SETUP SUMMARY ====================
export function setupSummaryStep() {
    console.log('📋 Ρύθμιση summary βήματος');

    // Safety check: ensure state exists
    if (!window.state) {
        console.error('❌ State not initialized in setupSummaryStep!');
        return;
    }

    if (!window.state.selectedDestination) {
        console.log('⚠️ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }


    // 🔴 ΠΡΟΣΘΗΚΗ: ΑΥΤΟΜΑΤΗ ΠΡΟΤΑΣΗ ΗΜΕΡΩΝ ΑΠΟ ΟΜΑΔΟΠΟΙΗΣΗ
    if (window.state.selectedActivities.length > 0) {
        const suggestedDays = suggestDaysFromGroups();
        if (suggestedDays > 0 && window.state.selectedDays !== suggestedDays) {
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
            daysSelect.value = window.state.selectedDays;

            console.log(`📅 Ρύθμιση dropdown στην τιμή: ${window.state.selectedDays}`);

            // Αφαίρεση παλιών event listeners
            const newDaysSelect = daysSelect.cloneNode(true);
            daysSelect.parentNode.replaceChild(newDaysSelect, daysSelect);

            // Προσθήκη νέου event listener
            newDaysSelect.addEventListener('change', function() {
                const selectedDays = parseInt(this.value);
                console.log(`📅 Dropdown changed to: ${selectedDays}`);

                if (selectedDays > 0) {
                    window.state.selectedDays = selectedDays;

                    const daysDisplay = document.getElementById('days-display');
                    if (daysDisplay) {
                        daysDisplay.textContent = '✅ ' + selectedDays + ' μέρες επιλέχθηκαν';
                        daysDisplay.style.color = 'var(--success)';
                    }

                    window.saveState();

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
                    window.showToast(`📅 Οι ημέρες ενημερώθηκαν σε ${selectedDays}. Πατήστε "Δημιουργία Προγράμματος"`, 'success');
                   // 🔵 🔵 🔵 ΠΡΟΣΘΗΚΗ: Αυτόματη ανανέωση προγράμματος
                }
            });
        }

        // 2. Ενημέρωση εμφάνισης ημερών
        const daysDisplay = document.getElementById('days-display');
        if (daysDisplay) {
            daysDisplay.textContent = window.state.selectedDays > 0
                ? '✅ ' + window.state.selectedDays + ' μέρες επιλέχθηκαν'
                : '⚠️ Δεν έχετε επιλέξει ακόμα';
            daysDisplay.style.color = window.state.selectedDays > 0 ? 'var(--success)' : 'var(--warning)';
        }

        // 3. Δημιουργία προγράμματος ΜΟΝΟ αν υπάρχουν δραστηριότητες ΚΑΙ μέρες
       // 3. Δημιουργία προγράμματος ΜΟΝΟ αν υπάρχουν δραστηριότητες
if (window.state.selectedActivities.length > 0) {
    console.log(`📊 Έτοιμος για δημιουργία προγράμματος: ${window.state.selectedActivities.length} δραστηριότητες, ${window.state.selectedDays} μέρες`);

    // Εμφάνιση μηνύματος ετοιμότητας, ΟΧΙ loading ή duplicate button
    const programDiv = document.getElementById('geographic-program');
    if (programDiv) {
        programDiv.innerHTML = `
            <div style="padding: 30px 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 15px; color: var(--primary);">📍</div>
                <h4 style="color: var(--dark); margin-bottom: 10px;">Έτοιμο για Προγραμματισμό!</h4>
                <p style="color: var(--gray); margin-bottom: 20px;">
                    Πατήστε "ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ" παραπάνω<br>
                    για να ομαδοποιήσουμε τις ${window.state.selectedActivities.length} δραστηριότητες<br>
                    σε ${window.state.selectedDays} μέρες με βάση την τοποθεσία τους
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
        window.updateActivitiesCost();

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
    if (!programDiv || !window.state || window.state.selectedActivities.length === 0 || window.state.selectedDays === 0) {
        return;
    }

    const activitiesCount = window.state.selectedActivities.length;
    const daysCount = window.state.selectedDays;
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
        const dayActivities = window.state.selectedActivities.slice(startIndex, endIndex);
        const dayCost = dayActivities.reduce((sum, act) => sum + (act.price || 0), 0);

        html += `
            <div style="
                margin-bottom: 20px;
                padding: 15px;
                background: white;
                border-radius: 10px;
                border-left: 4px solid ${window.getDayColor ? window.getDayColor(day) : COLOR_PALETTE[day % COLOR_PALETTE.length]};
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="color: ${window.getDayColor ? window.getDayColor(day) : COLOR_PALETTE[day % COLOR_PALETTE.length]}; margin: 0;">
                        ΜΕΡΑ ${day}
                    </h4>
                    <span style="background: ${(window.getDayColor ? window.getDayColor(day) : COLOR_PALETTE[day % COLOR_PALETTE.length])}20; color: ${window.getDayColor ? window.getDayColor(day) : COLOR_PALETTE[day % COLOR_PALETTE.length]}; padding: 4px 10px; border-radius: 20px; font-size: 12px;">
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
                    <span style="color: ${window.getDayColor ? window.getDayColor(day) : COLOR_PALETTE[day % COLOR_PALETTE.length]};">${dayCost.toFixed(2)}€</span>
                </div>
            </div>
        `;
    }

    const totalCost = window.state.selectedActivities.reduce((sum, act) => sum + (act.price || 0), 0);

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
    if (!window.state || window.state.selectedActivities.length === 0) return 0;

    // Πάρε τις πλήρεις πληροφορίες για τις επιλεγμένες δραστηριότητες
    const selectedFullActivities = window.state.selectedActivities.map(selected =>
        window.state.currentCityActivities ? window.state.currentCityActivities.find(a => a.id === selected.id) : null
    ).filter(a => a !== undefined && a !== null);

    const groups = window.groupActivitiesByProximity ? window.groupActivitiesByProximity(selectedFullActivities, 2.0) : [];

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
export function setupMapStep() {
    console.log('🗺️ Ρύθμιση χάρτη για:', window.state?.selectedDestination);

    // Safety check: ensure state exists
    if (!window.state) {
        console.error('❌ State not initialized in setupMapStep!');
        return;
    }

    if (!window.state.selectedDestination) return;

    setTimeout(() => {
        window.initializeMap();

        // If a geographic program exists, automatically display it on the map
        if (window.state.geographicProgram && window.state.geographicProgram.days) {
            setTimeout(() => {
                // Check all day checkboxes
                const allCheckbox = document.querySelector('.day-checkbox[value="all"]');
                if (allCheckbox) {
                    allCheckbox.checked = true;
                }

                // Automatically apply the day filter to show all activities from the program
                if (window.applyDayFilter) {
                    window.applyDayFilter();
                }
                console.log('✅ Αυτόματη εμφάνιση προγράμματος στον χάρτη');
            }, 800);
        }
    }, 300);
}

// ==================== MANUAL DESTINATION MODAL ====================
// Module-level variables for destination dropdown
let destinationDropdown = null;
let isDropdownVisible = false;

export function showManualDestinationModal() {
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

export function closeManualDestinationModal() {
    if (destinationDropdown) {
        destinationDropdown.style.display = 'none';
    }
    isDropdownVisible = false;
    removeDropdownOverlay();
}

export function saveManualDestination() {
    // Safety check: ensure state exists
    if (!window.state) {
        console.error('❌ State not initialized in saveManualDestination!');
        return;
    }

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
    window.state.selectedDestination = cityName;
    window.state.selectedDestinationId = cityId;
    window.state.selectedDays = 0; // <-- ΒΑΖΟΥΜΕ 0, Ο ΧΡΗΣΤΗΣ ΘΑ ΤΙΣ ΕΠΙΛΕΞΕΙ ΣΤΟ ΒΗΜΑ 5

    // 🔴 ΚΑΘΑΡΙΣΜΟΣ ΔΕΔΟΜΕΝΩΝ ΠΡΟΗΓΟΥΜΕΝΗΣ ΠΟΛΗΣ
    window.state.selectedActivities = [];
    window.state.currentCityActivities = null;
    window.state.geographicProgram = null;
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

    if (window.updateActivitiesCost) {
        window.updateActivitiesCost();
    }

    closeManualDestinationModal();

    alert(`✅ Επιλέξατε: ${cityName}\n\nΣυνέχεια στις πτήσεις. Μπορείτε να ορίσετε τις μέρες στο βήμα "Πρόγραμμα".`);

    saveState();

    setTimeout(() => {
        showStep('flight');
    }, 1000);
}

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
