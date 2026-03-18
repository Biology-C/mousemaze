/**
 * storage.js
 * 處理 localStorage 記錄存檔 (進度、排行榜)
 */

const STORAGE_KEY_SAVE = 'maze_save';
const STORAGE_KEY_LEADERBOARD = 'maze_leaderboard';

const Storage = {
  /**
   * 儲存遊戲進度
   * @param {number} level 當前關卡 (1-12)
   * @param {number} totalTimeMs 累計時間 (毫秒)
   */
  saveGame(level, totalTimeMs) {
    const data = {
      level,
      totalTimeMs,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY_SAVE, JSON.stringify(data));
  },

  /**
   * 讀取遊戲進度
   * @returns {Object|null} 存檔資料，無存檔則回傳 null
   */
  loadGame() {
    const dataStr = localStorage.getItem(STORAGE_KEY_SAVE);
    if (!dataStr) return null;
    try {
      return JSON.parse(dataStr);
    } catch (e) {
      console.error('讀取存檔失敗', e);
      return null;
    }
  },

  /**
   * 刪除遊戲進度 (破關或重置時)
   */
  clearSave() {
    localStorage.removeItem(STORAGE_KEY_SAVE);
  },

  /**
   * 獲取指定關卡的排行榜資料
   * @param {number} level 關卡 (1-12)
   * @returns {Array} 排行榜陣列 [{name, timeMs, date}]
   */
  getLeaderboard(level) {
    const dataStr = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
    let allData = {};
    if (dataStr) {
      try {
        allData = JSON.parse(dataStr);
      } catch (e) {
        console.error('讀取排行榜失敗', e);
      }
    }
    return allData[level] || [];
  },

  /**
   * 檢查是否為新紀錄 (前5名)
   * @param {number} level 關卡
   * @param {number} timeMs 過關時間
   * @returns {boolean}
   */
  isNewRecord(level, timeMs) {
    const lb = this.getLeaderboard(level);
    if (lb.length < 5) return true;
    // 如果比第5名還快
    return timeMs < lb[lb.length - 1].timeMs;
  },

  /**
   * 儲存新紀錄至排行榜
   * @param {number} level 關卡
   * @param {string} name 玩家名稱
   * @param {number} timeMs 耗時
   */
  saveToLeaderboard(level, name, timeMs) {
    const dataStr = localStorage.getItem(STORAGE_KEY_LEADERBOARD);
    let allData = {};
    if (dataStr) {
      try {
        allData = JSON.parse(dataStr);
      } catch (e) {}
    }

    if (!allData[level]) {
      allData[level] = [];
    }

    // 加入新紀錄
    allData[level].push({
      name: name || 'Hero',
      timeMs: timeMs,
      date: new Date().toISOString()
    });

    // 重新排序 (時間少的在前)
    allData[level].sort((a, b) => a.timeMs - b.timeMs);

    // 只保留前 5 名
    if (allData[level].length > 5) {
      allData[level] = allData[level].slice(0, 5);
    }

    // 回存
    localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(allData));
  }
};
