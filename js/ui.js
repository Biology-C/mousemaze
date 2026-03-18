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
      btnStart: document.getElementById('btn-start'),
      btnContinue: document.getElementById('btn-continue'),
      btnNextLevel: document.getElementById('btn-next-level'),
      
      // 排行榜相關
      lbTableBody: document.getElementById('leaderboard-body'),
      lbLevelDisplay: document.getElementById('lb-level-display'),
      inputName: document.getElementById('input-player-name'),

      // 設定相關
      btnSettings: document.getElementById('btn-settings'),
      btnSaveSettings: document.getElementById('btn-save-settings'),
      selectSpeed: document.getElementById('setting-speed'),
      selectTheme: document.getElementById('setting-theme'),
      selectDifficulty: document.getElementById('setting-difficulty'),

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
    };

    // 搖框狀態
    this._joystickActive = false;
    this._joystickTouchId = null;
    this._lastJoystickDir = null; // 上次搖框方向 ('ArrowUp'/'ArrowDown'/'ArrowLeft'/'ArrowRight'/null)

    this.currentLbLevel = 1;

    this.bindEvents();
    this.checkContinueBtn();
    
    // 定期檢查畫面尺寸，決定是否啟用虛擬按鈕
    window.addEventListener('resize', () => this.checkMobileControls());
  }

  checkMobileControls() {
    // Media query 設定在 < 768px 及 portrait，且遊戲狀態為 PLAYING 時才加入 active class 顯示
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

    // 支援 ESC 熱鍵暫停
    window.addEventListener('keydown', (e) => {
      // 如果正在輸入紀錄名字，不處理 ESC
      if (e.key === 'Escape' && this.elements.recordEntry && !this.elements.recordEntry.classList.contains('hidden')) return;
      
      if (e.key === 'Escape' && 
          (this.game.state === Game.STATE_PLAYING || this.game.state === Game.STATE_PAUSED)) {
        this.game.togglePause();
      }
    });

    // 過關選單
    document.getElementById('btn-rest').addEventListener('click', () => this.game.restAndSave());
    this.elements.btnNextLevel.addEventListener('click', () => this.game.startNextLevel());

    // 輸入名稱 (在 levelComplete 內的 record-entry)
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
      if (this.currentLbLevel < 12) this.showLeaderboard(this.currentLbLevel + 1);
    });

    // 設定選單
    this.elements.btnSaveSettings.addEventListener('click', () => this.saveSettings());

    // 搖框事件綁定
    this.initJoystick();
    
    // 技能鈕事件綁定
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

  }

  /**
   * 初始化虛擬搖框
   */
  initJoystick() {
    const zone = this.elements.joystickZone;
    const base = this.elements.joystickBase;
    const knob = this.elements.joystickKnob;
    if (!zone || !base || !knob) return;

    const baseRadius = 70; // 140 / 2
    const knobRadius = 28; // 56 / 2
    const maxDist = baseRadius - knobRadius; // 搖框可拖曳最大距離
    const deadZone = 15; // 死區，避免誤觸

    const getBaseCenter = () => {
      const rect = base.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };

    const handleMove = (clientX, clientY) => {
      const center = getBaseCenter();
      let dx = clientX - center.x;
      let dy = clientY - center.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 限制在圓形範圍內
      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      // 更新搖框渲染位置
      knob.style.left = (baseRadius + dx - knobRadius) + 'px';
      knob.style.top = (baseRadius + dy - knobRadius) + 'px';

      // 計算方向
      if (dist < deadZone) {
        this._releaseJoystickDir();
        return;
      }

      // 判斷角度 -> 方向
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
      // 搖框回彈回中
      knob.style.left = '42px';
      knob.style.top = '42px';
      this._releaseJoystickDir();
    };

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this._joystickActive) return; // 已有一個觸控點
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

    // 滑鼠支援 (電腦除錯用)
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

  /**
   * 封裝虛擬按鈕事件綁定
   */
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
    // 滑鼠支援
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
      this.hud.drill.textContent = drillCount;
    }
    if (this.hud.hint) {
      this.hud.hint.textContent = hintCount === Infinity ? '無限' : hintCount;
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
    if (save && save.level > 1 && save.level <= 12) {
      this.elements.btnContinue.classList.remove('hidden');
    } else {
      this.elements.btnContinue.classList.add('hidden');
    }
  }

  showLevelComplete(level, isNewRecord, levelTime, totalTime) {
    this.showMenu('levelComplete');
    this.elements.statLevelTime.textContent = GameTimer.formatTime(levelTime);
    this.elements.statTotalTime.textContent = GameTimer.formatTime(totalTime);
    
    // 顯示或隱藏紀錄輸入區
    if (this.elements.recordEntry) {
      if (isNewRecord) {
        this.elements.recordEntry.classList.remove('hidden');
        if (this.elements.inputName) {
          this.elements.inputName.value = '';
          this.elements.inputName.focus();
        }
      } else {
        this.elements.recordEntry.classList.add('hidden');
      }
    }

    if (level === 12) {
      this.elements.completeTitle.textContent = "完成挑戰！🎉";
      this.elements.btnNextLevel.classList.add('hidden');
    } else {
      this.elements.completeTitle.textContent = `第 ${level} 關過關！`;
      this.elements.btnNextLevel.classList.remove('hidden');
      this.elements.btnNextLevel.textContent = "進入下一關";
    }
  }

  // showNameEntry is now integrated into showLevelComplete, kept as no-op for safety
  showNameEntry() {
    // handled inside showLevelComplete
  }

  hideRecordEntry() {
    if (this.elements.recordEntry) {
      this.elements.recordEntry.classList.add('hidden');
    }
  }

  showSettings() {
    // 記錄是從哪個狀態開啟設定
    this._settingsCalledFrom = this.game.state;
    this.elements.selectSpeed.value = gameSettings.speed;
    this.elements.selectTheme.value = gameSettings.theme;
    this.elements.selectDifficulty.value = gameSettings.difficulty;
    this.showMenu('settings');
  }

  saveSettings() {
    gameSettings.speed = parseFloat(this.elements.selectSpeed.value);
    gameSettings.theme = this.elements.selectTheme.value;
    gameSettings.difficulty = this.elements.selectDifficulty.value;
    gameSettings.save();
    
    if (this.game.player) {
      this.game.player.speed = gameSettings.speed;
    }
    if (this.game.renderer) {
      this.game.renderer.setThemeColors();
    }
    
    this.hideMenu('settings');
    
    // 根據開啟設定前的狀態正確返回
    const from = this._settingsCalledFrom;
    if (from === Game.STATE_PLAYING) {
      // 從遅中開啟：隔絕遊戲中，直接關閉設定即可，不顯示任何覆蓋
      this.checkMobileControls();
    } else if (from === Game.STATE_PAUSED) {
      this.showMenu('pause');
    } else {
      this.showMenu('main');
    }
  }

  showLeaderboard(level) {
    this.currentLbLevel = level;
    this.elements.lbLevelDisplay.textContent = `關卡 ${level}`;
    
    const data = Storage.getLeaderboard(level);
    this.elements.lbTableBody.innerHTML = '';
    
    if (data.length === 0) {
      this.elements.lbTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center">尚無紀錄</td></tr>';
    } else {
      data.forEach((row, idx) => {
        const tr = document.createElement('tr');
        // 前三名給特別顏色
        let rankColor = '#bdc3c7';
        if (idx === 0) rankColor = '#f1c40f'; // 金
        else if (idx === 1) rankColor = '#e67e22'; // 銀 (橘代)
        else if (idx === 2) rankColor = '#d35400'; // 銅
        
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
