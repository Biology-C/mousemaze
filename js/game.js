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
    this._cheatActivated = false; // 避免短時間重複送出設定
    
    // 檢查排行榜每日歸零
    Storage.checkDailyReset();

    // 模組
    // 初始化 UI
    this.ui = new UIManager(this);
    this.renderer = new Renderer('game-canvas');
    this.timer = new GameTimer(); // Keep GameTimer for now, as the snippet's Timer might be a future change or typo.
    this.maze = null;
    this.player = null;
    this.itemManager = null;
    this.enemyManager = null;

    // 首輪引導旗標
    this.tutorialHints = {
      firstBeaconPlaced: false,
      firstSnakeSeen: false,
      firstSnakeAttackReady: false
    };

    // 跨關卡持久化屬性 (視野半徑、提示格數)
    this.persistentStats = { sightRadius: 6.5, hintRange: 30 };

    // 紀錄上一次輸入的姓名
    this.lastPlayerName = Storage.loadPlayerName() || '';

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
      { nameKey: 'tut1_name', size: 10, descKey: 'tut1_desc', titleKey: 'tut1_title' },
      { nameKey: 'tut2_name', size: 12, descKey: 'tut2_desc', titleKey: 'tut2_title' },
      { nameKey: 'tut3_name', size: 12, descKey: 'tut3_desc', titleKey: 'tut3_title' },
      { nameKey: 'tut4_name', size: 14, descKey: 'tut4_desc', titleKey: 'tut4_title' },
      { nameKey: 'tut5_name', size: 16, descKey: 'tut5_desc', titleKey: 'tut5_title' },
      { nameKey: 'tut6_name', size: 16, descKey: 'tut6_desc', titleKey: 'tut6_title' },
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
            this.ui.showCheatMessage(this.getI18nString('msg_cheat'));
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
            this.ui.showCheatMessage(this.getI18nString('msg_gm_on'));
            this.ui.showGMHUD();
          } else {
            this.ui.showCheatMessage(this.getI18nString('msg_gm_off'));
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
   * 取得 i18n 多國語言字串
   */
  getI18nString(key) {
    const lang = (typeof gameSettings !== 'undefined' ? gameSettings.language : 'zh') || 'zh';
    const dict = this.ui.I18N[lang] || this.ui.I18N.zh;
    return dict[key] || '';
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
    this.tutorialHints = {
      firstBeaconPlaced: false,
      firstSnakeSeen: false,
      firstSnakeAttackReady: false
    };
    this.persistentStats = { sightRadius: 6.5, hintRange: 30 }; // 重置持久化屬性
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
      if (save.tutorialHints) {
        this.tutorialHints = { ...this.tutorialHints, ...save.tutorialHints };
      }
      if (save.persistentStats) {
        this.persistentStats = { ...this.persistentStats, ...save.persistentStats };
      }
      this.startLevel();
    }
  }

  /**
   * 跳轉至指定關卡 (GM 功能)
   * @param {number} n 
   */
  skipToLevel(n) {
    if (n < 1) n = 1;
    if (n > 18) n = 18;
    this.currentLevel = n;
    
    // 強制進入遊戲狀態
    this.state = Game.STATE_PLAYING;
    this.ui.hideAllMenus();
    
    // 通過 startLevel 重新生成地圖、物體、重設計時器
    this.startLevel();

    this.ui.showCheatMessage(gameSettings.language === 'en' ? `Jump to Level ${n}` : `跳轉至第 ${n} 關`);
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

    // 1. 生成迷宮 (傳入關卡以觸發特殊地磚)
    const size = this.levelSizes[this.currentLevel];
    this.maze = new Maze(size, size);
    this.maze.generate(this.currentLevel);

    // 2. 初始化角色 (傳入持久化屬性)
    if (this.player) this.player.destroy();
    this.player = new Player(
      this.maze.start.x, this.maze.start.y,
      this.renderer.cellSize, this.maze,
      this.persistentStats
    );
    // 讓 player 能夠反饋給 game 更新 persistentStats
    this.player.onStatsChanged = (stats) => { Object.assign(this.persistentStats, stats); };

    // 3. 初始化道具管理器
    this.itemManager = new ItemManager(this.maze, this.player, this);
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
      this.ui.showGameMessage(this.getI18nString('msg_snake_spawn'));
    };

    // 蛇碰到玩家 → 失敗
    this.enemyManager.onPlayerEaten = () => {
      this.handlePlayerDeath(this.getI18nString('msg_eaten'));
    };

    if (this.isTutorialLevel() && this.currentLevel === 6) {
      // 教學第 6 關：直接生成一隻教學蛇
      this.enemyManager.spawnSnake();
    } else if (this.isTutorialLevel()) {
      // 教學 1-5 關不生蛇，停止計時器
      this.enemyManager.spawnInterval = Infinity;
    }
    // 正式關（7+）保持每 60 秒生成

    // 如果金手指已啟動
    if (this._cheatActivated) {
      this.player.drillCount = Infinity;
    }

    // 初始化定時合併牆全域狀態
    this.mergingWallClosed = false;
    this.mergingWallTimer = 0;
    this.mergingWallInterval = 3000; // 預設每 3 秒開關一次

    // 5. 重置計時器
    this.timer.resetLevel();
    this.timer.start();

    // 6. 更新 HUD
    this.ui.updateHUD(this.currentLevel, 0);
    this.ui.updateSkillHUD(this.player.drillCount, this.player.hintCount);

    if (window.audioManager) window.audioManager.changeBGM(this.currentLevel);

    // 7. 教學關 -> 顯示教學提示
    if (this.isTutorialLevel()) {
      const config = this.tutorialConfig[this.currentLevel];
      if (config) {
        this.ui.showGameMessage(`📖 ${this.getI18nString(config.nameKey)}：${this.getI18nString(config.descKey)}`);
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

    try {
    // 玩家更新
    this.player.update();

    // 敵人更新
    if (this.enemyManager) {
      this.enemyManager.update();
      
      // 首輪引導：遇蛇提示 (firstSnakeSeen)
      // 邏輯：檢查是否有任何蛇在玩家視野半徑內 (渲染器已算好 visionRadius)
      if (!this.tutorialHints.firstSnakeSeen) {
        const snakes = this.enemyManager.snakes;
        const playerVision = this.player.hasMagicVision ? Infinity : this.player.permanentSightRadius;
        
        for (const snake of snakes) {
          const dx = snake.x - this.player.x;
          const dy = snake.y - this.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist <= playerVision) {
            this.tutorialHints.firstSnakeSeen = true;
            this.ui.showHint("snakeSeen", 3500);
            this.saveProgress();
            
            // 加入 0.8s 緩衝：暫時降低蛇速
            this.enemyManager.setTemporaryBuffer(800);
            break;
          }
        }
      }

      // 首輪引導：攻擊提示 (firstSnakeAttackReady)
      // 邏輯：玩家面向蛇且無牆
      if (!this.tutorialHints.firstSnakeAttackReady) {
        const dir = this.maze.DIRECTIONS[this.player.facing];
        const tx = this.player.x + dir[0];
        const ty = this.player.y + dir[1];
        
        // 檢查目標格是否有蛇
        const snakes = this.enemyManager.snakes;
        const isSnakeInFront = snakes.some(s => Math.round(s.x) === tx && Math.round(s.y) === ty);
        
        // 檢查是否有牆
        const cell = this.maze.getCell(this.player.x, this.player.y);
        const hasWall = cell ? cell.walls[this.player.facing] : true;
        
        if (isSnakeInFront && !hasWall) {
          this.tutorialHints.firstSnakeAttackReady = true;
          this.ui.showHint("attack");
          this.ui.flashActionButton();
          this.saveProgress();
        }
      }
    }

    // 處理定時合併牆邏輯 (每 3 秒切換)
    const deltaTime = 16.6; // 假設 60fps
    this.mergingWallTimer += deltaTime;
    if (this.mergingWallTimer >= this.mergingWallInterval) {
      this.mergingWallTimer = 0;
      this._toggleMergingWalls();
    }

    // 困死偵測（放燈塔後）
    if (this.itemManager && !this.player.isMoving) {
      if (this.itemManager.isPlayerTrapped(this.player.x, this.player.y)) {
        this.handlePlayerDeath(this.getI18nString('msg_trapped'));
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

    } catch (err) {
      // 除錯用：在畫面上顯示錯誤
      const canvas = document.getElementById('game-canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ff0000';
      ctx.font = '20px monospace';
      ctx.fillText('ERROR: ' + err.message, 20, 40);
      ctx.fillText('Stack: ' + (err.stack || '').substring(0, 200), 20, 70);
      console.error('gameLoop error:', err);
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
   * 切換定時合併牆狀態
   */
  _toggleMergingWalls() {
    this.mergingWallClosed = !this.mergingWallClosed;
    
    // 遍歷整個迷宮的格子
    for (let x = 0; x < this.maze.width; x++) {
      for (let y = 0; y < this.maze.height; y++) {
        const cell = this.maze.getCell(x, y);
        if (cell && cell.type === 'merging') {
          // 如果關閉，則將此格四周的牆壁都設為 true (模擬夾死)；打開則恢復
          // 此處簡單處理：合併牆開啟時格子無牆，關閉時補滿牆
          if (this.mergingWallClosed) {
            cell.walls = [true, true, true, true];
            
            // 檢查玩家是否在此格內
            if (Math.round(this.player.x) === x && Math.round(this.player.y) === y) {
              this.handlePlayerDeath(this.getI18nString('msg_crushed_by_wall') || "被牆壁夾死了！");
            }
            // 檢查蛇是否在此格內
            if (this.enemyManager) {
              this.enemyManager.snakes.forEach(snake => {
                if (snake.alive && snake.head.x === x && snake.head.y === y) {
                  snake.alive = false; // 蛇被夾死
                }
              });
            }
            // 檢查燈塔是否在此格內
            if (this.itemManager) {
              const breadcrumbs = this.itemManager.breadcrumbs;
              for (let i = breadcrumbs.length - 1; i >= 0; i--) {
                const b = breadcrumbs[i];
                if (b.x === x && b.y === y) {
                  this.itemManager.removeBreadcrumb(i);
                }
              }
            }
          } else {
            // 打開時，清除該格原本的牆壁 
            cell.walls = [false, false, false, false];
          }
        }
      }
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
      Storage.saveGame(this.currentLevel, this.timer.getTotalTime(), this.tutorialHints);
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
      if (config) tutorialTitle = this.getI18nString(config.titleKey);
    }

    // 若開啟金手指或 GM 模式，不記錄排行榜
    const isCheat = this.isGM || this._cheatActivated;
    const isNewRecord = isCheat ? false : Storage.isNewRecord(this.currentLevel, levelMs);
    
    // 自動傳送結算結果，不跳出手動輸入框
    if (isNewRecord) {
      const name = this.lastPlayerName || 'Hero';
      this.submitHighScore(name);
    }

    // 播放勝利音樂
    if (window.audioManager) window.audioManager.playVictory();

    // 將 isNewRecord 參數傳遞 false 使其不再顯示記錄輸入框
    this.ui.showLevelComplete(this.currentLevel, false, levelMs, totalMs, tutorialTitle);
  }

  /**
   * 提交破紀錄名字
   */
  submitHighScore(name) {
    if (this.isGM || this._cheatActivated) return; // 金手指模式不存檔
    
    this.lastPlayerName = name;
    Storage.savePlayerName(name);
    
    const levelMs = this.timer.getCurrentLevelTime();
    Storage.saveToLeaderboard(this.currentLevel, name, levelMs);
    
    // 同步至全球排行榜 (Google Sheets)
    if (typeof CloudStorage !== 'undefined') {
      CloudStorage.submitScore(this.currentLevel, name, levelMs);
    }
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
      // 如果 player 屬性傳回了變更，先同步一次
      if (this.player) {
        this.persistentStats.sightRadius = this.player.permanentSightRadius;
        this.persistentStats.hintRange = this.player.hintRange;
      }
      Storage.saveGame(this.currentLevel, this.timer.getTotalTime(),
        this.tutorialHints, this.persistentStats);
      this.startLevel();
    } else {
      this.quitToMenu();
    }
  }

  /**
   * 休息結算
   */
  restAndSave() {
    if (this.player) {
      this.persistentStats.sightRadius = this.player.permanentSightRadius;
      this.persistentStats.hintRange = this.player.hintRange;
    }
    if (this.currentLevel < this.maxLevel) {
      Storage.saveGame(this.currentLevel + 1, this.timer.getTotalTime(),
        this.tutorialHints, this.persistentStats);
    } else {
      Storage.clearSave();
    }
    this.quitToMenu(false);
  }
}
