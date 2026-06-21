/**
 * @file StudentLedgerDrawer.jsx
 * @description Right-hand drawer showing a student's consolidated ledger
 * (debts + payments + totals) — GET /finance/students/:id/ledger.
 *
 * Read-only. Opened from a fee row in FeesManager.
 */

import {
  Drawer, Box, Stack, Typography, IconButton, Divider, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, Paper,
  CircularProgress, Alert,
} from '@mui/material';
import { Close, AccountBalanceWallet } from '@mui/icons-material';

import useStudentLedger from '../../../hooks/useStudentLedger';
import { StatusChip } from './financeShared';
import {
  FEE_STATUS_LABEL, FEE_STATUS_COLOR, formatMoney, formatDate,
} from './financeConstants';

const TotalCard = ({ label, value, color }) => (
  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, flex: 1, textAlign: 'center' }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="h6" fontWeight={700} sx={{ color }}>{value}</Typography>
  </Paper>
);

const StudentLedgerDrawer = ({ open, studentId, campusId, studentName, onClose }) => {
  const { ledger, loading, error } = useStudentLedger({ studentId, campusId });
  const { fees = [], payments = [], totals = {} } = ledger;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 520 }, p: 0 } } }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AccountBalanceWallet color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={700}>Student Ledger</Typography>
              {studentName && (
                <Typography variant="body2" color="text.secondary">{studentName}</Typography>
              )}
            </Box>
          </Stack>
          <IconButton onClick={onClose}><Close /></IconButton>
        </Stack>
      </Box>

      <Box sx={{ p: 2.5, overflow: 'auto' }}>
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        ) : (
          <Stack spacing={3}>
            {/* Totals */}
            <Stack direction="row" spacing={1.5}>
              <TotalCard label="Total due"  value={formatMoney(totals.totalDue ?? 0)}  color="text.primary" />
              <TotalCard label="Total paid" value={formatMoney(totals.totalPaid ?? 0)} color="success.main" />
              <TotalCard label="Balance"    value={formatMoney(totals.balance ?? 0)}   color={(totals.balance ?? 0) > 0 ? 'error.main' : 'success.main'} />
            </Stack>

            {/* Debts */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Debts ({fees.length})
              </Typography>
              {fees.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No debts recorded.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Label</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fees.map((f) => (
                      <TableRow key={f._id} hover>
                        <TableCell>
                          <Typography variant="body2">{f.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Due {formatMoney(f.amountDue, f.currency)} · Paid {formatMoney(f.amountPaid, f.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {formatMoney(Math.max(0, (f.amountDue ?? 0) - (f.amountPaid ?? 0)), f.currency)}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={f.status} labelMap={FEE_STATUS_LABEL} colorMap={FEE_STATUS_COLOR} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>

            <Divider />

            {/* Payments */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Payments ({payments.length})
              </Typography>
              {payments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No payments recorded.</Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p._id} hover>
                        <TableCell>{formatDate(p.paidAt)}</TableCell>
                        <TableCell align="right">{formatMoney(p.amount, p.currency)}</TableCell>
                        <TableCell><Chip size="small" variant="outlined" label={p.method} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Box>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
};

export default StudentLedgerDrawer;
