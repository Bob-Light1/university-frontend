/**
 * @file AiUsageGauge.jsx
 * @description Monthly AI consumption gauge for the campus (GET /ai/usage,
 * CAMPUS_MANAGER+). Shows the active plan, the token budget bar and the
 * remaining balance. A budget of 0 means unlimited (ADMIN); counters may be
 * temporarily unavailable (UPSTREAM_TIMEOUT) — reported, never invented.
 *
 * Reports the resolved plan up via `onLoaded({ plan, code })` so the parent hub
 * can pick which feature tabs to show optimistically.
 */

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper, Stack, Typography, LinearProgress, Chip, Skeleton, Tooltip,
} from '@mui/material';
import { Bolt, WorkspacePremium } from '@mui/icons-material';

import { getAiUsage } from '../../../services/aiService';
import { extractAiError, formatTokens, AI_ERROR_CODES } from './aiConstants';

const PLAN_COLOR = { free: 'default', standard: 'info', premium: 'warning' };

export default function AiUsageGauge({ campusId, onLoaded, compact = false }) {
  const { t } = useTranslation('ai');
  const [state, setState] = useState({ loading: true, data: null, code: null });

  const load = useCallback(() => {
    let cancelled = false;
    getAiUsage({ campusId })
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data ?? null;
        setState({ loading: false, data, code: null });
        onLoaded?.({ plan: data?.plan ?? null, code: null });
      })
      .catch((err) => {
        if (cancelled) return;
        const { code } = extractAiError(err);
        setState({ loading: false, data: null, code });
        onLoaded?.({ plan: null, code });
      });
    return () => { cancelled = true; };
  }, [campusId, onLoaded]);

  useEffect(load, [load]);

  if (state.loading) {
    return <Skeleton variant="rounded" height={compact ? 64 : 96} sx={{ borderRadius: 2 }} />;
  }

  // Counters unavailable but AI enabled → soft note, no gauge.
  if (!state.data) {
    if (state.code === AI_ERROR_CODES.UPSTREAM_TIMEOUT) {
      return (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            {t('usage.unavailable')}
          </Typography>
        </Paper>
      );
    }
    return null; // AI_DISABLED / AI_NOT_ENABLED handled by the hub shell
  }

  const { plan, tokensIn, tokensOut, budget, remaining } = state.data;
  const used = (tokensIn || 0) + (tokensOut || 0);
  const unlimited = !budget || budget <= 0;
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / budget) * 100));
  const barColor = pct >= 90 ? 'error' : pct >= 80 ? 'warning' : 'primary';

  return (
    <Paper variant="outlined" sx={{ p: compact ? 1.5 : 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Bolt sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" fontWeight={700}>
            {t('usage.title')}
          </Typography>
        </Stack>
        <Chip
          size="small"
          icon={<WorkspacePremium sx={{ fontSize: 14 }} />}
          color={PLAN_COLOR[plan] || 'default'}
          label={t(`plans.${plan}`, plan)}
          sx={{ fontWeight: 700, textTransform: 'capitalize' }}
        />
      </Stack>

      {unlimited ? (
        <Typography variant="body2" color="text.secondary">
          {t('usage.unlimited', { used: formatTokens(used) })}
        </Typography>
      ) : (
        <>
          <LinearProgress
            variant="determinate"
            value={pct}
            color={barColor}
            sx={{ height: 8, borderRadius: 4, mb: 0.75 }}
          />
          <Stack direction="row" justifyContent="space-between">
            <Tooltip title={t('usage.breakdown', { in: formatTokens(tokensIn), out: formatTokens(tokensOut) })}>
              <Typography variant="caption" color="text.secondary">
                {t('usage.used', { used: formatTokens(used), budget: formatTokens(budget) })}
              </Typography>
            </Tooltip>
            <Typography variant="caption" fontWeight={700} color={`${barColor}.main`}>
              {t('usage.remaining', { remaining: formatTokens(remaining ?? 0) })}
            </Typography>
          </Stack>
        </>
      )}
    </Paper>
  );
}
