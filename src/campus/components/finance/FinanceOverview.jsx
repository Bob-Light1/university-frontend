/**
 * @file FinanceOverview.jsx
 * @description Finance dashboard — KPI cards (income / expense / net / overdue
 * debts), a year/month period selector, a monthly revenue-vs-expense chart and
 * quick shortcuts to the create flows on the other tabs.
 *
 * KPIs come from GET /finance/summary; the overdue-debt count is read from the
 * fees list total (status=overdue). The chart is fed by 12 monthly summary
 * calls (see useFinanceSummary).
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Typography, Button, Paper, Alert, useTheme,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AccountBalance, WarningAmber,
  AddCard, Payment, ReceiptLong, MoneyOff,
} from '@mui/icons-material';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  CartesianGrid, Legend,
} from 'recharts';

import KPICards from '../../../components/shared/KpiCard';
import { PeriodSelector } from './financeShared';
import { formatMoney } from './financeConstants';
import useFinanceSummary from '../../../hooks/useFinanceSummary';
import { listFees } from '../../../services/financeService';

const FinanceOverview = ({ campusId, onNavigate }) => {
  const theme = useTheme();
  const { t } = useTranslation('finance');
  const { period, setPeriod, summary, monthly, loading, error } = useFinanceSummary(campusId);
  const [overdueCount, setOverdueCount] = useState(null);

  // Outstanding (overdue) debts count — read from the fees list total.
  useEffect(() => {
    let cancelled = false;
    listFees({ status: 'overdue', limit: 1, campusId })
      .then((res) => { if (!cancelled) setOverdueCount(res.data?.pagination?.total ?? 0); })
      .catch(() => { if (!cancelled) setOverdueCount(null); });
    return () => { cancelled = true; };
  }, [campusId]);

  const handlePeriod = (key, value) => setPeriod((p) => ({ ...p, [key]: value }));

  const net = summary.net ?? 0;
  const kpis = [
    {
      label: t('overview.kpi.incomeReceived'),
      value: formatMoney(summary.income?.total ?? 0),
      icon: <TrendingUp sx={{ fontSize: 28 }} />,
      color: theme.palette.success.main,
      subtitle: t('overview.kpi.records', { count: summary.income?.count ?? 0 }),
    },
    {
      label: t('overview.kpi.expensesPaid'),
      value: formatMoney(summary.expense?.total ?? 0),
      icon: <TrendingDown sx={{ fontSize: 28 }} />,
      color: theme.palette.error.main,
      subtitle: t('overview.kpi.records', { count: summary.expense?.count ?? 0 }),
    },
    {
      label: t('overview.kpi.netBalance'),
      value: formatMoney(net),
      icon: <AccountBalance sx={{ fontSize: 28 }} />,
      color: net >= 0 ? theme.palette.primary.main : theme.palette.warning.main,
      subtitle: net >= 0 ? t('overview.kpi.surplus') : t('overview.kpi.deficit'),
    },
    {
      label: t('overview.kpi.overdueDebts'),
      value: overdueCount ?? '—',
      icon: <WarningAmber sx={{ fontSize: 28 }} />,
      color: theme.palette.warning.main,
      subtitle: t('overview.kpi.studentsPastDue'),
    },
  ];

  const SHORTCUTS = [
    { label: t('overview.shortcuts.newFee'),     icon: <AddCard />,     tab: 1, color: theme.palette.info.main },
    { label: t('overview.shortcuts.newPayment'), icon: <Payment />,     tab: 1, color: theme.palette.info.dark },
    { label: t('overview.shortcuts.newIncome'),  icon: <ReceiptLong />, tab: 2, color: theme.palette.success.main },
    { label: t('overview.shortcuts.newExpense'), icon: <MoneyOff />,    tab: 3, color: theme.palette.error.main },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header + period */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('overview.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('overview.subtitle')}
          </Typography>
        </Box>
        <PeriodSelector year={period.year} month={period.month} onChange={handlePeriod} />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* KPIs */}
      <Box sx={{ mb: 3 }}>
        <KPICards metrics={kpis} loading={loading} />
      </Box>

      {/* Shortcuts */}
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {SHORTCUTS.map((s) => (
          <Button
            key={s.label}
            variant="outlined"
            startIcon={s.icon}
            onClick={() => onNavigate?.(s.tab)}
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: s.color, color: s.color }}
          >
            {s.label}
          </Button>
        ))}
      </Stack>

      {/* Monthly chart */}
      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2.5 }, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
          {t('overview.chart.title', { year: period.year || '—' })}
        </Typography>
        <Box sx={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={monthly} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" fontSize={12} tickFormatter={(m) => t(`enums.months.${m}`).slice(0, 3)} />
              <YAxis fontSize={12} width={70} tickFormatter={(v) => v.toLocaleString()} />
              <RTooltip formatter={(v) => formatMoney(v)} labelFormatter={(m) => t(`enums.months.${m}`)} />
              <Legend />
              <Bar dataKey="income"  name={t('overview.chart.income')}  fill={theme.palette.success.main} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name={t('overview.chart.expense')} fill={theme.palette.error.main}   radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default FinanceOverview;
