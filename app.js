// ========== GLOBAL STATE ==========
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

window.firstPoint = null;
window.secondPoint = null;
window.currentRoutePolyline = null;
window.selectedMarkers = [];

// ========== INITIALIZATION ==========
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
    
    setTimeout(function() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
            console.log('✅ Αεροπλάνακι κρύφτηκε!');
        }
        
        const duplicateButtons = document.getElementById('search-buttons-container');
        if (duplicateButtons) {
            duplicateButtons.style.display = 'none';
            console.log('✅ Αφαίρεση διπλών κουμπιών');
        }
    }, 1500);
    
    console.log('✅ Αρχικοποίηση ολοκληρώθηκε');
}

// ========== MOBILE NAVIGATION ==========
function setupMobileNavigation() {
    console.log('📱 Ρύθμιση mobile navigation');
    
    const mobileSelector = document.getElementById('mobile-step-selector');
    if (!mobileSelector) return;
    
    mobileSelector.addEventListener('change', function() {
        const stepName = this.value;
        if (stepName) {
            showStep(stepName);
        }
    });
    
    const originalShowStep = showStep;
    showStep = function(stepName) {
        originalShowStep(stepName);
        if (mobileSelector && mobileSelector.value !== stepName) {
            mobileSelector.value = stepName;
        }
    };
}

// ========== LOAD SAVED DATA ==========
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
        const data = JSON.parse(saved);
        state.selectedDestination = data.selectedDestinationName || null;
        state.selectedDestinationId = data.selectedDestinationId || null;
        state.selectedDays = data.selectedDaysStay || 0;
        state.familyMembers = data.familyMembers || state.familyMembers;
        state.selectedActivities = data.selectedActivities || [];
        
        if (state.selectedDestination) {
            document.getElementById('current-destination-display').textContent = state.selectedDestination;
        }
        
        console.log('📂 Φορτώθηκαν αποθηκευμένα δεδομένα:', data);
    } catch (error) {
        console.error('Σφάλμα φόρτωσης δεδομένων:', error);
    }
}

// ========== STEP MANAGEMENT ==========
function setupStepNavigation() {
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', function() {
            const stepName = this.dataset.step;
            showStep(stepName);
        });
    });
    
    document.getElementById('mobile-step-selector').addEventListener('change', function() {
        showStep(this.value);
    });
}

