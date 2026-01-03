// ==================== COMBO CALCULATOR - SIMPLIFIED ====================
console.log('✅ Combo Calculator loaded!');

// ==================== GLOBAL VARIABLES ====================
let comboButton = null;
let selectedActivities = new Set();

// ==================== COMBO DATA ====================
const CITY_COMBOS = {
    'Λονδίνο': [
        { name: 'London Attractions Pass', discount: 25, keywords: ['Eye', 'Tower', 'Dungeon'] },
        { name: 'London Pass', discount: 40, keywords: ['Tower', 'Westminster', 'Thames'] }
    ],
    'Βιέννη': [
        { name: 'Vienna PASS', discount: 35, keywords: ['Schönbrunn', 'Hofburg', 'Museum'] },
        { name: 'Museum Combo', discount: 20, keywords: ['Museum', 'Gallery', 'Art'] }
    ],
    'Παρίσι': [
        { name: 'Paris Museum Pass', discount: 30, keywords: ['Louvre', 'Orsay', 'Versailles'] }
    ],
    'Βερολίνο': [
        { name: 'Berlin WelcomeCard', discount: 25, keywords: ['Museum', 'Tower', 'Palace'] }
    ]
};

// ==================== ADD SIMPLE STYLES ====================
const style = document.createElement('style');
style.textContent = `
    .combo-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        background: linear-gradient(135deg, #4CAF50, #2196F3);
        color: white;
        border: none;
        border-radius: 50px;
        padding: 12px 24px;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.3s;
    }
    
    .combo-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.3);
    }
    
    .combo-selected {
        border: 3px solid #4CAF50 !important;
        box-shadow: 0 0 10px rgba(76, 175, 80, 0.5) !important;
        position: relative;
    }
    
    .combo-selected::after {
        content: "✓";
        position: absolute;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
    }
    
    .combo-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 100000;
    }
    
    .combo-modal-content {
        background: white;
        border-radius: 10px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        animation: fadeIn 0.3s;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
    }
`;
document.head.appendChild(style);

// ==================== SIMPLE COMBO BUTTON ====================
function createComboButton() {
    if (comboButton) return;
    
    comboButton = document.createElement('button');
    comboButton.className = 'combo-button';
    comboButton.innerHTML = '💰 Συνδυασμοί';
    comboButton.onclick = showComboModal;
    
    document.body.appendChild(comboButton);
    
    // Προσθήκη counter για επιλεγμένες δραστηριότητες
    updateButtonCounter();
}

function updateButtonCounter() {
    if (!comboButton) return;
    
    const count = selectedActivities.size;
    comboButton.innerHTML = count > 0 
        ? `💰 Συνδυασμοί (${count})` 
        : '💰 Συνδυασμοί';
}

// ==================== ACTIVITY SELECTION ====================
function enableActivitySelection() {
    // Βρες όλες τις δραστηριότητες με διαφορετικούς τρόπους
    const selectors = [
        '.activity-card',
        '.tour-card',
        '.package-card',
        '.product-item',
        '.card:has(.price):has(h3, h4)',
        '[class*="activity"]',
        '[class*="tour"]',
        '[class*="package"]'
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            if (element.closest('.combo-button')) return;
            
            // Αφαίρεση προηγούμενων listeners
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);
            
            // Προσθήκη click listener
            newElement.addEventListener('click', function(e) {
                // Αγνόησε clicks σε κουμπιά και links
                if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
                    e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }
                
                // Toggle selection
                const activityId = this.getAttribute('data-id') || 
                                   this.querySelector('h3,h4')?.textContent || 
                                   Math.random().toString();
                
                if (selectedActivities.has(activityId)) {
                    selectedActivities.delete(activityId);
                    this.classList.remove('combo-selected');
                } else {
                    selectedActivities.add(activityId);
                    this.classList.add('combo-selected');
                }
                
                updateButtonCounter();
                console.log('Επιλεγμένες:', selectedActivities.size);
            });
            
            // Προσθήκη cursor pointer
            newElement.style.cursor = 'pointer';
        });
    });
}

// ==================== COMBO CALCULATION ====================
function calculateCombos() {
    const count = selectedActivities.size;
    
    if (count < 2) {
        return {
            success: false,
            message: `Χρειάζονται τουλάχιστον 2 δραστηριότητες (έχετε ${count})`
        };
    }
    
    // Απλός υπολογισμός - μπορείς να προσαρμόσεις
    const basePrice = 25 * count; // Υποθετικό κόστος
    const availableCombos = [];
    
    // Για κάθε προορισμό
    for (const [city, combos] of Object.entries(CITY_COMBOS)) {
        combos.forEach(combo => {
            if (count >= 2) { // Όλα τα combos απαιτούν τουλάχιστον 2
                const discount = combo.discount;
                const regularPrice = basePrice;
                const comboPrice = regularPrice * (1 - discount/100);
                const saving = regularPrice - comboPrice;
                
                availableCombos.push({
                    name: combo.name,
                    city: city,
                    discount: discount,
                    regularPrice: regularPrice.toFixed(2),
                    comboPrice: comboPrice.toFixed(2),
                    saving: saving.toFixed(2),
                    activities: count
                });
            }
        });
    }
    
    // Προσθήκη γενικού combo αν δεν υπάρχουν άλλα
    if (availableCombos.length === 0) {
        const discount = 15;
        const comboPrice = basePrice * (1 - discount/100);
        const saving = basePrice - comboPrice;
        
        availableCombos.push({
            name: 'Family Combo',
            city: 'Γενικό',
            discount: discount,
            regularPrice: basePrice.toFixed(2),
            comboPrice: comboPrice.toFixed(2),
            saving: saving.toFixed(2),
            activities: count
        });
    }
    
    return {
        success: true,
        count: count,
        availableCombos: availableCombos,
        bestCombo: availableCombos.reduce((best, curr) => 
            parseFloat(curr.saving) > parseFloat(best.saving) ? curr : best, availableCombos[0])
    };
}

