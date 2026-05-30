// ==================== ΕΞΥΠΝΟΣ ΥΠΟΛΟΓΙΣΜΟΣ COMBO (ΝΕΟ - ΓΙΑ ΟΛΕΣ ΤΙΣ ΠΟΛΕΙΣ) ====================

function calculateSmartCombos() {
    console.log("🎯 Έναρξη έξυπνου υπολογισμού combos...");
// 🔴 ΠΡΟΣΘΗΚΗ ΑΥΤΗ:
    if (!state || !state.selectedDestination) {
        alert('⚠️ Δεν έχετε επιλέξει προορισμό!');
        return;
    }
    
    // 1. ΒΡΕΣ ΤΙΣ ΤΡΕΧΟΥΣΕΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ
    // Προσπάθησε πρώτα από το state, μετά από το window
    let currentActivities = [];
    
    if (typeof state !== 'undefined' && state.currentCityActivities) {
        currentActivities = state.currentCityActivities;
        console.log("📊 Βρήκα δραστηριότητες από state:", currentActivities.length);
    } else if (typeof window !== 'undefined' && window.currentCityActivities) {
        currentActivities = window.currentCityActivities;
        console.log("📊 Βρήκα δραστηριότητες από window:", currentActivities.length);
    } else {
        console.error("❌ Δεν βρέθηκαν δραστηριότητες!");
        alert("⚠️ Δεν υπάρχουν διαθέσιμες δραστηριότητες. Παρακαλώ φορτώστε πρώτα δραστηριότητες.");
        return;
    }
    
    if (!currentActivities || currentActivities.length === 0) {
        alert("⚠️ Δεν υπάρχουν διαθέσιμες δραστηριότητες.");
        return;
    }
    
    // 2. ΕΠΙΣΤΡΕΦΟΥΝ ΜΟΝΟ ΕΠΙΛΕΓΜΕΝΕΣ
    // Έλεγξε αν υπάρχουν επιλεγμένες στο state.selectedActivities
const selectedActivities = (state && state.selectedActivities && state.selectedActivities.length > 0) 
    ? state.selectedActivities.map(selected => currentActivities.find(a => a.id === selected.id)).filter(a => a)
    : currentActivities.filter(act => act.selected === true);
    if (selectedActivities.length === 0) {
        alert("⚠️ Δεν έχετε επιλέξει δραστηριότητες! Κάντε κλικ στις κάρτες.");
        return;
    }
    
    console.log(`✅ Βρέθηκαν ${selectedActivities.length} επιλεγμένες δραστηριότητες`);

    // 3. GET BASE TOTAL FROM STATE (same source as UI, with proper rounding)
    const baseTotal = state.selectedActivities
        .reduce((sum, activity) => sum + parseFloat((activity.price || 0).toFixed(2)), 0);

    console.log(`💰 baseTotal from state: ${baseTotal}€`);

    if (baseTotal <= 0) {
        alert("⚠️ Δεν υπάρχει έγκυρο συνολικό κόστος.");
        return;
    }

    const ageGroups = categorizeFamilyMembers();
    
    // 4. ΑΝΑΖΗΤΗΣΗ COMBO ΒΑΣΕΙ ΠΟΛΗΣ
    let availableCombos = [];
    
   if (state.selectedDestination.includes("Λονδίνο")) {
    availableCombos = findLondonCombos(selectedActivities, ageGroups);
} else if (state.selectedDestination.includes("Βιέννη")) {
    availableCombos = findViennaCombos(selectedActivities, ageGroups);
} else if (state.selectedDestination.includes("Βερολίνο")) {
    availableCombos = findBerlinCombos(selectedActivities, ageGroups);
} else if (state.selectedDestination.includes("Άμστερνταμ")) {
    availableCombos = findAmsterdamCombos(selectedActivities, ageGroups);
} else if (state.selectedDestination.includes("Μαδρίτη")) {
    availableCombos = findMadridCombos(selectedActivities, ageGroups);
} else if (state.selectedDestination.includes("Παρίσι")) {
    availableCombos = findParisCombos(selectedActivities, ageGroups);
} else if (state.selectedDestination.includes("Κωνσταντινούπολη")) {
    availableCombos = findIstanbulCombos(selectedActivities, ageGroups);
} else {
    availableCombos = findGenericCombos(selectedActivities, ageGroups);
}
    
    // 5. FILTER COMBOS: only keep where saving > 0 AND newTotal < baseTotal
    const validCombos = availableCombos.filter(combo => {
        const saving = combo.regularPrice - combo.comboPrice;
        const newTotal = baseTotal - combo.regularPrice + combo.comboPrice;
        return saving > 0 && newTotal < baseTotal;
    });

    // 6. FIND BEST COMBO
    let bestCombo = null;
    let bestSaving = 0;

    validCombos.forEach(combo => {
        const saving = combo.regularPrice - combo.comboPrice;
        if (saving > bestSaving) {
            bestSaving = saving;
            bestCombo = combo;
        }
    });

    // 7. CALCULATE FINAL TOTAL: newTotal = baseTotal - combo.regularPrice + combo.comboPrice
    let finalTotalCost = baseTotal;
    if (bestCombo && bestSaving > 0) {
        finalTotalCost = baseTotal - bestCombo.regularPrice + bestCombo.comboPrice;
    }

    // 8. DISPLAY RESULTS
    const results = {
        totalRegularCost: baseTotal,
        bestCombo: bestCombo,
        bestSaving: bestSaving,
        finalTotalCost: finalTotalCost,
        allCombos: validCombos
    };

    displayComboResults(results, baseTotal);
}

