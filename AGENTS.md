# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the entry point and wires up the UI and assets.
- `script.js` contains the main application logic (form handling, history, localStorage, theme).
- `js/core.js` exposes pure calculation helpers shared by the app and tests.
- `js/i18n.js` provides translation helpers; translations live in `lang/*.json`.
- `style.css` holds the site styling; `manifest.json` and `favicon.ico` support the PWA shell.
- `tests/unit` covers core logic; `tests/e2e` holds Playwright browser flows.

## Build, Test, and Development Commands
- No build step or dependencies. Open `index.html` directly for quick checks.
- For service worker/PWA behavior, serve locally:
  - `python -m http.server 8000` (then visit `http://localhost:8000`).
- Install dev dependencies (for tests/CI): `npm install`.
- Run unit tests: `npm test` (alias for `npm run test:unit`).
- Run end-to-end tests: `npm run test:e2e` (requires Playwright browsers).
- Run Lighthouse CI locally: `npm run lighthouse`.

## Coding Style & Naming Conventions
- Vanilla JavaScript and CSS only; avoid adding dependencies without a clear reason.
- Indentation follows 4 spaces in JS/CSS; keep lines readable and consistent.
- Prefer descriptive DOM IDs/classes that match the UI, e.g., `history-toggle`, `summary-format`.
- Keep i18n keys stable and lowercase with underscores (see `lang/en.json`).

## Testing Guidelines
- Unit tests cover parsing, calculations, and formatting (`tests/unit`).
- Playwright e2e tests validate core flows: calculations, history, settings, and theme (`tests/e2e`).
- Manual checks still expected for export downloads, i18n copy, and PWA behavior.
- Lighthouse CI enforces 90+ scores on all categories.

## Commit & Pull Request Guidelines
- Recent commits use short, imperative subjects; type prefixes like `docs:` appear in history.
- Keep commits scoped and readable; include context in the body when needed.
- PRs should include a clear description and link related issues when applicable.
- For UI changes, add before/after screenshots or a short GIF.

## CI Notes
- GitHub Actions runs unit + e2e tests via `.github/workflows/ci.yml`.
- Playwright installs browsers with `npx playwright install --with-deps` in CI.
- Lighthouse CI runs via `npm run lighthouse` in the CI workflow.

## Configuration & Data Notes
- User data is stored in `localStorage`; avoid breaking existing keys when changing storage shapes.
- If adding new settings, include defaults and migrate gracefully.
