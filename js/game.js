/**
 * game.js
 * 遊戲主控台：負責串接所有模組、狀態機切換、主迴圈(Game Loop)
 */

class Game {
  // 狀態常數
  static STATE_MENU = 0;
  static STATE_PLAYING = 1;
  static STATE_PAUSED = 2;
  static STATE_LEVEL_COMPLETE = 3;

  constructor() {
    this.state = Game.STATE_MENU;
    this.currentLevel = 1;
    this.maxLevel = 12;
    
    // 模組
    this.ui = new UIManager(this);
    this.renderer = new Renderer('game-canvas');
    this.timer = new GameTimer();
    this.maze = null;
    this.player = null;
    this.itemManager = null;

    // 設定計時器回呼更新 UI (每幀更新)
    this.timer.onTick = (ms) => {
      this.ui.updateHUD(this.currentLevel, ms);
      if (this.player) {
        this.ui.updateSkillHUD(this.player.drillCount, this.player.hintCount);
      }
    };

    // 每關的迷宮尺寸設定
    // 1-12 關漸增
    this.levelSizes = [
      0, // padding (index 0不用)
      30, 33, 36, 39, 42, 45, 48, 51, 55, 59, 63, 67
    ];

    this._animationFrameId = null;
    this.gameLoop = this.gameLoop.bind(this);

    // 金手指序列偵測 (上上下下左左右右BA)
    this._cheatCode = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowLeft',
      'ArrowRight', 'ArrowRight',
      'b', 'a'
    ];
    this._cheatIndex = 0;
    this._cheatActivated = false;

    // GM 金手指序列偵測
    this._gmCode = ['i', 'm', 's', 'u', 'p', 'e', 'r', 'g', 'm'];
    this._gmIndex = 0;
    this.isGM = false;