function showStep(stepName) {
    console.log(`📱 Εμφάνιση βήματος: ${stepName}`);
    
    state.currentStep = stepName;
    updateStepUI(stepName);
    loadStepContent(stepName);
    document.getElementById('mobile-step-selector').value = stepName;
    saveState();
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
    
    if (window.travelMap && stepName !== 'map') {
        try {
            window.travelMap.remove();
            window.travelMap = null;
        } catch(e) {
            console.log('ℹ️ Δεν υπήρχε ενεργός χάρτης');
        }
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
            setupHotelStep();
            break;
        case 'activities':
            stepContent.innerHTML = getActivitiesStepHTML();
            setupActivitiesStep();
            break;
        case 'summary':
            stepContent.innerHTML = getSummaryStepHTML();
            setupSummaryStep();
            break;
        case 'map':
            stepContent.innerHTML = getMapStepHTML();
            setTimeout(() => {
                if (typeof L !== 'undefined') {
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
    }
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    document.getElementById('reset-all').addEventListener('click', function() {
        if (confirm('⚠️ Θέλετε να διαγράψετε όλα τα δεδομένα;')) {
            localStorage.clear();
            location.reload();
        }
    });
    
    console.log('✅ Event listeners εγκαταστάθηκαν');
}

// ========== BUTTON FIX ==========
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

// ========== STEP 1: DESTINATION ==========
function getDestinationStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-map-marked-alt"></i> Επιλογή Προορισμού</h1>
            <p class="card-subtitle">Βρείτε την τέλεια πόλη για τις οικογενειακές σας διακοπές</p>
            
            <div class="grid grid-3">
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
            </div>
            
            <div class="grid grid-3">
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
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-wallet"></i> Επίπεδο Κόστους</label>
                    <select class="form-control" id="cost-level">
                        <option value="">Όλα τα επίπεδα</option>
                        <option value="Οικονομικό">💰 Οικονομικό</option>
                        <option value="Μέτριο">💰💰 Μέτριο</option>
                        <option value="Ακριβό">💰💰💰 Ακριβό</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-2">
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-ferris-wheel"></i> Θεματικά Πάρκα & Διασκέδαση</label>
                    <select class="form-control" id="theme-parks">
                        <option value="">Όλα (με ή χωρίς)</option>
                        <option value="has-parks">🎡 Με θεματικά πάρκα</option>
                        <option value="disney">👑 Με Disneyland</option>
                    </select>
                    <small class="text-muted">Ιδανικό για οικογένειες με παιδιά</small>
                </div>
            </div>
            
            <div id="main-buttons-container" style="display: flex; gap: 15px; margin-top: 40px; justify-content: center;">
                <button class="btn btn-primary main-search-btn" 
                        style="padding: 16px 40px; font-size: 18px;">
                    <i class="fas fa-search"></i> 🔍 ΑΝΑΖΗΤΗΣΗ ΠΡΟΟΡΙΣΜΩΝ
                </button>
                
                <button class="btn btn-primary main-already-btn" 
                        style="padding: 16px 40px; font-size: 18px;">
                    <i class="fas fa-arrow-right"></i> ΕΧΩ ΗΔΗ ΒΡΕΙ ΠΡΟΟΡΙΣΜΟ
                </button>
                
                <button class="btn btn-outline" onclick="showQuickRecommendations()" style="padding: 16px 30px;">
                    <i class="fas fa-bolt"></i> Γρήγορες Προτάσεις
                </button>
                
                <button class="btn btn-outline" onclick="resetFilters()" style="padding: 16px 30px; border-color: var(--danger); color: var(--danger);">
                    <i class="fas fa-redo"></i> Επαναφορά
                </button>
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

// ========== STEP 2: FLIGHT ==========
function getFlightStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-plane"></i> Αναζήτηση Πτήσεων</h1>
            <p class="card-subtitle">Βρείτε τις καλύτερες πτήσεις για το ταξίδι σας</p>
            
            <div class="grid grid-2">
                <div class="form-group">
                    <label class="form-label">Από</label>
                    <input type="text" class="form-control" value="Αθήνα" readonly>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Προς</label>
                    <input type="text" class="form-control" id="flight-destination" 
                           value="${state.selectedDestination || ''}" ${state.selectedDestination ? 'readonly' : ''}">
                </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <h3 style="margin-bottom: 20px; color: var(--dark);">🔍 Αναζήτηση στις πλατφόρμες:</h3>
                
                <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                    <a href="https://www.google.com/flights" target="_blank" class="btn btn-primary" style="min-width: 200px;">
                        <i class="fas fa-globe"></i> Google Flights
                    </a>
                    
                    <a href="https://www.skyscanner.net" target="_blank" class="btn btn-secondary" style="min-width: 200px;">
                        <i class="fas fa-plane-departure"></i> Skyscanner
                    </a>
                    
                    <a href="https://www.kayak.com" target="_blank" class="btn btn-accent" style="min-width: 200px;">
                        <i class="fas fa-search"></i> Kayak
                    </a>
                </div>
            </div>
            
            <div class="alert alert-info" style="background: #e3f2fd; padding: 15px; border-radius: var(--radius-md); border-left: 4px solid #2196f3;">
                <i class="fas fa-info-circle"></i>
                <strong>Συμβουλή:</strong> Συγκρίνετε τιμές σε πολλαπλές πλατφόρμες για την καλύτερη προσφορά.
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <button class="btn btn-primary" onclick="showStep('hotel')">
                    <i class="fas fa-arrow-right"></i> Συνέχεια στα Ξενοδοχεία
                </button>
            </div>
        </div>
    `;
}

// ========== STEP 3: HOTEL ==========
function getHotelStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-hotel"></i> Αναζήτηση Ξενοδοχείων</h1>
            <p class="card-subtitle">Βρείτε το τέλειο ξενοδοχείο για την οικογένειά σας</p>
            
            <div class="grid grid-3">
                <div class="form-group">
                    <label class="form-label">Προορισμός</label>
                    <input type="text" class="form-control" id="hotel-destination" 
                           value="${state.selectedDestination || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Check-in</label>
                    <input type="date" class="form-control" id="hotel-checkin">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Check-out</label>
                    <input type="date" class="form-control" id="hotel-checkout">
                </div>
            </div>
            
            <div class="grid grid-3">
                <div class="form-group">
                    <label class="form-label">Ενήλικοι</label>
                    <select class="form-control" id="hotel-adults">
                        <option value="1">1</option>
                        <option value="2" selected>2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Παιδιά</label>
                    <select class="form-control" id="hotel-children">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Δωμάτια</label>
                    <select class="form-control" id="hotel-rooms">
                        <option value="1" selected>1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>
            </div>
                        
            <div class="alert alert-info" style="
                background: #fff3cd; 
                border-left: 4px solid #ffc107; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 8px;
                text-align: left;
            ">
                <i class="fas fa-external-link-alt" style="color: #ffc107; margin-right: 10px;"></i>
                <strong>Σημείωση:</strong> Η αναζήτηση θα σας ανακατευθύνει στις πλατφόρμες 
                <strong>Booking.com</strong> ή <strong>Expedia</strong>
            </div>

            <div style="text-align: center; margin: 40px 0; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">

                <button class="btn btn-primary" onclick="searchBookingHotels()" 
                        style="min-width: 280px; padding: 18px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(33, 150, 243, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(33, 150, 243, 0.2)';">
                    <i class="fas fa-search"></i> Αναζήτηση σε Booking.com
                </button>

                <div style="display: flex; flex-direction: column; align-items: center;">
                    <button class="btn btn-accent" onclick="searchExpediaHotels()" 
                            style="min-width: 280px; padding: 18px; background: linear-gradient(135deg, #ff9800, #ff5722); border: none; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(255, 87, 34, 0.2); margin-bottom: 8px;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(255, 87, 34, 0.5)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 87, 34, 0.2)';">
                        <i class="fas fa-hotel"></i> Αναζήτηση σε Expedia
                    </button>
                    
                    <div style="font-size: 11px; color: #555; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #ff9800; max-width: 280px; text-align: center; line-height: 1.3;">
                        <i class="fas fa-info-circle" style="color: #ff9800; margin-right: 5px;"></i>
                        Αν κλείσεις μέσω EXPEDIA, η εφαρμογή μας θα πάρει μια μικρή προμήθεια 
                        <strong>χωρίς επιπλέον κόστος για σένα</strong>.
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; align-items: center;">
                    <button class="btn" onclick="window.open('https://ticketseller.gr/el/home-2/', '_blank')" 
                            style="min-width: 280px; padding: 18px; background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; border: none; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2); margin-bottom: 8px;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(76, 175, 80, 0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(76, 175, 80, 0.2)';">
                        <i class="fas fa-ticket-alt"></i> TicketSeller.gr
                    </button>
                    
                    <div style="font-size: 11px; color: #555; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #4CAF50; max-width: 280px; text-align: center; line-height: 1.3;">
                        <i class="fas fa-percentage" style="color: #4CAF50; margin-right: 5px;"></i>
                        Αν κλείσεις μέσω <strong>TicketSeller</strong>, έχεις έκπτωση!
                        <br>
                        <small>Στείλε email στο: <strong>takethekids2@gmail.com</strong></small>
                    </div>
                </div>

            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <button class="btn btn-primary" onclick="showStep('activities')">
                    <i class="fas fa-arrow-right"></i> Συνέχεια στις Δραστηριότητες
                </button>
            </div>
        </div>
    `;
}

function setupHotelStep() {
    const checkin = document.getElementById('hotel-checkin');
    const checkout = document.getElementById('hotel-checkout');
    const today = new Date();
    
    checkin.min = today.toISOString().split('T')[0];
    checkout.min = today.toISOString().split('T')[0];
    
    checkin.addEventListener('change', function() {
        if (this.value) {
            checkout.min = this.value;
        }
    });
}

// ========== STEP 4: ACTIVITIES ==========
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
                <div class="card" style="background: #f8f9fa; margin-bottom: 30px;">
                    <h3><i class="fas fa-users"></i> Τα Μέλη Της Οικογένειας</h3>
                    
                    <div id="family-members-container">
                        ${state.familyMembers.map((member, index) => `
                            <div class="family-member" style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px; padding: 15px; background: white; border-radius: var(--radius-md);">
                                <div style="font-size: 24px;">${index === 0 ? '👨' : index === 1 ? '👩' : '🧒'}</div>
                                <input type="text" class="form-control" value="${member.name}" 
                                       onchange="updateFamilyMemberName(${index}, this.value)">
                                <input type="number" class="form-control" value="${member.age}" min="0" max="120" placeholder="Ηλικία"
                                       onchange="updateFamilyMemberAge(${index}, this.value)">
                                <span>ετών</span>
                                <button class="btn btn-outline" onclick="removeFamilyMember(${index})" style="padding: 8px 12px;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button class="btn btn-outline" onclick="addFamilyMember('adult')">
                            <i class="fas fa-plus"></i> Προσθήκη Ενήλικα
                        </button>
                        <button class="btn btn-outline" onclick="addFamilyMember('child')">
                            <i class="fas fa-plus"></i> Προσθήκη Παιδιού
                        </button>
                        <button class="btn btn-primary" onclick="updateFamilyMembers()">
                            <i class="fas fa-save"></i> Ενημέρωση
                        </button>
                    </div>
                </div>
               <div style="margin: 20px 0; padding: 15px; background: linear-gradient(to right, #f0f9ff, #ffffff); border-radius: 10px; border: 2px solid #E0F2FE; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
    <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="font-size: 28px; color: #4F46E5; background: white; width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);">
            💡
        </div>
        <div style="flex: 1;">
            <h4 style="margin: 0 0 10px 0; color: #1A202C; font-size: 17px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-info-circle" style="color: #4F46E5;"></i> 
                Σημαντική Πληροφορία για τις Τιμές
            </h4>
            <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #E2E8F0;">
                <p style="margin: 0; color: #4A5568; line-height: 1.6; font-size: 15px;">
                    <span style="color: #4F46E5; font-weight: bold;">📊 Οι τιμές είναι ενδεικτικές:</span> 
                    Μπορεί να υπάρχουν διαφορές λόγω εποχικότητας, προσφορών ή ηλικιακών κατηγοριών.
                </p>
                <p style="margin: 10px 0 0 0; color: #4A5568; line-height: 1.6; font-size: 15px;">
                    <span style="color: #10B981; font-weight: bold;">✅ Προτείνουμε:</span> 
                    Να ελέγχετε πάντα τις <strong>τελικές τιμές</strong> στα επίσημα site ή στα ταμεία 
                    πριν από οποιαδήποτε κράτηση/αγορά.
                </p>
                <p style="margin: 10px 0 0 0; color: #F59E0B; line-height: 1.6; font-size: 14px;">
                    <i class="fas fa-lightbulb" style="margin-right: 6px;"></i>
                    <strong>Χρήσιμη συμβουλή:</strong> Κλείστε online για καλύτερες τιμές!
                </p>
            </div>
        </div>
    </div>
</div>
                
                <div id="activities-list" class="grid grid-3">
                    <div class="loading" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Φόρτωση δραστηριοτήτων...</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; justify-content: center; margin: 30px 0; flex-wrap: wrap;">
                    <button class="btn btn-accent" onclick="calculateSmartCombos()" 
        id="smart-combo-btn"
        style="padding: 18px 40px; font-size: 18px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none;">
    <i class="fas fa-calculator"></i> 🧮 Έξυπνο Combo
</button>
                    
                    <button class="btn btn-outline" onclick="clearSelectedActivities()" 
                            style="padding: 18px 40px; font-size: 18px; border-color: var(--danger); color: var(--danger);">
                        <i class="fas fa-trash-alt"></i> Καθαρισμός Επιλογών
                    </button>
                </div>
                
                <div class="card" style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; text-align: center; border: none;">
                    <h3 style="color: white; margin-bottom: 10px;">Συνολικό Κόστος</h3>
                    <h1 id="activities-total" style="font-size: 48px; margin: 0;">0€</h1>
                    <p style="opacity: 0.9;">Για ${state.familyMembers.length} άτομα</p>
                </div>
                
                <div style="text-align: center; margin-top: 40px;">
                    <button class="btn btn-primary" onclick="showStep('summary')" style="padding: 18px 50px; font-size: 18px;">
                        <i class="fas fa-arrow-right"></i> Συνέχεια στο Πρόγραμμα
                    </button>
                </div>
            `}
        </div>
    `;
}

// ========== STEP 5: SUMMARY ==========
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
                <div class="grid grid-3" style="margin-bottom: 30px;">
                    <div class="card" style="text-align: center;">
                        <h3><i class="fas fa-map-marker-alt"></i> Προορισμός</h3>
                        <h2 style="color: var(--primary); margin: 10px 0;">${state.selectedDestination}</h2>
                    </div>
                    
                    <div class="card" style="text-align: center;">
                        <h3><i class="fas fa-calendar-alt"></i> Διάρκεια</h3>
                        <h2 style="color: var(--primary); margin: 10px 0;">${state.selectedDays || '?'} Μέρες</h2>
                        <p style="font-size: 14px; color: var(--gray); margin-top: 5px;">
                            Εσείς επιλέξατε
                        </p>
                    </div>
                    
                    <div class="card" style="text-align: center;">
                        <h3><i class="fas fa-users"></i> Οικογένεια</h3>
                        <h2 style="color: var(--primary); margin: 10px 0;">${state.familyMembers.length} Άτομα</h2>
                    </div>
                </div>
                
                <div class="card" style="margin: 30px 0; background: #f0f7ff; border-left: 4px solid var(--primary);">
                    <h3><i class="fas fa-calendar-alt"></i> Διάρκεια Ταξιδιού</h3>
                    <p style="color: var(--gray); margin-bottom: 15px;">
                        Επιλέξτε πόσες μέρες θα διαρκέσει το ταξίδι σας.
                    </p>
                    
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <select class="form-control" id="program-days" style="width: 200px; font-size: 16px; padding: 12px;">
                            <option value="0" ${state.selectedDays === 0 ? 'selected disabled' : 'disabled'}>-- Επιλέξτε μέρες --</option>
                            <option value="2" ${state.selectedDays === 2 ? 'selected' : ''}>2 μέρες</option>
                            <option value="3" ${state.selectedDays === 3 ? 'selected' : ''}>3 μέρες</option>
                            <option value="4" ${state.selectedDays === 4 ? 'selected' : ''}>4 μέρες</option>
                            <option value="5" ${state.selectedDays === 5 ? 'selected' : ''}>5 μέρες</option>
                            <option value="7" ${state.selectedDays === 7 ? 'selected' : ''}>7 μέρες</option>
                            <option value="10" ${state.selectedDays === 10 ? 'selected' : ''}>10 μέρες</option>
                            <option value="14" ${state.selectedDays === 14 ? 'selected' : ''}>14 μέρες</option>
                        </select>
                        
                        <button class="btn btn-primary" onclick="updateProgramDays()" style="padding: 12px 25px;">
                            <i class="fas fa-sync-alt"></i> Ενημέρωση Προγράμματος
                        </button>
                        
                        <span id="days-display" style="color: var(--success); font-weight: bold; font-size: 16px;">
                            ${state.selectedDays > 0 ? '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν' : '⚠️ Δεν έχετε επιλέξει ακόμα'}
                        </span>
                    </div>
                </div>
                
                <div class="card" id="selected-activities-section">
                    <h3><i class="fas fa-star"></i> Επιλεγμένες Δραστηριότητες (${state.selectedActivities.length})</h3>
                    
                    ${state.selectedActivities.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: var(--gray);">
                            <i class="fas fa-info-circle fa-2x" style="margin-bottom: 15px;"></i>
                            <p>Δεν έχετε επιλέξει δραστηριότητες ακόμα</p>
                            <button onclick="showStep('activities')" class="btn btn-primary" style="margin-top: 15px;">
                                <i class="fas fa-arrow-left"></i> Επιστροφή στις Δραστηριότητες
                            </button>
                        </div>
                    ` : `
                        <div style="margin-top: 20px;">
                            <button class="btn btn-primary" onclick="generateGeographicProgram()" 
                                    style="width: 100%; padding: 15px; font-size: 18px; margin-bottom: 20px;">
                                <i class="fas fa-map-marked-alt"></i> ΔΗΜΙΟΥΡΓΙΑ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ
                            </button>
                                                       
                            <p style="text-align: center; color: var(--gray); font-size: 14px; margin-bottom: 20px;">
                                <i class="fas fa-info-circle"></i> Πατήστε το κουμπί για δημιουργία βελτιστοποιημένου προγράμματος
                            </p>
                        </div>
                        
                        <div style="padding: 15px; background: linear-gradient(135deg, var(--primary), #4F46E5); color: white; border-radius: 8px; text-align: center; margin-top: 20px;">
                            <h4 style="color: white; margin-bottom: 5px;">
                                <i class="fas fa-money-bill-wave"></i> Συνολικό Κόστος
                            </h4>
                            <h2 style="font-size: 36px; margin: 0;">${calculateTotalSpent()}€</h2>
                            <p style="opacity: 0.9; margin: 5px 0 0 0;">
                                Για ${state.familyMembers.length} άτομα
                            </p>
                        </div>
                    `}
                </div>
                
                <div class="card" id="geographic-program-section" style="margin-top: 30px;">
                    <h3><i class="fas fa-route"></i> Γεωγραφικό Πρόγραμμα</h3>
                    
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
                                    Πατήστε "ΔΗΜΙΟΥΡΓΙΑ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ"<br>
                                    για να ομαδοποιήσουμε τις ${state.selectedActivities.length} δραστηριότητες<br>
                                    σε ${state.selectedDays} μέρες με βάση την τοποθεσία τους
                                </p>
                                <button onclick="generateGeographicProgram()" class="btn btn-primary" style="padding: 15px 40px; font-size: 18px;">
                                    <i class="fas fa-map-marked-alt"></i> ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ
                                </button>
                            </div>
                        `}
                    </div>
                </div>
                
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

// ========== GEOGRAPHIC PROGRAM GENERATION ==========
function generateGeographicProgram() {
    console.log('🎯 ========== ΑΡΧΗ generateGeographicProgram ==========');
    
    const daysSelect = document.getElementById('program-days');
    console.log('🔍 Dropdown:', daysSelect);
    
    if (!daysSelect) {
        alert('❌ Σφάλμα: Δεν βρέθηκε η επιλογή ημερών. Παρακαλώ ανανεώστε τη σελίδα.');
        return;
    }
    
    if (!daysSelect.value || daysSelect.value === '0') {
        alert('⚠️ Παρακαλώ επιλέξτε πρώτα πόσες μέρες θα διαρκέσει το ταξίδι');
        return;
    }
    
    state.selectedDays = parseInt(daysSelect.value);
    console.log('📅 Επιλέχθηκαν:', state.selectedDays, 'μέρες');
    
    if (state.selectedActivities.length === 0) {
        alert('⚠️ Δεν υπάρχουν επιλεγμένες δραστηριότητες');
        return;
    }
    
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
    
    if (!state.currentCityActivities || state.currentCityActivities.length === 0) {
        console.log('⚠️ currentCityActivities είναι άδειο, προσπαθώ να φορτώσω ξανά...');
        loadActivitiesForProgram();
        return;
    }
    
    console.log('🔍 Ψάχνω για currentCityActivities:', state.currentCityActivities.length);
    
    const fullActivities = state.selectedActivities.map(selected => {
        const originalActivity = state.currentCityActivities.find(a => a.id === selected.id);
        
        if (!originalActivity) {
            console.error('❌ Δεν βρέθηκε η δραστηριότητα:', selected.id, selected.name);
            return null;
        }
        
        return {
            ...selected,
            ...originalActivity,
            location: originalActivity?.location || null
        };
    }).filter(a => a !== null && a.location);
    
    console.log(`📍 Δραστηριότητες με location: ${fullActivities.length}/${state.selectedActivities.length}`);
    
    if (fullActivities.length === 0) {
        alert('⚠️ Δεν βρέθηκαν πληροφορίες τοποθεσίας για τις επιλεγμένες δραστηριότητες.\n\nΠαρακαλώ επιστρέψτε στις Δραστηριότητες και επιλέξτε ξανά.');
        return;
    }
    
    const activitiesWithLocation = fullActivities.filter(a => a.location);
    let activityGroups = [];
    
    if (activitiesWithLocation.length > 0) {
        activityGroups = createSmartClusters(activitiesWithLocation, state.selectedDays);
    } else {
        activityGroups = fullActivities.map(activity => ({
            center: null,
            activities: [activity],
            count: 1,
            radius: 0
        }));
    }
    
    console.log(`📍 Βρέθηκαν ${activityGroups.length} γεωγραφικές περιοχές/ομάδες`);
    
    if (activityGroups.length === 0) {
        activityGroups = fullActivities.map(activity => ({
            center: null,
            activities: [activity],
            count: 1,
            radius: 0
        }));
    }
    
    const daysProgram = distributeGroupsToDays(activityGroups, state.selectedDays);
    
    const programDiv = document.getElementById('geographic-program');
    if (!programDiv) {
        console.error('❌ Δεν βρέθηκε το geographic-program div');
        return;
    }
    
    console.log('✅ ΒΡΕΘΗΚΕ το geographic-program div!');
    console.log('📏 Μέγεθος div:', programDiv.offsetWidth, 'x', programDiv.offsetHeight);
    
    let html = '';
    
    if (activityGroups.length === 0) {
        html = `
            <div style="padding: 40px 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px; color: #9CA3AF;">🧭</div>
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
                            <span><i class="fas fa-euro-sign"></i> ${dayCost}€</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${groupCount} περιοχή${groupCount !== 1 ? 'ές' : ''}</span>
                        </div>
                    </div>
                    
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
                                                    ${activity.price || '0'}€
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
                            <span>${dayCost}€</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
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
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #4F46E5;">${state.selectedDays}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Μέρες</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #10B981;">${activityGroups.length}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Γεωγραφικές περιοχές</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #F59E0B;">${totalActivities}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Δραστηριότητες</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #EF4444;">${totalCost}€</div>
                        <div style="font-size: 12px; opacity: 0.8;">Συνολικό κόστος</div>
                    </div>
                </div>
                <p style="text-align: center; margin-top: 15px; font-size: 13px; opacity: 0.8;">
                    <i class="fas fa-lightbulb"></i> Οι δραστηριότητες ομαδοποιήθηκαν με βάση την απόσταση για ελάχιστες μετακινήσεις
                </p>
            </div>
        `;
    }
    
    programDiv.innerHTML = html;
    
    setTimeout(() => {
        programDiv.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 300);
    
    const statusDiv = document.getElementById('program-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Δημιουργήθηκε πρόγραμμα ${state.selectedDays} ημερών`;
        statusDiv.style.background = '#D1FAE5';
        statusDiv.style.color = '#065F46';
    }
    
    const daysDisplay = document.getElementById('days-display');
    if (daysDisplay) {
        daysDisplay.textContent = '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν';
        daysDisplay.style.color = 'var(--success)';
    }
    
    showToast(`✅ Δημιουργήθηκε γεωγραφικό πρόγραμμα για ${state.selectedDays} μέρες`, 'success');
    
    console.log(`✅ Το πρόγραμμα δημιουργήθηκε επιτυχώς για ${state.selectedDays} μέρες`);
    console.log('🎯 ========== ΤΕΛΟΣ generateGeographicProgram ==========');
}

