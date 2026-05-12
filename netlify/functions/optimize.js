'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371.0;

const SPEEDS  = { walking: 4.5, cycling: 14.0, public_transport: 22.0, taxi: 35.0 };
const OVERHEAD = { walking: 0.0, cycling: 2.0, public_transport: 8.0,  taxi: 5.0  };
const WALKING_THRESHOLD_KM = 0.6;

// Extra per-leg buffer (boarding, parking, transfer) by mode
const TRANSFER_BUFFER = { walking: 0, cycling: 3, public_transport: 5, taxi: 5 };

const PACING_CAPACITY = { compact: 1.00, balanced: 1.00, relaxed: 0.65, intensive: 1.10 };
const STYLE_MULT      = { relaxed: 0.75, balanced: 1.0,  intensive: 1.25 };

const BASE_WEIGHTS = {
  distance: 0.13, balance: 0.13, fatigue: 0.11,
  cluster:  0.11, preference: 0.06, priority: 0.06,
  exhaustion: 0.10, timing: 0.09, flow: 0.12, sustainability: 0.09,
};

// ── Night / safety restrictions ────────────────────────────────────────────

// Hard cutoff: these categories must not be scheduled after NIGHT_CUTOFF_HOUR
const NIGHT_RESTRICTED_CATS = new Set([
  'park', 'garden', 'beach', 'mountain', 'nature', 'outdoor',
  'viewpoint', 'cave', 'mine', 'forest', 'hiking', 'remote', 'tour',
]);

// Soft: prefer these sites before 14:00
const MORNING_PREFERRED_CATS = new Set([
  'museum', 'memorial', 'palace', 'historical', 'landmark',
  'gallery', 'cathedral', 'religious', 'heritage',
]);

// These are fine in the evening
const EVENING_OK_CATS = new Set([
  'shopping', 'market', 'neighborhood', 'square', 'boulevard',
  'restaurant', 'bar', 'theater', 'entertainment',
]);

const SUNSET_HOUR       = 20; // 20:00 – soft outdoor warning
const NIGHT_CUTOFF_HOUR = 21; // 21:00 – hard cutoff for NIGHT_RESTRICTED_CATS

// ── Daily hard limits ─────────────────────────────────────────────────

const MAX_TRANSIT_PER_DAY_MIN = 180; // 3 h cumulative transit
const MAX_DAY_SPAN_MIN        = 12 * 60; // 12 h from first departure to last end
const HEAVY_TRANSFER_MIN      = 90;  // warn/penalise single legs > 90 min

// ── Anchor attraction constants ────────────────────────────────────────────────
const ANCHOR_TOTAL_MIN = 240;   // duration + round-trip transit ≥ this → anchor
const ANCHOR_DUR_MIN   = 300;   // standalone duration ≥ this → anchor (5 h)
const ANCHOR_NEARBY_KM = 5.0;   // supplement must be within this distance of anchor
const ANCHOR_LIGHT_MAX = 90;    // supplement duration must be ≤ this (min)
const ANCHOR_MAX_SUPPS = 2;     // max supplement stops on an anchor day

// ── Accommodation-aware routing constants ──────────────────────────────────────
const LATE_RETURN_HOUR = 21;    // hotel arrival after this hour is penalised
const LATE_RETURN_FAR  = 30;    // return transit (min) that triggers late penalty

// ── Energy / fatigue model ─────────────────────────────────────────────────
// Per-category energy profiles: physical, cognitive, emotional, stimulation (1–10 scale).
// Accumulated across visit durations (hours) to produce day-level energy loads.
// These are defaults only — an attraction may carry an explicit energy_profile object.
const ENERGY_PROFILES = {
  hiking:       { physical: 9, cognitive: 2, emotional: 3, stimulation: 5 },
  mountain:     { physical: 8, cognitive: 2, emotional: 4, stimulation: 6 },
  nature:       { physical: 5, cognitive: 1, emotional: 3, stimulation: 4 },
  park:         { physical: 3, cognitive: 1, emotional: 2, stimulation: 2 },
  garden:       { physical: 3, cognitive: 2, emotional: 2, stimulation: 2 },
  beach:        { physical: 4, cognitive: 1, emotional: 3, stimulation: 3 },
  memorial:     { physical: 2, cognitive: 5, emotional: 9, stimulation: 4 },
  museum:       { physical: 2, cognitive: 7, emotional: 4, stimulation: 5 },
  gallery:      { physical: 2, cognitive: 6, emotional: 4, stimulation: 5 },
  cathedral:    { physical: 2, cognitive: 4, emotional: 6, stimulation: 4 },
  palace:       { physical: 3, cognitive: 5, emotional: 4, stimulation: 5 },
  heritage:     { physical: 3, cognitive: 5, emotional: 5, stimulation: 5 },
  historical:   { physical: 2, cognitive: 6, emotional: 5, stimulation: 5 },
  landmark:     { physical: 3, cognitive: 3, emotional: 3, stimulation: 4 },
  castle:       { physical: 4, cognitive: 5, emotional: 4, stimulation: 5 },
  ruins:        { physical: 4, cognitive: 5, emotional: 5, stimulation: 5 },
  religious:    { physical: 2, cognitive: 4, emotional: 6, stimulation: 4 },
  cemetery:     { physical: 2, cognitive: 3, emotional: 7, stimulation: 3 },
  theme_park:   { physical: 8, cognitive: 3, emotional: 5, stimulation: 9 },
  amusement:    { physical: 7, cognitive: 2, emotional: 4, stimulation: 9 },
  zoo:          { physical: 5, cognitive: 3, emotional: 3, stimulation: 6 },
  aquarium:     { physical: 2, cognitive: 4, emotional: 3, stimulation: 6 },
  shopping:     { physical: 4, cognitive: 2, emotional: 2, stimulation: 4 },
  market:       { physical: 4, cognitive: 3, emotional: 3, stimulation: 5 },
  restaurant:   { physical: 1, cognitive: 1, emotional: 2, stimulation: 2 },
  bar:          { physical: 1, cognitive: 1, emotional: 2, stimulation: 3 },
  theater:      { physical: 1, cognitive: 5, emotional: 6, stimulation: 6 },
  entertainment:{ physical: 4, cognitive: 2, emotional: 3, stimulation: 7 },
  square:       { physical: 3, cognitive: 2, emotional: 2, stimulation: 3 },
  neighborhood: { physical: 3, cognitive: 2, emotional: 2, stimulation: 3 },
  boulevard:    { physical: 3, cognitive: 1, emotional: 2, stimulation: 3 },
  viewpoint:    { physical: 4, cognitive: 1, emotional: 4, stimulation: 5 },
  cave:         { physical: 5, cognitive: 3, emotional: 4, stimulation: 6 },
  mine:         { physical: 5, cognitive: 4, emotional: 5, stimulation: 6 },
  forest:       { physical: 5, cognitive: 1, emotional: 2, stimulation: 3 },
  outdoor:      { physical: 5, cognitive: 2, emotional: 2, stimulation: 4 },
  tour:         { physical: 4, cognitive: 4, emotional: 3, stimulation: 5 },
  remote:       { physical: 6, cognitive: 2, emotional: 4, stimulation: 5 },
};
const DEFAULT_ENERGY = { physical: 3, cognitive: 3, emotional: 3, stimulation: 4 };

function getEnergyProfile(attr) {
  if (attr.energy_profile) return attr.energy_profile;
  const cat = (attr.category || '').toLowerCase();
  return ENERGY_PROFILES[cat] || DEFAULT_ENERGY;
}

