/**
 * renderer.js
 * 負責 Canvas 渲染、視口(Camera)計算、繪製迷宮與角色動畫
 */

class Renderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    
    // 渲染設定
    this.cellSize = 48; // 每個格子的基礎像素大小
    this.wallThickness = 6; // 牆壁厚度
    
    // 視口 (Camera)
    this.camera = {
      x: 0,
      y: 0,
      width: 0,
      height: 0
    };
    
    this.disableFog = false;

    // 顏色定義 (根據主題)
    this.setThemeColors();

    // 處理視窗縮放
    this.resizeCallback = this.resize.bind(this);
    window.addEventListener('resize', this.resizeCallback);
    this.resize();
  }

  setThemeColors() {
    const isLight = gameSettings.theme === 'light';
    this.colors = {
      wall: isLight ? '#795548' : '#2a2a35',          // 深咖啡 vs 暗灰紫
      wallHighlight: isLight ? '#a1887f' : '#3b3b4d', // 亮咖啡
      wallShadow: isLight ? '#4e342e' : '#1a1a24',    // 暗咖啡
      floor: isLight ? '#f5f0e6' : '#111116',         // 米白底色
      floorPattern: isLight ? '#ebe3d5' : '#15151c',  // 略暗的米白
      start: isLight ? '#388e3c' : '#27ae60',         // 較深的綠色以提高對比
      end: isLight ? '#f57f17' : '#f1c40f',           // 較深的橘黃色以提高對比
      fog: isLight ? 'rgba(245, 240, 230, 1)' : 'rgba(0, 0, 0, 0.95)',
    };
  }

  resize() {
    // 更新實際可視區域高度 (--real-vh)
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.width = this.canvas.width;
    this.camera.height = this.canvas.height;
    
    // 避免畫面模糊
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * 更新相機位置 (跟隨角色)
   * @param {Object} player 角色物件 {x, y, pixelX, pixelY}
   */
  updateCamera(player) {
    // 讓鏡頭中心對準角色目前的像素位置
    const targetCamX = player.pixelX - this.camera.width / 2 + this.cellSize / 2;
    const targetCamY = player.pixelY - this.camera.height / 2 + this.cellSize / 2;

    // 平滑跟隨 (可選，現在先直接鎖定)
    this.camera.x = targetCamX;
    this.camera.y = targetCamY;
  }

  /**
   * 主渲染迴圈
   * @param {Maze} maze 迷宮實體
   * @param {Player} player 角色實體
   * @param {ItemManager} itemManager 道具管理器
   */
  render(maze, player, itemManager) {
    if (!maze || !player) return;

    this.updateCamera(player);

    // 清空背景
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    // 套用相機偏移
    this.ctx.translate(-this.camera.x, -this.camera.y);

    // 1. 計算可見範圍的格子索引 (Culling)，避免渲染整個迷宮
    const startObjCol = Math.max(0, Math.floor(this.camera.x / this.cellSize) - 1);
    const endObjCol = Math.min(maze.width, Math.ceil((this.camera.x + this.camera.width) / this.cellSize) + 1);
    const startObjRow = Math.max(0, Math.floor(this.camera.y / this.cellSize) - 1);
    const endObjRow = Math.min(maze.height, Math.ceil((this.camera.y + this.camera.height) / this.cellSize) + 1);

    // 2. 繪製地板
    for (let x = startObjCol; x < endObjCol; x++) {
      for (let y = startObjRow; y < endObjRow; y++) {
        this.ctx.fillStyle = (x % 2 === y % 2) ? this.colors.floor : this.colors.floorPattern;
        this.ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
      }
    }

    // 3. 繪製起點與終點標記
    this._drawSpecialCell(maze.start.x, maze.start.y, this.colors.start);
    this._drawSpecialCell(maze.end.x, maze.end.y, this.colors.end);

    // 4. 繪製牆壁
    for (let x = startObjCol; x < endObjCol; x++) {
      for (let y = startObjRow; y < endObjRow; y++) {
        const cell = maze.getCell(x, y);
        if (!cell) continue;

        const px = x * this.cellSize;
        const py = y * this.cellSize;
        
        // [N, E, S, W] = [0, 1, 2, 3] -> [Top, Right, Bottom, Left]
        this.ctx.fillStyle = this.colors.wall;

        if (cell.walls[0]) this.ctx.fillRect(px, py, this.cellSize, this.wallThickness); // 上
        if (cell.walls[1]) this.ctx.fillRect(px + this.cellSize - this.wallThickness, py, this.wallThickness, this.cellSize); // 右
        if (cell.walls[2]) this.ctx.fillRect(px, py + this.cellSize - this.wallThickness, this.cellSize, this.wallThickness); // 下
        if (cell.walls[3]) this.ctx.fillRect(px, py, this.wallThickness, this.cellSize); // 左
      }
    }

    // 4.5 繪製道具、傳送陣與記號
    if (itemManager) {
      this._drawItems(itemManager);
    }

    // 4.8 繪製提示路線
    this._drawHintPath(player);

    // 5. 繪製迷霧 (視線外的區域變暗)
    // 暫時使用簡單的圓形漸層來模擬視野
    this._drawVision(player);

    // 6. 繪製角色
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

    // 1. 麵包屑記號 (綠色小十字)
    this.ctx.fillStyle = 'rgba(46, 204, 113, 0.6)';
    itemManager.breadcrumbs.forEach(b => {
      const cx = b.x * this.cellSize + halfCell;
      const cy = b.y * this.cellSize + halfCell;
      const size = this.cellSize * 0.2;
      this.ctx.fillRect(cx - size/2, cy - size/8, size, size/4);
      this.ctx.fillRect(cx - size/8, cy - size/2, size/4, size);
    });

    // 2. 傳送陣 (紫色發光圈)
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

    // 3. 道具 (香菇、礦石)
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
        // 增加鑽牆次數(黃色三角形)
        this.ctx.moveTo(cx, cy - this.cellSize * 0.25);
        this.ctx.lineTo(cx + this.cellSize * 0.25, cy + this.cellSize * 0.2);
        this.ctx.lineTo(cx - this.cellSize * 0.25, cy + this.cellSize * 0.2);
        this.ctx.closePath();
        this.ctx.fillStyle = '#f1c40f';
      }
      this.ctx.fill();
    });
  }

  _drawHintPath(player) {
    if (!player || !player.hintPath || player.hintPath.length === 0) return;

    this.ctx.save();
    this.ctx.beginPath();

    // 取得起始點中心座標 (不包括正在移動中的動畫偏移，以格子中心為主)
    const startX = player.x * this.cellSize + this.cellSize / 2;
    const startY = player.y * this.cellSize + this.cellSize / 2;
    this.ctx.moveTo(startX, startY);

    // 劃線到所有路線斷點
    player.hintPath.forEach(pt => {
      const cx = pt.x * this.cellSize + this.cellSize / 2;
      const cy = pt.y * this.cellSize + this.cellSize / 2;
      this.ctx.lineTo(cx, cy);
    });

    // 樣式設定
    const isLight = gameSettings.theme === 'light';
    this.ctx.strokeStyle = isLight ? 'rgba(41, 128, 185, 0.8)' : 'rgba(52, 152, 219, 0.8)'; // 藍色路線
    this.ctx.lineWidth = 6;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // 螞蟻線特效 (動態虛線)
    this.ctx.setLineDash([15, 15]);
    // 依據時間來移動 dash offset，營造流動感 (- 以向外流動)
    this.ctx.lineDashOffset = -(Date.now() / 20) % 30;

    this.ctx.stroke();
    // 加上發光點綴
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = this.ctx.strokeStyle;
    this.ctx.stroke();

    this.ctx.restore();
  }

  _drawVision(player) {
    if (this.disableFog) return; // GM 取消迷霧

    const cx = player.pixelX + this.cellSize / 2;
    const cy = player.pixelY + this.cellSize / 2;
    // 視野半徑判定
    let radius = this.cellSize * player.permanentSightRadius;
    
    // 如果有透視效果，視野放大 10 倍 (全圖)
    if (player.hasMagicVision) {
      radius = this.cellSize * 50; 
    }

    this.ctx.save();
    
    // 使用 path 的奇偶環繞規則 (evenodd) 來挖空矩形中的圓
    this.ctx.beginPath();
    // 1. 畫一個涵蓋整個相機視角的超大矩形 (順時針)
    this.ctx.rect(this.camera.x, this.camera.y, this.camera.width, this.camera.height);
    
    // 2. 在角色位置畫一個圓形 (逆時針)，利用 arc 的反向參數
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
    
    // 填充迷霧顏色 (半透明黑)
    this.ctx.fillStyle = this.colors.fog;
    this.ctx.fill();

    // 為了讓邊緣有漸層，再畫一層帶有內部透明到外部黑的放射漸層遮罩
    const gradient = this.ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(0,0,0,0)'); // 中心透明
    gradient.addColorStop(1, this.colors.fog); // 邊緣接合迷霧色
    
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    this.ctx.restore();
  }

  destroy() {
    window.removeEventListener('resize', this.resizeCallback);
  }

  /**
   * 繪製 GM 小地圖 (在單獨的 Canvas 上)
   */
  drawMinimap(ctx, maze, player, itemManager) {
    if (!ctx || !maze) return;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    ctx.clearRect(0, 0, w, h);
    
    // 計算縮放比例
    const cellW = w / maze.width;
    const cellH = h / maze.height;
    
    // 畫迷宮牆壁
    ctx.fillStyle = '#555';
    for(let y=0; y<maze.height; y++){
      for(let x=0; x<maze.width; x++){
        const cell = maze.getCell(x, y);
        if(!cell) continue;
        const px = x * cellW;
        const py = y * cellH;
        // 小地圖不需精細牆壁，簡單畫 1px 的線段即可
        if(cell.walls[0]) ctx.fillRect(px, py, cellW, 1);
        if(cell.walls[1]) ctx.fillRect(px+cellW-1, py, 1, cellH);
        if(cell.walls[2]) ctx.fillRect(px, py+cellH-1, cellW, 1);
        if(cell.walls[3]) ctx.fillRect(px, py, 1, cellH);
      }
    }
    
    // 畫起點/終點
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(maze.start.x * cellW, maze.start.y * cellH, cellW, cellH);
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(maze.end.x * cellW, maze.end.y * cellH, cellW, cellH);
    
    // 畫道具
    if (itemManager) {
      ctx.fillStyle = '#3498db';
      itemManager.items.forEach(i => {
        ctx.fillRect(i.x * cellW + cellW*0.25, i.y * cellH + cellH*0.25, cellW*0.5, cellH*0.5);
      });
    }

    // 畫玩家
    if (player) {
      ctx.fillStyle = '#e74c3c';
      ctx.fillRect(player.x * cellW, player.y * cellH, cellW, cellH);
    }
  }
}
