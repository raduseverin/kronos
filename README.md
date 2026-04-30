# Kronos

A local-first time tracker for macOS — built for solo freelancers. All data stays on your machine.

![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?logo=sqlite)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

**Tracking**
- Start / stop / pause a timer with a description and project
- Global keyboard shortcut to toggle the timer from any app (`CmdOrCtrl+Shift+Space` by default)
- Auto-tracking — detects your active window every 5 s and switches the timer automatically based on keyword rules you define
- Idle detection — pauses the timer after configurable inactivity; prompts you to resume or discard on return
- Pomodoro mode — built-in focus/break cycle that auto-pauses the timer at the end of each session
- Quick-start templates — one-click chips to re-start frequent entries instantly

**Projects & clients**
- Organize entries by project with color coding
- Assign clients, hourly rates, and currencies per project
- Set billable/non-billable defaults and per-project daily hour targets
- Monthly or fixed budget tracking with visual progress

**Reports & invoices**
- Weekly and monthly summaries with bar charts and project donut
- Export to CSV
- Generate PDF invoices from tracked time
- Auto-invoice creation when a project budget is reached
- Invoice rounding (6 / 15 / 30 / 60 min intervals)
- Multi-currency with live exchange rate refresh

**AI integration**
- Supports **Local LLM** (LM Studio / Ollama), **OpenAI**, **Gemini**, and **Claude**
- Rewrites vague timer descriptions into clean, professional entries
- Classifies ambiguous windows (browser, terminal, Slack) to the right project
- Both prompts are fully editable in Settings → AI

**App**
- Lives in the macOS menu bar — closing the window keeps it running
- Tray shows live elapsed time and project color; left-click opens the context menu
- Light / dark / system theme

---

## Tech stack

| Layer | Library |
|---|---|
| Shell | Electron 31 |
| UI | React 18 + Tailwind CSS v3 |
| State | Zustand 4 (`persist` middleware) |
| Database | SQLite via `better-sqlite3` + Kysely |
| Window detection | `get-windows` 9 |
| Build | electron-vite 2 + Vite 5 |
| Packaging | electron-builder 24 |

---

## Prerequisites

- **Node.js** 20+
- **macOS** (Apple Silicon or Intel)
- **LM Studio** *(optional)* — for local AI. Download at [lmstudio.ai](https://lmstudio.ai), load any instruction-following model, and start the local server on port `1234`.

---

## Getting started

```bash
# 1. Clone
git clone https://github.com/your-username/kronos.git
cd kronos

# 2. Install (also rebuilds native modules for Electron)
npm install

# 3. Run in development mode
npm run dev
```

The app opens a window and adds a tray icon. The SQLite database is created automatically on first launch at `~/Library/Application Support/Kronos/kronos.db`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start in development mode with hot reload |
| `npm run build` | Compile main + preload + renderer |
| `npm run dist` | Package into a distributable `.dmg` + `.zip` |
| `npm run build:dist` | Build and package in one step |
| `npm run pack` | Package without installer (quick smoke test) |
| `npm test` | Run unit tests (Vitest) |

Output lands in `dist-electron/`.

---

## Data & privacy

Everything is stored locally:

- **Database:** `~/Library/Application Support/Kronos/kronos.db`
- **Settings:** Electron `localStorage` (renderer process)
- **API keys:** OS-encrypted via Electron `safeStorage`, stored in `~/Library/Application Support/Kronos/secrets.json`

No telemetry. No cloud sync. The only outbound requests are:
- Your configured AI provider (if enabled)
- [exchangerate-api.com](https://exchangerate-api.com) for currency rates (on demand only)

---

## Project structure

```
electron/
  main.js              # App lifecycle, IPC registration, global shortcut
  preload.js           # contextBridge API (window.kronos)
  tray.js              # Menu bar tray with live timer display
  windowDetector.js    # Active window polling (5 s)
  idleDetector.js      # Idle detection via powerMonitor
  db/
    database.js        # SQLite init + migrations
  ipc/                 # IPC handlers: timer, projects, reports, invoices, AI, templates
  services/            # Core logic: timerService, autoTrackService, aiService, …

src/
  App.jsx              # Root layout, global event wiring
  pages/               # TimerPage, ReportsPage, ProjectsPage, InvoicePage, SettingsPage, …
  components/
    timer/             # TimerBar, TimerClock, PomodoroTimer, TemplateBar, ListView
    layout/            # Sidebar, TopBar
    reports/           # SummaryReport, DurationByDay, ProjectDonut
    invoice/           # InvoiceEditor, TimeImportPanel, PDF generation
    shared/            # Form primitives, icons, Toast, Skeleton
  store/
    timerStore.js      # Active entry state (Zustand)
    settingsStore.js   # Persisted preferences (Zustand + localStorage)
```

---

## Building for distribution

```bash
npm run build:dist
```

Produces in `dist-electron/`:
- `Kronos-x.x.x-arm64.dmg` — drag-to-Applications installer
- `Kronos-x.x.x-arm64-mac.zip` — portable archive

> **Note:** The app is not code-signed by default. On first launch macOS may show a Gatekeeper warning — right-click the app and choose **Open** to bypass it.

---

## License

[MIT](LICENSE) © Radu Severin
