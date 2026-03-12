/**
 * @file DocumentShared.jsx
 * @description Shared UI atoms for the Document Management Module.
 *
 * Exports:
 *  - DOCUMENT_ENUMS        — frontend mirrors of backend enums (document.model.js)
 *  - DocumentStatusChip    — coloured chip for workflow status
 *  - DocumentTypeChip      — chip for document type
 *  - DocumentCategoryChip  — chip for document category
 *  - OfficialBadge         — "Official" indicator
 *  - VersionBadge          — "v3" version indicator
 *  - DocumentEmptyState    — empty state illustration
 *  - FileSizeDisplay       — human-readable file size
 *  - canUserEdit           — role-based edit permission helper
 *  - canUserShare          — role-based share permission helper
 */

import { Chip, Box, Typography, Stack, Tooltip, alpha, useTheme } from '@mui/material';
import {
  Edit,
  CheckCircle,
  Archive,
  Lock,
  Description,
  School,
  Assignment,
  Badge,
  AccountBalance,
  BarChart,
  Folder,
  CloudUpload,
  Class,
  VerifiedUser,
  Article,
} from '@mui/icons-material';

// ─── ENUMS (mirrored from document.model.js) ──────────────────────────────────

export const DOCUMENT_ENUMS = {
  STATUS: [
    { value: 'DRAFT',     label: 'Draft' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'ARCHIVED',  label: 'Archived' },
    { value: 'LOCKED',    label: 'Locked' },
  ],

  TYPE: [
    { value: 'STUDENT_ID_CARD',    label: 'Student ID Card',   restricted: true  },
    { value: 'STUDENT_TRANSCRIPT', label: 'Transcript',        restricted: true  },
    { value: 'STUDENT_BADGE',      label: 'Student Badge',     restricted: true  },
    { value: 'TEACHER_PAYSLIP',    label: 'Teacher Payslip',   restricted: true  },
    { value: 'TEACHER_BADGE',      label: 'Teacher Badge',     restricted: true  },
    { value: 'TEACHER_CONTRACT',   label: 'Teacher Contract',  restricted: true  },
    { value: 'CLASS_LIST',         label: 'Class List',        restricted: true  },
    { value: 'COURSE_MATERIAL',    label: 'Course Material',   restricted: false },
    { value: 'ADMINISTRATIVE',     label: 'Administrative',    restricted: true  },
    { value: 'REPORT',             label: 'Report',            restricted: true  },
    { value: 'PARTNER_BADGE',      label: 'Partner Badge',     restricted: true  },
    { value: 'PARENT_BADGE',       label: 'Parent Badge',      restricted: true  },
    { value: 'CUSTOM',             label: 'Custom',            restricted: true  },
    { value: 'IMPORTED',           label: 'Imported File',     restricted: false },
  ],

  CATEGORY: [
    { value: 'ACADEMIC',        label: 'Academic' },
    { value: 'ADMINISTRATIVE',  label: 'Administrative' },
    { value: 'FINANCIAL',       label: 'Financial' },
    { value: 'IDENTITY',        label: 'Identity' },
    { value: 'COMMUNICATION',   label: 'Communication' },
  ],

  RETENTION: [
    { value: 'PERMANENT',  label: 'Permanent' },
    { value: '10_YEARS',   label: '10 Years' },
    { value: '5_YEARS',    label: '5 Years' },
    { value: '1_YEAR',     label: '1 Year' },
    { value: 'CUSTOM',     label: 'Custom' },
  ],

  SEMESTER: [
    { value: 'S1',     label: 'Semester 1' },
    { value: 'S2',     label: 'Semester 2' },
    { value: 'Annual', label: 'Annual' },
  ],
};

// ─── Type icon mapping ────────────────────────────────────────────────────────

