import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Typography, Paper, Avatar, Chip, Stack,
  CircularProgress, Alert, Divider, LinearProgress,
  List, ListItem, ListItemText, ListItemIcon,
  Card, CardContent, CardActionArea,
} from '@mui/material';
import {
  ChildCare, School, EventNote, CheckCircle, Cancel,
  TrendingUp, CalendarMonth, Person,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { getMyDashboard } from '../../../services/parentService';
import { IMAGE_BASE_URL } from '../../../config/env';
import { fTime, fDateWeekday } from '../../../utils/dateFormat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const profileUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const formatTime = (dateStr) => fTime(dateStr);
const formatDate = (dateStr) => fDateWeekday(dateStr);

// ─── Sub-components ───────────────────────────────────────────────────────────

const AttendanceBar = ({ rate, total }) => {
  const theme = useTheme();
  const color =
    rate >= 90 ? theme.palette.success.main :
    rate >= 75 ? theme.palette.warning.main :
    theme.palette.error.main;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Attendance rate
        </Typography>
        <Typography variant="caption" fontWeight={700} sx={{ color }}>
          {rate}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min(rate, 100)}
        sx={{
          height: 6, borderRadius: 3,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography variant="caption" color="text.secondary">
        {total} sessions recorded
      </Typography>
    </Box>
  );
};

const GradeBandChip = ({ band }) => {
  const colorMap = {
    A: 'success', B: 'primary', C: 'info', D: 'warning', E: 'error', F: 'error',
  };
  return (
    <Chip
      label={band || '—'}
      size="small"
      color={colorMap[band] || 'default'}
      sx={{ fontWeight: 700, minWidth: 28 }}
    />
  );
};

// ─── Child Summary Card ───────────────────────────────────────────────────────

const ChildCard = ({ summary, onSelect }) => {
  const theme    = useTheme();
  const { student, recentResults, attendance, upcomingSessions } = summary;

  return (
    <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      {/* Card header — click to open child detail */}
      <CardActionArea onClick={() => onSelect(student.id)} sx={{ p: 0 }}>
        <Box
          sx={{
            p: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            color: 'white',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={profileUrl(student.profileImage)}
              sx={{ width: 56, height: 56, border: '3px solid white' }}
            >
              {student.firstName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {student.firstName} {student.lastName}
              </Typography>
              <Chip
                label={student.status || 'active'}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  mt: 0.5,
                  height: 20,
                  fontSize: '0.7rem',
                }}
              />
            </Box>
          </Stack>
        </Box>
      </CardActionArea>

      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2}>

          {/* Attendance */}
          <Grid size={{ xs: 12 }}>
            <AttendanceBar
              rate={attendance?.attendanceRate ?? 0}
              total={attendance?.totalSessions ?? 0}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider />
          </Grid>

          {/* Recent Results */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <TrendingUp fontSize="small" color="primary" />
              <Typography variant="caption" fontWeight={700} color="primary">
                Recent Results
              </Typography>
            </Stack>
            {recentResults?.length > 0 ? (
              <List disablePadding>
                {recentResults.slice(0, 3).map((r) => (
                  <ListItem
                    key={r._id}
                    disablePadding
                    sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
                    secondaryAction={
                      <GradeBandChip band={r.gradeBand} />
                    }
                  >
                    <ListItemText
                      primary={r.subject?.subject_name || r.evaluationTitle || '—'}
                      secondary={r.academicYear}
                      slotProps={{
                        primary:   { variant: 'body2', fontWeight: 500, noWrap: true, sx: { maxWidth: 130 } },
                        secondary: { variant: 'caption' },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                No published results yet.
              </Typography>
            )}
          </Grid>

          {/* Upcoming Sessions */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <CalendarMonth fontSize="small" color="primary" />
              <Typography variant="caption" fontWeight={700} color="primary">
                Next Sessions
              </Typography>
            </Stack>
            {upcomingSessions?.length > 0 ? (
              <List disablePadding>
                {upcomingSessions.map((s) => (
                  <ListItem
                    key={s._id}
                    disablePadding
                    sx={{ py: 0.5, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <EventNote fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={s.subject?.subject_name || 'Session'}
                      secondary={`${formatDate(s.startTime)} · ${formatTime(s.startTime)}`}
                      slotProps={{
                        primary:   { variant: 'body2', fontWeight: 500, noWrap: true },
                        secondary: { variant: 'caption' },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">
                No upcoming sessions.
              </Typography>
            )}
          </Grid>

        </Grid>
      </CardContent>
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ParentDashboard = () => {
  const navigate = useNavigate();
  const theme    = useTheme();

  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyDashboard()
      .then(({ data }) => {
        if (!cancelled) setDashboard(data.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (!dashboard) return null;

  const { parent, academicYear, childCount, children } = dashboard;

  // ── KPI summary bar ───────────────────────────────────────────────────────

  const totalAbsences = children.reduce(
    (sum, c) => sum + (c.attendance?.absentCount ?? 0), 0
  );

  const kpis = [
    {
      label: 'Children',
      value: childCount,
      icon:  <ChildCare />,
      color: theme.palette.primary.main,
    },
    {
      label: 'Academic Year',
      value: academicYear,
      icon:  <School />,
      color: theme.palette.info.main,
    },
    {
      label: 'Total Absences',
      value: totalAbsences,
      icon:  totalAbsences > 5 ? <Cancel /> : <CheckCircle />,
      color: totalAbsences > 5 ? theme.palette.error.main : theme.palette.success.main,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>

      {/* Welcome header */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }}>
          <Person />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Welcome, {parent.firstName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Here's an overview of your children's progress.
          </Typography>
        </Box>
      </Stack>

      {/* KPI bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 12, sm: 4 }}>
            <Paper
              elevation={2}
              sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${kpi.color}` }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ color: kpi.color }}>{kpi.icon}</Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {kpi.label}
                  </Typography>
                  <Typography variant="h6" fontWeight={700}>
                    {kpi.value}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Child cards */}
      {children.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <ChildCare sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            No children are linked to your account yet.
            Please contact your campus manager.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {children.map((summary) => (
            <Grid key={summary.student.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <ChildCard
                summary={summary}
                onSelect={(studentId) => navigate(`/parent/children/${studentId}/results`)}
              />
            </Grid>
          ))}
        </Grid>
      )}

    </Box>
  );
};

export default ParentDashboard;
