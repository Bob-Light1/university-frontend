/**
 * @file AttendanceShared.jsx
 * @description Shared UI primitives reused across all attendance views.
 *
 * Exports:
 *  - AttendanceStatusChip     — present / absent / justified chip
 *  - AttendanceRateGauge      — circular progress with colour coding
 *  - AttendanceSummaryBar     — inline summary (present/absent/total)
 *  - JustificationDialog      — modal form to add / view a justification
 *  - AttendanceEmptyState     — empty state placeholder
 *  - AttendanceSelfFilters    — academicYear + semester + period filter bar (self-service)
 *  - LockedBadge              — small lock icon badge for locked records
 */

import {
  Chip, Box, Typography, CircularProgress, Stack, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, Paper, Avatar, alpha, useTheme, LinearProgress,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { Lock, CheckCircle, Cancel, HelpOutline, Info } from '@mui/icons-material';
import { useState } from 'react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map attendance rate to a MUI colour token. */
const rateColor = (rate) => {
  if (rate >= 80) return 'success';
  if (rate >= 60) return 'warning';
  return 'error';
};

// ─────────────────────────────────────────────────────────────────────────────
// AttendanceStatusChip
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Displays present / absent / justified status as a compact chip.
 * @param {{ status: boolean, isJustified?: boolean, isLate?: boolean, size?: 'small'|'medium' }}
 */
export const AttendanceStatusChip = ({ status, isJustified = false, isLate = false, size = 'small' }) => {
  if (status) {
    return (
      <Chip
        label={isLate ? 'Late' : 'Present'}
        color={isLate ? 'warning' : 'success'}
        size={size}
        icon={<CheckCircle />}
        sx={{ fontWeight: 600 }}
      />
    );
  }

  if (isJustified) {
    return (
      <Chip
        label="Justified"
        color="info"
        size={size}
        icon={<HelpOutline />}
        sx={{ fontWeight: 600 }}
      />
    );
  }

  return (
    <Chip
      label="Absent"
      color="error"
      size={size}
      icon={<Cancel />}
      sx={{ fontWeight: 600 }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// LockedBadge
// ─────────────────────────────────────────────────────────────────────────────

/** Small lock icon shown on locked records. */
export const LockedBadge = ({ lockedAt }) => (
  <Tooltip title={lockedAt ? `Locked on ${new Date(lockedAt).toLocaleDateString()}` : 'Locked'}>
    <Lock sx={{ fontSize: 14, color: 'text.disabled', ml: 0.5, verticalAlign: 'middle' }} />
  </Tooltip>
);

// ─────────────────────────────────────────────────────────────────────────────
// AttendanceRateGauge
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Circular progress gauge with percentage and colour coding.
 * @param {{ rate: number, size?: number, label?: string }}
 */
export const AttendanceRateGauge = ({ rate = 0, size = 56, label }) => {
  const theme = useTheme();
  const color = rateColor(rate);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        {/* Background track */}
        <CircularProgress
          variant="determinate"
          value={100}
          size={size}
          thickness={4}
          sx={{ color: alpha(theme.palette[color].main, 0.15), position: 'absolute', top: 0, left: 0 }}
        />
        <CircularProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, rate))}
          size={size}
          thickness={4}
          color={color}
        />
        <Box sx={{
          top: 0, left: 0, bottom: 0, right: 0,
          position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography variant="caption" fontWeight={800} color={`${color}.main`} sx={{ fontSize: size * 0.22 }}>
            {Math.round(rate)}%
          </Typography>
        </Box>
      </Box>
      {label && (
        <Typography variant="caption" color="text.secondary" mt={0.5} textAlign="center">
          {label}
        </Typography>
      )}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AttendanceSummaryBar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Horizontal bar showing present / absent / justified / total counts.
 * @param {{ summary: { total, present, absent, justified, rate } }}
 */
export const AttendanceSummaryBar = ({ summary = {} }) => {
  const { total = 0, present = 0, absent = 0, justified = 0, rate = 0 } = summary;
  const theme = useTheme();

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 0,
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {[
        { label: 'Total',     value: total,     color: theme.palette.grey[700],        bg: theme.palette.grey[100] },
        { label: 'Present',   value: present,   color: theme.palette.success.main,     bg: alpha(theme.palette.success.main, 0.06) },
        { label: 'Absent',    value: absent,     color: theme.palette.error.main,       bg: alpha(theme.palette.error.main, 0.06) },
        { label: 'Justified', value: justified,  color: theme.palette.info.main,        bg: alpha(theme.palette.info.main, 0.06) },
      ].map(({ label, value, color, bg }) => (
        <Box
          key={label}
          sx={{
            flex: '1 1 80px',
            px: 2, py: 1.5,
            textAlign: 'center',
            bgcolor: bg,
            borderRight: `1px solid ${theme.palette.divider}`,
            '&:last-child': { borderRight: 'none' },
          }}
        >
          <Typography variant="h6" fontWeight={800} sx={{ color }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {label}
          </Typography>
        </Box>
      ))}
      <Box sx={{
        flex: '1 1 80px', px: 2, py: 1.5, textAlign: 'center',
        bgcolor: alpha(theme.palette[rateColor(rate)].main, 0.06),
      }}>
        <Typography variant="h6" fontWeight={800} color={`${rateColor(rate)}.main`}>
          {Math.round(rate)}%
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          Rate
        </Typography>
      </Box>
    </Paper>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// JustificationDialog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Modal form for adding / viewing absence justification.
 * @param {{
 *   open: boolean,
 *   record: object|null,
 *   onClose: () => void,
 *   onSubmit: (payload: { justification: string, justificationDocument?: string }) => Promise<void>,
 *   readOnly?: boolean,
 * }}
 */
export const JustificationDialog = ({ open, record, onClose, onSubmit, readOnly = false }) => {
  const [text,    setText]    = useState(record?.justification || '');
  const [docUrl,  setDocUrl]  = useState(record?.justificationDocument || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ justification: text.trim(), justificationDocument: docUrl.trim() || undefined });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Reset form when record changes
  const handleOpen = () => {
    setText(record?.justification || '');
    setDocUrl(record?.justificationDocument || '');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle fontWeight={800}>
        {readOnly ? 'Absence Justification' : 'Add Justification'}
      </DialogTitle>

      <DialogContent dividers>
        {record && (
          <Box mb={2} p={1.5} bgcolor="grey.50" borderRadius={2}>
            <Typography variant="caption" color="text.secondary">Record</Typography>
            <Typography variant="body2" fontWeight={600}>
              {record.attendanceDate ? new Date(record.attendanceDate).toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              }) : '—'}
            </Typography>
          </Box>
        )}

        <TextField
          label="Justification"
          multiline
          rows={4}
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={readOnly || loading}
          inputProps={{ maxLength: 500 }}
          helperText={`${text.length}/500`}
          sx={{ mb: 2 }}
        />

        <TextField
          label="Document URL (optional)"
          fullWidth
          value={docUrl}
          onChange={(e) => setDocUrl(e.target.value)}
          disabled={readOnly || loading}
          placeholder="https://..."
        />

        {record?.isJustified && record?.justifiedBy && (
          <Box mt={2} display="flex" alignItems="center" gap={1}>
            <Info sx={{ fontSize: 16, color: 'info.main' }} />
            <Typography variant="caption" color="text.secondary">
              Justified on {record.justifiedAt ? new Date(record.justifiedAt).toLocaleDateString() : '—'}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        {!readOnly && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!text.trim() || loading}
          >
            {loading ? 'Saving…' : 'Save Justification'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AttendanceEmptyState
// ─────────────────────────────────────────────────────────────────────────────

export const AttendanceEmptyState = ({ message = 'No attendance records found.' }) => {
  const theme = useTheme();
  return (
    <Paper sx={{
      textAlign: 'center', py: 8, px: 4,
      bgcolor: alpha(theme.palette.primary.main, 0.04),
      borderRadius: 3, border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
    }}>
      <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), width: 64, height: 64 }}>
        <CheckCircle sx={{ fontSize: 32, color: 'primary.main' }} />
      </Avatar>
      <Typography variant="h6" fontWeight={700} mb={1}>No Records</Typography>
      <Typography variant="body2" color="text.secondary">{message}</Typography>
    </Paper>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AttendanceSelfFilters — for student-self / teacher-self views
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter bar for self-service pages (academicYear, semester, period).
 * @param {{ filters, onChange, showPeriod?: boolean }}
 */
export const AttendanceSelfFilters = ({ filters, onChange, showPeriod = true }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => {
    const y = currentYear - i;
    return `${y}-${y + 1}`;
  });

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Academic Year</InputLabel>
        <Select
          label="Academic Year"
          value={filters.academicYear || ''}
          onChange={(e) => onChange('academicYear', e.target.value)}
        >
          {years.map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 120 }}>
        <InputLabel>Semester</InputLabel>
        <Select
          label="Semester"
          value={filters.semester || ''}
          onChange={(e) => onChange('semester', e.target.value)}
        >
          <MenuItem value="S1">Semester 1</MenuItem>
          <MenuItem value="S2">Semester 2</MenuItem>
          <MenuItem value="Annual">Annual</MenuItem>
        </Select>
      </FormControl>

      {showPeriod && (
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            label="Period"
            value={filters.period || 'all'}
            onChange={(e) => onChange('period', e.target.value)}
          >
            <MenuItem value="all">All time</MenuItem>
            <MenuItem value="month">This month</MenuItem>
            <MenuItem value="week">This week</MenuItem>
          </Select>
        </FormControl>
      )}
    </Stack>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AttendanceLinearBar — compact horizontal attendance rate bar
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ rate: number, label?: string }}
 */
export const AttendanceLinearBar = ({ rate = 0, label }) => {
  const color = rateColor(rate);
  return (
    <Box>
      {label && (
        <Box display="flex" justifyContent="space-between" mb={0.5}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="caption" fontWeight={700} color={`${color}.main`}>{Math.round(rate)}%</Typography>
        </Box>
      )}
      <LinearProgress
        variant="determinate"
        value={Math.min(100, Math.max(0, rate))}
        color={color}
        sx={{ borderRadius: 4, height: 8 }}
      />
    </Box>
  );
};