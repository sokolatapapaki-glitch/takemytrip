// ==================== GLOBAL STATE ====================
const state = {
    selectedDestination: null,
    selectedDestinationId: null,
    selectedDays: 0,
        familyMembers: [
        { name: "Πατέρας", age: 42 },
        { name: "Μητέρα", age: 40 }
    ],
    currentStep: 'destination',
    currentCityActivities: [],
    customPoints: JSON.parse(localStorage.getItem('travel_custom_points')) || [],
    selectedActivities: []
};

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

// ==================== MOBILE NAVIGATION ====================
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

// ==================== STEP MANAGEMENT ====================
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
            setupFlightStep();
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
                    setupMapStep();
                } else {
                    console.error('❌ Leaflet δεν φορτώθηκε');
                    document.getElementById('map-container').innerHTML = `
                        <div style="height: 500px; display: flex; align-items: center; justify-content: center; background: var(--light); color: var(--gray);">
                            <div style="text-align: center;">
                                <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom: 15px;"></i>
                                <h4>Χάρτης μη διαθέσιμος</h4>
                                <p>Δοκιμάστε να ανανεώσετε τη σελίδα</p>
                            </div>
                        </div>
                    `;
                }
            }, 500);
            break;
    }
}

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
    resetFilters();  // <-- ΠΡΟΣΘΕΣΕ resetFilters
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
                    <label class="form-label"><i class="fas fa-cloud-sun"></i> Καιρός</label>
                    <select class="form-control" id="weather">
                        <option value="">Όλοι οι καιροί</option>
                        <option value="Ζεστό">☀️ Πιο ζεστό από Ελλάδα</option>
                        <option value="Κρύο">⛄ Πιο κρύο</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-3">
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-umbrella-beach"></i> Τύπος Διακοπών</label>
                    <select class="form-control" id="vacation-type">
                        <option value="">Όλοι οι τύποι</option>
                        <option value="Πολιτισμός">🏛️ Πολιτισμός & Μουσεία</option>
                        <option value="Θάλασσα">🏖️ Θαλάσσια & Παραλίες</option>
                        <option value="Βουνό">🏔️ Βουνό & Χιονοδρομικά</option>
                        <option value="Φυσική">🌳 Φυσική Ομορφία</option>
                        </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-wallet"></i> Επίπεδο Κόστους</label>
                    <select class="form-control" id="cost-level">
                        <option value="">Όλα τα επίπεδα</option>
                        <option value="Οικονομικό">💰 Οικονομικό</option>
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
            
            <!-- Οι γρήγορες επιλογές, το κουμπί αναζήτησης και τα αποτελέσματα παραμένουν ΑΜΕΤΑΒΛΗΤΑ -->
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

// ==================== STEP 2: FLIGHT ====================
function getFlightStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-plane"></i> Αναζήτηση Πτήσεων</h1>
            <p class="card-subtitle">Βρείτε τις καλύτερες πτήσεις για το ταξίδι σας</p>
            
            <div class="grid grid-3">
                <div class="form-group">
                    <label class="form-label">Από</label>
                    <input type="text" class="form-control" value="Αθήνα" readonly>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Προς</label>
                    <input type="text" class="form-control" id="flight-destination" 
                           value="${state.selectedDestination || ''}" ${state.selectedDestination ? 'readonly' : ''}>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Ημερομηνία</label>
                    <input type="date" class="form-control" id="flight-date" 
                           value="${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}">
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

function setupFlightStep() {
    const flightDate = document.getElementById('flight-date');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    flightDate.min = today.toISOString().split('T')[0];
    flightDate.value = nextWeek.toISOString().split('T')[0];
}

// ==================== STEP 3: HOTEL ====================
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
                    <input type="date" class="form-control" id="hotel-checkin" 
                           value="${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Check-out</label>
                    <input type="date" class="form-control" id="hotel-checkout" 
                           value="${new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}">
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
        <option value="1" selected>1</option>  <!-- ΜΟΝΟ ΕΔΩ selected -->
        <option value="2">2</option>
        <option value="3">3</option>
    </select>
</div>
            </div>
                        
            <!-- Προειδοποίηση για πλατφόρμες -->
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

