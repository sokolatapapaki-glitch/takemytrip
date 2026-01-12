// ==================== COMBO MODULE ====================
// Smart combo / discount calculations for activity bundles
// Pure refactor - NO logic changes, 100% identical behavior

// NOTE: These functions access global variables that will be made available:
// - state (global state object - imported in main.js)
// - showToast (from ui.js - made global via window)
// - updateActivitiesTotal (from ui.js - made global via window)
// - calculateTotalSpent (from ui.js - made global via window)

// ==================== CALCULATE FAMILY COST ====================
export function calculateFamilyCost(prices) {
    if (!prices || typeof prices !== 'object') {
        console.log('❌ prices είναι άκυρο:', prices);
        return 0;
    }

    console.log('💰 Διαθέσιμες τιμές:', Object.keys(prices).map(k => `${k}: ${prices[k]}€`).join(', '));
    console.log('👨‍👩‍👧‍👦 Μέλη:', state.familyMembers);

    let total = 0;
    let membersWithAge = 0;

    state.familyMembers.forEach((member) => {
        let age = member.age;

        // 🔴 ΚΡΙΤΙΚΗ ΔΙΟΡΘΩΣΗ: Αγνόησε ΤΕΛΕΙΩΣ τα μέλη με κενή/μη έγκυρη ηλικία
        if (age === "" || age === null || age === undefined) {
            console.log(`⚠️ Μέλος "${member.name}" δεν έχει ηλικία - ΑΓΝΟΕΙΤΑΙ ΟΛΟΚΛΗΡΩΣ`);
            return; // Αυτό είναι το κλειδί - επιστροφή χωρίς να προσθέσει τίποτα
        }

        age = parseInt(age);
        if (isNaN(age) || age < 0 || age > 120) {
            console.log(`⚠️ Μέλος "${member.name}" έχει μη έγκυρη ηλικία "${member.age}" - ΑΓΝΟΕΙΤΑΙ`);
            return; // Αγνόησε και αυτό
        }

        let price = 0;

        // Προσπάθησε να βρεις ακριβή τιμή για την ηλικία
        if (prices[age] !== undefined && prices[age] !== null) {
            price = prices[age];
        }
        // Αν δεν βρέθηκε ακριβής τιμή, δοκίμασε γενικές κατηγορίες
        else if (age >= 18 && prices.adult !== undefined) {
            price = prices.adult;
        }
        else if (age >= 5 && age <= 17) {
            if (prices.child !== undefined) {
                price = prices.child;
            } else if (prices['10'] !== undefined) {
                price = prices['10'];
            } else if (prices['5'] !== undefined) {
                price = prices['5'];
            }
        }
        else if (age <= 4 && prices['0'] !== undefined) {
            price = prices['0']; // Μπορεί να είναι 0 (δωρεάν) ή κάποια τιμή
        }
        else {
            // Αν δεν βρέθηκε τιμή, χρησιμοποίησε μια προκαθορισμένη
            console.warn(`⚠️ Δεν βρέθηκε τιμή για ηλικία ${age}. Στο JSON υπάρχουν: ${Object.keys(prices).join(', ')}`);
            price = 0; // Προεπιλογή στο 0 αντί για undefined
        }

        total += price;
        membersWithAge++;

        console.log(`  👤 ${member.name} (${age}): ${price}€`);
    });

    console.log(`💰 Συνολικό κόστος: ${total}€ για ${membersWithAge} από τα ${state.familyMembers.length} άτομα`);

    // 🔴 ΕΝΗΜΕΡΩΣΗ: Αν δεν έχουμε κανένα μέλος με έγκυρη ηλικία, επέστρεψε 0
    if (membersWithAge === 0) {
        console.log('⚠️ Κανένα μέλος δεν έχει έγκυρη ηλικία! Επιστροφή 0€');
        return 0;
    }

    return total;
}

