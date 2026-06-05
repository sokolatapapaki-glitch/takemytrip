// A LARGE, realistic activity catalogue (50 Rome-area activities) used to stress
// the trip planner with "more activities" than the 13-item production catalogue.
// Coordinates are clustered into real districts (Ancient Rome, Centro Storico,
// Vatican, Trastevere, Villa Borghese/north, Testaccio/south, EUR) so route
// directness is MEANINGFUL — grouping activities from one district yields a
// straight route, spreading across the map does not. Opening hours vary (all-day
// monuments, weekday-only markets, evening-only bars, one-session classes, a
// closed day here and there), and a handful of midday-open foodie spots are
// flagged `is_lunch`. Pure data — no test-framework imports — so any test can use it.
import type { Activity, DayHours } from "../activities.functions";

const at = (open: number, close: number): DayHours => ({ open, close });
const CLOSED: DayHours = { open: 0, close: 0 };
const ALL_DAY: DayHours = { open: 0, close: 24 };
const every = (h: DayHours): DayHours[] => Array<DayHours>(7).fill(h);
// Mon–Sat one window, Sunday another (often shorter or closed).
const wkSun = (w: DayHours, sun: DayHours): DayHours[] => [w, w, w, w, w, w, sun];
// Closed on one weekday (0=Mon … 6=Sun), the given window every other day.
const closedOn = (day: number, h: DayHours): DayHours[] =>
  Array.from({ length: 7 }, (_, d) => (d === day ? CLOSED : h));

// vibes order: [cultural, foodie, adventurous, relaxing]
function mk(
  name: string,
  hours: number,
  cost: number,
  lat: number,
  lng: number,
  program: DayHours[],
  vibes: [number, number, number, number],
  is_lunch = false
): Activity {
  return {
    name,
    description: "",
    hours,
    cost,
    coords: { lat, lng },
    program,
    cultural: vibes[0],
    foodie: vibes[1],
    adventurous: vibes[2],
    relaxing: vibes[3],
    // Deterministic spread of tourist priority (0–10) so the big fixture exercises
    // the priority scoring too: name-hash into 2..10.
    priority: 2 + (Math.abs([...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)) % 9),
    ...(is_lunch ? { is_lunch: true } : {}),
  };
}

