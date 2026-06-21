/**
 * @file FeesManager.jsx
 * @description Student debts (fees) management: paginated list with filters,
 * fee creation, payment recording, balance reminder, soft-delete and a
 * consolidated student-ledger drawer.
 *
 * Backend: /finance/fees (+ /payments, /remind, DELETE) — campus-scoped.
 */

import { useState } from 'react';
import {
  Box, Stack, Typography, Button, Paper, Alert, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, Skeleton, FormControl, InputLabel,
  Select, MenuItem, TextField, CircularProgress,
} from '@mui/material';
import {
  Add, Payment, NotificationsActive, Delete, AccountBalanceWallet, FilterListOff,
  Visibility,
} from '@mui/icons-material';

import useFees from '../../../hooks/useFees';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import { StatusChip } from './financeShared';
import {
  FEE_STATUSES, FEE_STATUS_LABEL, FEE_STATUS_COLOR, formatMoney, formatDate,
} from './financeConstants';
import FeeFormDialog from './FeeFormDialog';
import PaymentDialog from './PaymentDialog';
import FeeDetailDialog from './FeeDetailDialog';
import StudentLedgerDrawer from './StudentLedgerDrawer';

const studentName = (s) =>
  s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.matricule || '—' : '—';

const balanceOf = (f) => Math.max(0, (f.amountDue ?? 0) - (f.amountPaid ?? 0));

const FeesManager = ({ campusId }) => {
  const {
    fees, pagination, filters, loading, error,
    fetch, handleFilterChange, handleReset, setPage,
    create, pay, remind, remove,
  } = useFees(campusId);

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [formOpen,   setFormOpen]   = useState(false);
  const [payFee,     setPayFee]     = useState(null);
  const [detailId,   setDetailId]   = useState(null);   // fee id for the detail dialog
  const [ledger,     setLedger]     = useState(null);   // { studentId, name }
  const [busyId,     setBusyId]     = useState(null);

  // ─── Mutations ────────────────────────────────────────────────────────────────
  const handleCreate = async (data) => {
    await create(data);
    showSnackbar('Fee created.', 'success');
  };

  const handlePay = async (data) => {
    await pay(payFee._id, data);    // throws → PaymentDialog surfaces the 409/retry
    showSnackbar('Payment recorded.', 'success');
  };

  const handleRemind = async (fee) => {
    setBusyId(fee._id);
    try {
      await remind(fee._id);
      showSnackbar('Reminder sent to the student.', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to send reminder.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (fee) => {
    if (!window.confirm(`Delete the fee "${fee.label}"? This is a soft delete.`)) return;
    setBusyId(fee._id);
    try {
      await remove(fee._id);
      showSnackbar('Fee deleted.', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to delete fee.', 'error');
    } finally {
      setBusyId(null);
    }
  };

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
          <Typography variant="h5" fontWeight={700}>Student Fees</Typography>
          <Typography variant="body2" color="text.secondary">
            Track debts, record payments and send balance reminders.
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
        >
          New Fee
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <MenuItem value="">All statuses</MenuItem>
            {FEE_STATUSES.map((s) => <MenuItem key={s} value={s}>{FEE_STATUS_LABEL[s]}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          size="small" label="Academic year" placeholder="2025-2026"
          value={filters.academicYear}
          onChange={(e) => handleFilterChange('academicYear', e.target.value)}
          sx={{ minWidth: 150 }}
        />
        <Button
          size="small" variant="outlined" startIcon={<FilterListOff />} onClick={handleReset}
          sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'center' }}
        >
          Reset
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={fetch}>{error}</Alert>}

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Label</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Due</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Paid</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Due date</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
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
            ) : fees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No fees found. Create one to start tracking a student debt.
                </TableCell>
              </TableRow>
            ) : (
              fees.map((fee) => {
                const busy = busyId === fee._id;
                const canPay = fee.status !== 'paid' && fee.status !== 'cancelled' && balanceOf(fee) > 0;
                return (
                  <TableRow key={fee._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>{studentName(fee.student)}</Typography>
                      {fee.student?.matricule && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {fee.student.matricule}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{fee.label}</Typography>
                      {fee.academicYear && (
                        <Typography variant="caption" color="text.secondary">{fee.academicYear}</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{formatMoney(fee.amountDue, fee.currency)}</TableCell>
                    <TableCell align="right">{formatMoney(fee.amountPaid, fee.currency)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color={balanceOf(fee) > 0 ? 'error.main' : 'success.main'}>
                        {formatMoney(balanceOf(fee), fee.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={fee.status} labelMap={FEE_STATUS_LABEL} colorMap={FEE_STATUS_COLOR} />
                    </TableCell>
                    <TableCell>{formatDate(fee.dueDate)}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                        <Tooltip title="View detail">
                          <IconButton size="small" color="default" onClick={() => setDetailId(fee._id)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ledger">
                          <IconButton
                            size="small" color="primary"
                            onClick={() => setLedger({ studentId: fee.student?._id, name: studentName(fee.student) })}
                          >
                            <AccountBalanceWallet fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {canPay && (
                          <Tooltip title="Record payment">
                            <IconButton size="small" color="success" onClick={() => setPayFee(fee)}>
                              <Payment fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {balanceOf(fee) > 0 && fee.status !== 'cancelled' && (
                          <Tooltip title="Send reminder">
                            <span>
                              <IconButton size="small" color="warning" disabled={busy} onClick={() => handleRemind(fee)}>
                                {busy ? <CircularProgress size={14} /> : <NotificationsActive fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <span>
                            <IconButton size="small" color="error" disabled={busy} onClick={() => handleDelete(fee)}>
                              <Delete fontSize="small" />
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

      {/* Dialogs */}
      <FeeFormDialog
        open={formOpen}
        campusId={campusId}
        onClose={() => setFormOpen(false)}
        onSubmit={handleCreate}
      />
      <PaymentDialog
        open={Boolean(payFee)}
        fee={payFee}
        onClose={() => setPayFee(null)}
        onSubmit={handlePay}
      />
      <FeeDetailDialog
        open={Boolean(detailId)}
        feeId={detailId}
        campusId={campusId}
        onClose={() => setDetailId(null)}
        onPay={(fee) => { setDetailId(null); setPayFee(fee); }}
      />
      <StudentLedgerDrawer
        open={Boolean(ledger)}
        studentId={ledger?.studentId}
        studentName={ledger?.name}
        campusId={campusId}
        onClose={() => setLedger(null)}
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

export default FeesManager;
