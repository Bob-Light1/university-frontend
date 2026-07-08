/**
 * @file MentorStudents.jsx
 * @description Read-only list of the mentor's assigned students.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip,
  TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Alert, Pagination,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Search, Group } from '@mui/icons-material';

import { getMyStudents } from '../../../services/mentorService';
import { IMAGE_BASE_URL } from '../../../config/env';
import { mentorPrimary } from '../../../theme/mentorTokens';
import { statusTint } from '../../../theme/statusTokens';

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

/** Student status → semantic hue. */
const STATUS_HUE = {
  active:    'success',
  inactive:  'warning',
  suspended: 'error',
  archived:  'neutral',
};

export default function MentorStudents() {
  const { palette: { mode } } = useTheme();
  const [students, setStudents] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [status,   setStatus]   = useState('');

  const LIMIT = 15;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyStudents({ page, limit: LIMIT, search: search || undefined, status: status || undefined });
      setStudents(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setError('Failed to load students.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Group sx={(t) => ({ color: mentorPrimary(t.palette.mode), fontSize: 28 })} />
        <Box>
          <Typography variant="h5" fontWeight={800}>My Students</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} student{total !== 1 ? 's' : ''} assigned to you
          </Typography>
        </Box>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          placeholder="Search name, email, matricule…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            sx={{ borderRadius: 2 }}
          >
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
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Matricule</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : students.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No students found.
                      </TableCell>
                    </TableRow>
                  )
                  : students.map((s) => {
                    const sc = statusTint(mode, STATUS_HUE[s.status] ?? STATUS_HUE.inactive);
                    return (
                      <TableRow key={s._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar src={imgUrl(s.profileImage)} sx={{ width: 32, height: 32, fontSize: 13 }}>
                              {s.firstName?.[0]}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {s.firstName} {s.lastName}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">{s.matricule ?? '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{s.studentClass?.className ?? '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">{s.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={s.status}
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
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
}
