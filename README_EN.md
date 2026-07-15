# 🐭 Bio-Logic Mouse Co.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://biology-c.github.io/mousemaze/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[繁體中文](README.md) | [English](README_EN.md)

A browser-based pixel-art maze exploration game built with pure JavaScript. You play as a mouse navigating foggy mazes, collecting upgrades, placing beacons, avoiding snakes, and racing for the exit.

Play now: [https://biology-c.github.io/mousemaze/](https://biology-c.github.io/mousemaze/)

## Project highlights

- 18 progressive levels, including 6 tutorial stages
- A separate 20-level “Little Explorer” clue-maze mode for roughly ages 5–7, covering patterns, color observation, and tens/ones from 11–20
- Pure front-end, zero dependencies, no build step required
- Traditional Chinese / English UI plus desktop and mobile controls
- Save & continue, per-level records, playtime ranking, and cloud sync
- Recently refactored to split UI copy, level config, and progress flow into separate modules

## 🌟 Features

- **20 clue-learning mazes**: Five chapters interleave `+1`, even numbers, `+5`, numbers 11–20, 12/20 comparison, color order, and a final number-plus-color challenge. Blue bars represent tens and orange dots represent ones; wrong choices are non-punitive and remain marked as tested ideas, while the exit opens only after the clue is completed.
- **Mobile-friendly slow step control**: Education mode runs at half the adventure-mode movement speed; each joystick gesture moves exactly one cell and must return to center before another move, preventing accidental overshooting.
- **18 progressive levels**: The first 6 levels teach the core systems, followed by 12 harder stages with more hazards and special tiles.
- **Snake enemy system**:
  - A snake appears every 45 seconds.
  - Snakes prioritize lighthouses and chase the player when no beacon is available.
  - Face the snake's body and press `Space` to attack; it takes 3 hits to defeat.
- **Beacon and hint systems**:
  - Press `Q` to place a lighthouse that reveals fog and distracts snakes.
  - Press `Z` to spend a hint charge and reveal a route toward the exit.
- **Persistent upgrades and items**:
  - 🧀 Cheese: increases drill count
  - 🍄 Mushroom: grants temporary full-map vision and permanently extends hint range
  - 💎 Ore: permanently increases sight radius
  - 🌀 Portal: two-way long-distance teleport
- **Special tiles and hazards**:
  - ❓ Chance chest, ⚠️ exit shifter
  - 🧱 Iron walls, 🩸 merging walls
  - ⏩ speed-up / ⏬ slow-down tiles
  - 🔄 reverse controls, ➡️ one-way tiles
- **Settings and accessibility**:
  - Three difficulties: Heaven / Normal / Famine
  - Theme, language, BGM / SFX toggles, millisecond display
  - Mobile joystick and touch skill buttons
- **Ranking and progress systems**:
  - Per-level best records
  - Playtime ranking with titles
  - Local save / continue
  - Google Sheets-backed cloud leaderboard sync

## 🎮 Controls

### Desktop (keyboard)

| Key | Action |
|-----|--------|
| `↑↓←→` / `WASD` | Move |
| `Space` | Dig if a wall is ahead / attack if path is clear |
| `Q` | Place lighthouse |
| `Z` | Use route hint |
| `Esc` | Pause |
| `imsupergm` | Toggle GM mode |
| `↑↑↓↓←←→→ba` | Classic cheat (infinite drills) |

### Mobile / tablet (touch)

- Lower-center screen: analog joystick
- Bottom skill row: ⚡ action, 💡 hint, 🔦 lighthouse
- Settings are available from the main menu and pause menu

## 🏆 Title system

### Tutorial titles

| Level | Theme | Title |
|-------|-------|-------|
| 1 | Movement Basics | 🐾 Novice |
| 2 | Digging Walls | ⛏️ Dig Mouse |
| 3 | Lighthouse Marker | 💡 Lighthouse Keeper |
| 4 | Item Collection | 🎒 Explorer |
| 5 | Teleport & Hint | 🌀 Time Traveler |
| 6 | Beware of Snakes | ⚔️ Hero Mouse |

### Playtime titles

| Cumulative Time | Title |
|-----------------|-------|
| < 5 min | ⚡ Lightning Mouse |
| < 10 min | 🏃 Zephyr Scout |
| < 20 min | 🗺️ Maze Hunter |
| < 40 min | 🧭 Seasoned Voyager |
| < 60 min | 🏰 Dungeon Conqueror |
| < 120 min | 👑 Maze King |
| 120+ min | 🌟 Legendary Vanguard |

## 🚀 Run locally

This project has no build step and no package dependency.

### Option 1: open directly

Open [`index.html`](./index.html) in a browser.

### Option 2: use a static server (recommended)

If you want more reliable local testing for audio, leaderboard behavior, or mobile layout, run a simple static server:

```bash
npx serve .
```

or:

```bash
python -m http.server 8000
```

Then open `http://localhost:3000` or `http://localhost:8000`.

## 🧱 Project structure

```text
mousemaze/
├─ css/                # Styling and themes
├─ js/
│  ├─ main.js          # Entry point
│  ├─ game.js          # Core game state and loop
│  ├─ game_content.js  # Level size and tutorial config
│  ├─ game_education.js# Education-mode flow
│  ├─ game_progress.js # Save / finish / leaderboard flow
│  ├─ education.js     # Number / color / place-value clue engine
│  ├─ education_content.js # 20-level curriculum data
│  ├─ ui.js            # Menus and UI behavior
│  ├─ ui_content.js    # I18N and UI copy
│  ├─ maze.js          # Maze generation and pathfinding
│  ├─ player.js        # Player movement and skills
│  ├─ enemy.js         # Snake AI
│  ├─ items.js         # Items and special tiles
│  ├─ renderer.js      # Canvas rendering, fog, minimap
│  ├─ storage.js       # Local save and records
│  ├─ cloud_storage.js # Google Sheets sync
│  ├─ settings.js      # Persistent settings
│  └─ timer.js         # Timing utilities
├─ music/              # Audio assets
├─ raw_assets/         # Source art / raw assets
└─ index.html          # Main page
```

## 🛠️ Tech notes

- **Languages**: HTML5, CSS3, Vanilla JavaScript
- **Rendering**: Canvas API
- **Maze generation**: randomized Prim's algorithm
- **Hints / trapped detection**: BFS pathfinding
- **Enemy logic**: greedy chasing plus periodic speed changes
- **Storage**:
  - LocalStorage for settings, save data, records, and playtime
  - Google Apps Script / Google Sheets for cloud leaderboard sync

## Notes

- Local records and playtime rankings reset daily on `UTC+8`.
- Cloud leaderboard sync is configured in [`js/cloud_storage.js`](./js/cloud_storage.js).
- The project intentionally remains framework-free and static, making it a good base for more level content, UI polish, or further refactoring.

## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License**.
