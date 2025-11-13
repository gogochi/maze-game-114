# Repository Guidelines

## Project Structure & Module Organization
This repository is a static HTML5 maze game. `index.html` bootstraps Materialize assets and wires DOM hooks. Custom styles live in `css/index.css`, while `css/materialize.min.css` must remain vendor-only. Core gameplay, controls, and maze generation sit in `js/maze.js`; helper visuals such as fireworks and third-party libs stay isolated in their own files under `js/`. Store icons or promo art in `img/` and reference them with relative URLs so GitHub Pages and local preview servers behave the same. When adding new modules, prefer plain ES classes or IIFEs so they load directly in the browser without a bundler.

## Build, Test, and Development Commands
- `npx http-server . -c-1`: lightweight local server with caching disabled for quick iteration.
- `python3 -m http.server 4173`: alternative when Node.js is unavailable; keep the chosen port in pull request notes.
- `npx prettier --check "{css,js}/*.{css,js}"`: verifies formatting before committing; use `--write` to autofix when necessary.
Because the project is static, no build step is required; simply refresh the served page to pick up changes.

## Coding Style & Naming Conventions
JavaScript files currently use 4-space indentation, trailing semicolons, and camelCase identifiers (for example, `drawBall`, `initMaze`). Keep feature flags and state booleans readable with positive names (`isWall`, `isExit`). CSS class names should stay in lowercase with hyphens (e.g., `.maze-overlay`). Vendor files remain minified; only touch `index.css` for custom rules.

## Testing Guidelines
There is no automated test suite; rely on manual verification across desktop keyboard controls and mobile device motion sensors. Confirm each difficulty setting, maze size selector, hint toggle, and fireworks effect from the header menu. When reproducing motion input on desktop, use browser dev tools’ sensor emulation and capture screenshots or short clips for regressions. Document any reproducible bug with the chosen maze size and browser version in the pull request description.

## Commit & Pull Request Guidelines
Existing history favors concise, lower-case commit subjects with optional prefixes (e.g., `chore: 添加重力传感器检测提示`). Follow the pattern `<type>: <short summary>` or a short imperative verb when Chinese context fits better. Each pull request should describe the gameplay change, list manual test steps, link any relevant issue, and attach screenshots or recordings if the UI changes. Keep feature branches rebased on `master` and avoid bundling unrelated assets in the same PR.
