import { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip,
  TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Alert, Pagination,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton, IconButton, Tooltip,
} from '@mui/material';
import { Search, FolderOpen, Refresh } from '@mui/icons-material';

import { getStaffDocuments }  from '../../../services/staffService';
import PermissionGate         from '../shared/PermissionGate';
import usePaginatedList       from '../../../hooks/usePaginatedList';
import { useAppTranslation }  from '../../../hooks/useAppTranslation';

const STAFF_PRIMARY = '#00695C';

const CATEGORY_BG = {
  ADMINISTRATIVE: { bg: '#e3f2fd', color: '#1565c0' },
  ACADEMIC:       { bg: '#e8f5e9', color: '#2e7d32' },
  FINANCIAL:      { bg: '#fff8e1', color: '#f57f17' },
  LEGAL:          { bg: '#fce4ec', color: '#c62828' },
  GENERAL:        { bg: '#f5f5f5', color: '#616161' },
};

const ROWS_OPTIONS = [10, 20, 50, 100];

function DocumentsList() {
  const { t, i18n } = useAppTranslation(['documents', 'common']);

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [type,     setType]     = useState('');
  const [limit,    setLimit]    = useState(20);

  const fetcher = useCallback(
    (page) => getStaffDocuments({
      page, limit,
      search:   search   || undefined,
      category: category || undefined,
      type:     type     || undefined,
    }),
    [limit, search, category, type],
  );

  const {
    items: docs, total, page, setPage, loading, error, refresh,
  } = usePaginatedList(fetcher);

  const totalPages = Math.ceil(total / limit);
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);
  const handleFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <FolderOpen sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800}>{t('common:nav.documents')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('common:onCampus.documents', { count: total })}
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
          placeholder={t('documents:searchPlaceholder')}
          value={search}
          onChange={handleFilter(setSearch)}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('common:field.category')}</InputLabel>
          <Select value={category} label={t('common:field.category')} onChange={handleFilter(setCategory)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('documents:category.allCategories')}</MenuItem>
            {['ADMINISTRATIVE', 'ACADEMIC', 'FINANCIAL', 'LEGAL', 'GENERAL'].map((c) => (
              <MenuItem key={c} value={c}>{t(`documents:category.${c}`)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('common:field.type')}</InputLabel>
          <Select value={type} label={t('common:field.type')} onChange={handleFilter(setType)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('documents:staffType.allTypes')}</MenuItem>
            {['NOTICE', 'REPORT', 'FORM', 'CERTIFICATE', 'CIRCULAR'].map((tp) => (
              <MenuItem key={tp} value={tp}>{t(`documents:staffType.${tp}`)}</MenuItem>
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
                <TableCell sx={{ fontWeight: 700 }}>{t('documents:col.title')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('documents:col.type')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('documents:col.category')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('documents:col.tags')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('documents:col.date')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : docs.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {t('documents:noDocuments')}
                      </TableCell>
                    </TableRow>
                  )
                  : docs.map((d) => {
                      const cc = CATEGORY_BG[d.category] ?? CATEGORY_BG.GENERAL;
                      return (
                        <TableRow key={d._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{d.title}</Typography>
                            {d.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {d.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {d.type ? t(`documents:staffType.${d.type}`, { defaultValue: d.type }) : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {d.category && (
                              <Chip
                                label={t(`documents:category.${d.category}`, { defaultValue: d.category })}
                                size="small"
                                sx={{ bgcolor: cc.bg, color: cc.color, fontWeight: 600 }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                              {(d.tags ?? []).slice(0, 3).map((tag, i) => (
                                <Chip key={i} label={tag} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{fmtDate(d.createdAt)}</Typography>
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
            {total === 0 ? t('documents:noDocuments') : t('common:range', { start: rangeStart, end: rangeEnd, total })}
          </Typography>
        </Stack>
        {totalPages > 1 && (
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        )}
      </Stack>
    </Box>
  );
}

export default function StaffDocuments() {
  return (
    <PermissionGate anyOf={['documents.read', 'documents.manage']}>
      <DocumentsList />
    </PermissionGate>
  );
}
