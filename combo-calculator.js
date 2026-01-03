// combo-calculator.js
// Υπολογισμός έξυπνων combos για δραστηριότητες

class ComboCalculator {
    constructor() {
        this.initialized = false;
        this.comboButton = null;
        this.currentStepObserver = null;
    }

    async init() {
        if (this.initialized) return;
        
        console.log("🎯 Combo Calculator Αρχικοποίηση...");
        
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
            display: none;
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
        
        // Προσθήκη στο DOM
        const step4Section = document.getElementById('step-activities');
        if (step4Section) {
            const totalOverallDiv = step4Section.querySelector('.total-overall');
            if (totalOverallDiv) {
                totalOverallDiv.parentNode.insertBefore(this.comboButton, totalOverallDiv.nextSibling);
            } else {
                step4Section.querySelector('h1').parentNode.insertBefore(this.comboButton, step4Section.querySelector('h1').nextSibling);
            }
        }
    }

    observeStepChanges() {
        // Παρακολούθηση αλλαγών βημάτων
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const targetSection = mutation.target;
                    if (targetSection.classList.contains('section')) {
                        this.handleStepChange(targetSection.id);
                    }
                }
            });
        });

        // Παρακολούθηση όλων των sections
        document.querySelectorAll('.section').forEach(section => {
            observer.observe(section, { attributes: true });
        });

        this.currentStepObserver = observer;
    }

    handleStepChange(stepId) {
        console.log(`🔄 Αλλαγή βήματος: ${stepId}`);
        
        if (stepId === 'step-activities') {
            // ΒΗΜΑ 4: Εμφάνιση κουμπιού
            if (this.comboButton) {
                this.comboButton.style.display = 'block';
                setTimeout(() => {
                    this.comboButton.style.opacity = '1';
                }, 100);
            }
            
            // Έλεγχος αν υπάρχουν δραστηριότητες
            this.checkActivitiesAvailability();
            
        } else {
            // ΟΛΑ ΤΑ ΑΛΛΑ ΒΗΜΑΤΑ: Απόκρυψη κουμπιού
            if (this.comboButton) {
                this.comboButton.style.opacity = '0';
                setTimeout(() => {
                    this.comboButton.style.display = 'none';
                }, 300);
            }
        }
    }

    checkActivitiesAvailability() {
        // Έλεγχος αν υπάρχουν δραστηριότητες για υπολογισμό
        const activitiesContainer = document.getElementById('activities-container');
        if (!activitiesContainer || activitiesContainer.children.length === 0) {
            if (this.comboButton) {
                this.comboButton.disabled = true;
                this.comboButton.style.opacity = '0.5';
                this.comboButton.title = 'Δεν υπάρχουν διαθέσιμες δραστηριότητες';
            }
        } else {
            if (this.comboButton) {
                this.comboButton.disabled = false;
                this.comboButton.style.opacity = '1';
                this.comboButton.title = '';
            }
        }
    }

    clearAutoSelections() {
        // ΚΑΘΑΡΙΣΜΟΣ αυτόματων επιλογών που μπορεί να υπάρχουν
        const autoSelectedCards = document.querySelectorAll('.activity-card[data-auto-selected="true"]');
        autoSelectedCards.forEach(card => {
            card.classList.remove('selected');
            card.removeAttribute('data-auto-selected');
            
            // Ενημέρωση του αντίστοιχου activity object
            const index = Array.from(card.parentNode.children).indexOf(card);
            if (window.currentCityActivities && window.currentCityActivities[index]) {
                window.currentCityActivities[index].selected = false;
            }
        });
    }

    // ==================== ΚΥΡΙΑ ΣΥΝΑΡΤΗΣΗ ΥΠΟΛΟΓΙΣΜΟΥ ====================
    async calculateSmartCombos() {
        console.log("🎯 Έναρξη έξυπνου υπολογισμού combos...");
        
        // 1. ΕΛΕΓΧΟΣ ΒΗΜΑΤΟΣ
        const currentStep = document.querySelector('.section.active');
        if (!currentStep || currentStep.id !== 'step-activities') {
            alert('⚠️ Η λειτουργία αυτή είναι διαθέσιμη μόνο στο Βήμα 4 (Δραστηριότητες)');
            return;
        }
        
        // 2. ΒΡΕΣ ΤΙΣ ΤΡΕΧΟΥΣΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ
        let currentActivities = window.currentCityActivities || [];
        
        if (!currentActivities || currentActivities.length === 0) {
            alert("⚠️ Δεν υπάρχουν διαθέσιμες δραστηριότητες.");
            return;
        }
        
        // 3. ΕΠΙΣΤΡΕΦΟΥΝ ΜΟΝΟ ΕΠΙΛΕΓΜΕΝΕΣ
        const selectedActivities = currentActivities.filter(act => act.selected === true);
        
        if (selectedActivities.length === 0) {
            const proceed = confirm("ℹ️ Δεν έχετε επιλέξει δραστηριότητες!\n\nΘέλετε να σας προτείνω έξυπνους συνδυασμούς;\n(Θα επιλέξω αυτόματα τις καλύτερες δραστηριότητες για εσάς)");
            
            if (!proceed) return;
            
            // ΑΥΤΟΜΑΤΗ ΕΠΙΛΟΓΗ ΚΑΛΥΤΕΡΩΝ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ
            const autoSelected = await this.autoSelectBestActivities(currentActivities);
            if (autoSelected.length === 0) {
                alert("❌ Δεν βρέθηκαν κατάλληλες δραστηριότητες για αυτόματη επιλογή.");
                return;
            }
            
            // Ενημέρωση της τρέχουσας κατάστασης
            selectedActivities.push(...autoSelected);
            this.updateActivitySelections(autoSelected);
        }
        
        console.log(`✅ Βρέθηκαν ${selectedActivities.length} επιλεγμένες δραστηριότητες`);
        
        // 4. ΥΠΟΛΟΓΙΣΜΟΣ ΣΥΝΟΛΙΚΟΥ ΚΟΣΤΟΥΣ
        const ageGroups = this.categorizeFamilyMembers();
        const totalRegularCost = this.calculateComboRegularCost(selectedActivities, ageGroups);
        
        // 5. ΑΝΑΖΗΤΗΣΗ COMBO ΒΑΣΕΙ ΠΟΛΗΣ
        let availableCombos = [];
        const cityName = window.selectedDestinationName || '';
        
        if (cityName.includes("Λονδίνο")) {
            availableCombos = this.findLondonCombos(selectedActivities, ageGroups);
        } else if (cityName.includes("Βιέννη")) {
            availableCombos = this.findViennaCombos(selectedActivities, ageGroups);
        } else if (cityName.includes("Βερολίνο")) {
            availableCombos = this.findBerlinCombos(selectedActivities, ageGroups);
        } else if (cityName.includes("Παρίσι")) {
            availableCombos = this.findParisCombos(selectedActivities, ageGroups);
        } else if (cityName.includes("Ρώμη")) {
            availableCombos = this.findRomeCombos(selectedActivities, ageGroups);
        } else {
            availableCombos = this.findGenericCombos(selectedActivities, ageGroups);
        }
        
        // 6. ΥΠΟΛΟΓΙΣΜΟΣ ΚΑΛΥΤΕΡΟΥ COMBO
        let bestCombo = null;
        let bestSaving = 0;
        
        availableCombos.forEach(combo => {
            if (combo.saving > bestSaving) {
                bestSaving = combo.saving;
                bestCombo = combo;
            }
        });
        
        // 7. ΥΠΟΛΟΓΙΣΜΟΣ ΤΕΛΙΚΟΥ ΚΟΣΤΟΥΣ
        let finalTotalCost = totalRegularCost;
        if (bestCombo && bestSaving > 0) {
            finalTotalCost = totalRegularCost - bestSaving;
        }
        
        // 8. ΕΜΦΑΝΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ
        const results = {
            totalRegularCost: totalRegularCost,
            bestCombo: bestCombo,
            bestSaving: bestSaving,
            finalTotalCost: finalTotalCost,
            allCombos: availableCombos,
            cityName: cityName,
            familySize: window.familyMembers?.length || 0
        };
        
        this.displayComboResults(results);
    }

    // ==================== ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ====================

    async autoSelectBestActivities(allActivities) {
        console.log("🤖 Αυτόματη επιλογή βέλτιστων δραστηριοτήτων...");
        
        const selected = [];
        const cityName = window.selectedDestinationName || '';
        
        // ΚΡΙΤΗΡΙΑ ΕΠΙΛΟΓΗΣ
        const selectionCriteria = {
            "Λονδίνο": ["London Eye", "Sea Life", "Madame Tussauds", "Tower of London"],
            "Βιέννη": ["Schönbrunn", "Sisi Museum", "Hofburg", "Prater"],
            "Βερολίνο": ["Berlin TV Tower", "Brandenburg Gate", "Reichstag", "Checkpoint Charlie"],
            "Παρίσι": ["Eiffel Tower", "Louvre", "Notre Dame", "Arc de Triomphe"],
            "Ρώμη": ["Colosseum", "Vatican", "Trevi Fountain", "Roman Forum"]
        };
        
        let targetActivities = selectionCriteria[cityName] || 
            allActivities.slice(0, Math.min(5, allActivities.length)).map(a => a.name);
        
        // ΕΠΙΛΟΓΗ ΜΕ ΒΑΣΗ ΤΑ ΚΡΙΤΗΡΙΑ
        targetActivities.forEach(targetName => {
            const activity = allActivities.find(a => 
                a.name.includes(targetName) || targetName.includes(a.name)
            );
            
            if (activity && !activity.selected && selected.length < 3) {
                activity.selected = true;
                selected.push(activity);
                
                // Ενημέρωση UI
                const index = allActivities.indexOf(activity);
                const card = document.getElementById(`activity-${index}`);
                if (card) {
                    card.classList.add('selected');
                    card.setAttribute('data-auto-selected', 'true');
                }
            }
        });
        
        // ΕΝΗΜΕΡΩΣΗ ΣΥΝΟΛΙΚΟΥ ΚΟΣΤΟΥΣ
        if (selected.length > 0 && typeof calculateAllCostsNew === 'function') {
            setTimeout(() => calculateAllCostsNew(), 100);
        }
        
        return selected;
    }

    updateActivitySelections(activities) {
        activities.forEach(activity => {
            if (window.currentCityActivities) {
                const index = window.currentCityActivities.findIndex(a => a.name === activity.name);
                if (index !== -1) {
                    window.currentCityActivities[index].selected = true;
                }
            }
        });
    }

    categorizeFamilyMembers() {
        const family = window.familyMembers || [];
        const categories = {
            "0-2": 0,
            "3-5": 0,
            "6-14": 0,
            "15-19": 0,
            "18+": 0
        };
        
        family.forEach(member => {
            const age = member.age || 0;
            if (age <= 2) categories["0-2"]++;
            else if (age <= 5) categories["3-5"]++;
            else if (age <= 14) categories["6-14"]++;
            else if (age <= 19) categories["15-19"]++;
            else categories["18+"]++;
        });
        
        return categories;
    }

    calculateComboRegularCost(activities, ageGroups) {
        let totalCost = 0;
        
        activities.forEach(activity => {
            let activityCost = 0;
            
            Object.keys(ageGroups).forEach(ageCategory => {
                const numberOfPeople = ageGroups[ageCategory];
                if (numberOfPeople > 0 && activity.prices) {
                    let price = 0;
                    
                    if (ageCategory === "0-2" && activity.prices["0-2"] !== undefined) {
                        price = activity.prices["0-2"];
                    } else if (ageCategory === "3-5" && activity.prices["3-5"] !== undefined) {
                        price = activity.prices["3-5"];
                    } else if (ageCategory === "6-14" && activity.prices["6-14"] !== undefined) {
                        price = activity.prices["6-14"];
                    } else if (ageCategory === "15-19" && activity.prices["15-19"] !== undefined) {
                        price = activity.prices["15-19"];
                    } else if (ageCategory === "18+" && activity.prices["18+"] !== undefined) {
                        price = activity.prices["18+"];
                    } else if (activity.prices["adult"] !== undefined) {
                        price = activity.prices["adult"];
                    } else if (activity.prices["0"] !== undefined) {
                        price = activity.prices["0"];
                    }
                    
                    activityCost += price * numberOfPeople;
                }
            });
            
            totalCost += activityCost;
        });
        
        return totalCost;
    }

    // ==================== ΣΥΝΑΡΤΗΣΕΙΣ ΕΥΡΕΣΗΣ COMBO ΑΝΑ ΠΟΛΗ ====================

    findLondonCombos(selectedActivities, ageGroups) {
        const combos = [];
        
        // MERLIN PASS COMBO
        const merlinAttractions = selectedActivities.filter(act => {
            const name = act.name.toLowerCase();
            return name.includes("sea life") || 
                   name.includes("london eye") || 
                   name.includes("madame tussauds") || 
                   name.includes("shrek") ||
                   name.includes("london dungeon");
        });
        
        if (merlinAttractions.length >= 2) {
            const normalCost = this.calculateComboRegularCost(merlinAttractions, ageGroups);
            const adultCount = ageGroups["18+"] || 0;
            const childCount = (ageGroups["6-14"] || 0) + (ageGroups["15-19"] || 0);
            
            const merlinPassAdultPrice = 79;
            const merlinPassChildPrice = 69;
            const comboCost = (adultCount * merlinPassAdultPrice) + (childCount * merlinPassChildPrice);
            
            if (normalCost > comboCost) {
                combos.push({
                    name: "🎡 Merlin Pass London",
                    description: `Πρόσβαση σε ${merlinAttractions.length} αξιοθέατα της Merlin`,
                    activities: merlinAttractions.map(a => a.name),
                    regularPrice: normalCost,
                    comboPrice: comboCost,
                    saving: normalCost - comboCost,
                    note: "🏆 Το καλύτερο combo για τουριστικά αξιοθέατα στο Λονδίνο"
                });
            }
        }
        
        // LONDON PASS
        const londonPassActivities = selectedActivities.filter(act => {
            const name = act.name.toLowerCase();
            return name.includes("tower of london") ||
                   name.includes("tower bridge") ||
                   name.includes("westminster abbey") ||
                   name.includes("st. paul");
        });
        
        if (londonPassActivities.length >= 3) {
            const normalCost = this.calculateComboRegularCost(londonPassActivities, ageGroups);
            const adultCount = ageGroups["18+"] || 0;
            const childCount = (ageGroups["6-14"] || 0) + (ageGroups["15-19"] || 0);
            
            const comboCost = (adultCount * 79) + (childCount * 55);
            
            if (normalCost > comboCost) {
                combos.push({
                    name: "🎫 London Pass (1 ημέρα)",
                    description: `Καλύπτει ${londonPassActivities.length} ιστορικά αξιοθέατα`,
                    activities: londonPassActivities.map(a => a.name),
                    regularPrice: normalCost,
                    comboPrice: comboCost,
                    saving: normalCost - comboCost,
                    note: "✅ Περιλαμβάνει δωρεάν μεταφορές και έκπτωσεις"
                });
            }
        }
        
        return combos;
    }

    findViennaCombos(selectedActivities, ageGroups) {
        const combos = [];
        
        // SISI PASS
        const imperialActivities = selectedActivities.filter(act => 
            act.name.includes("Schönbrunn") || 
            act.name.includes("Sisi") ||
            act.name.includes("Hofburg")
        );
        
        if (imperialActivities.length >= 2) {
            const normalCost = this.calculateComboRegularCost(imperialActivities, ageGroups);
            const passCost = 57 * (window.familyMembers?.length || 1);
            
            if (normalCost > passCost) {
                combos.push({
                    name: "👑 Sisi Pass Vienna",
                    description: "Πρόσβαση σε αυτοκρατορικά αξιοθέατα",
                    activities: imperialActivities.map(a => a.name),
                    regularPrice: normalCost,
                    comboPrice: passCost,
                    saving: normalCost - passCost,
                    note: "Schönbrunn + Sisi Museum + Furniture Museum"
                });
            }
        }
        
        // VIENNA PASS
        const viennaPassActivities = selectedActivities.filter(act => 
            act.name.includes("Palace") ||
            act.name.includes("Museum") ||
            act.name.includes("Prater") ||
            act.name.includes("Zoo")
        );
        
        if (viennaPassActivities.length >= 4) {
            const normalCost = this.calculateComboRegularCost(viennaPassActivities, ageGroups);
            const passCost = 75 * (window.familyMembers?.length || 1);
            
            if (normalCost > passCost) {
                combos.push({
                    name: "🏛️ Vienna Pass (1 ημέρα)",
                    description: `Πρόσβαση σε ${viennaPassActivities.length} αξιοθέατα`,
                    activities: viennaPassActivities.map(a => a.name),
                    regularPrice: normalCost,
                    comboPrice: passCost,
                    saving: normalCost - passCost,
                    note: "Απεριόριστες εισόδους για 1 ημέρα"
                });
            }
        }
        
        return combos;
    }

    findBerlinCombos(selectedActivities, ageGroups) {
        const combos = [];
        
        // BERLIN WELCOME CARD
        const berlinAttractions = selectedActivities.filter(act => 
            act.name.includes("Museum") ||
            act.name.includes("Fernsehturm") ||
            act.name.includes("Checkpoint") ||
            act.name.includes("Reichstag")
        );
        
        if (berlinAttractions.length >= 3) {
            const normalCost = this.calculateComboRegularCost(berlinAttractions, ageGroups);
            const cardCost = 29 * (window.familyMembers?.length || 1);
            
            if (normalCost > cardCost) {
                combos.push({
                    name: "🎫 Berlin WelcomeCard",
                    description: `Καλύπτει ${berlinAttractions.length} αξιοθέατα`,
                    activities: berlinAttractions.map(a => a.name),
                    regularPrice: normalCost,
                    comboPrice: cardCost,
                    saving: normalCost - cardCost,
                    note: "Περιλαμβάνει δωρεάν μεταφορές"
                });
            }
        }
        
        return combos;
    }

    findParisCombos(selectedActivities, ageGroups) {
        const combos = [];
        
        // PARIS PASS
        const parisAttractions = selectedActivities.filter(act => 
            act.name.includes("Louvre") ||
            act.name.includes("Eiffel") ||
            act.name.includes("Notre Dame") ||
            act.name.includes("Arc de Triomphe")
        );
        
        if (parisAttractions.length >= 3) {
            const normalCost = this.calculateComboRegularCost(parisAttractions, ageGroups);
            const passCost = 89 * (window.familyMembers?.length || 1);
            
            if (normalCost > passCost) {
                combos.push({
                    name: "🗼 Paris Pass",
                    description: `Πρόσβαση σε ${parisAttractions.length} αξιοθέατα`,
                    activities: parisAttractions.map(a => a.name),
                    regularPrice: normalCost,
                    comboPrice: passCost,
                    saving: normalCost - passCost,
                    note: "Περιλαμβάνει σκιπ τη λάιν και river cruise"
                });
            }
        }
        
        return combos;
    }

    findRomeCombos(selectedActivities, ageGroups) {
        const combos = [];
        
        // ROME PASS
        const romeAttractions = selectedActivities.filter(act => 
            act.name.includes("Colosseum") ||
            act.name.includes("Vatican") ||
            act.name.includes("Forum") ||
            act.name.includes("Pantheon")
        );
        
        if (romeAttractions.length >= 3) {
            const normalCost = this.calculateComboRegularCost(romeAttractions, ageGroups);
            const passCost = 52 * (window.familyMembers?.length || 1);
            
            if (normalCost > passCost) {
                combos.push({
                    name: "🏛️ Rome Tourist Card",
                    description: `Καλύπτει ${romeAttractions.length} αξιοθέατα`,
                    activities: romeAttractions.map(a => a.name),
                    regularPrice: normalCost,
                    comboPrice: passCost,
                    saving: normalCost - passCost,
                    note: "Σκιπ τη λάιν και δωρεάν μεταφορές"
                });
            }
        }
        
        return combos;
    }

    findGenericCombos(selectedActivities, ageGroups) {
        const combos = [];
        
        // GENERIC MUSEUM COMBO
        const museumActivities = selectedActivities.filter(act => 
            act.name.includes("Museum") || 
            act.name.includes("Μουσείο") ||
            act.name.includes("Gallery")
        );
        
        if (museumActivities.length >= 3) {
            const museumsForCombo = museumActivities.slice(0, 3);
            const normalCost = this.calculateComboRegularCost(museumsForCombo, ageGroups);
            const comboCost = Math.round(normalCost * 0.85);
            const saving = normalCost - comboCost;
            
            combos.push({
                name: "🏛️ Museum Combo (3 μουσεία)",
                description: `Εκπτωτικό πακέτο για 3 μουσεία`,
                activities: museumsForCombo.map(a => a.name),
                regularPrice: normalCost,
                comboPrice: comboCost,
                saving: saving,
                note: "15% έκπτωση για 3 μουσεία"
            });
        }
        
        // FAMILY COMBO (ZOOS + AQUARIUMS)
        const familyActivities = selectedActivities.filter(act => 
            act.name.includes("Zoo") || 
            act.name.includes("Ζωολογικός") ||
            act.name.includes("Aquarium") || 
            act.name.includes("Ενυδρείο") ||
            act.name.includes("Theme Park") ||
            act.name.includes("Πάρκο")
        );
        
        if (familyActivities.length >= 2) {
            const familyForCombo = familyActivities.slice(0, 2);
            const normalCost = this.calculateComboRegularCost(familyForCombo, ageGroups);
            const comboCost = Math.round(normalCost * 0.8);
            const saving = normalCost - comboCost;
            
            combos.push({
                name: "👨‍👩‍👧‍👦 Οικογενειακό Combo",
                description: "Εκπτωτικό πακέτο για οικογένειες",
                activities: familyForCombo.map(a => a.name),
                regularPrice: normalCost,
                comboPrice: comboCost,
                saving: saving,
                note: "20% έκπτωση για οικογενειακές δραστηριότητες"
            });
        }
        
        return combos;
    }

    // ==================== ΕΜΦΑΝΙΣΗ ΑΠΟΤΕΛΕΣΜΑΤΩΝ ====================

    displayComboResults(results) {
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
            animation: fadeIn 0.3s ease;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 20px;
            max-width: 800px;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 15px 40px rgba(0,0,0,0.4);
            transform: translateY(0);
            animation: slideUp 0.4s ease;
        `;
        
        let contentHTML = `
            <div style="text-align: center; position: relative;">
                <button onclick="comboCalculator.closeComboModal()" 
                        style="position: absolute; top: -10px; right: -10px; background: #f44336; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; font-size: 18px; z-index: 10001;">
                    ×
                </button>
                
                <h2 style="color: #9c27b0; margin-top: 0; margin-bottom: 20px;">
                    💰 Έξυπνος Υπολογισμός Combos
                </h2>
                
                <div style="background: linear-gradient(135deg, #f3e5f5, #e1bee7); padding: 15px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="color: #7b1fa2; margin: 0 0 10px 0;">
                        📊 Αποτελέσματα για ${results.cityName}
                    </h3>
                    <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 10px;">
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #666;">👨‍👩‍👧‍👦 Μέλη</div>
                            <div style="font-size: 24px; font-weight: bold; color: #4caf50;">${results.familySize}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #666;">🎯 Δραστηριότητες</div>
                            <div style="font-size: 24px; font-weight: bold; color: #2196f3;">${results.allCombos.reduce((acc, combo) => acc + combo.activities.length, 0)}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 14px; color: #666;">💰 Βρέθηκαν Combos</div>
                            <div style="font-size: 24px; font-weight: bold; color: #ff9800;">${results.allCombos.length}</div>
                        </div>
                    </div>
                </div>
        `;
        
        if (results.bestCombo && results.bestSaving > 0) {
            contentHTML += `
                <div style="background: #e8f5e8; padding: 20px; border-radius: 12px; border: 3px solid #4caf50; margin-bottom: 20px; position: relative;">
                    <div style="position: absolute; top: -12px; left: 20px; background: #4caf50; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                        🏆 ΚΑΛΥΤΕΡΗ ΕΠΙΛΟΓΗ
                    </div>
                    
                    <h3 style="color: #2e7d32; margin-top: 10px;">${results.bestCombo.name}</h3>
                    <p>${results.bestCombo.description}</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 10px; margin: 15px 0;">
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
                            <div style="font-size: 16px;">Κανονικό κόστος:</div>
                            <div style="font-size: 22px; color: #f44336; text-decoration: line-through;">${results.bestCombo.regularPrice.toFixed(2)}€</div>
                            
                            <div style="font-size: 16px;">Combo τιμή:</div>
                            <div style="font-size: 24px; color: #4caf50; font-weight: bold;">${results.bestCombo.comboPrice.toFixed(2)}€</div>
                            
                            <div style="font-size: 18px; font-weight: bold;">Εξοικονόμηση:</div>
                            <div style="font-size: 26px; color: #9c27b0; font-weight: bold;">${results.bestSaving.toFixed(2)}€</div>
                        </div>
                    </div>
                    
                    ${results.bestCombo.note ? `
                    <div style="background: #e3f2fd; padding: 10px; border-radius: 8px; margin-top: 10px;">
                        <strong>📝 Σημείωση:</strong> ${results.bestCombo.note}
                    </div>` : ''}
                    
                    <div style="margin-top: 15px;">
                        <button onclick="comboCalculator.applyCombo('${results.bestCombo.name}', ${results.bestSaving})"
                                style="width: 100%; padding: 15px; background: #9c27b0; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 18px; font-weight: bold; transition: all 0.3s;">
                            ✅ Εφαρμογή αυτού του Combo
                        </button>
                    </div>
                </div>
            `;
        }
        
        if (results.allCombos.length > 0) {
            contentHTML += `<h3 style="color: #3f51b5; border-bottom: 2px solid #3f51b5; padding-bottom: 10px;">🎯 Όλα τα Διαθέσιμα Combos:</h3>`;
            
            results.allCombos.forEach((combo, index) => {
                if (combo === results.bestCombo) return; // Skip the best combo (already shown)
                
                const bgColor = combo.saving > 0 ? '#f1f8e9' : '#fff3e0';
                const borderColor = combo.saving > 0 ? '#4caf50' : '#ff9800';
                
                contentHTML += `
                    <div style="background: ${bgColor}; padding: 15px; border-radius: 10px; border-left: 5px solid ${borderColor}; margin-bottom: 15px;">
                        <h4 style="margin: 0 0 8px 0; color: #3f51b5;">${combo.name}</h4>
                        <p style="margin: 0 0 10px 0; font-size: 0.95em;">${combo.description}</p>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
                            <div>
                                <div style="font-size: 0.9em; color: #666;">Κανονικό κόστος:</div>
                                <div style="font-size: 18px; color: #f44336; text-decoration: line-through;">${combo.regularPrice.toFixed(2)}€</div>
                            </div>
                            <div style="font-size: 24px; color: #666;">→</div>
                            <div>
                                <div style="font-size: 0.9em; color: #666;">Combo τιμή:</div>
                                <div style="font-size: 20px; color: #4caf50; font-weight: bold;">${combo.comboPrice.toFixed(2)}€</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: bold;">Εξοικονόμηση:</span>
                            <span style="color: ${combo.saving > 0 ? '#4caf50' : '#f44336'}; font-weight: bold; font-size: 18px;">
                                ${combo.saving > 0 ? '💰 ' : '⚠️ '}${combo.saving.toFixed(2)}€
                            </span>
                        </div>
                    </div>
                `;
            });
        } else {
            contentHTML += `
                <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border: 2px solid #ffc107; text-align: center;">
                    <h3 style="color: #856404; margin-top: 0;">ℹ️ Δεν βρέθηκαν διαθέσιμα combos</h3>
                    <p>Οι επιλεγμένες σας δραστηριότητες δεν έχουν διαθέσιμα οικονομικά combos.</p>
                    <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
                        💡 Συμβουλή: Προσθέστε περισσότερες δραστηριότητες ή επιλέξτε δημοφιλή αξιοθέατα της πόλης για καλύτερα εκπτωτικά πακέτα.
                    </p>
                </div>
            `;
        }
        
        contentHTML += `
            <div style="margin-top: 25px; padding-top: 20px; border-top: 2px dashed #ccc;">
                <div style="display: flex; justify-content: space-between; align-items: center; background: #e3f2fd; padding: 15px; border-radius: 10px;">
                    <div>
                        <div style="font-size: 16px; color: #1565c0;">Συνολικό κόστος χωρίς combos:</div>
                        <div style="font-size: 22px; font-weight: bold;">${results.totalRegularCost.toFixed(2)}€</div>
                    </div>
                    ${results.bestCombo ? `
                    <div style="text-align: right;">
                        <div style="font-size: 16px; color: #2e7d32;">Με καλύτερο combo:</div>
                        <div style="font-size: 26px; color: #4caf50; font-weight: bold;">${results.finalTotalCost.toFixed(2)}€</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div style="margin-top: 25px; display: flex; justify-content: center; gap: 15px;">
                <button onclick="comboCalculator.closeComboModal()"
                        style="padding: 12px 25px; background: #3eb489; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; min-width: 120px;">
                    Κλείσιμο
                </button>
                ${results.bestCombo ? `
                <button onclick="comboCalculator.applyCombo('${results.bestCombo.name}', ${results.bestSaving})"
                        style="padding: 12px 25px; background: #9c27b0; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold; min-width: 200px;">
                    💰 Εφαρμογή Combo
                </button>
                ` : ''}
            </div>
        `;
        
        modalContent.innerHTML = contentHTML;
        modal.appendChild(modalContent);
        
        // Προσθήκη CSS animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            #combo-calculator-modal button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
        `;
        modal.appendChild(style);
        
        document.body.appendChild(modal);
        
        // Κλείσιμο με ESC
        const closeOnEsc = (e) => {
            if (e.key === 'Escape') {
                this.closeComboModal();
            }
        };
        document.addEventListener('keydown', closeOnEsc);
        
        // Αποθήκευση για cleanup
        this.currentModal = modal;
        this.currentModalCloseHandler = closeOnEsc;
    }

    closeComboModal() {
        const modal = document.getElementById('combo-calculator-modal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => modal.remove(), 300);
        }
        
        if (this.currentModalCloseHandler) {
            document.removeEventListener('keydown', this.currentModalCloseHandler);
        }
        
        this.currentModal = null;
        this.currentModalCloseHandler = null;
    }

    applyCombo(comboName, savingAmount) {
        console.log(`✅ Εφαρμογή combo: ${comboName} (Εξοικονόμηση: ${savingAmount}€)`);
        
        // 1. Κλείσιμο modal
        this.closeComboModal();
        
        // 2. Ενημέρωση συνολικού κόστους
        const totalElement = document.getElementById('overall-total');
        if (!totalElement) {
            alert('⚠️ Δεν βρέθηκε το συνολικό κόστος');
            return;
        }
        
        // Πάρε το τρέχον κόστος
        const text = totalElement.textContent;
        const match = text.match(/(\d+\.?\d*)\s*€/);
        let currentTotal = match ? parseFloat(match[1]) : 0;
        
        // Υπολογισμός νέου κόστους
        const newTotal = Math.max(0, currentTotal - savingAmount);
        
        // 3. Ενημέρωση εμφάνισης
        totalElement.textContent = `Συνολικό Κόστος Επιλεγμένων Δραστηριοτήτων: ${newTotal.toFixed(2)} € (με ${comboName})`;
        totalElement.style.background = '#e8f5e8';
        totalElement.style.border = '3px solid #4caf50';
        
        // 4. Προσθήκη σημείωσης
        const existingNote = document.querySelector('.combo-applied-note');
        if (existingNote) existingNote.remove();
        
        const note = document.createElement('div');
        note.className = 'combo-applied-note';
        note.style.cssText = `
            max-width: 1000px;
            margin: 15px auto;
            padding: 12px;
            background: #e8f5e8;
            border-radius: 10px;
            border: 2px solid #4caf50;
            text-align: center;
            font-size: 16px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        `;
        note.innerHTML = `
            ✅ <strong>${comboName}</strong> εφαρμόστηκε με επιτυχία!<br>
            💰 <strong>Εξοικονόμηση:</strong> ${savingAmount.toFixed(2)} €<br>
            📊 <strong>Νέο σύνολο:</strong> ${newTotal.toFixed(2)} €
        `;
        
        totalElement.parentNode.insertBefore(note, totalElement.nextSibling);
        
        // 5. Μήνυμα επιβεβαίωσης
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
            successMsg.style.animation = 'slideOutRight 0.5s ease';
            setTimeout(() => successMsg.remove(), 500);
        }, 3000);
        
        // 6. Αποθήκευση
        localStorage.setItem('applied_combo', JSON.stringify({
            name: comboName,
            saving: savingAmount,
            date: new Date().toLocaleString('el-GR'),
            totalBefore: currentTotal,
            totalAfter: newTotal
        }));
        
        // 7. Ενημέρωση CSS animation
        const animationStyle = document.createElement('style');
        animationStyle.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(animationStyle);
    }

    // ==================== ΔΗΜΟΣΙΕΣ ΜΕΘΟΔΟΙ ====================

    getComboButton() {
        return this.comboButton;
    }

    isOnStep4() {
        const currentStep = document.querySelector('.section.active');
        return currentStep && currentStep.id === 'step-activities';
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

// Αυτόματη αρχικοποίηση όταν φορτώνει η σελίδα
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => comboCalculator.init(), 1000);
    });
} else {
    setTimeout(() => comboCalculator.init(), 1000);
}

// Κάνε το comboCalculator προσβάσιμο από το παράθυρο για debugging
window.comboCalculator = comboCalculator;

// Export για modules (αν χρησιμοποιείται ως module)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ComboCalculator, comboCalculator };
}
