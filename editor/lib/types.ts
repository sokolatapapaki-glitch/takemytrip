export type Restaurant = {
  name: string;
  description: string;
  map_url?: string | null;
};

// One day's opening window, in decimal hours (9.5 = 09:30). null = closed.
export type DayHours = { open: number; close: number } | null;
// 7 days, Monday first. The legacy single window (same every day) is still read
// but never written. See README "Data contract".
export type OpeningHours = DayHours[];
export type LegacyOpeningHours = { open: number; close: number };

// Same shape as my-nextjs-app/public/destinations/<city>/_credits.json.
export type Credit = {
  source: string; // "Wikimedia Commons", "Unsplash", …
  file?: string;
  photoUrl: string; // the photo's page at the source
  author: string;
  license: string; // "CC BY-SA 4.0"
  licenseUrl: string;
  attributionRequired: boolean;
};

// A local /public path (string) or a remote image with its credit. A remote image
// without a complete credit is saved but never shown by the planner.
export type EditorImage = string | { url: string; credit?: Credit };

export type Vibes = { cultural: number; foodie: number; adventurous: number; relaxing: number };

export type EditorActivity = {
  id: number | null;
  name: string;
  description: string;
  category: string;
  prices?: Record<string, number>;
  family_prices?: Record<string, number>;
  location?: { lat: number; lng: number };
  website?: string | null;
  notes?: string[];
  tags?: string[];
  duration_hours?: number;
  best_time?: string | null;
  emoji?: string | null;
  restaurant?: Restaurant | null;
  cafe?: Restaurant | null;
  top?: boolean;
  // Local /public paths or credited remote images. The planner shows them ahead
  // of its auto-fetched photos (looked up by "<city>:<id>").
  images?: EditorImage[];
  // Optional overrides — absent means "derive from the category" (README "Data contract"):
  archived?: boolean;
  priority?: number;
  vibes?: Vibes;
  opening_hours?: OpeningHours | LegacyOpeningHours | null;
};

export type CityFile = {
  city: string;
  country?: string;
  currency?: string;
  emoji?: string;
  pricing_model?: string;
  description?: string;
  location?: { lat: number; lng: number };
  activities: EditorActivity[];
};
