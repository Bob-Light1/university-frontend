/**
 * @file RollCallSheet.jsx
 * @description Interactive roll-call sheet for a teacher to record student attendance.
 *
 * Used by:
 *  - AttendanceTeacher.jsx → when a teacher opens a session's roll-call
 *
 * Flow:
 *  1. Teacher selects a session from their schedule
 *  2. RollCallSheet initialises the attendance sheet (POST …/init)
 *  3. Teacher toggles each student's status
 *  4. Teacher submits (locks) the sheet (PATCH …/submit)
 *
 * API calls delegated to parent via props (onInit, onToggle, onSubmit)
 * so this component stays purely presentational + stateful only for local UX.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Avatar, Chip, Button,
  Switch, FormControlLabel, Divider, Alert, Tooltip,
  IconButton, TextField, InputAdornment, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  alpha, useTheme,
} from '@mui/material';
import {
  CheckCircle, Cancel, Lock, Search, Send,
  PersonOutline, HelpOutline, Edit,
} from '@mui/icons-material';

import {
  AttendanceSummaryBar,
  AttendanceStatusChip,
  JustificationDialog,
  LockedBadge,
  AttendanceEmptyState,
} from './AttendanceShared';

// ─────────────────────────────────────────────────────────────────────────────

const RollCallSheet = ({
  session,           // Schedule object (contains _id, startTime, subject, class…)
  records,           // Array of attendance records from useAttendance
  loading,
  summary,
  onInit,            // (scheduleId, payload) => Promise — initialise sheet
  onToggle,          // (attendanceId, status) => Promise
  onJustify,         // (attendanceId, payload) => Promise
  onSubmit,          // (scheduleId, date, classId) => Promise — lock sheet
  readOnly = false,  // Locks the whole sheet (e.g. campus manager viewing a past session)
}) => {
  const theme = useTheme();

  const [search,         setSearch]         = useState('');
  const [justifyTarget,  setJustifyTarget]  = useState(null);
  const [submitConfirm,  setSubmitConfirm]  = useState(false);
  const [busy,           setBusy]           = useState(false);
  const [initialised,    setInitialised]    = useState(records.length > 0);

  // Auto-detect if sheet is already initialised when records arrive
  useEffect(() => {
    if (records.length > 0) setInitialised(true);
  }, [records]);

  const isSessionLocked = records.length > 0 && records.every((r) => r.isLocked);

  // ─── Initialise sheet ─────────────────────────────────────────────────────

  const handleInit = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    try {
      await onInit(session._id, {
        classId:          session.class?._id || session.class,
        subjectId:        session.subject?._id || session.subject,
        attendanceDate:   session.startTime,
        academicYear:     session.academicYear,
        semester:         session.semester,
        sessionStartTime: session.startTime
          ? new Date(session.startTime).toTimeString().slice(0, 5)
          : undefined,
        sessionEndTime: session.endTime
          ? new Date(session.endTime).toTimeString().slice(0, 5)
          : undefined,
      });
      setInitialised(true);
    } finally {
      setBusy(false);
    }
  }, [session, onInit]);

  // ─── Toggle student ───────────────────────────────────────────────────────

  const handleToggle = useCallback(async (record) => {
    if (record.isLocked || readOnly) return;
    await onToggle(record._id, !record.status);
  }, [onToggle, readOnly]);

  // ─── Submit (lock) ────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!session) return;
    setBusy(true);
    try {
      await onSubmit(
        session._id,
        session.startTime,
        session.class?._id || session.class,
      );
      setSubmitConfirm(false);
    } finally {
      setBusy(false);
    }
  }, [session, onSubmit]);

  // ─── Filter students ──────────────────────────────────────────────────────

  const filtered = records.filter((r) => {
    const name = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // ─── Not yet initialised ──────────────────────────────────────────────────

  if (!initialised && !loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <PersonOutline sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" fontWeight={700} mb={1}>Roll-call not started</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Click below to initialise the attendance sheet for this session.
          All enrolled students will be pre-filled as absent.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
          onClick={handleInit}
          disabled={busy || readOnly}
        >
          Start Roll-call
        </Button>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Summary bar */}
      <Box mb={2}>
        <AttendanceSummaryBar summary={summary} />
      </Box>

      {/* Session locked banner */}
      {isSessionLocked && (
        <Alert severity="info" icon={<Lock />} sx={{ mb: 2, borderRadius: 2 }}>
          This session has been locked. No further modifications are allowed.
          Justifications can still be added for absent students.
        </Alert>
      )}

      {/* Search + submit row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={2} alignItems="center">
        <TextField
          size="small"
          placeholder="Search student…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          }}
          sx={{ flex: 1 }}
        />
        {!isSessionLocked && !readOnly && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Send />}
            onClick={() => setSubmitConfirm(true)}
            disabled={busy}
          >
            Submit & Lock
          </Button>
        )}
      </Stack>

      {/* Student list */}
      {filtered.length === 0 ? (
        <AttendanceEmptyState message="No students match your search." />
      ) : (
        <Stack spacing={1}>
          {filtered.map((record) => (
            <StudentAttendanceRow
              key={record._id}
              record={record}
              onToggle={handleToggle}
              onJustify={() => setJustifyTarget(record)}
              readOnly={readOnly}
              theme={theme}
            />
          ))}
        </Stack>
      )}

      {/* Justification dialog */}
      <JustificationDialog
        open={Boolean(justifyTarget)}
        record={justifyTarget}
        onClose={() => setJustifyTarget(null)}
        onSubmit={(payload) => onJustify(justifyTarget._id, payload)}
        readOnly={justifyTarget?.isLocked && justifyTarget?.isJustified}
      />

      {/* Submit confirmation dialog */}
      <Dialog
        open={submitConfirm}
        onClose={() => setSubmitConfirm(false)}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={800}>Lock attendance sheet?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently lock the roll-call for this session.
            Present/absent statuses can no longer be changed.
            Justifications can still be added for absent students.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSubmitConfirm(false)} disabled={busy}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <Lock />}
          >
            Confirm & Lock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── Single student row ────────────────────────────────────────────────────────

