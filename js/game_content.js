/**
 * game_content.js
 * 集中管理關卡尺寸與教學關配置。
 */

window.GAME_TUTORIAL_CONFIG = Object.freeze([
  null,
  Object.freeze({ nameKey: 'tut1_name', size: 10, descKey: 'tut1_desc', titleKey: 'tut1_title' }),
  Object.freeze({ nameKey: 'tut2_name', size: 12, descKey: 'tut2_desc', titleKey: 'tut2_title' }),
  Object.freeze({ nameKey: 'tut3_name', size: 12, descKey: 'tut3_desc', titleKey: 'tut3_title' }),
  Object.freeze({ nameKey: 'tut4_name', size: 14, descKey: 'tut4_desc', titleKey: 'tut4_title' }),
  Object.freeze({ nameKey: 'tut5_name', size: 16, descKey: 'tut5_desc', titleKey: 'tut5_title' }),
  Object.freeze({ nameKey: 'tut6_name', size: 16, descKey: 'tut6_desc', titleKey: 'tut6_title' })
]);

window.GAME_LEVEL_SIZES = Object.freeze([
  0,
  10, 12, 12, 14, 16, 16,
  30, 33, 36, 39, 42, 45, 48, 51, 55, 59, 63, 67
]);
