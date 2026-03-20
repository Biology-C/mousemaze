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
    this.maxLevel = 18; // 6 教學 + 12 原關卡
    
    // 模組
    this.ui = new UIManager(this);
    this.renderer = new Renderer('game-canvas');
    this.timer = new GameTimer();
    this.maze = null;
    this.player = null;
    this.itemManager = null;
    this.enemyManager = null;

    // 設定計時器回呼更新 UI
    this.timer.onTick = (ms) => {
      this.ui.updateHUD(this.currentLevel, ms);
      if (this.player) {
        this.ui.updateSkillHUD(this.player.drillCount, this.player.hintCount);
      }
    };

    // 教學關配置 (前 6 關)
    this.tutorialConfig = [
      null, // padding
      { name: '移動入門', size: 10, desc: '使用方向鍵或 WASD 移動到金色出口！', title: '🐾 初學者' },
      { name: '鑽牆技巧', size: 12, desc: '面向牆壁按空白鍵鑽牆！撿起🧀能量起司增加次數。', title: '⛏️ 鑽洞鼠' },
      { name: '燈塔記號', size: 12, desc: '按 Q 在面前放置燈塔！照亮迷霧，但會變成牆壁。', title: '💡 燈塔守衛' },
      { name: '道具收集', size: 14, desc: '收集紅香菇🍄透視、藍礦石💎增視野、能量起司🧀增鑽牆！', title: '🎒 探險家' },
      { name: '傳送與提示', size: 16, desc: '踩上紫色傳送陣移動！按 Z 使用路線提示。', title: '🌀 時空旅者' },
      { name: '蛇出沒注意', size: 16, desc: '躲避蛇頭！面向蛇身按空白鍵攻擊，3次消滅！用燈塔誘敵。', title: '⚔️ 勇者鼠' },
    ];

    // 正式關卡（第 7-18 關）迷宮尺寸
    this.levelSizes = [
      0, // padding (index 0不用)
      // 教學關 1-6
      10, 12, 12, 14, 16, 16,
      // 正式關 7-18 (原 1-12)
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

      // GM 模式按 F 切換迷霧
      if (this.isGM && (e.key === 'f' || e.key === 'F')) {
        this.renderer.disableFog = !this.renderer.disableFog;
      }
    });
  }

  /**
   * 判斷是否為教學關
   */
  isTutorialLevel() {
    return this.currentLevel >= 1 && this.currentLevel <= 6;
  }

  /**
   * 按下「開始新遊戲」
   */
  startNewGame() {
    this.currentLevel = 1;
    this.timer.setTotalTime(0);
    Storage.clearSave();
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

    this.renderer.resize();
    this.ui.checkMobileControls();

    // 1. 生成迷宮
    const size = this.levelSizes[this.currentLevel];
    this.maze = new Maze(size, size);
    this.maze.generate();

    // 2. 初始化角色
    if (this.player) this.player.destroy();
    this.player = new Player(this.maze.start.x, this.maze.start.y, this.renderer.cellSize, this.maze);

    // 3. 初始化道具管理器
    this.itemManager = new ItemManager(this.maze, this.player);
    this.player.itemManager = this.itemManager;

    if (this.isTutorialLevel()) {
      this.itemManager.generateTutorialItems(this.currentLevel);
    } else {
      this.itemManager.generateItems(this.currentLevel);
    }

    // 4. 初始化敵人管理器（教學第 6 關和正式關才有蛇）
    this.enemyManager = new EnemyManager(this.maze, this.player, this.itemManager);
    this.player.enemyManager = this.enemyManager;

    // 蛇出現提示
    this.enemyManager.onSnakeSpawn = () => {
      this.ui.showGameMessage('🐍 我的迷宮裡有條蛇');
    };

    // 蛇碰到玩家 → 失敗
    this.enemyManager.onPlayerEaten = () => {
      this.handlePlayerDeath('🐍 這隻老鼠被蛇吃了。');
    };

    if (this.isTutorialLevel() && this.currentLevel === 6) {
      // 教學第 6 關：直接生成一隻教學蛇
      this.enemyManager.spawnSnake();
    } else if (this.isTutorialLevel()) {
      // 教學 1-5 關不生蛇，停止計時器
      this.enemyManager.spawnInterval = Infinity;
    }
    // 正式關（7+）保持每 30 秒生成

    // 如果金手指已啟動
    if (this._cheatActivated) {
      this.player.drillCount = Infinity;
    }

    // 5. 重置計時器
    this.timer.resetLevel();
    this.timer.start();

    // 6. 更新 HUD
    this.ui.updateHUD(this.currentLevel, 0);
    this.ui.updateSkillHUD(this.player.drillCount, this.player.hintCount);

    // 7. 教學關 -> 顯示教學提示
    if (this.isTutorialLevel()) {
      const config = this.tutorialConfig[this.currentLevel];
      if (config) {
        this.ui.showGameMessage(`📖 ${config.name}：${config.desc}`);
      }
    }

    // 8. 開始主迴圈
    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
    this._animationFrameId = requestAnimationFrame(this.gameLoop);
  }

  /**
   * 主迴圈 (Game Loop)
   */
  gameLoop() {
    if (this.state !== Game.STATE_PLAYING) {
      this._animationFrameId = requestAnimationFrame(this.gameLoop);
      return;
    }

    // 玩家更新
    this.player.update();

    // 敵人更新
    if (this.enemyManager) {
      this.enemyManager.update();
    }

    // 困死偵測（放燈塔後）
    if (this.itemManager && !this.player.isMoving) {
      if (this.itemManager.isPlayerTrapped(this.player.x, this.player.y)) {
        this.handlePlayerDeath('🧱 這隻老鼠把自己困死了。');
        return;
      }
    }

    // 更新 HUD
    this.ui.updateHUD(this.currentLevel, this.timer.getCurrentLevelTime());
    this.ui.updateSkillHUD(this.player.drillCount, this.player.hintCount);

    // 渲染畫面
    this.renderer.render(this.maze, this.player, this.itemManager, this.enemyManager);

    // GM HUD
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
    } else if (this.state === Game.STATE_PAUSED) {
      this.state = Game.STATE_PLAYING;
      this.timer.start();
      this.ui.hideMenu('pause');
      this.ui.checkMobileControls();
    }
  }

  /**
   * 重新開始本關
   */
  restartCurrentLevel() {
    this.startLevel();
  }

  /**
   * 回主選單
   */
  quitToMenu(saveCurrent = true) {
    this.state = Game.STATE_MENU;
    this.timer.pause();
    if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
    
    if (this.player) this.player.destroy();
    
    if (saveCurrent) {
      Storage.saveGame(this.currentLevel, this.timer.getTotalTime());
    }
    this.ui.checkContinueBtn();
    
    this.ui.hideHUD();
    this.ui.hideMenu('pause');
    this.ui.showMenu('main');
    this.ui.checkMobileControls();
  }

  /**
   * 玩家死亡（被蛇吃、困死）→ 顯示訊息、重新開始本關
   */
  handlePlayerDeath(message) {
    this.state = Game.STATE_PAUSED;
    this.timer.pause();
    this.player.disableControl();

    this.ui.showGameMessage(message, () => {
      this.restartCurrentLevel();
    });
  }

  /**
   * 過關邏輯
   */
  handleLevelComplete() {
    this.state = Game.STATE_LEVEL_COMPLETE;
    this.timer.commitLevel();
    this.player.disableControl();
    
    const levelMs = this.timer.getCurrentLevelTime();
    const totalMs = this.timer.getTotalTime();
    
    // 教學關稱號
    let tutorialTitle = null;
    if (this.isTutorialLevel()) {
      const config = this.tutorialConfig[this.currentLevel];
      if (config) tutorialTitle = config.title;
    }

    const isNewRecord = Storage.isNewRecord(this.currentLevel, levelMs);
    this.ui.showLevelComplete(this.currentLevel, isNewRecord, levelMs, totalMs, tutorialTitle);
  }

  /**
   * 提交破紀錄名字
   */
  submitHighScore(name) {
    const levelMs = this.timer.getCurrentLevelTime();
    Storage.saveToLeaderboard(this.currentLevel, name, levelMs);
    // 同時記錄遊玩時間
    Storage.savePlayTime(name, this.timer.getTotalTime());
    this.ui.hideRecordEntry();
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
      this.quitToMenu();
    }
  }

  /**
   * 休息結算
   */
  restAndSave() {
    if (this.currentLevel < this.maxLevel) {
      Storage.saveGame(this.currentLevel + 1, this.timer.getTotalTime());
    } else {
      Storage.clearSave();
    }
    this.quitToMenu(false);
  }
}