// ==================== CALCULATE SMART COMBOS ====================
export function calculateSmartCombos() {
    console.log('🧮 Έναρξη έξυπνου υπολογισμού combo...');

    // ΕΛΕΓΧΟΙ:
    if (!state.selectedActivities || state.selectedActivities.length === 0) {
        alert('⚠️ Δεν έχετε επιλέξει δραστηριότητες!\n\nΠαρακαλώ επιλέξτε πρώτα δραστηριότητες από τη λίστα.');
        return;
    }

    if (!state.familyMembers || state.familyMembers.length === 0) {
        alert('⚠️ Δεν έχετε ορίσει τα μέλη της οικογένειας!\n\nΠαρακαλώ ενημερώστε τις ηλικίες στο βήμα των Δραστηριοτήτων.');
        return;
    }

    if (!state.selectedDestination) {
        alert('⚠️ Δεν έχετε επιλέξει προορισμό!\n\nΠαρακαλώ επιλέξτε πρώτα προορισμό.');
        return;
    }

    console.log('📊 Δεδομένα για combo υπολογισμό:', {
        activities: state.selectedActivities.length,
        familyMembers: state.familyMembers.length,
        destination: state.selectedDestination
    });

    // ΔΗΜΙΟΥΡΓΙΑ LOADING STATE
    const activitiesList = document.getElementById('activities-list');
    if (activitiesList) {
        activitiesList.innerHTML += `
            <div id="combo-calculating" style="grid-column: 1/-1; text-align: center; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px; margin: 20px 0;">
                <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; margin: 0 auto 20px; animation: spin 1s linear infinite;"></div>
                <h3 style="margin: 0 0 10px 0; color: white;">🧮 Υπολογισμός Combos...</h3>
                <p style="margin: 0; opacity: 0.9;">
                    Αναζήτηση καλύτερων εκπτωτικών πακέτων για ${state.selectedActivities.length} δραστηριότητες
                </p>
            </div>
        `;
    }

    // ΚΛΗΣΗ ΤΗΣ ΠΡΑΓΜΑΤΙΚΗΣ ΣΥΝΑΡΤΗΣΗΣ ΑΠΟ ΤΟ combo-calculator.js
    // (Αυτή η κλήση γίνεται όταν το combo-calculator.js έχει φορτωθεί)
    setTimeout(() => {
        try {
            // Αν η συνάρτηση υπάρχει στο global scope
            if (typeof window.calculateSmartCombosReal === 'function') {
                console.log('🎯 Καλείται η πραγματική συνάρτηση combo...');
                window.calculateSmartCombosReal();
            } else {
                // Διαφορετικά, δείξε μήνυμα
                alert('ℹ️ Η λειτουργία combo υπολογισμού βρίσκεται υπό ανάπτυξη.\n\nΣύντομα θα ενσωματώσουμε έξυπνα πακέτα για: Disneyland, Merlin Pass, κλπ.');
                simulateComboCalculation();
            }
        } catch (error) {
            console.error('❌ Σφάλμα combo υπολογισμού:', error);
            alert('⚠️ Προσωρινό σφάλμα στον υπολογισμό combos.\n\nΠαρακαλώ δοκιμάστε ξανά ή επικοινωνήστε με την υποστήριξη.');
        }

        // Αφαίρεση loading
        const loadingDiv = document.getElementById('combo-calculating');
        if (loadingDiv) loadingDiv.remove();

    }, 1500);
}

