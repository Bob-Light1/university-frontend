/**
 * @file TeacherDashboard.jsx
 * @description Home screen for authenticated teachers.
 *
 * Sections:
 *  1. Hero card — profile, name, department, employment type
 *  2. KPI strip — students, subjects, hours delivered, grading queue
 *  3. Today's schedule — session timeline with roll-call status
 *  4. Pending roll-calls alert — past sessions missing roll-call
 *  5. Upcoming sessions — next 7 days
 *  6. Quick-link cards — navigate to all portal features
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Typography, Paper, Avatar, Chip, Stack,
  Alert, Divider, LinearProgress,
  Card, CardActionArea, Badge, Button,
} from '@mui/material';
import {
  School, EventNote, MenuBook, Assessment,
  ChecklistRtl, Description, Warning, CheckCircle,
  Schedule, Groups, HourglassEmpty,
  CalendarMonth, Explicit,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { getTeacherDashboard } from '../../../services/teacher.service';
import { IMAGE_BASE_URL } from '../../../config/env';
import TeacherDashboardSkeleton from './TeacherDashboardSkeleton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';

const employmentColors = {
  'full-time': 'success',
  'part-time':  'warning',
  'contract':   'info',
  'temporary':  'default',
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, color, subtitle }) => (
  <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, borderLeft: `4px solid ${color}`, height: '100%' }}>
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box sx={{
        bgcolor: `${color}18`, color, borderRadius: 2,
        width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ color, lineHeight: 1.2 }}>
          {value ?? '—'}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
  </Paper>
);

// ─── Session Row ──────────────────────────────────────────────────────────────

const SessionRow = ({ session, showDate = false }) => {
  const theme     = useTheme();
  const now       = new Date();
  const isLive    = new Date(session.startTime) <= now && new Date(session.endTime) >= now;
  const isPast    = new Date(session.endTime) < now;
  const submitted = session.rollCall?.submitted;

  const statusChip = isPast
    ? submitted
      ? <Chip label="Roll-call done" size="small" color="success" icon={<CheckCircle fontSize="small" />} />
      : <Chip label="Missing roll-call" size="small" color="warning" icon={<Warning fontSize="small" />} />
    : isLive
      ? <Chip label="Live now" size="small" color="error" sx={{ animation: 'pulse 2s infinite' }} />
      : null;

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 2,
      borderRadius: 2, bgcolor: 'action.hover',
      borderLeft: `3px solid ${isPast ? (submitted ? theme.palette.success.main : theme.palette.warning.main) : theme.palette.primary.main}`,
    }}>
      <Box sx={{ textAlign: 'center', minWidth: 54 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {showDate ? fmtDate(session.startTime) : fmtTime(session.startTime)}
        </Typography>
        {showDate && (
          <Typography variant="caption" color="text.secondary">
            {fmtTime(session.startTime)}
          </Typography>
        )}
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {session.subject?.subject_name || session.sessionType || 'Session'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {session.classes?.map((c) => c.className).join(', ') || '—'}
          {session.room?.roomCode ? ` · Room ${session.room.roomCode}` : ''}
          {session.isVirtual ? ' · Virtual' : ''}
        </Typography>
      </Box>
      {statusChip}
    </Box>
  );
};

// ─── Quick-link Card ──────────────────────────────────────────────────────────

const QuickLink = ({ label, icon, path, badge, color }) => {
  const navigate = useNavigate();
  const theme    = useTheme();
  return (
    <Card elevation={1} sx={{ borderRadius: 3, height: '100%' }}>
      <CardActionArea onClick={() => navigate(path)} sx={{ p: 2, height: '100%' }}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Badge badgeContent={badge || 0} color="error" invisible={!badge}>
            <Box sx={{
              bgcolor: color ? `${color}18` : 'action.hover',
              color:   color || theme.palette.primary.main,
              borderRadius: 2, width: 48, height: 48,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {icon}
            </Box>
          </Badge>
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const theme    = useTheme();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTeacherDashboard()
      .then(({ data }) => { if (!cancelled) setDashboard(data.data); })
      .catch((err)     => { if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard.'); })
      .finally(()      => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <TeacherDashboardSkeleton />;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboard) return null;

  const { teacher, academicYear, stats, todaySessions, upcomingSessions, pendingRollCalls } = dashboard;

  const deliveryRate = stats.totalSessions
    ? Math.round((stats.deliveredSessions / stats.totalSessions) * 100)
    : 0;

  const kpis = [
    {
      label: 'Students',
      value: stats.totalStudents,
      icon:  <Groups />,
      color: theme.palette.primary.main,
      subtitle: `across ${stats.classCount} class${stats.classCount !== 1 ? 'es' : ''}`,
    },
    {
      label: 'Subjects',
      value: stats.subjectCount,
      icon:  <MenuBook />,
      color: theme.palette.info.main,
      subtitle: 'assigned this year',
    },
    {
      label: 'Hours Delivered',
      value: `${stats.deliveredHours}h`,
      icon:  <Schedule />,
      color: theme.palette.success.main,
      subtitle: `${stats.deliveredSessions} / ${stats.totalSessions} sessions`,
    },
    {
      label: 'Grading Queue',
      value: stats.gradingQueueCount,
      icon:  <Assessment />,
      color: stats.gradingQueueCount > 0 ? theme.palette.warning.main : theme.palette.success.main,
      subtitle: 'submissions pending',
    },
  ];

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

      {/* ── Hero card ── */}
      <Paper
        elevation={3}
        sx={{
          borderRadius: 4, overflow: 'hidden', mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
        }}
      >
        <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar
              src={imgUrl(teacher.profileImage)}
              sx={{ width: 80, height: 80, border: '3px solid rgba(255,255,255,0.4)', fontSize: '2rem', flexShrink: 0 }}
            >
              {teacher.firstName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={700}>
                Welcome, {teacher.firstName} {teacher.lastName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                {teacher.qualification}
                {teacher.specialization ? ` · ${teacher.specialization}` : ''}
              </Typography>
              <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" gap={1}>
                {teacher.campus?.campus_name && (
                  <Chip label={teacher.campus.campus_name} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                )}
                {teacher.department?.name && (
                  <Chip label={teacher.department.name} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }} />
                )}
                <Chip
                  label={teacher.employmentType?.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase()) || 'Teacher'}
                  size="small"
                  color={employmentColors[teacher.employmentType] || 'default'}
                  sx={{ fontWeight: 600 }}
                />
                <Chip label={`${teacher.experience} yr${teacher.experience !== 1 ? 's' : ''} experience`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
                {teacher.status && teacher.status !== 'active' && (
                  <Chip
                    label={teacher.status}
                    size="small"
                    color={teacher.status === 'suspended' ? 'error' : 'warning'}
                    sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                  />
                )}
              </Stack>
            </Box>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0 }}>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>Academic Year</Typography>
              <Typography variant="h6" fontWeight={700}>{academicYear}</Typography>
              {teacher.matricule && (
                <>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>Matricule</Typography>
                  <Typography variant="body2" fontWeight={600}>{teacher.matricule}</Typography>
                </>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Delivery progress bar */}
        <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Session delivery rate</Typography>
            <Typography variant="caption" fontWeight={700}>{deliveryRate}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={deliveryRate}
            sx={{
              height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 3 },
            }}
          />
        </Box>
      </Paper>

      {/* ── Pending roll-call alert ── */}
      {stats.pendingRollCallCount > 0 && (
        <Alert
          severity="warning"
          icon={<Warning />}
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/teacher/schedule')}>
              View Schedule
            </Button>
          }
        >
          <strong>{stats.pendingRollCallCount} session{stats.pendingRollCallCount > 1 ? 's' : ''}</strong> without a submitted roll-call.
          Please update attendance for past sessions.
        </Alert>
      )}

      {/* ── KPI strip ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>

        {/* ── Today's schedule ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2.5, pb: 1.5 }}>
              <CalendarMonth color="primary" />
              <Typography variant="h6" fontWeight={700}>Today's Schedule</Typography>
              <Chip label={`${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''}`} size="small" color="primary" variant="outlined" />
            </Stack>
            <Divider />
            <Box sx={{ p: 2 }}>
              {todaySessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No sessions scheduled today.</Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {todaySessions.map((s) => <SessionRow key={s._id} session={s} />)}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── Upcoming sessions ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2.5, pb: 1.5 }}>
              <EventNote color="primary" />
              <Typography variant="h6" fontWeight={700}>Upcoming (7 days)</Typography>
            </Stack>
            <Divider />
            <Box sx={{ p: 2 }}>
              {upcomingSessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <HourglassEmpty sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No upcoming sessions this week.</Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {upcomingSessions.map((s) => <SessionRow key={s._id} session={s} showDate />)}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── Pending roll-calls list ── */}
        {pendingRollCalls.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ borderRadius: 3, borderLeft: `4px solid ${theme.palette.warning.main}` }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2.5, pb: 1.5 }}>
                <Warning color="warning" />
                <Typography variant="h6" fontWeight={700}>Roll-Calls to Submit</Typography>
                <Chip label={pendingRollCalls.length} size="small" color="warning" />
              </Stack>
              <Divider />
              <Box sx={{ p: 2 }}>
                <Grid container spacing={1}>
                  {pendingRollCalls.map((s) => (
                    <Grid key={s._id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{
                        p: 1.5, borderRadius: 2, bgcolor: 'warning.light',
                        border: `1px solid ${theme.palette.warning.main}40`,
                      }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {s.subject?.subject_name || 'Session'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(s.startTime)} · {fmtTime(s.startTime)}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Button variant="outlined" size="small" color="warning" onClick={() => navigate('/teacher/schedule')}>
                    Open Schedule
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* ── My subjects & classes ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2.5, pb: 1.5 }}>
              <MenuBook color="primary" />
              <Typography variant="h6" fontWeight={700}>My Subjects</Typography>
            </Stack>
            <Divider />
            <Box sx={{ p: 2 }}>
              {teacher.subjects.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                  No subjects assigned yet.
                </Typography>
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {teacher.subjects.map((s) => (
                    <Chip
                      key={s._id}
                      label={s.subject_name}
                      icon={<School fontSize="small" />}
                      variant="outlined"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              )}
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                <Groups color="primary" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700}>My Classes</Typography>
              </Stack>
              {teacher.classes.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No classes assigned yet.</Typography>
              ) : (
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {teacher.classes.map((c) => (
                    <Chip
                      key={c._id}
                      label={c.className}
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── Quick links ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Quick Access</Typography>
            <Grid container spacing={1.5}>
              {[
                { label: 'Schedule',    path: '/teacher/schedule',    icon: <EventNote />,      color: theme.palette.primary.main },
                { label: 'Examination', path: '/teacher/examination', icon: <Explicit />,       color: theme.palette.secondary.main, badge: stats.gradingQueueCount },
                { label: 'Results',     path: '/teacher/results',     icon: <Assessment />,     color: theme.palette.success.main },
                { label: 'Attendance',  path: '/teacher/attendance',  icon: <ChecklistRtl />,   color: theme.palette.warning.main, badge: stats.pendingRollCallCount },
                { label: 'Courses',     path: '/teacher/courses',     icon: <MenuBook />,       color: theme.palette.info.main },
                { label: 'Documents',   path: '/teacher/documents',   icon: <Description />,    color: theme.palette.error.main },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 4 }}>
                  <QuickLink {...item} />
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

      </Grid>
    </Box>
  );
}
