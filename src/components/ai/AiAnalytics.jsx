/**
 * @file AiAnalytics.jsx
 * @description AI-assisted descriptive analytics (Feature 2, POST
 * /ai/analytics/:report). Pick a report, set its whitelisted params, run it:
 * the panel shows the verified ERP `figures` (computed by the ERP, never the
 * AI — ADR-4) and the AI `narrative` in the user's preferred language. The
 * narrative describes the figures; it never invents or recomputes them.
 *
 * Available to staffing roles; ANALYTICS feature gating is enforced server-side
 * (AI_FEATURE_NOT_IN_PLAN → full notice).
 *
 * Props:
 *  campusId  string|undefined — campus targeted by a GLOBAL role (ADMIN /
 *    DIRECTOR). Aggregates are campus-scoped by construction, so a global role
 *    without a campus target gets a 400 from the internal aggregate API.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Paper, Typography, Button, ToggleButtonGroup, ToggleButton,
  CircularProgress, Alert, Divider, Chip,
} from '@mui/material';
import {
  Insights, School, EventAvailable, TrendingDown, AutoAwesome, Refresh,
} from '@mui/icons-material';

import AiParamsBar from './AiParamsBar';
import AiFigures from './AiFigures';
import AiUnavailable from './AiUnavailable';
import { runAiAnalytics } from '../../services/aiService';
import {
  AI_ANALYTICS_REPORTS, ANALYTICS_REPORT_ORDER,
  extractAiError, errorKey, isUnavailableError,
} from './aiConstants';

/** Report → whitelisted params (mirror of ai.aggregates.js) + presentation. */
const REPORTS = {
  [AI_ANALYTICS_REPORTS.CLASS_PERFORMANCE]: { params: ['academicYear', 'semester'], icon: School },
  [AI_ANALYTICS_REPORTS.ATTENDANCE_SUMMARY]: { params: [], icon: EventAvailable },
  [AI_ANALYTICS_REPORTS.DROPOUT_RISK]: { params: ['academicYear', 'semester'], icon: TrendingDown },
};

export default function AiAnalytics({ campusId }) {
  const { t } = useTranslation('ai');
  const [report, setReport] = useState(ANALYTICS_REPORT_ORDER[0]);
  const [params, setParams] = useState({});
  const [result, setResult] = useState(null);   // { figures, narrative, snapshotId, generatedAt }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blocked, setBlocked] = useState(null);

  const changeReport = (_, value) => {
    if (!value) return;
    setReport(value);
    setParams({});
    setResult(null);
    setError(null);
  };

  const setParam = (key, value) =>
    setParams((p) => {
      if (value === '') { const next = { ...p }; delete next[key]; return next; }
      return { ...p, [key]: value };
    });

  const run = () => {
    setLoading(true);
    setError(null);
    runAiAnalytics(report, params, campusId)
      .then((res) => setResult(res.data?.data ?? null))
      .catch((err) => {
        const norm = extractAiError(err);
        if (isUnavailableError(norm.code)) setBlocked(norm.code);
        else setError(norm);
        setResult(null);
      })
      .finally(() => setLoading(false));
  };

  if (blocked) return <AiUnavailable code={blocked} onRetry={() => setBlocked(null)} />;

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, height: '100%', overflow: 'auto' }}>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>{t('analytics.title')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('analytics.subtitle')}</Typography>
      </Stack>

      {/* Report picker */}
      <ToggleButtonGroup
        value={report}
        exclusive
        onChange={changeReport}
        sx={{ flexWrap: 'wrap', gap: 1, mb: 2, '& .MuiToggleButton-root': { border: '1px solid', borderColor: 'divider', borderRadius: 2, textTransform: 'none', px: 2 } }}
      >
        {ANALYTICS_REPORT_ORDER.map((key) => {
          const Icon = REPORTS[key].icon;
          return (
            <ToggleButton key={key} value={key}>
              <Icon sx={{ fontSize: 18, mr: 1 }} />
              {t(`analytics.reports.${key}`)}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>

      {/* Params + run */}
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <AiParamsBar
          fields={REPORTS[report].params}
          values={params}
          onChange={setParam}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={run}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Insights />}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {t('analytics.run')}
        </Button>
        {result && (
          <Button
            variant="text"
            onClick={run}
            disabled={loading}
            startIcon={<Refresh />}
            sx={{ textTransform: 'none' }}
          >
            {t('analytics.refresh')}
          </Button>
        )}
      </Stack>

      {error && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {t(errorKey(error.code), { defaultValue: error.message })}
        </Alert>
      )}

      {loading && !result && (
        <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
      )}

      {result && (
        <Stack spacing={2}>
          {/* AI narrative */}
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 2, borderColor: 'secondary.main', bgcolor: 'action.hover' }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <AutoAwesome sx={{ fontSize: 18, color: 'secondary.main' }} />
              <Typography variant="subtitle2" fontWeight={700}>{t('analytics.narrative')}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {result.narrative || t('analytics.noNarrative')}
            </Typography>
          </Paper>

          <Divider textAlign="left">
            <Chip size="small" label={t('analytics.figures')} />
          </Divider>

          <AiFigures figures={result.figures} />

          {result.generatedAt && (
            <Typography variant="caption" color="text.secondary">
              {t('analytics.generatedAt', { date: new Date(result.generatedAt).toLocaleString() })}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}
