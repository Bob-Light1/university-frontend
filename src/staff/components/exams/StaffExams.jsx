import { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip,
  MenuItem, Select, FormControl, InputLabel,
  Alert, Pagination, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Skeleton,
  IconButton, Tooltip,
} from '@mui/material';
import { LibraryBooks, Refresh } from '@mui/icons-material';

import { getStaffExaminations } from '../../../services/staffService';
import PermissionGate            from '../shared/PermissionGate';
import usePaginatedList          from '../../../hooks/usePaginatedList';
import { useAppTranslation }     from '../../../hooks/useAppTranslation';

import { staffPrimary } from '../../../theme/staffTokens';

const STATUS_BG = {
  SCHEDULED: { bg: '#e3f2fd', color: '#1565c0' },
  ONGOING:   { bg: '#e8f5e9', color: '#2e7d32' },
  COMPLETED: { bg: '#f5f5f5', color: '#616161' },
  DRAFT:     { bg: '#fff8e1', color: '#f57f17' },
  POSTPONED: { bg: '#fff3e0', color: '#e65100' },
  CANCELLED: { bg: '#fdecea', color: '#c62828' },
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return `${y}-${y + 1}`;
});

const ROWS_OPTIONS = [10, 20, 50, 100];

function ExamsList() {
  const { t, i18n } = useAppTranslation(['examination', 'common']);

  const [year,     setYear]     = useState('');
  const [semester, setSemester] = useState('');
  const [status,   setStatus]   = useState('');
  const [limit,    setLimit]    = useState(20);

  const fetcher = useCallback(
    (page) => getStaffExaminations({
      page, limit,
      academicYear: year     || undefined,
      semester:     semester || undefined,
      status:       status   || undefined,
    }),
    [limit, year, semester, status],
  );

  const {
    items: exams, total, page, setPage, loading, error, refresh,
  } = usePaginatedList(fetcher);

  const totalPages = Math.ceil(total / limit);
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);
  const handleFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleString(i18n.language, {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }) : '—';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <LibraryBooks sx={(t) => ({ color: staffPrimary(t.palette.mode), fontSize: 28 })} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800}>{t('common:nav.examinations')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('common:onCampus.sessions', { count: total })}
          </Typography>
        </Box>
        <Tooltip title={t('common:action.refresh')}>
          <IconButton onClick={refresh} size="small" disabled={loading}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('examination:academicYear')}</InputLabel>
          <Select value={year} label={t('examination:academicYear')} onChange={handleFilter(setYear)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('examination:allYears')}</MenuItem>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>{t('examination:semester')}</InputLabel>
          <Select value={semester} label={t('examination:semester')} onChange={handleFilter(setSemester)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('common:all')}</MenuItem>
            <MenuItem value="S1">S1</MenuItem>
            <MenuItem value="S2">S2</MenuItem>
            <MenuItem value="Annual">Annual</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('common:field.status')}</InputLabel>
          <Select value={status} label={t('common:field.status')} onChange={handleFilter(setStatus)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('common:all')}</MenuItem>
            {['DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'POSTPONED', 'CANCELLED'].map((s) => (
              <MenuItem key={s} value={s}>{t(`common:status.${s.toLowerCase()}`)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>{t('examination:col.session')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('examination:col.academicYear')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('examination:col.semester')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('examination:col.start')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('examination:col.end')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('examination:col.status')}</TableCell>
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
                        {t('examination:noSessions')}
                      </TableCell>
                    </TableRow>
                  )
                  : exams.map((e) => {
                      const sc = STATUS_BG[e.status] ?? { bg: '#f5f5f5', color: '#616161' };
                      return (
                        <TableRow key={e._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{e.name ?? e.title ?? `Session ${e.reference ?? ''}`}</Typography>
                            {e.venue && <Typography variant="caption" color="text.secondary">{e.venue}</Typography>}
                          </TableCell>
                          <TableCell><Typography variant="body2">{e.academicYear ?? '—'}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{e.semester ?? '—'}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{fmtDate(e.startTime)}</Typography></TableCell>
                          <TableCell><Typography variant="body2">{fmtDate(e.endTime)}</Typography></TableCell>
                          <TableCell>
                            <Chip
                              label={t(`common:status.${e.status?.toLowerCase() ?? 'draft'}`)}
                              size="small"
                              sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ mt: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small">
            <Select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} sx={{ borderRadius: 2, fontSize: 13 }}>
              {ROWS_OPTIONS.map((n) => <MenuItem key={n} value={n}>{t('common:perPage', { count: n })}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {total === 0 ? t('examination:noSessions') : t('common:range', { start: rangeStart, end: rangeEnd, total })}
          </Typography>
        </Stack>
        {totalPages > 1 && (
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        )}
      </Stack>
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
