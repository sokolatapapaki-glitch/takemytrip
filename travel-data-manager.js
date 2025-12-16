// ==================== ΕΝΩΤΙΚΟΣ ΜΕΝΑΤΖΕΡ ΔΕΔΟΜΕΝΩΝ ====================
const TravelDataManager = {
  // 📊 ΟΛΕΣ ΟΙ ΠΟΛΕΙΣ ΣΕ ΜΙΑ ΔΟΜΗ
  allCities: {},
  
  // 🔧 ΒΑΣΙΚΕΣ ΠΟΛΕΙΣ (hardcoded)
  baseCities: {
    "Βιέννη": {
      center: [48.2082, 16.3738],
      ageGroups: ["0-2", "3-5", "6-14", "15-19", "18+"],
      emoji: "🏰",
      activities: [] // Θα συμπληρωθεί αργότερα
    },
    "Βερολίνο": {
      center: [52.5200, 13.4050],
      ageGroups: ["0-2", "3-5", "6-14", "15-19", "18+"],
      emoji: "🗽",
      activities: []
    },
    "Λισαβόνα": {
      center: [38.7223, -9.1393],
      ageGroups: ["0-2", "3-5", "6-14", "15-19", "18+"],
      emoji: "🌊",
      activities: []
    },
    "Βουδαπέστη": {
      center: [47.4979, 19.0402],
      ageGroups: ["0-2", "3-5", "6-14", "15-19", "18+"],
      emoji: "🏰",
      activities: []
    },
    "Μαδρίτη": {
      center: [40.4168, -3.7038],
      ageGroups: ["0-2", "3-5", "6-14", "15-19", "18+"],
      emoji: "🇪🇸",
      activities: []
    }
  },
  
  // 📁 ΠΟΛΕΙΣ ΑΠΟ JSON (με τα δικά σου αρχεία)
  jsonCities: {
    "Κωνσταντινούπολη": { file: "istanbul.json", emoji: "🕌" },
    "Παρίσι": { file: "paris.json", emoji: "🗼" },
    "Πράγα": { file: "prague.json", emoji: "🏰" }
  },
  
  // 🚀 ΑΡΧΙΚΟΠΟΙΗΣΗ
  init: function() {
    console.log("🚀 Αρχικοποίηση TravelDataManager...");
    
    // 1. ΠΡΟΣΘΗΚΗ ΒΑΣΙΚΩΝ ΠΟΛΕΩΝ
    Object.assign(this.allCities, this.baseCities);
    
    // 2. ΦΟΡΤΩΣΗ ΔΕΔΟΜΕΝΩΝ ΑΠΟ JSON (ασύγχρονα)
    this.loadJSONCities();
    
    // 3. ΦΟΡΤΩΣΗ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ ΓΙΑ ΒΑΣΙΚΕΣ ΠΟΛΕΙΣ
    this.loadBaseCityActivities();
    
    console.log("✅ Φορτώθηκαν πόλεις:", Object.keys(this.allCities).length);
  },
  
  // 📥 ΦΟΡΤΩΣΗ ΠΟΛΕΩΝ ΑΠΟ JSON
  loadJSONCities: async function() {
    for (const [cityName, config] of Object.entries(this.jsonCities)) {
      try {
        const response = await fetch(config.file);
        if (!response.ok) throw new Error(`Δεν βρέθηκε ${config.file}`);
        
        const data = await response.json();
        
        // Προσθήκη της πόλης με τα δεδομένα από το JSON
        this.allCities[cityName] = {
          center: data.center || [0, 0],
          ageGroups: data.ageGroups || this.detectAgeGroups(data.activities),
          emoji: config.emoji,
          activities: data.activities || [],
          fromJSON: true
        };
        
        console.log(`✅ Φορτώθηκε ${cityName} από JSON`);
      } catch (error) {
        console.error(`❌ Σφάλμα φόρτωσης ${cityName}:`, error);
      }
    }
  },
  
  // 🎯 ΑΝΙΧΝΕΥΣΗ ΗΛΙΚΙΑΚΩΝ ΟΜΑΔΩΝ ΑΠΟ ΤΙΣ ΔΡΑΣΤΗΡΙΟΤΗΤΕΣ
  detectAgeGroups: function(activities) {
    if (!activities || activities.length === 0) {
      return ["0-2", "3-5", "6-14", "15-19", "18+"]; // Προεπιλογή
    }
    
    // Παίρνουμε τις ηλικιακές ομάδες από την πρώτη δραστηριότητα
    const firstActivity = activities[0];
    if (firstActivity && firstActivity.prices) {
      return Object.keys(firstActivity.prices);
    }
    
    return ["0-2", "3-5", "6-14", "15-19", "18+"];
  },
  
  // 📊 ΦΟΡΤΩΣΗ ΔΡΑΣΤΗΡΙΟΤΗΤΩΝ ΓΙΑ ΒΑΣΙΚΕΣ ΠΟΛΕΙΣ
  loadBaseCityActivities: function() {
    // ΒΙΕΝΝΗ
    if (window.activities && window.activities.length > 0) {
      this.allCities["Βιέννη"].activities = window.activities;
    }
    
    // ΒΕΡΟΛΙΝΟ
    if (window.activitiesBerlin && window.activitiesBerlin.length > 0) {
      this.allCities["Βερολίνο"].activities = window.activitiesBerlin;
    }
    
    // ΛΙΣΑΒΟΝΑ
    if (window.activitiesLisbon && window.activitiesLisbon.length > 0) {
      this.allCities["Λισαβόνα"].activities = window.activitiesLisbon;
    }
    
    // ΒΟΥΔΑΠΕΣΤΗ
    if (window.activitiesBudapest && window.activitiesBudapest.length > 0) {
      this.allCities["Βουδαπέστη"].activities = window.activitiesBudapest;
    }
    
    // ΜΑΔΡΙΤΗ
    if (window.activitiesMadrid && window.activitiesMadrid.length > 0) {
      this.allCities["Μαδρίτη"].activities = window.activitiesMadrid;
    }
  },
  
  // 🎯 ΒΡΕΣ ΤΑ ΔΕΔΟΜΕΝΑ ΜΙΑΣ ΠΟΛΗΣ
  getCityData: function(cityName) {
    // 1. ΑΚΡΙΒΗΣ ΤΑΥΤΟΠΟΙΗΣΗ
    if (this.allCities[cityName]) {
      return this.allCities[cityName];
    }
    
    // 2. ΜΕΡΙΚΗ ΤΑΥΤΟΠΟΙΗΣΗ (π.χ. "Παρίσι" βρίσκει "Παρίσι")
    for (const [key, data] of Object.entries(this.allCities)) {
      if (cityName.includes(key)) {
        return data;
      }
    }
    
    // 3. ΑΝ ΔΕΝ ΒΡΕΘΕΙ
    console.warn(`⚠️ Δεν βρέθηκαν δεδομένα για: ${cityName}`);
    return null;
  },
  
  // 💰 ΥΠΟΛΟΓΙΣΜΟΣ ΤΙΜΗΣ ΓΙΑ ΜΕΛΟΣ
     // 2. ΕΥΡΕΤΗΣΗ ΚΟΝΤΙΝΟΤΕΡΗΣ ΟΜΑΔΑΣ (με debugging)
    console.log("🔍 Δεν βρέθηκε ακριβής αντιστοίχιση για ηλικία", memberAge);
    console.log("   Διαθέσιμες ομάδες:", Object.keys(activityPrices));
    
    const ageGroups = Object.keys(activityPrices).filter(g => g.includes('-'));
    if (ageGroups.length > 0) {
      console.log("   Ομάδες με εύρος:", ageGroups);
      
      const closestGroup = ageGroups.sort((a, b) => {
        const aMin = parseInt(a.split('-')[0]);
        const bMin = parseInt(b.split('-')[0]);
        return Math.abs(aMin - memberAge) - Math.abs(bMin - memberAge);
      })[0];
      
      console.log("   Επέλεξε κοντινότερη:", closestGroup, "τιμή:", activityPrices[closestGroup]);
      return this.normalizePrice(activityPrices[closestGroup]);
    }
    
    // 3. ΠΡΟΕΠΙΛΟΓΗ
    console.warn("⚠️ ΟΥΤΕ κοντινή ομάδα δεν βρέθηκε. Επιστροφή 0.");
    return 0;
},
  
  // 🔢 ΜΕΤΑΤΡΟΠΗ ΤΙΜΗΣ ΣΕ ΑΡΙΘΜΟ
  normalizePrice: function(price) {
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
      const num = parseFloat(price.replace(/[^0-9.,]/g, '').replace(',', '.'));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  },
  
  // 👨‍👩‍👧‍👦 ΔΗΜΙΟΥΡΓΙΑ ΗΛΙΚΙΑΚΩΝ ΟΜΑΔΩΝ ΓΙΑ ΟΛΟ ΤΗΝ ΟΙΚΟΓΕΝΕΙΑ
  categorizeFamily: function(familyMembers, cityName) {
    const cityData = this.getCityData(cityName);
    const ageGroups = cityData?.ageGroups || ["0-2", "3-5", "6-14", "15-19", "18+"];
    const categories = {};
    
    // Αρχικοποίηση όλων των ομάδων με 0
    ageGroups.forEach(group => {
      categories[group] = 0;
    });
    
    // Κατανομή των μελών
    familyMembers.forEach(member => {
      let assigned = false;
      
      for (const group of ageGroups) {
        if (group.includes('-')) {
          const [min, max] = group.split('-').map(Number);
          if (member.age >= min && member.age <= max) {
            categories[group]++;
            assigned = true;
            break;
          }
        } else if (group === "18+" && member.age >= 18) {
          categories[group]++;
          assigned = true;
          break;
        } else if (group === "17+" && member.age >= 17) {
          categories[group]++;
          assigned = true;
          break;
        }
      }
      
      // Αν δεν βρέθηκε ομάδα, προσθέτουμε στον μεγαλύτερο
      if (!assigned) {
        if (member.age >= 18) {
          categories["18+"] = (categories["18+"] || 0) + 1;
        } else {
          // Για νέους που δεν ταιριάζουν σε άλλη ομάδα
          const lastGroup = ageGroups[ageGroups.length - 1];
          categories[lastGroup] = (categories[lastGroup] || 0) + 1;
        }
      }
    });
    
    return categories;
  },
  
  // 🎫 ΔΗΜΙΟΥΡΓΙΑ ΠΙΝΑΚΑ ΤΙΜΩΝ
  generatePriceTable: function(activity) {
    if (!activity || !activity.prices) return '';
    
    const prices = activity.prices;
    const keys = Object.keys(prices);
    
    // ΑΝΙΧΝΕΥΣΗ ΤΥΠΟΥ ΗΛΙΚΙΑΚΩΝ ΟΜΑΔΩΝ
    const hasIstanbulStyle = keys.some(k => k === "0-6" || k === "7-12");
    const hasLondonStyle = keys.some(k => k === "6-11" || k === "12-16");
    
    let tableHTML = '<table class="activity-table">';
    
    if (hasIstanbulStyle) {
      tableHTML += `
        <tr><th>0-6</th><th>7-12</th><th>13-17</th><th>18+</th></tr>
        <tr>
          <td>${this.formatPrice(prices["0-6"])}</td>
          <td>${this.formatPrice(prices["7-12"])}</td>
          <td>${this.formatPrice(prices["13-17"])}</td>
          <td>${this.formatPrice(prices["18+"])}</td>
        </tr>
      `;
    } else if (hasLondonStyle) {
      tableHTML += `
        <tr><th>0-2</th><th>3-5</th><th>6-11</th><th>12-16</th><th>17+</th></tr>
        <tr>
          <td>${this.formatPrice(prices["0-2"])}</td>
          <td>${this.formatPrice(prices["3-5"])}</td>
          <td>${this.formatPrice(prices["6-11"])}</td>
          <td>${this.formatPrice(prices["12-16"])}</td>
          <td>${this.formatPrice(prices["17+"])}</td>
        </tr>
      `;
    } else {
      // ΠΡΟΕΠΙΛΟΓΗ (Βιέννη, Βερολίνο, κλπ)
      tableHTML += `
        <tr><th>0-2</th><th>3-5</th><th>6-14</th><th>15-19</th><th>18+</th></tr>
        <tr>
          <td>${this.formatPrice(prices["0-2"])}</td>
          <td>${this.formatPrice(prices["3-5"])}</td>
          <td>${this.formatPrice(prices["6-14"])}</td>
          <td>${this.formatPrice(prices["15-19"])}</td>
          <td>${this.formatPrice(prices["18+"])}</td>
        </tr>
      `;
    }
    
    tableHTML += '</table>';
    return tableHTML;
  },
  
  // 💶 ΜΟΡΦΟΠΟΙΗΣΗ ΤΙΜΗΣ
  formatPrice: function(price) {
    const num = this.normalizePrice(price);
    return num === 0 ? 'Δωρεάν' : num + '€';
  }
};

// 🚀 ΕΚΚΙΝΗΣΗ ΜΕΤΑ ΤΟΝ ΦΟΡΤΩΣΗ ΤΗΣ ΣΕΛΙΔΑΣ
window.addEventListener('DOMContentLoaded', () => {
  TravelDataManager.init();
});
