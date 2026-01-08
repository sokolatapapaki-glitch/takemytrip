// ==================== STEP 5: SUMMARY ====================
function getSummaryStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-route"></i> Γεωγραφικός Προγραμματισμός</h1>
            <p class="card-subtitle">${state.selectedDestination ? 'Ομαδοποίηση δραστηριοτήτων με βάση την τοποθεσία' : 'Δεν έχετε επιλέξει προορισμό'}</p>
            
            ${!state.selectedDestination ? `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Δεν έχετε επιλέξει προορισμό. Παρακαλώ επιστρέψτε στο βήμα 1.
                </div>
            ` : `
                <!-- Trip Overview -->
                <div class="grid grid-3" style="margin-bottom: 30px;">
                    <div class="card" style="text-align: center;">
                        <h3><i class="fas fa-map-marker-alt"></i> Προορισμός</h3>
                        <h2 style="color: var(--primary); margin: 10px 0;">${state.selectedDestination}</h2>
                    </div>
                    
                    <div class="card" style="text-align: center;">
                        <h3><i class="fas fa-calendar-alt"></i> Διάρκεια</h3>
                        <h2 style="color: var(--primary); margin: 10px 0;">${state.selectedDays || '?'} Μέρες</h2>
                        <p style="font-size: 14px; color: var(--gray); margin-top: 5px;">
                            Εσείς επιλέξατε
                        </p>
                    </div>
                    
                    <div class="card" style="text-align: center;">
                        <h3><i class="fas fa-users"></i> Οικογένεια</h3>
                        <h2 style="color: var(--primary); margin: 10px 0;">${state.familyMembers.length} Άτομα</h2>
                    </div>
                </div>
                
                <!-- Επιλογή Ημερών από τον Χρήστη -->
                <div class="card" style="margin: 30px 0; background: #f0f7ff; border-left: 4px solid var(--primary);">
                    <h3><i class="fas fa-calendar-alt"></i> Διάρκεια Ταξιδιού</h3>
                    <p style="color: var(--gray); margin-bottom: 15px;">
                        Επιλέξτε πόσες μέρες θα διαρκέσει το ταξίδι σας.
                    </p>
                    
                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <!-- 🔴 ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΚΡΙΤΙΚΟ ΣΤΟΙΧΕΙΟ ΠΟΥ ΛΕΙΠΕΙ -->
                        <select class="form-control" id="program-days" style="width: 200px; font-size: 16px; padding: 12px;">
                            <option value="0" ${state.selectedDays === 0 ? 'selected disabled' : 'disabled'}>-- Επιλέξτε μέρες --</option>
                            <option value="2" ${state.selectedDays === 2 ? 'selected' : ''}>2 μέρες</option>
                            <option value="3" ${state.selectedDays === 3 ? 'selected' : ''}>3 μέρες</option>
                            <option value="4" ${state.selectedDays === 4 ? 'selected' : ''}>4 μέρες</option>
                            <option value="5" ${state.selectedDays === 5 ? 'selected' : ''}>5 μέρες</option>
                            <option value="7" ${state.selectedDays === 7 ? 'selected' : ''}>7 μέρες</option>
                            <option value="10" ${state.selectedDays === 10 ? 'selected' : ''}>10 μέρες</option>
                            <option value="14" ${state.selectedDays === 14 ? 'selected' : ''}>14 μέρες</option>
                        </select>
                        
                       <button class="btn btn-primary" onclick="updateProgramDaysAndGenerate()">
    <i class="fas fa-sync-alt"></i> Ενημέρωση & Δημιουργία Προγράμματος
</button>
                        
                        <span id="days-display" style="color: var(--success); font-weight: bold; font-size: 16px;">
                            ${state.selectedDays > 0 ? '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν' : '⚠️ Δεν έχετε επιλέξει ακόμα'}
                        </span>
                    </div>
                </div>
                
                <!-- Selected Activities -->
                <div class="card" id="selected-activities-section">
                    <h3><i class="fas fa-star"></i> Επιλεγμένες Δραστηριότητες (${state.selectedActivities.length})</h3>
                    
                    ${state.selectedActivities.length === 0 ? `
                        <div style="text-align: center; padding: 40px; color: var(--gray);">
                            <i class="fas fa-info-circle fa-2x" style="margin-bottom: 15px;"></i>
                            <p>Δεν έχετε επιλέξει δραστηριότητες ακόμα</p>
                            <button onclick="showStep('activities')" class="btn btn-primary" style="margin-top: 15px;">
                                <i class="fas fa-arrow-left"></i> Επιστροφή στις Δραστηριότητες
                            </button>
                        </div>
                    ` : `
                        <div style="margin-top: 20px;">
                            <!-- 🔴 ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΚΟΥΜΠΙ ΠΟΥ ΔΕΝ ΔΟΥΛΕΥΕΙ -->
                            <button class="btn btn-primary" onclick="generateGeographicProgram()" 
                                    style="width: 100%; padding: 15px; font-size: 18px; margin-bottom: 20px;">
                                <i class="fas fa-map-marked-alt"></i> ΔΗΜΙΟΥΡΓΙΑ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ
                            </button>
                                                       
                            <p style="text-align: center; color: var(--gray); font-size: 14px; margin-bottom: 20px;">
                                <i class="fas fa-info-circle"></i> Πατήστε το κουμπί για δημιουργία βελτιστοποιημένου προγράμματος
                            </p>
                        </div>
                        
                        <!-- Συνολικό Κόστος -->
                        <div style="padding: 15px; background: linear-gradient(135deg, var(--primary), #4F46E5); color: white; border-radius: 8px; text-align: center; margin-top: 20px;">
                            <h4 style="color: white; margin-bottom: 5px;">
                                <i class="fas fa-money-bill-wave"></i> Συνολικό Κόστος
                            </h4>
                            <h2 style="font-size: 36px; margin: 0;">${calculateTotalSpent()}€</h2>
                            <p style="opacity: 0.9; margin: 5px 0 0 0;">
                                Για ${state.familyMembers.length} άτομα
                            </p>
                        </div>
                    `}
                </div>
                
                <!-- Geographic Program -->          
                <div class="card" id="geographic-program-section" style="margin-top: 30px;">
                    <h3><i class="fas fa-route"></i> Γεωγραφικό Πρόγραμμα</h3>
                    
                    <!-- 🔴 ΕΔΩ ΘΑ ΕΜΦΑΝΙΖΕΤΑΙ ΤΟ ΔΗΜΙΟΥΡΓΗΜΕΝΟ ΠΡΟΓΡΑΜΜΑ -->
                    <div id="geographic-program" 
                         style="min-height: 150px; padding: 20px; border-radius: 15px; background: #f0f7ff; border: 2px dashed var(--primary-light); text-align: center;">
                        
                        ${state.selectedActivities.length === 0 ? `
                            <div style="padding: 40px 20px;">
                                <div style="font-size: 64px; margin-bottom: 20px; color: var(--primary-light);">🗺️</div>
                                <h4 style="color: var(--dark); margin-bottom: 10px;">Δεν υπάρχουν δραστηριότητες</h4>
                                <p style="color: var(--gray); margin-bottom: 20px;">
                                    Επιλέξτε δραστηριότητες για να δημιουργηθεί το γεωγραφικό πρόγραμμα
                                </p>
                            </div>
                        ` : state.selectedDays === 0 ? `
                            <div style="padding: 40px 20px;">
                                <div style="font-size: 64px; margin-bottom: 20px; color: #F59E0B;">📅</div>
                                <h4 style="color: var(--dark); margin-bottom: 10px;">Παρακαλώ επιλέξτε ημέρες</h4>
                                <p style="color: var(--gray); margin-bottom: 20px;">
                                    Επιλέξτε πρώτα πόσες μέρες θα διαρκέσει το ταξίδι σας
                                </p>
                            </div>
                        ` : `
                            <div style="padding: 30px 20px;">
                                <div style="font-size: 48px; margin-bottom: 15px; color: var(--primary);">📍</div>
                                <h4 style="color: var(--dark); margin-bottom: 10px;">Έτοιμο για Προγραμματισμό!</h4>
                                <p style="color: var(--gray); margin-bottom: 20px;">
                                    Πατήστε "ΔΗΜΙΟΥΡΓΙΑ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ"<br>
                                    για να ομαδοποιήσουμε τις ${state.selectedActivities.length} δραστηριότητες<br>
                                    σε ${state.selectedDays} μέρες με βάση την τοποθεσία τους
                                </p>
                                <button onclick="generateGeographicProgram()" class="btn btn-primary" style="padding: 15px 40px; font-size: 18px;">
                                    <i class="fas fa-map-marked-alt"></i> ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ
                                </button>
                            </div>
                        `}
                    </div>
                </div>
                
                <!-- ΚΟΥΜΠΙΑ -->
                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn btn-primary" onclick="showStep('map')" style="margin-right: 10px;">
                        <i class="fas fa-map-marked-alt"></i> Συνέχεια στον Χάρτη
                    </button>
                    <button class="btn btn-outline" onclick="showStep('activities')">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            `}
        </div>
    `;
}

// ==================== ΑΠΛΟΠΟΙΗΜΕΝΗ ΣΥΝΑΡΤΗΣΗ ΓΕΩΓΡΑΦΙΚΟΥ ΠΡΟΓΡΑΜΜΑΤΟΣ ====================
function generateGeographicProgram() {
    console.log('🎯 ========== ΑΡΧΗ generateGeographicProgram ==========');
    console.log('📊 State:', {
        selectedDestinationId: state.selectedDestinationId,
        selectedActivities: state.selectedActivities.length,
        currentCityActivities: state.currentCityActivities?.length || 0,
        selectedDays: state.selectedDays
    });
    
    console.log('🎯 generateGeographicProgram ΚΑΛΕΙΤΑΙ!');
    
    // 1. ΒΕΒΑΙΩΣΟΥ ΟΤΙ ΥΠΑΡΧΕΙ ΤΟ DROPDOWN
    const daysSelect = document.getElementById('program-days');
    console.log('🔍 Dropdown:', daysSelect);
    
    if (!daysSelect) {
        alert('❌ Σφάλμα: Δεν βρέθηκε η επιλογή ημερών. Παρακαλώ ανανεώστε τη σελίδα.');
        return;
    }
    
    if (!daysSelect.value || daysSelect.value === '0') {
        alert('⚠️ Παρακαλώ επιλέξτε πρώτα πόσες μέρες θα διαρκέσει το ταξίδι');
        return;
    }
    
    // 2. ΑΠΛΗ ΕΝΗΜΕΡΩΣΗ
    state.selectedDays = parseInt(daysSelect.value);
    console.log('📅 Επιλέχθηκαν:', state.selectedDays, 'μέρες');
    
    // Έλεγχος βασικών προϋποθέσεων
    if (state.selectedActivities.length === 0) {
        alert('⚠️ Δεν υπάρχουν επιλεγμένες δραστηριότητες');
        return;
    }
    
    // 🔴 ΝΕΟ ΕΛΕΓΧΟΣ: ΟΧΙ ΠΡΟΓΡΡΑΜΜΑ ΧΩΡΙΣ ΗΛΙΚΙΕΣ
    const hasAnyAge = state.familyMembers.some(member => {
        const age = parseInt(member.age);
        return !isNaN(age) && age >= 0 && age <= 120;
    });
    
    if (!hasAnyAge) {
        alert('⚠️ ΠΡΟΣΟΧΗ: Δεν έχετε εισάγει ηλικίες!\n\nΠαρακαλώ:\n1. Επιστρέψτε στο βήμα "Δραστηριότητες"\n2. Εισάγετε ηλικίες για τουλάχιστον 1 άτομο\n3. Επιστρέψτε εδώ για δημιουργία προγράμματος');
        return;
    }
    
    if (!state.selectedDays || state.selectedDays < 1) {
        alert('⚠️ Παρακαλώ επιλέξτε πρώτα πόσες μέρες θα διαρκέσει το ταξίδι σας');
        return;
    }
    
    console.log(`🗺️ Δημιουργία γεωγραφικού προγράμματος...`);
    console.log(`   📅 Μέρες: ${state.selectedDays}`);
    console.log(`   📊 Δραστηριότητες: ${state.selectedActivities.length}`);
    
    // 1. ΔΙΑΒΑΣΕ ΤΙΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ ΑΠΟ ΤΟ JSON ΑΝ ΔΕΝ ΥΠΑΡΧΟΥΝ
    if (!state.currentCityActivities || state.currentCityActivities.length === 0) {
        console.log('⚠️ currentCityActivities είναι άδειο, προσπαθώ να φορτώσω ξανά...');
        loadActivitiesForProgram();
        return; // Η loadActivitiesForProgram() θα ξανακαλέσει αυτή τη συνάρτηση
    }
    
    // 2. Βρες τις πλήρεις πληροφορίες για τις επιλεγμένες δραστηριότητες
    console.log('🔍 Ψάχνω για currentCityActivities:', state.currentCityActivities.length);
    
    const fullActivities = state.selectedActivities.map(selected => {
        const originalActivity = state.currentCityActivities.find(a => a.id === selected.id);
        
        if (!originalActivity) {
            console.error('❌ Δεν βρέθηκε η δραστηριότητα:', selected.id, selected.name);
            return null;
        }
        
        return {
            ...selected,
            ...originalActivity,
            location: originalActivity?.location || null
        };
    }).filter(a => a !== null && a.location);
    
    console.log(`📍 Δραστηριότητες με location: ${fullActivities.length}/${state.selectedActivities.length}`);
    
    if (fullActivities.length === 0) {
        alert('⚠️ Δεν βρέθηκαν πληροφορίες τοποθεσίας για τις επιλεγμένες δραστηριότητες.\n\nΠαρακαλώ επιστρέψτε στις Δραστηριότητες και επιλέξτε ξανά.');
        return;
    }
    
    // 3. Ομαδοποίηση με βάση την τοποθεσία (μόνο αυτές με location)
    const activitiesWithLocation = fullActivities.filter(a => a.location);
    let activityGroups = [];
    
    if (activitiesWithLocation.length > 0) {
        activityGroups = createSmartClusters(activitiesWithLocation, state.selectedDays); // 2.5km radius
    } else {
        // Αν καμία δεν έχει location, δημιούργησε μια ομάδα για κάθε δραστηριότητα
        activityGroups = fullActivities.map(activity => ({
            center: null,
            activities: [activity],
            count: 1,
            radius: 0
        }));
    }
    
    console.log(`📍 Βρέθηκαν ${activityGroups.length} γεωγραφικές περιοχές/ομάδες`);
    
    // 4. Αν δεν έχουμε ομάδες, δημιουργησε μία ομάδα για κάθε δραστηριότητα
    if (activityGroups.length === 0) {
        activityGroups = fullActivities.map(activity => ({
            center: null,
            activities: [activity],
            count: 1,
            radius: 0
        }));
    }
    
    // 5. Κατανομή ομάδων στις μέρες που επέλεξε ο χρήστης
    const daysProgram = distributeGroupsToDays(activityGroups, state.selectedDays);
    
    // 6. Δημιουργία HTML για το πρόγραμμα
    const programDiv = document.getElementById('geographic-program');
    if (!programDiv) {
        console.error('❌ Δεν βρέθηκε το geographic-program div');
        return;
    }
    
    console.log('✅ ΒΡΕΘΗΚΕ το geographic-program div!');
    console.log('📏 Μέγεθος div:', programDiv.offsetWidth, 'x', programDiv.offsetHeight);
    
    let html = '';
    
    if (activityGroups.length === 0) {
        html = `
            <div style="padding: 40px 20px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px; color: #9CA3AF;">🧭</div>
                <h4 style="color: var(--dark); margin-bottom: 10px;">Δεν βρέθηκαν πληροφορίες τοποθεσίας</h4>
                <p style="color: var(--gray);">
                    Οι επιλεγμένες δραστηριότητες δεν έχουν πληροφορίες τοποθεσίας.<br>
                    Δοκιμάστε να τις δείτε στον χάρτη πρώτα.
                </p>
                <button onclick="showStep('map')" class="btn btn-primary" style="margin-top: 15px;">
                    <i class="fas fa-map"></i> Προβολή στον Χάρτη
                </button>
            </div>
        `;
    } else {
        // Εμφάνιση κάθε μέρας
        daysProgram.forEach((day, dayIndex) => {
            const dayNumber = dayIndex + 1;
            const groupCount = day.groups.length;
            const activityCount = day.totalActivities;
            const dayCost = day.totalCost || 0;
            const dayTime = day.estimatedTime || day.groups.reduce((sum, g) => 
                sum + g.activities.reduce((time, a) => time + (parseFloat(a.duration_hours) || 1), 0), 0);
            
            html += `
                <div class="day-card" style="
                    margin-bottom: 25px; 
                    padding: 20px; 
                    background: white; 
                    border-radius: 12px; 
                    border: 2px solid ${getDayColor(dayNumber)};
                    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
                ">
                    <!-- ΗΜΕΡΑ HEADER -->
                    <div style="
                        background: ${getDayColor(dayNumber)}; 
                        color: white; 
                        padding: 15px; 
                        border-radius: 8px;
                        margin-bottom: 20px;
                        text-align: center;
                    ">
                        <h3 style="margin: 0; color: white; font-size: 20px;">
                            ΜΕΡΑ ${dayNumber}
                            <span style="font-size: 14px; opacity: 0.9; margin-left: 10px;">
                                (${activityCount} δραστηριότητα${activityCount !== 1 ? 'τες' : ''})
                            </span>
                        </h3>
                        <div style="display: flex; justify-content: center; gap: 20px; margin-top: 10px; font-size: 14px;">
                            <span><i class="fas fa-clock"></i> ~${Math.round(dayTime)} ώρες</span>
                            <span><i class="fas fa-euro-sign"></i> ${dayCost}€</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${groupCount} περιοχή${groupCount !== 1 ? 'ές' : ''}</span>
                        </div>
                    </div>
                    
                    <!-- ΛΙΣΤΑ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ -->
                    <div style="padding: 0 10px;">
                        ${day.groups.map((group, groupIndex) => `
                            <div style="margin-bottom: 20px;">
                                <h4 style="color: var(--dark); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #E5E7EB;">
                                    <i class="fas fa-map-pin" style="color: ${getGroupColor(groupIndex)};"></i>
                                    Περιοχή ${groupIndex + 1}
                                    <span style="font-size: 13px; color: var(--gray); margin-left: 8px;">
                                        (${group.activities.length} δραστηριότητα${group.activities.length !== 1 ? 'τες' : ''})
                                    </span>
                                </h4>
                                
                                ${group.activities.map(activity => `
                                    <div style="
                                        padding: 12px; 
                                        margin-bottom: 8px; 
                                        background: #F9FAFB; 
                                        border-radius: 8px;
                                        border-left: 3px solid ${getGroupColor(groupIndex)};
                                    ">
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                            <div style="flex: 1;">
                                                <div style="font-weight: bold; color: var(--dark); margin-bottom: 5px;">
                                                    ${activity.name}
                                                </div>
                                                <div style="font-size: 13px; color: var(--gray);">
                                                    ${activity.category ? `${translateCategory(activity.category)} • ` : ''}
                                                    ${activity.duration_hours || '1-2'} ώρες
                                                </div>
                                            </div>
                                            <div style="text-align: right; min-width: 80px;">
                                                <div style="font-weight: bold; color: ${getGroupColor(groupIndex)}; font-size: 18px;">
                                                    ${activity.price || '0'}€
                                                </div>
                                                <div style="font-size: 12px; color: var(--gray);">
                                                    <i class="fas fa-clock"></i> ${activity.duration_hours || '?'}h
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                    
                    <!-- ΣΥΝΟΛΟ ΜΕΡΑΣ -->
                    <div style="
                        margin-top: 20px; 
                        padding: 15px; 
                        background: #F0F9FF; 
                        border-radius: 8px;
                        text-align: center;
                        border: 1px solid ${getDayColor(dayNumber)}40;
                    ">
                        <div style="font-weight: bold; color: ${getDayColor(dayNumber)}; margin-bottom: 5px;">
                            <i class="fas fa-check-circle"></i> ΣΥΝΟΛΟ ΜΕΡΑΣ ${dayNumber}
                        </div>
                        <div style="display: flex; justify-content: center; gap: 20px; font-size: 14px; color: var(--gray);">
                            <span>${activityCount} δραστηριότητες</span>
                            <span>•</span>
                            <span>~${Math.round(dayTime)} ώρες</span>
                            <span>•</span>
                            <span>${dayCost}€</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // ΣΥΝΟΛΙΚΟ ΣΤΑΤΙΣΤΙΚΟ
        const totalActivities = daysProgram.reduce((sum, day) => sum + day.totalActivities, 0);
        const totalCost = daysProgram.reduce((sum, day) => sum + (day.totalCost || 0), 0);
        const totalTime = daysProgram.reduce((sum, day) => sum + (day.estimatedTime || 0), 0);
        
        html += `
            <div style="
                margin-top: 30px; 
                padding: 20px; 
                background: linear-gradient(135deg, #1A202C, #2D3748); 
                color: white; 
                border-radius: 12px;
            ">
                <h4 style="color: white; margin-bottom: 15px; text-align: center;">
                    <i class="fas fa-chart-bar"></i> ΣΥΝΟΛΙΚΟ ΣΤΑΤΙΣΤΙΚΟ
                </h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #4F46E5;">${state.selectedDays}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Μέρες</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #10B981;">${activityGroups.length}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Γεωγραφικές περιοχές</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #F59E0B;">${totalActivities}</div>
                        <div style="font-size: 12px; opacity: 0.8;">Δραστηριότητες</div>
                    </div>
                    <div>
                        <div style="font-size: 24px; font-weight: bold; color: #EF4444;">${totalCost}€</div>
                        <div style="font-size: 12px; opacity: 0.8;">Συνολικό κόστος</div>
                    </div>
                </div>
                <p style="text-align: center; margin-top: 15px; font-size: 13px; opacity: 0.8;">
                    <i class="fas fa-lightbulb"></i> Οι δραστηριότητες ομαδοποιήθηκαν με βάση την απόσταση για ελάχιστες μετακινήσεις
                </p>
            </div>
        `;
    }
    
    programDiv.innerHTML = html;
    
    // 🔴 ΝΕΟ: ΑΥΤΟΜΑΤΟ SCROLL ΣΤΟ ΠΡΟΓΡΑΜΜΑ
    setTimeout(() => {
        programDiv.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }, 300);
    
    // Ενημέρωση status
    const statusDiv = document.getElementById('program-status');
    if (statusDiv) {
        statusDiv.innerHTML = `<i class="fas fa-check-circle"></i> Δημιουργήθηκε πρόγραμμα ${state.selectedDays} ημερών`;
        statusDiv.style.background = '#D1FAE5';
        statusDiv.style.color = '#065F46';
    }
    
    // Ενημέρωση του days-display
    const daysDisplay = document.getElementById('days-display');
    if (daysDisplay) {
        daysDisplay.textContent = '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν';
        daysDisplay.style.color = 'var(--success)';
    }
    
    // Εμφάνιση μηνύματος
    showToast(`✅ Δημιουργήθηκε γεωγραφικό πρόγραμμα για ${state.selectedDays} μέρες`, 'success');
    
    console.log(`✅ Το πρόγραμμα δημιουργήθηκε επιτυχώς για ${state.selectedDays} μέρες`);
    console.log('🎯 ========== ΤΕΛΟΣ generateGeographicProgram ==========');
}

