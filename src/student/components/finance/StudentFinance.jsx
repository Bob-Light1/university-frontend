/**
 * @file StudentFinance.jsx
 * @description Student self-service finance view (read-only).
 * Shows the student's own ledger — debts, payments and totals — via
 * GET /finance/my/ledger. No mutations are available to students.
 *
 * Route: /student/finance
 */

import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Typography, Paper, Alert, Divider, Chip,
  Table, TableHead, TableRow, TableCell, TableBody,
  CircularProgress, useTheme,
} from '@mui/material';
import { AccountBalanceWallet, WarningAmber } from '@mui/icons-material';

import KPICards from '../../../components/shared/KpiCard';
import useStudentLedger from '../../../hooks/useStudentLedger';
import { StatusChip } from '../../../campus/components/finance/financeShared';
import { useFinanceLabels } from '../../../campus/components/finance/useFinanceLabels';
import {
  FEE_STATUS_COLOR, formatMoney, formatDate,
} from '../../../campus/components/finance/financeConstants';

const StudentFinance = () => {
  const theme = useTheme();
  const { t } = useTranslation('finance');
  const { feeStatus: feeStatusLabel } = useFinanceLabels();
  const { ledger, loading, error } = useStudentLedger({ mine: true });
  const { fees = [], payments = [], totals = {} } = ledger;

  const balance = totals.balance ?? 0;
  const kpis = [
    {
      label: t('student.kpi.totalDue'),
      value: formatMoney(totals.totalDue ?? 0),
      icon: <AccountBalanceWallet sx={{ fontSize: 28 }} />,
      color: theme.palette.primary.main,
      subtitle: t('student.kpi.debtsCount', { count: fees.length }),
    },
    {
      label: t('student.kpi.totalPaid'),
      value: formatMoney(totals.totalPaid ?? 0),
      icon: <AccountBalanceWallet sx={{ fontSize: 28 }} />,
      color: theme.palette.success.main,
      subtitle: t('student.kpi.paymentsCount', { count: payments.length }),
    },
    {
      label: t('student.kpi.outstandingBalance'),
      value: formatMoney(balance),
      icon: <WarningAmber sx={{ fontSize: 28 }} />,
      color: balance > 0 ? theme.palette.error.main : theme.palette.success.main,
      subtitle: balance > 0 ? t('student.kpi.settle') : t('student.kpi.allSettled'),
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>{t('student.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('student.subtitle')}
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
              {t('student.warning', { amount: formatMoney(balance) })}
            </Alert>
          )}

          {/* Debts */}
          <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
              {t('student.myDebts', { count: fees.length })}
            </Typography>
            {fees.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{t('student.noFees')}</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('fields.label')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">{t('fields.due')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">{t('fields.paid')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">{t('fields.balance')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('fields.dueDate')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('fields.status')}</TableCell>
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
                        <StatusChip status={f.status} labelMap={feeStatusLabel} colorMap={FEE_STATUS_COLOR} />
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
              {t('student.myPayments', { count: payments.length })}
            </Typography>
            {payments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">{t('student.noPayments')}</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('fields.date')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">{t('fields.amount')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('fields.method')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('fields.reference')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p._id} hover>
                      <TableCell>{formatDate(p.paidAt)}</TableCell>
                      <TableCell align="right">{formatMoney(p.amount, p.currency)}</TableCell>
                      <TableCell><Chip size="small" variant="outlined" label={p.method ? t(`enums.paymentMethod.${p.method}`) : '—'} /></TableCell>
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
