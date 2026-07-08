/**
 * @file DirectorCampuses.jsx
 * @description Director portal — read-only campus list with search and filter.
 * No archive / restore / create actions — oversight only.
 *
 * Data: GET /campus/all
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, TablePagination, TextField, FormControl,
  InputLabel, Select, MenuItem, Button, IconButton,
  InputAdornment, Avatar, Alert, Skeleton, Tooltip,
  useTheme, useMediaQuery,
} from '@mui/material';
import {
  Search, FilterListOff, Business, Visibility,
  LocationOn, Person, CalendarToday,
} from '@mui/icons-material';

import { getAllCampuses } from '../../../services/admin_service';
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import {
  DIRECTOR_PRIMARY, DIRECTOR_GRADIENT, DIRECTOR_SHADOW, CAMPUS_STATUS_COLOR,
} from '../../../theme/directorTokens';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_FILTERS = { search: '', status: '', page: 1, limit: 20 };
const SX_INPUT = { minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } };

// ─── Mobile campus card (read-only) ──────────────────────────────────────────

const CampusCard = ({ campus: c, onView, t }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, '&:hover': { boxShadow: 2 } }}>
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
      <Avatar
        src={c.campus_image}
        sx={{ width: 40, height: 40, bgcolor: DIRECTOR_PRIMARY, fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}
      >
        <Business sx={{ fontSize: 18 }} />
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ flex: 1, mr: 1 }}>
            {c.campus_name}
          </Typography>
          <Chip
            label={t(`common:status.${c.status}`)}
            color={CAMPUS_STATUS_COLOR[c.status] ?? 'default'}
            size="small"
            sx={{ fontWeight: 600, flexShrink: 0 }}
          />
        </Stack>
        {c.campus_number && (
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {c.campus_number}
          </Typography>
        )}
      </Box>
    </Stack>

    <Divider sx={{ my: 1 }} />

    <Stack spacing={0.5} sx={{ mb: 1.5 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Person sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.secondary" noWrap>
          {c.manager_name}{c.email ? ` — ${c.email}` : ''}
        </Typography>
      </Stack>
      {(c.location?.city || c.location?.country) && (
        <Stack direction="row" spacing={1} alignItems="center">
          <LocationOn sx={{ fontSize: 14, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.secondary">
            {[c.location?.city, c.location?.country].filter(Boolean).join(', ')}
          </Typography>
        </Stack>
      )}
      <Stack direction="row" spacing={1} alignItems="center">
        <CalendarToday sx={{ fontSize: 14, color: 'text.disabled' }} />
        <Typography variant="caption" color="text.secondary">
          {new Date(c.createdAt).toLocaleDateString()}
        </Typography>
      </Stack>
    </Stack>

    <Stack direction="row" spacing={1} justifyContent="flex-end">
      <Tooltip title={t('campuses.action.viewPortal')}>
        <IconButton size="medium" onClick={() => onView(c._id)}>
          <Visibility fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  </Paper>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function DirectorCampuses() {
  const navigate = useNavigate();
  const { t }    = useAppTranslation(['admin', 'common']);
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [campuses,   setCampuses]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetchCampuses = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { ...filters };
    Object.keys(params).forEach((k) => { if (!params[k] && params[k] !== 0) delete params[k]; });
    try {
      const res = await getAllCampuses(params);
      setCampuses(Array.isArray(res.data?.data) ? res.data.data : []);
      if (res.data?.pagination) setPagination((p) => ({ ...p, ...res.data.pagination }));
    } catch {
      setError(t('campuses.loadError'));
      setCampuses([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => { fetchCampuses(); }, [fetchCampuses]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const paginationEl = (
    <TablePagination
      component="div"
      count={pagination.total}
      page={pagination.page - 1}
      rowsPerPage={pagination.limit}
      rowsPerPageOptions={[10, 20, 50]}
      onPageChange={(_, p) => handleFilterChange('page', p + 1)}
      onRowsPerPageChange={(e) => handleFilterChange('limit', parseInt(e.target.value, 10))}
    />
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>{t('campuses.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('campuses.subtitleDirector')}
        </Typography>
      </Box>

      {/* ── Filters ────────────────────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder={t('campuses.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={SX_INPUT}>
          <InputLabel>{t('common:field.status')}</InputLabel>
          <Select label={t('common:field.status')} value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <MenuItem value="">{t('common:all')}</MenuItem>
            <MenuItem value="active">{t('common:status.active')}</MenuItem>
            <MenuItem value="inactive">{t('common:status.inactive')}</MenuItem>
            <MenuItem value="archived">{t('common:status.archived')}</MenuItem>
          </Select>
        </FormControl>
        <Button
          size="small" variant="outlined" startIcon={<FilterListOff />}
          onClick={handleReset}
          sx={{ borderRadius: 2, textTransform: 'none', alignSelf: { xs: 'flex-start', sm: 'center' } }}
        >
          {t('common:action.reset')}
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Desktop table ───────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 3, display: { xs: 'none', md: 'block' } }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t('campusTable.campus')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('campusTable.manager')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('campusTable.location')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('common:field.status')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('campusTable.created')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : campuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {t('campuses.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                campuses.map((c) => (
                  <TableRow key={c._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={c.campus_image}
                          sx={{ width: 36, height: 36, bgcolor: DIRECTOR_PRIMARY, fontSize: '0.85rem', fontWeight: 700 }}
                        >
                          <Business sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{c.campus_name}</Typography>
                          {c.campus_number && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {c.campus_number}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{c.manager_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                      {c.manager_phone && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {c.manager_phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {[c.location?.city, c.location?.country].filter(Boolean).join(', ') || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t(`common:status.${c.status}`)}
                        color={CAMPUS_STATUS_COLOR[c.status] ?? 'default'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t('campuses.action.viewPortal')}>
                        <IconButton size="small" onClick={() => navigate(`/campus/${c._id}`)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Divider />
        {paginationEl}
      </Paper>

      {/* ── Mobile cards ────────────────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4].map((k) => <Skeleton key={k} variant="rounded" height={150} />)}
          </Stack>
        ) : campuses.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('campuses.empty')}</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {campuses.map((c) => (
              <CampusCard
                key={c._id}
                campus={c}
                onView={(id) => navigate(`/campus/${id}`)}
                t={t}
              />
            ))}
          </Stack>
        )}
        {paginationEl}
      </Box>

    </Box>
  );
}
