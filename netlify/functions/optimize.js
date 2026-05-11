'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371.0;

const SPEEDS = { walking: 4.5, cycling: 14.0, public_transport: 22.0, taxi: 35.0 };
const OVERHEAD = { walking: 0.0, cycling: 2.0, public_transport: 8.0, taxi: 5.0 };
const WALKING_THRESHOLD_KM = 0.6;

const PACING_CAPACITY = { compact: 1.00, balanced: 1.00, relaxed: 0.65, intensive: 1.10 };
const STYLE_MULT = { relaxed: 0.75, balanced: 1.0, intensive: 1.25 };

const BASE_WEIGHTS = {
  distance: 0.25, balance: 0.20, fatigue: 0.20,
  cluster: 0.15, preference: 0.10, priority: 0.10,
};

// ── Math helpers ─────────────────────────────────────────────────────────────

function haversineKm(lat1, lon1, lat2, lon2) {
  const phi1 = lat1 * Math.PI / 180, phi2 = lat2 * Math.PI / 180;
  const dphi = (lat2 - lat1) * Math.PI / 180;
  const dlam = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

function travelMinutes(lat1, lon1, lat2, lon2, mode = 'public_transport') {
  const dist = haversineKm(lat1, lon1, lat2, lon2);
  const effectiveMode = dist <= WALKING_THRESHOLD_KM ? 'walking' : mode;
  const speed = SPEEDS[effectiveMode] || 22.0;
  const overhead = OVERHEAD[effectiveMode] || 5.0;
  return { minutes: Math.max(1, Math.round((dist / speed) * 60 + overhead)), mode: effectiveMode, dist };
}

function walkingMinutes(lat1, lon1, lat2, lon2) {
  const dist = haversineKm(lat1, lon1, lat2, lon2);
  return Math.max(1, Math.round((dist / SPEEDS.walking) * 60));
}

// ── Distance matrix ───────────────────────────────────────────────────────────

function buildDistanceMatrix(coords, mode) {
  const n = coords.length;
  const time = Array.from({ length: n }, () => new Array(n).fill(0));
  const dist = Array.from({ length: n }, () => new Array(n).fill(0));
  const modes = Array.from({ length: n }, () => new Array(n).fill(''));
  const walk = Array.from({ length: n }, () => new Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const r = travelMinutes(coords[i][0], coords[i][1], coords[j][0], coords[j][1], mode);
      time[i][j] = time[j][i] = r.minutes;
      dist[i][j] = dist[j][i] = r.dist;
      modes[i][j] = modes[j][i] = r.mode;
      walk[i][j] = walk[j][i] = walkingMinutes(coords[i][0], coords[i][1], coords[j][0], coords[j][1]);
    }
  }
  return { time, dist, modes, walk };
}

// ── DBSCAN clustering ─────────────────────────────────────────────────────────

