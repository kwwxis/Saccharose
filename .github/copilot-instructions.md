# Copilot Instructions for Saccharose.wiki

## What this project is
Saccharose.wiki is a web app (Node/Express backend) that generates wikitext for editors of the Genshin Impact
Fandom Wiki, and also supports data tools for HSR, Zenless Zone Zero, and Wuthering Waves. It parses and renders
game data (Excel/ExcelBinOutput, TextMaps, readables, subtitles, voice lines, etc.) extracted from these gacha
games.

## Tech stack
- **Language**: TypeScript everywhere (ESM, `"type": "module"` in package.json). Node 24, npm 11.
- **Backend**: Express 5, Knex (PostgreSQL), Passport (Discord OAuth), WebSockets (`ws`).
- **Server-side rendering**: Vue 3 is used *only* on the backend, for server-side rendering of page markup via
  `@vue/server-renderer`'s `renderToString` (see `src/backend/rendering/mainRenderer.ts`). There is **no client-side
  hydration** — Vue components (`.vue` files under `src/backend/components`) render to static HTML once on the
  server, and the client receives plain HTML with no Vue runtime attached to it.
- **Frontend (`src/frontend`)**: Plain/vanilla TypeScript, not a Vue app and not an SPA. Pages use a
  `pageMatch(name, callback)` helper (`src/frontend/core/pageMatch.ts`) that checks a `<meta name="view-stack">` tag
  (listing which server-rendered views/components are present on the page) or the `<body>` class, and only then runs
  the callback — i.e. progressive enhancement bolted onto server-rendered HTML, not a rendering framework. Frontend
  code talks to the backend via JSON API endpoints (see `src/frontend/core/endpoints.ts` and per-game `api` routers).
- **Build**: `ts-node` (swc transpiler) builds the backend; Rspack bundles the frontend TS (and the CSS/SCSS).
  `.loaderrc.js` provides a custom ESM loader so `ts-node` can load `.vue` SFCs (transpiled as TS) on the backend.
- **Tests**: Jest with `@swc/jest` transform (see `jest.config.cjs`); test files live under `/test`, mirroring
  `frontend`/`shared` source subfolders.

## Source layout
- `/src/backend` — Express app (`app.ts`, `server.ts`), `controllers` (split into `api` routers returning JSON and
  `app` routers returning rendered HTML, both further split per game: `genshin`, `hsr`, `zenless`, `wuwa`, plus
  `generic`/`site`/`visitor`), `components` (`.vue` SSR-only components, also organized per game), `domain` (business
  logic per game, under `domain/<game>`), `importer` (scripts to import/normalize external game data dumps),
  `rendering` (the SSR pipeline described above), `mediawiki` (wiki API client/helpers), `discordbot`.
- `/src/frontend` — vanilla TS entry points organized under `pages/<game>/...`, wired together by `index.ts`; plus
  shared `core` utilities (page matching, endpoints, event bus) and `css`.
- `/src/shared` — code shared between frontend and backend (e.g. `mediawiki` parsing, generic util/types). **Do
  not** let `src/frontend` and `src/backend` import from each other directly — shared code must go through
  `src/shared`.
- `/src/pipeline` — build pipeline scripts (`backend:build` runs `src/pipeline/build.ts`).
- `/test` — Jest tests plus test resources/spec utilities.

## Conventions
- Code is organized **per game** (genshin/hsr/zenless/wuwa) with parallel folder structures across controllers
  (`api` and `app`), `components`, `domain`, and frontend `pages` — when adding a feature for one game, check if
  equivalent games need the same treatment, but don't assume every game has every feature (e.g. GCG/TCG tooling is
  Genshin-only).
- Prettier config: 120 print width, single quotes, semicolons, es5 trailing commas (`.prettierrc`).
- TS config: strict mode on but `strictNullChecks`/`strictPropertyInitialization` disabled, decorators enabled,
  `baseUrl` is `./src`.
- `.env` drives configuration (data root paths like `GENSHIN_DATA_ROOT`, `HSR_DATA_ROOT`, `ZENLESS_DATA_ROOT`, SSL,
  ports, shell path). Game data (ExcelBinOutput, TextMap, Readable, etc.) is NOT checked into the repo and must be
  imported via scripts in `src/backend/importer` before most backend features will work locally.
- Bash is a hard requirement even on Windows (`SHELL_PATH`/`SHELL_EXEC` in `.env`) because the app shells out to
  `grep` for some search tooling.

## Build/run commands
- `npm run build:dev` / `npm run build:prod` — build both backend and frontend.
- `npm run backend:build` — backend only (via ts-node + swc transpiler).
- `npm run rspack:dev` / `npm run rspack:prod` — frontend only.
- `npm run ts-serve:dev` — live-reloading backend dev server (nodemon).
- `npm run rspack:dev:watch` — live-reloading frontend build.
- `npm start` — run built app (`node .` → `dist/backend/server.js`).
- `npm test` — run Jest tests.

## When making changes
- Prefer editing existing per-game modules over introducing cross-game special casing.
- When changing shared logic, verify it doesn't assume one specific game's data shape.
- Don't introduce client-side Vue usage or assume hydration exists — keep new interactive frontend behavior as
  vanilla TS wired through `pageMatch`/endpoints, consistent with the rest of `src/frontend`.
- Game data importing/setup is heavy (Postgres, Python deps, external data folders) — don't assume these are
  available in the sandbox; many backend features can't be exercised end-to-end without real game data.
