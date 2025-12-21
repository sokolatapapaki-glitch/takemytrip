// ==================== GLOBAL VARIABLES ====================
let selectedDestinationName = "";
let selectedDaysStay = 0;
let selectedBudget = 0;
let familyMembers = [
    { name: "Πατέρας", age: 42 },
    { name: "Μητέρα", age: 40 }
];
let selectedMarkersForRoute = [];
let currentRoutePolyline = null;
let customPoints = JSON.parse(localStorage.getItem('travel_custom_points')) || [];

// ==================== DESTINATIONS DATA ====================
const destinations = [
    {name:"Βιέννη", dist:2, weather:"Πιο κρύο", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πολιτισμός", "Πόλη"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό", "ΑΜΕΑ", "Ηλικιωμένοι"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Η αυτοκρατορική πόλη με τα παλάτια, τους κήπους και τα νόστιμα schnitzel."},
    {name:"Παρίσι", dist:3, weather:"Ίδια", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πολιτισμός", "Πόλη"], costLevel:"Ακριβό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Η ρομαντική πόλη του φωτός με τον Πύργο του Άιφελ και τα όμορφα καφέ."},
    {name:"Ρώμη", dist:2, weather:"Πιο ζεστό", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πολιτισμός", "Πόλη"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Η αιώνια πόλη με το Κολοσσαίο, την Ρωμαϊκή Αγορά και υπέροχη ιταλική κουζίνα."},
    {name:"Λονδίνο", dist:4, weather:"Πιο κρύο", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Ακριβό", suitableFor:["Νεογέννητα", "Παιδικό", "ΑΜΕΑ"], bestSeason:["Άνοιξη", "Καλοκαίρι"], desc:"Η μεγαλούπολη με το Μπιγκ Μπεν, το London Eye και τα ιστορικά μουσεία."},
    {name:"Άμστερνταμ", dist:3, weather:"Ίδια", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Καλοκαίρι"], desc:"Η πόλη των καναλιών, των ποδηλάτων και των όμορφων γεφυρών."},
    {name:"Βουδαπέστη", dist:2, weather:"Πιο κρύο", themeparks:"Όχι", christmas:"Ναι", vacationType:["Πολιτισμός", "Πόλη"], costLevel:"Οικονομικό", suitableFor:["Νεογέννητα", "Παιδικό", "Ηλικιωμένοι"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Η όμορφη πόλη του Δούναβη με τα ιστορικά λουτρά και κάστρα."},
    {name:"Πράγα", dist:3, weather:"Πιο κρύο", themeparks:"Όχι", christmas:"Ναι", vacationType:["Πολιτισμός", "Πόλη"], costLevel:"Οικονομικό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Παραμυθένια πόλη με τη Γέφυρα του Καρόλου και αστρονομικό ρολόι."},
    {name:"Βερολίνο", dist:3, weather:"Πιο κρύο", themeparks:"Όχι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό", "ΑΜΕΑ"], bestSeason:["Άνοιξη", "Καλοκαίρι"], desc:"Πόλη με πλούσια ιστορία, μουσεία και μοντέρνα αρχιτεκτονική."},
    {name:"Μόναχο", dist:2, weather:"Πιο κρύο", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Βαυαρική πρωτεύουσα, κοντά στις Άλπεις, με το BMW World."},
    {name:"Κολωνία", dist:3, weather:"Πιο κρύο", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Καλοκαίρι"], desc:"Μεγάλος καθεδρικός ναός, σοκολάτα και Ρηνανία."},
    {name:"Βαρκελώνη", dist:3, weather:"Πιο ζεστό", themeparks:"Ναι", christmas:"Όχι", vacationType:["Θάλασσα", "Πόλη", "Πολιτισμός"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Καλοκαίρι", "Άνοιξη"], desc:"Γκαουντί, παραλίες, και η Sagrada Familia."},
    {name:"Μαδρίτη", dist:4, weather:"Ίδια", themeparks:"Ναι", christmas:"Όχι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Πρωτεύουσα με πλούσια πολιτιστική ζωή και Πάρκο Ρετίρο."},
    {name:"Λισαβόνα", dist:4, weather:"Πιο ζεστό", themeparks:"Όχι", christmas:"Όχι", vacationType:["Θάλασσα", "Πόλη"], costLevel:"Οικονομικό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Καλοκαίρι", "Άνοιξη"], desc:"Πορτογαλική πρωτεύουσα με γραφικά τελεφερίκ και όμορφα ακρωτήρια."},
    {name:"Δουβλίνο", dist:5, weather:"Πιο κρύο", themeparks:"Όχι", christmas:"Όχι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Ακριβό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Καλοκαίρι", "Άνοιξη"], desc:"Φιλόξενη πόλη με παμπ, κάστρα και το Βιβλίο του Kells."},
    {name:"Εδιμβούργο", dist:5, weather:"Πιο κρύο", themeparks:"Όχι", christmas:"Όχι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Ακριβό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Καλοκαίρι", "Άνοιξη"], desc:"Σκωτσέζικη πρωτεύουσα με κάστρο και ιστορικό κέντρο."},
    {name:"Ζυρίχη", dist:2, weather:"Χιόνια", themeparks:"Όχι", christmas:"Ναι", vacationType:["Φυσική Ομορφιά", "Πόλη"], costLevel:"Ακριβό", suitableFor:["Νεογέννητα", "Παιδικό", "Ηλικιωμένοι"], bestSeason:["Χειμώνας", "Καλοκαίρι"], desc:"Ελβετική πόλη με λίμνη, σοκολατοποιίες και κοντινά χιονοδρομικά."},
    {name:"Γενεύη", dist:2, weather:"Χιόνια", themeparks:"Όχι", christmas:"Ναι", vacationType:["Πόλη", "Φυσική Ομορφιά"], costLevel:"Ακριβό", suitableFor:["Νεογέννητα", "Παιδικό", "Ηλικιωμένοι"], bestSeason:["Χειμώνας", "Καλοκαίρι"], desc:"Διεθνής πόλη, λίμνη Λεμάν και κοντινά βουνά."},
    {name:"Κοπεγχάγη", dist:4, weather:"Πιο κρύο", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Ακριβό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Καλοκαίρι", "Άνοιξη"], desc:"Δανέζικη πόλη, πάρκο Τίβολι και η Μικρή Γοργόνα."},
    {name:"Στοκχόλμη", dist:5, weather:"Πιο κρύο", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Ακριβό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Καλοκαίρι", "Άνοιξη"], desc:"Πρωτεύουσα της Σουηδίας, νησιά και το μουσείο ABBA."},
    {name:"Βουκουρέστι", dist:2, weather:"Πιο κρύο", themeparks:"Όχι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Οικονομικό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Ρουμανική πρωτεύουσα, με το Παλάτι του Κοινοβουλίου."},
    {name:"Όσλο", dist:4, weather:"Πιο κρύο", themeparks:"Όχι", christmas:"Ναι", vacationType:["Φυσική Ομορφιά", "Πόλη"], costLevel:"Ακριβό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Καλοκαίρι", "Άνοιξη"], desc:"Νορβηγική πρωτεύουσα, φιόρδ και μουσεία Viking."},
    {name:"Μιλάνο", dist:2, weather:"Ίδια", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Πρωτεύουσα της μόδας με τον εντυπωσιακό Ντουόμο."},
    {name:"Φλωρεντία", dist:2, weather:"Ίδια", themeparks:"Όχι", christmas:"Ναι", vacationType:["Πολιτισμός", "Πόλη"], costLevel:"Μέτριο", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Η καρδιά της Αναγέννησης, τέχνη και αρχιτεκτονική."},
    {name:"Κωνσταντινούπολη", dist:2, weather:"Ίδια", themeparks:"Ναι", christmas:"Όχι", vacationType:["Πολιτισμός", "Πόλη"], costLevel:"Οικονομικό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Γέφυρα μεταξύ Ευρώπης και Ασίας, Αγία Σοφία και παζάρια."},
    {name:"Σόφια", dist:1, weather:"Πιο κρύο", themeparks:"Όχι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Οικονομικό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Φθινόπωρο"], desc:"Βουλγαρική πρωτεύουσα, με τον καθεδρικό του Αλεξάνδρου Νιέφσκι."},
    {name:"Βαρσοβία", dist:3, weather:"Πιο κρύο", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Οικονομικό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Καλοκαίρι"], desc:"Η πρωτεύουσα της Πολωνίας με ιστορικό κέντρο και όμορφα πάρκα."},
    {name:"Κρακοβία", dist:2, weather:"Πιο κρύο", themeparks:"Ναι", christmas:"Ναι", vacationType:["Πόλη", "Πολιτισμός"], costLevel:"Οικονομικό", suitableFor:["Νεογέννητα", "Παιδικό"], bestSeason:["Άνοιξη", "Καλοκαίρι"], desc:"Η ιστορική πόλη με το βασιλικό κάστρο Wawel και την παλιά πόλη."}
];

// ==================== UTILITY FUNCTIONS ====================
function formatPrice(price) {
    if (price === undefined || price === null) return '-';
    if (typeof price === 'number') return price + '€';
    return price;
}

function isMobile() {
    return window.innerWidth <= 768;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
}

// ==================== STEP 1: DESTINATION SELECTION ====================
function toggleFamily(){
    const type = document.getElementById("travel-type").value;
    const familyOptions = document.getElementById("family-options");
    if (familyOptions) {
        familyOptions.style.display = (type==="Οικογένεια")?"block":"none";
    }
}

function filterDestinations(){
    const distance = document.getElementById("distance")?.value;
    const weather = document.getElementById("weather")?.value;
    const themeparks = document.getElementById("themeparks")?.value;
    const christmas = document.getElementById("christmas")?.value;
    const vacationType = document.getElementById("vacation-type")?.value;
    const costLevel = document.getElementById("cost-level")?.value;
    
    const suitabilityFilters = [];
    document.querySelectorAll('#suitability-options input[type="checkbox"]:checked').forEach(cb => {
        suitabilityFilters.push(cb.value);
    });

    const budget = document.getElementById("travel-budget")?.value;
    if (budget) {
        selectedBudget = parseInt(budget);
    }

    const filtered = destinations.filter(dest=>{
        let ok=true;
        
        if(distance && distance!==""){
            if(distance==="5") ok = ok && (dest.dist>4);
            else ok = ok && (dest.dist <= parseInt(distance));
        }
        if(weather && weather!=="") ok = ok && (dest.weather===weather);
        if(themeparks && themeparks!=="") ok = ok && (themeparks==="Ναι"?dest.themeparks==="Ναι":true);
        if(christmas && christmas!=="") ok = ok && (christmas==="Ναι"?dest.christmas==="Ναι":true);
        
        if(vacationType && vacationType!=="") ok = ok && (dest.vacationType && dest.vacationType.includes(vacationType));
        if(costLevel && costLevel!=="") ok = ok && (dest.costLevel===costLevel);
        
        if(suitabilityFilters.length > 0){
            ok = ok && suitabilityFilters.some(filter => dest.suitableFor && dest.suitableFor.includes(filter));
        }
        
        return ok;
    });

    const container = document.getElementById("destination-cards");
    if (!container) return;
    
    container.innerHTML="";
    if(filtered.length===0) {
        container.innerHTML="<p>Δεν βρέθηκαν προορισμοί με αυτά τα κριτήρια.</p>";
        return;
    }
    
    filtered.forEach(dest=>{
        const card = document.createElement("div");
        card.className="destination-card";
        card.innerHTML=`<h3>${dest.name}</h3><p>${dest.desc}</p><button onclick="selectDestination('${dest.name}')">ΣΥΝΕΧΕΙΑ ΣΤΟ ΒΗΜΑ 2</button>`;
        container.appendChild(card);
    });
}

function selectDestination(name) {
    selectedDestinationName = name;
    updateCityBackground(name);
    
    // Ενημέρωση των βημάτων 2 και 3
    const flightDestination = document.getElementById("flight-destination");
    const hotelDestination = document.getElementById("hotel-destination");
    const activitiesCity = document.getElementById("activities-city");
    
    if (flightDestination) flightDestination.textContent = name;
    if (hotelDestination) hotelDestination.textContent = name;
    if (activitiesCity) activitiesCity.textContent = name;
    
    goToStep2();
}

// ==================== FAMILY MEMBERS MANAGEMENT ====================
function addAdultMember() {
    const container = document.getElementById('family-members-list');
    if (!container) return;
    
    const adultCount = Array.from(container.querySelectorAll('.family-member-input'))
        .filter(m => m.querySelector('.member-name')?.value.includes('Ενήλικας')).length + 1;
    
    const memberDiv = document.createElement('div');
    memberDiv.className = 'family-member-input';
    memberDiv.innerHTML = `
        <span>👨</span>
        <input type="text" placeholder="Όνομα" value="${adultCount}ος Ενήλικας" class="member-name">
        <input type="number" placeholder="Ηλικία" value="" class="member-age" min="18" max="120">
        <span>ετών</span>
        <button onclick="removeFamilyMember(this)" class="remove-member-btn">×</button>
    `;
    
    container.appendChild(memberDiv);
}

function addChildMember() {
    const container = document.getElementById('family-members-list');
    if (!container) return;
    
    const childCount = Array.from(container.querySelectorAll('.family-member-input'))
        .filter(m => m.querySelector('.member-name')?.value.includes('Παιδί')).length + 1;
    
    const memberDiv = document.createElement('div');
    memberDiv.className = 'family-member-input';
    memberDiv.innerHTML = `
        <span>🧒</span>
        <input type="text" placeholder="Όνομα" value="Παιδί ${childCount}" class="member-name">
        <input type="number" placeholder="Ηλικία" value="" class="member-age" min="6" max="17">
        <span>ετών</span>
        <button onclick="removeFamilyMember(this)" class="remove-member-btn">×</button>
    `;
    
    container.appendChild(memberDiv);
}

function addBabyMember() {
    const container = document.getElementById('family-members-list');
    if (!container) return;
    
    const babyCount = Array.from(container.querySelectorAll('.family-member-input'))
        .filter(m => m.querySelector('.member-name')?.value.includes('Μωρό')).length + 1;
    
    const memberDiv = document.createElement('div');
    memberDiv.className = 'family-member-input';
    memberDiv.innerHTML = `
        <span>👶</span>
        <input type="text" placeholder="Όνομα" value="Μωρό ${babyCount}" class="member-name">
        <input type="number" placeholder="Ηλικία" value="" class="member-age" min="0" max="5">
        <span>ετών</span>
        <button onclick="removeFamilyMember(this)" class="remove-member-btn">×</button>
    `;
    
    container.appendChild(memberDiv);
}

function removeFamilyMember(button) {
    if (button && button.parentElement) {
        button.parentElement.remove();
    }
}

function updateFamilyMembers() {
    familyMembers = [];
    
    document.querySelectorAll('.family-member-input').forEach(memberDiv => {
        const nameInput = memberDiv.querySelector('.member-name');
        const ageInput = memberDiv.querySelector('.member-age');
        
        if (nameInput && ageInput) {
            const name = nameInput.value;
            let age = parseInt(ageInput.value);
            
            if (name && !isNaN(age) && age >= 0) {
                familyMembers.push({ name, age });
            }
        }
    });
    
    console.log('✅ Οικογένεια ενημερώθηκε:', familyMembers.length, 'μέλη');
    saveToLocalStorage();
}

// ==================== NAVIGATION & STEPS ====================
function activateStep(targetId) {
    const steps = document.querySelectorAll('.step');
    const sections = document.querySelectorAll('.section');
    steps.forEach(s => s.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active'));
    
    const targetStep = document.querySelector(`[data-target="${targetId}"]`);
    const targetSection = document.getElementById(targetId);
    
    if (targetStep) targetStep.classList.add('active');
    if (targetSection) targetSection.classList.add('active');
    
    // Ενημέρωση mobile select
    const mobileSelect = document.getElementById('mobile-step-select');
    if (mobileSelect) {
        mobileSelect.value = targetId;
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep2(){
    activateStep('step-flight');
}

function goToStep3(){
    activateStep('step-hotel');
    const hotelDestination = document.getElementById("hotel-destination");
    if (hotelDestination) {
        hotelDestination.textContent = selectedDestinationName || "Επιλέξτε πόλη";
    }
}

async function goToStep4() {
    activateStep('step-activities');
    
    const step4Section = document.getElementById("step-activities");
    const activityContainer = document.getElementById("activities-container");
    const overallTotalDiv = document.getElementById("overall-total");
    const step5BtnContainer = step4Section?.querySelector('.step-5-btn-container');
    const activitiesCity = document.getElementById("activities-city");

    if (activitiesCity) {
        activitiesCity.textContent = selectedDestinationName || "Επιλέξτε πόλη";
    }

    // 1. ΦΟΡΤΩΣΗ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ
    const cityData = await loadCityActivities(selectedDestinationName);
    
    if (!cityData || cityData.activities.length === 0) {
        if (activityContainer) {
            step4Section.querySelector('h1').innerText = `Βήμα 4: Προορισμός: ${selectedDestinationName || 'Χωρίς Επιλογή'}`;
            activityContainer.style.display = 'block';
            if (overallTotalDiv) overallTotalDiv.style.display = 'none';
            if (step5BtnContainer) step5BtnContainer.style.display = 'none';
            activityContainer.innerHTML = `
                <div style="text-align:center; font-size:1.5em; color:#ff6b6b; padding:40px; border:2px dashed #ff6b6b; border-radius:15px; background: #fff; margin:20px;">
                    <h3>🏗️ ΥΠΟ ΚΑΤΑΣΚΕΥΗ</h3>
                    <p>Οι δραστηριότητες για την πόλη <strong>${selectedDestinationName}</strong> προστίθενται σύντομα!</p>
                    <p>💡 Μπορείτε να:</p>
                    <ul style="text-align:left; display:inline-block; margin:15px 0;">
                        <li>Επιστρέψετε στο Βήμα 1 και επιλέξετε άλλη πόλη</li>
                        <li>Ή να περιμένετε για την επόμενη ενημέρωση</li>
                    </ul>
                    <button onclick="activateStep('step-destination')" style="padding:12px 24px; background:#3eb489; color:white; border:none; border-radius:8px; cursor:pointer; font-size:16px; margin-top:15px;">
                        ↩️ Επιστροφή στο Βήμα 1
                    </button>
                </div>
            `;
        }
        return;
    }
    
    // 2. ΕΜΦΑΝΙΣΗ ΤΙΤΛΟΥ
    if (step4Section) {
        step4Section.querySelector('h1').innerText = `Οικογενειακές Δραστηριότητες - ${cityData.name}`;
    }
    
    // 3. ΑΠΟΘΗΚΕΥΣΗ ΓΙΑ ΧΡΗΣΗ
    window.currentCityActivities = cityData.activities;
    
    // 4. ΕΠΑΝΑΦΟΡΤΩΣΗ ΕΠΙΛΕΓΜΕΝΩΝ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ ΑΠΟ LOCAL STORAGE
    const savedData = localStorage.getItem('travelPlannerData');
    if (savedData) {
        const data = JSON.parse(savedData);
        
        if (data.selectedDestinationName === selectedDestinationName && 
            data.selectedActivities && data.selectedActivities.length > 0) {
            
            console.log("🔄 Επαναφορά", data.selectedActivities.length, "επιλογών...");
            
            const activitiesWithSelections = cityData.activities.map(activity => {
                const isSelected = data.selectedActivities.includes(activity.name);
                return {
                    ...activity,
                    selected: isSelected
                };
            });
            
            window.currentCityActivities = activitiesWithSelections;
            createActivityCardsNew(activitiesWithSelections);
        } else {
            window.currentCityActivities = cityData.activities;
            createActivityCardsNew(cityData.activities);
        }
    } else {
        window.currentCityActivities = cityData.activities;
        createActivityCardsNew(cityData.activities);
    }
    
    // 5. ΕΝΗΜΕΡΩΣΗ ΟΙΚΟΓΕΝΕΙΑΣ
    updateFamilyMembers();
    
    // 6. ΥΠΟΛΟΓΙΣΜΟΣ ΚΟΣΤΟΥΣ
    calculateAllCostsNew();
    
    if (activityContainer) activityContainer.style.display = 'grid';
    if (overallTotalDiv) overallTotalDiv.style.display = 'block';
    if (step5BtnContainer) step5BtnContainer.style.display = 'block';
    
    saveToLocalStorage();
}

function goToStep5(){
    const daysSelect = document.getElementById("days-stay");
    selectedDaysStay = daysSelect?.value ? parseInt(daysSelect.value) : 0;
    
    activateStep('step-summary');
    const summaryDiv = document.getElementById('summary-content');
    
    if (!summaryDiv) return;
    
    if (!selectedDestinationName) {
        summaryDiv.innerHTML = `
            <h3>⚠️ Δεν έχετε επιλέξει προορισμό ακόμα</h3>
            <p>Παρακαλώ επιστρέψτε στο Βήμα 1 για να επιλέξετε προορισμό.</p>
            <button onclick="activateStep('step-destination')" style="padding: 10px 20px; background: #3eb489; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 10px;">
                Επιστροφή στο Βήμα 1
            </button>
        `;
        return;
    }
    
    const selectedActivities = window.currentCityActivities ? 
        window.currentCityActivities.filter(act => act.selected === true) : [];
    const daysText = selectedDaysStay > 0 ? `${selectedDaysStay} μέρες` : "μη ορισμένες μέρες";
    
    if (selectedActivities.length > 0) {
        const dailyProgram = createSmartDailyProgram(selectedActivities, selectedDaysStay || 1);
        const distancesInfo = calculateDistances(selectedActivities);
        
        summaryDiv.innerHTML = `
            <h3>✅ Το προσωπικό σας πρόγραμμα για ${daysText} στην ${selectedDestinationName}!</h3>
            <div style="background: #e8f5e8; padding: 15px; border-radius: 10px; border: 2px solid #3eb489; margin: 15px 0;">
                <strong>📅 Πρόγραμμα Διακοπών:</strong>
                ${dailyProgram}
            </div>
            ${distancesInfo}
            <div style="background: #fff3cd; padding: 15px; border-radius: 10px; border: 1px solid #ffeaa7; margin: 15px 0;">
                <strong>Οι επιλεγμένες σας δραστηριότητες (${selectedActivities.length}):</strong>
                <ul>
                    ${selectedActivities.map(act => `<li>${act.name}</li>`).join('')}
                </ul>
            </div>
        `;
        summaryDiv.style.border = '2px dashed #3eb489';
        summaryDiv.style.background = '#e0fff0';
    } else {
        summaryDiv.innerHTML = `
            <h3>🏙️ ${selectedDestinationName} - Πρόγραμμα ${daysText}</h3>
            <p>Δεν έχετε επιλέξει δραστηριότητες ακόμα. Επιστρέψτε στο Βήμα 4 και επιλέξτε δραστηριότητες!</p>
            <button onclick="activateStep('step-activities')" style="padding: 10px 20px; background: #3eb489; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 10px;">
                Επιστροφή στο Βήμα 4
            </button>
        `;
        summaryDiv.style.border = '2px dashed #3eb489';
        summaryDiv.style.background = '#e0fff0';
    }
}

function goToStep6() {
    activateStep('step-map');
}

// ==================== ACTIVITIES FUNCTIONS ====================
async function loadCityActivities(cityName) {
    console.log("🔍 Φόρτωση δραστηριοτήτων για:", cityName);
    
    if (!cityName) return null;
    
    try {
        const cityFileMap = {
            'Βιέννη': 'vienna.json',
            'Λονδίνο': 'london.json',
            'Κωνσταντινούπολη': 'istanbul.json',
            'Παρίσι': 'paris.json',
            'Πράγα': 'prague.json',
            'Βερολίνο': 'berlin.json',
            'Λισαβόνα': 'lisbon.json',
            'Βουδαπέστη': 'budapest.json',
            'Μαδρίτη': 'madrid.json'
        };

        const filename = cityFileMap[cityName];
        
        if (!filename) {
            console.log(`⚠️ Η πόλη ${cityName} δεν έχει ακόμα JSON`);
            return null;
        }
        
        console.log("📁 Φόρτωση:", filename);
        const response = await fetch(filename);
        
        if (!response.ok) {
            throw new Error(`Δεν βρέθηκε ${filename}`);
        }
        
        const cityData = await response.json();
        console.log(`✅ Βρέθηκε: ${cityData.city} (${cityData.activities.length} δραστηριότητες)`);
        
        return {
            name: cityData.city,
            country: cityData.country,
            currency: cityData.currency,
            emoji: cityData.emoji,
            description: cityData.description,
            location: cityData.location,
            activities: cityData.activities
        };
        
    } catch (error) {
        console.error("❌ Σφάλμα φόρτωσης:", error.message);
        return null;
    }
}

function createActivityCardsNew(activityList) {
    console.log("🃏 Δημιουργία καρτών για", activityList.length, "δραστηριότητες");
    
    const container = document.getElementById('activities-container');
    if (!container) {
        console.error("❌ Δεν βρέθηκε container!");
        return;
    }
    
    container.innerHTML = "";
    
    function getPriceForAgeRange(prices, minAge, maxAge) {
        if (!prices) return 0;
        
        for (let age = minAge; age <= maxAge; age++) {
            if (prices[age] !== undefined) {
                return prices[age];
            }
        }
        
        return (prices && prices.adult) || 0;
    }
    
    activityList.forEach((act, index) => {
        const card = document.createElement('div');
        card.className = "activity-card";
        console.log(`Δημιουργία κάρτας ${index}: "${act.name}", selected: ${act.selected}`);
        
        if (act.selected === true) {
            card.classList.add('selected');
        }
        
        card.id = `activity-${index}`;
        
        card.innerHTML = `
            <span class="star">⭐</span>
            <div class="activity-info">
                <h3>${act.name}</h3>
                <p>${act.desc || act.description || ''}</p>
                
                <div style="margin-top: 15px;">
                    <table class="activity-table" style="width: 100%; text-align: center; border-collapse: collapse; font-size: 0.85em;">
                        <tr>
                            <th style="padding: 4px; background: #f0f8ff;">0-5</th>
                            <th style="padding: 4px; background: #f0f8ff;">6-14</th>
                            <th style="padding: 4px; background: #f0f8ff;">15-17</th>
                            <th style="padding: 4px; background: #f0f8ff;">18+</th>
                        </tr>
                        <tr>
                            <td style="padding: 4px; border: 1px solid #ddd;">${getPriceForAgeRange(act.prices, 0, 5)}€</td>
                            <td style="padding: 4px; border: 1px solid #ddd;">${getPriceForAgeRange(act.prices, 6, 14)}€</td>
                            <td style="padding: 4px; border: 1px solid #ddd;">${getPriceForAgeRange(act.prices, 15, 17)}€</td>
                            <td style="padding: 4px; border: 1px solid #ddd;">${(act.prices && act.prices.adult) || 0}€</td>
                        </tr>
                    </table>
                </div>
                
                <div class="total" id="total-${index}">Κόστος: 0 €</div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            console.log(`🖱️ Κλικ στην κάρτα ${index}: ${act.name}`);
            
            card.classList.toggle('selected');
            
            if (act.selected === undefined) act.selected = false;
            act.selected = !act.selected;
            
            console.log(`   ✅ Τώρα είναι selected: ${act.selected}`);
            
            if (window.currentCityActivities && window.currentCityActivities[index]) {
                window.currentCityActivities[index].selected = act.selected;
            }
            
            calculateAllCostsNew();
            saveToLocalStorage();
        });
        
        container.appendChild(card);
    });
    
    console.log("✅ Δημιουργήθηκαν", activityList.length, "κάρτες");
}

function calculateAllCostsNew() {
    console.log("🧮 Υπολογισμός κόστους...");
    
    if (!window.currentCityActivities) {
        console.error("❌ Δεν υπάρχουν δραστηριότητες!");
        return;
    }
    
    if (familyMembers.length === 0) {
        alert("⚠️ Δεν έχετε ορίσει μέλη οικογένειας! Συμπληρώστε τις ηλικίες και πατήστε '🔄 Ενημέρωση Οικογένειας'");
        return;
    }
    
    let overallTotal = 0;
    
    window.currentCityActivities.forEach((act, index) => {
        const card = document.getElementById(`activity-${index}`);
        if (!card) return;
        
        const isSelected = card.classList.contains('selected');
        const totalElement = document.getElementById(`total-${index}`);
        
        if (isSelected && totalElement) {
            let activityTotal = 0;
            
            familyMembers.forEach(member => {
                const age = member.age;
                let price = 0;
                
                if (act.prices && act.prices[age] !== undefined) {
                    price = act.prices[age];
                }
                else if (age <= 2 && act.prices["0-2"] !== undefined) {
                    price = act.prices["0-2"];
                }
                else if (age <= 5 && act.prices["3-5"] !== undefined) {
                    price = act.prices["3-5"];
                }
                else if (age <= 14 && act.prices["6-14"] !== undefined) {
                    price = act.prices["6-14"];
                }
                else if (age <= 19 && act.prices["15-19"] !== undefined) {
                    price = act.prices["15-19"];
                }
                else if (act.prices["18+"] !== undefined) {
                    price = act.prices["18+"];
                }
                else if (age <= 6 && act.prices["0-6"] !== undefined) {
                    price = act.prices["0-6"];
                }
                else if (age <= 12 && act.prices["7-12"] !== undefined) {
                    price = act.prices["7-12"];
                }
                else if (age <= 17 && act.prices["13-17"] !== undefined) {
                    price = act.prices["13-17"];
                }
                else if (act.prices["adult"] !== undefined) {
                    price = act.prices["adult"];
                }
                else if (act.prices["18+"] !== undefined) {
                    price = act.prices["18+"];
                }
                
                activityTotal += price;
            });
            
            totalElement.textContent = `Κόστος: ${activityTotal} €`;
            overallTotal += activityTotal;
            
        } else if (totalElement) {
            totalElement.textContent = "Κόστος: 0 €";
        }
    });
    
    const overallElement = document.getElementById('overall-total');
    if (overallElement) {
        overallElement.textContent = `Συνολικό Κόστος Επιλεγμένων Δραστηριοτήτων: ${overallTotal} €`;
    }
    
    console.log("💰 Συνολικό κόστος:", overallTotal, "€");
}

// ==================== SMART DAILY PROGRAM ====================
function createSmartDailyProgram(activities, days) {
    if (!activities || activities.length === 0) {
        return '<p>Δεν έχετε επιλέξει δραστηριότητες.</p>';
    }
    
    const activitiesWithCoords = activities.filter(act => act.location && act.location.lat);
    
    if (activitiesWithCoords.length === 0) {
        if (!days || days <= 0) days = 1;
        
        let programHTML = '<p>🗺️ <strong>Απλό Πρόγραμμα:</strong></p>';
        const activitiesPerDay = Math.ceil(activities.length / days);
        
        for (let day = 0; day < days; day++) {
            const startIndex = day * activitiesPerDay;
            const endIndex = Math.min(startIndex + activitiesPerDay, activities.length);
            const dayActivities = activities.slice(startIndex, endIndex);
            
            if (dayActivities.length === 0) continue;
            
            const morningActivities = dayActivities.slice(0, Math.ceil(dayActivities.length / 2));
            const afternoonActivities = dayActivities.slice(Math.ceil(dayActivities.length / 2));
            
            programHTML += `
                <div style="margin: 15px 0; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #ff7f50;">
                    <h4 style="margin: 0 0 8px 0; color: #ff7f50;">📍 Ημέρα ${day + 1}</h4>
                    
                    ${morningActivities.length > 0 ? `
                    <div style="margin-bottom: 8px;">
                        <h5 style="margin: 0 0 4px 0; color: #3eb489;">🌅 Πρωινό (9:00-13:00)</h5>
                        <ul style="margin: 0; padding-left: 20px;">
                            ${morningActivities.map(act => `<li>${act.name}</li>`).join('')}
                        </ul>
                    </div>` : ''}
                    
                    ${afternoonActivities.length > 0 ? `
                    <div style="margin-bottom: 6px;">
                        <h5 style="margin: 0 0 4px 0; color: #4c7af0;">🌇 Απογευματινό (14:00-18:00)</h5>
                        <ul style="margin: 0; padding-left: 20px;">
                            ${afternoonActivities.map(act => `<li>${act.name}</li>`).join('')}
                        </ul>
                    </div>` : ''}
                </div>
            `;
        }
        
        return programHTML;
    }
    
    const clusters = createSmartClusters(activitiesWithCoords, days);
    
    let programHTML = '<p>🗺️ <strong>Έξυπνο Πρόγραμμα με Βάση την Απόσταση & Χρόνο:</strong></p>';
    
    clusters.forEach((cluster, index) => {
        const morningActivities = cluster.slice(0, Math.ceil(cluster.length / 2));
        const afternoonActivities = cluster.slice(Math.ceil(cluster.length / 2));
        
        programHTML += `
            <div style="margin: 15px 0; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #ff7f50;">
                <h4 style="margin: 0 0 8px 0; color: #ff7f50;">📍 Ημέρα ${index + 1} - Έξυπνο Πλάνο</h4>
                
                ${morningActivities.length > 0 ? `
                <div style="margin-bottom: 8px;">
                    <h5 style="margin: 0 0 4px 0; color: #3eb489;">🌅 Πρωινό (9:00-13:00)</h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${morningActivities.map(act => `<li>${act.name}</li>`).join('')}
                    </ul>
                </div>` : ''}
                
                ${afternoonActivities.length > 0 ? `
                <div style="margin-bottom: 6px;">
                    <h5 style="margin: 0 0 4px 0; color: #4c7af0;">🌇 Απογευματινό (14:00-18:00)</h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${afternoonActivities.map(act => `<li>${act.name}</li>`).join('')}
                    </ul>
                </div>` : ''}
                
                <div style="background: #f8f9fa; padding: 6px; border-radius: 4px; margin-top: 6px;">
                    <p style="margin: 0; font-size: 0.8em; color: #666;">
                        ✅ <strong>Βελτιστοποιημένη Διαδρομή</strong> | 
                        🚶 <strong>Ελάχιστες Μετακινήσεις</strong> | 
                        ⏱️ <strong>Ισορροπημένος Χρόνος</strong>
                    </p>
                </div>
            </div>
        `;
    });
    
    return programHTML;
}

function createSmartClusters(activities, numClusters) {
    if (!activities || activities.length <= numClusters) {
        const clusters = [];
        for (let i = 0; i < numClusters; i++) {
            clusters.push(activities[i] ? [activities[i]] : []);
        }
        return clusters.filter(cluster => cluster.length > 0);
    }
    
    const centerLat = activities.reduce((sum, act) => sum + act.location.lat, 0) / activities.length;
    const centerLng = activities.reduce((sum, act) => sum + act.location.lng, 0) / activities.length;
    
    const activitiesWithDistance = activities.map(act => {
        const distance = Math.sqrt(
            Math.pow(act.location.lat - centerLat, 2) + Math.pow(act.location.lng - centerLng, 2)
        );
        return { ...act, distance };
    });
    
    const sortedByDistance = [...activitiesWithDistance].sort((a, b) => a.distance - b.distance);
    
    const clusterSize = Math.ceil(sortedByDistance.length / numClusters);
    const clusters = [];
    
    for (let i = 0; i < numClusters; i++) {
        const start = i * clusterSize;
        const end = start + clusterSize;
        const cluster = sortedByDistance.slice(start, end).map(act => {
            const { distance, ...activityWithoutDistance } = act;
            return activityWithoutDistance;
        });
        
        if (cluster.length > 0) {
            cluster.sort((a, b) => a.location.lat - b.location.lat);
            clusters.push(cluster);
        }
    }
    
    return clusters;
}

function calculateDistances(activities) {
    if (!activities || activities.length < 2) return '';
    
    let distancesHTML = '<div style="background: #e8f4f8; padding: 15px; border-radius: 10px; margin: 15px 0; border: 2px solid #4c7af0;"><h4>🗺️ Αποστάσεις & Μετακινήσεις:</h4>';
    
    for (let i = 0; i < activities.length - 1; i++) {
        const fromAct = activities[i];
        const toAct = activities[i + 1];
        
        if (fromAct.location && toAct.location) {
            const distance = calculateDistance(fromAct.location.lat, fromAct.location.lng, toAct.location.lat, toAct.location.lng);
            distancesHTML += `
                <div style="margin: 10px 0; padding: 10px; background: white; border-radius: 8px;">
                    <strong>${fromAct.name}</strong> → <strong>${toAct.name}</strong>
                    <div style="font-size: 0.9em; margin-top: 5px;">
                        📏 Απόσταση: <strong>${distance} km</strong><br>
                        🚶 Περπάτημα: ~${Math.round(distance * 15)} λεπτά<br>
                        🚗 Αυτοκίνητο: ~${Math.round(distance * 3)} λεπτά<br>
                        🚇 ΜΜΜ: ~${Math.round(distance * 5)} λεπτά
                    </div>
                    <a href="https://www.google.com/maps/dir/${fromAct.location.lat},${fromAct.location.lng}/${toAct.location.lat},${toAct.location.lng}" target="_blank" style="color: #4c7af0; font-size: 0.9em;">📱 Άνοιγμα Google Maps</a>
                </div>
            `;
        }
    }
    
    distancesHTML += '</div>';
    return distancesHTML;
}

// ==================== MAP FUNCTIONS ====================
function preloadLeaflet() {
    if (typeof L === 'undefined') {
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        
        if (!document.querySelector('script[src*="leaflet"]')) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            document.head.appendChild(script);
        }
    }
}

function initializeSmartMap() {
    const selectedActivities = window.currentCityActivities ? 
        window.currentCityActivities.filter(act => act.selected === true) : [];
    
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) return;
    
    mapContainer.innerHTML = '<div id="smart-map" style="height: 100%; width: 100%;"></div>';
    
    let mapCenter, mapZoom;
    
    if (selectedDestinationName.includes("Βερολίνο")) {
        mapCenter = [52.5200, 13.4050];
        mapZoom = 12;
    } else if (selectedDestinationName.includes("Λισαβόνα")) {
        mapCenter = [38.7223, -9.1393];
        mapZoom = 13;
    } else if (selectedDestinationName.includes("Βουδαπέστη")) {
        mapCenter = [47.4979, 19.0402];
        mapZoom = 13;
    } else if (selectedDestinationName.includes("Λονδίνο")) {
        mapCenter = [51.5074, -0.1278];
        mapZoom = 12;
    } else {
        mapCenter = [48.2082, 16.3738];
        mapZoom = 13;
    }
    
    if (typeof L === 'undefined') {
        if (!document.querySelector('script[src*="leaflet"]')) {
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => {
                setTimeout(() => {
                    createSmartMapWithActivities(selectedActivities);
                }, 300);
            };
            document.head.appendChild(script);
        } else {
            setTimeout(() => {
                if (typeof L !== 'undefined') {
                    createSmartMapWithActivities(selectedActivities);
                } else {
                    setTimeout(() => initializeSmartMap(), 500);
                }
            }, 500);
        }
    } else {
        createSmartMapWithActivities(selectedActivities);
    }
}

function createSmartMapWithActivities(activities) {
    const mapContainer = document.getElementById('map-container');
    const mapDiv = document.getElementById('smart-map');
    
    if (!mapContainer || !mapDiv) return;
    
    let mapCenter, mapZoom;
    
    if (selectedDestinationName.includes("Βερολίνο")) {
        mapCenter = [52.5200, 13.4050];
        mapZoom = 12;
    } else if (selectedDestinationName.includes("Λισαβόνα")) {
        mapCenter = [38.7223, -9.1393];
        mapZoom = 13;
    } else if (selectedDestinationName.includes("Βουδαπέστη")) {
        mapCenter = [47.4979, 19.0402];
        mapZoom = 13;
    } else if (selectedDestinationName.includes("Λονδίνο")) {
        mapCenter = [51.5074, -0.1278];
        mapZoom = 12;
    } else {
        mapCenter = [48.2082, 16.3738];
        mapZoom = 13;
    }
    
    try {
        const map = L.map('smart-map').setView(mapCenter, mapZoom);
        window.currentMap = map;
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        addActivityMarkers(map, activities);
        addMapCloseButton(mapContainer, map);
        loadCustomPointsOnMap();
    } catch (error) {
        console.error("❌ Σφάλμα δημιουργίας χάρτη:", error);
        mapContainer.innerHTML = `
            <div style="text-align: center; padding: 50px; color: #666;">
                <h3>⚠️ Σφάλμα φόρτωσης χάρτη</h3>
                <p>Παρακαλώ δοκιμάστε ξανά.</p>
                <button onclick="initializeSmartMap()" style="padding: 10px 20px; background: #3eb489; color: white; border: none; border-radius: 8px; margin-top: 15px;">
                    🔄 Ξαναφόρτωση Χάρτη
                </button>
            </div>
        `;
    }
}

function addActivityMarkers(map, activities) {
    console.log("📍 Προσθήκη πινεζών για", activities?.length || 0, "δραστηριότητες");
    
    if (!map || !activities) return;
    
    let selectedMarkers = [];
    let markerColor = 'green';
    
    if (selectedDestinationName.includes("Βερολίνο")) markerColor = 'blue';
    else if (selectedDestinationName.includes("Λισαβόνα")) markerColor = 'red';
    else if (selectedDestinationName.includes("Βουδαπέστη")) markerColor = 'orange';
    else if (selectedDestinationName.includes("Βιέννη")) markerColor = 'green';
    else if (selectedDestinationName.includes("Παρίσι")) markerColor = 'purple';
    else if (selectedDestinationName.includes("Λονδίνο")) markerColor = 'blue';
    else if (selectedDestinationName.includes("Ρώμη")) markerColor = 'red';
    else if (selectedDestinationName.includes("Μαδρίτη")) markerColor = 'yellow';
    else if (selectedDestinationName.includes("Κωνσταντινούπολη")) markerColor = 'red';
    else if (selectedDestinationName.includes("Πράγα")) markerColor = 'orange';
    else markerColor = 'green';
    
    activities.forEach((activity, index) => {
        if (!activity.location || activity.location.lat === undefined) {
            console.warn(`⚠️ Δραστηριότητα ${activity.name} δεν έχει location!`);
            return;
        }
        
        const lat = activity.location.lat;
        const lng = activity.location.lng;
        
        const customIcon = L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${markerColor}.png`,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        });
        
        const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
        
        marker.bindPopup(createPopupContent(activity));
        
        marker.on('click', function() {
            handleMarkerClick(marker, selectedMarkers, map, activity);
        });
    });
    
    if (activities.length > 0) {
        const latlngs = activities
            .filter(a => a.location && a.location.lat !== undefined)
            .map(a => [a.location.lat, a.location.lng]);
        
        if (latlngs.length > 0) {
            const bounds = L.latLngBounds(latlngs);
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
    }
}

function createPopupContent(activity) {
    const name = activity.name || activity.title || 'Δραστηριότητα';
    const desc = activity.description || activity.desc || '';
    const restaurant = activity.restaurant || 'Δεν υπάρχει πληροφορία';
    const website = activity.website || '';
    
    return `
        <div style="max-width: 280px;">
            <h4 style="margin: 0 0 8px 0; color: #3eb489;">${name}</h4>
            <p style="margin: 0 0 8px 0; font-size: 0.9em;">${desc}</p>
            <div style="margin: 6px 0; font-size: 0.9em;">
                <strong>🍽️ Κοντινό Εστιατόριο:</strong><br>${restaurant}
            </div>
            ${website ? `<a href="${website}" target="_blank" style="color: #3eb489; font-weight: bold; text-decoration: none;">🔗 Δείτε περισσότερα</a>` : ''}
        </div>
    `;
}

// ==================== CUSTOM POINTS FUNCTIONS ====================
function addCustomPointSmart() {
    if (typeof L === 'undefined' || !window.currentMap) {
        alert('⚠️ Πρέπει πρώτα να φορτώσετε τον χάρτη!');
        initializeSmartMap();
        setTimeout(() => {
            alert('✅ Ο χάρτης φορτώθηκε! Προσπαθήστε ξανά.');
        }, 1500);
        return;
    }
    
    const choice = prompt(`🏆 ΠΩΣ ΘΕΛΕΤΕ ΝΑ ΠΡΟΣΘΕΣΕΤΕ ΤΟ ΣΗΜΕΙΟ;

1️⃣ 🔍 ΑΝΑΖΗΤΗΣΗ ΟΝΟΜΑΤΟΣ (για διάσημα μέρη όπως "Βατικανό", "Πύργος του Άιφελ")
2️⃣ 🗺️ ΚΛΙΚ ΣΤΟΝ ΧΑΡΤΗ (για προσεγγιστική τοποθεσία)
3️⃣ 📫 ΠΛΗΚΤΡΟΛΟΓΗΣΗ ΔΙΕΥΘΥΝΣΗΣ (για ακριβή διεύθυνση)

Επιλέξτε 1, 2 ή 3:`);
    
    if (choice === '1') {
        searchPointByName();
    } else if (choice === '2') {
        startAddingCustomPoint();
    } else if (choice === '3') {
        searchPointByAddress();
    } else {
        alert('❌ Ακυρώθηκε');
    }
}

function startAddingCustomPoint() {
    if (typeof L === 'undefined' || !window.currentMap) {
        alert('⚠️ Πρέπει πρώτα να φορτώσετε τον χάρτη!');
        initializeSmartMap();
        setTimeout(() => {
            alert('✅ Ο χάρτης φορτώθηκε! Κάντε ξανά κλικ στο "🟣 Προσθήκη Σημείου"');
        }, 1000);
        return;
    }
    
    const map = window.currentMap;
    
    alert('🗺️ Κάντε κλικ στον χάρτη για να προσθέσετε σημείο!');
    
    map.getContainer().style.cursor = 'crosshair';
    
    const clickHandler = function(e) {
        map.off('click', clickHandler);
        map.getContainer().style.cursor = '';
        
        showCustomPointForm(e.latlng.lat, e.latlng.lng);
    };
    
    map.on('click', clickHandler);
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✖️ Ακύρωση';
    cancelBtn.style.cssText = `
        position: absolute;
        top: 80px;
        right: 15px;
        z-index: 1000;
        padding: 10px 15px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-family: 'Comic Neue', Arial, Helvetica, sans-serif;
        font-weight: bold;
    `;
    cancelBtn.onclick = function() {
        map.off('click', clickHandler);
        map.getContainer().style.cursor = '';
        cancelBtn.remove();
    };
    
    document.getElementById('map-container').appendChild(cancelBtn);
}

// ==================== HOTEL FUNCTIONS ====================
function searchHotels() {
    const expediaLink = 'https://www.tkqlhce.com/click-101567631-13853200';
    window.open(expediaLink, '_blank');
    const img = document.createElement('img');
    img.src = 'https://www.lduhtrp.net/image-101567631-13853200';
    img.width = 1; img.height = 1; img.border = 0;
    document.body.appendChild(img);
}

// ==================== QUICK CITY SELECTION ====================
function toggleQuickSelection() {
    const quickSelect = document.getElementById('quick-city-select');
    if (quickSelect) {
        quickSelect.style.display = quickSelect.style.display === 'none' ? 'block' : 'none';
        
        if (document.getElementById('quick-city').options.length <= 1) {
            fillQuickCityDropdown();
        }
    } else {
        alert('⚠️ Η λειτουργία γρήγορης επιλογής δεν είναι διαθέσιμη αυτή τη στιγμή.');
    }
}

function fillQuickCityDropdown() {
    const select = document.getElementById('quick-city');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Επιλέξτε πόλη --</option>';
    
    const sortedDestinations = [...destinations].sort((a, b) => {
        return a.name.localeCompare(b.name, 'el');
    });
    
    sortedDestinations.forEach(dest => {
        const option = document.createElement('option');
        option.value = dest.name;
        option.textContent = dest.name;
        select.appendChild(option);
    });
}

function selectQuickCity() {
    const selectedCity = document.getElementById('quick-city')?.value;
    const selectedDays = document.getElementById("days-stay")?.value;
    
    if (selectedCity) {
        selectedDestinationName = selectedCity;
        updateCityBackground(selectedCity);
        selectedDaysStay = selectedDays ? parseInt(selectedDays) : 0;
        
        const budget = document.getElementById("travel-budget")?.value;
        if (budget) {
            selectedBudget = parseInt(budget);
        }
        
        updateStep1Display();
        
        const quickCitySelect = document.getElementById('quick-city-select');
        if (quickCitySelect) {
            quickCitySelect.style.display = 'none';
        }
    } else {
        alert('Παρακαλώ επιλέξτε μια πόλη από τη λίστα');
    }
}

// ==================== BACKGROUND IMAGE ====================
function updateCityBackground(cityName) {
    const cityBackgrounds = {
        "Βιέννη": "https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1200",
        "Βερολίνο": "https://images.unsplash.com/photo-1587330979470-3595ac045ab0?w=1200",
        "Παρίσι": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200", 
        "Ρώμη": "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200",
        "Λονδίνο": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1200",
        "Άμστερνταμ": "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?w=1200",
        "Βουδαπέστη": "https://images.unsplash.com/photo-1551867633-194f125bdbfa?w=1200&auto=format&fit=crop",
        "Πράγα": "https://images.unsplash.com/photo-1592906209472-a36b1f3782ef?w=1200",
        "Μόναχο": "https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1200",
        "Κολωνία": "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200",
        "Βαρκελώνη": "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1200",
        "Μαδρίτη": "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200",
        "Λισαβόνα": "https://images.unsplash.com/photo-1585208798174-6cedd86bd019a?w=1200&auto=format&fit=crop",  
        "Δουβλίνο": "https://images.unsplash.com/photo-1549918864-6bac32c52dcb?w=1200",
        "Εδιμβούργο": "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=1200",
        "Ζυρίχη": "https://images.unsplash.com/photo-1544483048-8b74d33a11bd?w=1200",
        "Γενεύη": "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200",
        "Κοπεγχάγη": "https://images.unsplash.com/photo-1513622472932-bd5c45e1987b?w=1200",
        "Στοκχόλμη": "https://images.unsplash.com/photo-1506970843675-04a04c64ad6f?w=1200",
        "Βουκουρέστι": "https://images.unsplash.com/photo-1594736797933-d0f289d3f0b3?w=1200",
        "Όσλο": "https://images.unsplash.com/photo-1583149454066-4c76b4d2ad23?w=1200",
        "Μιλάνο": "https://images.unsplash.com/photo-1610018556010-6c6d89b95a0a?w=1200",
        "Φλωρεντία": "https://images.unsplash.com/photo-1543429259-5070ada7b72c?w=1200",
        "Κωνσταντινούπολη": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200",
        "Σόφια": "https://images.unsplash.com/photo-1578351120013-6e2ada1d570d?w=1200",
        "Βαρσοβία": "https://images.unsplash.com/photo-1590330237165-7c36d3d82b44?w=1200",
        "Κρακοβία": "https://images.unsplash.com/photo-1544298628-3a4c18a4fb6b?w=1200"
    };
    
    const backgroundUrl = cityBackgrounds[cityName] || 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200';
    
    const img = new Image();
    img.src = backgroundUrl;
    
    img.onload = function() {
        document.body.style.backgroundImage = `linear-gradient(rgba(255,255,255,0.25), rgba(255,255,255,0.4)), url(${backgroundUrl})`;
    };
}

// ==================== LOCAL STORAGE FUNCTIONS ====================
function saveToLocalStorage() {
    const data = {
        selectedDestinationName,
        selectedDaysStay,
        selectedBudget,
        selectedActivities: window.currentCityActivities ? 
            window.currentCityActivities.filter(act => act.selected).map(act => act.name) : [],
        familyMembers: familyMembers
    };
    localStorage.setItem('travelPlannerData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('travelPlannerData');
    if (saved) {
        const data = JSON.parse(saved);
        
        const shouldContinue = confirm('📋 Βρέθηκε προηγούμενο σχέδιο ταξιδιού! Θέλετε να συνεχίσετε από εκεί που είχατε μείνει;');
        
        if (shouldContinue) {
            selectedDestinationName = data.selectedDestinationName || "";
            selectedDaysStay = data.selectedDaysStay || 0;
            selectedBudget = data.selectedBudget || 0;
            
            if (selectedDaysStay > 0) {
                const daysStayElement = document.getElementById("days-stay");
                if (daysStayElement) daysStayElement.value = selectedDaysStay;
            }
            
            if (selectedBudget > 0) {
                const travelBudgetElement = document.getElementById("travel-budget");
                if (travelBudgetElement) travelBudgetElement.value = selectedBudget;
            }
            
            if (data.familyMembers && data.familyMembers.length > 0) {
                familyMembers = data.familyMembers;
                updateFamilyMembersUI();
            }
            
            if (data.selectedActivities && data.selectedActivities.length > 0) {
                window.savedActivities = data.selectedActivities;
            }
            
            setTimeout(() => {
                alert(`✅ Φορτώθηκε προηγούμενο σχέδιο:\n🏙️ Προορισμός: ${selectedDestinationName || 'Κανένας'}\n👨‍👩‍👧‍👦 Μέλη: ${familyMembers.length}\n📅 Μέρες: ${selectedDaysStay}\n💰 Προϋπολογισμός: ${selectedBudget}€`);
            }, 500);
        } else {
            localStorage.removeItem('travelPlannerData');
        }
    }
}

function updateFamilyMembersUI() {
    const container = document.getElementById('family-members-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    familyMembers.forEach((member, index) => {
        const emoji = index === 0 ? '👨' : index === 1 ? '👩' : '🧒';
        const memberDiv = document.createElement('div');
        memberDiv.className = 'family-member-input';
        memberDiv.innerHTML = `
            <span>${emoji}</span>
            <input type="text" placeholder="Όνομα" value="${member.name}" class="member-name">
            <input type="number" placeholder="Ηλικία" value="${member.age}" class="member-age" min="0" max="120">
            <span>ετών</span>
            ${index >= 2 ? '<button onclick="removeFamilyMember(this)" class="remove-member-btn">×</button>' : ''}
        `;
        container.appendChild(memberDiv);
    });
}

// ==================== UI UPDATE FUNCTIONS ====================
function updateDaysStay() {
    const daysSelect = document.getElementById("days-stay");
    selectedDaysStay = daysSelect?.value ? parseInt(daysSelect.value) : 0;
    
    saveToLocalStorage();
    
    updateStep1Display();
    
    if (document.getElementById('step-summary')?.classList.contains('active')) {
        goToStep5();
    }
    
    const message = document.createElement('div');
    message.textContent = `✅ Ενημερώθηκαν οι μέρες: ${selectedDaysStay}`;
    message.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #3eb489; color: white; padding: 10px; border-radius: 8px; z-index: 10000;';
    document.body.appendChild(message);
    setTimeout(() => message.remove(), 3000);
}

function updateStep1Display() {
    const destinationCards = document.getElementById('destination-cards');
    if (!destinationCards) return;
    
    destinationCards.innerHTML = `
        <div style="text-align: center; padding: 20px; background: #d4edda; border-radius: 12px; border: 2px solid #3eb489;">
            <h3>✅ Επιλέξατε: ${selectedDestinationName}</h3>
            <p>📅 Διάρκεια διακοπών: ${selectedDaysStay > 0 ? selectedDaysStay + ' μέρες' : 'μη ορισμένες μέρες'}</p>
            <p>💰 Προϋπολογισμός: ${selectedBudget > 0 ? selectedBudget + '€' : 'Δεν ορίστηκε'}</p>
            <p>👨‍👩‍👧‍👦 Μέλη οικογένειας: ${familyMembers.length}</p>
            <p>Μπορείτε να συνεχίστε στο επόμενο βήμα</p>
            <button onclick="goToStep2()" style="padding: 10px 20px; background: #3eb489; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 10px;">
                Συνέχεια στο Βήμα 2
            </button>
        </div>
    `;
}

// ==================== UTILITY FUNCTIONS ====================
function resetFilters(){
    document.querySelectorAll('select').forEach(select => select.value = '');
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    const travelBudget = document.getElementById("travel-budget");
    if (travelBudget) travelBudget.value = '';
    filterDestinations();
}

function clearAllData() {
    if (confirm('⚠️ Θέλετε να διαγράψετε ΟΛΑ τα δεδομένα του ταξιδιού; Αυτή η ενέργεια δεν μπορεί να αναιρεθεί.')) {
        localStorage.removeItem('travelPlannerData');
        familyMembers = [
            { name: "Πατέρας", age: 42 },
            { name: "Μητέρα", age: 40 }
        ];
        updateFamilyMembersUI();
        location.reload();
    }
}

function checkMobileView() {
    const mobileNav = document.querySelector('.mobile-nav');
    const sidebar = document.querySelector('.sidebar');
    
    if (isMobile()) {
        if (mobileNav) mobileNav.style.display = 'block';
        if (sidebar) sidebar.style.display = 'none';
    } else {
        if (mobileNav) mobileNav.style.display = 'none';
        if (sidebar) sidebar.style.display = 'block';
    }
}

// ==================== COMBO CALCULATION FUNCTIONS ====================
function calculateSmartCombos() {
    console.log("🎯 Έναρξη έξυπνου υπολογισμού combos...");
    
    let currentActivities = window.currentCityActivities || [];
    
    if (!currentActivities || currentActivities.length === 0) {
        alert("⚠️ Δεν υπάρχουν διαθέσιμες δραστηριότητες.");
        return;
    }
    
    const selectedActivities = currentActivities.filter(act => act.selected === true);
    
    if (selectedActivities.length === 0) {
        alert("⚠️ Δεν έχετε επιλέξει δραστηριότητες! Κάντε κλικ στις κάρτες.");
        return;
    }
    
    console.log(`✅ Βρέθηκαν ${selectedActivities.length} επιλεγμένες δραστηριότητες`);
    
    alert("🧮 Η λειτουργία υπολογισμού combos θα προστεθεί σύντομα!");
}

// ==================== EVENT LISTENERS & INITIALIZATION ====================
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', () => {
            const target = step.dataset.target;
            if (target === 'step-activities') {
                goToStep4();
            } else if (target === 'step-summary') {
                goToStep5();
            } else if (target === 'step-map') {
                goToStep6();
            } else {
                activateStep(target);
            }
        });
    });
    
    // Mobile navigation
    const mobileSelect = document.getElementById('mobile-step-select');
    if (mobileSelect) {
        mobileSelect.addEventListener('change', function() {
            activateStep(this.value);
        });
    }
    
    // Days stay
    const daysStayElement = document.getElementById("days-stay");
    if (daysStayElement) {
        daysStayElement.addEventListener("change", function() {
            selectedDaysStay = this.value ? parseInt(this.value) : 0;
            saveToLocalStorage();
            
            updateStep1Display();
            
            if (document.getElementById('step-summary')?.classList.contains('active')) {
                setTimeout(() => goToStep5(), 100);
            }
        });
    }
    
    // Budget
    const travelBudgetElement = document.getElementById("travel-budget");
    if (travelBudgetElement) {
        travelBudgetElement.addEventListener("input", function() {
            selectedBudget = this.value ? parseInt(this.value) : 0;
            saveToLocalStorage();
        });
    }
    
    // Family members
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('member-name') || e.target.classList.contains('member-age')) {
            setTimeout(saveToLocalStorage, 100);
        }
    });
    
    // Window resize
    window.addEventListener('resize', checkMobileView);
}

// Initialize the application
function init() {
    console.log("🚀 Αρχικοποίηση εφαρμογής...");
    
    try {
        setupEventListeners();
        loadFromLocalStorage();
        checkMobileView();
        console.log("✅ Οργανωτής ταξιδιού έτοιμος!");
    } catch(error) {
        console.error("❌ Σφάλμα κατά την αρχικοποίηση:", error);
    }
}

// ==================== START APPLICATION ====================
// Περιμένουμε το DOM να φορτωθεί
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
