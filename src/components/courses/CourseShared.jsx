/**
 * @file CourseShared.jsx
 * @description Shared UI atoms for the course module.
 *
 * Exports:
 *  - COURSE_ENUMS        — frontend mirrors of backend enums (course.model.js)
 *  - ApprovalStatusChip  — coloured chip for course approval status
 *  - DifficultyChip      — coloured chip for difficulty level
 *  - CategoryChip        — standard chip for course category
 *  - VisibilityChip      — PUBLIC / INTERNAL / RESTRICTED
 *  - CourseEmptyState    — empty table / list state
 *  - VersionBadge        — "v3" badge
 *  - WorkloadSummary     — lecture/practical/self-study hours bar
 */

import {
  Chip,
  Box,
  Typography,
  Stack,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  MenuBook,
  CheckCircle,
  HourglassTop,
  Cancel,
  Edit,
  Visibility,
  Lock,
  Public,
  School,
} from '@mui/icons-material';

// ─── ENUMS (mirrored from course.model.js) ────────────────────────────────────

export const COURSE_ENUMS = {
  CATEGORY: ['Core', 'Elective', 'Remedial', 'Advanced', 'Professional', 'General'],

  DIFFICULTY: [
    { value: 'BEGINNER',     label: 'Beginner' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'ADVANCED',     label: 'Advanced' },
    { value: 'EXPERT',       label: 'Expert' },
  ],

  VISIBILITY: [
    { value: 'PUBLIC',     label: 'Public' },
    { value: 'INTERNAL',   label: 'Internal' },
    { value: 'RESTRICTED', label: 'Restricted' },
  ],

  APPROVAL_STATUS: [
    { value: 'DRAFT',          label: 'Draft' },
    { value: 'PENDING_REVIEW', label: 'Pending Review' },
    { value: 'APPROVED',       label: 'Approved' },
    { value: 'REJECTED',       label: 'Rejected' },
  ],

  SESSION_TYPE: ['LECTURE', 'TUTORIAL', 'PRACTICAL', 'EXAM', 'WORKSHOP'],

  PERIOD_TYPE: [
    { value: 'week',    label: 'Week' },
    { value: 'session', label: 'Session' },
    { value: 'module',  label: 'Module' },
    { value: 'chapter', label: 'Chapter' },
  ],

  RESOURCE_TYPE: ['PDF', 'VIDEO', 'LINK', 'DOCUMENT', 'SPREADSHEET', 'OTHER'],

  LANGUAGE: [
    { value: 'fr',    label: 'French' },
    { value: 'en',    label: 'English' },
    { value: 'es',    label: 'Spanish' },
    { value: 'ar',    label: 'Arabic' },
    { value: 'pt',    label: 'Portuguese' },
    { value: 'de',    label: 'German' },
    { value: 'zh',    label: 'Chinese' },
    { value: 'other', label: 'Other' },
  ],

  PREREQUISITE_TYPE: [
    { value: 'REQUIRED',    label: 'Required' },
    { value: 'RECOMMENDED', label: 'Recommended' },
  ],
};

// ─── APPROVAL STATUS CHIP ────────────────────────────────────────────────────

const APPROVAL_CONFIG = {
  DRAFT:          { color: 'default', icon: <Edit fontSize="inherit" />,         label: 'Draft' },
  PENDING_REVIEW: { color: 'warning', icon: <HourglassTop fontSize="inherit" />, label: 'Pending' },
  APPROVED:       { color: 'success', icon: <CheckCircle fontSize="inherit" />,  label: 'Approved' },
  REJECTED:       { color: 'error',   icon: <Cancel fontSize="inherit" />,       label: 'Rejected' },
};

