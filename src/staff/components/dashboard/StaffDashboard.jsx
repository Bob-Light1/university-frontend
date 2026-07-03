import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Grid,
  CircularProgress, Alert, Divider, useTheme,
} from '@mui/material';
import {
  DashboardCustomize, Group, ChecklistRtl,
  Assessment, AdminPanelSettings, Security, School,
} from '@mui/icons-material';

import { useAuth }             from '../../../hooks/useAuth';
import { getStaffDashboard }   from '../../../services/staffService';
import { useAppTranslation }   from '../../../hooks/useAppTranslation';

import { staffPrimary } from '../../../theme/staffTokens';

const STAFF_GRADIENT = 'linear-gradient(135deg, #00695C 0%, #26A69A 100%)';

// Map permission key → staff:perm translation key
const PERM_KEY_MAP = {
  'students.read':       'staff:perm.studentsRead',
  'students.manage':     'staff:perm.studentsManage',
  'teachers.read':       'staff:perm.teachersRead',
  'teachers.manage':     'staff:perm.teachersManage',
  'parents.read':        'staff:perm.parentsRead',
  'parents.manage':      'staff:perm.parentsManage',
  'finance.read':        'staff:perm.financeRead',
  'finance.manage':      'staff:perm.financeManage',
  'schedule.read':       'staff:perm.scheduleRead',
  'schedule.manage':     'staff:perm.scheduleManage',
  'attendance.read':     'staff:perm.attendanceRead',
  'attendance.manage':   'staff:perm.attendanceManage',
  'results.read':        'staff:perm.resultsRead',
  'results.manage':      'staff:perm.resultsManage',
  'courses.read':        'staff:perm.coursesRead',
  'courses.manage':      'staff:perm.coursesManage',
  'documents.read':      'staff:perm.documentsRead',
  'documents.manage':    'staff:perm.documentsManage',
  'examinations.read':   'staff:perm.examinationsRead',
  'examinations.manage': 'staff:perm.examinationsManage',
  'announcements':       'staff:perm.announcements',
  'messages':            'staff:perm.messages',
  'print':               'staff:perm.print',
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
  const { t }                     = useAppTranslation(['staff', 'common']);
  const theme                     = useTheme();
  const [data,    setData]        = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState(null);

  useEffect(() => {
    getStaffDashboard()
      .then((r) => setData(r.data?.data ?? r.data))
      .catch(() => setError(t('staff:dashboard.loadError')))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
                label={t('staff:dashboard.badge')}
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
              />
              <Chip
                icon={<Security sx={{ fontSize: 13, color: 'white !important' }} />}
                label={t('staff:dashboard.permCount', { count: permissions.length })}
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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard label={t('staff:kpi.totalStudents')} value={stats.totalStudents} icon={<Group sx={{ fontSize: 32 }} />} color={staffPrimary(theme.palette.mode)} />
          </Grid>
        )}
        {stats.activeStudents !== undefined && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard label={t('staff:kpi.activeStudents')} value={stats.activeStudents} icon={<Group sx={{ fontSize: 32 }} />} color="#1565C0" />
          </Grid>
        )}
        {stats.attendanceRate !== undefined && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard label={t('staff:kpi.attendanceRate')} value={stats.attendanceRate} suffix="%" icon={<ChecklistRtl sx={{ fontSize: 32 }} />} color="#6A1B9A" />
          </Grid>
        )}
        {stats.publishedResults !== undefined && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard label={t('staff:kpi.publishedResults')} value={stats.publishedResults} icon={<Assessment sx={{ fontSize: 32 }} />} color="#E65100" />
          </Grid>
        )}
        {stats.totalTeachers !== undefined && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard label={t('staff:kpi.teachers')} value={stats.totalTeachers} icon={<School sx={{ fontSize: 32 }} />} color="#00838F" />
          </Grid>
        )}
      </Grid>

      {/* Permissions overview */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Security color="action" />
          <Typography variant="subtitle1" fontWeight={700}>{t('staff:dashboard.yourPermissions')}</Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {permissions.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t('staff:dashboard.noPermissions')}
          </Typography>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {permissions.map((p) => (
              <Chip
                key={p}
                label={PERM_KEY_MAP[p] ? t(PERM_KEY_MAP[p]) : p}
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
