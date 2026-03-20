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
      settings: document.getElementById('menu-settings'),
      help: document.getElementById('menu-help'),
    };

    // HUD
    this.hud = {
      container: document.getElementById('hud'),
      level: document.getElementById('hud-level'),
      time: document.getElementById('hud-time'),
      drill: document.getElementById('hud-drill'),
      hint: document.getElementById('hud-hint'),
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
      btnContinue: document.getElementById('btn-continue'),
      btnNextLevel: document.getElementById('btn-next-level'),
      
      // 排行榜相關
      lbTableBody: document.getElementById('leaderboard-body'),
      lbLevelDisplay: document.getElementById('lb-level-display'),
      lbTabLevel: document.getElementById('lb-tab-level'),
      lbTabTime: document.getElementById('lb-tab-time'),
      inputName: document.getElementById('input-player-name'),

      // 設定相關
      btnSettings: document.getElementById('btn-settings'),
      btnSaveSettings: document.getElementById('btn-save-settings'),
      selectSpeed: document.getElementById('setting-speed'),
      selectTheme: document.getElementById('setting-theme'),
      selectDifficulty: document.getElementById('setting-difficulty'),
      selectLanguage: document.getElementById('setting-lang'),

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
    };

    // 搖框狀態
    this._joystickActive = false;
    this._joystickTouchId = null;
    this._lastJoystickDir = null;

    this.currentLbLevel = 1;
    this.currentLbTab = 'level'; // 'level' 或 'time'

    this.bindEvents();
    this.checkContinueBtn();
    
    // 多語系提示文案 (僅保留 zh, en)
    this.HINT_TEXTS = {
      zh: {
        beacon: "燈塔會照亮，但也會封路。",
        snakeSeen: "蛇優先追燈塔，沒有燈塔時才追你。",
        attack: "現在可攻擊！"
      },
      en: {
        beacon: "Lighthouses illuminate, but also block paths.",
        snakeSeen: "Snakes prioritize lighthouses. They chase you only if none are near.",
        attack: "Attack now!"
      }
    };

    // 介面全域翻譯
    this.I18N = {
      zh: {
        level: "關卡", time: "時間", dig: "打洞", hint: "提示",
        pause: "暫停", action: "動作", beacon: "燈塔", settings: "設定",
        start: "開始新遊戲", continue: "繼續遊戲", leaderboard: "排行榜", help: "操作說明",
        pause_title: "遊戲暫停", resume: "繼續遊戲", restart: "重新開始本關", quit: "回主選單",
        complete: "關卡完成！", level_time: "本關用時", total_time: "總計用時",
        next_level: "進入下一關", rest: "休息結算 (存檔)", close: "關閉", help_close: "我知道了",
        save_close: "儲存並關閉"
      },
      en: {
        level: "Level", time: "Time", dig: "Dig", hint: "Hint",
        pause: "Pause", action: "Action", beacon: "Beacon", settings: "Settings",
        start: "Start New Game", continue: "Continue", leaderboard: "Leaderboard", help: "How to Play",
        pause_title: "Game Paused", resume: "Resume", restart: "Restart Level", quit: "Main Menu",
        complete: "Level Complete!", level_time: "Level Time", total_time: "Total Time",
        next_level: "Next Level", rest: "Rest & Save", close: "Close", help_close: "Got it",
        save_close: "Save & Close"
      }
    };

    window.addEventListener('resize', () => this.checkMobileControls());
    this.updateUILanguage();
  }

  checkMobileControls() {
    if (this.elements.mobileControls) {
      if (this.game.state === Game.STATE_PLAYING && window.innerWidth <= 768 && window.innerHeight > window.innerWidth) {
        this.elements.mobileControls.classList.add('active');
        this.elements.mobileControls.classList.remove('hidden');
      } else {
        this.elements.mobileControls.classList.remove('active');
        this.elements.mobileControls.classList.add('hidden');
      }
    }
  }

  bindEvents() {
    // 主選單
    this.elements.btnStart.addEventListener('click', () => this.game.startNewGame());
    this.elements.btnContinue.addEventListener('click', () => this.game.continueGame());
    document.getElementById('btn-leaderboard').addEventListener('click', () => this.showLeaderboard(1));
    this.elements.btnSettings.addEventListener('click', () => this.showSettings());
    this.elements.btnHelp.addEventListener('click', () => this.showMenu('help'));
    this.elements.btnHelpClose.addEventListener('click', () => this.showMenu('main'));

    // 暫停選單
    this.hud.btnPause.addEventListener('click', () => this.game.togglePause());
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
    });

    // 過關選單
    document.getElementById('btn-rest').addEventListener('click', () => this.game.restAndSave());
    this.elements.btnNextLevel.addEventListener('click', () => this.game.startNextLevel());

    // 輸入名稱
    document.getElementById('btn-submit-name').addEventListener('click', () => {
      let name = this.elements.inputName.value.trim();
      if (!name) name = 'Hero';
      this.game.submitHighScore(name);
    });

    // 排行榜選單
    document.getElementById('btn-lb-close').addEventListener('click', () => this.hideMenu('leaderboard'));
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
    
    // 手機版設定鍵
    if (this.elements.btnSkillSettings) {
      this.elements.btnSkillSettings.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.showSettings();
      }, { passive: false });
      this.elements.btnSkillSettings.addEventListener('mousedown', () => this.showSettings());
    }

    // GM 跳關 Enter
    if (this.elements.gmJumpLevel) {
      this.elements.gmJumpLevel.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const lv = parseInt(this.elements.gmJumpLevel.value);
          if (!isNaN(lv)) {
            this.game.skipToLevel(lv);
            this.elements.gmJumpLevel.blur();
          }
        }
      });
    }
  }

  initJoystick() {
    const zone = this.elements.joystickZone;
    const base = this.elements.joystickBase;
    const knob = this.elements.joystickKnob;
    if (!zone || !base || !knob) return;

    const baseRadius = 70;
    const knobRadius = 28;
    const maxDist = baseRadius - knobRadius;
    const deadZone = 15;

    const getBaseCenter = () => {
      const rect = base.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const handleMove = (clientX, clientY) => {
      const center = getBaseCenter();
      let dx = clientX - center.x;
      let dy = clientY - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      knob.style.left = (baseRadius + dx - knobRadius) + 'px';
      knob.style.top = (baseRadius + dy - knobRadius) + 'px';

      if (dist < deadZone) {
        this._releaseJoystickDir();
        return;
      }

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      let newDir = null;
      if (angle >= -45 && angle < 45) newDir = 'ArrowRight';
      else if (angle >= 45 && angle < 135) newDir = 'ArrowDown';
      else if (angle >= -135 && angle < -45) newDir = 'ArrowUp';
      else newDir = 'ArrowLeft';

      if (newDir !== this._lastJoystickDir) {
        this._releaseJoystickDir();
        this._lastJoystickDir = newDir;
        if (this.game.player) this.game.player.setKeyDown(newDir);
      }
    };

    const handleEnd = () => {
      this._joystickActive = false;
      this._joystickTouchId = null;
      knob.style.left = '42px';
      knob.style.top = '42px';
      this._releaseJoystickDir();
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

  updateHUD(level, msTime) {
    this.hud.level.textContent = level;
    this.hud.time.textContent = GameTimer.formatTime(msTime);
  }

  updateSkillHUD(drillCount, hintCount) {
    if (this.hud.drill) {
      this.hud.drill.textContent = drillCount === Infinity ? '∞' : drillCount;
    }
    if (this.hud.hint) {
      this.hud.hint.textContent = hintCount === Infinity ? '∞' : hintCount;
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
    this.showMenu('settings');
  }

  saveSettings() {
    gameSettings.speed = parseFloat(this.elements.selectSpeed.value);
    gameSettings.theme = this.elements.selectTheme.value;
    gameSettings.difficulty = this.elements.selectDifficulty.value;
    gameSettings.language = this.elements.selectLanguage.value; // Added language setting
    gameSettings.save();
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

  // 更新所有帶有 data-i18n 屬性的元素文字
  updateUILanguage() {
    const lang = gameSettings.language || 'zh';
    const dict = this.I18N[lang] || this.I18N.zh;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // 特殊處理：如果有外部按鈕標籤
    if (this.elements.btnPause) {
      const pauseText = lang === 'en' ? 'Pause' : '暫停';
      this.elements.btnPause.innerHTML = `<span data-i18n="pause">${pauseText}</span> (ESC)`;
    }
  }

  /**
   * 關卡排行榜
   */
  showLeaderboard(level) {
    this.currentLbLevel = level;
    this.currentLbTab = 'level';
    this.elements.lbLevelDisplay.textContent = `關卡 ${level}`;
    
    // 更新 tab 樣式
    if (this.elements.lbTabLevel) this.elements.lbTabLevel.classList.add('active');
    if (this.elements.lbTabTime) this.elements.lbTabTime.classList.remove('active');
    // 顯示關卡切換按鈕
    document.getElementById('btn-lb-prev').style.display = '';
    document.getElementById('btn-lb-next').style.display = '';
    this.elements.lbLevelDisplay.style.display = '';

    const data = Storage.getLeaderboard(level);
    this.elements.lbTableBody.innerHTML = '';
    
    // 更新表頭
    const thead = document.querySelector('#leaderboard-table thead tr');
    if (thead) thead.innerHTML = '<th>名次</th><th>名字</th><th>時間</th>';
    
    if (data.length === 0) {
      this.elements.lbTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center">尚無紀錄</td></tr>';
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
    this.elements.lbLevelDisplay.textContent = '遊玩時間';

    const data = Storage.getPlayTimeRecords();
    this.elements.lbTableBody.innerHTML = '';
    
    // 更新表頭
    const thead = document.querySelector('#leaderboard-table thead tr');
    if (thead) thead.innerHTML = '<th>名次</th><th>名字</th><th>時間</th><th>稱號</th>';
    
    if (data.length === 0) {
      this.elements.lbTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center">尚無紀錄</td></tr>';
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
  showHint(key, duration = 2800) {
    const el = document.getElementById('tutorial-hint');
    if (!el) return;

    const currentLang = gameSettings.language || 'zh';
    const text = this.HINT_TEXTS[currentLang][key] || this.HINT_TEXTS.zh[key];

    el.textContent = text;
    el.classList.add('show');

    if (this._hintTimer) clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => {
      el.classList.remove('show');
      this._hintTimer = null;
    }, duration);
  }

  // 更新介面語言
  updateUILanguage() {
    const lang = gameSettings.language || 'zh';
    const dict = this.I18N[lang] || this.I18N.zh;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && dict[key]) el.textContent = dict[key];
    });
    // 暫停鈕特殊處理 (含 ESC 提示)
    if (this.hud.btnPause) {
      const label = dict.pause || '暫停';
      this.hud.btnPause.innerHTML = `<span data-i18n="pause">${label}</span> (ESC)`;
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
