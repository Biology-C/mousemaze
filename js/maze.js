/**
 * maze.js
 * 迷宮生成模組 (遞迴回溯法 Recursive Backtracking)
 */

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
   */
  generate() {
    // 1. 初始化網格 (每格都有四面牆 [N, E, S, W]，true 表示有牆)
    this.grid = new Array(this.width);
    for (let x = 0; x < this.width; x++) {
      this.grid[x] = new Array(this.height);
      for (let y = 0; y < this.height; y++) {
        this.grid[x][y] = {
          walls: [true, true, true, true], 
          visited: false
        };
      }
    }

    // 2. 隨機選一個起點開始遞迴回溯
    let startX = Math.floor(Math.random() * this.width);
    let startY = Math.floor(Math.random() * this.height);
    this._carvePassagesFrom(startX, startY);

    // 3. 設定起點與終點 (選擇角落或邊緣，確保有一定距離)
    this._setStartAndEnd();
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
   * 設定起點與終點 (確保有一定的曼哈頓距離)
   */
  _setStartAndEnd() {
    // 簡單作法：起點設在左上角或右下角附近，終點在對角
    const isStartTopLeft = Math.random() > 0.5;

    if (isStartTopLeft) {
      this.start = { x: 0, y: 0 };
      this.end = { x: this.width - 1, y: this.height - 1 };
    } else {
      this.start = { x: this.width - 1, y: this.height - 1 };
      this.end = { x: 0, y: 0 };
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