function loadActivitiesForProgram() {
    console.log('🔄 Φόρτωση δραστηριοτήτων για το πρόγραμμα...');
    
    if (!state.selectedDestinationId) {
        alert('❌ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    fetch(`data/${state.selectedDestinationId}.json`)
        .then(response => response.json())
        .then(cityData => {
            state.currentCityActivities = cityData.activities;
            console.log('✅ Δραστηριότητες φορτώθηκαν:', state.currentCityActivities.length);
            
            setTimeout(() => {
                generateGeographicProgram();
            }, 500);
        })
        .catch(error => {
            console.error('❌ Σφάλμα φόρτωσης:', error);
            alert('⚠️ Δεν μπορούν να φορτωθούν οι δραστηριότητες. Παρακαλώ ανανεώστε τη σελίδα.');
        });
}

function forceRefreshProgram() {
    console.log('🔄 Αναγκαστική ανανέωση προγράμματος');
    
    const daysSelect = document.getElementById('program-days');
    if (daysSelect && daysSelect.value) {
        state.selectedDays = parseInt(daysSelect.value);
        saveState();
    }
    
    const daysDisplay = document.getElementById('days-display');
    if (daysDisplay) {
        daysDisplay.textContent = '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν';
        daysDisplay.style.color = 'var(--success)';
    }
    
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
    
    setTimeout(() => {
        generateGeographicProgram();
        showToast(`✅ Το πρόγραμμα ανανεώθηκε για ${state.selectedDays} μέρες`, 'success');
    }, 800);
}

// ========== GEOGRAPHIC PLANNING FUNCTIONS ==========
function distributeGroupsToDays(groups, totalDays) {
    console.log(`📅 Κατανομή ${groups.length} ομάδων σε ${totalDays} μέρες`);
    
    if (groups.length === 0 || totalDays < 1) {
        console.error('❌ Μη έγκυρα δεδομένα για κατανομή');
        return [];
    }
    
    const days = Array.from({ length: totalDays }, () => ({ 
        groups: [], 
        totalActivities: 0,
        totalCost: 0,
        estimatedTime: 0
    }));
    
    const sortedGroups = [...groups].sort((a, b) => b.count - a.count);
    
    console.log(`📊 Ομαδοποιήσεις για κατανομή:`, sortedGroups.map((g, i) => `Ομάδα ${i+1}: ${g.count} δραστηριότητες`));
    
    console.log('🎯 Νέα λογική: 1-4=1μέρα, 5-7=2μέρες, 8+=3μέρες');
    
    sortedGroups.forEach((group) => {
        const activitiesCount = group.activities.length;
        
        let neededDays = 1;
        if (activitiesCount >= 8) neededDays = 3;
        else if (activitiesCount >= 5) neededDays = 2;
        
        console.log(`   📦 Cluster "${group.activities[0]?.name?.substring(0, 20) || 'Ομάδα'}" (${activitiesCount} δραστ.): Χρειάζεται ${neededDays} μέρες`);
        
        if (neededDays === 1) {
            const emptiestDayIndex = days.reduce((minIndex, day, index) => 
                day.totalActivities < days[minIndex].totalActivities ? index : minIndex, 0
            );
            
            days[emptiestDayIndex].groups.push(group);
            days[emptiestDayIndex].totalActivities += activitiesCount;
            updateDayStats(days[emptiestDayIndex], group);
            
            console.log(`     → Μία μέρα: Μέρα ${emptiestDayIndex + 1}`);
        } 
        else {
            const sortedDayIndices = days.map((day, index) => ({ index, total: day.totalActivities }))
                                         .sort((a, b) => a.total - b.total)
                                         .slice(0, neededDays)
                                         .map(d => d.index);
            
            const activitiesPerDay = Math.ceil(activitiesCount / neededDays);
            
            sortedDayIndices.forEach((dayIndex, dayOffset) => {
                const startIdx = dayOffset * activitiesPerDay;
                const endIdx = Math.min(startIdx + activitiesPerDay, activitiesCount);
                const sliceActivities = group.activities.slice(startIdx, endIdx);
                
                if (sliceActivities.length > 0) {
                    const subGroup = {
                        ...group,
                        activities: sliceActivities,
                        count: sliceActivities.length
                    };
                    
                    days[dayIndex].groups.push(subGroup);
                    days[dayIndex].totalActivities += sliceActivities.length;
                    updateDayStats(days[dayIndex], subGroup);
                    
                    console.log(`     → Μέρα ${dayIndex + 1}: ${sliceActivities.length} δραστηριότητες`);
                }
            });
        }
    });
    
    function updateDayStats(day, group) {
        const groupCost = group.activities.reduce((sum, activity) => {
            return sum + (parseFloat(activity.price) || 0);
        }, 0);
        
        const groupTime = group.activities.reduce((sum, activity) => {
            return sum + (parseFloat(activity.duration_hours) || 1.5);
        }, 0);
        
        const travelTime = group.activities.length > 1 ? (group.activities.length - 1) * 0.5 : 0;
        
        day.totalCost += groupCost;
        day.estimatedTime += groupTime + travelTime;
    }
    
    days.forEach(day => {
        day.estimatedTime = Math.ceil(day.estimatedTime);
    });
    
    const nonEmptyDays = days.filter(day => day.totalActivities > 0);
    
    console.log(`✅ Κατανεμήθηκαν ${sortedGroups.length} ομάδες:`, 
        nonEmptyDays.map((d, i) => `Μ${i+1}:${d.totalActivities}δραστ.`).join(', '));
    
    return nonEmptyDays;
}

function getDayColor(dayNumber) {
    const colors = [
        '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];
    return colors[(dayNumber - 1) % colors.length];
}

function getGroupColor(index) {
    const colors = [
        '#4F46E5', '#10B981', '#F59E0B', '#EF4444',
        '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
    ];
    return colors[index % colors.length];
}

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

// ========== STEP 6: MAP ==========
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
                <div id="map-container" style="height: 600px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px; border: 2px solid var(--border);">
                    <div id="travel-map" style="height: 100%; width: 100%;"></div>
                </div>
                
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
                
                <div class="alert alert-info">
                    <i class="fas fa-graduation-cap"></i>
                    <strong>Οδηγίες Χρήσης:</strong><br>
                    1. Πατήστε "Προβολή Σημείων" για να φορτώσετε τις δραστηριότητες σας<br>
                    2. Κάντε κλικ σε 2 πινέζες για επιλογή <span style="color: #10B981;">ΑΠΟ</span> και <span style="color: #EF4444;">ΠΡΟΣ</span><br>
                    3. Η διαδρομή θα σχεδιαστεί αυτόματα με απόσταση και χρόνους<br>
                    4. Πατήστε στο κουμπί: Διαδρομή για Google Maps οδηγίες
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn btn-outline" onclick="showStep('summary')">
                        <i class="fas fa-arrow-left"></i> Επιστροφή στο Πρόγραμμα
                    </button>
                </div>
            `}
        </div>
    `;
}

// ========== MANUAL DESTINATION MODAL ==========
let destinationDropdown = null;
let isDropdownVisible = false;

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
    
    state.selectedDestination = cityName;
    state.selectedDestinationId = cityId;
    state.selectedDays = 0;
    
    document.getElementById('current-destination-display').textContent = cityName;
    updateActivitiesCost();
    
    closeManualDestinationModal();
    
    alert(`✅ Επιλέξατε: ${cityName}\n\nΣυνέχεια στις πτήσεις. Μπορείτε να ορίσετε τις μέρες στο βήμα "Πρόγραμμα".`);
    
    saveState();
    
    setTimeout(() => {
        showStep('flight');
    }, 1000);
}

// ========== FILTER DESTINATIONS ==========
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
    
    const distance = document.getElementById('distance').value;
    const vacationType = document.getElementById('vacation-type').value;
    const costLevel = document.getElementById('cost-level').value;
    const themeParks = document.getElementById('theme-parks').value;
    const strollerFilter = document.getElementById('stroller-friendly-filter').value;
    
    console.log('🎯 Εφαρμογή φίλτρων:', {
        distance, vacationType, costLevel, themeParks, strollerFilter
    });
    
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
    
    const filteredCities = allCities.filter(city => {
        if (distance && city.distance > parseFloat(distance)) {
            return false;
        }
        
        if (costLevel && city.cost !== costLevel) {
            return false;
        }
        
        if (vacationType && city.vacationType !== vacationType) {
            return false;
        }
        
        if (strollerFilter === 'true' && !city.strollerFriendly) {
            return false;
        }
        if (strollerFilter === 'false' && city.strollerFriendly) {
            return false;
        }
        
        if (themeParks === 'disney' && !city.hasDisney) {
            return false;
        }
        if (themeParks === 'has-parks' && !city.themeParks.includes('has-parks')) {
            return false;
        }
        
        return true;
    });
    
    console.log(`📊 Αποτελέσματα: ${filteredCities.length} από ${allCities.length} πόλεις`);
    
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
    
    document.getElementById('current-destination-display').textContent = destinationName;
    
    const resultsDiv = document.getElementById('destination-results');
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

// ========== QUICK RECOMMENDATIONS ==========
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

// ========== HOTEL SEARCH FUNCTIONS ==========
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
    
    const bookingUrl = `https://www.booking.com/searchresults.el.html?ss=${encodeURIComponent(destination)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&group_children=${children}&no_rooms=${rooms}`;
    
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

// ========== ACTIVITIES STEP ==========
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
        
        state.currentCityActivities = cityData.activities;
        console.log(`📊 Βρέθηκαν ${cityData.activities.length} δραστηριότητες`);
        
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
            state.currentCityActivities.forEach((activity) => {
                const familyCost = calculateFamilyCost(activity.prices);
                const isSelected = state.selectedActivities.some(a => a.id === activity.id);
                
                html += `
                    <div class="activity-card ${isSelected ? 'selected' : ''}" 
                         onclick="toggleActivitySelection(${activity.id})" 
                         data-activity-id="${activity.id}">
                        
                        <div class="activity-header">
                            <div class="activity-emoji">${getActivityEmoji(activity.category)}</div>
                            <div class="activity-title">${activity.name}</div>
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
                        
                        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 10px 0;">
                            <div style="font-size: 12px; color: var(--gray); margin-bottom: 8px;">
                                <i class="fas fa-money-bill-wave"></i> 
                                ${getPriceInfo(activity.prices)}
                            </div>
                            
                            ${state.familyMembers.map(member => {
                                const age = member.age;
                                let price = '?';
                                
                                if (activity.prices[age] !== undefined) {
                                    price = activity.prices[age] === 0 ? 'ΔΩΡΕΑΝ' : activity.prices[age] + '€';
                                }
                                else if (age >= 16 && activity.prices.adult !== undefined) {
                                    price = activity.prices.adult + '€';
                                }
                                else if (age >= 5 && age <= 15) {
                                    if (activity.prices['10'] !== undefined) {
                                        price = activity.prices['10'] + '€';
                                    } else if (activity.prices['5'] !== undefined) {
                                        price = activity.prices['5'] + '€';
                                    }
                                }
                                else if (age <= 4 && activity.prices['0'] !== undefined) {
                                    price = activity.prices['0'] === 0 ? 'ΔΩΡΕΑΝ' : activity.prices['0'] + '€';
                                }
                                
                                return `
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-top: 4px; padding: 2px 0;">
                                    <span>${member.name} (${age}):</span>
                                    <span><strong>${price}</strong></span>
                                </div>`;
                            }).join('')}
                            
                            ${activity.notes && activity.notes.length > 0 ? `
                                <div style="font-size: 11px; color: #666; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #ddd;">
                                    <i class="fas fa-info-circle"></i>
                                    ${activity.notes.join(' • ')}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="activity-total" style="background: var(--primary); color: white; padding: 12px; border-radius: 8px; text-align: center; font-weight: bold; margin-top: 10px;">
                            <i class="fas fa-users"></i> ${familyCost}€ για ${state.familyMembers.length} άτομα
                        </div>
                    </div>
                `;
            });
        }
        
        activitiesList.innerHTML = html;
        
        updateActivitiesTotal();
        
        console.log('✅ Δραστηριότητες εμφανίστηκαν επιτυχώς');
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
        
        if (age === "" || age === null || age === undefined) {
            console.log(`⚠️ Μέλος "${member.name}" δεν έχει ηλικία - ΑΓΝΟΕΙΤΑΙ ΟΛΟΚΛΗΡΩΣ`);
            return;
        }
        
        age = parseInt(age);
        if (isNaN(age) || age < 0 || age > 120) {
            console.log(`⚠️ Μέλος "${member.name}" έχει μη έγκυρη ηλικία "${member.age}" - ΑΓΝΟΕΙΤΑΙ`);
            return;
        }
        
        let price = 0;
        
        if (prices[age] !== undefined && prices[age] !== null) {
            price = prices[age];
        }
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
            price = prices['0'];
        }
        else {
            console.warn(`⚠️ Δεν βρέθηκε τιμή για ηλικία ${age}. Στο JSON υπάρχουν: ${Object.keys(prices).join(', ')}`);
            price = 0;
        }
        
        total += price;
        membersWithAge++;
        
        console.log(`  👤 ${member.name} (${age}): ${price}€`);
    });
    
    console.log(`💰 Συνολικό κόστος: ${total}€ για ${membersWithAge} από τα ${state.familyMembers.length} άτομα`);
    
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
    
    const familyCost = calculateFamilyCost(activity.prices);
    
    const existingIndex = state.selectedActivities.findIndex(a => a.id === activityId);
    
    if (existingIndex > -1) {
        state.selectedActivities.splice(existingIndex, 1);
        console.log(`➖ Αφαίρεση: ${activity.name}`);
    } else {
        state.selectedActivities.push({
            id: activityId,
            name: activity.name,
            price: familyCost,
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
        total += activity.price || 0;
    });
    
    document.getElementById('activities-total').textContent = total + '€';
    updateActivitiesCost();
}

// ========== SUMMARY STEP SETUP ==========
function setupSummaryStep() {
    console.log('📋 Ρύθμιση summary βήματος');
    
    if (!state.selectedDestination) {
        console.log('⚠️ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    if (!state.selectedDays || state.selectedDays < 1) {
        state.selectedDays = 3;
        console.log(`📅 Βάζω προεπιλογή ${state.selectedDays} μέρες`);
    }
    
    if (state.selectedActivities.length > 0) {
        const suggestedDays = suggestDaysFromGroups();
        if (suggestedDays > 0 && state.selectedDays !== suggestedDays) {
            console.log(`📅 Πρόταση από ομαδοποίηση: ${suggestedDays} μέρες`);
            
            const daysSelect = document.getElementById('program-days');
            if (daysSelect && daysSelect.querySelector(`option[value="${suggestedDays}"]`)) {
                console.log(`💡 Πρόταση: ${suggestedDays} μέρες`);
            }
        }
    }
    
    setTimeout(() => {
        const daysSelect = document.getElementById('program-days');
        if (daysSelect) {
            daysSelect.value = state.selectedDays;
            
            console.log(`📅 Ρύθμιση dropdown στην τιμή: ${state.selectedDays}`);
            
            const newDaysSelect = daysSelect.cloneNode(true);
            daysSelect.parentNode.replaceChild(newDaysSelect, daysSelect);
            
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
                    
                    const statusDiv = document.getElementById('program-status');
                    if (statusDiv) {
                        statusDiv.innerHTML = `<i class="fas fa-clock"></i> Ενημερώνεται για ${selectedDays} μέρες`;
                        statusDiv.style.background = '#FEF3C7';
                        statusDiv.style.color = '#92400E';
                    }
                    
                    showToast(`📅 Οι ημέρες ενημερώθηκαν σε ${selectedDays}. Πατήστε "Δημιουργία Προγράμματος"`, 'success');
                }
            });
        }
        
        const daysDisplay = document.getElementById('days-display');
        if (daysDisplay) {
            daysDisplay.textContent = state.selectedDays > 0 
                ? '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν'
                : '⚠️ Δεν έχετε επιλέξει ακόμα';
            daysDisplay.style.color = state.selectedDays > 0 ? 'var(--success)' : 'var(--warning)';
        }
        
        if (state.selectedActivities.length > 0 && state.selectedDays > 0) {
            console.log(`📊 Έτοιμος για δημιουργία προγράμματος: ${state.selectedActivities.length} δραστηριότητες, ${state.selectedDays} μέρες`);
            
            const programDiv = document.getElementById('geographic-program');
            if (programDiv) {
                programDiv.innerHTML = `
                    <div style="padding: 30px 20px; text-align: center;">
                        <div class="loading-spinner" style="
                            width: 40px;
                            height: 40px;
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid var(--primary);
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 20px auto;
                        "></div>
                        <h4 style="color: var(--dark); margin-bottom: 10px;">Προετοιμασία προγράμματος</h4>
                        <p style="color: var(--gray);">
                            ${state.selectedActivities.length} δραστηριότητες για ${state.selectedDays} μέρες
                        </p>
                        <button onclick="generateGeographicProgram()" class="btn btn-primary" style="margin-top: 15px;">
                            <i class="fas fa-play-circle"></i> ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ
                        </button>
                    </div>
                `;
            }
            
            const statusDiv = document.getElementById('program-status');
            if (statusDiv) {
                statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Έτοιμο για δημιουργία προγράμματος`;
                statusDiv.style.background = '#D1FAE5';
                statusDiv.style.color = '#065F46';
            }
        } else {
            console.log('⚠️ Δεν υπάρχουν αρκετά δεδομένα για πρόγραμμα');
        }
        
        updateActivitiesCost();
        
        createSuggestedProgram();
        
        if (state.selectedActivities.length > 0) {
            const suggestedDays = suggestDaysFromGroups();
            if (suggestedDays > 0 && suggestedDays !== state.selectedDays) {
                setTimeout(() => {
                    showToast(`
                        <div style="text-align: left; max-width: 350px;">
                            <strong style="color: #4F46E5;">📅 Πρόταση Διάρκειας</strong><br><br>
                            
                            <div style="background: #F0F9FF; padding: 12px; border-radius: 8px; border-left: 4px solid #4F46E5;">
                                Βάσει ομαδοποίησης των δραστηριοτήτων σας:<br>
                                <strong style="font-size: 18px; color: #4F46E5;">${suggestedDays} μέρες</strong><br>
                                <small style="color: #666;">
                                    (Βρέθηκαν ${state.selectedActivities.length} δραστηριότητες σε ${suggestedDays} γεωγραφικές περιοχές)
                                </small>
                            </div>
                            
                            <div style="margin-top: 10px; font-size: 12px; color: #666;">
                                <i class="fas fa-info-circle"></i> Μπορείτε να αλλάξετε τις μέρες από το dropdown
                            </div>
                        </div>
                    `, 'info');
                }, 1000);
            }
        }
        
    }, 100);
}