// 🔴 ΝΕΑ ΣΥΝΑΡΤΗΣΗ: Φόρτωση δραστηριοτήτων για το πρόγραμμα
function loadActivitiesForProgram() {
    console.log('🔄 Φόρτωση δραστηριοτήτων για το πρόγραμμα...');
    
    if (!state.selectedDestinationId) {
        alert('❌ Δεν υπάρχει επιλεγμένος προορισμός');
        return;
    }
    
    fetch(`data/${state.selectedDestinationId}.json`)
        .then(response => response.json())
        .then(cityData => {
            state.currentCityActivities = cityData.activities;
            console.log('✅ Δραστηριότητες φορτώθηκαν:', state.currentCityActivities.length);
            
            // Ξανακάλεσε τη generateGeographicProgram τώρα που έχουμε τα δεδομένα
            setTimeout(() => {
                generateGeographicProgram();
            }, 500);
        })
        .catch(error => {
            console.error('❌ Σφάλμα φόρτωσης:', error);
            alert('⚠️ Δεν μπορούν να φορτωθούν οι δραστηριότητες. Παρακαλώ ανανεώστε τη σελίδα.');
        });
}

// ==================== FORCE REFRESH PROGRAM ====================
function forceRefreshProgram() {
    console.log('🔄 Αναγκαστική ανανέωση προγράμματος');
    
    // Επαναφόρτωση των ημερών από το dropdown
    const daysSelect = document.getElementById('program-days');
    if (daysSelect && daysSelect.value) {
        state.selectedDays = parseInt(daysSelect.value);
        saveState();
    }
    
    // Ενημέρωση UI
    const daysDisplay = document.getElementById('days-display');
    if (daysDisplay) {
        daysDisplay.textContent = '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν';
        daysDisplay.style.color = 'var(--success)';
    }
    
    // Γέμισμα με loading indicator
    const programDiv = document.getElementById('geographic-program');
    if (programDiv) {
        programDiv.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <div class="loading-spinner" style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid var(--primary);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px auto;
                "></div>
                <h4 style="color: var(--dark); margin-bottom: 10px;">Επαναϋπολογισμός...</h4>
                <p style="color: var(--gray);">Ομαδοποίηση δραστηριοτήτων για ${state.selectedDays} μέρες</p>
            </div>
        `;
    }
    
    // Καλέσε το πρόγραμμα με καθυστέρηση
    setTimeout(() => {
        generateGeographicProgram();
        showToast(`✅ Το πρόγραμμα ανανεώθηκε για ${state.selectedDays} μέρες`, 'success');
    }, 800);
}
