/**
 * @file MentorAttendance.jsx
 * @description Read-only attendance records for the mentor's assigned classes/students.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip,
  TextField, MenuItem, Select,
  FormControl, InputLabel, Alert, Pagination,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ChecklistRtl } from '@mui/icons-material';

import { getMyAttendance } from '../../../services/mentorService';
import { IMAGE_BASE_URL } from '../../../config/env';
import { mentorPrimary } from '../../../theme/mentorTokens';
import { statusTint } from '../../../theme/statusTokens';

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

/** Attendance status → semantic hue. */
const STATUS_HUE = {
  present: 'success',
  absent:  'error',
  late:    'warning',
  excused: 'info',
};

export default function MentorAttendance() {
  const { palette: { mode } } = useTheme();
  const [records, setRecords] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [status,  setStatus]  = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');

  const LIMIT = 15;

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page, limit: LIMIT,
        status:  status  || undefined,
        from:    fromDate || undefined,
        to:      toDate   || undefined,
      };
      const res = await getMyAttendance(params);
      setRecords(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setError('Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  }, [page, status, fromDate, toDate]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const totalPages = Math.ceil(total / LIMIT);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <ChecklistRtl sx={(t) => ({ color: mentorPrimary(t.palette.mode), fontSize: 28 })} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Attendance</Typography>
          <Typography variant="body2" color="text.secondary">
            Attendance records for your assigned classes (read-only)
          </Typography>
        </Box>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="present">Present</MenuItem>
            <MenuItem value="absent">Absent</MenuItem>
            <MenuItem value="late">Late</MenuItem>
            <MenuItem value="excused">Excused</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="From"
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          label="To"
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}><Skeleton /></TableCell>
                      ))}
                    </TableRow>
                  ))
                : records.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  )
                  : records.map((r) => {
                    const sc = statusTint(mode, STATUS_HUE[r.status] ?? STATUS_HUE.absent);
                    return (
                      <TableRow key={r._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar src={imgUrl(r.student?.profileImage)} sx={{ width: 30, height: 30, fontSize: 12 }}>
                              {r.student?.firstName?.[0]}
                            </Avatar>
                            <Typography variant="body2" fontWeight={600}>
                              {r.student?.firstName} {r.student?.lastName}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{r.class?.className ?? '—'}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{fmtDate(r.attendanceDate)}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={r.status}
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
