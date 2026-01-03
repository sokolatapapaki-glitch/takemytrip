// ==================== COMBO CALCULATOR ====================
// Αποθηκεύετε ως: combo-calculator.js
// ΒΕΛΤΙΩΜΕΝΗ ΕΚΔΟΣΗ - ΣΥΝΔΥΑΣΜΟΣ ΑΡΧΙΚΟΥ ΚΑΙ ΠΡΟΤΑΣΕΩΝ

console.log('✅ Enhanced Combo Calculator loaded!');

// ==================== GLOBAL COMBO VARIABLES ====================
let comboModalOpen = false;
let currentComboResults = null;

// ==================== CSS STYLES ====================
function addComboStyles() {
    const style = document.createElement('style');
    style.id = 'combo-calculator-styles';
    style.textContent = `
        /* Κουμπί Combo */
        .combo-button {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 9999;
        }
        .combo-button button {
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .combo-button button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(156, 39, 176, 0.6);
        }
        .combo-button button:active {
            transform: translateY(0);
        }
        
        /* Επιλεγμένα Activity Cards */
        .activity-card.selected,
        .activity-item.selected,
        [data-combo-selected="true"] {
            border: 3px solid #9c27b0 !important;
            box-shadow: 0 0 10px rgba(156, 39, 176, 0.3) !important;
        }
        .activity-card,
        .activity-item {
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        /* Modal */
        .combo-modal-overlay {
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
            animation: fadeIn 0.3s ease;
        }
        .combo-modal {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
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
        .combo-modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .combo-modal-body {
            padding: 20px;
        }
        .combo-modal-footer {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        .combo-btn-primary {
            background: #9c27b0;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            transition: background 0.2s;
        }
        .combo-btn-primary:hover {
            background: #7b1fa2;
        }
        .combo-btn-secondary {
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .combo-btn-secondary:hover {
            background: #5a6268;
        }
        
        /* Best Combo Badge */
        .combo-best-badge {
            position: absolute;
            top: -10px;
            right: 20px;
            background: #9c27b0;
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            z-index: 1;
        }
        
        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .combo-button {
                bottom: 20px;
                right: 20px;
            }
            .combo-button button {
                padding: 12px 24px;
                font-size: 14px;
            }
            .combo-modal {
                width: 95%;
            }
        }
    `;
    document.head.appendChild(style);
}

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
    ],
    'Ρώμη': [
        {
            name: '🏛️ Rome City Pass',
            description: 'Πρόσβαση σε Κολοσσαίο, Ρωμαϊκό Φόρουμ και Παλάτιν',
            includedKeywords: ['Colosseum', 'Roman Forum', 'Palatine', 'Vatican', 'Museum'],
            discount: 30,
            minActivities: 2,
            note: 'Priority access στα πιο δημοφιλή αξιοθέατα'
        },
        {
            name: '🛡️ Roma Pass',
            description: '2 ή 3 αξιοθέατα + δωρεάν μεταφορές',
            includedKeywords: ['Colosseum', 'Forum', 'Museum', 'Archaeological'],
            discount: 25,
            minActivities: 2,
            note: '48 ή 72 ώρες validity'
        }
    ],
    'Αθήνα': [
        {
            name: '🏛️ Athens Combo Ticket',
            description: 'Πρόσβαση σε Ακρόπολη και 6 άλλες αρχαιολογικές θέσεις',
            includedKeywords: ['Acropolis', 'Parthenon', 'Museum', 'Archaeological', 'Ancient'],
            discount: 35,
            minActivities: 2,
            note: '30 ημέρες validity από πρώτη είσοδο'
        },
        {
            name: '🌊 Athens & Beach Pass',
            description: 'Αξιοθέατα Αθήνας + διακοπές σε παραλία',
            includedKeywords: ['Acropolis', 'Beach', 'Sea', 'Coast', 'Vouliagmeni'],
            discount: 20,
            minActivities: 2,
            note: 'Ιδανικό για καλοκαιρινές επισκέψεις'
        }
    ],
    'Βαρκελώνη': [
        {
            name: '🏰 Barcelona Card',
            description: 'Δωρεάν μεταφορές + εκπτώσεις σε αξιοθέατα',
            includedKeywords: ['Sagrada', 'Park Güell', 'Casa', 'Museum', 'Gothic'],
            discount: 25,
            minActivities: 2,
            note: '72, 96 ή 120 ώρες validity'
        }
    ]
};

