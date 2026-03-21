/**
 * player.js
 * 玩家角色模組 (鼠)
 * - 處理移動、碰撞偵測
 * - 負責繪製角色動畫 (程式化像素圖形)
 */

class Player {
  /**
   * 初始化角色
   * @param {number} startX 起始網格 X 座標
   * @param {number} startY 起始網格 Y 座標
   * @param {number} cellSize 網格像素大小
   * @param {Maze} maze 迷宮實體 (用於碰撞檢測)
   */
  constructor(startX, startY, cellSize, maze, persistentStats = null) {
    this.x = startX;
    this.y = startY;
    
    // 實際螢幕繪製的像素座標 (為了平滑動畫)
    this.pixelX = this.x * cellSize;
    this.pixelY = this.y * cellSize;
    
    this.maze = maze;
    this.itemManager = null; // 後續由 game.js 綁定
    this.cellSize = cellSize;
    this.speed = gameSettings.speed; // 移動的平滑速度係數
    
    // 狀態管理
    this.isMoving = false;
    this.targetX = this.x;
    this.targetY = this.y;
    this.targetPixelX = this.pixelX;
    this.targetPixelY = this.pixelY;
    
    // 動畫參數
    this.facing = 1; // 0=北, 1=東, 2=南, 3=西
    this.animationFrame = 0;
    this.animationTimer = 0;
    
    // 碰撞回彈動畫
    this.bumpOffset = { x: 0, y: 0 };
    this.isBumping = false;
    
    // 傳送動畫狀態
    this.isTeleporting = false;
    
    // 技能與道具狀態 (持久化)
    this.drillCount = this._initializeDrillCount(); // 每關鑽洞次數（依難度）
    this.permanentSightRadius = persistentStats ? persistentStats.sightRadius : 6.5; // 基礎視野
    this.hintRange = persistentStats ? persistentStats.hintRange : 30; // 提示格數
    this.hasMagicVision = false; // 是否獲得全圖透視
    this.visionTimer = 0;
    
    // 提示機制狀態
    this.hintCount = this._initializeHintCount();
    this.hintPath = [];
    this.hintTimer = 0;
    this.hintStartX = -1; // 發動提示時的位置（固定起點）
    this.hintStartY = -1;
    
    // 按鍵狀態紀錄
    this.keys = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
      w: false, a: false, s: false, d: false
    };
    
    this.onStatsChanged = null;