// Aggregate weighted energy load for an array of plannedAttraction objects.
// Each dimension = profile value × visit hours, summed across all stops.
function computeDayEnergy(plannedAttractions) {
  return plannedAttractions.reduce((acc, pa) => {
    const ep  = getEnergyProfile(pa.attraction);
    const hrs = (pa.attraction.duration_minutes || 60) / 60;
    return {
      physical:    acc.physical    + ep.physical    * hrs,
      cognitive:   acc.cognitive   + ep.cognitive   * hrs,
      emotional:   acc.emotional   + (ep.emotional ?? 3) * hrs,
      stimulation: acc.stimulation + ep.stimulation * hrs,
    };
  }, { physical: 0, cognitive: 0, emotional: 0, stimulation: 0 });
}

// Transition penalty between two consecutive attractions (0 = smooth, 30 = jarring).
// Rewards: varied intensity, natural de-escalation, transit buffer, geographic proximity.
// Penalises: abrupt emotional exit, cognitive/physical stack, stimulation overload.
// NOTE: same category is NOT penalised — only energy load matters.
// Proximity discount: adjacent attractions (< 400 m) get reduced stack penalties,
// reflecting the natural clustering of museums in the same building or district.
function transitionPenalty(fromAttr, toAttr, transitMinutes) {
  const from = getEnergyProfile(fromAttr);
  const to   = getEnergyProfile(toAttr);
  const fromEmotional = from.emotional ?? 3;
  const toEmotional   = to.emotional   ?? 3;

  let penalty = 0;

  // Jarring emotional context switch (e.g. Holocaust memorial → amusement arcade)
  const emotionalDrop = fromEmotional - toEmotional;
  if      (emotionalDrop >= 6) penalty += 20;
  else if (emotionalDrop >= 4) penalty += 10;
  else if (emotionalDrop >= 2) penalty += 4;

  // Cognitive overload stack (back-to-back high-cognition without a break)
  if (from.cognitive >= 7 && to.cognitive >= 7) penalty += 12;
  else if (from.cognitive >= 6 && to.cognitive >= 6) penalty += 6;

  // Physical fatigue stack
  if (from.physical >= 7 && to.physical >= 7) penalty += 12;
  else if (from.physical >= 6 && to.physical >= 6) penalty += 6;

  // Stimulation overload
  if (from.stimulation >= 8 && to.stimulation >= 8) penalty += 8;

  // Proximity discount: geographically adjacent attractions (same block / complex)
  // naturally share pacing context — reduce cognitive/physical stack friction.
  if (fromAttr.latitude && toAttr.latitude) {
    const distKm = haversineKm(fromAttr.latitude, fromAttr.longitude, toAttr.latitude, toAttr.longitude);
    if      (distKm < 0.3) penalty = Math.max(0, penalty - 8);  // across the street / same complex
    else if (distKm < 0.8) penalty = Math.max(0, penalty - 4);  // same neighbourhood
  }

  // Transit time is a natural recovery buffer — further reduces transition friction
  if      (transitMinutes >= 45) penalty = Math.max(0, penalty - 15);
  else if (transitMinutes >= 20) penalty = Math.max(0, penalty - 8);
  else if (transitMinutes >= 10) penalty = Math.max(0, penalty - 3);

  return Math.min(30, penalty);
}

// ── Math helpers ──────────────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const phi1 = lat1 * Math.PI / 180, phi2 = lat2 * Math.PI / 180;
  const dphi = (lat2 - lat1) * Math.PI / 180;
  const dlam = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function travelMinutes(lat1, lon1, lat2, lon2, mode = 'public_transport') {
  const dist         = haversineKm(lat1, lon1, lat2, lon2);
  const effectiveMode = dist <= WALKING_THRESHOLD_KM ? 'walking' : mode;
  const speed        = SPEEDS[effectiveMode]  || 22.0;
  const overhead     = OVERHEAD[effectiveMode] || 5.0;
  const buffer       = TRANSFER_BUFFER[effectiveMode] || 0;
  return {
    minutes: Math.max(1, Math.round((dist / speed) * 60 + overhead + buffer)),
    mode: effectiveMode,
    dist,
  };
}

function walkingMinutes(lat1, lon1, lat2, lon2) {
  const dist = haversineKm(lat1, lon1, lat2, lon2);
  return Math.max(1, Math.round((dist / SPEEDS.walking) * 60));
}

// ── Distance matrix ───────────────────────────────────────────────────────────

function buildDistanceMatrix(coords, mode) {
  const n    = coords.length;
  const time  = Array.from({ length: n }, () => new Array(n).fill(0));
  const dist  = Array.from({ length: n }, () => new Array(n).fill(0));
  const modes = Array.from({ length: n }, () => new Array(n).fill(''));
  const walk  = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const r = travelMinutes(coords[i][0], coords[i][1], coords[j][0], coords[j][1], mode);
      time[i][j]  = time[j][i]  = r.minutes;
      dist[i][j]  = dist[j][i]  = r.dist;
      modes[i][j] = modes[j][i] = r.mode;
      walk[i][j]  = walk[j][i]  = walkingMinutes(
        coords[i][0], coords[i][1], coords[j][0], coords[j][1]
      );
    }
  }
  return { time, dist, modes, walk };
}

// ── DBSCAN clustering ─────────────────────────────────────────────────────────

function dbscan(coords, epsilonKm, minSamples = 1) {
  const n        = coords.length;
  const UNVISITED = -2;
  const labels   = new Array(n).fill(UNVISITED);
  let clusterId  = 0;

  function neighbors(idx) {
    const res = [];
    for (let j = 0; j < n; j++) {
      if (haversineKm(coords[idx][0], coords[idx][1], coords[j][0], coords[j][1]) <= epsilonKm)
        res.push(j);
    }
    return res;
  }

  for (let i = 0; i < n; i++) {
    if (labels[i] !== UNVISITED) continue;
    const nbrs = neighbors(i);
    if (nbrs.length < minSamples) { labels[i] = -1; continue; }

    labels[i] = clusterId;
    const seeds   = [...nbrs.filter(j => j !== i)];
    const inSeeds = new Set(seeds);

    for (let j = 0; j < seeds.length; j++) {
      const idx = seeds[j];
      if (labels[idx] === -1) labels[idx] = clusterId;
      if (labels[idx] !== UNVISITED) continue;
      labels[idx] = clusterId;
      const newNbrs = neighbors(idx);
      if (newNbrs.length >= minSamples) {
        for (const k of newNbrs) {
          if (!inSeeds.has(k)) { seeds.push(k); inSeeds.add(k); }
        }
      }
    }
    clusterId++;
  }

  // Reassign noise points to singleton clusters
  let nextId = clusterId;
  for (let i = 0; i < n; i++) if (labels[i] < 0) labels[i] = nextId++;
  return labels;
}

function clusterSummary(labels, coords, priorities, durations) {
  const summary = {};
  for (let i = 0; i < labels.length; i++) {
    const cid = labels[i];
    if (!summary[cid]) {
      summary[cid] = {
        cluster_id: cid, attraction_indices: [], size: 0,
        centroid_lat: 0, centroid_lon: 0, total_duration_minutes: 0, avg_priority: 0,
      };
    }
    const s = summary[cid];
    s.attraction_indices.push(i);
    s.total_duration_minutes += durations[i];
    s.size++;
  }
  for (const [, s] of Object.entries(summary)) {
    const idxs      = s.attraction_indices;
    s.centroid_lat  = idxs.reduce((acc, i) => acc + coords[i][0], 0) / idxs.length;
    s.centroid_lon  = idxs.reduce((acc, i) => acc + coords[i][1], 0) / idxs.length;
    s.avg_priority  = idxs.reduce((acc, i) => acc + priorities[i], 0) / idxs.length;
  }
  return summary;
}

// ── Anchor detection ─────────────────────────────────────────────────────────

function detectAnchors(attractions, timeMatrix) {
  const anchors = new Set();
  for (let i = 0; i < attractions.length; i++) {
    const attr      = attractions[i];
    const roundTrip = timeMatrix[0][i + 1] * 2;
    if (
      attr.anchor === true ||
      (attr.duration_minutes ?? 60) >= ANCHOR_DUR_MIN ||
      (attr.duration_minutes ?? 60) + roundTrip >= ANCHOR_TOTAL_MIN
    ) {
      anchors.add(i);
    }
  }
  return anchors;
}

