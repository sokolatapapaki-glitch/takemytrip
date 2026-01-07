// ==================== SIMPLIFIED CLICK-TO-CONNECT SYSTEM ====================

// Καθαρά στοιχεία για το click-to-connect
let selectedPointA = null;  // Πρώτο επιλεγμένο σημείο
let selectedPointB = null;  // Δεύτερο επιλεγμένο σημείο
let currentRouteLine = null; // Τρέχουσα γραμμή διαδρομής

function addConnectStyles() {
    if (!document.querySelector('#connect-styles')) {
        const style = document.createElement('style');
        style.id = 'connect-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .clickable-marker:hover {
                transform: scale(1.1);
                transition: transform 0.2s ease;
            }
            
            .selected-marker-a {
                animation: pulse-green 1s infinite;
            }
            
            .selected-marker-b {
                animation: pulse-red 1s infinite;
            }
            
            @keyframes pulse-green {
                0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            
            @keyframes pulse-red {
                0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
            }
        `;
        document.head.appendChild(style);
    }
}

function showToast(message, type = 'info') {
    // Δημιουργία toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : '#4F46E5'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        font-family: 'Roboto', sans-serif;
        animation: slideIn 0.3s ease;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div style="font-size: 20px;">
                ${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️'}
            </div>
            <div style="flex: 1; font-size: 14px; line-height: 1.4;">
                ${message}
            </div>
            <button onclick="this.parentElement.parentElement.remove()" 
                    style="background: none; border: none; color: white; font-size: 20px; cursor: pointer; padding: 0 0 0 10px;">
                &times;
            </button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Αυτόματη αφαίρεση μετά από 5 δευτερόλεπτα
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }
    }, 5000);
}

function createMarkerWithConnectFunction(coords, title, activityData) {
    if (!window.travelMap) {
        console.error('❌ Χάρτης δεν είναι διαθέσιμος');
        return null;
    }
    
    // Βεβαιώσου ότι το activityData έχει τα απαραίτητα πεδία
    const safeActivityData = {
        name: title,
        description: activityData?.description || 'Επιλεγμένη δραστηριότητα',
        price: activityData?.price || 0,
        duration_hours: activityData?.duration_hours || '?',
        category: activityData?.category || 'attraction',
        location: activityData?.location || { lat: coords[0], lng: coords[1] },
        restaurant: activityData?.restaurant || '🍽️ Τοπικά εστιατόρια στην περιοχή'
    };
    
    console.log(`📍 Δημιουργία marker για: ${title}`, coords);
    
    // Δημιουργία πινέζας με χρώμα που αλλάζει ανάλογα με την κατάσταση
    const getMarkerColor = () => {
        if (selectedPointA && selectedPointA.title === title) return '#10B981'; // Πράσινο για Α
        if (selectedPointB && selectedPointB.title === title) return '#EF4444'; // Κόκκινο για Β
        return '#4F46E5'; // Μπλε για κανονικό
    };
    
    const getMarkerLetter = () => {
        if (selectedPointA && selectedPointA.title === title) return 'A';
        if (selectedPointB && selectedPointB.title === title) return 'B';
        return '📍';
    };
    
    const marker = L.marker(coords, {
        icon: L.divIcon({
            html: `
                <div style="
                    background: ${getMarkerColor()}; 
                    color: white; 
                    width: 42px; 
                    height: 42px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-weight: bold;
                    font-size: 18px;
                    border: 3px solid white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    ${getMarkerLetter()}
                </div>
            `,
            className: 'clickable-marker',
            iconSize: [42, 42],
            iconAnchor: [21, 42]
        })
    }).addTo(window.travelMap);
    
    // Αποθήκευση δεδομένων
    marker.options.activityData = safeActivityData;
    marker.options.originalTitle = title;
    marker.options.coords = coords;
    
    // Συνάρτηση που καλείται όταν κάνουμε κλικ
    const handleMarkerClick = function(e) {
        console.log(`📍 Κλικ στο: ${title}`, e.latlng);
        
        // Αν δεν έχουμε επιλέξει πρώτο σημείο
        if (!selectedPointA) {
            selectedPointA = {
                marker: marker,
                coords: coords,
                title: title,
                data: safeActivityData,
                latlng: e.latlng
            };
            
            // Ανανέωση εμφάνισης
            updateMarkerAppearance();
            
            showToast(`
                <div style="background: #D1FAE5; padding: 12px; border-radius: 8px; border-left: 4px solid #10B981;">
                    <strong style="color: #065F46;">✅ Επιλέχθηκε ως σημείο ΑΠΟ:</strong><br>
                    <span style="font-weight: bold;">${title}</span><br>
                    <small style="color: #047857;">Κάντε κλικ σε άλλη πινέζα για επιλογή προορισμού</small>
                </div>
            `, 'info');
            
        } 
        // Αν έχουμε ήδη πρώτο σημείο και κάνουμε κλικ σε διαφορετικό
        else if (!selectedPointB && selectedPointA.marker !== marker) {
            selectedPointB = {
                marker: marker,
                coords: coords,
                title: title,
                data: safeActivityData,
                latlng: e.latlng
            };
            
            // Ανανέωση εμφάνισης
            updateMarkerAppearance();
            
            // Σχεδίαση διαδρομής
            setTimeout(() => {
                drawRouteBetweenPoints();
            }, 300);
            
        } 
        // Αν κάνουμε κλικ στο ίδιο σημείο ξανά
        else if (selectedPointA && selectedPointA.marker === marker) {
            showToast(`ℹ️ Έχετε ήδη επιλέξει το <strong>${title}</strong> ως σημείο ΑΠΟ`, 'warning');
        }
        // Αν κάνουμε κλικ στο δεύτερο σημείο ξανά
        else if (selectedPointB && selectedPointB.marker === marker) {
            showToast(`ℹ️ Έχετε ήδη επιλέξει το <strong>${title}</strong> ως σημείο ΠΡΟΣ`, 'warning');
        }
        // Αν έχουμε ήδη δύο σημεία και κάνουμε κλικ σε τρίτο
        else if (selectedPointA && selectedPointB) {
            // Επαναφορά
            resetSelection();
            
            // Ξεκινάμε από το αρχικό
            selectedPointA = {
                marker: marker,
                coords: coords,
                title: title,
                data: safeActivityData,
                latlng: e.latlng
            };
            
            // Ανανέωση εμφάνισης
            updateMarkerAppearance();
            
            showToast(`
                <div style="background: #FEF3C7; padding: 12px; border-radius: 8px; border-left: 4px solid #F59E0B;">
                    <strong style="color: #92400E;">🔄 Νέα επιλογή:</strong><br>
                    <span style="font-weight: bold;">${title}</span> ως νέο σημείο ΑΠΟ<br>
                    <small style="color: #B45309;">Κάντε κλικ σε άλλη πινέζα για προορισμό</small>
                </div>
            `, 'info');
        }
    };
    
    // Συνάρτηση ανανέωσης εμφάνισης
    function updateMarkerAppearance() {
        const isPointA = selectedPointA && selectedPointA.marker === marker;
        const isPointB = selectedPointB && selectedPointB.marker === marker;
        
        const color = isPointA ? '#10B981' : isPointB ? '#EF4444' : '#4F46E5';
        const letter = isPointA ? 'A' : isPointB ? 'B' : '📍';
        const size = isPointA || isPointB ? '50px' : '42px';
        const fontSize = isPointA || isPointB ? '20px' : '18px';
        
        marker.setIcon(L.divIcon({
            html: `
                <div style="
                    background: ${color}; 
                    color: white; 
                    width: ${size}; 
                    height: ${size}; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    font-weight: bold;
                    font-size: ${fontSize};
                    border: 3px solid white;
                    box-shadow: 0 3px 15px ${color}80;
                    cursor: pointer;
                    animation: ${isPointA || isPointB ? 'pulse 1.5s infinite' : 'none'};
                ">
                    ${letter}
                </div>
            `,
            className: isPointA ? 'selected-marker-a' : isPointB ? 'selected-marker-b' : 'clickable-marker',
            iconSize: [parseInt(size), parseInt(size)],
            iconAnchor: [parseInt(size)/2, parseInt(size)]
        }));
        
        // Ενημέρωση popup
        const popupContent = isPointA ? 
            `<div style="text-align: center; padding: 10px;">
                <h4 style="margin: 0 0 10px 0; color: #10B981;">📍 ΑΠΟ</h4>
                <p style="margin: 0; font-weight: bold;">${title}</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                    ✅ Επιλέχθηκε ως σημείο εκκίνησης
                </p>
            </div>` :
            isPointB ?
            `<div style="text-align: center; padding: 10px;">
                <h4 style="margin: 0 0 10px 0; color: #EF4444;">🎯 ΠΡΟΣ</h4>
                <p style="margin: 0; font-weight: bold;">${title}</p>
                <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
                    ✅ Επιλέχθηκε ως προορισμός
                </p>
            </div>` :
            createEnhancedPopup(safeActivityData);
        
        marker.bindPopup(popupContent);
        
        if (isPointA || isPointB) {
            marker.openPopup();
        }
    }
    
    // Επισύναψη event listener
    marker.on('click', handleMarkerClick);
    
    // Αρχικό popup
    marker.bindPopup(createEnhancedPopup(safeActivityData));
    
    return marker;
}

// Βοηθητική συνάρτηση για επαναφορά επιλογών
function resetSelection() {
    if (selectedPointA && selectedPointA.marker) {
        resetMarkerAppearance(selectedPointA.marker);
    }
    if (selectedPointB && selectedPointB.marker) {
        resetMarkerAppearance(selectedPointB.marker);
    }
    
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
        currentRouteLine = null;
    }
    
    selectedPointA = null;
    selectedPointB = null;
}

function drawRouteBetweenPoints() {
    console.log('🔍 ΕΛΕΓΧΟΣ: drawRouteBetweenPoints καλείται');
    console.log('📍 selectedPointA:', selectedPointA);
    console.log('📍 selectedPointB:', selectedPointB);
    console.log('📍 window.travelMap:', window.travelMap);
    
    if (!selectedPointA || !selectedPointB || !window.travelMap) {
        console.error('❌ ΛΕΙΠΟΥΝ ΣΤΟΙΧΕΙΑ:', {
            selectedPointA: !!selectedPointA,
            selectedPointB: !!selectedPointB,
            travelMap: !!window.travelMap
        });
        return;
    }
    
    // Καταργήστε τυχόν προηγούμενη γραμμή
    if (currentRouteLine) {
        window.travelMap.removeLayer(currentRouteLine);
    }
    
    // Υπολογίστε απόσταση
    const distance = calculateDistance(
        selectedPointA.coords,
        selectedPointB.coords
    ).toFixed(1);
    
    const walkTime = Math.round(distance * 15);  // 4 km/h
    const carTime = Math.round(distance * 3);    // 20 km/h
    // Αμέσως πριν από το routePopup, μετά το walkTime και carTime:
    const transitTime = Math.round(distance * 5);   // ΜΜΜ
    const bikeTime = Math.round(distance * 8);      // Ποδήλατο
    
    // Σχεδίαση νέας γραμμής
    currentRouteLine = L.polyline([selectedPointA.coords, selectedPointB.coords], {
        color: '#FF6B6B',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round'
    }).addTo(window.travelMap);
    
    // Δημιουργία popup για τη γραμμή
    const middlePoint = [
        (selectedPointA.coords[0] + selectedPointB.coords[0]) / 2,
        (selectedPointA.coords[1] + selectedPointB.coords[1]) / 2
    ];
    
    const routePopup = L.popup()
    .setLatLng(middlePoint)
    .setContent(`
        <div style="min-width: 280px; font-family: 'Roboto', sans-serif; padding: 5px;">
            <h4 style="margin: 0 0 12px 0; color: #1A202C; text-align: center; font-size: 16px;">
                🛣️ Πληροφορίες Διαδρομής
            </h4>
            
            <div style="background: #F7FAFC; padding: 12px; border-radius: 8px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span><strong>📍 Από:</strong></span>
                    <span style="color: #10B981; font-weight: bold;">${selectedPointA.title}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span><strong>🎯 Προς:</strong></span>
                    <span style="color: #EF4444; font-weight: bold;">${selectedPointB.title}</span>
                </div>
            </div>
            
            <div style="background: #E6FFFA; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
                <div style="text-align: center; font-size: 24px; font-weight: bold; color: #0D9488;">
                    ${distance} km
                </div>
                <div style="text-align: center; font-size: 12px; color: #4A5568;">
                    Ευθεία γραμμή (περίπου)
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <h5 style="color: var(--dark); margin-bottom: 8px; font-size: 14px;">
                    <i class="fas fa-clock"></i> Εκτιμώμενος Χρόνος:
                </h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <div style="text-align: center; padding: 8px; background: #e3f2fd; border-radius: 4px;">
                        <div style="font-size: 18px;">🚶</div>
                        <div style="font-size: 14px; font-weight: bold;">${walkTime} λεπτά</div>
                        <div style="font-size: 10px; color: var(--gray);">Περπάτημα*</div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: #fff3e0; border-radius: 4px;">
                        <div style="font-size: 18px;">🚗</div>
                        <div style="font-size: 14px; font-weight: bold;">${carTime} λεπτά</div>
                        <div style="font-size: 10px; color: var(--gray);">Αυτοκίνητο*</div>
                    </div>
                        <div style="text-align: center; padding: 8px; background: #e8f5e9; border-radius: 4px;">
        <div style="font-size: 18px;">🚇</div>
        <div style="font-size: 14px; font-weight: bold;">~${Math.round(distance * 5)} λεπτά</div>
        <div style="font-size: 10px; color: var(--gray);">ΜΜΜ*</div>
    </div>
    <div style="text-align: center; padding: 8px; background: #f3e5f5; border-radius: 4px;">
        <div style="font-size: 18px;">🚲</div>
        <div style="font-size: 14px; font-weight: bold;">~${Math.round(distance * 8)} λεπτά</div>
        <div style="font-size: 10px; color: var(--gray);">Ποδήλατο*</div>
    </div>
                </div>
                <p style="font-size: 10px; color: #666; text-align: center; margin-top: 8px; margin-bottom: 0;">
                    *Εκτίμηση. Για πραγματικές οδηγίες πατήστε ένα κουμπί.
                </p>
            </div>
            
            <!-- ΚΟΥΜΠΙΑ ΜΕΤΑΦΟΡΑΣ -->
            <div style="border-top: 1px solid #eee; padding-top: 15px;">
                <h5 style="color: #1A202C; margin-bottom: 10px; font-size: 14px; text-align: center;">
                    <i class="fas fa-directions"></i> Άνοιγμα Google Maps
                </h5>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${selectedPointA.coords[0]},${selectedPointA.coords[1]}&destination=${selectedPointB.coords[0]},${selectedPointB.coords[1]}&travelmode=walking"
                       target="_blank"
                       style="text-align: center; padding: 10px; background: #10B981; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; flex-direction: column; align-items: center; font-size: 13px;">
                        <i class="fas fa-walking" style="font-size: 16px; margin-bottom: 5px;"></i>
                        <span>Περπάτημα</span>
                    </a>
                    
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${selectedPointA.coords[0]},${selectedPointA.coords[1]}&destination=${selectedPointB.coords[0]},${selectedPointB.coords[1]}&travelmode=driving"
                       target="_blank"
                       style="text-align: center; padding: 10px; background: #3B82F6; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; flex-direction: column; align-items: center; font-size: 13px;">
                        <i class="fas fa-car" style="font-size: 16px; margin-bottom: 5px;"></i>
                        <span>Αυτοκίνητο</span>
                    </a>
                    
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${selectedPointA.coords[0]},${selectedPointA.coords[1]}&destination=${selectedPointB.coords[0]},${selectedPointB.coords[1]}&travelmode=transit"
                       target="_blank"
                       style="text-align: center; padding: 10px; background: #8B5CF6; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; flex-direction: column; align-items: center; font-size: 13px;">
                        <i class="fas fa-bus" style="font-size: 16px; margin-bottom: 5px;"></i>
                        <span>ΜΜΜ</span>
                    </a>
                    
                    <a href="https://www.google.com/maps/dir/?api=1&origin=${selectedPointA.coords[0]},${selectedPointA.coords[1]}&destination=${selectedPointB.coords[0]},${selectedPointB.coords[1]}&travelmode=bicycling"
                       target="_blank"
                       style="text-align: center; padding: 10px; background: #F59E0B; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; display: flex; flex-direction: column; align-items: center; font-size: 13px;">
                        <i class="fas fa-bicycle" style="font-size: 16px; margin-bottom: 5px;"></i>
                        <span>Ποδήλατο</span>
                    </a>
                </div>
                <p style="font-size: 11px; color: #666; text-align: center; margin-top: 5px; margin-bottom: 0;">
                    Ανοίγει Google Maps με πλήρεις οδηγίες και πραγματικό χρόνο.
                </p>
            </div>
        </div>
    `);

    // Προσθήκη popup στη γραμμή
    currentRouteLine.bindPopup(routePopup);
    
    // Ενημέρωση χρήστη
    showToast(`✅ Διαδρομή δημιουργήθηκε!<br><strong>${selectedPointA.title}</strong> → <strong>${selectedPointB.title}</strong><br>Απόσταση: ${distance} km`, 'success');
    
    // Αυτόματη απελευθέρωση μετά από 30 δευτερόλεπτα
    setTimeout(() => {
        if (selectedPointA && selectedPointB) {
            resetMarkerAppearance(selectedPointA.marker);
            resetMarkerAppearance(selectedPointB.marker);
            
            if (currentRouteLine) {
                window.travelMap.removeLayer(currentRouteLine);
                currentRouteLine = null;
            }
            
            selectedPointA = null;
            selectedPointB = null;
            
            showToast('🔄 Επαναφορά επιλογών διαδρομής', 'info');
        }
    }, 30000);
}

function resetMarkerAppearance(marker) {
    if (!marker) return;
    
    marker.setIcon(L.divIcon({
        html: `
            <div style="
                background: #4F46E5; 
                color: white; 
                width: 40px; 
                height: 40px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                font-weight: bold;
                font-size: 16px;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                cursor: pointer;
            ">
                📍
            </div>
        `,
        className: 'clickable-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    }));
    
    // Επανάφερε το αρχικό popup (αν υπάρχουν δεδομένα)
    if (marker.options && marker.options.activityData) {
        marker.bindPopup(createEnhancedPopup(marker.options.activityData));
    }
}

// Καλείται κατά την αρχικοποίηση
addConnectStyles();
