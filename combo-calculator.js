// ==================== COMBO CALCULATOR ====================
// Αποθηκεύετε ως: combo-calculator.js
// ΒΕΛΤΙΩΜΕΝΗ ΕΚΔΟΣΗ - ΔΙΑΧΕΙΡΙΣΗ ΠΡΟ-ΕΠΙΛΕΓΜΕΝΩΝ

console.log('✅ Combo Calculator with Pre-Selected handling loaded!');

// ==================== GLOBAL VARIABLES ====================
let comboModalOpen = false;
let currentComboResults = null;
let ignorePreSelected = false; // Νέα μεταβλητή για παραβίαση προεπιλογών

// ==================== CSS STYLES ====================
function addComboStyles() {
    const style = document.createElement('style');
    style.id = 'combo-calculator-styles';
    style.textContent = `
        /* ... (όλα τα προηγούμενα styles παραμένουν ίδια) ... */
        
        /* Στυλ για προ-επιλεγμένες δραστηριότητες */
        .activity-card.pre-selected,
        .activity-item.pre-selected {
            position: relative;
            border: 2px dashed #ff9800 !important;
        }
        .activity-card.pre-selected::before,
        .activity-item.pre-selected::before {
            content: "Προεπιλογή";
            position: absolute;
            top: 5px;
            right: 5px;
            background: #ff9800;
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            z-index: 1;
        }
        
        /* Checkbox για προεπιλογές */
        .combo-pre-select-option {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 10px;
            margin: 10px 0;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .combo-pre-select-option input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
        }
        .combo-pre-select-option label {
            cursor: pointer;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

// ==================== ΕΝΗΜΕΡΩΜΕΝΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ====================

// Νέα συνάρτηση για ανίχνευση προ-επιλεγμένων δραστηριοτήτων
function detectPreSelectedActivities() {
    const activitySelectors = [
        '.activity-card',
        '.activity-item',
        '.package-item',
        '.product-item',
        '.tour-item',
        '[data-activity]',
        '.card:has(.price)'
    ];
    
    let preSelected = [];
    let allActivities = [];
    
    activitySelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (!el.closest('#combo-main-button')) {
                allActivities.push(el);
                
                // Ελέγχει για προ-επιλεγμένα
                const hasPreselectedClass = el.classList.contains('selected') || 
                                           el.classList.contains('active') ||
                                           el.classList.contains('default');
                
                const hasPreselectedAttr = el.hasAttribute('data-selected') ||
                                          el.getAttribute('data-selected') === 'true' ||
                                          el.getAttribute('data-default') === 'true';
                
                const isChecked = el.querySelector('input[type="checkbox"]:checked') ||
                                 el.querySelector('input[type="radio"]:checked');
                
                const hasPreselectedStyle = window.getComputedStyle(el).border.includes('orange') ||
                                           window.getComputedStyle(el).backgroundColor.includes('rgb(255, 248, 225)');
                
                if (hasPreselectedClass || hasPreselectedAttr || isChecked || hasPreselectedStyle) {
                    preSelected.push(el);
                    el.classList.add('pre-selected');
                }
            }
        });
    });
    
    console.log(`📊 Found ${preSelected.length} pre-selected activities out of ${allActivities.length} total`);
    return { preSelected, allActivities };
}

// Ενημερωμένη συνάρτηση για listeners
function addActivityListeners() {
    const { preSelected, allActivities } = detectPreSelectedActivities();
    
    console.log(`🔄 Adding listeners to ${allActivities.length} activity cards`);
    
    allActivities.forEach(card => {
        // Αφαίρεση προηγούμενων listeners
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        
        const isPreSelected = preSelected.includes(card);
        
        if (isPreSelected && !ignorePreSelected) {
            // Προ-επιλεγμένη - προσθήκη ειδικού στυλ
            newCard.classList.add('pre-selected');
            newCard.setAttribute('data-combo-preselected', 'true');
            
            // Προσθήκη toggle για override
            newCard.addEventListener('dblclick', function(e) {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
                
                this.classList.toggle('selected');
                this.classList.toggle('pre-selected');
                this.setAttribute('data-combo-override', 'true');
                
                if (this.classList.contains('selected')) {
                    this.style.border = '3px solid #9c27b0';
                    this.style.boxShadow = '0 0 10px rgba(156, 39, 176, 0.3)';
                } else {
                    this.style.border = '2px dashed #ff9800';
                    this.style.boxShadow = '';
                }
                
                console.log(`Overridden pre-selected: ${this.querySelector('h4, h3')?.textContent?.trim() || 'Activity'}`);
            });
        } else {
            // Κανονική δραστηριότητα
            newCard.addEventListener('click', function(e) {
                if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
                    e.target.tagName === 'A' || e.target.closest('a')) {
                    return;
                }
                
                this.classList.toggle('selected');
                this.setAttribute('data-combo-selected', this.classList.contains('selected'));
                
                if (this.classList.contains('selected')) {
                    this.style.border = '3px solid #9c27b0';
                    this.style.boxShadow = '0 0 10px rgba(156, 39, 176, 0.3)';
                } else {
                    this.style.border = '';
                    this.style.boxShadow = '';
                }
                
                console.log(`Selected: ${this.querySelector('h4, h3')?.textContent?.trim() || 'Activity'}`);
            });
        }
        
        newCard.style.cursor = 'pointer';
        
        // Προσθήκη tooltip για προ-επιλεγμένες
        if (isPreSelected && !ignorePreSelected) {
            newCard.title = "Διπλό κλικ για να αλλάξετε την επιλογή";
        }
    });
}

// Ενημερωμένη συνάρτηση για επιλεγμένες δραστηριότητες
function getSelectedActivities() {
    const activitySelectors = [
        '.activity-card.selected',
        '.activity-item.selected',
        '[data-selected="true"]',
        '.selected-activity',
        '.package-item.selected',
        '.product-item.selected'
    ];
    
    let selectedCards = [];
    let preSelectedCards = [];
    
    activitySelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (!selectedCards.includes(el)) {
                // Έλεγχος αν είναι προ-επιλεγμένη αλλά ο χρήστης την άλλαξε
                const isPreSelectedOverridden = el.classList.contains('pre-selected') && 
                                               el.hasAttribute('data-combo-override');
                
                if (!el.classList.contains('pre-selected') || 
                    isPreSelectedOverridden || 
                    ignorePreSelected) {
                    selectedCards.push(el);
                } else if (el.classList.contains('pre-selected')) {
                    preSelectedCards.push(el);
                }
            }
        });
    });
    
    console.log(`📝 Selected: ${selectedCards.length}, Pre-selected: ${preSelectedCards.length}`);
    return selectedCards;
}

// Νέα συνάρτηση για toggle προεπιλογών
function togglePreSelected(force = null) {
    if (force !== null) {
        ignorePreSelected = force;
    } else {
        ignorePreSelected = !ignorePreSelected;
    }
    
    console.log(`🔄 Ignore pre-selected: ${ignorePreSelected}`);
    
    // Επανάληψη listeners με την νέα ρύθμιση
    addActivityListeners();
    
    // Ενημέρωση του κουμπιού
    updateComboButton();
    
    return ignorePreSelected;
}

// Ενημερωμένο κουμπί με επιλογή προεπιλογών
function addComboButton() {
    console.log('🔄 Trying to add combo button...');
    
    // Διάγραψε παλιά κουμπιά
    const oldButtons = document.querySelectorAll('#combo-main-button, .combo-button');
    oldButtons.forEach(btn => btn.remove());
    
    // Δημιουργία κουμπιού με επιλογές
    const buttonHTML = `
        <div id="combo-main-button" class="combo-button">
            <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
                <div style="display: flex; gap: 10px;">
                    <button onclick="togglePreSelected()" id="toggle-preselected" style="
                        background: ${ignorePreSelected ? '#ff9800' : '#6c757d'};
                        color: white;
                        padding: 8px 12px;
                        border-radius: 20px;
                        font-size: 12px;
                        border: none;
                        cursor: pointer;
                        white-space: nowrap;
                    " title="${ignorePreSelected ? 'Συμπερίληψη προεπιλεγμένων' : 'Αγνόηση προεπιλεγμένων'}">
                        ${ignorePreSelected ? '✅ Με προεπιλογές' : '❌ Χωρίς προεπιλογές'}
                    </button>
                    
                    <button onclick="safeCalculateSmartCombos()" style="
                        background: linear-gradient(135deg, #9c27b0, #673ab7);
                        color: white;
                        padding: 12px 24px;
                        border-radius: 50px;
                        font-size: 14px;
                        font-weight: bold;
                        border: none;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(156, 39, 176, 0.4);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        transition: all 0.3s;
                    " title="Υπολογισμός Combos">
                        <span style="font-size: 16px;">💰</span>
                        <span>Combos</span>
                    </button>
                </div>
                
                <div style="display: flex; gap: 5px;">
                    <button onclick="exportComboResults()" style="
                        background: #2196f3;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 15px;
                        font-size: 11px;
                        border: none;
                        cursor: pointer;
                    " title="Export Αποτελεσμάτων">
                        📥 Export
                    </button>
                    
                    <button onclick="clearAllSelections()" style="
                        background: #dc3545;
                        color: white;
                        padding: 6px 12px;
                        border-radius: 15px;
                        font-size: 11px;
                        border: none;
                        cursor: pointer;
                    " title="Καθαρισμός όλων των επιλογών">
                        🗑️ Clear
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    console.log('✅ Combo button with pre-select options added!');
    
    // Προσθήκη hover effects
    const mainButton = document.querySelector('#combo-main-button button:nth-child(2)');
    if (mainButton) {
        mainButton.addEventListener('mouseenter', () => {
            mainButton.style.transform = 'translateY(-2px)';
            mainButton.style.boxShadow = '0 6px 20px rgba(156, 39, 176, 0.6)';
        });
        
        mainButton.addEventListener('mouseleave', () => {
            mainButton.style.transform = 'translateY(0)';
            mainButton.style.boxShadow = '0 4px 15px rgba(156, 39, 176, 0.4)';
        });
    }
    
    // Προσθήκη listeners
    addActivityListeners();
}

// Συνάρτηση για ενημέρωση του κουμπιού
function updateComboButton() {
    const toggleBtn = document.querySelector('#toggle-preselected');
    if (toggleBtn) {
        toggleBtn.style.background = ignorePreSelected ? '#ff9800' : '#6c757d';
        toggleBtn.textContent = ignorePreSelected ? '✅ Με προεπιλογές' : '❌ Χωρίς προεπιλογές';
        toggleBtn.title = ignorePreSelected ? 'Συμπερίληψη προεπιλεγμένων' : 'Αγνόηση προεπιλεγμένων';
    }
}

// Νέα συνάρτηση για καθαρισμό επιλογών
function clearAllSelections() {
    const allSelected = document.querySelectorAll('.selected, [data-selected="true"]');
    allSelected.forEach(el => {
        el.classList.remove('selected');
        el.classList.remove('pre-selected');
        el.removeAttribute('data-selected');
        el.removeAttribute('data-combo-selected');
        el.removeAttribute('data-combo-override');
        el.style.border = '';
        el.style.boxShadow = '';
    });
    
    console.log('🧹 Cleared all selections');
    showNotification('🧹 Όλες οι επιλογές καθαρίστηκαν');
}

// Ενημερωμένη modal render
function showComboModal() {
    if (comboModalOpen) return;
    
    const modalHTML = `
        <div id="combo-modal" class="combo-modal-overlay">
            <div class="combo-modal">
                <div class="combo-modal-header">
                    <h2 style="margin: 0; font-size: 20px;">
                        <span style="margin-right: 10px;">💰</span>
                        Έξυπνος Υπολογισμός Combos
                    </h2>
                    <button onclick="closeComboModal()" class="combo-modal-close" title="Κλείσιμο">
                        &times;
                    </button>
                </div>
                
                <div class="combo-modal-body">
                    ${renderComboResults()}
                </div>
                
                <div class="combo-modal-footer">
                    ${currentComboResults?.bestCombo ? `
                        <button onclick="applyBestCombo()" class="combo-btn-primary">
                            🎯 Εφαρμογή Καλύτερου Combo
                        </button>
                    ` : ''}
                    
                    ${currentComboResults?.availableCombos?.length > 0 ? `
                        <button onclick="exportComboResults()" class="combo-btn-secondary" style="background: #2196f3;">
                            📥 Export Αποτελεσμάτων
                        </button>
                    ` : ''}
                    
                    <button onclick="closeComboModal()" class="combo-btn-secondary">
                        Κλείσιμο
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    comboModalOpen = true;
    
    // Κλείσιμο με ESC
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeComboModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

// Ενημερωμένη renderComboResults με επιλογή προεπιλογών
function renderComboResults() {
    if (!currentComboResults) return '<p>Δεν υπάρχουν αποτελέσματα</p>';
    
    const { regularCost, availableCombos, bestCombo, destination, selectedCount } = currentComboResults;
    const { preSelected } = detectPreSelectedActivities();
    
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px;">📊 Σύνοψη</h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 10px;">
                <div>
                    <div style="font-size: 14px; color: #666;">Προορισμός:</div>
                    <div style="font-size: 18px; font-weight: bold;">${destination}</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #666;">Επιλεγμένες:</div>
                    <div style="font-size: 18px; font-weight: bold;">${selectedCount}</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #666;">Κανονικό Κόστος:</div>
                    <div style="font-size: 24px; font-weight: bold;">${regularCost.toFixed(2)}€</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #666;">Διαθέσιμα Combos:</div>
                    <div style="font-size: 24px; font-weight: bold;">${availableCombos.length}</div>
                </div>
            </div>
            
            ${preSelected.length > 0 ? `
                <div class="combo-pre-select-option">
                    <input type="checkbox" id="include-preselected" ${ignorePreSelected ? 'checked' : ''} 
                           onchange="togglePreSelected(this.checked)">
                    <label for="include-preselected">
                        Συμπερίληψη ${preSelected.length} προεπιλεγμένων δραστηριοτήτων
                    </label>
                </div>
            ` : ''}
            
            ${ignorePreSelected ? `
                <div style="background: #fff3cd; color: #856404; padding: 8px; border-radius: 4px; margin-top: 10px; font-size: 13px;">
                    ⚠️ Προ-επιλεγμένες δραστηριότητες συμπεριλαμβάνονται στους υπολογισμούς
                </div>
            ` : ''}
        </div>
    `;
    
    if (availableCombos.length > 0) {
        html += `
            <div style="margin-bottom: 20px;">
                <h3 style="margin-top: 0;">🎯 Διαθέσιμα Combos</h3>
                <p style="color: #666; font-size: 14px;">Κάντε κλικ σε ένα combo για να το εφαρμόσετε:</p>
            </div>
        `;
        
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
                    cursor: pointer;
                    transition: all 0.2s;
                " onclick="selectCombo(${index})" 
                   onmouseover="this.style.background='${isBest ? 'rgba(156, 39, 176, 0.1)' : '#f8f9fa'}'" 
                   onmouseout="this.style.background='${isBest ? 'rgba(156, 39, 176, 0.05)' : 'white'}'
                   this.style.transform='scale(1.01)'"
                   onmouseleave="this.style.transform='scale(1)'">
                    
                    ${isBest ? `
                        <div class="combo-best-badge">
                            🏆 ΚΑΛΥΤΕΡΟ
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0; font-size: 18px;">${combo.name}</h3>
                        <span style="background: ${isBest ? '#9c27b0' : '#ff9800'}; 
                              color: white; padding: 5px 10px; border-radius: 15px; 
                              font-weight: bold; font-size: 14px;">
                            -${combo.discount || 15}%
                        </span>
                    </div>
                    
                    <p style="color: #666; margin-bottom: 15px; font-size: 14px;">${combo.description}</p>
                    
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
                        <strong>📋 Καλύπτει (${combo.activityCount}):</strong> 
                        ${combo.matchingActivities.slice(0, 3).map(act => 
                            `<span style="background: #e3f2fd; padding: 2px 6px; border-radius: 4px; margin-right: 4px;">${act}</span>`
                        ).join(' ')}
                        ${combo.matchingActivities.length > 3 ? 
                            `<span style="color: #9c27b0;">+ ${combo.matchingActivities.length - 3} ακόμα</span>` : ''}
                    </div>
                    
                    ${combo.note ? `
                        <div style="font-size: 13px; color: #9c27b0; margin-top: 10px; font-style: italic;">
                            💡 ${combo.note}
                        </div>
                    ` : ''}
                </div>
            `;
        });
    } else {
        html += `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div style="font-size: 48px; margin-bottom: 20px;">🔍</div>
                <h3 style="margin-bottom: 10px;">Δεν βρέθηκαν combos</h3>
                <p style="margin-bottom: 20px;">Δοκιμάστε:</p>
                <ul style="text-align: left; max-width: 300px; margin: 0 auto 20px;">
                    <li>Επιλέξτε περισσότερες δραστηριότητες</li>
                    <li>Αλλάξτε την επιλογή προεπιλογών</li>
                    <li>Δοκιμάστε διαφορετικές δραστηριότητες</li>
                </ul>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="togglePreSelected()" class="combo-btn-secondary" style="background: #ff9800;">
                        ${ignorePreSelected ? 'Αγνόηση προεπιλογών' : 'Συμπερίληψη προεπιλογών'}
                    </button>
                    <button onclick="closeComboModal()" class="combo-btn-secondary">
                        ΟΚ
                    </button>
                </div>
            </div>
        `;
    }
    
    return html;
}

