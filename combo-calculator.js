// ==================== COMBO CALCULATOR ====================
// Αποθηκεύετε ως: combo-calculator.js
// ΕΚΔΟΣΗ ΜΕ ΚΑΡΤΕΛΑ ΕΛΕΓΧΟΥ

console.log('✅ Smart Combo Calculator loaded!');

// ==================== GLOBAL COMBO VARIABLES ====================
let comboModalOpen = false;
let currentComboResults = null;
let isOnActivitiesPage = false;

// ==================== COMBO DATA ====================
const CITY_COMBOS = {
    'Λονδίνο': [
        {
            name: '🎡 London Attractions Pass',
            description: 'Εξοικονόμηση σε 3+ αξιοθέατα του Λονδίνου',
            includedKeywords: ['Eye', 'Sea Life', 'Madame', 'Tower', 'Dungeon', 'Shrek'],
            discount: 25,
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
            description: 'Πρόσβαση σε 70+ αξιοθέατες της Βιέννης',
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

// ==================== ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ====================
function addComboStyles() {
    const oldStyle = document.querySelector('#combo-calculator-styles');
    if (oldStyle) oldStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'combo-calculator-styles';
    style.textContent = `
        #combo-main-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        }
        
        #combo-main-button button {
            background: linear-gradient(135deg, #9c27b0, #673ab7);
            color: white;
            padding: 15px 25px;
            border-radius: 50px;
            font-size: 16px;
            font-weight: bold;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(156, 39, 176, 0.4);
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
            font-family: Arial, sans-serif;
        }
        
        #combo-main-button button:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(156, 39, 176, 0.6);
        }
        
        .activity-card.selected,
        .activity-item.selected {
            border: 3px solid #9c27b0 !important;
            box-shadow: 0 0 15px rgba(156, 39, 176, 0.3) !important;
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
            z-index: 20000;
        }
        
        .combo-modal-content {
            background: white;
            border-radius: 15px;
            width: 90%;
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            animation: modalSlide 0.3s ease;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes modalSlide {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// ==================== ΚΑΡΤΕΛΑ ΕΛΕΓΧΟΥ ====================
function checkIfOnActivitiesPage() {
    // Πολλοί τρόποι για να ανιχνεύσουμε αν είμαστε στη σελίδα δραστηριοτήτων
    
    const checks = [
        // 1. Check URL
        () => window.location.href.includes('activity') || 
              window.location.href.includes('tour') ||
              window.location.href.includes('excursion') ||
              window.location.href.includes('package'),
        
        // 2. Check για activity cards στην σελίδα
        () => document.querySelectorAll('.activity-card, .activity-item, .tour-card, .package-card').length > 2,
        
        // 3. Check για headers με τη λέξη "δραστηριότητες"
        () => {
            const headers = document.querySelectorAll('h1, h2, h3, h4, .title, .section-title');
            for (const header of headers) {
                const text = header.textContent.toLowerCase();
                if (text.includes('δραστηριότητ') || 
                    text.includes('activities') || 
                    text.includes('tours') ||
                    text.includes('packages')) {
                    return true;
                }
            }
            return false;
        },
        
        // 4. Check για containers με activity listings
        () => {
            const containers = document.querySelectorAll('.activities-list, .tours-grid, .packages-container, .products-grid');
            return containers.length > 0;
        },
        
        // 5. Check για καρτέλες/tabs με δραστηριότητες
        () => {
            const activeTab = document.querySelector('.tab.active, .nav-link.active, [class*="active"][class*="tab"]');
            if (activeTab) {
                const tabText = activeTab.textContent.toLowerCase();
                return tabText.includes('δραστηριότητ') || 
                       tabText.includes('activity') ||
                       tabText.includes('tour') ||
                       tabText.includes('package');
            }
            return false;
        }
    ];
    
    // Εκτέλεση όλων των checks
    let score = 0;
    checks.forEach(check => {
        try {
            if (check()) score++;
        } catch (e) {
            console.log('Check failed:', e);
        }
    });
    
    // Αν περάσει τουλάχιστον 2 checks, είμαστε σε activities page
    const newStatus = score >= 2;
    
    if (newStatus !== isOnActivitiesPage) {
        console.log(`🔄 Activities page status changed: ${isOnActivitiesPage} → ${newStatus} (score: ${score}/5)`);
        isOnActivitiesPage = newStatus;
        handlePageChange();
    }
    
    return isOnActivitiesPage;
}

function handlePageChange() {
    if (isOnActivitiesPage) {
        console.log('📋 We are on activities page! Adding combo button...');
        addComboButton();
        addActivityListeners();
    } else {
        console.log('🚫 Not on activities page. Removing combo button...');
        removeComboButton();
    }
}

function removeComboButton() {
    const button = document.querySelector('#combo-main-button');
    if (button) {
        button.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => button.remove(), 300);
        console.log('🗑️ Combo button removed');
    }
}

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
        destination = 'Βιέννη'; // Προεπιλογή
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
    console.log('🔄 Adding combo button...');
    
    // Διαγραφή παλιού κουμπιού αν υπάρχει
    const oldButton = document.querySelector('#combo-main-button');
    if (oldButton) oldButton.remove();
    
    // Προσθήκη styles
    addComboStyles();
    
    // Δημιουργία νέου κουμπιού
    const buttonHTML = `
        <div id="combo-main-button">
            <button onclick="window.calculateSmartCombos()">
                <span style="font-size: 20px;">💰</span>
                <span>Έξυπνα Combos</span>
            </button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    console.log('✅ Combo button added successfully!');
    
    // Προσθήκη hover effect
    const button = document.querySelector('#combo-main-button button');
    if (button) {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 6px 20px rgba(156, 39, 176, 0.6)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 15px rgba(156, 39, 176, 0.4)';
        });
    }
}

function addActivityListeners() {
    // Βρες όλες τις δραστηριότητες
    const activitySelectors = [
        '.activity-card',
        '.activity-item',
        '.tour-card',
        '.package-card',
        '.product-card',
        '.card:has(.price)',
        '.item:has(.price)'
    ];
    
    let activityCards = [];
    
    activitySelectors.forEach(selector => {
        const cards = document.querySelectorAll(selector);
        cards.forEach(card => {
            if (!activityCards.includes(card) && !card.closest('#combo-main-button')) {
                activityCards.push(card);
            }
        });
    });
    
    console.log(`Found ${activityCards.length} activity cards`);
    
    activityCards.forEach(card => {
        // Καθαρισμός προεπιλογών
        card.classList.remove('selected');
        card.classList.remove('active');
        card.classList.remove('default');
        card.removeAttribute('data-selected');
        card.removeAttribute('data-default');
        card.style.border = '';
        card.style.boxShadow = '';
        
        // Αφαίρεση παλιών listeners
        const newCard = card.cloneNode(true);
        if (card.parentNode) {
            card.parentNode.replaceChild(newCard, card);
        }
        
        // Προσθήκη νέου click listener
        newCard.addEventListener('click', function(e) {
            // Αγνόησε clicks σε buttons και links
            if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
                e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }
            
            // Toggle selection
            this.classList.toggle('selected');
            
            // Visual feedback
            if (this.classList.contains('selected')) {
                this.style.border = '3px solid #9c27b0';
                this.style.boxShadow = '0 0 10px rgba(156, 39, 176, 0.3)';
            } else {
                this.style.border = '';
                this.style.boxShadow = '';
            }
            
            const activityName = this.querySelector('h4, h3, .activity-name, .title')?.textContent?.trim() || 'Activity';
            console.log(`Selected: ${activityName}`);
        });
        
        // Προσθήκη cursor pointer
        newCard.style.cursor = 'pointer';
    });
}

