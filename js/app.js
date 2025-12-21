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

// ==================== EXTRA CITIES CONFIG ====================
const EXTRA_CITIES_CONFIG = {
    "Κωνσταντινούπολη": {
        file: "istanbul.json",
        enabled: true,
        emoji: "🕌"
    },
    "Παρίσι": {
        file: "paris.json",
        enabled: true,
        emoji: "🗼"
    },
    "Πράγα": {
        file: "prague.json",
        enabled: true,
        emoji: "🏰"
    },
    "Ρώμη": {
        file: "data/rome.json",
        enabled: true,
        emoji: "🍕"
    }
};

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
    return window.innerWidth <= 640;
}

function calculateDirectDistance(point1, point2) {
    const R = 6371; // Ακτίνα Γης σε km
    
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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
    document.getElementById("family-options").style.display = (type==="Οικογένεια")?"flex":"none";
}

function filterDestinations(){
    const distance = document.getElementById("distance").value;
    const weather = document.getElementById("weather").value;
    const themeparks = document.getElementById("themeparks").value;
    const christmas = document.getElementById("christmas").value;
    const vacationType = document.getElementById("vacation-type").value;
    const costLevel = document.getElementById("cost-level").value;
    
    const suitabilityFilters = [];
    document.querySelectorAll('#suitability-options input[type="checkbox"]:checked').forEach(cb => {
        suitabilityFilters.push(cb.value);
    });

    const budget = document.getElementById("travel-budget").value;
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
    goToStep2();
}

// ==================== FAMILY MEMBERS MANAGEMENT ====================

function addAdultMember() {
    const container = document.getElementById('family-members-list');
    const adultCount = Array.from(container.querySelectorAll('.family-member-input'))
        .filter(m => m.querySelector('.member-name').value.includes('Ενήλικας')).length + 1;
    
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
    const childCount = Array.from(container.querySelectorAll('.family-member-input'))
        .filter(m => m.querySelector('.member-name').value.includes('Παιδί')).length + 1;
    
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
    const babyCount = Array.from(container.querySelectorAll('.family-member-input'))
        .filter(m => m.querySelector('.member-name').value.includes('Μωρό')).length + 1;
    
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
    button.parentElement.remove();
}

