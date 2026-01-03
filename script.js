// ==================== GLOBAL STATE ====================
const state = {
    selectedDestination: null,
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
    if (saved) {
        const data = JSON.parse(saved);
        
        // Επαναφορά προορισμού
        if (data.selectedDestinationName) {
            state.selectedDestination = data.selectedDestinationName;
            document.getElementById('current-destination-display').textContent = state.selectedDestination;
        }
        
        // Επαναφορά budget
        if (data.selectedBudget) {
            state.selectedBudget = data.selectedBudget;
            document.getElementById('budget-total').textContent = state.selectedBudget + '€';
        }
        
        // Επαναφορά οικογένειας
        if (data.familyMembers) {
            state.familyMembers = data.familyMembers;
        }
        
        console.log('📂 Φορτώθηκαν αποθηκευμένα δεδομένα');
    }
}

// ==================== STEP MANAGEMENT ====================
function setupStepNavigation() {
    // Desktop steps
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', function() {
            const stepName = this.dataset.step;
            showStep(stepName);
        });
    });
    
    // Mobile dropdown
    document.getElementById('mobile-step-selector').addEventListener('change', function() {
        showStep(this.value);
    });
}

function showStep(stepName) {
    console.log(`📱 Εμφάνιση βήματος: ${stepName}`);
    
    // 1. Ενημέρωση state
    state.currentStep = stepName;
    
    // 2. Ενημέρωση UI
    updateStepUI(stepName);
    
    // 3. Φόρτωση περιεχομένου
    loadStepContent(stepName);
    
    // 4. Ενημέρωση mobile selector
    document.getElementById('mobile-step-selector').value = stepName;
    
    // 5. Αποθήκευση
    saveState();
}

function updateStepUI(activeStep) {
    // Καθαρισμός active class
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Προσθήκη active class στο επιλεγμένο
    const activeElement = document.querySelector(`.step[data-step="${activeStep}"]`);
    if (activeElement) {
        activeElement.classList.add('active');
    }
}

function loadStepContent(stepName) {
    const stepContent = document.getElementById('step-content');
    
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
            setupMapStep();
            break;
    }
}

