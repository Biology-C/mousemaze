# 🐭 Bio-Logic Mouse Co.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://biology-c.github.io/mousemaze/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A pixel-art maze exploration game built with pure JavaScript and HTML5 Canvas. Challenge your sense of direction and use gadgets to find the exit!

**🏠 Play Now: [https://biology-c.github.io/mousemaze/](https://biology-c.github.io/mousemaze/)**

---

## 🌟 Features

*   **18 Progressive Levels**: 6 tutorial stages covering movement, digging, lighthouses, items, and enemies — everything you need before the real challenge begins.
*   **Tutorial Title System**: Earn unique titles by completing tutorials (🐾 Novice → ⚔️ Hero Mouse).
*   **🐍 Snake Enemy System**:
    *   A snake spawns every 45 seconds — don't let it catch you!
    *   Snakes chase Lighthouses first, then the player.
    *   Normal speed: 1 cell/3 s. Every 8.5 s they burst into a sprint (1 cell/s) for 2 seconds.
    *   Face a snake and press `Space` to attack; 3 hits to defeat! (Defeating awards +3 drills)
*   **🎵 Audio System**: BGM and SFX for walking/digging (music starts on first interaction). Both can be toggled independently in Settings.
*   **🔦 Lighthouse Beacons**: Place permanent lighthouses to illuminate fog and lure snakes away! *(Unlocked from Level 3)*
*   **⚡ Smart Action Button**: `Space` drills through walls when facing one, or attacks snakes when the path is clear.
*   **💡 Route Hint**: Spend hint charges to reveal the path to the exit.
*   **Gadgets**:
    *   🧀 **Dig Cheese**: Refills drill uses.
    *   🍄 **Magic Mushroom**: Grants temporary full-map vision and **permanently** increases hint path distance by 10 cells (persists across levels).
    *   💎 **Raw Ore**: **Permanently** increases sight radius by 2 cells (persists across levels).
    *   🌀 **Teleporters**: Two-way long-distance travel.
*   **🧩 Special Tiles & Hazards**:
    *   ❓ **Chance Chest (Lv6+)**: Drops items, spawns a snake, or relocates the exit!
    *   ⚠️ **Exit Shifter (Lv6+)**: Instantly teleports the maze exit to a new random location.
    *   🧱 **Iron Walls (Lv8+)**: Indestructible grey walls; drills don't work here.
    *   🩸 **Merging Walls (Lv8+)**: Red walls that open and close every 3 seconds. Being crushed means instant Game Over!
    *   ⏩ **Boost Tiles (Lv8+)**: Stepping on green tiles gives both the player and snakes 1.5× speed for 2 seconds.
    *   ⏬ **Slow Tiles (Lv8+)**: Stepping on red tiles reduces both the player and snakes to 0.5× speed for 2 seconds.
    *   🔄 **Inverse Tiles (Lv10+)**: Completely reverses movement controls while standing on them.
    *   ➡️ **One-way Tiles (Lv10+)**: Light-blue arrows that only allow movement in the indicated direction.
*   **3 Difficulty Levels**: Heaven (21 drills), Normal (15), Famine (9).
*   **Leaderboard**: Best times per level + cumulative playtime titles, synced with Google Sheets cloud ranking.
*   **Stuck Detection**: Auto-restart with a message if you trap yourself.
*   **GM Mode**: Hidden cheat mode — skip levels, see the full map, and monitor stats.
*   **Mobile Ready**: RWD layout with an analog joystick; HUD uses icon dot-grids (⚡ red dots / 💡 yellow dots) instead of text counters for at-a-glance readability.

---

## 🎮 Controls

### Desktop (Keyboard)

| Key | Action |
|-----|--------|
| `↑↓←→` / `WASD` | Move |
| `Space` | Dig (wall ahead) / Attack (clear path) |
| `Q` | Place Lighthouse (in front) |
| `Z` | Route hint |
| `Esc` | Pause |
| `imsupergm` | GM Mode (skip levels, full map, monitor stats) |
| `↑↑↓↓←←→→ba` | Classic Cheat (Infinite Drills) |

### Mobile / Tablet (Touch)

*   **Center of lower screen**: Analog joystick — comfortable for both left- and right-handed players.
*   **Bottom-right row**: ⚡ Action (dig/attack), 💡 Hint, 🔦 Lighthouse *(unlocked from Level 3)*.
*   Access Settings from the Pause menu.

---

## 🏆 Title System

### Tutorial Titles

| Level | Theme | Title |
|-------|-------|-------|
| 1 | Movement Basics | 🐾 Novice |
| 2 | Digging Walls | ⛏️ Dig Mouse |
| 3 | Lighthouse Marker | 💡 Lighthouse Keeper |
| 4 | Item Collection | 🎒 Explorer |
| 5 | Teleport & Hint | 🌀 Time Traveler |
| 6 | Beware of Snakes | ⚔️ Hero Mouse |

### Playtime Titles

| Cumulative Time | Title |
|-----------------|-------|
| < 5 min | ⚡ Lightning Mouse |
| < 10 min | 🏃 Zephyr Scout |
| < 20 min | 🗺️ Maze Hunter |
| < 40 min | 🧭 Seasoned Voyager |
| < 60 min | 🏰 Dungeon Conqueror |
| < 120 min | 👑 Maze King |
| 120+ min | 🌟 Legendary Vanguard |

---

## 🛠️ Tech Stack

*   **Languages**: HTML5, CSS3, Vanilla JavaScript (zero dependencies)
*   **Rendering**: Canvas API (multi-source fog-of-war system)
*   **Core Algorithms**:
    *   **Maze Generation**: Randomized Prim's Algorithm
    *   **Pathfinding**: BFS (Breadth-First Search) for hints and stuck detection
    *   **Snake AI**: Greedy pathfinding (lighthouse → player) with periodic speed bursts
*   **Storage**: LocalStorage (save data, leaderboard, playtime) + Google Sheets cloud leaderboard

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit and push your changes.
4.  Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**.