<!-- Κουμπιά αναζήτησης -->
<div style="text-align: center; margin: 40px 0; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">

    <!-- ========== 1. BOOKING.COM ========== -->
    <button class="btn btn-primary" onclick="searchBookingHotels()" 
            style="min-width: 280px; padding: 18px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);"
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(33, 150, 243, 0.4)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(33, 150, 243, 0.2)';">
        <i class="fas fa-search"></i> Αναζήτηση σε Booking.com
    </button>

    <!-- ========== 2. EXPEDIA ========== -->
    <div style="display: flex; flex-direction: column; align-items: center;">
        <!-- ΚΟΥΜΠΙ -->
        <button class="btn btn-accent" onclick="searchExpediaHotels()" 
                style="min-width: 280px; padding: 18px; background: linear-gradient(135deg, #ff9800, #ff5722); border: none; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(255, 87, 34, 0.2); margin-bottom: 8px;"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(255, 87, 34, 0.5)';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 87, 34, 0.2)';">
            <i class="fas fa-hotel"></i> Αναζήτηση σε Expedia
        </button>
        
        <!-- ΠΛΑΙΣΙΟ ΜΗΝΥΜΑΤΟΣ -->
        <div style="font-size: 11px; color: #555; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #ff9800; max-width: 280px; text-align: center; line-height: 1.3;">
            <i class="fas fa-info-circle" style="color: #ff9800; margin-right: 5px;"></i>
            Αν κλείσεις μέσω EXPEDIA, η εφαρμογή μας θα πάρει μια μικρή προμήθεια 
            <strong>χωρίς επιπλέον κόστος για σένα</strong>.
        </div>
    </div>

    <!-- ========== 3. TICKETSELLER.GR ========== -->
    <div style="display: flex; flex-direction: column; align-items: center;">
        <!-- ΚΟΥΜΠΙ -->
        <button class="btn" onclick="window.open('https://ticketseller.gr/el/home-2/', '_blank')" 
                style="min-width: 280px; padding: 18px; background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; border: none; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2); margin-bottom: 8px;"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(76, 175, 80, 0.4)';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(76, 175, 80, 0.2)';">
            <i class="fas fa-ticket-alt"></i> TicketSeller.gr
        </button>
        
        <!-- ΠΛΑΙΣΙΟ ΜΗΝΥΜΑΤΟΣ -->
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
    
    // Μόνο ορισμός minimum date (σήμερα)
    checkin.min = today.toISOString().split('T')[0];
    checkout.min = today.toISOString().split('T')[0];
    
    // ΚΑΝΕΝΑ default value
    
    // Αυτόματη ενημέρωση checkout όταν αλλάζει το checkin
    checkin.addEventListener('change', function() {
        if (this.value) {
            const checkinDate = new Date(this.value);
            const newCheckout = new Date(checkinDate.getTime() + 3 * 24 * 60 * 60 * 1000);
            checkout.min = this.value;
            
            // Προσθήκη checkout μόνο αν δεν έχει τιμή
            if (!checkout.value) {
                checkout.value = newCheckout.toISOString().split('T')[0];
            }
        }
    });
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
                    
                    <div id="family-members-container">
                        ${state.familyMembers.map((member, index) => `
                            <div class="family-member" style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px; padding: 15px; background: white; border-radius: var(--radius-md);">
                                <div style="font-size: 24px;">${index === 0 ? '👨' : index === 1 ? '👩' : '🧒'}</div>
                                <input type="text" class="form-control" value="${member.name}" 
                                       onchange="updateFamilyMemberName(${index}, this.value)">
                                <input type="number" class="form-control" value="${member.age}" min="0" max="120"
                                       onchange="updateFamilyMemberAge(${index}, this.value)">
                                <span>ετών</span>
                                ${index >= 2 ? `<button class="btn btn-outline" onclick="removeFamilyMember(${index})" style="padding: 8px 12px;"><i class="fas fa-times"></i></button>` : ''}
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
                
                <!-- Activities Container -->
                <div id="activities-list" class="grid grid-3">
                    <div class="loading" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Φόρτωση δραστηριοτήτων...</p>
                    </div>
                </div>
                
                <!-- Smart Combo Button και Καθαρισμός -->
                <div style="display: flex; gap: 15px; justify-content: center; margin: 30px 0; flex-wrap: wrap;">
                    <button class="btn btn-accent" onclick="calculateSmartCombos()" style="padding: 18px 40px; font-size: 18px;">
                        <i class="fas fa-calculator"></i> Έξυπνο Combo
                    </button>
                    
                    <button class="btn btn-outline" onclick="clearSelectedActivities()" 
                            style="padding: 18px 40px; font-size: 18px; border-color: var(--danger); color: var(--danger);">
                        <i class="fas fa-trash-alt"></i> Καθαρισμός Επιλογών
                    </button>
                </div>
                
                <!-- Total Cost -->
                <div class="card" style="background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: white; text-align: center;">
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
            <h1 class="card-title"><i class="fas fa-file-alt"></i> Τελική Σύνοψη & Πρόγραμμα</h1>
            <p class="card-subtitle">${state.selectedDestination ? 'Πρόγραμμα για: ' + state.selectedDestination : 'Δεν έχετε επιλέξει προορισμό'}</p>
            
            ${!state.selectedDestination ? `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Δεν έχετε επιλέξει προορισμό. Παρακαλώ επιστρέψτε στο βήμα 1.
                </div>
            ` : `
                <!-- Trip Overview -->
                <div class="grid grid-3" style="margin-bottom: 30px;">
                    <div class="card" style="text-align: center;">
                        <h3><i class="fas fa-map-marker-alt"></i> Προορισμός</h3>
                        <h2 style="color: var(--primary); margin: 10px 0;">${state.selectedDestination}</h2>
                    </div>
                    
                    <div class="card" style="text-align: center;">
                        <h3><i class="fas fa-calendar-alt"></i> Διάρκεια</h3>
                        <h2 style="color: var(--primary); margin: 10px 0;">${state.selectedDays || '?'} Μέρες</h2>
                    </div>
                    
                    <div class="card" style="text-align: center;">
                        <h3><i class="fas fa-users"></i> Οικογένεια</h3>
                        <h2 style="color: var(--primary); margin: 10px 0;">${state.familyMembers.length} Άτομα</h2>
                    </div>
                </div>
                
                <!-- ΝΕΟ: Επιλογή Ημερών για Πρόγραμμα -->
                <div class="card" style="margin: 30px 0; background: #f0f7ff; border-left: 4px solid var(--primary);">
                    <h3><i class="fas fa-calendar-alt"></i> Διάρκεια Ταξιδιού</h3>
                    <p style="color: var(--gray); margin-bottom: 15px;">
                        Επιλέξτε πόσες μέρες θα διαρκέσει το ταξίδι σας για να δημιουργηθεί το ημερήσιο πρόγραμμα.
                    </p>
                    
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <select class="form-control" id="program-days" style="width: 200px; font-size: 16px; padding: 12px;">
                            <option value="0" ${state.selectedDays === 0 ? 'selected disabled' : 'disabled'}>-- Επιλέξτε μέρες --</option>
                            <option value="2" ${state.selectedDays === 2 ? 'selected' : ''}>2 μέρες</option>
                            <option value="3" ${state.selectedDays === 3 ? 'selected' : ''}>3 μέρες</option>
                            <option value="4" ${state.selectedDays === 4 ? 'selected' : ''}>4 μέρες</option>
                            <option value="5" ${state.selectedDays === 5 ? 'selected' : ''}>5 μέρες</option>
                            <option value="7" ${state.selectedDays === 7 ? 'selected' : ''}>7 μέρες (Μια εβδομάδα)</option>
                            <option value="10" ${state.selectedDays === 10 ? 'selected' : ''}>10+ μέρες</option>
                        </select>
                        
                        <button class="btn btn-primary" onclick="updateProgramDays()" style="padding: 12px 25px;">
                            <i class="fas fa-sync-alt"></i> Ενημέρωση Προγράμματος
                        </button>
                        
                        <span id="days-display" style="color: var(--primary); font-weight: bold; font-size: 16px;">
                            ${state.selectedDays > 0 ? '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν' : '⚠️ Δεν έχετε επιλέξει ακόμα'}
                        </span>
                    </div>
                    
                    <div style="margin-top: 15px; font-size: 14px; color: #666; background: white; padding: 10px; border-radius: 6px;">
                        <i class="fas fa-info-circle"></i> Οι ημέρες χρησιμοποιούνται <strong>μόνο</strong> για τη δημιουργία του προγράμματος, όχι για φιλτράρισμα.
                    </div>
                </div>
                
                <!-- Selected Activities -->
                <div class="card" id="selected-activities-section">
                    <h3><i class="fas fa-star"></i> Επιλεγμένες Δραστηριότητες</h3>
                    <div id="selected-activities-list" style="min-height: 100px; padding: 20px; background: #f8f9fa; border-radius: var(--radius-md);">
                        ${state.selectedActivities.length === 0 ? 
                            '<p style="text-align: center; color: var(--gray);"><i class="fas fa-info-circle"></i> Δεν έχετε επιλέξει δραστηριότητες ακόμα</p>' : 
                            state.selectedActivities.map(activity => 
                                `<div style="padding: 10px; background: white; margin-bottom: 10px; border-radius: 8px;">
                                    <i class="fas fa-check-circle" style="color: var(--success); margin-right: 10px;"></i>
                                    ${activity.name} - ${activity.price || '0'}€
                                </div>`
                            ).join('')}
                    </div>
                </div>
                
                <!-- Daily Program -->
                <div class="card" id="daily-program-section">
                    <h3><i class="fas fa-calendar-day"></i> Ημερήσιο Πρόγραμμα</h3>
                    <div id="daily-program" style="min-height: 100px; padding: 20px; background: #f8f9fa; border-radius: var(--radius-md);">
                        <p style="text-align: center; color: var(--gray);">
                            <i class="fas fa-spinner fa-spin"></i> Δημιουργία προγράμματος...
                        </p>
                    </div>
                </div>
                
                <!-- Next Button -->
                <div style="text-align: center; margin-top: 40px;">
                    <button class="btn btn-primary" onclick="showStep('map')" style="padding: 18px 50px; font-size: 18px;">
                        <i class="fas fa-map"></i> Συνέχεια στον Χάρτη
                    </button>
                </div>
            `}
        </div>
    `;
}
// ==================== STEP 6: MAP ====================
function getMapStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-map"></i> Διαδραστικός Χάρτης</h1>
            <p class="card-subtitle">${state.selectedDestination ? 'Χάρτης για: ' + state.selectedDestination : 'Δεν έχετε επιλέξει προορισμό'}</p>
            
            ${!state.selectedDestination ? `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Δεν έχετε επιλέξει προορισμό. Παρακαλώ επιστρέψτε στο βήμα 1.
                </div>
            ` : `
                <div id="map-container" style="height: 500px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px; border: 2px solid var(--border);">
                    <div id="map" style="height: 100%; width: 100%;"></div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
                    <button class="btn btn-outline" onclick="reloadMap()">
                        <i class="fas fa-sync-alt"></i> Επαναφόρτωση
                    </button>
                    
                    <button class="btn btn-primary" onclick="addCustomPoint()">
                        <i class="fas fa-plus"></i> Προσθήκη Σημείου
                    </button>
                    
                    <button class="btn btn-secondary" onclick="showActivityMap()">
                        <i class="fas fa-map-pin"></i> Προβολή Σημείων
                    </button>
                    
                   <button class="btn btn-accent" onclick="showRouteBetweenPoints()">
    <i class="fas fa-route"></i> Διαδρομή
</button>
                </div>
                
                <div id="custom-points-container" style="display: none;">
                    <h3><i class="fas fa-map-pin"></i> Προσωπικά Σημεία</h3>
                    <div id="custom-points-list"></div>
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
    const days = document.getElementById('manual-days').value;
    const budget = document.getElementById('manual-budget').value;
    
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
    state.selectedDays = parseInt(days) || 5;
    state.selectedBudget = parseInt(budget) || 0;
    
    document.getElementById('current-destination-display').textContent = cityName;
    updateActivitiesCost();
    
    closeManualDestinationModal();
    
    alert(`✅ Επιλέξατε: ${cityName}\n\nΤώρα μπορείτε να συνεχίσετε στις πτήσεις.`);
    
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
    const weather = document.getElementById('weather').value;
    const vacationType = document.getElementById('vacation-type').value;
    const costLevel = document.getElementById('cost-level').value;
    const themeParks = document.getElementById('theme-parks').value;
    // 🆕 ΝΕΟ ΦΙΛΤΡΟ (αντικατέστησε το travel-type):
    const strollerFilter = document.getElementById('stroller-friendly-filter').value;
    
    console.log('🎯 Εφαρμογή φίλτρων:', {
        distance, weather, vacationType, costLevel, themeParks, strollerFilter
    });
    
    // 📊 ΟΛΟΚΛΗΡΩΜΕΝΟΣ ΠΙΝΑΚΑΣ ΠΟΛΕΩΝ (22 πόλεις με το νέο πεδίο strollerFriendly)
    const allCities = [
        { 
            id: 'amsterdam', name: 'Άμστερνταμ', emoji: '🌷',
            hasJSON: true, distance: 3.5, weather: 'Κρύο', cost: 'Ακριβό',
            country: 'Ολλανδία', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 9, hasDisney: false,
            strollerFriendly: true // ✅ Στη λίστα σου
        },
        { 
            id: 'paris', name: 'Παρίσι', emoji: '🗼', 
            hasJSON: true, distance: 3.0, weather: 'Κρύο', cost: 'Ακριβό',
            country: 'Γαλλία', vacationType: 'Πολιτισμός',
            themeParks: ['disney', 'has-parks'], familyScore: 10, hasDisney: true,
            strollerFriendly: false // Όχι στη λίστα
        },
        { 
            id: 'london', name: 'Λονδίνο', emoji: '🇬🇧',
            hasJSON: true, distance: 3.8, weather: 'Κρύο', cost: 'Ακριβό',
            country: 'ΗΒ', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 9, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'berlin', name: 'Βερολίνο', emoji: '🇩🇪',
            hasJSON: true, distance: 2.5, weather: 'Κρύο', cost: 'Μέτριο',
            country: 'Γερμανία', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 8, hasDisney: false,
            strollerFriendly: true // ✅ Στη λίστα σου
        },
        { 
            id: 'prague', name: 'Πράγα', emoji: '🏰',
            hasJSON: true, distance: 2.2, weather: 'Κρύο', cost: 'Οικονομικό',
            country: 'Τσεχία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 7, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'budapest', name: 'Βουδαπέστη', emoji: '♨️',
            hasJSON: true, distance: 2.0, weather: 'Κρύο', cost: 'Οικονομικό',
            country: 'Ουγγαρία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 6, hasDisney: false,
            strollerFriendly: true // ✅ Στη λίστα σου
        },
        { 
            id: 'vienna', name: 'Βιέννη', emoji: '🎻',
            hasJSON: true, distance: 2.3, weather: 'Κρύο', cost: 'Μέτριο',
            country: 'Αυστρία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 7, hasDisney: false,
            strollerFriendly: true // ✅ Στη λίστα σου
        },
        { 
            id: 'rome', name: 'Ρώμη', emoji: '🏛️',
            hasJSON: false, distance: 2.5, weather: 'Ίδιο', cost: 'Μέτριο',
            country: 'Ιταλία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'barcelona', name: 'Βαρκελώνη', emoji: '🏖️',
            hasJSON: false, distance: 3.0, weather: 'Ζεστό', cost: 'Μέτριο',
            country: 'Ισπανία', vacationType: 'Θάλασσα',
            themeParks: ['has-parks'], familyScore: 8, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'madrid', name: 'Μαδρίτη', emoji: '🐂',
            hasJSON: true, distance: 3.2, weather: 'Ζεστό', cost: 'Μέτριο',
            country: 'Ισπανία', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 8, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'lisbon', name: 'Λισαβόνα', emoji: '🌊',
            hasJSON: true, distance: 4.0, weather: 'Ζεστό', cost: 'Οικονομικό',
            country: 'Πορτογαλία', vacationType: 'Θάλασσα',
            themeParks: [], familyScore: 6, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'istanbul', name: 'Κωνσταντινούπολη', emoji: '🕌',
            hasJSON: true, distance: 1.5, weather: 'Ίδιο', cost: 'Οικονομικό',
            country: 'Τουρκία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 7, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'brussels', name: 'Βρυξέλλες', emoji: '🍫',
            hasJSON: false, distance: 3.0, weather: 'Κρύο', cost: 'Μέτριο',
            country: 'Βέλγιο', vacationType: 'Πόλη',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'copenhagen', name: 'Κοπεγχάγη', emoji: '🧜‍♀️',
            hasJSON: false, distance: 3.5, weather: 'Κρύο', cost: 'Ακριβό',
            country: 'Δανία', vacationType: 'Πόλη',
            themeParks: ['has-parks'], familyScore: 9, hasDisney: false,
            strollerFriendly: true // ✅ Στη λίστα σου
        },
        { 
            id: 'dublin', name: 'Δουβλίνο', emoji: '🍀',
            hasJSON: false, distance: 4.0, weather: 'Κρύο', cost: 'Ακριβό',
            country: 'Ιρλανδία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: true // ✅ Στη λίστα σου
        },
        { 
            id: 'edinburgh', name: 'Εδιμβούργο', emoji: '🏰',
            hasJSON: false, distance: 4.0, weather: 'Κρύο', cost: 'Ακριβό',
            country: 'Σκωτία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'florence', name: 'Φλωρεντία', emoji: '🎨',
            hasJSON: false, distance: 2.3, weather: 'Ζεστό', cost: 'Μέτριο',
            country: 'Ιταλία', vacationType: 'Πολιτισμός',
            themeParks: [], familyScore: 4, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'munich', name: 'Μόναχο', emoji: '🍺',
            hasJSON: false, distance: 2.2, weather: 'Κρύο', cost: 'Μέτριο',
            country: 'Γερμανία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: true // ✅ Στη λίστα σου
        },
        { 
            id: 'venice', name: 'Βενετία', emoji: '🛶',
            hasJSON: false, distance: 2.0, weather: 'Ζεστό', cost: 'Ακριβό',
            country: 'Ιταλία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 4, hasDisney: false,
            strollerFriendly: false
        },
        { 
            id: 'warsaw', name: 'Βαρσοβία', emoji: '🦅',
            hasJSON: false, distance: 2.5, weather: 'Κρύο', cost: 'Οικονομικό',
            country: 'Πολωνία', vacationType: 'Πόλη',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: true // ✅ Στη λίστα σου
        },
        { 
            id: 'krakow', name: 'Κρακοβία', emoji: '🐉',
            hasJSON: false, distance: 2.0, weather: 'Κρύο', cost: 'Οικονομικό',
            country: 'Πολωνία', vacationType: 'Πολιτισμός',
            themeParks: ['has-parks'], familyScore: 8, hasDisney: false,
            strollerFriendly: false // Όχι στη λίστα
        },
        { 
            id: 'zurich', name: 'Ζυρίχη', emoji: '🏔️',
            hasJSON: false, distance: 2.5, weather: 'Κρύο', cost: 'Ακριβό',
            country: 'Ελβετία', vacationType: 'Βουνό',
            themeParks: [], familyScore: 5, hasDisney: false,
            strollerFriendly: true // ✅ Στη λίστα σου
        }
    ];
    
    // 🎯 ΛΟΓΙΚΗ ΦΙΛΤΡΑΡΙΣΜΑΤΟΥ (Ελέγχουμε ΚΑΙ το νέο φίλτρο)
    const filteredCities = allCities.filter(city => {
        // 1. Φίλτρο απόστασης
        if (distance && city.distance > parseFloat(distance)) {
            return false;
        }
        
        // 2. Φίλτρο καιρού
        if (weather && city.weather !== weather) {
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
    
    // 🔧 ΕΜΦΑΝΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ (ΠΑΡΑΜΕΝΕΙ ΙΔΙΟ)
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
                                <i class="fas fa-cloud"></i> Καιρός
                            </div>
                            <div class="info-value">${city.weather}</div>
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
                          city.themeParks.includes('has-parks') ? '🎡 Με θεματικό πάρκο' : '🏙️ Χωρίς μεγάλο πάρκο'}
                    </div>
                    
                    <div class="destination-status">
                        <div class="status-badge ${city.hasJSON ? 'success' : 'warning'}">
                            ${city.hasJSON ? '✅ Πλήρης Υποστήριξη' : '🛠️ Περιορισμένη'}
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
    
    // 🛠️ ΔΙΟΡΘΩΣΗ: Χρησιμοποίησε τα ΣΩΣΤΑ IDs που υπάρχουν τώρα στο HTML
    document.getElementById('distance').value = '';
    document.getElementById('weather').value = '';
    document.getElementById('vacation-type').value = '';
    document.getElementById('cost-level').value = '';
    document.getElementById('theme-parks').value = '';
    document.getElementById('travel-budget').value = '';
    document.getElementById('budget-currency').value = 'EUR';
    // 🆕 ΝΕΟ ΦΙΛΤΡΟ (αντί για το παλιό travel-type):
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
    document.getElementById('vacation-type').value = 'Πόλη';
    filterDestinations();
}

function showBudgetDestinations() {
    document.getElementById('cost-level').value = 'Οικονομικό';
    document.getElementById('distance').value = '2.5';
    filterDestinations();
}

function showFamilyDestinations() {
    console.log('👨‍👩‍👧‍👦 Φιλτράρισμα για οικογένειες');
    
    // ΔΕΝ υπάρχει πια travel-type, οπότε βάζουμε μόνο τα σχετικά φίλτρα
    document.getElementById('theme-parks').value = 'has-parks';
    document.getElementById('cost-level').value = 'Μέτριο';
    document.getElementById('vacation-type').value = 'Πόλη';
    
    // Αμέσως αναζήτηση
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
    
    // Σημαντικό: Χρησιμοποιώ το affiliate link που μου έδωσες.
    // Βασικό URL με tracking.
    // Βάζω τα απαραίτητα parameters της Expedia πρώτα[citation:1].
    let expediaBaseUrl = `https://www.anrdoezrs.net/click-101567630-14574920?url=https%3A%2F%2Fwww.expedia.co.uk%2FHotel-Search%3F`;
    
    // Προσθήκη βασικών παραμέτρων όπως στο link σου[citation:1].
    expediaBaseUrl += `locale=el_GR&currency=EUR`;
    
    // Προσθήκη των στοιχείων αναζήτησης
    expediaBaseUrl += `&destination=${encodeURIComponent(destination)}`;
    
    // Μετατροπή ημερομηνιών από YYYY-MM-DD σε μορφή για URL.
    // Η Expedia χρησιμοποιεί YYYY-MM-DD στα παραδείγματά της[citation:1].
    expediaBaseUrl += `&startDate=${checkin}`;
    expediaBaseUrl += `&endDate=${checkout}`;
    expediaBaseUrl += `&adults=${adults}`;
    
    // Προσθήκη παιδιών και δωματίων.
    if (children > 0) {
        expediaBaseUrl += `&children=${children}`;
        // Προσοχή: Για ακριβή τιμές χρειάζεται και ηλικίες παιδιών (childAge1=).
        // Τώρα απλά βάζουμε τον αριθμό.
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
            state.currentCityActivities.forEach((activity) => {
                // Υπολόγισε το κόστος για την οικογένεια
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
            price = activity.prices[age] === 0 ? 'ΔΩΡΕΑΝ' : activity.prices[age] + '€';
        }
        // Για ενήλικες, χρησιμοποίησε 'adult' αν υπάρχει
        else if (age >= 16 && activity.prices.adult !== undefined) {
            price = activity.prices.adult + '€';
        }
        // Για παιδιά 5-15, ψάξε για κοινές ηλικίες
        else if (age >= 5 && age <= 15) {
            if (activity.prices['10'] !== undefined) {
                price = activity.prices['10'] + '€';
            } else if (activity.prices['5'] !== undefined) {
                price = activity.prices['5'] + '€';
            }
        }
        // Για βρέφη 0-4, χρησιμοποίησε '0'
        else if (age <= 4 && activity.prices['0'] !== undefined) {
            price = activity.prices['0'] === 0 ? 'ΔΩΡΕΑΝ' : activity.prices['0'] + '€';
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
                            <i class="fas fa-users"></i> ${familyCost}€ για ${state.familyMembers.length} άτομα
                        </div>
                    </div>
                `;
            });
        }
        
        activitiesList.innerHTML = html;
        
        // Ενημέρωση συνολικού κόστους
        updateActivitiesTotal();
        
        console.log('✅ Δραστηριότητες εμφανίστηκαν επιτυχώς');
        
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
    
    let total = 0;
    
    state.familyMembers.forEach((member) => {
        const age = member.age;
        let price = 0;
        
        // 1. Προσπάθεια: Βρες ακριβή τιμή για συγκεκριμένη ηλικία
        if (prices[age] !== undefined && prices[age] !== null) {
            price = prices[age];
        }
        // 2. Προσπάθεια: Για ενήλικες, χρησιμοποίησε 'adult'
        else if (age >= 18 && prices.adult !== undefined) {
            price = prices.adult;
        }
        // 3. Προσπάθεια: Για παιδιά, χρησιμοποίησε 'child' ή ψάξε για 10, 5
        else if (age >= 5 && age <= 17) {
            if (prices.child !== undefined) {
                price = prices.child;
            } else if (prices['10'] !== undefined) {
                price = prices['10'];
            } else if (prices['5'] !== undefined) {
                price = prices['5'];
            }
        }
        // 4. Προσπάθεια: Για βρέφη, χρησιμοποίησε '0'
        else if (age <= 4 && prices['0'] !== undefined) {
            price = prices['0'];
        }
        // 5. Fallback: Αν δεν βρέθηκε, δείξε ? αλλά χρησιμοποίησε 0
        else {
            price = 0;
            console.warn(`⚠️ Δεν βρέθηκε τιμή για ηλικία ${age}. Στο JSON υπάρχουν: ${Object.keys(prices).join(', ')}`);
        }
        
        total += price;
    });
    
    console.log(`💰 Συνολικό κόστος: ${total}€ για ${state.familyMembers.length} άτομα`);
    return total;
}
function toggleActivitySelection(activityId) {
    console.log(`🎫 Toggle activity: ${activityId}`);
    
    // Βρες την πλήρη δραστηριότητα
    const activity = state.currentCityActivities.find(a => a.id === activityId);
    
    if (!activity) {
        console.error('❌ Δραστηριότητα δεν βρέθηκε:', activityId);
        return;
    }
    
    // Έλεγχος αν είναι ήδη επιλεγμένη
    const existingIndex = state.selectedActivities.findIndex(a => a.id === activityId);
    
    if (existingIndex > -1) {
        // Αφαίρεση
        state.selectedActivities.splice(existingIndex, 1);
        console.log(`➖ Αφαίρεση: ${activity.name}`);
    } else {
        // Προσθήκη
        const familyCost = calculateFamilyCost(activity.prices);
        
        state.selectedActivities.push({
            id: activityId,
            name: activity.name,
            price: familyCost,
            duration: activity.duration_hours,
            category: activity.category
        });
        console.log(`➕ Προσθήκη: ${activity.name} - ${familyCost}€`);
    }
    
    // Ενημέρωση UI
    const activityCard = document.querySelector(`.activity-card[data-activity-id="${activityId}"]`);
    if (activityCard) {
        const isNowSelected = state.selectedActivities.some(a => a.id === activityId);
        activityCard.classList.toggle('selected', isNowSelected);
        
        const star = activityCard.querySelector('.activity-star');
        if (star) {
            star.textContent = isNowSelected ? '⭐' : '☆';
        }
    }
    
    // Ενημέρωση κόστους και αποθήκευση
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

function setupSummaryStep() {
    console.log('📋 Ρύθμιση summary βήματος');
    
    if (!state.selectedDestination) {
        console.log('⚠️ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    // Ενημέρωση ημερών αν δεν υπάρχουν
    if (state.selectedDays === 0) {
        state.selectedDays = 3; // Προεπιλογή
    }
    
    // Προσθήκη event listener για το dropdown των ημερών
    setTimeout(() => {
        const daysSelect = document.getElementById('program-days');
        if (daysSelect) {
            daysSelect.value = state.selectedDays;
            
            // Αφαίρεση παλιών event listeners (αν υπάρχουν)
            const newDaysSelect = daysSelect.cloneNode(true);
            daysSelect.parentNode.replaceChild(newDaysSelect, daysSelect);
            
            // Προσθήκη νέου event listener
            newDaysSelect.addEventListener('change', function() {
                const selectedDays = parseInt(this.value);
                if (selectedDays > 0) {
                    state.selectedDays = selectedDays;
                    
                    // Ενημέρωση εμφάνισης
                    const daysDisplay = document.getElementById('days-display');
                    if (daysDisplay) {
                        daysDisplay.textContent = '✅ ' + selectedDays + ' μέρες επιλέχθηκαν';
                        daysDisplay.style.color = 'var(--success)';
                    }
                    
                    // ΔΗΜΙΟΥΡΓΙΑ ΝΕΟΥ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ
                    createGeographicProgram();
                    
                    // Αποθήκευση
                    saveState();
                    
                    console.log(`📅 Ενημέρωση προγράμματος για ${selectedDays} μέρες`);
                }
            });
        }
        
        // Ενημέρωση εμφάνισης ημερών
        const daysDisplay = document.getElementById('days-display');
        if (daysDisplay) {
            daysDisplay.textContent = state.selectedDays > 0 
                ? '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν'
                : '⚠️ Δεν έχετε επιλέξει ακόμα';
            daysDisplay.style.color = state.selectedDays > 0 ? 'var(--success)' : 'var(--warning)';
        }
        
        // ΔΗΜΙΟΥΡΓΙΑ ΤΟΥ ΠΡΩΤΟΥ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ
        createGeographicProgram();
        
    }, 100); // Μικρή καθυστέρηση για να φορτωθεί το HTML
}

function createDailyProgram() {
    const dailyProgram = document.getElementById('daily-program');
    if (!dailyProgram) return;
    
    const days = state.selectedDays || 3;
    const totalActivities = state.selectedActivities.length;
    
    // Υπολογισμός δραστηριοτήτων ανά μέρα
    const activitiesPerDay = Math.max(1, Math.ceil(totalActivities / days));
    
    let html = '';
    
    for (let day = 1; day <= days; day++) {
        // Βρες ποιες δραστηριότητες πάνε σε αυτή τη μέρα
        const startIndex = (day - 1) * activitiesPerDay;
        const endIndex = Math.min(startIndex + activitiesPerDay, totalActivities);
        const dailyActivities = state.selectedActivities.slice(startIndex, endIndex);
        
        html += `
            <div class="day-program" style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 10px; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <h4 style="color: var(--primary); margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid var(--primary-light);">
                    <i class="fas fa-calendar-day"></i> Μέρα ${day}
                </h4>
                
                <!-- ΠΡΩΙ -->
                <div style="margin-bottom: 15px; padding: 12px; background: #f0f9ff; border-radius: 8px;">
                    <h5 style="color: #0366d6; margin-bottom: 8px;">
                        <i class="fas fa-sun"></i> Πρωί (9:00 - 12:00)
                    </h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Πρωινό στο ξενοδοχείο</li>
                        ${dailyActivities[0] ? `<li><strong>${dailyActivities[0].name}</strong> (${dailyActivities[0].price}€)</li>` : '<li>Ελεύθερος χρόνος / Ανακαλύψτε την πόλη</li>'}
                    </ul>
                </div>
                
                <!-- ΜΕΣΗΜΕΡΙ -->
                <div style="margin-bottom: 15px; padding: 12px; background: #fff8e1; border-radius: 8px;">
                    <h5 style="color: #ff9800; margin-bottom: 8px;">
                        <i class="fas fa-utensils"></i> Μεσημέρι (13:00 - 15:00)
                    </h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Γεύμα σε τοπικό εστιατόριο</li>
                        ${dailyActivities[1] ? `<li><strong>${dailyActivities[1].name}</strong> (${dailyActivities[1].price}€)</li>` : '<li>Ανάπαυση / Ξεκούραση</li>'}
                    </ul>
                </div>
                
                <!-- ΑΠΟΓΕΥΜΑ -->
                <div style="margin-bottom: 15px; padding: 12px; background: #f3e5f5; border-radius: 8px;">
                    <h5 style="color: #9c27b0; margin-bottom: 8px;">
                        <i class="fas fa-walking"></i> Απόγευμα (16:00 - 19:00)
                    </h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${dailyActivities[2] ? `<li><strong>${dailyActivities[2].name}</strong> (${dailyActivities[2].price}€)</li>` : '<li>Περιπάτωση / Shopping</li>'}
                        <li>Καφές ή ποτό σε τοπική καφετέρια</li>
                    </ul>
                </div>
                
                <!-- ΒΡΑΔΥ -->
                <div style="padding: 12px; background: #e8f5e9; border-radius: 8px;">
                    <h5 style="color: #4caf50; margin-bottom: 8px;">
                        <i class="fas fa-moon"></i> Βράδυ (20:00+)
                    </h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        <li>Δείπνο σε τοπικό εστιατόριο</li>
                        ${dailyActivities[3] ? `<li><strong>${dailyActivities[3].name}</strong> (${dailyActivities[3].price}€)</li>` : '<li>Βραδινή βόλτα / Διασκέδαση</li>'}
                    </ul>
                </div>
                
                <!-- ΣΥΝΟΛΟ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ ΓΙΑ ΑΥΤΗ ΤΗ ΜΕΡΑ -->
                ${dailyActivities.length > 0 ? `
                <div style="margin-top: 15px; padding: 10px; background: var(--primary-light); border-radius: 6px; color: white; font-weight: bold; text-align: center;">
                    <i class="fas fa-star"></i> ${dailyActivities.length} δραστηριότητες σήμερα
                </div>
                ` : ''}
            </div>
        `;
    }
    
    // Αν δεν υπάρχουν δραστηριότητες
    if (totalActivities === 0) {
        html = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-calendar-alt fa-3x" style="margin-bottom: 20px; opacity: 0.5;"></i>
                <h4>Δεν υπάρχουν επιλεγμένες δραστηριότητες</h4>
                <p>Επιστρέψτε στο βήμα "Δραστηριότητες" για να επιλέξετε</p>
                <button onclick="showStep('activities')" class="btn btn-primary" style="margin-top: 15px;">
                    <i class="fas fa-arrow-left"></i> Επιστροφή στις Δραστηριότητες
                </button>
            </div>
        `;
    }
    
    dailyProgram.innerHTML = html;
}

// ==================== MAP FUNCTIONS ====================
function setupMapStep() {
    console.log('🗺️ Ρύθμιση χάρτη για:', state.selectedDestination);
    
    if (!state.selectedDestination) return;
    
    setTimeout(() => {
        initializeMap();
    }, 300);
}

function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    if (window.travelMap) window.travelMap.remove();
    
    try {
        if (typeof L === 'undefined') {
            throw new Error('Leaflet not loaded');
        }
        
        // ΑΛΛΑΓΗ: Παίρνουμε συντεταγμένες της πόλης
        const cityCoords = getCityCoordinates(state.selectedDestinationId);
        
        if (!cityCoords) {
            throw new Error(`Δεν βρέθηκαν συντεταγμένες για ${state.selectedDestination}`);
        }
        
        window.travelMap = L.map('map').setView(cityCoords, 13);   
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(window.travelMap)
        
        L.marker(cityCoords) 
            .addTo(window.travelMap)
            .bindPopup(`<b>${state.selectedDestination}</b>`)
            .openPopup();
            
        console.log('✅ Χάρτης δημιουργήθηκε');
        setupClickToConnect();
        
    } catch (error) {
        mapElement.innerHTML = `
            <div style="height:100%; display:flex; align-items:center; justify-content:center; background:#f8f9fa; color:#666; text-align:center;">
                <div>
                    <i class="fas fa-exclamation-triangle" style="font-size:48px; margin-bottom:20px; color:#dc3545;"></i>
                    <h4>Σφάλμα φόρτωσης χάρτη</h4>
                    <p>${error.message}</p>
                    <button onclick="reloadMap()" class="btn btn-primary" style="margin-top:20px;">
                        <i class="fas fa-sync-alt"></i> Δοκιμάστε ξανά
                    </button>
                </div>
            </div>
        `;
    }
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
const center = window.travelMap.getCenter();        L.marker(center)
            .addTo(travelMap)
            .bindPopup(`<b>${pointName}</b>`)
            .openPopup();
    }
}
function showActivityMap() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    console.log('📍 Προσθήκη πινέζων για τις επιλεγμένες δραστηριότητες');
    
    // 1. Διαγραφή υπαρχουσων πινεζων
    window.travelMap.eachLayer(function(layer) {
        if (layer && layer.options && layer.options.icon) {
            window.travelMap.removeLayer(layer);
        }
    });
    
    // 2. Προσθήκη της κύριας πινέζας για την πόλη
    const cityCoords = getCityCoordinates(state.selectedDestinationId);
    if (cityCoords) {
        L.marker(cityCoords)
            .addTo(window.travelMap)
            .bindPopup(`<b>${state.selectedDestination}</b><br>Κύκλος πόλης`)
            .openPopup();
    }
    
    // 3. Προσθήκη πινέζων για τις επιλεγμένες δραστηριότητες
    if (state.selectedActivities.length === 0) {
        alert('Δεν έχετε επιλέξει καμία δραστηριότητα ακόμα');
        return;
    }
    
    let activityCount = 0;
    state.selectedActivities.forEach(activity => {
        // Βρες τις πλήρεις πληροφορίες για την δραστηριότητα
        const fullActivity = state.currentCityActivities.find(a => a.id === activity.id);
        
        if (fullActivity && fullActivity.location) {
            // Χρησιμοποιούμε location.lat και location.lng
            const coords = [fullActivity.location.lat, fullActivity.location.lng];
            
            // ΜΟΝΟ ΑΥΤΗ Η ΓΡΑΜΜΗ - clickable markers
            const marker = addClickableMarker(
                coords, 
                fullActivity.name, 
                fullActivity.id
            );
            
            activityCount++;
        } else {
            console.log('⚠️ Δραστηριότητα χωρίς location:', fullActivity?.name);
        }
    });
    
    if (activityCount > 0) {
        alert(`✅ Προστέθηκαν ${activityCount} πινέζες στον χάρτη\n\n🎯 Κάντε κλικ σε μια πινέζα για να επιλέξετε ως "ΑΠΟ"\n🎯 Μετά κάντε κλικ σε άλλη για "ΠΡΟΣ"\n🎯 Θα ενωθούν αυτόματα!`);
    } else {
        alert('ℹ️ Οι επιλεγμένες δραστηριότητες δεν έχουν συντεταγμένες');
    }
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
    
    // ΑΝΤΙ για προεπιλογή, επιστρέφουμε null αν δεν βρεθεί
    if (!coordinates[cityId]) {
        console.error(`❌ Δεν βρέθηκαν συντεταγμένες για πόλη: ${cityId}`);
        return null; // ή επιστροφή κενού πίνακα []
    }
    
    return coordinates[cityId];
}