// ==================== STEP 1: DESTINATION ====================
function getDestinationStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-map-marked-alt"></i> Επιλογή Προορισμού</h1>
            <p class="card-subtitle">Βρείτε την τέλεια πόλη για τις οικογενειακές σας διακοπές</p>
            
            <div class="grid grid-3">
                <!-- Φίλτρο 1 -->
                <div class="form-group">
                    <label class="form-label">Τύπος Ταξιδιώτη</label>
                    <select class="form-control" id="travel-type">
                        <option value="">Επιλέξτε...</option>
                        <option value="Μόνος">Μόνος</option>
                        <option value="Ζευγάρι">Ζευγάρι</option>
                        <option value="Οικογένεια">Οικογένεια</option>
                        <option value="Παρέα">Παρέα φίλων</option>
                    </select>
                </div>
                
                <!-- Φίλτρο 2 -->
                <div class="form-group">
                    <label class="form-label">Απόσταση (ώρες)</label>
                    <select class="form-control" id="distance">
                        <option value="">Όλα</option>
                        <option value="1">Έως 1 ώρα</option>
                        <option value="2">Έως 2 ώρες</option>
                        <option value="3">Έως 3 ώρες</option>
                        <option value="4">Έως 4 ώρες</option>
                        <option value="5">Πάνω από 4</option>
                    </select>
                </div>
                
                <!-- Φίλτρο 3 -->
                <div class="form-group">
                    <label class="form-label">Κλιματικές συνθήκες</label>
                    <select class="form-control" id="weather">
                        <option value="">Όλα</option>
                        <option value="Ζεστό">Πιο ζεστό</option>
                        <option value="Ίδιο">Ίδια θερμοκρασία</option>
                        <option value="Κρύο">Πιο κρύο</option>
                        <option value="Χιόνια">Πιθανά χιόνια</option>
                    </select>
                </div>
            </div>
            
            <div class="grid grid-3">
                <!-- Φίλτρο 4 -->
                <div class="form-group">
                    <label class="form-label">Τύπος Διακοπών</label>
                    <select class="form-control" id="vacation-type">
                        <option value="">Όλα</option>
                        <option value="Πολιτισμός">Πολιτισμός & Μουσεία</option>
                        <option value="Φυσική">Φυσική Ομορφία</option>
                        <option value="Θάλασσα">Θαλάσσια & Παραλίες</option>
                        <option value="Πόλη">Αστικές Διακοπές</option>
                        <option value="Βουνό">Βουνό & Χιονοδρομικά</option>
                    </select>
                </div>
                
                <!-- Φίλτρο 5 -->
                <div class="form-group">
                    <label class="form-label">Κόστος</label>
                    <select class="form-control" id="cost-level">
                        <option value="">Όλα</option>
                        <option value="Οικονομικό">💰 Οικονομικό</option>
                        <option value="Μέτριο">💰💰 Μέτριο</option>
                        <option value="Ακριβό">💰💰💰 Ακριβό</option>
                    </select>
                </div>
                
                <!-- Φίλτρο 6 -->
                <div class="form-group">
                    <label class="form-label">Μέρες Διαμονής</label>
                    <select class="form-control" id="days-stay">
                        <option value="">-- Επιλέξτε --</option>
                        <option value="3">3 μέρες</option>
                        <option value="4">4 μέρες</option>
                        <option value="5">5 μέρες</option>
                        <option value="6">6 μέρες</option>
                        <option value="7">7 μέρες</option>
                    </select>
                </div>
            </div>
            
            <!-- Προϋπολογισμός -->
            <div class="form-group">
                <label class="form-label">Προϋπολογισμός Ταξιδιού (προαιρετικό)</label>
                <input type="number" class="form-control" id="travel-budget" placeholder="π.χ. 500">
                <small class="text-muted">Βάλτε το συνολικό ποσό που θέλετε να ξοδέψετε</small>
            </div>
            
            <!-- Κουμπιά -->
            <div style="display: flex; gap: 15px; margin-top: 30px;">
                <button class="btn btn-primary" onclick="filterDestinations()">
                    <i class="fas fa-search"></i> Αναζήτηση Προορισμών
                </button>
                <button class="btn btn-outline" onclick="resetFilters()">
                    <i class="fas fa-redo"></i> Επαναφορά
                </button>
            </div>
        </div>
        
        <!-- Αποτελέσματα -->
        <div id="destination-results" class="grid grid-3" style="margin-top: 20px;"></div>
    `;
}

function setupDestinationStep() {
    // Επαναφορά φίλτρων από state
    if (state.selectedDays > 0) {
        document.getElementById('days-stay').value = state.selectedDays;
    }
    
    if (state.selectedBudget > 0) {
        document.getElementById('travel-budget').value = state.selectedBudget;
    }
    
    // Εμφάνιση προηγούμενων αποτελεσμάτων
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
                
                <!-- Smart Combo Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <button class="btn btn-accent" onclick="calculateSmartCombos()" style="padding: 18px 40px; font-size: 18px;">
                        <i class="fas fa-calculator"></i> Έξυπνος Υπολογισμός Combo
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
                            '<p>Φόρτωση...</p>'}
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
                <!-- Map Container -->
                <div id="map-container" style="height: 500px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px; border: 2px solid var(--border);">
                    <div style="height: 100%; display: flex; align-items: center; justify-content: center; background: #f8f9fa;">
                        <div style="text-align: center;">
                            <i class="fas fa-spinner fa-spin fa-2x" style="color: var(--primary);"></i>
                            <p>Φόρτωση χάρτη...</p>
                            <button class="btn btn-primary" onclick="initializeMap()" style="margin-top: 15px;">
                                <i class="fas fa-sync-alt"></i> Φόρτωση Χάρτη
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Map Controls -->
                <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
                    <button class="btn btn-outline" onclick="initializeMap()">
                        <i class="fas fa-sync-alt"></i> Επαναφόρτωση
                    </button>
                    
                    <button class="btn btn-primary" onclick="addCustomPoint()">
                        <i class="fas fa-plus"></i> Προσθήκη Σημείου
                    </button>
                    
                    <button class="btn btn-secondary" onclick="showCustomPoints()">
                        <i class="fas fa-list"></i> Προβολή Σημείων
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
function setupMobileNavigation() {
    // Μηδενική λειτουργία για τώρα - θα συμπληρωθεί
}

function setupEventListeners() {
    // Reset button
    document.getElementById('reset-all').addEventListener('click', function() {
        if (confirm('⚠️ Θέλετε να διαγράψετε όλα τα δεδομένα;')) {
            localStorage.clear();
            location.reload();
        }
    });
    
    // Budget input
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
    const spent = calculateTotalSpent(); // Αυτή τη συνάρτηση θα την κάνουμε αργότερα
    
    document.getElementById('budget-total').textContent = total + '€';
    document.getElementById('budget-spent').textContent = spent + '€';
    document.getElementById('budget-remaining').textContent = (total - spent) + '€';
    
    const progress = total > 0 ? (spent / total * 100) : 0;
    document.getElementById('budget-progress-bar').style.width = Math.min(progress, 100) + '%';
}

function calculateTotalSpent() {
    // Προσωρινή - θα συμπληρωθεί
    return 0;
}

function saveState() {
    const data = {
        selectedDestinationName: state.selectedDestination,
        selectedDaysStay: state.selectedDays,
        selectedBudget: state.selectedBudget,
        familyMembers: state.familyMembers,
        selectedActivities: state.selectedActivities.map(act => act.name)
    };
    
    localStorage.setItem('travelPlannerData', JSON.stringify(data));
}

// ==================== EXPORTED FUNCTIONS ====================
// Αυτές οι συναρτήσεις θα χρησιμοποιηθούν από άλλα scripts
window.showStep = showStep;
window.filterDestinations = filterDestinations;
window.resetFilters = resetFilters;
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
    showStep('activities'); // Επαναφόρτωση
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

// Προσωρινές συναρτήσεις που θα συμπληρωθούν
window.calculateSmartCombos = function() {
    alert('ℹ️ Η λειτουργία "Έξυπνο Combo" θα είναι διαθέσιμη σύντομα!');
};

window.initializeMap = function() {
    alert('ℹ️ Ο χάρτης θα φορτωθεί σύντομα!');
};

window.addCustomPoint = function() {
    alert('ℹ️ Η προσθήκη σημείου θα είναι διαθέσιμη σύντομα!');
};

window.showCustomPoints = function() {
    alert('ℹ️ Η λίστα σημείων θα είναι διαθέσιμη σύντομα!');
};

window.showRouteBetweenPoints = function() {
    alert('ℹ️ Η δημιουργία διαδρομής θα είναι διαθέσιμη σύντομα!');
};

console.log('✅ Script.js loaded successfully!');
// ============================================
// DESTINATION STEP FUNCTIONS
// ============================================

function filterDestinations(category) {
    console.log(`🔍 Φιλτράρισμα προορισμών: ${category || 'all'}`);
    
    // Πρόσθεσε τον κώδικα για το φιλτράρισμα εδώ
    const destinationResults = document.getElementById('destination-results');
    destinationResults.innerHTML = '<p>Φόρτωση προορισμών...</p>';
    
    // Προσωρινά - θα επιστρέψουμε κάποια δεδομένα
    setTimeout(() => {
        const destinations = [
            { name: 'Θεσσαλονίκη', description: 'Η συμπρωτεύουσα της Ελλάδας', category: 'Πόλη' },
            { name: 'Σαντορίνη', description: 'Τοπ νησί με ηφαίστειο', category: 'Θάλασσα' },
            { name: 'Ζαγοριόχωρια', description: 'Τραditionιαλά χωριά', category: 'Βουνό' }
        ];
        
        let html = '';
        destinations.forEach(dest => {
            if (!category || category === 'all' || dest.category === category) {
                html += `
                    <div class="destination-card" onclick="selectDestination('${dest.name}')">
                        <h3>${dest.name}</h3>
                        <p>${dest.description}</p>
                        <div class="tags">
                            <span class="tag tag-primary">${dest.category}</span>
                        </div>
                    </div>
                `;
            }
        });
        
        destinationResults.innerHTML = html;
    }, 500);
}

function resetFilters() {
    console.log('🔄 Επαναφορά φίλτρων');
    
    // Επαναφορά όλων των dropdown
    document.getElementById('travel-type').value = '';
    document.getElementById('distance').value = '';
    document.getElementById('weather').value = '';
    document.getElementById('vacation-type').value = '';
    document.getElementById('cost-level').value = '';
    document.getElementById('days-stay').value = '';
    document.getElementById('travel-budget').value = '';
    
    // Επαναφορά αποτελεσμάτων
    document.getElementById('destination-results').innerHTML = '';
    
    // Επαναφορά state
    state.selectedDestination = null;
    state.selectedDays = 0;
    state.selectedBudget = 0;
    
    // Ενημέρωση UI
    document.getElementById('current-destination-display').textContent = 'Δεν έχει επιλεγεί';
    updateBudgetTracker();
    saveState();
}

function selectDestination(destinationName) {
    console.log(`📍 Επιλέχθηκε προορισμός: ${destinationName}`);
    
    state.selectedDestination = destinationName;
    state.selectedDays = parseInt(document.getElementById('days-stay').value) || 3;
    state.selectedBudget = parseInt(document.getElementById('travel-budget').value) || 0;
    
    // Ενημέρωση UI
    document.getElementById('current-destination-display').textContent = destinationName;
    
    // Εμφάνιση επιβεβαίωσης
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

// ============================================
// FLIGHT STEP FUNCTIONS
// ============================================

function setupFlightStep() {
    console.log('✈️ Ρύθμιση βήματος πτήσεων');
    
    // Προσθήκη event listeners για αναζήτηση πτήσεων
    const flightDate = document.getElementById('flight-date');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    flightDate.min = today.toISOString().split('T')[0];
    flightDate.value = nextWeek.toISOString().split('T')[0];
}

// ============================================
// HOTEL STEP FUNCTIONS
// ============================================

function setupHotelStep() {
    console.log('🏨 Ρύθμιση βήματος ξενοδοχείων');
    
    // Προσθήκη event listeners για αναζήτηση ξενοδοχείων
    const checkin = document.getElementById('hotel-checkin');
    const checkout = document.getElementById('hotel-checkout');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tenDays = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);
    
    checkin.min = today.toISOString().split('T')[0];
    checkout.min = today.toISOString().split('T')[0];
    
    checkin.value = nextWeek.toISOString().split('T')[0];
    checkout.value = tenDays.toISOString().split('T')[0];
    
    // Αυτόματη ενημέρωση checkout όταν αλλάζει το checkin
    checkin.addEventListener('change', function() {
        const checkinDate = new Date(this.value);
        const newCheckout = new Date(checkinDate.getTime() + 3 * 24 * 60 * 60 * 1000);
        checkout.value = newCheckout.toISOString().split('T')[0];
        checkout.min = this.value;
    });
}

function searchHotels() {
    console.log('🔍 Αναζήτηση ξενοδοχείων');
    
    const destination = document.getElementById('hotel-destination').value;
    const checkin = document.getElementById('hotel-checkin').value;
    const checkout = document.getElementById('hotel-checkout').value;
    
    if (!destination) {
        alert('⚠️ Παρακαλώ επιλέξτε προορισμό πρώτα');
        return;
    }
    
    // Δημιουργία booking.com link
    const bookingUrl = `https://www.booking.com/searchresults.el.html?ss=${encodeURIComponent(destination)}&checkin=${checkin}&checkout=${checkout}`;
    
    // Άνοιγμα σε νέα καρτέλα
    window.open(bookingUrl, '_blank');
}

