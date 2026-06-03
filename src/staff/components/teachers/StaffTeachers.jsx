import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip,
  TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Alert, Pagination,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
} from '@mui/material';
import { Search, School } from '@mui/icons-material';

import { getStaffTeachers } from '../../../services/staffService';
import { IMAGE_BASE_URL }   from '../../../config/env';
import PermissionGate       from '../shared/PermissionGate';

const STAFF_PRIMARY = '#00695C';

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const STATUS_COLORS = {
  active:    { bg: '#e8f5e9', color: '#2e7d32' },
  inactive:  { bg: '#fff3e0', color: '#e65100' },
  suspended: { bg: '#fdecea', color: '#c62828' },
  archived:  { bg: '#f5f5f5', color: '#616161' },
};

const EMP_COLORS = {
  'full-time':  { bg: '#e3f2fd', color: '#1565c0' },
  'part-time':  { bg: '#f3e5f5', color: '#6a1b9a' },
  'contract':   { bg: '#fff8e1', color: '#f57f17' },
  'temporary':  { bg: '#fce4ec', color: '#c62828' },
};

function TeachersList() {
  const [teachers, setTeachers] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffTeachers({
        page,
        limit:  LIMIT,
        search: search || undefined,
        status: status || undefined,
      });
      setTeachers(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setError('Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const resetPage = () => setPage(1);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <School sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Teachers</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} teacher{total !== 1 ? 's' : ''} on your campus
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Search name, email, username…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Employment</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subjects</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : teachers.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No teachers found.
                      </TableCell>
                    </TableRow>
                  )
                  : teachers.map((t) => {
                      const sc  = STATUS_COLORS[t.status] ?? STATUS_COLORS.inactive;
                      const ec  = EMP_COLORS[t.employmentType] ?? EMP_COLORS['full-time'];
                      return (
                        <TableRow key={t._id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar src={imgUrl(t.profileImage)} sx={{ width: 32, height: 32, fontSize: 13 }}>
                                {t.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {t.firstName} {t.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  @{t.username}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{t.email ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            {t.employmentType && (
                              <Chip
                                label={t.employmentType}
                                size="small"
                                sx={{ bgcolor: ec.bg, color: ec.color, fontWeight: 600, textTransform: 'capitalize' }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                              {(t.subjects ?? []).slice(0, 3).map((s) => (
                                <Chip key={s._id} label={s.subject_name} size="small" variant="outlined" />
                              ))}
                              {(t.subjects ?? []).length > 3 && (
                                <Chip label={`+${t.subjects.length - 3}`} size="small" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t.status}
                              size="small"
                              sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, textTransform: 'capitalize' }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2.5 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
        </Stack>
      )}
    </Box>
  );
}

export default function StaffTeachers() {
  return (
    <PermissionGate anyOf={['teachers.read', 'teachers.manage']}>
      <TeachersList />
    </PermissionGate>
  );
}