    this._handleKeyDown = this._onKeyDown.bind(this);
    this._handleKeyUp = this._onKeyUp.bind(this);
    this.enableControl();
  }

  _initializeDrillCount() {
    switch (gameSettings.difficulty) {
      case 'heaven': return 21;
      case 'famine': return 9;
      case 'normal': 
      default: return 15;
    }
  }

  _initializeHintCount() {
    switch (gameSettings.difficulty) {
      case 'heaven': return Infinity;
      case 'famine': return 2;
      case 'normal': 
      default: return 5;
    }
  }

  enableControl() {
    window.addEventListener('keydown', this._handleKeyDown);
    window.addEventListener('keyup', this._handleKeyUp);
  }

  disableControl() {
    window.removeEventListener('keydown', this._handleKeyDown);
    window.removeEventListener('keyup', this._handleKeyUp);
    for (let k in this.keys) this.keys[k] = false;
  }

  _onKeyDown(e) {
    if (this.keys.hasOwnProperty(e.key)) {
      this.keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault(); // 防止滾動畫布
      }
    }
    
    // 單次按下觸發的技能
    // Q : 放燈塔記號（面向方向下一格）
    if ((e.key === 'q' || e.key === 'Q') && !this.isMoving) {
      if (this.itemManager) {
        const dir = this.maze.DIRECTIONS[this.facing];
        const bx = this.x + dir[0];
        const by = this.y + dir[1];
        // 確保目標格在迷宮範圍內且面前沒有牆
        const currCell = this.maze.getCell(this.x, this.y);
        if (bx >= 0 && by >= 0 && bx < this.maze.width && by < this.maze.height && currCell && !currCell.walls[this.facing]) {
          this.itemManager.addBreadcrumb(bx, by, this.maze);
        }
      }
    }
    
    // Space : 面前是牆→鑽牆(扣次數)；非牆→攻擊(不扣次數，有蛇打蛇)
    if (e.key === ' ' && !this.isMoving && !this.isBumping) {
      this._useSpaceAction();
      e.preventDefault();
    }
    
    // Z : 路線指引
    if ((e.key === 'z' || e.key === 'Z') && !this.isMoving) {
      this.useHint();
    }
  }

  /**
   * 手機等虛擬按鍵使用
   */
  setKeyDown(key) {
    this._onKeyDown({ key: key, preventDefault: () => {} });
  }

  setKeyUp(key) {
    this._onKeyUp({ key: key });
  }

  useHint() {
    if (this.hintCount > 0 && this.hintPath.length === 0) {
      const fullPath = this.maze.findPath(this.x, this.y, this.maze.end.x, this.maze.end.y);
      if (fullPath.length > 0) {
        this.hintCount--;
        // 紀錄發動時點 (使 renderer.js 能從該點畫起)
        this.hintStartX = this.x;
        this.hintStartY = this.y;
        // 截取前 hintRange 格
        this.hintPath = fullPath.slice(0, this.hintRange);
        // 持續 30 秒
        this.hintTimer = 30000;
      }
    }
  }

  _onKeyUp(e) {
    if (this.keys.hasOwnProperty(e.key)) {
      this.keys[e.key] = false;
    }
  }

  /**
   * 遊戲迴圈更新邏輯
   */
  update() {
    // 1. 處理平滑移動到目標格子
    if (this.isMoving) {
      const dx = this.targetPixelX - this.pixelX;
      const dy = this.targetPixelY - this.pixelY;
      
      // 平滑插值
      this.pixelX += dx * this.speed;
      this.pixelY += dy * this.speed;
      
      // 更新動畫幀
      this.animationTimer++;
      if (this.animationTimer > 5) {
        this.animationFrame = (this.animationFrame + 1) % 4; // 0~3 幀
        this.animationTimer = 0;
      }
      
      // 判斷是否抵達目標 (距離夠近)
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        this.pixelX = this.targetPixelX;
        this.pixelY = this.targetPixelY;
        this.x = this.targetX;
        this.y = this.targetY;
        this.isMoving = false;
        this.animationFrame = 0; // 靜止幀
        
        // 抵達新格子後，檢查道具拾取
        if (this.itemManager) this.itemManager.checkCollisions();

        // 抵達新格子，更新提示路徑 (如果處於提示狀態下)
        if (this.hintPath.length > 0) {
           const newPath = this.maze.findPath(this.x, this.y, this.maze.end.x, this.maze.end.y);
           this.hintPath = newPath.length > 0 ? newPath.slice(0, 30) : [];
        }
      }
    } 
    
    // 處理透視狀態計時
    if (this.hasMagicVision) {
      this.visionTimer -= 16; // 假設每幀約 16ms
      if (this.visionTimer <= 0) {
        this.hasMagicVision = false;
      }
    }
    
    // 處理提示路徑計時
    if (this.hintPath.length > 0) {
      this.hintTimer -= 16;
      if (this.hintTimer <= 0) {
        this.hintPath = [];
      } else {
        // 動態重新計算以確保路徑是基於當前位置 (只在到達新格子時才更新，或者單純固定前 30 格。為了讓導航隨機動態，此處可以選擇更新)
        // 為了簡單，我們可以直接不更新路徑格，只等 30 秒過期。但如果要「從玩家到終點持」，應該每次移動到新格子就刷新：
      }
    }
    
    // 2. 如果沒在移動，且沒有在播放碰撞回彈，才接受新指令
    if (!this.isMoving && !this.isBumping) {
      let nextX = this.x;
      let nextY = this.y;
      
      const currCell = this.maze.getCell(this.x, this.y);
      const isInverse = currCell && currCell.type === 'inverse';

      // 輸入映射
      let inputUp = this.keys.ArrowUp || this.keys.w;
      let inputRight = this.keys.ArrowRight || this.keys.d;
      let inputDown = this.keys.ArrowDown || this.keys.s;
      let inputLeft = this.keys.ArrowLeft || this.keys.a;

      if (isInverse) {
        // 反轉方向
        let tmpUp = inputUp;
        inputUp = inputDown;
        inputDown = tmpUp;

        let tmpRight = inputRight;
        inputRight = inputLeft;
        inputLeft = tmpRight;
      }
      
      if (inputUp) { nextY -= 1; this.facing = 0; }
      else if (inputRight) { nextX += 1; this.facing = 1; }
      else if (inputDown) { nextY += 1; this.facing = 2; }
      else if (inputLeft) { nextX -= 1; this.facing = 3; }
      
      // 如果試圖移動
      if (nextX !== this.x || nextY !== this.y) {
        if (this._canMoveTo(nextX, nextY)) {
          // 可以移動：設定新目標
          this.targetX = nextX;
          this.targetY = nextY;
          this.targetPixelX = nextX * this.cellSize;
          this.targetPixelY = nextY * this.cellSize;
          this.isMoving = true;
          if (window.audioManager) window.audioManager.playWalk();
        } else {
          // 不能移動 (撞牆)：播放輕微回彈效果
          this._playBumpAnimation();
          // 首次撞牆提示鑽牆技能
          if (this._onBump) this._onBump();
        }
      }
    }
    
    // 3. 處理碰撞回彈動畫歸零
    if (this.isBumping) {
      this.bumpOffset.x *= 0.5; // 加快衰減速度
      this.bumpOffset.y *= 0.5;
      if (Math.abs(this.bumpOffset.x) < 1.0 && Math.abs(this.bumpOffset.y) < 1.0) {
        this.bumpOffset.x = 0;
        this.bumpOffset.y = 0;
        this.isBumping = false;
        this.animationFrame = 0; // 重置為靜止幀
      }
    }
  }

  /**
   * 播放撞牆的小震動/回彈動畫
   */
  _playBumpAnimation() {
    this.isBumping = true;
    const offsetAmt = this.cellSize * 0.15; // 震動幅度
    if (this.facing === 0) this.bumpOffset.y = -offsetAmt;
    else if (this.facing === 1) this.bumpOffset.x = offsetAmt;
    else if (this.facing === 2) this.bumpOffset.y = offsetAmt;
    else if (this.facing === 3) this.bumpOffset.x = -offsetAmt;
    
    // 設定這幀是受阻的圖像
    this.animationFrame = 1;
  }

  /**
   * 檢查從當前格子是否能走到 (tx, ty)
   * @param {number} tx 目標 X
   * @param {number} ty 目標 Y
   */
  _canMoveTo(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.maze.width || ty >= this.maze.height) return false;
    
    const currCell = this.maze.getCell(this.x, this.y);
    const targetCell = this.maze.getCell(tx, ty);

    // 檢查目標格是否為單行道且與移動方向衝突
    if (targetCell && targetCell.type === 'oneway') {
      // 若目標是單行道，角色必須面對單行道的允許方向才能進入
      if (this.facing !== targetCell.onewayDir) return false;
    }

    // 檢查目標格是否有燈塔（將燈塔視為實體障礙）
    if (this.itemManager) {
      const isBeacon = this.itemManager.breadcrumbs.some(b => b.x === tx && b.y === ty);
      if (isBeacon) return false;
    }

    // [N, E, S, W] = [0, 1, 2, 3] 牆壁存在與否
    if (ty < this.y) return !currCell.walls[0]; // 想往上，如果上方沒牆就能走
    if (tx > this.x) return !currCell.walls[1]; // 想往右，如果右方沒牆就能走
    if (ty > this.y) return !currCell.walls[2]; // 想往下，如果下方沒牆就能走
    if (tx < this.x) return !currCell.walls[3]; // 想往左，如果左方沒牆就能走

    return true;
  }

  /**
   * 空白鍵統一動作：面前是牆→鑽牆(扣次數)；非牆→攻擊(不扣次數)
   */
  _useSpaceAction() {
    const currCell = this.maze.getCell(this.x, this.y);
    const wallIdx = this.facing;
    
    // 檢查面前是否有燈塔
    let isBeaconAhead = false;
    if (this.itemManager) {
      const dir = this.maze.DIRECTIONS[this.facing];
      const targetX = this.x + dir[0];
      const targetY = this.y + dir[1];
      isBeaconAhead = this.itemManager.breadcrumbs.some(b => b.x === targetX && b.y === targetY);
    }
    
    if (currCell && currCell.walls[wallIdx]) {
      // 面前有牆 → 鑽牆
      if (this.drillCount > 0) {
        this._useDrill();
      }
    } else if (isBeaconAhead) {
      // 面前有燈塔 → 視同無牆進行攻擊判斷
      this._useAttack();
    } else {
      // 面前無牆無燈塔 → 攻擊（不扣鑽牆次數）
      this._useAttack();
    }
  }

  /**
   * 使用鑽洞技能：打通面向前方的牆壁
   */
  _useDrill() {
    const currCell = this.maze.getCell(this.x, this.y);
    let targetX = this.x;
    let targetY = this.y;
    let wallIdx = this.facing; 
    let oppWallIdx = (this.facing + 2) % 4;
    
    if (this.facing === 0) targetY -= 1;
    if (this.facing === 1) targetX += 1;
    if (this.facing === 2) targetY += 1;
    if (this.facing === 3) targetX -= 1;
    
    if (targetX < 0 || targetY < 0 || targetX >= this.maze.width || targetY >= this.maze.height) {
      return;
    }
    
    if (currCell.walls[wallIdx]) {
      const targetCell = this.maze.getCell(targetX, targetY);
      
      // 檢查是否為鐵牆（若當前格或目標格是鐵牆，則不可鑽）
      if ((currCell && currCell.type === 'iron') || (targetCell && targetCell.type === 'iron')) {
        this._playBumpAnimation();
        // UI 顯示無法鑽牆提示（可由 ui.js 或 game.js 處理，這裡單純防止鑽過）
        return;
      }

      currCell.walls[wallIdx] = false;
      if (targetCell) {
        targetCell.walls[oppWallIdx] = false;
      }
      this.drillCount--;
      this._playBumpAnimation();
      if (window.audioManager) window.audioManager.playDig();
    }
  }

  /**
   * 攻擊面前的蛇（不消耗鑽牆次數）
   */
  _useAttack() {
    let targetX = this.x;
    let targetY = this.y;
    if (this.facing === 0) targetY -= 1;
    if (this.facing === 1) targetX += 1;
    if (this.facing === 2) targetY += 1;
    if (this.facing === 3) targetX -= 1;
    
    // 透過 game 的 enemyManager 檢查蛇
    if (this.enemyManager) {
      const result = this.enemyManager.attackAt(targetX, targetY);
      const hit = typeof result === 'object' ? result.hit : result;
      if (hit) {
        this._playBumpAnimation();
        if (result && result.killed) {
          this.drillCount += 3; // 擊敗蛇，增加3次打洞機會
        }
      }
    }
  }

  /**
   * 觸發透視香菇效果
   */
  triggerMushroomEffect() {
    this.hasMagicVision = true;
    this.visionTimer = 10000; // 10秒
  }

  /**
   * 傳送到指定座標
   */
  teleportTo(tx, ty) {
    this.isTeleporting = true;
    this.x = tx;
    this.y = ty;
    this.targetX = tx;
    this.targetY = ty;
    this.pixelX = tx * this.cellSize;
    this.pixelY = ty * this.cellSize;
    this.targetPixelX = this.pixelX;
    this.targetPixelY = this.pixelY;
    
    // 一小段時間後解鎖移動，避免連續傳送
    setTimeout(() => {
      this.isTeleporting = false;
    }, 500);
  }

  /**
   * 檢查是否抵達終點
   */
  checkWin() {
    // 只有確實走到格子中央時才算過關
    return !this.isMoving && this.x === this.maze.end.x && this.y === this.maze.end.y;
  }

  /**
   * 繪製角色本身
   */
  draw(ctx, cellSize) {
    const drawX = this.pixelX + this.bumpOffset.x;
    const drawY = this.pixelY + this.bumpOffset.y;
    
    // 我們要在格子的正中央繪製一隻大小略小於格子的老鼠
    const renderSize = cellSize * 0.7; 
    const margin = (cellSize - renderSize) / 2;
    
    ctx.save();
    // 移到格中心點方便旋轉繪製
    ctx.translate(drawX + cellSize / 2, drawY + cellSize / 2);
    
    // 依據面對方向旋轉 Canvas (0:北, 1:東即右轉90度...)
    ctx.rotate(this.facing * Math.PI / 2);
    
    // 相對左上角的作圖座標
    const rx = -renderSize / 2;
    const ry = -renderSize / 2;
    
    // == 繪製像素小白鼠 (朝上為正向) ==
    
    // 1. 老鼠身體 (白色橢圓狀)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(rx + renderSize*0.25, ry + renderSize*0.3, renderSize*0.5, renderSize*0.5);
    // 身體圓角修飾
    ctx.fillRect(rx + renderSize*0.35, ry + renderSize*0.2, renderSize*0.3, renderSize*0.1); 
    ctx.fillRect(rx + renderSize*0.35, ry + renderSize*0.8, renderSize*0.3, renderSize*0.1);
    
    // 2. 老鼠耳朵 (粉膚色)
    ctx.fillStyle = "#ffb6c1";
    ctx.fillRect(rx + renderSize*0.2, ry + renderSize*0.25, renderSize*0.2, renderSize*0.2); // 左耳
    ctx.fillRect(rx + renderSize*0.6, ry + renderSize*0.25, renderSize*0.2, renderSize*0.2); // 右耳
    
    // 3. 眼睛 (黑/紅色點)
    ctx.fillStyle = "#ff4040";
    ctx.fillRect(rx + renderSize*0.35, ry + renderSize*0.15, renderSize*0.1, renderSize*0.1);
    ctx.fillRect(rx + renderSize*0.55, ry + renderSize*0.15, renderSize*0.1, renderSize*0.1);
    
    // 4. 老鼠尾巴 (粉橘色長條，會隨動畫搖擺)
    ctx.fillStyle = "#ffccbb";
    // 尾巴根部
    ctx.fillRect(rx + renderSize*0.45, ry + renderSize*0.85, renderSize*0.1, renderSize*0.15);
    
    // 根據動畫幀決定尾巴擺動方向
    let tailOffset = 0;
    if (this.isMoving) {
       // animationFrame: 0, 1, 2, 3 -> (-1, 0, 1, 0)
       if (this.animationFrame === 0) tailOffset = -renderSize*0.15;
       if (this.animationFrame === 2) tailOffset = renderSize*0.15;
    }
    // 尾巴末端
    ctx.fillRect(rx + renderSize*0.45 + tailOffset, ry + renderSize*0.95, renderSize*0.1, renderSize*0.15);

    ctx.restore();
  }

  destroy() {
    this.disableControl();
  }
}