// Νέα debug function
window.debugPreSelected = function() {
    const { preSelected, allActivities } = detectPreSelectedActivities();
    
    console.log('=== PRE-SELECTED DEBUG ===');
    console.log(`Total activities: ${allActivities.length}`);
    console.log(`Pre-selected activities: ${preSelected.length}`);
    console.log('Pre-selected details:');
    
    preSelected.forEach((el, i) => {
        const name = el.querySelector('h4, h3, .title, .name')?.textContent?.trim() || 'Unknown';
        console.log(`${i + 1}. ${name}`);
        console.log('   Classes:', Array.from(el.classList));
        console.log('   Attributes:');
        Array.from(el.attributes).forEach(attr => {
            if (attr.name.includes('select') || attr.name.includes('default')) {
                console.log(`     ${attr.name}: ${attr.value}`);
            }
        });
    });
    
    console.log(`Ignore pre-selected: ${ignorePreSelected}`);
    console.log('========================');
    
    // Επανάληψη listeners
    addActivityListeners();
};

// ==================== ΑΡΧΙΚΟΠΟΙΗΣΗ ====================
addComboStyles();

// Κάνε τις νέες συναρτήσεις διαθέσιμες
window.togglePreSelected = togglePreSelected;
window.clearAllSelections = clearAllSelections;
window.debugPreSelected = debugPreSelected;