// ==================== ΒΟΗΘΗΤΙΚΕΣ ΣΥΝΑΡΤΗΣΕΙΣ COMBO ====================

function categorizeFamilyMembers() {
    console.log("👨‍👩‍👧‍👦 Κατηγοριοποίηση οικογένειας...");
    
    const categories = {
        "0-2": 0,
        "3-5": 0,
        "6-14": 0,
        "15-19": 0,
        "18+": 0
    };
   
    // ΧΡΗΣΗ state.familyMembers αντι για familyMembers
    const members = (typeof state !== 'undefined' && state.familyMembers) 
        ? state.familyMembers 
        : (window.familyMembers || []);
    
    if (!members || members.length === 0) {
        console.warn("⚠️ Δεν βρέθηκαν μέλη οικογένειας");
        return categories;
    }
    
    console.log("👪 Μέλη για κατηγοριοποίηση:", members);
    
    members.forEach(member => {
        if (member.age <= 2) {
            categories["0-2"]++;
        } else if (member.age <= 5) {
            categories["3-5"]++;
        } else if (member.age <= 14) {
            categories["6-14"]++;
        } else if (member.age <= 19) {
            categories["15-19"]++;
        } else {
            categories["18+"]++;
        }
    });
    
    console.log("📊 Κατηγορίες:", categories);
    return categories;
}

function calculateComboRegularCost(selectedActivities, ageGroups) {
    console.log("🧮 Υπολογισμός κανονικού κόστους για:", selectedActivities.length, "δραστηριότητες");
    
    let totalCost = 0;
    
    selectedActivities.forEach((activity) => {
        console.log(`   🔍 Δραστηριότητα: ${activity.name}`);
        
        let activityCost = 0;
        
        Object.keys(ageGroups).forEach(ageCategory => {
            const numberOfPeople = ageGroups[ageCategory];
            
            if (numberOfPeople > 0) {
                console.log(`       👥 ${ageCategory}: ${numberOfPeople} άτομα`);
                
                let price = 0;
                
                if (activity.prices) {
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
                    }
                }
                
                console.log(`       💵 Τιμή ανά άτομο: ${price}€`);
                activityCost += price * numberOfPeople;
            }
        });
        
        console.log(`   💰 Κόστος αυτής της δραστηριότητας: ${activityCost}€\n`);
        totalCost += activityCost;
    });
    
    console.log(`💰 ΣΥΝΟΛΙΚΟ ΚΑΝΟΝΙΚΟ ΚΟΣΤΟΣ (ΓΙΑ ΟΛΕΣ): ${totalCost}€`);
    return totalCost;
}