function createSuggestedProgram() {
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
                            <span style="color: var(--primary); font-weight: bold;">${activity.price || 0}€</span>
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
                    <span style="color: ${getDayColor(day)};">${dayCost}€</span>
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
                    <div style="font-size: 36px; font-weight: bold;">${totalCost}€</div>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="generateGeographicProgram()" 
                        class="btn btn-primary"
                        style="padding: 12px 30px; font-size: 16px;">
                    <i class="fas fa-sync-alt"></i> ΔΗΜΙΟΥΡΓΙΑ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ
                </button>
                <p style="color: var(--gray); font-size: 13px; margin-top: 10px;">
                    Δημιουργήστε βελτιστοποιημένο πρόγραμμα με βάση τις τοποθεσίες των δραστηριοτήτων
                </p>
            </div>
        </div>
    `;
    
    programDiv.innerHTML = html;
}

function suggestDaysFromGroups() {
    if (state.selectedActivities.length === 0) return 0;
    
    const selectedFullActivities = state.selectedActivities.map(selected => 
        state.currentCityActivities.find(a => a.id === selected.id)
    ).filter(a => a !== undefined);
    
    const groups = groupActivitiesByProximity(selectedFullActivities, 2.0);
    
    if (groups.length === 0) return 0;
    
    let suggestedDays = groups.length;
    
    groups.forEach(group => {
        if (group.count >= 3) suggestedDays += 1;
        if (group.count >= 5) suggestedDays += 1;
    });
    
    suggestedDays = Math.max(2, Math.min(suggestedDays, 7));
    
    console.log(`📅 Προτεινόμενες μέρες από ομαδοποίηση: ${suggestedDays}`);
    
    return suggestedDays;
}

// ========== MAP FUNCTIONS ==========
function setupMapStep() {
    console.log('🗺️ Ρύθμιση χάρτη για:', state.selectedDestination);
    
    if (!state.selectedDestination) return;
    
    setTimeout(() => {
        initializeMap();
    }, 300);
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
    
    if (window.travelMap) {
        try {
            window.travelMap.remove();
            console.log('🗺️ Παλιός χάρτης διαγράφηκε');
        } catch(e) {
            console.log('ℹ️ Δεν υπήρχε ενεργός χάρτης');
        }
    }
    
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
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            minZoom: 3
        }).addTo(window.travelMap);
        
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
        
        L.control.scale({ imperial: false, metric: true }).addTo(window.travelMap);
        
        if (L.control.fullscreen) {
            L.control.fullscreen({
                position: 'topright',
                title: 'Πλήρης οθόνη',
                titleCancel: 'Έξοδος πλήρους οθόνης',
                forceSeparateButton: true
            }).addTo(window.travelMap);
        }
        
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
                
                L.DomEvent.disableClickPropagation(container);
                return container;
            }
        });
        
        window.travelMap.addControl(new customControl());
        
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
        
        setTimeout(() => {
            if (cityMarker && cityMarker._icon) {
                cityMarker._icon.style.animation = 'bounce 0.5s ease 2';
            }
        }, 1500);
        
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
    
    if (window.travelMap) {
        window.travelMap.remove();
        window.travelMap = null;
    }
    
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
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            minZoom: 3
        }).addTo(window.travelMap);
        
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
        
        L.control.scale({ imperial: false, metric: true }).addTo(window.travelMap);
        
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

function clearMapPoints() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    window.travelMap.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            if (layer.options && layer.options.className === 'city-marker') {
                return;
            }
            window.travelMap.removeLayer(layer);
        }
    });
    
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }
    
    selectedPointA = null;
    selectedPointB = null;
    
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

function addCustomPoint() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    const pointName = prompt('Όνομα σημείου:');
    if (pointName) {
        const center = window.travelMap.getCenter();        
        L.marker(center)
            .addTo(window.travelMap)
            .bindPopup(`<b>${pointName}</b>`)
            .openPopup();
    }
}

// ========== ENHANCED MAP FUNCTIONS ==========
function createEnhancedPopup(activity) {
    console.log('🗺️ Δημιουργία enhanced popup για:', activity.name);
    
    const restaurant = activity.restaurant || activity.nearby_restaurant || 
                      '🍽️ Τοπικά εστιατόρια στην περιοχή';
    
    const googleMapsUrl = activity.location ? 
        `https://www.google.com/maps/search/?api=1&query=${activity.location.lat},${activity.location.lng}&query_place_id=${activity.google_place_id || ''}` :
        `https://www.google.com/maps/search/${encodeURIComponent(activity.name + ' ' + state.selectedDestination)}`;
    
    return `
        <div style="max-width: 300px; font-family: 'Roboto', sans-serif; padding: 5px;">
            <h4 style="margin: 0 0 8px 0; color: var(--primary); font-size: 16px; font-weight: 700;">
                <i class="fas fa-map-marker-alt" style="margin-right: 8px;"></i>
                ${activity.name}
            </h4>
            
            ${activity.description ? `
            <p style="margin: 0 0 10px 0; font-size: 13px; color: var(--gray); line-height: 1.4;">
                ${activity.description}
            </p>` : ''}
            
            ${activity.price ? `
            <div style="background: rgba(46, 204, 113, 0.1); padding: 8px; border-radius: 6px; margin: 8px 0; font-size: 13px;">
                <i class="fas fa-tag" style="color: var(--success); margin-right: 6px;"></i>
                <strong>Κόστος:</strong> ${activity.price}€
            </div>` : ''}
            
            <div style="background: rgba(255, 107, 107, 0.1); padding: 10px; border-radius: 6px; margin: 10px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <i class="fas fa-utensils" style="color: var(--accent); margin-right: 8px;"></i>
                    <strong style="color: var(--dark); font-size: 13px;">Κοντινό Εστιατόριο:</strong>
                </div>
                <p style="margin: 0; font-size: 12px; color: var(--gray); line-height: 1.3;">
                    ${restaurant}
                </p>
            </div>
            
            <div style="font-size: 11px; color: var(--gray); background: var(--light); padding: 6px; border-radius: 4px; margin: 8px 0;">
                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                ${activity.duration_hours ? `Διάρκεια: ${activity.duration_hours} ώρες • ` : ''}
                ${activity.category ? `Κατηγορία: ${translateCategory(activity.category)}` : ''}
            </div>
            
            <a href="${googleMapsUrl}" 
               target="_blank" 
               style="display: inline-flex; align-items: center; padding: 8px 12px; background: var(--primary); color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; margin-top: 10px;">
                <i class="fas fa-external-link-alt" style="margin-right: 6px;"></i>
                Άνοιγμα Google Maps
            </a>
        </div>
    `;
}

