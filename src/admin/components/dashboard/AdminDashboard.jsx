/**
 * @file AdminDashboard.jsx
 * @description Admin / Director portal — platform overview dashboard.
 *
 * Data: GET /campus/all  (paginated, status breakdown computed client-side)
 *       GET /admin/me    (admin profile for greeting)
 */

import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, Button, Avatar, CircularProgress,
  Alert, Skeleton,
} from '@mui/material';
import {
  Business, CheckCircle, Block, AddBusiness,
  ManageAccounts, TrendingUp, Schedule,
} from '@mui/icons-material';

import { getAllCampuses, getAdminMe } from '../../../services/admin_service';
import { useAuth } from '../../../hooks/useAuth';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR = { active: 'success', inactive: 'default', archived: 'error' };

const KpiCard = ({ label, value, icon, color, loading }) => (
  <Paper
    variant="outlined"
    sx={{ p: 2.5, flex: 1, borderRadius: 2, borderLeft: `4px solid ${color}` }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        {loading
          ? <Skeleton width={40} height={36} />
          : <Typography variant="h5" fontWeight={800} sx={{ color }}>{value}</Typography>
        }
      </Box>
      <Box sx={{ color, opacity: 0.55 }}>{icon}</Box>
    </Stack>
  </Paper>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate      = useNavigate();
  const { user }      = useAuth();

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

  // ─── Computed stats ──────────────────────────────────────────────────────────

  const total    = campuses.length;
  const active   = campuses.filter((c) => c.status === 'active').length;
  const inactive = campuses.filter((c) => c.status === 'inactive').length;
  const recent   = [...campuses].slice(0, 5);

  const adminName = profile?.admin_name ?? user?.admin_name ?? 'Admin';
  const role      = profile?.role ?? user?.role ?? 'ADMIN';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      {/* ── Greeting ──────────────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Avatar
          sx={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
            fontWeight: 700, fontSize: '1.2rem',
          }}
        >
          {adminName[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Welcome back, {adminName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {role === 'DIRECTOR' ? 'Director' : 'Platform Administrator'} — wewigo ERP
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* ── KPI cards ─────────────────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
        <KpiCard label="Total Campuses"  value={total}   icon={<Business />}     color="#003285" loading={loading} />
        <KpiCard label="Active"          value={active}  icon={<CheckCircle />}  color="#2e7d32" loading={loading} />
        <KpiCard label="Inactive"        value={inactive} icon={<Block />}       color="#ed6c02" loading={loading} />
        <KpiCard label="Platform Growth" value={`${total} sites`} icon={<TrendingUp />} color="#7b1fa2" loading={loading} />
      </Stack>

      {/* ── Quick actions ─────────────────────────────────────────────────────── */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap" sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddBusiness />}
          onClick={() => navigate('/admin/new-campus')}
          sx={{
            textTransform: 'none', fontWeight: 700, borderRadius: 2,
            background: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
          }}
        >
          New Campus
        </Button>
        <Button
          variant="outlined"
          startIcon={<Business />}
          onClick={() => navigate('/admin/campuses')}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Manage Campuses
        </Button>
        <Button
          variant="outlined"
          startIcon={<ManageAccounts />}
          onClick={() => navigate('/admin/accounts')}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Admin Accounts
        </Button>
      </Stack>

      {/* ── Recent campuses ───────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, pb: 1.5 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Schedule sx={{ color: '#003285', fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700}>Recent Campuses</Typography>
          </Stack>
          <Button
            size="small"
            onClick={() => navigate('/admin/campuses')}
            sx={{ textTransform: 'none', color: '#003285' }}
          >
            View all
          </Button>
        </Stack>
        <Divider />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Campus</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Manager</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : recent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No campuses yet. Create the first one.
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
                        color={STATUS_COLOR[c.status] ?? 'default'}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

    </Box>
  );
}
