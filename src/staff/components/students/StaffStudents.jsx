import { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip,
  TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Alert, Pagination,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, IconButton, Tooltip,
} from '@mui/material';
import { Search, Group, Refresh } from '@mui/icons-material';

import { getStaffStudents }   from '../../../services/staffService';
import { IMAGE_BASE_URL }     from '../../../config/env';
import PermissionGate         from '../shared/PermissionGate';
import usePaginatedList       from '../../../hooks/usePaginatedList';
import { useAppTranslation }  from '../../../hooks/useAppTranslation';

const STAFF_PRIMARY = '#00695C';

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const STATUS_BG = {
  active:    { bg: '#e8f5e9', color: '#2e7d32' },
  inactive:  { bg: '#fff3e0', color: '#e65100' },
  suspended: { bg: '#fdecea', color: '#c62828' },
  archived:  { bg: '#f5f5f5', color: '#616161' },
};

const ROWS_OPTIONS = [10, 20, 50, 100];

function StudentsList() {
  const { t } = useAppTranslation(['common', 'staff']);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [limit,  setLimit]  = useState(20);

  const fetcher = useCallback(
    (page) => getStaffStudents({ page, limit, search: search || undefined, status: status || undefined }),
    [limit, search, status],
  );

  const {
    items: students, total, page, setPage, loading, error, refresh,
  } = usePaginatedList(fetcher);

  const totalPages = Math.ceil(total / limit);
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);
  const handleFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Group sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800}>{t('common:nav.students')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('common:onCampus.students', { count: total })}
          </Typography>
        </Box>
        <Tooltip title={t('common:action.refresh')}>
          <IconButton onClick={refresh} size="small" disabled={loading}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <TextField
          size="small"
          placeholder={`${t('common:action.search')} …`}
          value={search}
          onChange={handleFilter(setSearch)}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('common:field.status')}</InputLabel>
          <Select value={status} label={t('common:field.status')} onChange={handleFilter(setStatus)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('common:all')}</MenuItem>
            {['active', 'inactive', 'suspended', 'archived'].map((s) => (
              <MenuItem key={s} value={s}>{t(`common:status.${s}`)}</MenuItem>
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
                <TableCell sx={{ fontWeight: 700 }}>{t('common:nav.students')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('staff:col.matricule')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('common:nav.classes')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('common:field.email')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('common:field.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : students.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {t('common:table.noResults')}
                      </TableCell>
                    </TableRow>
                  )
                  : students.map((s) => {
                      const sc = STATUS_BG[s.status] ?? STATUS_BG.inactive;
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
                            <Chip label={t(`common:status.${s.status}`)} size="small"
                              sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600 }} />
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
            {total === 0 ? t('common:table.noResults') : t('common:range', { start: rangeStart, end: rangeEnd, total })}
          </Typography>
        </Stack>
        {totalPages > 1 && (
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        )}
      </Stack>
    </Box>
  );
}

export default function StaffStudents() {
  return (
    <PermissionGate anyOf={['students.read', 'students.manage']}>
      <StudentsList />
    </PermissionGate>
  );
}
