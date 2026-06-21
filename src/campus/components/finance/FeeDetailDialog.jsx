/**
 * @file FeeDetailDialog.jsx
 * @description Read-only detail of a single student debt and its payment
 * history — GET /finance/fees/:id → { fee, payments }.
 *
 * Opened from a fee row in FeesManager. Offers a "Record payment" shortcut when
 * the debt still has an outstanding balance.
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Box,
  Typography, Divider, Chip, CircularProgress, Alert, Link,
  Table, TableHead, TableRow, TableCell, TableBody, Paper,
} from '@mui/material';
import { Receipt, Payment, Close, InsertDriveFile } from '@mui/icons-material';

import { getFee } from '../../../services/financeService';
import { StatusChip } from './financeShared';
import {
  FEE_STATUS_LABEL, FEE_STATUS_COLOR, formatMoney, formatDate,
} from './financeConstants';

const studentName = (s) =>
  s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() || s.matricule || '—' : '—';

const balanceOf = (f) => Math.max(0, (f?.amountDue ?? 0) - (f?.amountPaid ?? 0));

const Field = ({ label, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>{children}</Typography>
  </Box>
);

const FeeDetailDialog = ({ open, feeId, campusId, onClose, onPay }) => {
  const [data,    setData]    = useState(null);   // { fee, payments }
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    if (!feeId) return;
    setLoading(true);
    setError('');
    try {
      const { data: res } = await getFee(feeId, campusId ? { campusId } : {});
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the fee.');
    } finally {
      setLoading(false);
    }
  }, [feeId, campusId]);

  useEffect(() => {
    if (open) load();
    else setData(null);
  }, [open, load]);

  const fee = data?.fee;
  const payments = data?.payments ?? [];
  const balance = balanceOf(fee);
  const canPay = fee && fee.status !== 'paid' && fee.status !== 'cancelled' && balance > 0;

  return (
    <Dialog
      open={open} onClose={onClose} maxWidth="md" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Receipt color="primary" />
            <Typography variant="h6" fontWeight={700}>Fee Detail</Typography>
          </Stack>
          {fee && (
            <StatusChip status={fee.status} labelMap={FEE_STATUS_LABEL} colorMap={FEE_STATUS_COLOR} />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }} onClose={load}>{error}</Alert>
        ) : !fee ? null : (
          <Stack spacing={3}>
            {/* Header fields */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              <Field label="Student">{studentName(fee.student)}</Field>
              <Field label="Label">{fee.label}</Field>
              <Field label="Academic year">{fee.academicYear || '—'}</Field>
              <Field label="Due date">{formatDate(fee.dueDate)}</Field>
              <Field label="Created">{formatDate(fee.createdAt)}</Field>
              {fee.student?.matricule && (
                <Field label="Matricule">
                  <Box component="span" sx={{ fontFamily: 'monospace' }}>{fee.student.matricule}</Box>
                </Field>
              )}
            </Box>

            {/* Amount summary */}
            <Stack direction="row" spacing={1.5}>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Due</Typography>
                <Typography variant="h6" fontWeight={700}>{formatMoney(fee.amountDue, fee.currency)}</Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Paid</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'success.main' }}>
                  {formatMoney(fee.amountPaid, fee.currency)}
                </Typography>
              </Paper>
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">Balance</Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: balance > 0 ? 'error.main' : 'success.main' }}>
                  {formatMoney(balance, fee.currency)}
                </Typography>
              </Paper>
            </Stack>

            {fee.notes && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Notes
                </Typography>
                <Typography variant="body2">{fee.notes}</Typography>
              </Box>
            )}

            <Divider textAlign="left">
              <Chip label={`Payments (${payments.length})`} size="small" />
            </Divider>

            {/* Payment history */}
            {payments.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No payment recorded yet.
              </Typography>
            ) : (
              <TableContainerLite>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Reference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p._id} hover>
                        <TableCell>{formatDate(p.paidAt)}</TableCell>
                        <TableCell align="right">{formatMoney(p.amount, p.currency || fee.currency)}</TableCell>
                        <TableCell>{p.method}</TableCell>
                        <TableCell>{p.reference || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainerLite>
            )}

            {/* Attachments on the fee, if any */}
            {Array.isArray(fee.attachments) && fee.attachments.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Attachments
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
                  {fee.attachments.map((url, i) => (
                    <Chip
                      key={`${url}-${i}`}
                      icon={<InsertDriveFile />}
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                      label={(
                        <Link href={url} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">
                          Document {i + 1}
                        </Link>
                      )}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose} startIcon={<Close />} sx={{ textTransform: 'none' }}>Close</Button>
        {canPay && onPay && (
          <Button
            variant="contained" color="success" startIcon={<Payment />}
            onClick={() => onPay(fee)}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Record Payment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

/** Thin wrapper to keep the payments table scrollable on narrow screens. */
const TableContainerLite = ({ children }) => (
  <Box sx={{ overflowX: 'auto', border: 1, borderColor: 'divider', borderRadius: 2 }}>{children}</Box>
);

export default FeeDetailDialog;
