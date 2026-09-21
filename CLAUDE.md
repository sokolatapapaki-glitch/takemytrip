@AGENTS.md

You are a senior dev helping me code a planner for travel activities website. Ask me for everything you dont understand of my prompts.
for styling is use the 60/30/10 rule for colors. 60 is white, 30 is green and 10 is orange. orange in the buttons (underline and primary buttons) , 
i want other elements i will have the tailwind green-500 color. the orange is orange-500

## Button styles (named)

I have four named button styles. **The single source of truth is `app/components/ui/buttonStyles.ts`** — read that file to learn the exact classes for each. When I ask for one of these by name (e.g. "add a common button", "make this a secondary button"), DO NOT copy Tailwind classes; import the matching key from that file and append only per-use layout (width, icon gaps, `shrink-0`, `self-start`, etc.):

```tsx
import { buttonStyles } from "@/app/components/ui/buttonStyles";
// …
<button className={buttonStyles.common}>Cancel</button>
<button className={`inline-flex items-center gap-1.5 ${buttonStyles.underline}`}>Hide</button>
```

The keys map to the names:

| I say… | key | reference button |
|---|---|---|
| **underline button** | `buttonStyles.underline` | "Reset" — orange text, animated left→right underline on hover, no box |
| **secondary button** | `buttonStyles.secondary` | "Save trip" — green→emerald gradient pill |
| **common button** | `buttonStyles.common` | "Cancel" — black text, gray bg only on hover, rounded-xl |
| **primary button** | `buttonStyles.primary` | "Search" — homepage coral→pink CTA gradient |

The live reference implementation is the button row at the top of the plan page in `app/components/ActivityCombinations/index.tsx`. The primary button's gradient itself lives in `homeStyles.primaryButton` (`app/start/data/palette.ts`) and is composed into `buttonStyles.primary`. If I ask to change a button's look, edit `buttonStyles.ts` (or palette for the primary gradient) — never hand-edit individual call sites.