const TYPE_ICON = {
  STUDENT_ID_CARD:    <Badge fontSize="inherit" />,
  STUDENT_TRANSCRIPT: <Assignment fontSize="inherit" />,
  STUDENT_BADGE:      <Badge fontSize="inherit" />,
  TEACHER_PAYSLIP:    <AccountBalance fontSize="inherit" />,
  TEACHER_BADGE:      <Badge fontSize="inherit" />,
  TEACHER_CONTRACT:   <Article fontSize="inherit" />,
  CLASS_LIST:         <Class fontSize="inherit" />,
  COURSE_MATERIAL:    <School fontSize="inherit" />,
  ADMINISTRATIVE:     <AccountBalance fontSize="inherit" />,
  REPORT:             <BarChart fontSize="inherit" />,
  PARTNER_BADGE:      <Badge fontSize="inherit" />,
  PARENT_BADGE:       <Badge fontSize="inherit" />,
  CUSTOM:             <Folder fontSize="inherit" />,
  IMPORTED:           <CloudUpload fontSize="inherit" />,
};

export const getTypeIcon = (type) => TYPE_ICON[type] ?? <Description fontSize="inherit" />;

// ─── STATUS CHIP ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  DRAFT:     { color: 'default',   icon: <Edit fontSize="inherit" />,         label: 'Draft' },
  PUBLISHED: { color: 'success',   icon: <CheckCircle fontSize="inherit" />,  label: 'Published' },
  ARCHIVED:  { color: 'secondary', icon: <Archive fontSize="inherit" />,      label: 'Archived' },
  LOCKED:    { color: 'error',     icon: <Lock fontSize="inherit" />,         label: 'Locked' },
};

export const DocumentStatusChip = ({ status, size = 'small' }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
  return (
    <Chip
      size={size}
      color={cfg.color}
      icon={cfg.icon}
      label={cfg.label}
      variant="filled"
    />
  );
};

// ─── TYPE CHIP ────────────────────────────────────────────────────────────────

const TYPE_COLOR = {
  STUDENT_ID_CARD:    'primary',
  STUDENT_TRANSCRIPT: 'primary',
  STUDENT_BADGE:      'primary',
  TEACHER_PAYSLIP:    'secondary',
  TEACHER_BADGE:      'secondary',
  TEACHER_CONTRACT:   'secondary',
  CLASS_LIST:         'info',
  COURSE_MATERIAL:    'info',
  ADMINISTRATIVE:     'warning',
  REPORT:             'warning',
  PARTNER_BADGE:      'default',
  PARENT_BADGE:       'default',
  CUSTOM:             'default',
  IMPORTED:           'default',
};

export const DocumentTypeChip = ({ type, size = 'small' }) => {
  const entry = DOCUMENT_ENUMS.TYPE.find((t) => t.value === type);
  const label = entry?.label ?? type ?? '—';
  const color = TYPE_COLOR[type] ?? 'default';

  return (
    <Chip
      size={size}
      color={color}
      icon={TYPE_ICON[type]}
      label={label}
      variant="outlined"
    />
  );
};

// ─── CATEGORY CHIP ────────────────────────────────────────────────────────────

const CATEGORY_COLOR = {
  ACADEMIC:       'primary',
  ADMINISTRATIVE: 'warning',
  FINANCIAL:      'success',
  IDENTITY:       'info',
  COMMUNICATION:  'secondary',
};

export const DocumentCategoryChip = ({ category, size = 'small' }) => {
  const entry = DOCUMENT_ENUMS.CATEGORY.find((c) => c.value === category);
  const label = entry?.label ?? category ?? '—';
  return (
    <Chip
      size={size}
      color={CATEGORY_COLOR[category] ?? 'default'}
      label={label}
      variant="outlined"
    />
  );
};

// ─── OFFICIAL BADGE ───────────────────────────────────────────────────────────

export const OfficialBadge = ({ size = 'small' }) => (
  <Tooltip title="Official document — auto-locks on first external share">
    <Chip
      size={size}
      color="warning"
      icon={<VerifiedUser fontSize="inherit" />}
      label="Official"
      variant="filled"
      sx={{ fontWeight: 700 }}
    />
  </Tooltip>
);

// ─── VERSION BADGE ────────────────────────────────────────────────────────────

export const DocumentVersionBadge = ({ version }) => (
  <Chip
    size="small"
    label={`v${version}`}
    color="primary"
    variant="outlined"
    sx={{ fontWeight: 700, minWidth: 36 }}
  />
);