export const BIG_ACTIVITIES: Activity[] = [
  // --- Ancient Rome cluster (~41.890, 12.492) -------------------------------
  mk("Colosseum arena floor", 3, 24, 41.8902, 12.4922, every(at(8.5, 19)), [9, 0, 5, 1]),
  mk("Roman Forum walk", 2, 18, 41.8925, 12.4853, every(at(8.5, 19)), [9, 0, 3, 2]),
  mk("Palatine Hill ruins", 2, 18, 41.8894, 12.4875, every(at(8.5, 19)), [8, 0, 4, 3]),
  mk("Capitoline Museums", 3, 16, 41.8932, 12.4828, closedOn(0, at(9.5, 19.5)), [10, 0, 1, 2]),
  mk("Arch of Constantine", 1, 0, 41.8898, 12.4905, every(ALL_DAY), [6, 0, 1, 3]),
  mk("Domus Aurea tour", 2, 22, 41.8910, 12.4955, wkSun(at(9, 17), CLOSED), [9, 0, 5, 1]),
  mk("Circus Maximus stroll", 1, 0, 41.8866, 12.4856, every(ALL_DAY), [5, 0, 3, 6]),
  mk("Mamertine Prison", 1, 10, 41.8934, 12.4845, every(at(9, 17)), [7, 0, 2, 1]),

  // --- Centro Storico cluster (~41.900, 12.477) -----------------------------
  mk("Pantheon visit", 1, 5, 41.8986, 12.4769, wkSun(at(9, 19), at(9, 18)), [8, 0, 1, 4]),
  mk("Trevi Fountain", 1, 0, 41.9009, 12.4833, every(ALL_DAY), [5, 0, 1, 5]),
  mk("Piazza Navona", 1, 0, 41.8992, 12.4731, every(ALL_DAY), [6, 1, 1, 6]),
  mk("Spanish Steps", 1, 0, 41.9059, 12.4828, every(ALL_DAY), [5, 0, 2, 5]),
  mk("Campo de' Fiori market", 1, 0, 41.8956, 12.4722, wkSun(at(7, 14), CLOSED), [4, 8, 2, 5], true),
  mk("Gelato & espresso crawl", 1, 22, 41.9003, 12.4759, every(at(11, 23.5)), [2, 9, 1, 7], true),
  mk("Sant'Eustachio coffee bar", 1, 12, 41.8978, 12.4754, every(at(8, 21)), [2, 8, 1, 6], true),
  mk("Largo di Torre Argentina cats", 1, 0, 41.8957, 12.4768, every(at(12, 18)), [5, 0, 2, 7]),
  mk("Galleria Doria Pamphilj", 2, 14, 41.8975, 12.4810, every(at(9, 19)), [9, 0, 1, 3]),
  mk("Rooftop aperitivo (centro)", 2, 30, 41.9011, 12.4707, every(at(18, 24)), [1, 7, 2, 9]),
  mk("Evening pasta cooking class", 3, 60, 41.8965, 12.4742, every(at(18, 21)), [3, 10, 4, 4]),

  // --- Vatican cluster (~41.904, 12.455) ------------------------------------
  mk("Vatican Museums & Sistine Chapel", 4, 20, 41.9065, 12.4536, wkSun(at(9, 18), CLOSED), [10, 0, 2, 1]),
  mk("St. Peter's Basilica", 2, 0, 41.9022, 12.4539, every(at(7, 19)), [8, 0, 3, 3]),
  mk("St. Peter's dome climb", 1, 10, 41.9023, 12.4534, every(at(8, 18)), [6, 0, 7, 1]),
  mk("Castel Sant'Angelo", 2, 15, 41.9031, 12.4663, closedOn(0, at(9, 19)), [8, 0, 4, 2]),
  mk("Prati food walk", 2, 35, 41.9075, 12.4610, every(at(11, 15)), [3, 9, 3, 5], true),
  mk("Borgo artisan shops", 1, 0, 41.9027, 12.4600, wkSun(at(10, 19), CLOSED), [5, 2, 2, 6]),

  // --- Trastevere cluster (~41.889, 12.469) ---------------------------------
  mk("Trastevere food tour", 3, 55, 41.8893, 12.4699, closedOn(0, at(17, 21)), [4, 10, 3, 5], true),
  mk("Santa Maria in Trastevere", 1, 0, 41.8896, 12.4694, every(at(8, 20)), [8, 0, 1, 4]),
  mk("Botanical Garden stroll", 2, 8, 41.8907, 12.4640, closedOn(0, at(9, 18)), [4, 0, 3, 8]),
  mk("Gianicolo terrace viewpoint", 1, 0, 41.8918, 12.4615, every(ALL_DAY), [4, 0, 4, 7]),
  mk("Tiber Island walk", 1, 0, 41.8901, 12.4778, every(ALL_DAY), [5, 1, 2, 6]),
  mk("Trattoria long lunch", 2, 30, 41.8888, 12.4710, every(at(12, 15.5)), [2, 9, 1, 7], true),
  mk("Craft beer tasting", 2, 28, 41.8880, 12.4685, every(at(17, 24)), [1, 7, 3, 8]),

  // --- Villa Borghese / north cluster (~41.914, 12.492) ---------------------
  mk("Galleria Borghese", 2, 22, 41.9142, 12.4923, closedOn(0, at(9, 19)), [10, 0, 1, 3]),
  mk("Villa Borghese bike ride", 2, 12, 41.9145, 12.4880, closedOn(0, at(9, 19)), [2, 1, 8, 6]),
  mk("Pincio terrace sunset", 1, 0, 41.9110, 12.4790, every(ALL_DAY), [4, 0, 2, 8]),
  mk("Bioparco zoo", 3, 17, 41.9180, 12.4880, every(at(9.5, 18)), [3, 1, 6, 5]),
  mk("MAXXI modern art museum", 2, 12, 41.9286, 12.4665, closedOn(0, at(11, 19)), [9, 0, 2, 4]),
  mk("Piazza del Popolo", 1, 0, 41.9109, 12.4763, every(ALL_DAY), [6, 0, 2, 6]),
  mk("Villa Borghese boating", 1, 6, 41.9156, 12.4843, every(at(10, 18)), [1, 0, 5, 8]),

  // --- Testaccio / south cluster (~41.876, 12.475) --------------------------
  mk("Testaccio food market", 1, 0, 41.8757, 12.4752, wkSun(at(9, 15), CLOSED), [3, 9, 2, 5], true),
  mk("Pyramid of Cestius", 1, 6, 41.8762, 12.4795, wkSun(at(9, 13), CLOSED), [7, 0, 2, 2]),
  mk("Non-Catholic Cemetery", 1, 0, 41.8765, 12.4787, every(at(9, 17)), [7, 0, 1, 6]),
  mk("Monte Testaccio tour", 2, 14, 41.8742, 12.4752, closedOn(6, at(10, 16)), [8, 1, 4, 3]),
  mk("Centrale Montemartini museum", 2, 10, 41.8669, 12.4757, closedOn(0, at(9, 19)), [9, 0, 1, 3]),
  mk("Garbatella neighbourhood walk", 2, 0, 41.8636, 12.4842, every(ALL_DAY), [6, 2, 4, 6]),

  // --- EUR / far south cluster (~41.831, 12.469) ----------------------------
  mk("EUR Palazzo della Civiltà", 1, 0, 41.8327, 12.4665, every(ALL_DAY), [7, 0, 2, 4]),
  mk("EUR lake paddle boats", 1, 9, 41.8290, 12.4710, every(at(10, 18)), [1, 1, 6, 8]),
  mk("Museo della Civiltà Romana area", 2, 11, 41.8312, 12.4690, closedOn(0, at(9, 18)), [9, 0, 2, 3]),

  // --- A couple of always-available wellness / spa options ------------------
  mk("Terme spa & wellness", 3, 45, 41.8847, 12.4712, every(at(10, 22)), [0, 1, 1, 10]),
  mk("Riverside yoga session", 1, 18, 41.8930, 12.4720, every(at(7, 11)), [1, 0, 3, 9]),
];