function findLondonCombos(selectedActivities, ageGroups) {
    console.log("🏴󠁧󠁢󠁥󠁮󠁧󠁿 Αναζήτηση combos για Λονδίνο");
    const combos = [];
    
    // 1. MERLIN PASS COMBO
    const merlinAttractions = selectedActivities.filter(act => {
        const name = act.name.toLowerCase();
        return name.includes("sea life") || 
               name.includes("london eye") || 
               name.includes("madame tussauds") || 
               name.includes("shrek") ||
               name.includes("london dungeon") ||
               name.includes("thorpe park");
    });
    
    if (merlinAttractions.length >= 2) {
        const normalCostForMerlin = calculateComboRegularCost(merlinAttractions, ageGroups);
        
        const adultCount = ageGroups["18+"] || 0;
        const childCount = (ageGroups["6-14"] || 0) + (ageGroups["15-19"] || 0);
        
        const merlinPassAdultPrice = 79;
        const merlinPassChildPrice = 69;
        
        const comboCostMerlin = (adultCount * merlinPassAdultPrice) + (childCount * merlinPassChildPrice);
        
        if (normalCostForMerlin > comboCostMerlin) {
            combos.push({
                name: "🎡 Merlin Pass London",
                description: `Πρόσβαση σε ${merlinAttractions.length} αξιοθέατα της Merlin`,
                activities: merlinAttractions.map(a => a.name),
                regularPrice: normalCostForMerlin,
                comboPrice: comboCostMerlin,
                saving: normalCostForMerlin - comboCostMerlin,
                note: `💰 Ενηλίκων: ${merlinPassAdultPrice}€ × ${adultCount} = ${adultCount * merlinPassAdultPrice}€ | Παιδιών: ${merlinPassChildPrice}€ × ${childCount} = ${childCount * merlinPassChildPrice}€`
            });
        }
    }
    
    // 2. LONDON PASS COMBO
    const londonPassActivities = selectedActivities.filter(act => {
        const name = act.name.toLowerCase();
        return name.includes("tower of london") ||
               name.includes("tower bridge") ||
               name.includes("westminster abbey") ||
               name.includes("st. paul") ||
               name.includes("kensington palace") ||
               name.includes("hampton court") ||
               name.includes("shakespeare") ||
               name.includes("thames cruise");
    });
    
    if (londonPassActivities.length >= 3) {
        const normalCostLondonPass = calculateComboRegularCost(londonPassActivities, ageGroups);
        
        const adultCount = ageGroups["18+"] || 0;
        const childCount = (ageGroups["6-14"] || 0) + (ageGroups["15-19"] || 0);
        
        const londonPass1DayAdult = 79;
        const londonPass1DayChild = 55;
        const londonPass2DayAdult = 109;
        const londonPass2DayChild = 79;
        
        const daysNeeded = Math.min(3, Math.ceil(londonPassActivities.length / 4));
        const is2Days = daysNeeded >= 2;
        
        const comboCostLondon = is2Days ? 
            (adultCount * londonPass2DayAdult) + (childCount * londonPass2DayChild) :
            (adultCount * londonPass1DayAdult) + (childCount * londonPass1DayChild);
        
        if (normalCostLondonPass > comboCostLondon) {
            combos.push({
                name: is2Days ? "🎫 London Pass (2 ημέρες)" : "🎫 London Pass (1 ημέρα)",
                description: `Καλύπτει ${londonPassActivities.length} αξιοθέατα`,
                activities: londonPassActivities.map(a => a.name),
                regularPrice: normalCostLondonPass,
                comboPrice: comboCostLondon,
                saving: normalCostLondonPass - comboCostLondon,
                note: `👥 ${adultCount} ενήλικες, ${childCount} παιδιά | ${is2Days ? '2' : '1'} ημέρες`
            });
        }
    }
    
    // 3. SEA LIFE + LONDON EYE COMBO
    const seaLife = selectedActivities.find(a => a.name.toLowerCase().includes("sea life"));
    const londonEye = selectedActivities.find(a => a.name.toLowerCase().includes("london eye"));
    
    if (seaLife && londonEye) {
        const normalCostPair = calculateComboRegularCost([seaLife, londonEye], ageGroups);
        
        const adultCount = ageGroups["18+"] || 0;
        const childCount = (ageGroups["6-14"] || 0) + (ageGroups["15-19"] || 0);
        
        const comboAdultPrice = 45;
        const comboChildPrice = 35;
        
        const comboCostPair = (adultCount * comboAdultPrice) + (childCount * comboChildPrice);
        
        if (normalCostPair > comboCostPair) {
            combos.push({
                name: "🌊 Sea Life + 🎡 London Eye Combo",
                description: "Ειδική τιμή για τα 2 δημοφιλή αξιοθέατα",
                activities: [seaLife.name, londonEye.name],
                regularPrice: normalCostPair,
                comboPrice: comboCostPair,
                saving: normalCostPair - comboCostPair,
                note: `📊 Combo: ${comboAdultPrice}€ ενήλικας, ${comboChildPrice}€ παιδί`
            });
        }
    }
    
    return combos;
}

function findViennaCombos(selectedActivities, ageGroups) {
    console.log("🇦🇹 Αναζήτηση combos για Βιέννη");
    const combos = [];

    // Note: Sisi Pass is a standalone pass (not a combo), so not included here

    // TIME TRAVEL VIENNA + SISI'S JOURNEY COMBO
    const timeTravel = selectedActivities.find(act =>
        act.name.toLowerCase().includes("time travel")
    );
    const sisiJourney = selectedActivities.find(act =>
        act.name.toLowerCase().includes("sisi") && act.name.toLowerCase().includes("journey")
    );

    if (timeTravel && sisiJourney) {
        const normalCost = calculateComboRegularCost([timeTravel, sisiJourney], ageGroups);

        // Combo pricing: 0-4 free, 5-14: 24€, 15+: 28€
        const toddlers = (ageGroups["0-2"] || 0) + (ageGroups["3-5"] || 0);
        const children = (ageGroups["6-14"] || 0);
        const teens = (ageGroups["15-19"] || 0);
        const adults = (ageGroups["18+"] || 0);

        const comboCost = (toddlers * 0) + (children * 24) + (teens * 28) + (adults * 28);

        if (normalCost > comboCost) {
            combos.push({
                name: "🎬 Time Travel Vienna + Sisi's Journey Combo",
                description: "Διπλό VR experience για την ιστορία της Βιέννης",
                activities: [timeTravel.name, sisiJourney.name],
                regularPrice: normalCost,
                comboPrice: comboCost,
                saving: normalCost - comboCost,
                note: "💰 Combo: 0-4 ετών δωρεάν, 5-14 ετών: 24€, 15+ ετών: 28€"
            });
        }
    }

    return combos;
}

