/**
 * game_progress.js
 * 負責進度存檔、結算與排行榜流程。
 */

(() => {
  if (typeof Game === 'undefined') return;

  const saveGameState = (game, level) => {
    Storage.saveGame(
      level,
      game.timer.getTotalTime(),
      game.tutorialHints,
      game.persistentStats
    );
  };

  Object.assign(Game.prototype, {
    syncPersistentStatsFromPlayer() {
      if (!this.player) return;
      this.persistentStats.sightRadius = this.player.permanentSightRadius;
      this.persistentStats.hintRange = this.player.hintRange;
    },

    saveProgress(level = this.currentLevel) {
      this.syncPersistentStatsFromPlayer();
      saveGameState(this, level);
    },

    quitToMenu(saveCurrent = true) {
      if (this.mode === 'education') {
        this.exitEducationMode();
        return;
      }
      this.state = Game.STATE_MENU;
      this.timer.pause();
      if (this._animationFrameId) cancelAnimationFrame(this._animationFrameId);

      if (saveCurrent) {
        this.saveProgress();
      }
      if (this.player) this.player.destroy();

      this.pendingScore = null;
      this.ui.checkContinueBtn();

      this.ui.hideHUD();
      this.ui.hideMenu('pause');
      this.ui.showMenu('main');
      this.ui.checkMobileControls();
    },

    handleLevelComplete() {
      this.state = Game.STATE_LEVEL_COMPLETE;
      const levelMs = this.timer.commitLevel();
      this.player.disableControl();
      const totalMs = this.timer.getTotalTime();
      this.pendingScore = { level: this.currentLevel, levelMs, totalMs };

      let tutorialTitle = null;
      if (this.isTutorialLevel()) {
        const config = this.tutorialConfig[this.currentLevel];
        if (config) tutorialTitle = this.getI18nString(config.titleKey);
      }

      const isCheat = this.isGM || this._cheatActivated;
      const isNewRecord = isCheat ? false : Storage.isNewRecord(this.currentLevel, levelMs);

      const shouldPromptForRecord = isNewRecord && !this.lastPlayerName;
      if (isNewRecord && !shouldPromptForRecord) {
        const name = this.lastPlayerName || 'Hero';
        this.submitHighScore(name, levelMs, totalMs);
      }

      if (window.audioManager) window.audioManager.playVictory();

      this.ui.showLevelComplete(this.currentLevel, shouldPromptForRecord, levelMs, totalMs, tutorialTitle);
    },

    submitHighScore(name, levelMs = null, totalMs = null) {
      if (this.isGM || this._cheatActivated) return;

      this.lastPlayerName = name;
      Storage.savePlayerName(name);

      const pendingScore = this.pendingScore && this.pendingScore.level === this.currentLevel
        ? this.pendingScore
        : null;
      const finalLevelMs = levelMs ?? pendingScore?.levelMs ?? this.timer.getCurrentLevelTime();
      const finalTotalMs = totalMs ?? pendingScore?.totalMs ?? this.timer.getTotalTime();

      Storage.saveToLeaderboard(this.currentLevel, name, finalLevelMs);

      if (typeof CloudStorage !== 'undefined') {
        CloudStorage.submitScore(this.currentLevel, name, finalLevelMs);
      }

      Storage.savePlayTime(name, finalTotalMs);
      this.pendingScore = null;
      this.ui.hideRecordEntry();
    },

    startNextLevel() {
      if (this.currentLevel < this.maxLevel) {
        this.currentLevel++;
        this.saveProgress(this.currentLevel);
        this.startLevel();
      } else {
        this.quitToMenu();
      }
    },

    restAndSave() {
      this.syncPersistentStatsFromPlayer();
      if (this.currentLevel < this.maxLevel) {
        this.saveProgress(this.currentLevel + 1);
      } else {
        Storage.clearSave();
      }
      this.quitToMenu(false);
    }
  });
})();
