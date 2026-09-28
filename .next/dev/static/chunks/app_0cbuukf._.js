(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/start/data/destinations.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

// -----------------------------------------------------------------------------
// Destinations data (standalone /start page)
// -----------------------------------------------------------------------------
// Re-exported from the SINGLE shared source in the planner core, so the /start
// input and the main planner always offer the same cities/areas (now with
// coordinates). See core/destinations.data.ts for the data itself.
__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$core$2f$destinations$2e$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ActivityCombinations/core/destinations.data.ts [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/start/data/dateUtils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// -----------------------------------------------------------------------------
// Small date helpers for the calendar (Monday-first, no external deps)
// -----------------------------------------------------------------------------
__turbopack_context__.s([
    "MONTHS",
    ()=>MONTHS,
    "MONTHS_SHORT",
    ()=>MONTHS_SHORT,
    "WEEKDAYS",
    ()=>WEEKDAYS,
    "addDays",
    ()=>addDays,
    "addMonths",
    ()=>addMonths,
    "formatShort",
    ()=>formatShort,
    "isSameDay",
    ()=>isSameDay,
    "monthGrid",
    ()=>monthGrid,
    "monthLabel",
    ()=>monthLabel,
    "nextDow",
    ()=>nextDow,
    "startOfToday",
    ()=>startOfToday
]);
const MONTHS = [
    "Ιανουάριος",
    "Φεβρουάριος",
    "Μάρτιος",
    "Απρίλιος",
    "Μάιος",
    "Ιούνιος",
    "Ιούλιος",
    "Αύγουστος",
    "Σεπτέμβριος",
    "Οκτώβριος",
    "Νοέμβριος",
    "Δεκέμβριος"
];
const MONTHS_SHORT = [
    "Ιαν",
    "Φεβ",
    "Μάρ",
    "Απρ",
    "Μάι",
    "Ιούν",
    "Ιούλ",
    "Αύγ",
    "Σεπ",
    "Οκτ",
    "Νοέ",
    "Δεκ"
];
const WEEKDAYS = [
    "Δε",
    "Τρ",
    "Τε",
    "Πέ",
    "Πα",
    "Σά",
    "Κυ"
];
function startOfToday() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
}
function addMonths(d, n) {
    return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function nextDow(from, dow) {
    const diff = (dow - from.getDay() + 7) % 7;
    return addDays(from, diff);
}
function monthLabel(view) {
    return `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
}
function formatShort(d) {
    // Greek order: day before month ("7 Ιουν").
    return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}
function monthGrid(view) {
    const year = view.getFullYear();
    const month = view.getMonth();
    const lead = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first offset
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for(let i = 0; i < lead; i++)cells.push(null);
    for(let d = 1; d <= daysInMonth; d++)cells.push(new Date(year, month, d));
    return cells;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/ActivityCombinations/StartPointSearch.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StartPointSearch",
    ()=>StartPointSearch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// Personal start point (#3, option b): a free-text search for an ADDRESS or a
// HOTEL/POI name, geocoded with Nominatim (OpenStreetMap) — free, no API key.
// Shows up to 5 autocomplete suggestions; picking one (click or Enter) returns
// that point's name + coordinates to the caller. Used on the plan-page filter
// sidebar AND in the homepage destination modal.
//
// Restriction: when `near` is given, results are bounded to a box around that
// point (Nominatim viewbox + bounded=1) and the query is biased with `cityName`,
// so suggestions stay within the chosen destination.
//
// Nominatim usage policy: low volume only, ~1 req/sec — we debounce typing and
// abort stale requests so we never burst.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fa6/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
// Half-size of the bounding box (degrees) used to restrict results around `near`.
// ~0.2° ≈ 20km — covers a city and its near suburbs.
const BOX_HALF_DEG = 0.2;
function StartPointSearch({ cityName, near, currentLabel, autoFocus = false, onSelect }) {
    _s();
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [suggestions, setSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [activeIdx, setActiveIdx] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const abortRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // Debounced geocoding: only fire ~450ms after the last keystroke, and abort any
    // in-flight request so a slow earlier query can't overwrite a newer one.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StartPointSearch.useEffect": ()=>{
            const q = query.trim();
            if (q.length < 3) {
                setSuggestions([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            const timer = setTimeout({
                "StartPointSearch.useEffect.timer": ()=>{
                    abortRef.current?.abort();
                    const ctrl = new AbortController();
                    abortRef.current = ctrl;
                    const full = cityName ? `${q}, ${cityName}` : q;
                    const params = new URLSearchParams({
                        format: "jsonv2",
                        limit: "5",
                        addressdetails: "1",
                        q: full
                    });
                    if (near) {
                        // viewbox = left,top,right,bottom = minLon,maxLat,maxLon,minLat
                        params.set("viewbox", `${near.lng - BOX_HALF_DEG},${near.lat + BOX_HALF_DEG},${near.lng + BOX_HALF_DEG},${near.lat - BOX_HALF_DEG}`);
                        params.set("bounded", "1");
                    }
                    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`;
                    fetch(url, {
                        signal: ctrl.signal,
                        headers: {
                            "Accept-Language": "el"
                        }
                    }).then({
                        "StartPointSearch.useEffect.timer": (res)=>res.ok ? res.json() : []
                    }["StartPointSearch.useEffect.timer"]).then({
                        "StartPointSearch.useEffect.timer": (data)=>{
                            const mapped = (Array.isArray(data) ? data : []).map({
                                "StartPointSearch.useEffect.timer.mapped": (d)=>({
                                        name: d.display_name,
                                        coords: {
                                            lat: parseFloat(d.lat),
                                            lng: parseFloat(d.lon)
                                        }
                                    })
                            }["StartPointSearch.useEffect.timer.mapped"]).filter({
                                "StartPointSearch.useEffect.timer.mapped": (s)=>Number.isFinite(s.coords.lat) && Number.isFinite(s.coords.lng)
                            }["StartPointSearch.useEffect.timer.mapped"]).slice(0, 5);
                            setSuggestions(mapped);
                            setActiveIdx(0);
                            setOpen(true);
                        }
                    }["StartPointSearch.useEffect.timer"]).catch({
                        "StartPointSearch.useEffect.timer": (err)=>{
                            if (!(err instanceof DOMException && err.name === "AbortError")) {
                                setSuggestions([]);
                            }
                        }
                    }["StartPointSearch.useEffect.timer"]).finally({
                        "StartPointSearch.useEffect.timer": ()=>setLoading(false)
                    }["StartPointSearch.useEffect.timer"]);
                }
            }["StartPointSearch.useEffect.timer"], 450);
            return ({
                "StartPointSearch.useEffect": ()=>clearTimeout(timer)
            })["StartPointSearch.useEffect"];
        }
    }["StartPointSearch.useEffect"], [
        query,
        cityName,
        near
    ]);
    const choose = (s)=>{
        // A short label (first comma-separated chunk — the street or POI name) reads
        // better on the marker / field than the full address.
        const short = s.name.split(",")[0].trim() || s.name;
        onSelect({
            name: short,
            coords: s.coords
        });
        setQuery(short);
        setSuggestions([]);
        setOpen(false);
    };
    const onKeyDown = (e)=>{
        if (e.key === "Enter") {
            // Enter selects the first (or arrow-highlighted) suggestion.
            e.preventDefault();
            if (suggestions.length > 0) {
                choose(suggestions[Math.min(activeIdx, suggestions.length - 1)]);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActiveIdx((i)=>Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i)=>Math.max(i - 1, 0));
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2 rounded-lg border border-black/[.08] bg-white px-3 py-2 transition-colors focus-within:border-orange-300 dark:border-white/[.145] dark:bg-zinc-900",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaMagnifyingGlass"], {
                        className: "h-3.5 w-3.5 shrink-0 text-zinc-400"
                    }, void 0, false, {
                        fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                        lineNumber: 138,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus: autoFocus,
                        value: query,
                        onChange: (e)=>setQuery(e.target.value),
                        onFocus: ()=>suggestions.length > 0 && setOpen(true),
                        onKeyDown: onKeyDown,
                        placeholder: "Διεύθυνση ή όνομα ξενοδοχείου",
                        className: "w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-300"
                    }, void 0, false, {
                        fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                        lineNumber: 139,
                        columnNumber: 9
                    }, this),
                    loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        className: "h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500"
                    }, void 0, false, {
                        fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                        lineNumber: 151,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                lineNumber: 137,
                columnNumber: 7
            }, this),
            currentLabel && !(open && suggestions.length > 0) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaLocationDot"], {
                        className: "h-3 w-3 shrink-0"
                    }, void 0, false, {
                        fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                        lineNumber: 161,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "truncate",
                        children: currentLabel
                    }, void 0, false, {
                        fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                        lineNumber: 162,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                lineNumber: 160,
                columnNumber: 9
            }, this),
            open && suggestions.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                className: "overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-900",
                children: suggestions.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onMouseEnter: ()=>setActiveIdx(i),
                            onClick: ()=>choose(s),
                            className: `flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors ${i === activeIdx ? "bg-orange-50 text-orange-800 dark:bg-zinc-800 dark:text-orange-300" : "text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaLocationDot"], {
                                    className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400"
                                }, void 0, false, {
                                    fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                                    lineNumber: 181,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "line-clamp-2",
                                    children: s.name
                                }, void 0, false, {
                                    fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                                    lineNumber: 182,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                            lineNumber: 172,
                            columnNumber: 15
                        }, this)
                    }, `${s.coords.lat},${s.coords.lng},${i}`, false, {
                        fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                        lineNumber: 171,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
                lineNumber: 169,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/ActivityCombinations/StartPointSearch.tsx",
        lineNumber: 136,
        columnNumber: 5
    }, this);
}
_s(StartPointSearch, "vwnt6NoWDSpV+NCV1jdLBkipLRM=");
_c = StartPointSearch;
var _c;
__turbopack_context__.k.register(_c, "StartPointSearch");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/start/components/MapPickerModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MapPickerModal",
    ()=>MapPickerModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// Full-screen (mobile) / centred fixed modal (desktop) for picking a personal
// start point on a Leaflet map. Opened from the address step of DestinationModal.
//
// - The address/hotel input sits at the top (same StartPointSearch as the address
//   step). Choosing a suggestion recentres the map there and drops the pin.
// - Clicking anywhere on the map selects that spot automatically (reverse-geocoded
//   into an address via Nominatim).
// - "Επιλογή" confirms the current pin (top-right on desktop, full-width bottom
//   on mobile); the top-right X / Esc / backdrop close without selecting.
// - The map opens centred on the chosen destination.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/shared/lib/app-dynamic.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fa6/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$buttonStyles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/buttonStyles.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$StartPointSearch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ActivityCombinations/StartPointSearch.tsx [app-client] (ecmascript)");
;
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
// Leaflet can't render on the server, so the map is loaded client-only.
const MapPicker = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$shared$2f$lib$2f$app$2d$dynamic$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/app/start/components/MapPicker.tsx [app-client] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/app/start/components/MapPicker.tsx [app-client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false,
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex h-full w-full items-center justify-center text-sm text-zinc-500",
            children: "Φόρτωση χάρτη…"
        }, void 0, false, {
            fileName: "[project]/app/start/components/MapPickerModal.tsx",
            lineNumber: 29,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
});
_c = MapPicker;
function MapPickerModal({ cityName, cityCenter, initialPoint, onSelect, onClose }) {
    _s();
    const [picked, setPicked] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialPoint ?? null);
    // A fresh object each input-pick so MapPicker recentres even on a repeat.
    const [flyTarget, setFlyTarget] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Latest-wins guard for the async reverse-geocode of a map click.
    const reqId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(0);
    // Esc closes; lock body scroll while open.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "MapPickerModal.useEffect": ()=>{
            const onKey = {
                "MapPickerModal.useEffect.onKey": (e)=>{
                    if (e.key === "Escape") onClose();
                }
            }["MapPickerModal.useEffect.onKey"];
            document.addEventListener("keydown", onKey);
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return ({
                "MapPickerModal.useEffect": ()=>{
                    document.removeEventListener("keydown", onKey);
                    document.body.style.overflow = prev;
                }
            })["MapPickerModal.useEffect"];
        }
    }["MapPickerModal.useEffect"], [
        onClose
    ]);
    // A suggestion picked in the input: centre the map there + drop the pin.
    const onInputSelect = (point)=>{
        setPicked(point);
        setFlyTarget({
            ...point.coords
        });
    };
    // A map click: place the pin immediately, then reverse-geocode for a label.
    const onMapClick = (coords)=>{
        const id = ++reqId.current;
        setPicked({
            name: "Επιλεγμένο σημείο",
            coords
        });
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18` + `&lat=${coords.lat}&lon=${coords.lng}`;
        fetch(url, {
            headers: {
                "Accept-Language": "el"
            }
        }).then((r)=>r.ok ? r.json() : null).then((d)=>{
            if (id !== reqId.current || !d) return;
            const full = d.display_name?.trim();
            const short = full ? full.split(",")[0].trim() || full : "Επιλεγμένο σημείο";
            setPicked({
                name: short,
                coords
            });
        }).catch(()=>{
        /* keep the provisional "Επιλεγμένο σημείο" label on failure */ });
    };
    const confirm = ()=>{
        if (picked) onSelect(picked);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        // data-fullscreen-picker: the homepage search's outside-click handler
        // ignores taps inside this attribute, so interacting with the map doesn't
        // close the underlying destination dropdown.
        "data-fullscreen-picker": true,
        className: "fixed inset-0 z-[200] flex items-stretch justify-center bg-black/50 sm:items-center sm:p-4",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": `Αναζήτηση στον χάρτη: ${cityName}`,
        onClick: onClose,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[80vh] sm:max-w-3xl sm:rounded-2xl",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2 border-b border-black/[.08] px-3 py-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "min-w-0 flex-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$StartPointSearch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StartPointSearch"], {
                                cityName: cityName,
                                near: cityCenter,
                                currentLabel: picked?.name,
                                autoFocus: true,
                                onSelect: onInputSelect
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/MapPickerModal.tsx",
                                lineNumber: 118,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/MapPickerModal.tsx",
                            lineNumber: 117,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: confirm,
                            disabled: !picked,
                            className: `hidden shrink-0 sm:inline-flex ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$buttonStyles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buttonStyles"].secondary} ${picked ? "" : "cursor-not-allowed opacity-50"}`,
                            children: "Επιλογή"
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/MapPickerModal.tsx",
                            lineNumber: 126,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: onClose,
                            "aria-label": "Κλείσιμο",
                            className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-black/[.05] hover:text-zinc-800",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaXmark"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/MapPickerModal.tsx",
                                lineNumber: 142,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/MapPickerModal.tsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/start/components/MapPickerModal.tsx",
                    lineNumber: 116,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative flex-1",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MapPicker, {
                        center: cityCenter,
                        marker: picked?.coords ?? null,
                        flyTo: flyTarget,
                        onMapClick: onMapClick
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/MapPickerModal.tsx",
                        lineNumber: 148,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/start/components/MapPickerModal.tsx",
                    lineNumber: 147,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "border-t border-black/[.08] p-3 sm:hidden",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: confirm,
                        disabled: !picked,
                        className: `w-full text-center ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$buttonStyles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buttonStyles"].secondary} ${picked ? "" : "cursor-not-allowed opacity-50"}`,
                        children: "Επιλογή"
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/MapPickerModal.tsx",
                        lineNumber: 158,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/start/components/MapPickerModal.tsx",
                    lineNumber: 157,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/start/components/MapPickerModal.tsx",
            lineNumber: 111,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/start/components/MapPickerModal.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this), document.body);
}
_s(MapPickerModal, "BZXGBd92z5BlAc0SSZndMDzwXY4=");
_c1 = MapPickerModal;
var _c, _c1;
__turbopack_context__.k.register(_c, "MapPicker");
__turbopack_context__.k.register(_c1, "MapPickerModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/start/components/DestinationModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DestinationModal",
    ()=>DestinationModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// Destination picker, in two steps that occupy the SAME modal area (identical on
// phone and desktop):
//   1. LIST  — only the destinations. Nothing else shows on hover.
//   2. ADDRESS — clicking a destination selects it (its centre as the default
//      start point, #3) and slides in a search for a PERSONAL START POINT (an
//      address or hotel within that city). A back chevron (top-left) slides back
//      to the list. Picking a suggestion finalises the point; leaving it (or
//      going back / closing) keeps the city centre.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$destinations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/app/start/data/destinations.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$core$2f$destinations$2e$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ActivityCombinations/core/destinations.data.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fa6/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$buttonStyles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/buttonStyles.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$StartPointSearch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ActivityCombinations/StartPointSearch.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$MapPickerModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/components/MapPickerModal.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
// Thin, faded scrollbar that only shows while the list is hovered.
const HOVER_SCROLLBAR = "[scrollbar-width:thin] [scrollbar-color:transparent_transparent] hover:[scrollbar-color:#d4d4d8_transparent] " + "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent " + "hover:[&::-webkit-scrollbar-thumb]:bg-zinc-300/70";
function DestinationModal({ value, onChooseDestination, onChoosePoint, onStepChange, query = "" }) {
    _s();
    // The modal always opens on the LIST; clicking a destination moves to ADDRESS.
    const [step, setStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("list");
    // Report the current step to the parent whenever it changes (and on mount), so
    // it can reposition the dropdown for the taller address step on mobile.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DestinationModal.useEffect": ()=>{
            onStepChange?.(step);
        }
    }["DestinationModal.useEffect"], [
        step,
        onStepChange
    ]);
    const [activeId, setActiveId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(value?.destinationId ?? null);
    // Bumped on every "back" so the list replays its slide-in-from-left each time
    // (a changing key remounts the pane). 0 on first open → no slide (the
    // Dropdown's own pop-in covers the entrance).
    const [backCount, setBackCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    // Whether the full-screen / fixed map picker is open over the address step.
    const [mapOpen, setMapOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const q = query.trim().toLowerCase();
    const shown = q ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$core$2f$destinations$2e$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DESTINATIONS"].filter((d)=>d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q) || d.aliases?.some((a)=>a.toLowerCase().includes(q))) : __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$core$2f$destinations$2e$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DESTINATIONS"];
    const active = activeId ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$core$2f$destinations$2e$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DESTINATIONS"].find((d)=>d.id === activeId) ?? null : null;
    const goToAddress = (destinationId)=>{
        // Select the destination (centre as the default start point) and slide in
        // the address search. The dropdown stays open.
        onChooseDestination(destinationId);
        setActiveId(destinationId);
        setStep("address");
    };
    const goBack = ()=>{
        setBackCount((n)=>n + 1);
        setStep("list");
    };
    // Consistent width across both steps so the panel doesn't resize as it slides
    // (full-width on mobile via the Dropdown, fixed on desktop).
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full overflow-hidden sm:w-80",
        children: step === "list" || !active ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
            className: `max-h-72 w-full overflow-y-auto p-2 ${HOVER_SCROLLBAR} ${backCount > 0 ? "animate-panel-in-left" : ""}`,
            children: [
                shown.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                    className: "px-3 py-2 text-sm text-zinc-400",
                    children: "Κανένα αποτέλεσμα"
                }, void 0, false, {
                    fileName: "[project]/app/start/components/DestinationModal.tsx",
                    lineNumber: 101,
                    columnNumber: 13
                }, this),
                shown.map((d)=>{
                    const selected = value?.destinationId === d.id;
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            // Click — NOT hover — advances to the address step.
                            onClick: ()=>goToAddress(d.id),
                            // Stable hook for the reel generator (see reels/README.md).
                            "data-reel": "destination-option",
                            "data-reel-id": d.id,
                            className: `group/row flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-orange-50 ${selected ? "ring-1 ring-orange-300" : ""}`,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "flex flex-col",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-medium text-zinc-800",
                                            children: d.name
                                        }, void 0, false, {
                                            fileName: "[project]/app/start/components/DestinationModal.tsx",
                                            lineNumber: 119,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-zinc-400",
                                            children: [
                                                d.kind === "region" ? "Περιφέρεια" : "Πόλη",
                                                " · ",
                                                d.country
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/app/start/components/DestinationModal.tsx",
                                            lineNumber: 120,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/app/start/components/DestinationModal.tsx",
                                    lineNumber: 118,
                                    columnNumber: 19
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaChevronRight"], {
                                    className: "ml-auto h-4 w-4 shrink-0 text-orange-500 opacity-40 transition-opacity group-hover/row:opacity-100"
                                }, void 0, false, {
                                    fileName: "[project]/app/start/components/DestinationModal.tsx",
                                    lineNumber: 124,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/start/components/DestinationModal.tsx",
                            lineNumber: 107,
                            columnNumber: 17
                        }, this)
                    }, d.id, false, {
                        fileName: "[project]/app/start/components/DestinationModal.tsx",
                        lineNumber: 106,
                        columnNumber: 15
                    }, this);
                })
            ]
        }, `list-${backCount}`, true, {
            fileName: "[project]/app/start/components/DestinationModal.tsx",
            lineNumber: 94,
            columnNumber: 9
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "animate-panel-in-right p-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mb-2 flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: goBack,
                            "aria-label": "Πίσω στους προορισμούς",
                            className: "inline-flex shrink-0 cursor-pointer rounded-full p-1 text-orange-500 transition-colors hover:bg-orange-50",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaChevronLeft"], {
                                className: "h-4 w-4"
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/DestinationModal.tsx",
                                lineNumber: 139,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/DestinationModal.tsx",
                            lineNumber: 133,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs font-semibold uppercase tracking-wide text-zinc-400",
                            children: [
                                "Διαμονή στη/στο ",
                                active.name,
                                " (προαιρετικό)"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/start/components/DestinationModal.tsx",
                            lineNumber: 141,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/start/components/DestinationModal.tsx",
                    lineNumber: 132,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$StartPointSearch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StartPointSearch"], {
                    cityName: active.name,
                    near: active.center,
                    autoFocus: true,
                    currentLabel: value?.destinationId === active.id && value.pointName !== active.name ? value.pointName : undefined,
                    onSelect: (point)=>onChoosePoint(active.id, point)
                }, void 0, false, {
                    fileName: "[project]/app/start/components/DestinationModal.tsx",
                    lineNumber: 145,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: ()=>setMapOpen(true),
                    className: `mt-2 inline-flex w-full items-center justify-center gap-2 ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$buttonStyles$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buttonStyles"].common}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaMapLocationDot"], {
                            className: "h-4 w-4 text-orange-500"
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/DestinationModal.tsx",
                            lineNumber: 163,
                            columnNumber: 13
                        }, this),
                        "Αναζήτηση στον χάρτη"
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/start/components/DestinationModal.tsx",
                    lineNumber: 158,
                    columnNumber: 11
                }, this),
                mapOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$MapPickerModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapPickerModal"], {
                    cityName: active.name,
                    cityCenter: active.center,
                    initialPoint: value?.destinationId === active.id && value.pointName !== active.name ? {
                        name: value.pointName,
                        coords: value.coords
                    } : null,
                    onSelect: (point)=>{
                        onChoosePoint(active.id, point);
                        setMapOpen(false);
                    },
                    onClose: ()=>setMapOpen(false)
                }, void 0, false, {
                    fileName: "[project]/app/start/components/DestinationModal.tsx",
                    lineNumber: 168,
                    columnNumber: 13
                }, this)
            ]
        }, "address", true, {
            fileName: "[project]/app/start/components/DestinationModal.tsx",
            lineNumber: 131,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/start/components/DestinationModal.tsx",
        lineNumber: 92,
        columnNumber: 5
    }, this);
}
_s(DestinationModal, "TQkUV7pgS/WHZcLxl+PK2YNBMtQ=");
_c = DestinationModal;
var _c;
__turbopack_context__.k.register(_c, "DestinationModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/start/components/CalendarModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CalendarModal",
    ()=>CalendarModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// A simple, single-month range calendar. First click sets the start; hovering
// after that previews the range (connected band); the second click sets the end
// and closes. A "No dates decided yet?" button reveals quick trip-length presets
// that fill in example dates.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/data/dateUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fa6/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const PRESETS = [
    {
        label: "Σαββατοκύριακο",
        days: 2
    },
    {
        label: "1 ημέρα",
        days: 1
    },
    {
        label: "2 ημέρες",
        days: 2
    },
    {
        label: "3 ημέρες",
        days: 3
    },
    {
        label: "4 ημέρες",
        days: 4
    },
    {
        label: "5 ημέρες",
        days: 5
    }
];
function CalendarModal({ value, onChange, onClose, editing }) {
    _s();
    const today = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["startOfToday"])();
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "CalendarModal.useState": ()=>value.start ?? today
    }["CalendarModal.useState"]);
    const [hover, setHover] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showPresets, setShowPresets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const { start, end } = value;
    // While only the start is set, the hovered day acts as the provisional end so
    // the band previews the range under the cursor.
    const previewEnd = start && !end ? hover : end;
    const lo = start && previewEnd ? previewEnd < start ? previewEnd : start : null;
    const hi = start && previewEnd ? previewEnd < start ? start : previewEnd : null;
    function pick(day) {
        if (editing === "start") {
            // Keep the end only if it still comes after the new start.
            onChange({
                start: day,
                end: end && end >= day ? end : null
            });
            onClose?.();
            return;
        }
        if (editing === "end") {
            // No start yet → the tap sets it (an end alone isn't a range).
            if (!start) onChange({
                start: day,
                end: null
            });
            else if (day < start) onChange({
                start: day,
                end: start
            });
            else onChange({
                start,
                end: day
            });
            onClose?.();
            return;
        }
        if (!start || start && end) {
            onChange({
                start: day,
                end: null
            });
            return;
        }
        // start set, end not yet — this click completes the range.
        if (day < start) onChange({
            start: day,
            end: start
        });
        else onChange({
            start,
            end: day
        });
        onClose?.();
    }
    function applyPreset(days) {
        const sat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nextDow"])(today, 6); // upcoming Saturday — example dates
        const startDay = sat;
        const endDay = days === 1 ? sat : (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addDays"])(sat, days - 1);
        onChange({
            start: startDay,
            end: endDay
        });
        setView(startDay);
        onClose?.();
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full h-full p-3 sm:w-80",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mb-2 flex items-center justify-between",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "aria-label": "Προηγούμενος μήνας",
                        onClick: ()=>setView((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addMonths"])(view, -1)),
                        className: "rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-orange-50 hover:text-orange-600",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaChevronLeft"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/CalendarModal.tsx",
                            lineNumber: 101,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/CalendarModal.tsx",
                        lineNumber: 95,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-base font-semibold text-zinc-800 sm:text-sm",
                        children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthLabel"])(view)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/CalendarModal.tsx",
                        lineNumber: 103,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "aria-label": "Επόμενος μήνας",
                        onClick: ()=>setView((0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addMonths"])(view, 1)),
                        className: "rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-orange-50 hover:text-orange-600",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaChevronRight"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/CalendarModal.tsx",
                            lineNumber: 110,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/CalendarModal.tsx",
                        lineNumber: 104,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/CalendarModal.tsx",
                lineNumber: 94,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-7 text-center text-[11px] font-medium text-zinc-400",
                children: __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WEEKDAYS"].map((w)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "py-1",
                        children: w
                    }, w, false, {
                        fileName: "[project]/app/start/components/CalendarModal.tsx",
                        lineNumber: 116,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/start/components/CalendarModal.tsx",
                lineNumber: 114,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-7",
                onMouseLeave: ()=>setHover(null),
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["monthGrid"])(view).map((day, idx)=>{
                    if (!day) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {}, idx, false, {
                        fileName: "[project]/app/start/components/CalendarModal.tsx",
                        lineNumber: 124,
                        columnNumber: 28
                    }, this);
                    const past = day < today;
                    const inBand = !!lo && !!hi && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSameDay"])(lo, hi) && day >= lo && day <= hi;
                    const isSelected = !!start && (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSameDay"])(day, start) || !!end && (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSameDay"])(day, end);
                    const isPreviewEnd = !!start && !end && !!hover && (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSameDay"])(day, hover);
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: `flex justify-center ${inBand ? "bg-orange-100/70" : ""} ${inBand && !!lo && (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSameDay"])(day, lo) ? "rounded-l-full" : ""} ${inBand && !!hi && (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSameDay"])(day, hi) ? "rounded-r-full" : ""}`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            disabled: past,
                            onMouseEnter: ()=>!past && setHover(day),
                            onClick: ()=>!past && pick(day),
                            className: `my-0.5 flex h-11 w-11 max-w-full items-center justify-center rounded-full text-base transition-colors sm:h-9 sm:w-9 sm:text-sm ${past ? "cursor-default text-zinc-300" : "text-zinc-700"} ${isSelected ? "bg-orange-500 font-semibold text-white" : isPreviewEnd ? "bg-orange-200 text-orange-900" : !past ? "hover:bg-orange-200" : ""}`,
                            children: day.getDate()
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/CalendarModal.tsx",
                            lineNumber: 136,
                            columnNumber: 15
                        }, this)
                    }, idx, false, {
                        fileName: "[project]/app/start/components/CalendarModal.tsx",
                        lineNumber: 131,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/app/start/components/CalendarModal.tsx",
                lineNumber: 122,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/CalendarModal.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
_s(CalendarModal, "++Cq4+vYwyFXaoUbWdXDeWJuxHw=");
_c = CalendarModal;
var _c;
__turbopack_context__.k.register(_c, "CalendarModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/start/components/icons.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// -----------------------------------------------------------------------------
// Inline stroke icons (no icon library in the project — keep them local)
// -----------------------------------------------------------------------------
// Size/colour come from the caller via className (e.g. "h-5 w-5 text-zinc-400").
__turbopack_context__.s([
    "ArrowRightIcon",
    ()=>ArrowRightIcon,
    "CalendarIcon",
    ()=>CalendarIcon,
    "ChevronLeftIcon",
    ()=>ChevronLeftIcon,
    "ChevronRightIcon",
    ()=>ChevronRightIcon,
    "MapPinIcon",
    ()=>MapPinIcon,
    "MinusIcon",
    ()=>MinusIcon,
    "PlusIcon",
    ()=>PlusIcon,
    "SearchIcon",
    ()=>SearchIcon,
    "UserIcon",
    ()=>UserIcon,
    "UsersIcon",
    ()=>UsersIcon,
    "XIcon",
    ()=>XIcon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function Svg({ children, ...props }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        ...props,
        children: children
    }, void 0, false, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
_c = Svg;
const MapPinIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 27,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "10",
                r: "3"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 28,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 26,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c1 = MapPinIcon;
const CalendarIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: "3",
                y: "4.5",
                width: "18",
                height: "16",
                rx: "2.5"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 34,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M3 9h18M8 3v3M16 3v3"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 35,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 33,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c2 = CalendarIcon;
const UserIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M19 20v-1.5a5 5 0 0 0-5-5h-4a5 5 0 0 0-5 5V20"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 43,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "12",
                cy: "7",
                r: "3.6"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 44,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 42,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c3 = UserIcon;
const UsersIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M16 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 50,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "9",
                cy: "7",
                r: "3.2"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 51,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M22 19v-1.5a4 4 0 0 0-3-3.87M16 3.6a4 4 0 0 1 0 7.3"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 52,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 49,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c4 = UsersIcon;
const SearchIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                cx: "11",
                cy: "11",
                r: "7"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 58,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "m21 21-4.3-4.3"
            }, void 0, false, {
                fileName: "[project]/app/start/components/icons.tsx",
                lineNumber: 59,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 57,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c5 = SearchIcon;
const ArrowRightIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M5 12h14M13 6l6 6-6 6"
        }, void 0, false, {
            fileName: "[project]/app/start/components/icons.tsx",
            lineNumber: 65,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 64,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c6 = ArrowRightIcon;
const ChevronLeftIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "m15 6-6 6 6 6"
        }, void 0, false, {
            fileName: "[project]/app/start/components/icons.tsx",
            lineNumber: 71,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 70,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c7 = ChevronLeftIcon;
const ChevronRightIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "m9 6 6 6-6 6"
        }, void 0, false, {
            fileName: "[project]/app/start/components/icons.tsx",
            lineNumber: 77,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 76,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c8 = ChevronRightIcon;
const PlusIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M12 5v14M5 12h14"
        }, void 0, false, {
            fileName: "[project]/app/start/components/icons.tsx",
            lineNumber: 83,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 82,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c9 = PlusIcon;
const MinusIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M5 12h14"
        }, void 0, false, {
            fileName: "[project]/app/start/components/icons.tsx",
            lineNumber: 89,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 88,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c10 = MinusIcon;
const XIcon = (p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Svg, {
        ...p,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M6 6l12 12M18 6 6 18"
        }, void 0, false, {
            fileName: "[project]/app/start/components/icons.tsx",
            lineNumber: 95,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/app/start/components/icons.tsx",
        lineNumber: 94,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c11 = XIcon;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "Svg");
__turbopack_context__.k.register(_c1, "MapPinIcon");
__turbopack_context__.k.register(_c2, "CalendarIcon");
__turbopack_context__.k.register(_c3, "UserIcon");
__turbopack_context__.k.register(_c4, "UsersIcon");
__turbopack_context__.k.register(_c5, "SearchIcon");
__turbopack_context__.k.register(_c6, "ArrowRightIcon");
__turbopack_context__.k.register(_c7, "ChevronLeftIcon");
__turbopack_context__.k.register(_c8, "ChevronRightIcon");
__turbopack_context__.k.register(_c9, "PlusIcon");
__turbopack_context__.k.register(_c10, "MinusIcon");
__turbopack_context__.k.register(_c11, "XIcon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/start/components/TravelersModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TravelersModal",
    ()=>TravelersModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/components/icons.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/config.ts [app-client] (ecmascript)");
"use client";
;
;
;
const MAX = 9; // cap per group, booking-style
const CHILD_AGES = Array.from({
    length: 18
}, (_, i)=>i); // 0..17
function Stepper({ label, caption, value, min, onDec, onInc }) {
    const btn = "flex h-8 w-8 items-center justify-center rounded-full border border-orange-200 text-orange-600 transition-colors hover:bg-orange-50 disabled:cursor-default disabled:border-zinc-200 disabled:text-zinc-300";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center justify-between py-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-sm font-medium text-zinc-800",
                        children: label
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TravelersModal.tsx",
                        lineNumber: 34,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-xs text-zinc-400",
                        children: caption
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TravelersModal.tsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/TravelersModal.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "aria-label": `Λιγότεροι: ${label}`,
                        onClick: onDec,
                        disabled: value <= min,
                        className: btn,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MinusIcon"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/TravelersModal.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TravelersModal.tsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "w-5 text-center text-sm font-semibold text-zinc-800",
                        children: value
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TravelersModal.tsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "aria-label": `Περισσότεροι: ${label}`,
                        onClick: onInc,
                        disabled: value >= MAX,
                        className: btn,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PlusIcon"], {
                            className: "h-4 w-4"
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/TravelersModal.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TravelersModal.tsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/TravelersModal.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/TravelersModal.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_c = Stepper;
function TravelersModal({ value, onChange }) {
    const setAdults = (n)=>onChange({
            ...value,
            adults: n
        });
    const setChildren = (n)=>{
        const childAges = value.childAges.slice(0, n);
        while(childAges.length < n)childAges.push(null);
        onChange({
            ...value,
            children: n,
            childAges
        });
    };
    const setAge = (i, age)=>{
        const childAges = value.childAges.slice();
        childAges[i] = age;
        onChange({
            ...value,
            childAges
        });
    };
    // Simple mode: one "number of people" stepper. The count is stored as adults
    // (children = 0, no ages), so the rest of the app prices everyone as an adult.
    if (__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SIMPLE_TRAVELERS"]) {
        const setPeople = (n)=>onChange({
                adults: Math.max(1, n),
                children: 0,
                childAges: []
            });
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full p-4 sm:w-72",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stepper, {
                label: "Άτομα",
                caption: "Συνολικός αριθμός ατόμων",
                value: value.adults,
                min: 1,
                onDec: ()=>setPeople(value.adults - 1),
                onInc: ()=>setPeople(value.adults + 1)
            }, void 0, false, {
                fileName: "[project]/app/start/components/TravelersModal.tsx",
                lineNumber: 78,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/start/components/TravelersModal.tsx",
            lineNumber: 77,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full p-4 sm:w-72",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stepper, {
                label: "Ενήλικες",
                caption: "18 ετών και άνω",
                value: value.adults,
                min: 1,
                onDec: ()=>setAdults(value.adults - 1),
                onInc: ()=>setAdults(value.adults + 1)
            }, void 0, false, {
                fileName: "[project]/app/start/components/TravelersModal.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border-t border-black/5"
            }, void 0, false, {
                fileName: "[project]/app/start/components/TravelersModal.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Stepper, {
                label: "Παιδιά",
                caption: "0–17 ετών",
                value: value.children,
                min: 0,
                onDec: ()=>setChildren(value.children - 1),
                onInc: ()=>setChildren(value.children + 1)
            }, void 0, false, {
                fileName: "[project]/app/start/components/TravelersModal.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            value.children > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-2 border-t border-black/5 pt-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400",
                        children: "Ηλικία κάθε παιδιού"
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TravelersModal.tsx",
                        lineNumber: 112,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-wrap gap-2",
                        children: value.childAges.map((age, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                required: true,
                                "aria-label": `Ηλικία παιδιού ${i + 1}`,
                                value: age ?? "",
                                onChange: (e)=>setAge(i, Number(e.target.value)),
                                className: `w-16 rounded-lg border px-2 py-1.5 text-sm transition-colors ${age === null ? "border-orange-300 text-zinc-400" : "border-zinc-200 text-zinc-800"}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        value: "",
                                        disabled: true,
                                        children: "Ηλικία"
                                    }, void 0, false, {
                                        fileName: "[project]/app/start/components/TravelersModal.tsx",
                                        lineNumber: 129,
                                        columnNumber: 17
                                    }, this),
                                    CHILD_AGES.map((a)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                            value: a,
                                            children: a
                                        }, a, false, {
                                            fileName: "[project]/app/start/components/TravelersModal.tsx",
                                            lineNumber: 133,
                                            columnNumber: 19
                                        }, this))
                                ]
                            }, i, true, {
                                fileName: "[project]/app/start/components/TravelersModal.tsx",
                                lineNumber: 117,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TravelersModal.tsx",
                        lineNumber: 115,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/TravelersModal.tsx",
                lineNumber: 111,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/TravelersModal.tsx",
        lineNumber: 91,
        columnNumber: 5
    }, this);
}
_c1 = TravelersModal;
var _c, _c1;
__turbopack_context__.k.register(_c, "Stepper");
__turbopack_context__.k.register(_c1, "TravelersModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/start/components/Typewriter.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Typewriter",
    ()=>Typewriter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// Types `text` out one character at a time after an optional start delay, with
// a thin caret that blinks once typing finishes. Used for the search-field
// placeholders on the /start page.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function Typewriter({ text, speed = 40, startDelay = 0, className, onDone }) {
    _s();
    const [count, setCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Typewriter.useEffect": ()=>{
            let interval;
            const start = setTimeout({
                "Typewriter.useEffect.start": ()=>{
                    setCount(0); // (re)start typing — async, so no cascading render
                    interval = setInterval({
                        "Typewriter.useEffect.start": ()=>{
                            setCount({
                                "Typewriter.useEffect.start": (c)=>{
                                    if (c >= text.length) {
                                        clearInterval(interval);
                                        return c;
                                    }
                                    return c + 1;
                                }
                            }["Typewriter.useEffect.start"]);
                        }
                    }["Typewriter.useEffect.start"], speed);
                }
            }["Typewriter.useEffect.start"], startDelay);
            return ({
                "Typewriter.useEffect": ()=>{
                    clearTimeout(start);
                    clearInterval(interval);
                }
            })["Typewriter.useEffect"];
        }
    }["Typewriter.useEffect"], [
        text,
        speed,
        startDelay
    ]);
    const done = count >= text.length;
    // Notify the parent once typing is complete.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Typewriter.useEffect": ()=>{
            if (done) onDone?.();
        }
    }["Typewriter.useEffect"], [
        done,
        onDone
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: className,
        children: [
            text.slice(0, count),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "type-caret",
                "data-done": done,
                "aria-hidden": true
            }, void 0, false, {
                fileName: "[project]/app/start/components/Typewriter.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/Typewriter.tsx",
        lineNumber: 55,
        columnNumber: 5
    }, this);
}
_s(Typewriter, "MD2HH0EjGUMCoeKoB+fX0xWGIOA=");
_c = Typewriter;
var _c;
__turbopack_context__.k.register(_c, "Typewriter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/components/ui/StatusToast.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StatusToast",
    ()=>StatusToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/fa6/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const CONFIG = {
    info: {
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaCircleInfo"],
        title: "Καλό να το ξέρεις",
        badge: "bg-sky-50 text-sky-600 ring-sky-200"
    },
    success: {
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaCircleCheck"],
        title: "Όλα έτοιμα",
        badge: "bg-emerald-50 text-emerald-600 ring-emerald-200"
    },
    error: {
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaTriangleExclamation"],
        title: "Ωχ!",
        badge: "bg-orange-50 text-orange-600 ring-orange-200"
    }
};
const AUTO_DISMISS_MS = 3000;
const EXIT_MS = 300; // keep in sync with the slide-out animation duration
function StatusToast({ state, message, title, onClose }) {
    _s();
    const [leaving, setLeaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Auto-dismiss after a few seconds.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StatusToast.useEffect": ()=>{
            const t = setTimeout({
                "StatusToast.useEffect.t": ()=>setLeaving(true)
            }["StatusToast.useEffect.t"], AUTO_DISMISS_MS);
            return ({
                "StatusToast.useEffect": ()=>clearTimeout(t)
            })["StatusToast.useEffect"];
        }
    }["StatusToast.useEffect"], []);
    // Once the exit animation has played, unmount.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StatusToast.useEffect": ()=>{
            if (!leaving) return;
            const t = setTimeout(onClose, EXIT_MS);
            return ({
                "StatusToast.useEffect": ()=>clearTimeout(t)
            })["StatusToast.useEffect"];
        }
    }["StatusToast.useEffect"], [
        leaving,
        onClose
    ]);
    // Escape dismisses.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StatusToast.useEffect": ()=>{
            const onKey = {
                "StatusToast.useEffect.onKey": (e)=>{
                    if (e.key === "Escape") setLeaving(true);
                }
            }["StatusToast.useEffect.onKey"];
            window.addEventListener("keydown", onKey);
            return ({
                "StatusToast.useEffect": ()=>window.removeEventListener("keydown", onKey)
            })["StatusToast.useEffect"];
        }
    }["StatusToast.useEffect"], []);
    if (typeof document === "undefined") return null;
    const cfg = CONFIG[state];
    const Icon = cfg.Icon;
    // Enter: slide down (mobile) / in from the right (desktop). Leave: reverse.
    const anim = leaving ? "animate-toast-out-up sm:animate-toast-out-right" : "animate-slide-down sm:animate-slide-in-right";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"])(// Outer layer is click-through (no backdrop); only the card catches clicks.
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4 sm:inset-x-auto sm:right-4 sm:justify-end sm:px-0",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            role: "alert",
            className: `pointer-events-auto ${anim} flex w-full max-w-sm items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-2xl shadow-black/10 dark:border-white/10 dark:bg-zinc-900`,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: `flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 ${cfg.badge}`,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                        className: "h-5 w-5"
                    }, void 0, false, {
                        fileName: "[project]/app/components/ui/StatusToast.tsx",
                        lineNumber: 107,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/components/ui/StatusToast.tsx",
                    lineNumber: 104,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "min-w-0 flex-1 pt-0.5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-sm font-semibold text-zinc-800 dark:text-zinc-100",
                            children: title ?? cfg.title
                        }, void 0, false, {
                            fileName: "[project]/app/components/ui/StatusToast.tsx",
                            lineNumber: 110,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "mt-0.5 text-sm text-zinc-600 dark:text-zinc-300",
                            children: message
                        }, void 0, false, {
                            fileName: "[project]/app/components/ui/StatusToast.tsx",
                            lineNumber: 113,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/components/ui/StatusToast.tsx",
                    lineNumber: 109,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    onClick: ()=>setLeaving(true),
                    "aria-label": "Dismiss",
                    className: "-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-black/[.05] hover:text-zinc-700 dark:hover:bg-white/[.08] dark:hover:text-zinc-100",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$fa6$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FaXmark"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/app/components/ui/StatusToast.tsx",
                        lineNumber: 123,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/components/ui/StatusToast.tsx",
                    lineNumber: 117,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/components/ui/StatusToast.tsx",
            lineNumber: 100,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/components/ui/StatusToast.tsx",
        lineNumber: 99,
        columnNumber: 5
    }, this), document.body);
}
_s(StatusToast, "/jrKWAiqe5POcVhVHSIlHrreQv0=");
_c = StatusToast;
var _c;
__turbopack_context__.k.register(_c, "StatusToast");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/start/components/StartTripSearch.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StartTripSearch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// The search bar from the Penpot board: three inputs (destination, dates,
// travelers) of equal size with a Search button, each opening its own dropdown
// modal. Glassmorphism styling, white/orange accents. Standalone — "Search"
// only logs the current selection to the console.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$destinations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/app/start/data/destinations.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$core$2f$destinations$2e$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ActivityCombinations/core/destinations.data.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$palette$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/data/palette.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/data/dateUtils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$DestinationModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/components/DestinationModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$CalendarModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/components/CalendarModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$TravelersModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/components/TravelersModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$Typewriter$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/components/Typewriter.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$StatusToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/ui/StatusToast.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/config.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/components/icons.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
;
;
// Local date → "YYYY-MM-DD" (no timezone shift, unlike toISOString).
const toISODate = (d)=>`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function StartTripSearch({ // The hero backdrop shows photos of the chosen city's activities, so it needs
// to know which destination is selected (null = nothing picked yet).
onDestChange, playEntranceAnimations = true } = {}) {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [dest, setDest] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // The destination field starts as an animated typewriter placeholder, then
    // becomes a real writable input once the typing finishes. `destQuery` is the
    // free text the user types, which filters the destination dropdown.
    const [destTypingDone, setDestTypingDone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(!playEntranceAnimations);
    const [destQuery, setDestQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // Whether the destination dropdown is on its accommodation (address) step —
    // drives the mobile "pin to top of screen" positioning for the hotel picker.
    const [destAddressStep, setDestAddressStep] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [range, setRange] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        start: null,
        end: null
    });
    // Trip length in days — the PRIMARY way to set how long the trip is (#2). Free
    // typing, no upper limit enforced here (the planner caps it). Dates are now
    // OPTIONAL: a search needs a destination + EITHER a duration OR dates.
    const [durationDays, setDurationDays] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Which face of the combined length field is showing. Starts on the day count
    // (the primary length input); the calendar icon flips it to date-range mode.
    const [lengthMode, setLengthMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("days");
    const [travelers, setTravelers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        adults: 2,
        children: 0,
        childAges: []
    });
    const [searchIconAlert, setSearchIconAlert] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const searchIconAlertTimeout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    // The status toast (info/success/error) — currently used for the "fill in the
    // required fields" error when Search is pressed too early. `id` gives each
    // trigger a fresh key so the toast restarts its timer/animation.
    const [notice, setNotice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Returning from the plan page: it stores the last destination + trip length,
    // so restore them here to keep those values. Consumed once (removed on read),
    // so a fresh homepage visit — or arriving from anywhere else — is unaffected.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StartTripSearch.useEffect": ()=>{
            let raw = null;
            try {
                raw = sessionStorage.getItem("ttk:homeReturn");
                if (raw) sessionStorage.removeItem("ttk:homeReturn");
            } catch  {
                return;
            }
            if (!raw) return;
            try {
                const data = JSON.parse(raw);
                const d = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$core$2f$destinations$2e$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DESTINATIONS"].find({
                    "StartTripSearch.useEffect.d": (x)=>x.id === data.destinationId
                }["StartTripSearch.useEffect.d"]);
                // Hydrating from storage on mount must set state in the effect — doing it
                // during render would cause an SSR/CSR hydration mismatch.
                /* eslint-disable react-hooks/set-state-in-effect */ if (d && data.coords) {
                    setDest({
                        destinationId: d.id,
                        pointName: data.pointName || d.name,
                        coords: data.coords
                    });
                    setDestTypingDone(true);
                }
                if (typeof data.days === "number" && data.days >= 1) {
                    setDurationDays(data.days);
                    setLengthMode("days");
                }
            /* eslint-enable react-hooks/set-state-in-effect */ } catch  {
            // Malformed payload — ignore.
            }
        }
    }["StartTripSearch.useEffect"], []);
    // Close the open modal when clicking anywhere outside the bar. The mobile
    // full-screen pickers are PORTALED to <body> (outside rootRef), so taps
    // inside them must not count as "outside".
    const rootRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StartTripSearch.useEffect": ()=>{
            if (!open) return;
            function onDown(e) {
                const target = e.target;
                if (target.closest?.("[data-fullscreen-picker]")) return;
                if (rootRef.current && !rootRef.current.contains(target)) {
                    setOpen(null);
                }
            }
            document.addEventListener("mousedown", onDown);
            return ({
                "StartTripSearch.useEffect": ()=>document.removeEventListener("mousedown", onDown)
            })["StartTripSearch.useEffect"];
        }
    }["StartTripSearch.useEffect"], [
        open
    ]);
    // Bring the bar into view when a field opens. The page's scrollbar is left
    // alone on purpose — locking body overflow here made the scrollbar vanish
    // (and the layout jump) every time an input was focused.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StartTripSearch.useEffect": ()=>{
            if (!open) return;
            rootRef.current?.scrollIntoView({
                block: "center",
                behavior: "smooth"
            });
        }
    }["StartTripSearch.useEffect"], [
        open
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StartTripSearch.useEffect": ()=>{
            return ({
                "StartTripSearch.useEffect": ()=>{
                    if (searchIconAlertTimeout.current) {
                        clearTimeout(searchIconAlertTimeout.current);
                    }
                }
            })["StartTripSearch.useEffect"];
        }
    }["StartTripSearch.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StartTripSearch.useEffect": ()=>{
            if (playEntranceAnimations && !dest) {
                setDestTypingDone(false);
            }
        }
    }["StartTripSearch.useEffect"], [
        playEntranceAnimations,
        dest
    ]);
    // Flag on <body> while any input dropdown is open so the homepage hero's
    // scroll fade leaves the open modal fully opaque (it lives inside the faded
    // search block). Dispatch a scroll event so the hero re-applies immediately,
    // even if the user isn't actively scrolling.
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StartTripSearch.useEffect": ()=>{
            if (open) document.body.dataset.searchModalOpen = "1";
            else delete document.body.dataset.searchModalOpen;
            window.dispatchEvent(new Event("scroll"));
            return ({
                "StartTripSearch.useEffect": ()=>{
                    delete document.body.dataset.searchModalOpen;
                }
            })["StartTripSearch.useEffect"];
        }
    }["StartTripSearch.useEffect"], [
        open
    ]);
    // Let the hero backdrop follow the chosen city (see onDestChange prop).
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StartTripSearch.useEffect": ()=>{
            onDestChange?.(dest?.destinationId ?? null);
        }
    }["StartTripSearch.useEffect"], [
        dest,
        onDestChange
    ]);
    const destLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StartTripSearch.useMemo[destLabel]": ()=>{
            if (!dest) return null;
            const d = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$core$2f$destinations$2e$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DESTINATIONS"].find({
                "StartTripSearch.useMemo[destLabel].d": (x)=>x.id === dest.destinationId
            }["StartTripSearch.useMemo[destLabel].d"]);
            if (!d) return null;
            // Show "City · Start point" unless the point is just the city centre (whose
            // label is the city name), in which case show only the city.
            return dest.pointName && dest.pointName !== d.name ? `${d.name} · ${dest.pointName}` : d.name;
        }
    }["StartTripSearch.useMemo[destLabel]"], [
        dest
    ]);
    // A single chosen day (start only, or start === end) shows just that date —
    // not "Jun 7 — …" or "Jun 7 — Jun 7".
    const dateLabel = !range.start ? null : !range.end || (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isSameDay"])(range.start, range.end) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatShort"])(range.start) : `${(0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatShort"])(range.start)} — ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$dateUtils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatShort"])(range.end)}`;
    const travelersLabel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StartTripSearch.useMemo[travelersLabel]": ()=>{
            // Simple mode: just the head-count (stored as adults).
            if (__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SIMPLE_TRAVELERS"]) {
                return `${travelers.adults} ${travelers.adults === 1 ? "άτομο" : "άτομα"}`;
            }
            const parts = [
                `${travelers.adults} ${travelers.adults === 1 ? "ενήλικας" : "ενήλικες"}`
            ];
            if (travelers.children > 0) {
                parts.push(`${travelers.children} ${travelers.children === 1 ? "παιδί" : "παιδιά"}`);
            }
            return parts.join(" · ");
        }
    }["StartTripSearch.useMemo[travelersLabel]"], [
        travelers
    ]);
    // Total people in the party — drives the one/two-person traveller icon.
    const travelerCount = travelers.adults + travelers.children;
    // Search is complete once: a destination, a length, and a valid party. The
    // length comes from whichever mode the combined field is in — a typed day count
    // ("days") OR a chosen start date ("dates"). (#2)
    const hasDuration = durationDays !== null && durationDays >= 1;
    const hasLength = lengthMode === "days" ? hasDuration : !!range.start;
    const canSearch = !!dest && hasLength && travelers.adults >= 1;
    const missingInputs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "StartTripSearch.useMemo[missingInputs]": ()=>{
            const missing = [];
            if (!dest) missing.push("προορισμό");
            if (!hasLength) missing.push(lengthMode === "days" ? "διάρκεια" : "ημερομηνίες");
            if (travelers.adults < 1) missing.push("ταξιδιώτες");
            return missing;
        }
    }["StartTripSearch.useMemo[missingInputs]"], [
        dest,
        hasLength,
        lengthMode,
        travelers.adults
    ]);
    // Hand the chosen destination/area/dates AND party to the main planner via query
    // params. The party (adults + each child's age) drives the planner's price totals
    // (see activityPrice / setActiveParty); ages go as a comma list, unset → 0.
    function handleSearch() {
        if (!canSearch) {
            setNotice({
                id: Date.now(),
                state: "error",
                message: `Συμπλήρωσε: ${missingInputs.join(", ")}.`
            });
            if (searchIconAlertTimeout.current) {
                clearTimeout(searchIconAlertTimeout.current);
            }
            setSearchIconAlert(true);
            searchIconAlertTimeout.current = setTimeout(()=>{
                setSearchIconAlert(false);
            }, 900);
            if (!dest) setOpen("dest");
            else if (!hasLength && lengthMode === "dates") setOpen("dates");
            else if (travelers.adults < 1) setOpen("travelers");
            return;
        }
        const params = new URLSearchParams();
        if (dest) {
            params.set("dest", dest.destinationId);
            // The personal start point: its coordinates + label (the plan anchors the
            // route here instead of a city area). See parseStartParams.
            params.set("slat", String(dest.coords.lat));
            params.set("slng", String(dest.coords.lng));
            params.set("sname", dest.pointName);
        }
        // Send only the active mode's length: a typed day count, or the picked dates.
        if (lengthMode === "days") {
            if (hasDuration) params.set("days", String(durationDays));
        } else {
            if (range.start) params.set("start", toISODate(range.start));
            if (range.end) params.set("end", toISODate(range.end));
        }
        params.set("adults", String(travelers.adults));
        if (travelers.children > 0) {
            params.set("ages", travelers.childAges.map((a)=>a ?? 0).join(","));
        }
        const qs = params.toString();
        router.push(qs ? `/plan?${qs}` : "/plan");
    }
    const toggle = (key)=>setOpen((o)=>o === key ? null : key);
    // The combined length field's calendar icon — the ONLY control that opens the
    // calendar and the toggle between the two faces:
    //   • days mode            → switch to dates mode AND open the calendar
    //   • dates mode, closed   → re-open the calendar (stay in dates mode)
    //   • dates mode, open     → flip back to the day-count input (close calendar)
    const onLengthIconClick = ()=>{
        if (lengthMode === "days") {
            setLengthMode("dates");
            setOpen("dates");
        } else if (open !== "dates") {
            setOpen("dates");
        } else {
            setLengthMode("days");
            setOpen(null);
        }
    };
    return(// `overflow-x-clip` keeps the soft decorative glow below (which spreads
    // `-inset-x-8` + blur past the bar) and the field entrance pops from bleeding
    // sideways and adding horizontal scroll on mobile. `clip` leaves vertical
    // overflow visible so the dropdowns (which open downward) still work.
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: rootRef,
        className: "relative overflow-x-clip",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "aria-hidden": true,
                className: "pointer-events-none absolute -inset-x-8 -inset-y-5 hidden rounded-[2rem] bg-gradient-to-r from-orange-300/30 via-pink-300/25 to-sky-300/25 blur-2xl sm:block"
            }, void 0, false, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 304,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `${playEntranceAnimations ? "animate-fade-in-up" : ""} relative grid grid-cols-1 items-center gap-2 sm:grid-cols-2 ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HIDE_TRAVELERS"] ? "lg:grid-cols-[minmax(0,19rem)_minmax(0,19rem)_auto] lg:justify-center" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"}`,
                style: {
                    animationDelay: "100ms"
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(DestField, {
                        active: open === "dest",
                        value: destLabel,
                        query: destQuery,
                        onQueryChange: (q)=>{
                            setDestQuery(q);
                            setOpen("dest");
                        },
                        playEntranceAnimations: playEntranceAnimations,
                        typingDone: destTypingDone,
                        onTypingDone: ()=>setDestTypingDone(true),
                        onOpen: ()=>setOpen("dest"),
                        onClear: dest || destQuery ? ()=>{
                            setDest(null);
                            setDestQuery("");
                        } : undefined,
                        children: open === "dest" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Dropdown, {
                            align: "left",
                            mobileTop: destAddressStep,
                            onClose: ()=>{
                                setOpen(null);
                                setDestAddressStep(false);
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$DestinationModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DestinationModal"], {
                                value: dest,
                                query: destQuery,
                                onStepChange: (step)=>setDestAddressStep(step === "address"),
                                onChooseDestination: (destinationId)=>{
                                    const d = __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ActivityCombinations$2f$core$2f$destinations$2e$data$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DESTINATIONS"].find((x)=>x.id === destinationId);
                                    if (!d) return;
                                    // Default the start point to the city centre; the dropdown
                                    // stays open so the address/hotel step can refine it.
                                    setDest({
                                        destinationId,
                                        pointName: d.name,
                                        coords: d.center
                                    });
                                    setDestQuery("");
                                },
                                onChoosePoint: (destinationId, point)=>{
                                    setDest({
                                        destinationId,
                                        pointName: point.name,
                                        coords: point.coords
                                    });
                                    setDestQuery("");
                                    setOpen(null);
                                    setDestAddressStep(false);
                                }
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                                lineNumber: 346,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/StartTripSearch.tsx",
                            lineNumber: 338,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 316,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TripLengthField, {
                        mode: lengthMode,
                        calendarOpen: open === "dates",
                        onIconClick: onLengthIconClick,
                        onOpenCalendar: ()=>setOpen("dates"),
                        days: durationDays,
                        onDaysChange: setDurationDays,
                        dateLabel: dateLabel,
                        playEntranceAnimations: playEntranceAnimations,
                        onClearDays: durationDays !== null ? ()=>setDurationDays(null) : undefined,
                        onClearDates: range.start ? ()=>setRange({
                                start: null,
                                end: null
                            }) : undefined,
                        children: open === "dates" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Dropdown, {
                            align: "center",
                            onClose: ()=>setOpen(null),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$CalendarModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CalendarModal"], {
                                value: range,
                                onChange: setRange,
                                onClose: ()=>setOpen(null)
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                                lineNumber: 387,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/StartTripSearch.tsx",
                            lineNumber: 386,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 373,
                        columnNumber: 9
                    }, this),
                    !__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HIDE_TRAVELERS"] && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Field, {
                        active: open === "travelers",
                        icon: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(TravelersIcon, {
                            multiple: travelerCount > 1
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/StartTripSearch.tsx",
                            lineNumber: 399,
                            columnNumber: 19
                        }, this),
                        placeholder: "Ταξιδιώτες",
                        value: travelersLabel,
                        iconDelay: 580,
                        playEntranceAnimations: playEntranceAnimations,
                        onClick: ()=>toggle("travelers"),
                        children: open === "travelers" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Dropdown, {
                            align: "right",
                            onClose: ()=>setOpen(null),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$TravelersModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TravelersModal"], {
                                value: travelers,
                                onChange: setTravelers
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                                lineNumber: 408,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/StartTripSearch.tsx",
                            lineNumber: 407,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 397,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: handleSearch,
                        // Stable hook for the reel generator (see reels/README.md) — inert.
                        "data-reel": "search",
                        "aria-disabled": !canSearch,
                        title: canSearch ? undefined : "Αναζήτηση",
                        className: `group flex w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium lg:w-auto ${__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$palette$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["homeStyles"].primaryButton}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: `${playEntranceAnimations ? "animate-icon-pop" : ""} inline-flex shrink-0`,
                                style: {
                                    animationDelay: "670ms"
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SearchIcon"], {
                                    className: `h-5 w-5 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-rotate-12 ${searchIconAlert ? "animate-bounce" : ""}`
                                }, void 0, false, {
                                    fileName: "[project]/app/start/components/StartTripSearch.tsx",
                                    lineNumber: 430,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                                lineNumber: 426,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "Αναζήτηση"
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                                lineNumber: 435,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 417,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 308,
                columnNumber: 7
            }, this),
            notice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$ui$2f$StatusToast$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["StatusToast"], {
                state: notice.state,
                message: notice.message,
                onClose: ()=>setNotice(null)
            }, notice.id, false, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 440,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/StartTripSearch.tsx",
        lineNumber: 301,
        columnNumber: 5
    }, this));
}
_s(StartTripSearch, "ZefPdNF+iDlY0SJifrP4icfFm4U=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = StartTripSearch;
// One input field: an icon, the value (or placeholder), a hover-revealed clear
// button, and its dropdown modal (passed as children). Used for dates/travelers;
// the destination field is the richer DestField below.
function Field({ active, icon, placeholder, value, onClick, onClear, children, iconDelay = 0, playEntranceAnimations, muted = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "group relative min-w-0 flex-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: onClick,
                className: `flex w-full cursor-pointer items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 text-left transition-colors ${active ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$palette$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["homeStyles"].fieldActive : __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$palette$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["homeStyles"].fieldIdle}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `${playEntranceAnimations ? "animate-icon-pop" : ""} inline-flex shrink-0 text-zinc-400 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-translate-y-0.5`,
                        style: {
                            animationDelay: `${iconDelay}ms`
                        },
                        children: icon
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 487,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `flex-1 truncate text-sm ${value && !muted ? "text-zinc-800" : "text-zinc-400"} ${onClear ? "pr-6" : ""}`,
                        children: value ? value : placeholder
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 493,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 481,
                columnNumber: 7
            }, this),
            onClear && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                "aria-label": "Καθαρισμός",
                onClick: onClear,
                className: "absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full p-0.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500 group-hover:block",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["XIcon"], {
                    className: "h-4 w-4"
                }, void 0, false, {
                    fileName: "[project]/app/start/components/StartTripSearch.tsx",
                    lineNumber: 507,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 501,
                columnNumber: 9
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/StartTripSearch.tsx",
        lineNumber: 480,
        columnNumber: 5
    }, this);
}
_c1 = Field;
// The combined trip-length field (#2): one input that flips between a free-typed
// day count and a date range. The calendar ICON is the toggle AND the only opener
// of the calendar modal (clicking the field body never opens it). The calendar
// itself (passed in as `children`) is unchanged from before. Responsive: the icon
// + body sit on one row at every size, and the calendar uses the responsive
// Dropdown (a top overlay on mobile, an anchored panel on desktop).
function TripLengthField({ mode, calendarOpen, onIconClick, onOpenCalendar, days, onDaysChange, dateLabel, playEntranceAnimations, onClearDays, onClearDates, children }) {
    const showClear = mode === "days" ? !!onClearDays : !!onClearDates;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "group relative min-w-0 flex-1",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `flex w-full items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 transition-colors ${calendarOpen ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$palette$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["homeStyles"].fieldActive : __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$palette$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["homeStyles"].fieldIdle}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: onIconClick,
                        "aria-label": mode === "days" ? "Άλλαξε σε ημερομηνίες και άνοιξε ημερολόγιο" : "Άνοιξε ημερολόγιο ή άλλαξε σε διάρκεια",
                        title: mode === "days" ? "Διάλεξε ημερομηνίες" : "Διάλεξε διάρκεια σε μέρες",
                        className: `${playEntranceAnimations ? "animate-icon-pop" : ""} inline-flex shrink-0 cursor-pointer text-zinc-400 transition-transform duration-200 ease-out hover:text-orange-500 group-hover:scale-110 group-hover:-translate-y-0.5`,
                        style: {
                            animationDelay: "490ms"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CalendarIcon"], {
                            className: "h-5 w-5"
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/StartTripSearch.tsx",
                            lineNumber: 568,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 556,
                        columnNumber: 9
                    }, this),
                    mode === "days" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "number",
                        min: 1,
                        inputMode: "numeric",
                        value: days ?? "",
                        onChange: (e)=>{
                            const n = parseInt(e.target.value, 10);
                            onDaysChange(Number.isFinite(n) && n >= 1 ? n : null);
                        },
                        placeholder: "Διάρκεια (μέρες)",
                        "data-reel": "days",
                        size: 1,
                        className: `w-full min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${showClear ? "pr-6" : ""}`
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 572,
                        columnNumber: 11
                    }, this) : // Calendar mode: clicking the date display opens the calendar too (same
                    // as the icon). In days mode the body is the number input above, which
                    // never opens the calendar.
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: onOpenCalendar,
                        className: `flex-1 truncate text-left text-sm ${dateLabel ? "text-zinc-800" : "text-zinc-400"} ${showClear ? "pr-6" : ""}`,
                        children: dateLabel ?? "Από — Έως"
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 591,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 551,
                columnNumber: 7
            }, this),
            showClear && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                "aria-label": "Καθαρισμός",
                onClick: mode === "days" ? onClearDays : onClearDates,
                className: "absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full p-0.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500 group-hover:block",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["XIcon"], {
                    className: "h-4 w-4"
                }, void 0, false, {
                    fileName: "[project]/app/start/components/StartTripSearch.tsx",
                    lineNumber: 609,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 603,
                columnNumber: 9
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/StartTripSearch.tsx",
        lineNumber: 550,
        columnNumber: 5
    }, this);
}
_c2 = TripLengthField;
// The destination field: an animated typewriter placeholder that becomes a real
// writable text input once typing finishes. A selected destination shows as a
// (clickable) label; typing filters the dropdown via `onQueryChange`.
function DestField({ active, value, query, onQueryChange, playEntranceAnimations, typingDone, onTypingDone, onOpen, onClear, children }) {
    _s1();
    // Give the pin a little jump each time a place is freshly picked (null → set).
    const [jump, setJump] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const prevValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(value);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DestField.useEffect": ()=>{
            if (!prevValue.current && value) {
                setJump(true);
                const t = setTimeout({
                    "DestField.useEffect.t": ()=>setJump(false)
                }["DestField.useEffect.t"], 500);
                prevValue.current = value;
                return ({
                    "DestField.useEffect": ()=>clearTimeout(t)
                })["DestField.useEffect"];
            }
            prevValue.current = value;
        }
    }["DestField.useEffect"], [
        value
    ]);
    return(// `data-reel` marks the whole field so the reel generator can aim at it
    // regardless of which of the three faces below is showing.
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "group relative min-w-0 flex-1",
        "data-reel": "destination",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `flex w-full items-center gap-3 rounded-xl border border-zinc-300 px-4 py-3 transition-colors ${active ? __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$palette$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["homeStyles"].fieldActive : __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$data$2f$palette$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["homeStyles"].fieldIdle}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: `${playEntranceAnimations ? "animate-icon-pop" : ""} inline-flex shrink-0 text-zinc-400 transition-transform duration-200 ease-out group-hover:scale-110 group-hover:-translate-y-0.5`,
                        style: {
                            animationDelay: "400ms"
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: `inline-flex ${jump ? "animate-pin-jump" : ""}`,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapPinIcon"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                                lineNumber: 672,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/StartTripSearch.tsx",
                            lineNumber: 671,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 665,
                        columnNumber: 9
                    }, this),
                    value ? // A destination is chosen: show it as a clickable label.
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: onOpen,
                        className: `flex-1 truncate text-left text-sm text-zinc-800 ${onClear ? "pr-6" : ""}`,
                        children: value
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 678,
                        columnNumber: 11
                    }, this) : typingDone ? // Placeholder finished typing → a real, writable input.
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: query,
                        onChange: (e)=>onQueryChange(e.target.value),
                        onFocus: onOpen,
                        placeholder: "Αναζήτησε προορισμό",
                        "data-reel": "destination-input",
                        size: 1,
                        className: `w-full min-w-0 flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 ${onClear ? "pr-6" : ""}`
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 687,
                        columnNumber: 11
                    }, this) : // Still typing the placeholder out.
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        onClick: onOpen,
                        className: "flex-1 truncate text-left text-sm text-zinc-400",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$Typewriter$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Typewriter"], {
                            text: "Αναζήτησε προορισμό",
                            startDelay: 820,
                            onDone: onTypingDone
                        }, void 0, false, {
                            fileName: "[project]/app/start/components/StartTripSearch.tsx",
                            lineNumber: 705,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/StartTripSearch.tsx",
                        lineNumber: 700,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 661,
                columnNumber: 7
            }, this),
            onClear && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                "aria-label": "Καθαρισμός",
                onClick: onClear,
                className: "absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full p-0.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-500 group-hover:block",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["XIcon"], {
                    className: "h-4 w-4"
                }, void 0, false, {
                    fileName: "[project]/app/start/components/StartTripSearch.tsx",
                    lineNumber: 716,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 710,
                columnNumber: 9
            }, this),
            children
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/StartTripSearch.tsx",
        lineNumber: 660,
        columnNumber: 5
    }, this));
}
_s1(DestField, "JeAY02+A7iQ7p3b5bhgsGl6HKIg=");
_c3 = DestField;
// The glass dropdown panel. On desktop it's anchored under its field (`align`
// picks the side). On mobile it becomes a fixed, full-width overlay pinned near
// the top of the screen, over a dimmed tap-to-close backdrop.
function Dropdown({ align, onClose, mobileTop = false, children }) {
    const desktopPos = align === "left" ? "sm:left-0" : align === "right" ? "sm:right-0" : "sm:left-1/2 sm:-translate-x-1/2";
    // Mobile positioning: below the field by default, or pinned near the top of
    // the screen when mobileTop. Desktop always anchors below the field (the sm:
    // classes restore the absolute/anchored layout regardless).
    const mobilePos = mobileTop ? "fixed inset-x-2 top-2 mx-auto max-h-[calc(100vh-1rem)] max-w-[calc(100vw-1rem)]" : "absolute inset-x-0 top-full mx-auto max-h-[calc(100vh-6rem)] max-w-[calc(100vw-1rem)]";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-[90] bg-transparent sm:hidden",
                onClick: onClose
            }, void 0, false, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 756,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `animate-dropdown-pop z-[100] origin-top rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-orange-900/10 ${mobilePos} overflow-y-auto overflow-x-hidden sm:absolute sm:inset-x-auto sm:top-full sm:mx-0 sm:mt-2 sm:max-h-none sm:max-w-none sm:overflow-hidden ${desktopPos}`,
                children: children
            }, void 0, false, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 757,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_c4 = Dropdown;
// Travellers field icon: a single person when the party is one, crossfading into
// the two-person icon when it grows past one (and back again when it shrinks).
// The CSS transition plays in reverse for free when `multiple` flips back.
function TravelersIcon({ multiple }) {
    const base = "absolute inset-0 h-5 w-5 transition-all duration-300 ease-out";
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: "relative inline-flex h-5 w-5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UserIcon"], {
                className: `${base} ${multiple ? "scale-75 opacity-0" : "scale-100 opacity-100"}`
            }, void 0, false, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 773,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["UsersIcon"], {
                className: `${base} ${multiple ? "scale-100 opacity-100" : "scale-75 opacity-0"}`
            }, void 0, false, {
                fileName: "[project]/app/start/components/StartTripSearch.tsx",
                lineNumber: 776,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/StartTripSearch.tsx",
        lineNumber: 772,
        columnNumber: 5
    }, this);
}
_c5 = TravelersIcon;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "StartTripSearch");
__turbopack_context__.k.register(_c1, "Field");
__turbopack_context__.k.register(_c2, "TripLengthField");
__turbopack_context__.k.register(_c3, "DestField");
__turbopack_context__.k.register(_c4, "Dropdown");
__turbopack_context__.k.register(_c5, "TravelersIcon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/start/components/TripSearchHero.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TripSearchHero
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
// The trip-search landing hero (homepage `/`, also at `/start`).
//
// Background: one static full-bleed photo (`/homepage-hero.png`) with a light
// dark overlay. The image NEVER moves or scales on scroll (that drift used to
// leak horizontal overflow on mobile) — the only scroll effect is BLUR: a
// permanently-blurred copy sitting on top fades in via opacity as you scroll
// down (opacity-only → compositor-cheap, no transform → no x-overflow). The
// fixed layer is pinned to both edges and clips its own contents, so it can
// never widen the page.
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$StartTripSearch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/start/components/StartTripSearch.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const HERO_IMAGE = "/homepage-hero.png";
function TripSearchHero() {
    _s();
    // Decide ONCE, synchronously at mount, whether to play the entrance — so the
    // inputs render in their pre-pop (hidden) state on the very first paint and
    // animate in, instead of flashing fully-visible for a frame and THEN popping.
    // First load (flag unset, or SSR) animates; returning here later in the same
    // session (flag already set) shows them instantly with no animation.
    const [playEntranceAnimations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "TripSearchHero.useState": ()=>("TURBOPACK compile-time value", "object") === "undefined" || !window.__ttkHomeEntrancePlayed
    }["TripSearchHero.useState"]);
    // Scroll-driven styling (the carousel card drift + the background blur fade) is
    // written straight to the DOM from one rAF loop — NO React state — and eased
    // toward its target so coarse wheel steps glide smoothly. The background image
    // POSITION/SCALE is never touched (only the blurred copy's opacity), so nothing
    // here can move the image or add horizontal overflow.
    const carouselRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const bgBlurImgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripSearchHero.useEffect": ()=>{
            window.__ttkHomeEntrancePlayed = true;
        }
    }["TripSearchHero.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripSearchHero.useEffect": ()=>{
            let raf = 0;
            let current = window.scrollY; // the smoothed scroll position
            let target = window.scrollY;
            // Reduced-motion users get a fully static background (no blur fade either).
            const enableBlur = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const apply = {
                "TripSearchHero.useEffect.apply": ()=>{
                    // Background blur: the permanently-blurred copy fades in over ~400px of
                    // scroll (opacity only — no filter animation, no transform), so the photo
                    // "picks up blur" as you scroll down. Position/scale are never touched.
                    if (bgBlurImgRef.current) {
                        bgBlurImgRef.current.style.opacity = enableBlur ? String(Math.min(1, current / 400)) : "0";
                    }
                    // Carousel: 0 at top → 1 after ~70% of a viewport. The centered block
                    // drifts up faster than the page, shrinks and fades — "up and behind".
                    // At rest the styles are REMOVED: a transform here creates a stacking
                    // context that would trap the field dropdowns below Take-the-Kids/Footer
                    // (see the note on the section below).
                    const el = carouselRef.current;
                    if (el) {
                        // While an input dropdown is open (flagged on <body> by StartTripSearch),
                        // keep the search block fully opaque — the dropdowns are its children, so
                        // the scroll fade would otherwise dim the open modal too.
                        const modalOpen = document.body.dataset.searchModalOpen === "1";
                        const p = Math.min(1, Math.max(0, current / (window.innerHeight * 0.7)));
                        if (p < 0.001) {
                            el.style.transform = "";
                            el.style.opacity = "";
                            el.style.willChange = "";
                        } else {
                            el.style.transform = `translateY(${p * -70}px) scale(${1 - p * 0.18})`;
                            el.style.opacity = modalOpen ? "1" : String(1 - p * 0.6);
                            el.style.willChange = "transform";
                        }
                    }
                }
            }["TripSearchHero.useEffect.apply"];
            const tick = {
                "TripSearchHero.useEffect.tick": ()=>{
                    current += (target - current) * 0.18; // ease toward the real scroll
                    if (Math.abs(target - current) < 0.5) {
                        current = target;
                        apply();
                        raf = 0;
                        return; // settled — stop the loop until the next scroll
                    }
                    apply();
                    raf = requestAnimationFrame(tick);
                }
            }["TripSearchHero.useEffect.tick"];
            const onScroll = {
                "TripSearchHero.useEffect.onScroll": ()=>{
                    target = window.scrollY;
                    if (!raf) raf = requestAnimationFrame(tick);
                }
            }["TripSearchHero.useEffect.onScroll"];
            apply(); // initial paint (handles reload mid-page / scroll restoration)
            window.addEventListener("scroll", onScroll, {
                passive: true
            });
            window.addEventListener("resize", onScroll);
            return ({
                "TripSearchHero.useEffect": ()=>{
                    window.removeEventListener("scroll", onScroll);
                    window.removeEventListener("resize", onScroll);
                    if (raf) cancelAnimationFrame(raf);
                }
            })["TripSearchHero.useEffect"];
        }
    }["TripSearchHero.useEffect"], []);
    return(// No z-index on the section/content below: a positive z here would create a
    // stacking context that traps the field dropdowns beneath the z-30 Take-the-
    // Kids / Footer sections. Without it, each dropdown's own z-[100] reaches the
    // page's top stacking level and opens in front of everything.
    // `overflow-x-clip` (NOT hidden) gives the hero its own horizontal clip so
    // the scroll size-change effect, the entrance pop overshoot, and the blurred
    // decorative glow can bleed sideways WITHOUT ever widening the page / adding
    // mobile horizontal scroll. `clip` leaves vertical overflow visible, so the
    // field dropdowns (which open downward) are unaffected.
    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-x-clip bg-zinc-950 px-4 py-24",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-x-0 top-0 h-[100lvh] z-0 overflow-hidden max-w-full",
                "aria-hidden": true,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: HERO_IMAGE,
                        alt: "",
                        className: "absolute inset-0 h-full w-full object-cover object-top"
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TripSearchHero.tsx",
                        lineNumber: 132,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        ref: bgBlurImgRef,
                        src: HERO_IMAGE,
                        alt: "",
                        className: "absolute inset-0 h-full w-full object-cover object-top opacity-0 blur-md will-change-[opacity]"
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TripSearchHero.tsx",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 bg-black/35"
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TripSearchHero.tsx",
                        lineNumber: 148,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/TripSearchHero.tsx",
                lineNumber: 130,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                ref: carouselRef,
                className: "relative w-full max-w-3xl lg:max-w-4xl",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        "aria-hidden": true,
                        className: "pointer-events-none absolute -inset-x-6 -inset-y-6 hidden rounded-2xl bg-black/25 sm:block"
                    }, void 0, false, {
                        fileName: "[project]/app/start/components/TripSearchHero.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                className: "mb-8 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        // Inert hook for the reel generator: a natural "tap outside" target
                                        // for dismissing an open search dropdown (reels/README.md).
                                        "data-reel": "hero-title",
                                        className: "text-3xl font-semibold tracking-tight text-white drop-shadow-lg sm:text-4xl",
                                        children: "Οργανώσε το ταξίδι σου"
                                    }, void 0, false, {
                                        fileName: "[project]/app/start/components/TripSearchHero.tsx",
                                        lineNumber: 169,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: `${playEntranceAnimations ? "animate-pop-in" : ""} mt-2 text-zinc-100 drop-shadow`,
                                        style: {
                                            animationDelay: "60ms"
                                        },
                                        children: "Διάλεξε προορισμό, διάρκεια και Θα οργανώσουμε το ιδανικό πλάνο ταξιδιού!"
                                    }, void 0, false, {
                                        fileName: "[project]/app/start/components/TripSearchHero.tsx",
                                        lineNumber: 177,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/start/components/TripSearchHero.tsx",
                                lineNumber: 166,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$start$2f$components$2f$StartTripSearch$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                playEntranceAnimations: playEntranceAnimations
                            }, void 0, false, {
                                fileName: "[project]/app/start/components/TripSearchHero.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/start/components/TripSearchHero.tsx",
                        lineNumber: 165,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/start/components/TripSearchHero.tsx",
                lineNumber: 153,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/start/components/TripSearchHero.tsx",
        lineNumber: 124,
        columnNumber: 5
    }, this));
}
_s(TripSearchHero, "/9Derx8gkezg3cOI1ai3NFHH4a4=");
_c = TripSearchHero;
var _c;
__turbopack_context__.k.register(_c, "TripSearchHero");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_0cbuukf._.js.map