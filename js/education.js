/**
 * education.js
 * 共用教育迷宮引擎：數字、顏色、位值與混合線索。
 */

class EducationLevel {
  constructor(game, config) {
    if (!config) throw new Error('Education level config is required.');

    this.game = game;
    this.config = config;
    this.sequence = [...config.sequence];
    this.displaySequence = [...config.displaySequence];
    this.expectedIndex = 1;
    this.sequenceComplete = false;
    this.gateUnlocked = false;
    this.completed = false;
    this.wrongAttempts = 0;

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
      tried: false,
      ...sequencePositions[index]
    }));
    config.decoys.forEach((value, index) => {
      this.tiles.push({
        value,
        sequenceIndex: -1,
        kind: 'decoy',
        tried: false,
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
      [[0, 4], [0, 3]], [[0, 3], [0, 2]],
      [[0, 2], [1, 2]], [[1, 2], [2, 2]],
      [[2, 2], [2, 3]], [[2, 3], [2, 4]],
      [[2, 4], [3, 4]], [[3, 4], [4, 4]],
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
    const exit = this._transformPoint({ x: 4, y: 1 });
    maze.start = { x: firstTile.x, y: firstTile.y };
    maze.end = { x: exit.x, y: exit.y };
    this.exit = { ...maze.end };
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

    if (this.gateUnlocked && player.x === this.exit.x && player.y === this.exit.y) {
      this.completed = true;
      return;
    }

    const tile = this.tileByPosition.get(positionKey);
    if (!tile || this.sequenceComplete) return;
    if (tile.kind === 'sequence' && tile.sequenceIndex < this.expectedIndex) return;

    const expectedValue = this.sequence[this.expectedIndex];
    const isCorrect = tile.kind === 'sequence'
      && tile.sequenceIndex === this.expectedIndex
      && tile.value === expectedValue;

    if (!isCorrect) {
      this.wrongAttempts++;
      if (tile.kind === 'decoy') tile.tried = true;
      this.game.ui.showEducationNudge(this.config, this.wrongAttempts);
      return;
    }

    this.expectedIndex++;
    this.game.ui.updateEducationProgress(this.expectedIndex, this.config);

    if (window.audioManager) window.audioManager.playItemPickup();
    haptic('collect');

    if (this.expectedIndex >= this.sequence.length) {
      this.sequenceComplete = true;
      this.gateUnlocked = true;
      this.game.ui.showEducationGateUnlocked(this.config);
    }
  }

  draw(ctx, cellSize, wallThickness) {
    this._drawGate(ctx, cellSize, wallThickness);
    this.tiles.forEach((tile) => this._drawTile(ctx, tile, cellSize, wallThickness));
  }

  _drawGate(ctx, cellSize, wallThickness) {
    if (!this.exit) return;
    const cx = this.exit.x * cellSize + cellSize / 2;
    const cy = this.exit.y * cellSize + cellSize / 2;
    const size = cellSize * 0.56;
    const pulse = this.gateUnlocked ? 1 + Math.sin(Date.now() / 160) * 0.08 : 1;

    ctx.save();
    if (this.gateUnlocked) {
      ctx.shadowBlur = cellSize * 0.35;
      ctx.shadowColor = '#f1c40f';
    }
    ctx.fillStyle = this.gateUnlocked ? '#f1c40f' : '#566573';
    ctx.strokeStyle = this.gateUnlocked ? '#fff3b0' : '#273746';
    ctx.lineWidth = Math.max(3, wallThickness * 0.7);
    ctx.fillRect(cx - size * pulse / 2, cy - size * pulse / 2, size * pulse, size * pulse);
    ctx.strokeRect(cx - size * pulse / 2, cy - size * pulse / 2, size * pulse, size * pulse);
    ctx.shadowBlur = 0;
    ctx.fillStyle = this.gateUnlocked ? '#17202a' : '#ecf0f1';
    ctx.font = `bold ${Math.round(cellSize * 0.4)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.gateUnlocked ? '★' : '🔒', cx, cy);
    ctx.restore();
  }

  _drawTile(ctx, tile, cellSize, wallThickness) {
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
    const token = this._tokenMeta(tile.value);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    const isColoredToken = token.kind === 'color' || token.kind === 'mixed';
    ctx.fillStyle = isColoredToken
      ? token.color
      : isCompleted
        ? '#2ecc71'
        : isCurrent ? '#f1c40f' : '#ecf0f1';
    ctx.fill();
    ctx.lineWidth = Math.max(3, wallThickness * 0.65);
    ctx.strokeStyle = isCurrent ? '#ffffff' : isCompleted ? '#a9dfbf' : '#34495e';
    ctx.stroke();

    if (token.kind === 'color') {
      ctx.fillStyle = token.textColor;
      ctx.font = `bold ${Math.round(cellSize * 0.38)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(token.shape, cx, cy);
    } else if (token.kind === 'mixed') {
      ctx.fillStyle = token.textColor;
      ctx.font = `bold ${Math.round(cellSize * 0.34)}px 'DotGothic16', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(token.number, cx, cy - cellSize * 0.05);
      ctx.font = `bold ${Math.round(cellSize * 0.13)}px sans-serif`;
      ctx.fillText(token.shape, cx, cy + cellSize * 0.18);
    } else {
      ctx.fillStyle = isCompleted || isCurrent ? '#17202a' : '#2c3e50';
      const hasGroups = Number(this.config.groupSize) > 0;
      const hasPlaceValue = this.config.taskType === 'place-value';
      ctx.font = `bold ${Math.round(cellSize * (hasGroups || hasPlaceValue ? 0.32 : 0.45))}px 'DotGothic16', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(tile.value), cx, cy - (hasGroups || hasPlaceValue ? cellSize * 0.08 : 1));

      if (hasGroups && Number(tile.value) % this.config.groupSize === 0) {
        this._drawGroups(ctx, cx, cy + cellSize * 0.19, Number(tile.value) / this.config.groupSize, cellSize);
      } else if (hasPlaceValue) {
        this._drawPlaceValue(ctx, cx, cy + cellSize * 0.18, tile.value, cellSize);
      }
    }

    if (tile.tried) {
      ctx.fillStyle = 'rgba(44, 62, 80, 0.88)';
      ctx.beginPath();
      ctx.arc(cx + radius * 0.68, cy - radius * 0.68, cellSize * 0.11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(cellSize * 0.18)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('×', cx + radius * 0.68, cy - radius * 0.68);
    }
    ctx.restore();
  }

  _tokenMeta(value) {
    const colors = window.EDUCATION_COLOR_TOKENS || {};
    if (typeof value === 'string' && colors[value]) {
      return { kind: 'color', ...colors[value] };
    }
    if (typeof value === 'string' && value.includes(':')) {
      const [number, colorKey] = value.split(':');
      const color = colors[colorKey];
      if (color) return { kind: 'mixed', number, colorKey, ...color };
    }
    return { kind: 'number', label: String(value) };
  }

  _drawGroups(ctx, cx, cy, count, cellSize) {
    const dotRadius = Math.max(1.5, cellSize * 0.031);
    const gap = dotRadius * 2.55;
    const startX = cx - ((count - 1) * gap) / 2;
    ctx.fillStyle = '#e67e22';
    for (let index = 0; index < count; index++) {
      ctx.beginPath();
      ctx.arc(startX + index * gap, cy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawPlaceValue(ctx, cx, cy, value, cellSize) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;
    const tens = Math.floor(numericValue / 10);
    const ones = numericValue % 10;
    const unit = Math.max(1.4, cellSize * 0.026);
    const totalWidth = (tens * unit * 3) + (ones * unit * 2.2) + (tens && ones ? unit : 0);
    let x = cx - totalWidth / 2;

    ctx.fillStyle = '#2874a6';
    for (let index = 0; index < tens; index++) {
      ctx.fillRect(x, cy - unit, unit * 2.3, unit * 2);
      x += unit * 3;
    }
    if (tens && ones) x += unit;
    ctx.fillStyle = '#e67e22';
    for (let index = 0; index < ones; index++) {
      ctx.beginPath();
      ctx.arc(x + unit, cy, unit, 0, Math.PI * 2);
      ctx.fill();
      x += unit * 2.2;
    }
  }
}
