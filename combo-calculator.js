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
    console.log('🔍 Calculating smart combos - NEW VERSION...');
    
    // 1. Βρες τον προορισμό από το DOM
    let destination = '';
    const destinationEl = document.querySelector('.destination-card.selected, [data-destination].selected');
    if (destinationEl) {
        destination = destinationEl.dataset.destination || destinationEl.textContent.trim();
    } else {
        // Ψάξε σε dropdowns/selects
        const select = document.querySelector('select[name="destination"], select[id*="destination"]');
        if (select) destination = select.value;
    }
    
    // Προσωρινό fallback για δοκιμή
    if (!destination) {
        destination = 'Βιέννη';
    }
    
    // 2. Βρες τις επιλεγμένες δραστηριότητες από το DOM
    let activityElements = document.querySelectorAll('.activity-card.selected, .activity-item.selected, [data-activity].selected');
    
    // ΦΙΛΤΡΑΡΙΣΜΑ ΑΥΤΟ-SELECTED
    const MAX_AUTO_SELECTED = 3;
    
    if (activityElements.length > 10) {
        console.log(`⚠️ Detected ${activityElements.length} auto-selected activities`);
        
        // Κράτα μόνο τις πρώτες MAX_AUTO_SELECTED
        const trulySelected = Array.from(activityElements).slice(0, MAX_AUTO_SELECTED);
        
        // Ξεκλικάρισμα των υπολοίπων στο DOM
        activityElements.forEach((card, index) => {
            if (index >= MAX_AUTO_SELECTED) {
                card.classList.remove('selected');
            }
        });
        
        console.log(`✅ Keeping only ${trulySelected.length} activities`);
        activityElements = trulySelected;
    }
    
    const selectedActivities = [];
    
    activityElements.forEach(el => {
        const name = el.querySelector('h4')?.textContent?.trim() || 'Activity';
        
        const priceText = el.querySelector('.price, .activity-price, .cost')?.textContent || '0€';
        const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 25;
        
        selectedActivities.push({
            name: name,
            adultPrice: price,
            childPrice: price * 0.7 // 30% έκπτωση για παιδιά
        });
    });
    
    // 3. Βρες τα μέλη οικογένειας
    const familyMembers = [];
    const adultInput = document.querySelector('input[name="adults"], input[id*="adult"]');
    const childInput = document.querySelector('input[name="children"], input[id*="child"]');
    
    const adultCount = adultInput ? parseInt(adultInput.value) || 2 : 2;
    const childCount = childInput ? parseInt(childInput.value) || 1 : 1;
    
    for (let i = 0; i < adultCount; i++) familyMembers.push({ age: 35 });
    for (let i = 0; i < childCount; i++) familyMembers.push({ age: 10 });
    
    // 4. Debug info
    console.log('📊 Found DETAILS:', {
        destination: destination || 'NOT FOUND',
        activities: selectedActivities.length,
        family: familyMembers.length
    });
    console.log('📍 Exact destination value:', `"${destination}"`);
    console.log('🎯 Activities array:', selectedActivities);
    
    // 5. Έλεγχοι
    if (!destination) {
        showComboNotification('⚠️ Πρέπει να επιλέξετε προορισμό πρώτα', 'warning');
        return;
    }
    
    if (selectedActivities.length < 2) {
        showComboNotification(`⚠️ Χρειάζονται τουλάχιστον 2 δραστηριότητες (έχετε ${selectedActivities.length})`, 'warning');
        return;
    }
    
    if (familyMembers.length === 0) {
        showComboNotification('⚠️ Πρέπει να έχετε ορίσει μέλη οικογένειας', 'warning');
        return;
    }
    
    // 6. Δημιούργησε APP_STATE
    window.APP_STATE = {
        destination: destination,
        selectedActivities: selectedActivities,
        familyMembers: familyMembers
    };
    
    console.log('✅ APP_STATE created:', window.APP_STATE);
    
    // 7. Υπολογισμός κανονικού κόστους
    const regularCost = calculateTotalComboCost();
    
    // 8. Αναζήτηση διαθέσιμων combos
    const availableCombos = findAvailableCombos();
    
    // 9. Εύρεση καλύτερου combo
    const bestCombo = findBestCombo(availableCombos);
    const bestSaving = bestCombo ? bestCombo.saving : 0;
    
    // 10. Αποθήκευση αποτελεσμάτων
    currentComboResults = {
        regularCost: regularCost,
        availableCombos: availableCombos,
        bestCombo: bestCombo,
        bestSaving: bestSaving,
        timestamp: new Date().toISOString()
    };
    
    // 11. Εμφάνιση modal
    showComboModal();
    
    console.log('🎉 Combo calculation complete! Found', availableCombos.length, 'combos');
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
    
    // Fallback: Αν δεν βρέθηκαν combos
    if (availableCombos.length === 0 && selectedActivities.length >= 2) {
        const adultCount = window.APP_STATE.familyMembers.filter(m => m.age >= 18).length;
        const childCount = window.APP_STATE.familyMembers.filter(m => m.age < 18).length;
        
        // Διάλεξε τις 2 πρώτες δραστηριότητες για ένα combo
        const firstTwo = selectedActivities.slice(0, 2);
        const regularPrice = firstTwo.reduce((sum, activity) => {
            return sum + (activity.adultPrice * adultCount + (activity.childPrice || 0) * childCount);
        }, 0);
        
        // 15% έκπτωση
        const comboPrice = Math.round(regularPrice * 0.85);
        const saving = regularPrice - comboPrice;
        
        if (saving > 0) {
            availableCombos.push({
                name: '🎯 Special Family Package',
                description: 'Ειδική προσφορά για τις πρώτες 2 δραστηριότητες',
                matchingActivities: firstTwo.map(a => a.name),
                regularPrice: regularPrice,
                comboPrice: comboPrice,
                saving: saving,
                discount: 15,
                note: '15% έκπτωση για 2 δραστηριότητες'
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
    
    // Ενημέρωση του συνολικού κόστους
    const totalElement = document.querySelector('.total-amount, #total-activities-cost');
    if (totalElement) {
        totalElement.textContent = `${newTotal.toFixed(2)}€`;
        totalElement.style.color = '#2ecc71';
        totalElement.innerHTML += ' <span style="color: #27ae60; font-size: 0.8em;">(με combo)</span>';
    }
    
    showComboNotification(`✅ Εφαρμόστηκε το "${bestCombo.name}"! Εξοικονόμηση: ${bestCombo.saving.toFixed(2)}€`, 'success');
    closeComboModal();
}

// ... (το υπόλοιπο CSS και συναρτήσεις παραμένουν ίδιες) ...
