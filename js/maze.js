/**
 * maze.js
 * 迷宮生成模組 (遞迴回溯法 Recursive Backtracking)
 */

// 地磚類型常數
const TILE = {
  NORMAL: 'normal',
  IRON: 'iron',           // 鐵牆 - 無法打洞
  MERGING: 'merging',     // 定時合併牆 - 會夾死角色
  INVERSE: 'inverse',     // 反方向地磚
  ONEWAY: 'oneway',       // 單行道地磚
  CHANCE: 'chance',       // 機會寶箱
  EXIT_SHIFT: 'exit_shift' // 出口轉換地磚
};

class Maze {
  /**
   * 初始化迷宮
   * @param {number} width 迷宮寬度 (格數)
   * @param {number} height 迷宮高度 (格數)
   */
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = [];
    this.start = { x: 0, y: 0 };
    this.end = { x: 0, y: 0 };
    
    // 方向定義：[dx, dy, 當前牆壁索引, 對面牆壁索引]
    // 牆壁索引: 0:上, 1:右, 2:下, 3:左
    this.DIRECTIONS = [
      [ 0, -1, 0, 2 ], // N
      [ 1,  0, 1, 3 ], // E
      [ 0,  1, 2, 0 ], // S
      [-1,  0, 3, 1 ]  // W
    ];
  }

  /**
   * 生成迷宮
   * @param {number} currentLevel 當前關卡 (用於放置特殊地磚)
   */
  generate(currentLevel = 1) {
    this.currentLevel = currentLevel;
    // 1. 初始化網格 (每格都有四面牆 [N, E, S, W]，true 表示有牆)
    this.grid = new Array(this.width);
    for (let x = 0; x < this.width; x++) {
      this.grid[x] = new Array(this.height);
      for (let y = 0; y < this.height; y++) {
        this.grid[x][y] = {
          walls: [true, true, true, true], 
          visited: false,
          type: TILE.NORMAL,
          onewayDir: -1
        };
      }
    }

    // 2. 隨機選一個起點開始遞迴回溯
    let startX = Math.floor(Math.random() * this.width);
    let startY = Math.floor(Math.random() * this.height);
    this._carvePassagesFrom(startX, startY);

    // 3. 設定起點與終點
    this._setStartAndEnd();
    
    // 4. 根據關卡放置特殊地磚
    if (currentLevel >= 6) this._placeSpecialTiles(currentLevel);
  }

  /**
   * 遞迴打通牆壁
   * @param {number} cx 當前X
   * @param {number} cy 當前Y
   */
  _carvePassagesFrom(cx, cy) {
    this.grid[cx][cy].visited = true;

    // 將方向隨機打亂
    const dirs = [...this.DIRECTIONS].sort(() => Math.random() - 0.5);

    for (let i = 0; i < dirs.length; i++) {
      const [dx, dy, wallIdx, oppWallIdx] = dirs[i];
      const nx = cx + dx;
      const ny = cy + dy;

      // 檢查是否超出邊界或已訪問過
      if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height && !this.grid[nx][ny].visited) {
        // 打通當前格子的牆壁
        this.grid[cx][cy].walls[wallIdx] = false;
        // 打通目標格子的對立牆壁
        this.grid[nx][ny].walls[oppWallIdx] = false;
        
        // 遞迴下一格
        this._carvePassagesFrom(nx, ny);
      }
    }
  }

  /**
   * 設定起點與終點
   * 50% 機率為對角線，50% 為隨機遠端選點
   */
  _setStartAndEnd() {
    const useCorner = Math.random() < 0.5;
    if (useCorner) {
      const isStartTopLeft = Math.random() > 0.5;
      if (isStartTopLeft) {
        this.start = { x: 0, y: 0 };
        this.end = { x: this.width - 1, y: this.height - 1 };
      } else {
        this.start = { x: this.width - 1, y: this.height - 1 };
        this.end = { x: 0, y: 0 };
      }
    } else {
      // 隨機選兩個距離足夠遠的點
      const minDist = Math.floor((this.width + this.height) * 0.6);
      let attempts = 0;
      let sx, sy, ex, ey;
      do {
        sx = Math.floor(Math.random() * this.width);
        sy = Math.floor(Math.random() * this.height);
        ex = Math.floor(Math.random() * this.width);
        ey = Math.floor(Math.random() * this.height);
        attempts++;
      } while (Math.abs(sx-ex) + Math.abs(sy-ey) < minDist && attempts < 200);
      this.start = { x: sx, y: sy };
      this.end = { x: ex, y: ey };
    }
  }

  /**
   * 根據關卡編號放置特殊地磚
   */
  _placeSpecialTiles(level) {
    const w = this.width;
    const h = this.height;
    const avoidSet = new Set();
    const avoid = (x, y) => avoidSet.add(`${x},${y}`);
    const isAvoided = (x, y) => avoidSet.has(`${x},${y}`) ||
      (x === this.start.x && y === this.start.y) ||
      (x === this.end.x && y === this.end.y);

    // --- 第 6 關起 ---
    if (level >= 6) {
      // 機會寶箱 (1~2 個)
      const numChance = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < numChance; i++) this._placeTileRandom(TILE.CHANCE, avoidSet);
      // 出口轉換地磚 (1 個)
      this._placeTileRandom(TILE.EXIT_SHIFT, avoidSet);
    }

    // --- 第 8 關起 ---
    if (level >= 8) {
      // 鐵牆 — 過道内随機居純山1~3格為鐵牆格
      const numIron = Math.floor(1 + Math.random() * 3);
      for (let i = 0; i < numIron; i++) this._placeTileRandom(TILE.IRON, avoidSet);
      // 定時合併牆 — 成組
      this._placeMergingGroup(avoidSet);
    }

    // --- 第 10 關起 ---
    if (level >= 10) {
      // 反方向地磚 — 至少 15 格接起來
      this._placeInverseStrip(avoidSet);
      // 單行道 — 選一條過道設為單行道
      this._placeOnewayStrip(avoidSet);
    }
  }

  /** 隨機放置一個特殊地磚 */
  _placeTileRandom(type, avoidSet) {
    let attempts = 0;
    while (attempts++ < 200) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      if (!this._isAvoid(x, y, avoidSet)) {
        this.grid[x][y].type = type;
        avoidSet.add(`${x},${y}`);
        return { x, y };
      }
    }
    return null;
  }

  _isAvoid(x, y, avoidSet) {
    return avoidSet.has(`${x},${y}`) ||
      (x === this.start.x && y === this.start.y) ||
      (x === this.end.x && y === this.end.y);
  }

  /** 放置一組定時合併牆（2~4 格的棟型） */
  _placeMergingGroup(avoidSet) {
    // 找一條目標前進的邋道，選取 2~4 格不被使用的格子
    const len = 2 + Math.floor(Math.random() * 3);
    let startCell = this._placeTileRandom(TILE.MERGING, avoidSet);
    if (!startCell) return;
    let cx = startCell.x, cy = startCell.y;
    const dirIdx = Math.floor(Math.random() * 4);
    const [dx, dy] = this.DIRECTIONS[dirIdx];
    for (let i = 1; i < len; i++) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= this.width || ny >= this.height) break;
      if (this._isAvoid(nx, ny, avoidSet)) break;
      this.grid[nx][ny].type = TILE.MERGING;
      avoidSet.add(`${nx},${ny}`);
      cx = nx; cy = ny;
    }
  }

  /** 放置一條連續反向地磚（至少 15 格） */
  _placeInverseStrip(avoidSet) {
    const len = 15 + Math.floor(Math.random() * 5);
    const dirIdx = Math.random() < 0.5 ? 1 : 2; // 水平或垂直
    const [dx, dy] = this.DIRECTIONS[dirIdx];
    // 隨機起點
    let sx = Math.floor(Math.random() * this.width);
    let sy = Math.floor(Math.random() * this.height);
    let placed = 0;
    let cx = sx, cy = sy;
    for (let i = 0; i < len + 50 && placed < len; i++) {
      if (cx < 0 || cy < 0 || cx >= this.width || cy >= this.height) break;
      if (!this._isAvoid(cx, cy, avoidSet)) {
        this.grid[cx][cy].type = TILE.INVERSE;
        avoidSet.add(`${cx},${cy}`);
        placed++;
      }
      cx += dx; cy += dy;
    }
  }

  /** 放置一條單行道，方向隨機選 */
  _placeOnewayStrip(avoidSet) {
    const len = 5 + Math.floor(Math.random() * 5);
    const dirIdx = Math.floor(Math.random() * 4);
    const [dx, dy] = this.DIRECTIONS[dirIdx];
    let sx = Math.floor(Math.random() * this.width);
    let sy = Math.floor(Math.random() * this.height);
    let placed = 0;
    let cx = sx, cy = sy;
    for (let i = 0; i < len + 50 && placed < len; i++) {
      if (cx < 0 || cy < 0 || cx >= this.width || cy >= this.height) break;
      if (!this._isAvoid(cx, cy, avoidSet)) {
        this.grid[cx][cy].type = TILE.ONEWAY;
        this.grid[cx][cy].onewayDir = dirIdx;
        avoidSet.add(`${cx},${cy}`);
        placed++;
      }
      cx += dx; cy += dy;
    }
  }

  /**
   * 將終點移到目前起點和終點均不同的隨機有效位置
   */
  relocateExit() {
    let attempts = 0;
    while (attempts++ < 300) {
      const ex = Math.floor(Math.random() * this.width);
      const ey = Math.floor(Math.random() * this.height);
      if ((ex !== this.start.x || ey !== this.start.y) &&
          (ex !== this.end.x || ey !== this.end.y)) {
        this.end = { x: ex, y: ey };
        return;
      }
    }
  }

  /**
   * 取得指定座標的格子物件
   */
  getCell(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.grid[x][y];
    }
    return null; // 超出邊界視為有牆
  }

  /**
   * 使用 BFS 尋找起點到終點的最短路徑
   * @param {number} sx 起點X
   * @param {number} sy 起點Y
   * @param {number} ex 終點X
   * @param {number} ey 終點Y
   * @returns {Array} 座標陣列 [{x, y}, ...]，若找不到則回傳空陣列
   */
  findPath(sx, sy, ex, ey) {
    if (sx === ex && sy === ey) return [];

    const queue = [[sx, sy]];
    const parent = new Map();
    const visited = new Set();
    
    // 將座標編碼成字串作為 Key
    const key = (x, y) => `${x},${y}`;
    visited.add(key(sx, sy));

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();

      if (cx === ex && cy === ey) {
        // 回溯找路徑
        const path = [];
        let curr = key(cx, cy);
        while (curr !== key(sx, sy)) {
          const [px, py] = curr.split(',').map(Number);
          path.push({ x: px, y: py });
          curr = parent.get(curr);
        }
        // 起點不加入路線
        return path.reverse();
      }

      const cell = this.getCell(cx, cy);
      if (!cell) continue;

      // 檢查四周相鄰非牆壁的格子
      for (let i = 0; i < this.DIRECTIONS.length; i++) {
        if (!cell.walls[i]) {
          const [dx, dy] = this.DIRECTIONS[i];
          const nx = cx + dx;
          const ny = cy + dy;
          const nKey = key(nx, ny);
          
          if (!visited.has(nKey)) {
            visited.add(nKey);
            parent.set(nKey, key(cx, cy));
            queue.push([nx, ny]);
          }
        }
      }
    }

    return []; // 找不到路徑
  }
}
