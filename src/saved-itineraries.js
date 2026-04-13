// ==================== SAVED ITINERARIES MODULE ====================
// Multi-slot persistence for complete travel plans.
// Each save is a self-contained snapshot: destination, days, family,
// selected activities (full data), and the geographic day groupings.
//
// Storage key: 'takemytrip_saved_itineraries'  →  Array of SavedTrip objects
// The existing 'travelPlannerData' key is kept for auto-resume of the
// current working session; this module provides named, permanent saves.

const STORAGE_KEY = 'takemytrip_saved_itineraries';
const MAX_SLOTS = 15;

// ── Internal helpers ──────────────────────────────────────────────────────────

function readStore() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('[saved-itineraries] read error', e);
        return [];
    }
}

function writeStore(list) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return true;
    } catch (e) {
        console.error('[saved-itineraries] write error', e);
        return false;
    }
}

/**
 * Enrich every activity inside a geographicProgram with the full data
 * (cafe, restaurant, price, category…) by merging from selectedActivities
 * and currentCityActivities lookup maps.
 */
function enrichProgram(program, selectedActivities, cityActivities) {
    if (!program) return null;

    const byId = {};
    (cityActivities || []).forEach(a => { byId[a.id] = a; });
    (selectedActivities || []).forEach(a => { byId[a.id] = { ...byId[a.id], ...a }; });

    const enrichAct = (act) => {
        const full = byId[act.id] || {};
        return {
            ...full,      // start with the fullest known version
            ...act,       // then override with whatever the program already has
            // ensure critical display fields exist
            cafe:       act.cafe       || full.cafe       || null,
            restaurant: act.restaurant || full.restaurant || null,
            price:      act.price      ?? full.price      ?? 0,
            category:   act.category   || full.category   || '',
            duration_hours: act.duration_hours || full.duration_hours || 1.5,
            name:       act.name       || full.name       || '(activity)',
        };
    };

    return {
        ...program,
        days: (program.days || []).map(day => ({
            ...day,
            groups: (day.groups || []).map(group => ({
                ...group,
                activities: (group.activities || []).map(enrichAct),
            })),
        })),
    };
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Returns all saved itineraries, newest first. */
export function getSavedItineraries() {
    return readStore();
}

/**
 * Persists the current working state as a named itinerary.
 * @param {string} [customName] - optional display name; defaults to "Destination – date"
 * @returns {string|false} the new trip id, or false on failure
 */
export function saveCurrentItinerary(customName) {
    const state = window.state;
    if (!state || !state.selectedDestination) return false;

    const destination = state.selectedDestination;
    const dateStr = new Date().toLocaleDateString('el-GR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
    const name = customName || `${destination} – ${dateStr}`;

    // Enrich geographicProgram so activities carry cafe/restaurant/price
    const enrichedProgram = enrichProgram(
        state.geographicProgram,
        state.selectedActivities,
        state.currentCityActivities
    );

    const trip = {
        id: `trip_${Date.now()}`,
        name,
        savedAt: new Date().toISOString(),
        destination,
        destinationId: state.selectedDestinationId || null,
        totalDays: state.selectedDays || 0,
        activitiesCount: (state.selectedActivities || []).length,
        familySize: (state.familyMembers || []).length,
        // Full data snapshot
        data: {
            selectedDestination:   destination,
            selectedDestinationId: state.selectedDestinationId || null,
            selectedDays:          state.selectedDays || 0,
            familyMembers:         JSON.parse(JSON.stringify(state.familyMembers || [])),
            selectedActivities:    JSON.parse(JSON.stringify(state.selectedActivities || [])),
            geographicProgram:     enrichedProgram ? JSON.parse(JSON.stringify(enrichedProgram)) : null,
            currentCityActivities: JSON.parse(JSON.stringify(state.currentCityActivities || [])),
        },
    };

    const existing = readStore();
    // Prevent exact duplicates (same destination + same activity count + saved within 1 min)
    const oneMinuteAgo = Date.now() - 60_000;
    const isDuplicate = existing.some(t =>
        t.destination === destination &&
        t.activitiesCount === trip.activitiesCount &&
        new Date(t.savedAt).getTime() > oneMinuteAgo
    );
    if (isDuplicate) return existing[0].id; // return id without re-saving

    const updated = [trip, ...existing].slice(0, MAX_SLOTS);
    return writeStore(updated) ? trip.id : false;
}

/**
 * Loads a saved itinerary into window.state and triggers a UI refresh.
 * @param {string} id - trip id
 * @returns {boolean} true on success
 */
export function loadSavedItinerary(id) {
    const trips = readStore();
    const trip = trips.find(t => t.id === id);
    if (!trip) return false;

    const state = window.state;
    if (!state) return false;

    const d = trip.data;
    state.selectedDestination   = d.selectedDestination   || null;
    state.selectedDestinationId = d.selectedDestinationId || null;
    state.selectedDays          = d.selectedDays          || 0;
    state.familyMembers         = JSON.parse(JSON.stringify(d.familyMembers         || []));
    state.selectedActivities    = JSON.parse(JSON.stringify(d.selectedActivities    || []));
    state.geographicProgram     = d.geographicProgram
                                    ? JSON.parse(JSON.stringify(d.geographicProgram))
                                    : null;
    state.currentCityActivities = JSON.parse(JSON.stringify(d.currentCityActivities || []));

    // Persist into the auto-resume slot so page-refresh also works
    if (window.saveState) window.saveState();

    // Update sidebar destination label
    const el = document.getElementById('current-destination-display');
    if (el) el.textContent = state.selectedDestination || 'Δεν έχει επιλεγεί';

    // Navigate to summary step to show the restored itinerary
    if (window.showStep) window.showStep('summary');

    if (window.showToast) {
        window.showToast(`✅ Φορτώθηκε: ${trip.name}`, 'success');
    }

    return true;
}

/**
 * Removes a saved itinerary by id.
 * @param {string} id
 * @returns {boolean}
 */
export function deleteSavedItinerary(id) {
    const updated = readStore().filter(t => t.id !== id);
    return writeStore(updated);
}

// ── UI renderer ───────────────────────────────────────────────────────────────

/**
 * Renders the saved-trips panel into #saved-trips-panel (must exist in DOM).
 * Called after saving or when Step 5 loads.
 */
export function renderSavedTripsPanel() {
    const container = document.getElementById('saved-trips-panel');
    if (!container) return;

    const trips = getSavedItineraries();

    if (trips.length === 0) {
        container.innerHTML = `
            <div style="
                padding: 20px;
                text-align: center;
                color: #94a3b8;
                font-size: 14px;
                border: 2px dashed #e2e8f0;
                border-radius: 10px;
                background: #f8fafc;
            ">
                <i class="fas fa-inbox" style="font-size: 28px; display: block; margin-bottom: 10px; opacity: 0.5;"></i>
                Δεν υπάρχουν αποθηκευμένα ταξίδια ακόμα.<br>
                <span style="font-size: 12px;">Πατήστε "Αποθήκευση Ταξιδιού" παραπάνω για να αποθηκεύσετε.</span>
            </div>`;
        return;
    }

    container.innerHTML = trips.map(trip => {
        const date = new Date(trip.savedAt).toLocaleDateString('el-GR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        return `
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            margin-bottom: 10px;
            gap: 12px;
            flex-wrap: wrap;
            box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        ">
            <div style="flex: 1; min-width: 0;">
                <div style="
                    font-weight: 600;
                    color: #1e293b;
                    font-size: 14px;
                    margin-bottom: 3px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                ">${trip.name}</div>
                <div style="font-size: 12px; color: #64748b; display: flex; gap: 10px; flex-wrap: wrap;">
                    <span><i class="fas fa-calendar-alt"></i> ${trip.totalDays} ημέρες</span>
                    <span><i class="fas fa-list-ul"></i> ${trip.activitiesCount} δραστηριότητες</span>
                    <span><i class="fas fa-users"></i> ${trip.familySize} άτομα</span>
                    <span style="color: #94a3b8;"><i class="fas fa-clock"></i> ${date}</span>
                </div>
            </div>
            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <button
                    onclick="loadSavedItinerary('${trip.id}')"
                    style="
                        padding: 6px 14px;
                        background: #4F46E5;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 600;
                        cursor: pointer;
                        white-space: nowrap;
                    ">
                    <i class="fas fa-folder-open"></i> Φόρτωση
                </button>
                <button
                    onclick="deleteSavedItineraryAndRefresh('${trip.id}')"
                    style="
                        padding: 6px 10px;
                        background: transparent;
                        color: #EF4444;
                        border: 1px solid #EF4444;
                        border-radius: 6px;
                        font-size: 12px;
                        cursor: pointer;
                    "
                    title="Διαγραφή">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

/**
 * Deletes a trip and re-renders the panel.
 * Exposed to window so inline onclick handlers can call it.
 */
export function deleteSavedItineraryAndRefresh(id) {
    if (!confirm('Διαγραφή αυτού του αποθηκευμένου ταξιδιού;')) return;
    deleteSavedItinerary(id);
    renderSavedTripsPanel();
}

/**
 * Triggered by the "Save Itinerary" button in Step 5.
 * Prompts for an optional name, saves, and refreshes the panel.
 */
export function saveItineraryWithFeedback() {
    const state = window.state;
    if (!state || !state.selectedDestination) {
        alert('⚠️ Δεν έχετε επιλέξει προορισμό.');
        return;
    }
    if (!state.selectedActivities || state.selectedActivities.length === 0) {
        alert('⚠️ Δεν υπάρχουν δραστηριότητες για αποθήκευση.');
        return;
    }

    const defaultName = `${state.selectedDestination} – ${new Date().toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    const name = window.prompt('Όνομα για το αποθηκευμένο ταξίδι (προαιρετικό):', defaultName);
    if (name === null) return; // user cancelled

    const id = saveCurrentItinerary(name.trim() || defaultName);
    if (id) {
        renderSavedTripsPanel();

        // Expand the panel if it was collapsed
        const toggle = document.getElementById('saved-trips-toggle');
        const panel  = document.getElementById('saved-trips-collapse');
        if (panel && panel.style.display === 'none') {
            panel.style.display = 'block';
            if (toggle) toggle.innerHTML = '<i class="fas fa-chevron-up"></i>';
        }

        if (window.showToast) {
            window.showToast('✅ Το ταξίδι αποθηκεύτηκε!', 'success');
        }
    } else {
        alert('❌ Αποτυχία αποθήκευσης. Δοκιμάστε ξανά.');
    }
}

/** Toggle collapse of the saved-trips panel. */
export function toggleSavedTripsPanel() {
    const panel  = document.getElementById('saved-trips-collapse');
    const toggle = document.getElementById('saved-trips-toggle');
    if (!panel) return;
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    if (toggle) toggle.innerHTML = isHidden
        ? '<i class="fas fa-chevron-up"></i>'
        : '<i class="fas fa-chevron-down"></i>';
}
