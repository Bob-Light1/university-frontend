import { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Paper, Stack,
} from '@mui/material';
import {
  AdminPanelSettings, Settings, Language,
} from '@mui/icons-material';

import StaffRolesManager from './StaffRolesManager';
import LanguagePreferencesSection from '../../../components/shared/LanguagePreferencesSection';
import CampusDefaultsSection from './CampusDefaultsSection';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;
}

export default function CampusSettings() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 960, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Settings sx={{ fontSize: 28, color: 'text.secondary' }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Campus configuration and system parameters
          </Typography>
        </Box>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            borderBottom: '1px solid',
            borderColor: 'divider',
            px: 2,
            bgcolor: 'background.default',
          }}
        >
          <Tab
            icon={<AdminPanelSettings fontSize="small" />}
            iconPosition="start"
            label="Staff Roles"
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 56 }}
          />
          <Tab
            icon={<Language fontSize="small" />}
            iconPosition="start"
            label="Language & Region"
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 56 }}
          />
          <Tab
            icon={<Settings fontSize="small" />}
            iconPosition="start"
            label="System"
            sx={{ textTransform: 'none', fontWeight: 600, minHeight: 56 }}
          />
        </Tabs>

        <Box sx={{ p: 3 }}>
          <TabPanel value={tab} index={0}>
            <StaffRolesManager />
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Stack spacing={4}>
              <LanguagePreferencesSection />
              <CampusDefaultsSection />
            </Stack>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 3,
                p: 5,
                textAlign: 'center',
              }}
            >
              <Settings sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                System Configuration
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
                Campus profile, academic year settings, and system parameters — coming soon.
              </Typography>
            </Box>
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}