// ==================== UTILITY FUNCTIONS ====================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
    activitySelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (!selectedCards.includes(el)) {
                selectedCards.push(el);
            }
        });
    });
    
    return selectedCards;
}

function improvePriceDetection(priceText) {
    if (!priceText) return 25;
    
    const priceRegex = /(\d+[\.,]?\d*)/g;
    const matches = priceText.match(priceRegex);
    
    if (matches && matches.length > 0) {
        // Πάρε το πρώτο match και μετατρέψε σε number
        const priceStr = matches[0].replace(',', '.');
        const price = parseFloat(priceStr);
        
        // Έλεγχος αν είναι λογική τιμή (μεταξύ 5 και 500 ευρώ)
        if (!isNaN(price) && price >= 5 && price <= 500) {
            return price;
        }
    }
    
    // Αν δε βρέθηκε τιμή, δες αν υπάρχουν keywords
    if (priceText.includes('€') || priceText.includes('ευρώ') || priceText.includes('euro')) {
        const numbers = priceText.match(/\d+/g);
        if (numbers && numbers.length > 0) {
            return parseInt(numbers[0]);
        }
    }
    
    return 25; // Προεπιλεγμένη τιμή
}

function saveComboPreference(comboName) {
    try {
        localStorage.setItem('lastAppliedCombo', comboName);
        localStorage.setItem('lastComboTime', new Date().toISOString());
        localStorage.setItem('comboApplyCount', 
            parseInt(localStorage.getItem('comboApplyCount') || '0') + 1
        );
    } catch (e) {
        console.warn('LocalStorage not available:', e);
    }
}

function getSavedCombo() {
    try {
        return {
            name: localStorage.getItem('lastAppliedCombo'),
            time: localStorage.getItem('lastComboTime'),
            count: localStorage.getItem('comboApplyCount') || '0'
        };
    } catch (e) {
        return null;
    }
}

