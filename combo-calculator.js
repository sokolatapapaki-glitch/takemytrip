// ==================== COMBO CALCULATOR ====================
// Αποθηκεύετε ως: combo-calculator.js
// ΑΝΕΞΑΡΤΗΤΟ ΑΡΧΕΙΟ - ΔΕΝ ΑΛΛΑΖΕΙ ΤΙΠΟΤΑ ΑΠΟ ΤΟ ΥΠΑΡΧΟΝ ΚΩΔΙΚΑ

console.log('✅ Combo Calculator loaded!');

// ==================== GLOBAL COMBO VARIABLES ====================
let comboModalOpen = false;
let currentComboResults = null;

// ==================== COMBO DATA ====================
const CITY_COMBOS = {
    'Λονδίνο': [
        {
            name: '🎡 London Attractions Pass',
            description: 'Εξοικονόμηση σε 3+ αξιοθέατα του Λονδίνου',
            includedKeywords: ['Eye', 'Sea Life', 'Madame', 'Tower', 'Dungeon', 'Shrek'],
            discount: 25, // 25% έκπτωση
            minActivities: 2,
            note: 'Merlin Pass - Καλύπτει τα πιο δημοφιλή αξιοθέατα'
        },
        {
            name: '🎫 London Pass (2 ημέρες)',
            description: 'Πρόσβαση σε 80+ αξιοθέατα & δωρεάν μεταφορές',
            includedKeywords: ['Tower of London', 'Westminster', 'St. Paul', 'Thames'],
            discount: 40,
            minActivities: 3,
            note: 'Καλύπτει μουσεία, αξιοθέατα και river cruises'
        }
    ],
    'Βιέννη': [
        {
            name: '👑 Vienna PASS',
            description: 'Πρόσβαση σε 70+ αξιοθέατα της Βιέννης',
            includedKeywords: ['Schönbrunn', 'Sisi', 'Hofburg', 'Palace', 'Museum'],
            discount: 35,
            minActivities: 3,
            note: 'Απεριόριστες εισόδους για 1, 2, 3 ή 6 ημέρες'
        },
        {
            name: '🏛️ Museum Combo',
            description: '3 μουσεία σε ειδική τιμή',
            includedKeywords: ['Museum', 'Gallery', 'Art', 'History'],
            discount: 20,
            minActivities: 3,
            note: 'Επιλέξτε 3 από τα κρατικά μουσεία'
        }
    ],
    'Παρίσι': [
        {
            name: '🗼 Paris Museum Pass',
            description: 'Πρόσβαση σε 50+ μουσεία και μνημεία',
            includedKeywords: ['Louvre', 'Orsay', 'Versailles', 'Palace', 'Museum'],
            discount: 30,
            minActivities: 2,
            note: 'Απαλλαγή από τις ουρές!'
        }
    ],
    'Βερολίνο': [
        {
            name: '🎫 Berlin WelcomeCard',
            description: 'Δωρεάν μεταφορές + εκπτώσεις σε αξιοθέατα',
            includedKeywords: ['Museum', 'Tower', 'Palace', 'Checkpoint'],
            discount: 25,
            minActivities: 2,
            note: 'Συμπεριλαμβάνει δωρεάν μεταφορές ABC ζώνη'
        }
    ]
};

// ==================== MAIN COMBO FUNCTION ====================
function calculateSmartCombos() {
    console.log('🔍 Calculating smart combos...');
    
    // Έλεγχος συνθηκών
    if (!window.APP_STATE || !window.APP_STATE.destination) {
        showComboNotification('⚠️ Πρέπει να επιλέξετε προορισμό πρώτα', 'warning');
        return;
    }
    
    if (!window.APP_STATE.selectedActivities || window.APP_STATE.selectedActivities.length < 2) {
        showComboNotification('⚠️ Χρειάζονται τουλάχιστον 2 δραστηριότητες για combos', 'warning');
        return;
    }
    
    if (!window.APP_STATE.familyMembers || window.APP_STATE.familyMembers.length === 0) {
        showComboNotification('⚠️ Πρέπει να έχετε ορίσει μέλη οικογένειας', 'warning');
        return;
    }
    
    // Υπολογισμός κανονικού κόστους
    const regularCost = calculateTotalComboCost();
    
    // Αναζήτηση διαθέσιμων combos
    const availableCombos = findAvailableCombos();
    
    // Εύρεση καλύτερου combo
    const bestCombo = findBestCombo(availableCombos);
    const bestSaving = bestCombo ? bestCombo.saving : 0;
    
    // Αποθήκευση αποτελεσμάτων
    currentComboResults = {
        regularCost: regularCost,
        availableCombos: availableCombos,
        bestCombo: bestCombo,
        bestSaving: bestSaving,
        timestamp: new Date().toISOString()
    };
    
    // Εμφάνιση modal
    showComboModal();
}