// ΠΡΟΣΩΡΙΝΗ ΣΥΝΑΡΤΗΣΗ ΜΕΧΡΙ ΝΑ ΕΝΣΩΜΑΤΩΘΕΙ ΤΟ combo-calculator.js
export function simulateComboCalculation() {
    if (!state.selectedActivities || state.selectedActivities.length < 2) {
        alert('ℹ️ Χρειάζονται τουλάχιστον 2 επιλεγμένες δραστηριότητες για combo υπολογισμό.');
        return;
    }

    // Υπολογισμός τρέχοντος κόστους
    const currentCost = state.selectedActivities.reduce((sum, activity) => sum + (activity.price || 0), 0);

    // Προσομοίωση έκπτωσης
    let discount = 0;
    let comboName = '';

    if (state.selectedActivities.length >= 3) {
        discount = currentCost * 0.15; // 15% έκπτωση
        comboName = '🎁 Πακέτο 3+ Δραστηριοτήτων';
    } else if (state.selectedActivities.length === 2) {
        discount = currentCost * 0.10; // 10% έκπτωση
        comboName = '🤝 Διπλό Πακέτο';
    }

    const newCost = currentCost - discount;

    // Δημιουργία modal με τα αποτελέσματα
    const modalHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: 'Roboto', sans-serif;
        ">
            <div style="
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
                <h2 style="color: var(--primary); text-align: center; margin-top: 0;">
                    🧮 Αποτελέσματα Έξυπνου Combo
                </h2>

                <div style="background: #f0f7ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <h3 style="color: var(--dark); margin-top: 0;">${comboName}</h3>

                    <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 10px; background: white; border-radius: 8px;">
                        <span><strong>Κανονικό Κόστος:</strong></span>
                        <span style="color: var(--danger); text-decoration: line-through; font-weight: bold;">
                            ${currentCost.toFixed(2)}€
                        </span>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 10px; background: white; border-radius: 8px;">
                        <span><strong>Έκπτωση:</strong></span>
                        <span style="color: var(--success); font-weight: bold;">
                            -${discount.toFixed(2)}€
                        </span>
                    </div>

                    <div style="display: flex; justify-content: space-between; margin: 15px 0; padding: 15px; background: linear-gradient(135deg, var(--primary), #4F46E5); color: white; border-radius: 8px;">
                        <span><strong>Νέο Κόστος:</strong></span>
                        <span style="font-size: 24px; font-weight: bold;">
                            ${newCost.toFixed(2)}€
                        </span>
                    </div>
                </div>

                <div style="margin-top: 20px;">
                    <p style="color: var(--gray); font-size: 14px;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Συμβουλή:</strong> Για περισσότερες επιλογές combos, επιλέξτε δραστηριότητες από την ίδια εταιρεία ή πόλη.
                    </p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <button onclick="applyComboDiscount(${discount})" style="
                        padding: 12px 30px;
                        background: var(--primary);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-right: 10px;
                    ">
                        ✅ Εφαρμογή Έκπτωσης
                    </button>

                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        padding: 12px 30px;
                        background: var(--light);
                        color: var(--dark);
                        border: 1px solid var(--border);
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                    ">
                        Κλείσιμο
                    </button>
                </div>
            </div>
        </div>
    `;

    // Προσθήκη modal στο DOM
    const modalDiv = document.createElement('div');
    modalDiv.innerHTML = modalHTML;
    document.body.appendChild(modalDiv);
}

// ΣΥΝΑΡΤΗΣΗ ΓΙΑ ΕΦΑΡΜΟΓΗ ΕΚΠΤΩΣΗΣ
export function applyComboDiscount(discount) {
    console.log(`💰 Εφαρμογή έκπτωσης: ${discount}€`);

    // Ενημέρωση state
    state.selectedActivities.forEach(activity => {
        // Εφαρμογή αναλογικής έκπτωσης σε κάθε δραστηριότητα
        const originalPrice = activity.price || 0;
        const discountPercentage = discount / state.selectedActivities.reduce((sum, act) => sum + (act.price || 0), 0);
        activity.discountedPrice = originalPrice * (1 - discountPercentage);
    });

    // Ενημέρωση εμφάνισης
    updateActivitiesTotal();

    // Κλείσιμο modal
    document.querySelectorAll('[style*="position: fixed"][style*="background: rgba(0,0,0,0.8)"]').forEach(el => el.remove());

    // Εμφάνιση μηνύματος επιτυχίας
    showToast(`✅ Εφαρμόστηκε έκπτωση ${discount.toFixed(2)}€! Το νέο κόστος είναι ${calculateTotalSpent().toFixed(2)}€`, 'success');
}
