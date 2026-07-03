# 🐭 Bio-Logic Mouse Co.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://biology-c.github.io/mousemaze/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[繁體中文](README.md) | [English](README_EN.md)

一個以瀏覽器為平台、使用純 JavaScript 製作的像素風迷宮探索遊戲。你將扮演一隻老鼠，在迷霧迷宮中蒐集道具、躲避蛇、運用燈塔與提示系統，努力找到出口。

遊戲連結：[https://biology-c.github.io/mousemaze/](https://biology-c.github.io/mousemaze/)

## 專案亮點

- 18 關漸進式內容，含 6 關教學
- 純前端、零依賴、開啟瀏覽器即可遊玩
- 支援繁中 / 英文、桌機鍵盤與手機搖桿操作
- 具備存檔續玩、關卡排行榜、遊玩時間排行與雲端同步
- 最近已整理 `ui.js` / `game.js` 結構，將文案、關卡設定與結算流程模組化

## 🌟 遊戲特色

- **18 關漸進式挑戰**：前 6 關是教學，後 12 關逐步加入更危險的特殊地磚與迷宮機關。
- **蛇敵人系統**：
  - 每 45 秒隨機出現一條蛇，被碰到就失敗。
  - 蛇會優先追燈塔，沒有燈塔時才追玩家。
  - 面向蛇身按 `Space` 可攻擊，3 次擊倒。
- **燈塔與提示**：
  - `Q` 放置燈塔，照亮迷霧並誘導蛇。
  - `Z` 消耗提示次數，顯示前往出口的路線。
- **道具成長系統**：
  - 🧀 起司：增加打洞次數
  - 🍄 蘑菇：短暫獲得全圖視野，並永久增加提示路徑長度
  - 💎 原礦：永久增加視野半徑
  - 🌀 傳送陣：快速跨區移動
- **特殊地磚與機關**：
  - ❓ 機會寶箱、⚠️ 出口轉換地磚
  - 🧱 鐵牆、🩸 定時合併牆
  - ⏩ 加速 / ⏬ 緩速地磚
  - 🔄 反向地磚、➡️ 單行道
- **設定與輔助功能**：
  - 三種難度：天堂 / 一般 / 飢荒
  - 亮暗主題、語言切換、BGM / SFX 開關、毫秒顯示
  - 手機支援類比搖桿與觸控技能按鈕
- **排行榜與進度**：
  - 關卡最佳紀錄
  - 遊玩時間排行與稱號
  - 本機存檔續玩
  - Google Sheets 雲端排行榜同步

## 🎮 控制說明

### 電腦版（鍵盤）

| 按鍵 | 功能 |
|------|------|
| `↑↓←→` / `WASD` | 移動 |
| `Space` | 面前有牆→打洞；無牆→攻擊 |
| `Q` | 放置燈塔（面前方向） |
| `Z` | 路線提示 |
| `Esc` | 暫停 |
| `imsupergm` | 開啟 GM 模式 |
| `↑↑↓↓←←→→ba` | 經典金手指（無限打洞） |

### 手機 / 平板（觸控）

- 畫面下半部中央：類比搖桿
- 底部技能列：⚡ 動作、💡 提示、🔦 燈塔
- 設定可從主選單或暫停選單進入

## 🏆 稱號系統

### 教學關稱號

| 關卡 | 主題 | 稱號 |
|------|------|------|
| 第 1 關 | 移動入門 | 🐾 初學者 |
| 第 2 關 | 打洞技巧 | ⛏️ 鑽洞鼠 |
| 第 3 關 | 燈塔記號 | 💡 燈塔守衛 |
| 第 4 關 | 道具收集 | 🎒 探險家 |
| 第 5 關 | 傳送與提示 | 🌀 時空旅者 |
| 第 6 關 | 蛇出沒注意 | ⚔️ 勇者鼠 |

### 遊玩時間稱號

| 累計時間 | 稱號 |
|----------|------|
| < 5 分鐘 | ⚡ 閃電鼠 |
| < 10 分鐘 | 🏃 疾風探索者 |
| < 20 分鐘 | 🗺️ 迷宮獵人 |
| < 40 分鐘 | 🧭 老練旅者 |
| < 60 分鐘 | 🏰 地城征服者 |
| < 120 分鐘 | 👑 迷宮王者 |
| 120+ 分鐘 | 🌟 傳奇先鋒 |

## 🚀 本機執行

這個專案不需要建置工具，也沒有 npm 依賴。

### 方法 1：直接開啟

直接用瀏覽器打開 [`index.html`](./index.html) 即可遊玩。

### 方法 2：使用靜態伺服器（推薦）

如果你要測試排行榜、音效、行動裝置畫面或避免部分瀏覽器的本機限制，建議開一個簡單的靜態伺服器：

```bash
npx serve .
```

或：

```bash
python -m http.server 8000
```

之後開啟 `http://localhost:3000` 或 `http://localhost:8000`。

## 🧱 專案結構

```text
mousemaze/
├─ css/               # 畫面樣式與主題
├─ js/
│  ├─ main.js         # 進入點
│  ├─ game.js         # 遊戲狀態與主流程
│  ├─ game_content.js # 關卡尺寸 / 教學配置
│  ├─ game_progress.js# 存檔 / 結算 / 排行榜流程
│  ├─ ui.js           # UI 互動與選單
│  ├─ ui_content.js   # 多語系文案
│  ├─ maze.js         # 迷宮生成與路徑搜尋
│  ├─ player.js       # 玩家控制與技能
│  ├─ enemy.js        # 蛇 AI
│  ├─ items.js        # 道具與特殊地磚
│  ├─ renderer.js     # Canvas 渲染 / 迷霧 / 小地圖
│  ├─ storage.js      # 本機存檔與排行榜
│  ├─ cloud_storage.js# Google Sheets 雲端同步
│  ├─ settings.js     # 設定管理
│  └─ timer.js        # 計時
├─ music/             # 音效與背景音樂
├─ raw_assets/        # 原始素材
└─ index.html         # 主頁面
```

## 🛠️ 技術重點

- **語言**：HTML5、CSS3、Vanilla JavaScript
- **渲染**：Canvas API
- **迷宮生成**：隨機 Prim 演算法
- **提示 / 困死判定**：BFS 路徑搜尋
- **敵人邏輯**：貪婪追蹤 + 速度週期變化
- **資料儲存**：
  - LocalStorage：設定、續玩進度、排行榜、遊玩時間
  - Google Apps Script / Google Sheets：雲端排行榜同步

## 📝 備註

- 本機排行榜與遊玩時間紀錄會依 `UTC+8` 跨日重置。
- 雲端排行榜讀寫仰賴 [`js/cloud_storage.js`](./js/cloud_storage.js) 內設定的 Google Apps Script Web App。
- 目前專案仍維持無框架、單頁靜態架構，適合繼續做關卡擴充、UI 優化與程式模組整理。

## 🤝 如何貢獻

1. Fork 本專案
2. 建立分支：`git checkout -b feature/your-feature`
3. 提交修改
4. 開 Pull Request

## 📄 授權

本專案採用 **MIT License**。