// ==================== HELPER FUNCTIONS ====================
function calculateTotalComboCost() {
    if (!window.APP_STATE || !window.APP_STATE.selectedActivities) return 0;
    
    return window.APP_STATE.selectedActivities.reduce((total, activity) => {
        return total + calculateActivityComboPrice(activity);
    }, 0);
}

function calculateActivityComboPrice(activity) {
    if (!window.APP_STATE || !window.APP_STATE.familyMembers) return 0;
    
    let total = 0;
    window.APP_STATE.familyMembers.forEach(member => {
        if (member.age >= 18) {
            total += activity.adultPrice || 0;
        } else {
            total += activity.childPrice || 0;
        }
    });
    return total;
}

function findAvailableCombos() {
    const destination = window.APP_STATE.destination;
    const selectedActivities = window.APP_STATE.selectedActivities;
    
    if (!destination || !selectedActivities) return [];
    
    const cityCombos = CITY_COMBOS[destination] || [];
    const availableCombos = [];
    
    cityCombos.forEach(comboTemplate => {
        // Βρες ποιες δραστηριότητες καλύπτονται
        const matchingActivities = selectedActivities.filter(activity => {
            return comboTemplate.includedKeywords.some(keyword => 
                activity.name.toLowerCase().includes(keyword.toLowerCase())
            );
        });
        
        if (matchingActivities.length >= comboTemplate.minActivities) {
            // Υπολογισμός κόστους
            const regularPrice = matchingActivities.reduce((sum, activity) => {
                return sum + calculateActivityComboPrice(activity);
            }, 0);
            
            const comboPrice = Math.round(regularPrice * (1 - comboTemplate.discount / 100));
            const saving = regularPrice - comboPrice;
            
            if (saving > 0) {
                availableCombos.push({
                    ...comboTemplate,
                    matchingActivities: matchingActivities.map(a => a.name),
                    regularPrice: regularPrice,
                    comboPrice: comboPrice,
                    saving: saving,
                    discount: comboTemplate.discount
                });
            }
        }
    });
    
    // Προσθήκη γενικού combo αν υπάρχουν πολλές δραστηριότητες
    if (selectedActivities.length >= 3) {
        const regularPrice = calculateTotalComboCost();
        const discount = selectedActivities.length >= 5 ? 15 : 10;
        const comboPrice = Math.round(regularPrice * (1 - discount / 100));
        const saving = regularPrice - comboPrice;
        
        if (saving > 0) {
            availableCombos.push({
                name: `🏷️ Family Package (${selectedActivities.length} activities)`,
                description: `Εκπτωτικό πακέτο για ${selectedActivities.length} δραστηριότητες`,
                matchingActivities: selectedActivities.map(a => a.name),
                regularPrice: regularPrice,
                comboPrice: comboPrice,
                saving: saving,
                discount: discount,
                note: `${discount}% έκπτωση για ${selectedActivities.length} δραστηριότητες`
            });
        }
    }
    
    return availableCombos;
}

function findBestCombo(combos) {
    if (!combos || combos.length === 0) return null;
    
    return combos.reduce((best, current) => {
        return current.saving > best.saving ? current : best;
    }, combos[0]);
}

