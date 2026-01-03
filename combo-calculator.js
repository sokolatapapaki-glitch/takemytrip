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

// ==================== ΚΥΡΙΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ====================
function calculateSmartCombos() {
    console.log('🔍 Calculating smart combos...');
    
    // 1. Βρες επιλεγμένες δραστηριότητες
    const selectedCards = document.querySelectorAll('.activity-card.selected, .activity-item.selected');
    
    if (selectedCards.length < 2) {
        alert(`⚠️ Χρειάζονται τουλάχιστον 2 δραστηριότητες (έχετε ${selectedCards.length})`);
        return;
    }
    
    // 2. Βρες τον προορισμό
    let destination = '';
    const destinationEl = document.querySelector('.destination-card.selected, [data-destination].selected');
    if (destinationEl) {
        destination = destinationEl.dataset.destination || destinationEl.textContent.trim();
    }
    
    if (!destination) {
        destination = 'Βιέννη';
    }
    
    // 3. Συλλογή πληροφοριών για τις δραστηριότητες
    const selectedActivities = [];
    selectedCards.forEach(card => {
        const name = card.querySelector('h4, h3, .activity-name')?.textContent?.trim() || 'Activity';
        const priceText = card.querySelector('.price, .activity-price, .cost')?.textContent || '25';
        const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 25;
        
        selectedActivities.push({
            name: name,
            adultPrice: price,
            childPrice: price * 0.7
        });
    });
    
    // 4. Βρες μέλη οικογένειας
    const adultCount = 2;
    const childCount = 1;
    const familyMembers = [];
    for (let i = 0; i < adultCount; i++) familyMembers.push({ age: 35 });
    for (let i = 0; i < childCount; i++) familyMembers.push({ age: 10 });
    
    // 5. Δημιούργησε APP_STATE
    window.APP_STATE = {
        destination: destination,
        selectedActivities: selectedActivities,
        familyMembers: familyMembers
    };
    
    // 6. Υπολογισμός
    const regularCost = calculateTotalComboCost();
    const availableCombos = findAvailableCombos();
    const bestCombo = findBestCombo(availableCombos);
    const bestSaving = bestCombo ? bestCombo.saving : 0;
    
    // 7. Αποθήκευση αποτελεσμάτων
    currentComboResults = {
        regularCost: regularCost,
        availableCombos: availableCombos,
        bestCombo: bestCombo,
        bestSaving: bestSaving
    };
    
    // 8. Εμφάνιση modal
    showComboModal();
}

// ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ
function calculateTotalComboCost() {
    if (!window.APP_STATE) return 0;
    
    return window.APP_STATE.selectedActivities.reduce((total, activity) => {
        let activityTotal = 0;
        window.APP_STATE.familyMembers.forEach(member => {
            activityTotal += member.age >= 18 ? activity.adultPrice : activity.childPrice;
        });
        return total + activityTotal;
    }, 0);
}

function findAvailableCombos() {
    if (!window.APP_STATE) return [];
    
    const destination = window.APP_STATE.destination;
    const selectedActivities = window.APP_STATE.selectedActivities;
    
    const cityCombos = CITY_COMBOS[destination] || [];
    const availableCombos = [];
    
    cityCombos.forEach(comboTemplate => {
        const matchingActivities = selectedActivities.filter(activity => {
            return comboTemplate.includedKeywords.some(keyword => 
                activity.name.toLowerCase().includes(keyword.toLowerCase())
            );
        });
        
        if (matchingActivities.length >= comboTemplate.minActivities) {
            const regularPrice = matchingActivities.reduce((sum, activity) => {
                let activityPrice = 0;
                window.APP_STATE.familyMembers.forEach(member => {
                    activityPrice += member.age >= 18 ? activity.adultPrice : activity.childPrice;
                });
                return sum + activityPrice;
            }, 0);
            
            const comboPrice = Math.round(regularPrice * (1 - comboTemplate.discount / 100));
            const saving = regularPrice - comboPrice;
            
            availableCombos.push({
                ...comboTemplate,
                matchingActivities: matchingActivities.map(a => a.name),
                regularPrice: regularPrice,
                comboPrice: comboPrice,
                saving: saving
            });
        }
    });
    
    // Fallback combo
    if (availableCombos.length === 0 && selectedActivities.length >= 2) {
        const adultCount = window.APP_STATE.familyMembers.filter(m => m.age >= 18).length;
        const childCount = window.APP_STATE.familyMembers.filter(m => m.age < 18).length;
        
        const firstTwo = selectedActivities.slice(0, 2);
        const regularPrice = firstTwo.reduce((sum, activity) => {
            return sum + (activity.adultPrice * adultCount + activity.childPrice * childCount);
        }, 0);
        
        const comboPrice = Math.round(regularPrice * 0.85);
        const saving = regularPrice - comboPrice;
        
        availableCombos.push({
            name: '🎯 Family Combo',
            description: 'Ειδική προσφορά για 2 δραστηριότητες',
            matchingActivities: firstTwo.map(a => a.name),
            regularPrice: regularPrice,
            comboPrice: comboPrice,
            saving: saving,
            discount: 15,
            note: '15% έκπτωση για οικογένειες'
        });
    }
    
    return availableCombos;
}