// Κάντε τη συνάρτηση διαθέσιμη globally
window.getCityCoordinates = getCityCoordinates;

function showRouteBetweenPoints() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    alert('🛣️ Διαδρομή μεταξύ σημείων');
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
        'madrid': [40.4168, -3.7038],
        'lisbon': [38.7223, -9.1393],
        'istanbul': [41.0082, 28.9784]
    };
    
    return coordinates[cityId] || [52.3702, 4.8952]; // Προεπιλογή: Άμστερνταμ
}

// ΠΡΟΣΘΗΚΗ: Κάντε τη συνάρτηση διαθέσιμη globally
window.getCityCoordinates = getCityCoordinates;

function showRouteBetweenPoints() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    alert('🛣️ Διαδρομή μεταξύ σημείων');
}
// ==================== HELPER FUNCTIONS ====================
function updateActivitiesCost() {
    const totalCost = calculateTotalSpent();
    
    // Ενημέρωση στον πίνακα δραστηριοτήτων
    const activitiesTotalEl = document.getElementById('activities-total');
    if (activitiesTotalEl) {
        activitiesTotalEl.textContent = totalCost + '€';
    }
    
    // Ενημέρωση στο summary (αν υπάρχει)
    const summaryTotalEl = document.getElementById('summary-activities-total');
    if (!summaryTotalEl) {
        // Δημιούργησε ένα στοιχείο αν δεν υπάρχει
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

// ==================== FAMILY FUNCTIONS ====================
function updateFamilyMemberName(index, name) {
    state.familyMembers[index].name = name;
}

function updateFamilyMemberAge(index, age) {
    state.familyMembers[index].age = parseInt(age) || 0;
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
    if (state.familyMembers.length > 2) {
        state.familyMembers.splice(index, 1);
        showStep('activities');
    }
}

function updateFamilyMembers() {
    saveState();
    alert('✅ Τα μέλη της οικογένειας ενημερώθηκαν!');
}

function calculateSmartCombos() {
    alert('ℹ️ Η λειτουργία "Έξυπνο Combo" θα είναι διαθέσιμη σύντομα!');
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
                    <option value="berlin">Βερολίνο (Γερμανία)</option>
                    <option value="budapest">Βουδαπέστη (Ουγγαρία)</option>
                    <option value="istanbul">Κωνσταντινούπολη (Τουρκία)</option>
                    <option value="lisbon">Λισαβόνα (Πορτογαλία)</option>
                    <option value="london">Λονδίνο (ΗΒ)</option>
                    <option value="madrid">Μαδρίτη (Ισπανία)</option>
                    <option value="paris">Παρίσι (Γαλλία)</option>
                    <option value="prague">Πράγα (Τσεχία)</option>
                    <option value="vienna">Βιέννη (Αυστρία)</option>
                </optgroup>
                <optgroup label="🛠️ Σύντομα Διαθέσιμες">
                    <option value="rome">Ρώμη (Ιταλία)</option>
                    <option value="barcelona">Βαρκελώνη (Ισπανία)</option>
                    <option value="brussels">Βρυξέλλες (Βέλγιο)</option>
                    <option value="copenhagen">Κοπεγχάγη (Δανία)</option>
                    <option value="dublin">Δουβλίνο (Ιρλανδία)</option>
                    <option value="edinburgh">Εδιμβούργο (Σκωτία)</option>
                    <option value="florence">Φλωρεντία (Ιταλία)</option>
                    <option value="munich">Μόναχο (Γερμανία)</option>
                    <option value="venice">Βενετία (Ιταλία)</option>
                    <option value="warsaw">Βαρσοβία (Πολωνία)</option>
                    <option value="krakow">Κρακοβία (Πολωνία)</option>
                    <option value="zurich">Ζυρίχη (Ελβετία)</option>
                </optgroup>
            </select>
            <small style="display: block; margin-top: 6px; color: #666; font-size: 13px;">
                Μόνο πόλεις από την λίστα μας. ✅ = πλήρης υποστήριξη, 🛠️ = σύντομα
            </small>
        </div>
        
        <div class="form-group" style="margin-bottom: 20px;">
            <label class="form-label" style="display: block; margin-bottom: 8px; color: #1A202C; font-weight: 500;">
                Διάρκεια Ταξιδιού (μέρες)
            </label>
            <input type="number" class="form-control" id="manual-days" min="1" max="30" value="5"
                   style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
        </div>
        
        <div class="form-group" style="margin-bottom: 25px;">
            <label class="form-label" style="display: block; margin-bottom: 8px; color: #1A202C; font-weight: 500;">
                Προϋπολογισμός (προαιρετικό)
            </label>
            <input type="number" class="form-control" id="manual-budget" placeholder="π.χ. 1500"
                   style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px;">
            <small style="display: block; margin-top: 6px; color: #666; font-size: 13px;">
                Συνολικό ποσό για το ταξίδι
            </small>
        </div>
        
        <div id="city-info-container" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #4F46E5;">
            <h4 style="color: #4F46E5; margin: 0 0 10px 0; font-size: 16px;">
                <i class="fas fa-info-circle" style="margin-right: 8px;"></i>
                Πληροφορίες:
            </h4>
            <p style="color: #666; font-size: 14px; margin: 0;">
                <span id="selected-city-info">Επιλέξτε πόλη για πληροφορίες</span>
            </p>
            <div id="city-details" style="font-size: 13px; color: #666; margin-top: 8px;"></div>
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
    
    const citySelect = dropdownContainer.querySelector('#manual-city-select');
    citySelect.addEventListener('change', function() {
        updateCityInfo(this.value, this.options[this.selectedIndex].text);
    });
    
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

function updateCityInfo(cityId, cityName) {
    // Helper function για πληροφορίες πόλης
    const infoDiv = document.getElementById('city-details');
    if (infoDiv) {
        infoDiv.innerHTML = `<p>Πληροφορίες για: ${cityName}</p>`;
    }
}

function showSelectedDestination() {
    console.log('📍 Επιλεγμένος προορισμός:', state.selectedDestination);
}
// ==================== GEOGRAPHIC PLANNING HELPERS ====================

// ΒΟΗΘΗΤΙΚΗ: ΥΠΟΛΟΓΙΣΜΟΣ ΑΠΟΣΤΑΣΗΣ ΜΕΤΑΞΥ ΣΗΜΕΙΩΝ (σε km)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Ακτίνα Γης σε km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ΒΟΗΘΗΤΙΚΗ: ΜΕΤΑΦΡΑΣΗ ΚΑΤΗΓΟΡΙΑΣ
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

// ΒΟΗΘΗΤΙΚΗ: ΕΜΦΑΝΙΣΗ ΕΙΚΟΝΙΔΙΟΥ ΒΑΣΕΙ ΚΑΤΗΓΟΡΙΑΣ
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

// ΒΟΗΘΗΤΙΚΗ: ΔΗΜΙΟΥΡΓΙΑ ΦΩΤΕΙΝΟΥ ΧΡΩΜΑΤΟΣ
function lightenColor(hex, percent) {
    // Απλοποιημένη για CSS rgba
    return `rgba(${parseInt(hex.slice(1,3), 16)}, ${parseInt(hex.slice(3,5), 16)}, ${parseInt(hex.slice(5,7), 16)}, 0.1)`;
}
// ==================== GEOGRAPHIC PROGRAM PLANNER ====================

function createGeographicProgram() {
    console.log('🗺️ Δημιουργία γεωγραφικού προγράμματος...');
    
    const dailyProgram = document.getElementById('daily-program');
    if (!dailyProgram) {
        console.error('❌ Δεν βρέθηκε daily-program element');
        return;
    }
    
    const days = state.selectedDays || 3;
    const totalActivities = state.selectedActivities.length;
    
    // ΕΛΕΓΧΟΣ: Αν δεν υπάρχουν δραστηριότητες
    if (totalActivities === 0) {
        dailyProgram.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-calendar-alt fa-3x" style="margin-bottom: 20px; opacity: 0.5;"></i>
                <h4>Δεν υπάρχουν επιλεγμένες δραστηριότητες</h4>
                <p>Επιστρέψτε στο βήμα "Δραστηριότητες" για να επιλέξετε</p>
                <button onclick="showStep('activities')" class="btn btn-primary" style="margin-top: 15px;">
                    <i class="fas fa-arrow-left"></i> Επιστροφή στις Δραστηριότητες
                </button>
            </div>
        `;
        return;
    }
    
    // ΒΗΜΑ 1: ΣΥΛΛΕΓΟΥΜΕ ΟΛΕΣ ΤΙΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ ΜΕ ΣΥΝΤΕΤΑΓΜΕΝΕΣ
    const activitiesWithCoords = [];
    
    state.selectedActivities.forEach(selectedAct => {
        // Βρες τις πλήρεις πληροφορίες από το JSON
        const fullActivity = state.currentCityActivities.find(
            a => a.id === selectedAct.id
        );
        
        if (fullActivity && fullActivity.location) {
            activitiesWithCoords.push({
                id: selectedAct.id,
                name: selectedAct.name,
                price: selectedAct.price || 0,
                lat: fullActivity.location.lat,
                lng: fullActivity.location.lng,
                category: fullActivity.category,
                duration: fullActivity.duration_hours || 2
            });
        } else {
            // Αν δεν έχει συντεταγμένες, προσθέτουμε με προεπιλογή (κέντρο πόλης)
            const cityCoords = getCityCoordinates(state.selectedDestinationId) || [52.3702, 4.8952];
            activitiesWithCoords.push({
                id: selectedAct.id,
                name: selectedAct.name,
                price: selectedAct.price || 0,
                lat: cityCoords[0],
                lng: cityCoords[1],
                category: selectedAct.category || 'attraction',
                duration: 2
            });
        }
    });
    
    console.log(`📍 Βρέθηκαν ${activitiesWithCoords.length} δραστηριότητες με συντεταγμένες`);
    
    // ΒΗΜΑ 2: ΟΜΑΔΟΠΟΙΗΣΗ ΜΕ ΒΑΣΗ ΤΗΝ ΕΓΓΥΤΗΤΑ
    const dayGroups = groupActivitiesByProximity(activitiesWithCoords, days);
    
    // ΒΗΜΑ 3: ΔΗΜΙΟΥΡΓΙΑ ΗΜΕΡΗΣΙΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ ΓΙΑ ΚΑΘΕ ΟΜΑΔΑ
    let html = '';
    
    dayGroups.forEach((dayActivities, dayIndex) => {
        if (dayActivities.length === 0) return;
        
        html += createDayProgramHTML(dayActivities, dayIndex + 1);
    });
    
    // Αν δεν δημιουργήθηκαν ομάδες (λάθος)
    if (html === '') {
        html = `
            <div style="text-align: center; padding: 40px; color: var(--gray);">
                <i class="fas fa-exclamation-triangle fa-3x" style="margin-bottom: 20px; color: var(--warning);"></i>
                <h4>Δεν μπορεί να δημιουργηθεί πρόγραμμα</h4>
                <p>Προσθέστε περισσότερες δραστηριότητες ή αλλάξτε τον αριθμό ημερών</p>
            </div>
        `;
    }
    
    dailyProgram.innerHTML = html;
    console.log('✅ Γεωγραφικό πρόγραμμα δημιουργήθηκε');
}

// ΒΟΗΘΗΤΙΚΗ: ΟΜΑΔΟΠΟΙΗΣΗ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ ΜΕ ΒΑΣΗ ΤΗΝ ΕΓΓΥΤΗΤΑ
function groupActivitiesByProximity(activities, days) {
    console.log(`📊 Ομαδοποίηση ${activities.length} δραστηριοτήτων σε ${days} μέρες`);
    
    // Αν είναι λιγότερες οι δραστηριότητες από τις μέρες
    if (activities.length <= days) {
        const groups = [];
        activities.forEach((act, index) => {
            groups[index] = [act];
        });
        // Συμπλήρωσε κενές μέρες
        while (groups.length < days) {
            groups.push([]);
        }
        return groups.slice(0, days);
    }
    
    // ΑΠΛΟΣ ΑΛΓΟΡΙΘΜΟΣ: Ομαδοποίηση με βάση την απόσταση από κέντρο
    const groups = Array(days).fill().map(() => []);
    
    // 1. Βρες το κέντρο της πόλης
    const cityCenter = getCityCoordinates(state.selectedDestinationId) || [52.3702, 4.8952];
    
    // 2. Υπολόγισε απόσταση κάθε δραστηριότητας από το κέντρο
    const activitiesWithDistance = activities.map(act => ({
        ...act,
        distance: calculateDistance(act.lat, act.lng, cityCenter[0], cityCenter[1])
    }));
    
    // 3. Ταξινόμησε κατά απόσταση (κοντινότερες πρώτες)
    activitiesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // 4. Μοίρασε τις δραστηριότητες στις μέρες
    //    Κοντινές μαζί, μακρινές μαζί
    const chunkSize = Math.ceil(activities.length / days);
    
    for (let i = 0; i < days; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, activitiesWithDistance.length);
        groups[i] = activitiesWithDistance.slice(start, end).map(act => ({
            id: act.id,
            name: act.name,
            price: act.price,
            category: act.category,
            duration: act.duration
        }));
    }
    
    console.log('📈 Ομάδες δημιουργήθηκαν:', groups.map(g => g.length));
    return groups;
}

// ΒΟΗΘΗΤΙΚΗ: ΔΗΜΙΟΥΡΓΙΑ HTML ΓΙΑ ΜΙΑ ΜΕΡΑ
function createDayProgramHTML(activities, dayNumber) {
    const dayTotal = activities.reduce((sum, act) => sum + (act.price || 0), 0);
    const totalDuration = activities.reduce((sum, act) => sum + (act.duration || 2), 0);
    
    // Προσδιορισμός κύριας κατηγορίας για τη μέρα
    const categories = activities.map(a => a.category).filter(c => c);
    const mainCategory = categories.length > 0 ? categories[0] : 'attraction';
    
    return `
        <div class="day-program" style="margin-bottom: 30px; padding: 20px; background: white; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <!-- ΗΜΕΡΑ ΚΑΙ ΣΥΝΟΨΗ -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--primary-light);">
                <div>
                    <h3 style="color: var(--primary); margin: 0; display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-calendar-day"></i>
                        Μέρα ${dayNumber}
                        <span style="font-size: 14px; color: var(--gray); font-weight: normal;">
                            (${translateCategory(mainCategory)})
                        </span>
                    </h3>
                    <p style="color: var(--gray); margin: 5px 0 0 0; font-size: 14px;">
                        ${activities.length} δραστηριότητες • ${totalDuration} ώρες • ${dayTotal}€
                    </p>
                </div>
                <div style="background: var(--primary-light); color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold;">
                    Ημέρα ${dayNumber}
                </div>
            </div>
            
            <!-- ΠΡΟΤΕΙΝΟΜΕΝΟ ΠΡΟΓΡΑΜΜΑ -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="color: var(--dark); margin-bottom: 10px; font-size: 16px;">
                    <i class="fas fa-route"></i> Προτεινόμενο Πρόγραμμα
                </h4>
                <div style="font-size: 14px; color: var(--gray);">
                    <p>Όλες οι σημερινές δραστηριότητες είναι σε κοντινή απόσταση μεταξύ τους.</p>
                    <p><strong>Συμβουλή:</strong> Χρησιμοποιήστε τον χάρτη για βέλτιστη διαδρομή.</p>
                </div>
            </div>
            
            <!-- ΛΙΣΤΑ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ -->
            <div style="margin-bottom: 20px;">
                <h4 style="color: var(--dark); margin-bottom: 15px; font-size: 16px;">
                    <i class="fas fa-list-check"></i> Σημερινές Δραστηριότητες
                </h4>
                
                ${activities.map((activity, index) => `
                    <div class="activity-schedule-item" style="
                        display: flex; align-items: center; gap: 15px; 
                        padding: 15px; margin-bottom: 10px; 
                        background: ${index % 2 === 0 ? '#f8f9fa' : 'white'};
                        border-radius: 8px; border-left: 4px solid var(--primary);
                    ">
                        <div style="font-size: 20px; color: var(--primary); min-width: 40px; text-align: center;">
                            ${index + 1}
                        </div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; color: var(--dark); margin-bottom: 5px;">
                                ${activity.name}
                            </div>
                            <div style="display: flex; gap: 15px; font-size: 13px; color: var(--gray);">
                                <span><i class="fas ${getActivityIcon(activity.category)}"></i> ${translateCategory(activity.category)}</span>
                                <span><i class="fas fa-clock"></i> ${activity.duration || 2} ώρες</span>
                                <span><i class="fas fa-euro-sign"></i> ${activity.price || 0}€</span>
                            </div>
                        </div>
                        <div style="font-size: 24px;">
                            ${getTimeEmoji(index)}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- ΣΥΝΟΛΙΚΟ ΚΟΣΤΟΣ -->
            <div style="background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: white; padding: 15px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">
                    ${dayTotal}€
                </div>
                <div style="font-size: 14px; opacity: 0.9;">
                    Συνολικό κόστος για τη μέρα
                </div>
            </div>
        </div>
    `;
}

// ΒΟΗΘΗΤΙΚΗ: ΕΜΟΤΙΚΟΝ ΓΙΑ ΩΡΕΣ
function getTimeEmoji(index) {
    const emojis = ['🌅', '☀️', '⛅', '🌇', '🌙'];
    return emojis[index % emojis.length] || '🕐';
}
// ==================== WINDOW FUNCTIONS ====================
// ΜΟΝΟ ΜΙΑ ΦΟΡΑ ΟΛΕΣ ΟΙ ΕΚΧΩΡΗΣΕΙΣ
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
window.searchExpediaHotels = searchExpediaHotels;  // <-- ΠΡΟΣΘΗΚΗ ΑΥΤΗ
window.setupFlightStep = setupFlightStep;
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
window.createGeographicProgram = createGeographicProgram;
window.groupActivitiesByProximity = groupActivitiesByProximity;    // <-- ΠΡΟΣΘΗΚΗ ΑΥΤΗ
window.calculateDistance = calculateDistance;                     // <-- ΠΡΟΣΘΗΚΗ ΑΥΤΗ  
window.translateCategory = translateCategory;                     // <-- ΠΡΟΣΘΗΚΗ ΑΥΤΗ
// ==================== HELPER FUNCTIONS ====================
// ΒΟΗΘΗΤΙΚΗ ΣΥΝΑΡΤΗΣΗ ΓΙΑ ΕΜΦΑΝΙΣΗ ΤΙΜΩΝ
function getPriceInfo(prices) {
    if (!prices || typeof prices !== 'object') {
        return 'Άγνωστες τιμές';
    }
    
    // Έλεγχος για δωρεάν είσοδο
    if (prices['0'] === 0 && prices['4'] === 0) {
        return 'Βρέφη δωρεάν (0-4)';
    }
    if (prices['0'] === 0 && prices['18'] === 0) {
        return 'Παιδιά δωρεάν (0-18)';
    }
    
    // Βρες όλες τις αριθμητικές τιμές
    const allPrices = Object.values(prices)
        .filter(p => typeof p === 'number' && !isNaN(p));
    
    if (allPrices.length === 0) {
        return 'Άγνωστες τιμές';
    }
    
    // Βρες ελάχιστη και μέγιστη τιμή
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    
    // Εμφάνιση ανάλογα
    if (min === max) {
        return `${min}€ για όλους`;
    } else if (min === 0) {
        return `${max}€ (βρέφη δωρεάν)`;
    } else {
        return `${min}-${max}€`;
    }
}

// ΒΟΗΘΗΤΙΚΗ ΣΥΝΑΡΤΗΣΗ: Βρες τιμή για συγκεκριμένη ηλικία
function getPriceForAge(prices, age) {
    if (!prices) return '?';
    
    // 1. Προσπάθησε να βρεις ακριβή τιμή για την ηλικία
    if (prices[age] !== undefined && prices[age] !== null) {
        return prices[age] + '€';
    }
    
    // 2. Για ενήλικες (18+), ψάξε για 'adult'
    if (age >= 18 && prices.adult !== undefined) {
        return prices.adult + '€';
    }
    
    // 3. Για παιδιά (5-17), ψάξε για 'child' ή κοινές ηλικίες
    if (age >= 5 && age <= 17) {
        if (prices.child !== undefined) return prices.child + '€';
        if (prices['10'] !== undefined) return prices['10'] + '€';
        if (prices['5'] !== undefined) return prices['5'] + '€';
    }
    
    // 4. Για βρέφη (0-4), ψάξε για '0'
    if (age <= 4 && prices['0'] !== undefined) {
        return prices['0'] === 0 ? 'ΔΩΡΕΑΝ' : prices['0'] + '€';
    }
    
    // 5. Fallback: ψάξε για την πλησιέστερη μικρότερη ηλικία
    for (let i = age; i >= 0; i--) {
        if (prices[i] !== undefined) {
            return prices[i] + '€';
        }
    }
    
    // 6. Αν δεν βρέθηκε τίποτα
    return '?';
}
// ==================== CLICK-TO-CONNECT SYSTEM ====================
let firstClickedMarker = null;
let secondClickedMarker = null;
let connectionLine = null;

// Κάθε φορά που φορτώνει ο χάρτης, ρυθμίζουμε το σύστημα
function setupClickToConnect() {
    console.log('🔄 Ρύθμιση click-to-connect system');
    
    // Διαγραφή παλιών listeners
    if (window.travelMap) {
        window.travelMap.off('click');
    }
}

// Συνάρτηση που ενώνει 2 σημεία
function connectTwoPoints(point1, point2, marker1, marker2) {
    console.log('🔗 Σύνδεση σημείων:', point1, point2);
    
    // 1. Διαγραφή παλιάς γραμμής
    if (connectionLine && window.travelMap) {
        window.travelMap.removeLayer(connectionLine);
    }
    
    // 2. Σχεδίαση νέας γραμμής
    connectionLine = L.polyline([point1, point2], {
        color: '#FF0000',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 5',
        lineCap: 'round'
    }).addTo(window.travelMap);
    
    // 3. Ενημέρωση popups
    if (marker1 && marker1.getPopup()) {
        marker1.setPopupContent('📍 Από<br><small>(κλικ για Google Maps)</small>');
    }
    
    if (marker2 && marker2.getPopup()) {
        marker2.setPopupContent('🎯 Προς<br><small>(κλικ για Google Maps)</small>');
    }
    
    // 4. Άνοιγμα Google Maps
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${point1[0]},${point1[1]}&destination=${point2[0]},${point2[1]}&travelmode=walking`;
    
    // 5. Προσθήκη κλικ στα markers για Google Maps
    marker1.on('click', function() {
        window.open(googleMapsUrl, '_blank');
    });
    
    marker2.on('click', function() {
        window.open(googleMapsUrl, '_blank');
    });
    
    alert(`✅ Ενώθηκαν 2 σημεία!\n\nΚάντε κλικ σε οποιαδήποτε πινέζα για Google Maps.\n\n📍 Από → 🎯 Προς`);
}

// Βοηθητική: Προσθήκη marker με δυνατότητα κλικ
function addClickableMarker(coords, title, activityId) {
    if (!window.travelMap) return null;
    
       const marker = L.marker(coords).addTo(window.travelMap);  // <-- ΑΥΤΗ Η ΓΡΑΜΜΗ ΠΡΕΠΕΙ ΝΑ ΥΠΑΡΧΕΙ
    
    marker.bindPopup(`<b>${title}</b><br><small>Κλικ για επιλογή ως ΑΠΟ</small>`);
    
    marker.on('click', function(e) {
        // Αν είναι πρώτο κλικ
        if (!firstClickedMarker) {
            firstClickedMarker = {
                coords: coords,
                marker: marker,
                title: title,
                activityId: activityId
            };
            
            marker.setPopupContent(`<b>${title}</b><br>✅ Επιλέχθηκε ως ΑΠΟ<br><small>Κλικ σε άλλη πινέζα για ΠΡΟΣ</small>`);
            alert(`📍 Επιλέξατε: "${title}" ως σημείο ΑΠΟ\n\nΤώρα κάντε κλικ στο σημείο ΠΡΟΣ`);
            
        } 
        // Αν είναι δεύτερο κλικ (και όχι το ίδιο)
        else if (!secondClickedMarker && firstClickedMarker.activityId !== activityId) {
            secondClickedMarker = {
                coords: coords,
                marker: marker,
                title: title,
                activityId: activityId
            };
            
            marker.setPopupContent(`<b>${title}</b><br>✅ Επιλέχθηκε ως ΠΡΟΣ<br><small>Γραμμή σχεδιάστηκε!</small>`);
            
            // Σύνδεση των δύο σημείων
            connectTwoPoints(
                firstClickedMarker.coords,
                secondClickedMarker.coords,
                firstClickedMarker.marker,
                secondClickedMarker.marker
            );
            
            // Επαναφορά για νέα σύνδεση
            setTimeout(() => {
                firstClickedMarker = null;
                secondClickedMarker = null;
            }, 5000);
            
        } 
        // Αν κάνουμε κλικ στο ίδιο σημείο
        else if (firstClickedMarker && firstClickedMarker.activityId === activityId) {
            alert('⚠️ Έχετε ήδη επιλέξει αυτό το σημείο ως ΑΠΟ\n\nΕπιλέξτε διαφορετική πινέζα για ΠΡΟΣ');
        }
    });
    
    return marker;
}
// ==================== PROGRAM DAYS UPDATE ====================
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
        // 1. Αποθήκευση
        state.selectedDays = selectedDays;
        
        // 2. Ενημέρωση εμφάνισης
        const daysDisplay = document.getElementById('days-display');
        if (daysDisplay) {
            daysDisplay.textContent = '✅ ' + selectedDays + ' μέρες επιλέχθηκαν';
            daysDisplay.style.color = 'var(--success)';
        }
        
        // 3. ΔΗΜΙΟΥΡΓΙΑ ΝΕΟΥ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ
        createGeographicProgram();
        
        // 4. Αποθήκευση
        saveState();
        
        console.log(`📅 Ενημέρωση γεωγραφικού προγράμματος για ${selectedDays} μέρες`);
        
        // 5. Μικρό animation feedback
        const programSection = document.getElementById('daily-program-section');
        if (programSection) {
            programSection.style.animation = 'none';
            setTimeout(() => {
                programSection.style.animation = 'fadeIn 0.5s ease';
            }, 10);
        }
    }  // <-- ΚΛΕΙΣΙΜΟ
}     // <-- ΤΕΛΟΣ ΣΥΝΑΡΤΗΣΗΣ
console.log('✅ Script.js loaded successfully!');