// ==================== MODAL FUNCTIONS ====================
function showComboModal() {
    if (comboModalOpen) return;
    
    const modalHTML = `
        <div id="combo-modal" class="combo-modal">
            <div class="combo-modal-content">
                <div style="background: linear-gradient(135deg, #9c27b0, #673ab7); color: white; padding: 20px; border-radius: 15px 15px 0 0; display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 22px;">
                        <span style="margin-right: 10px;">💰</span>
                        Έξυπνοι Υπολογισμοί Combos
                    </h2>
                    <button onclick="window.closeComboModal()" style="background: none; border: none; color: white; font-size: 30px; cursor: pointer; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
                        &times;
                    </button>
                </div>
                
                <div style="padding: 20px;">
                    ${renderComboResults()}
                </div>
                
                <div style="padding: 20px; border-top: 1px solid #eee; display: flex; gap: 10px; justify-content: flex-end;">
                    ${currentComboResults?.bestCombo ? `
                        <button onclick="window.applyBestCombo()" style="background: #9c27b0; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px;">
                            ✅ Εφαρμογή Combo
                        </button>
                    ` : ''}
                    
                    <button onclick="window.closeComboModal()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                        Κλείσιμο
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    comboModalOpen = true;
    
    // Κλείσιμο modal με ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeComboModal();
        }
    });
}

function renderComboResults() {
    if (!currentComboResults) return '<p>Δεν υπάρχουν αποτελέσματα</p>';
    
    const { regularCost, availableCombos, bestCombo } = currentComboResults;
    
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #333;">📊 Σύνοψη</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div style="text-align: center;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Κανονικό Κόστος</div>
                    <div style="font-size: 28px; font-weight: bold; color: #e74c3c;">${regularCost.toFixed(2)}€</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Διαθέσιμα Combos</div>
                    <div style="font-size: 28px; font-weight: bold; color: #9c27b0;">${availableCombos.length}</div>
                </div>
            </div>
        </div>
    `;
    
    if (availableCombos.length > 0) {
        availableCombos.forEach((combo, index) => {
            const isBest = combo === bestCombo;
            
            html += `
                <div style="border: 2px solid ${isBest ? '#9c27b0' : '#ddd'}; border-radius: 10px; padding: 20px; margin-bottom: 15px; background: ${isBest ? 'rgba(156, 39, 176, 0.05)' : 'white'}; position: relative;">
                    ${isBest ? `
                        <div style="position: absolute; top: -12px; right: 20px; background: #9c27b0; color: white; padding: 6px 15px; border-radius: 20px; font-size: 13px; font-weight: bold; box-shadow: 0 3px 10px rgba(156, 39, 176, 0.3);">
                            🏆 ΚΑΛΥΤΕΡΗ ΠΡΟΣΦΟΡΑ
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; font-size: 20px; color: #333;">${combo.name}</h3>
                        <span style="background: ${isBest ? '#9c27b0' : '#ff9800'}; color: white; padding: 8px 15px; border-radius: 20px; font-weight: bold; font-size: 16px;">
                            -${combo.discount || 15}%
                        </span>
                    </div>
                    
                    <p style="color: #666; margin-bottom: 15px; font-size: 15px; line-height: 1.5;">${combo.description}</p>
                    
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 16px;">
                            <span>Κανονική τιμή:</span>
                            <span style="text-decoration: line-through; color: #e74c3c; font-weight: bold;">${combo.regularPrice.toFixed(2)}€</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 18px;">
                            <span>Τιμή με combo:</span>
                            <span style="color: #27ae60; font-weight: bold; font-size: 22px;">${combo.comboPrice.toFixed(2)}€</span>
                        </div>
                    </div>
                    
                    <div style="background: #d4edda; color: #155724; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
                            <span>Εξοικονόμηση:</span>
                            <span>${combo.saving.toFixed(2)}€</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 14px; color: #666; background: #e3f2fd; padding: 10px; border-radius: 6px;">
                        <strong>📋 Περιλαμβάνονται:</strong> ${combo.matchingActivities.join(', ')}
                    </div>
                </div>
            `;
        });
    } else {
        html += `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <div style="font-size: 60px; margin-bottom: 20px;">🔍</div>
                <h3 style="margin-bottom: 15px; color: #333;">Δεν βρέθηκαν combos</h3>
                <p style="margin-bottom: 25px; font-size: 16px;">Επιλέξτε τουλάχιστον 2 δραστηριότητες από την ίδια κατηγορία.</p>
                <button onclick="window.closeComboModal()" style="background: #9c27b0; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Εντάξει
                </button>
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
    alert(`✅ Εφαρμόστηκε το "${bestCombo.name}"!\n\n💰 Εξοικονόμηση: ${bestCombo.saving.toFixed(2)}€\n💵 Νέο κόστος: ${bestCombo.comboPrice.toFixed(2)}€`);
    closeComboModal();
}

// ==================== ΕΚΚΙΝΗΣΗ & MONITORING ====================
// Κάνε τις συναρτήσεις διαθέσιμες
window.calculateSmartCombos = calculateSmartCombos;
window.closeComboModal = closeComboModal;
window.applyBestCombo = applyBestCombo;

// Προσθήκη debug function
window.debugCombo = function() {
    console.log('=== COMBO DEBUG ===');
    console.log('On activities page:', isOnActivitiesPage);
    console.log('Button exists:', !!document.querySelector('#combo-main-button'));
    console.log('Selected activities:', document.querySelectorAll('.selected').length);
    
    // Επανάληψη check
    checkIfOnActivitiesPage();
};

// Αρχικός έλεγχος κατά την φόρτωση
console.log('🚀 Starting Smart Combo Calculator...');

// Προσθήκη styles
addComboStyles();

// Έλεγχος αν είμαστε ήδη σε activities page
setTimeout(() => {
    checkIfOnActivitiesPage();
    
    // Αν δεν είμαστε, δοκιμάζουμε ξανά μετά από 2 δευτερόλεπτα
    if (!isOnActivitiesPage) {
        setTimeout(checkIfOnActivitiesPage, 2000);
    }
}, 1000);

// Συνέχιση παρακολούθησης για αλλαγές
const observer = new MutationObserver(() => {
    // Έλεγχος για αλλαγές στο DOM που μπορεί να σημαίνουν αλλαγή καρτέλας
    checkIfOnActivitiesPage();
    
    // Αν είμαστε σε activities page, προσθήκη listeners
    if (isOnActivitiesPage) {
        setTimeout(addActivityListeners, 500);
    }
});

// Παρακολούθηση για:
// - Αλλαγές στη δομή του DOM (νέες καρτέλες)
// - Αλλαγές στο URL (hash changes)
// - Αλλαγές στα tabs
observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'href', 'data-tab']
});

// Παρακολούθηση αλλαγών URL (για SPA navigation)
let lastUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('🔗 URL changed, checking page...');
        checkIfOnActivitiesPage();
    }
}, 500);

// Παρακολούθηση hash changes (για tab switching)
window.addEventListener('hashchange', () => {
    console.log('🔗 Hash changed, checking page...');
    checkIfOnActivitiesPage();
});

console.log('🎯 Smart Combo Calculator ready! Button will appear ONLY on activities page.');