function showActivityMap() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    console.log('📍 Προσθήκη πινέζων για τις επιλεγμένες δραστηριότητες');
    
    window.travelMap.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            window.travelMap.removeLayer(layer);
        }
    });
    
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }
    
    selectedPointA = null;
    selectedPointB = null;
    
    const cityCoords = getCityCoordinates(state.selectedDestinationId);
    if (cityCoords) {
        L.marker(cityCoords)
            .addTo(window.travelMap)
            .bindPopup(`<b>${state.selectedDestination}</b><br>Κύκλος πόλης`)
            .openPopup();
            
        window.travelMap.setView(cityCoords, 13);
    }
    
    if (state.selectedActivities.length === 0) {
        alert('⚠️ Δεν έχετε επιλέξει καμία δραστηριότητα ακόμα\n\nΠαρακαλώ πηγαίνετε στο βήμα "Δραστηριότητες" και επιλέξτε κάποιες.');
        return;
    }
    
    let activityCount = 0;
    const markers = [];
    
    state.selectedActivities.forEach(activity => {
        const fullActivity = state.currentCityActivities.find(a => a.id === activity.id);
        
        let coords;
        let markerTitle = activity.name;
        let activityData = fullActivity || activity;
        
        if (fullActivity && fullActivity.location) {
            coords = [fullActivity.location.lat, fullActivity.location.lng];
            console.log(`📍 Βρήκα location για ${activity.name}:`, coords);
        } else {
            if (cityCoords) {
                const randomLat = cityCoords[0] + (Math.random() - 0.5) * 0.03;
                const randomLng = cityCoords[1] + (Math.random() - 0.5) * 0.03;
                coords = [randomLat, randomLng];
                console.log(`📍 Χωρίς location για ${activity.name} - τυχαίες συντεταγμένες:`, coords);
            } else {
                coords = [51.5074, -0.1278];
            }
            
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
        
        if (!activityData.location) {
            activityData.location = {
                lat: coords[0],
                lng: coords[1]
            };
        }
        
        const marker = createMarkerWithConnectFunction(coords, markerTitle, activityData);
        if (marker) {
            markers.push(marker);
            activityCount++;
        }
    });
    
    if (markers.length > 0 && cityCoords) {
        const markerGroup = L.featureGroup(markers);
        window.travelMap.fitBounds(markerGroup.getBounds().pad(0.1));
    }
    
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
    
    if (selectedPointA && selectedPointB) {
        if (currentRouteLine) {
            currentRouteLine.openPopup();
        }
    } else {
        alert('🛣️ Παρακαλώ επιλέξτε δύο σημεία πρώτα\n\n1. Κάντε κλικ σε μια πινέζα (γίνεται πράσινη)\n2. Κάντε κλικ σε άλλη πινέζα (γίνεται κόκκινη)');
    }
}

