// ==================== STEP 2: FLIGHT ====================
function getFlightStepHTML() {
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
            
            <div style="text-align: center; margin: 40px 0;">
                <h3 style="margin-bottom: 20px; color: var(--dark);">🔍 Αναζήτηση στις πλατφόρμες:</h3>
                
                <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                    <a href="https://www.google.com/flights" target="_blank" class="btn btn-primary" style="min-width: 200px;">
                        <i class="fas fa-globe"></i> Google Flights
                    </a>
                    
                    <a href="https://www.skyscanner.net" target="_blank" class="btn btn-secondary" style="min-width: 200px;">
                        <i class="fas fa-plane-departure"></i> Skyscanner
                    </a>
                    
                    <a href="https://www.kayak.com" target="_blank" class="btn btn-accent" style="min-width: 200px;">
                        <i class="fas fa-search"></i> Kayak
                    </a>
                </div>
            </div>
            
            <div class="alert alert-info" style="background: #e3f2fd; padding: 15px; border-radius: var(--radius-md); border-left: 4px solid #2196f3;">
                <i class="fas fa-info-circle"></i>
                <strong>Συμβουλή:</strong> Συγκρίνετε τιμές σε πολλαπλές πλατφόρμες για την καλύτερη προσφορά.
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <button class="btn btn-primary" onclick="showStep('hotel')">
                    <i class="fas fa-arrow-right"></i> Συνέχεια στα Ξενοδοχεία
                </button>
            </div>
        </div>
    `;
}

// ==================== STEP 3: HOTEL ====================
function getHotelStepHTML() {
    return `
        <div class="card">
            <h1 class="card-title"><i class="fas fa-hotel"></i> Αναζήτηση Ξενοδοχείων</h1>
            <p class="card-subtitle">Βρείτε το τέλειο ξενοδοχείο για την οικογένειά σας</p>
            
            <div class="grid grid-3">
                <div class="form-group">
                    <label class="form-label">Προορισμός</label>
                    <input type="text" class="form-control" id="hotel-destination" 
                           value="${state.selectedDestination || ''}">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Check-in</label>
                    <input type="date" class="form-control" id="hotel-checkin">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Check-out</label>
                    <input type="date" class="form-control" id="hotel-checkout">
                </div>
            </div>
            
            <div class="grid grid-3">
                <div class="form-group">
                    <label class="form-label">Ενήλικοι</label>
                    <select class="form-control" id="hotel-adults">
                        <option value="1">1</option>
                        <option value="2" selected>2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Παιδιά</label>
                    <select class="form-control" id="hotel-children">
                        <option value="0">0</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Δωμάτια</label>
                    <select class="form-control" id="hotel-rooms">
                        <option value="1" selected>1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                    </select>
                </div>
            </div>
                        
            <!-- Προειδοποίηση για πλατφόρμες -->
            <div class="alert alert-info" style="
                background: #fff3cd; 
                border-left: 4px solid #ffc107; 
                padding: 15px; 
                margin: 20px 0; 
                border-radius: 8px;
                text-align: left;
            ">
                <i class="fas fa-external-link-alt" style="color: #ffc107; margin-right: 10px;"></i>
                <strong>Σημείωση:</strong> Η αναζήτηση θα σας ανακατευθύνει στις πλατφόρμες 
                <strong>Booking.com</strong> ή <strong>Expedia</strong>
            </div>

            <!-- Κουμπιά αναζήτησης -->
            <div style="text-align: center; margin: 40px 0; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">

                <!-- ========== 1. BOOKING.COM ========== -->
                <button class="btn btn-primary" onclick="searchBookingHotels()" 
                        style="min-width: 280px; padding: 18px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.2);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(33, 150, 243, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(33, 150, 243, 0.2)';">
                    <i class="fas fa-search"></i> Αναζήτηση σε Booking.com
                </button>

                <!-- ========== 2. EXPEDIA ========== -->
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <!-- ΚΟΥΜΠΙ -->
                    <button class="btn btn-accent" onclick="searchExpediaHotels()" 
                            style="min-width: 280px; padding: 18px; background: linear-gradient(135deg, #ff9800, #ff5722); border: none; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(255, 87, 34, 0.2); margin-bottom: 8px;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(255, 87, 34, 0.5)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 87, 34, 0.2)';">
                        <i class="fas fa-hotel"></i> Αναζήτηση σε Expedia
                    </button>
                    
                    <!-- ΠΛΑΙΣΙΟ ΜΗΝΥΜΑΤΟΣ -->
                    <div style="font-size: 11px; color: #555; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #ff9800; max-width: 280px; text-align: center; line-height: 1.3;">
                        <i class="fas fa-info-circle" style="color: #ff9800; margin-right: 5px;"></i>
                        Αν κλείσεις μέσω EXPEDIA, η εφαρμογή μας θα πάρει μια μικρή προμήθεια 
                        <strong>χωρίς επιπλέον κόστος για σένα</strong>.
                    </div>
                </div>

                <!-- ========== 3. TICKETSELLER.GR ========== -->
                <div style="display: flex; flex-direction: column; align-items: center;">
                    <!-- ΚΟΥΜΠΙ -->
                    <button class="btn" onclick="window.open('https://ticketseller.gr/el/home-2/', '_blank')" 
                            style="min-width: 280px; padding: 18px; background: linear-gradient(135deg, #4CAF50, #2E7D32); color: white; border: none; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2); margin-bottom: 8px;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(76, 175, 80, 0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(76, 175, 80, 0.2)';">
                        <i class="fas fa-ticket-alt"></i> TicketSeller.gr
                    </button>
                    
                    <!-- ΠΛΑΙΣΙΟ ΜΗΝΥΜΑΤΟΣ -->
                    <div style="font-size: 11px; color: #555; background: #f9f9f9; padding: 8px 12px; border-radius: 6px; border-left: 3px solid #4CAF50; max-width: 280px; text-align: center; line-height: 1.3;">
                        <i class="fas fa-percentage" style="color: #4CAF50; margin-right: 5px;"></i>
                        Αν κλείσεις μέσω <strong>TicketSeller</strong>, έχεις έκπτωση!
                        <br>
                        <small>Στείλε email στο: <strong>takethekids2@gmail.com</strong></small>
                    </div>
                </div>

            </div>
            
            <div style="text-align: center; margin-top: 40px;">
                <button class="btn btn-primary" onclick="showStep('activities')">
                    <i class="fas fa-arrow-right"></i> Συνέχεια στις Δραστηριότητες
                </button>
            </div>
        </div>
    `;
}

function setupHotelStep() {
    const checkin = document.getElementById('hotel-checkin');
    const checkout = document.getElementById('hotel-checkout');
    const today = new Date();
    
    // Μόνο ορισμός minimum date (σήμερα)
    checkin.min = today.toISOString().split('T')[0];
    checkout.min = today.toISOString().split('T')[0];
    
    // ΚΑΝΕΝΑ default value - ΤΑ ΠΕΔΙΑ ΜΕΝΟΥΝ ΚΕΝΑ
    
    // Αυτόματη ενημέρωση checkout όταν αλλάξει το checkin
    checkin.addEventListener('change', function() {
        if (this.value) {
            checkout.min = this.value; // Το checkout πρέπει να είναι μετά το checkin
        }
    });
}
