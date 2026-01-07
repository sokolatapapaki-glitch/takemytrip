// ==================== GEOGRAPHIC PLANNING HELPERS ====================
function translateCategory(cat) {
    const translations = {
        'attraction': 'Αξιοθέατα',
        'museum': 'Μουσεία',
        'landmark': 'Μνημεία',
        'theme_park': 'Πάρκα',
        'zoo': 'Ζωολογικός',
        'palace': 'Ανάκτορα',
        'church': 'Εκκλησίες',
        'garden': 'Πάρκα/Κήποι',
        'science': 'Επιστήμη'
    };
    return translations[cat] || cat;
}

function getActivityIcon(category) {
    const icons = {
        'museum': 'fa-university',
        'science': 'fa-flask',
        'art': 'fa-palette',
        'history': 'fa-landmark',
        'theme_park': 'fa-ferris-wheel',
        'zoo': 'fa-paw',
        'garden': 'fa-tree',
        'attraction': 'fa-star'
    };
    return icons[category] || 'fa-map-marker-alt';
}

// ==================== ΥΠΟΛΟΓΙΣΜΟΣ ΑΠΟΣΤΑΣΗΣ ====================
function calculateDistance(point1, point2) {
    const R = 6371; // Ακτίνα Γης σε km
    
    const lat1 = point1[0] * Math.PI / 180;
    const lat2 = point2[0] * Math.PI / 180;
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Απόσταση σε km
}

// ==================== PROGRAM DAYS UPDATE (FIXED) ====================
function updateProgramDays() {
    const daysSelect = document.getElementById('program-days');
    if (!daysSelect) return;
    
    const selectedValue = daysSelect.value;
    
    if (!selectedValue || selectedValue === '0') {
        alert('⚠️ Παρακαλώ επιλέξτε αριθμό ημερών από το dropdown');
        return;
    }
    
    const selectedDays = parseInt(selectedValue);
    
    if (selectedDays > 0) {
        state.selectedDays = selectedDays;
        
        const daysDisplay = document.getElementById('days-display');
        if (daysDisplay) {
            daysDisplay.textContent = '✅ ' + selectedDays + ' μέρες επιλέχθηκαν';
            daysDisplay.style.color = 'var(--success)';
        }
        
        saveState();
        
        // 🚨 ΑΦΑΙΡΕΣΑ ΤΗΝ ΚΛΗΣΗ: generateGeographicProgram();
        // Τώρα η generateGeographicProgram() θα καλείται ΜΟΝΟ όταν ο χρήστης πατήσει "ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ"
        
        console.log(`📅 Ενημέρωση ημερών σε: ${selectedDays}`);
        
        showToast(`📅 Οι ημέρες ενημερώθηκαν σε ${selectedDays}. Πατήστε "Δημιουργία Προγράμματος"`, 'success');
    }
}

// ==================== GROUP ACTIVITIES BY PROXIMITY ====================
function groupActivitiesByProximity(activities, maxDistanceKm = 2) {
    console.log(`📍 Ομαδοποίηση ${activities.length} δραστηριοτήτων (έως ${maxDistanceKm} km)`);
    
    if (!activities || activities.length === 0) {
        console.log('⚠️ Δεν υπάρχουν δραστηριότητες για ομαδοποίηση');
        return [];
    }
    
    const groups = [];
    const processed = new Set();
    
    // Φίλτραρε μόνο δραστηριότητες με location
    const activitiesWithLocation = activities.filter(activity => 
        activity && activity.location && 
        activity.location.lat && activity.location.lng
    );
    
    console.log(`📊 ${activitiesWithLocation.length} από ${activities.length} έχουν τοποθεσία`);
    
    activitiesWithLocation.forEach((activity, index) => {
        if (processed.has(index)) return;
        
        const group = [activity];
        processed.add(index);
        
        // Βρες όλες τις κοντινές δραστηριότητες
        activitiesWithLocation.forEach((otherActivity, otherIndex) => {
            if (processed.has(otherIndex) || index === otherIndex) return;
            
            const distance = calculateDistance(
                [activity.location.lat, activity.location.lng],
                [otherActivity.location.lat, otherActivity.location.lng]
            );
            
            if (distance <= maxDistanceKm) {
                group.push(otherActivity);
                processed.add(otherIndex);
                console.log(`   🔗 ${activity.name} ↔ ${otherActivity.name}: ${distance.toFixed(2)} km`);
            }
        });
        
        if (group.length > 0) {
            groups.push({
                center: calculateGroupCenter(group),
                activities: group,
                count: group.length,
                radius: maxDistanceKm
            });
        }
    });
    
    // Προσθήκη μονών δραστηριοτήτων (χωρίς γειτονιές)
    activitiesWithLocation.forEach((activity, index) => {
        if (!processed.has(index)) {
            groups.push({
                center: [activity.location.lat, activity.location.lng],
                activities: [activity],
                count: 1,
                radius: 0
            });
        }
    });
    
    console.log(`✅ Δημιουργήθηκαν ${groups.length} ομάδες`);
    
    // Ταξινόμηση ομάδων (μεγαλύτερες πρώτες)
    groups.sort((a, b) => b.count - a.count);
    
    return groups;
}

// Βοηθητική συνάρτηση για υπολογισμό κέντρου ομάδας
function calculateGroupCenter(activities) {
    if (!activities || activities.length === 0) return null;
    
    if (activities.length === 1) {
        return [activities[0].location.lat, activities[0].location.lng];
    }
    
    let totalLat = 0;
    let totalLng = 0;
    
    activities.forEach(activity => {
        totalLat += activity.location.lat;
        totalLng += activity.location.lng;
    });
    
    return [totalLat / activities.length, totalLng / activities.length];
}

