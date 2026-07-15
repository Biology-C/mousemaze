/**
 * education_content.js
 * 小小探險家的 20 關課程：數列、顏色線索與 11～20 位值概念。
 */

(() => {
  window.EDUCATION_COLOR_TOKENS = Object.freeze({
    red: Object.freeze({ color: '#e74c3c', textColor: '#ffffff', shape: '●', labelKey: 'edu_color_red' }),
    yellow: Object.freeze({ color: '#f1c40f', textColor: '#17202a', shape: '★', labelKey: 'edu_color_yellow' }),
    blue: Object.freeze({ color: '#3498db', textColor: '#ffffff', shape: '■', labelKey: 'edu_color_blue' }),
    green: Object.freeze({ color: '#2ecc71', textColor: '#17202a', shape: '▲', labelKey: 'edu_color_green' }),
    purple: Object.freeze({ color: '#9b59b6', textColor: '#ffffff', shape: '◆', labelKey: 'edu_color_purple' }),
    orange: Object.freeze({ color: '#e67e22', textColor: '#ffffff', shape: '⬢', labelKey: 'edu_color_orange' })
  });

  const freezeLevel = (level) => Object.freeze({
    taskType: 'number',
    ...level,
    sequence: Object.freeze([...level.sequence]),
    displaySequence: Object.freeze([...(level.displaySequence || level.sequence)]),
    referenceSequence: level.referenceSequence
      ? Object.freeze([...level.referenceSequence])
      : null,
    decoys: Object.freeze([...(level.decoys || [])]),
    focusValues: Object.freeze([...(level.focusValues || [])])
  });

  const level = (id, chapter, options) => freezeLevel({
    id,
    chapter,
    chapterKey: `edu_chapter_${chapter}`,
    nameKey: `edu_l${id}_name`,
    ruleKey: `edu_l${id}_rule`,
    ...options
  });

  window.EDUCATION_LEVELS = Object.freeze([
    level(1, 1, {
      sequence: [1, 2, 3, 4, 5],
      nudgeKey: 'edu_nudge_plus_one'
    }),
    level(2, 1, {
      sequence: [2, 4, 6, 8, 10],
      nudgeKey: 'edu_nudge_plus_two'
    }),
    level(3, 1, {
      taskType: 'color',
      sequence: ['red', 'yellow', 'blue'],
      decoys: ['green', 'purple'],
      nudgeKey: 'edu_nudge_color_order'
    }),
    level(4, 1, {
      sequence: [5, 10, 15, 20, 25],
      groupSize: 5,
      nudgeKey: 'edu_nudge_plus_five',
      badgeKey: 'edu_badge_number_star'
    }),

    level(5, 2, {
      taskType: 'place-value',
      sequence: [10, 11, 12, 13, 14],
      focusValues: [12],
      speechEnabled: true,
      nudgeKey: 'edu_nudge_tens'
    }),
    level(6, 2, {
      taskType: 'color',
      sequence: ['red', 'blue', 'red', 'yellow'],
      decoys: ['green', 'purple'],
      nudgeKey: 'edu_nudge_color_order'
    }),
    level(7, 2, {
      taskType: 'place-value',
      sequence: [15, 16, 17, 18, 19],
      focusValues: [18],
      speechEnabled: true,
      nudgeKey: 'edu_nudge_tens'
    }),
    level(8, 2, {
      taskType: 'place-value',
      sequence: [10, 12, 20],
      decoys: ['02', 2, 21, 22],
      focusValues: [12, 20],
      speechEnabled: true,
      nudgeKey: 'edu_nudge_twelve_twenty',
      badgeKey: 'edu_badge_tens_guardian'
    }),

    level(9, 3, {
      taskType: 'place-value',
      sequence: [12, 14, 16, 18, 20],
      focusValues: [12, 20],
      speechEnabled: true,
      nudgeKey: 'edu_nudge_plus_two'
    }),
    level(10, 3, {
      taskType: 'color',
      sequence: ['red', 'red', 'blue', 'yellow', 'blue'],
      decoys: ['green', 'purple', 'orange'],
      nudgeKey: 'edu_nudge_color_count'
    }),
    level(11, 3, {
      taskType: 'place-value',
      sequence: [11, 12, 13, 14, 15],
      displaySequence: [11, null, 13, null, 15],
      decoys: ['02', 20, 21, 10],
      focusValues: [12],
      speechEnabled: true,
      nudgeKey: 'edu_nudge_tens'
    }),
    level(12, 3, {
      taskType: 'place-value',
      sequence: [16, 17, 18, 19, 20],
      displaySequence: [16, null, 18, null, 20],
      decoys: [6, 7, 12, '02'],
      focusValues: [20],
      speechEnabled: true,
      nudgeKey: 'edu_nudge_tens',
      badgeKey: 'edu_badge_place_builder'
    }),

    level(13, 4, {
      sequence: [5, 10, 15, 20, 25],
      displaySequence: [5, 10, null, 20, null],
      decoys: [14, 16, 24, 26],
      groupSize: 5,
      nudgeKey: 'edu_nudge_plus_five'
    }),
    level(14, 4, {
      taskType: 'color',
      sequence: ['green', 'green', 'yellow', 'blue', 'blue'],
      decoys: ['red', 'purple', 'orange'],
      nudgeKey: 'edu_nudge_color_count'
    }),
    level(15, 4, {
      taskType: 'place-value',
      sequence: [12, 14, 16, 18, 20],
      displaySequence: [12, null, 16, null, 20],
      decoys: [11, 13, 15, 17],
      focusValues: [12, 20],
      nudgeKey: 'edu_nudge_plus_two'
    }),
    level(16, 4, {
      taskType: 'color',
      sequence: ['yellow', 'blue', 'green', 'red'],
      displaySequence: ['yellow', null, 'green', 'red'],
      decoys: ['orange', 'purple'],
      nudgeKey: 'edu_nudge_color_relation',
      badgeKey: 'edu_badge_clue_detective'
    }),

    level(17, 5, {
      sequence: [4, 6, 8, 10, 12],
      displaySequence: [4, 6, null, 10, 12],
      decoys: [7, 9, 11, 13],
      nudgeKey: 'edu_nudge_plus_two'
    }),
    level(18, 5, {
      sequence: [10, 15, 20, 25, 30],
      displaySequence: [10, null, 20, null, 30],
      decoys: [14, 16, 24, 26],
      groupSize: 5,
      nudgeKey: 'edu_nudge_plus_five'
    }),
    level(19, 5, {
      taskType: 'color',
      sequence: ['red', 'green', 'blue', 'yellow'],
      displaySequence: ['red', null, null, 'yellow'],
      decoys: ['orange', 'purple'],
      nudgeKey: 'edu_nudge_color_relation'
    }),
    level(20, 5, {
      taskType: 'mixed',
      sequence: ['2:red', '4:yellow', '6:blue', '8:red', '10:yellow'],
      decoys: ['2:blue', '4:red', '6:yellow', '8:blue'],
      nudgeKey: 'edu_nudge_mixed',
      badgeKey: 'edu_badge_master_explorer'
    })
  ]);
})();