// ==================== MODAL FUNCTIONS ====================
function showComboModal() {
    if (comboModalOpen) return;
    
    const modalHTML = `
        <div class="combo-modal-overlay" id="combo-modal">
            <div class="combo-modal">
                <div class="combo-modal-header">
                    <h2>
                        <i class="fas fa-percentage"></i>
                        Έξυπνος Υπολογισμός Combos
                    </h2>
                    <button class="combo-modal-close" onclick="closeComboModal()">
                        &times;
                    </button>
                </div>
                
                <div class="combo-modal-body">
                    ${renderComboResults()}
                </div>
                
                <div class="combo-modal-footer">
                    ${currentComboResults.bestCombo ? `
                        <button class="combo-btn-apply" onclick="applyBestCombo()">
                            <i class="fas fa-check-circle"></i>
                            Εφαρμογή Καλύτερου Combo
                        </button>
                    ` : ''}
                    
                    <button class="combo-btn-close" onclick="closeComboModal()">
                        Κλείσιμο
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Προσθήκη CSS αν δεν υπάρχει
    if (!document.querySelector('#combo-styles')) {
        addComboStyles();
    }
    
    // Προσθήκη modal στο DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    comboModalOpen = true;
}

function renderComboResults() {
    if (!currentComboResults) return '<p>Δεν υπάρχουν αποτελέσματα</p>';
    
    const { regularCost, availableCombos, bestCombo, bestSaving } = currentComboResults;
    
    let html = `
        <div class="combo-summary">
            <div class="combo-summary-card">
                <h3>📊 Σύνοψη</h3>
                <div class="combo-summary-grid">
                    <div class="combo-summary-item">
                        <span class="combo-label">Κανονικό Κόστος:</span>
                        <span class="combo-value">${regularCost.toFixed(2)}€</span>
                    </div>
                    <div class="combo-summary-item">
                        <span class="combo-label">Διαθέσιμα Combos:</span>
                        <span class="combo-value">${availableCombos.length}</span>
                    </div>
                    ${bestCombo ? `
                        <div class="combo-summary-item">
                            <span class="combo-label">Μέγιστη Εξοικονόμηση:</span>
                            <span class="combo-value saving">${bestSaving.toFixed(2)}€</span>
                        </div>
                        <div class="combo-summary-item">
                            <span class="combo-label">Νέο Κόστος:</span>
                            <span class="combo-value new-cost">${(regularCost - bestSaving).toFixed(2)}€</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    if (availableCombos.length > 0) {
        html += `<div class="combo-list">`;
        
        availableCombos.forEach((combo, index) => {
            const isBest = combo === bestCombo;
            
            html += `
                <div class="combo-card ${isBest ? 'best-combo' : ''}">
                    ${isBest ? '<div class="combo-badge">🏆 ΚΑΛΥΤΕΡΟ</div>' : ''}
                    
                    <div class="combo-card-header">
                        <h3>${combo.name}</h3>
                        <span class="combo-discount">-${combo.discount}%</span>
                    </div>
                    
                    <p class="combo-description">${combo.description}</p>
                    
                    <div class="combo-prices">
                        <div class="combo-price-old">
                            <span class="price-label">Κανονικά:</span>
                            <span class="price-value">${combo.regularPrice.toFixed(2)}€</span>
                        </div>
                        <div class="combo-price-new">
                            <span class="price-label">Combo:</span>
                            <span class="price-value">${combo.comboPrice.toFixed(2)}€</span>
                        </div>
                    </div>
                    
                    <div class="combo-saving">
                        <span class="saving-label">Εξοικονόμηση:</span>
                        <span class="saving-value">${combo.saving.toFixed(2)}€</span>
                    </div>
                    
                    ${combo.note ? `
                        <div class="combo-note">
                            <i class="fas fa-info-circle"></i>
                            ${combo.note}
                        </div>
                    ` : ''}
                    
                    <div class="combo-activities">
                        <strong>Καλύπτει ${combo.matchingActivities.length} δραστηριότητες:</strong>
                        <ul>
                            ${combo.matchingActivities.map(activity => `<li>${activity}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
    } else {
        html += `
            <div class="combo-empty">
                <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                <h3>Δεν βρέθηκαν combos</h3>
                <p>Δοκιμάστε με διαφορετικές ή περισσότερες δραστηριότητες.</p>
                <p class="combo-tip">
                    💡 <strong>Συμβουλή:</strong> Τα combos συνήθως υπάρχουν για δραστηριότητες 
                    της ίδιας εταιρείας ή γειτονικά αξιοθέατα.
                </p>
            </div>
        `;
    }
    
    return html;
}

function closeComboModal() {
    const modal = document.getElementById('combo-modal');
    if (modal) {
        modal.remove();
    }
    comboModalOpen = false;
    currentComboResults = null;
}

function applyBestCombo() {
    if (!currentComboResults || !currentComboResults.bestCombo) {
        showComboNotification('⚠️ Δεν υπάρχει combo για εφαρμογή', 'warning');
        return;
    }
    
    const bestCombo = currentComboResults.bestCombo;
    const newTotal = currentComboResults.regularCost - bestCombo.saving;
    
    // Ενημέρωση του συνολικού κόστους (θα μπορούσε να είναι πιο προχωρημένο)
    const totalElement = document.querySelector('.total-amount, #total-activities-cost');
    if (totalElement) {
        totalElement.textContent = `${newTotal.toFixed(2)}€`;
        totalElement.style.color = '#2ecc71';
        totalElement.innerHTML += ' <span style="color: #27ae60; font-size: 0.8em;">(με combo)</span>';
    }
    
    showComboNotification(`✅ Εφαρμόστηκε το "${bestCombo.name}"! Εξοικονόμηση: ${bestCombo.saving.toFixed(2)}€`, 'success');
    closeComboModal();
}

// ==================== STYLES ====================
function addComboStyles() {
    const style = document.createElement('style');
    style.id = 'combo-styles';
    style.textContent = `
        /* COMBO MODAL */
        .combo-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        
        .combo-modal {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease;
        }
        
        .combo-modal-header {
            background: linear-gradient(135deg, #9c27b0, #673ab7);
            color: white;
            padding: 20px;
            border-radius: 12px 12px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .combo-modal-header h2 {
            margin: 0;
            font-size: 1.5em;
        }
        
        .combo-modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 28px;
            cursor: pointer;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.2s;
        }
        
        .combo-modal-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .combo-modal-body {
            padding: 25px;
        }
        
        .combo-modal-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 15px;
            justify-content: flex-end;
        }
        
        /* COMBO SUMMARY */
        .combo-summary-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
            border: 2px solid #e9ecef;
        }
        
        .combo-summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .combo-summary-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .combo-label {
            font-size: 0.9em;
            color: #666;
        }
        
        .combo-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #333;
        }
        
        .combo-value.saving {
            color: #27ae60;
        }
        
        .combo-value.new-cost {
            color: #2ecc71;
            font-size: 1.3em;
        }
        
        /* COMBO CARDS */
        .combo-card {
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            position: relative;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .combo-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .combo-card.best-combo {
            border-color: #9c27b0;
            background: linear-gradient(to right, rgba(156, 39, 176, 0.05), rgba(103, 58, 183, 0.05));
        }
        
        .combo-badge {
            position: absolute;
            top: -10px;
            right: 20px;
            background: #9c27b0;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            box-shadow: 0 3px 10px rgba(156, 39, 176, 0.3);
        }
        
        .combo-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .combo-card-header h3 {
            margin: 0;
            color: #333;
        }
        
        .combo-discount {
            background: #ff9800;
            color: white;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9em;
        }
        
        .combo-description {
            color: #666;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        
        .combo-prices {
            display: flex;
            gap: 30px;
            margin-bottom: 15px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .combo-price-old, .combo-price-new {
            flex: 1;
        }
        
        .price-label {
            display: block;
            font-size: 0.9em;
            color: #666;
            margin-bottom: 5px;
        }
        
        .combo-price-old .price-value {
            font-size: 1.3em;
            color: #e74c3c;
            text-decoration: line-through;
            font-weight: bold;
        }
        
        .combo-price-new .price-value {
            font-size: 1.5em;
            color: #27ae60;
            font-weight: bold;
        }
        
        .combo-saving {
            background: #d4edda;
            color: #155724;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .saving-label {
            font-weight: bold;
        }
        
        .saving-value {
            font-size: 1.3em;
            font-weight: bold;
        }
        
        .combo-note {
            background: #d1ecf1;
            color: #0c5460;
            padding: 10px;
            border-radius: 6px;
            font-size: 0.9em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .combo-activities {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #eee;
        }
        
        .combo-activities ul {
            margin: 10px 0 0 0;
            padding-left: 20px;
        }
        
        .combo-activities li {
            margin-bottom: 5px;
            color: #555;
        }
        
        /* COMBO BUTTONS */
        .combo-btn-apply {
            background: linear-gradient(135deg, #9c27b0, #673ab7);
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 1em;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .combo-btn-apply:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(156, 39, 176, 0.3);
        }
        
        .combo-btn-close {
            background: #6c757d;
            color: white;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
        }
        
        .combo-btn-close:hover {
            background: #5a6268;
        }
        
        /* EMPTY STATE */
        .combo-empty {
            text-align: center;
            padding: 40px 20px;
            color: #666;
        }
        
        .combo-tip {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: left;
        }
        
        /* ANIMATIONS */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(30px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* NOTIFICATIONS */
        .combo-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10001;
            animation: slideInRight 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        }
        
        .combo-notification.success {
            background: #27ae60;
            border-left: 5px solid #219653;
        }
        
        .combo-notification.warning {
            background: #f39c12;
            border-left: 5px solid #e67e22;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* RESPONSIVE */
        @media (max-width: 768px) {
            .combo-modal {
                width: 95%;
                margin: 10px;
            }
            
            .combo-summary-grid {
                grid-template-columns: 1fr;
            }
            
            .combo-prices {
                flex-direction: column;
                gap: 15px;
            }
            
            .combo-modal-footer {
                flex-direction: column;
            }
        }
    `;
    
    document.head.appendChild(style);
}

function showComboNotification(message, type = 'info') {
    // Δημιουργία notification
    const notification = document.createElement('div');
    notification.className = `combo-notification ${type}`;
    notification.textContent = message;
    
    // Προσθήκη στο DOM
    document.body.appendChild(notification);
    
    // Αφαίρεση μετά από 3 δευτερόλεπτα
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
    
    // CSS για την animation
    if (!document.querySelector('#combo-notification-animation')) {
        const style = document.createElement('style');
        style.id = 'combo-notification-animation';
        style.textContent = `
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// ==================== ADD COMBO BUTTON TO UI ====================
function addComboButtonToUI() {
    // Περιμένουμε να φορτωθεί το DOM
    setTimeout(() => {
        // Ψάχνουμε το activities step container - ΑΛΛΑΓΗ ΕΔΩ
        const checkInterval = setInterval(() => {
            // ΜΕΤΑΒΛΗΤΗ ΑΝΑΖΗΤΗΣΗΣ:
            // Ψάχνουμε το activities container, ΟΧΙ το sidebar
            const activitiesStep = document.querySelector('#step-content .activities-step, .activities-step, [data-step="activities"]');
            
            if (activitiesStep) {
                clearInterval(checkInterval);
                
                // Έλεγχος αν υπάρχει ήδη το κουμπί
                if (activitiesStep.querySelector('.combo-button-container')) {
                    console.log('✅ Combo button already exists');
                    return;
                }
                
                // Προσθήκη του κουμπιού ΜΕΣΑ στο activities container
                const comboButtonHTML = `
                    <div class="combo-button-container" style="text-align: center; margin: 25px 0;">
                        <button onclick="calculateSmartCombos()" 
                                class="combo-main-button"
                                style="background: linear-gradient(135deg, #9c27b0, #673ab7); 
                                       color: white; 
                                       border: none; 
                                       padding: 16px 40px; 
                                       border-radius: 50px; 
                                       font-size: 1.1em; 
                                       font-weight: bold; 
                                       cursor: pointer;
                                       box-shadow: 0 5px 20px rgba(156, 39, 176, 0.3);
                                       transition: all 0.3s ease;">
                            <i class="fas fa-percentage" style="margin-right: 10px;"></i>
                            💰 Έξυπνος Υπολογισμός Combos
                        </button>
                        <p style="color: #666; margin-top: 10px; font-size: 0.9em;">
                            Βρίσκει αυτόματα τα καλύτερα combos για εξοικονόμηση χρημάτων
                        </p>
                    </div>
                `;
                
                // Προσθήκη ΜΕΣΑ στο activities step
                // Ψάχνουμε το total cost card ή το activities container
                const totalCostCard = activitiesStep.querySelector('.total-cost-card');
                const activitiesGrid = activitiesStep.querySelector('.activities-grid');
                
                if (totalCostCard) {
                    // Προσθήκη ΠΑΝΩ από το total cost
                    totalCostCard.insertAdjacentHTML('beforebegin', comboButtonHTML);
                } else if (activitiesGrid) {
                    // Προσθήκη ΚΑΤΩ από τις δραστηριότητες
                    activitiesGrid.insertAdjacentHTML('afterend', comboButtonHTML);
                } else {
                    // Προσθήκη στο τέλος του container
                    activitiesStep.insertAdjacentHTML('beforeend', comboButtonHTML);
                }
                
                console.log('✅ Combo button added to activities step!');
            }
        }, 1000); // Μείωσε το interval για γρηγορότερη εμφάνιση
    }, 500);
}

function initComboCalculator() {
    console.log('🚀 Combo Calculator initialized!');
    
    // Προσθήκη του κουμπιού στο UI
    addComboButtonToUI();
    
    // Προσθήκη global functions για πρόσβαση από HTML
    window.calculateSmartCombos = calculateSmartCombos;
    window.closeComboModal = closeComboModal;
    window.applyBestCombo = applyBestCombo;
}

// ==================== EXPORT ====================
// Το module είναι έτοιμο για χρήση!
console.log('🎯 Combo Calculator ready!');
