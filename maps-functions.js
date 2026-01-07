// 1. ΒΕΛΤΙΩΜΕΝΗ POPUP ΣΥΝΑΡΤΗΣΗ (ΜΕ ΕΣΤΙΑΤΟΡΙΑ & ΑΠΟΣΤΑΣΕΙΣ)
function createEnhancedPopup(activity) {
    console.log('🗺️ Δημιουργία enhanced popup για:', activity.name);
    
    const restaurant = activity.restaurant || activity.nearby_restaurant || 
                      '🍽️ Τοπικά εστιατόρια στην περιοχή';
    
    const googleMapsUrl = activity.location ? 
        `https://www.google.com/maps/search/?api=1&query=${activity.location.lat},${activity.location.lng}&query_place_id=${activity.google_place_id || ''}` :
        `https://www.google.com/maps/search/${encodeURIComponent(activity.name + ' ' + state.selectedDestination)}`;
    
    return `
        <div style="max-width: 300px; font-family: 'Roboto', sans-serif; padding: 5px;">
            <h4 style="margin: 0 0 8px 0; color: var(--primary); font-size: 16px; font-weight: 700;">
                <i class="fas fa-map-marker-alt" style="margin-right: 8px;"></i>
                ${activity.name}
            </h4>
            
            ${activity.description ? `
            <p style="margin: 0 0 10px 0; font-size: 13px; color: var(--gray); line-height: 1.4;">
                ${activity.description}
            </p>` : ''}
            
            ${activity.price ? `
            <div style="background: rgba(46, 204, 113, 0.1); padding: 8px; border-radius: 6px; margin: 8px 0; font-size: 13px;">
                <i class="fas fa-tag" style="color: var(--success); margin-right: 6px;"></i>
                <strong>Κόστος:</strong> ${activity.price}€
            </div>` : ''}
            
            <div style="background: rgba(255, 107, 107, 0.1); padding: 10px; border-radius: 6px; margin: 10px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <i class="fas fa-utensils" style="color: var(--accent); margin-right: 8px;"></i>
                    <strong style="color: var(--dark); font-size: 13px;">Κοντινό Εστιατόριο:</strong>
                </div>
                <p style="margin: 0; font-size: 12px; color: var(--gray); line-height: 1.3;">
                    ${restaurant}
                </p>
            </div>
            
            <div style="font-size: 11px; color: var(--gray); background: var(--light); padding: 6px; border-radius: 4px; margin: 8px 0;">
                <i class="fas fa-info-circle" style="margin-right: 4px;"></i>
                ${activity.duration_hours ? `Διάρκεια: ${activity.duration_hours} ώρες • ` : ''}
                ${activity.category ? `Κατηγορία: ${translateCategory(activity.category)}` : ''}
            </div>
            
            <a href="${googleMapsUrl}" 
               target="_blank" 
               style="display: inline-flex; align-items: center; padding: 8px 12px; background: var(--primary); color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; margin-top: 10px;">
                <i class="fas fa-external-link-alt" style="margin-right: 6px;"></i>
                Άνοιγμα Google Maps
            </a>
        </div>
    `;
}

