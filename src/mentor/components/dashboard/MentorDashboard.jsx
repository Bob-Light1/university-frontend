/**
 * @file MentorDashboard.jsx
 * @description Mentor home screen.
 *
 * Sections:
 *  1. Hero card  — photo, name, campus, specialization
 *  2. KPI strip  — total students, active students, attendance rate, total classes
 *  3. Recent results — last 5 published results for assigned students
 *  4. Quick links
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, Typography, Paper, Avatar, Chip, Stack,
  Alert, Divider, LinearProgress,
  List, ListItem, ListItemAvatar, ListItemText,
  Card, CardActionArea,
  Skeleton, useTheme,
} from '@mui/material';
import {
  Group, Assessment, ChecklistRtl, MenuBook,
  Person, School, TrendingUp, GradeOutlined,
} from '@mui/icons-material';

import { getMentorDashboard, getMyProfile } from '../../../services/mentorService';
import { IMAGE_BASE_URL } from '../../../config/env';
import { mentorPrimary } from '../../../theme/mentorTokens';

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const MENTOR_GRADIENT = 'linear-gradient(135deg, #003285 0%, #4989c8 100%)';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const fmtPct = (v) => (v == null ? '—' : `${v}%`);

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, color }) => (
  <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3, borderLeft: `4px solid ${color}`, height: '100%' }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box sx={{
        bgcolor: `${color}18`, color, borderRadius: 2,
        width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800}>{value ?? '—'}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </Stack>
  </Paper>
);

// ─── Quick-link card ──────────────────────────────────────────────────────────

const QuickCard = ({ label, icon, path, color, navigate }) => (
  <Card elevation={1} sx={{ borderRadius: 3 }}>
    <CardActionArea onClick={() => navigate(path)} sx={{ p: 2.5 }}>
      <Stack alignItems="center" spacing={1}>
        <Box sx={{
          bgcolor: `${color}15`, color, borderRadius: 2,
          width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </Box>
        <Typography variant="body2" fontWeight={600} textAlign="center">{label}</Typography>
      </Stack>
    </CardActionArea>
  </Card>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function MentorDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const mentorAccent = mentorPrimary(theme.palette.mode);
  const [profile,   setProfile]   = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    Promise.all([getMyProfile(), getMentorDashboard()])
      .then(([pRes, dRes]) => {
        setProfile(pRes.data?.data ?? pRes.data);
        setDashboard(dRes.data?.data ?? dRes.data);
      })
      .catch(() => setError('Failed to load dashboard. Please try again.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 3, mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={90} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Box>
    );
  }

  const stats = dashboard?.stats ?? {};

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      {/* ── Hero card ── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: MENTOR_GRADIENT, color: 'white' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
          <Avatar
            src={imgUrl(profile?.profileImage)}
            sx={{ width: 72, height: 72, border: '3px solid rgba(255,255,255,0.5)', fontSize: 28 }}
          >
            {profile?.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800}>
              {profile?.firstName} {profile?.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>{profile?.email}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                icon={<School sx={{ fontSize: 12, color: 'white !important' }} />}
                label={profile?.schoolCampus?.campus_name ?? 'Campus'}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
              />
              {profile?.specialization && (
                <Chip
                  label={profile.specialization}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* ── KPI strip ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Students',  value: stats.totalStudents,  icon: <Group />,      color: mentorAccent },
          { label: 'Active Students', value: stats.activeStudents, icon: <Person />,     color: '#2e7d32' },
          { label: 'Attendance Rate', value: fmtPct(stats.attendanceRate), icon: <ChecklistRtl />, color: '#ed6c02' },
          { label: 'Classes',         value: stats.totalClasses,   icon: <School />,     color: '#7b1fa2' },
        ].map((kpi) => (
          <Grid item xs={12} sm={6} md={3} key={kpi.label}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      {/* ── Recent results ── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Assessment sx={{ color: mentorAccent }} />
          <Typography variant="subtitle1" fontWeight={700}>Recent Results</Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {(dashboard?.recentResults ?? []).length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No published results yet.
          </Typography>
        ) : (
          <List disablePadding>
            {(dashboard?.recentResults ?? []).map((r, i) => (
              <ListItem key={r._id ?? i} disablePadding sx={{ py: 0.75 }}>
                <ListItemAvatar>
                  <Avatar
                    src={imgUrl(r.student?.profileImage)}
                    sx={{ width: 36, height: 36, fontSize: 14 }}
                  >
                    {r.student?.firstName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`}
                  secondary={r.subject?.subject_name ?? '—'}
                  slotProps={{
                    primary:   { variant: 'body2', fontWeight: 600 },
                    secondary: { variant: 'caption' },
                  }}
                />
                <Chip
                  label={r.grade ?? `${r.score}/${r.maxScore}`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: r.score / r.maxScore >= 0.5 ? '#e8f5e9' : '#fdecea',
                    color:   r.score / r.maxScore >= 0.5 ? '#2e7d32' : '#c62828',
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* ── Quick links ── */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Quick Access</Typography>
      <Grid container spacing={2}>
        {[
          { label: 'My Students', icon: <Group />,        path: '/mentor/students',   color: mentorAccent },
          { label: 'Results',     icon: <Assessment />,   path: '/mentor/results',    color: '#2e7d32' },
          { label: 'Attendance',  icon: <ChecklistRtl />, path: '/mentor/attendance', color: '#ed6c02' },
          { label: 'Courses',     icon: <MenuBook />,     path: '/mentor/courses',    color: '#7b1fa2' },
          { label: 'My Profile',  icon: <Person />,       path: '/mentor/profile',    color: '#0288d1' },
        ].map((q) => (
          <Grid item xs={6} sm={4} md={2.4} key={q.label}>
            <QuickCard {...q} navigate={navigate} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
