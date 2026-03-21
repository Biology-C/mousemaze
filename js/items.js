/**
 * items.js
 * 道具與場景物件系統
 * 負責生成地圖道具、傳送陣、玩家的燈塔記號
 */

class ItemManager {
  constructor(maze, player, game) {
    this.maze = maze;
    this.player = player;
    this.game = game;
    
    this.items = [];       // 地圖上的道具 (香菇、礦石、能量起司)
    this.breadcrumbs = []; // 玩家留下的燈塔記號
    this.teleporters = []; // 傳送地磚 (成對)
    
    // 定義道具種類
    this.TYPES = {
      MUSHROOM: 'mushroom', // 短暫透視 + 永久提示加長
      ORE: 'ore',           // 永久視野
      DRILL_UP: 'drill_up'  // 增加鑽洞次數 (能量起司)
    };
  }

  /**
   * 根據關卡難度生成隨機道具與傳送陣
   * @param {number} level 當前關卡（已含教學關偏移）
   */
  generateItems(level) {
    const multiplier = gameSettings.getDifficultyMultiplier();
    const numMushrooms = Math.floor((Math.floor(Math.random() * 3) + 1) * multiplier);
    const numOres = Math.floor((Math.floor(Math.random() * 2) + 1) * multiplier);
    const numDrills = Math.floor((Math.floor(Math.random() * 2) + 1) * multiplier);

    for (let i = 0; i < numMushrooms; i++) {
      this._spawnRandomItem(this.TYPES.MUSHROOM);
    }
    for (let i = 0; i < numOres; i++) {
      this._spawnRandomItem(this.TYPES.ORE);
    }
    for (let i = 0; i < numDrills; i++) {
      this._spawnRandomItem(this.TYPES.DRILL_UP);
    }

    // 第 12 關起（原第 6 關 +6 教學偏移）生成傳送地磚
    if (level >= 12) {
      this._generateTeleporters();
    }
  }

  /**
   * 教學關卡專用道具生成
   * @param {number} tutorialLevel 教學關編號 (1-6)
   */
  generateTutorialItems(tutorialLevel) {
    switch (tutorialLevel) {
      case 1:
        // 純移動教學，無道具
        break;
      case 2:
        // 鑽牆教學：放幾個能量起司讓玩家練習拾取
        for (let i = 0; i < 2; i++) this._spawnRandomItem(this.TYPES.DRILL_UP);
        break;
      case 3:
        // 記號/燈塔教學：無道具，引導玩家放燈塔
        break;
      case 4:
        // 道具拾取教學：各種道具都放
        for (let i = 0; i < 2; i++) this._spawnRandomItem(this.TYPES.MUSHROOM);
        for (let i = 0; i < 2; i++) this._spawnRandomItem(this.TYPES.ORE);
        for (let i = 0; i < 2; i++) this._spawnRandomItem(this.TYPES.DRILL_UP);
        break;
      case 5:
        // 傳送陣 + 提示教學
        this._generateTeleporters();
        this._spawnRandomItem(this.TYPES.MUSHROOM);
        break;
      case 6:
        // 敵人教學：放幾個道具搭配蛇
        this._spawnRandomItem(this.TYPES.DRILL_UP);
        this._spawnRandomItem(this.TYPES.MUSHROOM);
        break;
    }
  }

  /**
   * 在迷宮中尋找空地生成道具 (避開起點與終點)
   */
  _spawnRandomItem(type) {
    let x, y;
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 100) {
      x = Math.floor(Math.random() * this.maze.width);
      y = Math.floor(Math.random() * this.maze.height);
      
      if ((x !== this.maze.start.x || y !== this.maze.start.y) &&
          (x !== this.maze.end.x || y !== this.maze.end.y)) {
        const hasItem = this.items.some(item => item.x === x && item.y === y);
        const hasBreadcrumb = this.breadcrumbs.some(b => b.x === x && b.y === y);
        if (!hasItem && !hasBreadcrumb) valid = true;
      }
      attempts++;
    }

