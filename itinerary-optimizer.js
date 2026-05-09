'use strict';

/* ═══════════════════════════════════════════════════════════
   Travel Itinerary Optimizer – Frontend
   ═══════════════════════════════════════════════════════════ */

const API_BASE = window.location.origin;

// ── Colour palette for day clusters ──────────────────────────────────────────
const DAY_COLORS = [
  '#2563eb','#0d9488','#d97706','#7c3aed','#dc2626',
  '#0891b2','#059669','#c2410c','#4f46e5','#0f766e',
];

const CLUSTER_COLORS = [
  '#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444',
  '#06b6d4','#84cc16','#f97316','#a855f7','#14b8a6',
];

// ── State ─────────────────────────────────────────────────────────────────────
const state = {
  selectedCity: null,
  customAttractions: null,
  currentResult: null,
  map: null,
  markers: [],
  polylines: [],
  settings: {
    totalDays: 5,
    maxHours: 8,
    transport: 'public_transport',
    style: 'balanced',
  },
};

// ── Category icons ────────────────────────────────────────────────────────────
const CAT_ICONS = {
  museum: '🏛️', landmark: '🗼', park: '🌳', religious: '⛪',
  neighborhood: '🏘️', shopping: '🛍️', tour: '⛵', palace: '👑',
  beach: '🏖️', market: '🛒', square: '🏟️', boulevard: '🛣️',
  general: '📍',
};

// ── Available cities (fetched from API) ───────────────────────────────────────
const CITY_META = {
  paris:     { name: 'Paris',     emoji: '🇫🇷', color: '#2563eb' },
  rome:      { name: 'Rome',      emoji: '🇮🇹', color: '#dc2626' },
  barcelona: { name: 'Barcelona', emoji: '🇪🇸', color: '#d97706' },
};

// ════════════════════════════════════════════════════════════
// Initialisation
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initCityGrid();
  initSteppers();
  initTransportButtons();
  initStyleButtons();
  initRangeInput();
  initModals();
  document.getElementById('btnOptimize').addEventListener('click', runOptimize);
});

// ── City grid ─────────────────────────────────────────────────────────────────
function initCityGrid() {
  const grid = document.getElementById('cityGrid');
  grid.innerHTML = '';

  Object.entries(CITY_META).forEach(([key, meta]) => {
    const btn = document.createElement('button');
    btn.className = 'city-btn';
    btn.dataset.city = key;
    btn.innerHTML = `<span class="city-emoji">${meta.emoji}</span><span class="city-name">${meta.name}</span>`;
    btn.addEventListener('click', () => selectCity(key, btn));
    grid.appendChild(btn);
  });

  // Auto-select Paris
  const firstBtn = grid.querySelector('.city-btn');
  if (firstBtn) firstBtn.click();
}

function selectCity(city, btn) {
  document.querySelectorAll('.city-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.selectedCity = city;
  state.customAttractions = null;
}

// ── Steppers ──────────────────────────────────────────────────────────────────
function initSteppers() {
  document.querySelectorAll('.step-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = btn.dataset.field;
      const delta = parseInt(btn.dataset.delta, 10);
      const valEl = document.getElementById(`val${field.charAt(0).toUpperCase()}${field.slice(1)}`);
      const limits = { totalDays: [1, 30], maxHours: [2, 16] };
      let val = parseInt(valEl.textContent, 10) + delta;
      const [min, max] = limits[field] || [1, 99];
      val = Math.max(min, Math.min(max, val));
      valEl.textContent = val;
      state.settings[field] = val;
    });
  });
}

// ── Transport ─────────────────────────────────────────────────────────────────
function initTransportButtons() {
  document.querySelectorAll('.transport-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.settings.transport = btn.dataset.mode;
    });
  });
}

// ── Travel style ──────────────────────────────────────────────────────────────
function initStyleButtons() {
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.settings.style = btn.dataset.style;
    });
  });
}

