/**
 * audio.js
 * 音效與音樂控制系統
 */

class AudioManager {
  constructor() {
    this.bgm = new Audio('music/CaveLoop.wav');
    this.bgm.loop = true;
    this.bgm.volume = 0.3; // 30% 音量

    this.walkSfx = new Audio('music/Walk_Alt03.wav');
    this.walkSfx.volume = 1.0;

    this.digSfx = new Audio('music/Walking_On_Grass_Slow.ogg');
    this.digSfx.volume = 1.0;

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
    this.bgm.currentTime = 0;
    this.isBGMPlaying = false;
  }

  playWalk() {
    this.walkSfx.currentTime = 0;
    this.walkSfx.play().catch(err => {});
  }

  playDig() {
    this.digSfx.currentTime = 0;
    this.digSfx.play().catch(err => {});
  }
}
