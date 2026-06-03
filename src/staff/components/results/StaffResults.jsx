import { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip,
  TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Alert, Pagination,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, IconButton, Tooltip,
} from '@mui/material';
import { Search, Assessment, Refresh } from '@mui/icons-material';

import { getStaffResults }   from '../../../services/staffService';
import { IMAGE_BASE_URL }    from '../../../config/env';
import PermissionGate        from '../shared/PermissionGate';
import usePaginatedList      from '../../../hooks/usePaginatedList';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

const STAFF_PRIMARY = '#00695C';

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const gradeColor = (score, max) => {
  if (!max) return {};
  const pct = score / max;
  if (pct >= 0.75) return { bg: '#e8f5e9', color: '#2e7d32' };
  if (pct >= 0.50) return { bg: '#fff3e0', color: '#e65100' };
  return { bg: '#fdecea', color: '#c62828' };
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return `${y}-${y + 1}`;
});

const ROWS_OPTIONS = [10, 20, 50, 100];

function ResultsList() {
  const { t } = useAppTranslation(['results', 'common']);

  const [search,   setSearch]   = useState('');
  const [semester, setSemester] = useState('');
  const [year,     setYear]     = useState('');
  const [evalType, setEvalType] = useState('');
  const [limit,    setLimit]    = useState(20);

  const fetcher = useCallback(
    (page) => getStaffResults({
      page, limit,
      academicYear:   year     || undefined,
      semester:       semester || undefined,
      evaluationType: evalType || undefined,
    }),
    [limit, year, semester, evalType],
  );

  const {
    items: results, total, page, setPage, loading, error, refresh,
  } = usePaginatedList(fetcher);

  const totalPages = Math.ceil(total / limit);
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);
  const handleFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const displayed = search
    ? results.filter((r) => {
        const name = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();
        const subj = (r.subject?.subject_name ?? '').toLowerCase();
        const mat  = (r.student?.matricule ?? '').toLowerCase();
        const q    = search.toLowerCase();
        return name.includes(q) || subj.includes(q) || mat.includes(q);
      })
    : results;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Assessment sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800}>{t('common:nav.results')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('common:onCampus.results', { count: total })}
          </Typography>
        </Box>
        <Tooltip title={t('common:action.refresh')}>
          <IconButton onClick={refresh} size="small" disabled={loading}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
        <TextField
          size="small"
          placeholder={t('results:filterStudent')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 2, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('results:transcript.academicYear')}</InputLabel>
          <Select value={year} label={t('results:transcript.academicYear')} onChange={handleFilter(setYear)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('results:allYears')}</MenuItem>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>{t('results:transcript.semester')}</InputLabel>
          <Select value={semester} label={t('results:transcript.semester')} onChange={handleFilter(setSemester)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('common:all')}</MenuItem>
            <MenuItem value="S1">S1</MenuItem>
            <MenuItem value="S2">S2</MenuItem>
            <MenuItem value="Annual">Annual</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('results:evaluationType.allTypes', { defaultValue: 'Eval. Type' })}</InputLabel>
          <Select value={evalType} label="Eval. Type" onChange={handleFilter(setEvalType)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('results:evaluationType.allTypes')}</MenuItem>
            {['CC', 'EXAM', 'RETAKE', 'PROJECT', 'PRACTICAL'].map((et) => (
              <MenuItem key={et} value={et}>{t(`results:evaluationType.${et}`)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>{t('results:col.student')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('results:col.subject')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('results:col.evaluation')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('results:col.semester')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('results:col.score')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('results:col.outOf20')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : displayed.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {t('results:noResults')}
                      </TableCell>
                    </TableRow>
                  )
                  : displayed.map((r) => {
                      const gc   = gradeColor(r.score, r.maxScore);
                      const norm = r.normalizedScore ?? (r.maxScore ? +((r.score / r.maxScore) * 20).toFixed(2) : null);
                      return (
                        <TableRow key={r._id} hover>
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
                            <Typography variant="body2">{r.subject?.subject_name ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{r.evaluationTitle ?? '—'}</Typography>
                            {r.evaluationType && (
                              <Chip
                                label={t(`results:evaluationType.${r.evaluationType}`, { defaultValue: r.evaluationType })}
                                size="small"
                                sx={{ mt: 0.3, height: 16, fontSize: 10 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{r.semester ?? '—'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {r.score ?? '—'}/{r.maxScore ?? '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {norm !== null && (
                              <Chip label={norm} size="small" sx={{ bgcolor: gc.bg, color: gc.color, fontWeight: 700, minWidth: 44 }} />
                            )}
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
            {total === 0 ? t('results:noResults') : t('common:range', { start: rangeStart, end: rangeEnd, total })}
          </Typography>
        </Stack>
        {totalPages > 1 && (
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        )}
      </Stack>
    </Box>
  );
}

export default function StaffResults() {
  return (
    <PermissionGate anyOf={['results.read', 'results.manage']}>
      <ResultsList />
    </PermissionGate>
  );
}