// ── Range input ───────────────────────────────────────────────────────────────
function initRangeInput() {
  const range = document.getElementById('walkingTolerance');
  const label = document.getElementById('walkTolVal');
  range.addEventListener('input', () => {
    label.textContent = `${range.value} min / day`;
  });
}

// ── Modals ────────────────────────────────────────────────────────────────────
function initModals() {
  const modal = document.getElementById('customModal');

  document.getElementById('btnCustomAttractions').addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  ['closeModal', 'closeModal2'].forEach(id => {
    document.getElementById(id).addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });

  document.getElementById('loadCustomJson').addEventListener('click', () => {
    try {
      const raw = document.getElementById('customJson').value.trim();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Expected a non-empty array');
      state.customAttractions = parsed;
      state.selectedCity = null;
      document.querySelectorAll('.city-btn').forEach(b => b.classList.remove('active'));
      modal.style.display = 'none';
      showToast(`Loaded ${parsed.length} custom attractions`);
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  });

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });
}

// ════════════════════════════════════════════════════════════
// Optimization
// ════════════════════════════════════════════════════════════
async function runOptimize() {
  if (!state.selectedCity && !state.customAttractions) {
    showToast('Please select a city or add custom attractions', 'error');
    return;
  }

  showLoading(true);

  try {
    // Fetch dataset if city selected
    let attractions = state.customAttractions;
    let hotelLat, hotelLon, hotelName;

    if (state.selectedCity) {
      setLoadingStep('Fetching city dataset…');
      const resp = await fetch(`${API_BASE}/api/datasets/${state.selectedCity}`);
      if (!resp.ok) throw new Error(`Failed to load dataset: ${resp.status}`);
      const data = await resp.json();
      attractions = data.attractions;
      hotelLat = data.hotel.latitude;
      hotelLon = data.hotel.longitude;
      hotelName = data.hotel.name;
    } else {
      // Use centroid of custom attractions as hotel
      const lats = attractions.map(a => a.latitude);
      const lons = attractions.map(a => a.longitude);
      hotelLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      hotelLon = lons.reduce((a, b) => a + b, 0) / lons.length;
      hotelName = 'Your Location';
    }

    const preferences = Array.from(
      document.querySelectorAll('.pref-list input[type=checkbox]:checked')
    ).map(cb => cb.value);

    const payload = {
      attractions,
      settings: {
        total_days: state.settings.totalDays,
        max_hours_per_day: state.settings.maxHours,
        hotel: { latitude: hotelLat, longitude: hotelLon, name: hotelName },
        transport_mode: state.settings.transport,
        walking_tolerance_minutes: parseInt(document.getElementById('walkingTolerance').value, 10),
        travel_style: state.settings.style,
        preferences,
        start_time: document.getElementById('startTime').value,
        lunch_break_minutes: parseInt(document.getElementById('lunchBreak').value, 10),
        city_name: state.selectedCity || 'Custom',
      },
    };

    setLoadingStep('Clustering attractions geographically…');
    await sleep(300);
    setLoadingStep('Running multi-day allocation…');
    await sleep(200);

    const optResp = await fetch(`${API_BASE}/api/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!optResp.ok) {
      const err = await optResp.json();
      throw new Error(err.detail || 'Optimization failed');
    }

    setLoadingStep('Scheduling and scoring…');
    const result = await optResp.json();
    state.currentResult = result;

    showLoading(false);
    renderResults(result, { lat: hotelLat, lon: hotelLon, name: hotelName });

  } catch (err) {
    showLoading(false);
    showError(err.message);
  }
}

// ════════════════════════════════════════════════════════════
// Rendering
// ════════════════════════════════════════════════════════════
function renderResults(result, hotel) {
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('resultsContent').style.display = 'block';

  renderSummary(result);
  renderScoreCard(result.scoring_breakdown);
  renderWarnings(result.warnings);
  renderMap(result, hotel);
  renderDayPlans(result.days, result.cluster_map);
  renderFreeDays(result.free_days);

  document.getElementById('resultsContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Summary bar ───────────────────────────────────────────────────────────────
function renderSummary(result) {
  const el = document.getElementById('resultSummary');
  const totalCost = result.days.reduce((sum, d) => sum + d.total_cost, 0);
  const totalTravel = result.days.reduce((sum, d) => sum + d.total_travel_minutes, 0);

  el.innerHTML = `
    <div class="summary-stat"><span class="stat-val">${result.total_days_used}</span><span class="stat-lbl">Active Days</span></div>
    <div class="summary-stat"><span class="stat-val">${result.free_days.length}</span><span class="stat-lbl">Free Days</span></div>
    <div class="summary-stat"><span class="stat-val">${result.total_attractions}</span><span class="stat-lbl">Attractions</span></div>
    <div class="summary-stat"><span class="stat-val">${fmtDuration(totalTravel)}</span><span class="stat-lbl">Total Travel</span></div>
    ${totalCost > 0 ? `<div class="summary-stat"><span class="stat-val">€${totalCost.toFixed(0)}</span><span class="stat-lbl">Est. Cost</span></div>` : ''}
    <div class="summary-stat"><span class="stat-val">${result.overall_score.toFixed(0)}</span><span class="stat-lbl">Opt. Score</span></div>
  `;
}

// ── Score card ────────────────────────────────────────────────────────────────
function renderScoreCard(breakdown) {
  if (!breakdown || !Object.keys(breakdown).length) return;
  const overall = breakdown.overall || 0;
  const scoreClass = scoreColorClass(overall);

  const dims = [
    { key: 'distance',   label: 'Route Efficiency', color: '#2563eb' },
    { key: 'balance',    label: 'Day Balance',       color: '#0d9488' },
    { key: 'fatigue',    label: 'Fatigue',           color: '#7c3aed' },
    { key: 'cluster',    label: 'Cluster Coherence', color: '#d97706' },
    { key: 'preference', label: 'Preferences',       color: '#059669' },
    { key: 'priority',   label: 'Priority Coverage', color: '#dc2626' },
  ];

  document.getElementById('scoreCard').innerHTML = `
    <div class="score-header">
      <div class="score-overall">
        <div class="score-circle ${scoreClass}">${overall.toFixed(0)}</div>
        <div>
          <div style="font-weight:700;font-size:1rem">Optimization Score</div>
          <div style="font-size:.82rem;color:var(--gray-500)">${scoreLabel(overall)}</div>
        </div>
      </div>
    </div>
    <div class="score-breakdown">
      ${dims.map(d => `
        <div class="score-dim">
          <span class="dim-label">${d.label}</span>
          <div class="dim-bar-wrap">
            <div class="dim-bar" style="width:${breakdown[d.key] || 0}%;background:${d.color}"></div>
          </div>
          <span class="dim-val" style="color:${d.color}">${(breakdown[d.key] || 0).toFixed(0)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Warnings ──────────────────────────────────────────────────────────────────
function renderWarnings(warnings) {
  const box = document.getElementById('warningsBox');
  if (!warnings || warnings.length === 0) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  box.innerHTML = `
    <h4>⚠ Scheduling Notes (${warnings.length})</h4>
    <ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul>
  `;
}

// ── Map ───────────────────────────────────────────────────────────────────────
function renderMap(result, hotel) {
  // Destroy existing map
  if (state.map) {
    state.map.remove();
    state.map = null;
  }

  const map = L.map('itineraryMap', { zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map);
  state.map = map;

  const bounds = [];

  // Hotel marker
  const hotelIcon = L.divIcon({
    html: `<div style="background:#1f2937;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)">🏨</div>`,
    className: '', iconSize: [30, 30], iconAnchor: [15, 15],
  });
  L.marker([hotel.lat, hotel.lon], { icon: hotelIcon })
    .bindPopup(`<strong>${hotel.name}</strong><br/>Start/End location`)
    .addTo(map);
  bounds.push([hotel.lat, hotel.lon]);

  // Render each day
  const legend = document.getElementById('mapLegend');
  legend.innerHTML = '<div class="legend-item"><div class="legend-dot" style="background:#1f2937"></div><span>Hotel</span></div>';

  result.days.forEach((day, di) => {
    const color = DAY_COLORS[di % DAY_COLORS.length];
    const dayCoords = [[hotel.lat, hotel.lon]];

    legend.innerHTML += `<div class="legend-item"><div class="legend-dot" style="background:${color}"></div><span>Day ${day.day_number}</span></div>`;

    day.attractions.forEach((pa, ai) => {
      const lat = pa.attraction.latitude;
      const lon = pa.attraction.longitude;
      bounds.push([lat, lon]);
      dayCoords.push([lat, lon]);

      const icon = L.divIcon({
        html: `<div style="background:${color};color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,.3)">${ai + 1}</div>`,
        className: '', iconSize: [28, 28], iconAnchor: [14, 14],
      });

      L.marker([lat, lon], { icon })
        .bindPopup(`
          <strong>${pa.attraction.title}</strong><br/>
          Day ${day.day_number} · Stop ${ai + 1}<br/>
          ${pa.arrival_time} – ${pa.departure_time}<br/>
          ${pa.attraction.duration_minutes} min visit
          ${pa.attraction.cost > 0 ? `<br/>€${pa.attraction.cost}` : ''}
        `)
        .addTo(map);
    });

    // Draw route polyline for this day
    if (dayCoords.length > 1) {
      L.polyline(dayCoords, {
        color,
        weight: 2.5,
        opacity: 0.7,
        dashArray: '6 4',
      }).addTo(map);
    }
  });

  if (bounds.length > 0) {
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

// ── Day plans ─────────────────────────────────────────────────────────────────
function renderDayPlans(days, clusterMap) {
  const container = document.getElementById('dayPlans');
  container.innerHTML = '';

  days.forEach((day, di) => {
    const color = DAY_COLORS[di % DAY_COLORS.length];
    const scoreClass = scoreColorClass(day.optimization_score);

    const card = document.createElement('div');
    card.className = 'day-card';

    const attrCount = day.attractions.length;
    const totalMin = day.total_duration_minutes + day.total_travel_minutes;

    card.innerHTML = `
      <div class="day-header" onclick="toggleDay(this)">
        <div class="day-number-badge" style="background:${color}">D${day.day_number}</div>
        <div class="day-header-info">
          <div class="day-title">${day.date_label}</div>
          <div class="day-meta">${attrCount} attraction${attrCount !== 1 ? 's' : ''} · ~${fmtDuration(totalMin)}</div>
        </div>
        <span class="day-score-badge score-${scoreClass}">⭐ ${day.optimization_score.toFixed(0)}</span>
        <span class="day-toggle">▼</span>
      </div>
      <div class="day-body" style="display:none">
        ${renderTimeline(day, color)}
        ${renderDayStats(day)}
      </div>
    `;

    container.appendChild(card);
  });
}

function renderTimeline(day, color) {
  if (!day.attractions.length) return '<p style="color:var(--gray-400);font-size:.85rem">No attractions scheduled.</p>';

  let html = '<div class="timeline">';

  day.attractions.forEach((pa, i) => {
    const icon = CAT_ICONS[pa.attraction.category] || '📍';
    const clusterColor = CLUSTER_COLORS[pa.cluster_id % CLUSTER_COLORS.length];

    html += `
      <div class="tl-item">
        <div class="tl-dot" style="color:${clusterColor}"></div>
        <div class="tl-time">
          <span>${pa.arrival_time} – ${pa.departure_time}</span>
          <span style="color:${clusterColor};font-size:.7rem">cluster ${pa.cluster_id}</span>
        </div>
        <div class="tl-title">${icon} ${pa.attraction.title}</div>
        <div class="tl-details">
          <span class="tl-chip category">${pa.attraction.category}</span>
          <span class="tl-chip">${pa.attraction.duration_minutes} min</span>
          ${pa.attraction.cost > 0 ? `<span class="tl-chip cost">€${pa.attraction.cost}</span>` : ''}
          ${pa.attraction.preferred_time_of_day !== 'any' ? `<span class="tl-chip">${pa.attraction.preferred_time_of_day}</span>` : ''}
        </div>
      </div>
    `;

    if (i < day.attractions.length - 1 && pa.travel_to_next_minutes > 0) {
      const modeEmoji = modeIcon(pa.travel_to_next_mode);
      html += `
        <div class="tl-travel">
          ${modeEmoji} <div class="tl-travel-line"></div> ${pa.travel_to_next_minutes} min
        </div>
      `;
    }
  });

  html += '</div>';
  return html;
}

function renderDayStats(day) {
  const totalCost = day.total_cost;
  return `
    <div class="day-stats">
      <span class="day-stat">🕐 Visit time: <strong>${fmtDuration(day.total_duration_minutes)}</strong></span>
      <span class="day-stat">🚌 Travel: <strong>${fmtDuration(day.total_travel_minutes)}</strong></span>
      <span class="day-stat">🚶 Walking: <strong>${day.total_walking_minutes} min</strong></span>
      ${totalCost > 0 ? `<span class="day-stat">💶 Cost: <strong>€${totalCost.toFixed(0)}</strong></span>` : ''}
      ${day.cluster_ids.length > 0 ? `<span class="day-stat">📍 Clusters: <strong>${day.cluster_ids.join(', ')}</strong></span>` : ''}
    </div>
  `;
}

// ── Free days ─────────────────────────────────────────────────────────────────
function renderFreeDays(freeDays) {
  const container = document.getElementById('freeDays');
  container.innerHTML = '';

  if (!freeDays || freeDays.length === 0) return;

  freeDays.forEach(dayNum => {
    container.innerHTML += `
      <div class="free-day-card">
        <div class="free-day-icon">🌴</div>
        <div class="free-day-text">
          <h4>Day ${dayNum} — Free Day</h4>
          <p>No planned activities. Explore spontaneously, rest, or add day trips.</p>
        </div>
      </div>
    `;
  });
}

// ── Toggle day ────────────────────────────────────────────────────────────────
window.toggleDay = function (header) {
  const body = header.nextElementSibling;
  const toggle = header.querySelector('.day-toggle');
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  toggle.classList.toggle('open', !isOpen);
};

// ════════════════════════════════════════════════════════════
// UI helpers
// ════════════════════════════════════════════════════════════
function showLoading(show) {
  document.getElementById('emptyState').style.display = show ? 'none' : '';
  document.getElementById('loadingState').style.display = show ? 'block' : 'none';
  document.getElementById('resultsContent').style.display = 'none';
  if (show) {
    document.getElementById('loadingState').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function setLoadingStep(msg) {
  const el = document.getElementById('loadingStep');
  if (el) el.textContent = msg;
}

function showError(msg) {
  document.getElementById('emptyState').style.display = 'block';
  document.getElementById('emptyState').innerHTML = `
    <div class="empty-icon">❌</div>
    <h3>Optimization Failed</h3>
    <p style="color:var(--red)">${msg}</p>
    <button class="btn btn-outline" onclick="location.reload()">Reload</button>
  `;
}

function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:999;
    background:${type === 'error' ? '#dc2626' : '#16a34a'};
    color:#fff;padding:12px 20px;border-radius:8px;
    font-size:.88rem;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.2);
    animation:fadeIn .2s;
  `;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function scoreColorClass(score) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

function scoreLabel(score) {
  if (score >= 80) return 'Excellent optimization';
  if (score >= 60) return 'Good itinerary';
  if (score >= 40) return 'Moderate efficiency';
  return 'Room for improvement';
}

function fmtDuration(minutes) {
  if (!minutes) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function modeIcon(mode) {
  return { walking: '🚶', cycling: '🚲', public_transport: '🚇', taxi: '🚕', '': '→' }[mode] || '→';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