    if (valid) {
      this.items.push({ x, y, type });
    }
  }

  /**
   * 生成一對距離夠遠的傳送地磚
   */
  _generateTeleporters() {
    let t1, t2;
    let valid = false;
    let attempts = 0;
    
    while (!valid && attempts < 100) {
      t1 = {
        x: Math.floor(Math.random() * this.maze.width),
        y: Math.floor(Math.random() * this.maze.height)
      };
      t2 = {
        x: Math.floor(Math.random() * this.maze.width),
        y: Math.floor(Math.random() * this.maze.height)
      };
      
      const dist = Math.abs(t1.x - t2.x) + Math.abs(t1.y - t2.y);
      if (dist > 15 && 
          (t1.x !== this.maze.start.x || t1.y !== this.maze.start.y) &&
          (t2.x !== this.maze.start.x || t2.y !== this.maze.start.y)) {
        valid = true;
      }
      attempts++;
    }

    if (valid) {
      this.teleporters.push(t1, t2);
    }
  }

  /**
   * 玩家放置燈塔記號（牆體化：封閉該格四面牆壁）
   * @param {number} x 目標格 X
   * @param {number} y 目標格 Y
   * @param {Maze} maze 迷宮實體
   * @returns {boolean} 是否成功放置
   */
  addBreadcrumb(x, y, maze) {
    // 不可放在起點、終點
    if ((x === maze.start.x && y === maze.start.y) ||
        (x === maze.end.x && y === maze.end.y)) {
      return false;
    }
    // 檢查這個格子是否已經有記號
    const exists = this.breadcrumbs.some(b => b.x === x && b.y === y);
    if (exists) return false;

    // 放置燈塔：加入血量與受影響的牆面紀錄
    const breadcrumb = { x, y, hp: 3, changedWalls: [] };

    // 牆體化：封閉該格四面牆壁
    const cell = maze.getCell(x, y);
    if (cell) {
      for (let i = 0; i < 4; i++) {
        if (!cell.walls[i]) {
          cell.walls[i] = true;
          breadcrumb.changedWalls.push({ cx: x, cy: y, wallIdx: i });
          
          // 同步封閉鄰居的對面牆
          const dir = maze.DIRECTIONS[i];
          const nx = x + dir[0];
          const ny = y + dir[1];
          const neighbor = maze.getCell(nx, ny);
          if (neighbor) {
            const oppIdx = (i + 2) % 4;
            neighbor.walls[oppIdx] = true;
            breadcrumb.changedWalls.push({ cx: nx, cy: ny, wallIdx: oppIdx });
          }
        }
      }
    }
    this.breadcrumbs.push(breadcrumb);

    // 觸發首輪引導提示
    if (this.game && this.game.tutorialHints && !this.game.tutorialHints.firstBeaconPlaced) {
      this.game.tutorialHints.firstBeaconPlaced = true;
      this.game.ui.showHint("beacon");
      this.game.saveProgress();
    }

    return true;
  }

  /**
   * 移除燈塔記號，並恢復原本的路徑
   * @param {number} index 燈塔在陣營中的索引
   */
  removeBreadcrumb(index) {
    if (index < 0 || index >= this.breadcrumbs.length) return;
    const b = this.breadcrumbs[index];
    
    // 恢復受影響的牆壁為不封閉 (false)
    if (b.changedWalls) {
      b.changedWalls.forEach(cw => {
        const cell = this.maze.getCell(cw.cx, cw.cy);
        if (cell) cell.walls[cw.wallIdx] = false;
      });
    }
    
    // 從陣列移除
    this.breadcrumbs.splice(index, 1);
  }

  /**
   * 檢查玩家是否被困住（BFS 確認可否從玩家位置到達終點）
   * @param {number} px 玩家 X
   * @param {number} py 玩家 Y
   * @returns {boolean} true = 被困住
   */
  isPlayerTrapped(px, py) {
    if (this.player && this.player.drillCount > 0) {
      return false; // 持有鑽頭不算困死
    }
    const path = this.maze.findPath(px, py, this.maze.end.x, this.maze.end.y);
    return path.length === 0 && !(px === this.maze.end.x && py === this.maze.end.y);
  }

  /**
   * 檢查玩家當前所在格子是否有道具可撿，或是否踩在傳送陣上
   */
  checkCollisions() {
    const px = this.player.x;
    const py = this.player.y;

    // 1. 檢查道具拾取
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.x === px && item.y === py) {
        if (item.type === this.TYPES.MUSHROOM) {
          this.player.triggerMushroomEffect();
          this.player.hintRange += 10; // 吃到蘑菇提示 +10 格
          if (this.player.onStatsChanged) {
            this.player.onStatsChanged({ hintRange: this.player.hintRange });
          }
        } else if (item.type === this.TYPES.ORE) {
          this.player.permanentSightRadius += 2;
          if (this.player.onStatsChanged) {
            this.player.onStatsChanged({ sightRadius: this.player.permanentSightRadius });
          }
        } else if (item.type === this.TYPES.DRILL_UP) {
          this.player.drillCount += 1;
        }
        
        if (window.audioManager) window.audioManager.playItemPickup();

        this.items.splice(i, 1);
      }
    }

    // 2. 檢查傳送陣
    if (!this.player.isMoving && !this.player.isTeleporting) {
      if (this.teleporters.length === 2) {
        const [t1, t2] = this.teleporters;
        if (px === t1.x && py === t1.y) {
          this.player.teleportTo(t2.x, t2.y);
        } else if (px === t2.x && py === t2.y) {
          this.player.teleportTo(t1.x, t1.y);
        }
      }
    }

    // 3. 檢查特殊地磚：機會寶箱與出口轉換 (僅在抵達新格子時檢查)
    if (!this.player.isMoving && !this.player.isTeleporting) {
      const cell = this.maze.getCell(px, py);
      if (cell) {
        if (cell.type === 'chance') {
          cell.type = 'normal'; // 踩過就變回普通地磚
          this._triggerChanceBox();
        } else if (cell.type === 'exit_shift') {
          cell.type = 'normal';
          this.maze.relocateExit();
        }
      }
    }
  }

  /**
   * 觸發機會寶箱隨機事件
   */
  _triggerChanceBox() {
    const events = [
      () => this._spawnRandomItem(this.TYPES.MUSHROOM),
      () => this._spawnRandomItem(this.TYPES.ORE),
      () => this._spawnRandomItem(this.TYPES.DRILL_UP),
      () => {
        if (this.game && this.game.enemyManager) {
          this.game.enemyManager.spawnSnake();
        }
      },
      () => { this.maze.relocateExit(); }
    ];
    const randIdx = Math.floor(Math.random() * events.length);
    events[randIdx]();
  }
}