// ─── FILE SIZE DISPLAY ────────────────────────────────────────────────────────

/**
 * Renders a human-readable file size.
 * @param {{ bytes: number }} props
 */
export const FileSizeDisplay = ({ bytes }) => {
  if (!bytes && bytes !== 0) return <Typography variant="caption" color="text.disabled">—</Typography>;

  let value, unit;
  if (bytes < 1024) {
    value = bytes;
    unit  = 'B';
  } else if (bytes < 1024 * 1024) {
    value = (bytes / 1024).toFixed(1);
    unit  = 'KB';
  } else {
    value = (bytes / (1024 * 1024)).toFixed(1);
    unit  = 'MB';
  }

  return (
    <Typography variant="caption" color="text.secondary">
      {value} {unit}
    </Typography>
  );
};

// ─── AUDIT ACTION CHIP ────────────────────────────────────────────────────────

const AUDIT_COLOR = {
  CREATE:   'success',
  UPDATE:   'info',
  DELETE:   'error',
  PUBLISH:  'success',
  ARCHIVE:  'secondary',
  RESTORE:  'primary',
  LOCK:     'error',
  UNLOCK:   'warning',
  SHARE:    'info',
  DOWNLOAD: 'default',
  PRINT:    'default',
  VIEW:     'default',
};

export const AuditActionChip = ({ action, size = 'small' }) => (
  <Chip
    size={size}
    color={AUDIT_COLOR[action] ?? 'default'}
    label={action ?? '—'}
    variant="outlined"
    sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}
  />
);

// ─── DOCUMENT EMPTY STATE ─────────────────────────────────────────────────────

export const DocumentEmptyState = ({
  message    = 'No documents found',
  subtext    = 'Adjust your filters or create a new document.',
  icon: Icon = Description,
}) => (
  <Box
    sx={{
      py:             8,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      color:          'text.disabled',
      gap:            1,
    }}
  >
    <Icon sx={{ fontSize: 56, opacity: 0.35 }} />
    <Typography variant="subtitle1" fontWeight={600}>
      {message}
    </Typography>
    <Typography variant="body2">{subtext}</Typography>
  </Box>
);

// ─── ACCESS HELPERS ───────────────────────────────────────────────────────────

/** Roles that have full document management access */
const MANAGER_ROLES = ['ADMIN', 'DIRECTOR', 'CAMPUS_MANAGER'];

/**
 * Returns true if the user role allows creating/editing documents.
 * TEACHER can only manage COURSE_MATERIAL type.
 * @param {string} role
 * @param {string} [type]
 */
export const canUserEdit = (role, type) => {
  if (MANAGER_ROLES.includes(role)) return true;
  if (role === 'TEACHER' && type === 'COURSE_MATERIAL') return true;
  return false;
};

/**
 * Returns true if the user role allows creating share links.
 * @param {string} role
 */
export const canUserShare = (role) => MANAGER_ROLES.includes(role);

/**
 * Returns true if role can perform workflow transitions (publish, archive, lock).
 * @param {string} role
 */
export const canUserWorkflow = (role) => MANAGER_ROLES.includes(role);

/**
 * Returns the list of document types accessible by a given role.
 * @param {string} role
 */
export const getAccessibleTypes = (role) => {
  if (MANAGER_ROLES.includes(role)) return DOCUMENT_ENUMS.TYPE;
  if (role === 'TEACHER') return DOCUMENT_ENUMS.TYPE.filter((t) => !t.restricted);
  // Students / parents: read-only access — filter handled server-side
  return DOCUMENT_ENUMS.TYPE;
};

// ─── MIME TYPE ICON ───────────────────────────────────────────────────────────

export const getMimeLabel = (mimeType) => {
  const map = {
    'application/pdf':  'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/msword': 'DOC',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'application/vnd.ms-excel': 'XLS',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
    'image/jpeg': 'JPEG',
    'image/png':  'PNG',
    'image/webp': 'WEBP',
    'text/plain': 'TXT',
    'text/csv':   'CSV',
    'text/markdown': 'MD',
  };
  return map[mimeType] ?? 'FILE';
};