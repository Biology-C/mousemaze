/**
 * education.js
 * 第一個教育關卡：在固定小迷宮中依序找到 1 到 5。
 */

class EducationLevelOne {
  constructor(game) {
    this.game = game;
    this.sequence = [1, 2, 3, 4, 5];
    this.tiles = [
      { value: 1, x: 0, y: 4 },
      { value: 2, x: 0, y: 2 },
      { value: 3, x: 2, y: 2 },
      { value: 4, x: 2, y: 4 },
      { value: 5, x: 4, y: 4 }
    ];
    this.expectedIndex = 1;
    this.completed = false;
    this.lastPositionKey = null;
  }

  buildMaze() {
    const maze = new Maze(5, 5);
    maze.generate(1);

    for (let x = 0; x < maze.width; x++) {
      for (let y = 0; y < maze.height; y++) {
        const cell = maze.getCell(x, y);
        cell.walls = [true, true, true, true];
        cell.type = TILE.NORMAL;
        cell.onewayDir = -1;
      }
    }

    const passages = [
      // 主要數字路線：1 → 2 → 3 → 4 → 5
      [[0, 4], [0, 3]], [[0, 3], [0, 2]],
      [[0, 2], [1, 2]], [[1, 2], [2, 2]],
      [[2, 2], [2, 3]], [[2, 3], [2, 4]],
      [[2, 4], [3, 4]], [[3, 4], [4, 4]],

      // 短支線，保留迷宮探索感但不造成失敗。
      [[0, 3], [1, 3]], [[1, 3], [1, 4]],
      [[0, 2], [0, 1]], [[0, 1], [0, 0]], [[0, 0], [1, 0]],
      [[1, 2], [1, 1]], [[1, 1], [2, 1]], [[2, 1], [2, 0]], [[2, 0], [3, 0]],
      [[2, 2], [3, 2]], [[3, 2], [3, 1]], [[3, 1], [4, 1]], [[4, 1], [4, 0]],
      [[2, 3], [3, 3]], [[3, 3], [4, 3]], [[4, 3], [4, 2]]
    ];

    passages.forEach(([from, to]) => this._openPassage(maze, from, to));
    maze.start = { x: 0, y: 4 };
    maze.end = { x: 4, y: 4 };
    maze.touchLayout();
    return maze;
  }

  _openPassage(maze, from, to) {
    const [x1, y1] = from;
    const [x2, y2] = to;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const directionIndex = dx === 1 ? 1 : dx === -1 ? 3 : dy === 1 ? 2 : 0;
    const oppositeIndex = (directionIndex + 2) % 4;
    maze.getCell(x1, y1).walls[directionIndex] = false;
    maze.getCell(x2, y2).walls[oppositeIndex] = false;
  }

  update(player) {
    if (!player || player.isMoving || this.completed) return;

    const positionKey = `${player.x},${player.y}`;
    if (positionKey === this.lastPositionKey) return;
    this.lastPositionKey = positionKey;

    const tile = this.tiles.find((entry) => entry.x === player.x && entry.y === player.y);
    if (!tile) return;

    const expectedValue = this.sequence[this.expectedIndex];
    if (tile.value !== expectedValue) return;

    this.expectedIndex++;
    const nextValue = this.sequence[this.expectedIndex] ?? null;
    this.game.ui.updateEducationProgress(tile.value, nextValue);

    if (window.audioManager) window.audioManager.playItemPickup();
    haptic('collect');

    if (nextValue === null) {
      this.completed = true;
    }
  }

  draw(ctx, cellSize, wallThickness) {
    const currentValue = this.sequence[this.expectedIndex] ?? null;
    const completedValue = this.sequence[this.expectedIndex - 1] ?? 0;

    this.tiles.forEach((tile) => {
      const cx = tile.x * cellSize + cellSize / 2;
      const cy = tile.y * cellSize + cellSize / 2;
      const isCompleted = tile.value <= completedValue;
      const isCurrent = tile.value === currentValue;
      const pulse = isCurrent ? 1 + Math.sin(Date.now() / 180) * 0.08 : 1;
      const radius = cellSize * 0.31 * pulse;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = isCompleted ? '#2ecc71' : isCurrent ? '#f1c40f' : '#ecf0f1';
      ctx.fill();
      ctx.lineWidth = Math.max(3, wallThickness * 0.65);
      ctx.strokeStyle = isCurrent ? '#ffffff' : '#34495e';
      ctx.stroke();

      ctx.fillStyle = isCompleted || isCurrent ? '#17202a' : '#2c3e50';
      ctx.font = `bold ${Math.round(cellSize * 0.45)}px 'DotGothic16', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(tile.value), cx, cy - 1);
      ctx.restore();
    });
  }
}
