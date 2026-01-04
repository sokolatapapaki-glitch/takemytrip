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
    
    // QUICK FIX: Απόκρυψη διπλών κουμπιών
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
    
    console.log('✅ Αρχικοποίηση ολοκληρώθηκε');
}

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
    // Κουμπί διαγραφής
    document.getElementById('reset-all').addEventListener('click', function() {
        if (confirm('⚠️ Θέλετε να διαγράψετε όλα τα δεδομένα;')) {
            localStorage.clear();
            location.reload();
        }
    });
    
    // Budget tracker
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
// Αυτή η συνάρτηση φτιάχνει όλα τα κουμπιά όταν φορτώνεται το βήμα destination
function fixDestinationButtons() {
    console.log('🔧 Εφαρμογή fix για κουμπιά προορισμού...');
    
    // Χρήση event delegation για να τα βρίσκει όλα
    document.addEventListener('click', function(event) {
        // Ανάκτηση του πραγματικού στοιχείου που πατήθηκε
        let target = event.target;
        
        // Αν πατήθηκε εντός κουμπιού, πήγαινε στο κουμπί
        while (target && !target.classList.contains('btn')) {
            target = target.parentElement;
        }
        
        if (!target) return;
        
        const buttonText = target.textContent || '';
        
        // 1. Κουμπί "ΑΝΑΖΗΤΗΣΗ ΠΡΟΟΡΙΣΜΩΝ"
        if (buttonText.includes('ΑΝΑΖΗΤΗΣΗ') && buttonText.includes('ΠΡΟΟΡΙΣΜΩΝ')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('🔍 Κουμπί ΑΝΑΖΗΤΗΣΗΣ πατήθηκε');
            filterDestinations();
            return false;
        }
        
        // 2. Κουμπί "ΕΧΩ ΗΔΗ ΒΡΕΙ ΠΡΟΟΡΙΣΜΟ"
        if (buttonText.includes('ΕΧΩ ΗΔΗ ΒΡΕΙ')) {
            event.preventDefault();
            event.stopPropagation();
            console.log('🚀 Κουμπί ΕΧΩ ΗΔΗ ΒΡΕΙ πατήθηκε');
            showManualDestinationModal();
            return false;
        }
        
        // 3. Γρήγορες Προτάσεις
        if (buttonText.includes('Γρήγορες Προτάσεις')) {
            event.preventDefault();
            event.stopPropagation();
            showQuickRecommendations();
            return false;
        }
        
        // 4. Επαναφορά
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
            
            <!-- ΚΟΥΜΠΙΑ ΔΡΑΣΗΣ - ΜΟΝΟ ΑΥΤΑ ΠΡΕΠΕΙ ΝΑ ΜΕΝΟΥΝ -->
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
    
    // Εφαρμογή fix για τα κουμπιά
    fixDestinationButtons();
    
    // Χειροκίνητα event listeners για τα κύρια κουμπιά
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

// ==================== MANUAL DESTINATION MODAL ====================
function showManualDestinationModal() {
    console.log('📋 Άνοιγμα modal για χειροκίνητη επιλογή');
    document.getElementById('manual-destination-modal').style.display = 'flex';
    
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
    
    // Ενημέρωση χρήστη
    alert(`✅ Επιλέξατε: ${cityName}\n\nΤώρα μπορείτε να συνεχίσετε στις πτήσεις.`);
    
    // Αποθήκευση
    saveState();
    
    // Αυτόματη μετάβαση στο επόμενο βήμα
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
    
    // LOADING INDICATOR
    resultsDiv.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px;">
            <div class="loading">
                <i class="fas fa-search fa-spin fa-3x" style="color: var(--primary); margin-bottom: 20px;"></i>
                <h3 style="color: var(--dark); margin-bottom: 10px;">Αναζήτηση Προορισμών</h3>
                <p style="color: var(--gray);">Εφαρμογή φίλτρων και φόρτωση δεδομένων...</p>
            </div>
        </div>
    `;
    
    // Μικρή καθυστέρηση για UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Λίστα πόλεων (απλοποιημένη)
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
    
    // Εμφάνιση αποτελεσμάτων
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
    
    // Ενημέρωση sidebar
    document.getElementById('current-destination-display').textContent = destinationName;
    
    // Ενημέρωση χρήστη
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

// ==================== WINDOW FUNCTIONS ====================
// Εξαγωγή όλων των συναρτήσεων στο window object
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

console.log('✅ Script.js loaded successfully!');

// Οι υπόλοιπες συναρτήσεις (flight, hotel, activities, κλπ) παραμένουν ίδιες
// Εδώ προσθέτουμε μόνο το fix για τα κουμπιά
