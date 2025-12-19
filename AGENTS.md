# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the entry point and wires up the UI and assets.
- `script.js` contains the main application logic (form handling, history, localStorage, theme).
- `js/i18n.js` provides translation helpers; translations live in `lang/*.json`.
- `style.css` holds the site styling; `manifest.json` and `favicon.ico` support the PWA shell.

## Build, Test, and Development Commands
- No build step or dependencies. Open `index.html` directly for quick checks.
- For service worker/PWA behavior, serve locally:
  - `python -m http.server 8000` (then visit `http://localhost:8000`).

## Coding Style & Naming Conventions
- Vanilla JavaScript and CSS only; avoid adding dependencies without a clear reason.
- Indentation follows 4 spaces in JS/CSS; keep lines readable and consistent.
- Prefer descriptive DOM IDs/classes that match the UI, e.g., `history-toggle`, `summary-format`.
- Keep i18n keys stable and lowercase with underscores (see `lang/en.json`).

## Testing Guidelines
- No automated test suite currently.
- Manual checks are expected: time calculations, history add/remove, export, theme toggle, and language switching.
- If you add tests, document how to run them here and keep them lightweight.

## Commit & Pull Request Guidelines
- Recent commits use short, imperative subjects; type prefixes like `docs:` appear in history.
- Keep commits scoped and readable; include context in the body when needed.
- PRs should include a clear description and link related issues when applicable.
- For UI changes, add before/after screenshots or a short GIF.

## Configuration & Data Notes
- User data is stored in `localStorage`; avoid breaking existing keys when changing storage shapes.
- If adding new settings, include defaults and migrate gracefully.