// 4. ΒΕΛΤΙΩΜΕΝΗ showActivityMap() (ΜΕ ΤΑ ΝΕΑ POPUPS ΚΑΙ ΕΝΩΣΕΙΣ)
function showActivityMap() {
    if (!window.travelMap) {
        alert('Παρακαλώ πρώτα φορτώστε τον χάρτη');
        return;
    }
    
    console.log('📍 Προσθήκη πινέζων για τις επιλεγμένες δραστηριότητες');
    
    // 1. Καθαρισμός όλων των πινέζων
    window.travelMap.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            window.travelMap.removeLayer(layer);
        }
    });
    
    // 2. Αφαίρεση τυχόν διαδρομών
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }
    
    // 3. Επαναφορά επιλογών
    selectedPointA = null;
    selectedPointB = null;
    
    // 4. Προσθήκη πινέζας για την πόλη
    const cityCoords = getCityCoordinates(state.selectedDestinationId);
    if (cityCoords) {
        L.marker(cityCoords)
            .addTo(window.travelMap)
            .bindPopup(`<b>${state.selectedDestination}</b><br>Κύκλος πόλης`)
            .openPopup();
            
        // Ζουμάρισμα στο κέντρο της πόλης
        window.travelMap.setView(cityCoords, 13);
    }
    
    if (state.selectedActivities.length === 0) {
        alert('⚠️ Δεν έχετε επιλέξει καμία δραστηριότητα ακόμα\n\nΠαρακαλώ πηγαίνετε στο βήμα "Δραστηριότητες" και επιλέξτε κάποιες.');
        return;
    }
    
    let activityCount = 0;
    const markers = [];
    
    // 5. Προσθήκη πινέζας για ΚΑΘΕ επιλεγμένη δραστηριότητα
    state.selectedActivities.forEach(activity => {
        const fullActivity = state.currentCityActivities.find(a => a.id === activity.id);
        
        let coords;
        let markerTitle = activity.name;
        let activityData = fullActivity || activity;
        
        if (fullActivity && fullActivity.location) {
            // Έχει location στο JSON
            coords = [fullActivity.location.lat, fullActivity.location.lng];
            console.log(`📍 Βρήκα location για ${activity.name}:`, coords);
        } else {
            // Δεν έχει location - χρησιμοποίησε τυχαίες συντεταγμένες κοντά στο κέντρο
            if (cityCoords) {
                const randomLat = cityCoords[0] + (Math.random() - 0.5) * 0.03;
                const randomLng = cityCoords[1] + (Math.random() - 0.5) * 0.03;
                coords = [randomLat, randomLng];
                console.log(`📍 Χωρίς location για ${activity.name} - τυχαίες συντεταγμένες:`, coords);
            } else {
                coords = [51.5074, -0.1278]; // Default: Λονδίνο
            }
            
            // Βεβαιώσου ότι το activityData έχει τα απαραίτητα πεδία
            activityData = {
                ...activityData,
                name: activity.name,
                description: fullActivity?.description || 'Επιλεγμένη δραστηριότητα',
                price: activity.price || 0,
                duration_hours: fullActivity?.duration_hours || '?',
                category: fullActivity?.category || 'attraction',
                location: {
                    lat: coords[0],
                    lng: coords[1]
                }
            };
        }
        
        // Βεβαιώσου ότι το activityData έχει location
        if (!activityData.location) {
            activityData.location = {
                lat: coords[0],
                lng: coords[1]
            };
        }
        
        // 🔴 ΚΡΙΤΙΚΗ ΚΛΗΣΗ: Χρησιμοποίησε τη νέα συνάρτηση!
        const marker = createMarkerWithConnectFunction(coords, markerTitle, activityData);
        if (marker) {
            markers.push(marker);
            activityCount++;
        }
    });
    
    // 6. Αν έχουμε markers, προσπάθησε να ζουμάρεις να τα δείξεις όλα
    if (markers.length > 0 && cityCoords) {
        // Δημιούργησε bounds που περιλαμβάνουν όλα τα markers
        const markerGroup = L.featureGroup(markers);
        window.travelMap.fitBounds(markerGroup.getBounds().pad(0.1));
    }
    
    // 7. Ενημέρωση χρήστη με τα νέα οδηγία
    showToast(`
        <div style="text-align: left; max-width: 350px;">
            <strong style="font-size: 16px; color: #4F46E5;">🗺️ Οδηγίες Χρήσης Χάρτη</strong><br><br>
            
           <div style="background: #F0F9FF; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
    <strong style="color: #000000;">🎯 Βήμα 1: Επιλογή Σημείων</strong><br>
    <span style="color: #000000;">• Κάντε κλικ σε μια πινέζα για <span style="color: #10B981; font-weight: bold;">ΑΠΟ</span></span><br>
    <span style="color: #000000;">• Κάντε κλικ σε άλλη για <span style="color: #EF4444; font-weight: bold;">ΠΡΟΣ</span></span>
</div>
            
            <div style="background: #FEF3C7; padding: 10px; border-radius: 8px; margin-bottom: 10px;">
    <strong style="color: #000000;">🛣️ Βήμα 2: Διαδρομή</strong><br>
    <span style="color: #000000;">• Η διαδρομή θα σχεδιαστεί <strong>αυτόματα</strong></span><br>
    <span style="color: #000000;">• Θα δείτε απόσταση και χρόνους</span>
</div>
            
           <div style="background: #E0F2FE; padding: 10px; border-radius: 8px;">
    <strong style="color: #000000;">📱 Βήμα 3: Οδηγίες</strong><br>
    <span style="color: #000000;">• Πατήστε κουμπιά Google Maps για <strong>πραγματικές οδηγίες</strong></span><br>
    <span style="color: #000000;">• Επιλέξτε μεταφορικό μέσο (περπάτημα, αυτοκίνητο, ΜΜΜ, ποδήλατο)</span>
</div>
            
            <div style="margin-top: 10px; padding: 8px; background: #4F46E5; color: white; border-radius: 6px; text-align: center; font-weight: bold;">
                ✅ Εμφανίστηκαν ${activityCount} πινέζες
            </div>
        </div>
    `, 'info');
    
    console.log(`✅ Εμφανίστηκαν ${activityCount} πινέζες δραστηριοτήτων`);
}