// ========== HELPER FUNCTIONS ==========
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
    const data = {
        selectedDestinationName: state.selectedDestination,
        selectedDestinationId: state.selectedDestinationId,
        selectedDaysStay: state.selectedDays,
        familyMembers: state.familyMembers,
        selectedActivities: state.selectedActivities
    };
    
    localStorage.setItem('travelPlannerData', JSON.stringify(data));
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

// ========== FAMILY FUNCTIONS ==========
function updateFamilyMemberName(index, name) {
    state.familyMembers[index].name = name;
}

function updateFamilyMemberAge(index, age) {
    if (age === "" || isNaN(parseInt(age))) {
        state.familyMembers[index].age = "";
    } else {
        state.familyMembers[index].age = parseInt(age);
    }
    updateActivitiesTotal();
}

function addFamilyMember(type) {
    const newMember = {
        name: type === 'adult' ? 'Νέο Μέλος' : 'Νέο Παιδί',
        age: type === 'adult' ? 30 : 10
    };
    state.familyMembers.push(newMember);
    showStep('activities');
}

function removeFamilyMember(index) {
    if (state.familyMembers.length > 0) {
        state.familyMembers.splice(index, 1);
        showStep('activities');
        console.log(`➖ Αφαιρέθηκε μέλος. Μένησαν: ${state.familyMembers.length} άτομα`);
    } else {
        alert("ℹ️ Δεν υπάρχουν άλλα μέλη για διαγραφή");
    }
}

function updateFamilyMembers() {
    console.log('👨‍👩‍👧‍👦 Ενημέρωση οικογενειακών μελών...');
    
    const originalLength = state.familyMembers.length;
    state.familyMembers = state.familyMembers.filter(member => {
        const hasValidName = member.name && member.name.trim() !== "";
        const ageNum = parseInt(member.age);
        const hasValidAge = !isNaN(ageNum) && ageNum >= 0 && ageNum <= 120;
        return hasValidName && hasValidAge;
    });
    
    saveState();
    
    state.selectedActivities.forEach(activity => {
        const original = state.currentCityActivities.find(a => a.id === activity.id);
        if (original) {
            activity.price = calculateFamilyCost(original.prices);
        }
    });
    
    updateActivitiesTotal();
    
    if (state.currentStep === 'activities') {
        setTimeout(() => {
            setupActivitiesStep();
        }, 100);
    }
    
    const removed = originalLength - state.familyMembers.length;
    alert(`✅ Ενημέρωση ολοκληρώθηκε!\n\n` +
          (removed > 0 ? `🧹 Αφαιρέθηκαν ${removed} κενά μέλη.\n\n` : '') +
          `👨‍👩‍👧‍👦 Τώρα έχετε ${state.familyMembers.length} έγκυρα μέλη.`);
}

// ========== SMART COMBO CALCULATOR ==========
function calculateSmartCombos() {
    console.log('🧮 Έναρξη έξυπνου υπολογισμού combo...');
    
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
    
    setTimeout(() => {
        try {
            if (typeof window.calculateSmartCombosReal === 'function') {
                console.log('🎯 Καλείται η πραγματική συνάρτηση combo...');
                window.calculateSmartCombosReal();
            } else {
                alert('ℹ️ Η λειτουργία combo υπολογισμού βρίσκεται υπό ανάπτυξη.\n\nΣύντομα θα ενσωματώσουμε έξυπνα πακέτα για: Disneyland, Merlin Pass, κλπ.');
                simulateComboCalculation();
            }
        } catch (error) {
            console.error('❌ Σφάλμα combo υπολογισμού:', error);
            alert('⚠️ Προσωρινό σφάλμα στον υπολογισμό combos.\n\nΠαρακαλώ δοκιμάστε ξανά ή επικοινωνήστε με την υποστήριξη.');
        }
        
        const loadingDiv = document.getElementById('combo-calculating');
        if (loadingDiv) loadingDiv.remove();
        
    }, 1500);
}

function simulateComboCalculation() {
    if (!state.selectedActivities || state.selectedActivities.length < 2) {
        alert('ℹ️ Χρειάζονται τουλάχιστον 2 επιλεγμένες δραστηριότητες για combo υπολογισμό.');
        return;
    }
    
    const currentCost = state.selectedActivities.reduce((sum, activity) => sum + (activity.price || 0), 0);
    
    let discount = 0;
    let comboName = '';
    
    if (state.selectedActivities.length >= 3) {
        discount = currentCost * 0.15;
        comboName = '🎁 Πακέτο 3+ Δραστηριοτήτων';
    } else if (state.selectedActivities.length === 2) {
        discount = currentCost * 0.10;
        comboName = '🤝 Διπλό Πακέτο';
    }
    
    const newCost = currentCost - discount;
    
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
    
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
}

