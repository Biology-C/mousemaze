/**
 * enemy.js
 * 敵人系統 — 蛇
 * 蛇會追蹤燈塔或玩家，可被空白鍵攻擊
 */

class Snake {
  /**
   * @param {number} x 起始格 X
   * @param {number} y 起始格 Y
   * @param {Maze} maze 迷宮實體
   */
  constructor(x, y, maze) {
    this.maze = maze;
    this.segments = [{ x, y }]; // segments[0] = 頭
    this.maxLength = 4; // 蛇身最大長度
    this.hp = 3;
    this.alive = true;

    // 移動速度控制（格/幀 的計時器）
    this.moveTimer = 0;
    this.baseMoveInterval = 18; // 基本移動間隔（幀數），越大越慢
    this.moveInterval = this.baseMoveInterval;

    // 加速機制：每 20 秒加速 2 秒
    this.speedCycleTimer = 0;
    this.isRushing = false;
    this.rushMoveInterval = 10; // 加速時的移動間隔（更快）

    // 上次移動的方向（避免蛇立刻回頭）
    this.lastDir = -1;

    // 受傷閃爍
    this.hurtFlash = 0;
  }

  get head() {
    return this.segments[0];
  }

  /**
   * 每幀更新
   * @param {Player} player
   * @param {Array} breadcrumbs 燈塔列表
   */
  update(player, breadcrumbs) {
    if (!this.alive) return;

    // 加速週期計時（假設 60fps，每幀約 16ms）
    this.speedCycleTimer += 16;
    // 每 20 秒 (20000ms) 加速 2 秒 (2000ms)
    const cyclePos = this.speedCycleTimer % 22000; // 20s 正常 + 2s 加速
    if (cyclePos >= 20000) {
      this.isRushing = true;
      this.moveInterval = this.rushMoveInterval;
    } else {
      this.isRushing = false;
      this.moveInterval = this.baseMoveInterval;
    }

    // 受傷閃爍衰減
    if (this.hurtFlash > 0) this.hurtFlash--;

    // 移動計時
    this.moveTimer++;
    if (this.moveTimer < this.moveInterval) return;
    this.moveTimer = 0;

    // 決定移動目標
    let targetPos = null;

    if (breadcrumbs && breadcrumbs.length > 0) {
      // 有燈塔 → 追最近的燈塔
      let minDist = Infinity;
      breadcrumbs.forEach(b => {
        const d = Math.abs(b.x - this.head.x) + Math.abs(b.y - this.head.y);
        if (d < minDist) {
          minDist = d;
          targetPos = { x: b.x, y: b.y };
        }
      });
    } else if (player) {
      // 無燈塔 → 追玩家
      targetPos = { x: player.x, y: player.y };
    }

    // 移動一格朝目標
    this._moveToward(targetPos);
  }

  /**
   * 朝目標方向移動一格（貪婪尋路，不穿牆）
   */
  _moveToward(target) {
    const hx = this.head.x;
    const hy = this.head.y;
    const cell = this.maze.getCell(hx, hy);
    if (!cell) return;

    // 建立可走方向清單
    const dirs = [];
    for (let i = 0; i < 4; i++) {
      // 避免立刻回頭（若蛇長度 > 1）
      if (this.segments.length > 1 && i === ((this.lastDir + 2) % 4)) continue;
      if (!cell.walls[i]) {
        const dir = this.maze.DIRECTIONS[i];
        const nx = hx + dir[0];
        const ny = hy + dir[1];
        // 不走到自己身上
        if (!this.segments.some(s => s.x === nx && s.y === ny)) {
          dirs.push({ dirIdx: i, x: nx, y: ny });
        }
      }
    }

    if (dirs.length === 0) return;

    // 若有目標，選最近的方向
    let best = dirs[0];
    if (target) {
      let bestDist = Infinity;
      dirs.forEach(d => {
        const dist = Math.abs(d.x - target.x) + Math.abs(d.y - target.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = d;
        }
      });
    } else {
      // 隨機選
      best = dirs[Math.floor(Math.random() * dirs.length)];
    }

    // 移動：頭前進，尾巴跟隨
    this.segments.unshift({ x: best.x, y: best.y });
    if (this.segments.length > this.maxLength) {
      this.segments.pop();
    }
    this.lastDir = best.dirIdx;
  }

  /**
   * 受到攻擊（扣 hp）
   * @returns {boolean} 是否命中
   */
  takeDamage() {
    this.hp--;
    this.hurtFlash = 15; // 閃爍 15 幀
    if (this.hp <= 0) {
      this.alive = false;
    }
    // 被打時縮短蛇身
    if (this.segments.length > 1) {
      this.segments.pop();
    }
    return true;
  }

