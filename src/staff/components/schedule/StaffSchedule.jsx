import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Alert, Pagination, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Skeleton,
} from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';

import { getStaffSchedule } from '../../../services/staffService';
import PermissionGate        from '../shared/PermissionGate';

const STAFF_PRIMARY = '#00695C';

const STATUS_COLORS = {
  PUBLISHED:  { bg: '#e8f5e9', color: '#2e7d32' },
  DRAFT:      { bg: '#f5f5f5', color: '#616161' },
  CANCELLED:  { bg: '#fdecea', color: '#c62828' },
  POSTPONED:  { bg: '#fff3e0', color: '#e65100' },
  COMPLETED:  { bg: '#e3f2fd', color: '#1565c0' },
};

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

function ScheduleList() {
  const [sessions, setSessions] = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [status,   setStatus]   = useState('');

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffSchedule({
        page,
        limit:  LIMIT,
        from:   fromDate || undefined,
        to:     toDate   || undefined,
        status: status   || undefined,
      });
      setSessions(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setError('Failed to load schedule.');
    } finally {
      setLoading(false);
    }
  }, [page, fromDate, toDate, status]);

  useEffect(() => { load(); }, [load]);

  const resetPage = () => setPage(1);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <CalendarMonth sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Schedule</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} session{total !== 1 ? 's' : ''} on your campus
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
        <TextField
          size="small" type="date" label="From"
          value={fromDate} onChange={(e) => { setFromDate(e.target.value); resetPage(); }}
          sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small" type="date" label="To"
          value={toDate} onChange={(e) => { setToDate(e.target.value); resetPage(); }}
          sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="PUBLISHED">Published</MenuItem>
            <MenuItem value="DRAFT">Draft</MenuItem>
            <MenuItem value="POSTPONED">Postponed</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
            <MenuItem value="COMPLETED">Completed</MenuItem>
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
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class(es)</TableCell>
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
                : sessions.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No sessions found.
                      </TableCell>
                    </TableRow>
                  )
                  : sessions.map((s) => {
                      const sc = STATUS_COLORS[s.status] ?? { bg: '#f5f5f5', color: '#616161' };
                      return (
                        <TableRow key={s._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{s.name ?? s.title ?? '—'}</Typography>
                            {s.sessionType && (
                              <Typography variant="caption" color="text.secondary">{s.sessionType}</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{s.subject?.subject_name ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                              {(s.classes ?? []).slice(0, 2).map((c, i) => (
                                <Chip key={i} label={c.className ?? c} size="small" variant="outlined" />
                              ))}
                              {(s.classes ?? []).length > 2 && (
                                <Chip label={`+${s.classes.length - 2}`} size="small" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{fmtDate(s.startTime)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{fmtDate(s.endTime)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={s.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }} />
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

export default function StaffSchedule() {
  return (
    <PermissionGate anyOf={['schedule.read', 'schedule.manage']}>
      <ScheduleList />
    </PermissionGate>
  );
}