function dbscan(coords, epsilonKm, minSamples = 1) {
  const n = coords.length;
  const UNVISITED = -2;
  const labels = new Array(n).fill(UNVISITED);
  let clusterId = 0;

  function neighbors(idx) {
    const res = [];
    for (let j = 0; j < n; j++) {
      if (haversineKm(coords[idx][0], coords[idx][1], coords[j][0], coords[j][1]) <= epsilonKm) res.push(j);
    }
    return res;
  }

  for (let i = 0; i < n; i++) {
    if (labels[i] !== UNVISITED) continue;
    const nbrs = neighbors(i);
    if (nbrs.length < minSamples) { labels[i] = -1; continue; }

    labels[i] = clusterId;
    const seeds = [...nbrs.filter(j => j !== i)];
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

  // Reassign noise to singleton clusters
  let nextId = clusterId;
  for (let i = 0; i < n; i++) if (labels[i] < 0) labels[i] = nextId++;
  return labels;
}

function clusterSummary(labels, coords, priorities, durations) {
  const summary = {};
  for (let i = 0; i < labels.length; i++) {
    const cid = labels[i];
    if (!summary[cid]) {
      summary[cid] = { cluster_id: cid, attraction_indices: [], size: 0,
        centroid_lat: 0, centroid_lon: 0, total_duration_minutes: 0, avg_priority: 0 };
    }
    const s = summary[cid];
    s.attraction_indices.push(i);
    s.total_duration_minutes += durations[i];
    s.size++;
  }
  for (const [, s] of Object.entries(summary)) {
    const idxs = s.attraction_indices;
    s.centroid_lat = idxs.reduce((acc, i) => acc + coords[i][0], 0) / idxs.length;
    s.centroid_lon = idxs.reduce((acc, i) => acc + coords[i][1], 0) / idxs.length;
    s.avg_priority = idxs.reduce((acc, i) => acc + priorities[i], 0) / idxs.length;
  }
  return summary;
}

// ── Day allocation ────────────────────────────────────────────────────────────

function clusterTimeBudget(attrIndices, durations, timeMatrix, overheadPct = 0.15) {
  if (!attrIndices.length) return 0;
  const totalVisit = attrIndices.reduce((s, i) => s + durations[i], 0);
  if (attrIndices.length === 1) return Math.round(totalVisit * (1 + overheadPct));

  const ext = attrIndices.map(i => i + 1);
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
  const maxMinutes = maxHours * 60;
  const styleMult = STYLE_MULT[travelStyle] || 1.0;
  const pacingMult = PACING_CAPACITY[pacingMode] || 1.0;
  const effectiveCap = maxMinutes * styleMult * pacingMult;
  const netCap = Math.max(60, effectiveCap - 60); // subtract lunch

  const orderedClusters = (() => {
    const keys = Object.keys(cSummary).map(Number);
    if (preferences.includes('group_nearby')) {
      return keys.sort((a, b) => cSummary[b].size - cSummary[a].size);
    }
    return keys.sort((a, b) => cSummary[b].avg_priority - cSummary[a].avg_priority);
  })();

  let dayGroups;

  if (pacingMode === 'balanced') {
    dayGroups = spreadAcrossDays(orderedClusters, cSummary, durations, timeMatrix,
                                  totalDays, netCap);
  } else {
    dayGroups = packClustersInDays(orderedClusters, cSummary, durations, timeMatrix, netCap);
    dayGroups = balanceDays(dayGroups, durations);
    dayGroups = splitOverloadedDays(dayGroups, durations, timeMatrix, netCap);
    dayGroups = trimToTotalDays(dayGroups, durations, totalDays);
  }

  dayGroups = splitOverloadedDays(dayGroups, durations, timeMatrix, netCap);
  if (dayGroups.length > totalDays) dayGroups = trimToTotalDays(dayGroups, durations, totalDays);

  const freeDays = [];
  for (let d = dayGroups.length + 1; d <= totalDays; d++) freeDays.push(d);
  return { dayGroups, freeDays };
}

function balancedTargetCap(durations, totalDays, netCap) {
  const totalVisit = durations.reduce((s, d) => s + d, 0);
  const perDay = (totalVisit * 1.3) / Math.max(1, totalDays);
  return Math.max(90, Math.min(netCap, Math.round(perDay)));
}

function spreadAcrossDays(orderedClusters, cSummary, durations, timeMatrix, totalDays, netCap) {
  const targetCap = balancedTargetCap(durations, totalDays, netCap);
  const dayGroups = Array.from({ length: totalDays }, () => []);
  const dayBudgets = new Array(totalDays).fill(0);

  const ranked = () => Array.from({ length: totalDays }, (_, i) => i)
                            .sort((a, b) => dayBudgets[a] - dayBudgets[b]);

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
            if (dayBudgets[d] + sc <= netCap) { dayGroups[d].push(idx); dayBudgets[d] += sc; sp = true; break; }
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
    const loads = dayGroups.map(day => day.reduce((s, i) => s + durations[i], 0));
    const heaviest = loads.indexOf(Math.max(...loads));
    const lightest = loads.indexOf(Math.min(...loads));
    if (heaviest === lightest) break;
    const gap = loads[heaviest] - loads[lightest];
    let bestSwap = null, bestImprovement = 0;
    for (const ai of dayGroups[heaviest]) {
      for (const aj of dayGroups[lightest]) {
        const diff = durations[ai] - durations[aj];
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
    const loads = dayGroups.map(day => day.reduce((s, i) => s + durations[i], 0));
    const sorted = loads.map((l, i) => [l, i]).sort((a, b) => a[0] - b[0]);
    const s1 = sorted[0][1], s2 = sorted[1][1];
    if (s1 === s2) break;
    const merged = [...dayGroups[s1], ...dayGroups[s2]];
    dayGroups = dayGroups.filter((_, i) => i !== s1 && i !== s2);
    dayGroups.push(merged);
  }
  return dayGroups;
}

// ── 2-opt TSP route optimizer ─────────────────────────────────────────────────

function tourCost(route, timeMatrix) {
  let cost = 0;
  for (let i = 0; i < route.length - 1; i++) cost += timeMatrix[route[i]][route[i + 1]];
  return cost;
}

function nearestNeighbour(start, nodes, timeMatrix) {
  const unvisited = new Set(nodes);
  const route = [start]; let current = start;
  while (unvisited.size > 0) {
    let nearest = -1, minT = Infinity;
    for (const j of unvisited) {
      if (timeMatrix[current][j] < minT) { minT = timeMatrix[current][j]; nearest = j; }
    }
    route.push(nearest); unvisited.delete(nearest); current = nearest;
  }
  return route;
}

function twoOpt(route, timeMatrix, maxIter = 200) {
  let best = [...route], bestCost = tourCost(best, timeMatrix);
  let improved = true, iters = 0;
  while (improved && iters < maxIter) {
    improved = false; iters++;
    for (let i = 1; i < best.length - 1; i++) {
      for (let k = i + 1; k < best.length; k++) {
        const newRoute = [...best.slice(0, i), ...best.slice(i, k + 1).reverse(), ...best.slice(k + 1)];
        const newCost = tourCost(newRoute, timeMatrix);
        if (newCost < bestCost) { best = newRoute; bestCost = newCost; improved = true; break; }
      }
      if (improved) break;
    }
  }
  return best;
}

function optimiseDayRoute(hotelIdx, dayAttrIndices, timeMatrix) {
  if (!dayAttrIndices.length) return { route: [], travelTime: 0 };
  if (dayAttrIndices.length === 1) {
    return { route: [hotelIdx, ...dayAttrIndices], travelTime: timeMatrix[hotelIdx][dayAttrIndices[0]] };
  }
  const initial = nearestNeighbour(hotelIdx, dayAttrIndices, timeMatrix);
  const optimised = twoOpt(initial, timeMatrix);
  return { route: optimised, travelTime: tourCost(optimised, timeMatrix) };
}

// ── Daily scheduler ───────────────────────────────────────────────────────────

function parseHHMM(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m; // minutes since midnight
}

function fmtHHMM(mins) {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addMinutes(t, m) { return t + m; }

const PREF_WINDOWS = {
  morning:   [7 * 60, 12 * 60],
  afternoon: [12 * 60, 17 * 60],
  evening:   [17 * 60, 22 * 60],
  any:       [7 * 60, 22 * 60],
};
const LUNCH_START = 12 * 60 + 30;
const LUNCH_END   = 13 * 60 + 30;

function scheduleDay(attractions, travelTimes, travelModes, walkTimes, startTime, lunchBreakMinutes) {
  const planned = [], deferred = [], warnings = [];
  let currentTime = parseHHMM(startTime);
  let lunchInserted = false;

  for (let i = 0; i < attractions.length; i++) {
    const attr = attractions[i];
    const travelMin = i < travelTimes.length ? travelTimes[i] : 0;
    const mode = i < travelModes.length ? travelModes[i] : 'walking';
    const walkMin = i < walkTimes.length ? walkTimes[i] : 0;
    let arrival = addMinutes(currentTime, travelMin);

    // Lunch break
    if (!lunchInserted && arrival >= LUNCH_START && lunchBreakMinutes > 0) {
      currentTime = addMinutes(arrival, lunchBreakMinutes);
      arrival = currentTime;
      lunchInserted = true;
    }

    // Fixed time
    if (attr.fixed_time) {
      const fixedDt = parseHHMM(attr.fixed_time);
      if (arrival > fixedDt + 30) {
        warnings.push(`'${attr.title}' fixed at ${attr.fixed_time} but estimated arrival ${fmtHHMM(arrival)} – too late; deferring.`);
        deferred.push(attr);
        continue;
      }
      if (arrival < fixedDt) arrival = fixedDt;
    }

    // Opening hours
    let opens = 0, closes = 23 * 60 + 59;
    if (attr.opening_hours) {
      opens = parseHHMM(attr.opening_hours.open);
      closes = parseHHMM(attr.opening_hours.close);
    }

    if (arrival < opens) {
      const wait = opens - arrival;
      if (wait > 45) warnings.push(`Waiting ${wait} min for '${attr.title}' to open at ${fmtHHMM(opens)}.`);
      arrival = opens;
    }

    const visitEnd = addMinutes(arrival, attr.duration_minutes);
    if (visitEnd > closes) {
      if (arrival >= closes) {
        warnings.push(`'${attr.title}' is closed at estimated arrival ${fmtHHMM(arrival)}; deferring.`);
        deferred.push(attr);
        continue;
      }
      const available = closes - arrival;
      if (available < attr.duration_minutes * 0.5) {
        warnings.push(`Only ${available} min available for '${attr.title}' (needs ${attr.duration_minutes} min); deferring.`);
        deferred.push(attr);
        continue;
      }
      warnings.push(`'${attr.title}' visit truncated to ${available} min due to closing time.`);
    }

    // Preferred time-of-day (soft constraint)
    if (attr.preferred_time_of_day && attr.preferred_time_of_day !== 'any') {
      const [ws, we] = PREF_WINDOWS[attr.preferred_time_of_day] || PREF_WINDOWS.any;
      if (!(ws <= arrival && arrival <= we)) {
        warnings.push(`'${attr.title}' prefers ${attr.preferred_time_of_day} but scheduled at ${fmtHHMM(arrival)}.`);
      }
    }

    const nextTravel = (i + 1) < travelTimes.length ? travelTimes[i + 1] : 0;
    const nextWalk = (i + 1) < walkTimes.length ? walkTimes[i + 1] : 0;
    const nextMode = (i + 1) < travelModes.length ? travelModes[i + 1] : 'walking';

    planned.push({
      attraction: attr,
      arrival_time: fmtHHMM(arrival),
      departure_time: fmtHHMM(Math.min(visitEnd, closes > arrival ? closes : visitEnd)),
      travel_to_next_minutes: nextTravel,
      travel_to_next_mode: nextMode,
      walk_to_next_minutes: nextWalk,
      cluster_id: 0,
    });

    currentTime = Math.min(visitEnd, closes > arrival ? visitEnd : closes);
  }

  return { planned, deferred, warnings };
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function applyWeights(weights, preferences, style, pacingMode) {
  const w = { ...weights };

  if (preferences.includes('minimize_walking'))   { w.fatigue += 0.10; w.distance -= 0.05; w.balance -= 0.05; }
  if (preferences.includes('minimize_transport')) { w.distance += 0.10; w.cluster += 0.05; w.balance -= 0.10; w.preference -= 0.05; }
  if (preferences.includes('balanced_days'))      { w.balance += 0.10; w.distance -= 0.05; w.fatigue -= 0.05; }
  if (preferences.includes('compact_itinerary'))  { w.cluster += 0.10; w.distance += 0.05; w.balance -= 0.10; w.preference -= 0.05; }

  if (style === 'relaxed')   { w.fatigue += 0.05; w.priority -= 0.05; }
  if (style === 'intensive') { w.priority += 0.05; w.fatigue -= 0.05; }

  if (pacingMode === 'compact')   { w.cluster += 0.10; w.distance += 0.05; w.balance -= 0.10; w.preference -= 0.05; }
  if (pacingMode === 'balanced')  { w.balance += 0.15; w.cluster -= 0.05; w.distance -= 0.05; w.fatigue -= 0.05; }
  if (pacingMode === 'relaxed')   { w.fatigue += 0.15; w.preference += 0.05; w.priority -= 0.10; w.distance -= 0.10; }
  if (pacingMode === 'intensive') { w.priority += 0.15; w.cluster += 0.05; w.fatigue -= 0.15; w.preference -= 0.05; }

  const total = Object.values(w).reduce((s, v) => s + v, 0);
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.max(0, v / total)]));
}

function scoreItinerary(days, allPriorities, plannedPriorities, settings, clusterLabels) {
  const weights = applyWeights(BASE_WEIGHTS, settings.preferences || [], settings.travel_style, settings.pacing_mode);
  const activeDays = days.filter(d => d.attractions.length > 0);
  if (!activeDays.length) return { overall: 100, distance: 100, balance: 100, fatigue: 100, cluster: 100, preference: 100, priority: 100 };

  const avgDuration = activeDays.reduce((s, d) => s + d.total_duration_minutes, 0) / activeDays.length;

  // Per-day scores
  const dayScores = activeDays.map(d => {
    const totalTime = d.total_duration_minutes + d.total_travel_minutes;
    const travelRatio = d.total_travel_minutes / Math.max(1, totalTime);
    const distScore = Math.max(0, 100 - travelRatio * 150);
    const deviation = Math.abs(d.total_duration_minutes - avgDuration);
    const balScore = Math.max(0, 100 - (deviation / Math.max(1, avgDuration)) * 100);
    const walkPenalty = Math.min(100, (d.total_walking_minutes / Math.max(1, settings.walking_tolerance_minutes || 30)) * 100);
    const fatScore = Math.max(0, 100 - walkPenalty * 0.6 - (d.attractions.length / 10.0) * 40);
    const cids = d.attractions.map(pa => pa.cluster_id);
    const sameCount = cids.slice(1).reduce((s, c, i) => s + (c === cids[i] ? 1 : 0), 0);
    const clusterScore = cids.length < 2 ? 100 : (100 * sameCount / (cids.length - 1));
    return weights.distance * distScore + weights.balance * balScore + weights.fatigue * fatScore + weights.cluster * clusterScore;
  });
  const avgDayScore = dayScores.reduce((s, v) => s + v, 0) / dayScores.length;

  // Balance across days
  const durations = activeDays.map(d => d.total_duration_minutes);
  const meanDur = durations.reduce((s, v) => s + v, 0) / durations.length;
  const stdDur = Math.sqrt(durations.reduce((s, v) => s + (v - meanDur) ** 2, 0) / durations.length);
  const balanceScore = Math.max(0, 100 - (stdDur / Math.max(1, meanDur)) * 100);

  // Priority coverage
  let priorityScore = 100;
  if (allPriorities.length > 0) {
    const sortedAll = [...allPriorities].sort((a, b) => b - a);
    const topN = Math.max(1, Math.floor(sortedAll.length / 2));
    const topSet = new Set(sortedAll.slice(0, topN));
    const covered = plannedPriorities.filter(p => topSet.has(p)).length;
    priorityScore = Math.min(100, (covered / topSet.size) * 100);
  }

  // Fatigue
  const dailyFatigue = activeDays.map(d => {
    const ratio = d.total_walking_minutes / Math.max(1, settings.walking_tolerance_minutes || 30);
    return Math.max(0, 100 - ratio * 80);
  });
  const fatigueScore = dailyFatigue.reduce((s, v) => s + v, 0) / dailyFatigue.length;

  // Cluster coherence
  const clusterCoherence = activeDays.map(d => {
    if (d.attractions.length < 2) return 100;
    const cids = d.attractions.map(pa => pa.cluster_id);
    const same = cids.slice(1).reduce((s, c, i) => s + (c === cids[i] ? 1 : 0), 0);
    return 100 * same / (cids.length - 1);
  });
  const clusterScore = clusterCoherence.reduce((s, v) => s + v, 0) / clusterCoherence.length;

  // Preference matching
  let prefScore = 80;
  if ((settings.preferences || []).includes('free_time')) {
    if (avgDuration < (settings.max_hours_per_day || 8) * 60 * 0.8) prefScore += 20;
  }
  if ((settings.preferences || []).includes('balanced_days')) {
    const cv = stdDur / Math.max(1, meanDur);
    prefScore += Math.max(0, 20 - cv * 40);
  }
  prefScore = Math.min(100, prefScore);

  const breakdown = {
    distance: Math.round(avgDayScore * 10) / 10,
    balance: Math.round(balanceScore * 10) / 10,
    fatigue: Math.round(fatigueScore * 10) / 10,
    cluster: Math.round(clusterScore * 10) / 10,
    preference: Math.round(prefScore * 10) / 10,
    priority: Math.round(priorityScore * 10) / 10,
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
    compact: 'Fewest active days, free days at end',
    balanced: 'Evenly spread across all days',
    relaxed: 'Light days, lots of free time',
    intensive: 'Maximum sights per day',
  };

  const warnings = [
    `Pacing: ${pacing_mode.charAt(0).toUpperCase() + pacing_mode.slice(1)} — ${pacingDescriptions[pacing_mode] || ''}`,
  ];

  // Build extended coords: [hotel, ...attractions]
  const hotelCoord = [hotel.latitude, hotel.longitude];
  const attrCoords = attractions.map(a => [a.latitude, a.longitude]);
  const allCoords = [hotelCoord, ...attrCoords]; // index 0 = hotel

  // Step 1: Distance matrix (n+1 × n+1, index 0 = hotel)
  const { time: timeMatrix, modes: modeMatrix, walk: walkMatrix } =
    buildDistanceMatrix(allCoords, transport_mode);

  // Step 2: DBSCAN cluster only attraction coords (not hotel)
  const epsilonKm = travel_style === 'intensive' ? 0.8 : travel_style === 'relaxed' ? 1.8 : 1.2;
  const clusterLabels = attrCoords.length === 0 ? [] : dbscan(attrCoords, epsilonKm);

  const priorities = attractions.map(a => a.priority_score ?? 5.0);
  const durations  = attractions.map(a => a.duration_minutes ?? 60);

  const cSummary = clusterSummary(clusterLabels, attrCoords, priorities, durations);

  // Step 3: Allocate clusters to days
  const { dayGroups, freeDays } = allocateDays(
    clusterLabels, cSummary, durations, timeMatrix,
    total_days, max_hours_per_day, travel_style, preferences, pacing_mode
  );

  // Step 4–5: Optimise routes + schedule each day
  const cluster_map = {};
  for (let i = 0; i < clusterLabels.length; i++) {
    cluster_map[attractions[i].id] = clusterLabels[i];
  }

  const plannedPriorities = [];
  const days = dayGroups.map((group, di) => {
    const { route } = optimiseDayRoute(0, group.map(i => i + 1), timeMatrix);

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

    const { planned, deferred, warnings: dayWarnings } = scheduleDay(
      orderedAttractions, travelTimes, travelModes, walkTimes, start_time, lunch_break_minutes
    );

    warnings.push(...dayWarnings);

    // Assign cluster IDs to planned attractions
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
      day_number: di + 1,
      date_label: `Day ${di + 1}`,
      attractions: planned,
      total_duration_minutes: totalDurationMin,
      total_travel_minutes: totalTravelMin,
      total_walking_minutes: totalWalkMin,
      total_cost: totalCost,
      optimization_score: 0,
      cluster_ids: clusterIds,
      notes: [],
    };
  });

  // Step 6: Score
  const scoringBreakdown = scoreItinerary(
    days, priorities, plannedPriorities, { ...settings, walking_tolerance_minutes }, clusterLabels
  );

  const totalPlanned = days.reduce((s, d) => s + d.attractions.length, 0);
  const overallScore = scoringBreakdown.overall;

  // Per-day optimization scores
  for (const day of days) {
    day.optimization_score = overallScore;
  }

  return {
    days,
    free_days: freeDays,
    total_attractions: totalPlanned,
    total_days_used: days.length,
    overall_score: overallScore,
    scoring_breakdown: scoringBreakdown,
    cluster_map,
    warnings,
  };
}

// ── Netlify Function handler ──────────────────────────────────────────────────

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
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

    if (!attractions || attractions.length === 0) {
      return { statusCode: 422, headers: CORS_HEADERS, body: JSON.stringify({ detail: 'At least one attraction is required.' }) };
    }
    if (attractions.length > 100) {
      return { statusCode: 422, headers: CORS_HEADERS, body: JSON.stringify({ detail: 'Maximum 100 attractions per request.' }) };
    }
    if (!settings || !settings.hotel) {
      return { statusCode: 422, headers: CORS_HEADERS, body: JSON.stringify({ detail: 'settings.hotel is required.' }) };
    }
    if (!settings.total_days || settings.total_days < 1) {
      return { statusCode: 422, headers: CORS_HEADERS, body: JSON.stringify({ detail: 'settings.total_days must be >= 1.' }) };
    }

    const result = runOptimizer(attractions, settings);
    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(result) };

  } catch (err) {
    console.error('Optimizer error:', err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ detail: err.message || 'Internal server error' }) };
  }
};
