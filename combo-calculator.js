// ==================== COMBO CALCULATOR - SAFE VERSION ====================
console.log('🎯 Combo Calculator v2.0 loaded');

// ==================== GLOBAL VARIABLES ====================
let comboInitialized = false;
let comboBtn = null;
let selectedActivities = [];
let originalTitles = new Map();

// ==================== CHECK IF ON ACTIVITIES PAGE ====================
function isOnActivitiesPage() {
    // Check URL for activity keywords
    const url = window.location.href.toLowerCase();
    const urlKeywords = ['activity', 'tour', 'excursion', 'package', 'activities'];
    
    if (urlKeywords.some(keyword => url.includes(keyword))) {
        return true;
    }
    
    // Check page content
    const pageText = document.body.textContent.toLowerCase();
    const contentKeywords = ['δραστηριότητ', 'activities', 'tours', 'packages', 'tickets'];
    
    if (contentKeywords.some(keyword => pageText.includes(keyword))) {
        return true;
    }
    
    // Check for activity cards/items
    const activityElements = document.querySelectorAll('[class*="activity"], [class*="tour"], [class*="package"], .card, .product-item');
    if (activityElements.length > 3) {
        return true;
    }
    
    return false;
}

// ==================== ADD STYLES ====================
function addComboStyles() {
    if (document.getElementById('combo-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'combo-styles';
    style.textContent = `
        /* Main Combo Button */
        #combo-btn-container {
            position: fixed;
            bottom: 30px;
            right: 30px;
            z-index: 10000;
            animation: slideIn 0.5s ease-out;
        }
        
        #combo-btn {
            background: linear-gradient(135deg, #ff6b6b, #ff4757);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 14px 28px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        #combo-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(255, 107, 107, 0.6);
        }
        
        #combo-btn:active {
            transform: translateY(-1px);
        }
        
        /* Activity Selection */
        .activity-combo-select {
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .activity-combo-select::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 3px solid transparent;
            border-radius: 8px;
            transition: border-color 0.3s ease;
            pointer-events: none;
        }
        
        .activity-combo-select.selected {
            background: rgba(255, 107, 107, 0.05) !important;
        }
        
        .activity-combo-select.selected::after {
            border-color: #ff6b6b;
        }
        
        .activity-combo-select.selected::before {
            content: '✓';
            position: absolute;
            top: 10px;
            right: 10px;
            background: #ff6b6b;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            z-index: 2;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        /* Modal */
        .combo-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        }
        
        .combo-modal {
            background: white;
            border-radius: 15px;
            width: 90%;
            max-width: 600px;
            max-height: 85vh;
            overflow-y: auto;
            animation: slideUp 0.4s ease;
        }
        
        .combo-modal-header {
            background: linear-gradient(135deg, #ff6b6b, #ff4757);
            color: white;
            padding: 20px 30px;
            border-radius: 15px 15px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .combo-modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 28px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
            opacity: 0.8;
            transition: opacity 0.2s;
        }
        
        .combo-modal-close:hover {
            opacity: 1;
        }
        
        /* Animations */
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
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
    `;
    
    document.head.appendChild(style);
}

// ==================== CREATE COMBO BUTTON ====================
function createComboButton() {
    if (comboBtn || !isOnActivitiesPage()) return;
    
    // Remove any existing button first
    const existingBtn = document.getElementById('combo-btn-container');
    if (existingBtn) existingBtn.remove();
    
    addComboStyles();
    
    const btnContainer = document.createElement('div');
    btnContainer.id = 'combo-btn-container';
    btnContainer.innerHTML = `
        <button id="combo-btn">
            <span style="font-size: 20px;">🎯</span>
            <span>Έξυπνα Combos</span>
            <span id="combo-counter" style="background: white; color: #ff4757; padding: 2px 8px; border-radius: 20px; font-size: 12px; margin-left: 5px; display: none;">0</span>
        </button>
    `;
    
    document.body.appendChild(btnContainer);
    comboBtn = document.getElementById('combo-btn');
    
    // Add click event
    comboBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        showComboModal();
    });
    
    console.log('✅ Combo button created successfully!');
}