// ============================================
// ACTIVITIES STEP FUNCTIONS
// ============================================

function setupActivitiesStep() {
    console.log('🎯 Ρύθμιση βήματος δραστηριοτήτων');
    
    if (!state.selectedDestination) {
        console.log('⚠️ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    // Προσομοίωση φόρτωσης δραστηριοτήτων
    const activitiesList = document.getElementById('activities-list');
    activitiesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Φόρτωση δραστηριοτήτων...</p></div>';
    
    setTimeout(() => {
        const activities = [
            { 
                name: 'Πεζοπορία στο κέντρο', 
                description: 'Περιηγηθείτε στα σημαντικότερα αξιοθέατα', 
                emoji: '🚶',
                prices: { adult: 15, child: 8 }
            },
            { 
                name: 'Επισκέψη σε μουσείο', 
                description: 'Γνωρίστε την ιστορία της περιοχής', 
                emoji: '🏛️',
                prices: { adult: 10, child: 5 }
            },
            { 
                name: 'Βόλτα με ποδήλατο', 
                description: 'Εξερευνήστε την πόλη με άλλο τρόπο', 
                emoji: '🚲',
                prices: { adult: 12, child: 7 }
            },
            { 
                name: 'Γευστικό τουρ', 
                description: 'Δοκιμάστε τα τοπικά εδέσματα', 
                emoji: '🍽️',
                prices: { adult: 25, child: 15 }
            },
            { 
                name: 'Παραλία', 
                description: 'Ξεκούραση σε παραλία κοντά', 
                emoji: '🏖️',
                prices: { adult: 0, child: 0 }
            },
            { 
                name: 'Εκδρομή στα προάστια', 
                description: 'Επισκεφτείτε γειτονικές περιοχές', 
                emoji: '🚌',
                prices: { adult: 30, child: 20 }
            }
        ];
        
        let html = '';
        activities.forEach(activity => {
            const totalCost = (activity.prices.adult * 2) + (activity.prices.child * Math.max(0, state.familyMembers.length - 2));
            
            html += `
                <div class="activity-card" onclick="toggleActivitySelection('${activity.name}')">
                    <div class="activity-header">
                        <div class="activity-emoji">${activity.emoji}</div>
                        <div class="activity-title">${activity.name}</div>
                        <div class="activity-star">⭐</div>
                    </div>
                    <div class="activity-description">${activity.description}</div>
                    
                    <table class="price-table">
                        <tr>
                            <th>Ενήλικας</th>
                            <th>Παιδί</th>
                            <th>Οικογένεια</th>
                        </tr>
                        <tr>
                            <td>${activity.prices.adult}€</td>
                            <td>${activity.prices.child}€</td>
                            <td><strong>${totalCost}€</strong></td>
                        </tr>
                    </table>
                    
                    <div class="activity-total" id="total-${activity.name.replace(/\s+/g, '-')}">
                        ${totalCost}€ για ${state.familyMembers.length} άτομα
                    </div>
                </div>
            `;
        });
        
        activitiesList.innerHTML = html;
        updateActivitiesTotal();
    }, 1000);
}

function toggleActivitySelection(activityName) {
    const activityCard = document.querySelector(`.activity-card:has(.activity-title:contains("${activityName}"))`);
    
    if (activityCard) {
        activityCard.classList.toggle('selected');
        
        // Προσθήκη/Αφαίρεση από selectedActivities
        const index = state.selectedActivities.findIndex(a => a.name === activityName);
        
        if (index === -1) {
            state.selectedActivities.push({ name: activityName, selected: true });
        } else {
            state.selectedActivities.splice(index, 1);
        }
        
        updateActivitiesTotal();
        saveState();
    }
}

function updateActivitiesTotal() {
    let total = 0;
    
    // Υπολογισμός συνολικού κόστους
    state.selectedActivities.forEach(activity => {
        // Προσθήκη σταθερής τιμής για κάθε δραστηριότητα
        total += 20; // Βασικό κόστος ανά δραστηριότητα
    });
    
    // Προσθήκη κόστους ανά άτομο
    total += state.familyMembers.length * 10;
    
    // Ενημέρωση UI
    document.getElementById('activities-total').textContent = total + '€';
    
    // Ενημέρωση budget tracker
    state.selectedBudget = Math.max(state.selectedBudget, total + 200); // +200 για πτήση/ξενοδοχείο
    updateBudgetTracker();
}

// ============================================
// SUMMARY STEP FUNCTIONS
// ============================================

function setupSummaryStep() {
    console.log('📋 Ρύθμιση βήματος σύνοψης');
    
    if (!state.selectedDestination) {
        return;
    }
    
    // Ενημέρωση επιλεγμένων δραστηριοτήτων
    const selectedList = document.getElementById('selected-activities-list');
    
    if (state.selectedActivities.length === 0) {
        selectedList.innerHTML = '<p style="text-align: center; color: var(--gray);"><i class="fas fa-info-circle"></i> Δεν έχετε επιλέξει δραστηριότητες ακόμα</p>';
    } else {
        let html = '<ul style="list-style: none; padding: 0;">';
        state.selectedActivities.forEach(activity => {
            html += `<li style="padding: 10px; background: white; margin-bottom: 10px; border-radius: 8px;">
                        <i class="fas fa-check-circle" style="color: var(--success); margin-right: 10px;"></i>
                        ${activity.name}
                     </li>`;
        });
        html += '</ul>';
        selectedList.innerHTML = html;
    }
    
    // Δημιουργία ημερήσιου προγράμματος
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
                        <li>Επισκέψη σε τοπικό αξιοθέατο</li>
                        <li>Καφές σε παραδοσιακό καφενείο</li>
                    </ul>
                </div>
                
                <div class="time-slot">
                    <h5>☀️ Μεσημέρι (12:00 - 17:00)</h5>
                    <ul>
                        <li>Γεύμα σε τοπικό εστιατόριο</li>
                        ${i === 1 ? '<li>Περίπατος στο κέντρο της πόλης</li>' : ''}
                        ${i === 2 && state.selectedActivities.length > 0 ? `<li>${state.selectedActivities[0]?.name || 'Επιλεγμένη δραστηριότητα'}</li>` : ''}
                        <li>Ξεκούραση</li>
                    </ul>
                </div>
                
                <div class="time-slot">
                    <h5>🌙 Βράδυ (17:00 - 22:00)</h5>
                    <ul>
                        <li>Βόλτα για ψώνια</li>
                        <li>Δείπνο με τοπικές σπεσιαλιτέ</li>
                        ${i < days ? '<li>Προγραμματισμός για την επόμενη μέρα</li>' : '<li>Αναχώρηση</li>'}
                    </ul>
                </div>
            </div>
        `;
    }
    
    dailyProgram.innerHTML = html;
}

// ============================================
// MAP STEP FUNCTIONS
// ============================================

function setupMapStep() {
    console.log('🗺️ Ρύθμιση βήματος χάρτη');
    
    if (!state.selectedDestination) {
        return;
    }
    
    // Αρχικοποίηση χάρτη μετά από μικρή καθυστέρηση
    setTimeout(initializeMap, 500);
}

let map = null;

function initializeMap() {
    console.log('🌍 Αρχικοποίηση χάρτη');
    
    const mapContainer = document.getElementById('map-container');
    
    if (!state.selectedDestination) {
        mapContainer.innerHTML = '<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> Δεν υπάρχει επιλεγμένος προορισμός</div>';
        return;
    }
    
    // Προσπάθεια φόρτωσης Leaflet χάρτη
    try {
        mapContainer.innerHTML = '<div id="map" style="height: 100%;"></div>';
        
        // Προσθήκη demo χάρτη (χωρίς πραγματικό Leaflet)
        mapContainer.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                <i class="fas fa-map-marked-alt" style="font-size: 60px; margin-bottom: 20px;"></i>
                <h2 style="margin-bottom: 10px;">Διαδραστικός Χάρτης</h2>
                <p style="margin-bottom: 20px;">Χάρτης για: ${state.selectedDestination}</p>
                <p style="font-size: 14px; opacity: 0.9;">ℹ️ Η πλήρης λειτουργία χάρτη θα είναι διαθέσιμη σύντομα</p>
                
                <div style="display: flex; gap: 10px; margin-top: 30px;">
                    <button class="btn btn-primary" onclick="alert('📍 Προστέθηκε σημείο στο χάρτη')">
                        <i class="fas fa-plus"></i> Προσθήκη Σημείου
                    </button>
                    <button class="btn btn-secondary" onclick="alert('🗺️ Εμφάνιση διαδρομής')">
                        <i class="fas fa-route"></i> Διαδρομή
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Σφάλμα φόρτωσης χάρτη:', error);
        mapContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle"></i>
                Δεν ήταν δυνατή η φόρτωση του χάρτη. Παρακαλώ δοκιμάστε ξανά.
            </div>
        `;
    }
}

// ============================================
// Εξαγωγή συναρτήσεων στο global scope
// ============================================

// Εξαγωγή όλων των συναρτήσεων που χρειάζονται από το HTML
window.filterDestinations = filterDestinations;
window.resetFilters = resetFilters;
window.selectDestination = selectDestination;
window.searchHotels = searchHotels;
window.setupFlightStep = setupFlightStep;
window.setupHotelStep = setupHotelStep;
window.setupActivitiesStep = setupActivitiesStep;
window.setupSummaryStep = setupSummaryStep;
window.setupMapStep = setupMapStep;
window.initializeMap = initializeMap;

// Οι υπόλοιπες συναρτήσεις είναι ήδη exported στο τέλος του υπάρχοντος κώδικα

console.log('✅ Όλες οι απαραίτητες συναρτήσεις φορτώθηκαν!');
