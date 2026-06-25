/**
 * @file Finance.jsx
 * @description Campus Finance module — top-level shell with 4 tabs.
 *
 * Tab 0 — Overview: KPI dashboard + revenue/expense chart (FinanceOverview)
 * Tab 1 — Fees:     student debts + payments + ledger (FeesManager)
 * Tab 2 — Incomes:  institutional income records (IncomesManager)
 * Tab 3 — Expenses: expenses + approval workflow + categories (ExpensesManager)
 *
 * Route: /campus/:campusId/finance
 * Access: ADMIN / DIRECTOR / CAMPUS_MANAGER (campus-scoped, JWT-derived).
 */

import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Tabs, Tab, Typography, Stack, useTheme,
} from '@mui/material';
import {
  Dashboard, ReceiptLong, Payments, MoneyOff, AccountBalanceWallet,
} from '@mui/icons-material';

import FinanceOverview from './FinanceOverview';
import FeesManager     from './FeesManager';
import IncomesManager  from './IncomesManager';
import ExpensesManager from './ExpensesManager';

export default function Finance() {
  const theme = useTheme();
  const { campusId } = useParams();
  const { t } = useTranslation('finance');
  const [tab, setTab] = useState(0);

  const TABS = [
    { label: t('tabs.overview'), icon: <Dashboard    sx={{ fontSize: 18 }} />, color: theme.palette.primary.main },
    { label: t('tabs.fees'),     icon: <ReceiptLong  sx={{ fontSize: 18 }} />, color: theme.palette.info.main    },
    { label: t('tabs.incomes'),  icon: <Payments     sx={{ fontSize: 18 }} />, color: theme.palette.success.main },
    { label: t('tabs.expenses'), icon: <MoneyOff     sx={{ fontSize: 18 }} />, color: theme.palette.error.main   },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header + tab bar ──────────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1.5, bgcolor: 'background.paper' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
          <AccountBalanceWallet sx={{ color: theme.palette.primary.main, fontSize: 22 }} />
          <Typography variant="h6" fontWeight={700} sx={{ color: theme.palette.primary.main }}>
            {t('title')}
          </Typography>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          TabIndicatorProps={{ sx: { bgcolor: TABS[tab]?.color } }}
        >
          {TABS.map(({ label, icon, color }) => (
            <Tab
              key={label}
              label={label}
              icon={icon}
              iconPosition="start"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 44,
                '&.Mui-selected': { color },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* ── Tab content ───────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {tab === 0 && <FinanceOverview campusId={campusId} onNavigate={setTab} />}
        {tab === 1 && <FeesManager     campusId={campusId} />}
        {tab === 2 && <IncomesManager  campusId={campusId} />}
        {tab === 3 && <ExpensesManager campusId={campusId} />}
      </Box>
    </Box>
  );
}