function applyComboDiscount(discount) {
    console.log(`💰 Εφαρμογή έκπτωσης: ${discount}€`);
    
    state.selectedActivities.forEach(activity => {
        const originalPrice = activity.price || 0;
        const discountPercentage = discount / state.selectedActivities.reduce((sum, act) => sum + (act.price || 0), 0);
        activity.discountedPrice = originalPrice * (1 - discountPercentage);
    });
    
    updateActivitiesTotal();
    
    document.querySelectorAll('[style*="position: fixed"][style*="background: rgba(0,0,0,0.8)"]').forEach(el => el.remove());
    
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

// ========== PROGRAM DAYS UPDATE ==========
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
        
        console.log(`📅 Ενημέρωση ημερών σε: ${selectedDays}`);
        
        showToast(`📅 Οι ημέρες ενημερώθηκαν σε ${selectedDays}. Πατήστε "Δημιουργία Προγράμματος"`, 'success');
    }
}

// ========== GROUP ACTIVITIES BY PROXIMITY ==========
function groupActivitiesByProximity(activities, maxDistanceKm = 2) {
    console.log(`📍 Ομαδοποίηση ${activities.length} δραστηριοτήτων (έως ${maxDistanceKm} km)`);
    
    if (!activities || activities.length === 0) {
        console.log('⚠️ Δεν υπάρχουν δραστηριότητες για ομαδοποίηση');
        return [];
    }
    
    const groups = [];
    const processed = new Set();
    
    const activitiesWithLocation = activities.filter(activity => 
        activity && activity.location && 
        activity.location.lat && activity.location.lng
    );
    
    console.log(`📊 ${activitiesWithLocation.length} από ${activities.length} έχουν τοποθεσία`);
    
    activitiesWithLocation.forEach((activity, index) => {
        if (processed.has(index)) return;
        
        const group = [activity];
        processed.add(index);
        
        activitiesWithLocation.forEach((otherActivity, otherIndex) => {
            if (processed.has(otherIndex) || index === otherIndex) return;
            
            const distance = calculateDistance(
                [activity.location.lat, activity.location.lng],
                [otherActivity.location.lat, otherActivity.location.lng]
            );
            
            if (distance <= maxDistanceKm) {
                group.push(otherActivity);
                processed.add(otherIndex);
                console.log(`   🔗 ${activity.name} ↔ ${otherActivity.name}: ${distance.toFixed(2)} km`);
            }
        });
        
        if (group.length > 0) {
            groups.push({
                center: calculateGroupCenter(group),
                activities: group,
                count: group.length,
                radius: maxDistanceKm
            });
        }
    });
    
    activitiesWithLocation.forEach((activity, index) => {
        if (!processed.has(index)) {
            groups.push({
                center: [activity.location.lat, activity.location.lng],
                activities: [activity],
                count: 1,
                radius: 0
            });
        }
    });
    
    console.log(`✅ Δημιουργήθηκαν ${groups.length} ομάδες`);
    
    groups.sort((a, b) => b.count - a.count);
    
    return groups;
}

function calculateGroupCenter(activities) {
    if (!activities || activities.length === 0) return null;
    
    if (activities.length === 1) {
        return [activities[0].location.lat, activities[0].location.lng];
    }
    
    let totalLat = 0;
    let totalLng = 0;
    
    activities.forEach(activity => {
        totalLat += activity.location.lat;
        totalLng += activity.location.lng;
    });
    
    return [totalLat / activities.length, totalLng / activities.length];
}

// ========== SMART CLUSTERING ==========
function createSmartClusters(activities, numClusters) {
    console.log('🧠 [SMART] Έξυπνη ομαδοποίηση με βάση το κέντρο βάρους');
    
    if (!activities || activities.length === 0) {
        console.log('⚠️ [SMART] Δεν υπάρχουν δραστηριότητες');
        return [];
    }
    
    if (numClusters <= 0) numClusters = 1;
    if (activities.length <= numClusters) {
        console.log(`ℹ️ [SMART] Λίγες δραστηριότητες (${activities.length}) για ${numClusters} ομάδες`);
        return activities.map(act => [act]);
    }
    
    const activitiesWithLocation = activities.filter(a => a.location && 
                                                      typeof a.location.lat === 'number' && 
                                                      typeof a.location.lng === 'number');
    
    const activitiesWithoutLocation = activities.filter(a => !a.location || 
                                                           typeof a.location.lat !== 'number' || 
                                                           typeof a.location.lng !== 'number');
    
    console.log(`📍 [SMART] ${activitiesWithLocation.length} με location, ${activitiesWithoutLocation.length} χωρίς`);
    
    let centerLat, centerLng;
    
    if (activitiesWithLocation.length > 0) {
        centerLat = activitiesWithLocation.reduce((sum, act) => sum + act.location.lat, 0) / activitiesWithLocation.length;
        centerLng = activitiesWithLocation.reduce((sum, act) => sum + act.location.lng, 0) / activitiesWithLocation.length;
        console.log(`🎯 [SMART] Κέντρο βάρους: ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}`);
    } else {
        console.log('⚠️ [SMART] Καμία δραστηριότητα δεν έχει location - απλή κατανομή');
        const clusterSize = Math.ceil(activities.length / numClusters);
        const clusters = [];
        for (let i = 0; i < numClusters; i++) {
            const start = i * clusterSize;
            const end = Math.min(start + clusterSize, activities.length);
            clusters.push(activities.slice(start, end));
        }
        return clusters.filter(c => c.length > 0);
    }
    
    const activitiesWithDistance = activitiesWithLocation.map(act => {
        const latDiff = act.location.lat - centerLat;
        const lngDiff = act.location.lng - centerLng;
        const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        
        return {
            activity: act,
            distance: distance,
            name: act.name || 'Άγνωστη'
        };
    });
    
    const sortedByDistance = [...activitiesWithDistance].sort((a, b) => a.distance - b.distance);
    
    console.log('📏 [SMART] Ταξινόμηση απόστασης από κέντρο:');
    sortedByDistance.forEach((item, i) => {
        console.log(`   ${i+1}. ${item.name.substring(0, 30)} - ${item.distance.toFixed(6)}°`);
    });
    
    const clusterSize = Math.ceil(sortedByDistance.length / numClusters);
    const clusters = [];
    
    console.log(`📦 [SMART] Χωρισμός σε ${numClusters} ομάδες, ~${clusterSize} δραστηριότητες ανά ομάδα`);
    
    for (let i = 0; i < numClusters; i++) {
        const start = i * clusterSize;
        const end = Math.min(start + clusterSize, sortedByDistance.length);
        const cluster = sortedByDistance.slice(start, end).map(item => item.activity);
        
        if (cluster.length > 0) {
            cluster.sort((a, b) => (b.location?.lat || 0) - (a.location?.lat || 0));
            clusters.push(cluster);
        }
    }
    
    if (activitiesWithoutLocation.length > 0) {
        console.log(`➕ [SMART] Προσθήκη ${activitiesWithoutLocation.length} δραστηριοτήτων χωρίς location`);
        
        activitiesWithoutLocation.forEach((act, index) => {
            const targetCluster = clusters[index % clusters.length];
            if (targetCluster) {
                targetCluster.push(act);
            }
        });
    }
    
    console.log(`✅ [SMART] Δημιουργήθηκαν ${clusters.length} ομάδες:`);
    clusters.forEach((cluster, i) => {
        const withLoc = cluster.filter(a => a.location).length;
        const withoutLoc = cluster.length - withLoc;
        console.log(`   Ομάδα ${i+1}: ${cluster.length} δραστηριότητες (${withLoc} με location, ${withoutLoc} χωρίς)`);
    });
    
    return clusters;
}

function showGroupedActivitiesOnMap() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    if (state.selectedActivities.length === 0) {
        alert('Δεν έχετε επιλέξει καμία δραστηριότητα');
        return;
    }
    
    const selectedFullActivities = state.selectedActivities.map(selected => 
        state.currentCityActivities.find(a => a.id === selected.id)
    ).filter(a => a !== undefined);
    
    const groups = groupActivitiesByProximity(selectedFullActivities, 1.5);
    
    if (groups.length === 0) {
        alert('Δεν βρέθηκαν ομάδες δραστηριοτήτων');
        return;
    }
    
    window.travelMap.eachLayer(layer => {
        if (layer instanceof L.Marker) window.travelMap.removeLayer(layer);
    });
    
    groups.forEach((group, index) => {
        const color = getGroupColor(index);
        
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
        
        if (group.radius > 0 && group.count > 1) {
            L.circle(group.center, {
                radius: group.radius * 1000,
                color: color,
                fillColor: color,
                fillOpacity: 0.1,
                weight: 2
            }).addTo(window.travelMap);
        }
        
        group.activities.forEach(activity => {
            createMarkerWithConnectFunction(
                [activity.location.lat, activity.location.lng],
                activity.name,
                activity
            );
        });
    });
    
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