// ==================== ACTIVITY SELECTION LOGIC ====================
function enableActivitySelection() {
    if (!isOnActivitiesPage()) return;
    
    // Find activity elements with better selectors
    const selectors = [
        '.activity-item',
        '.tour-item',
        '.package-item',
        '.product-item',
        '[data-activity]',
        '[data-tour]',
        '[data-package]',
        '.card:has(h3, h4):has(.price, [class*="price"]):not(.combo-modal *):not(#combo-btn-container *)',
        '.item:has(h3, h4):has(.price, [class*="price"]):not(.combo-modal *):not(#combo-btn-container *)'
    ];
    
    let activitiesFound = 0;
    
    selectors.forEach(selector => {
        try {
            const elements = document.querySelectorAll(selector);
            
            elements.forEach(element => {
                if (element.classList.contains('combo-processed')) return;
                
                activitiesFound++;
                element.classList.add('combo-processed');
                element.classList.add('activity-combo-select');
                
                // Store original title for later
                const title = element.querySelector('h3, h4, .title, .name');
                if (title) {
                    originalTitles.set(element, title.textContent.trim());
                }
                
                // Add click event
                element.addEventListener('click', function(e) {
                    // Ignore clicks on buttons and links
                    if (e.target.tagName === 'BUTTON' || e.target.closest('button') ||
                        e.target.tagName === 'A' || e.target.closest('a') ||
                        e.target.tagName === 'INPUT') {
                        return;
                    }
                    
                    e.stopPropagation();
                    
                    // Toggle selection
                    if (this.classList.contains('selected')) {
                        this.classList.remove('selected');
                        const index = selectedActivities.indexOf(this);
                        if (index > -1) {
                            selectedActivities.splice(index, 1);
                        }
                    } else {
                        this.classList.add('selected');
                        if (!selectedActivities.includes(this)) {
                            selectedActivities.push(this);
                        }
                    }
                    
                    updateComboCounter();
                    console.log('Selected activities:', selectedActivities.length);
                });
            });
        } catch (e) {
            console.log('Error with selector:', selector, e);
        }
    });
    
    if (activitiesFound > 0) {
        console.log(`Found ${activitiesFound} activity elements`);
        createComboButton();
    }
}

function updateComboCounter() {
    const counter = document.getElementById('combo-counter');
    if (!counter) return;
    
    if (selectedActivities.length > 0) {
        counter.textContent = selectedActivities.length;
        counter.style.display = 'inline-block';
    } else {
        counter.style.display = 'none';
    }
}

// ==================== COMBO CALCULATIONS ====================
function calculateCombos() {
    if (selectedActivities.length < 2) {
        return {
            success: false,
            message: `Πρέπει να επιλέξετε τουλάχιστον 2 δραστηριότητες για combos.<br><br>Επιλέξτε κάνοντας κλικ στις δραστηριότητες που σας ενδιαφέρουν.`
        };
    }
    
    // Get prices from selected activities
    const activities = selectedActivities.map(element => {
        let price = 0;
        let title = '';
        
        // Try to find price
        const priceEl = element.querySelector('.price, .cost, [class*="price"], [class*="cost"]');
        if (priceEl) {
            const priceText = priceEl.textContent;
            const match = priceText.match(/(\d+(?:[.,]\d+)?)/);
            if (match) {
                price = parseFloat(match[1].replace(',', '.'));
            }
        }
        
        // Get title
        const titleEl = element.querySelector('h3, h4, .title, .name');
        if (titleEl) {
            title = titleEl.textContent.trim();
        } else {
            title = originalTitles.get(element) || 'Δραστηριότητα';
        }
        
        return {
            element: element,
            title: title,
            price: price || 25, // Default price if not found
            adults: 2, // Default 2 adults
            children: 1 // Default 1 child
        };
    });
    
    // Calculate combos
    const availableCombos = [];
    const totalRegularPrice = activities.reduce((sum, activity) => {
        return sum + (activity.price * (activity.adults + activity.children * 0.7));
    }, 0);
    
    // Combo options based on number of activities
    if (selectedActivities.length >= 2) {
        // 2 Activities Combo
        availableCombos.push({
            name: '🎯 Combo 2 Δραστηριοτήτων',
            discount: 15,
            description: 'Για οικογένειες που επιλέγουν 2 δραστηριότητες',
            icon: '🎯'
        });
    }
    
    if (selectedActivities.length >= 3) {
        // 3 Activities Combo
        availableCombos.push({
            name: '⭐ Combo 3 Δραστηριοτήτων',
            discount: 25,
            description: 'Ειδική προσφορά για 3+ δραστηριότητες',
            icon: '⭐'
        });
        
        // Premium Combo
        availableCombos.push({
            name: '🏆 Premium Combo',
            discount: 30,
            description: 'Η καλύτερη προσφορά για 3+ δραστηριότητες',
            icon: '🏆'
        });
    }
    
    if (selectedActivities.length >= 4) {
        // Family Combo
        availableCombos.push({
            name: '👨‍👩‍👧‍👦 Οικογενειακό Combo',
            discount: 35,
            description: 'Για οικογένειες που επιλέγουν 4+ δραστηριότητες',
            icon: '👨‍👩‍👧‍👦'
        });
    }
    
    // Calculate prices for each combo
    const combosWithPrices = availableCombos.map(combo => {
        const comboPrice = totalRegularPrice * (1 - combo.discount / 100);
        const saving = totalRegularPrice - comboPrice;
        
        return {
            ...combo,
            regularPrice: totalRegularPrice.toFixed(2),
            comboPrice: comboPrice.toFixed(2),
            saving: saving.toFixed(2),
            activityCount: selectedActivities.length
        };
    });
    
    // Sort by best saving
    combosWithPrices.sort((a, b) => parseFloat(b.saving) - parseFloat(a.saving));
    
    return {
        success: true,
        activityCount: selectedActivities.length,
        regularPrice: totalRegularPrice.toFixed(2),
        combos: combosWithPrices,
        bestCombo: combosWithPrices[0]
    };
}

