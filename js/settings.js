/**
 * settings.js
 * 處理遊戲設定 (速度、主題、難度) 的儲存與讀取
 */

const STORAGE_KEY_SETTINGS = 'maze_settings';

class Settings {
  constructor() {
    // 預設設定
    this.speed = 0.2; // 中
    this.theme = 'dark'; // 暗色 (預設)
    this.difficulty = 'normal'; // 一般

    this.load();
  }

  load() {
    const dataStr = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (data.speed !== undefined) this.speed = data.speed;
        if (data.theme !== undefined) this.theme = data.theme;
        if (data.difficulty !== undefined) this.difficulty = data.difficulty;
      } catch (e) {
        console.error('讀取設定失敗', e);
      }
    }
    this.applyTheme();
  }

  save() {
    const data = {
      speed: this.speed,
      theme: this.theme,
      difficulty: this.difficulty
    };
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(data));
    this.applyTheme();
  }

  // 套用主題到 body 的 data-theme 屬性
  applyTheme() {
    document.body.setAttribute('data-theme', this.theme);
  }

  // 取得難度對應的道具生成倍率
  getDifficultyMultiplier() {
    switch (this.difficulty) {
      case 'heaven': return 2.0;    // 天堂模式：道具加倍
      case 'famine': return 0.5;    // 飢荒模式：道具減半
      case 'normal': 
      default: return 1.0;          // 一般模式：正常數量
    }
  }
}

// 建立全域單例
const gameSettings = new Settings();
