# double's home

A local-first cyberpunk pixel-art Personal OS.

`double's home` is designed primarily as a private, single-user workspace. Its source code may be publicly visible, while personal records stay in the owner's browser. The project uses native JavaScript ES modules, HTML/CSS and a small local Node.js server. It does not require a paid AI API, cloud database, analytics, telemetry or public account system.

> **PUBLIC REPOSITORY DOES NOT MEAN THE OWNER'S LOCAL DATA IS PUBLIC.**
>
> This repository contains program code, project configuration and visual assets. It does not contain the owner's tasks, translations, research notes, diary, mood, finance records, focus history, private files or browser backups. GitHub is used for source-code version control only; it does not publish the locally running website instance.

## Current modules

- **CONTROL ROOM** — city overview, current tasks, thesis status, focus summary and weather.
- **RESEARCH LAB** — thesis progress, chapters, research tasks, theories, literature database and local file access.
- **TRAINING NETWORK** — free Portuguese RSS news, C1 vocabulary, translation practice and translation history.
- **FOCUS CHAMBER** — manual focus-session logging, task links, statistics and activity heatmap.
- **DATA VAULT** — local documents, tags, search and recent files.
- **LIFE LOG** — weather, mood, diary and finance records.
- **MISSION CONTROL** — task management, calendar, main/side/daily quests and local EXP progression.

COMMS/Outlook, Literature Mode, Speaking Lab and the old Pomodoro timer are not part of the current application.

## Requirements

- Node.js 22.14 or newer (Node.js 24 LTS recommended)
- pnpm

## Install and run

```sh
pnpm install
pnpm start
```

Open <http://127.0.0.1:8765/#home>.

Keep using `127.0.0.1` if that is where your existing data lives. `http://127.0.0.1:8765` and `http://localhost:8765` are different browser origins, so their localStorage and IndexedDB data are not shared automatically.

For a production-assets check:

```sh
pnpm build
SERVE_BUILD=1 pnpm start
```

On macOS, `start.command` or `启动工作台.command` starts the same local server.

## Quality checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm check` runs all four commands in order.

## Local data and privacy

The Git repository contains source code, UI code, visual assets, project configuration, tests and documentation. It does **not** automatically back up browser data such as:

- tasks and EXP;
- focus sessions;
- translation history and vocabulary;
- thesis and research notes;
- diary, mood and finance records;
- local Data Vault file handles.

The application intentionally retains the historical `bibaboo-v02` localStorage key and its existing IndexedDB database so upgrades do not disconnect current data. Do not rename storage keys merely to match the current brand.

Fresh clones start with empty task, focus, translation, research, diary, mood, finance and file collections. Any language-learning fallback text included in source is explicitly synthetic demo material, not a copy of the owner's records.

The first Mission Control migration creates a browser-side `bibaboo-v02-before-mission` backup. This backup remains in the browser and is not written into the repository.

## Free external data

- Weather uses Open-Meteo without a paid API key.
- Portuguese news uses official public RSS feeds from RTP and RR. The local app reads them through `/api/news`; GitHub Pages reads a static `data/news.json` snapshot generated during deployment.
- The local news cache is in server memory and disappears when the server restarts. The Pages workflow refreshes its public RSS snapshot every three hours and on each deployment.
- The application does not use OpenAI API, paid translation APIs or a paid news API.

RSS text is treated as untrusted data and rendered as plain text. Original articles open on the publisher's site; the application does not bypass paywalls or copy protected full articles.

## Configuration

The application works with the defaults in `.env.example`:

```dotenv
APP_ORIGIN=http://127.0.0.1:8765
# PORT=8765
```

Copy it to `.env` only when a local override is needed. `.env` is ignored by Git. Microsoft/Outlook credentials are not used by the current project.

## Visual assets

The current city, apartment and Mission/Focus backgrounds are formal project assets under `dist/assets/`. They are displayed directly by the current UI and should remain under version control. Font licensing information is included in `dist/assets/FONT-LICENSE.txt`.

The build process copies `dist/` to the ignored `build/` directory. `dist/` is the maintained frontend source, not generated output.

## GitHub Pages

The repository includes a GitHub Actions workflow that validates the project and deploys the generated `build/` directory. The Pages project URL is `https://double-gif.github.io/double-home/`; application assets and hash navigation use project-relative paths, while the local `http://127.0.0.1:8765` version keeps its existing behavior.

GitHub Pages is static hosting. CONTROL ROOM, RESEARCH LAB, TRAINING NETWORK, FOCUS CHAMBER, DATA VAULT, LIFE LOG and MISSION CONTROL run in the browser. Weather continues to use the free Open-Meteo endpoint. The workflow fetches the same official RR/RTP feeds and writes the normalized public summaries to `build/data/news.json`. A source failure does not block deployment or Training Network; available sources are published, and an all-source failure produces a safe empty feed with source status instead of fabricated news.

The Pages origin has its own empty browser storage. It cannot read or publish records stored under the local `127.0.0.1:8765` origin.

## Architecture notes

- `server.mjs` serves the local application and the free RSS endpoint.
- `dist/app.js` is the active frontend entry point.
- `dist/lib/store.js` preserves the existing localStorage and IndexedDB behavior.
- `dist/lib/progress/model.js` owns task, EXP and manual focus-log rules.
- `dist/data/legacy-literature.js` is retained only to reconstruct original text for older saved translation records; it does not restore Literature Mode.
- `retiredTimer` is a data-migration compatibility field; no Pomodoro UI or countdown logic is active.

## Repository safety

Never commit `.env`, exported browser data, private backups, token caches or credentials. Treat both public and private repositories as code storage rather than secret storage.
