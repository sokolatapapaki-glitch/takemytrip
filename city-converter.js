// city-converter.js
// ΑΥΤΟΜΑΤΟΣ ΜΕΤΑΤΡΟΠΕΑΣ ΗΛΙΚΙΑΚΩΝ ΟΜΑΔΩΝ

class CityConverter {
  // ΕΝΙΑΙΟ ΣΤΑΝΤΑΡ ΗΛΙΚΙΑΚΩΝ ΟΜΑΔΩΝ
  static STANDARD_GROUPS = {
    "0-2": { min: 0, max: 2 },
    "3-5": { min: 3, max: 5 },
    "6-14": { min: 6, max: 14 },
    "15-19": { min: 15, max: 19 },
    "18+": { min: 18, max: 999 }
  };

    // ΚΑΝΟΝΕΣ ΜΕΤΑΤΡΟΠΗΣ
  static CONVERSION_RULES = {
    // ΚΑΝΟΝΑΣ 1: Για "0-6", "7-12", "13-17", "18+" (Τοπ Καπί, Αγία Σοφία)
    "0-6": {
  "0-2": "0-6",    // Από "0-6"
  "3-5": "0-6",    // Από "0-6"
  "6-14": "7-12",   // Από "7-12"
  "15-19": "13-17", // Από "13-17"
  "18+": "18+"
},
    // ΚΑΝΟΝΑΣ 2: Για "0-11", "12-17", "18+" (Μουσείο)
    "0-11": {
  "0-2": "0-11",    // Από "0-11"
  "3-5": "0-11",    // Από "0-11"
  "6-14": "12-17",  // Από "12-17"
  "15-19": "12-17", // Από "12-17"
  "18+": "18+"      // Από "18+"
},
    // ΚΑΝΟΝΑΣ 3: Για "0-2", "3-6", "7-12", "13-17", "18+" (Κρουαζιέρα Βόσπορου)
    "3-6": {
      "0-2": "0-2",
      "3-5": "3-6",     // Από "3-6"
      "6-14": "7-12",   // Από "7-12"
      "15-19": "13-17", // Από "13-17"
      "18+": "18+"
    },
    // ΚΑΝΟΝΑΣ 4: Για "0-4", "5-12", "13-17", "18+" (Vialand)
    "0-4": {
      "0-2": "0-4",     // Από "0-4"
      "3-5": "0-4",     // Από "0-4"
      "6-14": "5-12",   // Από "5-12"
      "15-19": "13-17", // Από "13-17"
      "18+": "18+"
    },
    // ΚΑΝΟΝΑΣ 5: Για "0-5", "6-12", "13-17", "18+" (Miniatürk)
    "0-5": {
      "0-2": "0-5",     // Από "0-5"
      "3-5": "0-5",     // Από "0-5"
      "6-14": "6-12",   // Από "6-12"
      "15-19": "13-17", // Από "13-17"
      "18+": "18+"
    }
  };

  // ΜΕΤΑΤΡΟΠΗ ΕΝΟΣ JSON
  static convertCityJSON(oldJSON) {
    const newJSON = JSON.parse(JSON.stringify(oldJSON));
    
    if (!newJSON.activities) {
      console.error("⚠️ Το JSON δεν έχει activities array");
      return newJSON;
    }

    // Προσθήκη σταθερών ageGroups
    newJSON.ageGroups = Object.keys(this.STANDARD_GROUPS);
    
    // Μετατροπή κάθε δραστηριότητας
    newJSON.activities.forEach(activity => {
      if (activity.prices) {
        activity.prices = this.convertPrices(activity.prices);
      }
    });

    return newJSON;
  }

