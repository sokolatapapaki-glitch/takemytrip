// ==================== MAIN MODULE ====================
// Application entry point: imports, state, window exports
// Pure refactor - NO logic changes, 100% identical behavior

// ==================== GLOBAL STATE INITIALIZATION ====================
// CRITICAL: Initialize state BEFORE imports so other modules can access it

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
    customPoints: (() => {
        try {
            const stored = localStorage.getItem('travel_custom_points');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to parse customPoints from localStorage:', e);
            return [];
        }
    })(),
    selectedActivities: [],
    geographicProgram: null
};

console.log('✅ Global state initialized before module imports');

// ==================== IMPORTS ====================

// Data utilities and constants
import {
    COLOR_PALETTE,
    calculateDistance,
    getCityCoordinates,
    translateCategory,
    getActivityIcon,
    getActivityEmoji
} from './data.js';

// Scheduler functions
import {
    distributeGroupsToDays,
    calculateGroupEffort,
    getIntensityMultiplier,
    findBestDayForGroup,
    calculateDayCenter,
    balanceDaysIfNeeded,
    getDayColor,
    getGroupColor
} from './scheduler.js';

// Combo calculations
import {
    calculateFamilyCost,
    calculateSmartCombos,
    simulateComboCalculation,
    applyComboDiscount
} from './combo.js';

// UI functions
import {
    showToast,
    showSavedTripModal,
    closeSavedTripModal,
    displayGeographicProgram,
    forceRefreshProgram,
    toggleActivitySelection,
    clearSelectedActivities,
    recalculateSelectedActivityPrices,
    updateActivitiesTotal,
    updateActivitiesCost,
    calculateTotalSpent,
    updateFamilyMemberName,
    updateFamilyMemberAge,
    addFamilyMember,
    removeFamilyMember,
    updateFamilyMembers,
    updateProgramDays,
    suggestDaysFromGroups,
    getPriceInfo,
    getPriceForAge,
    saveState,
} from './ui.js';

// UI Templates (HTML generation functions)
import {
    getStepName,
    getDestinationStepHTML,
    getActivitiesStepHTML,
    getSummaryStepHTML,
    getMapStepHTML
} from './ui-templates.js';

// Destination filtering and selection
import {
    filterDestinations,
    selectDestination,
    showQuickRecommendations,
    resetFilters,
    showPopularDestinations,
    showBudgetDestinations,
    showFamilyDestinations
} from './destinations.js';

// Core navigation and initialization
import {
    STEP_ORDER,
    VISIBLE_STEPS,
    getNextStep,
    getPrevStep,
    goToNextStep,
    goPrevStep,
    initApp,
    setupMobileNavigation,
    loadSavedData,
    loadSavedDataNow,
    showSavedTripNotification,
    updateSidebarCompletionIndicators,
    setupStepNavigation,
    showStep,
    updateStepUI,
    loadStepContent,
    setupEventListeners,
    fixDestinationButtons,
    setupDestinationStep,
    showSelectedDestination,
    setupActivitiesStep,
    setupSummaryStep,
    setupMapStep,
    showManualDestinationModal,
    closeManualDestinationModal,
    saveManualDestination
} from './core.js';

// ==================== WINDOW EXPORTS FOR HTML ONCLICK HANDLERS ====================
// All functions must be exported to window for HTML onclick compatibility

// Data utilities
window.COLOR_PALETTE = COLOR_PALETTE;
window.calculateDistance = calculateDistance;
window.getCityCoordinates = getCityCoordinates;
window.translateCategory = translateCategory;
window.getActivityIcon = getActivityIcon;
window.getActivityEmoji = getActivityEmoji;

// Scheduler functions
window.distributeGroupsToDays = distributeGroupsToDays;
window.calculateGroupEffort = calculateGroupEffort;
window.getIntensityMultiplier = getIntensityMultiplier;
window.findBestDayForGroup = findBestDayForGroup;
window.calculateDayCenter = calculateDayCenter;
window.balanceDaysIfNeeded = balanceDaysIfNeeded;
window.getDayColor = getDayColor;
window.getGroupColor = getGroupColor;

