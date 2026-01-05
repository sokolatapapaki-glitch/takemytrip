// ==================== GLOBAL STATE ====================
const state = {
    selectedDestination: null,
    selectedDestinationId: null,
    selectedDays: 0,
    selectedBudget: 0,
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
    updateBudgetTracker();
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
        state.selectedBudget = data.selectedBudget || 0;
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
    
    document.addEventListener('input', function(e) {
        if (e.target.id === 'travel-budget') {
            state.selectedBudget = parseInt(e.target.value) || 0;
            updateBudgetTracker();
            saveState();
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
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-users"></i> Τύπος Ταξιδιώτη</label>
                    <select class="form-control" id="travel-type">
                        <option value="">Όλοι (προεπιλογή)</option>
                        <option value="Μόνος">Μόνος/η</option>
                        <option value="Ζευγάρι">Ζευγάρι</option>
                        <option value="Οικογένεια" selected>Οικογένεια με παιδιά</option>
                        <option value="Παρέα">Παρέα φίλων</option>
                        <option value="Εκδρομή">Σχολική Εκδρομή</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-plane"></i> Απόσταση πτήσης</label>
                    <select class="form-control" id="distance">
                        <option value="">Όλες οι αποστάσεις</option>
                        <option value="1.5">Έως 1.5 ώρες</option>
                        <option value="2.5">Έως 2.5 ώρες</option>
                        <option value="3.5" selected>Έως 3.5 ώρες</option>
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
                        <option value="Ίδιο" selected>🌤️ Ίδια θερμοκρασία</option>
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
                        <option value="Πόλη" selected>🏙️ Αστικές Εμπειρίες</option>
                        <option value="Βουνό">🏔️ Βουνό & Χιονοδρομικά</option>
                        <option value="Φυσική">🌳 Φυσική Ομορφία</option>
                        <option value="Ψώνια">🛍️ Ψώνια & Gastronomy</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-wallet"></i> Επίπεδο Κόστους</label>
                    <select class="form-control" id="cost-level">
                        <option value="">Όλα τα επίπεδα</option>
                        <option value="Οικονομικό">💰 Οικονομικό</option>
                        <option value="Μέτριο" selected>💰💰 Μέτριο</option>
                        <option value="Ακριβό">💰💰💰 Ακριβό</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-calendar-day"></i> Μέρες Διαμονής</label>
                    <select class="form-control" id="days-stay">
                        <option value="">-- Επιλέξτε --</option>
                        <option value="2">2 μέρες (Σαβ-Κυρ)</option>
                        <option value="3">3 μέρες (Σαβ-Δευ)</option>
                        <option value="4">4 μέρες</option>
                        <option value="5" selected>5 μέρες</option>
                        <option value="7">7 μέρες (Μια εβδομάδα)</option>
                        <option value="10">10+ μέρες</option>
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
                        <option value="multiple">🎢 Με πολλαπλά πάρκα</option>
                        <option value="family-excellent">⭐ Κορυφαία για οικογένειες</option>
                        <option value="no-parks">🏛️ Χωρίς θεματικά πάρκα</option>
                    </select>
                    <small class="text-muted">Ιδανικό για οικογένειες με παιδιά</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-money-bill-wave"></i> Προϋπολογισμός Ταξιδιού</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" class="form-control" id="travel-budget" placeholder="π.χ. 1500" style="flex: 1;">
                        <select class="form-control" id="budget-currency" style="width: 100px;">
                            <option value="EUR">€</option>
                            <option value="USD">$</option>
                            <option value="GBP">£</option>
                        </select>
                    </div>
                    <small class="text-muted">Συνολικό ποσό για το ταξίδι (προαιρετικό)</small>
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
                <div style="text-align: center; padding: 60px 20px; background: var(--light); border-radius: var(--radius-lg); margin-top: 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px; color: var(--primary);">🗺️</div>
                    <h2 style="color: var(--dark); margin-bottom: 15px;">Ανακαλύψτε Προορισμούς</h2>
                    <p style="color: var(--gray); max-width: 600px; margin: 0 auto 30px;">
                        Χρησιμοποιήστε τα φίλτρα παραπάνω για να βρείτε την τέλεια πόλη για το ταξίδι σας.
                        <br>
                        <strong>20+ ευρωπαϊκές πόλεις</strong> διαθέσιμες για εξερεύνηση.
                    </p>
                    
                    <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                        <button class="btn btn-primary" onclick="showPopularDestinations()">
                            <i class="fas fa-fire"></i> Δημοφιλείς Προορισμοί
                        </button>
                        <button class="btn btn-outline" onclick="showBudgetDestinations()">
                            <i class="fas fa-euro-sign"></i> Οικονομικές Επιλογές
                        </button>
                        <button class="btn btn-outline" onclick="showFamilyDestinations()">
                            <i class="fas fa-child"></i> Για Οικογένειες
                        </button>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; border-radius: var(--radius-lg); text-align: center;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 20px; flex-wrap: wrap;">
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: bold;">20+</div>
                        <div style="font-size: 14px; opacity: 0.9;">Ευρωπαϊκές Πόλεις</div>
                    </div>
                    <div style="width: 1px; height: 40px; background: rgba(255,255,255,0.3);"></div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: bold;">10</div>
                        <div style="font-size: 14px; opacity: 0.9;">Πλήρης Υποστήριξη</div>
                    </div>
                    <div style="width: 1px; height: 40px; background: rgba(255,255,255,0.3);"></div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: bold;">8</div>
                        <div style="font-size: 14px; opacity: 0.9;">Με Θεματικά Πάρκα</div>
                    </div>
                    <div style="width: 1px; height: 40px; background: rgba(255,255,255,0.3);"></div>
                    <div style="text-align: center;">
                        <div style="font-size: 32px; font-weight: bold;">1</div>
                        <div style="font-size: 14px; opacity: 0.9;">Με Disneyland</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupDestinationStep() {
    console.log('📍 Ρύθμιση βήματος προορισμού');
    
    if (state.selectedDays > 0) {
        document.getElementById('days-stay').value = state.selectedDays;
    }
    
    if (state.selectedBudget > 0) {
        document.getElementById('travel-budget').value = state.selectedBudget;
    }
    
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
                        <option value="1">1</option>
                        <option value="2" selected>2</option>
                        <option value="3">3</option>
                    </select>
                </div>
            </div>
            
            <div style="text-align: center; margin: 40px 0;">
                <button class="btn btn-primary" onclick="searchHotels()" style="min-width: 300px; padding: 18px;">
                    <i class="fas fa-search"></i> Αναζήτηση Ξενοδοχείων
                </button>
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
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tenDays = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
    
    checkin.min = today.toISOString().split('T')[0];
    checkout.min = today.toISOString().split('T')[0];
    
    checkin.value = nextWeek.toISOString().split('T')[0];
    checkout.value = tenDays.toISOString().split('T')[0];
    
    checkin.addEventListener('change', function() {
        const checkinDate = new Date(this.value);
        const newCheckout = new Date(checkinDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        checkout.value = newCheckout.toISOString().split('T')[0];
        checkout.min = this.value;
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
    updateBudgetTracker();
    
    closeManualDestinationModal();
    
    alert(`✅ Επιλέξατε: ${cityName}\n\nΤώρα μπορείτε να συνεχίσετε στις πτήσεις.`);
    
    saveState();
    
    setTimeout(() => {
        showStep('flight');
    }, 1000);
}

// ==================== FILTER DESTINATIONS ====================
async function filterDestinations() {
    console.log('🔍 Εκκίνηση αναζήτησης προορισμών...');
    
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
    
    const cities = [
        { 
            id: 'paris', name: 'Παρίσι', emoji: '🗼', 
            hasJSON: true, distance: 3.0, weather: 'Ίδιο', cost: 'Ακριβό',
            country: 'Γαλλία', vacationType: 'Πολιτισμός'
        },
        { 
            id: 'amsterdam', name: 'Άμστερνταμ', emoji: '🌷',
            hasJSON: true, distance: 3.5, weather: 'Ζεστό', cost: 'Μέτριο',
            country: 'Ολλανδία', vacationType: 'Πόλη'
        },
        { 
            id: 'berlin', name: 'Βερολίνο', emoji: '🇩🇪',
            hasJSON: true, distance: 2.5, weather: 'Ίδιο', cost: 'Οικονομικό',
            country: 'Γερμανία', vacationType: 'Πόλη'
        },
        { 
            id: 'london', name: 'Λονδίνο', emoji: '🇬🇧',
            hasJSON: true, distance: 3.8, weather: 'Ίδιο', cost: 'Ακριβό',
            country: 'ΗΒ', vacationType: 'Πόλη'
        },
        { 
            id: 'prague', name: 'Πράγα', emoji: '🏰',
            hasJSON: true, distance: 2.2, weather: 'Κρύο', cost: 'Οικονομικό',
            country: 'Τσεχία', vacationType: 'Πολιτισμός'
        },
    ];
    
    let html = '';
    
    cities.forEach(city => {
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
                </div>
                
                <button class="destination-btn" onclick="selectDestination('${city.name}', '${city.id}'); event.stopPropagation();">
                    <i class="fas fa-map-marker-alt"></i>
                    Επιλογή Προορισμού
                </button>
            </div>
        `;
    });
    
    resultsDiv.innerHTML = `
        <h2 style="grid-column: 1/-1; margin-bottom: 20px;">🎯 Αποτελέσματα Αναζήτησης</h2>
        <div class="destinations-grid">
            ${html}
        </div>
    `;
    
    console.log('✅ Αναζήτηση ολοκληρώθηκε');
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
    
    document.getElementById('travel-type').value = '';
    document.getElementById('distance').value = '';
    document.getElementById('weather').value = '';
    document.getElementById('vacation-type').value = '';
    document.getElementById('cost-level').value = '';
    document.getElementById('days-stay').value = '';
    document.getElementById('travel-budget').value = '';
    
    const resultsDiv = document.getElementById('destination-results');
    resultsDiv.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--light); border-radius: var(--radius-lg); margin-top: 20px;">
            <div style="font-size: 64px; margin-bottom: 20px; color: var(--primary);">🗺️</div>
            <h2 style="color: var(--dark); margin-bottom: 15px;">Φίλτρα Επαναφέρθηκαν</h2>
            <p style="color: var(--gray);">Χρησιμοποιήστε τα φίλτρα για νέα αναζήτηση</p>
        </div>
    `;
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
    document.getElementById('travel-type').value = 'Οικογένεια';
    document.getElementById('theme-parks').value = 'has-parks';
    document.getElementById('cost-level').value = 'Μέτριο';
    filterDestinations();
}

// ==================== SUPPORTING FUNCTIONS ====================
function searchHotels() {
    const destination = document.getElementById('hotel-destination').value;
    const checkin = document.getElementById('hotel-checkin').value;
    const checkout = document.getElementById('hotel-checkout').value;
    
    if (!destination) {
        alert('⚠️ Παρακαλώ επιλέξτε προορισμό πρώτα');
        return;
    }
    
    const bookingUrl = `https://www.booking.com/searchresults.el.html?ss=${encodeURIComponent(destination)}&checkin=${checkin}&checkout=${checkout}`;
    window.open(bookingUrl, '_blank');
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
    updateBudgetTracker();
}

function setupSummaryStep() {
    if (!state.selectedDestination) return;
    
    createDailyProgram();
}

function createDailyProgram() {
    const dailyProgram = document.getElementById('daily-program');
    const days = state.selectedDays || 3;
    
    let html = '';
    
    for (let i = 1; i <= days; i++) {
        html += `
            <div class="day-program">
                <h4><i class="fas fa-calendar-day"></i> Μέρα ${i}</h4>
                
                <div class="time-slot">
                    <h5>🌅 Πρωί (9:00 - 12:00)</h5>
                    <ul>
                        <li>Πρωινό στο ξενοδοχείο</li>
                        ${state.selectedActivities[i-1] ? `<li>${state.selectedActivities[i-1].name}</li>` : '<li>Ελεύθερος χρόνος</li>'}
                    </ul>
                </div>
            </div>`;
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
        
        const coords = [48.8566, 2.3522];
        
window.travelMap = L.map('map').setView(coords, 13);      
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(window.travelMap)
        
        L.marker(coords)
            .addTo(window.travelMap)
            .bindPopup(`<b>${state.selectedDestination}</b>`)
            .openPopup();
            
        console.log('✅ Χάρτης δημιουργήθηκε');
        
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
            // ΑΛΛΑΓΗ: Χρησιμοποιούμε location.lat και location.lng
            const coords = [fullActivity.location.lat, fullActivity.location.lng];
            const marker = L.marker(coords)
                .addTo(window.travelMap)
                .bindPopup(`
                    <b>${fullActivity.name}</b><br>
                    <small>Κόστος: ${activity.price}€</small><br>
                    <small>Κατηγορία: ${fullActivity.category || 'Γενική'}</small>
                `);
            
            activityCount++;
        } else {
            console.log('⚠️ Δραστηριότητα χωρίς location:', fullActivity?.name);
        }
    });
    
    if (activityCount > 0) {
        alert(`✅ Προστέθηκαν ${activityCount} πινέζες στον χάρτη`);
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
        'madrid': [40.4168, -3.7038],
        'lisbon': [38.7223, -9.1393],
        'istanbul': [41.0082, 28.9784]
    };
    
    return coordinates[cityId] || [52.3702, 4.8952]; // Προεπιλογή: Άμστερνταμ
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
function updateBudgetTracker() {
    const total = state.selectedBudget;
    const spent = calculateTotalSpent();
    
    const totalEl = document.getElementById('budget-total');
    const spentEl = document.getElementById('budget-spent');
    const remainingEl = document.getElementById('budget-remaining');
    const progressEl = document.getElementById('budget-progress-bar');
    
    if (totalEl) totalEl.textContent = total + '€';
    if (spentEl) spentEl.textContent = spent + '€';
    if (remainingEl) remainingEl.textContent = (total - spent) + '€';
    if (progressEl) {
        const progress = total > 0 ? (spent / total * 100) : 0;
        progressEl.style.width = Math.min(progress, 100) + '%';
    }
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
        selectedBudget: state.selectedBudget,
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
window.searchHotels = searchHotels;
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
console.log('✅ Script.js loaded successfully!');
