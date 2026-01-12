// ==================== UI TEMPLATES MODULE ====================
// Pure HTML generation functions for all application steps
// Dependencies: window.state, getDayColor, COLOR_PALETTE

import { getDayColor } from './scheduler.js';
import { COLOR_PALETTE } from './data.js';

// Access global state
const state = window.state;

// ==================== STEP NAME HELPER ====================
export function getStepName(stepId) {
    const stepNames = {
        'destination': '📍 Προορισμός',
        'flight': '✈️ Πτήσεις',
        'hotel': '🏨 Ξενοδοχεία',
        'activities': '🎫 Δραστηριότητες',
        'summary': '📅 Πρόγραμμα',
        'map': '🗺️ Χάρτης'
    };
    return stepNames[stepId] || stepId;
}

// ==================== STEP 1: DESTINATION ====================
export function getDestinationStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-map-marked-alt"></i> Επιλογή Προορισμού</h1>
            <p class="card-subtitle">Βρείτε την τέλεια πόλη για τις οικογενειακές σας διακοπές</p>

            <div class="grid grid-3">
                <!-- ΑΥΤΟ ΕΙΝΑΙ ΤΟ ΝΕΟ ΦΙΛΤΡΟ ΣΤΗ ΘΕΣΗ ΤΟΥ ΠΑΛΙΟΥ -->
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-baby-carriage"></i> Φιλική για Καρότσι</label>
                    <select class="form-control" id="stroller-friendly-filter">
                        <option value="">Όλες οι πόλεις (προεπιλογή)</option>
                        <option value="true">✅ Ναι, εύκολη πρόσβαση με καρότσι</option>
                        <option value="false">Όχι απαραίτητα</option>
                    </select>
                    <small class="text-muted">Ανοίξιμα πεζοδρόμια, άνετες μετακινήσεις</small>
                </div>

                <div class="form-group">
                    <label class="form-label"><i class="fas fa-plane"></i> Απόσταση πτήσης</label>
                    <select class="form-control" id="distance">
                        <option value="">Όλες οι αποστάσεις</option>
                        <option value="1.5">Έως 1.5 ώρες</option>
                        <option value="2.5">Έως 2.5 ώρες</option>
                        <option value="5">Έως 5 ώρες</option>
                        <option value="10">Οποιαδήποτε απόσταση</option>
                    </select>
                    <small class="text-muted">Από Αθήνα</small>
                </div>

                <div class="form-group">
                    <label class="form-label"><i class="fas fa-umbrella-beach"></i> Τύπος Διακοπών</label>
                    <select class="form-control" id="vacation-type">
                        <option value="">Όλοι οι τύποι</option>
                        <option value="Πολιτισμός">🏛️ Πολιτισμός & Μουσεία</option>
                        <option value="Θάλασσα">🏖️ Θάλασσα & Παραλίες</option>
                        <option value="Βουνό">🏔️ Βουνό & Χιονοδρομικά</option>
                        <option value="Φυσική">🌳 Φυσική Ομορφία</option>
                    </select>
                </div>
            </div>

            <div class="grid grid-3">
                <div class="form-group">
                    <label class="form-label"><i class="fas fa-wallet"></i> Επίπεδο Κόστους</label>
                    <select class="form-control" id="cost-level">
                        <option value="">Όλα τα επίπεδα</option>
                        <option value="Οικονομικό">💰 Οικονομικό</option>
                        <option value="Μέτριο">💰💰 Μέτριο</option>
                        <option value="Ακριβό">💰💰💰 Ακριβό</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label"><i class="fas fa-ferris-wheel"></i> Θεματικά Πάρκα & Διασκέδαση</label>
                    <select class="form-control" id="theme-parks">
                        <option value="">Όλα (με ή χωρίς)</option>
                        <option value="has-parks">🎡 Με θεματικά πάρκα</option>
                        <option value="disney">👑 Με Disneyland</option>
                    </select>
                    <small class="text-muted">Ιδανικό για οικογένειες με παιδιά</small>
                </div>

                <div class="form-group">
                    <label class="form-label">&nbsp;</label>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="filterDestinations()" style="flex: 1;">
                            <i class="fas fa-search"></i> Αναζήτηση
                        </button>
                        <button class="btn btn-outline" onclick="resetFilters()" style="flex: 1;">
                            <i class="fas fa-redo"></i> Επαναφορά
                        </button>
                    </div>
                </div>
            </div>

            <!-- Οι γρήγορες επιλογές, το κουμπί αναζήτησης και τα αποτελέσματα παραμένουν ΑΜΕΤΑΒΛΗΤΑ -->
            <div id="main-buttons-container" style="text-align: center; margin: 30px 0;">
    <button class="btn btn-primary main-already-btn"
            style="padding: 14px 25px; font-size: 16px; width: 90%; max-width: 300px; border-radius: 8px;">
        <i class="fas fa-map-marker-alt"></i> ΕΧΩ ΗΔΗ ΒΡΕΙ ΠΡΟΟΡΙΣΜΟ
    </button>

    <p style="margin-top: 15px; color: var(--gray); font-size: 14px;">
        <i class="fas fa-info-circle"></i> Ή χρησιμοποίησε τα φίλτρα πάνω για αναζήτηση
    </p>
