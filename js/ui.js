/**
 * ui.js
 * 負責操作 DOM，控制所有選單顯示/隱藏與更新。
 */

class UIManager {
  constructor(gameController) {
    this.game = gameController;
    
    // 選單容器
    this.menus = {
      main: document.getElementById('menu-main'),
      pause: document.getElementById('menu-pause'),
      levelComplete: document.getElementById('menu-level-complete'),
      leaderboard: document.getElementById('menu-leaderboard-view'),
      nameInput: document.getElementById('menu-name-input'),
      settings: document.getElementById('menu-settings'),
      help: document.getElementById('menu-help'),
      educationLevels: document.getElementById('menu-education-levels'),
      educationComplete: document.getElementById('menu-education-complete'),
    };

    // HUD
    this.hud = {
      container: document.getElementById('hud'),
      level: document.getElementById('hud-level'),
      time: document.getElementById('hud-time'),
      drillTrack: document.getElementById('hud-drill-track'),
      hintTrack: document.getElementById('hud-hint-track'),
      btnPause: document.getElementById('btn-pause')
    };

    // GM HUD
    this.gmHud = {
      container: document.getElementById('gm-hud'),
      speed: document.getElementById('gm-speed'),
      itemCount: document.getElementById('gm-item-count'),
      fogStatus: document.getElementById('gm-fog-status'),
      minimapCanvas: document.getElementById('gm-minimap')
    };
    if (this.gmHud.minimapCanvas) {
      this.gmMinimapCtx = this.gmHud.minimapCanvas.getContext('2d');
    }

    // 動態文字元素
    this.elements = {
      statLevelTime: document.getElementById('stat-level-time'),
      statTotalTime: document.getElementById('stat-total-time'),
      completeTitle: document.getElementById('complete-title'),
      completeTutorialTitle: document.getElementById('complete-tutorial-title'),
      btnStart: document.getElementById('btn-start'),
      btnEducation: document.getElementById('btn-education'),
      btnContinue: document.getElementById('btn-continue'),
      btnNextLevel: document.getElementById('btn-next-level'),
      
      // 名字輸入
      inputNewPlayerName: document.getElementById('input-new-player-name'),
      btnConfirmName: document.getElementById('btn-confirm-name'),
      btnCancelName: document.getElementById('btn-cancel-name'),

      // 排行榜相關
      lbTableBody: document.getElementById('leaderboard-body'),
      lbLevelDisplay: document.getElementById('lb-level-display'),
      lbTabLevel: document.getElementById('lb-tab-level'),
      lbTabTime: document.getElementById('lb-tab-time'),
      inputName: document.getElementById('input-player-name'),

      // 設定相關
      btnSettings: document.getElementById('btn-settings'),
      btnSaveSettings: document.getElementById('btn-save-settings'),
      selectSpeed: document.getElementById('select-speed'),
      selectTheme: document.getElementById('select-theme'),
      selectDifficulty: document.getElementById('select-difficulty'),
      selectLanguage: document.getElementById('select-lang'),

      // 說明相關
      btnHelp: document.getElementById('btn-help'),
      btnHelpClose: document.getElementById('btn-help-close'),

      // 手機操作相關
      mobileControls: document.getElementById('mobile-controls'),
      joystickZone: document.getElementById('joystick-zone'),
      joystickBase: document.getElementById('joystick-base'),
      joystickKnob: document.getElementById('joystick-knob'),
      btnSkillDrill: document.getElementById('btn-skill-drill'),
      btnSkillHint: document.getElementById('btn-skill-hint'),
      btnSkillMark: document.getElementById('btn-skill-mark'),
      btnSkillSettings: document.getElementById('btn-skill-settings'),
      // 過關紀錄輸入
      recordEntry: document.getElementById('record-entry'),
      inputName: document.getElementById('input-player-name'),
      gmJumpLevel: document.getElementById('gm-jump-level'), // Ensure this is bound
      settingBgm: document.getElementById('setting-bgm'),
      settingSfx: document.getElementById('setting-sfx'),
      settingShowMs: document.getElementById('setting-show-ms'),

      // 教育模式
      educationHud: document.getElementById('education-hud'),
      educationKicker: document.getElementById('education-kicker'),
      educationClueCard: document.getElementById('education-clue-card'),
      educationRule: document.getElementById('education-rule'),
      educationReferenceWrap: document.getElementById('education-reference-wrap'),
      educationReferenceLabel: document.getElementById('education-reference-label'),
      educationReferenceSequence: document.getElementById('education-reference-sequence'),
      educationSequence: document.getElementById('education-sequence'),
      educationPlaceValue: document.getElementById('education-place-value'),
      educationNext: document.getElementById('education-next'),
      educationLevelGrid: document.getElementById('education-level-grid'),
      btnEducationPause: document.getElementById('btn-education-pause'),
      btnEducationSpeak: document.getElementById('btn-education-speak'),
      btnEducationLevelsBack: document.getElementById('btn-education-levels-back'),
      btnEducationNext: document.getElementById('btn-education-next'),
      btnEducationReplay: document.getElementById('btn-education-replay'),
      btnEducationLevels: document.getElementById('btn-education-levels'),
      btnEducationHome: document.getElementById('btn-education-home'),
      educationCompleteCopy: document.getElementById('education-complete-copy'),
      educationCompleteSequence: document.getElementById('education-complete-sequence'),
      educationAchievement: document.getElementById('education-achievement'),
    };

    // 搖框狀態
    this._joystickActive = false;
    this._joystickTouchId = null;
    this._lastJoystickDir = null;
    this._joystickStepLocked = false;

    this.currentLbLevel = 1;
    this.currentLbTab = 'level'; // 'level' 或 'time'

    this.HINT_TEXTS = window.UI_HINT_TEXTS || {};
    this.I18N = window.UI_I18N || {};

    this._buildEducationLevelMenu();
    this.bindEvents();
    this.checkContinueBtn();

    window.addEventListener('resize', () => this.checkMobileControls());
    this.updateUILanguage();
  }

