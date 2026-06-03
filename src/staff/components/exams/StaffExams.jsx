import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip,
  MenuItem, Select, FormControl, InputLabel,
  Alert, Pagination, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Skeleton,
} from '@mui/material';
import { LibraryBooks } from '@mui/icons-material';

import { getStaffExaminations } from '../../../services/staffService';
import PermissionGate            from '../shared/PermissionGate';

const STAFF_PRIMARY = '#00695C';

const STATUS_COLORS = {
  SCHEDULED:  { bg: '#e3f2fd', color: '#1565c0' },
  ONGOING:    { bg: '#e8f5e9', color: '#2e7d32' },
  COMPLETED:  { bg: '#f5f5f5', color: '#616161' },
  DRAFT:      { bg: '#fff8e1', color: '#f57f17' },
  POSTPONED:  { bg: '#fff3e0', color: '#e65100' },
  CANCELLED:  { bg: '#fdecea', color: '#c62828' },
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return `${y}-${y + 1}`;
});

function ExamsList() {
  const [exams,    setExams]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [year,     setYear]     = useState('');
  const [semester, setSemester] = useState('');
  const [status,   setStatus]   = useState('');

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffExaminations({
        page,
        limit:        LIMIT,
        academicYear: year     || undefined,
        semester:     semester || undefined,
        status:       status   || undefined,
      });
      setExams(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setError('Failed to load examinations.');
    } finally {
      setLoading(false);
    }
  }, [page, year, semester, status]);

  useEffect(() => { load(); }, [load]);

  const resetPage = () => setPage(1);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <LibraryBooks sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Examinations</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} session{total !== 1 ? 's' : ''} on your campus
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Academic Year</InputLabel>
          <Select value={year} label="Academic Year" onChange={(e) => { setYear(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All years</MenuItem>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Semester</InputLabel>
          <Select value={semester} label="Semester" onChange={(e) => { setSemester(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="S1">S1</MenuItem>
            <MenuItem value="S2">S2</MenuItem>
            <MenuItem value="Annual">Annual</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="SCHEDULED">Scheduled</MenuItem>
            <MenuItem value="ONGOING">Ongoing</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
            <MenuItem value="POSTPONED">Postponed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Academic Year</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Start</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>End</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : exams.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No examination sessions found.
                      </TableCell>
                    </TableRow>
                  )
                  : exams.map((e) => {
                      const sc = STATUS_COLORS[e.status] ?? { bg: '#f5f5f5', color: '#616161' };
                      return (
                        <TableRow key={e._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{e.name ?? e.title ?? `Session ${e.reference ?? ''}`}</Typography>
                            {e.venue && (
                              <Typography variant="caption" color="text.secondary">{e.venue}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{e.academicYear ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{e.semester ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{fmtDate(e.startTime)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{fmtDate(e.endTime)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={e.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }} />
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

export default function StaffExams() {
  return (
    <PermissionGate permission="examinations.read">
      <ExamsList />
    </PermissionGate>
  );
}