function showNotification(message) {
    // Δημιουργία custom notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #9c27b0;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        animation: slideInRight 0.3s ease;
        font-weight: bold;
        max-width: 300px;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function exportComboResults() {
    if (!currentComboResults) {
        alert('Δεν υπάρχουν αποτελέσματα για export');
        return;
    }
    
    const data = {
        timestamp: new Date().toISOString(),
        regularCost: currentComboResults.regularCost,
        bestSaving: currentComboResults.bestSaving,
        bestCombo: currentComboResults.bestCombo?.name || 'Κανένα',
        availableCombos: currentComboResults.availableCombos.map(combo => ({
            name: combo.name,
            discount: combo.discount,
            saving: combo.saving
        }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `combo-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Τα αποτελέσματα εξήχθησαν!');
}

// ==================== ΚΥΡΙΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ====================
function safeCalculateSmartCombos() {
    try {
        return calculateSmartCombos();
    } catch (error) {
        console.error('Error in combo calculator:', error);
        alert('Σφάλμα στον υπολογισμό combos. Παρακαλώ δοκιμάστε ξανά.');
        return null;
    }
}

function calculateSmartCombos() {
    console.log('🔍 Calculating smart combos...');
    
    // 1. Βρες επιλεγμένες δραστηριότητες
    const selectedCards = getSelectedActivities();
    
    if (selectedCards.length < 2) {
        alert(`⚠️ Χρειάζονται τουλάχιστον 2 δραστηριότητες (έχετε ${selectedCards.length})`);
        return;
    }
    
    // 2. Βρες τον προορισμό
    let destination = '';
    const destinationSelectors = [
        '.destination-card.selected',
        '[data-destination].selected',
        '.selected-destination',
        '.city-card.selected'
    ];
    
    for (const selector of destinationSelectors) {
        const el = document.querySelector(selector);
        if (el) {
            destination = el.dataset.destination || el.textContent.trim();
            break;
        }
    }
    
    if (!destination) {
        // Προσπάθεια να βρεις τον προορισμό από την σελίδα
        const pageTitle = document.title;
        const cities = Object.keys(CITY_COMBOS);
        for (const city of cities) {
            if (pageTitle.includes(city)) {
                destination = city;
                break;
            }
        }
        
        if (!destination) {
            destination = 'Βιέννη'; // Προεπιλογή
        }
    }
    
    // 3. Συλλογή πληροφοριών για τις δραστηριότητες
    const selectedActivities = [];
    selectedCards.forEach(card => {
        const name = card.querySelector('h4, h3, .activity-name, .title, .name')?.textContent?.trim() || 'Activity';
        
        // Βελτιωμένη ανίχνευση τιμής
        const priceSelectors = [
            '.price', '.cost', '.amount', '.euro', '.currency',
            '[data-price]', 'span:contains("€")', '.value'
        ];
        
        let price = 25;
        for (const selector of priceSelectors) {
            const priceEl = card.querySelector(selector);
            if (priceEl) {
                const detectedPrice = improvePriceDetection(priceEl.textContent);
                if (detectedPrice !== 25) {
                    price = detectedPrice;
                    break;
                }
            }
        }
        
        selectedActivities.push({
            name: name,
            adultPrice: price,
            childPrice: price * 0.7,
            element: card
        });
    });
    
    // 4. Βρες μέλη οικογένειας (πιο έξυπνη ανίχνευση)
    let adultCount = 2;
    let childCount = 1;
    
    // Προσπάθεια ανίχνευσης από την σελίδα
    const travelerSelectors = [
        '[data-travelers]', '[data-adults]', '.adult-count', '.child-count',
        'select[name="adults"]', 'select[name="children"]'
    ];
    
    for (const selector of travelerSelectors) {
        const el = document.querySelector(selector);
        if (el) {
            if (selector.includes('adult')) {
                adultCount = parseInt(el.value || el.textContent) || adultCount;
            } else if (selector.includes('child')) {
                childCount = parseInt(el.value || el.textContent) || childCount;
            } else if (el.dataset.travelers) {
                const travelers = el.dataset.travelers.split('/');
                adultCount = parseInt(travelers[0]) || adultCount;
                childCount = parseInt(travelers[1]) || childCount;
            }
        }
    }
    
    const familyMembers = [];
    for (let i = 0; i < adultCount; i++) familyMembers.push({ age: 35 });
    for (let i = 0; i < childCount; i++) familyMembers.push({ age: 10 });
    
    // 5. Δημιουργία APP_STATE
    window.APP_STATE = {
        destination: destination,
        selectedActivities: selectedActivities,
        familyMembers: familyMembers,
        adultCount: adultCount,
        childCount: childCount,
        timestamp: new Date().toISOString()
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
        bestSaving: bestSaving,
        destination: destination,
        selectedCount: selectedActivities.length
    };
    
    // 8. Ελέγξτε για νέα combos
    checkForNewCombos();
    
    // 9. Εμφάνιση modal
    showComboModal();
}

function calculateTotalComboCost() {
    if (!window.APP_STATE) return 0;
    
    const { selectedActivities, familyMembers } = window.APP_STATE;
    
    return selectedActivities.reduce((total, activity) => {
        let activityTotal = 0;
        familyMembers.forEach(member => {
            activityTotal += member.age >= 18 ? activity.adultPrice : activity.childPrice;
        });
        return total + activityTotal;
    }, 0);
}

function findAvailableCombos() {
    if (!window.APP_STATE) return [];
    
    const { destination, selectedActivities, adultCount, childCount } = window.APP_STATE;
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
                return sum + (activity.adultPrice * adultCount + activity.childPrice * childCount);
            }, 0);
            
            const comboPrice = Math.round(regularPrice * (1 - comboTemplate.discount / 100));
            const saving = regularPrice - comboPrice;
            
            availableCombos.push({
                ...comboTemplate,
                matchingActivities: matchingActivities.map(a => a.name),
                regularPrice: regularPrice,
                comboPrice: comboPrice,
                saving: saving,
                activityCount: matchingActivities.length
            });
        }
    });
    
    // Fallback combo
    if (availableCombos.length === 0 && selectedActivities.length >= 2) {
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
            activityCount: 2,
            note: '15% έκπτωση για οικογένειες'
        });
    }
    
    return availableCombos;
}

function findBestCombo(combos) {
    if (!combos || combos.length === 0) return null;
    return combos.reduce((best, current) => 
        current.saving > best.saving ? current : best, combos[0]);
}

function checkForNewCombos() {
    if (!currentComboResults) return;
    
    const availableCombos = currentComboResults.availableCombos || [];
    
    if (availableCombos.length > 0) {
        // Εμφάνιση ειδοποίησης
        if (availableCombos.length === 1) {
            showNotification(`💰 Βρέθηκε 1 νέο combo!`);
        } else {
            showNotification(`💰 Βρέθηκαν ${availableCombos.length} νέα combos!`);
        }
    }
}

// ==================== ΚΟΥΜΠΙ COMBO ====================
function addComboButton() {
    console.log('🔄 Trying to add combo button...');
    
    // Διάγραψε παλιά κουμπιά αν υπάρχουν
    const oldButtons = document.querySelectorAll('#combo-main-button, .combo-button');
    oldButtons.forEach(btn => btn.remove());
    
    // Δημιούργησε νέο κουμπί με export επιλογή
    const buttonHTML = `
        <div id="combo-main-button" class="combo-button">
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button onclick="safeCalculateSmartCombos()" title="Υπολογισμός Combos">
                    <span style="font-size: 18px;">💰</span>
                    <span>Έξυπνα Combos</span>
                </button>
                <button onclick="exportComboResults()" style="
                    background: #2196f3;
                    padding: 8px 16px;
                    font-size: 12px;
                    margin-top: 5px;
                " title="Export Αποτελεσμάτων">
                    📥 Export
                </button>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', buttonHTML);
    console.log('✅ Combo button added!');
    
    // Προσθήκη event listeners
    const mainButton = document.querySelector('#combo-main-button button');
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
    
    // Προσθήκη event listeners στα activity cards
    addActivityListeners();
}

function addActivityListeners() {
    const activitySelectors = [
        '.activity-card',
        '.activity-item',
        '.package-item',
        '.product-item',
        '.tour-item',
        '[data-activity]',
        '.card:has(.price)'
    ];
    
    let activityCards = [];
    activitySelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (!activityCards.includes(el) && !el.closest('#combo-main-button')) {
                activityCards.push(el);
            }
        });
    });
    
    console.log(`Found ${activityCards.length} activity cards`);
    
    activityCards.forEach(card => {
        // Καθαρισμός της επιλογής
        card.classList.remove('selected');
        card.removeAttribute('data-combo-selected');
        
        // Προσθήκη click listener
        card.addEventListener('click', function(e) {
            // Αγνόησε clicks σε buttons και links
            if (e.target.tagName === 'BUTTON' || e.target.closest('button') || 
                e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }
            
            this.classList.toggle('selected');
            this.setAttribute('data-combo-selected', this.classList.contains('selected'));
            
            console.log(`Selected: ${this.querySelector('h4, h3, .title')?.textContent?.trim() || 'Activity'}`);
        });
        
        // Προσθήκη cursor pointer
        card.style.cursor = 'pointer';
    });
}