// ==================== MODAL ====================
function showComboModal() {
    // Κλείσιμο τυχόν υπάρχοντος modal
    const existingModal = document.querySelector('.combo-modal');
    if (existingModal) existingModal.remove();
    
    const result = calculateCombos();
    
    const modalHTML = `
        <div class="combo-modal">
            <div class="combo-modal-content">
                <div style="background: #4CAF50; color: white; padding: 15px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">💰 Συνδυασμοί</h3>
                    <button onclick="closeComboModal()" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
                </div>
                
                <div style="padding: 20px;">
                    ${!result.success ? `
                        <div style="text-align: center; padding: 20px;">
                            <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                            <h4 style="margin-bottom: 10px;">${result.message}</h4>
                            <p>Επιλέξτε τουλάχιστον 2 δραστηριότητες κάνοντας κλικ πάνω τους.</p>
                        </div>
                    ` : `
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Επιλεγμένες δραστηριότητες:</span>
                                <strong>${result.count}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Διαθέσιμα combos:</span>
                                <strong>${result.availableCombos.length}</strong>
                            </div>
                        </div>
                        
                        ${result.availableCombos.map((combo, index) => `
                            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; ${combo === result.bestCombo ? 'border-color: #4CAF50; background: #f0f9f0;' : ''}">
                                ${combo === result.bestCombo ? '<div style="background: #4CAF50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; display: inline-block; margin-bottom: 10px;">🏆 ΚΑΛΥΤΕΡΗ ΠΡΟΣΦΟΡΑ</div>' : ''}
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                    <h4 style="margin: 0;">${combo.name}</h4>
                                    <span style="background: #ff9800; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold;">-${combo.discount}%</span>
                                </div>
                                
                                <p style="color: #666; margin-bottom: 10px; font-size: 14px;">${combo.city} - Για ${combo.activities} δραστηριότητες</p>
                                
                                <div style="background: white; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                        <span>Κανονική τιμή:</span>
                                        <span style="text-decoration: line-through; color: #f44336;">${combo.regularPrice}€</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                                        <span>Τιμή combo:</span>
                                        <span style="color: #4CAF50;">${combo.comboPrice}€</span>
                                    </div>
                                </div>
                                
                                <div style="background: #e8f5e9; padding: 10px; border-radius: 6px;">
                                    <div style="display: flex; justify-content: space-between; font-weight: bold;">
                                        <span>Εξοικονόμηση:</span>
                                        <span style="color: #2e7d32;">${combo.saving}€</span>
                                    </div>
                                </div>
                                
                                <button onclick="applyCombo('${combo.name}', ${combo.comboPrice})" 
                                        style="width: 100%; background: #4CAF50; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                                    Εφαρμογή Combo
                                </button>
                            </div>
                        `).join('')}
                    `}
                </div>
                
                <div style="padding: 15px 20px; border-top: 1px solid #eee; text-align: center;">
                    <button onclick="closeComboModal()" 
                            style="background: #757575; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Κλείσιμο
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeComboModal() {
    const modal = document.querySelector('.combo-modal');
    if (modal) modal.remove();
}

function applyCombo(name, price) {
    alert(`✅ Εφαρμόστηκε το "${name}"!\n\nΝέο κόστος: ${price}€`);
    closeComboModal();
    // Εδώ μπορείς να προσθέσεις κώδικα για να ενημερώσεις το καλάθι
}

// ==================== INITIALIZATION ====================
function initializeComboCalculator() {
    console.log('🚀 Αρχικοποίηση Combo Calculator...');
    
    // 1. Δημιούργησε το κουμπί
    createComboButton();
    
    // 2. Ενεργοποίησε επιλογή δραστηριοτήτων
    enableActivitySelection();
    
    // 3. Προσθήκη listener για αλλαγές στη σελίδα
    const observer = new MutationObserver(() => {
        enableActivitySelection();
    });
    
    observer.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
    
    console.log('✅ Combo Calculator ready!');
}

// ==================== EXPORT FUNCTIONS ====================
window.closeComboModal = closeComboModal;
window.applyCombo = applyCombo;

// ==================== START ====================
// Περίμενε να φορτωθεί η σελίδα
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeComboCalculator);
} else {
    initializeComboCalculator();
}

// Εναλλακτικά, ξεκίνα με καθυστέρηση για να φορτωθεί πλήρως η σελίδα
setTimeout(initializeComboCalculator, 1000);