const StudentAttendanceRow = ({ record, onToggle, onJustify, readOnly, theme }) => {
  const student = record.student || {};
  const initials = `${student.firstName?.[0] ?? '?'}${student.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1.5,
        borderRadius: 2,
        bgcolor: record.status
          ? alpha(theme.palette.success.main, 0.04)
          : record.isJustified
            ? alpha(theme.palette.info.main, 0.04)
            : alpha(theme.palette.error.main, 0.04),
        borderColor: record.status
          ? theme.palette.success.light
          : record.isJustified
            ? theme.palette.info.light
            : theme.palette.error.light,
        transition: 'background-color 0.2s',
      }}
    >
      {/* Avatar */}
      <Avatar
        src={student.profileImage}
        sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 14, fontWeight: 700, flexShrink: 0 }}
      >
        {initials}
      </Avatar>

      {/* Name + matricule */}
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {student.lastName} {student.firstName}
          {record.isLocked && <LockedBadge lockedAt={record.lockedAt} />}
        </Typography>
        {student.matricule && (
          <Typography variant="caption" color="text.secondary">{student.matricule}</Typography>
        )}
      </Box>

      {/* Status chip */}
      <AttendanceStatusChip status={record.status} isJustified={record.isJustified} isLate={record.isLate} />

      {/* Toggle switch */}
      {!record.isLocked && !readOnly && (
        <Switch
          checked={record.status === true}
          onChange={() => onToggle(record)}
          color="success"
          size="small"
        />
      )}

      {/* Justify button — only for absent records (locked or not) */}
      {!record.status && (
        <Tooltip title={record.isJustified ? 'View justification' : 'Add justification'}>
          <IconButton size="small" onClick={onJustify} color="info">
            {record.isJustified ? <HelpOutline fontSize="small" /> : <Edit fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
};

export default RollCallSheet;