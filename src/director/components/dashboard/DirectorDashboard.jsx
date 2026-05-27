/**
 * @file DirectorDashboard.jsx
 * @description Director portal — platform overview dashboard (read-only).
 *
 * Data: GET /campus/all  (status breakdown computed client-side)
 *       GET /admin/me    (director profile for greeting)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Button, Avatar, Skeleton,
  Alert, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Business, CheckCircle, Block, TrendingUp,
  Schedule, Visibility,
} from '@mui/icons-material';

import { getAllCampuses, getAdminMe } from '../../../services/admin_service';
import { useAuth } from '../../../hooks/useAuth';
import {
  DIRECTOR_PRIMARY, DIRECTOR_GRADIENT, CAMPUS_STATUS_COLOR,
} from '../../../theme/directorTokens';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, color, loading }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2.5, flex: 1, borderRadius: 2, borderLeft: `4px solid ${color}`,
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: 3 },
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
        {loading
          ? <Skeleton width={40} height={36} />
          : <Typography variant="h5" fontWeight={700} sx={{ color, lineHeight: 1.2, mt: 0.25 }}>{value}</Typography>
        }
      </Box>
      <Box sx={{ color, opacity: 0.55 }}>{icon}</Box>
    </Stack>
  </Paper>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function DirectorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [campuses, setCampuses] = useState([]);
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [campusRes, meRes] = await Promise.all([
          getAllCampuses({ limit: 50 }),
          getAdminMe(),
        ]);
        setCampuses(Array.isArray(campusRes.data?.data) ? campusRes.data.data : []);
        setProfile(meRes.data?.data ?? meRes.data);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const total    = campuses.length;
  const active   = campuses.filter((c) => c.status === 'active').length;
  const inactive = campuses.filter((c) => c.status === 'inactive').length;
  const recent   = [...campuses].slice(0, 5);

  const directorName = profile?.admin_name ?? user?.admin_name ?? 'Director';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      {/* ── Greeting ──────────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Avatar
          sx={{
            width: 52, height: 52,
            background: DIRECTOR_GRADIENT,
            fontWeight: 700, fontSize: '1.2rem',
          }}
        >
          {directorName[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Welcome back, {directorName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Director — wewigo ERP
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* ── KPI cards ─────────────────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
        <KpiCard label="Total Campuses"  value={total}            icon={<Business />}    color={DIRECTOR_PRIMARY}              loading={loading} />
        <KpiCard label="Active"          value={active}           icon={<CheckCircle />} color={theme.palette.success.dark}    loading={loading} />
        <KpiCard label="Inactive"        value={inactive}         icon={<Block />}       color={theme.palette.warning.main}    loading={loading} />
        <KpiCard label="Platform Reach"  value={`${total} sites`} icon={<TrendingUp />}  color={theme.palette.secondary.dark}  loading={loading} />
      </Stack>

      {/* ── Recent campuses ───────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, pb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Schedule sx={{ color: DIRECTOR_PRIMARY, fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700}>Recent Campuses</Typography>
          </Stack>
          <Button
            size="small"
            onClick={() => navigate('/director/campuses')}
            sx={{ textTransform: 'none', color: DIRECTOR_PRIMARY }}
          >
            View all
          </Button>
        </Stack>
        <Divider />

        {/* Desktop table */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Campus</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Manager</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 700 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No campuses on the platform yet.
                  </TableCell>
                </TableRow>
              ) : (
                recent.map((c) => (
                  <TableRow key={c._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{c.campus_name}</Typography>
                      {c.campus_number && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {c.campus_number}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{c.manager_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {[c.location?.city, c.location?.country].filter(Boolean).join(', ') || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        color={CAMPUS_STATUS_COLOR[c.status] ?? 'default'}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Visibility sx={{ fontSize: '0.9rem' }} />}
                        onClick={() => navigate(`/campus/${c._id}`)}
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile list */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 1.5 }}>
          {loading ? (
            <Stack spacing={1}>
              {[1, 2, 3].map((k) => <Skeleton key={k} variant="rounded" height={72} />)}
            </Stack>
          ) : recent.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              No campuses yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {recent.map((c) => (
                <Stack
                  key={c._id}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{
                    p: 1.5, borderRadius: 2,
                    border: '1px solid', borderColor: 'divider',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => navigate(`/campus/${c._id}`)}
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: DIRECTOR_PRIMARY, fontSize: '0.85rem' }}>
                    <Business sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, mr: 1 }}>
                        {c.campus_name}
                      </Typography>
                      <Chip
                        label={c.status}
                        color={CAMPUS_STATUS_COLOR[c.status] ?? 'default'}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {c.manager_name}
                      {c.location?.city ? ` · ${c.location.city}` : ''}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </Paper>

    </Box>
  );
}