    window.addEventListener('keydown', (e) => {
      // 處理經典金手指
      const expected = this._cheatCode[this._cheatIndex];
      if (e.key === expected || e.key === expected.toUpperCase()) {
        this._cheatIndex++;
        if (this._cheatIndex >= this._cheatCode.length) {
          this._cheatIndex = 0;
          if (!this._cheatActivated) {
            this._cheatActivated = true;
            if (this.player) {
              this.player.drillCount = Infinity;
            }
            this.ui.showCheatMessage('🐭 金手指啟動！無限鑽牆！');
          }
        }
      } else {
        this._cheatIndex = 0;
      }

      // 處理 GM 金手指
      if (e.key === this._gmCode[this._gmIndex] || e.key.toLowerCase() === this._gmCode[this._gmIndex]) {
        this._gmIndex++;
        if (this._gmIndex >= this._gmCode.length) {
          this._gmIndex = 0;
          this.isGM = !this.isGM;
          if (this.isGM) {
            this.ui.showCheatMessage('👑 GM 模式開啟！');
            this.ui.showGMHUD();
          } else {
            this.ui.showCheatMessage('GM 模式關閉');
            this.ui.hideGMHUD();
          }
        }
      } else {
        this._gmIndex = 0;
      }

      // 如果是 GM 模式，允許按 F 鍵切換迷霧
      if (this.isGM && (e.key === 'f' || e.key === 'F')) {
        this.renderer.disableFog = !this.renderer.disableFog;
      }
    });
  }

  /**
   * 按下「開始新遊戲」
   */
  startNewGame() {
    this.currentLevel = 1;
    this.timer.setTotalTime(0);
    Storage.clearSave(); // 清除舊存檔
    this.startLevel();
  }

  /**
   * 按下「繼續遊戲」
   */
  continueGame() {
    const save = Storage.loadGame();
    if (save) {
      this.currentLevel = save.level;
      this.timer.setTotalTime(save.totalTimeMs);
      this.startLevel();
    }
  }

  /**
   * 初始化並進入這關
   */
  startLevel() {
    this.state = Game.STATE_PLAYING;
    this.ui.hideAllMenus();
    this.ui.showHUD();
    this.ui.checkMobileControls(); // 切換到遊戲中，檢查是否需要顯示虛擬按鍵
    
    // 1. 生成迷宮
    const size = this.levelSizes[this.currentLevel];
    this.maze = new Maze(size, size);
    this.maze.generate();

    // 2. 初始化角色 (放在迷宮起點)
    if (this.player) this.player.destroy();
    this.player = new Player(this.maze.start.x, this.maze.start.y, this.renderer.cellSize, this.maze);

    // 3. 初始化道具管理器
    this.itemManager = new ItemManager(this.maze, this.player);
    this.player.itemManager = this.itemManager; // 讓角色能呼叫記號功能與拾取判定
    this.itemManager.generateItems(this.currentLevel);

    // 如果金手指已啟動，保持無限鑽牆
    if (this._cheatActivated) {
      this.player.drillCount = Infinity;
    }

    // 4. 重置本關計時器
    this.timer.resetLevel();
    this.timer.start();

    // 5. 初始化 UI 狀態
    this.ui.updateHUD(this.currentLevel, 0);
    this.ui.updateSkillHUD(this.player.drillCount, this.player.hintCount);

    // 6. 開始主迴圈
    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId); // Changed from animationFrameId
    this._animationFrameId = requestAnimationFrame(this.gameLoop); // Changed from loop
  }

  /**
   * 主迴圈 (Game Loop)
   */
  gameLoop() { // Changed from loop
    // 暫停檢查
    if (this.state !== Game.STATE_PLAYING) {
      this._animationFrameId = requestAnimationFrame(this.gameLoop);
      return;
    }

    // 玩家更新
    this.player.update();

    // 更新 HUD
    this.ui.updateHUD(this.currentLevel, this.timer.getCurrentLevelTime());
    this.ui.updateSkillHUD(this.player.drillCount, this.player.hintCount);

    // 渲染畫面
    this.renderer.render(this.maze, this.player, this.itemManager);

    // 渲染 GM HUD
    if (this.isGM) {
      this.ui.updateGMHUD(
        this.player.speed, 
        this.itemManager ? this.itemManager.items.length : 0,
        !this.renderer.disableFog
      );
      this.renderer.drawMinimap(this.ui.gmMinimapCtx, this.maze, this.player, this.itemManager);
    }

    // 檢查是否過關
    if (this.player.checkWin()) {
      this.handleLevelComplete();
    }

    // 除非退回主選單，否則一直跑迴圈保持畫面刷新
    if (this.state !== Game.STATE_MENU) {
      this._animationFrameId = requestAnimationFrame(this.gameLoop);
    }
  }

  /**
   * 暫停/繼續 切換
   */
  togglePause() {
    if (this.state === Game.STATE_PLAYING) {
      this.state = Game.STATE_PAUSED;
      this.timer.pause();
      this.ui.showMenu('pause');
      // 畫面變成半透明的選單底色
    } else if (this.state === Game.STATE_PAUSED) {
      this.state = Game.STATE_PLAYING;
      this.timer.start();
      this.ui.hideMenu('pause');
      this.ui.checkMobileControls(); // 恢復時檢查顯示
    }
  }

  /**
   * 重新開始本關
   */
  restartCurrentLevel() {
    // 扣回這關尚未過關的時間
    this.startLevel();
  }

  /**
   * 回主選單可以保存進度 (休息結算)
   */
  quitToMenu() {
    this.state = Game.STATE_MENU;
    this.timer.pause();
    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId); // Changed from animationFrameId
    
    // 如果是正在玩，存檔是存「當前關卡重新開始」的狀態
    if (this.player) this.player.destroy();
    
    Storage.saveGame(this.currentLevel, this.timer.totalTime);
    this.ui.checkContinueBtn();
    
    this.ui.hideHUD();
    this.ui.hideMenu('pause');
    this.ui.showMenu('main'); // Changed from 'ending' to 'main' as per original logic
    this.ui.checkMobileControls(); // 結局時隱藏虛擬按鍵
  }

  /**
   * 過關邏輯
   */
  handleLevelComplete() {
    this.state = Game.STATE_LEVEL_COMPLETE;
    this.timer.commitLevel();
    this.player.disableControl();
    
    // 結算畫面
    const levelMs = this.timer.getCurrentLevelTime();
    const totalMs = this.timer.getTotalTime();
    
    // 檢查是否破紀錄 (這關的單關紀錄)
    if (Storage.isNewRecord(this.currentLevel, levelMs)) {
      this.ui.showNameEntry();
    } else {
      this.ui.showLevelComplete(this.currentLevel, false, levelMs, totalMs);
    }
  }

  /**
   * 提交破紀錄名字
   */
  submitHighScore(name) {
    const levelMs = this.timer.getCurrentLevelTime();
    Storage.saveToLeaderboard(this.currentLevel, name, levelMs);
    
    // 關閉輸入框，顯示過關總結
    this.ui.hideMenu('nameEntry');
    this.ui.showLevelComplete(this.currentLevel, true, levelMs, this.timer.getTotalTime());
  }

  /**
   * 進入下一關
   */
  startNextLevel() {
    if (this.currentLevel < this.maxLevel) {
      this.currentLevel++;
      Storage.saveGame(this.currentLevel, this.timer.getTotalTime());
      this.startLevel();
    } else {
      // 已經是第12關
      this.quitToMenu();
    }
  }

  /**
   * 休息結算
   */
  restAndSave() {
    if (this.currentLevel < this.maxLevel) {
      // 先儲存"下一關"的進度
      Storage.saveGame(this.currentLevel + 1, this.timer.getTotalTime());
    } else {
      // 全部過關，清空進度
      Storage.clearSave();
    }
    this.quitToMenu();
  }
}
