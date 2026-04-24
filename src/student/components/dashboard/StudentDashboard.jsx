/**
 * @file StudentDashboard.jsx
 * @description Home screen for authenticated students.
 *
 * Sections:
 *  1. Hero card — profile, name, class, matricule, mentor
 *  2. KPI strip — attendance rate, average score, upcoming exams, sessions today
 *  3. Today's schedule — session timeline
 *  4. Recent results — last 5 published results with grade bands
 *  5. Upcoming exam sessions — eligible enrolled exams
 *  6. Quick-link cards — navigate to all portal features
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Typography, Paper, Avatar, Chip, Stack,
  Alert, Divider, LinearProgress,
  List, ListItem, ListItemText,
  Card, CardActionArea,
} from '@mui/material';
import {
  School, EventNote, MenuBook, Assessment,
  ChecklistRtl, Description, CalendarMonth, TrendingUp,
  Explicit, CheckCircle, HourglassEmpty,
  EmojiEvents, GradeOutlined,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { getStudentDashboard } from '../../../services/student.service';
import { IMAGE_BASE_URL } from '../../../config/env';
import StudentDashboardSkeleton from './StudentDashboardSkeleton';

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

const fmtDateLong = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—';

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
          <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
        )}
      </Box>
    </Stack>
  </Paper>
);

// ─── Grade Band Chip ──────────────────────────────────────────────────────────

const GradeChip = ({ band }) => {
  const colorMap = { A: 'success', B: 'primary', C: 'info', D: 'warning', E: 'error', F: 'error' };
  return (
    <Chip
      label={band || '—'}
      size="small"
      color={colorMap[band] || 'default'}
      sx={{ fontWeight: 700, minWidth: 28 }}
    />
  );
};

// ─── Session Row ──────────────────────────────────────────────────────────────

const SessionRow = ({ session, showDate = false }) => {
  const theme  = useTheme();
  const isLive = new Date(session.startTime) <= new Date() && new Date(session.endTime) >= new Date();

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 2,
      borderRadius: 2, bgcolor: 'action.hover',
      borderLeft: `3px solid ${isLive ? theme.palette.error.main : theme.palette.primary.main}`,
    }}>
      <Box sx={{ textAlign: 'center', minWidth: 54 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {showDate ? fmtDate(session.startTime) : fmtTime(session.startTime)}
        </Typography>
        {showDate && (
          <Typography variant="caption" color="text.secondary">{fmtTime(session.startTime)}</Typography>
        )}
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {session.subject?.subject_name || session.topic || session.sessionType || 'Session'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {session.teacher
            ? `${session.teacher.firstName} ${session.teacher.lastName}`
            : '—'}
          {session.room?.roomCode ? ` · Room ${session.room.roomCode}` : ''}
          {session.isVirtual ? ' · Virtual' : ''}
        </Typography>
      </Box>
      {isLive && <Chip label="Live" size="small" color="error" />}
    </Box>
  );
};

// ─── Quick-link Card ──────────────────────────────────────────────────────────

const QuickLink = ({ label, icon, path, color }) => {
  const navigate = useNavigate();
  const theme    = useTheme();
  return (
    <Card elevation={1} sx={{ borderRadius: 3, height: '100%' }}>
      <CardActionArea onClick={() => navigate(path)} sx={{ p: 2, height: '100%' }}>
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Box sx={{
            bgcolor: color ? `${color}18` : 'action.hover',
            color:   color || theme.palette.primary.main,
            borderRadius: 2, width: 48, height: 48,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </Box>
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
        </Stack>
      </CardActionArea>
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const theme    = useTheme();
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStudentDashboard()
      .then(({ data }) => { if (!cancelled) setDashboard(data.data); })
      .catch((err)     => { if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard.'); })
      .finally(()      => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <StudentDashboardSkeleton />;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboard) return null;

  const { student, academicYear, stats, todaySessions, upcomingSessions, recentResults, upcomingExams } = dashboard;

  const attendanceColor =
    stats.attendanceRate >= 90 ? theme.palette.success.main :
    stats.attendanceRate >= 75 ? theme.palette.warning.main :
    theme.palette.error.main;

  const kpis = [
    {
      label: 'Attendance',
      value: `${stats.attendanceRate}%`,
      icon:  <ChecklistRtl />,
      color: attendanceColor,
      subtitle: `${stats.absentCount} absence${stats.absentCount !== 1 ? 's' : ''} recorded`,
    },
    {
      label: 'Avg Score',
      value: stats.avgScore != null ? `${stats.avgScore}/20` : 'N/A',
      icon:  <TrendingUp />,
      color: stats.avgScore == null
        ? theme.palette.text.secondary
        : stats.avgScore >= 10 ? theme.palette.success.main : theme.palette.warning.main,
      subtitle: 'last 5 results',
    },
    {
      label: 'Upcoming Exams',
      value: stats.upcomingExamCount,
      icon:  <Explicit />,
      color: stats.upcomingExamCount > 0 ? theme.palette.error.main : theme.palette.success.main,
      subtitle: 'sessions enrolled',
    },
    {
      label: 'Today',
      value: `${stats.todaySessionCount} session${stats.todaySessionCount !== 1 ? 's' : ''}`,
      icon:  <CalendarMonth />,
      color: theme.palette.primary.main,
      subtitle: 'scheduled',
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
              src={imgUrl(student.profileImage)}
              sx={{ width: 80, height: 80, border: '3px solid rgba(255,255,255,0.4)', fontSize: '2rem', flexShrink: 0 }}
            >
              {student.firstName?.[0]}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h5" fontWeight={700}>
                {student.firstName} {student.lastName}
              </Typography>
              <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                {student.studentClass && (
                  <Chip
                    label={student.studentClass.className}
                    size="small"
                    icon={<School sx={{ color: 'white !important' }} />}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                  />
                )}
                {student.campus?.campus_name && (
                  <Chip
                    label={student.campus.campus_name}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }}
                  />
                )}
                <Chip
                  label={student.status || 'active'}
                  size="small"
                  color={student.status === 'active' ? 'success' : 'warning'}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              {student.mentor && (
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 1 }}>
                  Mentor: {student.mentor.firstName} {student.mentor.lastName}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, flexShrink: 0 }}>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block' }}>Academic Year</Typography>
              <Typography variant="h6" fontWeight={700}>{academicYear}</Typography>
              {student.matricule && (
                <>
                  <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>Matricule</Typography>
                  <Typography variant="body2" fontWeight={600}>{student.matricule}</Typography>
                </>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Attendance bar inside hero */}
        <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Overall attendance ({academicYear})</Typography>
            <Typography variant="caption" fontWeight={700}>{stats.attendanceRate}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(stats.attendanceRate, 100)}
            sx={{
              height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 3 },
            }}
          />
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {stats.totalSessions} sessions recorded
          </Typography>
        </Box>
      </Paper>

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
              <Typography variant="h6" fontWeight={700}>Today's Classes</Typography>
              <Chip label={todaySessions.length} size="small" color="primary" variant="outlined" />
            </Stack>
            <Divider />
            <Box sx={{ p: 2 }}>
              {todaySessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No classes today. Enjoy your day!</Typography>
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
              <Typography variant="h6" fontWeight={700}>This Week's Classes</Typography>
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

        {/* ── Recent results ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2.5, pb: 1.5 }}>
              <TrendingUp color="primary" />
              <Typography variant="h6" fontWeight={700}>Recent Results</Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                label={stats.avgScore != null ? `Avg: ${stats.avgScore}/20` : 'No data'}
                size="small"
                color={stats.avgScore == null ? 'default' : stats.avgScore >= 10 ? 'success' : 'warning'}
                variant="outlined"
              />
            </Stack>
            <Divider />
            <Box sx={{ p: 2 }}>
              {recentResults.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <GradeOutlined sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No published results yet.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {recentResults.map((r, i) => (
                    <Box key={r._id}>
                      <ListItem
                        disablePadding
                        sx={{ py: 1.5 }}
                        secondaryAction={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2" fontWeight={700} color="text.primary">
                              {r.normalizedScore != null ? `${r.normalizedScore}/20` : '—'}
                            </Typography>
                            <GradeChip band={r.gradeBand} />
                          </Stack>
                        }
                      >
                        <ListItemText
                          primary={r.subject?.subject_name || r.evaluationTitle || '—'}
                          secondary={`${r.evaluationType || ''} · ${r.academicYear}`}
                          slotProps={{
                            primary:   { variant: 'body2', fontWeight: 600, noWrap: true, sx: { maxWidth: 200 } },
                            secondary: { variant: 'caption' },
                          }}
                        />
                      </ListItem>
                      {i < recentResults.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
              {recentResults.length > 0 && (
                <Box sx={{ mt: 1.5, textAlign: 'right' }}>
                  <Chip
                    label="View all results →"
                    onClick={() => navigate('/student/results')}
                    clickable
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── Upcoming exam sessions ── */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, height: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2.5, pb: 1.5 }}>
              <Explicit color="error" />
              <Typography variant="h6" fontWeight={700}>Upcoming Exams</Typography>
              {upcomingExams.length > 0 && (
                <Chip label={upcomingExams.length} size="small" color="error" />
              )}
            </Stack>
            <Divider />
            <Box sx={{ p: 2 }}>
              {upcomingExams.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <EmojiEvents sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No upcoming exams. Keep it up!
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  {upcomingExams.map((enrollment) => {
                    const exam = enrollment.examSession;
                    const daysLeft = Math.ceil(
                      (new Date(exam.startTime) - new Date()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <Box
                        key={enrollment._id}
                        sx={{
                          p: 2, borderRadius: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderLeft: `4px solid ${daysLeft <= 3 ? theme.palette.error.main : theme.palette.warning.main}`,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {exam.subject?.subject_name || exam.title || 'Exam'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {fmtDateLong(exam.startTime)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {fmtTime(exam.startTime)} – {fmtTime(exam.endTime)}
                              {exam.room?.roomCode ? ` · Room ${exam.room.roomCode}` : ''}
                            </Typography>
                          </Box>
                          <Chip
                            label={daysLeft <= 0 ? 'Today' : `${daysLeft}d`}
                            size="small"
                            color={daysLeft <= 3 ? 'error' : 'warning'}
                            sx={{ fontWeight: 700, ml: 1, flexShrink: 0 }}
                          />
                        </Stack>
                        {enrollment.seatNumber && (
                          <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: 'text.secondary' }}>
                            Seat: <strong>{enrollment.seatNumber}</strong>
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              )}
              {upcomingExams.length > 0 && (
                <Box sx={{ mt: 2, textAlign: 'right' }}>
                  <Chip
                    label="View all exams →"
                    onClick={() => navigate('/student/examination')}
                    clickable
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* ── Quick links ── */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={2} sx={{ borderRadius: 3, p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Quick Access</Typography>
            <Grid container spacing={1.5}>
              {[
                { label: 'Schedule',    path: '/student/schedule',    icon: <EventNote />,    color: theme.palette.primary.main },
                { label: 'Examination', path: '/student/examination', icon: <Explicit />,     color: theme.palette.error.main },
                { label: 'Results',     path: '/student/results',     icon: <Assessment />,   color: theme.palette.success.main },
                { label: 'Attendance',  path: '/student/attendance',  icon: <ChecklistRtl />, color: theme.palette.warning.main },
                { label: 'Courses',     path: '/student/courses',     icon: <MenuBook />,     color: theme.palette.info.main },
                { label: 'Documents',   path: '/student/documents',   icon: <Description />,  color: theme.palette.secondary.main },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 4, sm: 2 }}>
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