// After initial bin-packing, enforce anchor-day rules: each anchor gets its own
// day with at most ANCHOR_MAX_SUPPS nearby/light supplements; everything else
// is displaced to non-anchor days (or spills into new overflow days).
function enforceAnchorDays(dayGroups, anchorSet, attractions, durations, timeMatrix, netCap) {
  if (!anchorSet.size) return dayGroups;

  const displaced = [];

  const newGroups = dayGroups.map(group => {
    const anchorIndices = group.filter(i => anchorSet.has(i));
    if (!anchorIndices.length) return group;

    // Pick heaviest anchor as the "main" one for the day
    const mainAnchor = anchorIndices.reduce((best, i) =>
      (durations[i] ?? 0) > (durations[best] ?? 0) ? i : best, anchorIndices[0]);

    const supplements = [];
    for (const i of group) {
      if (anchorSet.has(i)) {
        if (i !== mainAnchor) displaced.push(i);
        continue;
      }
      const dist     = haversineKm(
        attractions[mainAnchor].latitude, attractions[mainAnchor].longitude,
        attractions[i].latitude,          attractions[i].longitude,
      );
      const isNearby = dist <= ANCHOR_NEARBY_KM;
      const isLight  = (durations[i] ?? 60) <= ANCHOR_LIGHT_MAX;
      if (isNearby && isLight && supplements.length < ANCHOR_MAX_SUPPS) {
        supplements.push(i);
      } else {
        displaced.push(i);
      }
    }
    return [mainAnchor, ...supplements];
  });

  // Re-insert displaced attractions into non-anchor days
  const isAnchorDay = g => g.some(i => anchorSet.has(i));

  for (const attrIdx of displaced) {
    let placed = false;
    const dayLoads = newGroups
      .map((g, di) => [di, clusterTimeBudget(g, durations, timeMatrix)])
      .filter(([di]) => !isAnchorDay(newGroups[di]))
      .sort((a, b) => a[1] - b[1]);

    for (const [di] of dayLoads) {
      const proposed = [...newGroups[di], attrIdx];
      if (clusterTimeBudget(proposed, durations, timeMatrix) <= netCap * 1.05) {
        newGroups[di] = proposed;
        placed = true;
        break;
      }
    }
    if (!placed) newGroups.push([attrIdx]);
  }

  return newGroups.filter(g => g.length > 0);
}

// ── Day allocation ────────────────────────────────────────────────────────────

function clusterTimeBudget(attrIndices, durations, timeMatrix, overheadPct = 0.15) {
  if (!attrIndices.length) return 0;
  const totalVisit = attrIndices.reduce((s, i) => s + durations[i], 0);
  if (attrIndices.length === 1) return Math.round(totalVisit * (1 + overheadPct));

  const ext       = attrIndices.map(i => i + 1);
  const unvisited = new Set(ext);
  let current = ext[0]; unvisited.delete(current);
  let travel = 0;
  while (unvisited.size > 0) {
    let nearest = -1, minT = Infinity;
    for (const j of unvisited) {
      if (timeMatrix[current][j] < minT) { minT = timeMatrix[current][j]; nearest = j; }
    }
    travel += timeMatrix[current][nearest];
    current = nearest;
    unvisited.delete(current);
  }
  return Math.round((totalVisit + travel) * (1 + overheadPct));
}

function allocateDays(clusterLabels, cSummary, durations, timeMatrix,
                      totalDays, maxHours, travelStyle, preferences, pacingMode,
                      attractions, anchorSet) {
  const maxMinutes   = maxHours * 60;
  const styleMult    = STYLE_MULT[travelStyle] || 1.0;
  const pacingMult   = PACING_CAPACITY[pacingMode] || 1.0;
  const effectiveCap = maxMinutes * styleMult * pacingMult;
  const netCap       = Math.max(60, effectiveCap - 60);

  const orderedClusters = (() => {
    const keys = Object.keys(cSummary).map(Number);
    if (preferences.includes('group_nearby'))
      return keys.sort((a, b) => cSummary[b].size - cSummary[a].size);
    return keys.sort((a, b) => cSummary[b].avg_priority - cSummary[a].avg_priority);
  })();

  let dayGroups;

  if (pacingMode === 'balanced') {
    dayGroups = spreadAcrossDays(orderedClusters, cSummary, durations, timeMatrix, totalDays, netCap);
  } else {
    dayGroups = packClustersInDays(orderedClusters, cSummary, durations, timeMatrix, netCap);
    dayGroups = balanceDays(dayGroups, durations);
    dayGroups = splitOverloadedDays(dayGroups, durations, timeMatrix, netCap);
    dayGroups = trimToTotalDays(dayGroups, durations, totalDays);
  }

  dayGroups = splitOverloadedDays(dayGroups, durations, timeMatrix, netCap);
  if (dayGroups.length > totalDays) dayGroups = trimToTotalDays(dayGroups, durations, totalDays);

  // Enforce anchor-day rules before local search
  if (anchorSet && anchorSet.size) {
    dayGroups = enforceAnchorDays(dayGroups, anchorSet, attractions, durations, timeMatrix, netCap);
    if (dayGroups.length > totalDays) dayGroups = trimToTotalDays(dayGroups, durations, totalDays);
  }

  // Local search: move single attractions between days (respects anchor constraints)
  dayGroups = localSearchDayImprove(dayGroups, durations, timeMatrix, netCap, anchorSet || new Set());

  const freeDays = [];
  for (let d = dayGroups.length + 1; d <= totalDays; d++) freeDays.push(d);
  return { dayGroups, freeDays };
}

// ── Local search: improve day assignment ──────────────────────────────────────────

function evalDayGroupQuality(dayGroups, durations, timeMatrix) {
  if (!dayGroups.length) return 0;

  // Balance: coefficient of variation (lower = better balance)
  const loads = dayGroups.map(g => g.reduce((s, i) => s + durations[i], 0));
  const mean  = loads.reduce((s, v) => s + v, 0) / loads.length;
  const std   = Math.sqrt(loads.reduce((s, v) => s + (v - mean) ** 2, 0) / loads.length);
  const balanceScore = 1 - Math.min(1, std / Math.max(1, mean));

  // Geographic coherence: avg intra-day travel time (lower = better)
  let totalIntra = 0, pairs = 0;
  for (const day of dayGroups) {
    for (let i = 0; i < day.length; i++) {
      for (let j = i + 1; j < day.length; j++) {
        totalIntra += timeMatrix[day[i] + 1][day[j] + 1];
        pairs++;
      }
    }
  }
  const avgIntra     = pairs > 0 ? totalIntra / pairs : 0;
  const coherenceScore = Math.max(0, 1 - avgIntra / 60); // 60-min avg → score 0

  return 0.5 * balanceScore + 0.5 * coherenceScore;
}

function localSearchDayImprove(dayGroups, durations, timeMatrix, netCap, anchorSet = new Set(), maxIter = 400) {
  if (dayGroups.length <= 1) return dayGroups;
  let bestScore = evalDayGroupQuality(dayGroups, durations, timeMatrix);
  const isAnchorDay = g => g.some(i => anchorSet.has(i));

  for (let iter = 0; iter < maxIter; iter++) {
    const d1 = Math.floor(Math.random() * dayGroups.length);
    if (!dayGroups[d1] || !dayGroups[d1].length) continue;

    const ai   = Math.floor(Math.random() * dayGroups[d1].length);
    const attr = dayGroups[d1][ai];

    // Never move anchor attractions out of their assigned day
    if (anchorSet.has(attr)) continue;

    for (let d2 = 0; d2 < dayGroups.length; d2++) {
      if (d2 === d1) continue;

      // Don't add regular attractions to anchor days
      if (isAnchorDay(dayGroups[d2])) continue;

      const newD1 = dayGroups[d1].filter((_, k) => k !== ai);
      const newD2 = [...dayGroups[d2], attr];

      // Reject if target day would exceed capacity
      if (clusterTimeBudget(newD2, durations, timeMatrix) > netCap * 1.05) continue;

      const candidate     = dayGroups
        .map((g, i) => (i === d1 ? newD1 : i === d2 ? newD2 : g))
        .filter(g => g.length > 0);
      const candidateScore = evalDayGroupQuality(candidate, durations, timeMatrix);

      if (candidateScore > bestScore + 0.001) {
        dayGroups  = candidate;
        bestScore  = candidateScore;
        break;
      }
    }
  }
  return dayGroups;
}

