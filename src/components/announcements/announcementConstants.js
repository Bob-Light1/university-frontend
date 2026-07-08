/**
 * @file announcementConstants.js
 * @description Shared announcement metadata (type, status, target audience).
 *
 * Labels are exposed as i18n keys (`labelKey`) resolved by the consumer with
 * `t()` from the `announcements` namespace — never as literal strings, so a
 * language switch is reflected everywhere these constants are rendered.
 */

import { Info, Warning, PriorityHigh, Event } from '@mui/icons-material';

// ─── Type metadata ─────────────────────────────────────────────────────────────

export const TYPE_META = {
  info:    { labelKey: 'type.info',    color: 'info',      Icon: Info },
  warning: { labelKey: 'type.warning', color: 'warning',   Icon: Warning },
  urgent:  { labelKey: 'type.urgent',  color: 'error',     Icon: PriorityHigh },
  event:   { labelKey: 'type.event',   color: 'secondary', Icon: Event },
};

export const TYPE_OPTIONS = Object.entries(TYPE_META).map(([value, { labelKey, color, Icon }]) => ({
  value, labelKey, color, Icon,
}));

export const TYPE_FILTERS = [
  { value: '', labelKey: 'filter.allTypes' },
  ...Object.entries(TYPE_META).map(([value, { labelKey }]) => ({ value, labelKey })),
];

// ─── Status metadata ───────────────────────────────────────────────────────────

export const STATUS_META = {
  draft:     { labelKey: 'status.draft',     color: 'default' },
  published: { labelKey: 'status.published', color: 'success' },
  archived:  { labelKey: 'status.archived',  color: 'warning' },
};

// ─── Role / audience metadata ──────────────────────────────────────────────────

export const TARGET_LABEL_KEYS = {
  ALL:     'target.ALL',
  STUDENT: 'target.STUDENT',
  TEACHER: 'target.TEACHER',
  PARENT:  'target.PARENT',
  PARTNER: 'target.PARTNER',
  MENTOR:  'target.MENTOR',
  STAFF:   'target.STAFF',
};

export const ROLE_OPTIONS = Object.entries(TARGET_LABEL_KEYS).map(([value, labelKey]) => ({
  value, labelKey,
}));

// ─── Valid values (shared with Yup schema) ─────────────────────────────────────

export const VALID_TYPES = Object.keys(TYPE_META);
export const VALID_ROLES = Object.keys(TARGET_LABEL_KEYS);