// Βοηθητική για χρώματα ομάδων
function getGroupColor(index) {
    const colors = [
        '#4F46E5', // Indigo
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#14B8A6', // Teal
        '#F97316'  // Orange
    ];
    return colors[index % colors.length];
}

// ==================== DISTRIBUTE GROUPS TO DAYS ====================
function distributeGroupsToDays(groups, totalDays) {
    console.log(`📅 Κατανομή ${groups.length} ομάδων σε ${totalDays} μέρες`);
    
    if (groups.length === 0 || totalDays < 1) {
        console.error('❌ Μη έγκυρα δεδομένα για κατανομή');
        return [];
    }
    
    const days = Array.from({ length: totalDays }, () => ({ 
        groups: [], 
        totalActivities: 0,
        totalCost: 0,
        estimatedTime: 0
    }));
    
    // 1. Ταξινόμηση ομάδων (μεγαλύτερες πρώτες)
    const sortedGroups = [...groups].sort((a, b) => b.count - a.count);
    
    console.log(`📊 Ομαδοποιήσεις για κατανομή:`, sortedGroups.map((g, i) => `Ομάδα ${i+1}: ${g.count} δραστηριότητες`));
    
    // 2. ΕΞΥΠΝΗ ΚΑΤΑΝΟΜΗ ΜΕ ΒΑΣΗ ΜΕΓΕΘΟΣ CLUSTER
    console.log('🎯 Νέα λογική: 1-4=1μέρα, 5-7=2μέρες, 8+=3μέρες');
    
    sortedGroups.forEach((group) => {
        const activitiesCount = group.activities.length;
        
        // 🔴 ΚΑΝΟΝΕΣ ΧΩΡΙΣΜΟΥ CLUSTER
        let neededDays = 1;
        if (activitiesCount >= 8) neededDays = 3;
        else if (activitiesCount >= 5) neededDays = 2;
        // αλλιώς neededDays = 1 (προεπιλογή)
        
        console.log(`   📦 Cluster "${group.activities[0]?.name?.substring(0, 20) || 'Ομάδα'}" (${activitiesCount} δραστ.): Χρειάζεται ${neededDays} μέρες`);
        
        // Αν χρειάζεται μόνο 1 μέρα, βάλ'το στην πιο άδεια μέρα
        if (neededDays === 1) {
            const emptiestDayIndex = days.reduce((minIndex, day, index) => 
                day.totalActivities < days[minIndex].totalActivities ? index : minIndex, 0
            );
            
            days[emptiestDayIndex].groups.push(group);
            days[emptiestDayIndex].totalActivities += activitiesCount;
            updateDayStats(days[emptiestDayIndex], group);
            
            console.log(`     → Μία μέρα: Μέρα ${emptiestDayIndex + 1}`);
        } 
        // Αν χρειάζεται >1 μέρες, χώρισέ το
        else {
            // Βρες τις neededDays πιο άδειες μέρες
            const sortedDayIndices = days.map((day, index) => ({ index, total: day.totalActivities }))
                                         .sort((a, b) => a.total - b.total)
                                         .slice(0, neededDays)
                                         .map(d => d.index);
            
            // Χώρισε τις δραστηριότητες αναλογικά
            const activitiesPerDay = Math.ceil(activitiesCount / neededDays);
            
            sortedDayIndices.forEach((dayIndex, dayOffset) => {
                const startIdx = dayOffset * activitiesPerDay;
                const endIdx = Math.min(startIdx + activitiesPerDay, activitiesCount);
                const sliceActivities = group.activities.slice(startIdx, endIdx);
                
                if (sliceActivities.length > 0) {
                    const subGroup = {
                        ...group,
                        activities: sliceActivities,
                        count: sliceActivities.length
                    };
                    
                    days[dayIndex].groups.push(subGroup);
                    days[dayIndex].totalActivities += sliceActivities.length;
                    updateDayStats(days[dayIndex], subGroup);
                    
                    console.log(`     → Μέρα ${dayIndex + 1}: ${sliceActivities.length} δραστηριότητες`);
                }
            });
        }
    });
    
    // Βοηθητική συνάρτηση για ενημέρωση στατιστικών
    function updateDayStats(day, group) {
        const groupCost = group.activities.reduce((sum, activity) => {
            return sum + (parseFloat(activity.price) || 0);
        }, 0);
        
        const groupTime = group.activities.reduce((sum, activity) => {
            return sum + (parseFloat(activity.duration_hours) || 1.5);
        }, 0);
        
        const travelTime = group.activities.length > 1 ? (group.activities.length - 1) * 0.5 : 0;
        
        day.totalCost += groupCost;
        day.estimatedTime += groupTime + travelTime;
    }
    
    // 3. Στρογγυλοποίηση χρόνων
    days.forEach(day => {
        day.estimatedTime = Math.ceil(day.estimatedTime);
    });
    
    // 4. Αφαίρεση κενών ημερών (αν υπάρχουν λιγότερες ομάδες από μέρες)
    const nonEmptyDays = days.filter(day => day.totalActivities > 0);
    
    console.log(`✅ Κατανεμήθηκαν ${sortedGroups.length} ομάδες:`, 
        nonEmptyDays.map((d, i) => `Μ${i+1}:${d.totalActivities}δραστ.`).join(', '));
    
    return nonEmptyDays;
}

function getDayColor(dayNumber) {
    const colors = [
        '#4F46E5', // Indigo
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#EF4444', // Red
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#14B8A6', // Teal
        '#F97316'  // Orange
    ];
    return colors[(dayNumber - 1) % colors.length];
}