  // ΜΕΤΑΤΡΟΠΗ ΤΙΜΩΝ
  static convertPrices(oldPrices) {
    const newPrices = {};
    const oldGroups = Object.keys(oldPrices);
    
  // ΒΕΛΤΙΩΜΕΝΗ ΑΝΙΧΝΕΥΣΗ ΚΑΝΟΝΩΝ
let conversionRule = null;

// ΚΑΝΟΝΑΣ 1: 0-6, 7-12, 13-17, 18+ (Τοπ Καπί, Αγία Σοφία)
// ΣΗΜΑΝΤΙΚΟ: Ελέγχουμε αν υπάρχουν ΟΛΕΣ οι ομάδες
const hasGroup0_6 = oldGroups.includes("0-6") || oldGroups.some(g => g === "0-6");
const hasGroup7_12 = oldGroups.includes("7-12") || oldGroups.some(g => g === "7-12");
const hasGroup13_17 = oldGroups.includes("13-17") || oldGroups.some(g => g === "13-17");
const hasGroup18plus = oldGroups.includes("18+") || oldGroups.some(g => g === "18+");

if (hasGroup0_6 && hasGroup7_12 && hasGroup13_17 && hasGroup18plus) {
  conversionRule = "0-6";
  console.log(`🔍 Εφαρμογή κανόνα "0-6" για: ${Object.keys(oldPrices)}`);
} 
// ΚΑΝΟΝΑΣ 2: 0-11, 12-17, 18+ (Μουσείο)
else if (oldGroups.includes("0-11") && oldGroups.includes("12-17") && oldGroups.includes("18+")) {
  conversionRule = "0-11";
  console.log(`🔍 Εφαρμογή κανόνα "0-11" για: ${Object.keys(oldPrices)}`);
}
// ΚΑΝΟΝΑΣ 3: 0-2, 3-6, 7-12, 13-17, 18+ (Κρουαζιέρα Βόσπορου)
else if (oldGroups.includes("0-2") && oldGroups.includes("3-6") && oldGroups.includes("7-12") && oldGroups.includes("13-17") && oldGroups.includes("18+")) {
  conversionRule = "3-6";
  console.log(`🔍 Εφαρμογή κανόνα "3-6" για: ${Object.keys(oldPrices)}`);
}
// ΚΑΝΟΝΑΣ 4: 0-4, 5-12, 13-17, 18+ (Vialand)
else if (oldGroups.includes("0-4") && oldGroups.includes("5-12") && oldGroups.includes("13-17") && oldGroups.includes("18+")) {
  conversionRule = "0-4";
  console.log(`🔍 Εφαρμογή κανόνα "0-4" για: ${Object.keys(oldPrices)}`);
}
// ΚΑΝΟΝΑΣ 5: 0-5, 6-12, 13-17, 18+ (Miniatürk)
else if (oldGroups.includes("0-5") && oldGroups.includes("6-12") && oldGroups.includes("13-17") && oldGroups.includes("18+")) {
  conversionRule = "0-5";
  console.log(`🔍 Εφαρμογή κανόνα "0-5" για: ${Object.keys(oldPrices)}`);
}
    
    // Αν δεν βρέθηκε κανόνας, χρησιμοποιούμε default
    if (!conversionRule) {
      console.warn("⚠️ Άγνωστο σύστημα ηλικιακών ομάδων, χρησιμοποιώ default");
      return oldPrices;
    }

    // Μετατροπή για κάθε standard group
    Object.keys(this.STANDARD_GROUPS).forEach(stdGroup => {
      const rule = this.CONVERSION_RULES[conversionRule][stdGroup];
      
      if (rule && oldPrices[rule] !== undefined) {
        newPrices[stdGroup] = oldPrices[rule];
      } else {
        // Αν δεν υπάρχει αντιστοίχιση, βάζουμε null
        newPrices[stdGroup] = null;
      }
    });

    return newPrices;
  }

  // ΔΗΜΟΣΙΑ ΜΕΘΟΔΟΣ ΓΙΑ ΜΟΝΗ ΜΕΤΑΤΡΟΠΗ
  static convertAndSave(inputFile, outputFile) {
    try {
      console.log(`📥 Φόρτωση ${inputFile}...`);
      
      // Στο browser, θα χρησιμοποιήσουμε fetch
      fetch(inputFile)
        .then(response => response.json())
        .then(data => {
          console.log(`🔄 Μετατροπή ${inputFile}...`);
          const converted = this.convertCityJSON(data);
          
          console.log(`💾 Αποθήκευση ως ${outputFile}...`);
          // Για τώρα, απλώς εμφανίζουμε το αποτέλεσμα
          console.log("✅ Μετατρεπμένο JSON:", JSON.stringify(converted, null, 2));
          
          alert(`✅ Μετατροπή ολοκληρώθηκε!\nΚοίτα στην κονσόλα (F12 → Console)`);
        })
        .catch(error => {
          console.error("❌ Σφάλμα:", error);
          alert("❌ Σφάλμα φόρτωσης αρχείου");
        });
        
    } catch (error) {
      console.error("❌ Κρίσιμο σφάλμα:", error);
    }
  }
}

// ΚΑΛΕΣΕ ΑΥΤΗ ΤΗΝ ΣΥΝΑΡΤΗΣΗ ΑΠΟ ΤΗΝ ΚΟΝΣΟΛΑ
function convertIstanbul() {
  CityConverter.convertAndSave("istanbul.json", "istanbul-NEW.json");
}

function convertParis() {
  CityConverter.convertAndSave("paris.json", "paris-NEW.json");
}

function convertPrague() {
  CityConverter.convertAndSave("prague.json", "prague-NEW.json");
}

// ΕΚΤΕΛΕΣΕ ΑΥΤΑ ΣΤΗΝ ΚΟΝΣΟΛΑ:
// 1. convertIstanbul()
// 2. convertParis()  
// 3. convertPrague()
