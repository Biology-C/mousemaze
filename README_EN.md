# 🐭 Bio-Logic Mouse Co.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://biology-c.github.io/mousemaze/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A pixel-art maze exploration game built with pure JavaScript and HTML5 Canvas. Challenge your sense of direction and use gadgets to find the exit!

**🏠 Play Now: [https://biology-c.github.io/mousemaze/](https://biology-c.github.io/mousemaze/)**

---

## 🌟 Game features

*   **18 Progressive Levels**: Includes 6 tutorial stages covering movement, digging, lighthouses, and enemies.
*   **Tutorial Title System**: Earn unique titles by completing tutorials (e.g., 🐾 Novice → ⚔️ Hero Mouse).
*   **🐍 Snake Enemy System**:
    *   One snake spawns every 60 seconds—don't let it catch you!
    *   Snakes chase Lighthouses first, then the player.
    *   They burst with speed for 2s every 20s.
    *   Attack snakes with `Space` when facing them; 3 hits to defeat!
*   **🔦 Lighthouse Beacons**: Place permanent lighthouses to illuminate fog, but they also block paths. Use them strategically to lure snakes!
*   **⚡ Smart Action Button**: `Space` drills through walls if facing one, or attacks snakes if the path is clear.
*   **Gadgets**:
    *   🧀 **Dig Cheese**: Refill drill uses.
    *   🍄 **Magic Mushrooms**: Temporary full-map vision.
    *   💎 **Raw Ore**: Permanently increase sight radius.
    *   🌀 **Teleporters**: Two-way long-distance travel.
*   **3 Difficulty Levels**: Heaven (21 drills), Normal (15 drills), Famine (9 drills).
*   **Leaderboard**: Track your best times and earn playtime titles.
*   **Stuck Detection**: Automatically restarts with a message if you trap yourself.
*   **Mobile Ready**: Intuitive touch controls with an analog joystick.

---

## 🎮 Controls

### Desktop (Keyboard)
| Key | Function |
|------|------|
| `↑↓←→` / `WASD` | Move |
| `Space` | Dig (if wall) / Attack (if clear) |
| `Q` | Place Lighthouse (in front) |
| `Z` | Path hint |
| `Esc` | Pause |
| `imsupergm` | GM Mode (Skip levels, see full map, monitor stats) |
| `↑↑↓↓←←→→ba` | Classic Cheat (Infinite Digs) |

### Mobile/Tablet (Touch)
*   **Bottom Left**: Analog joystick for movement.
*   **Bottom Right**: Action buttons (Action, Hint, Lighthouse, Settings).

---

## 🏆 Title System

### Tutorial Titles
- Level 1: 🐾 Novice
- Level 2: ⛏️ Dig Mouse
- Level 3: 💡 Lighthouse Keeper
- Level 4: 🎒 Explorer
- Level 5: 🌀 Time Traveler
- Level 6: ⚔️ Hero Mouse

### Playtime Titles
- < 5 min: ⚡ Lightning Mouse
- < 10 min: 🏃 Zephyr Scout
- < 20 min: 🗺️ Maze Hunter
- < 40 min: 🧭 Seasoned Voyager
- < 60 min: 🏰 Dungeon Conqueror
- < 120 min: 👑 Maze King
- 120+ min: 🌟 Legendary Vanguard

---

## 🤝 Contribution

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit and push your changes.
4.  Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**.
