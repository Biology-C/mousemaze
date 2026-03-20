/**
 * renderer.js
 * 負責 Canvas 渲染、視口(Camera)計算、繪製迷宮與角色動畫
 */

class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    this.cellSize = 48;
    this.wallThickness = 6;
    
    this.camera = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    
    this.disableFog = false;

    this.setThemeColors();

    this.resizeCallback = this.resize.bind(this);
    window.addEventListener('resize', this.resizeCallback);
    this.resize();
  }

  setThemeColors() {
    const isLight = gameSettings.theme === 'light';
    this.colors = {
      wall: isLight ? '#795548' : '#2a2a35',
      wallHighlight: isLight ? '#a1887f' : '#3b3b4d',
      wallShadow: isLight ? '#4e342e' : '#1a1a24',
      floor: isLight ? '#f5f0e6' : '#111116',
      floorPattern: isLight ? '#ebe3d5' : '#15151c',
      start: isLight ? '#388e3c' : '#27ae60',
      end: isLight ? '#f57f17' : '#f1c40f',
      fog: isLight ? 'rgba(245, 240, 230, 1)' : 'rgba(0, 0, 0, 0.95)',
    };
  }

  resize() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.width = this.canvas.width;
    this.camera.height = this.canvas.height;
    
    this.ctx.imageSmoothingEnabled = false;
  }

  updateCamera(player) {
    const targetCamX = player.pixelX - this.camera.width / 2 + this.cellSize / 2;
    const targetCamY = player.pixelY - this.camera.height / 2 + this.cellSize / 2;
    this.camera.x = targetCamX;
    this.camera.y = targetCamY;
  }

  /**
   * 主渲染迴圈
   * @param {Maze} maze
   * @param {Player} player
   * @param {ItemManager} itemManager
   * @param {EnemyManager} enemyManager
   */
  render(maze, player, itemManager, enemyManager) {
    if (!maze || !player) return;

    this.updateCamera(player);

    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(-this.camera.x, -this.camera.y);

    const startObjCol = Math.max(0, Math.floor(this.camera.x / this.cellSize) - 1);
    const endObjCol = Math.min(maze.width, Math.ceil((this.camera.x + this.camera.width) / this.cellSize) + 1);
    const startObjRow = Math.max(0, Math.floor(this.camera.y / this.cellSize) - 1);
    const endObjRow = Math.min(maze.height, Math.ceil((this.camera.y + this.camera.height) / this.cellSize) + 1);

    // 繪製地板
    for (let x = startObjCol; x < endObjCol; x++) {
      for (let y = startObjRow; y < endObjRow; y++) {
        this.ctx.fillStyle = (x % 2 === y % 2) ? this.colors.floor : this.colors.floorPattern;
        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
      }
    }

    // 起點與終點
    this._drawSpecialCell(maze.start.x, maze.start.y, this.colors.start);
    this._drawSpecialCell(maze.end.x, maze.end.y, this.colors.end);

    // 牆壁
    for (let x = startObjCol; x < endObjCol; x++) {
      for (let y = startObjRow; y < endObjRow; y++) {
        const cell = maze.getCell(x, y);
        if (!cell) continue;
        const px = x * this.cellSize;
        const py = y * this.cellSize;
        this.ctx.fillStyle = this.colors.wall;
        if (cell.walls[0]) this.ctx.fillRect(px, py, this.cellSize, this.wallThickness);
        if (cell.walls[1]) this.ctx.fillRect(px + this.cellSize - this.wallThickness, py, this.wallThickness, this.cellSize);
        if (cell.walls[2]) this.ctx.fillRect(px, py + this.cellSize - this.wallThickness, this.cellSize, this.wallThickness);
        if (cell.walls[3]) this.ctx.fillRect(px, py, this.wallThickness, this.cellSize);
      }
    }

    // 道具、傳送陣與燈塔
    if (itemManager) {
      this._drawItems(itemManager);
    }

    // 蛇敵人
    if (enemyManager) {
      enemyManager.draw(this.ctx, this.cellSize);
    }

    // 提示路線
    this._drawHintPath(player);

    // 迷霧（多光源：玩家 + 燈塔）
    this._drawVision(player, itemManager);

    // 角色
    player.draw(this.ctx, this.cellSize);

    this.ctx.restore();
  }

  _drawSpecialCell(x, y, color) {
    const px = x * this.cellSize + this.wallThickness;
    const py = y * this.cellSize + this.wallThickness;
    const size = this.cellSize - this.wallThickness * 2;
    
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.5;
    this.ctx.fillRect(px, py, size, size);
    this.ctx.globalAlpha = 1.0;
  }

  /**
   * 繪製場景物件
   */
  _drawItems(itemManager) {
    const halfCell = this.cellSize / 2;

    // 1. 燈塔記號（發光圓 + 十字光芒）
    itemManager.breadcrumbs.forEach(b => {
      const cx = b.x * this.cellSize + halfCell;
      const cy = b.y * this.cellSize + halfCell;
      const r = this.cellSize * 0.3;

      // 光暈
      const glow = this.ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 2.5);
      glow.addColorStop(0, 'rgba(241, 196, 15, 0.6)');
      glow.addColorStop(0.5, 'rgba(241, 196, 15, 0.2)');
      glow.addColorStop(1, 'rgba(241, 196, 15, 0)');
      this.ctx.fillStyle = glow;
      this.ctx.fillRect(cx - r * 2.5, cy - r * 2.5, r * 5, r * 5);

      // 燈塔主體（黃色圓）
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
      this.ctx.fillStyle = '#f1c40f';
      this.ctx.fill();
      this.ctx.strokeStyle = '#e67e22';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      // 十字光束
      this.ctx.fillStyle = 'rgba(241, 196, 15, 0.4)';
      this.ctx.fillRect(cx - r * 0.15, cy - r * 1.5, r * 0.3, r * 3);
      this.ctx.fillRect(cx - r * 1.5, cy - r * 0.15, r * 3, r * 0.3);
    });

    // 2. 傳送陣
    itemManager.teleporters.forEach(t => {
      const cx = t.x * this.cellSize + halfCell;
      const cy = t.y * this.cellSize + halfCell;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, this.cellSize * 0.35, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#9b59b6';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
      this.ctx.fillStyle = 'rgba(155, 89, 182, 0.3)';
      this.ctx.fill();
    });

    // 3. 道具
    itemManager.items.forEach(item => {
      const cx = item.x * this.cellSize + halfCell;
      const cy = item.y * this.cellSize + halfCell;
      
      this.ctx.beginPath();
      if (item.type === 'mushroom') {
        // 香菇(紅點)
        this.ctx.arc(cx, cy, this.cellSize * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#e74c3c';
      } else if (item.type === 'ore') {
        // 礦石(藍色鑽石形)
        this.ctx.moveTo(cx, cy - this.cellSize * 0.2);
        this.ctx.lineTo(cx + this.cellSize * 0.2, cy);
        this.ctx.lineTo(cx, cy + this.cellSize * 0.2);
        this.ctx.lineTo(cx - this.cellSize * 0.2, cy);
        this.ctx.closePath();
        this.ctx.fillStyle = '#3498db';
      } else if (item.type === 'drill_up') {
        // 能量起司 🧀
        this.ctx.closePath(); // 關閉前一個 path
        this._drawCheese(cx, cy);
        return; // 跳過下面的 fill
      }
      this.ctx.fill();
    });
  }

  /**
   * 繪製能量起司圖示
   */
  _drawCheese(cx, cy) {
    const s = this.cellSize * 0.25;
    this.ctx.save();
    
    // 起司主體（黃色梯形/三角扇形）
    this.ctx.beginPath();
    this.ctx.moveTo(cx - s, cy + s * 0.8);
    this.ctx.lineTo(cx + s, cy + s * 0.8);
    this.ctx.lineTo(cx + s * 0.6, cy - s * 0.8);
    this.ctx.lineTo(cx - s * 0.2, cy - s * 0.8);
    this.ctx.closePath();
    this.ctx.fillStyle = '#f39c12';
    this.ctx.fill();
    this.ctx.strokeStyle = '#e67e22';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // 起司洞（深色小圓）
    this.ctx.beginPath();
    this.ctx.arc(cx - s * 0.2, cy + s * 0.2, s * 0.2, 0, Math.PI * 2);
    this.ctx.fillStyle = '#d68910';
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(cx + s * 0.4, cy - s * 0.1, s * 0.15, 0, Math.PI * 2);
    this.ctx.fill();

    // 能量光芒
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, s * 1.3, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(243, 156, 18, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.restore();
  }

  _drawHintPath(player) {
    if (!player || !player.hintPath || player.hintPath.length === 0) return;

    this.ctx.save();
    this.ctx.beginPath();

    const startX = player.x * this.cellSize + this.cellSize / 2;
    const startY = player.y * this.cellSize + this.cellSize / 2;
    this.ctx.moveTo(startX, startY);

    player.hintPath.forEach(pt => {
      const cx = pt.x * this.cellSize + this.cellSize / 2;
      const cy = pt.y * this.cellSize + this.cellSize / 2;
      this.ctx.lineTo(cx, cy);
    });

    const isLight = gameSettings.theme === 'light';
    this.ctx.strokeStyle = isLight ? 'rgba(41, 128, 185, 0.8)' : 'rgba(52, 152, 219, 0.8)';
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.setLineDash([15, 15]);
    this.ctx.lineDashOffset = -(Date.now() / 20) % 30;

    this.ctx.stroke();
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = this.ctx.strokeStyle;
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * 多光源迷霧：玩家 + 所有燈塔
   */
  _drawVision(player, itemManager) {
    if (this.disableFog) return;

    const playerCx = player.pixelX + this.cellSize / 2;
    const playerCy = player.pixelY + this.cellSize / 2;
    let playerRadius = this.cellSize * player.permanentSightRadius;
    
    if (player.hasMagicVision) {
      playerRadius = this.cellSize * 50;
    }

    // 收集所有光源（玩家 + 燈塔）
    const lights = [{ cx: playerCx, cy: playerCy, radius: playerRadius }];

    if (itemManager && itemManager.breadcrumbs) {
      itemManager.breadcrumbs.forEach(b => {
        lights.push({
          cx: b.x * this.cellSize + this.cellSize / 2,
          cy: b.y * this.cellSize + this.cellSize / 2,
          radius: this.cellSize * player.permanentSightRadius // 等同角色視野
        });
      });
    }

    this.ctx.save();

    // 使用 compositing 來實現多光源穿孔
    // 先在臨時 canvas 上繪製迷霧，再用 destination-out 挖洞
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.camera.width;
    tempCanvas.height = this.camera.height;
    const tctx = tempCanvas.getContext('2d');

    // 填滿迷霧色
    tctx.fillStyle = this.colors.fog;
    tctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // 用 destination-out 為每個光源挖洞
    tctx.globalCompositeOperation = 'destination-out';

    lights.forEach(light => {
      const sx = light.cx - this.camera.x;
      const sy = light.cy - this.camera.y;
      const r = light.radius;

      const gradient = tctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');   // 完全透明（挖空）
      gradient.addColorStop(0.6, 'rgba(0,0,0,0.8)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');     // 邊緣保留迷霧

      tctx.fillStyle = gradient;
      tctx.beginPath();
      tctx.arc(sx, sy, r, 0, Math.PI * 2);
      tctx.fill();
    });

    // 將迷霧圖層畫到主 Canvas
    tctx.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(tempCanvas, this.camera.x, this.camera.y);

    this.ctx.restore();
  }

  destroy() {
    window.removeEventListener('resize', this.resizeCallback);
  }

  /**
   * GM 小地圖
   */
  drawMinimap(ctx, maze, player, itemManager) {
    if (!ctx || !maze) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    const cellW = w / maze.width;
    const cellH = h / maze.height;
    
    ctx.fillStyle = '#555';
    for(let y=0; y<maze.height; y++){
      for(let x=0; x<maze.width; x++){
        const cell = maze.getCell(x, y);
        if(!cell) continue;
        const px = x * cellW;
        const py = y * cellH;
        if(cell.walls[0]) ctx.fillRect(px, py, cellW, 1);
        if(cell.walls[1]) ctx.fillRect(px+cellW-1, py, 1, cellH);
        if(cell.walls[2]) ctx.fillRect(px, py+cellH-1, cellW, 1);
        if(cell.walls[3]) ctx.fillRect(px, py, 1, cellH);
      }
    }
    
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(maze.start.x * cellW, maze.start.y * cellH, cellW, cellH);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(maze.end.x * cellW, maze.end.y * cellH, cellW, cellH);
    
    if (itemManager) {
      ctx.fillStyle = '#3498db';
      itemManager.items.forEach(i => {
        ctx.fillRect(i.x * cellW + cellW*0.25, i.y * cellH + cellH*0.25, cellW*0.5, cellH*0.5);
      });
      // 燈塔
      ctx.fillStyle = '#f1c40f';
      itemManager.breadcrumbs.forEach(b => {
        ctx.fillRect(b.x * cellW, b.y * cellH, cellW, cellH);
      });
    }

    if (player) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(player.x * cellW, player.y * cellH, cellW, cellH);
    }
  }
}

