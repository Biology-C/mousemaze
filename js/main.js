/**
 * main.js
 * 遊戲進入點
 */

// 即時更新實際可視區域高度 (解決手機瀏覽器 100vh 包含網址列的問題)
function updateViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--real-vh', `${vh}px`);
}
updateViewportHeight();
window.addEventListener('resize', updateViewportHeight);
window.addEventListener('orientationchange', () => {
  // orientationchange 後需延遲一幀讓瀏覽器完成佈局
  setTimeout(updateViewportHeight, 100);
});

window.addEventListener('DOMContentLoaded', () => {
  updateViewportHeight();
  // 實例化遊戲主控台
  window.gameController = new Game();
});
