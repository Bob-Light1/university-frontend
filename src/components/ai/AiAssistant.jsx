/**
 * @file AiAssistant.jsx
 * @description Campus AI hub — the single surface that consumes the Phase 3 AI
 * gateway (aiService.js). Four capabilities behind tabs:
 *   - Chat:      RAG assistant over authorized documents (SSE)
 *   - Search:    hybrid semantic search of the document library
 *   - Analytics: AI-narrated descriptive reports over ERP aggregates
 *   - Advisors:  deterministic business proposals (human-in-the-loop)
 * plus a monthly consumption gauge in the header.
 *
 * Mounted by two shells:
 *   - /campus/:campusId/ai      → campus portal (campusId from the route)
 *   - /admin/ai · /director/ai  → AiWorkspace passes the selected campusId
 * Access: ADMIN / DIRECTOR / CAMPUS_MANAGER.
 *
 * `campusId` is forwarded to every panel and travels to the gateway as a query
 * parameter. It only ever *narrows* a global role (ADMIN/DIRECTOR) to one
 * tenant: for scoped roles the gateway derives the campus from the JWT and
 * ignores the parameter, so it can never widen anyone's scope (§4.1).
 *
 * Gating is layered: the usage gauge resolves the plan and, when the whole
 * campus subscription is off (AI_DISABLED / AI_NOT_ENABLED), the hub shows a
 * single notice. Per-feature availability (plan features) is enforced by the
 * gateway on each call — every panel degrades on AI_FEATURE_NOT_IN_PLAN on its
 * own, so tabs stay visible and explain themselves when opened.
 */

import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Tabs, Tab, Typography, Stack, useTheme,
} from '@mui/material';
import {
  AutoAwesome, Forum, TravelExplore, Insights, Lightbulb,
} from '@mui/icons-material';

import AiChat from './AiChat';
import AiSearch from './AiSearch';
import AiAnalytics from './AiAnalytics';
import AiAdvisors from './AiAdvisors';
import AiUsageGauge from './AiUsageGauge';
import AiUnavailable from './AiUnavailable';
import {
  AI_FEATURES, AI_PLAN_FEATURES, AI_ERROR_CODES,
} from './aiConstants';

export default function AiAssistant({ campusId: campusIdProp }) {
  const theme = useTheme();
  const { campusId: routeCampusId } = useParams();
  const campusId = campusIdProp ?? routeCampusId;
  const { t } = useTranslation('ai');

  const [tab, setTab] = useState(0);
  const [plan, setPlan] = useState(null);
  const [features, setFeatures] = useState(null); // effective per-campus toggles
  const [campusBlocked, setCampusBlocked] = useState(null); // AI_DISABLED / AI_NOT_ENABLED

  // The gauge is the single source that probes entitlement on mount.
  const onUsageLoaded = useCallback(({ plan: p, features: f, code }) => {
    setPlan(p);
    setFeatures(f ?? null);
    if (code === AI_ERROR_CODES.AI_DISABLED || code === AI_ERROR_CODES.AI_NOT_ENABLED) {
      setCampusBlocked(code);
    } else {
      setCampusBlocked(null);
    }
  }, []);

  // Which feature tabs to show. Prefer the campus's effective feature toggles
  // (which may override the plan preset); fall back to the plan preset, then to
  // showing all. The panels themselves still gate on AI_FEATURE_NOT_IN_PLAN.
  const effectiveFeatures = features ?? (plan ? AI_PLAN_FEATURES[plan] : null);
  const has = (f) => !effectiveFeatures || effectiveFeatures[f];

  // Every panel is keyed on campusId: switching tenant remounts it, so a chat
  // thread, a result list or a report never survives into another campus's
  // context (the chat also aborts its in-flight stream on unmount).
  const TABS = [
    { key: AI_FEATURES.CHAT, label: t('tabs.chat'), icon: <Forum sx={{ fontSize: 18 }} />, color: theme.palette.primary.main, node: <AiChat key={campusId} campusId={campusId} /> },
    { key: AI_FEATURES.SEARCH, label: t('tabs.search'), icon: <TravelExplore sx={{ fontSize: 18 }} />, color: theme.palette.info.main, node: <AiSearch key={campusId} campusId={campusId} /> },
    { key: AI_FEATURES.ANALYTICS, label: t('tabs.analytics'), icon: <Insights sx={{ fontSize: 18 }} />, color: theme.palette.success.main, node: <AiAnalytics key={campusId} campusId={campusId} /> },
    { key: AI_FEATURES.ADVISORS, label: t('tabs.advisors'), icon: <Lightbulb sx={{ fontSize: 18 }} />, color: theme.palette.warning.main, node: <AiAdvisors key={campusId} campusId={campusId} /> },
  ].filter((x) => has(x.key));

  const safeTab = Math.min(tab, Math.max(TABS.length - 1, 0));
  const active = TABS[safeTab];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header + usage gauge ─────────────────────────────────────────── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: { xs: 1.5, md: 3 }, pt: 1.5, bgcolor: 'background.paper' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 0.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <AutoAwesome sx={{ color: theme.palette.secondary.main, fontSize: 24 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: theme.palette.secondary.main, lineHeight: 1.2 }}>
                {t('title')}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('subtitle')}</Typography>
            </Box>
          </Stack>
          <Box sx={{ minWidth: { md: 280 } }}>
            <AiUsageGauge campusId={campusId} onLoaded={onUsageLoaded} compact />
          </Box>
        </Stack>

        {!campusBlocked && (
          <Tabs
            value={safeTab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{ sx: { bgcolor: active?.color } }}
          >
            {TABS.map(({ key, label, icon }) => (
              <Tab
                key={key}
                label={label}
                icon={icon}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600, minHeight: 44 }}
              />
            ))}
          </Tabs>
        )}
      </Box>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'hidden', p: campusBlocked ? 0 : { xs: 1, md: 2 }, minHeight: 0 }}>
        {campusBlocked ? (
          <AiUnavailable code={campusBlocked} />
        ) : (
          active?.node
        )}
      </Box>
    </Box>
  );
}
