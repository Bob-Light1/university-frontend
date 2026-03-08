/**
 * @file AttendanceTeacher.jsx
 * @description Attendance page for teachers.
 *
 * Tabs:
 *  1. Roll-call  — pick a session and mark student attendance
 *  2. My Records — personal attendance history (self-service)
 *
 * Role: TEACHER
 *
 * Route: registered in teacher routes, e.g. /teacher/attendance
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Stack, Paper, Avatar, Chip,
  Alert, CircularProgress, Grid, Snackbar, Button,
  FormControl, InputLabel, Select, MenuItem,
  alpha, useTheme, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  HowToReg, History, CalendarMonth, CheckCircle,
  Cancel, HelpOutline,
} from '@mui/icons-material';

import KPICards          from '../../../components/shared/KpiCard';
import useAttendance     from '../../../hooks/useAttendance';
import useFormSnackbar   from '../../../hooks/useFormSnackBar';
import {
  AttendanceStatusChip,
  AttendanceSummaryBar,
  AttendanceEmptyState,
  AttendanceSelfFilters,
  AttendanceRateGauge,
  AttendanceLinearBar,
} from '../../../components/attendance/AttendanceShared';
import RollCallSheet from '../../../components/attendance/RollCallSheet';
import { getMyTeacherAttendanceStats } from '../../../services/attendance.service';
import { useLocation } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────

const AttendanceTeacher = () => {
  const [tab, setTab] = useState(0);
  const location = useLocation();
  const [selectedSession, setSelectedSession] = useState(location.state?.session ?? null);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800}>Attendance</Typography>
        <Typography variant="body2" color="text.secondary">
          Manage roll-call for your sessions and view your own attendance record
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
        }}
      >
        <Tab value={0} label="Roll-call" icon={<HowToReg />} iconPosition="start" />
        <Tab value={1} label="My Attendance" icon={<History />} iconPosition="start" />
      </Tabs>

      <TeacherRollCallTab
        initialSession={selectedSession}
        onSessionClear={() => setSelectedSession(null)}
      />
      {tab === 1 && <TeacherSelfTab />}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER ROLL-CALL TAB
// Shows today's/upcoming sessions; teacher selects one to open roll-call
// ─────────────────────────────────────────────────────────────────────────────

const TeacherRollCallTab = ({ initialSession = null }) => {
  const theme = useTheme();
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  // We load the teacher's schedule (from useSchedule) via a local fetch
  // to list sessions available for roll-call — then open the roll-call sheet
  // for the selected session.
  const [selectedSession, setSelectedSession] = useState(initialSession);

  const ctxParams = useMemo(() => ({
    scheduleId: selectedSession?._id,
    date:       selectedSession?.startTime
      ? new Date(selectedSession.startTime).toISOString().slice(0, 10)
      : undefined,
    classId: selectedSession?.class?._id || selectedSession?.class,
  }), [selectedSession]);

  const {
    records, summary, loading, error,
    initSession, toggleStudent, justifyStudent, submitSession, fetch,
  } = useAttendance('teacher-rollcall', ctxParams);

  const handleInit = useCallback(async (scheduleId, payload) => {
    try {
      await initSession(scheduleId, payload);
      showSnackbar('Attendance sheet initialised.', 'success');
    } catch {
      showSnackbar('Failed to initialise attendance sheet.', 'error');
    }
  }, [initSession, showSnackbar]);

  const handleToggle = useCallback(async (attendanceId, status) => {
    try {
      await toggleStudent(attendanceId, status);
    } catch {
      showSnackbar('Failed to update attendance.', 'error');
    }
  }, [toggleStudent, showSnackbar]);

  const handleJustify = useCallback(async (attendanceId, payload) => {
    try {
      await justifyStudent(attendanceId, payload);
      showSnackbar('Justification saved.', 'success');
    } catch {
      showSnackbar('Failed to save justification.', 'error');
    }
  }, [justifyStudent, showSnackbar]);

  const handleSubmit = useCallback(async (scheduleId, date, classId) => {
    try {
      await submitSession(scheduleId, date, classId);
      showSnackbar('Attendance sheet locked successfully.', 'success');
    } catch {
      showSnackbar('Failed to lock attendance sheet.', 'error');
    }
  }, [submitSession, showSnackbar]);

  return (
    <Box>
      {/* Session picker — in a real app this uses the teacher's schedule list */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Select a session from your schedule to open the roll-call. Sessions are listed in
        the <strong>Schedule</strong> section. Clicking <em>"Open Roll-call"</em> from a
        session card will navigate here with the session pre-selected.
      </Alert>

      {selectedSession ? (
        <Box>
          {/* Session header */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main' }}>
                <CalendarMonth />
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" fontWeight={700}>
                  {selectedSession.subject?.name || selectedSession.subject}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedSession.class?.className || selectedSession.class} ·{' '}
                  {selectedSession.startTime
                    ? new Date(selectedSession.startTime).toLocaleString('en-GB', {
                        weekday: 'short', day: 'numeric', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : ''}
                </Typography>
              </Box>
              <Button size="small" onClick={() => setSelectedSession(null)}>
                Change session
              </Button>
            </Stack>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <RollCallSheet
            session={selectedSession}
            records={records}
            loading={loading}
            summary={summary}
            onInit={handleInit}
            onToggle={handleToggle}
            onJustify={handleJustify}
            onSubmit={handleSubmit}
          />
        </Box>
      ) : (
        <Paper
          sx={{
            p: 4, textAlign: 'center', borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          <HowToReg sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} mb={1}>
            No session selected
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Go to your <strong>Schedule</strong>, open a session and click{' '}
            <strong>"Start Roll-call"</strong> to begin.
          </Typography>
        </Paper>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER SELF-SERVICE TAB
// Teacher views their own attendance history and stats
// ─────────────────────────────────────────────────────────────────────────────

const TeacherSelfTab = () => {
  const theme = useTheme();

  const { records, loading, error, filters, handleFilterChange } =
    useAttendance('teacher-self');

  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    if (!filters.academicYear || !filters.semester) return;
    setStatsLoading(true);
    try {
      const res = await getMyTeacherAttendanceStats({
        academicYear: filters.academicYear,
        semester:     filters.semester,
        period:       filters.period || 'all',
      });
      setStatsData(res.data?.data ?? null);
    } finally {
      setStatsLoading(false);
    }
  }, [filters.academicYear, filters.semester, filters.period]);

  const kpis = statsData ? [
    { key: 'total',   label: 'Total Sessions', value: statsData.totalSessions,  icon: <CalendarMonth />, color: theme.palette.grey[700] },
    { key: 'present', label: 'Present',        value: statsData.presentCount,   icon: <CheckCircle />,   color: theme.palette.success.main },
    { key: 'absent',  label: 'Absent',         value: statsData.absentCount,    icon: <Cancel />,        color: theme.palette.error.main },
    { key: 'hours',   label: 'Total Hours',    value: `${(statsData.totalHours ?? 0).toFixed(1)}h`, icon: <History />, color: theme.palette.secondary.main },
  ] : [];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="flex-end" flexWrap="wrap">
        <AttendanceSelfFilters filters={filters} onChange={handleFilterChange} />
        <Button variant="outlined" onClick={loadStats} disabled={!filters.academicYear || !filters.semester}>
          Load Stats
        </Button>
      </Stack>

      {/* Stats KPIs */}
      {statsLoading ? (
        <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
      ) : statsData ? (
        <Box mb={3}>
          <KPICards metrics={kpis} />
          <Box mt={2}>
            <AttendanceLinearBar
              rate={statsData.attendanceRate ?? 0}
              label={`Attendance rate — ${(statsData.attendanceRate ?? 0).toFixed(1)}%`}
            />
          </Box>
        </Box>
      ) : null}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Records table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : records.length === 0 ? (
        <AttendanceEmptyState
          message={
            !filters.academicYear
              ? 'Select an academic year and semester to load your attendance records.'
              : 'No attendance records found for this period.'
          }
        />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.06) }}>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {record.attendanceDate
                        ? new Date(record.attendanceDate).toLocaleDateString('en-GB', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{record.class?.className || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {record.sessionStartTime} – {record.sessionEndTime}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {record.sessionDuration != null
                        ? `${Math.floor(record.sessionDuration / 60)}h${String(record.sessionDuration % 60).padStart(2, '0')}`
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <AttendanceStatusChip status={record.status} isJustified={record.isJustified} />
                  </TableCell>
                  <TableCell>
                    {record.status ? (
                      record.isPaid
                        ? <Chip label="Paid" size="small" color="success" />
                        : <Chip label="Pending" size="small" color="warning" />
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AttendanceTeacher;