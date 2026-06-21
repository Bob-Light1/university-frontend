/**
 * @file StudentFinance.jsx
 * @description Student self-service finance view (read-only).
 * Shows the student's own ledger — debts, payments and totals — via
 * GET /finance/my/ledger. No mutations are available to students.
 *
 * Route: /student/finance
 */

import {
  Box, Stack, Typography, Paper, Alert, Divider, Chip,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, useTheme,
} from '@mui/material';
import { AccountBalanceWallet, WarningAmber } from '@mui/icons-material';

import KPICards from '../../../components/shared/KpiCard';
import useStudentLedger from '../../../hooks/useStudentLedger';
import { StatusChip } from '../../../campus/components/finance/financeShared';
import {
  FEE_STATUS_LABEL, FEE_STATUS_COLOR, formatMoney, formatDate,
} from '../../../campus/components/finance/financeConstants';

const StudentFinance = () => {
  const theme = useTheme();
  const { ledger, loading, error } = useStudentLedger({ mine: true });
  const { fees = [], payments = [], totals = {} } = ledger;

  const balance = totals.balance ?? 0;
  const kpis = [
    {
      label: 'Total due',
      value: formatMoney(totals.totalDue ?? 0),
      icon: <AccountBalanceWallet sx={{ fontSize: 28 }} />,
      color: theme.palette.primary.main,
      subtitle: `${fees.length} debt(s)`,
    },
    {
      label: 'Total paid',
      value: formatMoney(totals.totalPaid ?? 0),
      icon: <AccountBalanceWallet sx={{ fontSize: 28 }} />,
      color: theme.palette.success.main,
      subtitle: `${payments.length} payment(s)`,
    },
    {
      label: 'Outstanding balance',
      value: formatMoney(balance),
      icon: <WarningAmber sx={{ fontSize: 28 }} />,
      color: balance > 0 ? theme.palette.error.main : theme.palette.success.main,
      subtitle: balance > 0 ? 'Please settle your balance' : 'All settled',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>My Finance</Typography>
        <Typography variant="body2" color="text.secondary">
          Your fees, payments and outstanding balance.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack alignItems="center" sx={{ py: 8 }}><CircularProgress /></Stack>
      ) : (
        <Stack spacing={3}>
          <KPICards metrics={kpis} />

          {balance > 0 && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              You have an outstanding balance of <strong>{formatMoney(balance)}</strong>.
              Please contact your campus finance office to settle it.
            </Alert>
          )}

          {/* Debts */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              My Debts ({fees.length})
            </Typography>
            {fees.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No fees on record.</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Label</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Due</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Paid</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Balance</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Due date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fees.map((f) => (
                    <TableRow key={f._id} hover>
                      <TableCell>
                        <Typography variant="body2">{f.label}</Typography>
                        {f.academicYear && (
                          <Typography variant="caption" color="text.secondary">{f.academicYear}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{formatMoney(f.amountDue, f.currency)}</TableCell>
                      <TableCell align="right">{formatMoney(f.amountPaid, f.currency)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}
                          color={Math.max(0, (f.amountDue ?? 0) - (f.amountPaid ?? 0)) > 0 ? 'error.main' : 'success.main'}>
                          {formatMoney(Math.max(0, (f.amountDue ?? 0) - (f.amountPaid ?? 0)), f.currency)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(f.dueDate)}</TableCell>
                      <TableCell>
                        <StatusChip status={f.status} labelMap={FEE_STATUS_LABEL} colorMap={FEE_STATUS_COLOR} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>

          <Divider />

          {/* Payments */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              My Payments ({payments.length})
            </Typography>
            {payments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No payments recorded yet.</Typography>
            ) : (
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
                      <TableCell align="right">{formatMoney(p.amount, p.currency)}</TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={p.method} /></TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {p.reference || '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  );
};

export default StudentFinance;
