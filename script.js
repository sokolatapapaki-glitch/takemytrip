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
    initApp();
});

function initApp() {
    console.log('🚀 Αρχικοποίηση εφαρμογής...');
    
    // 1. Φόρτωση αποθηκευμένων δεδομένων
    loadSavedData();
    
    // 2. Ενεργοποίηση steps
    setupStepNavigation();
    
    // 3. Ενεργοποίηση mobile navigation
    setupMobileNavigation();
    
    // 4. Εμφάνιση πρώτου βήματος
    showStep(state.currentStep);
    
    // 5. Event listeners
    setupEventListeners();
    
    // 6. Αρχικοποίηση budget tracker
    updateBudgetTracker();
}

function loadSavedData() {
    const saved = localStorage.getItem('travelPlannerData');
    
    // ΕΛΕΓΧΟΣ: Ρωτάμε τον χρήστη αν θέλει να συνεχίσει
    if (saved && !sessionStorage.getItem('userChoiceMade')) {
        // ΧΡΗΣΗ setTimeout για να μην μπλοκάρει από το browser
        setTimeout(() => {
            const userChoice = confirm(
                'Βρέθηκε προηγούμενο ταξίδι!\n\n' +
                'Κάντε κλικ:\n' +
                '• "OK" για να συνεχίσετε το προηγούμενο ταξίδι\n' +
                '• "Cancel" για να ξεκινήσετε νέο ταξίδι'
            );
            
            sessionStorage.setItem('userChoiceMade', 'true');
            
            if (!userChoice) {
                // Ο χρήστης θέλει ΝΕΟ ταξίδι
                localStorage.removeItem('travelPlannerData');
                localStorage.removeItem('travel_custom_points');
                console.log('🆕 Ξεκινάει νέο ταξίδι');
                return;
            }
            
            // Αν ο χρήστης επιλέξει να συνεχίσει, φόρτωσε τα δεδομένα
            loadSavedDataNow(saved);
            
        }, 1000); // 1 δευτερόλεπτο καθυστέρηση
    } else if (saved) {
        loadSavedDataNow(saved);
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
    
    // ΚΑΘΑΡΙΣΜΟΣ ΠΡΟΗΓΟΥΜΕΝΟΥ ΧΑΡΤΗ (αν υπάρχει)
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
            // ΜΗΝ καλέσεις το setupMapStep() ΑΜΕΣΑ
            // Χρήση setTimeout για να φορτώσει η Leaflet
            setTimeout(() => {
                if (typeof L !== 'undefined') {
                    setupMapStep();
                } else {
                    console.error('❌ Leaflet δεν φορτώθηκε');
                    // Fallback content
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

// ==================== STEP 1: DESTINATION ====================
function getDestinationStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-map-marked-alt"></i> Επιλογή Προορισμού</h1>
            <p class="card-subtitle">Βρείτε την τέλεια πόλη για τις οικογενειακές σας διακοπές</p>
            
            <!-- ΑΝΑΖΗΤΗΣΗ ΚΑΙ ΦΙΛΤΡΑ -->
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
            
            <!-- ΚΟΥΜΠΙΑ ΔΡΑΣΗΣ -->
            <div style="display: flex; gap: 15px; margin-top: 40px; justify-content: center;">
                <button class="btn btn-primary" onclick="filterDestinations()" style="padding: 16px 40px; font-size: 18px;">
                    <i class="fas fa-search"></i> 🔍 Αναζήτηση Προορισμών
                </button>
                
                <button class="btn btn-outline" onclick="showQuickRecommendations()" style="padding: 16px 30px;">
                    <i class="fas fa-bolt"></i> Γρήγορες Προτάσεις
                </button>
                
                <button class="btn btn-outline" onclick="resetFilters()" style="padding: 16px 30px; border-color: var(--danger); color: var(--danger);">
                    <i class="fas fa-redo"></i> Επαναφορά
                </button>
            </div>
            
            <!-- ΒΟΗΘΗΤΙΚΕΣ ΠΛΗΡΟΦΟΡΙΕΣ -->
            <div class="alert alert-info" style="margin-top: 30px; background: #e3f2fd; border-left: 4px solid #2196f3;">
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                    <i class="fas fa-lightbulb" style="font-size: 24px; color: #2196f3; margin-top: 2px;"></i>
                    <div>
                        <h4 style="margin: 0 0 10px 0; color: #0c5460;">💡 Συμβουλές για την αναζήτηση:</h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px;">
                            <div>
                                <strong>👨‍👩‍👧‍👦 Για οικογένειες:</strong>
                                <ul style="margin: 5px 0 0 15px; font-size: 14px;">
                                    <li>Επιλέξτε "Θεματικά Πάρκα"</li>
                                    <li>Διαλέξτε "Μέτριο" ή "Ακριβό" κόστος</li>
                                    <li>5+ μέρες για ήρεμο ρυθμό</li>
                                </ul>
                            </div>
                            <div>
                                <strong>🧳 Για φθηνό ταξίδι:</strong>
                                <ul style="margin: 5px 0 0 15px; font-size: 14px;">
                                    <li>Επιλέξτε "Οικονομικό" κόστος</li>
                                    <li>Κοντινές αποστάσεις (<3 ώρες)</li>
                                    <li>3-4 μέρες διαμονής</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ΑΠΟΤΕΛΕΣΜΑΤΑ ΑΝΑΖΗΤΗΣΗΣ -->
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
        
        <!-- INFO BANNER -->
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
    `;
}
function setupDestinationStep() {
    if (state.selectedDays > 0) {
        document.getElementById('days-stay').value = state.selectedDays;
    }
    
    if (state.selectedBudget > 0) {
        document.getElementById('travel-budget').value = state.selectedBudget;
    }
    
    if (state.selectedDestination) {
        showSelectedDestination();
    }
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
    
    <!-- ΚΟΥΜΠΙ ΚΑΘΑΡΙΣΜΟΥ -->
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
                <!-- ΕΔΩ ΑΛΛΑΓΗ: Προσθέτουμε το <div id="map"> ΑΜΕΣΑ -->
                <div id="map-container" style="height: 500px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px; border: 2px solid var(--border);">
                    <div id="map" style="height: 100%; width: 100%;"></div>
                </div>
                
                <!-- Map Controls -->
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
                
                <!-- Custom Points List -->
                <div id="custom-points-container" style="display: none;">
                    <h3><i class="fas fa-map-pin"></i> Προσωπικά Σημεία</h3>
                    <div id="custom-points-list"></div>
                </div>
                
                <!-- Return Button -->
                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn btn-outline" onclick="showStep('summary')">
                        <i class="fas fa-arrow-left"></i> Επιστροφή στο Πρόγραμμα
                    </button>
                </div>
            `}
        </div>
    `;
}

// ==================== HELPER FUNCTIONS ====================
function setupMobileNavigation() {}

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
}

function updateBudgetTracker() {
    const total = state.selectedBudget;
    const spent = calculateTotalSpent();
    
    document.getElementById('budget-total').textContent = total + '€';
    document.getElementById('budget-spent').textContent = spent + '€';
    document.getElementById('budget-remaining').textContent = (total - spent) + '€';
    
    const progress = total > 0 ? (spent / total * 100) : 0;
    document.getElementById('budget-progress-bar').style.width = Math.min(progress, 100) + '%';
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

// ==================== DESTINATION FUNCTIONS ====================
async function filterDestinations() {
    console.log('🔍 Εφαρμογή φίλτρων προορισμών...');
    
    // 1. ΔΙΑΒΑΣΜΑ ΦΙΛΤΡΩΝ ΑΠΟ ΤΟ UI
    const travelType = document.getElementById('travel-type').value;
    const distanceFilter = document.getElementById('distance').value;
    const weatherFilter = document.getElementById('weather').value;
    const vacationTypeFilter = document.getElementById('vacation-type').value;
    const costFilter = document.getElementById('cost-level').value;
    const daysStay = document.getElementById('days-stay').value;
    const budgetInput = document.getElementById('travel-budget').value;
    
    // 2. ΕΝΗΜΕΡΩΣΗ STATE
    if (daysStay) {
        state.selectedDays = parseInt(daysStay);
        console.log('📅 Επιλεγμένες μέρες:', state.selectedDays);
    }
    
    if (budgetInput) {
        state.selectedBudget = parseInt(budgetInput);
        updateBudgetTracker();
        console.log('💰 Προϋπολογισμός:', state.selectedBudget + '€');
    }
    
    // 3. LOADING INDICATOR
    const resultsDiv = document.getElementById('destination-results');
    resultsDiv.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
            <div class="loading">
                <i class="fas fa-search fa-spin fa-3x" style="color: var(--primary); margin-bottom: 20px;"></i>
                <h3 style="color: var(--dark); margin-bottom: 10px;">Αναζήτηση Προορισμών</h3>
                <p style="color: var(--gray);">Εφαρμογή φίλτρων και φόρτωση δεδομένων...</p>
                <div style="margin-top: 20px; font-size: 14px; color: var(--gray);">
                    <i class="fas fa-filter"></i> Ενεργά φίλτρα: 
                    ${distanceFilter ? 'Απόσταση ' + distanceFilter + 'ώρες' : ''}
                    ${weatherFilter ? ', Καιρός: ' + weatherFilter : ''}
                    ${vacationTypeFilter ? ', Τύπος: ' + vacationTypeFilter : ''}
                    ${costFilter ? ', Κόστος: ' + costFilter : ''}
                </div>
            </div>
        </div>
    `;
    
    // 4. ΛΙΣΤΑ 20+ ΕΥΡΩΠΑΪΚΩΝ ΠΟΛΕΩΝ (με metadata)
const cities = [
    // === ΠΟΛΕΙΣ ΜΕ JSON (ΠΛΗΡΗΣ ΥΠΟΣΤΗΡΙΞΗ) ===
    { 
        id: 'paris', name: 'Παρίσι', emoji: '🗼', category: 'πόλη', 
        hasJSON: true, distance: 3.0, weather: 'Ίδιο', cost: 'Ακριβό', 
        vacationType: 'Πολιτισμός', country: 'Γαλλία', popularity: 10,
        themeParks: {
            hasParks: true,
            parksCount: 2,
            parkNames: ["Disneyland Paris", "Parc Astérix"],
            familyRating: 10,
            hasDisney: true,
            waterParks: 1
        },
        tags: ['ρομαντικό', 'πολιτισμός', 'μούσεια', 'γκαστρονομία']
    },
    
    { 
        id: 'amsterdam', name: 'Άμστερνταμ', emoji: '🌷', category: 'πόλη', 
        hasJSON: true, distance: 3.5, weather: 'Ζεστό', cost: 'Μέτριο', 
        vacationType: 'Πόλη', country: 'Ολλανδία', popularity: 9,
        themeParks: {
            hasParks: true,
            parksCount: 3,
            parkNames: ["Efteling", "Duinrell", "Slagharen"],
            familyRating: 9,
            hasDisney: false,
            waterParks: 2
        },
        tags: ['καναλόπολης', 'ποδήλατο', 'τέχνη', 'ανεμόμυλοι']
    },
    
    { 
        id: 'berlin', name: 'Βερολίνο', emoji: '🇩🇪', category: 'πόλη', 
        hasJSON: true, distance: 2.5, weather: 'Ίδιο', cost: 'Οικονομικό', 
        vacationType: 'Πόλη', country: 'Γερμανία', popularity: 8,
        themeParks: {
            hasParks: true,
            parksCount: 2,
            parkNames: ["Filmpark Babelsberg", "Tropical Islands"],
            familyRating: 7,
            hasDisney: false,
            waterParks: 1
        },
        tags: ['ιστορία', 'τεχνολογία', 'νυχτερινή ζωή', 'street food']
    },
    
    { 
        id: 'london', name: 'Λονδίνο', emoji: '🇬🇧', category: 'πόλη', 
        hasJSON: true, distance: 3.8, weather: 'Ίδιο', cost: 'Ακριβό', 
        vacationType: 'Πόλη', country: 'ΗΒ', popularity: 10,
        themeParks: {
            hasParks: true,
            parksCount: 4,
            parkNames: ["Thorpe Park", "Chessington World", "Legoland Windsor", "Alton Towers"],
            familyRating: 9,
            hasDisney: false,
            waterParks: 1
        },
        tags: ['πολυπολιτισμικό', 'βασιλείο', 'θέατρο', 'shopping']
    },
    
    { 
        id: 'madrid', name: 'Μαδρίτη', emoji: '🇪🇸', category: 'πόλη', 
        hasJSON: true, distance: 4.0, weather: 'Ζεστό', cost: 'Μέτριο', 
        vacationType: 'Πόλη', country: 'Ισπανία', popularity: 8,
        themeParks: {
            hasParks: true,
            parksCount: 1,
            parkNames: ["Parque Warner Madrid"],
            familyRating: 8,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['φλαμένκο', 'τέχνη', 'παραδοσιακή κουζίνα', 'nightlife']
    },
    
    { 
        id: 'prague', name: 'Πράγα', emoji: '🏰', category: 'πόλη', 
        hasJSON: true, distance: 2.2, weather: 'Κρύο', cost: 'Οικονομικό', 
        vacationType: 'Πολιτισμός', country: 'Τσεχία', popularity: 9,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 5,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['μεσαιωνική', 'μπύρα', 'αρχιτεκτονική', 'ιστορία']
    },
    
    { 
        id: 'vienna', name: 'Βιέννη', emoji: '🎻', category: 'πόλη', 
        hasJSON: true, distance: 2.0, weather: 'Ίδιο', cost: 'Μέτριο', 
        vacationType: 'Πολιτισμός', country: 'Αυστρία', popularity: 8,
        themeParks: {
            hasParks: true,
            parksCount: 1,
            parkNames: ["Prater"],
            familyRating: 7,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['μουσική', 'καφέ', 'αυτοκρατορική', 'πολιτισμός']
    },
    
    { 
        id: 'budapest', name: 'Βουδαπέστη', emoji: '🏰', category: 'πόλη', 
        hasJSON: true, distance: 2.0, weather: 'Ίδιο', cost: 'Οικονομικό', 
        vacationType: 'Πολιτισμός', country: 'Ουγγαρία', popularity: 7,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 5,
            hasDisney: false,
            waterParks: 1
        },
        tags: ['θερμές πηγές', 'αρ νουβό', 'ποτάμια', 'ιστορία']
    },
    
    { 
        id: 'istanbul', name: 'Κωνσταντινούπολη', emoji: '🕌', category: 'πόλη', 
        hasJSON: true, distance: 1.5, weather: 'Ζεστό', cost: 'Οικονομικό', 
        vacationType: 'Πολιτισμός', country: 'Τουρκία', popularity: 8,
        themeParks: {
            hasParks: true,
            parksCount: 2,
            parkNames: ["Vialand", "Isfanbul"],
            familyRating: 8,
            hasDisney: false,
            waterParks: 1
        },
        tags: ['ανατολίτικη', 'μπαζάρια', 'ιστορία', 'θαλασσοπλοΐα']
    },
    
    { 
        id: 'lisbon', name: 'Λισαβόνα', emoji: '🏖️', category: 'πόλη', 
        hasJSON: true, distance: 4.5, weather: 'Ζεστό', cost: 'Μέτριο', 
        vacationType: 'Θάλασσα', country: 'Πορτογαλία', popularity: 7,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 5,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['ατλαντικός', 'τρόλεϊ', 'φαδό', 'παραλίες']
    },
    
    // === ΠΟΛΕΙΣ ΧΩΡΙΣ JSON (ΣΥΝΤΟΜΑ ΔΙΑΘΕΣΙΜΕΣ) ===
    { 
        id: 'rome', name: 'Ρώμη', emoji: '🏛️', category: 'πόλη', 
        hasJSON: false, distance: 1.8, weather: 'Ζεστό', cost: 'Μέτριο', 
        vacationType: 'Πολιτισμός', country: 'Ιταλία', popularity: 10,
        themeParks: {
            hasParks: true,
            parksCount: 1,
            parkNames: ["Rainbow Magicland"],
            familyRating: 7,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['αρχαία', 'εκκλησίες', 'παστά', 'γλυπτά']
    },
    
    { 
        id: 'barcelona', name: 'Βαρκελώνη', emoji: '🏖️', category: 'πόλη', 
        hasJSON: false, distance: 3.0, weather: 'Ζεστό', cost: 'Μέτριο', 
        vacationType: 'Θάλασσα', country: 'Ισπανία', popularity: 9,
        themeParks: {
            hasParks: true,
            parksCount: 2,
            parkNames: ["PortAventura World", "Tibidabo"],
            familyRating: 9,
            hasDisney: false,
            waterParks: 1
        },
        tags: ['γαουντί', 'παραλία', 'ταπάς', 'μοντέρνα τέχνη']
    },
    
    { 
        id: 'brussels', name: 'Βρυξέλλες', emoji: '🍫', category: 'πόλη', 
        hasJSON: false, distance: 3.0, weather: 'Ίδιο', cost: 'Μέτριο', 
        vacationType: 'Πόλη', country: 'Βέλγιο', popularity: 6,
        themeParks: {
            hasParks: true,
            parksCount: 1,
            parkNames: ["Walibi Belgium"],
            familyRating: 7,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['σοκολάτα', 'μπύρα', 'ευρωπαϊκή έδρα', 'κομίκς']
    },
    
    { 
        id: 'copenhagen', name: 'Κοπεγχάγη', emoji: '🧜', category: 'πόλη', 
        hasJSON: false, distance: 3.5, weather: 'Κρύο', cost: 'Ακριβό', 
        vacationType: 'Πόλη', country: 'Δανία', popularity: 7,
        themeParks: {
            hasParks: true,
            parksCount: 1,
            parkNames: ["Tivoli Gardens"],
            familyRating: 9,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['χάγιαρτ', 'design', 'ποδηλατόπολη', 'νορδική']
    },
    
    { 
        id: 'dublin', name: 'Δουβλίνο', emoji: '🍀', category: 'πόλη', 
        hasJSON: false, distance: 4.2, weather: 'Ίδιο', cost: 'Μέτριο', 
        vacationType: 'Πόλη', country: 'Ιρλανδία', popularity: 7,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 5,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['μπύρα', 'μουσική', 'βιβλιοθήκες', 'φιλόξενοι']
    },
    
    { 
        id: 'edinburgh', name: 'Εδιμβούργο', emoji: '🏰', category: 'πόλη', 
        hasJSON: false, distance: 4.0, weather: 'Κρύο', cost: 'Μέτριο', 
        vacationType: 'Πολιτισμός', country: 'Σκωτία', popularity: 8,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 6,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['μεσαιωνική', 'φρούριο', 'whisky', 'φεστιβάλ']
    },
    
    { 
        id: 'florence', name: 'Φλωρεντία', emoji: '🎨', category: 'πόλη', 
        hasJSON: false, distance: 2.0, weather: 'Ζεστό', cost: 'Μέτριο', 
        vacationType: 'Πολιτισμός', country: 'Ιταλία', popularity: 8,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 6,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['αναγέννηση', 'τέχνη', 'έργα τέχνης', 'τοσκάνη']
    },
    
    { 
        id: 'munich', name: 'Μόναχο', emoji: '🍺', category: 'πόλη', 
        hasJSON: false, distance: 2.5, weather: 'Ίδιο', cost: 'Μέτριο', 
        vacationType: 'Πολιτισμός', country: 'Γερμανία', popularity: 8,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 6,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['οκτόμπερφεστ', 'μπύρα', 'βαρυαρία', 'παραδοσιακή']
    },
    
    { 
        id: 'venice', name: 'Βενετία', emoji: '🛶', category: 'πόλη', 
        hasJSON: false, distance: 2.0, weather: 'Ζεστό', cost: 'Ακριβό', 
        vacationType: 'Πολιτισμός', country: 'Ιταλία', popularity: 9,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 5,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['κανάλια', 'γέφυρες', 'καρναβάλι', 'ρομαντικό']
    },
    
    { 
        id: 'warsaw', name: 'Βαρσοβία', emoji: '🐻', category: 'πόλη', 
        hasJSON: false, distance: 2.5, weather: 'Κρύο', cost: 'Οικονομικό', 
        vacationType: 'Πόλη', country: 'Πολωνία', popularity: 6,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 5,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['πολωνική ιστορία', 'ανακατασκευή', 'χαμηλό κόστος', 'πάρκα']
    },
    
    { 
        id: 'zurich', name: 'Ζυρίχη', emoji: '💼', category: 'πόλη', 
        hasJSON: false, distance: 2.5, weather: 'Κρύο', cost: 'Ακριβό', 
        vacationType: 'Βουνό', country: 'Ελβετία', popularity: 7,
        themeParks: {
            hasParks: false,
            parksCount: 0,
            parkNames: [],
            familyRating: 6,
            hasDisney: false,
            waterParks: 0
        },
        tags: ['αλπική', 'οικονομική πρωτεύουσα', 'λίμνες', 'καθαρή']
    }
];
    
    // 5. ΕΦΑΡΜΟΓΗ ΦΙΛΤΡΩΝ
    const filteredCities = cities.filter(city => {
        let passesFilters = true;
        
        // Φίλτρο ΑΠΟΣΤΑΣΗΣ
        if (distanceFilter && passesFilters) {
            const maxDistance = parseFloat(distanceFilter);
            if (city.distance > maxDistance) {
                passesFilters = false;
            }
        }
        
        // Φίλτρο ΚΑΙΡΟΥ
        if (weatherFilter && passesFilters) {
            if (city.weather !== weatherFilter) {
                passesFilters = false;
            }
        }
        
        // Φίλτρο ΤΥΠΟΥ ΔΙΑΚΟΠΩΝ
        if (vacationTypeFilter && passesFilters) {
            if (city.vacationType !== vacationTypeFilter) {
                passesFilters = false;
            }
        }
        
        // Φίλτρο ΚΟΣΤΟΥΣ
        if (costFilter && passesFilters) {
            if (city.cost !== costFilter) {
                passesFilters = false;
            }
        }
        
        // Φίλτρο ΤΥΠΟΥ ΤΑΞΙΔΙΩΤΗ (ΒΑΣΙΚΟ)
        if (travelType && passesFilters) {
            if (travelType === 'Οικογένεια' && city.vacationType === 'νεαρών') {
                passesFilters = false;
            }
            if (travelType === 'Μόνος' && city.category === 'οικογενειακό') {
                passesFilters = false;
            }
        }
        
        // Φίλτρο BUDGET (προσέγγιση)
        if (budgetInput && passesFilters && city.hasJSON) {
            const budget = parseInt(budgetInput);
            if (budget > 0) {
                // Προσέγγιση: αν το budget είναι πολύ μικρό για ακριβή πόλη
                if (city.cost === 'Ακριβό' && budget < 1000) {
                    passesFilters = false;
                }
                if (city.cost === 'Μέτριο' && budget < 500) {
                    passesFilters = false;
                }
            }
        }
        
        return passesFilters;
    });
    
    console.log(`📊 Φίλτρα: Βρέθηκαν ${filteredCities.length} πόλεις από ${cities.length}`);
    
    // 6. ΕΜΦΑΝΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
    let html = '';
    
    if (filteredCities.length === 0) {
        html = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
                <div class="alert alert-warning" style="max-width: 600px; margin: 0 auto;">
                    <i class="fas fa-search fa-2x" style="color: var(--warning); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--dark); margin-bottom: 10px;">Δεν βρέθηκαν αποτελέσματα</h3>
                    <p style="color: var(--gray); margin-bottom: 20px;">
                        Δεν υπάρχουν πόλεις που να ταιριάζουν με τα επιλεγμένα φίλτρα.
                        <br>
                        <strong>Προσπαθήστε:</strong>
                    </p>
                    <ul style="text-align: left; display: inline-block; margin-bottom: 20px;">
                        <li>Να αλλάξετε κάποιο φίλτρο</li>
                        <li>Να αφαιρέσετε μερικά φίλτρα</li>
                        <li>Να αυξήσετε το προϋπολογισμό</li>
                    </ul>
                    <button class="btn btn-primary" onclick="resetFilters()" style="margin-top: 10px;">
                        <i class="fas fa-redo"></i> Επαναφορά Όλων των Φίλτρων
                    </button>
                </div>
            </div>
        `;
    } else {
        // ΤΑΞΙΝΟΜΗΣΗ: πρώτα με JSON, μετά δημοφιλία
        const sortedCities = [...filteredCities].sort((a, b) => {
            if (a.hasJSON && !b.hasJSON) return -1;
            if (!a.hasJSON && b.hasJSON) return 1;
            return b.popularity - a.popularity;
        });
        
        // ΔΗΜΙΟΥΡΓΙΑ ΚΑΡΤΩΝ ΠΟΛΕΩΝ
        for (const city of sortedCities) {
            if (city.hasJSON) {
                // ΠΟΛΗ ΜΕ JSON - προσπάθεια φόρτωσης
                try {
                    const response = await fetch(`data/${city.id}.json`);
                    const cityData = await response.json();
                    
                    html += createCityCard(city, cityData, true);
                    
                } catch (error) {
                    // Fallback αν λείπει το JSON
                    html += createCityCard(city, null, true);
                }
            } else {
                // ΠΟΛΗ ΧΩΡΙΣ JSON (coming soon)
                html += createCityCard(city, null, false);
            }
        }
    }
    
    resultsDiv.innerHTML = html;
    
    // 7. ΣΤΑΤΙΣΤΙΚΑ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
    if (filteredCities.length > 0) {
        const citiesWithJSON = filteredCities.filter(c => c.hasJSON).length;
        const comingSoon = filteredCities.filter(c => !c.hasJSON).length;
        
        const statsHTML = `
            <div style="grid-column: 1/-1; margin-top: 30px; padding: 20px; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; border-radius: var(--radius-lg); text-align: center;">
                <h4 style="color: white; margin-bottom: 10px;">
                    <i class="fas fa-chart-bar"></i> Στατιστικά Αναζήτησης
                </h4>
                <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
                    <div>
                        <div style="font-size: 32px; font-weight: bold;">${filteredCities.length}</div>
                        <div style="font-size: 14px; opacity: 0.9;">Σύνολο Πόλεων</div>
                    </div>
                    <div>
                        <div style="font-size: 32px; font-weight: bold;">${citiesWithJSON}</div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            <i class="fas fa-check-circle" style="color: #2ecc71;"></i> Πλήρης Υποστήριξη
                        </div>
                    </div>
                    <div>
                        <div style="font-size: 32px; font-weight: bold;">${comingSoon}</div>
                        <div style="font-size: 14px; opacity: 0.9;">
                            <i class="fas fa-tools" style="color: #f39c12;"></i> Σύντομα Διαθέσιμες
                        </div>
                    </div>
                </div>
                ${travelType ? `<p style="margin-top: 15px; font-size: 14px; opacity: 0.9;"><i class="fas fa-user"></i> Τύπος ταξιδιώτη: ${travelType}</p>` : ''}
            </div>
        `;
        
        resultsDiv.insertAdjacentHTML('beforeend', statsHTML);
    }
}

// ΒΟΗΘΗΤΙΚΗ ΣΥΝΑΡΤΗΣΗ: Δημιουργία κάρτας πόλης
function createCityCard(city, cityData, hasJSON) {
    const isClickable = hasJSON ? 'onclick="selectDestination(\'' + city.name + '\', \'' + city.id + '\')"' : '';
    const cardStyle = hasJSON ? '' : 'style="opacity: 0.8; cursor: not-allowed;"';
    const title = hasJSON ? '' : 'title="Σύντομα διαθέσιμο - Εργαζόμαστε πάνω σε αυτό!"';
    
    return `
        <div class="destination-card" ${cardStyle} ${title} ${isClickable}>
            <div style="font-size: 48px; text-align: center; margin-bottom: 15px;">
                ${city.emoji}
            </div>
            
            <h3>${city.name}</h3>
            <p style="color: var(--gray); margin-bottom: 10px;">
                <i class="fas fa-globe-europe"></i> ${city.country || (cityData?.country || 'Ευρώπη')}
            </p>
            
            <!-- ΠΛΗΡΟΦΟΡΙΕΣ ΠΟΛΗΣ -->
            <div style="background: var(--light); padding: 15px; border-radius: var(--radius-md); margin: 15px 0;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div style="text-align: center;">
                        <div style="font-size: 12px; color: var(--gray);">
                            <i class="fas fa-plane"></i> Απόσταση
                        </div>
                        <div style="font-weight: bold; color: var(--dark);">
                            ${city.distance} ώρες
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 12px; color: var(--gray);">
                            <i class="fas fa-cloud"></i> Καιρός
                        </div>
                        <div style="font-weight: bold; color: var(--dark);">
                            ${city.weather}
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 12px; color: var(--gray);">
                            <i class="fas fa-wallet"></i> Κόστος
                        </div>
                        <div style="font-weight: bold; color: var(--dark);">
                            ${city.cost.replace('Οικονομικό', '💰').replace('Μέτριο', '💰💰').replace('Ακριβό', '💰💰💰')}
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 12px; color: var(--gray);">
                            <i class="fas fa-umbrella-beach"></i> Τύπος
                        </div>
                        <div style="font-weight: bold; color: var(--dark);">
                            ${city.vacationType}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- TAGS -->
            <div class="tags" style="margin-top: 10px;">
                <span class="tag tag-primary">${city.category}</span>
                ${city.vacationType ? `<span class="tag tag-secondary">${city.vacationType}</span>` : ''}
                ${city.cost === 'Οικονομικό' ? '<span class="tag" style="background: #2ecc71; color: white;">💰 Οικονομικό</span>' : ''}
                ${city.cost === 'Μέτριο' ? '<span class="tag" style="background: #f39c12; color: white;">💰💰 Μέτριο</span>' : ''}
                ${city.cost === 'Ακριβό' ? '<span class="tag" style="background: #e74c3c; color: white;">💰💰💰 Ακριβό</span>' : ''}
            </div>
            
            <!-- STATUS -->
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border); text-align: center;">
                ${hasJSON ? `
                    <span class="tag" style="background: var(--success); color: white;">
                        <i class="fas fa-check-circle"></i> Πλήρης Υποστήριξη
                    </span>
                    <p style="font-size: 12px; color: var(--gray); margin-top: 5px;">
                        ${cityData?.activities?.length || 'Πολλές'} δραστηριότητες διαθέσιμες
                    </p>
                ` : `
                    <span class="tag" style="background: var(--warning); color: white;">
                        <i class="fas fa-tools"></i> Σύντομα Διαθέσιμο
                    </span>
                    <p style="font-size: 12px; color: var(--gray); margin-top: 5px;">
                        Υπό κατασκευή - Ερχόμαστε σύντομα!
                    </p>
                `}
            </div>
            
            <!-- ΚΟΥΜΠΙ ΕΠΙΛΟΓΗΣ (μόνο για πόλεις με JSON) -->
            ${hasJSON ? `
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" style="width: 100%;" onclick="selectDestination('${city.name}', '${city.id}'); event.stopPropagation();">
                        <i class="fas fa-map-marker-alt"></i> Επιλογή Προορισμού
                    </button>
                </div>
            ` : `
                <div style="margin-top: 20px; text-align: center;">
                    <button class="btn btn-outline" style="width: 100%; cursor: not-allowed;" disabled>
                        <i class="fas fa-clock"></i> Σύντομα Διαθέσιμο
                    </button>
                </div>
            `}
        </div>
    `;
}

function resetFilters() {
    document.getElementById('travel-type').value = '';
    document.getElementById('distance').value = '';
    document.getElementById('weather').value = '';
    document.getElementById('vacation-type').value = '';
    document.getElementById('cost-level').value = '';
    document.getElementById('days-stay').value = '';
    document.getElementById('travel-budget').value = '';
    
    document.getElementById('destination-results').innerHTML = '';
    
    state.selectedDestination = null;
    state.selectedDestinationId = null;
    state.selectedDays = 0;
    state.selectedBudget = 0;
    state.selectedActivities = [];
    
    document.getElementById('current-destination-display').textContent = 'Δεν έχει επιλεγεί';
    updateBudgetTracker();
    saveState();
}

function selectDestination(destinationName, destinationId) {
    state.selectedDestination = destinationName;
    state.selectedDestinationId = destinationId;
    state.selectedDays = parseInt(document.getElementById('days-stay').value) || 3;
    state.selectedBudget = parseInt(document.getElementById('travel-budget').value) || 0;
    
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

function showSelectedDestination() {
    console.log('📍 Επιλεγμένος προορισμός:', state.selectedDestination);
}

// ==================== FLIGHT FUNCTIONS ====================
function setupFlightStep() {
    const flightDate = document.getElementById('flight-date');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    flightDate.min = today.toISOString().split('T')[0];
    flightDate.value = nextWeek.toISOString().split('T')[0];
}

// ==================== HOTEL FUNCTIONS ====================
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

// ==================== ACTIVITIES FUNCTIONS ====================
async function setupActivitiesStep() {
    console.log('🎯 Ρύθμιση βήματος δραστηριοτήτων');
    
    if (!state.selectedDestinationId) {
        console.log('⚠️ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    const activitiesList = document.getElementById('activities-list');
    
    // ΠΡΟΣΘΗΚΗ: Reset μόνο αν ο χρήστης δεν έχει επιλέξει
    if (!state.selectedActivities || state.selectedActivities.length === 0) {
        activitiesList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <p>Δεν έχετε επιλέξει δραστηριότητες ακόμα. Κάντε κλικ για να προσθέσετε.</p>
                </div>
            </div>
        `;
    } else {
        activitiesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Φόρτωση δραστηριοτήτων...</p></div>';
    }
    
    try {
        // Φόρτωση των δεδομένων από το JSON
        const response = await fetch(`data/${state.selectedDestinationId}.json`);
        const cityData = await response.json();
        
        state.currentCityActivities = cityData.activities || [];
        
        let html = '';
        state.currentCityActivities.forEach((activity, index) => {
            const familyCost = calculateFamilyCost(activity.prices);
            
            // ΑΛΛΑΓΗ: Έλεγχος αν η δραστηριότητα είναι ΕΠΙΛΕΓΜΕΝΗ
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
                    
                    <div class="activity-description">${activity.description}</div>
                    
                    <div style="font-size: 12px; color: var(--gray); margin: 10px 0;">
                        <i class="fas fa-clock"></i> ${activity.duration_hours || '?'} ώρες
                        <span style="margin-left: 15px;"><i class="fas fa-tag"></i> ${activity.category}</span>
                    </div>
                    
                    <table class="price-table">
                        <tr>
                            <th>Βρέφη</th>
                            <th>Παιδιά</th>
                            <th>Ενήλικες</th>
                        </tr>
                        <tr>
                            <td>${getPriceDisplay(activity.prices, 2)}</td>
                            <td>${getPriceDisplay(activity.prices, 12)}</td>
                            <td><strong>${getPriceDisplay(activity.prices, 'adult')}</strong></td>
                        </tr>
                    </table>
                    
                    <div class="activity-total">
                        ${familyCost}€ για ${state.familyMembers.length} άτομα
                    </div>
                </div>
            `;
        });
        
        activitiesList.innerHTML = html;
        
        // Ενημέρωση του συνολικού κόστους
        updateActivitiesTotal();
        
    } catch (error) {
        console.error('❌ Σφάλμα φόρτωσης δραστηριοτήτων:', error);
        activitiesList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    Δεν ήταν δυνατή η φόρτωση των δραστηριοτήτων.
                    <button onclick="setupActivitiesStep()" class="btn btn-outline" style="margin-top: 10px;">
                        <i class="fas fa-sync-alt"></i> Δοκιμή ξανά
                    </button>
                </div>
            </div>
        `;
    }
}
function getPriceDisplay(prices, age) {
    if (!prices) return '0€';
    
    if (age === 'adult') {
        return prices.adult !== undefined ? `${prices.adult}€` : 'N/A';
    }
    
    const price = prices[age.toString()];
    if (price === undefined) return 'N/A';
    if (price === 'blocked') return '✗ Απαγ.';
    if (price === 0) return 'ΔΩΡΕΑΝ';
    return `${price}€`;
}

function calculateFamilyCost(prices) {
    if (!prices) return 0;
    
    let total = 0;
    
    state.familyMembers.forEach(member => {
        const age = member.age;
        
        // 1. Βρίσκουμε την τιμή για τη συγκεκριμένη ηλικία
        const agePrice = prices[age.toString()]; // Μετατρέπουμε σε string γιατί τα κλειδιά είναι strings
        
        // 2. Αν δεν υπάρχει τιμή για αυτήν την ηλικία, ψάχνουμε για adult
        const adultPrice = prices.adult;
        
        // 3. Ελέγχουμε τι είδους τιμή έχουμε
        if (agePrice !== undefined) {
            // Περίπτωση 1: Η τιμή είναι "blocked" - αγνοούμε (δεν υπολογίζεται)
            if (agePrice === "blocked") {
                console.log(`Ηλικία ${age}: ΑΠΑΓΟΡΕΥΕΤΑΙ`);
                return; // συνεχίζουμε με επόμενο μέλος
            }
            
            // Περίπτωση 2: Η τιμή είναι αριθμός
            if (typeof agePrice === 'number') {
                total += agePrice;
                console.log(`Ηλικία ${age}: ${agePrice}€`);
            }
            
            // Περίπτωση 3: Η τιμή είναι 0 (δωρεάν)
            // Απλά δεν προσθέτουμε τίποτα
        }
        // 4. Αν δεν βρέθηκε τιμή για συγκεκριμένη ηλικία, δοκιμάζουμε adult
        else if (adultPrice !== undefined && age >= 18) {
            if (typeof adultPrice === 'number') {
                total += adultPrice;
                console.log(`Ενήλικας ${age}: ${adultPrice}€`);
            }
        }
        // 5. Αν δεν βρέθηκε τίποτα και είναι παιδί (<18)
        else if (age < 18) {
            // Ψάχνουμε για child τιμή (αν υπάρχει)
            const childPrice = prices.child;
            if (childPrice !== undefined && typeof childPrice === 'number') {
                total += childPrice;
                console.log(`Παιδί ${age}: ${childPrice}€ (child price)`);
            }
            // Αν δεν υπάρχει child τιμή, ψάχνουμε για τιμή ηλικίας 4 (συχνά για παιδιά)
            else if (prices['4'] !== undefined && typeof prices['4'] === 'number') {
                total += prices['4'];
                console.log(`Παιδί ${age}: ${prices['4']}€ (default child price)`);
            }
            // Διαφορετικά, παιδί δωρεάν
        }
    });
    
    console.log(`Συνολικό κόστος οικογένειας: ${total}€`);
    return total;
}

function getActivityEmoji(category) {
    const emojiMap = {
        'museum': '🏛️',
        'experience': '🎭',
        'zoo': '🐯',
        'park': '🌳',
        'cruise': '🚢',
        'art': '🎨',
        'science': '🔬'
    };
    
    return emojiMap[category] || '📍';
}

function toggleActivitySelection(activityId) {
    const activityCard = document.querySelector(`.activity-card[data-activity-id="${activityId}"]`);
    
    if (activityCard) {
        const isSelected = activityCard.classList.contains('selected');
        
        if (isSelected) {
            // Αφαίρεση
            activityCard.classList.remove('selected');
            activityCard.querySelector('.activity-star').textContent = '☆';
            
            const index = state.selectedActivities.findIndex(a => a.id === activityId);
            if (index !== -1) {
                state.selectedActivities.splice(index, 1);
            }
        } else {
            // Προσθήκη
            activityCard.classList.add('selected');
            activityCard.querySelector('.activity-star').textContent = '⭐';
            
            const activity = state.currentCityActivities.find(a => a.id === activityId);
            if (activity) {
                const familyCost = calculateFamilyCost(activity.prices);
                state.selectedActivities.push({
                    id: activityId,
                    name: activity.name,
                    price: familyCost,
                    duration: activity.duration_hours
                });
            }
        }
        
        updateActivitiesTotal();
        saveState();
    }
}

function updateActivitiesTotal() {
    let total = 0;
    
    state.selectedActivities.forEach(activity => {
        total += activity.price || 0;
    });
    
    document.getElementById('activities-total').textContent = total + '€';
    updateBudgetTracker();
}

// ==================== SUMMARY FUNCTIONS ====================
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
                
                <div class="time-slot">
                    <h5>☀️ Μεσημέρι (12:00 - 17:00)</h5>
                    <ul>
                        <li>Γεύμα σε τοπικό εστιατόριο</li>
                        <li>Περίπατος στην πόλη</li>
                    </ul>
                </div>
                
                <div class="time-slot">
                    <h5>🌙 Βράδυ (17:00 - 22:00)</h5>
                    <ul>
                        <li>Δείπνο</li>
                        ${i < days ? '<li>Προγραμματισμός για την επόμενη μέρα</li>' : '<li>Αναχώρηση</li>'}
                    </ul>
                </div>
            </div>`;
    }
    
    dailyProgram.innerHTML = html;
}

// ==================== MAP FUNCTIONS ====================
let travelMap = null;

function setupMapStep() {
    console.log('🗺️ Ρύθμιση βήματος χάρτη για:', state.selectedDestination);
    
    if (!state.selectedDestination) {
        console.log('⚠️ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    // ΒΟΗΘΗΤΙΚΗ ΣΥΝΑΡΤΗΣΗ: Λήψη συντεταγμένων ΜΟΝΟ για τις πόλεις που έχετε
    function getCityCoordinates(cityName) {
        const cityCoords = {
            'Άμστερνταμ': [52.3676, 4.9041],
            'Βερολίνο': [52.5200, 13.4050],
            'Βουδαπέστη': [47.4979, 19.0402],
            'Κωνσταντινούπολη': [41.0082, 28.9784],
            'Λισαβόνα': [38.7223, -9.1393],
            'Λονδίνο': [51.5074, -0.1278],
            'Μαδρίτη': [40.4168, -3.7038],
            'Παρίσι': [48.8566, 2.3522],
            'Πράγα': [50.0755, 14.4378],
            'Βιέννη': [48.2082, 16.3738]
            // ΜΟΝΟ οι 10 πόλεις από τη λίστα στο filterDestinations()
        };
        
        // Επιστρέφουμε τις συντεταγμένες ή προεπιλογή (Άμστερνταμ)
        return cityCoords[cityName] || [52.3676, 4.9041];
    }
    
    // Αποθήκευση των συντεταγμένων
    state.cityCoordinates = getCityCoordinates(state.selectedDestination);
    console.log('📍 Συντεταγμένες:', state.cityCoordinates, 'για', state.selectedDestination);
    
    // Περιμένουμε το DOM
    setTimeout(() => {
        // Έλεγχος για το map container
        const mapContainer = document.getElementById('map-container');
        const mapDiv = document.getElementById('map');
        
        if (!mapContainer || !mapDiv) {
            console.error('❌ Το map container δεν βρέθηκε!');
            
            // Δημιουργία αν λείπει
            const card = document.querySelector('.card');
            if (card) {
                card.innerHTML += `
                    <div id="map-container" style="height: 500px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px; border: 2px solid var(--border);">
                        <div id="map" style="height: 100%; width: 100%;">
                            <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: var(--light);">
                                <div class="loading">
                                    <i class="fas fa-spinner fa-spin"></i>
                                    <p>Προετοιμασία χάρτη...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        // Καθαρισμός και loading
        if (mapDiv) {
            mapDiv.innerHTML = `
                <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--light);">
                    <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary); margin-bottom: 15px;"></i>
                    <p style="color: var(--gray);">Φόρτωση χάρτη ${state.selectedDestination}...</p>
                </div>
            `;
        }
        
        // Μικρή καθυστέρηση και δημιουργία χάρτη
        setTimeout(() => {
            initializeMap();
        }, 150);
        
    }, 300);
}

function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('❌ Το map div δεν βρέθηκε!');
        return;
    }
    
    // Καθαρισμός αν υπάρχει παλιός χάρτης
    if (travelMap) {
        travelMap.remove();
    }
    
    try {
        if (typeof L === 'undefined') {
            throw new Error('Leaflet library not loaded');
        }
        
        // Συντεταγμένες από τη setupMapStep() ή προεπιλογή
        const coords = state.cityCoordinates || [52.3676, 4.9041];
        
        // Δημιουργία χάρτη
        travelMap = L.map('map').setView(coords, 13);
        
        // Προσθήκη χάρτη
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(travelMap);
        
        // Προσθήκη μαρκαδόρου
        L.marker(coords)
            .addTo(travelMap)
            .bindPopup(`<b>${state.selectedDestination}</b>`)
            .openPopup();
        
        // Προσθήκη zoom controls
        L.control.zoom({ position: 'topright' }).addTo(travelMap);
        
        console.log('✅ Χάρτης δημιουργήθηκε για', state.selectedDestination);
        
    } catch (error) {
        console.error('Σφάλμα:', error);
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
    if (!travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    const pointName = prompt('Όνομα σημείου:');
    if (pointName) {
        const center = travelMap.getCenter();
        L.marker(center)
            .addTo(travelMap)
            .bindPopup(`<b>${pointName}</b>`)
            .openPopup();
        
        alert(`✅ Προστέθηκε σημείο: "${pointName}"`);
    }
}

function showActivityMap() {
    if (!travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    if (state.selectedActivities.length === 0) {
        alert('Δεν έχετε επιλέξει δραστηριότητες ακόμα');
        return;
    }
    
    // Φορτώνουμε ξανά το JSON για να πάρουμε τις πραγματικές συντεταγμένες
    if (!state.selectedDestinationId) {
        alert('Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    // Διαβάζουμε το JSON για τις πληροφορίες των δραστηριοτήτων
    fetch(`data/${state.selectedDestinationId}.json`)
        .then(response => response.json())
        .then(cityData => {
            if (!cityData.activities) {
                alert('Δεν υπάρχουν πληροφορίες για δραστηριότητες σε αυτήν την πόλη');
                return;
            }
            
            // Καθαρίζουμε τους προηγούμενους δείκτες (εκτός από τον κεντρικό)
            travelMap.eachLayer((layer) => {
                if (layer instanceof L.Marker && layer !== travelMap.centerMarker) {
                    travelMap.removeLayer(layer);
                }
            });
            
            // Προσθέτουμε δείκτες για κάθε επιλεγμένη δραστηριότητα
            state.selectedActivities.forEach((selectedActivity, index) => {
                // Βρίσκουμε την πλήρη δραστηριότητα από το JSON
                const fullActivity = cityData.activities.find(a => a.id === selectedActivity.id);
                
                if (fullActivity && fullActivity.location) {
                    // Έχουμε πραγματικές συντεταγμένες
                    L.marker([fullActivity.location.lat, fullActivity.location.lng])
                        .addTo(travelMap)
                        .bindPopup(`
                            <b>${fullActivity.name}</b><br>
                            <small>${fullActivity.description || ''}</small><br>
                            <strong>${selectedActivity.price || '0'}€</strong>
                        `)
                        .openPopup();
                } else {
                    // Fallback: χρησιμοποιούμε τυχαίες συντεταγμένες γύρω από το κέντρο
                    const center = travelMap.getCenter();
                    const lat = center.lat + (Math.random() - 0.5) * 0.05;
                    const lng = center.lng + (Math.random() - 0.5) * 0.05;
                    
                    L.marker([lat, lng])
                        .addTo(travelMap)
                        .bindPopup(`<b>${selectedActivity.name}</b><br>${selectedActivity.price || '0'}€`)
                        .openPopup();
                }
            });
            
            alert(`✅ Προστέθηκαν ${state.selectedActivities.length} δραστηριότητες στον χάρτη`);
        })
        .catch(error => {
            console.error('Σφάλμα φόρτωσης δεδομένων πόλης:', error);
            alert('Δεν μπόρεσαν να φορτωθούν οι πληροφορίες για τις δραστηριότητες');
        });
}

function showRouteBetweenPoints() {
    if (!travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    alert('🛣️ Η δημιουργία διαδρομής θα είναι διαθέσιμη σύντομα!');
}

// ==================== EXPORTED FUNCTIONS ====================
window.showStep = showStep;
window.filterDestinations = filterDestinations;
window.resetFilters = resetFilters;
window.selectDestination = selectDestination;
window.searchHotels = searchHotels;
window.updateFamilyMemberName = function(index, name) {
    state.familyMembers[index].name = name;
};
window.updateFamilyMemberAge = function(index, age) {
    state.familyMembers[index].age = parseInt(age) || 0;
};
window.addFamilyMember = function(type) {
    const newMember = {
        name: type === 'adult' ? 'Νέο Μέλος' : 'Νέο Παιδί',
        age: type === 'adult' ? 30 : 10
    };
    state.familyMembers.push(newMember);
    showStep('activities');
};
window.removeFamilyMember = function(index) {
    if (state.familyMembers.length > 2) {
        state.familyMembers.splice(index, 1);
        showStep('activities');
    }
};
window.updateFamilyMembers = function() {
    saveState();
    alert('✅ Τα μέλη της οικογένειας ενημερώθηκαν!');
};
window.calculateSmartCombos = function() {
    alert('ℹ️ Η λειτουργία "Έξυπνο Combo" θα είναι διαθέσιμη σύντομα!');
};
window.toggleActivitySelection = toggleActivitySelection;
window.setupMapStep = setupMapStep;
window.initializeMap = initializeMap;
window.reloadMap = reloadMap;
window.addCustomPoint = addCustomPoint;
window.showActivityMap = showActivityMap;
window.showRouteBetweenPoints = showRouteBetweenPoints;
// ==================== NEW FUNCTION: CLEAR ACTIVITIES ====================
function clearSelectedActivities() {
    if (state.selectedActivities.length === 0) {
        alert('ℹ️ Δεν έχετε επιλέξει καμία δραστηριότητα!');
        return;
    }
    
    if (confirm('⚠️ Θέλετε να καταργήσετε ΟΛΕΣ τις επιλεγμένες δραστηριότητες;')) {
        // 1. Καθαρισμός από το state
        state.selectedActivities = [];
        
        // 2. Καθαρισμός από την οθόνη
        document.querySelectorAll('.activity-card.selected').forEach(card => {
            card.classList.remove('selected');
            const star = card.querySelector('.activity-star');
            if (star) {
                star.textContent = '☆';
            }
        });
        
        // 3. Ενημέρωση κόστους
        updateActivitiesTotal();
        
        // 4. Αποθήκευση
        saveState();
        
        // 5. Ενημέρωση χρήστη
        alert('✅ Οι επιλογές καθαρίστηκαν! Τώρα μπορείτε να επιλέξετε νέες δραστηριότητες.');
    }
}

// Προσθήκη της συνάρτησης στο window για να είναι προσβάσιμη
window.clearSelectedActivities = clearSelectedActivities;

console.log('✅ Script.js loaded successfully!');

// ==================== MANUAL DESTINATION FUNCTIONS ====================
function showManualDestinationModal() {
    console.log('📋 Άνοιγμα modal για χειροκίνητη επιλογή');
    document.getElementById('manual-destination-modal').style.display = 'flex';
    
    // Reset form
    document.getElementById('manual-city-select').value = '';
    document.getElementById('manual-days').value = '5';
    document.getElementById('manual-budget').value = '';
    document.getElementById('city-details').innerHTML = '';
    document.getElementById('selected-city-info').textContent = 'Επιλέξτε πόλη για πληροφορίες';
}

function closeManualDestinationModal() {
    document.getElementById('manual-destination-modal').style.display = 'none';
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
    
    // ΕΛΕΓΧΟΣ: Αν είναι πόλη χωρίς JSON
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
    
    // Αποθήκευση στο state
    state.selectedDestination = cityName;
    state.selectedDestinationId = cityId;
    state.selectedDays = parseInt(days) || 5;
    state.selectedBudget = parseInt(budget) || 0;
    
    // Ενημέρωση UI
    document.getElementById('current-destination-display').textContent = cityName;
    updateBudgetTracker();
    
    // Κλείσιμο modal
    closeManualDestinationModal();
    
    // Απόκρυψη του banner
    document.getElementById('already-found-container').style.display = 'none';
    
    // Ενημέρωση χρήστη
    alert(`✅ Επιλέξατε: ${cityName}\n\nΤώρα μπορείτε να συνεχίσετε στις πτήσεις.`);
    
    // Αποθήκευση
    saveState();
    
    console.log('📍 Χειροκίνητη επιλογή:', cityName, cityId);
}

// ΣΥΝΑΡΤΗΣΗ: Εμφάνιση πληροφοριών πόλης όταν επιλέγεται
function updateCityDetails(cityId) {
    const cityDetails = {
        'amsterdam': { country: 'Ολλανδία', distance: '3.5 ώρες', cost: 'Μέτριο', features: 'Κανάλια, Ποδήλατο, Μουσεία' },
        'berlin': { country: 'Γερμανία', distance: '2.5 ώρες', cost: 'Οικονομικό', features: 'Ιστορία, Τέχνη, Nightlife' },
        'budapest': { country: 'Ουγγαρία', distance: '2 ώρες', cost: 'Οικονομικό', features: 'Θερμές πηγές, Αρχιτεκτονική' },
        'istanbul': { country: 'Τουρκία', distance: '1.5 ώρες', cost: 'Οικονομικό', features: 'Ιστορία, Μπαζάρια, Τζαμιά' },
        'lisbon': { country: 'Πορτογαλία', distance: '4.5 ώρες', cost: 'Μέτριο', features: 'Παραλίες, Τρόλεϊ, Φαντά' },
        'london': { country: 'Ηνωμένο Βασίλειο', distance: '3.8 ώρες', cost: 'Ακριβό', features: 'Μουσεία, Θεάτρο, Shopping' },
        'madrid': { country: 'Ισπανία', distance: '4 ώρες', cost: 'Μέτριο', features: 'Τέχνη, Φλαμένκο, Νυχτερινή ζωή' },
        'paris': { country: 'Γαλλία', distance: '3 ώρες', cost: 'Ακριβό', features: 'Disneyland, Μουσεία, Ρομαντική' },
        'prague': { country: 'Τσεχία', distance: '2.2 ώρες', cost: 'Οικονομικό', features: 'Μεσαιωνική, Μπύρα, Αρχιτεκτονική' },
        'vienna': { country: 'Αυστρία', distance: '2 ώρες', cost: 'Μέτριο', features: 'Μουσική, Καφέ, Αυτοκρατορική' },
        'rome': { country: 'Ιταλία', distance: '1.8 ώρες', cost: 'Μέτριο', features: 'Αρχαία, Εκκλησίες, Παστά' },
        'barcelona': { country: 'Ισπανία', distance: '3 ώρες', cost: 'Μέτριο', features: 'Γαουντί, Παραλία, Ταπάς' },
        'brussels': { country: 'Βέλγιο', distance: '3 ώρες', cost: 'Μέτριο', features: 'Σοκολάτα, Μπύρα, Ευρωπαϊκή Έδρα' },
        'copenhagen': { country: 'Δανία', distance: '3.5 ώρες', cost: 'Ακριβό', features: 'Design, Ποδηλατόπολη, Χάγιαρτ' },
        'dublin': { country: 'Ιρλανδία', distance: '4.2 ώρες', cost: 'Μέτριο', features: 'Μπύρα, Μουσική, Φιλόξενοι' },
        'edinburgh': { country: 'Σκωτία', distance: '4 ώρες', cost: 'Μέτριο', features: 'Φρούριο, Whisky, Φεστιβάλ' },
        'florence': { country: 'Ιταλία', distance: '2 ώρες', cost: 'Μέτριο', features: 'Αναγέννηση, Τέχνη, Μουσεία' },
        'munich': { country: 'Γερμανία', distance: '2.5 ώρες', cost: 'Μέτριο', features: 'Οκτόμπερφεστ, Μπύρα, Παραδοσιακή' },
        'venice': { country: 'Ιταλία', distance: '2 ώρες', cost: 'Ακριβό', features: 'Κανάλια, Γέφυρες, Καρναβάλι' },
        'warsaw': { country: 'Πολωνία', distance: '2.5 ώρες', cost: 'Οικονομικό', features: 'Ιστορία, Χαμηλό κόστος, Πάρκα' },
        'zurich': { country: 'Ελβετία', distance: '2.5 ώρες', cost: 'Ακριβό', features: 'Αλπική, Οικονομική, Λίμνες' }
    };
    
    const info = cityDetails[cityId];
    const citySelect = document.getElementById('manual-city-select');
    const cityName = citySelect.options[citySelect.selectedIndex].text;
    
    if (info) {
        const hasJSON = !['rome', 'barcelona', 'brussels', 'copenhagen', 'dublin', 
                         'edinburgh', 'florence', 'munich', 'venice', 'warsaw', 'zurich'].includes(cityId);
        
        document.getElementById('selected-city-info').textContent = `${cityName} - ${info.country}`;
        
        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                <div>
                    <strong>✈️ Απόσταση:</strong><br>
                    <span>${info.distance} από Ελλάδα</span>
                </div>
                <div>
                    <strong>💰 Κόστος:</strong><br>
                    <span>${info.cost}</span>
                </div>
                <div style="grid-column: 1 / -1;">
                    <strong>⭐ Χαρακτηριστικά:</strong><br>
                    <span>${info.features}</span>
                </div>
                <div style="grid-column: 1 / -1; margin-top: 10px; padding: 10px; border-radius: 8px; background: ${
                    hasJSON ? 'rgba(46, 204, 113, 0.1)' : 'rgba(243, 156, 18, 0.1)'
                }; border-left: 4px solid ${hasJSON ? '#2ecc71' : '#f39c12'};">
                    <strong>${hasJSON ? '✅ ΠΛΗΡΗΣ ΥΠΟΣΤΗΡΙΞΗ' : '🛠️ ΣΥΝΤΟΜΑ ΔΙΑΘΕΣΙΜΗ'}</strong><br>
                    <span>${hasJSON ? 
                        'Διαθέσιμες δραστηριότητες, χάρτης και πληροφορίες' : 
                        'Υπό κατασκευή - περιορισμένες λειτουργίες'}</span>
                </div>
            </div>
        `;
        
        document.getElementById('city-details').innerHTML = html;
    }
}

// Ενημέρωση της loadStepContent για να ελέγχει το banner
const originalLoadStepContent = loadStepContent;
loadStepContent = function(stepName) {
    originalLoadStepContent(stepName);
    
    // Εμφάνιση/απόκρυψη banner
    if (stepName === 'destination') {
        setTimeout(() => {
            document.getElementById('already-found-container').style.display = 'block';
        }, 300);
    } else {
        document.getElementById('already-found-container').style.display = 'none';
    }
};

// Προσθήκη event listeners μετά τη φόρτωση
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Event listener για dropdown πόλης
        const citySelect = document.getElementById('manual-city-select');
        if (citySelect) {
            citySelect.addEventListener('change', function() {
                if (this.value) {
                    updateCityDetails(this.value);
                } else {
                    document.getElementById('selected-city-info').textContent = 'Επιλέξτε πόλη για πληροφορίες';
                    document.getElementById('city-details').innerHTML = '';
                }
            });
        }
        
        // Κλείσιμο modal με ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('manual-destination-modal');
                if (modal && modal.style.display === 'flex') {
                    closeManualDestinationModal();
                }
            }
        });
        
        // Κλείσιμο modal με κλικ έξω
        const modal = document.getElementById('manual-destination-modal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === this) {
                    closeManualDestinationModal();
                }
            });
        }
        
    }, 1000);
});

// Προσθήκη στο window object
window.showManualDestinationModal = showManualDestinationModal;
window.closeManualDestinationModal = closeManualDestinationModal;
window.saveManualDestination = saveManualDestination;

// ==================== QUICK RECOMMENDATIONS ====================
// ΟΙ ΥΠΟΛΟΙΠΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ΠΑΡΑΜΕΝΟΥΝ ΟΠΩΣ ΕΧΟΥΝ
function showQuickRecommendations() {
    // ... υπάρχων κώδικας ...
}
// κλπ...



// ==================== QUICK RECOMMENDATIONS ====================
function showQuickRecommendations() {
    const recommendations = [
        {
            title: "👨‍👩‍👧‍👦 Για Οικογένειες",
            cities: ["Παρίσι", "Λονδίνο", "Άμστερνταμ", "Βαρκελώνη"],
            filters: { 
                'theme-parks': 'has-parks',
                'travel-type': 'Οικογένεια',
                'cost-level': 'Μέτριο'
            },
            description: "Πόλεις με θεματικά πάρκα και οικογενειακές δραστηριότητες"
        },
        {
            title: "💰 Οικονομικές Επιλογές",
            cities: ["Βουδαπέστη", "Πράγα", "Κωνσταντινούπολη", "Βερολίνο"],
            filters: { 
                'cost-level': 'Οικονομικό',
                'distance': '2.5'
            },
            description: "Καλής ποιότητας ταξίδια με χαμηλό κόστος"
        },
        {
            title: "🎨 Πολιτισμός & Τέχνη",
            cities: ["Παρίσι", "Ρώμη", "Φλωρεντία", "Βιέννη"],
            filters: { 
                'vacation-type': 'Πολιτισμός',
                'theme-parks': 'no-parks'
            },
            description: "Για εκδρομές μουσεία, τέχνη και ιστορία"
        },
        {
            title: "👑 Disneyland Paris",
            cities: ["Παρίσι"],
            filters: { 
                'theme-parks': 'disney',
                'travel-type': 'Οικογένεια'
            },
            description: "Μοναδική ευρωπαϊκή πόλη με Disneyland"
        }
    ];
    
    const resultsDiv = document.getElementById('destination-results');
    let html = '<h2 style="grid-column: 1/-1; margin-bottom: 20px;">🎯 Γρήγορες Προτάσεις</h2>';
    
    recommendations.forEach(rec => {
        html += `
            <div class="card" style="grid-column: span 1;">
                <h3 style="color: var(--primary); margin-bottom: 10px;">${rec.title}</h3>
                <p style="color: var(--gray); margin-bottom: 15px; font-size: 14px;">${rec.description}</p>
                
                <div style="margin-bottom: 15px;">
                    ${rec.cities.map(city => `
                        <span class="tag" style="background: var(--light); margin: 0 5px 5px 0;">
                            <i class="fas fa-map-marker-alt"></i> ${city}
                        </span>
                    `).join('')}
                </div>
                
                <button class="btn btn-outline" onclick="applyRecommendation(${JSON.stringify(rec.filters).replace(/"/g, '&quot;')})" style="width: 100%;">
                    <i class="fas fa-magic"></i> Εφαρμογή Φίλτρων
                </button>
            </div>
        `;
    });
    
    resultsDiv.innerHTML = `<div class="grid grid-4">${html}</div>`;
}

function applyRecommendation(filters) {
    Object.keys(filters).forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.value = filters[filterId];
        }
    });
    
    // Αυτόματη αναζήτηση με τα φίλτρα
    setTimeout(() => filterDestinations(), 300);
}

// ==================== QUICK FILTER BUTTONS ====================
function showPopularDestinations() {
    document.getElementById('theme-parks').value = '';
    document.getElementById('cost-level').value = '';
    document.getElementById('distance').value = '3.5';
    filterDestinations();
}

function showBudgetDestinations() {
    document.getElementById('cost-level').value = 'Οικονομικό';
    document.getElementById('distance').value = '2.5';
    document.getElementById('theme-parks').value = '';
    filterDestinations();
}

function showFamilyDestinations() {
    document.getElementById('travel-type').value = 'Οικογένεια';
    document.getElementById('theme-parks').value = 'has-parks';
    document.getElementById('cost-level').value = 'Μέτριο';
    document.getElementById('days-stay').value = '5';
    filterDestinations();
}

// Προσθήκη στο window object
window.showQuickRecommendations = showQuickRecommendations;
window.applyRecommendation = applyRecommendation;
window.showPopularDestinations = showPopularDestinations;
window.showBudgetDestinations = showBudgetDestinations;
window.showFamilyDestinations = showFamilyDestinations;
