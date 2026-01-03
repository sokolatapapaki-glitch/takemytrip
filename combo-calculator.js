// combo-calculator.js
// Υπολογισμός έξυπνων combos για δραστηριότητες

class ComboCalculator {
    constructor() {
        this.initialized = false;
        this.comboButton = null;
        this.currentStepObserver = null;
        this.stepContentContainer = null;
    }

    async init() {
        if (this.initialized) return;
        
        console.log("🎯 Combo Calculator Αρχικοποίηση...");
        
        // Βρες το step-content container
        this.stepContentContainer = document.getElementById('step-content');
        if (!this.stepContentContainer) {
            console.error("❌ Δεν βρέθηκε το step-content container");
            return;
        }
        
        // 1. ΔΗΜΙΟΥΡΓΙΑ ΚΟΥΜΠΙΟΥ
        this.createComboButton();
        
        // 2. ΠΑΡΑΚΟΛΟΥΘΗΣΗ ΤΟΥ ΒΗΜΑΤΟΣ
        this.observeStepChanges();
        
        // 3. ΚΑΘΑΡΙΣΜΟΣ ΑΥΤΟΜΑΤΩΝ ΕΠΙΛΟΓΩΝ
        this.clearAutoSelections();
        
        this.initialized = true;
        console.log("✅ Combo Calculator Αρχικοποιήθηκε");
    }

    createComboButton() {
        // Δημιουργία κουμπιού combo
        this.comboButton = document.createElement('button');
        this.comboButton.id = 'smart-combo-btn';
        this.comboButton.innerHTML = '💰 Έξυπνος Υπολογισμός Combo';
        this.comboButton.style.cssText = `
            margin: 20px auto;
            padding: 15px 30px;
            font-size: 18px;
            border-radius: 14px;
            background: #9c27b0;
            color: white;
            border: none;
            cursor: pointer;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(156, 39, 176, 0.3);
            transition: all 0.3s ease;
            display: none;
            opacity: 0;
            width: 90%;
            max-width: 500px;
        `;
        
        this.comboButton.onmouseover = () => {
            this.comboButton.style.transform = 'translateY(-2px)';
            this.comboButton.style.boxShadow = '0 6px 16px rgba(156, 39, 176, 0.4)';
        };
        
        this.comboButton.onmouseout = () => {
            this.comboButton.style.transform = 'translateY(0)';
            this.comboButton.style.boxShadow = '0 4px 12px rgba(156, 39, 176, 0.3)';
        };
        
        this.comboButton.onclick = () => {
            this.calculateSmartCombos();
        };
        
        // Προσθήκη στο step-content container
        if (this.stepContentContainer) {
            this.stepContentContainer.appendChild(this.comboButton);
            console.log("✅ Combo button added to step-content");
        } else {
            document.body.appendChild(this.comboButton);
            console.log("⚠️ Combo button added to body (fallback)");
        }
    }

    observeStepChanges() {
        console.log("👀 Παρακολούθηση αλλαγών βημάτων...");
        
        // 1. Έλεγχος για το τρέχον βήμα
        this.checkCurrentStep();
        
        // 2. Ακούστε για αλλαγές στο sidebar
        const stepElements = document.querySelectorAll('.step');
        stepElements.forEach(step => {
            step.addEventListener('click', () => {
                setTimeout(() => this.checkCurrentStep(), 300);
            });
        });
        
        // 3. Παρακολούθηση του mobile selector
        const mobileSelector = document.getElementById('mobile-step-selector');
        if (mobileSelector) {
            mobileSelector.addEventListener('change', () => {
                setTimeout(() => this.checkCurrentStep(), 300);
            });
        }
        
        // 4. MutationObserver για αλλαγές στο περιεχόμενο
        const observer = new MutationObserver(() => {
            setTimeout(() => this.checkCurrentStep(), 100);
        });
        
        if (this.stepContentContainer) {
            observer.observe(this.stepContentContainer, { 
                childList: true, 
                subtree: true 
            });
        }
        
        this.currentStepObserver = observer;
    }

    checkCurrentStep() {
        // 1. Έλεγχος sidebar steps
        const activeStep = document.querySelector('.step.active');
        if (!activeStep) return;
        
        const stepType = activeStep.getAttribute('data-step');
        
        // 2. Εμφάνιση/Απόκρυψη κουμπιού
        if (stepType === 'activities') {
            // ΒΗΜΑ 4: Εμφάνιση κουμπιού
            this.showComboButton();
        } else {
            // Άλλα βήματα: Απόκρυψη
            this.hideComboButton();
        }
    }

    showComboButton() {
        if (!this.comboButton) return;
        
        // Εμφάνιση με animation
        this.comboButton.style.display = 'block';
        setTimeout(() => {
            this.comboButton.style.opacity = '1';
        }, 50);
        
        // Τοποθέτηση μετά τις δραστηριότητες
        const activitiesContainer = document.getElementById('activities-container');
        if (activitiesContainer && activitiesContainer.parentNode === this.stepContentContainer) {
            if (activitiesContainer.nextSibling !== this.comboButton) {
                if (this.comboButton.parentNode) {
                    this.comboButton.parentNode.removeChild(this.comboButton);
                }
                activitiesContainer.parentNode.insertBefore(this.comboButton, activitiesContainer.nextSibling);
            }
        }
        
        console.log("✅ Κουμπί combo εμφανίζεται στο Βήμα 4");
    }