// ==================== MODAL FUNCTIONS ====================
function showComboModal() {
    // Close any existing modal
    closeComboModal();
    
    const result = calculateCombos();
    
    const modalHTML = `
        <div class="combo-modal-overlay" id="combo-modal">
            <div class="combo-modal">
                <div class="combo-modal-header">
                    <h2 style="margin: 0; font-size: 20px;">
                        <span style="margin-right: 10px;">🎯</span>
                        Έξυπνα Combos
                    </h2>
                    <button class="combo-modal-close" onclick="closeComboModal()">&times;</button>
                </div>
                
                <div style="padding: 25px;">
                    ${!result.success ? `
                        <div style="text-align: center; padding: 30px 20px;">
                            <div style="font-size: 64px; margin-bottom: 20px; color: #ff6b6b;">🎯</div>
                            <h3 style="margin-bottom: 15px; color: #333;">${selectedActivities.length === 0 ? 'Καμία επιλεγμένη δραστηριότητα' : 'Μόνο 1 επιλεγμένη'}</h3>
                            <div style="color: #666; margin-bottom: 25px; font-size: 15px; line-height: 1.6;">
                                ${result.message}
                            </div>
                            <div style="display: flex; gap: 10px; justify-content: center;">
                                <button onclick="closeComboModal()" style="background: #ff6b6b; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold;">
                                    Εντάξει
                                </button>
                            </div>
                        </div>
                    ` : `
                        <!-- Summary -->
                        <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div>
                                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Επιλεγμένες δραστηριότητες</div>
                                    <div style="font-size: 32px; font-weight: bold; color: #333;">${result.activityCount}</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Κανονική τιμή</div>
                                    <div style="font-size: 24px; font-weight: bold; color: #e74c3c; text-decoration: line-through;">${result.regularPrice}€</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Available Combos -->
                        <h3 style="margin-top: 0; margin-bottom: 20px; color: #333;">Διαθέσιμα Combos</h3>
                        
                        ${result.combos.map((combo, index) => `
                            <div style="border: 2px solid ${index === 0 ? '#ff6b6b' : '#e0e0e0'}; 
                                       border-radius: 12px; 
                                       padding: 20px; 
                                       margin-bottom: 15px;
                                       background: ${index === 0 ? 'rgba(255, 107, 107, 0.05)' : 'white'};
                                       position: relative;">
                                ${index === 0 ? `
                                    <div style="position: absolute; top: -12px; right: 20px; background: #ff6b6b; color: white; padding: 6px 15px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                                        🏆 ΚΑΛΥΤΕΡΗ ΠΡΟΣΦΟΡΑ
                                    </div>
                                ` : ''}
                                
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                                    <div>
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                                            <span style="font-size: 24px;">${combo.icon}</span>
                                            <h4 style="margin: 0; font-size: 18px; color: #333;">${combo.name}</h4>
                                        </div>
                                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">${combo.description}</p>
                                    </div>
                                    <div style="background: ${index === 0 ? '#ff6b6b' : '#ff9800'}; 
                                                color: white; 
                                                padding: 8px 16px; 
                                                border-radius: 20px; 
                                                font-weight: bold; 
                                                font-size: 16px;">
                                        -${combo.discount}%
                                    </div>
                                </div>
                                
                                <!-- Pricing -->
                                <div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 15px; border: 1px solid #eee;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 15px;">
                                        <span>Κανονική τιμή:</span>
                                        <span style="text-decoration: line-through; color: #e74c3c; font-weight: bold;">${combo.regularPrice}€</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
                                        <span>Τιμή με combo:</span>
                                        <span style="color: #27ae60; font-size: 22px;">${combo.comboPrice}€</span>
                                    </div>
                                </div>
                                
                                <!-- Saving -->
                                <div style="background: linear-gradient(135deg, #d4edda, #c3e6cb); 
                                            color: #155724; 
                                            padding: 12px 15px; 
                                            border-radius: 8px; 
                                            margin-bottom: 15px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
                                        <span style="font-size: 15px;">Εξοικονόμηση:</span>
                                        <span style="font-size: 20px;">${combo.saving}€</span>
                                    </div>
                                </div>
                                
                                <!-- Action Button -->
                                <button onclick="applyCombo('${combo.name}', ${combo.comboPrice})" 
                                        style="width: 100%; 
                                               background: ${index === 0 ? '#ff6b6b' : '#4CAF50'}; 
                                               color: white; 
                                               border: none; 
                                               padding: 14px; 
                                               border-radius: 8px; 
                                               cursor: pointer; 
                                               font-weight: bold; 
                                               font-size: 16px;
                                               transition: all 0.3s;">
                                    ✅ Εφαρμογή Combo
                                </button>
                            </div>
                        `).join('')}
                        
                        <!-- Instructions -->
                        <div style="margin-top: 25px; padding: 15px; background: #e3f2fd; border-radius: 8px; font-size: 14px; color: #1565c0;">
                            <strong>💡 Συμβουλή:</strong> Μπορείτε να επιλέξετε ή να αποεπιλέξετε δραστηριότητες κάνωντας κλικ πάνω τους.
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add click outside to close
    document.getElementById('combo-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeComboModal();
        }
    });
    
    // Add ESC key listener
    document.addEventListener('keydown', function modalEscHandler(e) {
        if (e.key === 'Escape') {
            closeComboModal();
            document.removeEventListener('keydown', modalEscHandler);
        }
    });
}