function balancedTargetCap(durations, totalDays, netCap) {
  const totalVisit = durations.reduce((s, d) => s + d, 0);
  const perDay     = (totalVisit * 1.3) / Math.max(1, totalDays);
  return Math.max(90, Math.min(netCap, Math.round(perDay)));
}

function spreadAcrossDays(orderedClusters, cSummary, durations, timeMatrix, totalDays, netCap) {
  const targetCap  = balancedTargetCap(durations, totalDays, netCap);
  const dayGroups  = Array.from({ length: totalDays }, () => []);
  const dayBudgets = new Array(totalDays).fill(0);

  const ranked = () =>
    Array.from({ length: totalDays }, (_, i) => i).sort((a, b) => dayBudgets[a] - dayBudgets[b]);

  for (const cid of orderedClusters) {
    const idxs = cSummary[cid].attraction_indices;
    const cost = clusterTimeBudget(idxs, durations, timeMatrix);
    let placed = false;

    for (const d of ranked()) {
      if (dayBudgets[d] + cost <= targetCap) {
        dayGroups[d].push(...idxs); dayBudgets[d] += cost; placed = true; break;
      }
    }
    if (!placed) {
      for (const d of ranked()) {
        if (dayBudgets[d] + cost <= netCap) {
          dayGroups[d].push(...idxs); dayBudgets[d] += cost; placed = true; break;
        }
      }
    }
    if (!placed && idxs.length > 1) {
      for (const idx of idxs) {
        const sc = clusterTimeBudget([idx], durations, timeMatrix);
        let sp = false;
        for (const d of ranked()) {
          if (dayBudgets[d] + sc <= netCap) {
            dayGroups[d].push(idx); dayBudgets[d] += sc; sp = true; break;
          }
        }
        if (!sp) { const d = ranked()[0]; dayGroups[d].push(idx); dayBudgets[d] += sc; }
      }
      placed = true;
    }
    if (!placed) { const d = ranked()[0]; dayGroups[d].push(...idxs); dayBudgets[d] += cost; }
  }

  return dayGroups.filter(g => g.length > 0);
}

function packClustersInDays(orderedClusters, cSummary, durations, timeMatrix, netCap) {
  const dayGroups = [], dayBudgets = [];

  for (const cid of orderedClusters) {
    const idxs = cSummary[cid].attraction_indices;
    const cost = clusterTimeBudget(idxs, durations, timeMatrix);
    let placed = false;

    for (let d = 0; d < dayGroups.length; d++) {
      if (dayBudgets[d] + cost <= netCap) {
        dayGroups[d].push(...idxs); dayBudgets[d] += cost; placed = true; break;
      }
    }
    if (!placed) {
      if (cost > netCap && idxs.length > 1) {
        for (const idx of idxs) {
          const sc = clusterTimeBudget([idx], durations, timeMatrix);
          let sp = false;
          for (let d = 0; d < dayGroups.length; d++) {
            if (dayBudgets[d] + sc <= netCap) {
              dayGroups[d].push(idx); dayBudgets[d] += sc; sp = true; break;
            }
          }
          if (!sp) { dayGroups.push([idx]); dayBudgets.push(sc); }
        }
      } else {
        dayGroups.push([...idxs]); dayBudgets.push(cost);
      }
    }
  }
  return dayGroups;
}

function balanceDays(dayGroups, durations) {
  if (dayGroups.length <= 1) return dayGroups;
  let improved = true, iters = 0;
  while (improved && iters < 20) {
    improved = false; iters++;
    const loads    = dayGroups.map(day => day.reduce((s, i) => s + durations[i], 0));
    const heaviest = loads.indexOf(Math.max(...loads));
    const lightest = loads.indexOf(Math.min(...loads));
    if (heaviest === lightest) break;
    const gap = loads[heaviest] - loads[lightest];
    let bestSwap = null, bestImprovement = 0;
    for (const ai of dayGroups[heaviest]) {
      for (const aj of dayGroups[lightest]) {
        const diff        = durations[ai] - durations[aj];
        const improvement = gap - Math.abs(gap - 2 * diff);
        if (improvement > bestImprovement) { bestImprovement = improvement; bestSwap = [ai, aj]; }
      }
    }
    if (bestSwap) {
      const [ai, aj] = bestSwap;
      const hi = dayGroups[heaviest].indexOf(ai), lj = dayGroups[lightest].indexOf(aj);
      dayGroups[heaviest][hi] = aj; dayGroups[lightest][lj] = ai;
      improved = true;
    }
  }
  return dayGroups;
}

function splitOverloadedDays(dayGroups, durations, timeMatrix, netCap) {
  const result = [];
  for (const day of dayGroups) {
    const cost = clusterTimeBudget(day, durations, timeMatrix);
    if (cost > netCap * 1.15 && day.length > 1) {
      const mid = Math.floor(day.length / 2);
      result.push(day.slice(0, mid), day.slice(mid));
    } else {
      result.push(day);
    }
  }
  return result;
}

function trimToTotalDays(dayGroups, durations, totalDays) {
  while (dayGroups.length > totalDays && dayGroups.length > 1) {
    const loads  = dayGroups.map(day => day.reduce((s, i) => s + durations[i], 0));
    const sorted = loads.map((l, i) => [l, i]).sort((a, b) => a[0] - b[0]);
    const s1 = sorted[0][1], s2 = sorted[1][1];
    if (s1 === s2) break;
    const merged = [...dayGroups[s1], ...dayGroups[s2]];
    dayGroups = dayGroups.filter((_, i) => i !== s1 && i !== s2);
    dayGroups.push(merged);
  }
  return dayGroups;
}

// ── Time-preference-aware 2-opt TSP ────────────────────────────────────────────

function getCatTimePref(category) {
  const cat = (category || '').toLowerCase();
  if (MORNING_PREFERRED_CATS.has(cat)) return 'morning';
  if (EVENING_OK_CATS.has(cat))        return 'evening';
  return 'any';
}

// Nearest-neighbour that biases morning-preferred attractions to the start
// of the route and evening-ok attractions toward the end.
function nearestNeighbourTimeAware(start, nodes, timeMatrix, attractions) {
  const unvisited = new Set(nodes);
  const route     = [start];
  let current = start;
  const total = nodes.length;

  while (unvisited.size > 0) {
    const progress = (total - unvisited.size) / Math.max(1, total); // 0 → 1
    let nearest = -1, minScore = Infinity;

    for (const j of unvisited) {
      const travelDist = timeMatrix[current][j];
      const attrIdx    = j - 1; // extended index → 0-based attraction index
      const pref       = (attrIdx >= 0 && attrIdx < attractions.length)
        ? getCatTimePref(attractions[attrIdx].category)
        : 'any';

      // Soft penalty: discourage mismatched time-slot placement
      let timeBias = 0;
      if (progress < 0.35 && pref === 'evening')  timeBias = 18;
      if (progress > 0.65 && pref === 'morning')  timeBias = 18;
      if (progress < 0.30 && pref === 'morning')  timeBias = -8; // slight pull to front

      const score = travelDist + timeBias;
      if (score < minScore) { minScore = score; nearest = j; }
    }

    route.push(nearest);
    unvisited.delete(nearest);
    current = nearest;
  }
  return route;
}

