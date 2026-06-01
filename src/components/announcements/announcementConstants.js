import { Info, Warning, PriorityHigh, Event } from '@mui/icons-material';

// ─── Type metadata ─────────────────────────────────────────────────────────────

export const TYPE_META = {
  info:    { label: 'Info',    color: 'info',      Icon: Info },
  warning: { label: 'Warning', color: 'warning',   Icon: Warning },
  urgent:  { label: 'Urgent',  color: 'error',     Icon: PriorityHigh },
  event:   { label: 'Event',   color: 'secondary', Icon: Event },
};

export const TYPE_OPTIONS = Object.entries(TYPE_META).map(([value, { label, color, Icon }]) => ({
  value, label, color, Icon,
}));

export const TYPE_FILTERS = [
  { value: '', label: 'All types' },
  ...Object.entries(TYPE_META).map(([value, { label }]) => ({ value, label })),
];

// ─── Status metadata ───────────────────────────────────────────────────────────

export const STATUS_META = {
  draft:     { label: 'Draft',     color: 'default' },
  published: { label: 'Published', color: 'success' },
  archived:  { label: 'Archived',  color: 'warning' },
};

// ─── Role / audience metadata ──────────────────────────────────────────────────

export const TARGET_LABELS = {
  ALL:     'Everyone',
  STUDENT: 'Students',
  TEACHER: 'Teachers',
  PARENT:  'Parents',
  PARTNER: 'Partners',
  MENTOR:  'Mentors',
  STAFF:   'Staff',
};

export const ROLE_OPTIONS = Object.entries(TARGET_LABELS).map(([value, label]) => ({
  value, label,
}));

// ─── Valid values (shared with Yup schema) ─────────────────────────────────────

export const VALID_TYPES = Object.keys(TYPE_META);
export const VALID_ROLES = Object.keys(TARGET_LABELS);
