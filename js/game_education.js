/**
 * game_education.js
 * 教育模式的進入、完成、重玩與離開流程。
 */

(() => {
  if (typeof Game === 'undefined' || typeof EducationLevelOne === 'undefined') return;

  Object.assign(Game.prototype, {
    startEducationLevelOne() {
      this.state = Game.STATE_PLAYING;
      this.mode = 'education';
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

      this.educationManager = new EducationLevelOne(this);
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
      this.player.drillCount = 0;
      this.player.hintCount = 0;

      this.mergingWallClosed = false;
      this.mergingWallTimer = 0;
      this.mergingWallInterval = Infinity;

      this.ui.showEducationHUD();
      this.ui.checkMobileControls();

      if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = requestAnimationFrame(this.gameLoop);
    },

    handleEducationComplete() {
      if (this.state !== Game.STATE_PLAYING || this.mode !== 'education') return;
      this.state = Game.STATE_LEVEL_COMPLETE;
      this.player.disableControl();
      if (window.audioManager) window.audioManager.playVictory();
      this.ui.showEducationComplete();
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
      this.ui.hideEducationHUD();
      this.ui.hideMenu('educationComplete');
      if (this.ui.elements.mobileControls) {
        this.ui.elements.mobileControls.classList.remove('education-mode');
      }
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
