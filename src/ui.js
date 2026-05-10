// ==================== UI MODULE ====================
// User interface functions: modals, toasts, displays, updates, handlers
// Pure refactor - NO logic changes, 100% identical behavior
//
// NOTE: This is Phase 1 - Core UI functions
// Additional functions (HTML templates, full map suite, destinations)
// to be added in subsequent phases or as needed
//
// Global dependencies (will be made available in main.js):
// - state (global state object)
// - calculateFamilyCost (from combo.js)
// - getDayColor (from scheduler.js)
// - Various data/formatting functions from data.js

// ==================== TOAST NOTIFICATIONS ====================

export function showToast(message, type = 'info') {
    // Δημιουργία toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#4F46E5'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-family: 'Roboto', sans-serif;
        animation: slideIn 0.3s ease;
    `;

    toast.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div style="font-size: 20px;">
                ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div style="flex: 1; font-size: 14px; line-height: 1.4;">
                ${message}
            </div>
            <button onclick="this.parentElement.parentElement.remove()"
                    style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0 0 0 10px;">
                &times;
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Αυτόματη αφαίρεση μετά από 5 δευτερόλεπτα
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

// ==================== SAVED TRIP MODAL ====================

export function showSavedTripModal(message) {
    const existingModal = document.getElementById('saved-trip-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'saved-trip-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        animation: slideInDown 0.3s ease;
    `;

    modalContent.innerHTML = `
        <div style="padding: 30px;">
            ${message}
            <button onclick="closeSavedTripModal()" class="btn btn-primary" style="margin-top: 20px;">
                <i class="fas fa-check"></i> Εντάξει
            </button>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSavedTripModal();
    });

    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeSavedTripModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

export function closeSavedTripModal() {
    const modal = document.getElementById('saved-trip-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => modal.remove(), 200);
    }
}

// ==================== DISPLAY GEOGRAPHIC PROGRAM ====================

export function displayGeographicProgram(daysProgram, activityGroups) {
    console.log('🎨 Εμφάνιση γεωγραφικού προγράμματος...');

    const programOutput = document.getElementById('program-output');
    if (!programOutput) {
        console.error('❌ Δεν βρέθηκε το #program-output');
        return;
    }

    if (!daysProgram || daysProgram.length === 0) {
        programOutput.innerHTML = `
            <div class="alert alert-warning">
                ⚠️ Δεν υπάρχουν δεδομένα προγράμματος.
            </div>
        `;
        return;
    }

    let html = '<div class="program-days">';

    daysProgram.forEach((day, dayIndex) => {
        if (day.totalActivities === 0) {
            // Ελεύθερη μέρα
            html += `
                <div class="day-card" style="border-left: 4px solid ${getDayColor(dayIndex + 1)};">
                    <div class="day-header">
                        <h3>
                            <i class="fas fa-calendar-day"></i>
                            Μέρα ${dayIndex + 1}
                            <span class="day-badge" style="background: ${getDayColor(dayIndex + 1)}20; color: ${getDayColor(dayIndex + 1)};">
                                Ελεύθερη
                            </span>
                        </h3>
                        <p class="day-stats">🏖️ Ελεύθερη μέρα για ξεκούραση</p>
                    </div>
                </div>
            `;
            return;
        }

        html += `
            <div class="day-card" style="border-left: 4px solid ${getDayColor(dayIndex + 1)};">
                <div class="day-header">
                    <h3>
                        <i class="fas fa-calendar-day"></i>
                        Μέρα ${dayIndex + 1}
                        <span class="day-badge" style="background: ${getDayColor(dayIndex + 1)}20; color: ${getDayColor(dayIndex + 1)};">
                            ${day.totalActivities} Δραστηριότητες
                        </span>
                    </h3>
                    <p class="day-stats">
                        <span><i class="fas fa-clock"></i> ~${day.estimatedTime.toFixed(1)}h</span>
                        <span><i class="fas fa-coins"></i> ${day.totalCost.toFixed(2)}€</span>
                        <span><i class="fas fa-chart-line"></i> Effort: ${day.totalEffort.toFixed(0)}</span>
                    </p>
                </div>
                <div class="day-activities">
        `;

        day.groups.forEach((group, groupIndex) => {
            html += `<div class="activity-group">`;

            group.activities.forEach((activity, actIndex) => {
                html += `
                    <div class="activity-item">
                        <div class="activity-icon">${getActivityEmoji(activity.category)}</div>
                        <div class="activity-details">
                            <h4>${activity.name}</h4>
                            <p class="activity-meta">
                                <span><i class="fas fa-clock"></i> ${activity.duration_hours || 1.5}h</span>
                                <span><i class="fas fa-tag"></i> ${activity.price ? activity.price.toFixed(2) + '€' : 'Δωρεάν'}</span>
                            </p>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';
    programOutput.innerHTML = html;
}

