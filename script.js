// ==================== ΚΕΝΤΡΙΚΟΣ ΚΩΔΙΚΑΣ - ΟΡΓΑΝΩΤΗΣ ΤΑΞΙΔΙΟΥ ====================
// Αποθηκεύετε ως: script.js

console.log('🚀 Οργανωτής Ταξιδιού - Ξεκίνημα!');

// ==================== GLOBAL VARIABLES ====================
const APP_STATE = {
    currentStep: 'destination',
    destination: localStorage.getItem('travel_destination') || '',
    familyMembers: JSON.parse(localStorage.getItem('travel_family')) || [],
    selectedActivities: JSON.parse(localStorage.getItem('travel_activities')) || [],
    budget: parseInt(localStorage.getItem('travel_budget')) || 0,
    days: parseInt(localStorage.getItem('travel_days')) || 0,
    hotel: JSON.parse(localStorage.getItem('travel_hotel')) || null,
    flight: JSON.parse(localStorage.getItem('travel_flight')) || null
};

// ==================== ΠΟΛΕΙΣ ΔΕΔΟΜΕΝΩΝ ====================
const CITIES = [
    {
        name: "Βιέννη", 
        dist: 2, 
        weather: "Πιο κρύο", 
        themeparks: "Ναι", 
        christmas: "Ναι", 
        vacationType: ["Πολιτισμός", "Πόλη"], 
        costLevel: "Μέτριο", 
        suitableFor: ["Νεογέννητα", "Παιδικό", "ΑΜΕΑ", "Ηλικιωμένοι"], 
        desc: "Η αυτοκρατορική πόλη με τα παλάτια, τους κήπους και τα νόστιμα schnitzel.",
        country: "Αυστρία",
        coordinates: { lat: 48.2082, lng: 16.3738 }
    },
    {
        name: "Παρίσι", 
        dist: 3, 
        weather: "Ίδια", 
        themeparks: "Ναι", 
        christmas: "Ναι", 
        vacationType: ["Πολιτισμός", "Πόλη"], 
        costLevel: "Ακριβό", 
        suitableFor: ["Νεογέννητα", "Παιδικό"], 
        desc: "Η ρομαντική πόλη του φωτός με τον Πύργο του Άιφελ και τα όμορφα καφέ.",
        country: "Γαλλία",
        coordinates: { lat: 48.8566, lng: 2.3522 }
    },
    {
        name: "Λονδίνο", 
        dist: 4, 
        weather: "Πιο κρύο", 
        themeparks: "Ναι", 
        christmas: "Ναι", 
        vacationType: ["Πόλη", "Πολιτισμός"], 
        costLevel: "Ακριβό", 
        suitableFor: ["Νεογέννητα", "Παιδικό", "ΑΜΕΑ"], 
        desc: "Η μεγαλούπολη με το Μπιγκ Μπεν, το London Eye και τα ιστορικά μουσεία.",
        country: "Ηνωμένο Βασίλειο",
        coordinates: { lat: 51.5074, lng: -0.1278 }
    },
    {
        name: "Βερολίνο", 
        dist: 3, 
        weather: "Πιο κρύο", 
        themeparks: "Όχι", 
        christmas: "Ναι", 
        vacationType: ["Πόλη", "Πολιτισμός"], 
        costLevel: "Μέτριο", 
        suitableFor: ["Νεογέννητα", "Παιδικό", "ΑΜΕΑ"], 
        desc: "Πόλη με πλούσια ιστορία, μουσεία και μοντέρνα αρχιτεκτονική.",
        country: "Γερμανία",
        coordinates: { lat: 52.5200, lng: 13.4050 }
    },
    {
        name: "Λισαβόνα", 
        dist: 4, 
        weather: "Πιο ζεστό", 
        themeparks: "Όχι", 
        christmas: "Όχι", 
        vacationType: ["Θάλασσα", "Πόλη"], 
        costLevel: "Οικονομικό", 
        suitableFor: ["Νεογέννητα", "Παιδικό"], 
        desc: "Πορτογαλική πρωτεύουσα με γραφικά τελεφερίκ και όμορφα ακρωτήρια.",
        country: "Πορτογαλία",
        coordinates: { lat: 38.7223, lng: -9.1393 }
    },
    {
        name: "Βουδαπέστη", 
        dist: 2, 
        weather: "Πιο κρύο", 
        themeparks: "Όχι", 
        christmas: "Ναι", 
        vacationType: ["Πολιτισμός", "Πόλη"], 
        costLevel: "Οικονομικό", 
        suitableFor: ["Νεογέννητα", "Παιδικό", "Ηλικιωμένοι"], 
        desc: "Η όμορφη πόλη του Δούναβη με τα ιστορικά λουτρά και κάστρα.",
        country: "Ουγγαρία",
        coordinates: { lat: 47.4979, lng: 19.0402 }
    },
    {
        name: "Ρώμη", 
        dist: 2, 
        weather: "Πιο ζεστό", 
        themeparks: "Ναι", 
        christmas: "Ναι", 
        vacationType: ["Πολιτισμός", "Πόλη"], 
        costLevel: "Μέτριο", 
        suitableFor: ["Νεογέννητα", "Παιδικό"], 
        desc: "Η αιώνια πόλη με το Κολοσσαίο, την Ρωμαϊκή Αγορά και υπέροχη ιταλική κουζίνα.",
        country: "Ιταλία",
        coordinates: { lat: 41.9028, lng: 12.4964 }
    }
];

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Εφαρμογή φορτώθηκε');
    
    // Αρχικοποίηση
    initApp();
    
    // Event Listeners
    setupEventListeners();
    
    // Εμφάνιση πρώτου βήματος
    navigateToStep(APP_STATE.currentStep);
    
    // Ενημέρωση UI
    updateUI();
});

function initApp() {
    // Ενημέρωση destination display
    if (APP_STATE.destination) {
        document.getElementById('current-destination-display').textContent = APP_STATE.destination;
    }
    
    // Φόρτωση budget
    updateBudgetTracker();
    
    // Mobile step selector
    const mobileSelector = document.getElementById('mobile-step-selector');
    if (mobileSelector) {
        mobileSelector.value = APP_STATE.currentStep;
    }
}

function setupEventListeners() {
    // Sidebar steps
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', function() {
            const stepId = this.dataset.step;
            navigateToStep(stepId);
        });
    });
    
    // Mobile selector
    const mobileSelector = document.getElementById('mobile-step-selector');
    if (mobileSelector) {
        mobileSelector.addEventListener('change', function() {
            navigateToStep(this.value);
        });
    }
    
    // Reset button
    document.getElementById('reset-all').addEventListener('click', resetAllData);
}

// ==================== NAVIGATION ====================
function navigateToStep(stepId) {
    console.log(`➡️ Μετάβαση στο βήμα: ${stepId}`);
    
    // Ενημέρωση state
    APP_STATE.currentStep = stepId;
    
    // Ενημέρωση UI
    updateStepNavigation(stepId);
    
    // Φόρτωση περιεχομένου
    loadStepContent(stepId);
    
    // Αποθήκευση
    saveToLocalStorage();
}

function updateStepNavigation(stepId) {
    // Ενημέρωση sidebar
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
        if (step.dataset.step === stepId) {
            step.classList.add('active');
        }
    });
    
    // Ενημέρωση mobile selector
    const mobileSelector = document.getElementById('mobile-step-selector');
    if (mobileSelector) {
        mobileSelector.value = stepId;
    }
}

function loadStepContent(stepId) {
    const contentContainer = document.getElementById('step-content');
    
    // Show loading
    showLoading();
    
    // Load content based on step
    setTimeout(() => {
        switch(stepId) {
            case 'destination':
                contentContainer.innerHTML = renderStepDestination();
                setupDestinationStep();
                break;
            case 'flight':
                contentContainer.innerHTML = renderStepFlight();
                break;
            case 'hotel':
                contentContainer.innerHTML = renderStepHotel();
                break;
            case 'activities':
                contentContainer.innerHTML = renderStepActivities();
                setupActivitiesStep();
                break;
            case 'summary':
                contentContainer.innerHTML = renderStepSummary();
                break;
            case 'map':
                contentContainer.innerHTML = renderStepMap();
                break;
            default:
                contentContainer.innerHTML = '<h1>Σφάλμα</h1><p>Το βήμα δεν βρέθηκε.</p>';
        }
        
        hideLoading();
    }, 300);
}

