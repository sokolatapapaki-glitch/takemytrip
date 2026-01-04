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
    if (saved) {
        const data = JSON.parse(saved);
        
        if (data.selectedDestinationName) {
            state.selectedDestination = data.selectedDestinationName;
            document.getElementById('current-destination-display').textContent = state.selectedDestination;
        }
        
        if (data.selectedBudget) {
            state.selectedBudget = data.selectedBudget;
            document.getElementById('budget-total').textContent = state.selectedBudget + '€';
        }
        
        if (data.familyMembers) {
            state.familyMembers = data.familyMembers;
        }
        
        if (data.selectedActivities) {
            state.selectedActivities = data.selectedActivities;
        }
        
        console.log('📂 Φορτώθηκαν αποθηκευμένα δεδομένα');
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
                
                <div class="form-group">
                    <label class="form-label">Κόστος</label>
                    <select class="form-control" id="cost-level">
                        <option value="">Όλα</option>
                        <option value="Οικονομικό">💰 Οικονομικό</option>
                        <option value="Μέτριο">💰💰 Μέτριο</option>
                        <option value="Ακριβό">💰💰💰 Ακριβό</option>
                    </select>
                </div>
                
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
            
            <div class="form-group">
                <label class="form-label">Προϋπολογισμός Ταξιδιού (προαιρετικό)</label>
                <input type="number" class="form-control" id="travel-budget" placeholder="π.χ. 500">
                <small class="text-muted">Βάλτε το συνολικό ποσό που θέλετε να ξοδέψετε</small>
            </div>
            
            <div style="display: flex; gap: 15px; margin-top: 30px;">
<button class="btn btn-primary" onclick="filterDestinations()">
<i class="fas fa-search"></i> Αναζήτηση Προορισμών
                </button>
                <button class="btn btn-outline" onclick="resetFilters()">
                    <i class="fas fa-redo"></i> Επαναφορά
                </button>
            </div>
        </div>
        
        <div id="destination-results" class="grid grid-3" style="margin-top: 20px;"></div>
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
    console.log('🔍 Αναζήτηση προορισμών...');
    
    const travelType = document.getElementById('travel-type').value;
    const vacationType = document.getElementById('vacation-type').value;
    const daysStay = document.getElementById('days-stay').value;
    const budget = document.getElementById('travel-budget').value;
    
    if (daysStay) state.selectedDays = parseInt(daysStay);
    if (budget) {
        state.selectedBudget = parseInt(budget);
        updateBudgetTracker();
    }
    
    const resultsDiv = document.getElementById('destination-results');
    resultsDiv.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
            <div class="loading">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p>Φόρτωση προορισμών...</p>
            </div>
        </div>
    `;
    
    // Στοιχειώδης λίστα πόλεων (με βάση τα JSON αρχεία που έχετε)
const cities = [
    { id: 'amsterdam', name: 'Άμστερνταμ', emoji: '🌷', category: 'πόλη' },
    { id: 'berlin', name: 'Βερολίνο', emoji: '🇩🇪', category: 'πόλη' },
    { id: 'budapest', name: 'Βουδαπέστη', emoji: '🏰', category: 'πόλη' },
    { id: 'istanbul', name: 'Κωνσταντινούπολη', emoji: '🕌', category: 'πόλη' },
    { id: 'lisbon', name: 'Λισαβόνα', emoji: '🏖️', category: 'πόλη' },
    { id: 'london', name: 'Λονδίνο', emoji: '🇬🇧', category: 'πόλη' },
    { id: 'madrid', name: 'Μαδρίτη', emoji: '🇪🇸', category: 'πόλη' },
    { id: 'paris', name: 'Παρίσι', emoji: '🗼', category: 'πόλη' },
    { id: 'prague', name: 'Πράγα', emoji: '🏰', category: 'πόλη' },
    { id: 'vienna', name: 'Βιέννη', emoji: '🎻', category: 'πόλη' }
];
    
    let html = '';
    
    for (const city of cities) {
        try {
            // Προσπάθεια φόρτωσης του JSON
            const response = await fetch(`data/${city.id}.json`);
            const cityData = await response.json();
            
            html += `
                <div class="destination-card" onclick="selectDestination('${city.name}', '${city.id}')">
                    <div style="font-size: 48px; text-align: center; margin-bottom: 15px;">
                        ${city.emoji}
                    </div>
                    <h3>${city.name}</h3>
                    <p><i class="fas fa-globe-europe"></i> ${cityData.country || cityData.city || 'Ευρώπη'}</p>
                    
                    <div style="margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--gray);">Δραστηριότητες:</span>
                            <strong>${cityData.activities ? cityData.activities.length : 'N/A'}</strong>
                        </div>
                    </div>
                    
                    <div class="tags" style="margin-top: 15px;">
                        <span class="tag tag-primary">${city.category}</span>
                        <span class="tag tag-secondary">${cityData.currency || 'EUR'}</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.log(`Δεν βρέθηκε ${city.id}.json, χρήση προεπιλογής`);
            html += `
                <div class="destination-card" onclick="selectDestination('${city.name}', '${city.id}')">
                    <div style="font-size: 48px; text-align: center; margin-bottom: 15px;">
                        ${city.emoji}
                    </div>
                    <h3>${city.name}</h3>
                    <p><i class="fas fa-globe-europe"></i> Ευρώπη</p>
                    <div class="tags" style="margin-top: 15px;">
                        <span class="tag tag-primary">${city.category}</span>
                    </div>
                </div>
            `;
        }
    }
    
    resultsDiv.innerHTML = html;
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
    activitiesList.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Φόρτωση δραστηριοτήτων...</p></div>';
    
    try {
        // Φόρτωση των δεδομένων από το JSON
        const response = await fetch(`data/${state.selectedDestinationId}.json`);
        const cityData = await response.json();
        
        state.currentCityActivities = cityData.activities || [];
        
        let html = '';
        state.currentCityActivities.forEach((activity, index) => {
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
        updateActivitiesTotal();
        
    } catch (error) {
        console.error('❌ Σφάλμα φόρτωσης δραστηριοτήτων:', error);
        activitiesList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    Δεν ήταν δυνατή η φόρτωση των δραστηριοτήτων.
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
    if (!state.selectedDestination) return;
    
    setTimeout(() => {
        initializeMap();
    }, 100);
}

function initializeMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    mapElement.innerHTML = '';
    
    try {
        if (typeof L === 'undefined') {
            throw new Error('Η βιβλιοθήκη Leaflet δεν φορτώθηκε');
        }
        
        travelMap = L.map('map').setView([52.3676, 4.9041], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(travelMap);
        
        L.marker([52.3676, 4.9041])
            .addTo(travelMap)
            .bindPopup(`<b>${state.selectedDestination}</b><br>${state.selectedActivities.length} δραστηριότητες`)
            .openPopup();
        
        L.control.zoom({ position: 'topright' }).addTo(travelMap);
        
    } catch (error) {
        mapElement.innerHTML = `
            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: white; padding: 20px; text-align: center; border-radius: 10px;">
                <i class="fas fa-map-marked-alt" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h3>${state.selectedDestination}</h3>
                <p style="margin: 15px 0;">Ο χάρτης δεν μπόρεσε να φορτωθεί</p>
                <button onclick="reloadMap()" class="btn btn-primary" style="margin-top: 20px; background: white; color: var(--primary); border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Δοκιμάστε ξανά
                </button>
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

console.log('✅ Script.js loaded successfully!');