  checkMobileControls() {
    if (this.elements.mobileControls) {
      if (this.game.state === Game.STATE_PLAYING && window.innerWidth <= 768 && window.innerHeight > window.innerWidth) {
        this.elements.mobileControls.classList.add('active');
        this.elements.mobileControls.classList.remove('hidden');
        const isEducationMode = this.game.mode === 'education';
        this.elements.mobileControls.classList.toggle('education-mode', isEducationMode);
        // 燈塔按鈕：冒險模式第 3 關（含）以後才顯示
        const isBeaconLevel = !isEducationMode && this.game.currentLevel >= 3;
        if (this.elements.btnSkillMark) {
          if (isBeaconLevel) {
            this.elements.btnSkillMark.classList.remove('hidden');
          } else {
            this.elements.btnSkillMark.classList.add('hidden');
          }
        }
      } else {
        this.elements.mobileControls.classList.remove('active');
        this.elements.mobileControls.classList.add('hidden');
        this.elements.mobileControls.classList.remove('education-mode');
      }
    }
  }

  bindEvents() {
    // 主選單
    this.elements.btnStart.addEventListener('click', () => {
      this.showMenu('nameInput');
      if (this.elements.inputNewPlayerName) {
        this.elements.inputNewPlayerName.value = this.game.lastPlayerName || 'Hero';
        setTimeout(() => this.elements.inputNewPlayerName.focus(), 50);
      }
    });

    if (this.elements.btnEducation) {
      this.elements.btnEducation.addEventListener('click', () => this.game.openEducationMenu());
    }

    if (this.elements.educationLevelGrid) {
      this.elements.educationLevelGrid.addEventListener('click', (event) => {
        const button = event.target.closest('[data-education-level]');
        if (button) this.game.startEducationLevel(Number(button.dataset.educationLevel));
      });
    }
    if (this.elements.btnEducationLevelsBack) {
      this.elements.btnEducationLevelsBack.addEventListener('click', () => this.game.exitEducationMode());
    }

    if (this.elements.btnConfirmName) {
      this.elements.btnConfirmName.addEventListener('click', () => {
        let name = this.elements.inputNewPlayerName.value.trim() || 'Hero';
        this.game.lastPlayerName = name;
        Storage.savePlayerName(name);
        this.game.startNewGame();
      });
    }

    if (this.elements.btnCancelName) {
      this.elements.btnCancelName.addEventListener('click', () => this.showMenu('main'));
    }

    if (this.elements.inputNewPlayerName) {
      this.elements.inputNewPlayerName.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.elements.btnConfirmName.click();
      });
    }

    this.elements.btnContinue.addEventListener('click', () => this.game.continueGame());
    document.getElementById('btn-leaderboard').addEventListener('click', () => this.showLeaderboard(1));
    this.elements.btnSettings.addEventListener('click', () => this.showSettings());
    this.elements.btnHelp.addEventListener('click', () => this.showMenu('help'));
    this.elements.btnHelpClose.addEventListener('click', () => this.showMenu('main'));

    // 暫停選單
    this.hud.btnPause.addEventListener('click', () => this.game.togglePause());
    if (this.elements.btnEducationPause) {
      this.elements.btnEducationPause.addEventListener('click', () => this.game.togglePause());
    }
    if (this.elements.btnEducationSpeak) {
      this.elements.btnEducationSpeak.addEventListener('click', () => this.speakEducationClue());
    }
    document.getElementById('btn-resume').addEventListener('click', () => this.game.togglePause());
    document.getElementById('btn-restart-level').addEventListener('click', () => this.game.restartCurrentLevel());
    document.getElementById('btn-quit').addEventListener('click', () => this.game.quitToMenu());

    // ESC 熱鍵暫停
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.recordEntry && !this.elements.recordEntry.classList.contains('hidden')) return;
      if (e.key === 'Escape' && 
          (this.game.state === Game.STATE_PLAYING || this.game.state === Game.STATE_PAUSED)) {
        this.game.togglePause();
      }
      
      // 全域方向鍵選單操控
      if (this.game.state !== Game.STATE_PLAYING && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const visibleMenu = Object.values(this.menus).find(m => !m.classList.contains('hidden'));
        if (visibleMenu) {
          const focusable = Array.from(visibleMenu.querySelectorAll('button:not(.hidden):not([style*="display: none"])'));
          if (focusable.length > 0) {
            e.preventDefault();
            let currentIndex = focusable.indexOf(document.activeElement);
            if (currentIndex === -1) {
              focusable[0].focus();
            } else {
              if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                currentIndex = (currentIndex + 1) % focusable.length;
              } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                currentIndex = (currentIndex - 1 + focusable.length) % focusable.length;
              }
              focusable[currentIndex].focus();
            }
          }
        }
      }
    });

    // 過關選單
    document.getElementById('btn-rest').addEventListener('click', () => this.game.restAndSave());
    this.elements.btnNextLevel.addEventListener('click', () => this.game.startNextLevel());

    if (this.elements.btnEducationReplay) {
      this.elements.btnEducationReplay.addEventListener('click', () => {
        this.game.startEducationLevel(this.game.currentEducationLevel);
      });
    }
    if (this.elements.btnEducationNext) {
      this.elements.btnEducationNext.addEventListener('click', () => this.game.startNextEducationLevel());
    }
    if (this.elements.btnEducationLevels) {
      this.elements.btnEducationLevels.addEventListener('click', () => this.game.returnToEducationMenu());
    }
    if (this.elements.btnEducationHome) {
      this.elements.btnEducationHome.addEventListener('click', () => this.game.exitEducationMode());
    }

    // 輸入名稱
    document.getElementById('btn-submit-name').addEventListener('click', () => {
      let name = this.elements.inputName.value.trim();
      if (!name) name = 'Hero';
      this.game.submitHighScore(name);
    });

    // 排行榜選單
    document.getElementById('btn-lb-close').addEventListener('click', () => this.showMenu('main'));
    document.getElementById('btn-lb-back').addEventListener('click', () => this.showMenu('main'));
    document.getElementById('btn-lb-prev').addEventListener('click', () => {
      if (this.currentLbLevel > 1) this.showLeaderboard(this.currentLbLevel - 1);
    });
    document.getElementById('btn-lb-next').addEventListener('click', () => {
      if (this.currentLbLevel < 18) this.showLeaderboard(this.currentLbLevel + 1);
    });

    // 排行榜分頁 tab
    if (this.elements.lbTabLevel) {
      this.elements.lbTabLevel.addEventListener('click', () => {
        this.currentLbTab = 'level';
        this.showLeaderboard(this.currentLbLevel);
      });
    }
    if (this.elements.lbTabTime) {
      this.elements.lbTabTime.addEventListener('click', () => {
        this.currentLbTab = 'time';
        this.showPlayTimeLeaderboard();
      });
    }

    // 設定選單
    this.elements.btnSaveSettings.addEventListener('click', () => this.saveSettings());

    // 搖框
    this.initJoystick();
    
    // 技能鈕
    this.bindVirtualKey(this.elements.btnSkillDrill, ' ');
    this.bindVirtualKey(this.elements.btnSkillHint, 'z');
    this.bindVirtualKey(this.elements.btnSkillMark, 'q');

    // 監聽 GM 跳關輸入
    if (this.elements.gmJumpLevel) {
      this.elements.gmJumpLevel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const lv = parseInt(e.target.value);
          if (lv >= 1 && lv <= this.game.maxLevel) {
            this.game.skipToLevel(lv);
            e.target.value = '';
            e.target.blur();
          }
        }
      });
    }

    // 全域 Enter 監聽 (用於 GM 快速聚焦)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.game.isGM) {
        // 如果目前沒聚焦在輸入框且目前在遊戲中或暫停中，則聚焦跳關輸入框
        if (document.activeElement.tagName !== 'INPUT' && this.elements.gmJumpLevel) {
          this.elements.gmJumpLevel.focus();
        }
      }
    });
  }

  initJoystick() {
    const zone = this.elements.joystickZone;
    const base = this.elements.joystickBase;
    const knob = this.elements.joystickKnob;
    if (!zone || !base || !knob) return;

    const getMetrics = () => {
      const rect = base.getBoundingClientRect();
      const knobRect = knob.getBoundingClientRect();
      const baseRadius = rect.width / 2;
      const knobRadius = (knobRect.width || rect.width * 0.4) / 2;
      return {
        centerX: rect.left + baseRadius,
        centerY: rect.top + rect.height / 2,
        baseRadius,
        knobRadius,
        maxDist: Math.max(1, baseRadius - knobRadius),
        deadZone: Math.max(20, baseRadius * 0.32)
      };
    };

    const handleMove = (clientX, clientY) => {
      const metrics = getMetrics();
      let dx = clientX - metrics.centerX;
      let dy = clientY - metrics.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > metrics.maxDist) {
        dx = (dx / dist) * metrics.maxDist;
        dy = (dy / dist) * metrics.maxDist;
      }

      knob.style.left = (metrics.baseRadius + dx - metrics.knobRadius) + 'px';
      knob.style.top = (metrics.baseRadius + dy - metrics.knobRadius) + 'px';

      if (dist < metrics.deadZone) {
        this._releaseJoystickDir();
        this._joystickStepLocked = false;
        return;
      }

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      let newDir = null;
      if (angle >= -45 && angle < 45) newDir = 'ArrowRight';
      else if (angle >= 45 && angle < 135) newDir = 'ArrowDown';
      else if (angle >= -135 && angle < -45) newDir = 'ArrowUp';
      else newDir = 'ArrowLeft';

      const isEducationMode = this.game.mode === 'education';
      if (isEducationMode) {
        if (this._joystickStepLocked) return;
        this._releaseJoystickDir();
        const player = this.game.player;
        if (player) {
          if (typeof player.queueEducationStep === 'function') {
            player.queueEducationStep(newDir);
          } else {
            // 保留給舊版 Player 的相容路徑。
            player.setKeyDown(newDir);
            setTimeout(() => player.setKeyUp(newDir), 80);
          }
          this._joystickStepLocked = true;
        }
      } else if (newDir !== this._lastJoystickDir) {
        this._releaseJoystickDir();
        this._lastJoystickDir = newDir;
        if (this.game.player) this.game.player.setKeyDown(newDir);
      }
    };

    const handleEnd = () => {
      this._joystickActive = false;
      this._joystickTouchId = null;
      const metrics = getMetrics();
      knob.style.left = (metrics.baseRadius - metrics.knobRadius) + 'px';
      knob.style.top  = (metrics.baseRadius - metrics.knobRadius) + 'px';
      this._releaseJoystickDir();
      this._joystickStepLocked = false;
    };

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this._joystickActive) return;
      const t = e.changedTouches[0];
      this._joystickActive = true;
      this._joystickTouchId = t.identifier;
      handleMove(t.clientX, t.clientY);
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this._joystickTouchId) {
          handleMove(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }, { passive: false });

    zone.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === this._joystickTouchId) {
          handleEnd();
          break;
        }
      }
    });
    zone.addEventListener('touchcancel', handleEnd);

    let mouseDown = false;
    zone.addEventListener('mousedown', (e) => {
      mouseDown = true;
      handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (mouseDown) handleMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (mouseDown) { mouseDown = false; handleEnd(); }
    });
  }

  _releaseJoystickDir() {
    if (this._lastJoystickDir && this.game.player) {
      this.game.player.setKeyUp(this._lastJoystickDir);
    }
    this._lastJoystickDir = null;
  }

  bindVirtualKey(el, key) {
    if (!el) return;
    
    const triggerDown = (e) => {
      e.preventDefault();
      if (this.game.player) this.game.player.setKeyDown(key);
    };
    
    const triggerUp = (e) => {
      e.preventDefault();
      if (this.game.player) this.game.player.setKeyUp(key);
    };

    el.addEventListener('touchstart', triggerDown, { passive: false });
    el.addEventListener('touchend', triggerUp, { passive: false });
    el.addEventListener('mousedown', triggerDown);
    el.addEventListener('mouseup', triggerUp);
    el.addEventListener('mouseleave', triggerUp);
  }

  _buildEducationLevelMenu() {
    const grid = this.elements?.educationLevelGrid;
    if (!grid) return;

    const dict = this._educationDictionary();
    const levels = window.EDUCATION_LEVELS || [];
    const completed = typeof this.game.getCompletedEducationLevels === 'function'
      ? this.game.getCompletedEducationLevels()
      : new Set();
    grid.innerHTML = '';

    let currentChapter = null;
    levels.forEach((config) => {
      if (config.chapter !== currentChapter) {
        currentChapter = config.chapter;
        const heading = document.createElement('h3');
        heading.className = 'education-chapter-title';
        heading.textContent = dict[config.chapterKey] || config.chapterKey;
        grid.appendChild(heading);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'education-level-card';
      button.dataset.educationLevel = String(config.id);
      if (completed.has(config.id)) button.classList.add('completed');

      const number = document.createElement('span');
      number.className = 'education-level-number';
      number.textContent = completed.has(config.id) ? '✓' : String(config.id);

      const copy = document.createElement('span');
      copy.className = 'education-level-copy';
      copy.textContent = dict[config.nameKey] || config.nameKey;

      button.appendChild(number);
      button.appendChild(copy);
      grid.appendChild(button);
    });
  }

  // == 視圖控制 ==

  hideAllMenus() {
    Object.values(this.menus).forEach(m => m.classList.add('hidden'));
  }

  showMenu(menuName) {
    this.hideAllMenus();
    if (this.menus[menuName]) {
      this.menus[menuName].classList.remove('hidden');
    }
  }

  hideMenu(menuName) {
    if (this.menus[menuName]) {
      this.menus[menuName].classList.add('hidden');
    }
  }

  // == HUD 更新 ==

  showHUD() {
    this.hud.container.classList.remove('hidden');
  }

  hideHUD() {
    this.hud.container.classList.add('hidden');
  }

  showEducationLevelMenu() {
    this.hideHUD();
    this.hideEducationHUD();
    this._buildEducationLevelMenu();
    this.showMenu('educationLevels');
    setTimeout(() => {
      const firstLevel = this.menus.educationLevels?.querySelector('[data-education-level]');
      if (firstLevel) firstLevel.focus();
    }, 50);
  }

  showEducationHUD(config, completedCount = 1) {
    if (!this.elements.educationHud || !config) return;
    this.hideHUD();
    this.elements.educationHud.classList.remove('hidden');
    this._renderEducationHeader(config);
    this.updateEducationProgress(completedCount, config);
  }

  hideEducationHUD() {
    if (this._educationNudgeTimer) {
      clearTimeout(this._educationNudgeTimer);
      this._educationNudgeTimer = null;
    }
    if (this.elements.educationHud) {
      this.elements.educationHud.classList.add('hidden');
    }
  }

  _educationDictionary() {
    const lang = gameSettings.language || 'zh';
    return this.I18N[lang] || this.I18N.zh || {};
  }

  _renderEducationHeader(config) {
    const dict = this._educationDictionary();
    if (this.elements.educationKicker) {
      const prefix = dict.edu_level_prefix || '🧩 小小探險家 · 第';
      const suffix = dict.edu_level_suffix ?? '關';
      this.elements.educationKicker.textContent = `${prefix} ${config.id}${suffix ? ` ${suffix}` : ''}`;
    }
    if (this.elements.educationRule) {
      this.elements.educationRule.textContent = dict[config.ruleKey] || config.ruleKey;
    }
    if (this.elements.educationClueCard) {
      this.elements.educationClueCard.classList.remove('attention');
    }
    if (this.elements.educationSequence) {
      this.elements.educationSequence.setAttribute('aria-label', dict.edu_sequence_label || '線索順序');
    }
    if (this.elements.educationReferenceSequence) {
      this.elements.educationReferenceSequence.setAttribute('aria-label', dict.edu_reference_label || '參考線索');
    }

    const hasReference = Array.isArray(config.referenceSequence);
    if (this.elements.educationReferenceWrap) {
      this.elements.educationReferenceWrap.classList.toggle('hidden', !hasReference);
    }
    if (hasReference && this.elements.educationReferenceLabel) {
      this.elements.educationReferenceLabel.textContent = dict.edu_reference || '看看這一排：';
    }
    if (hasReference && this.elements.educationReferenceSequence) {
      this._renderEducationSequence(
        this.elements.educationReferenceSequence,
        config.referenceSequence,
        config.referenceSequence,
        config.referenceSequence.length,
        false,
        config
      );
    }

    this._renderPlaceValueClue(config);
    if (this.elements.btnEducationSpeak) {
      const canSpeak = config.speechEnabled
        && 'speechSynthesis' in window
        && typeof SpeechSynthesisUtterance !== 'undefined';
      this.elements.btnEducationSpeak.classList.toggle('hidden', !canSpeak);
    }
  }

  _renderEducationSequence(container, actualValues, displayValues, completedCount, showCurrent = true, config = null) {
    if (!container) return;
    container.innerHTML = '';

    actualValues.forEach((value, index) => {
      if (index > 0) {
        const arrow = document.createElement('span');
        arrow.className = 'education-arrow';
        arrow.textContent = '→';
        arrow.setAttribute('aria-hidden', 'true');
        container.appendChild(arrow);
      }

      const chip = document.createElement('span');
      chip.className = 'education-number';
      const isCompleted = index < completedCount;
      const displayedValue = isCompleted ? value : displayValues[index];
      this._applyEducationTokenToChip(chip, displayedValue, isCompleted);
      chip.dataset.index = String(index);
      chip.classList.toggle('completed', isCompleted);
      chip.classList.toggle('current', showCurrent && index === completedCount);
      if (config?.taskType === 'place-value') chip.classList.add('place-value-token');
      container.appendChild(chip);
    });
  }

  _educationTokenMeta(value) {
    const colors = window.EDUCATION_COLOR_TOKENS || {};
    if (typeof value === 'string' && colors[value]) {
      return { kind: 'color', colorKey: value, ...colors[value] };
    }
    if (typeof value === 'string' && value.includes(':')) {
      const [number, colorKey] = value.split(':');
      if (colors[colorKey]) return { kind: 'mixed', number, colorKey, ...colors[colorKey] };
    }
    return { kind: 'number', label: String(value) };
  }

  _applyEducationTokenToChip(chip, value, isCompleted = false) {
    if (value === null || value === undefined) {
      chip.textContent = '?';
      return;
    }

    const token = this._educationTokenMeta(value);
    const dict = this._educationDictionary();
    if (token.kind === 'color') {
      chip.classList.add('education-color-token');
      chip.textContent = token.shape;
      chip.title = dict[token.labelKey] || token.colorKey;
      chip.style.backgroundColor = token.color;
      chip.style.color = token.textColor;
    } else if (token.kind === 'mixed') {
      chip.classList.add('education-color-token', 'education-mixed-token');
      chip.textContent = `${token.number}${token.shape}`;
      chip.title = `${token.number} · ${dict[token.labelKey] || token.colorKey}`;
      chip.style.backgroundColor = token.color;
      chip.style.color = token.textColor;
    } else {
      chip.textContent = token.label;
    }
  }

  _renderPlaceValueClue(config) {
    const container = this.elements.educationPlaceValue;
    if (!container) return;
    const values = config.focusValues || [];
    container.innerHTML = '';
    container.classList.toggle('hidden', values.length === 0);
    if (values.length === 0) return;

    const dict = this._educationDictionary();
    values.forEach((value) => {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue)) return;
      const tens = Math.floor(numericValue / 10);
      const ones = numericValue % 10;
      const tenLabel = tens === 1
        ? (dict.edu_ten_group_single || dict.edu_ten_groups || '個十')
        : (dict.edu_ten_groups || '個十');
      const oneLabel = ones === 1
        ? (dict.edu_one_unit_single || dict.edu_one_units || '個一')
        : (dict.edu_one_units || '個一');
      const row = document.createElement('div');
      row.className = 'education-place-row';
      row.innerHTML = `<span class="place-number">${value}</span><span class="place-box tens"><small>${dict.edu_tens || '十位'}</small>${tens}</span><span class="place-box ones"><small>${dict.edu_ones || '個位'}</small>${ones}</span><span class="place-equation">${tens}${tenLabel}＋${ones}${oneLabel}</span>`;
      container.appendChild(row);
    });
  }

  updateEducationProgress(completedCount, config) {
    if (!config) return;
    if (this._educationNudgeTimer) {
      clearTimeout(this._educationNudgeTimer);
      this._educationNudgeTimer = null;
    }

    this._renderEducationSequence(
      this.elements.educationSequence,
      config.sequence,
      config.displaySequence,
      completedCount,
      true,
      config
    );

    if (!this.elements.educationNext) return;
    const dict = this._educationDictionary();
    this.elements.educationNext.classList.remove('nudge');
    if (completedCount >= config.sequence.length) {
      this.elements.educationNext.textContent = dict.edu_gate_open || '出口打開了！找到發光出口。';
      return;
    }

    const nextIsHidden = config.displaySequence[completedCount] === null;
    const nextLabel = this._formatEducationValue(config.sequence[completedCount]);
    this.elements.educationNext.textContent = nextIsHidden
      ? (dict.edu_find_missing || '想一想：下一個是什麼？')
      : `${dict.edu_next || '下一個：'}${nextLabel}`;
  }

  showEducationNudge(config, wrongAttempts = 1) {
    if (!config || !this.elements.educationNext) return;
    if (this._educationNudgeTimer) clearTimeout(this._educationNudgeTimer);

    const dict = this._educationDictionary();
    const message = wrongAttempts >= 3
      ? (dict.edu_test_marked || '這個選項先做記號，再看看線索。')
      : wrongAttempts >= 2
        ? (dict.edu_check_clue || '回頭看看線索卡。')
        : (dict[config.nudgeKey] || dict.edu_try_again || '再想一想。');
    this.elements.educationNext.textContent = message;
    if (wrongAttempts >= 2 && this.elements.educationClueCard) {
      this.elements.educationClueCard.classList.remove('attention');
      void this.elements.educationClueCard.offsetWidth;
      this.elements.educationClueCard.classList.add('attention');
    }
    this.elements.educationNext.classList.remove('nudge');
    void this.elements.educationNext.offsetWidth;
    this.elements.educationNext.classList.add('nudge');

    this._educationNudgeTimer = setTimeout(() => {
      this._educationNudgeTimer = null;
      const manager = this.game.educationManager;
      if (this.game.mode === 'education' && manager && manager.config.id === config.id) {
        if (manager.gateUnlocked) this.showEducationGateUnlocked(config);
        else this.updateEducationProgress(manager.expectedIndex, config);
      }
    }, 1600);
  }

  showEducationGateUnlocked() {
    if (!this.elements.educationNext) return;
    const dict = this._educationDictionary();
    this.elements.educationNext.classList.remove('nudge');
    this.elements.educationNext.textContent = dict.edu_gate_open || '出口打開了！找到發光出口。';
  }

  _formatEducationValue(value) {
    const token = this._educationTokenMeta(value);
    const dict = this._educationDictionary();
    if (token.kind === 'color') return `${token.shape} ${dict[token.labelKey] || token.colorKey}`;
    if (token.kind === 'mixed') return `${token.number} ${token.shape}`;
    return token.label;
  }

  _educationSequenceSummary(config) {
    return config.sequence.map((value) => this._formatEducationValue(value)).join(' → ');
  }

  speakEducationClue() {
    const manager = this.game.educationManager;
    if (!manager || !manager.config.speechEnabled || !('speechSynthesis' in window)
      || typeof SpeechSynthesisUtterance === 'undefined') return;
    const rawValue = manager.sequence[Math.min(manager.expectedIndex, manager.sequence.length - 1)];
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;

    const lang = gameSettings.language || 'zh';
    const utterance = new SpeechSynthesisUtterance(lang === 'zh' ? this._numberToChinese(value) : String(value));
    utterance.lang = lang === 'zh' ? 'zh-TW' : 'en-US';
    utterance.rate = 0.82;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  _numberToChinese(value) {
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    if (value < 10) return digits[value];
    if (value === 10) return '十';
    if (value < 20) return `十${digits[value % 10]}`;
    if (value % 10 === 0) return `${digits[Math.floor(value / 10)]}十`;
    return `${digits[Math.floor(value / 10)]}十${digits[value % 10]}`;
  }

  showEducationComplete(config, hasNext, stats = {}) {
    if (!config) return;
    const dict = this._educationDictionary();
    this.hideEducationHUD();
    if (this.elements.educationCompleteCopy) {
      const completeKey = config.taskType === 'color'
        ? 'edu_complete_color'
        : config.taskType === 'place-value'
          ? 'edu_complete_place'
          : config.taskType === 'mixed'
            ? 'edu_complete_mixed'
            : 'edu_complete_number';
      this.elements.educationCompleteCopy.textContent = dict[completeKey] || dict.edu_complete_copy;
    }
    if (this.elements.educationCompleteSequence) {
      this.elements.educationCompleteSequence.textContent = this._educationSequenceSummary(config);
    }
    if (this.elements.educationAchievement) {
      const badgeKey = config.badgeKey || (stats.wrongAttempts > 0 ? 'edu_badge_brave_tester' : 'edu_badge_clue_reader');
      this.elements.educationAchievement.textContent = dict[badgeKey] || dict.edu_badge_clue_reader || '🔍 線索偵探';
    }
    if (this.elements.btnEducationNext) {
      this.elements.btnEducationNext.classList.toggle('hidden', !hasNext);
    }
    this.showMenu('educationComplete');
    setTimeout(() => {
      const target = hasNext ? this.elements.btnEducationNext : this.elements.btnEducationReplay;
      if (target) target.focus();
    }, 50);
  }

  updateHUD(level, msTime) {
    this.hud.level.textContent = level;
    this.hud.time.textContent = GameTimer.formatTime(msTime, gameSettings.showMs);
  }

  updateSkillHUD(drillCount, hintCount) {
    this._renderDotTrack(this.hud.drillTrack, drillCount, 'filled-drill', 21);
    this._renderDotTrack(this.hud.hintTrack, hintCount, 'filled-hint', 10);
  }

  /**
   * 渲染格子型 HUD 計數軌道
   * @param {HTMLElement} track - dot-track 容器
   * @param {number} count - 剩餘次數（∞ 時顯示符號）
   * @param {string} filledClass - 已填充格子的 CSS class
   * @param {number} maxDots - 最大格子數上限（防止太多格子）
   */
  _renderDotTrack(track, count, filledClass, maxDots) {
    if (!track) return;
    track.innerHTML = '';
    if (count === Infinity) {
      const inf = document.createElement('span');
      inf.className = 'hud-infinity';
      inf.textContent = '∞';
      track.appendChild(inf);
      return;
    }
    const dots = Math.min(count, maxDots);
    for (let i = 0; i < dots; i++) {
      const dot = document.createElement('div');
      dot.className = `hud-dot ${filledClass}`;
      track.appendChild(dot);
    }
    // 若次數超過上限，顯示 +N
    if (count > maxDots) {
      const extra = document.createElement('span');
      extra.style.cssText = 'font-size:0.9rem;color:#fff;margin-left:4px;';
      extra.textContent = `+${count - maxDots}`;
      track.appendChild(extra);
    }
  }

  // == GM HUD ==
  showGMHUD() {
    if (this.gmHud.container) this.gmHud.container.classList.remove('hidden');
  }

  hideGMHUD() {
    if (this.gmHud.container) this.gmHud.container.classList.add('hidden');
  }

  updateGMHUD(speed, itemCount, hasFog) {
    if (this.gmHud.speed) this.gmHud.speed.textContent = parseFloat(speed).toFixed(2);
    if (this.gmHud.itemCount) this.gmHud.itemCount.textContent = itemCount;
    if (this.gmHud.fogStatus) this.gmHud.fogStatus.textContent = hasFog ? '是' : '否';
  }

  // == 特殊介面狀態 ==

  checkContinueBtn() {
    const save = Storage.loadGame();
    if (save && save.level > 1 && save.level <= 18) {
      this.elements.btnContinue.classList.remove('hidden');
    } else {
      this.elements.btnContinue.classList.add('hidden');
    }
  }

  /**
   * 過關畫面（含教學稱號）
   */
  showLevelComplete(level, isNewRecord, levelTime, totalTime, tutorialTitle) {
    this.showMenu('levelComplete');
    this.elements.statLevelTime.textContent = GameTimer.formatTime(levelTime);
    this.elements.statTotalTime.textContent = GameTimer.formatTime(totalTime);
    
    // 教學稱號
    const titleEl = this.elements.completeTutorialTitle;
    if (titleEl) {
      if (tutorialTitle) {
        titleEl.textContent = `🏆 獲得稱號：${tutorialTitle}`;
        titleEl.classList.remove('hidden');
      } else {
        titleEl.classList.add('hidden');
      }
    }

    // 紀錄輸入
    if (this.elements.recordEntry) {
      if (isNewRecord) {
        this.elements.recordEntry.classList.remove('hidden');
        if (this.elements.inputName) {
          this.elements.inputName.value = this.game.lastPlayerName || '';
          this.elements.inputName.focus();
        }
      } else {
        this.elements.recordEntry.classList.add('hidden');
      }
    }

    if (level === 18) {
      this.elements.completeTitle.textContent = "完成挑戰！🎉";
      this.elements.btnNextLevel.classList.add('hidden');
    } else {
      this.elements.completeTitle.textContent = `第 ${level} 關過關！`;
      this.elements.btnNextLevel.classList.remove('hidden');
      this.elements.btnNextLevel.textContent = "進入下一關";
    }

    const shouldFocusRecordEntry = !!(
      isNewRecord &&
      this.elements.recordEntry &&
      !this.elements.recordEntry.classList.contains('hidden') &&
      this.elements.inputName
    );

    // Auto focus button
    setTimeout(() => {
      if (shouldFocusRecordEntry) {
        this.elements.inputName.focus();
        return;
      }
      if (level !== 18 && this.elements.btnNextLevel) {
        this.elements.btnNextLevel.focus();
      } else {
        const btnRest = document.getElementById('btn-rest');
        if (btnRest) btnRest.focus();
      }
    }, 50);
  }

  showNameEntry() {}

  hideRecordEntry() {
    if (this.elements.recordEntry) {
      this.elements.recordEntry.classList.add('hidden');
    }
  }

  showSettings() {
    this._settingsCalledFrom = this.game.state;
    this.elements.selectSpeed.value = gameSettings.speed;
    this.elements.selectTheme.value = gameSettings.theme;
    this.elements.selectDifficulty.value = gameSettings.difficulty;
    this.elements.selectLanguage.value = gameSettings.language; // Added language setting
    if (this.elements.settingBgm) this.elements.settingBgm.checked = gameSettings.bgmEnabled;
    if (this.elements.settingSfx) this.elements.settingSfx.checked = gameSettings.sfxEnabled;
    if (this.elements.settingShowMs) this.elements.settingShowMs.checked = gameSettings.showMs;
    this.showMenu('settings');
  }

  saveSettings() {
    gameSettings.speed = parseFloat(this.elements.selectSpeed.value);
    gameSettings.theme = this.elements.selectTheme.value;
    gameSettings.difficulty = this.elements.selectDifficulty.value;
    gameSettings.language = this.elements.selectLanguage.value; // Added language setting
    if (this.elements.settingBgm) gameSettings.bgmEnabled = this.elements.settingBgm.checked;
    if (this.elements.settingSfx) gameSettings.sfxEnabled = this.elements.settingSfx.checked;
    if (this.elements.settingShowMs) gameSettings.showMs = this.elements.settingShowMs.checked;
    gameSettings.save();
    
    // 立即套用 BGM 開關
    if(window.audioManager) window.audioManager.updateBGMState();
    
    // 立即套用 Renderer 顏色
    if (this.game && this.game.renderer) {
      this.game.renderer.setThemeColors();
    }
    
    this.updateUILanguage(); // 套用語言變更
    this.hideMenu('settings');
    
    const from = this._settingsCalledFrom;
    if (from === Game.STATE_PLAYING) {
      this.checkMobileControls();
    } else if (from === Game.STATE_PAUSED) {
      this.showMenu('pause');
    } else {
      this.showMenu('main');
    }
  }

  /**
   * 關卡排行榜
   */
  async showLeaderboard(level) {
    this.currentLbLevel = level;
    this.currentLbTab = 'level';
    this.elements.lbLevelDisplay.textContent = gameSettings.language === 'en' ? `Level ${level} (Syncing...)` : `關卡 ${level} (同步中...)`;
    
    // 更新 tab 樣式
    if (this.elements.lbTabLevel) this.elements.lbTabLevel.classList.add('active');
    if (this.elements.lbTabTime) this.elements.lbTabTime.classList.remove('active');
    // 顯示關卡切換按鈕
    document.getElementById('btn-lb-prev').style.display = '';
    document.getElementById('btn-lb-next').style.display = '';
    this.elements.lbLevelDisplay.style.display = '';

    // 優先從雲端讀取，失敗則回退到本地
    let data = [];
    try {
      if (typeof CloudStorage !== 'undefined') {
        const cloudData = await CloudStorage.getLeaderboard();
        if (cloudData && cloudData[level]) {
          data = cloudData[level];
        } else {
          data = Storage.getLeaderboard(level);
        }
      } else {
        data = Storage.getLeaderboard(level);
      }
    } catch (err) {
      data = Storage.getLeaderboard(level);
    }

    this.elements.lbLevelDisplay.textContent = gameSettings.language === 'en' ? `Level ${level}` : `關卡 ${level}`;
    this.elements.lbTableBody.innerHTML = '';
    
    // 更新表頭
    const thead = document.querySelector('#leaderboard-table thead tr');
    if (thead) {
      const rankText = gameSettings.language === 'en' ? 'Rank' : '名次';
      const nameText = gameSettings.language === 'en' ? 'Name' : '名字';
      const timeText = gameSettings.language === 'en' ? 'Time' : '時間';
      thead.innerHTML = `<th>${rankText}</th><th>${nameText}</th><th>${timeText}</th>`;
    }
    
    if (data.length === 0) {
      this.elements.lbTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center">${gameSettings.language === 'en' ? 'No records yet' : '尚無紀錄'}</td></tr>`;
    } else {
      data.forEach((row, idx) => {
        const tr = document.createElement('tr');
        let rankColor = '#bdc3c7';
        if (idx === 0) rankColor = '#f1c40f';
        else if (idx === 1) rankColor = '#e67e22';
        else if (idx === 2) rankColor = '#d35400';
        
        tr.innerHTML = `
          <td style="color:${rankColor};font-weight:bold;">#${idx + 1}</td>
          <td>${row.name}</td>
          <td>${GameTimer.formatTime(row.timeMs)}</td>
        `;
        this.elements.lbTableBody.appendChild(tr);
      });
    }
    
    this.showMenu('leaderboard');
  }

  /**
   * 遊玩時間排行榜
   */
  showPlayTimeLeaderboard() {
    this.currentLbTab = 'time';
    
    // 更新 tab 樣式
    if (this.elements.lbTabLevel) this.elements.lbTabLevel.classList.remove('active');
    if (this.elements.lbTabTime) this.elements.lbTabTime.classList.add('active');
    // 隱藏關卡切換按鈕
    document.getElementById('btn-lb-prev').style.display = 'none';
    document.getElementById('btn-lb-next').style.display = 'none';
    this.elements.lbLevelDisplay.textContent = gameSettings.language === 'en' ? 'Play Time' : '遊玩時間';

    const data = Storage.getPlayTimeRecords();
    this.elements.lbTableBody.innerHTML = '';
    
    // 更新表頭
    const thead = document.querySelector('#leaderboard-table thead tr');
    if (thead) {
      const rankText = gameSettings.language === 'en' ? 'Rank' : '名次';
      const nameText = gameSettings.language === 'en' ? 'Name' : '名字';
      const timeText = gameSettings.language === 'en' ? 'Time' : '時間';
      const titleText = gameSettings.language === 'en' ? 'Title' : '稱號';
      thead.innerHTML = `<th>${rankText}</th><th>${nameText}</th><th>${timeText}</th><th>${titleText}</th>`;
    }
    
    if (data.length === 0) {
      const noRecordsTarget = gameSettings.language === 'en' ? 'No records yet' : '尚無紀錄';
      this.elements.lbTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center">${noRecordsTarget}</td></tr>`;
    } else {
      data.forEach((row, idx) => {
        const tr = document.createElement('tr');
        let rankColor = '#bdc3c7';
        if (idx === 0) rankColor = '#f1c40f';
        else if (idx === 1) rankColor = '#e67e22';
        else if (idx === 2) rankColor = '#d35400';
        
        tr.innerHTML = `
          <td style="color:${rankColor};font-weight:bold;">#${idx + 1}</td>
          <td>${row.name}</td>
          <td>${GameTimer.formatTime(row.totalMs)}</td>
          <td>${row.title || ''}</td>
        `;
        this.elements.lbTableBody.appendChild(tr);
      });
    }
    
    this.showMenu('leaderboard');
  }

  /**
   * 顯示遊戲中的浮動訊息（蛇出現、被吃、困死等）
   * @param {string} text 訊息文字
   * @param {Function} onDismiss 訊息消失後的回呼
   */
  showGameMessage(text, onDismiss) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.9);
      color: #fff;
      font-family: 'DotGothic16', sans-serif;
      font-size: 1.5rem;
      padding: 1.5rem 2.5rem;
      border: 3px solid #e74c3c;
      border-radius: 8px;
      z-index: 999;
      text-shadow: 0 0 10px rgba(231, 76, 60, 0.5);
      animation: cheatFadeIn 0.3s ease;
      max-width: 80vw;
      text-align: center;
    `;
    document.body.appendChild(msg);

    const duration = onDismiss ? 2500 : 500;

    setTimeout(() => {
      msg.style.transition = 'opacity 0.8s ease';
      msg.style.opacity = '0';
      setTimeout(() => {
        msg.remove();
        if (onDismiss) onDismiss();
      }, 800);
    }, duration);
  }

  /**
   * 顯示小型的首輪教學提示 (畫面上方，2.2~3秒消失)
   * @param {string} key 提示文案的鍵名 (beacon, snakeSeen, attack)
   * @param {number} duration 
   */
  showHint(key, duration = 8000) {
    const el = document.getElementById('tutorial-hint');
    if (!el) return;

    const currentLang = gameSettings.language || 'zh';
    const text = this.HINT_TEXTS[currentLang][key] || this.HINT_TEXTS.zh[key];

    el.textContent = text;
    el.classList.add('show');
    el.style.pointerEvents = 'auto'; // 序求、點擊可間除

    // 清除舊計時器和按鍵監聽
    if (this._hintTimer) clearTimeout(this._hintTimer);
    if (this._hintKeyHandler) {
      window.removeEventListener('keydown', this._hintKeyHandler, { once: true });
      window.removeEventListener('touchstart', this._hintKeyHandler, { once: true });
    }

    const dismiss = () => {
      el.classList.remove('show');
      el.style.pointerEvents = 'none';
      this._hintTimer = null;
      this._hintKeyHandler = null;
      window.removeEventListener('keydown', dismiss);
      window.removeEventListener('touchstart', dismiss);
    };

    this._hintKeyHandler = dismiss;

    // 8 秒後自動關閉
    this._hintTimer = setTimeout(dismiss, duration);

    // 任意鍵 / 觸控可立即關閉
    window.addEventListener('keydown', dismiss, { once: true });
    window.addEventListener('touchstart', dismiss, { once: true });
  }

  // 更新介面語言
  updateUILanguage() {
    const lang = gameSettings.language || 'zh';
    const dict = this.I18N[lang] || this.I18N.zh || {};
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key || !dict[key]) return;
      if (el.tagName === 'INPUT' && el.type === 'text') {
        el.placeholder = dict[key];
      } else {
        el.textContent = dict[key];
      }
    });
    // 暫停鈕特殊處理 (含 ESC 提示)
    if (this.hud.btnPause) {
      const label = dict.pause || '暫停';
      this.hud.btnPause.innerHTML = `<span data-i18n="pause">${label}</span> (ESC)`;
    }
    if (this.elements.btnEducationPause) {
      const label = dict.pause || '暫停';
      this.elements.btnEducationPause.innerHTML = `<span data-i18n="pause">${label}</span> (ESC)`;
    }
    this._buildEducationLevelMenu();

    const educationManager = this.game.educationManager;
    if (this.game.mode === 'education' && educationManager) {
      this._renderEducationHeader(educationManager.config);
      this.updateEducationProgress(educationManager.expectedIndex, educationManager.config);
      if (educationManager.gateUnlocked) this.showEducationGateUnlocked(educationManager.config);
      if (educationManager.completed) {
        if (this.elements.educationCompleteCopy) {
          const completeKey = educationManager.config.taskType === 'color'
            ? 'edu_complete_color'
            : educationManager.config.taskType === 'place-value'
              ? 'edu_complete_place'
              : educationManager.config.taskType === 'mixed'
                ? 'edu_complete_mixed'
                : 'edu_complete_number';
          this.elements.educationCompleteCopy.textContent = dict[completeKey] || dict.edu_complete_copy;
        }
        if (this.elements.educationCompleteSequence) {
          this.elements.educationCompleteSequence.textContent = this._educationSequenceSummary(educationManager.config);
        }
      }
    }
  }

  /**
   * 閃爍動作按鈕 (Space)
   */
  flashActionButton() {
    // 獲取電腦版與手機版的動作按鈕
    const mobileBtn = document.getElementById('btn-skill-drill');
    const hudSkill = document.getElementById('hud-drill'); // HUD 上的鑽牆字樣也可以亮一下

    if (mobileBtn) {
      mobileBtn.classList.add('flash');
      setTimeout(() => mobileBtn.classList.remove('flash'), 1200);
    }
  }

  /**
   * 顯示金手指啟動的浮動訊息
   */
  showCheatMessage(text) {
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.85);
      color: #f1c40f;
      font-family: 'Press Start 2P', cursive;
      font-size: 1.5rem;
      padding: 1.5rem 2.5rem;
      border: 3px solid #f1c40f;
      border-radius: 8px;
      z-index: 999;
      text-shadow: 0 0 10px #f39c12;
      animation: cheatFadeIn 0.3s ease;
    `;
    document.body.appendChild(msg);

    setTimeout(() => {
      msg.style.transition = 'opacity 1s ease';
      msg.style.opacity = '0';
      setTimeout(() => msg.remove(), 1000);
    }, 2500);
  }
}