function findBestCombo(combos) {
    if (!combos || combos.length === 0) return null;
    return combos.reduce((best, current) => current.saving > best.saving ? current : best, combos[0]);
}

// ==================== ΚΟΥΜΠΙ COMBO ====================
function addComboButton() {
    console.log('🔄 Trying to add combo button...');
    
    // Διάγραψε παλιό κουμπί αν υπάρχει
    const oldButton = document.querySelector('#combo-main-button, .combo-button');
    if (oldButton) oldButton.remove();
    
    // Δημιούργησε νέο κουμπί
    const buttonHTML = `
        <div id="combo-main-button" style="
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 9999;
        ">
            <button onclick="calculateSmartCombos()" style="
                background: linear-gradient(135deg, #9c27b0, #673ab7);
                color: white;
                padding: 16px 32px;
                border-radius: 50px;
                font-size: 16px;
                font-weight: bold;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 15px rgba(156, 39, 176, 0.4);
                display: flex;
                align-items: center;
                gap: 10px;
                transition: all 0.3s;
            ">
                <span style="font-size: 18px;">💰</span>
                <span>Έξυπνα Combos</span>
            </button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    console.log('✅ Combo button added!');
    
    // Προσθήκη hover effect
    const button = document.querySelector('#combo-main-button button');
    if (button) {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 6px 20px rgba(156, 39, 176, 0.6)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 4px 15px rgba(156, 39, 176, 0.4)';
        });
    }
    
    // Προσθήκη event listeners στα activity cards
    addActivityListeners();
}

function addActivityListeners() {
    const activityCards = document.querySelectorAll('.activity-card, .activity-item');
    
    console.log(`Found ${activityCards.length} activity cards`);
    
    activityCards.forEach(card => {
        // Καθαρισμός της επιλογής
        card.classList.remove('selected');
        
        // Προσθήκη click listener
        card.addEventListener('click', function(e) {
            // Αγνόησε clicks σε buttons
            if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
                return;
            }
            
            this.classList.toggle('selected');
            
            // Visual feedback
            if (this.classList.contains('selected')) {
                this.style.border = '3px solid #9c27b0';
                this.style.boxShadow = '0 0 10px rgba(156, 39, 176, 0.3)';
            } else {
                this.style.border = '';
                this.style.boxShadow = '';
            }
            
            console.log(`Selected: ${this.querySelector('h4, h3')?.textContent?.trim() || 'Activity'}`);
        });
        
        // Προσθήκη cursor pointer
        card.style.cursor = 'pointer';
    });
}

// ==================== MODAL FUNCTIONS ====================
function showComboModal() {
    if (comboModalOpen) return;
    
    const modalHTML = `
        <div id="combo-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        ">
            <div style="
                background: white;
                border-radius: 12px;
                width: 90%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                padding: 0;
            ">
                <div style="
                    background: linear-gradient(135deg, #9c27b0, #673ab7);
                    color: white;
                    padding: 20px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h2 style="margin: 0; font-size: 20px;">
                        <span style="margin-right: 10px;">💰</span>
                        Έξυπνος Υπολογισμός Combos
                    </h2>
                    <button onclick="closeComboModal()" style="
                        background: none;
                        border: none;
                        color: white;
                        font-size: 30px;
                        cursor: pointer;
                    ">
                        &times;
                    </button>
                </div>
                
                <div style="padding: 20px;">
                    ${renderComboResults()}
                </div>
                
                <div style="
                    padding: 20px;
                    border-top: 1px solid #eee;
                    display: flex;
                    gap: 10px;
                    justify-content: flex-end;
                ">
                    ${currentComboResults.bestCombo ? `
                        <button onclick="applyBestCombo()" style="
                            background: #9c27b0;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: bold;
                        ">
                            Εφαρμογή Combo
                        </button>
                    ` : ''}
                    
                    <button onclick="closeComboModal()" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">
                        Κλείσιμο
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    comboModalOpen = true;
}

function renderComboResults() {
    if (!currentComboResults) return '<p>Δεν υπάρχουν αποτελέσματα</p>';
    
    const { regularCost, availableCombos, bestCombo } = currentComboResults;
    
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0;">📊 Σύνοψη</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                <div>
                    <div style="font-size: 14px; color: #666;">Κανονικό Κόστος:</div>
                    <div style="font-size: 24px; font-weight: bold;">${regularCost.toFixed(2)}€</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #666;">Διαθέσιμα Combos:</div>
                    <div style="font-size: 24px; font-weight: bold;">${availableCombos.length}</div>
                </div>
            </div>
        </div>
    `;
    
    if (availableCombos.length > 0) {
        availableCombos.forEach((combo, index) => {
            const isBest = combo === bestCombo;
            
            html += `
                <div style="
                    border: 2px solid ${isBest ? '#9c27b0' : '#ddd'};
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    background: ${isBest ? 'rgba(156, 39, 176, 0.05)' : 'white'};
                    position: relative;
                ">
                    ${isBest ? `
                        <div style="
                            position: absolute;
                            top: -10px;
                            right: 20px;
                            background: #9c27b0;
                            color: white;
                            padding: 5px 10px;
                            border-radius: 15px;
                            font-size: 12px;
                            font-weight: bold;
                        ">
                            🏆 ΚΑΛΥΤΕΡΟ
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0;">${combo.name}</h3>
                        <span style="background: #ff9800; color: white; padding: 5px 10px; border-radius: 15px; font-weight: bold;">
                            -${combo.discount || 15}%
                        </span>
                    </div>
                    
                    <p style="color: #666; margin-bottom: 15px;">${combo.description}</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Κανονικά:</span>
                            <span style="text-decoration: line-through; color: #e74c3c; font-weight: bold;">${combo.regularPrice.toFixed(2)}€</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Combo:</span>
                            <span style="color: #27ae60; font-size: 20px; font-weight: bold;">${combo.comboPrice.toFixed(2)}€</span>
                        </div>
                    </div>
                    
                    <div style="background: #d4edda; color: #155724; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold;">
                            <span>Εξοικονόμηση:</span>
                            <span>${combo.saving.toFixed(2)}€</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 14px; color: #666;">
                        <strong>Καλύπτει:</strong> ${combo.matchingActivities.join(', ')}
                    </div>
                </div>
            `;
        });
    } else {
        html += `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                <h3>Δεν βρέθηκαν combos</h3>
                <p>Δοκιμάστε με διαφορετικές δραστηριότητες.</p>
            </div>
        `;
    }
    
    return html;
}