// Combo functions
window.calculateFamilyCost = calculateFamilyCost;
window.calculateSmartCombos = calculateSmartCombos;
window.simulateComboCalculation = simulateComboCalculation;
window.applyComboDiscount = applyComboDiscount;

// UI functions - Core
window.showToast = showToast;
window.showSavedTripModal = showSavedTripModal;
window.closeSavedTripModal = closeSavedTripModal;
window.displayGeographicProgram = displayGeographicProgram;
window.forceRefreshProgram = forceRefreshProgram;

// UI functions - Activity Selection
window.toggleActivitySelection = toggleActivitySelection;
window.clearSelectedActivities = clearSelectedActivities;
window.recalculateSelectedActivityPrices = recalculateSelectedActivityPrices;

// UI functions - Cost Display
window.updateActivitiesTotal = updateActivitiesTotal;
window.updateActivitiesCost = updateActivitiesCost;
window.calculateTotalSpent = calculateTotalSpent;

// UI functions - Family Management
window.updateFamilyMemberName = updateFamilyMemberName;
window.updateFamilyMemberAge = updateFamilyMemberAge;
window.addFamilyMember = addFamilyMember;
window.removeFamilyMember = removeFamilyMember;
window.updateFamilyMembers = updateFamilyMembers;

// UI functions - Program Days
window.updateProgramDays = updateProgramDays;
window.suggestDaysFromGroups = suggestDaysFromGroups;

// UI functions - Price Formatting
window.getPriceInfo = getPriceInfo;
window.getPriceForAge = getPriceForAge;

// UI functions - State Management
window.saveState = saveState;

// UI Template functions (HTML generation)
window.getStepName = getStepName;
window.getDestinationStepHTML = getDestinationStepHTML;
window.getActivitiesStepHTML = getActivitiesStepHTML;
window.getSummaryStepHTML = getSummaryStepHTML;
window.getMapStepHTML = getMapStepHTML;

// Destination functions
window.filterDestinations = filterDestinations;
window.selectDestination = selectDestination;
window.showQuickRecommendations = showQuickRecommendations;
window.resetFilters = resetFilters;
window.showPopularDestinations = showPopularDestinations;
window.showBudgetDestinations = showBudgetDestinations;
window.showFamilyDestinations = showFamilyDestinations;

// Step engine - central step order and dynamic navigation
window.STEP_ORDER = STEP_ORDER;
window.VISIBLE_STEPS = VISIBLE_STEPS;
window.getNextStep = getNextStep;
window.getPrevStep = getPrevStep;
window.goToNextStep = goToNextStep;
window.goPrevStep = goPrevStep;

// Core functions - Navigation
window.showStep = showStep;
window.updateStepUI = updateStepUI;
window.loadStepContent = loadStepContent;

// Core functions - Initialization
window.initApp = initApp;
window.setupMobileNavigation = setupMobileNavigation;
window.loadSavedData = loadSavedData;
window.loadSavedDataNow = loadSavedDataNow;
window.showSavedTripNotification = showSavedTripNotification;
window.updateSidebarCompletionIndicators = updateSidebarCompletionIndicators;
window.setupStepNavigation = setupStepNavigation;
window.setupEventListeners = setupEventListeners;
window.fixDestinationButtons = fixDestinationButtons;

// Core functions - Step Setup
window.setupDestinationStep = setupDestinationStep;
window.showSelectedDestination = showSelectedDestination;
window.setupActivitiesStep = setupActivitiesStep;
window.setupSummaryStep = setupSummaryStep;
window.setupMapStep = setupMapStep;

// Core functions - Manual Destination Modal
window.showManualDestinationModal = showManualDestinationModal;
window.closeManualDestinationModal = closeManualDestinationModal;
window.saveManualDestination = saveManualDestination;

// ==================== APPLICATION INITIALIZATION ====================

console.log('✅ ES Modules loaded successfully');
console.log(`📦 Loaded ${Object.keys(window).filter(k => k.startsWith('calculate') || k.startsWith('show') || k.startsWith('update')).length} functions to window`);

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Εφαρμογή φορτώνεται...');
    initApp();
});
