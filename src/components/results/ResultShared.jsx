/**
 * @file ResultShared.jsx
 * @description Shared UI primitives reused across all result pages.
 *
 *  Exports:
 *  - ResultStatusChip       — colour-coded status badge
 *  - EvalTypeChip           — evaluation type label
 *  - ScoreDisplay           — normalised score with colour coding
 *  - GradeBandBadge         — grade band snapshot display
 *  - ResultEmptyState       — empty state illustration
 *  - RESULT_STATUS_META     — label + colour per status
 *  - SCORE_COLOR            — score → MUI colour helper
 *  - formatScore            — "14.50 / 20" formatter
 */

import {
  Chip, Box, Typography, Stack, Avatar, alpha, useTheme,
} from '@mui/material';
import {
  Edit as DraftIcon,
  HourglassTop as SubmittedIcon,
  CheckCircle as PublishedIcon,
  Archive as ArchivedIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';

// ─── Status meta (label + MUI colour) ────────────────────────────────────────

export const RESULT_STATUS_META = {
  DRAFT:     { label: 'Draft',     color: 'default',  icon: <DraftIcon fontSize="small" /> },
  SUBMITTED: { label: 'Submitted', color: 'warning',  icon: <SubmittedIcon fontSize="small" /> },
  PUBLISHED: { label: 'Published', color: 'success',  icon: <PublishedIcon fontSize="small" /> },
  ARCHIVED:  { label: 'Archived',  color: 'secondary',icon: <ArchivedIcon fontSize="small" /> },
};

export const EVAL_TYPE_META = {
  CC:        { label: 'Continuous', color: '#3b82f6' },
  EXAM:      { label: 'Exam',       color: '#8b5cf6' },
  RETAKE:    { label: 'Retake',     color: '#f97316' },
  PROJECT:   { label: 'Project',    color: '#14b8a6' },
  PRACTICAL: { label: 'Practical',  color: '#ec4899' },
};

// ─── Score colour helper (mirrors result model getScoreColor) ─────────────────

export const SCORE_COLOR = (score) => {
  if (score == null) return 'text.disabled';
  if (score < 7)  return 'error.main';
  if (score < 10) return 'warning.main';
  if (score < 14) return 'info.main';
  return 'success.main';
};

export const SCORE_BG_COLOR = (score) => {
  if (score == null) return 'grey.100';
  if (score < 7)  return 'error.50';
  if (score < 10) return 'warning.50';
  if (score < 14) return 'info.50';
  return 'success.50';
};

// ─── Format score string ───────────────────────────────────────────────────────

export const formatScore = (normalizedScore, rawScore, maxScore) => {
  if (normalizedScore != null) return `${normalizedScore.toFixed(2)} / 20`;
  if (rawScore != null && maxScore != null)
    return `${rawScore} / ${maxScore}`;
  return '—';
};

// ─── ResultStatusChip ──────────────────────────────────────────────────────────

export const ResultStatusChip = ({ status, size = 'small' }) => {
  const meta = RESULT_STATUS_META[status] ?? { label: status, color: 'default', icon: null };
  return (
    <Chip
      label={meta.label}
      color={meta.color}
      size={size}
      icon={meta.icon}
      variant="outlined"
    />
  );
};

// ─── EvalTypeChip ─────────────────────────────────────────────────────────────

export const EvalTypeChip = ({ type, size = 'small' }) => {
  const theme = useTheme();
  const meta  = EVAL_TYPE_META[type] ?? { label: type, color: theme.palette.grey[500] };
  return (
    <Chip
      label={meta.label}
      size={size}
      sx={{
        backgroundColor: alpha(meta.color, 0.12),
        color:           meta.color,
        fontWeight:      600,
        border:          `1px solid ${alpha(meta.color, 0.3)}`,
      }}
    />
  );
};

// ─── ScoreDisplay ─────────────────────────────────────────────────────────────

/**
 * Displays normalised score with colour-coded background.
 * @param {{ score: number|null, rawScore?: number, maxScore?: number, size?: 'sm'|'md'|'lg' }}
 */
export const ScoreDisplay = ({ score, rawScore, maxScore, size = 'md' }) => {
  const sizes = { sm: { px: 1, py: 0.25, fontSize: '0.75rem' },
                  md: { px: 1.5, py: 0.5, fontSize: '0.875rem' },
                  lg: { px: 2,   py: 1,   fontSize: '1.125rem' } };

  const s = sizes[size] ?? sizes.md;
  const display = formatScore(score, rawScore, maxScore);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: s.px,
        py: s.py,
        borderRadius: 1.5,
        bgcolor: score != null ? SCORE_BG_COLOR(score) : 'grey.100',
      }}
    >
      <Typography
        variant="body2"
        sx={{
          fontSize: s.fontSize,
          fontWeight: 700,
          color: SCORE_COLOR(score),
          fontFamily: 'monospace',
        }}
      >
        {display}
      </Typography>
    </Box>
  );
};

// ─── GradeBandBadge ───────────────────────────────────────────────────────────

export const GradeBandBadge = ({ gradeBand }) => {
  if (!gradeBand?.label) return null;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Typography variant="caption" color="text.secondary">
        {gradeBand.label}
      </Typography>
      {gradeBand.letterGrade && (
        <Chip label={gradeBand.letterGrade} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
      )}
      {gradeBand.gpa != null && (
        <Typography variant="caption" color="text.secondary">GPA {gradeBand.gpa}</Typography>
      )}
    </Stack>
  );
};

// ─── ResultEmptyState ─────────────────────────────────────────────────────────

export const ResultEmptyState = ({ message = 'No results found.', subtext }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      gap: 2,
    }}
  >
    <Avatar sx={{ width: 72, height: 72, bgcolor: 'primary.50' }}>
      <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
    </Avatar>
    <Typography variant="h6" color="text.secondary">
      {message}
    </Typography>
    {subtext && (
      <Typography variant="body2" color="text.disabled">
        {subtext}
      </Typography>
    )}
  </Box>
);