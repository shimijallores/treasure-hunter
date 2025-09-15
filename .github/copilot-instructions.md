<!-- .github/copilot-instructions.md - guidance for AI coding agents working on the Treasure Hunter project -->

# Treasure Hunter — AI coding instructions

This repository is a small browser game (3x3 grid treasure-guessing) implemented in plain JavaScript and DOM/canvas APIs. The goal of these instructions is to give an AI coding agent focused, actionable knowledge so it can make safe, useful edits without breaking project conventions.

High level architecture

- The app is a single-page browser game. Entry point: `index.html` which loads `main.js` as an ES module.
- `main.js` orchestrates gameplay, UI wiring, and leaderboard (localStorage).
- `world.js` contains a single `World` class responsible for the canvas, isometric tile math, sprite drawing and mouse-to-tile mapping. Most rendering and interaction logic lives here.
- `soundManager.js` is a simple audio wrapper (play/loop/stop) using HTMLAudioElement.
- Static assets: `spritesheet.gif` (tile sprites) and `assets/sfx/*` for sound effects.

Key files to reference when making changes

- `main.js` — game flow: start button, round lifecycle, timer, leaderboard persistence. Use this file to change game rules or UI text.
- `world.js` — canvas sizing, tile math (convertScreenToTile / convertTileToScreen), image drawing and cursor rendering. Modify this for sprite layout, tile sizes, map offsets, or camera panning.
- `soundManager.js` — centralize audio usage. Prefer adding new sounds here and call soundManager.play("name") from `main.js`.
- `index.html` / `style.css` — simple DOM UI and Tailwind browser shim. Keep structural changes minimal to avoid breaking element selectors used by `main.js` (IDs: `viewport`, `start`, `player`, `leaderboard-list`, `round`, `score`, `life`, `timer`, `coordinates`).

Project-specific conventions & patterns

- DOM selection by ID: `main.js` queries specific IDs on startup; keep those IDs stable.
- Local leaderboard: stored as JSON in `localStorage` under key `leaderboard`. Format: array of {name, score, round}. Use the same shape when reading/writing.
- Tile indices: `world.tileMap` stores numeric tile indexes that map into `spritesheet.gif`. Example: default map uses 29 for unrevealed tiles; mined tiles use 25..28 in `main.js` (25 bomb, 26 extra life, 27 treasure, 28 death bomb). When changing visuals, update both `world.draw()` tile lookup and `main.js` tile assignments.
- Coordinate arrays are compared with a small helper `arraysEqual(a,b)` in `main.js`; maintain that pattern when altering coordinate handling.

Common pitfalls to avoid

- Do not rename DOM IDs used in `main.js` unless you update all references. Breaking these IDs will silently make the UI non-interactive.
- `world.js` contains some numeric configuration for sprite sizing and overlap. Changing those numbers alters mouse-to-tile mapping — test mouse clicks after edits.
- `soundManager.js` currently exports using `export default soundManager = { ... }` which is not standard for all bundlers/environments; prefer exporting as `export default { ... }` if refactoring.

Examples & snippets from this repo (for reference)

- Leaderboard read/write (use same key/shape):
  - read: `let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];`
  - write: `localStorage.setItem("leaderboard", JSON.stringify(leaderboard));`
- Tile reveal (from `main.js`):
  - Treasure: `world.tileMap[row][col] = 27;`
  - Death bomb: `world.tileMap[row][col] = 28;`

Developer workflows discovered (manual)

- The project is plain static assets; run locally by opening `index.html` in a browser. For better results use a local static server (e.g., `npx http-server .` or VS Code Live Server) to avoid any file:// audio/image loading issues.
- No tests or build step found. Keep edits in ES module syntax and avoid Node-specific APIs.

Editing guidance for AI agents

- Small, focused PRs: change one logical area (UI text, sound, tile mapping) and run quick manual smoke tests.
- When editing `world.js`, after modifying tile sizes/overlap or projectedTileWidth/Height, test `convertScreenToTile` and `convertTileToScreen` using manual clicks to confirm mapping correctness.
- When adding sounds: place file in `assets/sfx/`, add to `soundManager.js` and call from `main.js` at the appropriate event (e.g., on double-click reveal a treasure).

If you change public behavior

- Update `todo.txt` or add a short note in `README.md` describing the change and why.

What I couldn't discover automatically

- There are no automated tests or build scripts to run. Assume changes must be validated in a browser. If you want CI or automated checks, add a minimal `package.json` and a tiny test harness.

If anything here is unclear or you want deeper rules (naming, commit message style, or automated tests), ask for clarification and I will update this file.
