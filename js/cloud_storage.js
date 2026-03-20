/**
 * cloud_storage.js
 * 透過 Google Apps Script 將排行榜同步至全球。
 */

const CloudStorage = {
  // 請將您的 GAS Web App URL 貼在這裡
  GAS_URL: 'https://script.google.com/macros/s/AKfycbwMlnAAfB-kQe3Ixg0t58lAhdug0anEYRV9H9lPFipX3ASeFap4XhtIGqflpH3ADO4j/exec', 

  /**
   * 提交成績到雲端
   * @param {number} level 
   * @param {string} name 
   * @param {number} timeMs 
   */
  async submitScore(level, name, timeMs) {
    if (!this.GAS_URL) return;
    try {
      const response = await fetch(this.GAS_URL, {
        method: 'POST',
        mode: 'no-cors', // GAS 需要 no-cors 或正確的 redirect 處理
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ level, name, timeMs })
      });
      // 注意：no-cors 模式下無法讀取 response body，但資料會成功送達
      console.log('成績已嘗試提交至雲端');
    } catch (err) {
      console.error('雲端提交失敗:', err);
    }
  },

  /**
   * 從雲端取得前 10 名排行榜
   */
  async getLeaderboard() {
    if (!this.GAS_URL) return null;
    try {
      const response = await fetch(this.GAS_URL);
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('取得雲端排行榜失敗:', err);
      return null;
    }
  }
};
