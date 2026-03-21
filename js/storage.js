const STORAGE_KEY_SAVE = 'maze_save';
const STORAGE_KEY_LEADERBOARD = 'maze_leaderboard';
const STORAGE_KEY_PLAYTIME = 'maze_playtime';

const Storage = {
  saveGame(level, totalTimeMs, tutorialHints = {}, persistentStats = null) {
    const data = {
      level,
      totalTimeMs,
      timestamp: Date.now(),
      tutorialHints: {
        firstBeaconPlaced: false,
        firstSnakeSeen: false,
        firstSnakeAttackReady: false
      },
      persistentStats: persistentStats || { sightRadius: 6.5, hintRange: 30 }
    };

    // 如果傳入了教學提示狀態也一併更新
    if (Object.keys(tutorialHints).length > 0) {
      data.tutorialHints = { ...data.tutorialHints, ...tutorialHints };
    }
    
    localStorage.setItem(STORAGE_KEY_SAVE, JSON.stringify(data));
  },


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

  clearSave() {
    localStorage.removeItem(STORAGE_KEY_SAVE);
  },

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

  isNewRecord(level, timeMs) {
    const lb = this.getLeaderboard(level);
    if (lb.length < 5) return true;
    return timeMs < lb[lb.length - 1].timeMs;
  },

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

    allData[level].push({
      name: name || 'Hero',
      timeMs: timeMs,
      date: new Date().toISOString()
    });

    allData[level].sort((a, b) => a.timeMs - b.timeMs);

    if (allData[level].length > 5) {
      allData[level] = allData[level].slice(0, 5);
    }

    localStorage.setItem(STORAGE_KEY_LEADERBOARD, JSON.stringify(allData));
  },

  // ===== 遊玩時間記錄 =====

  /**
   * 儲存遊玩時間記錄
   * @param {string} name 玩家名稱
   * @param {number} totalMs 本次遊玩總時間
   */
  savePlayTime(name, totalMs) {
    const dataStr = localStorage.getItem(STORAGE_KEY_PLAYTIME);
    let records = [];
    if (dataStr) {
      try { records = JSON.parse(dataStr); } catch (e) {}
    }

    records.push({
      name: name || 'Hero',
      totalMs: totalMs,
      title: this.getTimeTitle(totalMs),
      date: new Date().toISOString()
    });

    // 按時間短的排前面，保留 20 筆
    records.sort((a, b) => a.totalMs - b.totalMs);
    if (records.length > 20) records = records.slice(0, 20);

    localStorage.setItem(STORAGE_KEY_PLAYTIME, JSON.stringify(records));
  },

  /**
   * 取得遊玩時間記錄
   */
  getPlayTimeRecords() {
    const dataStr = localStorage.getItem(STORAGE_KEY_PLAYTIME);
    if (!dataStr) return [];
    try {
      return JSON.parse(dataStr);
    } catch (e) {
      return [];
    }
  },

  /**
   * 根據累計遊玩時間回傳稱號
   * @param {number} totalMs 累計時間（毫秒）
   */
  getTimeTitle(totalMs) {
    const minutes = totalMs / 60000;
    if (minutes < 5)   return '⚡ 閃電鼠';
    if (minutes < 10)  return '🏃 疾風探索者';
    if (minutes < 20)  return '🗺️ 迷宮獵人';
    if (minutes < 40)  return '🧭 老練旅者';
    if (minutes < 60)  return '🏰 地城征服者';
    if (minutes < 120) return '👑 迷宮王者';
    return '🌟 傳奇先鋒';
  },

  savePlayerName(name) {
    localStorage.setItem('maze_last_name', name);
  },

  loadPlayerName() {
    return localStorage.getItem('maze_last_name') || '';
  },

  /**
   * 檢查是否跨越 UTC+8 的 00:00，若是則歸零排行榜
   */
  checkDailyReset() {
    const now = new Date();
    // 轉換為 UTC 毫秒
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    // 加上 8 小時得到 UTC+8 的時間
    const tpeMs = utcMs + (8 * 3600000);
    const tpeDate = new Date(tpeMs);
    const todayStr = `${tpeDate.getFullYear()}-${tpeDate.getMonth() + 1}-${tpeDate.getDate()}`;

    const lastReset = localStorage.getItem('maze_last_reset_date');
    if (lastReset !== todayStr) {
      // 跨日，清空排行榜
      localStorage.removeItem(STORAGE_KEY_LEADERBOARD);
      localStorage.removeItem(STORAGE_KEY_PLAYTIME);
      localStorage.setItem('maze_last_reset_date', todayStr);
      console.log('UTC+8 新的一天，已清空本機排行榜。');
    }
  }
};

