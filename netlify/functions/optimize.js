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
  distance: 0.18, balance: 0.18, fatigue: 0.13,
  cluster:  0.13, preference: 0.08, priority: 0.08,
  exhaustion: 0.12, timing: 0.10,
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
                      totalDays, maxHours, travelStyle, preferences, pacingMode) {
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

  // Local search: iteratively move single attractions between days to improve
  // geographic coherence and balance
  dayGroups = localSearchDayImprove(dayGroups, durations, timeMatrix, netCap);

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

function localSearchDayImprove(dayGroups, durations, timeMatrix, netCap, maxIter = 400) {
  if (dayGroups.length <= 1) return dayGroups;
  let bestScore = evalDayGroupQuality(dayGroups, durations, timeMatrix);

  for (let iter = 0; iter < maxIter; iter++) {
    const d1 = Math.floor(Math.random() * dayGroups.length);
    if (!dayGroups[d1] || !dayGroups[d1].length) continue;

    const ai   = Math.floor(Math.random() * dayGroups[d1].length);
    const attr = dayGroups[d1][ai];

    for (let d2 = 0; d2 < dayGroups.length; d2++) {
      if (d2 === d1) continue;

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

function twoOpt(route, timeMatrix, maxIter = 200) {
  let best = [...route], bestCost = tourCost(best, timeMatrix);
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
        const newCost = tourCost(newRoute, timeMatrix);
        if (newCost < bestCost) { best = newRoute; bestCost = newCost; improved = true; break; }
      }
      if (improved) break;
    }
  }
  return best;
}

function optimiseDayRoute(hotelIdx, dayAttrIndices, timeMatrix, attractions) {
  if (!dayAttrIndices.length) return { route: [], travelTime: 0 };
  if (dayAttrIndices.length === 1) {
    return {
      route: [hotelIdx, ...dayAttrIndices],
      travelTime: timeMatrix[hotelIdx][dayAttrIndices[0]],
    };
  }
  const initial   = nearestNeighbourTimeAware(hotelIdx, dayAttrIndices, timeMatrix, attractions);
  const optimised = twoOpt(initial, timeMatrix);
  return { route: optimised, travelTime: tourCost(optimised, timeMatrix) };
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
  let currentTime   = parseHHMM(startTime);
  const dayStart    = currentTime;
  let lunchInserted = false;
  let totalTransit  = 0;

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

  if (style === 'relaxed')   { w.fatigue += 0.05; w.priority -= 0.05; }
  if (style === 'intensive') { w.priority += 0.05; w.fatigue -= 0.05; }

  if (pacingMode === 'compact')   { w.cluster += 0.08; w.distance += 0.04; w.balance -= 0.08; w.preference -= 0.04; }
  if (pacingMode === 'balanced')  { w.balance += 0.10; w.cluster -= 0.04; w.distance -= 0.04; w.fatigue -= 0.02; }
  if (pacingMode === 'relaxed')   { w.fatigue += 0.10; w.exhaustion += 0.05; w.priority -= 0.08; w.distance -= 0.07; }
  if (pacingMode === 'intensive') { w.priority += 0.10; w.cluster += 0.04; w.fatigue -= 0.10; w.preference -= 0.04; }

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

  // ── Fatigue (walking) ───────────────────────────────────────────────
  const fatScores = activeDays.map(d => {
    const walkPenalty = Math.min(100, (d.total_walking_minutes / Math.max(1, walkTol)) * 100);
    return Math.max(0, 100 - walkPenalty * 0.6 - (d.attractions.length / 10.0) * 40);
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

  // ── Exhaustion (day span + transit load + density) ──────────────────────
  const exhaustScores = activeDays.map(d => {
    const span           = d.day_span_minutes || (d.total_duration_minutes + d.total_travel_minutes);
    // Penalise days exceeding 10h span
    const spanPenalty    = Math.max(0, (span - 10 * 60) / 60) * 10;
    // Penalise high transit ratio (> 40%)
    const transitRatio   = d.total_travel_minutes / Math.max(1, span);
    const transitPenalty = transitRatio > 0.4 ? (transitRatio - 0.4) * 80 : 0;
    // Penalise cramming > 8 stops
    const densityPenalty = Math.max(0, d.attractions.length - 8) * 5;
    return Math.max(0, 100 - spanPenalty - transitPenalty - densityPenalty);
  });
  const exhaustScore = exhaustScores.reduce((s, v) => s + v, 0) / exhaustScores.length;

  // ── Timing (morning/evening placement, night-restriction compliance) ───────
  const timingScores = activeDays.map(d => {
    let penalty = 0;
    for (const pa of d.attractions) {
      const cat     = (pa.attraction.category || '').toLowerCase();
      const arrival = parseHHMM(pa.arrival_time);

      // Hard violations that slipped through (should have been deferred) – score reflects it
      if (NIGHT_RESTRICTED_CATS.has(cat) && arrival >= NIGHT_CUTOFF_HOUR * 60) penalty += 40;
      else if (NIGHT_RESTRICTED_CATS.has(cat) && arrival >= SUNSET_HOUR * 60)   penalty += 12;

      // Demanding cultural sites placed in afternoon/evening
      if (MORNING_PREFERRED_CATS.has(cat) && arrival > 15 * 60) penalty += 12;
      // Evening-fine sites placed very early
      if (EVENING_OK_CATS.has(cat) && arrival < 9 * 60) penalty += 5;
    }
    return Math.max(0, 100 - penalty);
  });
  const timingScore = timingScores.reduce((s, v) => s + v, 0) / timingScores.length;

  // ── Assemble breakdown ────────────────────────────────────────────────
  const breakdown = {
    distance:   Math.round(distScore     * 10) / 10,
    balance:    Math.round(balScore      * 10) / 10,
    fatigue:    Math.round(fatScore      * 10) / 10,
    cluster:    Math.round(clusterScore  * 10) / 10,
    preference: Math.round(prefScore     * 10) / 10,
    priority:   Math.round(priorityScore * 10) / 10,
    exhaustion: Math.round(exhaustScore  * 10) / 10,
    timing:     Math.round(timingScore   * 10) / 10,
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

  // Step 3: Assign clusters to days + local-search improvement
  const { dayGroups, freeDays } = allocateDays(
    clusterLabels, cSummary, durations, timeMatrix,
    total_days, max_hours_per_day, travel_style, preferences, pacing_mode
  );

  const cluster_map = {};
  for (let i = 0; i < clusterLabels.length; i++) {
    cluster_map[attractions[i].id] = clusterLabels[i];
  }

  // Step 4–5: Time-preference-aware route + constraint scheduling
  const plannedPriorities = [];
  const days = dayGroups.map((group, di) => {
    const { route } = optimiseDayRoute(0, group.map(i => i + 1), timeMatrix, attractions);

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
      plannedPriorities.push(priorities[origIdx]);
    }

    const totalDurationMin = planned.reduce((s, pa) => s + pa.attraction.duration_minutes, 0);
    const totalTravelMin   = planned.reduce((s, pa) => s + pa.travel_to_next_minutes, 0);
    const totalWalkMin     = planned.reduce((s, pa) => s + pa.walk_to_next_minutes, 0);
    const totalCost        = planned.reduce((s, pa) => s + (pa.attraction.cost || 0), 0);
    const clusterIds       = [...new Set(planned.map(pa => pa.cluster_id))];

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