    hideComboButton() {
        if (!this.comboButton) return;
        
        this.comboButton.style.opacity = '0';
        setTimeout(() => {
            this.comboButton.style.display = 'none';
        }, 300);
    }

clearAutoSelections() {
    // Δεν χρειάζεται πλέον, αλλά ας την κρατήσουμε για κάθε περίπτωση
    console.log("🧹 Καθαρισμός επιλογών (λειτουργία διατηρείται)");
    
    const autoSelectedCards = document.querySelectorAll('.activity-card[data-auto-selected="true"]');
    if (autoSelectedCards.length > 0) {
        autoSelectedCards.forEach(card => {
            card.classList.remove('selected');
            card.removeAttribute('data-auto-selected');
        });
        console.log(`🧹 Αφαιρέθηκαν ${autoSelectedCards.length} παλιές αυτόματες επιλογές`);
    }
}

    // ==================== ΚΥΡΙΑ ΣΥΝΑΡΤΗΣΗ ΥΠΟΛΟΓΙΣΜΟΥ ====================
    async calculateSmartCombos() {
        console.log("🎯 Έναρξη έξυπνου υπολογισμού combos...");
        
        // 1. ΕΛΕΓΧΟΣ ΒΗΜΑΤΟΣ
        const activeStep = document.querySelector('.step.active');
        if (!activeStep || activeStep.getAttribute('data-step') !== 'activities') {
            alert('⚠️ Η λειτουργία αυτή είναι διαθέσιμη μόνο στο Βήμα 4 (Δραστηριότητες)');
            return;
        }
        
        // 2. ΒΡΕΣ ΤΙΣ ΤΡΕΧΟΥΣΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ
        if (!APP_STATE || !APP_STATE.selectedActivities) {
            alert("❌ Δεν βρέθηκαν δεδομένα δραστηριοτήτων");
            return;
        }
        
        const selectedActivities = APP_STATE.selectedActivities;
        
       if (selectedActivities.length === 0) {
    alert("ℹ️ Δεν έχετε επιλέξει δραστηριότητες!\n\nΠαρακαλώ επιλέξτε τουλάχιστον μία δραστηριότητα για να δείτε έξυπνους συνδυασμούς.");
    return;
}
        
        console.log(`✅ Βρέθηκαν ${selectedActivities.length} επιλεγμένες δραστηριότητες`);
        
        // 3. ΥΠΟΛΟΓΙΣΜΟΣ ΣΥΝΟΛΙΚΟΥ ΚΟΣΤΟΥΣ
        const totalRegularCost = this.calculateTotalCost();
        
        // 4. ΑΝΑΖΗΤΗΣΗ COMBO
        const cityName = APP_STATE.destination || '';
        let bestCombo = null;
        let bestSaving = 0;
        
        // Απλός υπολογισμός έκπτωσης 15% αν υπάρχουν 3+ δραστηριότητες
        if (selectedActivities.length >= 3) {
            bestSaving = totalRegularCost * 0.15;
            bestCombo = {
                name: "🎉 Οικογενειακή Έκπτωση 15%",
                description: "Αυτόματη έκπτωση για 3+ δραστηριότητες",
                saving: bestSaving
            };
        }
        
        // 5. ΕΜΦΑΝΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
        this.displaySimpleResult(totalRegularCost, bestCombo, bestSaving, cityName);
    }

    calculateTotalCost() {
        if (!APP_STATE || !APP_STATE.selectedActivities || !APP_STATE.familyMembers) return 0;
        
        let total = 0;
        APP_STATE.selectedActivities.forEach(activity => {
            APP_STATE.familyMembers.forEach(member => {
                if (member.age >= 18) {
                    total += activity.adultPrice || 0;
                } else {
                    total += activity.childPrice || 0;
                }
            });
        });
        return total;
    }

