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

// ==================== GLOBAL MAP VARIABLES (ΑΠΟ ΤΟ ΠΑΛΙΟ ΧΑΡΤΗ) ====================
window.firstPoint = null;
window.secondPoint = null;
window.currentRoutePolyline = null;
window.selectedMarkers = []; // Για ενώσεις σημείων
window.simpleMap = null;
window.travelMap = null;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Εφαρμογή φορτώνεται...');
    initApp();
    
    setTimeout(function() {
        const duplicateButtons = document.getElementById('search-buttons-container');
        if (duplicateButtons) {
            duplicateButtons.style.display = 'none';
            console.log('✅ Αφαίρεση διπλών κουμπιών');
        }
    }, 500);
});

function initApp() {
    console.log('🚀 Αρχικοποίηση εφαρμογής...');
    loadSavedData();
    setupStepNavigation();
    setupMobileNavigation();
    showStep(state.currentStep);
    setupEventListeners();
    updateActivitiesCost();
    
    // ΔΙΟΡΘΩΣΗ: Κρύψε το αεροπλάνακι!
    setTimeout(function() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            console.log('✅ Αεροπλάνακι κρύφτηκε!');
        }
        
        // Παραμένει η αφαίρεση διπλών κουμπιών (αν υπάρχουν)
        const duplicateButtons = document.getElementById('search-buttons-container');
        if (duplicateButtons) {
            duplicateButtons.style.display = 'none';
            console.log('✅ Αφαίρεση διπλών κουμπιών');
        }
    }, 1500);
    
    console.log('✅ Αρχικοποίηση ολοκληρώθηκε');
}
