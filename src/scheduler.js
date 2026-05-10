// ==================== SCHEDULER MODULE ====================
// Effort-based scheduling algorithm for geographic trip planning
// Pure refactor - NO logic changes, 100% identical behavior

// Import dependencies (will be provided by data.js)
import { calculateDistance } from './data.js';
import { COLOR_PALETTE } from './data.js';
import { PACING_MODES, getPacingMode } from './data.js';

// ==================== DISTRIBUTE GROUPS TO DAYS ====================
export function distributeGroupsToDays(groups, totalDays, pacingModeId = 'balanced') {
    const pacingMode = getPacingMode(pacingModeId);
    console.log(`📅 Κατανομή με ${pacingMode.emoji} ${pacingMode.name}: ${groups.length} ομάδων σε ${totalDays} μέρες`);

    if (groups.length === 0 || totalDays < 1) {
        console.error('❌ Μη έγκυρα δεδομένα για κατανομή');
        return [];
    }

    const days = Array.from({ length: totalDays }, () => ({
        groups: [],
        totalActivities: 0,
        totalCost: 0,
        estimatedTime: 0,
        totalEffort: 0,
        center: null
    }));

    // 1. Sort groups by effort and geographic spread
    const sortedGroups = [...groups].sort((a, b) => {
        const effortA = calculateGroupEffort(a);
        const effortB = calculateGroupEffort(b);
        // Prioritize higher effort groups first for better balance
        if (effortB !== effortA) return effortB - effortA;
        // Then by radius (tighter clusters first)
        return (a.radius || 0) - (b.radius || 0);
    });

    console.log(`🎯 ΣΤΟΧΟΣ: ${pacingMode.description}`);

    // 2. Distribute groups using effort-based algorithm with pacing mode
    sortedGroups.forEach((group, index) => {
        const bestDayIndex = findBestDayForGroup(days, group, totalDays, pacingMode);

        // Calculate group metrics
        const groupEffort = calculateGroupEffort(group);
        let groupCost = 0;
        let groupTime = 0;

        group.activities.forEach(activity => {
            groupCost += (parseFloat(activity.price) || 0);
            groupTime += (parseFloat(activity.duration_hours) || 1.5);
        });

        // Travel time within cluster
        const travelTime = (group.activities.length - 1) * 0.3;

        // Add to selected day
        days[bestDayIndex].groups.push(group);
        days[bestDayIndex].totalActivities += group.count;
        days[bestDayIndex].totalCost += groupCost;
        days[bestDayIndex].estimatedTime += groupTime + travelTime;
        days[bestDayIndex].totalEffort += groupEffort;
        days[bestDayIndex].center = calculateDayCenter(days[bestDayIndex].groups);

        console.log(`   📦 Cluster ${index + 1} (${group.count} δρ., effort: ${groupEffort.toFixed(1)}) → Μέρα ${bestDayIndex + 1} (σύνολο: ${days[bestDayIndex].totalActivities} δρ., effort: ${days[bestDayIndex].totalEffort.toFixed(1)})`);
    });

    // 3. Optimize distribution: rebalance if needed
    balanceDaysIfNeeded(days);

    console.log(`✅ Κατανομή βασισμένη σε προσπάθεια σε ${totalDays} μέρες:`);
    days.forEach((day, i) => {
        if (day.totalActivities > 0) {
            console.log(`   Μ${i+1}: ${day.totalActivities} δραστηριότητες, ~${day.estimatedTime.toFixed(1)}h, effort: ${day.totalEffort.toFixed(1)}`);
        } else {
            console.log(`   Μ${i+1}: (ελεύθερη μέρα)`);
        }
    });

    return days;
}

// ==================== CALCULATE GROUP EFFORT ====================
export function calculateGroupEffort(group) {
    if (!group || !group.activities || group.activities.length === 0) {
        return 0;
    }

    let totalEffort = 0;

    group.activities.forEach(activity => {
        // Base effort from duration
        const duration = parseFloat(activity.duration_hours) || 1.5;
        let activityEffort = duration * 10; // Base: 1 hour = 10 effort points

        // Physical intensity multiplier based on category
        const intensityMultiplier = getIntensityMultiplier(activity.category);
        activityEffort *= intensityMultiplier;

        // Add effort for the activity
        totalEffort += activityEffort;
    });

    // Inter-activity travel effort within cluster
    if (group.activities.length > 1) {
        // Effort based on cluster radius (spread of activities)
        const clusterRadius = group.radius || 0;
        const travelEffort = (group.activities.length - 1) * (5 + clusterRadius * 2);
        totalEffort += travelEffort;
    }

    return totalEffort;
}

// Get intensity multiplier based on activity category
export function getIntensityMultiplier(category) {
    const intensityMap = {
        // High intensity (walking-heavy, outdoor)
        'park': 1.3,
        'outdoor': 1.3,
        'nature': 1.3,
        'walking_tour': 1.4,
        'hiking': 1.5,

        // Medium intensity (typical sightseeing)
        'attraction': 1.0,
        'museum': 1.0,
        'gallery': 1.0,
        'monument': 1.0,
        'church': 1.0,
        'castle': 1.1,

        // Light intensity (seated, minimal walking)
        'theater': 0.7,
        'cinema': 0.6,
        'restaurant': 0.5,
        'cafe': 0.5,
        'show': 0.7,
        'cruise': 0.6,

        // Default
        'default': 1.0
    };

    return intensityMap[category?.toLowerCase()] || intensityMap['default'];
}

