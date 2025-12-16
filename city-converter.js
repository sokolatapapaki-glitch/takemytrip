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
    // ΚΑΝΟΝΑΣ 1: Για "0-6" (Κωνσταντινούπολη)
    "0-6": {
      "0-2": "0-2",    // 0-2 μένει 0-2
      "3-5": "3-5",    // 3-5 μένει 3-5
      "6-14": "6-14",  // 6-6 πάει στο 6-14
      "15-19": "13-17", // 13-17 → 15-19
      "18+": "18+"     // 18+ μένει 18+
    },
    // ΚΑΝΟΝΑΣ 2: Για "0-11" (Κωνσταντινούπολη - μουσείο)
    "0-11": {
      "0-2": "0-2",
      "3-5": "3-5",
      "6-14": "12-17", // 12-17 → 6-14
      "15-19": "12-17", // 12-17 → 15-19
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
    
    // Ανιχνεύουμε τον κανόνα μετατροπής
    let conversionRule = null;
    
    if (oldGroups.includes("0-6") && oldGroups.includes("7-12")) {
      conversionRule = "0-6";
    } else if (oldGroups.includes("0-11") && oldGroups.includes("12-17")) {
      conversionRule = "0-11";
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