// ==================== FORCE REFRESH PROGRAM ====================

export function forceRefreshProgram() {
    console.log('🔄 Χειροκίνητη επαναφόρτωση προγράμματος...');

    if (!state.geographicProgram) {
        showToast('⚠️ Δεν υπάρχει πρόγραμμα για επαναφόρτωση. Δημιουργήστε πρώτα ένα πρόγραμμα.', 'warning');
        return;
    }

    const programOutput = document.getElementById('program-output');
    if (!programOutput) {
        console.error('❌ Δεν βρέθηκε το #program-output');
        return;
    }

    displayGeographicProgram(state.geographicProgram.days, state.geographicProgram.groups);
    showToast('✅ Το πρόγραμμα ανανεώθηκε!', 'success');
}

// ==================== GENERATE GEOGRAPHIC PROGRAM ====================

export function generateGeographicProgram() {
    console.log('🗺️ Δημιουργία γεωγραφικού προγράμματος...');

    // Validation
    if (!state.selectedActivities || state.selectedActivities.length === 0) {
        showToast('⚠️ Δεν έχετε επιλέξει δραστηριότητες!', 'warning');
        return;
    }

    if (!state.selectedDays || state.selectedDays < 1) {
        showToast('⚠️ Παρακαλώ επιλέξτε πρώτα πόσες μέρες θα διαρκέσει το ταξίδι!', 'warning');
        return;
    }

    // Get pacing mode from UI (or use default)
    const pacingModeSelect = document.getElementById('pacing-mode-select');
    const pacingModeId = pacingModeSelect ? pacingModeSelect.value : 'balanced';

    console.log(`📊 Δημιουργία προγράμματος με pacing mode: ${pacingModeId}`);

    // Show loading
    const programDiv = document.getElementById('geographic-program');
    if (programDiv) {
        programDiv.innerHTML = `
            <div style="padding: 60px 20px; text-align: center;">
                <div class="loading">
                    <i class="fas fa-map-marked-alt fa-spin fa-3x" style="color: var(--primary); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--dark); margin-bottom: 10px;">Δημιουργία Προγράμματος</h3>
                    <p style="color: var(--gray);">
                        Ομαδοποίηση ${state.selectedActivities.length} δραστηριοτήτων
                        σε ${state.selectedDays} μέρες...
                    </p>
                </div>
            </div>
        `;
    }

    // Get full activity data
    const fullActivities = state.selectedActivities.map(selected =>
        state.currentCityActivities.find(a => a.id === selected.id) || selected
    );

    // Group activities by proximity
    const activityGroups = window.groupActivitiesByProximity(fullActivities, 2.0);

    if (!activityGroups || activityGroups.length === 0) {
        showToast('❌ Σφάλμα στην ομαδοποίηση δραστηριοτήτων', 'warning');
        return;
    }

    // Distribute groups to days with pacing mode
    const daysProgram = window.distributeGroupsToDays(activityGroups, state.selectedDays, pacingModeId);

    // Save to state
    state.geographicProgram = {
        days: daysProgram,
        groups: activityGroups,
        pacingMode: pacingModeId,
        generatedAt: new Date().toISOString()
    };

    // Display the program
    displayGeographicProgram(daysProgram, activityGroups);

    // Show success message with pacing mode info
    const pacingModes = window.PACING_MODES || {};
    const modeName = pacingModes[pacingModeId.toUpperCase()]?.name || pacingModeId;
    showToast(`✅ Πρόγραμμα δημιουργήθηκε με ${modeName}!`, 'success');

    // Show the program section
    const programSection = document.getElementById('geographic-program-section');
    if (programSection) {
        programSection.style.display = 'block';
    }

    // Save state
    saveState();
}

// ==================== ACTIVITY SELECTION ====================

