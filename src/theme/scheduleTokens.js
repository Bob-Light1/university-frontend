/**
 * @file scheduleTokens.js
 * @description Design tokens for the Schedule module.
 *
 * Single source of truth for session type colors, labels and options.
 * Used by: ScheduleCard, ScheduleDetailDrawer, ScheduleForm, ScheduleFilters.
 */

// ─── Session type colors ───────────────────────────────────────────────────────
// Covers both student/admin schema (PRACTICAL, WORKSHOP) and
// teacher schema (LAB, SEMINAR, OTHER) to handle all possible values from the API.

export const SESSION_TYPE_COLOR = {
  LECTURE:   '#1976d2',
  TUTORIAL:  '#7b1fa2',
  PRACTICAL: '#388e3c',
  LAB:       '#388e3c', // teacher-schema alias for PRACTICAL
  EXAM:      '#d32f2f',
  WORKSHOP:  '#0097a7',
  SEMINAR:   '#f57c00', // teacher schema
  OTHER:     '#455a64', // teacher schema
};

// ─── Session type labels ───────────────────────────────────────────────────────

export const SESSION_TYPE_LABEL = {
  LECTURE:   'Lecture',
  TUTORIAL:  'Tutorial',
  PRACTICAL: 'Practical',
  LAB:       'Lab',
  EXAM:      'Exam',
  WORKSHOP:  'Workshop',
  SEMINAR:   'Seminar',
  OTHER:     'Other',
};

// ─── Select options (form + filter dropdowns) ─────────────────────────────────

export const SESSION_TYPE_OPTIONS = [
  { value: 'LECTURE',   label: 'Lecture'   },
  { value: 'TUTORIAL',  label: 'Tutorial'  },
  { value: 'PRACTICAL', label: 'Practical' },
  { value: 'EXAM',      label: 'Exam'      },
  { value: 'WORKSHOP',  label: 'Workshop'  },
];
