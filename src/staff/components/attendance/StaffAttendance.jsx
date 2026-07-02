import { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Alert, Pagination, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Skeleton,
  IconButton, Tooltip,
} from '@mui/material';
import { ChecklistRtl, Refresh } from '@mui/icons-material';

import { getStaffAttendance } from '../../../services/staffService';
import { IMAGE_BASE_URL }     from '../../../config/env';
import PermissionGate         from '../shared/PermissionGate';
import usePaginatedList       from '../../../hooks/usePaginatedList';
import { useAppTranslation }  from '../../../hooks/useAppTranslation';

import { staffPrimary } from '../../../theme/staffTokens';

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

// status is Boolean in the model (true = present) + isLate / isJustified flags
const deriveStatus = (r) => {
  if (r.status === true)  return r.isLate ? 'late' : 'present';
  if (r.isJustified)      return 'excused';
  return 'absent';
};

const STATUS_BG = {
  present: { bg: '#e8f5e9', color: '#2e7d32' },
  late:    { bg: '#fff3e0', color: '#e65100' },
  excused: { bg: '#e3f2fd', color: '#1565c0' },
  absent:  { bg: '#fdecea', color: '#c62828' },
};

const ROWS_OPTIONS = [10, 20, 50, 100];

function AttendanceList() {
  const { t, i18n } = useAppTranslation(['attendance', 'common']);

  const [status,   setStatus]   = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [limit,    setLimit]    = useState(20);

  const fetcher = useCallback(
    (page) => getStaffAttendance({
      page, limit,
      status:  status   || undefined,
      from:    fromDate || undefined,
      to:      toDate   || undefined,
    }),
    [limit, status, fromDate, toDate],
  );

  const {
    items: records, total, page, setPage, loading, error, refresh,
  } = usePaginatedList(fetcher);

  const totalPages  = Math.ceil(total / limit);
  const rangeStart  = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd    = Math.min(page * limit, total);

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const handleFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      {/* ── Header ── */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <ChecklistRtl sx={(t) => ({ color: staffPrimary(t.palette.mode), fontSize: 28 })} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800}>{t('attendance:title')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('attendance:campus')}</Typography>
        </Box>
        <Tooltip title={t('common:action.refresh')}>
          <IconButton onClick={refresh} size="small" disabled={loading}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── Filters ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('attendance:filter.status')}</InputLabel>
          <Select value={status} label={t('attendance:filter.status')} onChange={handleFilter(setStatus)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('common:all')}</MenuItem>
            <MenuItem value="present">{t('attendance:status.present')}</MenuItem>
            <MenuItem value="absent">{t('attendance:status.absent')}</MenuItem>
            <MenuItem value="late">{t('attendance:status.late')}</MenuItem>
            <MenuItem value="excused">{t('attendance:status.excused')}</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small" label={t('attendance:filter.from')} type="date" value={fromDate}
          onChange={handleFilter(setFromDate)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small" label={t('attendance:filter.to')} type="date" value={toDate}
          onChange={handleFilter(setToDate)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Table ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>{t('attendance:col.student')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('attendance:col.class')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('attendance:col.date')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('attendance:col.session')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('attendance:filter.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : records.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {t('attendance:noRecords')}
                      </TableCell>
                    </TableRow>
                  )
                  : records.map((r) => {
                      const derived = deriveStatus(r);
                      const sc      = STATUS_BG[derived];
                      return (
                        <TableRow key={r._id} hover sx={{ bgcolor: sc.bg + '22' }}>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar src={imgUrl(r.student?.profileImage)} sx={{ width: 30, height: 30, fontSize: 12 }}>
                                {r.student?.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {r.student?.firstName} {r.student?.lastName}
                                </Typography>
                                {r.student?.matricule && (
                                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                    {r.student.matricule}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{r.class?.className ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{fmtDate(r.attendanceDate)}</Typography>
                            {r.sessionStartTime && (
                              <Typography variant="caption" color="text.secondary">
                                {r.sessionStartTime}{r.sessionEndTime ? ` – ${r.sessionEndTime}` : ''}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{r.semester ?? '—'}</Typography>
                            {r.academicYear && (
                              <Typography variant="caption" color="text.secondary" display="block">{r.academicYear}</Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Stack spacing={0.5} alignItems="center">
                              <Chip
                                label={t(`attendance:status.${derived}`)}
                                size="small"
                                sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, minWidth: 70 }}
                              />
                              {derived === 'excused' && r.justification && (
                                <Tooltip title={r.justification}>
                                  <Typography variant="caption" color="text.secondary" sx={{ cursor: 'help', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                    {r.justification}
                                  </Typography>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ── Footer ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ mt: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small">
            <Select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} sx={{ borderRadius: 2, fontSize: 13 }}>
              {ROWS_OPTIONS.map((n) => <MenuItem key={n} value={n}>{t('common:perPage', { count: n })}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {total === 0 ? t('attendance:noRecords') : t('common:range', { start: rangeStart, end: rangeEnd, total })}
          </Typography>
        </Stack>
        {totalPages > 1 && (
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        )}
      </Stack>
    </Box>
  );
}

export default function StaffAttendance() {
  return (
    <PermissionGate anyOf={['attendance.read', 'attendance.manage']}>
      <AttendanceList />
    </PermissionGate>
  );
}
