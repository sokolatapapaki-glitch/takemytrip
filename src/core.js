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

// Access global state
const state = window.state;

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

    // Use modal instead of toast - requires user action to close
    showSavedTripModal(message);
}

export function updateSidebarCompletionIndicators() {
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

export function showSelectedDestination() {
    console.log('📍 Επιλεγμένος προορισμός:', state.selectedDestination);
}

// These functions are called from loadStepContent and need to be imported from script.js
// For now, we'll export placeholder functions and import the real ones later
export async function setupActivitiesStep() {
    // This function will remain in script.js for now due to its complexity
    // It will be called via window.setupActivitiesStep
    if (window.setupActivitiesStep) {
        await window.setupActivitiesStep();
    }
}

export function setupSummaryStep() {
    // This function will remain in script.js for now due to its complexity
    // It will be called via window.setupSummaryStep
    if (window.setupSummaryStep) {
        window.setupSummaryStep();
    }
}

export function setupMapStep() {
    // This function will remain in script.js for now due to its complexity
    // It will be called via window.setupMapStep
    if (window.setupMapStep) {
        window.setupMapStep();
    }
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
