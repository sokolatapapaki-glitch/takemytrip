import type { IconType } from "react-icons";
import { FaCompass, FaLandmark, FaLeaf, FaUtensils } from "react-icons/fa6";
import type { VibeKey } from "@/app/components/ActivityCombinations/core/activities.functions";

// Icon per vibe (replaces the old emoji glyphs).
export const VIBE_ICONS: Record<VibeKey, IconType> = {
  cultural: FaLandmark,
  foodie: FaUtensils,
  adventurous: FaCompass,
  relaxing: FaLeaf,
};

// Bright, playful per-vibe gradients for the card image placeholders.
export const VIBE_GRADIENT: Record<VibeKey, string> = {
  cultural: "from-violet-500 via-fuchsia-400 to-indigo-500",
  foodie: "from-rose-500 via-orange-400 to-amber-400",
  adventurous: "from-amber-400 via-orange-500 to-rose-500",
  relaxing: "from-emerald-500 via-teal-400 to-cyan-400",
};
