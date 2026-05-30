# Project Dependencies

All versions are taken directly from `package.json`. A `^` prefix means npm will accept any compatible minor/patch update; a bare version (e.g. `16.2.4`) is pinned exactly.

---

## Runtime Dependencies

These are shipped in the production build.

| Package | Version | What it does |
|---|---|---|
| `next` | `16.2.4` (pinned) | The React framework — handles routing, SSR/SSG, API routes, image optimization, and the dev server |
| `react` | `19.2.4` (pinned) | Core React library — the component model |
| `react-dom` | `19.2.4` (pinned) | Renders React components to the DOM |
| `next-auth` | `^4.24.14` | Authentication — sessions, OAuth providers (Google), credentials login, JWT/session strategy |
| `@next-auth/prisma-adapter` | `^1.0.7` | Bridges NextAuth with Prisma so user/session/account records are stored in your database |
| `@prisma/client` | `^4.16.2` | Auto-generated type-safe database client — the runtime half of Prisma |
| `next-themes` | `^0.4.6` | Theme switching (`ThemeProvider`, `useTheme`) — manages the `class` attribute on `<html>` for CSS-variable-based themes |
| `@hello-pangea/dnd` | `^18.0.1` | Drag-and-drop for lists and grids (a maintained fork of `react-beautiful-dnd`) |
| `lucide-react` | `^1.14.0` | SVG icon library — clean, consistent stroke icons as React components |
| `react-icons` | `^5.6.0` | Large multi-set icon library (Font Awesome, Material, Bootstrap, etc.) as React components |
| `bcryptjs` | `^3.0.3` | Password hashing and comparison for the credentials auth provider |
| `mailgen` | `^2.0.34` | Generates HTML/plain-text transactional email bodies from a JSON template |
| `resend` | `^6.12.2` | Email sending API client — used to dispatch emails via the Resend service |

---

## Dev Dependencies

These are only used during development and the build step — not shipped to production.

| Package | Version | What it does |
|---|---|---|
| `prisma` | `^4.16.2` | Prisma CLI — runs migrations, generates the client, and introspects the database |
| `tailwindcss` | `^4` | Utility-first CSS framework (v4 — config-light, PostCSS-based) |
| `@tailwindcss/postcss` | `^4` | PostCSS plugin that processes Tailwind v4 directives (`@import "tailwindcss"`) |
| `lightningcss` | `^1.29.0` | High-performance CSS minifier/transformer used by Tailwind v4 internally |
| `typescript` | `^5` | TypeScript compiler — type-checks the codebase |
| `@types/node` | `^20` | TypeScript type definitions for Node.js built-ins |
| `@types/react` | `^19.2.14` | TypeScript type definitions for React |
| `@types/react-dom` | `^19.2.3` | TypeScript type definitions for React DOM |
| `eslint` | `^9` | JavaScript/TypeScript linter |
| `eslint-config-next` | `16.2.4` (pinned) | ESLint rule preset maintained by the Next.js team |

---

## What to Do After `git pull` / Cloning to a New Folder

### 1. Install all packages
```bash
npm install
```
This installs every dependency listed above. Nothing else is pre-installed — `node_modules/` is gitignored.

### 2. Create a `.env` file
The `.env` file is **not committed to git**. You must create it manually in the project root (`my-nextjs-app/.env`) with the following keys:

```env
# MySQL / PostgreSQL connection string (Railway, PlanetScale, local, etc.)
DATABASE_URL="mysql://user:password@host:port/database"

# The public URL of your app (used in emails and OAuth redirects)
DOMAIN="http://localhost:3000"

# Google OAuth — create credentials at console.cloud.google.com
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# NextAuth secret — any long random string (generate with: openssl rand -hex 32)
NEXTAUTH_SECRET="..."

# Resend API key — from resend.com dashboard
RESEND_API_KEY="..."
```

> **Important:** Never commit real credentials to git. The current `.env` in the repo contains live database and API keys — rotate them if the repo is or ever becomes public.

### 3. Generate the Prisma client
```bash
npx prisma generate
```
This reads `prisma/schema.prisma` and generates the typed `@prisma/client` for your database schema. Must be run once after `npm install` and again any time the schema changes.

### 4. Run database migrations (if the target database is new/empty)
```bash
npx prisma migrate dev
```
Applies all pending SQL migrations to the database pointed to by `DATABASE_URL`.

### 5. Start the dev server
```bash
npm run dev
```

---

## Node.js Version

No `.nvmrc` or `engines` field is specified in `package.json`. React 19 and Next.js 16 require **Node.js 18.18 or newer**. Node 20 LTS is the safe choice.