// ========== CLICK-TO-CONNECT SYSTEM ==========
let selectedPointA = null;
let selectedPointB = null;
let currentRouteLine = null;

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
    if (!window.travelMap) {
        console.error('❌ Χάρτης δεν είναι διαθέσιμος');
        return null;
    }
    
    const safeActivityData = {
        name: title,
        description: activityData?.description || 'Επιλεγμένη δραστηριότητα',
        price: activityData?.price || 0,
        duration_hours: activityData?.duration_hours || '?',
        category: activityData?.category || 'attraction',
        location: activityData?.location || { lat: coords[0], lng: coords[1] },
        restaurant: activityData?.restaurant || '🍽️ Τοπικά εστιατόρια στην περιοχή'
    };
    
    console.log(`📍 Δημιουργία marker για: ${title}`, coords);
    
    const getMarkerColor = () => {
        if (selectedPointA && selectedPointA.title === title) return '#10B981';
        if (selectedPointB && selectedPointB.title === title) return '#EF4444';
        return '#4F46E5';
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
    
    marker.options.activityData = safeActivityData;
    marker.options.originalTitle = title;
    marker.options.coords = coords;
    
    const handleMarkerClick = function(e) {
        console.log(`📍 Κλικ στο: ${title}`, e.latlng);
        
        if (!selectedPointA) {
            selectedPointA = {
                marker: marker,
                coords: coords,
                title: title,
                data: safeActivityData,
                latlng: e.latlng
            };
            
            updateMarkerAppearance();
            
            showToast(`
                <div style="background: #D1FAE5; padding: 12px; border-radius: 8px; border-left: 4px solid #10B981;">
                    <strong style="color: #065F46;">✅ Επιλέχθηκε ως σημείο ΑΠΟ:</strong><br>
                    <span style="font-weight: bold;">${title}</span><br>
                    <small style="color: #047857;">Κάντε κλικ σε άλλη πινέζα για επιλογή προορισμού</small>
                </div>
            `, 'info');
            
        } 
        else if (!selectedPointB && selectedPointA.marker !== marker) {
            selectedPointB = {
                marker: marker,
                coords: coords,
                title: title,
                data: safeActivityData,
                latlng: e.latlng
            };
            
            updateMarkerAppearance();
            
            setTimeout(() => {
                drawRouteBetweenPoints();
            }, 300);
            
        } 
        else if (selectedPointA && selectedPointA.marker === marker) {
            showToast(`ℹ️ Έχετε ήδη επιλέξει το <strong>${title}</strong> ως σημείο ΑΠΟ`, 'warning');
        }
        else if (selectedPointB && selectedPointB.marker === marker) {
            showToast(`ℹ️ Έχετε ήδη επιλέξει το <strong>${title}</strong> ως σημείο ΠΡΟΣ`, 'warning');
        }
        else if (selectedPointA && selectedPointB) {
            resetSelection();
            
            selectedPointA = {
                marker: marker,
                coords: coords,
                title: title,
                data: safeActivityData,
                latlng: e.latlng
            };
            
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
    
    function updateMarkerAppearance() {
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
        
        const popupContent = isPointA ? 
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
        
        marker.bindPopup(popupContent);
        
        if (isPointA || isPointB) {
            marker.openPopup();
        }
    }
    
    marker.on('click', handleMarkerClick);
    
    marker.bindPopup(createEnhancedPopup(safeActivityData));
    
    return marker;
}

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
    
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
    }
    
    const distance = calculateDistance(
        selectedPointA.coords,
        selectedPointB.coords
    ).toFixed(1);
    
    const walkTime = Math.round(distance * 15);
    const carTime = Math.round(distance * 3);
    const transitTime = Math.round(distance * 5);
    const bikeTime = Math.round(distance * 8);
    
    currentRouteLine = L.polyline([selectedPointA.coords, selectedPointB.coords], {
        color: '#FF6B6B',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round'
    }).addTo(window.travelMap);
    
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

    currentRouteLine.bindPopup(routePopup);
    
    showToast(`✅ Διαδρομή δημιουργήθηκε!<br><strong>${selectedPointA.title}</strong> → <strong>${selectedPointB.title}</strong><br>Απόσταση: ${distance} km`, 'success');
    
    setTimeout(() => {
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
    
    if (marker.options && marker.options.activityData) {
        marker.bindPopup(createEnhancedPopup(marker.options.activityData));
    }
}

// ========== CALCULATE DISTANCE ==========
function calculateDistance(point1, point2) {
    const R = 6371;
    
    const lat1 = point1[0] * Math.PI / 180;
    const lat2 = point2[0] * Math.PI / 180;
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ========== HELPER FUNCTIONS ==========
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
        return `${min}€ για όλους`;
    } else if (min === 0) {
        return `${max}€ (βρέφη δωρεάν)`;
    } else {
        return `${min}-${max}€`;
    }
}

function getPriceForAge(prices, age) {
    if (!prices) return '?';
    
    if (prices[age] !== undefined && prices[age] !== null) {
        return prices[age] + '€';
    }
    
    if (age >= 18 && prices.adult !== undefined) {
        return prices.adult + '€';
    }
    
    if (age >= 5 && age <= 17) {
        if (prices.child !== undefined) return prices.child + '€';
        if (prices['10'] !== undefined) return prices['10'] + '€';
        if (prices['5'] !== undefined) return prices['5'] + '€';
    }
    
    if (age <= 4 && prices['0'] !== undefined) {
        return prices['0'] === 0 ? 'ΔΩΡΕΑΝ' : prices['0'] + '€';
    }
    
    for (let i = age; i >= 0; i--) {
        if (prices[i] !== undefined) {
            return prices[i] + '€';
        }
    }
    
    return '?';
}

function showSelectedDestination() {
    console.log('📍 Επιλεγμένος προορισμός:', state.selectedDestination);
}

// ========== OLD FUNCTIONS (FOR COMPATIBILITY) ==========
function createDailyProgram() {
    console.log('📅 createDailyProgram καλείται (παλιά έκδοση)');
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
    alert('ℹ️ Η λειτουργία αυτόματου υπολογισμού απενεργοποιήθηκε.\n\nΕπιλέξτε μόνοι σας τις μέρες από το dropdown.');
    return 0;
}

// ========== SIMPLIFIED MAP FUNCTIONS ==========
function loadActivitiesOnMap() {
    alert('📌 Θα φορτώσουμε τις δραστηριότητες στο επόμενο βήμα!\n\nΓια τώρα, ο χάρτης είναι σε λειτουργία.');
    
    const statusEl = document.getElementById('map-status');
    if (statusEl) {
        statusEl.innerHTML = `
            <i class="fas fa-check-circle" style="color: #10B981;"></i>
            <strong>Έτοιμο:</strong> Ο χάρτης είναι έτοιμος για χρήση
        `;
    }
}

function clearMap() {
    alert('🗺️ Η λειτουργία καθαρισμού θα προστεθεί στο επόμενο βήμα');
}

function showGroupedMap() {
    alert('👥 Η ομαδοποίηση θα προστεθεί στο επόμενο βήμα');
}

function initializeSimpleMap() {
    console.log('🗺️ Αρχικοποίηση απλού χάρτη για:', state.selectedDestination);
    
    const mapElement = document.getElementById('simple-map');
    if (!mapElement) {
        console.error('❌ Δεν βρέθηκε map element');
        return;
    }
    
    if (window.simpleMap) {
        window.simpleMap.remove();
    }
    
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
    
    window.simpleMap = L.map('simple-map').setView(cityCoords, 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(window.simpleMap);
    
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
    
    const statusEl = document.getElementById('map-status');
    if (statusEl) {
        statusEl.innerHTML = `
            <i class="fas fa-check-circle" style="color: #10B981;"></i>
            <strong>Έτοιμο:</strong> Χάρτης φορτώθηκε για ${state.selectedDestination}
        `;
    }
}

// ========== TEST FUNCTION ==========
function testNewClustering() {
    console.log('🧪 === ΣΥΓΚΡΙΣΗ ΠΑΛΙΑΣ vs ΝΕΑΣ ΜΕΘΟΔΟΥ ===');
    
    if (!state.selectedActivities || state.selectedActivities.length === 0) {
        alert('⚠️ Δεν έχετε επιλέξει δραστηριότητες!\nΠαρακαλώ πηγαίνετε στο βήμα 4.');
        return;
    }
    
    if (!state.currentCityActivities || state.currentCityActivities.length === 0) {
        alert('⚠️ Δεν υπάρχουν πληροφορίες για τις δραστηριότητες!');
        return;
    }
    
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
    
    console.log('\n🧠 === ΝΕΑ ΜΕΘΟΔΟΥ (createSmartClusters) ===');
    const newClusters = createSmartClusters(fullActivities, days);
    console.log(`✅ Δημιουργήθηκαν ${newClusters.length} ομάδες:`);
    newClusters.forEach((cluster, i) => {
        console.log(`   Ομάδα ${i+1}: ${cluster.length} δραστηριότητες`);
        cluster.slice(0, 3).forEach((act, j) => {
            console.log(`     ${j+1}. ${act.name.substring(0, 40)}${act.name.length > 40 ? '...' : ''}`);
        });
        if (cluster.length > 3) {
            console.log(`     ... και ${cluster.length - 3} ακόμη`);
        }
    });
    
    console.log('\n📈 === ΣΥΓΚΡΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ ===');
    console.log(`🔹 Παλιά μέθοδος: ${oldGroups.length} ομάδες, συνολικά ${oldGroups.reduce((sum, g) => sum + g.count, 0)} δραστηριότητες`);
    console.log(`🔹 Νέα μέθοδος: ${newClusters.length} ομάδες, συνολικά ${newClusters.reduce((sum, c) => sum + c.length, 0)} δραστηριότητες`);
    
    alert(`🧪 Σύγκριση ολοκληρώθηκε!\n\n` +
          `📊 Σύνολο: ${fullActivities.length} δραστηριότητες\n` +
          `🔄 Παλιά μέθοδος: ${oldGroups.length} ομάδες\n` +
          `🧠 Νέα μέθοδος: ${newClusters.length} ομάδες\n\n` +
          `📖 Άνοιξε την Console (F12) για λεπτομέρειες.`);
    
    console.log('✅ === ΤΕΛΟΣ ΣΥΓΚΡΙΣΗΣ ===');
}

// ========== EXPORT FUNCTIONS TO WINDOW ==========
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
window.createMarkerWithConnectFunction = createMarkerWithConnectFunction;
window.drawRouteBetweenPoints = drawRouteBetweenPoints;
window.showToast = showToast;
window.resetMarkerAppearance = resetMarkerAppearance;
window.resetSelection = resetSelection;
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
window.testNewClustering = testNewClustering;
window.generateGeographicProgram = generateGeographicProgram;

// ========== CSS ANIMATIONS ==========
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

// ========== COMBO CALCULATOR LOADER ==========
function loadComboCalculator() {
    const script = document.createElement('script');
    script.src = 'combo-calculator.js';
    script.onload = function() {
        console.log('✅ combo-calculator.js loaded successfully');
        window.calculateSmartCombosReal = window.calculateSmartCombos;
    };
    script.onerror = function() {
        console.warn('⚠️ combo-calculator.js failed to load, using fallback');
    };
    document.head.appendChild(script);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComboCalculator);
} else {
    loadComboCalculator();
}

// ========== INITIALIZE CONNECT SYSTEM ==========
addConnectStyles();

console.log('✅ app.js loaded successfully!');
