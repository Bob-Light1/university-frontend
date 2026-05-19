/**
 * @file ScheduleTeacher.jsx
 * @description Teacher schedule page.
 *
 * Features:
 *  - Calendar and list views of sessions fetched from GET /schedules/teacher/me
 *  - Detail drawer with "Start Roll-call" button for live/past PUBLISHED sessions
 *  - Postponement request dialog for upcoming PUBLISHED sessions
 *
 * Roll-call contract:
 *   Clicking "Start Roll-call" navigates to /teacher/attendance with:
 *     location.state = { session: <TeacherSchedule document> }
 *   AttendanceTeacher reads this state and auto-selects the session.
 *
 * Identity: resolved server-side from JWT — no teacherId prop needed.
 * mode='teacher' → GET /schedules/teacher/me
 */

import { useState, useCallback } from 'react';
import {
  Box, Grid, Typography, Tab, Tabs, Stack, Paper, Avatar,
  Button, Dialog, DialogTitle, DialogContent,
  Snackbar, Alert, Chip, alpha, useTheme, CircularProgress,
} from '@mui/material';
import {
  CalendarMonth, List, CheckCircle, RateReview, PlayCircle,
  HowToReg, Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import KPICards             from '../../../components/shared/KpiCard';
import ScheduleFilters      from '../../../components/schedule/ScheduleFilters';
import ScheduleCalendar     from '../../../components/schedule/ScheduleCalendar';
import ScheduleCard         from '../../../components/schedule/ScheduleCard';
import ScheduleDetailDrawer from '../../../components/schedule/ScheduleDetailDrawer';
import useSchedule          from '../../../hooks/useSchedule';
import useFormSnackbar      from '../../../hooks/useFormSnackBar';
import { requestPostponement } from '../../../services/scheduleService';
import PostponementForm from './PostponementForm';

// ─── Eligibility helpers ──────────────────────────────────────────────────────

/**
 * A session is eligible for roll-call if:
 *  - it is PUBLISHED
 *  - it has already started (startTime ≤ now)
 * Teachers can open roll-call up to 30 min before start (backend enforces
 * the window), but we open the button as soon as the session is live or past
 * to match the backend rule: openRollCall checks "30 min before startTime".
 * We open it 30 min early on the frontend too.
 */
const canStartRollCall = (session) => {
  if (!session) return false;
  if (session.status !== 'PUBLISHED') return false;
  const THIRTY_MIN_MS = 30 * 60 * 1000;
  return new Date(session.startTime) - Date.now() <= THIRTY_MIN_MS;
};

/**
 * A session can be postponed if it is PUBLISHED and has not yet started.
 */
const canRequestPostponement = (session) => {
  if (!session) return false;
  if (session.status !== 'PUBLISHED') return false;
  return new Date(session.startTime) > new Date();
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const ScheduleTeacher = () => {
  const theme    = useTheme();
  const navigate = useNavigate();

  const [view,           setView]           = useState('calendar');
  const [detailSession,  setDetailSession]  = useState(null);
  const [detailOpen,     setDetailOpen]     = useState(false);
  const [postponeTarget, setPostponeTarget] = useState(null);
  const [postponeOpen,   setPostponeOpen]   = useState(false);

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const {
    sessions, loading, error, filters, stats,
    handleFilterChange, handleReset,
  } = useSchedule('teacher');

  // ── KPI cards ───────────────────────────────────────────────────────────────

  const kpis = [
    { key: 'upcoming', label: 'Upcoming',    value: stats.upcoming, icon: <CalendarMonth />, color: theme.palette.primary.main },
    { key: 'live',     label: 'In Progress', value: stats.live,     icon: <PlayCircle />,    color: theme.palette.success.main, alert: stats.live > 0 ? stats.live : undefined },
    { key: 'past',     label: 'Completed',   value: stats.past,     icon: <CheckCircle />,   color: theme.palette.grey[600] },
    { key: 'total',    label: 'Total',       value: stats.total,    icon: <RateReview />,    color: theme.palette.secondary.main },
  ];

  // ── Session detail ──────────────────────────────────────────────────────────

  const handleViewSession = useCallback((session) => {
    setDetailSession(session);
    setDetailOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setDetailOpen(false);
  }, []);

  // ── Roll-call ───────────────────────────────────────────────────────────────

  /**
   * Navigate to the attendance page, passing the selected session in router state.
   * The drawer is closed first (blur before close to avoid aria-hidden violation).
   */
  const handleStartRollCall = useCallback((session) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setDetailOpen(false);
    navigate('/teacher/attendance', { state: { session } });
  }, [navigate]);

  // ── Postponement ────────────────────────────────────────────────────────────

  const handleOpenPostponement = useCallback((session) => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    setDetailOpen(false);
    setPostponeTarget(session);
    setPostponeOpen(true);
  }, []);

  const handlePostponeSubmit = useCallback(async (payload) => {
    try {
      await requestPostponement(postponeTarget._id, payload);
      showSnackbar('Postponement request submitted. Awaiting Campus Manager review.', 'success');
      setPostponeOpen(false);
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Failed to submit request.', 'error');
    }
  }, [postponeTarget, showSnackbar]);

  // ── Teacher-specific footer rendered inside the shared drawer ───────────────

  /**
   * Builds the extraFooter ReactNode shown in ScheduleDetailDrawer's sticky footer.
   * Avoids creating a wrapper component, keeping the session reactive.
   */
  const buildDrawerFooter = useCallback((session) => {
    if (!session) return null;
    const rollCall  = canStartRollCall(session);
    const postpone  = canRequestPostponement(session);
    if (!rollCall && !postpone) return null;

    return (
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        {postpone && (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<CancelIcon />}
            onClick={() => handleOpenPostponement(session)}
            sx={{ textTransform: 'none' }}
          >
            Request Postponement
          </Button>
        )}
        {rollCall && (
          <Button
            variant="contained"
            color="success"
            startIcon={<HowToReg />}
            onClick={() => handleStartRollCall(session)}
            sx={{ textTransform: 'none' }}
          >
            Start Roll-call
          </Button>
        )}
      </Stack>
    );
  }, [handleStartRollCall, handleOpenPostponement]);

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      <Box mb={3}>
        <Typography variant="h4" fontWeight={800}>My Teaching Schedule</Typography>
        <Typography variant="body2" color="text.secondary">
          View your assigned sessions, start roll-call, and manage postponement requests
        </Typography>
      </Box>

      <Box mb={3}>
        <KPICards metrics={kpis} loading={loading} />
      </Box>

      <Box mb={3}>
        <ScheduleFilters
          searchValue={filters.search}
          onSearchChange={(v) => handleFilterChange('search', v)}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          showImport={false}
        />
      </Box>

      <Box mb={2}>
        <Tabs
          value={view}
          onChange={(_, v) => setView(v)}
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
        >
          <Tab value="calendar" label="Calendar" icon={<CalendarMonth />} iconPosition="start" />
          <Tab value="list"     label="List"     icon={<List />}          iconPosition="start" />
        </Tabs>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : view === 'calendar' ? (
        <ScheduleCalendar sessions={sessions} onView={handleViewSession} />
      ) : (
        <Grid container spacing={2}>
          {sessions.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <TeacherEmptyState theme={theme} />
            </Grid>
          ) : sessions.map((s) => (
            <Grid key={s._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <TeacherSessionCard
                session={s}
                onView={handleViewSession}
                onPostpone={handleOpenPostponement}
                onRollCall={handleStartRollCall}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Detail drawer — shared component with teacher-specific footer ─── */}
      <ScheduleDetailDrawer
        session={detailSession}
        open={detailOpen}
        onClose={handleCloseDrawer}
        showEdit={false}
        showCancel={false}
        showPublish={false}
        extraFooter={buildDrawerFooter(detailSession)}
      />

      {/* ── Postponement dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={postponeOpen}
        onClose={() => setPostponeOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEnforceFocus
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle fontWeight={800}>Request Postponement</DialogTitle>
        <DialogContent dividers>
          <PostponementForm
            session={postponeTarget}
            onSubmit={handlePostponeSubmit}
            onCancel={() => setPostponeOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* ── Feedback snackbar ───────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Teacher session card (list view) ────────────────────────────────────────

/**
 * Extends ScheduleCard with inline "Start Roll-call" button below the card,
 * shown only when the session is eligible.
 * The postponement action reuses ScheduleCard's onEdit slot (shows the edit
 * icon) — relabelling is done via the tooltip in ScheduleCard.
 */
const TeacherSessionCard = ({ session, onView, onPostpone, onRollCall }) => {
  const now      = new Date();
  const isLive   = new Date(session.startTime) <= now && new Date(session.endTime) >= now;
  const rollCall = canStartRollCall(session);
  const postpone = canRequestPostponement(session);

  return (
    <Box sx={{ position: 'relative' }}>
      {isLive && (
        <Chip
          label="LIVE"
          size="small"
          color="success"
          sx={{
            position: 'absolute', top: -10, right: 8, zIndex: 1,
            fontWeight: 800, fontSize: '0.65rem',
            animation: 'pulse 1.5s infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%':      { opacity: 0.6 },
            },
          }}
        />
      )}

      <ScheduleCard
        session={session}
        onView={onView}
        showActions
        onEdit={postpone ? () => onPostpone(session) : undefined}
      />

      {rollCall && (
        <Box sx={{ px: 1, pb: 1, mt: -0.5 }}>
          <Button
            fullWidth
            size="small"
            variant="contained"
            color="success"
            startIcon={<HowToReg />}
            onClick={() => onRollCall(session)}
            sx={{ textTransform: 'none', borderRadius: 1 }}
          >
            Start Roll-call
          </Button>
        </Box>
      )}
    </Box>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────

const TeacherEmptyState = ({ theme }) => (
  <Paper sx={{
    textAlign: 'center', py: 8, px: 4,
    bgcolor: alpha(theme.palette.secondary.main, 0.04),
    borderRadius: 3,
    border: `2px dashed ${alpha(theme.palette.secondary.main, 0.2)}`,
  }}>
    <Avatar sx={{
      mx: 'auto', mb: 2,
      bgcolor: alpha(theme.palette.secondary.main, 0.1),
      width: 64, height: 64,
    }}>
      <CalendarMonth sx={{ fontSize: 32, color: 'secondary.main' }} />
    </Avatar>
    <Typography variant="h6" fontWeight={700} mb={1}>No sessions assigned</Typography>
    <Typography variant="body2" color="text.secondary">
      Sessions assigned to you by the campus manager will appear here.
    </Typography>
  </Paper>
);

export default ScheduleTeacher;