function tourCost(route, timeMatrix) {
  let cost = 0;
  for (let i = 0; i < route.length - 1; i++) cost += timeMatrix[route[i]][route[i + 1]];
  return cost;
}

function twoOpt(route, timeMatrix, maxIter = 200, returnIdx = -1) {
  // When returnIdx >= 0, include the return leg to hotel in the tour cost
  const costFn = returnIdx >= 0
    ? r => tourCost(r, timeMatrix) + (r.length > 0 ? timeMatrix[r[r.length - 1]][returnIdx] : 0)
    : r => tourCost(r, timeMatrix);

  let best = [...route], bestCost = costFn(best);
  let improved = true, iters = 0;
  while (improved && iters < maxIter) {
    improved = false; iters++;
    for (let i = 1; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const newRoute = [
          ...best.slice(0, i),
          ...best.slice(i, k + 1).reverse(),
          ...best.slice(k + 1),
        ];
        const newCost = costFn(newRoute);
        if (newCost < bestCost) { best = newRoute; bestCost = newCost; improved = true; break; }
      }
      if (improved) break;
    }
  }
  return best;
}

function optimiseDayRoute(hotelIdx, dayAttrIndices, timeMatrix, attractions) {
  if (!dayAttrIndices.length) return { route: [], travelTime: 0, returnTime: 0 };
  if (dayAttrIndices.length === 1) {
    const returnTime = timeMatrix[dayAttrIndices[0]][hotelIdx];
    return {
      route: [hotelIdx, ...dayAttrIndices],
      travelTime: timeMatrix[hotelIdx][dayAttrIndices[0]],
      returnTime,
    };
  }
  const initial   = nearestNeighbourTimeAware(hotelIdx, dayAttrIndices, timeMatrix, attractions);
  // Circular 2-opt: include return-to-hotel leg in route cost optimisation
  const optimised  = twoOpt(initial, timeMatrix, 200, hotelIdx);
  const returnTime = timeMatrix[optimised[optimised.length - 1]][hotelIdx];
  return { route: optimised, travelTime: tourCost(optimised, timeMatrix), returnTime };
}

// ── Daily scheduler (hard + soft constraints) ───────────────────────────────

function parseHHMM(s) {
  if (!s) return 0;
  const [h, m] = s.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fmtHHMM(mins) {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const PREF_WINDOWS = {
  morning:   [7 * 60,  12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening:   [17 * 60, 22 * 60],
  any:       [7 * 60,  22 * 60],
};
const LUNCH_START = 12 * 60 + 30;

function scheduleDay(attractions, travelTimes, travelModes, walkTimes, startTime, lunchBreakMinutes) {
  const planned = [], deferred = [], warnings = [];
  let currentTime        = parseHHMM(startTime);
  const dayStart         = currentTime;
  let lunchInserted      = false;
  let totalTransit       = 0;
  let continuousBlockMin = 0; // activity minutes since last meaningful transit break
  const RECOVERY_WARN_MIN = 4 * 60; // warn if no break in 4 h

  for (let i = 0; i < attractions.length; i++) {
    const attr      = attractions[i];
    const travelMin = i < travelTimes.length ? travelTimes[i] : 0;
    const mode      = i < travelModes.length ? travelModes[i] : 'walking';
    const walkMin   = i < walkTimes.length   ? walkTimes[i]   : 0;

    totalTransit += travelMin;

    // ── Hard: daily transit cap ──────────────────────────────────────────
    if (i > 0 && totalTransit > MAX_TRANSIT_PER_DAY_MIN) {
      warnings.push(
        `Daily transit limit (${MAX_TRANSIT_PER_DAY_MIN} min) reached. ` +
        `'${attr.title}' and remaining attractions deferred.`
      );
      for (let k = i; k < attractions.length; k++) deferred.push(attractions[k]);
      break;
    }

    let arrival = currentTime + travelMin;

    // Lunch break injection
    if (!lunchInserted && arrival >= LUNCH_START && lunchBreakMinutes > 0) {
      currentTime = arrival + lunchBreakMinutes;
      arrival     = currentTime;
      lunchInserted = true;
    }

    // ── Hard: 12-hour day span ──────────────────────────────────────────
    if (arrival - dayStart > MAX_DAY_SPAN_MIN) {
      warnings.push(
        `12-hour day limit reached. '${attr.title}' and remaining attractions deferred.`
      );
      for (let k = i; k < attractions.length; k++) deferred.push(attractions[k]);
      break;
    }

    // ── Hard: fixed reservation time ────────────────────────────────────
    if (attr.fixed_time) {
      const fixedDt = parseHHMM(attr.fixed_time);
      if (arrival > fixedDt + 30) {
        warnings.push(
          `'${attr.title}' fixed at ${attr.fixed_time} but arrival ${fmtHHMM(arrival)} is too late; deferring.`
        );
        deferred.push(attr);
        continue;
      }
      if (arrival < fixedDt) arrival = fixedDt;
    }

    // ── Hard: opening hours + last entry ───────────────────────────────
    let opens = 0, closes = 23 * 60 + 59, lastEntry = closes;
    if (attr.opening_hours) {
      opens     = parseHHMM(attr.opening_hours.open   || '00:00');
      closes    = parseHHMM(attr.opening_hours.close  || '23:59');
      // last_entry: explicit field, else closes minus 25% of visit duration (min 15 min)
      lastEntry = attr.opening_hours.last_entry
        ? parseHHMM(attr.opening_hours.last_entry)
        : closes - Math.max(15, Math.round(attr.duration_minutes * 0.25));
    }

    if (arrival < opens) {
      const wait = opens - arrival;
      if (wait > 45)
        warnings.push(`Waiting ${wait} min for '${attr.title}' to open at ${fmtHHMM(opens)}.`);
      arrival = opens;
    }

    // Hard: last entry
    if (arrival > lastEntry) {
      warnings.push(
        `'${attr.title}' last entry ${fmtHHMM(lastEntry)}, estimated arrival ${fmtHHMM(arrival)}; deferring.`
      );
      deferred.push(attr);
      continue;
    }

    // ── Hard: night restriction ──────────────────────────────────────────
    const cat = (attr.category || '').toLowerCase();
    if (arrival >= NIGHT_CUTOFF_HOUR * 60 && NIGHT_RESTRICTED_CATS.has(cat)) {
      warnings.push(
        `'${attr.title}' (${cat}) cannot be scheduled after ${NIGHT_CUTOFF_HOUR}:00; deferring.`
      );
      deferred.push(attr);
      continue;
    }

    // ── Soft: sunset warning for outdoor/remote categories ────────────────
    if (arrival >= SUNSET_HOUR * 60 && NIGHT_RESTRICTED_CATS.has(cat)) {
      warnings.push(
        `'${attr.title}' (outdoor) scheduled near/after sunset at ${fmtHHMM(arrival)}.`
      );
    }

    // ── Hard: attraction closes before arrival ────────────────────────────
    const visitEnd = arrival + attr.duration_minutes;
    if (visitEnd > closes) {
      if (arrival >= closes) {
        warnings.push(
          `'${attr.title}' is closed at estimated arrival ${fmtHHMM(arrival)}; deferring.`
        );
        deferred.push(attr);
        continue;
      }
      const available = closes - arrival;
      if (available < attr.duration_minutes * 0.5) {
        warnings.push(
          `Only ${available} min available for '${attr.title}' ` +
          `(needs ${attr.duration_minutes} min); deferring.`
        );
        deferred.push(attr);
        continue;
      }
      warnings.push(
        `'${attr.title}' visit truncated to ${available} min (closes ${fmtHHMM(closes)}).`
      );
    }

    // ── Soft: preferred time-of-day ─────────────────────────────────────
    if (attr.preferred_time_of_day && attr.preferred_time_of_day !== 'any') {
      const [ws, we] = PREF_WINDOWS[attr.preferred_time_of_day] || PREF_WINDOWS.any;
      if (!(ws <= arrival && arrival <= we)) {
        warnings.push(
          `'${attr.title}' prefers ${attr.preferred_time_of_day} but scheduled at ${fmtHHMM(arrival)}.`
        );
      }
    }

    // ── Soft: morning preference for demanding sites ──────────────────────
    if (MORNING_PREFERRED_CATS.has(cat) && arrival > 14 * 60) {
      warnings.push(`'${attr.title}' (${cat}) is best visited in the morning.`);
    }

    const nextTravel = (i + 1) < travelTimes.length ? travelTimes[i + 1] : 0;
    const nextWalk   = (i + 1) < walkTimes.length   ? walkTimes[i + 1]   : 0;
    const nextMode   = (i + 1) < travelModes.length ? travelModes[i + 1] : 'walking';

    // ── Soft: heavy-transfer warning ─────────────────────────────────────
    if (nextTravel > HEAVY_TRANSFER_MIN) {
      warnings.push(
        `Long transfer after '${attr.title}' (${nextTravel} min by ${nextMode}).`
      );
    }

    const effectiveEnd = Math.min(visitEnd, closes);
    planned.push({
      attraction:             attr,
      arrival_time:           fmtHHMM(arrival),
      departure_time:         fmtHHMM(effectiveEnd),
      travel_to_next_minutes: nextTravel,
      travel_to_next_mode:    nextMode,
      walk_to_next_minutes:   nextWalk,
      cluster_id:             0,
    });

    currentTime = effectiveEnd;

    // Track continuous activity; significant transit resets the block clock
    continuousBlockMin += attr.duration_minutes;
    if (nextTravel >= 15) continuousBlockMin = 0;
    if (continuousBlockMin >= RECOVERY_WARN_MIN) {
      warnings.push(
        `No significant break for ${Math.round(continuousBlockMin / 60)} h — consider a rest or snack stop.`
      );
      continuousBlockMin = 0; // suppress repeated warning
    }
  }

  const daySpanMin = currentTime - dayStart;
  return { planned, deferred, warnings, totalTransitMin: totalTransit, daySpanMin };
}

// ── Scoring (8 dimensions) ────────────────────────────────────────────────

function applyWeights(weights, preferences, style, pacingMode) {
  const w = { ...weights };

  if (preferences.includes('minimize_walking'))   { w.fatigue += 0.08; w.distance -= 0.04; w.balance -= 0.04; }
  if (preferences.includes('minimize_transport')) { w.distance += 0.08; w.cluster += 0.04; w.balance -= 0.06; w.preference -= 0.06; }
  if (preferences.includes('balanced_days'))      { w.balance += 0.08; w.distance -= 0.04; w.fatigue -= 0.04; }
  if (preferences.includes('compact_itinerary'))  { w.cluster += 0.08; w.distance += 0.04; w.balance -= 0.08; w.preference -= 0.04; }

  if (style === 'relaxed')   { w.fatigue += 0.04; w.flow += 0.02; w.sustainability += 0.02; w.priority -= 0.04; w.cluster -= 0.04; }
  if (style === 'intensive') { w.priority += 0.04; w.cluster += 0.02; w.fatigue -= 0.03; w.flow -= 0.02; w.sustainability -= 0.01; }

  if (pacingMode === 'compact')   { w.cluster += 0.06; w.distance += 0.04; w.balance -= 0.04; w.preference -= 0.03; w.flow -= 0.03; }
  if (pacingMode === 'balanced')  { w.balance += 0.07; w.flow += 0.04; w.cluster -= 0.03; w.distance -= 0.04; w.fatigue -= 0.04; }
  if (pacingMode === 'relaxed')   { w.fatigue += 0.07; w.flow += 0.05; w.sustainability += 0.05; w.exhaustion += 0.03; w.priority -= 0.07; w.distance -= 0.07; w.cluster -= 0.06; }
  if (pacingMode === 'intensive') { w.priority += 0.08; w.cluster += 0.04; w.fatigue -= 0.06; w.flow -= 0.04; w.sustainability -= 0.02; }

  const total = Object.values(w).reduce((s, v) => s + v, 0);
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.max(0, v / total)]));
}