// Find the best day for a group using effort-based scoring with pacing mode
export function findBestDayForGroup(days, group, totalDays, pacingMode) {
    // Use pacing mode parameters for optimization
    const TARGET_EFFORT_PER_DAY = pacingMode.targetEffortPerDay;
    const MAX_REASONABLE_EFFORT = pacingMode.maxReasonableEffort;
    const EFFORT_PENALTY_MULT = pacingMode.effortPenaltyMultiplier;
    const OVERAGE_PENALTY_MULT = pacingMode.overagePenaltyMultiplier;
    const PROXIMITY_BONUS = pacingMode.proximityBonus;
    const SPREAD_BONUS = pacingMode.emptyDaySpreadBonus;
    const SPREAD_THRESHOLD = pacingMode.spreadThreshold;

    let bestDayIndex = 0;
    let bestScore = -Infinity;

    const groupEffort = calculateGroupEffort(group);

    for (let i = 0; i < totalDays; i++) {
        const day = days[i];
        const projectedEffort = day.totalEffort + groupEffort;

        // Calculate score for this day (higher is better)
        let score = 0;

        // 1. Effort balance factor: prefer days closer to target
        // Penalty scales with pacing mode preferences
        const effortDeviation = Math.abs(projectedEffort - TARGET_EFFORT_PER_DAY);
        const effortPenalty = effortDeviation * EFFORT_PENALTY_MULT;
        score -= effortPenalty;

        // Extra penalty if going way over reasonable effort
        if (projectedEffort > MAX_REASONABLE_EFFORT) {
            const overagePenalty = (projectedEffort - MAX_REASONABLE_EFFORT) * OVERAGE_PENALTY_MULT;
            score -= overagePenalty;
        }

        // 2. Geographic proximity factor: PRIORITY - prefer days with nearby groups
        if (day.groups.length > 0 && day.center && group.center) {
            const distanceToDay = calculateDistance(day.center, group.center);
            // Proximity bonus scales with pacing mode
            const proximityFactor = Math.max(0, PROXIMITY_BONUS - distanceToDay * 15);
            score += proximityFactor;
        } else {
            // If day is empty, give moderate score (scaled by proximity bonus)
            score += PROXIMITY_BONUS * 0.5;
        }

        // 3. Activity spread factor: varies by pacing mode
        // Balanced/Relaxed encourage spreading, Compact/Intensive discourage it
        const daysFilled = days.filter(d => d.totalActivities > 0).length;
        if (day.totalActivities === 0 && daysFilled < totalDays * SPREAD_THRESHOLD) {
            score += SPREAD_BONUS; // Can be positive (spread) or negative (compact)
        }

        if (score > bestScore) {
            bestScore = score;
            bestDayIndex = i;
        }
    }

    return bestDayIndex;
}

// Calculate geographic center of all groups in a day
export function calculateDayCenter(groups) {
    const validGroups = groups.filter(g => g.center);
    if (validGroups.length === 0) return null;

    const totalLat = validGroups.reduce((sum, g) => sum + g.center[0], 0);
    const totalLng = validGroups.reduce((sum, g) => sum + g.center[1], 0);

    return [totalLat / validGroups.length, totalLng / validGroups.length];
}

// Rebalance days if there's significant effort imbalance
export function balanceDaysIfNeeded(days) {
    const nonEmptyDays = days.filter(d => d.totalActivities > 0);
    if (nonEmptyDays.length === 0) return;

    const avgEffort = nonEmptyDays.reduce((sum, d) => sum + d.totalEffort, 0) / nonEmptyDays.length;
    const avgActivities = nonEmptyDays.reduce((sum, d) => sum + d.totalActivities, 0) / nonEmptyDays.length;

    // Log warnings for extreme imbalance (2x average effort)
    const extremeImbalanceThreshold = avgEffort * 2;

    nonEmptyDays.forEach(day => {
        if (day.totalEffort > extremeImbalanceThreshold) {
            console.log(`   ⚖️ ⚠️ Μέρα με effort ${day.totalEffort.toFixed(1)} είναι πολύ βαριά (μέσος: ${avgEffort.toFixed(1)})`);
        }
    });

    // Log balance statistics
    const minEffort = Math.min(...nonEmptyDays.map(d => d.totalEffort));
    const maxEffort = Math.max(...nonEmptyDays.map(d => d.totalEffort));
    const minActivities = Math.min(...nonEmptyDays.map(d => d.totalActivities));
    const maxActivities = Math.max(...nonEmptyDays.map(d => d.totalActivities));

    console.log(`   📊 Ισορροπία Προσπάθειας: ${minEffort.toFixed(1)}-${maxEffort.toFixed(1)} effort/μέρα (μέσος: ${avgEffort.toFixed(1)})`);
    console.log(`   📊 Ισορροπία Δραστηριοτήτων: ${minActivities}-${maxActivities} δραστ/μέρα (μέσος: ${avgActivities.toFixed(1)}) - χωρίς σκληρά όρια`);
}

export function getDayColor(dayNumber) {
    return COLOR_PALETTE[(dayNumber - 1) % COLOR_PALETTE.length];
}

export function getGroupColor(index) {
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
}
