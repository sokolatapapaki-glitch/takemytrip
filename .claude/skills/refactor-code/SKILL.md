---
name: refactor-code
description: >-
  Refactor a codebase for readability and reuse WITHOUT changing behavior. Use when the user asks to
  "refactor", "clean up", "split big files", "extract reusable components/modules", "modularize", or
  "reorganize" code/files. Splits large files (>~500 lines) into a sibling subfolder with an index,
  extracts shared logic into reusable components (parameterized per call site), groups crowded folders
  (>6 files) into functional subfolders, and moves large literal objects/data into imported data files.
  Behavior preservation is the #1 priority.
---

# Refactor Code

Restructure code so it is easier for both Claude Code and humans to read and reuse, while keeping the
program's behavior **byte-for-byte identical**. This skill is a pure refactor — no features, no bug
fixes, no behavior changes.

## Priorities (in strict order — resolve every conflict in this order)

1. **Identical functionality (non‑negotiable).** The refactored code MUST do exactly what the original
   did — same inputs → same outputs, same side effects, same DOM/IO, same edge cases, same error
   behavior. If a "cleaner" structure would risk any behavior change, **keep the uglier version**.
2. **Readability & navigability** for Claude Code and humans: small focused files, clear names,
   predictable structure, an index per split module.
3. Reuse (DRY) — only when it does not violate (1) or hurt (2).

If two goals conflict, the lower-numbered one always wins.

## What to do

### 1. Extract reusable components → a dedicated folder
- Identify code repeated across the codebase (UI pieces, helpers, formatters, validators, repeated
  blocks). Extract each into its own file under a **dedicated reusables folder** — e.g.
  `components/` (UI) and/or `shared/` / `lib/` / `utils/` for non-UI logic. Match the project's
  existing language and conventions.
- **Parameterize, don't fork.** When different call sites differ slightly, add parameters/props/options
  so a SINGLE reusable serves every instance. Give parameters sensible defaults so existing call sites
  keep their exact current behavior.
- **Actually use them.** Replace every duplicated occurrence with a call to the reusable. Don't leave
  the old inline copies behind.
- Do NOT over-abstract: if something is used once and isn't a natural unit, leave it. A wrong/leaky
  abstraction is worse than duplication.

### 2. Split large files → sibling subfolder with an index
- Target files larger than **~500 lines** (use judgment — 520 is fine, 1,500 is not; don't split a
  450-line file just to hit a number).
- Create a subfolder **in the same directory as the original file**, named after the file
  (e.g. `script.js` → `script/`), and split the file into multiple cohesive files inside it, grouped
  by responsibility.
- Add an **index entry file** in that subfolder (`index.js` / `index.ts` / `__init__.py` / language
  equivalent) that re-exports / wires together the pieces, so the original import path still resolves
  to the same public surface.
- Keep the original file path working: either the index provides the same exports, or the original file
  becomes a thin re-export shim. **No caller should need to change.**

### 3. Tame crowded folders (>6 files) → functional subfolders
- When a folder ends up with **more than ~6 files**, consider grouping them into subfolders by
  functionality (e.g. `maps/`, `pricing/`, `ui/`). Only do this when there's a genuine functional
  grouping — don't create one-file folders or arbitrary buckets.
- Update imports/index files so nothing breaks.

### 4. Move large literal objects/data → external files + import
- Large inline literals (big config objects, lookup tables, constant data, static datasets) should be
  moved into their **own data file** and imported where used.
- Keep the data's shape and values **exactly** the same. This is a move, not an edit.

## Hard rules (do not break)

- **No behavior changes.** No renamed public APIs, changed signatures (beyond added optional params with
  behavior-preserving defaults), reordered side effects, altered timing, or "while I'm here" fixes. If
  you spot a real bug, note it for the user — do NOT fix it in this refactor.
- **Preserve the public surface / entry points.** Original import paths, exported names, global
  functions, HTML `<script>` hooks, and inline event handlers (`onclick=...`) must keep working.
- **Move, don't rewrite.** Prefer cut-and-paste of existing logic over re-implementing it. Keep comments
  (incl. non-English ones) attached to the code they describe.
- **One concern per file**, clear file/symbol names, consistent with existing style.

## Workflow

1. **Map first.** Read the target file(s) and list: duplicated blocks, large literals, and natural
   responsibility seams. Build a quick plan (proposed folders/files + what moves where). For a large
   effort, share the plan before mass edits.
2. **Capture a behavior baseline.** Find existing tests, a build, a lint, or a runnable entry point.
   If there are tests, run them now and record the result. If there are none, identify the cheapest way
   to observe behavior (build succeeds, app loads, key flow works) and note it.
3. **Refactor incrementally** in small, verifiable steps — one extraction or one split at a time.
   After each step, re-run the baseline (tests/build/load). Never batch many risky moves before checking.
4. **Verify equivalence at the end:**
   - Re-run all tests / build / lint — must match the pre-refactor result.
   - Confirm every original entry point and import path still resolves.
   - Grep to confirm old duplicated copies are gone and replaced by the reusable.
5. **Report** what moved where (a short tree), what reusables were created, and anything you
   deliberately left alone and why.

## Definition of done

- [ ] Behavior verified identical (tests/build/manual baseline match before & after)
- [ ] Duplicated logic replaced by parameterized reusables in a dedicated folder
- [ ] Files >~500 lines split into a sibling subfolder with a working index; original path still resolves
- [ ] Crowded folders (>6) grouped into functional subfolders where it makes sense
- [ ] Large literal objects/data moved to imported data files (values unchanged)
- [ ] No public API / entry point / import path broken
- [ ] Summary of changes provided to the user
