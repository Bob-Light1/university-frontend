import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Grid, Typography, Tab, Tabs, Stack, Avatar,
  Paper, Chip, alpha, useTheme, CircularProgress, Alert,
} from '@mui/material';
import { CalendarMonth, List, AccessTime, CheckCircle } from '@mui/icons-material';

import KPICards             from '../../../components/shared/KpiCard';
import ScheduleFilters      from '../../../components/schedule/ScheduleFilters';
import ScheduleCalendar     from '../../../components/schedule/ScheduleCalendar';
import ScheduleCard         from '../../../components/schedule/ScheduleCard';
import ScheduleDetailDrawer from '../../../components/schedule/ScheduleDetailDrawer';
// FIX: useSchedule mode 'student' does not exist — student self-service uses
//      getMyStudentCalendar directly (identity comes from JWT, not props)
import { getMyStudentCalendar } from '../../../services/scheduleService';

const DEFAULT_FILTERS = {
  search: '', sessionType: '', dateFrom: '', dateTo: '',
};

/**
 * Student schedule page — read-only.
 * Calls GET /schedules/student/me (JWT-authenticated, no identity props needed).
 * classId and campusId are resolved server-side from req.user.
 */
const ScheduleStudent = () => {
  const theme = useTheme();

  const [view,          setView]          = useState('calendar');
  const [sessions,      setSessions]      = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState(null);
  const [filters,       setFilters]       = useState(DEFAULT_FILTERS);
  const [detailSession, setDetailSession] = useState(null);
  const [detailOpen,    setDetailOpen]    = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Map UI filter keys to the API query params expected by the backend:
      //   dateFrom → from, dateTo → to (matching getMyCalendar query parsing)
      const params = {
        ...(filters.sessionType && { sessionType: filters.sessionType }),
        ...(filters.dateFrom    && { from: filters.dateFrom }),
        ...(filters.dateTo      && { to:   filters.dateTo   }),
      };
      const res = await getMyStudentCalendar(params);
      // Normalise various API response shapes
      const raw  = res.data;
      const items = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.sessions)
        ? raw.sessions
        : [];
      setSessions(items.filter(Boolean));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your schedule.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // ── Filter helpers ─────────────────────────────────────────────────────────
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleReset = () => setFilters(DEFAULT_FILTERS);

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

  const handleOpenDetail = useCallback((session) => {
    setDetailSession(session);
    setDetailOpen(true);
  }, []);

  // ── Client-side search (subject name / teacher name) ──────────────────────
  const displayed = useMemo(() => {
    if (!filters.search) return sessions;
    const q = filters.search.toLowerCase();
    return sessions.filter(
      (s) =>
        s.subject?.subject_name?.toLowerCase().includes(q) ||
        s.teacher?.firstName?.toLowerCase().includes(q)    ||
        s.teacher?.lastName?.toLowerCase().includes(q)     ||
        s.room?.code?.toLowerCase().includes(q)
    );
  }, [sessions, filters.search]);

  // ── KPI stats ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    return {
      upcoming: displayed.filter((s) => new Date(s.startTime) > now).length,
      live:     displayed.filter((s) => new Date(s.startTime) <= now && new Date(s.endTime) >= now).length,
      past:     displayed.filter((s) => new Date(s.endTime) < now).length,
    };
  }, [displayed]);

  const kpis = [
    { key: 'upcoming', label: 'Upcoming Sessions', value: stats.upcoming, icon: <CalendarMonth />, color: theme.palette.primary.main, subtitle: 'Sessions scheduled for you' },
    { key: 'live',     label: 'Live Now',           value: stats.live,     icon: <AccessTime />,   color: theme.palette.success.main, alert: stats.live > 0 ? stats.live : undefined },
    { key: 'past',     label: 'Completed',          value: stats.past,     icon: <CheckCircle />,  color: theme.palette.grey[600] },
  ];

  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      <Box mb={3}>
        <Typography variant="h4" fontWeight={800}>My Schedule</Typography>
        <Typography variant="body2" color="text.secondary">
          View all your upcoming and past class sessions
        </Typography>
      </Box>

      <Box mb={3}>
        <KPICards metrics={kpis} loading={loading} />
      </Box>

      {/* Students only filter on sessionType and date range — no status filter
          (backend already returns PUBLISHED only) */}
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
        <ScheduleCalendar
          sessions={displayed}
          onView={handleOpenDetail}
        />
      ) : (
        <Grid container spacing={2}>
          {displayed.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <StudentEmptyState theme={theme} />
            </Grid>
          ) : displayed.map((s) => (
            <Grid key={s._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <ScheduleCard
                session={s}
                onView={handleOpenDetail}
                showActions={false}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail drawer — fully read-only for students */}
      <ScheduleDetailDrawer
        session={detailSession}
        open={detailOpen}
        onClose={handleCloseDrawer}
        showEdit={false}
        showCancel={false}
        showPublish={false}
      />
    </Box>
  );
};

const StudentEmptyState = ({ theme }) => (
  <Paper sx={{
    textAlign: 'center', py: 8, px: 4,
    bgcolor: alpha(theme.palette.info.main, 0.04),
    borderRadius: 3, border: `2px dashed ${alpha(theme.palette.info.main, 0.2)}`,
  }}>
    <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: alpha(theme.palette.info.main, 0.1), width: 64, height: 64 }}>
      <CalendarMonth sx={{ fontSize: 32, color: 'info.main' }} />
    </Avatar>
    <Typography variant="h6" fontWeight={700} mb={1}>No sessions scheduled yet</Typography>
    <Typography variant="body2" color="text.secondary">
      Your class schedule will appear here once it has been published by your campus manager.
    </Typography>
  </Paper>
);

export default ScheduleStudent;