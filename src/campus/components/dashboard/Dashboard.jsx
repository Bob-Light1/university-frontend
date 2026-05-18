import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Assignment,
  CalendarMonth,
  Class,
  Edit,
  Email,
  EmojiEvents,
  FactCheck,
  LibraryBooks,
  LocationOn,
  MenuBook,
  People,
  Phone,
  Refresh,
  School,
  SupervisorAccount,
  TrendingDown,
  Warning,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../../../api/axiosInstance';
import { IMAGE_BASE_URL } from '../../../config/env';
import EditCampusModal from './EditCampusModal';

// ─── Status chip color map ────────────────────────────────────────────────────

const STATUS_COLOR = {
  active:   'success',
  inactive: 'warning',
  archived: 'error',
};

// ─── Module definitions (built once per campusId) ─────────────────────────────

const buildModules = (campusId) => [
  { id: 1, name: 'Class Management', type: 'Academic',   path: `/campus/${campusId}/classes`,     Icon: Class,             color: '#4989c8', description: 'Manage classes and levels'       },
  { id: 2, name: 'Schedule',         type: 'Academic',   path: `/campus/${campusId}/schedule`,    Icon: CalendarMonth,     color: '#4989c8', description: 'Class timetables'               },
  { id: 3, name: 'Subjects & Units', type: 'Academic',   path: `/campus/${campusId}/subjects`,    Icon: MenuBook,          color: '#4989c8', description: 'Course curriculum'              },
  { id: 4, name: 'Courses Catalog',  type: 'Academic',   path: `/campus/${campusId}/courses`,     Icon: LibraryBooks,      color: '#14b8a6', description: 'Global academic courses'        },
  { id: 5, name: 'Exams & Grades',   type: 'Evaluation', path: `/campus/${campusId}/examination`, Icon: Assignment,        color: '#f59e0b', description: 'Assessment management'         },
  { id: 6, name: 'Student Reports',  type: 'Evaluation', path: `/campus/${campusId}/results`,     Icon: EmojiEvents,       color: '#f59e0b', description: 'Academic transcripts'          },
  { id: 7, name: 'Student Register', type: 'Users',      path: `/campus/${campusId}/students`,    Icon: People,            color: '#10b981', description: 'Student database'              },
  { id: 8, name: 'Teaching Staff',   type: 'Users',      path: `/campus/${campusId}/teachers`,    Icon: SupervisorAccount, color: '#10b981', description: 'Faculty members'               },
  { id: 9, name: 'Attendance',       type: 'Management', path: `/campus/${campusId}/attendance`,  Icon: FactCheck,         color: '#6366f1', description: 'Daily attendance tracking'     },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CampusDashboard() {
  const { campusId } = useParams();
  const navigate     = useNavigate();

  const [campus,     setCampus]     = useState(null);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [modalOpen,  setModalOpen]  = useState(false);

  // ── Modules (stable as long as campusId doesn't change) ──────────────────
  const modules = useMemo(() => buildModules(campusId), [campusId]);

  // ── KPI cards (rebuilt when stats arrives) ────────────────────────────────
  const kpis = useMemo(() => [
    {
      label:    'Classes',
      value:    stats?.classes?.total ?? 0,
      icon:     <School />,
      color:    '#4989c8',
      subtitle: `${stats?.classes?.active ?? 0} active`,
    },
    {
      label:    'Students',
      value:    stats?.students?.total ?? 0,
      icon:     <People />,
      color:    '#10b981',
      subtitle: `${stats?.students?.newThisMonth ?? 0} new this month`,
    },
    {
      label:    'Teachers',
      value:    stats?.teachers?.total ?? 0,
      icon:     <SupervisorAccount />,
      color:    '#f59e0b',
      subtitle: `${stats?.teachers?.newThisMonth ?? 0} new this month`,
    },
    {
      label:    'Absence Rate',
      value:    `${(stats?.avgAbsenceRate ?? 0).toFixed(1)}%`,
      icon:     <TrendingDown />,
      color:    (stats?.avgAbsenceRate ?? 0) > 10 ? '#ef4444' : '#6366f1',
      subtitle: 'Campus average',
    },
    {
      label:    'Payment Alerts',
      value:    stats?.paymentAlerts ?? 0,
      icon:     <Warning />,
      color:    (stats?.paymentAlerts ?? 0) > 0 ? '#ef4444' : '#94a3b8',
      subtitle: 'Pending payments',
    },
  ], [stats]);

  // ── Data fetch (reusable for initial load and manual refresh) ─────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!/^[0-9a-fA-F]{24}$/.test(campusId)) {
      setError('Invalid campus ID');
      setLoading(false);
      return;
    }

    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const [campusRes, statsRes] = await Promise.all([
        api.get(`/campus/${campusId}`),
        api.get(`/campus/${campusId}/dashboard`),
      ]);

      if (campusRes.data.success) setCampus(campusRes.data.data);
      if (statsRes.data.success)  setStats(statsRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, [campusId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Profile image URL ─────────────────────────────────────────────────────
  const profileImageUrl = campus?.campus_image
    ? campus.campus_image.startsWith('http')
      ? campus.campus_image
      : `${IMAGE_BASE_URL}/uploads/campuses/${campus.campus_image}`
    : null;

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={48} width={320} sx={{ borderRadius: 2, mb: 4 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 3 }}>
            <Skeleton variant="rectangular" height={460} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid size={{ xs: 12, lg: 9 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {[...Array(5)].map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Skeleton variant="rectangular" height={104} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
            <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // ── Error / no data ───────────────────────────────────────────────────────
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      </Container>
    );
  }

  if (!campus) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>Campus data not found</Alert>
      </Container>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 3 } }}>

      {/* ── Page header ── */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: { xs: 2, md: 4 } }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            color="#2c3e50"
            sx={{ fontSize: { xs: '1.4rem', sm: '2rem', md: '2.125rem' } }}
          >
            {campus.campus_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Campus Dashboard
          </Typography>
        </Box>

        <Tooltip title="Refresh data">
          <IconButton
            onClick={() => fetchData(true)}
            disabled={refreshing}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 2, mt: 0.5 }}
          >
            {refreshing ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>
        </Tooltip>
      </Stack>

      <Grid container spacing={3}>

        {/* ── KPIs + Modules — first on mobile via order ── */}
        <Grid size={{ xs: 12, lg: 9 }} sx={{ order: { xs: 1, lg: 2 } }}>
          <Stack spacing={3}>

            {/* KPI cards */}
            <Grid container spacing={2}>
              {kpis.map((kpi, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
                  <Card sx={{
                    borderRadius: 3,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    height: '100%',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' },
                  }}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: `${kpi.color}15`,
                          color: kpi.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {kpi.icon}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                            {kpi.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {kpi.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {kpi.subtitle}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Modules grid */}
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Campus Modules
              </Typography>
              <Grid container spacing={2}>
                {modules.map((mod) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={mod.id}>
                    <Card
                      variant="outlined"
                      onClick={() => navigate(mod.path)}
                      sx={{
                        borderRadius: 3,
                        borderLeft: `4px solid ${mod.color}`,
                        cursor: 'pointer',
                        height: '100%',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          borderColor: mod.color,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Box sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: `${mod.color}15`,
                            color: mod.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            <mod.Icon />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                              {mod.name}
                            </Typography>
                            <Chip
                              label={mod.type}
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600, mb: 0.5 }}
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                              {mod.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

          </Stack>
        </Grid>

        {/* ── Campus profile card — after content on mobile ── */}
        <Grid size={{ xs: 12, lg: 3 }} sx={{ order: { xs: 2, lg: 1 } }}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', height: '100%' }}>
            <Box sx={{
              height: 120,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }} />
            <CardContent sx={{ mt: -7, position: 'relative' }}>

              <Avatar
                src={profileImageUrl}
                alt={campus.campus_name}
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  border: '4px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem',
                }}
              >
                {!campus.campus_image && campus.campus_name?.charAt(0)}
              </Avatar>

              <Typography variant="h6" align="center" fontWeight={600} sx={{ mb: 1 }}>
                {campus.campus_name}
              </Typography>

              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Chip
                  label={campus.status || 'active'}
                  color={STATUS_COLOR[campus.status] || 'default'}
                  size="small"
                  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={2}>
                <InfoRow icon={<SupervisorAccount color="action" />} label="Manager"  value={campus.manager_name} />
                <InfoRow icon={<Email           color="action" />} label="Email"    value={campus.email} />
                {campus.manager_phone && (
                  <InfoRow icon={<Phone         color="action" />} label="Phone"    value={campus.manager_phone} />
                )}
                {campus.location?.city && (
                  <InfoRow
                    icon={<LocationOn color="action" />}
                    label="Location"
                    value={`${campus.location.city}, ${campus.location.country || 'Cameroon'}`}
                  />
                )}
              </Stack>

              <Button
                fullWidth
                startIcon={<Edit />}
                variant="contained"
                onClick={() => setModalOpen(true)}
                sx={{ mt: 3, borderRadius: 2, textTransform: 'none', py: 1.2, fontWeight: 600 }}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      <EditCampusModal
        open={modalOpen}
        handleClose={() => setModalOpen(false)}
        campusData={campus}
        onUpdate={setCampus}
      />
    </Container>
  );
}

// ─── InfoRow — profile card info line ────────────────────────────────────────

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Box sx={{ mt: 0.5, flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}
