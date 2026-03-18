/**
 * items.js
 * 道具與場景物件系統
 * 負責生成地圖道具、傳送陣、玩家的麵包屑記號
 */

class ItemManager {
  constructor(maze, player) {
    this.maze = maze;
    this.player = player;
    
    this.items = [];       // 地圖上的道具 (香菇、礦石)
    this.breadcrumbs = []; // 玩家留下的起司記號
    this.teleporters = []; // 傳送地磚 (成對)
    
    // 定義道具種類
    this.TYPES = {
      MUSHROOM: 'mushroom', // 短暫透視
      ORE: 'ore',           // 永久視野
      DRILL_UP: 'drill_up'  // 增加鑽洞次數
    };
  }

  /**
   * 根據關卡難度生成隨機道具與傳送陣
   * @param {number} level 當前關卡
   */
  generateItems(level) {
    const multiplier = gameSettings.getDifficultyMultiplier();
    const numMushrooms = Math.floor((Math.floor(Math.random() * 3) + 1) * multiplier); // 原 1~3顆
    const numOres = Math.floor((Math.floor(Math.random() * 2) + 1) * multiplier);      // 原 1~2顆
    const numDrills = Math.floor((Math.floor(Math.random() * 2) + 1) * multiplier);    // 1~2顆 黃色三角形

    // 生成香菇
    for (let i = 0; i < numMushrooms; i++) {
      this._spawnRandomItem(this.TYPES.MUSHROOM);
    }
    
    // 生成礦石
    for (let i = 0; i < numOres; i++) {
      this._spawnRandomItem(this.TYPES.ORE);
    }

    // 生成增加鑽牆次數道具
    for (let i = 0; i < numDrills; i++) {
      this._spawnRandomItem(this.TYPES.DRILL_UP);
    }

    // 第6關開始生成傳送地磚 (1對)
    if (level >= 6) {
      this._generateTeleporters();
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
      
      // 確保不是起點或終點
      if ((x !== this.maze.start.x || y !== this.maze.start.y) &&
          (x !== this.maze.end.x || y !== this.maze.end.y)) {
        
        // 確保這個位子還沒有被放過道具
        const hasItem = this.items.some(item => item.x === x && item.y === y);
        if (!hasItem) valid = true;
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
      
      // 確保不是起點終點，且兩者距離至少 15 格以上
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
   * 玩家留下麵包屑記號
   * @param {number} x
   * @param {number} y
   */
  addBreadcrumb(x, y) {
    // 檢查這個格子是否已經有記號，避免重複放置
    const exists = this.breadcrumbs.some(b => b.x === x && b.y === y);
    if (!exists) {
      this.breadcrumbs.push({ x, y });
    }
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
        // 觸發效果
        if (item.type === this.TYPES.MUSHROOM) {
          this.player.triggerMushroomEffect();
        } else if (item.type === this.TYPES.ORE) {
          this.player.permanentSightRadius += 2;
        } else if (item.type === this.TYPES.DRILL_UP) {
          this.player.drillCount += 1;
        }
        
        // 移除道具
        this.items.splice(i, 1);
      }
    }

    // 2. 檢查傳送陣 (如果在移動中不觸發，避免剛傳送完又傳回去)
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
  }
}