function closeComboModal() {
    const modal = document.getElementById('combo-modal');
    if (modal) modal.remove();
    comboModalOpen = false;
    currentComboResults = null;
}

function applyBestCombo() {
    if (!currentComboResults?.bestCombo) return;
    
    const bestCombo = currentComboResults.bestCombo;
    alert(`✅ Εφαρμόστηκε το "${bestCombo.name}"!\nΕξοικονόμηση: ${bestCombo.saving.toFixed(2)}€`);
    closeComboModal();
}

// ==================== ΕΚΚΙΝΗΣΗ ====================
// Κάνε τις συναρτήσεις διαθέσιμες
window.calculateSmartCombos = calculateSmartCombos;
window.closeComboModal = closeComboModal;
window.applyBestCombo = applyBestCombo;

// Προσθήκη DEBUG function
window.debugCombo = function() {
    console.log('=== DEBUG ===');
    console.log('Activity cards:', document.querySelectorAll('.activity-card, .activity-item').length);
    console.log('Selected activities:', document.querySelectorAll('.activity-card.selected, .activity-item.selected').length);
    console.log('Combo button exists:', !!document.querySelector('#combo-main-button'));
    addComboButton(); // Προσθήκη κουμπιού manual
};

// Αυτόματη εκκίνηση - ΑΠΛΗ ΛΟΓΙΚΗ!
console.log('🚀 Starting Combo Calculator...');

// Προσθήκη κουμπιού μετά από 3 δευτερόλεπτα
setTimeout(() => {
    console.log('⏰ 3 seconds passed, adding combo button...');
    addComboButton();
}, 3000);

// Προσθήκη ξανά κάθε 5 δευτερόλεπτα για safety
setInterval(() => {
    if (!document.querySelector('#combo-main-button')) {
        console.log('🔄 Re-adding combo button...');
        addComboButton();
    }
}, 5000);

// Προσθήκη με βάση DOM changes
const observer = new MutationObserver(() => {
    if (!document.querySelector('#combo-main-button')) {
        console.log('🔄 DOM changed, adding combo button...');
        setTimeout(addComboButton, 1000);
    }
});

observer.observe(document.body, { childList: true, subtree: true });

console.log('🎯 Combo Calculator ready!');