</div>

            <div id="destination-results">
                <!-- ΕΔΩ ΘΑ ΕΜΦΑΝΙΖΟΝΤΑΙ ΤΑ ΑΠΟΤΕΛΕΣΜΑΤΑ -->
            </div>
        </div>
    `;
}

// ==================== STEP 2: FLIGHT ====================
export function getFlightStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-plane"></i> Αναζήτηση Πτήσεων</h1>
            <p class="card-subtitle">Βρείτε τις καλύτερες πτήσεις για το ταξίδι σας</p>

            <!-- ΕΝΑ ΜΟΝΟ GRID ΜΕ 2 ΣΤΗΛΕΣ -->
            <div class="grid grid-2">
                <div class="form-group">
                    <label class="form-label">Από</label>
                    <input type="text" class="form-control" value="Αθήνα" readonly>
                </div>

                <div class="form-group">
                    <label class="form-label">Προς</label>
                    <input type="text" class="form-control" id="flight-destination"
                           value="${state.selectedDestination || ''}" ${state.selectedDestination ? 'readonly' : ''}>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <h3 style="margin-bottom: 20px; color: var(--dark);">🔍 Αναζήτηση στις πλατφόρμες:</h3>

                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">
                    <a href="https://www.google.com/flights" target="_blank" class="btn btn-primary" style="min-width: 180px; padding: 14px;">
                        <i class="fas fa-globe"></i> Google Flights
                    </a>

                    <a href="https://www.skyscanner.net" target="_blank" class="btn btn-secondary" style="min-width: 180px; padding: 14px;">
                        <i class="fas fa-plane-departure"></i> Skyscanner
                    </a>

                    <a href="https://www.kayak.com" target="_blank" class="btn btn-accent" style="min-width: 180px; padding: 14px;">
                        <i class="fas fa-search"></i> Kayak
                    </a>
                </div>

                <!-- ΚΟΥΜΠΙ ΣΥΝΕΧΕΙΑΣ (ΠΙΟ ΠΑΝΩ ΤΩΡΑ) -->
                <button class="btn btn-primary" onclick="showStep('hotel')"
                        style="padding: 14px 40px; font-size: 16px; border-radius: 8px;">
                    <i class="fas fa-arrow-right"></i> Συνέχεια στα Ξενοδοχεία
                </button>
            </div>
        </div>
    `;
}

