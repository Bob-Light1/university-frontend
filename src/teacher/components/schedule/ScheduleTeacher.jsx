import { useState, useCallback } from 'react';
import {
  Box, Grid, Typography, Tab, Tabs, Stack, Paper, Avatar,
  Button, Dialog, DialogTitle, DialogContent,
  Snackbar, Alert, Chip, alpha, useTheme, CircularProgress,
} from '@mui/material';
import {
  CalendarMonth, List, AccessTime, CheckCircle,
  RateReview, PlayCircle,
  HowToReg,
} from '@mui/icons-material';

import KPICards             from '../../../components/shared/KpiCard';
import ScheduleFilters      from '../../../components/schedule/ScheduleFilters';
import ScheduleCalendar     from '../../../components/schedule/ScheduleCalendar';
import ScheduleCard         from '../../../components/schedule/ScheduleCard';
import ScheduleDetailDrawer from '../../../components/schedule/ScheduleDetailDrawer';
import useSchedule          from '../../../hooks/useSchedule';
import useFormSnackbar      from '../../../hooks/useFormSnackBar';
// FIX: removed getTeacherSchedules / updateTeacherScheduleStatus (deleted from service)
//      requestPostponement is the correct API call for teacher postponement workflow
import { requestPostponement } from '../../../services/schedule.service';
import PostponementForm from './PostponementForm';
import { useNavigate } from 'react-router-dom';


const isSessionLiveOrPast = (session) => {
  const now = new Date();
  return new Date(session.startTime) <= now;
};
/**
 * Teacher schedule page.
 * Teachers can view their sessions and submit postponement requests.
 * Identity (teacherId) is resolved server-side from the JWT — no identity props needed.
 * mode='teacher' → GET /schedules/teacher/me (JWT-authenticated)
 */
const ScheduleTeacher = () => {
  const theme = useTheme();
 
  const [view,            setView]            = useState('calendar');
  const [detailSession,   setDetailSession]   = useState(null);
  const [detailOpen,      setDetailOpen]      = useState(false);
  const [postponeTarget,  setPostponeTarget]  = useState(null);
  const [postponeOpen,    setPostponeOpen]    = useState(false);

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  // FIX: removed teacherId / campusId props — getMyTeacherCalendar reads identity
  //      from the JWT server-side; passing them here would be ignored anyway
  const {
    sessions, loading, error, filters, stats,
    handleFilterChange, handleReset,
  } = useSchedule('teacher');

  const kpis = [
    { key: 'upcoming', label: 'Upcoming Sessions',  value: stats.upcoming, icon: <CalendarMonth />, color: theme.palette.primary.main },
    { key: 'live',     label: 'In Progress',         value: stats.live,     icon: <PlayCircle />,   color: theme.palette.success.main, alert: stats.live > 0 ? stats.live : undefined },
    { key: 'past',     label: 'Completed',           value: stats.past,     icon: <CheckCircle />,  color: theme.palette.grey[600] },
    { key: 'total',    label: 'Total this period',   value: stats.total,    icon: <RateReview />,   color: theme.palette.secondary.main },
  ];

  const handleViewSession = (session) => {
    setDetailSession(session);
    setDetailOpen(true);
  };

  /**
   * Blur focused element before closing to prevent the aria-hidden violation
   * triggered by MUI hiding the modal while a descendant retains focus.
   */
  const handleCloseDrawer = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setDetailOpen(false);
  }, []);

  const handlePostponeRequest = (session) => {
    setPostponeTarget(session);
    setPostponeOpen(true);
  };

  /**
   * Calls POST /schedules/teacher/:id/postpone
   * payload shape: { reason, proposedStart?, proposedEnd? }
   * This matches the backend requestPostponement controller exactly.
   *
   * FIX: was updateTeacherScheduleStatus(id, { status: 'POSTPONED', ...payload })
   *      which pointed to a deleted service function with the wrong endpoint.
   */
  const handlePostponeSubmit = useCallback(async (payload) => {
    try {
      await requestPostponement(postponeTarget._id, payload);
      showSnackbar('Postponement request submitted. Awaiting review.', 'success');
      setPostponeOpen(false);
      setDetailOpen(false);
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Failed to submit request', 'error');
    }
  }, [postponeTarget, showSnackbar]);

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      <Box mb={3}>
        <Typography variant="h4" fontWeight={800}>My Teaching Schedule</Typography>
        <Typography variant="body2" color="text.secondary">
          View your assigned sessions and manage postponement requests
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
        <Tabs value={view} onChange={(_, v) => setView(v)}
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
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
                onPostpone={handlePostponeRequest}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail drawer — teacher: read-only, no edit/cancel/publish */}
      <ScheduleDetailDrawer
        session={detailSession}
        open={detailOpen}
        onClose={handleCloseDrawer}
        showEdit={false}
        showCancel={false}
        showPublish={false}
      />

      {/* Postponement request dialog */}
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

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Teacher session card with LIVE badge and postpone action ─────────────────

const TeacherSessionCard = ({ session, onView, onPostpone }) => {
  const now    = new Date();
  const isLive = new Date(session.startTime) <= now && new Date(session.endTime) >= now;
  const navigate = useNavigate();
  const canRollCall = session.status === 'PUBLISHED'
    && !session.isCancelled
    && isSessionLiveOrPast(session);


  // A teacher can only request postponement on a PUBLISHED upcoming session
  const canPostpone = session.status === 'PUBLISHED' 
    && new Date(session.startTime) > now;

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
        // FIX: onEdit slot repurposed for "request postponement" — only shown
        //      on upcoming PUBLISHED sessions (not live, not past, not already cancelled)
        onEdit={canPostpone ? () => onPostpone(session) : undefined}
      />

      {canRollCall && (
      <Box sx={{ px: 1, pb: 1, mt: -1 }}>
        <Button
          fullWidth
          size="small"
          variant="contained"
          color="success"
          startIcon={<HowToReg />}
          onClick={() => navigate('/teacher/attendance', { state: { session } })}
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
    borderRadius: 3, border: `2px dashed ${alpha(theme.palette.secondary.main, 0.2)}`,
  }}>
    <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), width: 64, height: 64 }}>
      <CalendarMonth sx={{ fontSize: 32, color: 'secondary.main' }} />
    </Avatar>
    <Typography variant="h6" fontWeight={700} mb={1}>No sessions assigned</Typography>
    <Typography variant="body2" color="text.secondary">
      Sessions assigned to you by the campus manager will appear here.
    </Typography>
  </Paper>
);

export default ScheduleTeacher;