    displaySimpleResult(totalRegularCost, bestCombo, bestSaving, cityName) {
        // Κλείσιμο παλιού modal αν υπάρχει
        this.closeComboModal();
        
        const modal = document.createElement('div');
        modal.id = 'combo-calculator-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Comic Neue', Arial, sans-serif;
        `;
        
        let modalHTML = `
            <div style="background: white; padding: 30px; border-radius: 20px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div style="text-align: center; position: relative;">
                    <button onclick="comboCalculator.closeComboModal()" 
                            style="position: absolute; top: -10px; right: -10px; background: #f44336; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">
                        ×
                    </button>
                    
                    <h2 style="color: #9c27b0; margin-top: 0;">
                        💰 Αποτελέσματα Combo
                    </h2>
                    
                    <div style="background: #f3e5f5; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="color: #7b1fa2; margin: 0;">${cityName || 'Προορισμός'}</h3>
                        <p>${APP_STATE.familyMembers?.length || 0} μέλη οικογένειας</p>
                    </div>
        `;
        
        if (bestCombo && bestSaving > 0) {
            const finalCost = totalRegularCost - bestSaving;
            
            modalHTML += `
                <div style="background: #e8f5e8; padding: 20px; border-radius: 12px; border: 3px solid #4caf50; margin: 20px 0;">
                    <h3 style="color: #2e7d32; margin-top: 0;">${bestCombo.name}</h3>
                    <p>${bestCombo.description}</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
                            <div>Κανονικό κόστος:</div>
                            <div style="font-size: 22px; color: #f44336; text-decoration: line-through;">${totalRegularCost.toFixed(2)}€</div>
                            
                            <div>Εξοικονόμηση:</div>
                            <div style="font-size: 24px; color: #9c27b0; font-weight: bold;">${bestSaving.toFixed(2)}€</div>
                            
                            <div style="font-weight: bold;">Νέο σύνολο:</div>
                            <div style="font-size: 28px; color: #4caf50; font-weight: bold;">${finalCost.toFixed(2)}€</div>
                        </div>
                    </div>
                    
                    <button onclick="comboCalculator.applyCombo(${bestSaving}, '${bestCombo.name}')"
                            style="width: 100%; padding: 15px; background: #9c27b0; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: bold; margin-top: 10px;">
                        ✅ Εφαρμογή Combo
                    </button>
                </div>
            `;
        } else {
            modalHTML += `
                <div style="background: #fff3cd; padding: 20px; border-radius: 12px; border: 2px solid #ffc107; margin: 20px 0;">
                    <h3 style="color: #856404;">ℹ️ Δεν βρέθηκαν combos</h3>
                    <p>Το συνολικό κόστος είναι: <strong>${totalRegularCost.toFixed(2)}€</strong></p>
                    <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                        Προσθέστε περισσότερες δραστηριότητες για να δείτε πιθανές εκπτώσεις.
                    </p>
                </div>
            `;
        }
        
        modalHTML += `
                <div style="margin-top: 20px;">
                    <button onclick="comboCalculator.closeComboModal()"
                            style="padding: 12px 25px; background: #3eb489; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; width: 100%;">
                        Κλείσιμο
                    </button>
                </div>
            </div>
        </div>
        `;
        
        modal.innerHTML = modalHTML;
        document.body.appendChild(modal);
        
        this.currentModal = modal;
    }

    closeComboModal() {
        const modal = document.getElementById('combo-calculator-modal');
        if (modal) {
            modal.remove();
        }
        this.currentModal = null;
    }

    applyCombo(savingAmount, comboName) {
        console.log(`✅ Εφαρμογή combo: ${comboName} (Εξοικονόμηση: ${savingAmount}€)`);
        
        // 1. Κλείσιμο modal
        this.closeComboModal();
        
        // 2. Εμφάνιση επιβεβαίωσης
        const successMsg = document.createElement('div');
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
            z-index: 10001;
            animation: slideInRight 0.5s ease;
        `;
        successMsg.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">✅ Combo Εφαρμόστηκε!</div>
            <div>Έκτιμηση εξοικονόμησης: <strong>${savingAmount.toFixed(2)}€</strong></div>
        `;
        
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
        
        // 3. Ενημέρωση συνολικού κόστους (προσομοίωση)
        const totalElement = document.getElementById('total-activities-cost');
        if (totalElement) {
            const currentText = totalElement.textContent;
            const currentCost = parseFloat(currentText) || 0;
            const newCost = Math.max(0, currentCost - savingAmount);
            totalElement.textContent = `${newCost.toFixed(2)}€`;
            totalElement.style.color = '#4caf50';
            totalElement.style.fontWeight = 'bold';
        }
        
        showNotification(`✅ Εφαρμόστηκε το combo: ${comboName}`, 'success');
    }

    // ΔΗΜΟΣΙΕΣ ΜΕΘΟΔΟΙ
    getComboButton() {
        return this.comboButton;
    }

    destroy() {
        if (this.currentStepObserver) {
            this.currentStepObserver.disconnect();
        }
        
        if (this.comboButton) {
            this.comboButton.remove();
        }
        
        this.closeComboModal();
        
        this.initialized = false;
        console.log("🗑️ Combo Calculator Καταστράφηκε");
    }
}

// Δημιουργία global instance
const comboCalculator = new ComboCalculator();

// Αυτόματη αρχικοποίηση
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.comboCalculator) {
            window.comboCalculator.init();
        }
    }, 1500);
});

// Κάνε το comboCalculator προσβάσιμο
window.comboCalculator = comboCalculator;

// Debug function
window.debugComboButton = () => {
    console.log('Combo Button Debug:', {
        exists: !!comboCalculator.comboButton,
        visible: comboCalculator.comboButton ? window.getComputedStyle(comboCalculator.comboButton).display !== 'none' : false,
        parent: comboCalculator.comboButton ? comboCalculator.comboButton.parentNode : null
    });
};