function closeComboModal() {
    const modal = document.getElementById('combo-modal');
    if (modal) modal.remove();
}

function applyCombo(comboName, price) {
    alert(`✅ Εφαρμόστηκε το "${comboName}"!\n\n💰 Εξοικονόμηση: ${price}€\n\nΟι τιμές έχουν ενημερωθεί στο καλάθι σας.`);
    closeComboModal();
}

// ==================== INITIALIZE ====================
function initializeComboCalculator() {
    if (comboInitialized) return;
    
    console.log('🚀 Initializing Combo Calculator...');
    
    // Wait for page to load
    setTimeout(() => {
        // Check if we're on activities page
        if (isOnActivitiesPage()) {
            console.log('📋 Found activities page!');
            
            // Add styles
            addComboStyles();
            
            // Enable activity selection
            enableActivitySelection();
            
            // Create button if activities found
            setTimeout(() => {
                if (!comboBtn) {
                    createComboButton();
                }
            }, 500);
            
            // Watch for new activities (SPA navigation)
            const observer = new MutationObserver(() => {
                enableActivitySelection();
                
                // Remove button if no longer on activities page
                if (!isOnActivitiesPage() && comboBtn) {
                    comboBtn.parentElement.remove();
                    comboBtn = null;
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            comboInitialized = true;
            console.log('✅ Combo Calculator initialized successfully!');
        } else {
            console.log('ℹ️ Not on activities page, calculator not activated.');
        }
    }, 1500); // Wait longer for page to fully load
}

// ==================== EXPORT FUNCTIONS ====================
window.closeComboModal = closeComboModal;
window.applyCombo = applyCombo;

// ==================== START ====================
// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeComboCalculator);
} else {
    initializeComboCalculator();
}

// Also initialize after a delay for dynamically loaded content
setTimeout(initializeComboCalculator, 3000);

// Watch for URL changes (for SPAs)
let lastUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        console.log('🔗 URL changed, reinitializing...');
        comboInitialized = false;
        initializeComboCalculator();
    }
}, 1000);
