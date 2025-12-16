// travel-data-manager.js - ΝΕΑ ΑΠΛΗ ΕΚΔΟΣΗ
class TravelDataManager {
    constructor() {
        console.log('✅ TravelDataManager loaded');
        this.cityCache = {};
    }
    
    // ΒΟΗΘΗΤΙΚΗ: Υπολογισμός τιμής για συγκεκριμένη ηλικία
    calculatePriceForMember(age, prices) {
        if (!prices || typeof age !== 'number') return 0;
        
        // Χρήση του νέου unified manager
        if (window.UnifiedAgeManager) {
            const category = window.UnifiedAgeManager.getCategoryKey(age);
            const price = prices[category];
            
            if (price !== undefined && price !== null) {
                if (typeof price === 'number') return price;
                if (typeof price === 'string') {
                    const num = parseFloat(price);
                    return isNaN(num) ? 0 : num;
                }
            }
        }
        
        return 0;
    }
    
    // Λήψη δεδομένων πόλης
    getCityData(cityName) {
        console.log(`🔍 Ζητήθηκε δεδομένα για: ${cityName}`);
        
        // Έλεγχος cache
        if (this.cityCache[cityName]) {
            console.log(`📦 Επιστροφή από cache: ${cityName}`);
            return this.cityCache[cityName];
        }
        
        let cityData = null;
        
        // 1. Έλεγχος για ενσωματωμένες πόλεις
        if (cityName.includes("Βιέννη")) {
            cityData = this.getViennaData();
        } else if (cityName.includes("Βερολίνο")) {
            cityData = this.getBerlinData();
        } else if (cityName.includes("Λισαβόνα")) {
            cityData = this.getLisbonData();
        } else if (cityName.includes("Βουδαπέστη")) {
            cityData = this.getBudapestData();
        } else if (cityName.includes("Μαδρίτη")) {
            cityData = this.getMadridData();
        }
        // 2. Έλεγχος για πόλεις από JSON (Κωνσταντινούπολη, Παρίσι, Πράγα)
        else if (window.loadedExtraCityActivities) {
            console.log('📁 Χρήση προφορτωμένων δραστηριοτήτων από JSON');
            cityData = {
                name: cityName,
                activities: window.loadedExtraCityActivities
            };
        }
        
        // Μετατροπή των δραστηριοτήτων σε unified format
        if (cityData && cityData.activities && window.UnifiedAgeManager) {
            cityData.activities = cityData.activities.map(activity => 
                window.UnifiedAgeManager.convertActivity(activity)
            );
            console.log(`🔄 Μετατροπή ${cityData.activities.length} δραστηριοτήτων σε unified format`);
        }
        
        // Αποθήκευση στο cache
        if (cityData) {
            this.cityCache[cityName] = cityData;
        }
        
        return cityData;
    }
    
    // ΒΟΗΘΗΤΙΚΕΣ: Ενσωματωμένες πόλεις (κρατάμε μόνο τα βασικά)
    getViennaData() {
        return {
            name: "Βιέννη",
            activities: activities || [] // χρησιμοποιεί την υπάρχουσα global μεταβλητή
        };
    }
    
    getBerlinData() {
        return {
            name: "Βερολίνο",
            activities: activitiesBerlin || []
        };
    }
    
    getLisbonData() {
        return {
            name: "Λισαβόνα",
            activities: activitiesLisbon || []
        };
    }
    
    getBudapestData() {
        return {
            name: "Βουδαπέστη",
            activities: activitiesBudapest || []
        };
    }
    
    getMadridData() {
        return {
            name: "Μαδρίτη",
            activities: activitiesMadrid || []
        };
    }
}

// Δημιουργία global instance
window.TravelDataManager = new TravelDataManager();
console.log('🚀 TravelDataManager initialized');