export const ApprovalStatusChip = ({ status, size = 'small' }) => {
  const cfg = APPROVAL_CONFIG[status] ?? APPROVAL_CONFIG.DRAFT;
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

// ─── DIFFICULTY CHIP ─────────────────────────────────────────────────────────

const DIFFICULTY_COLOR = {
  BEGINNER:     'success',
  INTERMEDIATE: 'info',
  ADVANCED:     'warning',
  EXPERT:       'error',
};

export const DifficultyChip = ({ level, size = 'small' }) => (
  <Chip
    size={size}
    color={DIFFICULTY_COLOR[level] ?? 'default'}
    label={level ? level.charAt(0) + level.slice(1).toLowerCase() : '—'}
    variant="outlined"
  />
);

// ─── CATEGORY CHIP ────────────────────────────────────────────────────────────

export const CategoryChip = ({ category, size = 'small' }) => (
  <Chip size={size} label={category ?? '—'} variant="outlined" color="primary" />
);

// ─── VISIBILITY CHIP ──────────────────────────────────────────────────────────

const VISIBILITY_CONFIG = {
  PUBLIC:     { color: 'success', icon: <Public fontSize="inherit" />,     label: 'Public' },
  INTERNAL:   { color: 'info',    icon: <School fontSize="inherit" />,     label: 'Internal' },
  RESTRICTED: { color: 'error',   icon: <Lock fontSize="inherit" />,       label: 'Restricted' },
};

export const VisibilityChip = ({ visibility, size = 'small' }) => {
  const cfg = VISIBILITY_CONFIG[visibility] ?? VISIBILITY_CONFIG.INTERNAL;
  return (
    <Chip
      size={size}
      color={cfg.color}
      icon={cfg.icon}
      label={cfg.label}
      variant="outlined"
    />
  );
};

// ─── VERSION BADGE ────────────────────────────────────────────────────────────

export const VersionBadge = ({ version, isLatest = true }) => (
  <Tooltip title={isLatest ? 'Latest version' : 'Older version'}>
    <Chip
      size="small"
      label={`v${version}`}
      color={isLatest ? 'primary' : 'default'}
      variant={isLatest ? 'filled' : 'outlined'}
      sx={{ fontWeight: 700, minWidth: 38 }}
    />
  </Tooltip>
);

// ─── WORKLOAD SUMMARY ────────────────────────────────────────────────────────

/**
 * Visual breakdown of lecture / practical / self-study hours.
 * @param {{ lecture: number, practical: number, selfStudy: number }} workload
 */
export const WorkloadSummary = ({ workload = {} }) => {
  const { lecture = 0, practical = 0, selfStudy = 0 } = workload;
  const total = lecture + practical + selfStudy;

  if (total === 0) {
    return (
      <Typography variant="caption" color="text.disabled">
        No workload defined
      </Typography>
    );
  }

  const bars = [
    { label: 'Lecture',    value: lecture,    color: 'primary.main' },
    { label: 'Practical',  value: practical,  color: 'secondary.main' },
    { label: 'Self-study', value: selfStudy,  color: 'success.main' },
  ];

  return (
    <Box>
      {/* Stacked bar */}
      <Box
        sx={{
          display: 'flex',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
          mb: 0.5,
        }}
      >
        {bars.map(
          (b) =>
            b.value > 0 && (
              <Tooltip key={b.label} title={`${b.label}: ${b.value}h`}>
                <Box
                  sx={{
                    width:   `${(b.value / total) * 100}%`,
                    bgcolor: b.color,
                  }}
                />
              </Tooltip>
            ),
        )}
      </Box>
      {/* Legend */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap">
        {bars.map((b) => (
          <Typography key={b.label} variant="caption" color="text.secondary">
            <Box
              component="span"
              sx={{
                display:       'inline-block',
                width:         8,
                height:        8,
                borderRadius:  '50%',
                bgcolor:       b.color,
                mr:            0.5,
                verticalAlign: 'middle',
              }}
            />
            {b.label}: <strong>{b.value}h</strong>
          </Typography>
        ))}
        <Typography variant="caption" color="text.primary" fontWeight={700}>
          Total: {total}h
        </Typography>
      </Stack>
    </Box>
  );
};

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

export const CourseEmptyState = ({
  message    = 'No courses found',
  subtext    = 'Adjust filters or create a new course.',
  icon: Icon = MenuBook,
}) => (
  <Box
    sx={{
      py: 8,
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