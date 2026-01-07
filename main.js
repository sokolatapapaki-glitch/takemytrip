// ==================== MAIN FILE - ΕΝΩΣΗ ΟΛΩΝ ΤΩΝ ΣΥΝΑΡΤΗΣΕΩΝ ====================

// Οι παρακάτω συναρτήσεις έχουν ήδη οριστεί στα προηγούμενα αρχεία
// Αυτό το αρχείο δείχνει τη σειρά φόρτωσης και εξασφαλίζει συμβατότητα

console.log('🔗 Main.js - Ενώνει όλα τα αρχεία');

// Εξασφάλιση ότι το state είναι διαθέσιμο
if (typeof state === 'undefined') {
    console.error('❌ Το state δεν έχει φορτωθεί!');
}

// Εξαγωγή συναρτήσεων στο window object για global πρόσβαση
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
window.setupHotelStep = setupHotelStep;
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

// ========== ΕΠΙΠΛΕΟΝ ΠΟΥ ΜΠΟΡΕΙ ΝΑ ΧΡΕΙΑΖΟΝΤΑΙ ==========
window.getCityCoordinates = getCityCoordinates;
window.getActivityEmoji = getActivityEmoji;
window.calculateFamilyCost = calculateFamilyCost;
window.updateActivitiesTotal = updateActivitiesTotal;
window.saveState = saveState;
window.initializeSimpleMap = initializeSimpleMap;
window.loadActivitiesOnMap = loadActivitiesOnMap;
window.clearMap = clearMap;
window.showGroupedMap = showGroupedMap;            
window.initializeMapInStep = initializeMapInStep;
window.clearMapPoints = clearMapPoints;
window.forceRefreshProgram = forceRefreshProgram;
window.createSuggestedProgram = createSuggestedProgram;
window.getDayColor = getDayColor;

// ==================== EXPORT FUNCTIONS TO WINDOW ====================
// (ΟΠΟΥ ΕΧΕΙΣ ΟΛΑ ΤΑ window.* = ... ΤΩΡΑ)

window.showStep = showStep;
window.filterDestinations = filterDestinations;
// ... όλα τα υπόλοιπα window.* ...

// ==================== CSS ANIMATIONS FOR PROGRAM ====================
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

console.log('✅ Main.js loaded successfully!');