// ==================== STEP 3: HOTEL ====================
export function getHotelStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-hotel"></i> Αναζήτηση Ξενοδοχείων</h1>

            <!-- ULTRA-COMPACT FORM -->
            <div style="margin-bottom: 20px;">
                <!-- ΠΡΟΟΡΙΣΜΟΣ -->
                <div class="form-group" style="margin-bottom: 12px;">
                    <label class="form-label" style="font-size: 13px;">📍 Προορισμός</label>
                    <input type="text" class="form-control" id="hotel-destination"
                           value="${state.selectedDestination || ''}"
                           style="padding: 10px; height: 42px;">
                </div>

                <!-- HORIZONTAL ROW -->
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
                    <!-- CHECK-IN -->
                    <div style="flex: 1; min-width: 120px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">📅 Check-in</label>
                        <input type="date" class="form-control" id="hotel-checkin"
                               style="padding: 8px; height: 38px; width: 100%;">
                    </div>

                    <!-- CHECK-OUT -->
                    <div style="flex: 1; min-width: 120px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">📅 Check-out</label>
                        <input type="date" class="form-control" id="hotel-checkout"
                               style="padding: 8px; height: 38px; width: 100%;">
                    </div>

                    <!-- ΕΝΗΛΙΚΟΙ -->
                    <div style="flex: 1; min-width: 80px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">👨 Ενήλ.</label>
                        <select class="form-control" id="hotel-adults"
                                style="padding: 8px; height: 38px; width: 100%;">
                            <option value="2" selected>2</option>
                            <option value="1">1</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                        </select>
                    </div>

                    <!-- ΠΑΙΔΙΑ -->
                    <div style="flex: 1; min-width: 80px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">🧒 Παιδ.</label>
                        <select class="form-control" id="hotel-children"
                                style="padding: 8px; height: 38px; width: 100%;">
                            <option value="0" selected>0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>

                    <!-- ΔΩΜΑΤΙΑ -->
                    <div style="flex: 1; min-width: 80px;">
                        <label style="font-size: 13px; display: block; margin-bottom: 4px;">🚪 Δωμ.</label>
                        <select class="form-control" id="hotel-rooms"
                                style="padding: 8px; height: 38px; width: 100%;">
                            <option value="1" selected>1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- ΜΙΚΡΗ ΕΝΔΕΙΞΗ -->
            <div style="background: #fff3cd; padding: 8px 10px; border-radius: 6px; margin: 10px 0; font-size: 12px;">
                <i class="fas fa-external-link-alt" style="color: #ff9800;"></i>
                <span style="margin-left: 5px;">Ανακατεύθυνση σε Booking/Expedia</span>
            </div>

            <!-- ΚΟΥΜΠΙΑ ΜΕ RESPONSIVE DESIGN ΚΑΙ ΚΕΙΜΕΝΑ -->
            <div style="text-align: center; margin: 15px 0;">
                <div class="hotel-buttons-container" style="
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    align-items: center;
                ">
                    <!-- BOOKING.COM -->
                    <div style="width: 100%; max-width: 320px;">
                        <button class="btn btn-primary" onclick="searchBookingHotels()"
                                style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    font-size: 15px;
                                    font-weight: 600;
                                    border: none;
                                    border-radius: 8px;
                                ">
                            <i class="fas fa-search"></i> Αναζήτηση σε Booking.com
                        </button>
                    </div>

                    <!-- EXPEDIA -->
                    <div style="width: 100%; max-width: 320px;">
                        <button class="btn" onclick="searchExpediaHotels()"
                                style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    font-size: 15px;
                                    font-weight: 600;
                                    background: linear-gradient(135deg, #ff9800, #ff5722);
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                ">
                            <i class="fas fa-hotel"></i> Αναζήτηση σε Expedia
                        </button>
                        <div style="
                            font-size: 11px;
                            color: #555;
                            background: #f9f9f9;
                            padding: 6px 8px;
                            border-radius: 4px;
                            margin-top: 5px;
                            border-left: 3px solid #ff9800;
                        ">
                            <i class="fas fa-info-circle" style="color: #ff9800; margin-right: 4px;"></i>
                            Αν κλείσεις μέσω EXPEDIA, η εφαρμογή μας θα πάρει μια μικρή προμήθεια
                            <strong>χωρίς επιπλέον κόστος για σένα</strong>.
                        </div>
                    </div>

                    <!-- TICKETSELLER -->
                    <div style="width: 100%; max-width: 320px;">
                        <button class="btn" onclick="window.open('https://ticketseller.gr/el/home-2/', '_blank')"
                                style="
                                    width: 100%;
                                    padding: 12px 15px;
                                    font-size: 15px;
                                    font-weight: 600;
                                    background: linear-gradient(135deg, #4CAF50, #2E7D32);
                                    color: white;
                                    border: none;
                                    border-radius: 8px;
                                ">
                            <i class="fas fa-ticket-alt"></i> Αναζήτηση σε TicketSeller
                        </button>
                        <div style="
                            font-size: 11px;
                            color: #555;
                            background: #f9f9f9;
                            padding: 6px 8px;
                            border-radius: 4px;
                            margin-top: 5px;
                            border-left: 3px solid #4CAF50;
                        ">
                            <i class="fas fa-percentage" style="color: #4CAF50; margin-right: 4px;"></i>
                            Αν κλείσεις μέσω <strong>TicketSeller</strong>, έχεις έκπτωση!
                            <br>
                            <small>Στείλε email στο: <strong>takethekids2@gmail.com</strong></small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MEDIA QUERY ΓΙΑ DESKTOP -->
            <style>
                @media (min-width: 768px) {
                    .hotel-buttons-container {
                        flex-direction: row !important;
                        justify-content: center !important;
                        flex-wrap: wrap !important;
                        gap: 15px !important;
                    }

                    .hotel-buttons-container > div {
                        width: auto !important;
                        min-width: 250px !important;
                        max-width: 280px !important;
                        margin: 0 !important;
                    }
                }
            </style>

            <!-- ΣΥΝΕΧΕΙΑ -->
            <div style="text-align: center; margin-top: 15px;">
                <button class="btn btn-primary" onclick="showStep('activities')"
                        style="padding: 10px 25px; font-size: 14px; border-radius: 8px;">
                    <i class="fas fa-arrow-right"></i> Συνέχεια στις Δραστηριότητες
                </button>
            </div>
        </div>
    `;
}

// ==================== STEP 4: ACTIVITIES ====================
export function getActivitiesStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-ticket-alt"></i> Οικογενειακές Δραστηριότητες</h1>
            <p class="card-subtitle">${state.selectedDestination ? 'Επιλέξτε δραστηριότητες για: ' + state.selectedDestination : 'Πρώτα επιλέξτε προορισμό'}</p>

            ${!state.selectedDestination ? `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Δεν έχετε επιλέξει προορισμό. Παρακαλώ επιστρέψτε στο βήμα 1.
                    <button class="btn btn-primary" onclick="showStep('destination')" style="margin-top: 10px;">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            ` : `
             <!-- Family Members Section -->
<div class="card" style="background: #f8f9fa; margin-bottom: 30px;">
    <h3><i class="fas fa-users"></i> Τα Μέλη Της Οικογένειας</h3>

    <div id="family-members-container" class="family-member-container">
        ${state.familyMembers.map((member, index) => `
            <div class="family-member">
                <!-- Πρώτη γραμμή: Όνομα και Εικονίδιο -->
                <div class="family-member-row">
                    <div class="family-member-icon">
                        ${index === 0 ? '👨' : index === 1 ? '👩' : '🧒'}
                    </div>
                    <input type="text"
                           class="form-control family-input"
                           value="${member.name}"
                           onchange="updateFamilyMemberName(${index}, this.value)"
                           placeholder="Όνομα">
                </div>

                <!-- Δεύτερη γραμμή: Ηλικία και Κουμπί Διαγραφής -->
                <div class="family-member-row">
                    <div class="family-age-container">
                        <input type="number"
                               class="form-control family-input"
                               value="${member.age}"
                               min="0"
                               max="120"
                               placeholder="Ηλικία"
                               onchange="updateFamilyMemberAge(${index}, this.value)">
                        <span class="age-label">ετών</span>
                    </div>
                    <button class="btn btn-outline family-delete-btn"
                            onclick="removeFamilyMember(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('')}
    </div>

    <!-- Κουμπιά Δράσης -->
    <div class="family-actions">
        <div class="family-add-buttons">
            <button class="btn btn-outline" onclick="addFamilyMember('adult')">
                <i class="fas fa-plus"></i> Προσθήκη Ενήλικα
            </button>
            <button class="btn btn-outline" onclick="addFamilyMember('child')">
                <i class="fas fa-plus"></i> Προσθήκη Παιδιού
            </button>
        </div>
        <button class="btn btn-primary family-update-btn" onclick="updateFamilyMembers()">
            <i class="fas fa-save"></i> Ενημέρωση Οικογένειας
        </button>
    </div>
</div>
              <div style="margin: 20px 0; padding: 12px; background: linear-gradient(to bottom, #f0f9ff, #ffffff); border-radius: 10px; border: 2px solid #E0F2FE; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">

    <!-- ΚΕΦΑΛΙ -->
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
        <div style="font-size: 24px; color: #4F46E5; background: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            💡
        </div>
        <h4 style="margin: 0; color: #1A202C; font-size: 16px;">
            <i class="fas fa-info-circle" style="color: #4F46E5; margin-right: 6px;"></i>
            Σημαντικές Πληροφορίες
        </h4>
    </div>

    <!-- ΠΕΡΙΕΧΟΜΕΝΟ -->
    <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #E2E8F0;">

        <!-- ΠΑΡΑΓΡΑΦΟΣ 1 -->
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #e2e8f0;">
            <div style="color: #4F46E5; font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                📊 Οι τιμές είναι ενδεικτικές
            </div>
            <div style="color: #4A5568; font-size: 14px; line-height: 1.5;">
                Μπορεί να υπάρχουν διαφορές λόγω εποχικότητας, προσφορών ή ηλικιακών κατηγοριών.
            </div>
        </div>

        <!-- ΠΑΡΑΓΡΑΦΟΣ 2 -->
        <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px dashed #e2e8f0;">
            <div style="color: #10B981; font-weight: bold; font-size: 14px; margin-bottom: 4px;">
                ✅ Προτείνουμε
            </div>
            <div style="color: #4A5568; font-size: 14px; line-height: 1.5;">
                Να ελέγχετε πάντα τις <strong>τελικές τιμές</strong> στα επίσημα site ή στα ταμεία πριν από κράτηση/αγορά.
            </div>
        </div>

        <!-- ΠΑΡΑΓΡΑΦΟΣ 3 -->
        <div style="color: #F59E0B; font-size: 13px; line-height: 1.5;">
            <i class="fas fa-lightbulb" style="margin-right: 6px;"></i>
            <strong>Χρήσιμη συμβουλή:</strong> Κλείστε online για καλύτερες τιμές!
        </div>

    </div>
</div>
                <!-- Activities Container -->
                <div id="activities-list" class="grid grid-3">
                    <div class="loading" style="text-align: center; padding: 40px; grid-column: 1 / -1;">
                        <i class="fas fa-spinner fa-spin fa-2x"></i>
                        <p>Φόρτωση δραστηριοτήτων...</p>
                    </div>
                </div>

                <!-- Smart Combo Button και Καθαρισμός -->
                <div style="display: flex; flex-direction: column; gap: 12px; margin: 25px 0;">

    <!-- Κουμπί 1: Έξυπνο Combo -->
    <button class="btn btn-accent" onclick="calculateSmartCombos()"
            id="smart-combo-btn"
            style="
                padding: 16px 20px;
                font-size: 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border: none;
                border-radius: 10px;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                white-space: nowrap;
            ">
        <i class="fas fa-calculator"></i>
        <span>🧮 Έξυπνο Combo</span>
    </button>

    <!-- Κουμπί 2: Καθαρισμός -->
    <button class="btn btn-outline" onclick="clearSelectedActivities()"
            style="
                padding: 16px 20px;
                font-size: 16px;
                border: 2px solid var(--danger);
                color: var(--danger);
                background: transparent;
                border-radius: 10px;
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                white-space: nowrap;
            ">
        <i class="fas fa-trash-alt"></i>
        <span>Καθαρισμός Επιλογών</span>
    </button>

</div>

                <!-- Total Cost -->
                <div class="card" style="background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; text-align: center; border: none;">
                    <h3 style="color: white; margin-bottom: 10px;">Συνολικό Κόστος</h3>
                    <h1 id="activities-total" style="font-size: 48px; margin: 0;">0€</h1>
                    <p style="opacity: 0.9;">Για ${state.familyMembers.length} άτομα</p>
                </div>

                <!-- Next Button -->
                <div style="text-align: center; margin-top: 40px;">
                    <button class="btn btn-primary" onclick="showStep('summary')" style="padding: 18px 50px; font-size: 18px;">
                        <i class="fas fa-arrow-right"></i> Συνέχεια στο Πρόγραμμα
                    </button>
                </div>
            `}
        </div>
    `;
}

// ==================== STEP 5: SUMMARY ====================
export function getSummaryStepHTML() {
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
                <!-- Επιλογή Ημερών + Κουμπί Δημιουργίας (ΣΕ ΜΙΑ ΓΡΑΜΜΗ) -->
                <div class="card" style="margin: 30px 0; background: #f0f7ff; border-left: 4px solid var(--primary);">
                    <h3><i class="fas fa-calendar-alt"></i> Διάρκεια Ταξιδιού</h3>
                    <p style="color: var(--gray); margin-bottom: 15px;">
                        Επιλέξτε πόσες μέρες θα διαρκέσει το ταξίδι σας. Το πρόγραμμα δημιουργείται αυτόματα.
                    </p>

                    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <!-- Dropdown Ημερών -->
                        <select class="form-control" id="program-days" style="flex: 1; min-width: 200px; font-size: 16px; padding: 12px;">
                            <option value="0" ${state.selectedDays === 0 ? 'selected disabled' : 'disabled'}>-- Επιλέξτε μέρες --</option>
                            <option value="2" ${state.selectedDays === 2 ? 'selected' : ''}>2 μέρες</option>
                            <option value="3" ${state.selectedDays === 3 ? 'selected' : ''}>3 μέρες</option>
                            <option value="4" ${state.selectedDays === 4 ? 'selected' : ''}>4 μέρες</option>
                            <option value="5" ${state.selectedDays === 5 ? 'selected' : ''}>5 μέρες</option>
                            <option value="7" ${state.selectedDays === 7 ? 'selected' : ''}>7 μέρες</option>
                            <option value="10" ${state.selectedDays === 10 ? 'selected' : ''}>10 μέρες</option>
                            <option value="14" ${state.selectedDays === 14 ? 'selected' : ''}>14 μέρες</option>
                        </select>

                        <!-- ΚΟΥΜΠΙ ΔΗΜΙΟΥΡΓΙΑΣ -->
                        <button onclick="generateGeographicProgram()" class="btn btn-primary" style="flex: 1; min-width: 200px; padding: 12px 25px; font-size: 16px;">
                            <i class="fas fa-map-marked-alt"></i> ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ
                        </button>
                    </div>

                    <!-- ΜΟΝΟ ΜΙΚΡΟ STATUS -->
                    <div id="days-display" style="margin-top: 10px; font-size: 14px; color: var(--success); font-weight: bold;">
                        ${state.selectedDays > 0 ? '✅ ' + state.selectedDays + ' μέρες επιλέχθηκαν' : '⚠️ Επιλέξτε πρώτα μέρες'}
                    </div>
                </div>

                <!-- Geographic Program - ΤΩΡΑ ΕΜΦΑΝΙΖΕΤΑΙ ΕΔΩ ΚΑΤΩ -->
                <div class="card" id="geographic-program-section" style="margin-top: 30px; display: none;">
                    <h3><i class="fas fa-route"></i> Γεωγραφικό Πρόγραμμα</h3>

                    <!-- ΕΔΩ ΘΑ ΕΜΦΑΝΙΖΕΤΑΙ ΤΟ ΔΗΜΙΟΥΡΓΗΜΕΝΟ ΠΡΟΓΡΑΜΜΑ -->
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
                                    Πατήστε "ΔΗΜΙΟΥΡΓΙΑ ΠΡΟΓΡΑΜΜΑΤΟΣ" παραπάνω<br>
                                    για να ομαδοποιήσουμε τις ${state.selectedActivities.length} δραστηριότητες<br>
                                    σε ${state.selectedDays} μέρες με βάση την τοποθεσία τους
                                </p>
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

// ==================== STEP 6: MAP (FIXED) ====================
export function getMapStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-map"></i> Διαδραστικός Χάρτης</h1>
            <p class="card-subtitle">${state.selectedDestination ? 'Χάρτης για: ' + state.selectedDestination : 'Δεν έχετε επιλέξει προορισμό'}</p>

            ${!state.selectedDestination ? `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Δεν έχετε επιλέξει προορισμό. Παρακαλώ επιστρέψτε στο βήμα 1.
                    <button class="btn btn-primary" onclick="showStep('destination')" style="margin-top: 10px;">
                        <i class="fas fa-arrow-left"></i> Επιστροφή
                    </button>
                </div>
            ` : `
                <!-- ΧΑΡΤΗΣ -->
                <div id="map-container" style="height: 600px; border-radius: var(--radius-md); overflow: hidden; margin-bottom: 20px; border: 2px solid var(--border);">
                    <div id="travel-map" style="height: 100%; width: 100%;"></div>
                </div>

                <!-- ΚΟΥΜΠΙΑ ΕΛΕΓΧΟΥ -->
                <div style="display: flex; gap: 15px; margin-bottom: 30px; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="showActivityMap()">
                        <i class="fas fa-map-pin"></i> Προβολή Σημείων
                    </button>

                    <button class="btn btn-accent" onclick="showGroupedActivitiesOnMap()">
                        <i class="fas fa-layer-group"></i> Ομαδοποίηση
                    </button>

                    <button class="btn btn-secondary" onclick="clearMapPoints()">
                        <i class="fas fa-trash"></i> Καθαρισμός
                    </button>

                    <button class="btn btn-outline" onclick="showRouteBetweenPoints()">
                        <i class="fas fa-route"></i> Διαδρομή
                    </button>

                    <div id="map-status" style="flex: 1; padding: 10px; background: #f0f7ff; border-radius: 6px; font-size: 13px;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Ετοιμότητα:</strong> Πατήστε "Προβολή Σημείων" για τις δραστηριότητες σας
                    </div>
                </div>

                <!-- CUSTOM MAP POINTS SECTION -->
                <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);">
                    <h4 style="margin: 0 0 15px 0; color: var(--dark);">
                        <i class="fas fa-map-marker-alt"></i> Προσθήκη Προσωπικών Σημείων
                    </h4>
                    <p style="color: var(--gray); margin-bottom: 15px; font-size: 14px;">
                        Προσθέστε ξενοδοχείο, εστιατόρια ή άλλα σημεία ενδιαφέροντος στον χάρτη
                    </p>

                    <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap;">
                        <input type="text"
                               id="custom-point-name"
                               placeholder="π.χ. Hotel Grande, Eiffel Tower"
                               style="flex: 1; min-width: 250px; padding: 10px 15px; border: 2px solid var(--primary-light); border-radius: 8px; font-size: 14px;"
                               onkeypress="if(event.key === 'Enter') addCustomMapPoint()">
                        <button onclick="addCustomMapPoint()" class="btn btn-primary">
                            <i class="fas fa-plus-circle"></i> Προσθήκη
                        </button>
                    </div>

                    <div id="custom-points-status" style="display: none; padding: 8px; background: #fff; border-radius: 6px; font-size: 13px; margin-bottom: 10px;">
                        <i class="fas fa-spinner fa-spin"></i>
                        <span id="custom-points-status-text">Αναζήτηση τοποθεσίας...</span>
                    </div>

                    <!-- List of custom points -->
                    <div id="custom-points-list" style="max-height: 200px; overflow-y: auto;">
                        ${(state.customPoints || []).length > 0 ? state.customPoints.map((point, index) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: white; border-radius: 6px; margin-bottom: 8px; border-left: 4px solid var(--accent);">
                                <div>
                                    <i class="fas fa-map-marker-alt" style="color: var(--accent); margin-right: 8px;"></i>
                                    <strong>${point.name}</strong>
                                    <span style="color: var(--gray); font-size: 12px; margin-left: 10px;">
                                        (${point.location.lat.toFixed(4)}, ${point.location.lng.toFixed(4)})
                                    </span>
                                </div>
                                <button onclick="removeCustomPoint(${index})"
                                        class="btn btn-outline"
                                        style="padding: 4px 8px; font-size: 12px;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        `).join('') : `
                            <div style="padding: 15px; text-align: center; color: var(--gray); font-size: 13px; background: white; border-radius: 6px; border: 2px dashed #ddd;">
                                <i class="fas fa-map-marked-alt" style="font-size: 24px; opacity: 0.5; margin-bottom: 8px; display: block;"></i>
                                Δεν έχετε προσθέσει προσωπικά σημεία ακόμα
                            </div>
                        `}
                    </div>
                </div>

                <!-- 🔴 ΒΗΜΑ 2: ΦΙΛΤΡΟ ΗΜΕΡΩΝ (ΕΜΦΑΝΙΖΕΤΑΙ ΜΟΝΟ ΑΝ ΥΠΑΡΧΕΙ ΠΡΟΓΡΑΜΜΑ) -->
                ${state.geographicProgram ? `
                <div id="day-filter-container" class="card" style="margin-bottom: 20px; background: #f8f9fa;">
                    <h4 style="margin: 0 0 15px 0; color: var(--dark);">
                        <i class="fas fa-calendar-alt"></i> Εμφάνιση ανά Ημέρα
                    </h4>
                    <p style="color: var(--gray); margin-bottom: 12px; font-size: 14px;">
                        Επιλέξτε ποιες μέρες του προγράμματός σας να εμφανιστούν στον χάρτη:
                    </p>

                    <div id="day-checkboxes" style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; cursor: pointer; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid #ddd;">
                            <input type="checkbox" class="day-checkbox" value="all" checked
                                   onchange="updateMapDayFilter(this)"
                                   style="margin-right: 8px;">
                            <span style="font-weight: bold; color: var(--primary);">Όλες οι μέρες</span>
                        </label>

                        ${Array.from({ length: state.geographicProgram.totalDays }, (_, i) => i + 1).map(day => `
                            <label style="display: flex; align-items: center; cursor: pointer; padding: 8px 12px; background: white; border-radius: 6px; border: 1px solid ${getDayColor(day)};">
                                <input type="checkbox" class="day-checkbox" value="day${day}"
                                       onchange="updateMapDayFilter(this)"
                                       style="margin-right: 8px;">
                                <span style="font-weight: bold; color: ${getDayColor(day)};">
                                    Μέρα ${day}
                                </span>
                                <span style="margin-left: 8px; font-size: 12px; color: var(--gray);">
                                    (${state.geographicProgram.days[day-1]?.totalActivities || 0} δραστηριότητες)
                                </span>
                            </label>
                        `).join('')}
                    </div>

                    <div style="display: flex; gap: 10px;">
                        <button onclick="selectAllDays()" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;">
                            <i class="fas fa-check-square"></i> Επιλογή όλων
                        </button>
                        <button onclick="deselectAllDays()" class="btn btn-outline" style="padding: 6px 12px; font-size: 13px;">
                            <i class="fas fa-square"></i> Αποεπιλογή όλων
                        </button>
                        <button onclick="applyDayFilter()" class="btn btn-primary" style="padding: 6px 12px; font-size: 13px;">
                            <i class="fas fa-filter"></i> Εφαρμογή φίλτρου
                        </button>
                    </div>

                    <div id="day-filter-status" style="margin-top: 10px; padding: 8px; background: #e0f2fe; border-radius: 6px; font-size: 12px; display: none;">
                        <i class="fas fa-sync-alt fa-spin"></i>
                        <span>Ενημέρωση χάρτη...</span>
                    </div>
                </div>
                ` : `
                <!-- Αν δεν υπάρχει πρόγραμμα, εμφάνισε απλή πληροφορία -->
                <div class="alert alert-info" style="margin-bottom: 20px;">
                    <i class="fas fa-info-circle"></i>
                    <strong>Πληροφορία:</strong> Δεν έχετε δημιουργήσει πρόγραμμα στο βήμα 5.
                    Θα δείτε όλες τις δραστηριότητες μαζί στον χάρτη.
                </div>
                `}

<!-- ΟΔΗΓΙΕΣ ΧΡΗΣΗΣ ΧΑΡΤΗ -->
<div class="map-instructions-card" id="map-instructions-card">
    <div class="map-instructions-header">
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-graduation-cap"></i>
            <h4 style="margin: 0;">Οδηγίες Χρήσης Χάρτη</h4>
        </div>
        <button onclick="closeMapInstructions()"
                style="background: none; border: none; color: #666; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; transition: color 0.2s;"
                onmouseover="this.style.color='#EF4444'"
                onmouseout="this.style.color='#666'"
                title="Κλείσιμο οδηγιών">
            <i class="fas fa-times"></i>
        </button>
    </div>

    <div class="map-instructions-content">
        <p><i class="fas fa-map-pin" style="color: #4F46E5;"></i>
           <strong>1. Πατήστε "Προβολή Σημείων"</strong> για να φορτώσετε τις δραστηριότητες σας</p>

        <p><i class="fas fa-mouse-pointer" style="color: #10B981;"></i>
           <strong>2. Κάντε κλικ σε 2 πινέζες</strong> για επιλογή
           <span class="step-from">ΑΠΟ</span> και <span class="step-to">ΠΡΟΣ</span></p>

        <p><i class="fas fa-route" style="color: #F59E0B;"></i>
           <strong>3. Η διαδρομή θα σχεδιαστεί αυτόματα</strong> με απόσταση και χρόνους</p>

        <p><i class="fas fa-directions" style="color: #EF4444;"></i>
           <strong>4. Πατήστε στο κουμπί:</strong> Διαδρομή για Google Maps οδηγίες</p>
    </div>

    <div class="map-instructions-tip">
        <i class="fas fa-lightbulb"></i>
        <span>Οι πινέζες γίνονται <span class="step-from">πράσινες</span> για ΑΠΟ και
              <span class="step-to">κόκκινες</span> για ΠΡΟΣ!</span>
    </div>
</div>

                <!-- ΕΠΙΣΤΡΟΦΗ -->
                <div style="text-align: center; margin-top: 30px;">
                    <button class="btn btn-outline" onclick="showStep('summary')">
                        <i class="fas fa-arrow-left"></i> Επιστροφή στο Πρόγραμμα
                    </button>
                </div>
            `}
        </div>
    `;
}