// ==================== MODAL FUNCTIONS ====================
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
                            🎯 Εφαρμογή Combo
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
    
    // Κλείσιμο modal με ESC
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            closeComboModal();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

function renderComboResults() {
    if (!currentComboResults) return '<p>Δεν υπάρχουν αποτελέσματα</p>';
    
    const { regularCost, availableCombos, bestCombo, destination, selectedCount } = currentComboResults;
    const savedCombo = getSavedCombo();
    
    let html = `
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; margin-bottom: 15px;">📊 Σύνοψη</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 10px;">
                <div>
                    <div style="font-size: 14px; color: #666;">Προορισμός:</div>
                    <div style="font-size: 18px; font-weight: bold;">${destination}</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #666;">Δραστηριότητες:</div>
                    <div style="font-size: 18px; font-weight: bold;">${selectedCount}</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #666;">Κανονικό Κόστος:</div>
                    <div style="font-size: 24px; font-weight: bold;">${regularCost.toFixed(2)}€</div>
                </div>
                <div>
                    <div style="font-size: 14px; color: #666;">Combos:</div>
                    <div style="font-size: 24px; font-weight: bold;">${availableCombos.length}</div>
                </div>
            </div>
            
            ${savedCombo?.name ? `
                <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; margin-top: 10px; font-size: 14px;">
                    <strong>📝 Ιστορικό:</strong> Έχετε εφαρμόσει "${savedCombo.name}" ${savedCombo.count} φορές
                </div>
            ` : ''}
        </div>
    `;
    
    if (availableCombos.length > 0) {
        html += `
            <div style="margin-bottom: 20px;">
                <h3 style="margin-top: 0;">🎯 Διαθέσιμα Combos</h3>
                <p style="color: #666; font-size: 14px;">Επιλέξτε ένα combo για να εφαρμόσετε:</p>
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
                " onclick="selectCombo(${index})" onmouseover="this.style.background='${isBest ? 'rgba(156, 39, 176, 0.1)' : '#f8f9fa'}'" onmouseout="this.style.background='${isBest ? 'rgba(156, 39, 176, 0.05)' : 'white'}'">
                    
                    ${isBest ? `
                        <div class="combo-best-badge">
                            🏆 ΚΑΛΥΤΕΡΟ
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h3 style="margin: 0; font-size: 18px;">${combo.name}</h3>
                        <span style="background: #ff9800; color: white; padding: 5px 10px; border-radius: 15px; font-weight: bold; font-size: 14px;">
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
                        ${combo.matchingActivities.slice(0, 3).join(', ')}
                        ${combo.matchingActivities.length > 3 ? ' και ' + (combo.matchingActivities.length - 3) + ' ακόμα' : ''}
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
                <p style="margin-bottom: 20px;">Δοκιμάστε με διαφορετικές δραστηριότητες ή επιλέξτε περισσότερα.</p>
                <button onclick="closeComboModal()" class="combo-btn-secondary" style="margin: 0 auto;">
                    ΟΚ
                </button>
            </div>
        `;
    }
    
    return html;
}

function selectCombo(index) {
    if (!currentComboResults?.availableCombos?.[index]) return;
    
    const combo = currentComboResults.availableCombos[index];
    applyCombo(combo);
}

function applyCombo(combo) {
    if (!combo) return;
    
    saveComboPreference(combo.name);
    
    // Προσομοίωση εφαρμογής combo (μπορείς να προσαρμόσεις για την εφαρμογή σου)
    alert(`✅ Εφαρμόστηκε το "${combo.name}"!\n\n🎯 Εξοικονόμηση: ${combo.saving.toFixed(2)}€\n💰 Νέο κόστος: ${combo.comboPrice.toFixed(2)}€`);
    
    // Εμφάνιση ειδοποίησης
    showNotification(`✅ Εφαρμόστηκε το "${combo.name}"!`);
    
    closeComboModal();
}

function applyBestCombo() {
    if (!currentComboResults?.bestCombo) return;
    applyCombo(currentComboResults.bestCombo);
}

function closeComboModal() {
    const modal = document.getElementById('combo-modal');
    if (modal) modal.remove();
    comboModalOpen = false;
    // Μην καθαρίσεις τα αποτελέσματα για να μπορείς να τα εξάγεις
}

// ==================== DEBUG FUNCTIONS ====================
window.debugCombo = function() {
    console.log('=== DEBUG COMBO CALCULATOR ===');
    console.log('Activity cards:', document.querySelectorAll('.activity-card, .activity-item').length);
    console.log('Selected activities:', getSelectedActivities().length);
    console.log('Combo button exists:', !!document.querySelector('#combo-main-button'));
    console.log('Modal open:', comboModalOpen);
    console.log('Current results:', currentComboResults);
    console.log('APP_STATE:', window.APP_STATE);
    console.log('LocalStorage:', getSavedCombo());
    
    // Επαναφορά κουμπιού
    if (!document.querySelector('#combo-main-button')) {
        addComboButton();
    }
};

// ==================== ΕΚΚΙΝΗΣΗ ====================
// Προσθήκη CSS
addComboStyles();

// Κάνε τις συναρτήσεις διαθέσιμες
window.calculateSmartCombos = safeCalculateSmartCombos;
window.closeComboModal = closeComboModal;
window.applyBestCombo = applyBestCombo;
window.applyCombo = applyCombo;
window.selectCombo = selectCombo;
window.exportComboResults = exportComboResults;
window.debugCombo = debugCombo;

// Αυτόματη εκκίνηση
console.log('🚀 Starting Enhanced Combo Calculator...');

// Χρήση debounce για καλύτερη performance
const debouncedAddComboButton = debounce(addComboButton, 500);

// Προσθήκη κουμπιού μετά από 3 δευτερόλεπτα
setTimeout(() => {
    console.log('⏰ 3 seconds passed, adding combo button...');
    debouncedAddComboButton();
}, 3000);

// Προσθήκη ξανά κάθε 10 δευτερόλεπτα για safety
setInterval(() => {
    if (!document.querySelector('#combo-main-button')) {
        console.log('🔄 Re-adding combo button...');
        debouncedAddComboButton();
    }
}, 10000);

// Προσθήκη με βάση DOM changes
const observer = new MutationObserver(() => {
    if (!document.querySelector('#combo-main-button')) {
        setTimeout(() => debouncedAddComboButton(), 1000);
    }
    
    // Επανάληψη listeners για νέα activity cards
    setTimeout(addActivityListeners, 500);
});

observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true 
});

console.log('🎯 Enhanced Combo Calculator ready!');

// Ειδοποίηση για φόρτωση
setTimeout(() => {
    showNotification('💰 Combo Calculator έτοιμο!');
}, 2000);
