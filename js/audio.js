/**
 * audio.js
 * 音效與音樂控制系統
 */

class AudioManager {
  constructor() {
    this.bgmList = [
      'music/CaveLoop.wav',
      'music/Mysterious_Futuristic_8_bit_Music_loop.wav',
      'music/InTheMountains-FINAL.wav',
      'music/InTheMountainsShort-FINAL.wav'
    ];
    this.currentBgmIndex = 0;
    
    this.bgm = new Audio(this.bgmList[0]);
    this.bgm.loop = true;
    this.bgm.volume = 0.09; // 30% 音量 (原0.3的30%)

    this.walkSfx = new Audio('music/Walk_Alt01.ogg');
    this.walkSfx.volume = 0.3;

    this.digSfx = new Audio('music/Walking_On_Grass_Slow.ogg');
    this.digSfx.volume = 0.3;

    this.victorySfx = new Audio('music/Level_Complete.ogg');
    this.victorySfx.volume = 0.3;

    this.itemSfx = new Audio('music/Collect_Point.ogg');
    this.itemSfx.volume = 0.3;

    // 若 music/Hit.ogg 不存在，瀏覽器會報錯但不會影響遊戲執行
    this.hitSfx = new Audio('music/Hit.ogg'); 
    this.hitSfx.volume = 0.3;

    this.snakeSpawnSfx = new Audio('music/Alarm1.ogg');
    this.snakeSpawnSfx.volume = 0.3;

    this.isBGMPlaying = false;
    
    // 為了符合瀏覽器的 Autoplay Policy，綁定第一次點擊或按鍵事件來播放 BGM
    const startBGM = () => {
      this.playBGM();
      document.removeEventListener('click', startBGM);
      document.removeEventListener('keydown', startBGM);
      document.removeEventListener('touchstart', startBGM);
    };
    document.addEventListener('click', startBGM);
    document.addEventListener('keydown', startBGM);
    document.addEventListener('touchstart', startBGM);
  }

  playBGM() {
    if (!gameSettings.bgmEnabled) return;
    if (!this.isBGMPlaying) {
      this.bgm.play().then(() => {
        this.isBGMPlaying = true;
      }).catch(err => {
        console.log('BGM Autoplay prevented: ', err);
      });
    }
  }

  stopBGM() {
    this.bgm.pause();
    this.isBGMPlaying = false;
  }
  
  changeBGM(level) {
    this.stopBGM();
    const idx = (level - 1) % this.bgmList.length;
    if (this.currentBgmIndex !== idx) {
      this.currentBgmIndex = idx;
      this.bgm.src = this.bgmList[idx];
    }
    if (gameSettings.bgmEnabled) {
      this.playBGM();
    }
  }

  updateBGMState() {
    if (gameSettings.bgmEnabled) {
      this.playBGM();
    } else {
      this.stopBGM();
    }
  }

  playVictory() {
    this.stopBGM();
    if (!gameSettings.sfxEnabled) return;
    this.victorySfx.currentTime = 0;
    this.victorySfx.play().catch(err => {});
  }

  playWalk() {
    if (!gameSettings.sfxEnabled) return;
    this.walkSfx.currentTime = 0;
    this.walkSfx.play().catch(err => {});
  }

  playDig() {
    if (!gameSettings.sfxEnabled) return;
    this.digSfx.currentTime = 0;
    this.digSfx.play().catch(err => {});
  }

  playItemPickup() {
    if (!gameSettings.sfxEnabled) return;
    this.itemSfx.currentTime = 0;
    this.itemSfx.play().catch(err => {});
  }

  playHit() {
    if (!gameSettings.sfxEnabled) return;
    this.hitSfx.currentTime = 0;
    this.hitSfx.play().catch(err => {});
  }

  playSnakeSpawn() {
    if (!gameSettings.sfxEnabled) return;
    this.snakeSpawnSfx.currentTime = 0;
    this.snakeSpawnSfx.play().catch(err => {});
  }
}
