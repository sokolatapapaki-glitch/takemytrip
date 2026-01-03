// combo-calculator.js
// Έξυπνος Υπολογισμός Combos - ΣΥΜΒΑΤΟ με το υπάρχον σύστημα

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
        
        // 1. ΣΥΝΔΕΣΗ ΜΕ ΤΟ ΥΠΑΡΧΟΝ ΣΥΣΤΗΜΑ
        this.connectToExistingApp();
        
        // 2. ΒΡΕΣ ΤΟ CONTAINER
        this.stepContentContainer = document.getElementById('step-content');
        if (!this.stepContentContainer) {
            console.error("❌ Δεν βρέθηκε το step-content container");
            return;
        }
        
        // 3. ΔΗΜΙΟΥΡΓΙΑ ΚΟΥΜΠΙΟΥ
        this.createComboButton();
        
        // 4. ΠΑΡΑΚΟΛΟΥΘΗΣΗ ΒΗΜΑΤΩΝ
        this.observeStepChanges();
        
        this.initialized = true;
        console.log("✅ Combo Calculator Αρχικοποιήθηκε");
    }

    // ΣΥΝΔΕΣΗ ΜΕ ΤΟ ΥΠΑΡΧΟΝ ΣΥΣΤΗΜΑ (ΧΩΡΙΣ ΝΕΑ ΑΠΟΘΗΚΕΥΣΗ)
    connectToExistingApp() {
        console.log("🔗 Σύνδεση με υπάρχον σύστημα...");
        
        // ΑΠΛΑ ΒΕΒΑΙΩΣΟΥ ΟΤΙ ΥΠΑΡΧΟΥΝ ΤΑ ΔΕΔΟΜΕΝΑ
        if (!window.APP_STATE) {
            window.APP_STATE = {
                selectedActivities: [],
                destination: '',
                familyMembers: [],
                availableActivities: []
            };
        }
        
        // ΑΝ ΥΠΑΡΧΟΥΝ ΤΑ ΠΑΛΙΑ ΔΕΔΟΜΕΝΑ, ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΤΑ
        if (typeof familyMembers !== 'undefined') {
            window.APP_STATE.familyMembers = familyMembers;
            console.log("👨‍👩‍👧‍👦 Βρέθηκαν familyMembers:", familyMembers.length);
        }
        
        if (typeof selectedDestinationName !== 'undefined') {
            window.APP_STATE.destination = selectedDestinationName;
            console.log("🏙️ Προορισμός:", selectedDestinationName);
        }
        
        // ΒΡΕΣ ΤΙΣ ΕΠΙΛΕΓΜΕΝΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ ΑΠΟ ΤΟΝ ΧΑΡΤΗ
        this.findSelectedActivities();
    }

    // ΒΡΕΣ ΕΠΙΛΕΓΜΕΝΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ ΑΠΟ ΤΟΝ ΧΑΡΤΗ (ΣΥΜΒΑΤΟΤΗΤΑ)
    findSelectedActivities() {
        if (!window.APP_STATE) return;
        
        // ΕΑΝ ΥΠΑΡΧΕΙ Η ΣΥΝΑΡΤΗΣΗ ΓΙΑ ΕΠΙΛΕΓΜΕΝΕΣ
        if (typeof getSelectedActivities === 'function') {
            const selected = getSelectedActivities();
            window.APP_STATE.selectedActivities = selected || [];
            console.log("📋 Βρέθηκαν επιλεγμένες:", selected.length);
        }
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
        
        // 3. MutationObserver για αλλαγές στο περιεχόμενο
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

    // ==================== ΚΥΡΙΑ ΣΥΝΑΡΤΗΣΗ ΥΠΟΛΟΓΙΣΜΟΥ ====================
    async calculateSmartCombos() {
        console.log("🎯 Έναρξη έξυπνου υπολογισμού combos...");
        
        // 1. ΕΛΕΓΧΟΣ ΒΗΜΑΤΟΣ
        const activeStep = document.querySelector('.step.active');
        if (!activeStep || activeStep.getAttribute('data-step') !== 'activities') {
            alert('⚠️ Η λειτουργία αυτή είναι διαθέσιμη μόνο στο Βήμα 4 (Δραστηριότητες)');
            return;
        }
        
        // 2. ΒΡΕΣ ΤΙΣ ΤΡΕΧΟΥΣΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ (ΣΥΜΒΑΤΑ)
        if (!window.APP_STATE || !window.APP_STATE.familyMembers) {
            alert("❌ Δεν βρέθηκαν δεδομένα οικογένειας");
            return;
        }
        
        // ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΤΙΣ ΥΠΑΡΧΟΥΣΕΣ ΣΥΝΑΡΤΗΣΕΙΣ
        if (typeof getSelectedActivities !== 'function') {
            alert("⚠️ Το σύστημα δραστηριοτήτων δεν είναι έτοιμο");
            return;
        }
        
        const selectedActivities = getSelectedActivities();
        
        if (selectedActivities.length === 0) {
            alert("ℹ️ Δεν έχετε επιλέξει δραστηριότητες!\n\nΠαρακαλώ επιλέξτε τουλάχιστον μία δραστηριότητα για να δείτε έξυπνους συνδυασμούς.");
            return;
        }
        
        console.log(`✅ Βρέθηκαν ${selectedActivities.length} επιλεγμένες δραστηριότητες`);
        
        // 3. ΥΠΟΛΟΓΙΣΜΟΣ ΣΥΝΟΛΙΚΟΥ ΚΟΣΤΟΥΣ (ΧΡΗΣΙΜΟΠΟΙΗΣΕ ΤΟΝ ΥΠΑΡΧΟΝΤΑ ΥΠΟΛΟΓΙΣΜΟ)
        let totalRegularCost = 0;
        const overallElement = document.getElementById('overall-total');
        if (overallElement) {
            const text = overallElement.textContent;
            const match = text.match(/(\d+\.?\d*)\s*€/);
            totalRegularCost = match ? parseFloat(match[1]) : 0;
        }
        
        if (totalRegularCost === 0) {
            // ΕΝΑΛΛΑΚΤΙΚΟΣ ΥΠΟΛΟΓΙΣΜΟΣ
            if (typeof calculateAllCostsNew === 'function') {
                calculateAllCostsNew();
                setTimeout(() => {
                    const newText = overallElement.textContent;
                    const newMatch = newText.match(/(\d+\.?\d*)\s*€/);
                    totalRegularCost = newMatch ? parseFloat(newMatch[1]) : 0;
                    this.showComboModal(totalRegularCost, selectedActivities);
                }, 500);
            }
            return;
        }
        
        // 4. ΕΜΦΑΝΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
        this.showComboModal(totalRegularCost, selectedActivities);
    }

    // ΑΠΛΟ MODAL ΧΩΡΙΣ ΠΕΡΙΠΛΕΚΤΙΚΗ ΛΟΓΙΚΗ
    showComboModal(totalRegularCost, selectedActivities) {
        // Κλείσιμο παλιού modal
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
        
        // ΑΠΛΟΣ ΥΠΟΛΟΓΙΣΜΟΣ: 15% έκπτωση για 3+ δραστηριότητες
        let saving = 0;
        let comboName = "";
        let description = "";
        
        if (selectedActivities.length >= 3) {
            saving = totalRegularCost * 0.15;
            comboName = "🎉 Οικογενειακή Έκπτωση 15%";
            description = "Αυτόματη έκπτωση για 3+ δραστηριότητες";
        } else if (selectedActivities.length >= 2) {
            saving = totalRegularCost * 0.10;
            comboName = "🎁 Έκπτωση 10% για ζευγάρι δραστηριοτήτων";
            description = "Ειδική έκπτωση για 2 δραστηριότητες";
        }
        
        const finalCost = totalRegularCost - saving;
        
        let modalHTML = `
            <div style="background: white; padding: 30px; border-radius: 20px; max-width: 600px; max-height: 80vh; overflow-y: auto;">
                <div style="text-align: center; position: relative;">
                    <button onclick="window.comboCalculator.closeComboModal()" 
                            style="position: absolute; top: -10px; right: -10px; background: #f44336; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px;">
                        ×
                    </button>
                    
                    <h2 style="color: #9c27b0; margin-top: 0;">
                        💰 Αποτελέσματα Combo
                    </h2>
                    
                    <div style="background: #f3e5f5; padding: 15px; border-radius: 12px; margin: 20px 0;">
                        <h3 style="color: #7b1fa2; margin: 0;">${window.APP_STATE.destination || 'Προορισμός'}</h3>
                        <p>👨‍👩‍👧‍👦 ${window.APP_STATE.familyMembers.length} μέλη οικογένειας</p>
                        <p>📋 ${selectedActivities.length} επιλεγμένες δραστηριότητες</p>
                    </div>
        `;
        
        if (saving > 0) {
            modalHTML += `
                <div style="background: #e8f5e8; padding: 20px; border-radius: 12px; border: 3px solid #4caf50; margin: 20px 0;">
                    <h3 style="color: #2e7d32; margin-top: 0;">${comboName}</h3>
                    <p>${description}</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
                            <div>Κανονικό κόστος:</div>
                            <div style="font-size: 22px; color: #f44336; text-decoration: line-through;">${totalRegularCost.toFixed(2)}€</div>
                            
                            <div>Εξοικονόμηση:</div>
                            <div style="font-size: 24px; color: #9c27b0; font-weight: bold;">${saving.toFixed(2)}€</div>
                            
                            <div style="font-weight: bold;">Νέο σύνολο:</div>
                            <div style="font-size: 28px; color: #4caf50; font-weight: bold;">${finalCost.toFixed(2)}€</div>
                        </div>
                    </div>
                    
                    <button onclick="window.comboCalculator.applyCombo(${saving}, '${comboName}')"
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
                        💡 Συμβουλή: Προσθέστε περισσότερες δραστηριότητες για να δείτε πιθανές εκπτώσεις.
                    </p>
                </div>
            `;
        }
        
        modalHTML += `
                <div style="margin-top: 20px;">
                    <button onclick="window.comboCalculator.closeComboModal()"
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
        
        // 2. Ενημέρωση συνολικού κόστους
        const totalElement = document.getElementById('overall-total');
        if (totalElement) {
            const text = totalElement.textContent;
            const match = text.match(/(\d+\.?\d*)\s*€/);
            const currentCost = match ? parseFloat(match[1]) : 0;
            const newCost = Math.max(0, currentCost - savingAmount);
            
            totalElement.textContent = `Συνολικό Κόστος Επιλεγμένων Δραστηριοτήτων: ${newCost.toFixed(2)} € (με ${comboName})`;
            totalElement.style.color = '#4caf50';
            totalElement.style.fontWeight = 'bold';
        }
        
        // 3. Μήνυμα επιβεβαίωσης
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
        
        // 4. ΑΠΟΘΗΚΕΥΣΗ ΜΕ ΤΟΝ ΥΠΑΡΧΟΝΤΑ ΤΡΟΠΟ
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        console.log("✅ Combo εφαρμόστηκε και αποθηκεύτηκε");
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
        comboCalculator.init();
    }, 2000);
});

// Κάνε το comboCalculator προσβάσιμο
window.comboCalculator = comboCalculator;

// Βοηθητική συνάρτηση για debug
window.debugComboCalculator = () => {
    console.log('Combo Calculator Status:', {
        initialized: comboCalculator.initialized,
        buttonExists: !!comboCalculator.comboButton,
        APP_STATE: window.APP_STATE
    });
};
