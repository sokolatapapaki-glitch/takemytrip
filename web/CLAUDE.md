@AGENTS.md

# Reusable Next.js + Prisma framework

This project is a reusable scaffold. Most code under `app/framework/` and `app/api/` is generic across projects.

## Where the docs live

Framework documentation lives in the **Obsidian vault**, accessed via the `obsidian-vault` MCP server. The full catalog is a single index note at the vault root.

**Before editing framework code, call:**

```
mcp__obsidian-vault__view(path="Index.md")
```

The Index has a routing table mapping common tasks to specific notes. **Read ONLY the notes it points to** for the current task. Do NOT load the whole catalog. Per-task context should rarely exceed Index + 2–3 small notes.

If the MCP server is not available (e.g. fresh clone on a machine without Obsidian + the `claude-code-mcp` plugin running), fall back to reading the source directly — the framework's structure is documented through naming conventions and the folder layout under `app/framework/` and `app/api/`.

## STOP — Protected paths (DO NOT EDIT unless the user explicitly asks)

The paths below are the **reusable framework subfolders, shared auth, and generic API infrastructure**. They are imported across every project that pulls this repo. A silent change here breaks every other consumer and erases the whole point of the scaffold.

**The rule is absolute:** treat these paths as read-only vendor code.

- **Do not** modify, refactor, rename, reformat, or "improve" any file inside them.
- **Do not** add new files inside them as a side effect of unrelated work.
- **Do not** assume "small cleanup" is allowed — it is not.
- If a task appears to require a change inside one of these paths, **STOP and ask the user first, naming the exact file and line**. In ~9 cases out of 10 the correct fix lives in per-project code, not here.
- The only exception is when the user *explicitly names* one of these paths and tells you to edit it. A general request like "fix the bug" is not permission.

### Protected paths

- `app/framework/data/**` — the entire reusable data library
- `app/framework/example/**` — the entire reusable example helper
- `app/framework/lib/**` — the entire reusable lib
- `app/framework/types/**` — the entire types index
- `app/framework/utils/**` — the entire utils folder
- `app/auth/**` — auth UI screens (sign-in, sign-up, password reset)
- `app/api/[model]/**` — generic CRUD endpoints driven by `resolveModel()`
- `app/api/auth/**` — NextAuth route handlers
- `app/api/images/**` — image upload + serve endpoints
- `app/api/lib/**` — shared API utilities (`resolveModel`, etc.)
- `app/api/prisma-fields/**` — schema introspection endpoint
- `app/api/session/**` — session endpoints

Reading these files to learn how to *call* them is expected and encouraged. Editing them silently is not.

## Where your changes go instead

- `app/config/fieldConfig.ts` — UI metadata for your models. **Edit freely.**
- `app/components/**` — project-specific components.
- `app/page.tsx` and any new routes under `app/**` (outside the protected paths above).
- `prisma/schema.prisma` — when adding project models (then follow "Adding a new Prisma model" below).
- The demo models in `prisma/schema.prisma` (`Product`, `ProductChild`, `TestTable`, `ManyOne`, `ManyTwo`) and the matching `app/components/**` are **examples** — safe to delete in a new project.

## Adding a new Prisma model

1. Add the `model` block in `prisma/schema.prisma`
2. Register it in `app/api/lib/models.ts` so `resolveModel()` accepts it
3. Add UI metadata in `app/config/fieldConfig.ts` (labels, options, `relationType`)
4. Add a brief note at `Project/Models/<Name>.md` in the Obsidian vault via `mcp__obsidian-vault__create` (NOT `Prisma Models/` — that folder is framework-only; see the `sync-obsidian-project-notes` skill)
5. Run `npm run prisma` (migrate + generate + type-sync)

No new API routes needed — `[model]/*` handles it.
