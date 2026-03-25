/**
 * timer.js
 * 遊戲計時器，處理毫秒級時間計算與格式化顯示
 */

class GameTimer {
  constructor() {
    this.startTime = 0;
    this.elapsedTime = 0;   // 本關已用時間 (暫停會累計)
    this.totalTime = 0;     // 總累計時間 (前幾關的總和)
    this.isRunning = false;
    this.animationFrameId = null;
    this.onTick = null;     // 回呼函數，用於更新 UI
  }

  /**
   * 啟動/繼續計時器
   */
  start() {
    if (this.isRunning) return;
    this.startTime = performance.now();
    this.isRunning = true;
    this._tick();
  }

  /**
   * 暫停計時器
   */
  pause() {
    if (!this.isRunning) return;
    this.elapsedTime += performance.now() - this.startTime;
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * 重置本關時間
   */
  resetLevel() {
    this.pause();
    this.elapsedTime = 0;
    this.startTime = 0;
  }

  /**
   * 過關後，將本關時間結算到總時間
   */
  commitLevel() {
    this.pause();
    this.totalTime += this.elapsedTime;
  }

  /**
   * 載入存檔的總時間
   * @param {number} totalMs 
   */
  setTotalTime(totalMs) {
    this.totalTime = totalMs;
  }

  /**
   * 取得本關當前時間 (毫秒)
   */
  getCurrentLevelTime() {
    if (this.isRunning) {
      return this.elapsedTime + (performance.now() - this.startTime);
    }
    return this.elapsedTime;
  }

  /**
   * 取得總時間 (含本關正在進行的時間)
   */
  getTotalTime() {
    return this.totalTime + this.getCurrentLevelTime();
  }

  /**
   * 內部計時迴圈
   */
  _tick() {
    if (!this.isRunning) return;
    
    if (this.onTick) {
      this.onTick(this.getCurrentLevelTime());
    }

    this.animationFrameId = requestAnimationFrame(() => this._tick());
  }

  /**
   * 將毫秒格式化為 MM:SS.ms (例如: 01:23.456)
   * @param {number} ms 毫秒
   * @returns {string} 格式化字串
   */
  static formatTime(ms, showMs = true) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const padMin = String(minutes).padStart(2, '0');
    const padSec = String(seconds).padStart(2, '0');

    if (!showMs) return `${padMin}:${padSec}`;

    const milliseconds = Math.floor(ms % 1000);
    const padMs = String(milliseconds).padStart(3, '0');
    return `${padMin}:${padSec}.${padMs}`;
  }
}