// ==================== STEP 1: DESTINATION ====================
function renderStepDestination() {
    return `
        <div class="destination-step">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-map-marked-alt"></i>
                    Επιλογή Προορισμού
                </div>
                <p class="card-subtitle">Βρείτε την τέλεια πόλη για τις οικογενειακές σας διακοπές</p>
                
                <!-- QUICK SELECT -->
                <div class="quick-select" style="margin-bottom: 30px;">
                    <h3 style="margin-bottom: 15px; color: var(--dark);">
                        <i class="fas fa-bolt"></i> Γρήγορη Επιλογή
                    </h3>
                    <div class="grid grid-4" id="quick-cities">
                        ${CITIES.slice(0, 8).map(city => `
                            <div class="city-quick-card" onclick="selectDestinationQuick('${city.name}')">
                                <div class="city-flag">${getFlagEmoji(city.country)}</div>
                                <h4>${city.name}</h4>
                                <p>${city.dist} ώρες</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- FILTERS -->
                <div class="filters-section">
                    <h3 style="margin-bottom: 20px; color: var(--dark);">
                        <i class="fas fa-filter"></i> Φίλτρα Αναζήτησης
                    </h3>
                    
                    <div class="grid grid-2">
                        <!-- ΑΡΙΣΤΕΡΗ ΣΤΗΛΗ -->
                        <div>
                            <div class="form-group">
                                <label class="form-label">👤 Τύπος ταξιδιώτη</label>
                                <select class="form-control" id="filter-traveler">
                                    <option value="">Όλα</option>
                                    <option value="Μόνος">Μόνος</option>
                                    <option value="Ζευγάρι">Ζευγάρι</option>
                                    <option value="Οικογένεια">Οικογένεια</option>
                                    <option value="Παρέα">Παρέα φίλων</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">📏 Απόσταση σε ώρες</label>
                                <select class="form-control" id="filter-distance">
                                    <option value="">Όλες</option>
                                    <option value="1">Έως 1 ώρα</option>
                                    <option value="2">Έως 2 ώρες</option>
                                    <option value="3">Έως 3 ώρες</option>
                                    <option value="4">Έως 4 ώρες</option>
                                    <option value="5">Πάνω από 4 ώρες</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">🌡️ Θερμοκρασία</label>
                                <select class="form-control" id="filter-weather">
                                    <option value="">Όλα</option>
                                    <option value="Πιο ζεστό">Πιο ζεστό από Ελλάδα</option>
                                    <option value="Ίδια">Ίδια θερμοκρασία</option>
                                    <option value="Πιο κρύο">Πιο κρύο</option>
                                    <option value="Χιόνια">Πιθανά χιόνια</option>
                                </select>
                            </div>
                        </div>
                        
                        <!-- ΔΕΞΙΑ ΣΤΗΛΗ -->
                        <div>
                            <div class="form-group">
                                <label class="form-label">🎢 Θεματικά Πάρκα</label>
                                <select class="form-control" id="filter-themeparks">
                                    <option value="">Αδιάφορο</option>
                                    <option value="Ναι">Ναι</option>
                                    <option value="Όχι">Όχι</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">🎄 Χριστουγεννιάτικες Αγορές</label>
                                <select class="form-control" id="filter-christmas">
                                    <option value="">Αδιάφορο</option>
                                    <option value="Ναι">Ναι</option>
                                    <option value="Όχι">Όχι</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">💰 Επίπεδο Κόστους</label>
                                <select class="form-control" id="filter-cost">
                                    <option value="">Όλα</option>
                                    <option value="Οικονομικό">💰 Οικονομικό</option>
                                    <option value="Μέτριο">💰💰 Μέτριο</option>
                                    <option value="Ακριβό">💰💰💰 Ακριβό</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <!-- ΚΟΥΜΠΙΑ -->
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button class="btn btn-primary" onclick="applyFilters()">
                            <i class="fas fa-search"></i> Εφαρμογή Φίλτρων
                        </button>
                        <button class="btn btn-outline" onclick="resetFilters()">
                            <i class="fas fa-redo"></i> Επαναφορά
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- RESULTS -->
            <div id="cities-results" class="grid grid-3">
                ${renderAllCities()}
            </div>
            
            <!-- BUDGET INPUT -->
            <div class="card" style="margin-top: 30px;">
                <h3 style="margin-bottom: 15px;">
                    <i class="fas fa-wallet"></i> Προϋπολογισμός Ταξιδιού (προαιρετικό)
                </h3>
                <div style="display: flex; gap: 15px; align-items: center;">
                    <input type="number" id="travel-budget" class="form-control" placeholder="Ποσό σε €" 
                           value="${APP_STATE.budget || ''}" style="flex: 1;">
                    <select id="travel-days" class="form-control" style="width: 200px;">
                        <option value="">Διάρκεια διακοπών</option>
                        ${[3,4,5,6,7].map(days => `
                            <option value="${days}" ${APP_STATE.days === days ? 'selected' : ''}>
                                ${days} μέρες
                            </option>
                        `).join('')}
                    </select>
                    <button class="btn btn-secondary" onclick="saveBudgetAndDays()">
                        <i class="fas fa-save"></i> Αποθήκευση
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderAllCities() {
    return CITIES.map(city => `
        <div class="city-card card" data-city="${city.name}">
            <div class="city-header">
                <div class="city-flag-large">${getFlagEmoji(city.country)}</div>
                <div>
                    <h3>${city.name}</h3>
                    <p class="city-country">${city.country}</p>
                </div>
            </div>
            
            <p class="city-description">${city.desc}</p>
            
            <div class="city-tags">
                <span class="tag tag-primary">📏 ${city.dist} ώρες</span>
                <span class="tag tag-${city.costLevel === 'Οικονομικό' ? 'accent' : city.costLevel === 'Μέτριο' ? 'primary' : 'secondary'}">
                    ${city.costLevel}
                </span>
                ${city.themeparks === 'Ναι' ? '<span class="tag tag-accent">🎢 Θεματικό Πάρκο</span>' : ''}
                ${city.christmas === 'Ναι' ? '<span class="tag tag-primary">🎄 Χριστουγεννιάτικες Αγορές</span>' : ''}
            </div>
            
            <div style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="selectDestination('${city.name}')" style="width: 100%;">
                    <i class="fas fa-check-circle"></i> Επιλογή Προορισμού
                </button>
            </div>
        </div>
    `).join('');
}

function setupDestinationStep() {
    // Εάν υπάρχει προορισμός, highlight
    if (APP_STATE.destination) {
        highlightSelectedCity(APP_STATE.destination);
    }
}

function selectDestinationQuick(cityName) {
    selectDestination(cityName);
}

function selectDestination(cityName) {
    const city = CITIES.find(c => c.name === cityName);
    if (!city) return;
    
    APP_STATE.destination = cityName;
    
    // Update UI
    document.getElementById('current-destination-display').textContent = cityName;
    highlightSelectedCity(cityName);
    
    // Show confirmation
    showNotification(`✅ Επιλέξατε: ${cityName}`, 'success');
    
    // Auto-save
    saveToLocalStorage();
    
    // Auto-navigate to next step after delay
    setTimeout(() => {
        navigateToStep('flight');
    }, 1500);
}

function highlightSelectedCity(cityName) {
    // Remove previous selection
    document.querySelectorAll('.city-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to current
    const cityCard = document.querySelector(`.city-card[data-city="${cityName}"]`);
    if (cityCard) {
        cityCard.classList.add('selected');
        cityCard.style.border = '2px solid var(--primary)';
        cityCard.style.boxShadow = '0 0 0 3px rgba(62, 180, 137, 0.1)';
    }
}

function applyFilters() {
    const traveler = document.getElementById('filter-traveler').value;
    const distance = document.getElementById('filter-distance').value;
    const weather = document.getElementById('filter-weather').value;
    const themeparks = document.getElementById('filter-themeparks').value;
    const christmas = document.getElementById('filter-christmas').value;
    const cost = document.getElementById('filter-cost').value;
    
    const filtered = CITIES.filter(city => {
        let match = true;
        
        // Distance filter
        if (distance) {
            if (distance === "5") {
                match = match && (city.dist > 4);
            } else {
                match = match && (city.dist <= parseInt(distance));
            }
        }
        
        // Weather filter
        if (weather && weather !== "") {
            match = match && (city.weather === weather);
        }
        
        // Themeparks filter
        if (themeparks && themeparks !== "") {
            if (themeparks === "Ναι") {
                match = match && (city.themeparks === "Ναι");
            } else if (themeparks === "Όχι") {
                match = match && (city.themeparks !== "Ναι");
            }
        }
        
        // Christmas filter
        if (christmas && christmas !== "") {
            if (christmas === "Ναι") {
                match = match && (city.christmas === "Ναι");
            } else if (christmas === "Όχι") {
                match = match && (city.christmas !== "Ναι");
            }
        }
        
        // Cost filter
        if (cost && cost !== "") {
            match = match && (city.costLevel === cost);
        }
        
        return match;
    });
    
    // Display results
    const resultsContainer = document.getElementById('cities-results');
    if (filtered.length === 0) {
        resultsContainer.innerHTML = `
            <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <i class="fas fa-search" style="font-size: 50px; color: var(--gray); margin-bottom: 20px;"></i>
                <h3>Δεν βρέθηκαν πόλεις</h3>
                <p>Δοκιμάστε με διαφορετικά φίλτρα</p>
            </div>
        `;
    } else {
        resultsContainer.innerHTML = filtered.map(city => `
            <div class="city-card card" data-city="${city.name}">
                <div class="city-header">
                    <div class="city-flag-large">${getFlagEmoji(city.country)}</div>
                    <div>
                        <h3>${city.name}</h3>
                        <p class="city-country">${city.country}</p>
                    </div>
                </div>
                
                <p class="city-description">${city.desc}</p>
                
                <div class="city-tags">
                    <span class="tag tag-primary">📏 ${city.dist} ώρες</span>
                    <span class="tag tag-${city.costLevel === 'Οικονομικό' ? 'accent' : city.costLevel === 'Μέτριο' ? 'primary' : 'secondary'}">
                        ${city.costLevel}
                    </span>
                    ${city.themeparks === 'Ναι' ? '<span class="tag tag-accent">🎢 Θεματικό Πάρκο</span>' : ''}
                    ${city.christmas === 'Ναι' ? '<span class="tag tag-primary">🎄 Χριστουγεννιάτικες Αγορές</span>' : ''}
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="btn btn-primary" onclick="selectDestination('${city.name}')" style="width: 100%;">
                        <i class="fas fa-check-circle"></i> Επιλογή
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Highlight if already selected
    if (APP_STATE.destination) {
        highlightSelectedCity(APP_STATE.destination);
    }
}

function resetFilters() {
    document.getElementById('filter-traveler').value = '';
    document.getElementById('filter-distance').value = '';
    document.getElementById('filter-weather').value = '';
    document.getElementById('filter-themeparks').value = '';
    document.getElementById('filter-christmas').value = '';
    document.getElementById('filter-cost').value = '';
    
    // Reset display
    document.getElementById('cities-results').innerHTML = renderAllCities();
    
    // Re-highlight selection
    if (APP_STATE.destination) {
        highlightSelectedCity(APP_STATE.destination);
    }
}

function saveBudgetAndDays() {
    const budgetInput = document.getElementById('travel-budget');
    const daysInput = document.getElementById('travel-days');
    
    APP_STATE.budget = parseInt(budgetInput.value) || 0;
    APP_STATE.days = parseInt(daysInput.value) || 0;
    
    // Update budget tracker
    updateBudgetTracker();
    
    // Save
    saveToLocalStorage();
    
    showNotification('✅ Προϋπολογισμός και μέρες αποθηκεύτηκαν', 'success');
}

// ==================== STEP 2: FLIGHTS ====================
function renderStepFlight() {
    const dest = APP_STATE.destination || 'προορισμό σας';
    
    return `
        <div class="flight-step">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-plane-departure"></i>
                    Αναζήτηση Πτήσεων
                </div>
                
                <div class="destination-banner">
                    <div class="banner-content">
                        <h2><i class="fas fa-map-marker-alt"></i> ${dest}</h2>
                        <p>Βρείτε τις καλύτερες πτήσεις για τον προορισμό σας</p>
                    </div>
                </div>
                
                <div class="flight-search">
                    <h3 style="margin: 25px 0 15px 0;">
                        <i class="fas fa-search"></i> Πλατφόρμες Αναζήτησης
                    </h3>
                    
                    <div class="grid grid-2" style="gap: 20px; margin-bottom: 30px;">
                        <a href="https://www.skyscanner.gr" target="_blank" class="flight-platform">
                            <div class="platform-icon" style="background: #00b2d6;">
                                <i class="fas fa-search"></i>
                            </div>
                            <div class="platform-info">
                                <h4>Skyscanner</h4>
                                <p>Σύγκριση τιμών από 100+ πηγές</p>
                            </div>
                        </a>
                        
                        <a href="https://www.google.com/flights" target="_blank" class="flight-platform">
                            <div class="platform-icon" style="background: #4285f4;">
                                <i class="fab fa-google"></i>
                            </div>
                            <div class="platform-info">
                                <h4>Google Flights</h4>
                                <p>Έξυπνη αναζήτηση και ειδοποιήσεις</p>
                            </div>
                        </a>
                        
                        <a href="https://www.kayak.com" target="_blank" class="flight-platform">
                            <div class="platform-icon" style="background: #ff5722;">
                                <i class="fas fa-plane"></i>
                            </div>
                            <div class="platform-info">
                                <h4>Kayak</h4>
                                <p>Προτάσεις και φίλτρα</p>
                            </div>
                        </a>
                        
                        <a href="https://www.aegeanair.com" target="_blank" class="flight-platform">
                            <div class="platform-icon" style="background: #c60c30;">
                                <i class="fas fa-building"></i>
                            </div>
                            <div class="platform-info">
                                <h4>Aegean Airlines</h4>
                                <p>Επίσημος ιστότοπος</p>
                            </div>
                        </a>
                    </div>
                    
                    <!-- ΤΙΠΣ -->
                    <div class="tips-card" style="background: #f0f9ff; padding: 20px; border-radius: var(--radius-md); margin: 25px 0;">
                        <h4 style="color: #0369a1; margin-bottom: 10px;">
                            <i class="fas fa-lightbulb"></i> Συμβουλές για Πτήσεις
                        </h4>
                        <ul style="color: #0c4a6e; padding-left: 20px;">
                            <li>Ψάξτε σε ιδιωτικό/ανώνυμο παράθυρο για καλύτερες τιμές</li>
                            <li>Προτιμήστε πτήσεις Τρίτη-Τετάρτη για χαμηλότερες τιμές</li>
                            <li>Κάντε κράτηση 6-8 εβδομάδες πριν για διεθνείς πτήσεις</li>
                            <li>Ελέγξτε και άλλες πόλεις κοντινά (π.χ. για Βιέννη, δείτε και Μπρατισλάβα)</li>
                        </ul>
                    </div>
                    
                    <!-- ΚΟΥΜΠΙΑ -->
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button class="btn btn-primary" onclick="navigateToStep('hotel')">
                            <i class="fas fa-arrow-right"></i> Συνέχεια σε Ξενοδοχεία
                        </button>
                        <button class="btn btn-outline" onclick="navigateToStep('destination')">
                            <i class="fas fa-arrow-left"></i> Επιστροφή
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ==================== STEP 3: HOTELS ====================
function renderStepHotel() {
    const dest = APP_STATE.destination || '';
    
    return `
        <div class="hotel-step">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-hotel"></i>
                    Αναζήτηση Ξενοδοχείων
                </div>
                
                <div class="hotel-search-form">
                    <div class="grid grid-2" style="gap: 20px; margin: 25px 0;">
                        <div>
                            <label class="form-label">🏙️ Προορισμός</label>
                            <input type="text" class="form-control" id="hotel-destination" value="${dest}" placeholder="Πόλη">
                        </div>
                        
                        <div>
                            <label class="form-label">👨‍👩‍👧‍👦 Αριθμός Ατόμων</label>
                            <select class="form-control" id="hotel-guests">
                                <option value="1">1 άτομο</option>
                                <option value="2">2 άτομα</option>
                                <option value="3">3 άτομα</option>
                                <option value="4" selected>4 άτομα</option>
                                <option value="5">5 άτομα</option>
                                <option value="6">6 άτομα</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-2" style="gap: 20px; margin-bottom: 25px;">
                        <div>
                            <label class="form-label">📅 Άφιξη</label>
                            <input type="date" class="form-control" id="hotel-checkin">
                        </div>
                        
                        <div>
                            <label class="form-label">📅 Αναχώρηση</label>
                            <input type="date" class="form-control" id="hotel-checkout">
                        </div>
                    </div>
                </div>
                
                <!-- PLATFORMS -->
                <h3 style="margin: 30px 0 15px 0;">
                    <i class="fas fa-external-link-alt"></i> Πλατφόρμες Κράτησης
                </h3>
                
                <div class="grid grid-2" style="gap: 20px; margin-bottom: 30px;">
                    <a href="#" onclick="searchBooking()" class="hotel-platform">
                        <div class="platform-logo" style="background: #003580;">
                            <span style="font-weight: bold; color: white;">B</span>
                        </div>
                        <div class="platform-details">
                            <h4>Booking.com</h4>
                            <p>Περισσότερες επιλογές & δωρεάν ακύρωση</p>
                        </div>
                    </a>
                    
                    <a href="#" onclick="searchAirbnb()" class="hotel-platform">
                        <div class="platform-logo" style="background: #FF5A5F;">
                            <i class="fab fa-airbnb" style="color: white;"></i>
                        </div>
                        <div class="platform-details">
                            <h4>Airbnb</h4>
                            <p>Ολόκληρα σπίτια & μοναδικές εμπειρίες</p>
                        </div>
                    </a>
                    
                    <a href="#" onclick="searchExpedia()" class="hotel-platform">
                        <div class="platform-logo" style="background: linear-gradient(135deg, #1a73e8, #6c8eff);">
                            <i class="fas fa-plane" style="color: white;"></i>
                        </div>
                        <div class="platform-details">
                            <h4>Expedia</h4>
                            <p>Πακέτα πτήσης+ξενοδοχείου</p>
                        </div>
                    </a>
                    
                    <a href="#" onclick="searchHotelsCom()" class="hotel-platform">
                        <div class="platform-logo" style="background: #D32F2F;">
                            <i class="fas fa-bed" style="color: white;"></i>
                        </div>
                        <div class="platform-details">
                            <h4>Hotels.com</h4>
                            <p>Επιβράβευση 10 διανυκτερεύσεων</p>
                        </div>
                    </a>
                </div>
                
                <!-- FILTERS -->
                <div class="hotel-filters">
                    <h4 style="margin: 20px 0 10px 0;">🎯 Φίλτρα για Οικογένεια</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 15px 0;">
                        <label class="filter-checkbox">
                            <input type="checkbox" checked> 🏊‍♂️ Πισίνα
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox" checked> 👶 Κούνια
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox"> 🍽️ Πρωινό συμπεριλαμβανόμενο
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox"> 🅿️ Δωρεάν Πάρκινγκ
                        </label>
                        <label class="filter-checkbox">
                            <input type="checkbox"> ♿ Προσβάσιμο
                        </label>
                    </div>
                </div>
                
                <!-- ΚΟΥΜΠΙΑ -->
                <div style="display: flex; gap: 15px; margin-top: 30px;">
                    <button class="btn btn-primary" onclick="navigateToStep('activities')">
                        <i class="fas fa-arrow-right"></i> Συνέχεια σε Δραστηριότητες
                    </button>
                    <button class="btn btn-outline" onclick="navigateToStep('flight')">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            </div>
        </div>
    `;
}

function searchBooking() {
    const destination = document.getElementById('hotel-destination').value || APP_STATE.destination;
    const checkin = document.getElementById('hotel-checkin').value;
    const checkout = document.getElementById('hotel-checkout').value;
    
    let url = `https://www.booking.com/searchresults.el.html?ss=${encodeURIComponent(destination)}`;
    
    if (checkin && checkout) {
        url += `&checkin=${checkin}&checkout=${checkout}`;
    }
    
    window.open(url, '_blank');
    showNotification('🔍 Ανοίγει Booking.com', 'info');
}

function searchAirbnb() {
    const destination = document.getElementById('hotel-destination').value || APP_STATE.destination;
    const url = `https://www.airbnb.gr/s/${encodeURIComponent(destination)}/homes`;
    window.open(url, '_blank');
    showNotification('🏠 Ανοίγει Airbnb', 'info');
}

function searchExpedia() {
    const destination = document.getElementById('hotel-destination').value || APP_STATE.destination;
    const url = `https://www.expedia.gr/Hotel-Search?destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
    showNotification('✈️ Ανοίγει Expedia', 'info');
}

function searchHotelsCom() {
    const destination = document.getElementById('hotel-destination').value || APP_STATE.destination;
    const url = `https://gr.hotels.com/Hotel-Search?destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
    showNotification('🛏️ Ανοίγει Hotels.com', 'info');
}

// ==================== STEP 4: ACTIVITIES ====================
function renderStepActivities() {
    return `
        <div class="activities-step">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-ticket-alt"></i>
                    Οικογενειακές Δραστηριότητες
                </div>
                
                ${APP_STATE.destination ? `
                    <div class="destination-header" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 20px; border-radius: var(--radius-md); margin-bottom: 25px;">
                        <h2 style="margin-bottom: 10px;">${APP_STATE.destination}</h2>
                        <p>Επιλέξτε δραστηριότητες για την οικογένειά σας</p>
                    </div>
                ` : `
                    <div class="alert" style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: var(--radius-md); margin-bottom: 25px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Δεν έχετε επιλέξει προορισμό. 
                        <a href="#" onclick="navigateToStep('destination')" style="color: var(--primary); font-weight: bold;">
                            Επιστρέψτε στο Βήμα 1
                        </a>
                    </div>
                `}
                
                <!-- ΟΙΚΟΓΕΝΕΙΑ -->
                <div class="family-section">
                    <h3 style="margin-bottom: 20px;">
                        <i class="fas fa-users"></i> Η Οικογένειά Σας
                    </h3>
                    
                    <div id="family-members-container" class="family-container">
                        ${APP_STATE.familyMembers.length > 0 ? 
                            renderFamilyMembersList() : 
                            '<p style="color: var(--gray); text-align: center; padding: 20px;">Δεν υπάρχουν μέλη οικογένειας</p>'
                        }
                    </div>
                    
                    <div style="text-align: center; margin: 25px 0;">
                        <button class="btn btn-primary" onclick="openFamilyModal()">
                            <i class="fas fa-user-plus"></i> Διαχείριση Οικογένειας
                        </button>
                    </div>
                </div>
                
                <!-- ΔΡΑΣΤΗΡΙΟΤΗΤΕΧ -->
                ${APP_STATE.destination ? `
                    <div class="activities-loading" id="activities-loading">
                        <div style="text-align: center; padding: 40px;">
                            <i class="fas fa-spinner fa-spin" style="font-size: 40px; color: var(--primary); margin-bottom: 20px;"></i>
                            <p>Φόρτωση δραστηριοτήτων για ${APP_STATE.destination}...</p>
                        </div>
                    </div>
                    
                    <div id="activities-container" style="display: none;">
                        <!-- Θα γεμίσει με δραστηριότητες -->
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <button class="btn btn-secondary" onclick="loadCityActivities()" id="load-activities-btn">
                            <i class="fas fa-sync-alt"></i> Φόρτωση Δραστηριοτήτων
                        </button>
                    </div>
                ` : ''}
                
                <!-- ΚΟΥΜΠΙΑ -->
                <div style="display: flex; gap: 15px; margin-top: 40px;">
                    <button class="btn btn-primary" onclick="navigateToStep('summary')">
                        <i class="fas fa-arrow-right"></i> Συνέχεια σε Σύνοψη
                    </button>
                    <button class="btn btn-outline" onclick="navigateToStep('hotel')">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            </div>
        </div>
        
        <!-- MODAL ΟΙΚΟΓΕΝΕΙΑΣ -->
        <div id="family-modal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-users"></i> Διαχείριση Οικογένειας</h3>
                    <button class="modal-close" onclick="closeFamilyModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="modal-family-list">
                        ${renderModalFamilyMembers()}
                    </div>
                    
                    <div style="margin: 25px 0;">
                        <h4 style="margin-bottom: 15px;">Προσθήκη Νέου Μέλους</h4>
                        <div class="grid grid-3" style="gap: 10px;">
                            <button class="btn btn-outline" onclick="addMemberInModal('adult')">
                                <i class="fas fa-male"></i> Ενήλικας
                            </button>
                            <button class="btn btn-outline" onclick="addMemberInModal('child')">
                                <i class="fas fa-child"></i> Παιδί
                            </button>
                            <button class="btn btn-outline" onclick="addMemberInModal('baby')">
                                <i class="fas fa-baby"></i> Μωρό
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="saveFamilyMembers()">
                        <i class="fas fa-save"></i> Αποθήκευση
                    </button>
                    <button class="btn btn-outline" onclick="closeFamilyModal()">
                        Ακύρωση
                    </button>
                </div>
            </div>
        </div>
    `;
}

function setupActivitiesStep() {
    // Εάν υπάρχουν μέλη οικογένειας και προορισμός, φόρτωσε αυτόματα
    if (APP_STATE.destination && APP_STATE.familyMembers.length > 0) {
        setTimeout(() => {
            loadCityActivities();
        }, 500);
    }
}

function renderFamilyMembersList() {
    return `
        <div class="family-grid">
            ${APP_STATE.familyMembers.map((member, index) => `
                <div class="family-member-card">
                    <div class="member-avatar">
                        ${getAgeEmoji(member.age)}
                    </div>
                    <div class="member-info">
                        <h4>${member.name}</h4>
                        <p>${member.age} ετών</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderModalFamilyMembers() {
    return APP_STATE.familyMembers.map((member, index) => `
        <div class="modal-member-row">
            <div style="display: flex; gap: 15px; align-items: center;">
                <select class="form-control" style="width: 100px;" onchange="updateMemberType(${index}, this.value)">
                    <option value="adult" ${member.age >= 18 ? 'selected' : ''}>👨 Ενήλικας</option>
                    <option value="child" ${member.age >= 3 && member.age < 18 ? 'selected' : ''}>🧒 Παιδί</option>
                    <option value="baby" ${member.age < 3 ? 'selected' : ''}>👶 Μωρό</option>
                </select>
                
                <input type="text" class="form-control" placeholder="Όνομα" value="${member.name}" 
                       oninput="updateMemberName(${index}, this.value)">
                
                <input type="number" class="form-control" placeholder="Ηλικία" value="${member.age}" min="0" max="120"
                       oninput="updateMemberAge(${index}, this.value)" style="width: 100px;">
            </div>
            
            <button class="btn btn-danger" onclick="removeMemberInModal(${index})" style="padding: 8px 12px;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function openFamilyModal() {
    document.getElementById('family-modal').style.display = 'flex';
}

function closeFamilyModal() {
    document.getElementById('family-modal').style.display = 'none';
}

function addMemberInModal(type) {
    let name, age;
    
    switch(type) {
        case 'adult':
            name = 'Ενήλικας';
            age = 30;
            break;
        case 'child':
            name = 'Παιδί';
            age = 10;
            break;
        case 'baby':
            name = 'Μωρό';
            age = 2;
            break;
    }
    
    APP_STATE.familyMembers.push({ name, age });
    document.getElementById('modal-family-list').innerHTML = renderModalFamilyMembers();
}

function updateMemberType(index, type) {
    // Ενημέρωση ηλικίας βάσει τύπου
    switch(type) {
        case 'adult':
            APP_STATE.familyMembers[index].age = 30;
            break;
        case 'child':
            APP_STATE.familyMembers[index].age = 10;
            break;
        case 'baby':
            APP_STATE.familyMembers[index].age = 2;
            break;
    }
    document.getElementById('modal-family-list').innerHTML = renderModalFamilyMembers();
}

function updateMemberName(index, name) {
    APP_STATE.familyMembers[index].name = name;
}

function updateMemberAge(index, age) {
    APP_STATE.familyMembers[index].age = parseInt(age) || 0;
}

function removeMemberInModal(index) {
    APP_STATE.familyMembers.splice(index, 1);
    document.getElementById('modal-family-list').innerHTML = renderModalFamilyMembers();
}

function saveFamilyMembers() {
    // Αποθήκευση
    localStorage.setItem('travel_family', JSON.stringify(APP_STATE.familyMembers));
    
    // Ενημέρωση UI
    document.getElementById('family-members-container').innerHTML = renderFamilyMembersList();
    
    // Κλείσιμο modal
    closeFamilyModal();
    
    // Ειδοποίηση
    showNotification(`✅ Αποθηκεύτηκαν ${APP_STATE.familyMembers.length} μέλη οικογένειας`, 'success');
    
    // Αυτόματη φόρτωση δραστηριοτήτων αν υπάρχει προορισμός
    if (APP_STATE.destination && APP_STATE.familyMembers.length > 0) {
        setTimeout(() => {
            loadCityActivities();
        }, 1000);
    }
}

async function loadCityActivities() {
    if (!APP_STATE.destination) {
        showNotification('⚠️ Πρέπει να επιλέξετε προορισμό πρώτα', 'warning');
        return;
    }
    
    if (APP_STATE.familyMembers.length === 0) {
        showNotification('⚠️ Πρέπει να προσθέσετε μέλη οικογένειας', 'warning');
        return;
    }
    
    const btn = document.getElementById('load-activities-btn');
    const loadingDiv = document.getElementById('activities-loading');
    const container = document.getElementById('activities-container');
    
    if (btn) btn.disabled = true;
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (container) container.style.display = 'none';
    
    try {
        // ========== ΝΕΟΣ ΚΩΔΙΚΑΣ: Φόρτωση πραγματικού JSON ==========
        const cityFileName = APP_STATE.destination.toLowerCase() + '.json';
        
        // Προσπάθησε να φορτώσεις το JSON αρχείο
        const response = await fetch(`data/${cityFileName}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const cityData = await response.json();
        
        // Εξαγωγή δραστηριοτήτων από το JSON
        // Υποθέτουμε ότι το JSON έχει τη μορφή: { "activities": [...] }
        const activities = cityData.activities || cityData.details || [];
        
        if (activities.length === 0) {
            throw new Error('Δεν βρέθηκαν δραστηριότητες για αυτήν την πόλη');
        }
        
        // Αποθήκευση στο state
        APP_STATE.availableActivities = activities;
        // ==========================================================
        
        // Εμφάνιση δραστηριοτήτων
        if (container) {
            container.innerHTML = renderActivitiesList();
            container.style.display = 'block';
        }
        
        showNotification(`✅ Φορτώθηκαν ${activities.length} δραστηριότητες για ${APP_STATE.destination}`, 'success');
        
    } catch (error) {
        console.error('Σφάλμα φόρτωσης:', error);
        
        // Fallback στα στατικά δεδομένα αν αποτύχει το fetch
        console.log('Χρησιμοποίηση fallback δεδομένων...');
        if (container) {
            container.innerHTML = renderActivitiesList(); // Θα χρησιμοποιήσει τα hardcoded
            container.style.display = 'block';
        }
        
        showNotification('⚠️ Χρησιμοποιούνται προσωρινά δεδομένα', 'warning');
    } finally {
        if (btn) btn.disabled = false;
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

// Διέγραψε τη συνάρτηση simulateActivitiesLoad() αν υπάρχει
// function simulateActivitiesLoad() {
//     return new Promise(resolve => {
//         setTimeout(resolve, 1500);
//     });
// }

function simulateActivitiesLoad() {
    return new Promise(resolve => {
        setTimeout(resolve, 1500);
    });
}

function renderActivitiesList() {
    // Δεδομένα δραστηριοτήτων ανά πόλη
    const activitiesData = {
        'Βιέννη': [
            { name: 'Σαινμπρούν Παλάτι', desc: 'Αυτοκρατορικό παλάτι με κήπους', adultPrice: 20, childPrice: 10, duration: '3-4 ώρες' },
            { name: 'Πρατέρ Πάρκ', desc: 'Θεματικό πάρκο με ρόδες', adultPrice: 15, childPrice: 8, duration: '4-6 ώρες' },
            { name: 'Κέντρο της Βιέννης', desc: 'Περίπατος στην ιστορική πόλη', adultPrice: 0, childPrice: 0, duration: '2-3 ώρες' },
            { name: 'Ζωολογικός Κήπος', desc: 'Παλιότερος ζωολογικός στον κόσμο', adultPrice: 22, childPrice: 11, duration: '3-4 ώρες' }
        ],
        'Παρίσι': [
            { name: 'Πύργος του Άιφελ', desc: 'Σύμβολο του Παρισιού', adultPrice: 25, childPrice: 12, duration: '2-3 ώρες' },
            { name: 'Λούβρο', desc: 'Παγκόσμιο μουσείο τέχνης', adultPrice: 17, childPrice: 0, duration: '4-6 ώρες' },
            { name: 'Disneyland Paris', desc: 'Θεματικό πάρκο', adultPrice: 80, childPrice: 70, duration: 'Ολόκληρη μέρα' }
        ],
        'Λονδίνο': [
            { name: 'London Eye', desc: 'Τροχός με θέα την πόλη', adultPrice: 30, childPrice: 15, duration: '30 λεπτά' },
            { name: 'Μουσείο Φυσικής Ιστορίας', desc: 'Δωρεάν μουσείο', adultPrice: 0, childPrice: 0, duration: '3-4 ώρες' },
            { name: 'Sea Life Ακουάριο', desc: 'Υποβρύχιος κόσμος', adultPrice: 25, childPrice: 18, duration: '2 ώρες' }
        ]
    };
    
    const activities = activitiesData[APP_STATE.destination] || [
        { name: 'Ιστορικό Κέντρο', desc: 'Περιήγηση στην παλιά πόλη', adultPrice: 0, childPrice: 0, duration: '2-3 ώρες' },
        { name: 'Τοπικό Μουσείο', desc: 'Μάθετε την ιστορία', adultPrice: 10, childPrice: 5, duration: '2 ώρες' },
        { name: 'Πάρκο Ανάπαυσης', desc: 'Χρόνος για χαλάρωση', adultPrice: 0, childPrice: 0, duration: '1-2 ώρες' }
    ];
    
    // Αποθήκευση στο state
    APP_STATE.availableActivities = activities;
    
    return `
        <div class="activities-header" style="margin-bottom: 25px;">
            <h3><i class="fas fa-star"></i> Διαθέσιμες Δραστηριότητες</h3>
            <p>Κάντε κλικ για επιλογή/αποεπιλογή</p>
        </div>
        
        <div class="activities-grid">
            ${activities.map((activity, index) => {
                const isSelected = APP_STATE.selectedActivities.some(a => a.name === activity.name);
                const totalPrice = calculateActivityPrice(activity);
                
                return `
                    <div class="activity-card ${isSelected ? 'selected' : ''}" 
                         onclick="toggleActivitySelection(${index})" 
                         data-index="${index}">
                        
                        <div class="activity-header">
                            <div class="activity-checkbox">
                                <i class="fas fa-${isSelected ? 'check-circle' : 'circle'}"></i>
                            </div>
                            <h4>${activity.name}</h4>
                        </div>
                        
                        <p class="activity-description">${activity.desc}</p>
                        
                        <div class="activity-details">
                            <div class="detail-item">
                                <i class="fas fa-clock"></i>
                                <span>${activity.duration}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-euro-sign"></i>
                                <span>${activity.adultPrice}€/ενήλικας</span>
                            </div>
                        </div>
                        
                        <div class="activity-price">
                            <strong>Κόστος για την οικογένειά σας:</strong>
                            <span class="price-total">${totalPrice}€</span>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <!-- ΣΥΝΟΛΙΚΟ ΚΟΣΤΟΣ -->
        <div class="total-cost-card">
            <div class="total-header">
                <h3><i class="fas fa-calculator"></i> Σύνολο Κόστους</h3>
                <div class="total-amount" id="total-activities-cost">
                    ${calculateTotalActivitiesCost()}€
                </div>
            </div>
            <p>Για ${APP_STATE.familyMembers.length} μέλη οικογένειας</p>
        </div>
    `;
}

function calculateActivityPrice(activity) {
    if (!APP_STATE.familyMembers.length) return 0;
    
    let total = 0;
    APP_STATE.familyMembers.forEach(member => {
        if (member.age >= 18) {
            total += activity.adultPrice;
        } else {
            total += activity.childPrice;
        }
    });
    return total;
}

function calculateTotalActivitiesCost() {
    if (!APP_STATE.selectedActivities.length) return 0;
    
    let total = 0;
    APP_STATE.selectedActivities.forEach(activity => {
        total += calculateActivityPrice(activity);
    });
    return total;
}

function toggleActivitySelection(index) {
    if (!APP_STATE.availableActivities || !APP_STATE.availableActivities[index]) return;
    
    const activity = APP_STATE.availableActivities[index];
    const isSelected = APP_STATE.selectedActivities.some(a => a.name === activity.name);
    
    if (isSelected) {
        // Αφαίρεση
        APP_STATE.selectedActivities = APP_STATE.selectedActivities.filter(a => a.name !== activity.name);
    } else {
        // Προσθήκη
        APP_STATE.selectedActivities.push(activity);
    }
    
    // Ενημέρωση UI
    const card = document.querySelector(`.activity-card[data-index="${index}"]`);
    if (card) {
        card.classList.toggle('selected');
        const icon = card.querySelector('.activity-checkbox i');
        icon.className = isSelected ? 'fas fa-circle' : 'fas fa-check-circle';
    }
    
    // Ενημέρωση συνολικού κόστους
    const totalCostElement = document.getElementById('total-activities-cost');
    if (totalCostElement) {
        totalCostElement.textContent = `${calculateTotalActivitiesCost()}€`;
    }
    
    // Αποθήκευση
    saveToLocalStorage();
    
    // Ενημέρωση budget tracker
    updateBudgetTracker();
}

// ==================== STEP 5: SUMMARY ====================
function renderStepSummary() {
    const totalCost = calculateTotalActivitiesCost();
    const days = APP_STATE.days || 3;
    
    return `
        <div class="summary-step">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-file-alt"></i>
                    Τελική Σύνοψη & Πρόγραμμα
                </div>
                
                <!-- BANNER -->
                <div class="summary-banner" style="background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; padding: 25px; border-radius: var(--radius-md); margin-bottom: 30px;">
                    <h2 style="margin-bottom: 10px;">
                        <i class="fas fa-check-circle"></i> Το Ταξίδι Σας είναι Έτοιμο!
                    </h2>
                    <p>Ακολουθεί η πλήρης σύνοψη των επιλογών σας</p>
                </div>
                
                <!-- OVERVIEW -->
                <div class="summary-overview">
                    <div class="grid grid-3" style="gap: 20px; margin-bottom: 30px;">
                        <div class="overview-card">
                            <div class="overview-icon" style="background: rgba(62, 180, 137, 0.1);">
                                <i class="fas fa-map-marker-alt" style="color: var(--primary);"></i>
                            </div>
                            <h3>Προορισμός</h3>
                            <p class="overview-value">${APP_STATE.destination || 'Δεν έχει επιλεγεί'}</p>
                        </div>
                        
                        <div class="overview-card">
                            <div class="overview-icon" style="background: rgba(102, 126, 234, 0.1);">
                                <i class="fas fa-users" style="color: var(--secondary);"></i>
                            </div>
                            <h3>Οικογένεια</h3>
                            <p class="overview-value">${APP_STATE.familyMembers.length} μέλη</p>
                        </div>
                        
                        <div class="overview-card">
                            <div class="overview-icon" style="background: rgba(255, 127, 80, 0.1);">
                                <i class="fas fa-calendar-alt" style="color: var(--accent);"></i>
                            </div>
                            <h3>Διάρκεια</h3>
                            <p class="overview-value">${days} ${days === 1 ? 'ημέρα' : 'ημέρες'}</p>
                        </div>
                    </div>
                </div>
                
                <!-- ΔΡΑΣΤΗΡΙΟΤΗΤΕΧ -->
                <div class="summary-section">
                    <h3 style="margin-bottom: 20px;">
                        <i class="fas fa-ticket-alt"></i> Επιλεγμένες Δραστηριότητες
                    </h3>
                    
                    ${APP_STATE.selectedActivities.length > 0 ? `
                        <div class="selected-activities">
                            <table class="summary-table">
                                <thead>
                                    <tr>
                                        <th>Δραστηριότητα</th>
                                        <th>Κόστος/Ενήλικα</th>
                                        <th>Κόστος/Παιδί</th>
                                        <th>Σύνολο</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${APP_STATE.selectedActivities.map(activity => {
                                        const activityTotal = calculateActivityPrice(activity);
                                        return `
                                            <tr>
                                                <td><strong>${activity.name}</strong><br><small>${activity.desc}</small></td>
                                                <td>${activity.adultPrice}€</td>
                                                <td>${activity.childPrice}€</td>
                                                <td><strong>${activityTotal}€</strong></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" style="text-align: right;"><strong>ΣΥΝΟΛΟ:</strong></td>
                                        <td><strong style="font-size: 18px; color: var(--primary);">${totalCost}€</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-ticket-alt" style="font-size: 50px; color: var(--gray); margin-bottom: 15px;"></i>
                            <p>Δεν έχετε επιλέξει δραστηριότητες ακόμα</p>
                            <button class="btn btn-outline" onclick="navigateToStep('activities')" style="margin-top: 10px;">
                                <i class="fas fa-arrow-left"></i> Επιστροφή σε Δραστηριότητες
                            </button>
                        </div>
                    `}
                </div>
                
                <!-- ΗΜΕΡΗΣΙΟ ΠΡΟΓΡΑΜΜΑ -->
                ${APP_STATE.selectedActivities.length > 0 && APP_STATE.days > 0 ? `
                    <div class="summary-section" style="margin-top: 30px;">
                        <h3 style="margin-bottom: 20px;">
                            <i class="fas fa-calendar-day"></i> Ημερήσιο Πρόγραμμα (${days} ημέρες)
                        </h3>
                        
                        <div class="daily-schedule">
                            ${generateDailySchedule()}
                        </div>
                    </div>
                ` : ''}
                
                <!-- ΚΟΥΜΠΙΑ ΕΝΕΡΓΕΙΩΝ -->
                <div class="summary-actions" style="margin-top: 40px;">
                    <div class="grid grid-2" style="gap: 20px;">
                        <button class="btn btn-primary" onclick="generatePDF()">
                            <i class="fas fa-file-pdf"></i> Εξαγωγή PDF
                        </button>
                        
                        <button class="btn btn-secondary" onclick="navigateToStep('map')">
                            <i class="fas fa-map"></i> Συνέχεια στον Χάρτη
                        </button>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <button class="btn btn-outline" onclick="navigateToStep('activities')">
                            <i class="fas fa-arrow-left"></i> Επιστροφή
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateDailySchedule() {
    const days = APP_STATE.days || 3;
    const activities = APP_STATE.selectedActivities;
    const activitiesPerDay = Math.ceil(activities.length / days);
    
    let html = '';
    
    for (let day = 1; day <= days; day++) {
        const startIndex = (day - 1) * activitiesPerDay;
        const endIndex = Math.min(startIndex + activitiesPerDay, activities.length);
        const dayActivities = activities.slice(startIndex, endIndex);
        
        if (dayActivities.length === 0) continue;
        
        html += `
            <div class="day-card">
                <div class="day-header">
                    <h4>📅 Ημέρα ${day}</h4>
                    <span class="day-tag">${dayActivities.length} δραστηριότητες</span>
                </div>
                
                <div class="day-activities">
                    ${dayActivities.map((activity, index) => `
                        <div class="day-activity ${index % 2 === 0 ? 'morning' : 'afternoon'}">
                            <div class="time-slot">
                                ${index % 2 === 0 ? '🌅 9:00-13:00' : '🌇 14:00-18:00'}
                            </div>
                            <div class="activity-info">
                                <h5>${activity.name}</h5>
                                <p>${activity.desc}</p>
                                <span class="duration">⏱️ ${activity.duration}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    return html;
}

// ==================== STEP 6: MAP ====================
function renderStepMap() {
    return `
        <div class="map-step">
            <div class="card">
                <div class="card-title">
                    <i class="fas fa-map-marked-alt"></i>
                    Διαδραστικός Χάρτης
                </div>
                
                ${APP_STATE.destination ? `
                    <div class="map-header" style="margin-bottom: 25px;">
                        <h3>📍 Χάρτης: ${APP_STATE.destination}</h3>
                        <p>Δείτε τις τοποθεσίες των δραστηριοτήτων σας</p>
                    </div>
                    
                    <!-- ΧΑΡΤΗΣ -->
                    <div id="map-container" style="height: 500px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 25px; background: #f0f0f0;">
                        <!-- Ο χάρτης θα εμφανιστεί εδώ -->
                    </div>
                    
                    <!-- ΚΟΥΜΠΙΑ ΧΑΡΤΗ -->
                    <div class="map-controls">
                        <div class="grid grid-3" style="gap: 15px; margin-bottom: 20px;">
                            <button class="btn btn-primary" onclick="initializeMap()">
                                <i class="fas fa-map"></i> Φόρτωση Χάρτη
                            </button>
                            
                            <button class="btn btn-secondary" onclick="addCustomMarker()">
                                <i class="fas fa-map-pin"></i> Προσθήκη Σημείου
                            </button>
                            
                            <button class="btn btn-outline" onclick="showRouteBetweenActivities()">
                                <i class="fas fa-route"></i> Διαδρομή
                            </button>
                        </div>
                    </div>
                    
                    <!-- ΔΡΑΣΤΗΡΙΟΤΗΤΕΧ ΣΤΟΝ ΧΑΡΤΗ -->
                    ${APP_STATE.selectedActivities.length > 0 ? `
                        <div class="map-activities-list">
                            <h4 style="margin: 25px 0 15px 0;">
                                <i class="fas fa-list-ul"></i> Δραστηριότητες στον Χάρτη
                            </h4>
                            <div class="activities-mini-list">
                                ${APP_STATE.selectedActivities.map((activity, index) => `
                                    <div class="mini-activity" onclick="focusOnMapActivity(${index})">
                                        <div class="mini-icon">📍</div>
                                        <div class="mini-info">
                                            <strong>${activity.name}</strong>
                                            <small>${activity.duration}</small>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                ` : `
                    <div class="empty-state" style="text-align: center; padding: 40px;">
                        <i class="fas fa-map-marked-alt" style="font-size: 50px; color: var(--gray); margin-bottom: 20px;"></i>
                        <h3>Χωρίς Προορισμό</h3>
                        <p>Πρέπει να επιλέξετε προορισμό για να δείτε τον χάρτη</p>
                        <button class="btn btn-primary" onclick="navigateToStep('destination')" style="margin-top: 20px;">
                            <i class="fas fa-arrow-left"></i> Επιστροφή σε Προορισμό
                        </button>
                    </div>
                `}
                
                <!-- ΚΟΥΜΠΙΑ -->
                <div style="margin-top: 30px;">
                    <button class="btn btn-outline" onclick="navigateToStep('summary')">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            </div>
        </div>
    `;
}

function initializeMap() {
    if (!APP_STATE.destination) {
        showNotification('⚠️ Δεν έχετε επιλέξει προορισμό', 'warning');
        return;
    }
    
    // Βρες τις συντεταγμένες της πόλης
    const city = CITIES.find(c => c.name === APP_STATE.destination);
    if (!city || !city.coordinates) {
        showNotification('❌ Δεν βρέθηκαν συντεταγμένες για αυτήν την πόλη', 'error');
        return;
    }
    
    const container = document.getElementById('map-container');
    if (!container) return;
    
    // Καθάρισε τον χάρτη αν υπάρχει
    if (window.travelMap) {
        window.travelMap.remove();
    }
    
    // Δημιούργησε τον χάρτη
    const map = L.map('map-container').setView([city.coordinates.lat, city.coordinates.lng], 13);
    window.travelMap = map;
    
    // Προσθήκη OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Προσθήκη marker για την πόλη
    L.marker([city.coordinates.lat, city.coordinates.lng])
        .addTo(map)
        .bindPopup(`<b>${APP_STATE.destination}</b><br>Τοποθεσία προορισμού`)
        .openPopup();
    
    // Προσθήκη markers για τις δραστηριότητες (προσομοίωση)
    if (APP_STATE.selectedActivities && APP_STATE.selectedActivities.length > 0) {
        const markers = [];
        
        APP_STATE.selectedActivities.forEach((activity, index) => {
            // Τυχαίες συντεταγμένες γύρω από το κέντρο
            const lat = city.coordinates.lat + (Math.random() * 0.05 - 0.025);
            const lng = city.coordinates.lng + (Math.random() * 0.05 - 0.025);
            
            const marker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                })
            }).addTo(map);
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 10px 0;">${activity.name}</h4>
                    <p style="margin: 0 0 10px 0;">${activity.desc}</p>
                    <div style="background: #f8f9fa; padding: 8px; border-radius: 5px;">
                        <strong>💰 Τιμή:</strong><br>
                        👨 Ενήλικας: ${activity.adultPrice}€<br>
                        🧒 Παιδί: ${activity.childPrice}€
                    </div>
                </div>
            `);
            
            markers.push(marker);
        });
        
        // Προσαρμογή zoom για όλα τα markers
        const group = new L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
        
        showNotification('🗺️ Ο χάρτης φορτώθηκε με επιτυχία', 'success');
    } else {
        showNotification('🗺️ Ο χάρτης φορτώθηκε (χωρίς δραστηριότητες)', 'info');
    }
}

function addCustomMarker() {
    if (!window.travelMap) {
        showNotification('⚠️ Πρέπει πρώτα να φορτώσετε τον χάρτη', 'warning');
        return;
    }
    
    const name = prompt('📌 Όνομα σημείου (π.χ. Το ξενοδοχείο μας):');
    if (!name) return;
    
    alert('🖱️ Κάντε κλικ στον χάρτη για να προσθέσετε το σημείο');
    
    let clickHandler = null;
    
    clickHandler = function(e) {
        window.travelMap.off('click', clickHandler);
        
        const marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(window.travelMap);
        
        marker.bindPopup(`
            <div style="min-width: 200px;">
                <h4 style="margin: 0 0 10px 0;">${name}</h4>
                <p style="margin: 0 0 10px 0;">Προσθήκη από εσάς</p>
                <small>${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}</small>
            </div>
        `).openPopup();
        
        showNotification('📍 Προστέθηκε το σημείο στον χάρτη', 'success');
    };
    
    window.travelMap.on('click', clickHandler);
}

function focusOnMapActivity(index) {
    if (!window.travelMap || !APP_STATE.selectedActivities[index]) return;
    
    // Προσομοίωση - στη πραγματικότητα θα χρησιμοποιούσατε τις πραγματικές συντεταγμένες
    const city = CITIES.find(c => c.name === APP_STATE.destination);
    if (!city) return;
    
    // Τυχαία εστίαση
    const lat = city.coordinates.lat + (Math.random() * 0.03 - 0.015);
    const lng = city.coordinates.lng + (Math.random() * 0.03 - 0.015);
    
    window.travelMap.setView([lat, lng], 15);
    
    showNotification(`🔍 Εστίαση στην δραστηριότητα: ${APP_STATE.selectedActivities[index].name}`, 'info');
}

function showRouteBetweenActivities() {
    if (!APP_STATE.selectedActivities || APP_STATE.selectedActivities.length < 2) {
        showNotification('⚠️ Χρειάζονται τουλάχιστον 2 δραστηριότητες για διαδρομή', 'warning');
        return;
    }
    
    const activity1 = APP_STATE.selectedActivities[0];
    const activity2 = APP_STATE.selectedActivities[1];
    
    // Άνοιγμα Google Maps με οδηγίες
    const city = CITIES.find(c => c.name === APP_STATE.destination);
    if (city) {
        // Προσομοίωση συντεταγμένων
        const startLat = city.coordinates.lat;
        const startLng = city.coordinates.lng;
        const endLat = city.coordinates.lat + 0.02;
        const endLng = city.coordinates.lng + 0.02;
        
        const url = `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
        window.open(url, '_blank');
        
        showNotification('🚗 Ανοίγει Google Maps με οδηγίες', 'info');
    }
}

// ==================== UTILITY FUNCTIONS ====================
function getFlagEmoji(country) {
    const flags = {
        'Αυστρία': '🇦🇹',
        'Γαλλία': '🇫🇷', 
        'Ηνωμένο Βασίλειο': '🇬🇧',
        'Γερμανία': '🇩🇪',
        'Πορτογαλία': '🇵🇹',
        'Ουγγαρία': '🇭🇺',
        'Ιταλία': '🇮🇹'
    };
    return flags[country] || '🇪🇺';
}

function getAgeEmoji(age) {
    if (age < 3) return '👶';
    if (age < 13) return '🧒';
    if (age < 18) return '👦';
    return '👨';
}

function updateBudgetTracker() {
    const spent = calculateTotalActivitiesCost();
    const total = APP_STATE.budget || 0;
    const remaining = total - spent;
    
    document.getElementById('budget-total').textContent = `${total}€`;
    document.getElementById('budget-spent').textContent = `${spent}€`;
    document.getElementById('budget-remaining').textContent = `${remaining}€`;
    
    const progressBar = document.getElementById('budget-progress-bar');
    if (progressBar && total > 0) {
        const percentage = Math.min((spent / total) * 100, 100);
        progressBar.style.width = `${percentage}%`;
        
        // Αλλαγή χρώματος ανάλογα με το ποσοστό
        if (percentage > 90) {
            progressBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
        } else if (percentage > 70) {
            progressBar.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
        }
    }
}

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showNotification(message, type = 'info') {
    // Δημιουργία notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Προσθήκη CSS αν δεν υπάρχει
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 15px 20px;
                border-radius: var(--radius-md);
                box-shadow: var(--shadow-lg);
                z-index: 9999;
                min-width: 300px;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid var(--primary);
            }
            
            .notification-success { border-left-color: var(--success); }
            .notification-error { border-left-color: var(--danger); }
            .notification-warning { border-left-color: var(--warning); }
            .notification-info { border-left-color: var(--secondary); }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .notification-content i {
                font-size: 20px;
            }
            
            .notification-success .notification-content i { color: var(--success); }
            .notification-error .notification-content i { color: var(--danger); }
            .notification-warning .notification-content i { color: var(--warning); }
            .notification-info .notification-content i { color: var(--secondary); }
            
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Προσθήκη στο DOM
    document.body.appendChild(notification);
    
    // Αυτόματη αφαίρεση
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

function updateUI() {
    // Ενημέρωση destination display
    if (APP_STATE.destination) {
        document.getElementById('current-destination-display').textContent = APP_STATE.destination;
    }
    
    // Ενημέρωση budget
    updateBudgetTracker();
}

function saveToLocalStorage() {
    const data = {
        destination: APP_STATE.destination,
        familyMembers: APP_STATE.familyMembers,
        selectedActivities: APP_STATE.selectedActivities,
        budget: APP_STATE.budget,
        days: APP_STATE.days,
        currentStep: APP_STATE.currentStep
    };
    
    localStorage.setItem('travel_planner_state', JSON.stringify(data));
    
    // Αποθήκευση μεμονωμένων
    localStorage.setItem('travel_destination', APP_STATE.destination);
    localStorage.setItem('travel_family', JSON.stringify(APP_STATE.familyMembers));
    localStorage.setItem('travel_activities', JSON.stringify(APP_STATE.selectedActivities));
    localStorage.setItem('travel_budget', APP_STATE.budget);
    localStorage.setItem('travel_days', APP_STATE.days);
}

function resetAllData() {
    if (confirm('⚠️ Θέλετε να διαγράψετε ΟΛΑ τα δεδομένα του ταξιδιού; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.')) {
        // Reset state
        APP_STATE.destination = '';
        APP_STATE.familyMembers = [];
        APP_STATE.selectedActivities = [];
        APP_STATE.budget = 0;
        APP_STATE.days = 0;
        APP_STATE.currentStep = 'destination';
        
        // Clear localStorage
        localStorage.removeItem('travel_planner_state');
        localStorage.removeItem('travel_destination');
        localStorage.removeItem('travel_family');
        localStorage.removeItem('travel_activities');
        localStorage.removeItem('travel_budget');
        localStorage.removeItem('travel_days');
        
        // Reset UI
        document.getElementById('current-destination-display').textContent = 'Δεν έχει επιλεγεί';
        updateBudgetTracker();
        
        // Navigate to first step
        navigateToStep('destination');
        
        showNotification('🗑️ Όλα τα δεδομένα διαγράφηκαν', 'success');
    }
}

function generatePDF() {
    showNotification('📄 Η λειτουργία PDF θα προστεθεί σύντομα', 'info');
    // Στη πραγματικότητα εδώ θα χρησιμοποιούσατε μια βιβλιοθήκη όπως jsPDF
}

// ==================== EXPORT ====================
// Για να είναι προσβάσιμες οι συναρτήσεις από το HTML
window.selectDestination = selectDestination;
window.selectDestinationQuick = selectDestinationQuick;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.saveBudgetAndDays = saveBudgetAndDays;
window.navigateToStep = navigateToStep;
window.searchBooking = searchBooking;
window.searchAirbnb = searchAirbnb;
window.searchExpedia = searchExpedia;
window.searchHotelsCom = searchHotelsCom;
window.openFamilyModal = openFamilyModal;
window.closeFamilyModal = closeFamilyModal;
window.addMemberInModal = addMemberInModal;
window.updateMemberType = updateMemberType;
window.updateMemberName = updateMemberName;
window.updateMemberAge = updateMemberAge;
window.removeMemberInModal = removeMemberInModal;
window.saveFamilyMembers = saveFamilyMembers;
window.loadCityActivities = loadCityActivities;
window.toggleActivitySelection = toggleActivitySelection;
window.generatePDF = generatePDF;
window.initializeMap = initializeMap;
window.addCustomMarker = addCustomMarker;
window.focusOnMapActivity = focusOnMapActivity;
window.showRouteBetweenActivities = showRouteBetweenActivities;
window.resetAllData = resetAllData;

console.log('✅ Όλες οι συναρτήσεις φορτώθηκαν!');
