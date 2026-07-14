/**
 * education.js
 * 共用的數列迷宮關卡引擎。
 */

class EducationLevel {
  constructor(game, config) {
    if (!config) throw new Error('Education level config is required.');

    this.game = game;
    this.config = config;
    this.sequence = [...config.sequence];
    this.displaySequence = [...config.displaySequence];
    this.expectedIndex = 1;
    this.completed = false;

    const sequencePositions = [
      { x: 0, y: 4 },
      { x: 0, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 4 },
      { x: 4, y: 4 }
    ].map((point) => this._transformPoint(point));
    const decoyPositions = [
      { x: 4, y: 2 },
      { x: 4, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 0 }
    ].map((point) => this._transformPoint(point));

    this.tiles = this.sequence.map((value, index) => ({
      value,
      sequenceIndex: index,
      kind: 'sequence',
      ...sequencePositions[index]
    }));
    config.decoys.forEach((value, index) => {
      this.tiles.push({
        value,
        sequenceIndex: -1,
        kind: 'decoy',
        ...decoyPositions[index]
      });
    });

    this.tileByPosition = new Map(
      this.tiles.map((tile) => [`${tile.x},${tile.y}`, tile])
    );
    this.lastPositionKey = `${sequencePositions[0].x},${sequencePositions[0].y}`;
  }

  buildMaze() {
    const maze = new Maze(5, 5);
    maze.generate(this.config.id);

    for (let x = 0; x < maze.width; x++) {
      for (let y = 0; y < maze.height; y++) {
        const cell = maze.getCell(x, y);
        cell.walls = [true, true, true, true];
        cell.type = TILE.NORMAL;
        cell.onewayDir = -1;
      }
    }

    const passages = [
      // 主要數列路線：第 1 個數字一路走到第 5 個數字。
      [[0, 4], [0, 3]], [[0, 3], [0, 2]],
      [[0, 2], [1, 2]], [[1, 2], [2, 2]],
      [[2, 2], [2, 3]], [[2, 3], [2, 4]],
      [[2, 4], [3, 4]], [[3, 4], [4, 4]],

      // 支線讓孩子可以探索，也放置需要判斷的候選數字。
      [[0, 3], [1, 3]], [[1, 3], [1, 4]],
      [[0, 2], [0, 1]], [[0, 1], [0, 0]], [[0, 0], [1, 0]],
      [[1, 2], [1, 1]], [[1, 1], [2, 1]], [[2, 1], [2, 0]], [[2, 0], [3, 0]],
      [[2, 2], [3, 2]], [[3, 2], [3, 1]], [[3, 1], [4, 1]], [[4, 1], [4, 0]],
      [[2, 3], [3, 3]], [[3, 3], [4, 3]], [[4, 3], [4, 2]]
    ];

    passages.forEach(([from, to]) => {
      const transformedFrom = this._transformPoint({ x: from[0], y: from[1] });
      const transformedTo = this._transformPoint({ x: to[0], y: to[1] });
      this._openPassage(
        maze,
        [transformedFrom.x, transformedFrom.y],
        [transformedTo.x, transformedTo.y]
      );
    });
    const firstTile = this.tiles.find((tile) => tile.sequenceIndex === 0);
    const lastTile = this.tiles.find((tile) => tile.sequenceIndex === this.sequence.length - 1);
    maze.start = { x: firstTile.x, y: firstTile.y };
    maze.end = { x: lastTile.x, y: lastTile.y };
    maze.touchLayout();
    return maze;
  }

  _transformPoint(point) {
    const variant = Math.max(0, (this.config.id - 1) % 8);
    let x = point.x;
    let y = point.y;
    if (variant >= 4) x = 4 - x;

    const rotations = variant % 4;
    for (let turn = 0; turn < rotations; turn++) {
      [x, y] = [4 - y, x];
    }
    return { x, y };
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

    const tile = this.tileByPosition.get(positionKey);
    if (!tile) return;

    if (tile.kind === 'sequence' && tile.sequenceIndex < this.expectedIndex) return;

    const expectedValue = this.sequence[this.expectedIndex];
    if (tile.kind !== 'sequence' || tile.sequenceIndex !== this.expectedIndex || tile.value !== expectedValue) {
      this.game.ui.showEducationNudge(this.config);
      return;
    }

    this.expectedIndex++;
    this.game.ui.updateEducationProgress(this.expectedIndex, this.config);

    if (window.audioManager) window.audioManager.playItemPickup();
    haptic('collect');

    if (this.expectedIndex >= this.sequence.length) {
      this.completed = true;
    }
  }

  draw(ctx, cellSize, wallThickness) {
    this.tiles.forEach((tile) => {
      const cx = tile.x * cellSize + cellSize / 2;
      const cy = tile.y * cellSize + cellSize / 2;
      const isCompleted = tile.kind === 'sequence' && tile.sequenceIndex < this.expectedIndex;
      const isHiddenAnswer = tile.kind === 'sequence'
        && this.displaySequence[tile.sequenceIndex] === null;
      const isCurrent = tile.kind === 'sequence'
        && tile.sequenceIndex === this.expectedIndex
        && !isHiddenAnswer;
      const pulse = isCurrent ? 1 + Math.sin(Date.now() / 180) * 0.08 : 1;
      const radius = cellSize * 0.31 * pulse;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = isCompleted ? '#2ecc71' : isCurrent ? '#f1c40f' : '#ecf0f1';
      ctx.fill();
      ctx.lineWidth = Math.max(3, wallThickness * 0.65);
      // 候選數字外觀一致，避免用框線顏色洩漏正確答案。
      ctx.strokeStyle = isCurrent ? '#ffffff' : '#34495e';
      ctx.stroke();

      ctx.fillStyle = isCompleted || isCurrent ? '#17202a' : '#2c3e50';
      const hasGroups = Number(this.config.groupSize) > 0;
      ctx.font = `bold ${Math.round(cellSize * (hasGroups ? 0.34 : 0.45))}px 'DotGothic16', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(tile.value), cx, cy - (hasGroups ? cellSize * 0.07 : 1));

      if (hasGroups && tile.value % this.config.groupSize === 0) {
        this._drawGroups(ctx, cx, cy + cellSize * 0.19, tile.value / this.config.groupSize, cellSize);
      }
      ctx.restore();
    });
  }

  _drawGroups(ctx, cx, cy, count, cellSize) {
    const dotRadius = Math.max(1.7, cellSize * 0.035);
    const gap = dotRadius * 2.7;
    const startX = cx - ((count - 1) * gap) / 2;
    ctx.fillStyle = '#e67e22';
    for (let index = 0; index < count; index++) {
      ctx.beginPath();
      ctx.arc(startX + index * gap, cy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