function updateFamilyMembers() {
    familyMembers = [];
    
    document.querySelectorAll('.family-member-input').forEach(memberDiv => {
        const nameInput = memberDiv.querySelector('.member-name');
        const ageInput = memberDiv.querySelector('.member-age');
        
        const name = nameInput.value;
        let age = parseInt(ageInput.value);
                      
        if (name && age >= 0) {
            familyMembers.push({ name, age });
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
    
    document.querySelector(`[data-target="${targetId}"]`).classList.add('active');
    document.getElementById(targetId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToStep2(){
    activateStep('step-flight');
}

function goToStep3(){
    activateStep('step-hotel');
    document.getElementById("hotel-destination").value = selectedDestinationName;
}

async function goToStep4() {
    activateStep('step-activities');
    
    const step4Section = document.getElementById("step-activities");
    const activityContainer = document.getElementById("activities-container");
    const overallTotalDiv = document.getElementById("overall-total");
    const step5BtnContainer = step4Section.querySelector('.step-5-btn-container');

    // 1. ΦΟΡΤΩΣΗ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ ΜΕ ΤΟ ΝΕΟ ΣΥΣΤΗΜΑ
    const cityData = await loadCityActivities(selectedDestinationName);
    
    if (!cityData || cityData.activities.length === 0) {
        // ΑΝ ΔΕΝ ΒΡΕΘΟΥΝ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ
        step4Section.querySelector('h1').innerText = `Βήμα 4: Προορισμός: ${selectedDestinationName || 'Χωρίς Επιλογή'}`;
        activityContainer.style.display = 'block';
        overallTotalDiv.style.display = 'none';
        step5BtnContainer.style.display = 'none';
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
        return;
    }
    
    // 2. ΕΜΦΑΝΙΣΗ ΤΙΤΛΟΥ
    step4Section.querySelector('h1').innerText = `Οικογενειακές Δραστηριότητες - ${cityData.name}`;
    
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
    
    activityContainer.style.display = 'grid';
    overallTotalDiv.style.display = 'block';
    step5BtnContainer.style.display = 'block';
    
    saveToLocalStorage();
}

function goToStep5(){
    preloadLeaflet();
    
    const daysSelect = document.getElementById("days-stay");
    selectedDaysStay = daysSelect.value ? parseInt(daysSelect.value) : 0;
    
    activateStep('step-summary');
    const summaryDiv = document.getElementById('summary-content');
    
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
        overallElement.textContent = `Συνολικό Κόστος: ${overallTotal} €`;
    }
    
    console.log("💰 Συνολικό κόστος:", overallTotal, "€");
}

// ==================== SMART DAILY PROGRAM ====================

function createSmartDailyProgram(activities, days) {
    const activitiesWithCoords = activities.filter(act => act.location && act.location.lat);
    
    if (activitiesWithCoords.length === 0) {
        if (!activities || activities.length === 0) {
            return '<p>Δεν έχετε επιλέξει δραστηριότητες.</p>';
        }
        
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
    if (activities.length <= numClusters) {
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
    if (activities.length < 2) return '';
    
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
    
    if (!mapDiv) {
        mapContainer.innerHTML = '<div id="smart-map" style="height: 100%; width: 100%;"></div>';
    }
    
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
    
    const map = L.map('smart-map').setView(mapCenter, mapZoom);
    window.currentMap = map;
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    addActivityMarkers(map, activities);
    addMapCloseButton(mapContainer, map);
    loadCustomPointsOnMap();
}

function addActivityMarkers(map, activities) {
    console.log("📍 Προσθήκη πινεζών για", activities.length, "δραστηριότητες");
    
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

function handleMarkerClick(marker, selectedMarkers, map, activity) {
    console.log("📍 Κλικ σε πινέζα δραστηριότητας:", activity.name);
    
    const markerIndex = selectedMarkers.indexOf(marker);
    if (markerIndex === -1) {
        selectedMarkers.push(marker);
        
        marker.setIcon(L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        }));
        
        console.log("✅ Προστέθηκε στις επιλογές. Επιλεγμένα:", selectedMarkers.length);
        
    } else {
        selectedMarkers.splice(markerIndex, 1);
        
        let color = 'green';
        if (selectedDestinationName.includes("Βερολίνο")) color = 'blue';
        else if (selectedDestinationName.includes("Λισαβόνα")) color = 'red';
        else if (selectedDestinationName.includes("Βουδαπέστη")) color = 'orange';
        else color = 'green';
        
        marker.setIcon(L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        }));
        
        console.log("❌ Αφαιρέθηκε από τις επιλογές. Επιλεγμένα:", selectedMarkers.length);
    }
    
    if (selectedMarkers.length === 2) {
        console.log("🗺️ Δημιουργία διαδρομής μεταξύ 2 σημείων");
        
        window.selectedMarkersForRoute = selectedMarkers.map(marker => ({
            marker: marker,
            activity: null
        }));
        
        showRouteAndDirections(selectedMarkers[0], selectedMarkers[1], map);
    } else if (selectedMarkers.length > 2) {
        console.log("⚠️ Περισσότερες από 2 επιλογές - διατήρηση των 2 τελευταίων");
        
        const oldMarker = selectedMarkers.shift();
        
        let color = 'green';
        if (selectedDestinationName.includes("Βερολίνο")) color = 'blue';
        else if (selectedDestinationName.includes("Λισαβόνα")) color = 'red';
        else if (selectedDestinationName.includes("Βουδαπέστη")) color = 'orange';
        else color = 'green';
        
        oldMarker.setIcon(L.icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        }));
        
        showRouteAndDirections(selectedMarkers[0], selectedMarkers[1], map);
    } else {
        console.log("🗑️ Καθαρισμός διαδρομής");
        if (window.polyline) {
            map.removeLayer(window.polyline);
            window.polyline = null;
        }
        
        const directionsDiv = document.getElementById('route-directions');
        if (directionsDiv) directionsDiv.remove();
    }
}

function showRouteAndDirections(marker1, marker2, map) {
    console.log("📍 Δημιουργία διαδρομής μεταξύ σημείων");
    
    if (!marker1 || !marker2 || !map) {
        console.error("❌ Λείπουν απαραίτητα στοιχεία για διαδρομή");
        return;
    }
    
    const latlngs = [marker1.getLatLng(), marker2.getLatLng()];
    
    if (window.polyline) {
        map.removeLayer(window.polyline);
    }
    
    window.polyline = L.polyline(latlngs, {
        color: 'red',
        weight: 5,
        opacity: 0.7,
        dashArray: '10, 10'
    }).addTo(map);
    
    const distance = map.distance(latlngs[0], latlngs[1]) / 1000;
    console.log("📏 Απόσταση:", distance.toFixed(2), "km");
    
    createDirectionsPanel(latlngs[0], latlngs[1], distance, map);
}

function createDirectionsPanel(point1, point2, distance, map) {
    console.log("📝 Δημιουργία οδηγιών για:", distance.toFixed(2), "km");
    
    const oldPanel = document.getElementById('route-directions');
    if (oldPanel) oldPanel.remove();
    
    const walkTime = Math.round(distance * 15);
    const carTime = Math.round(distance * 3);
    const transitTime = Math.round(distance * 5);
    const bikeTime = Math.round(distance * 8);
    
    let point1Name = "Σημείο Α";
    let point2Name = "Σημείο Β";
    
    if (selectedMarkersForRoute.length >= 2) {
        point1Name = selectedMarkersForRoute[0].activity?.name || "Σημείο Α";
        point2Name = selectedMarkersForRoute[1].activity?.name || "Σημείο Β";
    }
    
    const directionsDiv = document.createElement('div');
    directionsDiv.id = 'route-directions';
    directionsDiv.style.cssText = `
        position: absolute;
        top: 80px;
        right: 15px;
        background: white;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 1000;
        max-width: 380px;
        width: 90%;
        border: 3px solid #3eb489;
        font-family: 'Comic Neue', Arial, sans-serif;
        animation: slideIn 0.3s ease-out;
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    directionsDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; color: #3eb489; font-size: 1.4em;">🗺️ Οδηγίες Μετακίνησης</h3>
            <button onclick="closeDirectionsPanel()" 
                    style="background: #e74c3c; color: white; border: none; border-radius: 50%; 
                           width: 30px; height: 30px; cursor: pointer; font-size: 16px; font-weight: bold;">
                ×
            </button>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <div style="width: 20px; height: 20px; background: #ff0000; border-radius: 50%; margin-right: 10px;"></div>
                <div><strong>${point1Name}</strong></div>
            </div>
            
            <div style="text-align: center; margin: 10px 0; color: #666; font-size: 0.9em;">
                ↓ ${distance.toFixed(1)} km ↓
            </div>
            
            <div style="display: flex; align-items: center;">
                <div style="width: 20px; height: 20px; background: #00ff00; border-radius: 50%; margin-right: 10px;"></div>
                <div><strong>${point2Name}</strong></div>
            </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #3eb489, #4c7af0); 
                    padding: 15px; border-radius: 10px; margin-bottom: 20px; text-align: center; color: white;">
            <div style="font-size: 14px; margin-bottom: 5px;">📏 ΑΠΟΣΤΑΣΗ</div>
            <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">
                ${distance.toFixed(1)} km
            </div>
            <div style="font-size: 12px; opacity: 0.9;">
                ${distance < 1 ? "Κοντά! 🎯" : distance < 3 ? "Μέτρια απόσταση 👌" : "Μακριά ⚠️"}
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; color: #2c3e50; font-size: 1.1em;">⏱️ Εκτιμώμενος Χρόνος</h4>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                <div style="padding: 12px; background: #e8f5e9; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px;">🚶</div>
                    <div style="font-size: 16px; font-weight: bold; color: #2e7d32;">${walkTime} λεπτά</div>
                    <div style="font-size: 11px; color: #666; margin-top: 3px;">Περπάτημα</div>
                </div>
                
                <div style="padding: 12px; background: #e3f2fd; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px;">🚗</div>
                    <div style="font-size: 16px; font-weight: bold; color: #1565c0;">${carTime} λεπτά</div>
                    <div style="font-size: 11px; color: #666; margin-top: 3px;">Αυτοκίνητο</div>
                </div>
                
                <div style="padding: 12px; background: #fff3e0; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px;">🚇</div>
                    <div style="font-size: 16px; font-weight: bold; color: #f57c00;">${transitTime} λεπτά</div>
                    <div style="font-size: 11px; color: #666; margin-top: 3px;">ΜΜΜ</div>
                </div>
                
                <div style="padding: 12px; background: #f3e5f5; border-radius: 8px; text-align: center;">
                    <div style="font-size: 24px;">🚲</div>
                    <div style="font-size: 16px; font-weight: bold; color: #7b1fa2;">${bikeTime} λεπτά</div>
                    <div style="font-size: 11px; color: #666; margin-top: 3px;">Ποδήλατο</div>
                </div>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 15px; text-align: center;">
            <a href="https://www.google.com/maps/dir/${point1.lat},${point1.lng}/${point2.lat},${point2.lng}"
               target="_blank"
               style="display: block; padding: 14px; background: #4c7af0; color: white; 
                      text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                      transition: all 0.3s; border: 2px solid #4c7af0;">
                <span style="font-size: 20px; margin-right: 8px;">📱</span>
                Άνοιγμα Google Maps
                <span style="font-size: 14px; margin-left: 8px;">↗️</span>
            </a>
            <p style="font-size: 12px; color: #666; margin-top: 8px; margin-bottom: 0;">
                Θα ανοίξει σε νέα καρτέλα με πλήρεις οδηγίες
            </p>
        </div>
        
        <button onclick="clearRouteSelections()"
                style="width: 100%; padding: 14px; background: #3eb489; color: white; 
                       border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: bold;">
            🗑️ Καθαρισμός Επιλογών
        </button>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        #route-directions a:hover {
            background: #3a6bd9 !important;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(76, 122, 240, 0.3);
        }
    `;
    directionsDiv.appendChild(style);
    
    map.getContainer().appendChild(directionsDiv);
}

function addMapCloseButton(mapContainer, map) {
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✖️ Κλείσιμο Χάρτη';
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
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
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    closeBtn.onclick = () => {
        mapContainer.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="font-size: 18px; margin-bottom: 20px;">Ο χάρτης έκλεισε.</p>
                <button onclick="initializeSmartMap()" style="padding: 12px 25px; background: #3eb489; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    🗺️ Ξαναφόρτωση Χάρτη
                </button>
            </div>
        `;
    };
    mapContainer.appendChild(closeBtn);
}

function closeDirectionsPanel() {
    console.log("🗑️ Κλείσιμο οδηγιών μετακίνησης");
    
    const directionsDiv = document.getElementById('route-directions');
    if (directionsDiv) {
        directionsDiv.style.animation = 'slideOut 0.2s ease-in';
        setTimeout(() => directionsDiv.remove(), 200);
    }
    
    if (window.polyline && window.currentMap) {
        window.currentMap.removeLayer(window.polyline);
        window.polyline = null;
    }
    
    if (window.customMarkers) {
        window.customMarkers.forEach(markerObj => {
            const color = 'green';
            markerObj.marker.setIcon(L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
                iconSize: [25, 41],
                iconAnchor: [12, 41]
            }));
        });
    }
    
    if (window.selectedMarkersForRoute) {
        window.selectedMarkersForRoute = [];
    }
}

function clearRouteSelections() {
    console.log("🗑️ Καθαρισμός όλων των επιλογών");
    
    closeDirectionsPanel();
    
    const message = document.createElement('div');
    message.textContent = "✅ Οι επιλογές διαδρομής καθαρίστηκαν";
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3eb489;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: fadeInOut 3s ease;
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 3000);
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

function searchPointByName() {
    const query = prompt('🔍 Γράψτε το όνομα της τοποθεσίας:\n\nΠαραδείγματα:\n• Βατικανό\n• Πύργος του Άιφελ\n• Disneyland Paris\n• Κολωνάκι Αθήνα\n• Στάδιο Σπύρος Λούης');
    
    if (!query || query.trim() === '') {
        alert('❌ Δεν εισάγατε όνομα');
        return;
    }
    
    alert('🔍 Αναζήτηση τοποθεσίας... Παρακαλώ περιμένετε.');
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                if (data.length > 1) {
                    let optionsText = '📋 Βρέθηκαν πολλές τοποθεσίες:\n\n';
                    data.slice(0, 5).forEach((item, index) => {
                        optionsText += `${index + 1}. ${item.display_name}\n`;
                    });
                    optionsText += '\nΕπιλέξτε αριθμό (1-5) ή 0 για ακύρωση:';
                    
                    const choice = prompt(optionsText);
                    const choiceNum = parseInt(choice);
                    
                    if (choiceNum >= 1 && choiceNum <= data.length) {
                        const selected = data[choiceNum - 1];
                        showCustomPointForm(selected.lat, selected.lon, `${selected.display_name}`);
                    } else {
                        alert('Ακυρώθηκε');
                    }
                } else {
                    const firstResult = data[0];
                    showCustomPointForm(firstResult.lat, firstResult.lon, `${firstResult.display_name}`);
                }
            } else {
                alert('❌ Δεν βρέθηκε τοποθεσία με αυτό το όνομα.\n\n💡 Δοκιμάστε:\n• Πιο συγκεκριμένο όνομα\n• Ή χρησιμοποιήστε "Κλικ στον χάρτη"');
                startAddingCustomPoint();
            }
        })
        .catch(error => {
            console.error('Σφάλμα αναζήτησης:', error);
            alert('⚠️ Προσωρινό σφάλμα αναζήτησης.\n\n💡 Παρακαλώ δοκιμάστε "Κλικ στον χάρτη" για τώρα.');
            startAddingCustomPoint();
        });
}

function searchPointByAddress() {
    const address = prompt('📫 Βάλτε πλήρη διεύθυνση:\n\nΠαραδείγματα:\n• Μοτσαρτστράσε 12, Βιέννη\n• Πλατεία Συντάγματος 2, Αθήνα\n• Champs-Élysées 50, Παρίσι');
    
    if (!address || address.trim() === '') {
        alert('❌ Δεν εισάγατε διεύθυνση');
        return;
    }
    
    alert('📡 Αναζήτηση διεύθυνσης... Παρακαλώ περιμένετε.');
    
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const result = data[0];
                showCustomPointForm(result.lat, result.lon, `${result.display_name}`);
            } else {
                alert('❌ Δεν βρέθηκε η διεύθυνση.\n\n💡 Δοκιμάστε:\n• Πιο συγκεκριμένη διεύθυνση\n• Ή χρησιμοποιήστε "Κλικ στον χάρτη"');
                startAddingCustomPoint();
            }
        })
        .catch(error => {
            console.error('Σφάλμα αναζήτησης διεύθυνσης:', error);
            alert('⚠️ Προσωρινό σφάλμα.\n💡 Παρακαλώ δοκιμάστε "Κλικ στον χάρτη".');
            startAddingCustomPoint();
        });
}

function showCustomPointForm(lat, lng, suggestedName = '') {
    const formHTML = `
        <div id="custom-point-modal" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 450px;
            width: 90%;
        ">
            <h3 style="margin-top: 0; color: #9c27b0;">🏆 Προσθήκη Νέου Σημείου</h3>
            
            <div style="background: #f0f0f0; padding: 10px; border-radius: 8px; margin-bottom: 15px; font-size: 0.9em;">
                📍 Συντεταγμένες: ${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}
            </div>
            
            <label style="display: block; margin: 10px 0 5px 0;">🏷️ Όνομα:</label>
            <input type="text" id="custom-point-name" 
                   value="${suggestedName ? suggestedName.split(',')[0] : ''}"
                   placeholder="π.χ. Το ξενοδοχείο μας" 
                   style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 10px;">
            
            <label style="display: block; margin: 10px 0 5px 0;">📝 Τύπος:</label>
            <select id="custom-point-type" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 15px;">
                <option value="attraction">🏛️ Αξιοθέατο</option>
                <option value="hotel" selected>🏨 Ξενοδοχείο</option>
                <option value="restaurant">🍽️ Εστιατόριο</option>
                <option value="cafe">☕ Καφέ</option>
                <option value="shop">🛍️ Κατάστημα</option>
                <option value="transport">🚇 Σταθμός Μεταφορών</option>
                <option value="personal">🏠 Προσωπικό Σημείο</option>
                <option value="other">📍 Άλλο</option>
            </select>
            
            <label style="display: block; margin: 10px 0 5px 0;">📝 Σημείωση (προαιρετικό):</label>
            <textarea id="custom-point-note" placeholder="π.χ. Το ξενοδοχείο όπου θα μείνουμε, Κλειστά Τρίτες..." 
                     style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #ccc; margin-bottom: 15px; height: 80px;"></textarea>
            
            <div style="text-align: center;">
                <button onclick="saveCustomPoint(${lat}, ${lng})" 
                        style="padding: 12px 25px; background: #9c27b0; color: white; border: none; border-radius: 8px; cursor: pointer; margin: 5px; font-size: 16px;">
                    💾 Αποθήκευση
                </button>
                <button onclick="closeCustomPointForm()" 
                        style="padding: 12px 25px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; margin: 5px; font-size: 16px;">
                    ❌ Ακύρωση
                </button>
            </div>
        </div>
    `;
    
    const oldModal = document.getElementById('custom-point-modal');
    if (oldModal) oldModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', formHTML);
}

function saveCustomPoint(lat, lng) {
    const name = document.getElementById('custom-point-name').value;
    const type = document.getElementById('custom-point-type').value;
    const note = document.getElementById('custom-point-note').value;
    
    if (!name.trim()) {
        alert('⚠️ Παρακαλώ συμπληρώστε όνομα!');
        return;
    }
    
    const newPoint = {
        id: Date.now(),
        name: name.trim(),
        type: type,
        lat: lat,
        lng: lng,
        note: note.trim(),
        date: new Date().toLocaleDateString('el-GR')
    };
    
    customPoints.push(newPoint);
    localStorage.setItem('travel_custom_points', JSON.stringify(customPoints));
    
    addCustomPointToMap(newPoint);
    closeCustomPointForm();
    
    alert(`✅ Το σημείο "${name}" προστέθηκε στον χάρτη!`);
}

function closeCustomPointForm() {
    const modal = document.getElementById('custom-point-modal');
    if (modal) modal.remove();
}

function addCustomPointToMap(point) {
    if (typeof L === 'undefined' || !window.currentMap) return;
    
    const map = window.currentMap;
    
    const typeColors = {
        'attraction': 'violet',
        'restaurant': 'red',
        'cafe': 'orange',
        'shop': 'blue',
        'personal': 'green',
        'other': 'gray'
    };
    
    const color = typeColors[point.type] || 'gray';
    
    const customIcon = L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41]
    });
    
    const marker = L.marker([point.lat, point.lng], { icon: customIcon }).addTo(map);
    
    const typeNames = {
        'attraction': '🏛️ Αξιοθέατο',
        'restaurant': '🍽️ Εστιατόριο',
        'cafe': '☕ Καφέ',
        'shop': '🛍️ Κατάστημα',
        'personal': '🏠 Προσωπικό Σημείο',
        'other': '📍 Άλλο'
    };
    
    marker.bindPopup(`
        <div style="max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #9c27b0;">${point.name}</h4>
            <p style="margin: 0 0 5px 0;"><strong>${typeNames[point.type] || '📍 Σημείο'}</strong></p>
            ${point.note ? `<p style="margin: 5px 0; font-size: 0.9em;">📝 ${point.note}</p>` : ''}
            <p style="margin: 5px 0; font-size: 0.85em; color: #666;">Προστέθηκε: ${point.date}</p>
            <button onclick="deleteCustomPoint(${point.id}, this)" 
                    style="padding: 5px 10px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em;">
                🗑️ Διαγραφή
            </button>
        </div>
    `);
    
    if (!window.customMarkers) window.customMarkers = [];
    window.customMarkers.push({ id: point.id, marker: marker });
}

function deleteCustomPoint(id, button) {
    if (!confirm('⚠️ Θέλετε να διαγράψετε αυτό το σημείο;')) return;
    
    if (window.customMarkers) {
        const markerIndex = window.customMarkers.findIndex(m => m.id === id);
        if (markerIndex !== -1) {
            window.currentMap.removeLayer(window.customMarkers[markerIndex].marker);
            window.customMarkers.splice(markerIndex, 1);
        }
    }
    
    customPoints = customPoints.filter(point => point.id !== id);
    localStorage.setItem('travel_custom_points', JSON.stringify(customPoints));
    
    viewCustomPoints();
    
    alert('✅ Το σημείο διαγράφηκε!');
}

function viewCustomPoints() {
    const container = document.getElementById('custom-points-container');
    const listDiv = document.getElementById('custom-points-list');
    
    if (customPoints.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <p>📭 Δεν έχετε προσθέσει ακόμα προσωπικά σημεία.</p>
                <p>Κάντε κλικ στο "🟣 Προσθήκη Σημείου στον Χάρτη" για να ξεκινήσετε!</p>
            </div>
        `;
    } else {
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">';
        
        customPoints.forEach(point => {
            const typeNames = {
                'attraction': '🏛️ Αξιοθέατο',
                'restaurant': '🍽️ Εστιατόριο',
                'cafe': '☕ Καφέ',
                'shop': '🛍️ Κατάστημα',
                'personal': '🏠 Προσωπικό Σημείο',
                'other': '📍 Άλλο'
            };
            
            html += `
                <div style="background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-left: 4px solid #9c27b0;">
                    <h4 style="margin: 0 0 8px 0;">${point.name}</h4>
                    <p style="margin: 0 0 5px 0; color: #666;">${typeNames[point.type] || '📍 Σημείο'}</p>
                    ${point.note ? `<p style="margin: 0 0 5px 0; font-size: 0.9em;">📝 ${point.note}</p>` : ''}
                    <p style="margin: 0 0 8px 0; font-size: 0.85em; color: #999;">🌍 Συντεταγμένες: ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}</p>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="focusOnPoint(${point.lat}, ${point.lng})" 
                                style="padding: 6px 12px; background: #3eb489; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                            🗺️ Δείξε στον χάρτη
                        </button>
                        <button onclick="deleteCustomPoint(${point.id})" 
                                style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
                            🗑️ Διαγραφή
                        </button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }
    
    listDiv.style.display = 'block';
}

function focusOnPoint(lat, lng) {
    if (typeof L === 'undefined' || !window.currentMap) {
        alert('⚠️ Πρέπει πρώτα να φορτώσετε τον χάρτη!');
        return;
    }
    
    window.currentMap.setView([lat, lng], 16);
    
    if (window.customMarkers) {
        const pointMarker = window.customMarkers.find(m => 
            Math.abs(m.marker.getLatLng().lat - lat) < 0.001 && 
            Math.abs(m.marker.getLatLng().lng - lng) < 0.001
        );
        
        if (pointMarker) {
            pointMarker.marker.openPopup();
        }
    }
}

function loadCustomPointsOnMap() {
    if (typeof L === 'undefined' || !window.currentMap) return;
    
    if (window.customMarkers) {
        window.customMarkers.forEach(m => window.currentMap.removeLayer(m.marker));
        window.customMarkers = [];
    }
    
    customPoints.forEach(point => {
        addCustomPointToMap(point);
    });
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
    const selectedCity = document.getElementById('quick-city').value;
    const selectedDays = document.getElementById("days-stay").value;
    
    if (selectedCity) {
        selectedDestinationName = selectedCity;
        updateCityBackground(selectedCity);
        selectedDaysStay = selectedDays ? parseInt(selectedDays) : 0;
        
        const budget = document.getElementById("travel-budget").value;
        if (budget) {
            selectedBudget = parseInt(budget);
        }
        
        updateStep1Display();
        
        document.getElementById('quick-city-select').style.display = 'none';
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
                document.getElementById("days-stay").value = selectedDaysStay;
            }
            
            if (selectedBudget > 0) {
                document.getElementById("travel-budget").value = selectedBudget;
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
    selectedDaysStay = daysSelect.value ? parseInt(daysSelect.value) : 0;
    
    saveToLocalStorage();
    
    updateStep1Display();
    
    if (document.getElementById('step-summary').classList.contains('active')) {
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
    document.getElementById("travel-budget").value = '';
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
    
    const ageGroups = categorizeFamilyMembersForCombo();
    const totalRegularCost = calculateComboRegularCost(selectedActivities, ageGroups);
    
    let availableCombos = [];
    
    if (selectedDestinationName.includes("Λονδίνο")) {
        availableCombos = findLondonCombos(selectedActivities, ageGroups);
    } else if (selectedDestinationName.includes("Βιέννη")) {
        availableCombos = findViennaCombos(selectedActivities, ageGroups);
    } else if (selectedDestinationName.includes("Βερολίνο")) {
        availableCombos = findBerlinCombos(selectedActivities, ageGroups);
    } else {
        availableCombos = findGenericCombos(selectedActivities, ageGroups);
    }
    
    let bestCombo = null;
    let bestSaving = 0;
    
    availableCombos.forEach(combo => {
        const comboRegularCost = combo.regularPrice;
        const comboSaving = comboRegularCost - combo.comboPrice;
        
        if (comboSaving > bestSaving) {
            bestSaving = comboSaving;
            bestCombo = combo;
        }
    });
    
    let finalTotalCost = totalRegularCost;
    if (bestCombo && bestSaving > 0) {
        finalTotalCost = totalRegularCost - bestSaving;
    }
    
    const results = {
        totalRegularCost: totalRegularCost,
        bestCombo: bestCombo,
        bestSaving: bestSaving,
        finalTotalCost: finalTotalCost,
        allCombos: availableCombos
    };
    
    displayComboResults(results, totalRegularCost);
}

function categorizeFamilyMembersForCombo() {
    console.log("👨‍👩‍👧‍👦 Κατηγοριοποίηση οικογένειας για combo...");
    
    const categories = {
        "0-2": 0,
        "3-5": 0,
        "6-14": 0,
        "15-19": 0,
        "18+": 0
    };
    
    familyMembers.forEach(member => {
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
    
    return categories;
}

function findLondonCombos(selectedActivities, ageGroups) {
    console.log("🏴󠁧󠁢󠁥󠁮󠁧󠁿 Αναζήτηση combos για Λονδίνο");
    const combos = [];
    
    // MERLIN PASS COMBO
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
    
    // LONDON PASS COMBO
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
    
    // SEA LIFE + LONDON EYE COMBO
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
    
    const imperialActivities = selectedActivities.filter(act => 
        act.name.includes("Schönbrunn") || 
        act.name.includes("Sisi") ||
        act.name.includes("Hofburg") ||
        act.name.includes("Palace")
    );
    
    if (imperialActivities.length >= 2) {
        const normalCost = calculateComboRegularCost(imperialActivities, ageGroups);
        const passCost = 57;
        
        if (normalCost > passCost) {
            combos.push({
                name: "👑 Sisi Pass Vienna",
                description: "Πρόσβαση σε 3 αυτοκρατορικά αξιοθέατα",
                activities: imperialActivities.map(a => a.name),
                regularPrice: normalCost,
                comboPrice: passCost,
                saving: normalCost - passCost,
                note: "Schönbrunn + Sisi Museum + Furniture Museum"
            });
        }
    }
    
    return combos;
}

function findBerlinCombos(selectedActivities, ageGroups) {
    console.log("🇩🇪 Αναζήτηση combos για Βερολίνο");
    const combos = [];
    
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

function findGenericCombos(selectedActivities, ageGroups) {
    console.log("🌍 Αναζήτηση γενικών combos");
    const combos = [];
    
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
            note: "20% έκπτωση στο συνδυασμό (μόνο για αυτές τις 2 δραστηριότητες)"
        });
    }
    
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
            note: "15% έκπτωση για 3 μουσεία (μόνο για αυτά τα 3)"
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
            <h2 style="color: #9c27b0; margin-top: 0;">💰 Έξυπνος Υπολογισμός Combos - ${selectedDestinationName}</h2>
            
            <div style="background: #f3e5f5; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h3 style="color: #7b1fa2;">📊 Κόστος ΧΩΡΙΣ Combos: <strong>${regularCost.toFixed(2)} €</strong></h3>
                <p style="color: #666;">🏙️ Πόλη: ${selectedDestinationName} | 👨‍👩‍👧‍👦 Μέλη: ${familyMembers.length}</p>
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
            const borderColor = combo.saving > 0 ? '#4caf50' : '#ff9800';
            const bgColor = combo.saving > 0 ? '#f1f8e9' : '#fff3e0';
            
            const totalWithThisCombo = regularCost - combo.saving;
            
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
                    
                    <div style="background: ${combo.saving > 0 ? '#e8f5e9' : '#ffebee'}; padding: 8px; border-radius: 6px; margin: 8px 0;">
                        <div style="display: flex; justify-content: space-between;">
                            <span><strong>Εξοικονόμηση:</strong></span>
                            <span style="color: ${combo.saving > 0 ? '#4caf50' : '#f44336'}; font-weight: bold;">
                                ${combo.saving > 0 ? '💰 ' : '⚠️ '}${combo.saving.toFixed(2)}€
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
        
        if (selectedDestinationName.includes('Λονδίνο')) {
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
                <p><small>Αυτές είναι οι δραστηριότητες που καλύπτονται από τα Merlin Pass και άλλα εκπτωτικά πακέτα.</small></p>
            `;
        } else {
            contentHTML += `
                <p>💡 Γενική συμβουλή: Τα εκπτωτικά πακέτα (combos) συνήθως υπάρχουν για:</p>
                <ul style="text-align: left; display: inline-block; margin: 10px 0;">
                    <li>Πολλά μουσεία/αξιοθέατα της ίδιας εταιρείας</li>
                    <li>Ζωολογικός κήπος + Ενυδρείο</li>
                    <li>Θεματικά πάρκα της ίδιας ομάδας</li>
                    <li>Πακέτα πόλης (π.χ. Vienna Pass, Berlin WelcomeCard)</li>
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
                    <li>👨‍👩‍👧‍👦 <strong>Μέλη οικογένειας:</strong> ${familyMembers.length} άτομα</li>
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

function applyComboToTotal(comboName, savingAmount) {
    console.log(`✅ Εφαρμογή combo: ${comboName} (Εξοικονόμηση: ${savingAmount}€)`);
    
    closeComboModal();
    
    const totalElement = document.getElementById('overall-total');
    if (!totalElement) {
        alert('⚠️ Δεν βρέθηκε το συνολικό κόστος');
        return;
    }
    
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

function closeComboModal() {
    const modal = document.getElementById('combo-modal-main');
    if (modal) modal.remove();
    
    const closeBtn = document.querySelector('button[style*="position: absolute"][style*="top: 20px"]');
    if (closeBtn) closeBtn.remove();
}

// ==================== EVENT LISTENERS & INITIALIZATION ====================

// Setup event listeners for sidebar navigation
function setupEventListeners() {
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
    
    document.getElementById("days-stay").addEventListener("change", function() {
        selectedDaysStay = this.value ? parseInt(this.value) : 0;
        saveToLocalStorage();
        
        updateStep1Display();
        
        if (document.getElementById('step-summary').classList.contains('active')) {
            setTimeout(() => goToStep5(), 100);
        }
    });
    
    document.getElementById("travel-budget").addEventListener("input", function() {
        selectedBudget = this.value ? parseInt(this.value) : 0;
        saveToLocalStorage();
    });
    
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('member-name') || e.target.classList.contains('member-age')) {
            setTimeout(saveToLocalStorage, 100);
        }
    });
    
    window.addEventListener('resize', checkMobileView);
}

// Initialize the application
function init() {
    console.log("🚀 Αρχικοποίηση Οικογενειακού Ταξιδιωτικού Οργανωτή...");
    
    setupEventListeners();
    
    setTimeout(() => {
        loadFromLocalStorage();
        checkMobileView();
    }, 100);
    
    console.log("✅ Οργανωτής ταξιδιού έτοιμος!");
}

// Αντί για DOMContentLoaded, περιμένουμε να φορτωθεί ΟΛΗ η σελίδα
window.addEventListener('load', init);
