// ==================== DATA MODULE ====================
// Constants, city data, and utility functions for geographic calculations
// Pure refactor - NO logic changes, 100% identical behavior

// ==================== CONSTANTS ====================

export const COLOR_PALETTE = [
    '#4F46E5', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316'  // Orange
];

// ==================== PACING MODES ====================
// Configurable itinerary pacing strategies with different optimization objectives

export const PACING_MODES = {
    COMPACT: {
        id: 'compact',
        name: 'Συμπαγής (Compact)',
        emoji: '⚡',
        description: 'Ελαχιστοποίηση ενεργών ημερών, μέγιστη αποδοτικότητα',
        targetEffortPerDay: 150,        // Higher target - pack more into fewer days
        maxReasonableEffort: 250,       // Allow heavier days
        effortPenaltyMultiplier: 0.3,   // Less penalty for high effort
        overagePenaltyMultiplier: 1.0,  // Lower penalty for going over
        proximityBonus: 180,            // Strong geographic clustering
        emptyDaySpreadBonus: 0,         // Don't encourage spreading - allow empty days
        spreadThreshold: 0.4,           // Only use 40% of days if possible
        characteristics: [
            'Minimize sightseeing days',
            'Allow free days',
            'Higher activity density',
            'Strong geographic grouping'
        ]
    },

    BALANCED: {
        id: 'balanced',
        name: 'Ισορροπημένο (Balanced)',
        emoji: '⚖️',
        description: 'Έξυπνη κατανομή σε περισσότερες ημέρες, αποφυγή άδειων ημερών',
        targetEffortPerDay: 100,        // Moderate daily effort
        maxReasonableEffort: 180,       // Reasonable limit
        effortPenaltyMultiplier: 0.5,   // Standard penalty
        overagePenaltyMultiplier: 2.0,  // Discourage overloading
        proximityBonus: 150,            // Maintain geographic logic
        emptyDaySpreadBonus: 30,        // Encourage using more days
        spreadThreshold: 0.75,          // Use 75% of available days
        characteristics: [
            'Distribute across most days',
            'Avoid empty days when possible',
            'Moderate daily intensity',
            'Balance geography & distribution'
        ]
    },

    RELAXED: {
        id: 'relaxed',
        name: 'Χαλαρό (Relaxed)',
        emoji: '🌴',
        description: 'Ελαφρύτερα προγράμματα, περισσότερος ελεύθερος χρόνος',
        targetEffortPerDay: 70,         // Light daily load
        maxReasonableEffort: 120,       // Lower ceiling
        effortPenaltyMultiplier: 0.8,   // Higher penalty for effort
        overagePenaltyMultiplier: 3.0,  // Strongly discourage overload
        proximityBonus: 140,            // Still respect geography
        emptyDaySpreadBonus: 40,        // Strongly encourage spreading
        spreadThreshold: 0.85,          // Use 85% of days
        characteristics: [
            'Light daily schedules',
            'More free time',
            'Lower fatigue',
            'Gentle pace'
        ]
    },

    INTENSIVE: {
        id: 'intensive',
        name: 'Εντατικό (Intensive)',
        emoji: '🔥',
        description: 'Μέγιστες δραστηριότητες ανά ημέρα, υψηλή ένταση',
        targetEffortPerDay: 180,        // High target
        maxReasonableEffort: 300,       // Very high ceiling
        effortPenaltyMultiplier: 0.2,   // Minimal penalty for effort
        overagePenaltyMultiplier: 0.5,  // Very low penalty for overload
        proximityBonus: 200,            // Maximum clustering efficiency
        emptyDaySpreadBonus: -20,       // Discourage spreading
        spreadThreshold: 0.3,           // Use only 30% of days
        characteristics: [
            'Maximize attractions per day',
            'Higher walking tolerance',
            'Dense schedules',
            'Efficiency focused'
        ]
    }
};

// Get pacing mode configuration by ID
export function getPacingMode(modeId) {
    const mode = PACING_MODES[modeId.toUpperCase()];
    if (!mode) {
        console.warn(`⚠️ Unknown pacing mode: ${modeId}, defaulting to BALANCED`);
        return PACING_MODES.BALANCED;
    }
    return mode;
}

// ==================== GEOGRAPHIC CALCULATIONS ====================

// Haversine distance formula - calculates distance between two lat/lng points
export function calculateDistance(point1, point2) {
    const R = 6371; // Ακτίνα Γης σε km

    const lat1 = point1[0] * Math.PI / 180;
    const lat2 = point2[0] * Math.PI / 180;
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Απόσταση σε km
}

// ==================== CITY DATA ====================

export function getCityCoordinates(cityId) {
    const coordinates = {
        'amsterdam': [52.3702, 4.8952],
        'paris': [48.8566, 2.3522],
        'london': [51.5074, -0.1278],
        'berlin': [52.5200, 13.4050],
        'prague': [50.0755, 14.4378],
        'budapest': [47.4979, 19.0402],
        'vienna': [48.2082, 16.3738],
        'rome': [41.9028, 12.4964],
        'barcelona': [41.3851, 2.1734],
        'madrid': [40.4168, -3.7038],
        'lisbon': [38.7223, -9.1393],
        'istanbul': [41.0082, 28.9784],
        'brussels': [50.8503, 4.3517],
        'copenhagen': [55.6761, 12.5683],
        'dublin': [53.3498, -6.2603],
        'edinburgh': [55.9533, -3.1883],
        'florence': [43.7696, 11.2558],
        'munich': [48.1351, 11.5820],
        'venice': [45.4408, 12.3155],
        'warsaw': [52.2297, 21.0122],
        'krakow': [50.0647, 19.9450],
        'zurich': [47.3769, 8.5417],
        'bucharest': [44.4268, 26.1025]
    };

    if (!coordinates[cityId]) {
        console.error(`❌ Δεν βρέθηκαν συντεταγμένες για πόλη: ${cityId}`);
        return null;
    }

    return coordinates[cityId];
}

// ==================== FORMATTING UTILITIES ====================

export function translateCategory(cat) {
    const translations = {
        'attraction': 'Αξιοθέατα',
        'museum': 'Μουσεία',
        'landmark': 'Μνημεία',
        'theme_park': 'Πάρκα',
        'zoo': 'Ζωολογικός',
        'palace': 'Ανάκτορα',
        'church': 'Εκκλησίες',
        'garden': 'Πάρκα/Κήποι',
        'science': 'Επιστήμη'
    };
    return translations[cat] || cat;
}

export function getActivityIcon(category) {
    const icons = {
        'museum': 'fa-university',
        'science': 'fa-flask',
        'art': 'fa-palette',
        'history': 'fa-landmark',
        'theme_park': 'fa-ferris-wheel',
        'zoo': 'fa-paw',
        'garden': 'fa-tree',
        'attraction': 'fa-star'
    };
    return icons[category] || 'fa-map-marker-alt';
}

export function getActivityEmoji(category) {
    const emojiMap = {
        'attraction': '🎡',
        'castle': '🏰',
        'museum': '🏛️',
        'landmark': '🗼',
        'theme_park': '🎢',
        'zoo': '🐯',
        'aquarium': '🐠',
        'garden': '🌳',
        'palace': '👑',
        'church': '⛪',
        'tower': '🗼',
        'wheel': '🎡',
        'bridge': '🌉',
        'square': '⛲',
        'cruise': '🚢',
        'tour': '🚌',
        'experience': '🎭',
        'art': '🎨',
        'history': '📜',
        'science': '🔬',
        'nature': '🌿'
    };

    return emojiMap[category] || '📍';
}