function scoreItinerary(days, allPriorities, plannedPriorities, settings, clusterLabels) {
  const weights    = applyWeights(
    BASE_WEIGHTS, settings.preferences || [], settings.travel_style, settings.pacing_mode
  );
  const activeDays = days.filter(d => d.attractions.length > 0);
  if (!activeDays.length) {
    return {
      overall: 100, distance: 100, balance: 100, fatigue: 100, cluster: 100,
      preference: 100, priority: 100, exhaustion: 100, timing: 100,
      flow: 100, sustainability: 100,
    };
  }

  const avgDuration = activeDays.reduce((s, d) => s + d.total_duration_minutes, 0) / activeDays.length;
  const walkTol     = settings.walking_tolerance_minutes || 30;

  // ── Distance / transit efficiency ───────────────────────────────────
  const distScores = activeDays.map(d => {
    const total       = d.total_duration_minutes + d.total_travel_minutes;
    const travelRatio = d.total_travel_minutes / Math.max(1, total);
    const heavyCount  = d.attractions.filter(pa => pa.travel_to_next_minutes > HEAVY_TRANSFER_MIN).length;
    return Math.max(0, 100 - travelRatio * 150 - heavyCount * 15);
  });
  const distScore = distScores.reduce((s, v) => s + v, 0) / distScores.length;

  // ── Day balance ───────────────────────────────────────────────────
  const dayLoads = activeDays.map(d => d.total_duration_minutes);
  const meanLoad = dayLoads.reduce((s, v) => s + v, 0) / dayLoads.length;
  const stdLoad  = Math.sqrt(dayLoads.reduce((s, v) => s + (v - meanLoad) ** 2, 0) / dayLoads.length);
  const balScore = Math.max(0, 100 - (stdLoad / Math.max(1, meanLoad)) * 100);

  // ── Fatigue (walking + energy profiling) ──────────────────────────────────
  // Penalises excessive cumulative load. Thresholds in profile_level×hours units:
  //   physical  28 = ~3h of hiking-level activity    (9 × 3h = 27)
  //   cognitive 28 = ~4h of museum-level activity    (7 × 4h = 28) ← KHM+NHM stays penalty-free
  //   emotional 27 = ~3h of memorial-level exposure  (9 × 3h = 27)
  // Walk penalty fires only for excess walking beyond the user's stated tolerance.
  // Same-category groupings (e.g. KHM + NHM) are NOT penalised on their own — only
  // total accumulated load matters. A 5-museum day does get penalised (correctly).
  const fatScores = activeDays.map(d => {
    const walkExcess  = Math.max(0, d.total_walking_minutes - walkTol);
    const walkPenalty = Math.min(25, walkExcess / 15 * 10);
    const energy      = computeDayEnergy(d.attractions);
    const physicalPenalty  = Math.max(0, (energy.physical  - 28) * 1.0);
    const cognitivePenalty = Math.max(0, (energy.cognitive - 28) * 1.0);
    const emotionalPenalty = Math.max(0, (energy.emotional - 27) * 1.2);
    return Math.max(0, 100 - walkPenalty - physicalPenalty - cognitivePenalty - emotionalPenalty
      - (d.attractions.length / 10) * 12);
  });
  const fatScore = fatScores.reduce((s, v) => s + v, 0) / fatScores.length;

  // ── Cluster coherence + region-switch penalty ─────────────────────────
  const clusterScores = activeDays.map(d => {
    if (d.attractions.length < 2) return 100;
    const cids = d.attractions.map(pa => pa.cluster_id);
    const same = cids.slice(1).reduce((s, c, i) => s + (c === cids[i] ? 1 : 0), 0);
    const coherence = 100 * same / (cids.length - 1);

    // Penalise large intra-day jumps (region switches / zig-zag)
    let switchPenalty = 0;
    for (const pa of d.attractions) {
      if (pa.travel_to_next_minutes > HEAVY_TRANSFER_MIN) switchPenalty += 20;
      else if (pa.travel_to_next_minutes > 45)             switchPenalty += 8;
    }
    return Math.max(0, coherence - switchPenalty);
  });
  const clusterScore = clusterScores.reduce((s, v) => s + v, 0) / clusterScores.length;

  // ── Preference satisfaction ───────────────────────────────────────────
  let prefScore = 80;
  if ((settings.preferences || []).includes('free_time')) {
    if (avgDuration < (settings.max_hours_per_day || 8) * 60 * 0.8) prefScore += 20;
  }
  if ((settings.preferences || []).includes('balanced_days')) {
    const cv = stdLoad / Math.max(1, meanLoad);
    prefScore += Math.max(0, 20 - cv * 40);
  }
  prefScore = Math.min(100, prefScore);

  // ── Priority coverage ───────────────────────────────────────────────
  let priorityScore = 100;
  if (allPriorities.length > 0) {
    const sortedAll = [...allPriorities].sort((a, b) => b - a);
    const topN      = Math.max(1, Math.floor(sortedAll.length / 2));
    const topSet    = new Set(sortedAll.slice(0, topN));
    const covered   = plannedPriorities.filter(p => topSet.has(p)).length;
    priorityScore   = Math.min(100, (covered / topSet.size) * 100);
  }

  // ── Exhaustion (day span + transit + density + late-day intensity + meal break) ──
  const exhaustScores = activeDays.map(d => {
    const span             = d.day_span_minutes || (d.total_duration_minutes + d.total_travel_minutes);
    const spanPenalty      = Math.max(0, (span - 10 * 60) / 60) * 10;
    const transitRatio     = d.total_travel_minutes / Math.max(1, span);
    const transitPenalty   = transitRatio > 0.4 ? (transitRatio - 0.4) * 80 : 0;
    const densityPenalty   = Math.max(0, d.attractions.length - 8) * 5;
    const anchorOvercrowding = (d.is_anchor_day && d.attractions.length > ANCHOR_MAX_SUPPS + 1)
      ? (d.attractions.length - (ANCHOR_MAX_SUPPS + 1)) * 15 : 0;

    // Penalise high-intensity activities scheduled late in the day (after 17:00)
    let lateIntensityPenalty = 0;
    for (const pa of d.attractions) {
      if (parseHHMM(pa.arrival_time) > 17 * 60) {
        const ep        = getEnergyProfile(pa.attraction);
        const intensity = (ep.physical + ep.cognitive + ep.stimulation) / 3;
        if      (intensity >= 7) lateIntensityPenalty += 12;
        else if (intensity >= 5) lateIntensityPenalty += 5;
      }
    }

    // Penalise missing meal break in the 11:30–15:00 window for full days
    const mealWindowStart = 11 * 60 + 30;
    const mealWindowEnd   = 15 * 60;
    let mealBreakPresent  = false;
    for (let i = 0; i < d.attractions.length - 1; i++) {
      const dep = parseHHMM(d.attractions[i].departure_time);
      if (dep >= mealWindowStart && dep <= mealWindowEnd && d.attractions[i].travel_to_next_minutes >= 20) {
        mealBreakPresent = true; break;
      }
    }
    const mealPenalty = (d.attractions.length >= 4 && !mealBreakPresent) ? 10 : 0;

    // Penalise continuous activity blocks > 4 h without a 15-min transit break
    let maxBlock = 0, curBlock = 0;
    for (const pa of d.attractions) {
      curBlock += pa.attraction.duration_minutes;
      if (pa.travel_to_next_minutes >= 15) { maxBlock = Math.max(maxBlock, curBlock); curBlock = 0; }
    }
    maxBlock = Math.max(maxBlock, curBlock);
    const continuousPenalty = Math.max(0, (maxBlock - 4 * 60) / 60) * 8;

    return Math.max(0, 100 - spanPenalty - transitPenalty - densityPenalty - anchorOvercrowding
      - lateIntensityPenalty - mealPenalty - continuousPenalty);
  });
  const exhaustScore = exhaustScores.reduce((s, v) => s + v, 0) / exhaustScores.length;

  // ── Timing (morning/evening placement, night violations, late hotel return) ──
  const timingScores = activeDays.map(d => {
    let penalty = 0;
    for (const pa of d.attractions) {
      const cat     = (pa.attraction.category || '').toLowerCase();
      const arrival = parseHHMM(pa.arrival_time);

      if (NIGHT_RESTRICTED_CATS.has(cat) && arrival >= NIGHT_CUTOFF_HOUR * 60) penalty += 40;
      else if (NIGHT_RESTRICTED_CATS.has(cat) && arrival >= SUNSET_HOUR * 60)   penalty += 12;

      if (MORNING_PREFERRED_CATS.has(cat) && arrival > 15 * 60) penalty += 12;
      if (EVENING_OK_CATS.has(cat) && arrival < 9 * 60) penalty += 5;
    }

    // Late hotel return: last departure + return transit exceeds LATE_RETURN_HOUR
    const lastAttr = d.attractions[d.attractions.length - 1];
    const returnMin = d.return_transit_minutes || 0;
    if (lastAttr && returnMin > 0) {
      const hotelArrival = parseHHMM(lastAttr.departure_time) + returnMin;
      if (hotelArrival > LATE_RETURN_HOUR * 60 && returnMin > LATE_RETURN_FAR) penalty += 25;
      else if (hotelArrival > LATE_RETURN_HOUR * 60)                            penalty += 10;
    }

    return Math.max(0, 100 - penalty);
  });
  const timingScore = timingScores.reduce((s, v) => s + v, 0) / timingScores.length;

  // ── Flow (transition coherence between consecutive attractions) ────────────
  // Scores how naturally each pair of back-to-back attractions follows the other.
  // Uses energy profiles: penalises jarring emotional exits, cognitive/physical stacks.
  // Same-category adjacency is NOT penalised — only energy load context matters.
  const flowScores = activeDays.map(d => {
    if (d.attractions.length < 2) return 95;
    let totalPenalty = 0;
    for (let i = 0; i < d.attractions.length - 1; i++) {
      totalPenalty += transitionPenalty(
        d.attractions[i].attraction,
        d.attractions[i + 1].attraction,
        d.attractions[i].travel_to_next_minutes,
      );
    }
    const avgPenalty = totalPenalty / (d.attractions.length - 1);
    return Math.max(0, 100 - avgPenalty * 3.0);
  });
  const flowScore = flowScores.reduce((s, v) => s + v, 0) / flowScores.length;

  // ── Sustainability (cross-day fatigue propagation) ─────────────────────────
  // Consecutive heavy days should be avoided for a balanced multi-day trip.
  // Denominators calibrated to "very heavy day" benchmarks:
  //   physical  60 = all-day hiking (9 × 7h)
  //   cognitive 42 = all-day museum marathon (7 × 6h)
  //   emotional 24 = extended memorial / cemetery experience (9 × 3h)
  const dayFatigueLoads = activeDays.map(d => {
    const energy = computeDayEnergy(d.attractions);
    const physLoad = Math.min(100, (energy.physical  / 60) * 100);
    const cogLoad  = Math.min(100, (energy.cognitive / 42) * 100);
    const emoLoad  = Math.min(100, (energy.emotional / 24) * 100);
    return (physLoad + cogLoad + emoLoad) / 3;
  });
  let sustainPenalty = 0;
  for (let i = 0; i < dayFatigueLoads.length - 1; i++) {
    const a = dayFatigueLoads[i], b = dayFatigueLoads[i + 1];
    if      (a > 75 && b > 75) sustainPenalty += 25;
    else if (a > 60 && b > 60) sustainPenalty += 12;
    else if (a > 50 && b > 50) sustainPenalty +=  5;
  }
  const sustainabilityScore = Math.max(0,
    100 - sustainPenalty / Math.max(1, dayFatigueLoads.length - 1));

  // ── Assemble breakdown ────────────────────────────────────────────────
  const breakdown = {
    distance:       Math.round(distScore         * 10) / 10,
    balance:        Math.round(balScore          * 10) / 10,
    fatigue:        Math.round(fatScore          * 10) / 10,
    cluster:        Math.round(clusterScore      * 10) / 10,
    preference:     Math.round(prefScore         * 10) / 10,
    priority:       Math.round(priorityScore     * 10) / 10,
    exhaustion:     Math.round(exhaustScore      * 10) / 10,
    timing:         Math.round(timingScore       * 10) / 10,
    flow:           Math.round(flowScore         * 10) / 10,
    sustainability: Math.round(sustainabilityScore * 10) / 10,
  };
  breakdown.overall = Math.round(
    Object.entries(breakdown).reduce((s, [k, v]) => s + (weights[k] || 0) * v, 0) * 10
  ) / 10;

  return breakdown;
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

function runOptimizer(attractions, settings) {
  const {
    total_days, max_hours_per_day = 8, hotel, transport_mode = 'public_transport',
    walking_tolerance_minutes = 30, travel_style = 'balanced', pacing_mode = 'balanced',
    preferences = [], start_time = '09:00', lunch_break_minutes = 60,
  } = settings;

  const pacingDescriptions = {
    compact:   'Fewest active days, free days at end',
    balanced:  'Evenly spread across all days',
    relaxed:   'Light days, lots of free time',
    intensive: 'Maximum sights per day',
  };

  const warnings = [
    `Pacing: ${pacing_mode.charAt(0).toUpperCase() + pacing_mode.slice(1)} — ${pacingDescriptions[pacing_mode] || ''}`,
  ];

  // Step 1: Distance matrix including transfer buffers
  const hotelCoord = [hotel.latitude, hotel.longitude];
  const attrCoords = attractions.map(a => [a.latitude, a.longitude]);
  const allCoords  = [hotelCoord, ...attrCoords];

  const { time: timeMatrix, modes: modeMatrix, walk: walkMatrix } =
    buildDistanceMatrix(allCoords, transport_mode);

  // Step 2: DBSCAN geographic clustering
  const epsilonKm     = travel_style === 'intensive' ? 0.8
                      : travel_style === 'relaxed'   ? 1.8
                      : 1.2;
  const clusterLabels = attrCoords.length === 0 ? [] : dbscan(attrCoords, epsilonKm);

  const priorities = attractions.map(a => a.priority_score ?? 5.0);
  const durations  = attractions.map(a => a.duration_minutes ?? 60);
  const cSummary   = clusterSummary(clusterLabels, attrCoords, priorities, durations);

  // Detect anchor attractions before day allocation
  const anchorSet = detectAnchors(attractions, timeMatrix);
  if (anchorSet.size) {
    warnings.push(
      `${anchorSet.size} anchor attraction(s) detected — each scheduled as a dedicated day with limited supplements.`
    );
  }

  // Step 3: Assign clusters to days + anchor enforcement + local-search improvement
  const { dayGroups, freeDays } = allocateDays(
    clusterLabels, cSummary, durations, timeMatrix,
    total_days, max_hours_per_day, travel_style, preferences, pacing_mode,
    attractions, anchorSet
  );

  const cluster_map = {};
  for (let i = 0; i < clusterLabels.length; i++) {
    cluster_map[attractions[i].id] = clusterLabels[i];
  }

  // Step 4–5: Time-preference-aware route + constraint scheduling
  const plannedPriorities = [];
  const days = dayGroups.map((group, di) => {
    const { route, returnTime } = optimiseDayRoute(0, group.map(i => i + 1), timeMatrix, attractions);

    const orderedAttrIndices = route.slice(1).map(extIdx => extIdx - 1);
    const orderedAttractions = orderedAttrIndices.map(i => attractions[i]);

    const travelTimes = [], travelModes = [], walkTimes = [];
    let prevExtIdx = 0;
    for (const attrIdx of orderedAttrIndices) {
      const extIdx = attrIdx + 1;
      travelTimes.push(timeMatrix[prevExtIdx][extIdx]);
      travelModes.push(modeMatrix[prevExtIdx][extIdx]);
      walkTimes.push(walkMatrix[prevExtIdx][extIdx]);
      prevExtIdx = extIdx;
    }

    const { planned, deferred, warnings: dayWarnings, totalTransitMin, daySpanMin } = scheduleDay(
      orderedAttractions, travelTimes, travelModes, walkTimes, start_time, lunch_break_minutes
    );

    warnings.push(...dayWarnings);

    for (let k = 0; k < planned.length; k++) {
      const origIdx = orderedAttrIndices[k];
      planned[k].cluster_id = clusterLabels[origIdx] ?? 0;
      planned[k].is_anchor  = anchorSet.has(origIdx);
      plannedPriorities.push(priorities[origIdx]);
    }

    const totalDurationMin = planned.reduce((s, pa) => s + pa.attraction.duration_minutes, 0);
    const totalTravelMin   = planned.reduce((s, pa) => s + pa.travel_to_next_minutes, 0);
    const totalWalkMin     = planned.reduce((s, pa) => s + pa.walk_to_next_minutes, 0);
    const totalCost        = planned.reduce((s, pa) => s + (pa.attraction.cost || 0), 0);
    const clusterIds       = [...new Set(planned.map(pa => pa.cluster_id))];

    const isAnchorDay = group.some(i => anchorSet.has(i));

    return {
      day_number:             di + 1,
      date_label:             `Day ${di + 1}`,
      attractions:            planned,
      total_duration_minutes: totalDurationMin,
      total_travel_minutes:   totalTravelMin,
      total_walking_minutes:  totalWalkMin,
      total_cost:             totalCost,
      optimization_score:     0,
      cluster_ids:            clusterIds,
      day_span_minutes:       daySpanMin || (totalDurationMin + totalTravelMin),
      return_transit_minutes: returnTime || 0,
      is_anchor_day:          isAnchorDay,
      notes:                  [],
    };
  });

  // Step 6: Multi-objective scoring (8 dimensions)
  const scoringBreakdown = scoreItinerary(
    days, priorities, plannedPriorities,
    { ...settings, walking_tolerance_minutes }, clusterLabels
  );

  const totalPlanned = days.reduce((s, d) => s + d.attractions.length, 0);
  const overallScore = scoringBreakdown.overall;
  for (const day of days) day.optimization_score = overallScore;

  return {
    days,
    free_days:         freeDays,
    total_attractions: totalPlanned,
    total_days_used:   days.length,
    overall_score:     overallScore,
    scoring_breakdown: scoringBreakdown,
    cluster_map,
    warnings,
  };
}

// ── Netlify Function handler ──────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ detail: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { attractions, settings } = body;

    if (!attractions || attractions.length === 0)
      return { statusCode: 422, headers: CORS_HEADERS, body: JSON.stringify({ detail: 'At least one attraction is required.' }) };
    if (attractions.length > 100)
      return { statusCode: 422, headers: CORS_HEADERS, body: JSON.stringify({ detail: 'Maximum 100 attractions per request.' }) };
    if (!settings || !settings.hotel)
      return { statusCode: 422, headers: CORS_HEADERS, body: JSON.stringify({ detail: 'settings.hotel is required.' }) };
    if (!settings.total_days || settings.total_days < 1)
      return { statusCode: 422, headers: CORS_HEADERS, body: JSON.stringify({ detail: 'settings.total_days must be >= 1.' }) };

    const result = runOptimizer(attractions, settings);
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) };

  } catch (err) {
    console.error('Optimizer error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ detail: err.message || 'Internal server error' }) };
  }
};
