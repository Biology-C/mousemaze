# 🐭 像素地城：動態迷宮 (Pixel Mouse Maze)

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://biology-c.github.io/mousemaze/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一個基於瀏覽器、純 JavaScript 開發的像素風迷宮探索遊戲。挑戰您的方向感與反應，利用道具在迷失路徑時尋找出口！

**🏠 遊戲網址：[https://biology-c.github.io/mousemaze/](https://biology-c.github.io/mousemaze/)**

---

## 🌟 遊戲特色

*   **動態提示系統 (Hint)**：迷路時按下 `Z` 鍵，啟動導航路線指引。
*   **鑽牆技能 (Drill)**：遇到死路？使用鑽頭直接打通牆壁。
*   **多樣化道具**：
    *   🧀 **起司 (Mark)**：留下足跡，避免重複走回老路。
    *   🍄 **魔法蘑菇**：短暫獲得全地圖視野。
    *   💎 **原礦**：永久提升角色的視野範圍。
    *   📐 **黃色三角**：增加鑽牆次數。
*   **多重難度設定**：天堂、一般、飢荒模式，挑戰您的資源管理。
*   **GM 金手指**：內置隱藏 GM 模式，可監視數值並即時切換視線迷霧。
*   **RWD 自適應排版**：全面支援手機瀏覽，內建類比搖桿操作。

---

## 🎮 控制說明

### 電腦版 (鍵盤)
*   **移動**：`↑` `↓` `←` `→` 或 `W` `A` `S` `D`
*   **鑽牆**：`Space (空白鍵)`
*   **提示**：`Z`
*   **記號**：`Q` (放置起司)
*   **暫停**：`Esc`
*   **GM 模式**：輸入 `imsupergm` 啟動

### 手機/平板 (觸控)
*   **左下角**：類比搖桿區控制移動。
*   **右下角**：技能按鈕區 (鑽牆、提示、記號)。

---

## 🛠️ 技術開發

*   **語言**：HTML5, CSS3, Vanilla JavaScript (純 JS, 無依賴項目)。
*   **渲染**：Canvas API
*   **開發核心**：
    *   **迷宮生成**：隨機 Prim 演算法。
    *   **路徑搜尋**：BFS (廣度優先搜尋) 用於提示導航。
    *   **狀態存取**：LocalStorage 用於紀錄分數與設定。

---

## 🤝 如何貢獻

1.  Fork 本專案。
2.  建立新的開發分支 (`git checkout -b feature/NewFeature`)。
3.  提交您的修改。
4.  開啟 Pull Request。

---

## 📄 授權協議

本專案採用 **MIT License** 授權。