  /**
   * 檢查蛇頭是否碰到玩家
   */
  isCollidingWithPlayer(playerX, playerY) {
    return this.alive && this.head.x === playerX && this.head.y === playerY;
  }

  /**
   * 繪製蛇
   */
  draw(ctx, cellSize) {
    if (!this.alive) return;

    const flash = this.hurtFlash > 0 && this.hurtFlash % 4 < 2;

    this.segments.forEach((seg, idx) => {
      const px = seg.x * cellSize;
      const py = seg.y * cellSize;
      const margin = cellSize * 0.15;
      const size = cellSize - margin * 2;

      if (idx === 0) {
        // 蛇頭 — 較深的綠色
        ctx.fillStyle = flash ? '#ff4444' : (this.isRushing ? '#ff6600' : '#2ecc71');
        ctx.fillRect(px + margin, py + margin, size, size);
        // 眼睛
        ctx.fillStyle = '#000';
        const eyeSize = size * 0.2;
        ctx.fillRect(px + margin + size * 0.2, py + margin + size * 0.2, eyeSize, eyeSize);
        ctx.fillRect(px + margin + size * 0.6, py + margin + size * 0.2, eyeSize, eyeSize);
      } else {
        // 蛇身 — 較淺的綠色，交替花紋
        ctx.fillStyle = flash ? '#ff8888' : (idx % 2 === 0 ? '#27ae60' : '#1abc9c');
        ctx.fillRect(px + margin * 1.3, py + margin * 1.3, size * 0.85, size * 0.85);
      }
    });
  }
}


class EnemyManager {
  constructor(maze, player, itemManager) {
    this.maze = maze;
    this.player = player;
    this.itemManager = itemManager;
    this.snakes = [];

    // 生成計時器
    this.spawnTimer = 0;
    this.spawnInterval = 60000; // 60 秒生成一隻

    // 提示回呼
    this.onSnakeSpawn = null;  // 蛇出現時的回呼
    this.onPlayerEaten = null; // 玩家被吃時的回呼
    
    // 首輪緩衝
    this.bufferTimer = 0;
  }

  /**
   * 設置暫時性的緩衝時間，期間蛇不會移動
   * @param {number} ms 
   */
  setTemporaryBuffer(ms) {
    this.bufferTimer = ms;
  }

  /**
   * 每幀更新
   */
  update() {
    const deltaTime = 16.6; // 假設 60fps
    
    // 緩衝計時
    if (this.bufferTimer > 0) {
      this.bufferTimer -= deltaTime;
      return; // 緩衝期間不更新蛇 AI
    }
    
    // 1. 處理蛇生成
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnSnake();
    }

    // 更新所有蛇
    const breadcrumbs = this.itemManager ? this.itemManager.breadcrumbs : [];
    this.snakes.forEach(snake => {
      snake.update(this.player, breadcrumbs);

      // 檢查蛇頭碰玩家
      if (snake.isCollidingWithPlayer(this.player.x, this.player.y)) {
        if (this.onPlayerEaten) {
          this.onPlayerEaten();
        }
      }
    });

    // 清理死亡的蛇
    this.snakes = this.snakes.filter(s => s.alive);
  }

  /**
   * 生成一隻蛇（在遠離玩家的位置）
   */
  spawnSnake() {
    let x, y;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 100) {
      x = Math.floor(Math.random() * this.maze.width);
      y = Math.floor(Math.random() * this.maze.height);
      const dist = Math.abs(x - this.player.x) + Math.abs(y - this.player.y);
      // 至少離玩家 8 格
      if (dist >= 8 &&
          (x !== this.maze.start.x || y !== this.maze.start.y) &&
          (x !== this.maze.end.x || y !== this.maze.end.y)) {
        // 不要生在燈塔上
        const onBeacon = this.itemManager && this.itemManager.breadcrumbs.some(b => b.x === x && b.y === y);
        if (!onBeacon) valid = true;
      }
      attempts++;
    }

    if (valid) {
      const snake = new Snake(x, y, this.maze);
      this.snakes.push(snake);
      if (this.onSnakeSpawn) {
        this.onSnakeSpawn();
      }
    }
  }

  /**
   * 在指定座標攻擊蛇（身體/尾巴，非頭）
   * @param {number} tx 目標格 X
   * @param {number} ty 目標格 Y
   * @returns {boolean} 是否命中
   */
  attackAt(tx, ty) {
    for (const snake of this.snakes) {
      if (!snake.alive) continue;
      // 檢查蛇身/尾（跳過 segments[0] 頭部）
      for (let i = 0; i < snake.segments.length; i++) {
        const seg = snake.segments[i];
        if (seg.x === tx && seg.y === ty) {
          snake.takeDamage();
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 繪製所有蛇
   */
  draw(ctx, cellSize) {
    this.snakes.forEach(snake => snake.draw(ctx, cellSize));
  }
}
