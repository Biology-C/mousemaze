/**
 * game_education.js
 * 將 20 關教育課程接入遊戲狀態、成就與畫面流程。
 */

(() => {
  if (typeof Game === 'undefined' || typeof EducationLevel === 'undefined') return;
  const EDUCATION_PROGRESS_KEY = 'maze_education_completed_levels';
  const EDUCATION_SPEED_MULTIPLIER = 0.5;

  Object.assign(Game.prototype, {
    getCompletedEducationLevels() {
      try {
        const saved = JSON.parse(localStorage.getItem(EDUCATION_PROGRESS_KEY) || '[]');
        return new Set(saved.filter((value) => Number.isInteger(value) && value > 0));
      } catch (error) {
        return new Set();
      }
    },

    recordCompletedEducationLevel(levelNumber) {
      const completed = this.getCompletedEducationLevels();
      completed.add(Number(levelNumber));
      try {
        localStorage.setItem(EDUCATION_PROGRESS_KEY, JSON.stringify([...completed].sort((a, b) => a - b)));
      } catch (error) {
        // 儲存空間不可用時仍讓孩子正常完成關卡。
      }
    },

    openEducationMenu() {
      this.state = Game.STATE_MENU;
      this.timer.pause();
      this.ui.hideHUD();
      this.ui.hideEducationHUD();
      this.ui.showEducationLevelMenu();
    },

    startEducationLevel(levelNumber = 1) {
      const levels = window.EDUCATION_LEVELS || [];
      const config = levels.find((level) => level.id === Number(levelNumber));
      if (!config) return;

      this.state = Game.STATE_PLAYING;
      this.mode = 'education';
      this.currentEducationLevel = config.id;
      this.pendingScore = null;
      this.timer.pause();
      this.ui.hideAllMenus();
      this.ui.hideHUD();

      if (this.player) this.player.destroy();

      if (this._educationPreviousFog === undefined) {
        this._educationPreviousFog = this.renderer.disableFog;
      }
      if (this._educationPreviousCellSize === undefined) {
        this._educationPreviousCellSize = this.renderer.cellSize;
      }
      this.renderer.disableFog = true;
      this.renderer.cellSize = 56;
      this.renderer.resize();

      this.educationManager = new EducationLevel(this, config);
      this.maze = this.educationManager.buildMaze();
      this.itemManager = null;
      this.enemyManager = null;

      this.player = new Player(
        this.maze.start.x,
        this.maze.start.y,
        this.renderer.cellSize,
        this.maze,
        { sightRadius: 20, hintRange: 0 }
      );
      this.player.educationMode = true;
      this.player.speed *= EDUCATION_SPEED_MULTIPLIER;
      this.player.drillCount = 0;
      this.player.hintCount = 0;

      this.mergingWallClosed = false;
      this.mergingWallTimer = 0;
      this.mergingWallInterval = Infinity;

      this.ui.showEducationHUD(config, this.educationManager.expectedIndex);
      this.ui.checkMobileControls();

      if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = requestAnimationFrame(this.gameLoop);
    },

    startEducationLevelOne() {
      this.startEducationLevel(1);
    },

    startNextEducationLevel() {
      const nextLevel = Number(this.currentEducationLevel) + 1;
      if (nextLevel <= (window.EDUCATION_LEVELS || []).length) {
        this.startEducationLevel(nextLevel);
      } else {
        this.returnToEducationMenu();
      }
    },

    handleEducationComplete() {
      if (this.state !== Game.STATE_PLAYING || this.mode !== 'education') return;
      this.state = Game.STATE_LEVEL_COMPLETE;
      this.player.disableControl();
      if (window.audioManager) window.audioManager.playVictory();
      const config = this.educationManager.config;
      this.recordCompletedEducationLevel(config.id);
      const hasNext = config.id < (window.EDUCATION_LEVELS || []).length;
      this.ui.showEducationComplete(config, hasNext, {
        wrongAttempts: this.educationManager.wrongAttempts
      });
      this.ui.checkMobileControls();
    },

    teardownEducationMode() {
      if (this._educationPreviousFog !== undefined) {
        this.renderer.disableFog = this._educationPreviousFog;
        this._educationPreviousFog = undefined;
      }
      if (this._educationPreviousCellSize !== undefined) {
        this.renderer.cellSize = this._educationPreviousCellSize;
        this._educationPreviousCellSize = undefined;
      }
      this.educationManager = null;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      this.ui.hideEducationHUD();
      this.ui.hideMenu('educationComplete');
      if (this.ui.elements.mobileControls) {
        this.ui.elements.mobileControls.classList.remove('education-mode');
      }
    },

    returnToEducationMenu() {
      this.state = Game.STATE_MENU;
      this.timer.pause();
      if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
      if (this.player) this.player.destroy();

      this.teardownEducationMode();
      this.mode = 'adventure';
      this.player = null;
      this.maze = null;
      this.itemManager = null;
      this.enemyManager = null;

      this.ui.hideHUD();
      this.ui.hideMenu('pause');
      this.ui.showEducationLevelMenu();
      this.ui.checkMobileControls();
    },

    exitEducationMode() {
      this.state = Game.STATE_MENU;
      this.timer.pause();
      if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
      if (this.player) this.player.destroy();

      this.teardownEducationMode();
      this.mode = 'adventure';
      this.player = null;
      this.maze = null;
      this.itemManager = null;
      this.enemyManager = null;

      this.ui.hideHUD();
      this.ui.hideMenu('pause');
      this.ui.showMenu('main');
      this.ui.checkContinueBtn();
      this.ui.checkMobileControls();
    }
  });
})();
