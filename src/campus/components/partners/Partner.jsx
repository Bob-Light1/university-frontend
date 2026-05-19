/**
 * @file Partner.jsx
 * @description Campus Partner module — top-level shell with 3 tabs.
 *
 * Tab 0 — Partners:    Partner list + CRUD (PartnerManager)
 * Tab 1 — Leads:       Lead pipeline (LeadPipeline)
 * Tab 2 — Commissions: Commission manager (CommissionManager)
 *
 * Route: /campus/:campusId/partners
 */

import { useState } from 'react';
import {
  Box, Tabs, Tab, Typography, Stack,
  useTheme,
} from '@mui/material';
import { Handshake, People, AttachMoney } from '@mui/icons-material';

import PartnerManager    from './PartnerManager';
import LeadPipeline      from './LeadPipeline';
import CommissionManager from './CommissionManager';

// ─── Component ────────────────────────────────────────────────────────────────

export default function Partner() {
  const theme = useTheme();
  const [tab, setTab] = useState(0);

  const TABS = [
    { label: 'Partners',    icon: <Handshake   sx={{ fontSize: 18 }} />, activeColor: '#ff7f3e' },
    { label: 'Leads',       icon: <People      sx={{ fontSize: 18 }} />, activeColor: theme.palette.info.main    },
    { label: 'Commissions', icon: <AttachMoney sx={{ fontSize: 18 }} />, activeColor: theme.palette.success.main },
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Tab bar ───────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          borderBottom: 1, borderColor: 'divider',
          px: 3, pt: 1.5, bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
          <Handshake sx={{ color: '#ff7f3e', fontSize: 22 }} />
          <Typography variant="h6" fontWeight={800} sx={{ color: '#ff7f3e' }}>
            Partner Module
          </Typography>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          TabIndicatorProps={{ sx: { bgcolor: TABS[tab]?.activeColor } }}
        >
          {TABS.map(({ label, icon, activeColor }) => (
            <Tab
              key={label}
              label={label}
              icon={icon}
              iconPosition="start"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                minHeight: 44,
                '&.Mui-selected': { color: activeColor },
              }}
            />
          ))}
        </Tabs>
      </Box>

      {/* ── Tab content ───────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {tab === 0 && <PartnerManager />}
        {tab === 1 && <LeadPipeline />}
        {tab === 2 && <CommissionManager />}
      </Box>
    </Box>
  );
}