// Εκκίνηση
console.log('🚀 Starting Combo Calculator with Pre-Selected handling...');

// Προσθήκη κουμπιού με καθυστέρηση για να φορτώσει η σελίδα
setTimeout(() => {
    // Ανίχνευση αρχικών προεπιλογών
    detectPreSelectedActivities();
    
    // Προσθήκη κουμπιού
    addComboButton();
    
    // Εμφάνιση ειδοποίησης για προεπιλογές
    const { preSelected } = detectPreSelectedActivities();
    if (preSelected.length > 0) {
        setTimeout(() => {
            showNotification(`📝 Βρέθηκαν ${preSelected.length} προ-επιλεγμένες δραστηριότητες. Χρησιμοποιήστε το κουμπί για εναλλαγή.`);
        }, 2000);
    }
}, 3000);

// Αυτόματη επανάληψη κάθε 5 δευτερόλεπτα
setInterval(() => {
    if (!document.querySelector('#combo-main-button')) {
        addComboButton();
    }
}, 5000);

// Observer για DOM changes
const observer = new MutationObserver(() => {
    if (!document.querySelector('#combo-main-button')) {
        setTimeout(addComboButton, 1000);
    }
    
    // Ανανέωση listeners για νέες δραστηριότητες
    setTimeout(addActivityListeners, 500);
});

observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-selected', 'data-default']
});

console.log('🎯 Combo Calculator with Pre-Selected handling ready!');
