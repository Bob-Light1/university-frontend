import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Grid,
  CircularProgress, Alert, Divider, LinearProgress,
} from '@mui/material';
import {
  DashboardCustomize, Group, ChecklistRtl,
  Assessment, AdminPanelSettings, Security, School,
} from '@mui/icons-material';

import { useAuth }             from '../../../hooks/useAuth';
import { getStaffDashboard }   from '../../../services/staffService';

const STAFF_PRIMARY  = '#00695C';
const STAFF_GRADIENT = 'linear-gradient(135deg, #00695C 0%, #26A69A 100%)';

// Permission key → human label
const PERM_LABELS = {
  'students.read':      'View Students',
  'students.manage':    'Manage Students',
  'teachers.read':      'View Teachers',
  'teachers.manage':    'Manage Teachers',
  'parents.read':       'View Parents',
  'parents.manage':     'Manage Parents',
  'finance.read':       'View Finance',
  'finance.manage':     'Manage Finance',
  'schedule.read':      'View Schedule',
  'schedule.manage':    'Manage Schedule',
  'attendance.read':    'View Attendance',
  'attendance.manage':  'Manage Attendance',
  'results.read':       'View Results',
  'results.manage':     'Manage Results',
  'courses.read':       'View Courses',
  'courses.manage':     'Manage Courses',
  'documents.read':     'View Documents',
  'documents.manage':   'Manage Documents',
  'examinations.read':  'View Examinations',
  'examinations.manage':'Manage Examinations',
  'announcements':      'Announcements',
  'messages':           'Messages',
  'print':              'Print',
};

function KpiCard({ label, value, icon, color, suffix }) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: 3, borderLeft: `4px solid ${color}` }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.05em">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color, lineHeight: 1.2, mt: 0.5 }}>
            {value ?? '—'}{suffix}
          </Typography>
        </Box>
        <Box sx={{ color, opacity: 0.7 }}>{icon}</Box>
      </Stack>
    </Paper>
  );
}

export default function StaffDashboard() {
  const { user }                  = useAuth();
  const [data,    setData]        = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState(null);

  useEffect(() => {
    getStaffDashboard()
      .then((r) => setData(r.data?.data ?? r.data))
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;
  }

  const stats       = data?.stats       ?? {};
  const permissions = data?.permissions ?? user?.permissions ?? [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 960, mx: 'auto' }}>

      {/* Hero card */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: STAFF_GRADIENT, color: 'white' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 60, height: 60, borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, fontWeight: 700, flexShrink: 0,
            }}
          >
            {user?.firstName?.[0] ?? user?.name?.[0] ?? '?'}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={800}>{user?.name ?? `${user?.firstName} ${user?.lastName}`}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                icon={<AdminPanelSettings sx={{ fontSize: 13, color: 'white !important' }} />}
                label="Staff"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
              />
              <Chip
                icon={<Security sx={{ fontSize: 13, color: 'white !important' }} />}
                label={`${permissions.length} permissions`}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              />
            </Stack>
          </Box>
          <DashboardCustomize sx={{ fontSize: 48, opacity: 0.3 }} />
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* KPI cards (only show if permission unlocked data) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.totalStudents !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard label="Total Students" value={stats.totalStudents} icon={<Group sx={{ fontSize: 32 }} />} color={STAFF_PRIMARY} />
          </Grid>
        )}
        {stats.activeStudents !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard label="Active Students" value={stats.activeStudents} icon={<Group sx={{ fontSize: 32 }} />} color="#1565C0" />
          </Grid>
        )}
        {stats.attendanceRate !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard label="Attendance Rate" value={stats.attendanceRate} suffix="%" icon={<ChecklistRtl sx={{ fontSize: 32 }} />} color="#6A1B9A" />
          </Grid>
        )}
        {stats.publishedResults !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard label="Published Results" value={stats.publishedResults} icon={<Assessment sx={{ fontSize: 32 }} />} color="#E65100" />
          </Grid>
        )}
        {stats.totalTeachers !== undefined && (
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard label="Teachers" value={stats.totalTeachers} icon={<School sx={{ fontSize: 32 }} />} color="#00838F" />
          </Grid>
        )}
      </Grid>

      {/* Permissions overview */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Security color="action" />
          <Typography variant="subtitle1" fontWeight={700}>Your Permissions</Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {permissions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No permissions assigned. Contact your campus administrator.
          </Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {permissions.map((p) => (
              <Chip
                key={p}
                label={PERM_LABELS[p] ?? p}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
