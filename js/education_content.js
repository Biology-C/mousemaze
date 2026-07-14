/**
 * education_content.js
 * 小小探險家的八關數列課程資料。
 */

(() => {
  const freezeLevel = (level) => Object.freeze({
    ...level,
    sequence: Object.freeze([...level.sequence]),
    displaySequence: Object.freeze([...level.displaySequence]),
    referenceSequence: level.referenceSequence
      ? Object.freeze([...level.referenceSequence])
      : null,
    decoys: Object.freeze([...(level.decoys || [])])
  });

  window.EDUCATION_LEVELS = Object.freeze([
    freezeLevel({
      id: 1,
      nameKey: 'edu_l1_name',
      titleKey: 'edu_l1_title',
      ruleKey: 'edu_l1_rule',
      completeKey: 'edu_l1_complete',
      nudgeKey: 'edu_nudge_plus_one',
      sequence: [1, 2, 3, 4, 5],
      displaySequence: [1, 2, 3, 4, 5],
      decoys: []
    }),
    freezeLevel({
      id: 2,
      nameKey: 'edu_l2_name',
      titleKey: 'edu_l2_title',
      ruleKey: 'edu_l2_rule',
      completeKey: 'edu_l2_complete',
      nudgeKey: 'edu_nudge_plus_two',
      sequence: [1, 3, 5, 7, 9],
      displaySequence: [1, 3, 5, 7, 9],
      decoys: []
    }),
    freezeLevel({
      id: 3,
      nameKey: 'edu_l3_name',
      titleKey: 'edu_l3_title',
      ruleKey: 'edu_l3_rule',
      completeKey: 'edu_l3_complete',
      nudgeKey: 'edu_nudge_plus_two',
      sequence: [1, 3, 5, 7, 9],
      displaySequence: [1, 3, 5, 7, null],
      decoys: [8, 10]
    }),
    freezeLevel({
      id: 4,
      nameKey: 'edu_l4_name',
      titleKey: 'edu_l4_title',
      ruleKey: 'edu_l4_rule',
      completeKey: 'edu_l4_complete',
      nudgeKey: 'edu_nudge_plus_two',
      sequence: [1, 3, 5, 7, 9],
      displaySequence: [1, 3, null, 7, 9],
      decoys: [4, 6]
    }),
    freezeLevel({
      id: 5,
      nameKey: 'edu_l5_name',
      titleKey: 'edu_l5_title',
      ruleKey: 'edu_l5_rule',
      completeKey: 'edu_l5_complete',
      nudgeKey: 'edu_nudge_plus_two',
      sequence: [1, 3, 5, 7, 9],
      displaySequence: [1, null, 5, null, 9],
      decoys: [2, 4, 6, 8]
    }),
    freezeLevel({
      id: 6,
      nameKey: 'edu_l6_name',
      titleKey: 'edu_l6_title',
      ruleKey: 'edu_l6_rule',
      completeKey: 'edu_l6_complete',
      nudgeKey: 'edu_nudge_even',
      sequence: [2, 4, 6, 8, 10],
      displaySequence: [2, 4, null, 8, 10],
      referenceSequence: [1, 3, 5, 7, 9],
      decoys: [3, 5, 7, 9]
    }),
    freezeLevel({
      id: 7,
      nameKey: 'edu_l7_name',
      titleKey: 'edu_l7_title',
      ruleKey: 'edu_l7_rule',
      completeKey: 'edu_l7_complete',
      nudgeKey: 'edu_nudge_plus_five',
      sequence: [5, 10, 15, 20, 25],
      displaySequence: [5, 10, 15, 20, 25],
      decoys: [],
      groupSize: 5
    }),
    freezeLevel({
      id: 8,
      nameKey: 'edu_l8_name',
      titleKey: 'edu_l8_title',
      ruleKey: 'edu_l8_rule',
      completeKey: 'edu_l8_complete',
      nudgeKey: 'edu_nudge_plus_five',
      sequence: [5, 10, 15, 20, 25],
      displaySequence: [5, 10, null, 20, null],
      decoys: [14, 16, 24, 26],
      groupSize: 5
    })
  ]);
})();
