/**
 * @file RollCallSheet.jsx
 * @description Interactive roll-call sheet used by teachers to record student attendance.
 *
 * Data contract with the parent (TeacherRollCallTab in AttendanceTeacher):
 *   session  — a normalised object with at minimum:
 *     { _id, startTime, endTime, academicYear, semester,
 *       class: { _id, className },
 *       subject: { _id, name } }
 *
 *   records  — array of StudentAttendance documents (fetched by parent)
 *   onInit   — async (scheduleId, payload) → void  (parent re-fetches after)
 *   onToggle — async (attendanceId, status) → void
 *   onJustify— async (attendanceId, payload) → void
 *   onSubmit — async (scheduleId, dateISO, classId) → void
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Avatar, Chip, Button,
  Switch, Divider, Alert, Tooltip,
  IconButton, TextField, InputAdornment, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  alpha, useTheme,
} from '@mui/material';
import {
  CheckCircle, Lock, Search, Send,
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
  session,
  records,
  loading,
  summary,
  onInit,
  onToggle,
  onJustify,
  onSubmit,
  readOnly = false,
}) => {
  const theme = useTheme();

  const [search,        setSearch]        = useState('');
  const [justifyTarget, setJustifyTarget] = useState(null);
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [busy,          setBusy]          = useState(false);
  const [initialised,   setInitialised]   = useState(records.length > 0);

  // Update initialised flag when records arrive from parent
  useEffect(() => {
    setInitialised(records.length > 0);
  }, [records.length]);

  const isSessionLocked = records.length > 0 && records.every((r) => r.isLocked);

  // ── Derive stable identifiers from the normalised session object ─────────
  const scheduleId = session?._id;

  // ClassId: support both { _id } objects and plain string IDs
  const classId = session?.class?._id || session?.class || null;

  // ISO date string for the attendance date (date portion of startTime only)
  const attendanceDateISO = session?.startTime
    ? new Date(session.startTime).toISOString()
    : null;

  // HH:mm strings for the init payload
  const startHHMM = session?.startTime
    ? new Date(session.startTime).toTimeString().slice(0, 5)
    : undefined;
  const endHHMM = session?.endTime
    ? new Date(session.endTime).toTimeString().slice(0, 5)
    : undefined;

  // subjectId for the init payload
  const subjectId = session?.subject?._id || session?.subject || null;

  // ── Initialise sheet ───────────────────────────────────────────────────────

  const handleInit = useCallback(async () => {
    if (!scheduleId || !classId) {
      console.error('[RollCallSheet] Cannot init: missing scheduleId or classId', {
        scheduleId, classId, session,
      });
      return;
    }

    setBusy(true);
    try {
      await onInit(scheduleId, {
        classId,
        subjectId:        subjectId || undefined,
        attendanceDate:   attendanceDateISO,
        academicYear:     session?.academicYear,
        semester:         session?.semester,
        sessionStartTime: startHHMM,
        sessionEndTime:   endHHMM,
      });
    } finally {
      setBusy(false);
    }
  }, [scheduleId, classId, subjectId, attendanceDateISO, session, startHHMM, endHHMM, onInit]);

  // ── Toggle individual student ──────────────────────────────────────────────

  const handleToggle = useCallback(async (record) => {
    if (record.isLocked || readOnly) return;
    await onToggle(record._id, !record.status);
  }, [onToggle, readOnly]);

  // ── Submit (lock) ──────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!scheduleId) return;
    setBusy(true);
    try {
      await onSubmit(scheduleId, attendanceDateISO, classId);
      setSubmitConfirm(false);
    } finally {
      setBusy(false);
    }
  }, [scheduleId, attendanceDateISO, classId, onSubmit]);

  // ── Filter students ────────────────────────────────────────────────────────

  const filtered = records.filter((r) => {
    const name = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // ── Guard: session missing required fields ─────────────────────────────────

  if (!session) {
    return (
      <Alert severity="warning">No session data available.</Alert>
    );
  }

  // ── Not yet initialised ────────────────────────────────────────────────────

  if (!initialised && !loading) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <PersonOutline sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" fontWeight={700} mb={1}>
          Roll-call not started
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Click below to initialise the attendance sheet for this session.
          All enrolled students will be pre-filled as <strong>absent</strong>.
        </Typography>
        {(!classId) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            No class linked to this session. Cannot initialise roll-call.
          </Alert>
        )}
        <Button
          variant="contained"
          size="large"
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
          onClick={handleInit}
          disabled={busy || readOnly || !classId}
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

  // ── Main render ────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Summary bar */}
      <Box mb={2}>
        <AttendanceSummaryBar summary={summary} />
      </Box>

      {/* Locked banner */}
      {isSessionLocked && (
        <Alert severity="info" icon={<Lock />} sx={{ mb: 2, borderRadius: 2 }}>
          This session has been locked. Justifications can still be added for absent students.
        </Alert>
      )}

      {/* Search + submit */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1} mb={2}
        alignItems={{ sm: 'center' }}
      >
        <TextField
          size="small"
          placeholder="Search student…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1 }}
        />
        {!isSessionLocked && !readOnly && (
          <Button
            variant="contained"
            color="success"
            startIcon={<Send />}
            onClick={() => setSubmitConfirm(true)}
            disabled={busy || records.length === 0}
          >
            Submit &amp; Lock
          </Button>
        )}
      </Stack>

      {/* Student list */}
      {filtered.length === 0 ? (
        <AttendanceEmptyState
          message={
            records.length === 0
              ? 'No students found. Try initialising the sheet again.'
              : 'No students match your search.'
          }
        />
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

      {/* Submit confirmation */}
      <Dialog
        open={submitConfirm}
        onClose={() => setSubmitConfirm(false)}
        disableEnforceFocus
        closeAfterTransition={false}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle fontWeight={800}>Lock attendance sheet?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently lock the roll-call for this session.
            Present/absent statuses cannot be changed afterwards.
            Justifications can still be added for absent students.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSubmitConfirm(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <Lock />}
          >
            Confirm &amp; Lock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── Single student row ────────────────────────────────────────────────────────

const StudentAttendanceRow = ({ record, onToggle, onJustify, readOnly, theme }) => {
  const student  = record.student || {};
  const initials = `${student.firstName?.[0] ?? '?'}${student.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <Paper
      variant="outlined"
      sx={{
        display:     'flex',
        alignItems:  'center',
        gap:         2,
        px:          2,
        py:          1.5,
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
        sx={{
          width: 36, height: 36,
          bgcolor: 'primary.main',
          fontSize: 14, fontWeight: 700,
          flexShrink: 0,
        }}
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
          <Typography variant="caption" color="text.secondary">
            {student.matricule}
          </Typography>
        )}
      </Box>

      {/* Status chip */}
      <AttendanceStatusChip
        status={record.status}
        isJustified={record.isJustified}
        isLate={record.isLate}
      />

      {/* Toggle switch — only on unlocked records */}
      {!record.isLocked && !readOnly && (
        <Switch
          checked={record.status === true}
          onChange={() => onToggle(record)}
          color="success"
          size="small"
        />
      )}

      {/* Justify button — for absent records (locked or not) */}
      {!record.status && (
        <Tooltip title={record.isJustified ? 'View justification' : 'Add justification'}>
          <IconButton size="small" onClick={onJustify} color="info">
            {record.isJustified ? (
              <HelpOutline fontSize="small" />
            ) : (
              <Edit fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}
    </Paper>
  );
};

export default RollCallSheet;