function findBerlinCombos(selectedActivities, ageGroups) {
    console.log("🇩🇪 Αναζήτηση combos για Βερολίνο");
    const combos = [];

    // BERLIN WELCOME CARD
    const berlinAttractions = selectedActivities.filter(act =>
        act.name.includes("Museum") ||
        act.name.includes("Fernsehturm") ||
        act.name.includes("Checkpoint") ||
        act.name.includes("Reichstag")
    );

    if (berlinAttractions.length >= 3) {
        const normalCost = calculateComboRegularCost(berlinAttractions, ageGroups);
        const cardCost = 29;

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

function findAmsterdamCombos(selectedActivities, ageGroups) {
    console.log("🌷 Αναζήτηση combos για Άμστερνταμ");
    const combos = [];

    // Find specific activities
    const madameTussauds = selectedActivities.find(act =>
        act.name.toLowerCase().includes("madame tussauds")
    );
    const thisIsHolland = selectedActivities.find(act =>
        act.name.toLowerCase().includes("this is holland")
    );
    const canalCruise = selectedActivities.find(act =>
        act.name.toLowerCase().includes("canal cruise") &&
        !act.name.toLowerCase().includes("pancake")
    );
    const pancakeBoat = selectedActivities.find(act =>
        act.name.toLowerCase().includes("pancake")
    );

    // COMBO 1: Madame Tussauds + This is Holland
    if (madameTussauds && thisIsHolland) {
        const normalCost = calculateComboRegularCost([madameTussauds, thisIsHolland], ageGroups);

        // Combo pricing: 0-1 free, 2-14: 32€, 15+: 37€
        const infants = (ageGroups["0-2"] || 0);
        const children = (ageGroups["3-5"] || 0) + (ageGroups["6-14"] || 0);
        const teens = (ageGroups["15-19"] || 0);
        const adults = (ageGroups["18+"] || 0);

        const comboCost = (infants * 0) + (children * 32) + (teens * 37) + (adults * 37);

        if (normalCost > comboCost) {
            combos.push({
                name: "🎭 Madame Tussauds + This is Holland Combo",
                description: "Συνδυασμός κέρινων ομοιωμάτων και 5D πτήση",
                activities: [madameTussauds.name, thisIsHolland.name],
                regularPrice: normalCost,
                comboPrice: comboCost,
                saving: normalCost - comboCost,
                note: `💰 Combo: 0-1 ετών δωρεάν, 2-14 ετών: 32€, 15+ ετών: 37€`
            });
        }
    }

    // COMBO 2: Madame Tussauds + Canal Cruise
    if (madameTussauds && canalCruise) {
        const normalCost = calculateComboRegularCost([madameTussauds, canalCruise], ageGroups);

        // Combo pricing: 0-1 free, 2-14: 29.5€, 15+: 37€
        const infants = (ageGroups["0-2"] || 0);
        const children = (ageGroups["3-5"] || 0) + (ageGroups["6-14"] || 0);
        const teens = (ageGroups["15-19"] || 0);
        const adults = (ageGroups["18+"] || 0);

        const comboCost = (infants * 0) + (children * 29.5) + (teens * 37) + (adults * 37);

        if (normalCost > comboCost) {
            combos.push({
                name: "🎭 Madame Tussauds + Canal Cruise Combo",
                description: "Κέρινα ομοιώματα και κρουαζιέρα στα κανάλια",
                activities: [madameTussauds.name, canalCruise.name],
                regularPrice: normalCost,
                comboPrice: comboCost,
                saving: normalCost - comboCost,
                note: `💰 Combo: 0-1 ετών δωρεάν, 2-14 ετών: 29.5€, 15+ ετών: 37€`
            });
        }
    }

    // COMBO 3: This is Holland + Pancakes Cruise
    if (thisIsHolland && pancakeBoat) {
        const normalCost = calculateComboRegularCost([thisIsHolland, pancakeBoat], ageGroups);

        // Combo pricing: 4-12: 35.5€, 13+: 43.5€ (0-3 not allowed for This is Holland)
        const children = (ageGroups["3-5"] || 0) + (ageGroups["6-14"] || 0);
        const teens = (ageGroups["15-19"] || 0);
        const adults = (ageGroups["18+"] || 0);

        const comboCost = (children * 35.5) + (teens * 43.5) + (adults * 43.5);

        if (normalCost > comboCost && comboCost > 0) {
            combos.push({
                name: "🥞 This is Holland + Pancakes Cruise Combo",
                description: "5D πτήση και κρουαζιέρα με απεριόριστες τηγανίτες",
                activities: [thisIsHolland.name, pancakeBoat.name],
                regularPrice: normalCost,
                comboPrice: comboCost,
                saving: normalCost - comboCost,
                note: `💰 Combo: 4-12 ετών: 35.5€, 13+ ετών: 43.5€ (0-3 ετών δεν επιτρέπονται)`
            });
        }
    }

    return combos;
}

function findMadridCombos(selectedActivities, ageGroups) {
    console.log("🇪🇸 Αναζήτηση combos για Μαδρίτη");
    const combos = [];

    // ZOO + FAUNIA COMBO
    const zoo = selectedActivities.find(act =>
        act.name.toLowerCase().includes("zoo aquarium")
    );
    const faunia = selectedActivities.find(act =>
        act.name.toLowerCase().includes("faunia")
    );

    if (zoo && faunia) {
        const normalCost = calculateComboRegularCost([zoo, faunia], ageGroups);

        // Combo pricing: 0-2 free, 3+ all ages: 39.90€
        const infants = (ageGroups["0-2"] || 0);
        const children = (ageGroups["3-5"] || 0) + (ageGroups["6-14"] || 0);
        const teens = (ageGroups["15-19"] || 0);
        const adults = (ageGroups["18+"] || 0);

        const payingPeople = children + teens + adults;
        const comboCost = payingPeople * 39.90;

        if (normalCost > comboCost) {
            combos.push({
                name: "🦁 Zoo + Faunia Madrid Combo",
                description: "Συνδυασμός ζωολογικού κήπου και πάρκου οικοσυστημάτων",
                activities: [zoo.name, faunia.name],
                regularPrice: normalCost,
                comboPrice: comboCost,
                saving: normalCost - comboCost,
                note: "💰 Combo: 0-2 ετών δωρεάν, 3+ ετών: 39.90€ (ειδικοί κανόνες για παιδιά)"
            });
        }
    }

    return combos;
}

function findParisCombos(selectedActivities, ageGroups) {
    console.log("🇫🇷 Αναζήτηση combos για Παρίσι");
    const combos = [];

    // SAINTE-CHAPELLE + CONCIERGERIE COMBO
    const sainteChapelle = selectedActivities.find(act =>
        act.name.toLowerCase().includes("sainte-chapelle")
    );
    const conciergerie = selectedActivities.find(act =>
        act.name.toLowerCase().includes("conciergerie")
    );

    if (sainteChapelle && conciergerie) {
        const normalCost = calculateComboRegularCost([sainteChapelle, conciergerie], ageGroups);

        // Combo pricing: 0-17 free, 18-25 free (EU only - simplified to all), 18+: 23€
        // Note: We simplify and assume 18-25 free applies to all for consistency
        const children = (ageGroups["0-2"] || 0) + (ageGroups["3-5"] || 0) + (ageGroups["6-14"] || 0) + (ageGroups["15-19"] || 0);
        const adults = (ageGroups["18+"] || 0);

        const comboCost = (children * 0) + (adults * 23);

        if (normalCost > comboCost) {
            combos.push({
                name: "⛪ Sainte-Chapelle + Conciergerie Combo",
                description: "Γοτθικό αριστούργημα και ιστορική φυλακή της Επανάστασης",
                activities: [sainteChapelle.name, conciergerie.name],
                regularPrice: normalCost,
                comboPrice: comboCost,
                saving: normalCost - comboCost,
                note: "💰 Combo: 0-17 ετών δωρεάν, 18+ ετών: 23€ (18-25 ΕΕ κατοίκων δωρεάν)"
            });
        }
    }

    return combos;
}

function findIstanbulCombos(selectedActivities, ageGroups) {
    console.log("🇹🇷 Αναζήτηση combos για Κωνσταντινούπολη");
    const combos = [];

    // COMBO 1: HAGIA SOPHIA + TOPKAPI PALACE
    const hagiaSophia = selectedActivities.find(act =>
        act.name.includes("Αγία Σοφία") || act.name.toLowerCase().includes("hagia sophia")
    );
    const topkapi = selectedActivities.find(act =>
        act.name.includes("Τοπ Καπί") || act.name.toLowerCase().includes("topkapi")
    );

    if (hagiaSophia && topkapi) {
        const normalCost = calculateComboRegularCost([hagiaSophia, topkapi], ageGroups);
        const comboCost = 75; // Fixed combo price per person

        const totalPeople = (ageGroups["0-2"] || 0) + (ageGroups["3-5"] || 0) + (ageGroups["6-14"] || 0) + (ageGroups["15-19"] || 0) + (ageGroups["18+"] || 0);
        const totalComboCost = totalPeople * comboCost;

        if (normalCost > totalComboCost) {
            combos.push({
                name: "🕌 Αγία Σοφία + Τοπ Καπί Combo",
                description: "Συνδυαστικό εισιτήριο για τα 2 κύρια αξιοθέατα",
                activities: [hagiaSophia.name, topkapi.name],
                regularPrice: normalCost,
                comboPrice: totalComboCost,
                saving: normalCost - totalComboCost,
                note: "💰 Combo: 75€ ανά άτομο (εξοικονόμηση 15€)"
            });
        }
    }

    // COMBO 2: GALATA TOWER + BOSPHORUS CRUISE
    const galataTower = selectedActivities.find(act =>
        act.name.includes("Γαλατά") || act.name.toLowerCase().includes("galata")
    );
    const bosphorusCruise = selectedActivities.find(act =>
        act.name.includes("Βόσπορο") || act.name.toLowerCase().includes("bosphorus")
    );

    if (galataTower && bosphorusCruise) {
        const normalCost = calculateComboRegularCost([galataTower, bosphorusCruise], ageGroups);
        const comboCost = 65; // Fixed combo price per person

        const totalPeople = (ageGroups["0-2"] || 0) + (ageGroups["3-5"] || 0) + (ageGroups["6-14"] || 0) + (ageGroups["15-19"] || 0) + (ageGroups["18+"] || 0);
        const totalComboCost = totalPeople * comboCost;

        if (normalCost > totalComboCost) {
            combos.push({
                name: "🗼 Πύργος Γαλατά + Κρουαζιέρα Βόσπορου Combo",
                description: "Πανοραμική θέα και θαλάσσια διαδρομή",
                activities: [galataTower.name, bosphorusCruise.name],
                regularPrice: normalCost,
                comboPrice: totalComboCost,
                saving: normalCost - totalComboCost,
                note: "💰 Combo: 65€ ανά άτομο (εξοικονόμηση 15€)"
            });
        }
    }

    return combos;
}

function findGenericCombos(selectedActivities, ageGroups) {
    console.log("🌍 Αναζήτηση γενικών combos");
    const combos = [];
    
    // ΖΩΟΛΟΓΙΚΟΣ + ΕΝΥΔΡΕΙΟ COMBO
    const zooActivities = selectedActivities.filter(act => 
        act.name.includes("Zoo") || 
        act.name.includes("Ζωολογικός")
    );
    
    const aquariumActivities = selectedActivities.filter(act => 
        act.name.includes("Aquarium") || 
        act.name.includes("Ενυδρείο")
    );
    
    if (zooActivities.length > 0 && aquariumActivities.length > 0) {
        const zooForCombo = zooActivities[0];
        const aquariumForCombo = aquariumActivities[0];
        
        const normalCostForTheseTwo = calculateComboRegularCost([zooForCombo, aquariumForCombo], ageGroups);
        const comboCost = Math.round(normalCostForTheseTwo * 0.8);
        const saving = normalCostForTheseTwo - comboCost;
        
        combos.push({
            name: "🐯 Zoo + Aquarium Combo",
            description: "Συνδυασμός ζωολογικού κήπου και ενυδρείου",
            activities: [zooForCombo.name, aquariumForCombo.name],
            regularPrice: normalCostForTheseTwo,
            comboPrice: comboCost,
            saving: saving,
            note: "20% έκπτωση στο συνδυασμό"
        });
    }
    
    // ΜΟΥΣΕΙΑ COMBO
    const museumActivities = selectedActivities.filter(act => 
        act.name.includes("Museum") || 
        act.name.includes("Μουσείο")
    );
    
    if (museumActivities.length >= 3) {
        const museumsForCombo = museumActivities.slice(0, 3);
        const normalCostForTheseThree = calculateComboRegularCost(museumsForCombo, ageGroups);
        const comboCost = Math.round(normalCostForTheseThree * 0.85);
        const saving = normalCostForTheseThree - comboCost;
        
        combos.push({
            name: "🏛️ Museum Combo (3 μουσεία)",
            description: `Εκπτωτικό πακέτο για 3 μουσεία`,
            activities: museumsForCombo.map(a => a.name),
            regularPrice: normalCostForTheseThree,
            comboPrice: comboCost,
            saving: saving,
            note: "15% έκπτωση για 3 μουσεία"
        });
    }
    
    return combos;
}

function displayComboResults(results, regularCost) {
    closeComboModal();
    
    const modal = document.createElement('div');
    modal.id = 'combo-modal-main';
    modal.style.cssText = `
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
        font-family: 'Comic Neue', Arial, sans-serif;
    `;
   
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        max-width: 900px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    let finalTotalCost = regularCost;
    let bestComboApplied = false;
    
    if (results.bestCombo && results.bestSaving > 0) {
        finalTotalCost = regularCost - results.bestSaving;
        bestComboApplied = true;
    }
    
    let contentHTML = `
        <div style="text-align: center;">
            <h2 style="color: #9c27b0; margin-top: 0;">💰 Έξυπνος Υπολογισμός Combos</h2>
            
            <div style="background: #f3e5f5; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #7b1fa2;">📊 Κόστος ΧΩΡΙΣ Combos: <strong>${regularCost.toFixed(2)} €</strong></h3>
                <p style="color: #666;">🏙️ Πόλη: ${state.selectedDestination} | 👨‍👩‍👧‍👦 Μέλη: ${state.familyMembers.length}</p>
            </div>
    `;
    
    if (results.allCombos.length > 0) {
        if (results.bestSaving > 0 && results.bestCombo) {
            contentHTML += `
                <div style="background: #e8f5e8; padding: 20px; border-radius: 12px; border: 3px solid #4caf50; margin-bottom: 20px;">
                    <h3 style="color: #2e7d32;">🏆 ΚΑΛΥΤΕΡΗ ΕΠΙΛΟΓΗ</h3>
                    <h4>${results.bestCombo.name}</h4>
                    <p>${results.bestCombo.description}</p>
                    
                    <div style="background: #fff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                        <h4 style="color: #1565c0; margin-top: 0;">🧮 ΑΝΑΛΥΤΙΚΑ:</h4>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">Συνολικό κόστος όλων των δραστηριοτήτων</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${regularCost.toFixed(2)} €</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">Κόστος των ${results.bestCombo.activities.length} δραστηριοτήτων χωριστά</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${results.bestCombo.regularPrice.toFixed(2)} €</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">Combo τιμή για τις ίδιες ${results.bestCombo.activities.length}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #4caf50; font-weight: bold;">${results.bestCombo.comboPrice.toFixed(2)} €</td>
                            </tr>
                            <tr style="background: #f9f9f9;">
                                <td style="padding: 8px;"><strong>Εξοικονόμηση</strong></td>
                                <td style="padding: 8px; text-align: right; color: #4caf50; font-weight: bold;">-${results.bestSaving.toFixed(2)} €</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="display: flex; justify-content: space-around; margin: 20px 0; align-items: center;">
                        <div style="text-align: center;">
                            <div style="font-size: 24px; color: #f44336; text-decoration: line-through;">${regularCost.toFixed(2)}€</div>
                            <small>Χωρίς combo</small>
                        </div>
                        <div style="font-size: 30px; color: #666;">→</div>
                        <div style="text-align: center;">
                            <div style="font-size: 28px; color: #4caf50; font-weight: bold;">${finalTotalCost.toFixed(2)}€</div>
                            <small>Με combo</small>
                        </div>
                    </div>
                    
                    <div style="background: #4caf50; color: white; padding: 12px; border-radius: 8px; font-size: 22px; font-weight: bold; margin-top: 10px;">
                        💰 Εξοικονόμηση: ${results.bestSaving.toFixed(2)} €
                    </div>
                    
                    ${results.bestCombo.note ? `
                    <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; margin-top: 15px; font-size: 0.9em;">
                        📝 <strong>Λεπτομέρειες:</strong> ${results.bestCombo.note}
                    </div>` : ''}
                    
                    <div style="margin-top: 15px; font-size: 0.9em; color: #666;">
                        <strong>📋 Δραστηριότητες που καλύπτονται:</strong><br>
                        ${results.bestCombo.activities.map(act => `• ${act}`).join('<br>')}
                    </div>
                </div>
            `;
        }
        
        contentHTML += `<h3 style="color: #3f51b5;">🎯 Όλα τα Διαθέσιμα Combos:</h3>`;
        
        results.allCombos.forEach((combo, index) => {
            const saving = combo.regularPrice - combo.comboPrice;
            const borderColor = saving > 0 ? '#4caf50' : '#ff9800';
            const bgColor = saving > 0 ? '#f1f8e9' : '#fff3e0';
            // Formula: newTotal = baseTotal - combo.regularPrice + combo.comboPrice
            const totalWithThisCombo = regularCost - combo.regularPrice + combo.comboPrice;
            
            contentHTML += `
                <div style="background: ${bgColor}; padding: 15px; border-radius: 10px; border-left: 5px solid ${borderColor}; margin-bottom: 15px;">
                    <h4 style="margin-top: 0; color: #3f51b5;">${combo.name}</h4>
                    <p style="margin: 5px 0;">${combo.description}</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                        <div style="text-align: center; padding: 8px; background: white; border-radius: 6px;">
                            <div style="font-size: 0.9em; color: #666;">Κανονικό κόστος:</div>
                            <div style="font-size: 18px; color: #f44336; text-decoration: line-through;">${combo.regularPrice.toFixed(2)}€</div>
                        </div>
                        <div style="text-align: center; padding: 8px; background: white; border-radius: 6px;">
                            <div style="font-size: 0.9em; color: #666;">Combo τιμή:</div>
                            <div style="font-size: 18px; color: #4caf50; font-weight: bold;">${combo.comboPrice.toFixed(2)}€</div>
                        </div>
                    </div>
                    
                    <div style="background: ${saving > 0 ? '#e8f5e9' : '#ffebee'}; padding: 8px; border-radius: 6px; margin: 8px 0;">
                        <div style="display: flex; justify-content: space-between;">
                            <span><strong>Εξοικονόμηση:</strong></span>
                            <span style="color: ${saving > 0 ? '#4caf50' : '#f44336'}; font-weight: bold;">
                                ${saving > 0 ? '💰 ' : '⚠️ '}${saving.toFixed(2)}€
                            </span>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
                            <span>Νέο συνολικό κόστος:</span>
                            <span><strong>${totalWithThisCombo.toFixed(2)}€</strong></span>
                        </div>
                    </div>
                    
                    ${combo.note ? `<div style="font-size: 0.85em; color: #666; background: rgba(0,0,0,0.05); padding: 5px; border-radius: 4px; margin-top: 5px;">📝 ${combo.note}</div>` : ''}
                </div>
            `;
        });
    } else {
        contentHTML += `
            <div style="background: #fff3cd; padding: 20px; border-radius: 10px; border: 2px solid #ffc107;">
                <h3 style="color: #856404;">ℹ️ Δεν βρέθηκαν διαθέσιμα combos</h3>
                <p>Οι επιλεγμένες σας δραστηριότητες δεν έχουν διαθέσιμα οικονομικά combos.</p>
        `;
        
        if (state.selectedDestination.includes('Λονδίνο')) {
            contentHTML += `
                <p>💡 Συμβουλή: Για Λονδίνο, τα καλύτερα combos υπάρχουν για 2+ από:</p>
                <ul style="text-align: left; display: inline-block; margin: 10px 0;">
                    <li>Sea Life London Aquarium</li>
                    <li>London Eye</li>
                    <li>Madame Tussauds</li>
                    <li>Shrek's Adventure</li>
                    <li>Tower of London</li>
                    <li>London Dungeon</li>
                </ul>
            `;
        } else {
            contentHTML += `
                <p>💡 Γενική συμβουλή: Τα εκπτωτικά πακέτα συνήθως υπάρχουν για:</p>
                <ul style="text-align: left; display: inline-block; margin: 10px 0;">
                    <li>Πολλά μουσεία/αξιοθέατα της ίδιας εταιρείας</li>
                    <li>Ζωολογικός κήπος + Ενυδρείο</li>
                    <li>Θεματικά πάρκα της ίδιας ομάδας</li>
                    <li>Πακέτα πόλης</li>
                </ul>
            `;
        }
        
        contentHTML += `</div>`;
    }
    
    contentHTML += `
        <div style="margin-top: 20px; padding-top: 20px; border-top: 2px dashed #ccc;">
            <h4 style="color: #9c27b0;">📊 ΤΕΛΙΚΗ ΣΥΝΟΨΗ:</h4>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 10px;">
                <ul style="margin: 0; padding-left: 20px;">
                    <li>💰 <strong>Κανονικό κόστος (χωρίς combos):</strong> ${regularCost.toFixed(2)} €</li>
                    ${bestComboApplied ?
                        `<li>🏆 <strong>Με καλύτερο combo (${results.bestCombo?.name}):</strong> ${finalTotalCost.toFixed(2)} €</li>
                         <li>✅ <strong>Συνολική εξοικονόμηση:</strong> ${results.bestSaving.toFixed(2)} €</li>` :
                        `<li>ℹ️ <strong>Δεν βρέθηκε εξοικονόμηση</strong></li>`
                    }
                    <li>🎯 <strong>Βρέθηκαν:</strong> ${results.allCombos.length} combos</li>
                    <li>👨‍👩‍👧‍👦 <strong>Μέλη οικογένειας:</strong> ${state.familyMembers.length} άτομα</li>
                </ul>
            </div>
        </div>
       
        <div style="margin-top: 25px; display: flex; justify-content: center; gap: 15px;">
            <button onclick="closeComboModal()"
                style="padding: 12px 25px; background: #3eb489; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                Κλείσιμο
            </button>
            ${bestComboApplied ? `
            <button onclick="applyComboToTotal('${results.bestCombo?.name}', ${results.bestSaving})"
                    style="padding: 12px 25px; background: #9c27b0; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
                ✅ Εφαρμογή στο Συνολικό Κόστος
            </button>` : ''}
        </div>
    `;
    
    modalContent.innerHTML = contentHTML;
    modal.appendChild(modalContent);
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 24px;
        cursor: pointer;
        z-index: 10001;
    `;
    closeBtn.onclick = () => {
        modal.remove();
        closeBtn.remove();
    };
    
    document.body.appendChild(modal);
    document.body.appendChild(closeBtn);
}

function closeComboModal() {
    const modal = document.getElementById('combo-modal-main');
    if (modal) modal.remove();
    
    const closeBtn = document.querySelector('button[style*="position: absolute"][style*="top: 20px"]');
    if (closeBtn) closeBtn.remove();
}

function applyComboToTotal(comboName, savingAmount) {
    console.log(`✅ Εφαρμογή combo: ${comboName} (Εξοικονόμηση: ${savingAmount}€)`);
    
    closeComboModal();
    
    const totalElement = document.getElementById('overall-total');
    if (!totalElement) return;
    
    const text = totalElement.textContent;
    const match = text.match(/(\d+\.?\d*)\s*€/);
    let currentTotal = match ? parseFloat(match[1]) : 0;
    
    const newTotal = Math.max(0, currentTotal - savingAmount);
    
    totalElement.textContent = `Συνολικό Κόστος Επιλεγμένων Δραστηριοτήτων: ${newTotal.toFixed(2)} € (με ${comboName})`;
    
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
        ✅ <strong>${comboName}</strong> εφαρμόστηκε<br>
        💰 Εξοικονόμηση: <strong>${savingAmount.toFixed(2)} €</strong><br>
        📊 Νέο σύνολο: <strong>${newTotal.toFixed(2)} €</strong>
    `;
    
    totalElement.parentNode.insertBefore(note, totalElement.nextSibling);
    
    alert(`✅ Το combo "${comboName}" εφαρμόστηκε!\n💰 Εξοικονόμηση: ${savingAmount.toFixed(2)}€\n📊 Πριν: ${currentTotal.toFixed(2)}€ | Μετά: ${newTotal.toFixed(2)}€`);
    
    localStorage.setItem('applied_combo', JSON.stringify({
        name: comboName,
        saving: savingAmount,
        date: new Date().toLocaleString('el-GR')
    }));
}
