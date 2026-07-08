import { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip,
  TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Alert, Pagination,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, IconButton, Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Search, School, Refresh } from '@mui/icons-material';

import { getStaffTeachers }  from '../../../services/staffService';
import { IMAGE_BASE_URL }    from '../../../config/env';
import PermissionGate        from '../shared/PermissionGate';
import usePaginatedList      from '../../../hooks/usePaginatedList';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

import { staffPrimary } from '../../../theme/staffTokens';
import { statusTint } from '../../../theme/statusTokens';

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

/** Teacher status → semantic hue. */
const STATUS_HUE = {
  active:    'success',
  inactive:  'warning',
  suspended: 'error',
  archived:  'neutral',
};

/** Employment type → semantic hue. */
const EMP_HUE = {
  'full-time': 'info',
  'part-time': 'purple',
  'contract':  'amber',
  'temporary': 'pink',
};

const ROWS_OPTIONS = [10, 20, 50, 100];

function TeachersList() {
  const { t } = useAppTranslation(['common', 'staff']);
  const { palette: { mode } } = useTheme();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [limit,  setLimit]  = useState(20);

  const fetcher = useCallback(
    (page) => getStaffTeachers({ page, limit, search: search || undefined, status: status || undefined }),
    [limit, search, status],
  );

  const {
    items: teachers, total, page, setPage, loading, error, refresh,
  } = usePaginatedList(fetcher);

  const totalPages = Math.ceil(total / limit);
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);
  const handleFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <School sx={(t) => ({ color: staffPrimary(t.palette.mode), fontSize: 28 })} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800}>{t('common:nav.teachers')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('common:onCampus.teachers', { count: total })}
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
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>{t('common:nav.teachers')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('common:field.email')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('staff:col.employment')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('common:nav.subjects')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('common:field.status')}</TableCell>
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
                        {t('common:table.noResults')}
                      </TableCell>
                    </TableRow>
                  )
                  : teachers.map((teacher) => {
                      const sc = statusTint(mode, STATUS_HUE[teacher.status] ?? STATUS_HUE.inactive);
                      const ec = statusTint(mode, EMP_HUE[teacher.employmentType] ?? EMP_HUE['full-time']);
                      return (
                        <TableRow key={teacher._id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar src={imgUrl(teacher.profileImage)} sx={{ width: 32, height: 32, fontSize: 13 }}>
                                {teacher.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {teacher.firstName} {teacher.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">@{teacher.username}</Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{teacher.email ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            {teacher.employmentType && (
                              <Chip
                                label={t(`common:employmentType.${teacher.employmentType}`, { defaultValue: teacher.employmentType })}
                                size="small"
                                sx={{ bgcolor: ec.bg, color: ec.color, fontWeight: 600 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                              {(teacher.subjects ?? []).slice(0, 3).map((s) => (
                                <Chip key={s._id} label={s.subject_name} size="small" variant="outlined" />
                              ))}
                              {(teacher.subjects ?? []).length > 3 && (
                                <Chip label={`+${teacher.subjects.length - 3}`} size="small" />
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={t(`common:status.${teacher.status}`)}
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

export default function StaffTeachers() {
  return (
    <PermissionGate anyOf={['teachers.read', 'teachers.manage']}>
      <TeachersList />
    </PermissionGate>
  );
}