export function toggleActivitySelection(activityId) {
    console.log(`🎫 Toggle activity: ${activityId}`);

    const activity = state.currentCityActivities.find(a => a.id === activityId);

    if (!activity) {
        console.error('❌ Δραστηριότητα δεν βρέθηκε:', activityId);
        return;
    }

    // 🔴 ΒΕΛΤΙΩΣΗ: Υπολόγισε πάντα το κόστος από την αρχή
    const familyCost = calculateFamilyCost(activity.prices);

    const existingIndex = state.selectedActivities.findIndex(a => a.id === activityId);

    if (existingIndex > -1) {
        state.selectedActivities.splice(existingIndex, 1);
        console.log(`➖ Αφαίρεση: ${activity.name}`);
    } else {
        state.selectedActivities.push({
            ...activity,
            price: familyCost
        });
        console.log(`➕ Προσθήκη: ${activity.name} (${familyCost}€)`);
    }

    // Ενημέρωση UI
    const card = document.querySelector(`[data-activity-id="${activityId}"]`);
    if (card) {
        if (existingIndex > -1) {
            card.classList.remove('selected');
        } else {
            card.classList.add('selected');
        }
    }

    updateActivitiesTotal();
    saveState();
}

export function clearSelectedActivities() {
    if (state.selectedActivities.length === 0) {
        alert('ℹ️ Δεν έχετε επιλέξει καμία δραστηριότητα!');
        return;
    }

    const confirmed = confirm(`Θέλετε να αφαιρέσετε όλες τις ${state.selectedActivities.length} επιλεγμένες δραστηριότητες;`);

    if (confirmed) {
        state.selectedActivities = [];

        // Αφαίρεση selected class από όλες τις κάρτες
        document.querySelectorAll('.activity-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        updateActivitiesTotal();
        saveState();

        showToast('🗑️ Όλες οι δραστηριότητες αφαιρέθηκαν!', 'success');
    }
}

export function recalculateSelectedActivityPrices() {
    console.log('💰 Επαναυπολογισμός τιμών επιλεγμένων δραστηριοτήτων...');

    let recalculated = 0;

    state.selectedActivities.forEach(selectedActivity => {
        const fullActivity = state.currentCityActivities.find(a => a.id === selectedActivity.id);

        if (fullActivity && fullActivity.prices) {
            const newPrice = calculateFamilyCost(fullActivity.prices);

            if (selectedActivity.price !== newPrice) {
                console.log(`  🔄 ${selectedActivity.name}: ${selectedActivity.price}€ → ${newPrice}€`);
                selectedActivity.price = newPrice;
                recalculated++;
            }
        }
    });

    if (recalculated > 0) {
        console.log(`✅ Επαναυπολογίστηκαν ${recalculated} δραστηριότητες`);
        updateActivitiesTotal();
    } else {
        console.log('ℹ️ Δεν χρειάστηκε επαναυπολογισμός');
    }
}

// ==================== UPDATE ACTIVITIES TOTAL ====================

export function updateActivitiesTotal() {
    const totalCostEl = document.getElementById('total-activities-cost');
    const totalCountEl = document.getElementById('total-activities-count');

    if (!totalCostEl || !totalCountEl) return;

    const totalCost = state.selectedActivities.reduce((sum, activity) => sum + (activity.price || 0), 0);
    const totalCount = state.selectedActivities.length;

    totalCostEl.textContent = `${totalCost.toFixed(2)}€`;
    totalCountEl.textContent = totalCount;

    console.log(`💰 Ενημέρωση συνόλου: ${totalCount} δραστηριότητες, ${totalCost.toFixed(2)}€`);
}

export function updateActivitiesCost() {
    const costDisplay = document.querySelector('.activities-cost-display');
    if (!costDisplay) return;

    const total = calculateTotalSpent();
    costDisplay.innerHTML = `
        <div class="cost-summary">
            <h3>Συνολικό Κόστος</h3>
            <p class="total-amount">${total.toFixed(2)}€</p>
            <p class="activities-count">${state.selectedActivities.length} δραστηριότητες</p>
        </div>
    `;
}

export function calculateTotalSpent() {
    return state.selectedActivities.reduce((sum, activity) => {
        return sum + (activity.discountedPrice || activity.price || 0);
    }, 0);
}

// ==================== FAMILY MANAGEMENT ====================

export function updateFamilyMemberName(index, name) {
    if (index < 0 || index >= state.familyMembers.length) {
        console.warn(`⚠️ updateFamilyMemberName: index ${index} εκτός ορίων (${state.familyMembers.length} μέλη)`);
        return;
    }
    state.familyMembers[index].name = name;
}

export function updateFamilyMemberAge(index, age) {
    if (index < 0 || index >= state.familyMembers.length) {
        console.warn(`⚠️ updateFamilyMemberAge: index ${index} εκτός ορίων (${state.familyMembers.length} μέλη)`);
        return;
    }
    if (age === "" || isNaN(parseInt(age))) {
        state.familyMembers[index].age = "";
    } else {
        state.familyMembers[index].age = parseInt(age);
    }
    // Recalculate prices when ages change (fixes stale prices issue)
    recalculateSelectedActivityPrices();
}

export function addFamilyMember() {
    const newIndex = state.familyMembers.length + 1;
    state.familyMembers.push({
        name: `Μέλος ${newIndex}`,
        age: ""
    });
    updateFamilyMembers();
}

export function removeFamilyMember(index) {
    if (state.familyMembers.length <= 1) {
        alert('⚠️ Πρέπει να υπάρχει τουλάχιστον 1 μέλος!');
        return;
    }
    state.familyMembers.splice(index, 1);
    updateFamilyMembers();
    recalculateSelectedActivityPrices();
}

export function updateFamilyMembers() {
    const container = document.getElementById('family-members-container');
    if (!container) return;

    container.innerHTML = '';

    state.familyMembers.forEach((member, index) => {
        const memberDiv = document.createElement('div');
        memberDiv.className = 'family-member';
        memberDiv.innerHTML = `
            <input type="text"
                   value="${member.name}"
                   onchange="updateFamilyMemberName(${index}, this.value)"
                   placeholder="Όνομα">
            <input type="number"
                   value="${member.age}"
                   onchange="updateFamilyMemberAge(${index}, this.value)"
                   placeholder="Ηλικία"
                   min="0"
                   max="120">
            ${state.familyMembers.length > 1 ?
                `<button onclick="removeFamilyMember(${index})" class="btn-remove">
                    <i class="fas fa-times"></i>
                </button>` : ''}
        `;
        container.appendChild(memberDiv);
    });
}

// ==================== PROGRAM DAYS ====================

export function updateProgramDays() {
    const daysSelect = document.getElementById('program-days');
    if (!daysSelect) return;

    const selectedValue = daysSelect.value;

    if (!selectedValue || selectedValue === '0') {
        alert('⚠️ Παρακαλώ επιλέξτε αριθμό ημερών από το dropdown');
        return;
    }

    state.selectedDays = parseInt(selectedValue);
    console.log(`📅 Ενημέρωση ημερών: ${state.selectedDays}`);

    saveState();
    showToast(`✅ Ενημερώθηκαν οι ημέρες σε ${state.selectedDays}`, 'success');
}

export function suggestDaysFromGroups(groups) {
    if (!groups || groups.length === 0) return 3;

    // Suggest 1 day per 2-3 groups
    const suggestedDays = Math.ceil(groups.length / 2.5);

    // Min 2, max 7 days
    return Math.max(2, Math.min(7, suggestedDays));
}

// ==================== PRICE FORMATTING ====================

export function getPriceInfo(prices) {
    if (!prices || typeof prices !== 'object') {
        return '<span class="price-na">Δεν διατίθεται</span>';
    }

    const adultPrice = prices.adult || prices[18] || 0;
    const childPrice = prices.child || prices[10] || prices[5] || 0;

    if (adultPrice === 0 && childPrice === 0) {
        return '<span class="price-free">ΔΩΡΕΑΝ</span>';
    }

    return `
        <div class="price-info">
            <span>Ενήλικας: ${adultPrice.toFixed(2)}€</span>
            ${childPrice > 0 ? `<span>Παιδί: ${childPrice.toFixed(2)}€</span>` : ''}
        </div>
    `;
}

export function getPriceForAge(prices, age) {
    if (!prices) return '?';

    if (prices[age] !== undefined && prices[age] !== null) {
        return Number(prices[age]).toFixed(2) + '€';
    }

    if (age >= 18 && prices.adult !== undefined) {
        return Number(prices.adult).toFixed(2) + '€';
    }

    if (age >= 5 && age <= 17) {
        if (prices.child !== undefined) return Number(prices.child).toFixed(2) + '€';
        if (prices['10'] !== undefined) return Number(prices['10']).toFixed(2) + '€';
    }

    if (age < 5 && prices['0'] !== undefined) {
        return Number(prices['0']).toFixed(2) + '€';
    }

    return '?';
}

// ==================== STATE PERSISTENCE ====================

export function saveState() {
    try {
        const dataToSave = {
            selectedDestination: state.selectedDestination,
            selectedDestinationId: state.selectedDestinationId,
            selectedDays: state.selectedDays,
            familyMembers: state.familyMembers,
            selectedActivities: state.selectedActivities,
            geographicProgram: state.geographicProgram,
            currentStep: state.currentStep,
            timestamp: Date.now()
        };

        localStorage.setItem('travel_planner_state', JSON.stringify(dataToSave));
        console.log('💾 State saved to localStorage');
    } catch (error) {
        console.error('❌ Failed to save state:', error);
    }
}

// ==================== HOTEL SEARCH FUNCTIONS ====================

export function searchBookingHotels() {
    const destination = document.getElementById('hotel-destination').value;
    const checkin = document.getElementById('hotel-checkin').value;
    const checkout = document.getElementById('hotel-checkout').value;
    const adults = document.getElementById('hotel-adults').value;
    const children = document.getElementById('hotel-children').value;
    const rooms = document.getElementById('hotel-rooms').value;

    if (!destination) {
        alert('⚠️ Παρακαλώ επιλέξτε προορισμό πρώτα');
        return;
    }

    // Δημιουργία URL για Booking.com
    const bookingUrl = `https://www.booking.com/searchresults.el.html?ss=${encodeURIComponent(destination)}&checkin=${checkin}&checkout=${checkout}&group_adults=${adults}&group_children=${children}&no_rooms=${rooms}`;

    // Επιβεβαίωση πριν την ανακατεύθυνση
    const userConfirmed = confirm(
        '🔍 Αναζήτηση Ξενοδοχείων\n\n' +
        `Θα ανοίξει νέα καρτέλα με ταξίδι σε: ${destination}\n` +
        `Check-in: ${checkin} | Check-out: ${checkout}\n` +
        `Άτομα: ${adults} ενήλικοι, ${children} παιδιά | Δωμάτια: ${rooms}\n\n` +
        'Θέλετε να συνεχίσετε στην ιστοσελίδα Booking.com;'
    );

    if (userConfirmed) {
        window.open(bookingUrl, '_blank');
    }
}

export function searchExpediaHotels() {
    const destination = document.getElementById('hotel-destination').value;
    const checkin = document.getElementById('hotel-checkin').value;
    const checkout = document.getElementById('hotel-checkout').value;
    const adults = document.getElementById('hotel-adults').value;
    const children = document.getElementById('hotel-children').value;
    const rooms = document.getElementById('hotel-rooms').value;

    if (!destination) {
        alert('⚠️ Παρακαλώ επιλέξτε προορισμό πρώτα');
        return;
    }

    // Σημαντικό: Χρησιμοποιώ το affiliate link
    let expediaBaseUrl = `https://www.anrdoezrs.net/click-101567630-14574920?url=https%3A%2F%2Fwww.expedia.co.uk%2FHotel-Search%3F`;

    expediaBaseUrl += `locale=el_GR&currency=EUR`;
    expediaBaseUrl += `&destination=${encodeURIComponent(destination)}`;
    expediaBaseUrl += `&startDate=${checkin}`;
    expediaBaseUrl += `&endDate=${checkout}`;
    expediaBaseUrl += `&adults=${adults}`;

    if (children > 0) {
        expediaBaseUrl += `&children=${children}`;
    }
    expediaBaseUrl += `&rooms=${rooms}`;

    // Επιβεβαίωση πριν την ανακατεύθυνση
    const userConfirmed = confirm(
        '🏨 Αναζήτηση Ξενοδοχείων - Expedia\n\n' +
        `Προορισμός: ${destination}\n` +
        `Check-in: ${checkin} | Check-out: ${checkout}\n` +
        `Άτομα: ${adults} ενήλικοι, ${children} παιδιά | Δωμάτια: ${rooms}\n\n` +
        'Θα ανοίξει νέα καρτέλα στην ιστοσελίδα Expedia.'
    );

    if (userConfirmed) {
        window.open(expediaBaseUrl, '_blank');
    }
}

export function searchTicketsellerHotels() {
    // Ticketseller.gr does not support direct URL parameters for hotel search
    // Opens homepage where user can search manually
    const destination = document.getElementById('hotel-destination').value;

    if (!destination) {
        alert('⚠️ Παρακαλώ επιλέξτε προορισμό πρώτα');
        return;
    }

    const userConfirmed = confirm(
        '🎫 Αναζήτηση Ξενοδοχείων - TicketSeller\n\n' +
        `Προορισμός: ${destination}\n\n` +
        'ΣημείωSH: Το TicketSeller.gr δεν υποστηρίζει αυτόματη αναζήτηση με URL.\n' +
        'Θα ανοίξει η αρχική σελίδα όπου μπορείτε να αναζητήσετε χειροκίνητα.\n\n' +
        'Στείλτε email στο takethekids2@gmail.com για έκπτωση!'
    );

    if (userConfirmed) {
        window.open('https://ticketseller.gr/el/home-2/', '_blank');
    }
}

// ==================== HELPER PLACEHOLDER ====================
// Note: Additional UI functions (HTML templates, map functions, destination functions)
// should be extracted from script.js and added here as needed.
// This represents Phase 1 of ui.js extraction with core functionality.
