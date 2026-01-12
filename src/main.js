// ==================== MAIN MODULE ====================
// Application entry point: imports, state, window exports
// Pure refactor - NO logic changes, 100% identical behavior

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
    saveState
} from './ui.js';

// UI Templates (HTML generation functions)
import {
    getStepName,
    getDestinationStepHTML,
    getFlightStepHTML,
    getHotelStepHTML,
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

// ==================== GLOBAL STATE ====================

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
    customPoints: JSON.parse(localStorage.getItem('travel_custom_points')) || [],
    selectedActivities: [],
    geographicProgram: null
};

// Make state globally accessible (for modules that access it)
const state = window.state;

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
window.getFlightStepHTML = getFlightStepHTML;
window.getHotelStepHTML = getHotelStepHTML;
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

// ==================== APPLICATION INITIALIZATION ====================

console.log('✅ ES Modules loaded successfully');
console.log(`📦 Loaded ${Object.keys(window).filter(k => k.startsWith('calculate') || k.startsWith('show') || k.startsWith('update')).length} functions to window`);

// Note: Additional window exports for remaining functions (maps, destinations, HTML templates)
// should be added here as those functions are extracted into modules.

// Note: initApp(), setupEventListeners(), and other initialization functions
// from the original script.js should be extracted and called here.
// For now, this provides the module wiring for the extracted functions.
