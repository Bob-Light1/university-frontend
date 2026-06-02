/**
 * @file CommissionManager.jsx
 * @description Campus Manager — Commission list with KPIs, actions, config dialog.
 *
 * Actions per commission:
 *   pending   → validate | dispute | cancel
 *   validated → pay | dispute | cancel
 *   disputed  → validate | cancel
 *   paid / cancelled — read only
 *
 * The CommissionConfigDialog at the top-right lets admins set the campus
 * commission rule (FIXED amount or PERCENTAGE of tuition fee).
 */

import { useState } from 'react';
import {
  Box, Stack, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip,
  TextField, FormControl, InputLabel, Select, MenuItem,
  InputAdornment, IconButton, Tooltip, Skeleton, Paper,
  Alert, Snackbar, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Divider,
} from '@mui/material';
import {
  FilterListOff, FileDownload, CheckCircle, AttachMoney,
  Cancel, Settings, TrendingUp, HourglassEmpty,
  Paid, ReportProblem, WarningAmber,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import useCommission  from '../../../hooks/useCommission';
import KPICards       from '../../../components/shared/KpiCard';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import CommissionPayModal from './CommissionPayModal';
import {
  COMMISSION_STATUS_COLOR, COMMISSION_STATUS_LABEL,
} from '../../../theme/partnerTokens';

// ─── Config dialog schema ─────────────────────────────────────────────────────

const configSchema = Yup.object({
  ruleType:    Yup.string().oneOf(['FIXED', 'PERCENTAGE']).required('Rule type is required'),
  fixedAmount: Yup.number().when('ruleType', {
    is:        'FIXED',
    then:      (s) => s.min(0).required('Amount is required'),
    otherwise: (s) => s.notRequired(),
  }),
  percentage:  Yup.number().when('ruleType', {
    is:        'PERCENTAGE',
    then:      (s) => s.min(0).max(100).required('Percentage is required'),
    otherwise: (s) => s.notRequired(),
  }),
  currency: Yup.string().notRequired(),
});

// ─── Commission Config Dialog ─────────────────────────────────────────────────

const CommissionConfigDialog = ({ open, config, onClose, onSave }) => {
  const handleClose = () => { document.activeElement?.blur(); onClose(); };

  const formik = useFormik({
    initialValues: {
      ruleType:    config?.ruleType    ?? 'FIXED',
      fixedAmount: config?.fixedAmount ?? '',
      percentage:  config?.percentage  ?? '',
      currency:    config?.currency    ?? 'XAF',
    },
    validationSchema: configSchema,
    validateOnBlur:   true,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        await onSave(values);
        onClose();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const isFixed = formik.values.ruleType === 'FIXED';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      disableEnforceFocus closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Settings sx={{ color: 'text.secondary' }} />
          <Typography variant="h6" fontWeight={700}>Commission Configuration</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            This rule applies to all new commissions generated when a lead reaches <strong>enrolled</strong> status.
          </Alert>

          <FormControl fullWidth>
            <InputLabel>Rule Type</InputLabel>
            <Select
              name="ruleType"
              label="Rule Type"
              value={formik.values.ruleType}
              onChange={formik.handleChange}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="FIXED">Fixed Amount</MenuItem>
              <MenuItem value="PERCENTAGE">Percentage of Tuition</MenuItem>
            </Select>
          </FormControl>

          {isFixed ? (
            <TextField
              fullWidth
              name="fixedAmount"
              label="Fixed Amount *"
              type="number"
              value={formik.values.fixedAmount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.fixedAmount && Boolean(formik.errors.fixedAmount)}
              helperText={formik.touched.fixedAmount && formik.errors.fixedAmount}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          ) : (
            <TextField
              fullWidth
              name="percentage"
              label="Percentage (0–100) *"
              type="number"
              value={formik.values.percentage}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.percentage && Boolean(formik.errors.percentage)}
              helperText={formik.touched.percentage && formik.errors.percentage}
              slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          )}

          <FormControl fullWidth>
            <InputLabel>Currency</InputLabel>
            <Select
              name="currency"
              label="Currency"
              value={formik.values.currency}
              onChange={formik.handleChange}
              sx={{ borderRadius: 2 }}
            >
              {['XAF', 'EUR', 'USD'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          disabled={formik.isSubmitting}
          onClick={() => formik.handleSubmit()}
          startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Settings />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {formik.isSubmitting ? 'Saving…' : 'Save Config'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Filter bar ───────────────────────────────────────────────────────────────

const SX_SELECT = { minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const Filters = ({ filters, onChange, onReset }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
    <FormControl size="small" sx={SX_SELECT}>
      <InputLabel>Status</InputLabel>
      <Select label="Status" value={filters.status} onChange={(e) => onChange('status', e.target.value)}>
        <MenuItem value="">All Statuses</MenuItem>
        {Object.entries(COMMISSION_STATUS_LABEL).map(([v, l]) => (
          <MenuItem key={v} value={v}>{l}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <TextField
      size="small" type="date" label="From"
      value={filters.from} onChange={(e) => onChange('from', e.target.value)}
      sx={SX_SELECT} slotProps={{ inputLabel: { shrink: true } }}
    />
    <TextField
      size="small" type="date" label="To"
      value={filters.to} onChange={(e) => onChange('to', e.target.value)}
      sx={SX_SELECT} slotProps={{ inputLabel: { shrink: true } }}
    />

    <Button
      size="small" variant="outlined" startIcon={<FilterListOff />} onClick={onReset}
      sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'center' }}
    >
      Reset
    </Button>
  </Stack>
);

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <TableRow>
    {Array.from({ length: 7 }).map((_, i) => (
      <TableCell key={i}><Skeleton variant="text" /></TableCell>
    ))}
  </TableRow>
);

const SkeletonCard = () => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </Box>
      <Skeleton variant="rounded" width={70} height={22} />
    </Stack>
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="50%" />
  </Paper>
);

// ─── Mobile commission card ───────────────────────────────────────────────────

const CommissionCard = ({ comm, actionBusy, onValidate, onPay, onDispute, onCancel }) => {
  const busy = actionBusy === comm._id;
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {comm.partner ? `${comm.partner.firstName} ${comm.partner.lastName}` : '—'}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {comm.lead ? `${comm.lead.firstName} ${comm.lead.lastName}` : 'No lead'}
          </Typography>
        </Box>
        <Stack alignItems="flex-end" spacing={0.5}>
          <Chip
            label={COMMISSION_STATUS_LABEL[comm.status] ?? comm.status}
            color={COMMISSION_STATUS_COLOR[comm.status] ?? 'default'}
            size="small"
            sx={{ fontWeight: 600, flexShrink: 0 }}
          />
          {comm.fraudFlags?.length > 0 && (
            <Tooltip title={comm.fraudFlags.join(', ')}>
              <Chip
                icon={<WarningAmber sx={{ fontSize: '0.75rem !important' }} />}
                label="Fraud"
                color="error"
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.65rem', fontWeight: 600 }}
              />
            </Tooltip>
          )}
        </Stack>
      </Stack>

      <Divider sx={{ my: 1 }} />

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap">
        <Typography variant="body2" fontWeight={700} color="success.main">
          {comm.amount?.toLocaleString()} {comm.currency ?? 'XAF'}
        </Typography>
        <Chip
          label={comm.ruleSnapshot?.ruleType ?? '—'}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
        <Typography variant="caption" color="text.secondary">
          {new Date(comm.createdAt).toLocaleDateString()}
        </Typography>
      </Stack>

      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
        {comm.status === 'pending' && (
          <Tooltip title="Validate">
            <span>
              <IconButton size="medium" color="info" disabled={busy} onClick={() => onValidate(comm._id)}>
                {busy ? <CircularProgress size={14} /> : <CheckCircle fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        )}
        {comm.status === 'validated' && (
          <Tooltip title="Mark Paid">
            <span>
              <IconButton size="medium" color="success" disabled={busy} onClick={() => onPay(comm)}>
                <AttachMoney fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {(comm.status === 'pending' || comm.status === 'validated') && (
          <Tooltip title="Dispute">
            <span>
              <IconButton size="medium" color="warning" disabled={busy} onClick={() => onDispute(comm._id)}>
                <ReportProblem fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {comm.status === 'disputed' && (
          <Tooltip title="Re-validate">
            <span>
              <IconButton size="medium" color="info" disabled={busy} onClick={() => onValidate(comm._id)}>
                {busy ? <CircularProgress size={14} /> : <CheckCircle fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        )}
        {comm.status !== 'paid' && comm.status !== 'cancelled' && (
          <Tooltip title="Cancel">
            <span>
              <IconButton size="medium" color="error" disabled={busy} onClick={() => onCancel(comm._id)}>
                <Cancel fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CommissionManager = () => {
  const theme = useTheme();

  const {
    commissions, kpis, commissionConfig, pagination, filters,
    loading, configLoading, error,
    fetch, handleFilterChange, handleReset, setPage,
    validate, markPaid, dispute, cancel, saveConfig, downloadCSV,
  } = useCommission();

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [payModal,   setPayModal]   = useState({ open: false, commission: null });
  const [configOpen, setConfigOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(null);

  // ─── Mutation wrappers ────────────────────────────────────────────────────────

  const withBusy = (id, fn) => async (...args) => {
    setActionBusy(id);
    try {
      await fn(...args);
      showSnackbar('Commission updated.', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Action failed.', 'error');
    } finally {
      setActionBusy(null);
    }
  };

  const handleValidate = (id) => withBusy(id, validate)(id);
  const handleDispute  = (id) => withBusy(id, dispute)(id);
  const handleCancel   = (id) => {
    const reason = window.prompt('Cancellation reason:');
    if (!reason) return;
    withBusy(id, cancel)(id, reason);
  };

  const handlePaySuccess = async (id, data) => {
    await withBusy(id, markPaid)(id, data);
    setPayModal({ open: false, commission: null });
  };

  const handleSaveConfig = async (data) => {
    try {
      await saveConfig(data);
      showSnackbar('Commission config saved.', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to save config.', 'error');
      throw err;
    }
  };

  const handleDownload = async () => {
    try { await downloadCSV(); }
    catch { showSnackbar('Export failed.', 'error'); }
  };

  // ─── KPI cards ────────────────────────────────────────────────────────────────

  const kpiMetrics = [
    {
      label:    'Pending',
      value:    kpis?.pending ?? 0,
      icon:     <HourglassEmpty sx={{ fontSize: 28 }} />,
      color:    theme.palette.warning.main,
      subtitle: 'Awaiting validation',
    },
    {
      label:    'Validated',
      value:    kpis?.validated ?? 0,
      icon:     <CheckCircle sx={{ fontSize: 28 }} />,
      color:    theme.palette.info.main,
      subtitle: 'Ready to pay',
    },
    {
      label:    'Paid',
      value:    kpis?.paid ?? 0,
      icon:     <Paid sx={{ fontSize: 28 }} />,
      color:    theme.palette.success.dark,
      subtitle: 'Settled',
    },
    {
      label:    'Total Paid (XAF)',
      value:    kpis?.totalPaid != null ? kpis.totalPaid.toLocaleString() : '—',
      icon:     <TrendingUp sx={{ fontSize: 28 }} />,
      color:    theme.palette.secondary.dark,
      subtitle: 'All-time paid out',
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

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
          <Typography variant="h5" fontWeight={700}>Commission Manager</Typography>
          <Typography variant="body2" color="text.secondary">
            Validate, pay and track all partner commissions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: 'flex-end', sm: 'auto' } }}>
          <Tooltip title={commissionConfig
            ? `Config: ${commissionConfig.ruleType} — ${commissionConfig.ruleType === 'FIXED' ? `${commissionConfig.fixedAmount} ${commissionConfig.currency}` : `${commissionConfig.percentage}%`}`
            : 'No commission config set'}>
            <Button
              size="small"
              variant="outlined"
              startIcon={configLoading ? <CircularProgress size={14} /> : <Settings />}
              onClick={() => setConfigOpen(true)}
              disabled={configLoading}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              Config
            </Button>
          </Tooltip>
          <Button
            size="small" variant="outlined" startIcon={<FileDownload />}
            onClick={handleDownload}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Export CSV
          </Button>
        </Stack>
      </Stack>

      {/* KPIs */}
      {!loading && <Box sx={{ mb: 2.5 }}><KPICards metrics={kpiMetrics} /></Box>}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={fetch}>{error}</Alert>
      )}

      {/* No config warning */}
      {!configLoading && !commissionConfig && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button size="small" onClick={() => setConfigOpen(true)} sx={{ textTransform: 'none' }}>
              Configure
            </Button>
          }
        >
          No commission rule is configured for this campus. Commissions will not be auto-generated until one is set.
        </Alert>
      )}

      {/* Filters */}
      <Filters filters={filters} onChange={handleFilterChange} onReset={handleReset} />

      {/* ── Desktop table (md+) ──────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Partner</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Lead</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rule</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              ) : commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No commissions yet. They are generated automatically when a lead is enrolled.
                  </TableCell>
                </TableRow>
              ) : (
                commissions.map((comm) => {
                  const busy = actionBusy === comm._id;
                  return (
                    <TableRow key={comm._id} hover>

                      {/* Partner */}
                      <TableCell>
                        {comm.partner ? (
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {comm.partner.firstName} {comm.partner.lastName}
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                              {comm.partner.partnerCode}
                            </Typography>
                          </Box>
                        ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>

                      {/* Lead */}
                      <TableCell>
                        {comm.lead ? (
                          <Typography variant="body2">
                            {comm.lead.firstName} {comm.lead.lastName}
                          </Typography>
                        ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>

                      {/* Amount */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {comm.amount?.toLocaleString()} {comm.currency ?? 'XAF'}
                        </Typography>
                        {comm.ruleSnapshot && (
                          <Typography variant="caption" color="text.secondary">
                            {comm.ruleSnapshot.ruleType === 'PERCENTAGE'
                              ? `${comm.ruleSnapshot.percentage}%`
                              : 'Fixed'}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Rule type */}
                      <TableCell>
                        <Chip
                          label={comm.ruleSnapshot?.ruleType ?? '—'}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <Chip
                          label={COMMISSION_STATUS_LABEL[comm.status] ?? comm.status}
                          color={COMMISSION_STATUS_COLOR[comm.status] ?? 'default'}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                        {comm.fraudFlags?.length > 0 && (
                          <Tooltip title={comm.fraudFlags.join(', ')}>
                            <Chip
                              icon={<WarningAmber sx={{ fontSize: '0.75rem !important' }} />}
                              label="Fraud flag"
                              color="error"
                              size="small"
                              variant="outlined"
                              sx={{ ml: 0.5, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Date */}
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {comm.status === 'pending' && (
                            <Tooltip title="Validate">
                              <span>
                                <IconButton size="small" color="info" disabled={busy} onClick={() => handleValidate(comm._id)}>
                                  {busy ? <CircularProgress size={14} /> : <CheckCircle fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {comm.status === 'validated' && (
                            <Tooltip title="Mark Paid">
                              <span>
                                <IconButton size="small" color="success" disabled={busy} onClick={() => setPayModal({ open: true, commission: comm })}>
                                  <AttachMoney fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {(comm.status === 'pending' || comm.status === 'validated') && (
                            <Tooltip title="Dispute">
                              <span>
                                <IconButton size="small" color="warning" disabled={busy} onClick={() => handleDispute(comm._id)}>
                                  <ReportProblem fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {comm.status === 'disputed' && (
                            <Tooltip title="Re-validate">
                              <span>
                                <IconButton size="small" color="info" disabled={busy} onClick={() => handleValidate(comm._id)}>
                                  {busy ? <CircularProgress size={14} /> : <CheckCircle fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          {comm.status !== 'paid' && comm.status !== 'cancelled' && (
                            <Tooltip title="Cancel">
                              <span>
                                <IconButton size="small" color="error" disabled={busy} onClick={() => handleCancel(comm._id)}>
                                  <Cancel fontSize="small" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ── Mobile cards (xs/sm) ─────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </Stack>
        ) : commissions.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 5, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No commissions yet. They are generated automatically when a lead is enrolled.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {commissions.map((comm) => (
              <CommissionCard
                key={comm._id}
                comm={comm}
                actionBusy={actionBusy}
                onValidate={handleValidate}
                onPay={(c) => setPayModal({ open: true, commission: c })}
                onDispute={handleDispute}
                onCancel={handleCancel}
              />
            ))}
          </Stack>
        )}
      </Box>

      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page - 1}
        rowsPerPage={pagination.limit}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_, p) => setPage(p + 1)}
        onRowsPerPageChange={(e) => handleFilterChange('limit', parseInt(e.target.value, 10))}
      />

      {/* Pay Modal */}
      <CommissionPayModal
        open={payModal.open}
        commission={payModal.commission}
        onClose={() => setPayModal({ open: false, commission: null })}
        onSuccess={handlePaySuccess}
      />

      {/* Config Dialog */}
      <CommissionConfigDialog
        open={configOpen}
        config={commissionConfig}
        onClose={() => setConfigOpen(false)}
        onSave={handleSaveConfig}
      />

      {/* Snackbar */}
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

export default CommissionManager;
