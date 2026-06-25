/**
 * @file IncomesManager.jsx
 * @description Institutional income records: paginated list with filters,
 * create / edit / delete. Backend: /finance/incomes — campus-scoped.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Typography, Button, Paper, Alert, Snackbar, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, Skeleton, FormControl, InputLabel,
  Select, MenuItem, CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, FilterListOff } from '@mui/icons-material';

import useIncomes from '../../../hooks/useIncomes';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import { StatusChip, PeriodSelector } from './financeShared';
import { useFinanceLabels } from './useFinanceLabels';
import {
  INCOME_SOURCES, INCOME_STATUSES, INCOME_STATUS_COLOR,
  formatMoney, formatDate,
} from './financeConstants';
import IncomeFormDialog from './IncomeFormDialog';

const studentName = (s) =>
  s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.matricule || '—' : '—';

const IncomesManager = ({ campusId }) => {
  const {
    incomes, pagination, filters, loading, error,
    fetch, handleFilterChange, handleReset, setPage,
    create, update, remove,
  } = useIncomes(campusId);

  const { t } = useTranslation('finance');
  const { incomeStatus: incomeStatusLabel } = useFinanceLabels();
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();
  const [editing, setEditing] = useState(null);   // income object or {} for new
  const [busyId,  setBusyId]  = useState(null);

  const handleSubmit = async (payload) => {
    if (editing?._id) {
      await update(editing._id, payload);
      showSnackbar(t('incomes.toast.updated'), 'success');
    } else {
      await create(payload);
      showSnackbar(t('incomes.toast.created'), 'success');
    }
  };

  const handleDelete = async (income) => {
    if (!window.confirm(t('incomes.confirmDelete', { title: income.title }))) return;
    setBusyId(income._id);
    try {
      await remove(income._id);
      showSnackbar(t('incomes.toast.deleted'), 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || t('incomes.toast.deleteFailed'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('incomes.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('incomes.subtitle')}
          </Typography>
        </Box>
        <Button
          variant="contained" color="success" startIcon={<Add />} onClick={() => setEditing({})}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
        >
          {t('incomes.new')}
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('fields.source')}</InputLabel>
          <Select label={t('fields.source')} value={filters.source} onChange={(e) => handleFilterChange('source', e.target.value)}>
            <MenuItem value="">{t('filters.allSources')}</MenuItem>
            {INCOME_SOURCES.map((s) => <MenuItem key={s} value={s}>{t(`enums.incomeSource.${s}`)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('fields.status')}</InputLabel>
          <Select label={t('fields.status')} value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <MenuItem value="">{t('filters.allStatuses')}</MenuItem>
            {INCOME_STATUSES.map((s) => <MenuItem key={s} value={s}>{incomeStatusLabel[s]}</MenuItem>)}
          </Select>
        </FormControl>
        <PeriodSelector
          year={filters.year} month={filters.month}
          onChange={(key, value) => handleFilterChange(key, value)}
        />
        <Button
          size="small" variant="outlined" startIcon={<FilterListOff />} onClick={handleReset}
          sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'center' }}
        >
          {t('actions.reset')}
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={fetch}>{error}</Alert>}

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{t('fields.title')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('fields.source')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">{t('fields.amount')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('fields.method')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('fields.student')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('fields.date')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('fields.status')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">{t('fields.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <TableCell key={j}><Skeleton variant="text" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : incomes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  {t('incomes.empty')}
                </TableCell>
              </TableRow>
            ) : (
              incomes.map((inc) => {
                const busy = busyId === inc._id;
                return (
                  <TableRow key={inc._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{inc.title}</Typography>
                      {inc.reference && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {inc.reference}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell><Chip size="small" variant="outlined" label={t(`enums.incomeSource.${inc.source}`)} /></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        {formatMoney(inc.amount, inc.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>{inc.paymentMethod ? t(`enums.paymentMethod.${inc.paymentMethod}`) : '—'}</TableCell>
                    <TableCell>{inc.student ? studentName(inc.student) : '—'}</TableCell>
                    <TableCell>{formatDate(inc.incomeDate)}</TableCell>
                    <TableCell>
                      <StatusChip status={inc.status} labelMap={incomeStatusLabel} colorMap={INCOME_STATUS_COLOR} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                        <Tooltip title={t('actions.edit')}>
                          <IconButton size="small" color="primary" onClick={() => setEditing(inc)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('actions.delete')}>
                          <span>
                            <IconButton size="small" color="error" disabled={busy} onClick={() => handleDelete(inc)}>
                              {busy ? <CircularProgress size={14} /> : <Delete fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page - 1}
        rowsPerPage={pagination.limit}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, p) => setPage(p + 1)}
        onRowsPerPageChange={(e) => handleFilterChange('limit', parseInt(e.target.value, 10))}
      />

      <IncomeFormDialog
        open={Boolean(editing)}
        income={editing?._id ? editing : null}
        campusId={campusId}
        onClose={() => setEditing(null)}
        onSubmit={handleSubmit}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={closeSnackbar} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default IncomesManager;
