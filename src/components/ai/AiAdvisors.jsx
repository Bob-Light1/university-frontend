/**
 * @file AiAdvisors.jsx
 * @description Business advisors (Feature §6.6, POST /ai/advisors/:advisor).
 * A deterministic engine runs over fresh, role-gated ERP aggregates and the AI
 * only words the proposals — strict proposal mode, zero ERP write. Each
 * proposal's `suggestedAction` is rendered as a normal, permission-gated ERP
 * deep-link the human may follow: the AI never executes it (human-in-the-loop).
 *
 * Direction roles only (ADMIN / DIRECTOR / CAMPUS_MANAGER); ADVISORS feature
 * gating is enforced server-side. Zero proposals is a legitimate, quiet state.
 *
 * Props:
 *  campusId  string — campus the proposals are computed for. Also the base of
 *    the `suggestedAction` deep-links (/campus/:campusId/…): ADMIN and DIRECTOR
 *    reach any campus subtree through CampusGuard, so one route shape fits all
 *    three direction roles.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Paper, Typography, Button, ToggleButtonGroup, ToggleButton,
  CircularProgress, Alert, Chip, Divider,
} from '@mui/material';
import {
  AccountBalanceWallet, School, Campaign, Lightbulb, PlayArrow,
  ArrowForward, CheckCircleOutline,
} from '@mui/icons-material';

import AiParamsBar from './AiParamsBar';
import CitationList from './CitationList';
import AiUnavailable from './AiUnavailable';
import { runAiAdvisor } from '../../services/aiService';
import {
  AI_ADVISORS, ADVISOR_ORDER,
  extractAiError, errorKey, isUnavailableError,
} from './aiConstants';

/** Advisor → whitelisted params (mirror of ai.aggregates.js) + presentation. */
const ADVISORS = {
  [AI_ADVISORS.FINANCE]: { params: ['months'], icon: AccountBalanceWallet },
  [AI_ADVISORS.ACADEMIC]: { params: ['academicYear', 'semester'], icon: School },
  [AI_ADVISORS.MARKETING]: { params: [], icon: Campaign },
};

/**
 * Maps a proposal suggestedAction.type to an ERP screen (relative to the
 * campus). The target screen re-applies the user's own permissions — this is
 * only navigation, never a mutation. Unknown types render as a plain label.
 */
const ACTION_ROUTE = {
  OPEN_OVERDUE_FEES: 'finance',
  OPEN_FINANCIAL_SUMMARY: 'finance',
  OPEN_DROPOUT_RISK_LIST: 'results',
  OPEN_ATTENDANCE_DASHBOARD: 'attendance',
  OPEN_LEAD_PIPELINE: 'partners',
  OPEN_LEAD_FRAUD_REVIEW: 'partners',
  OPEN_LEAD_ANALYTICS: 'partners',
};

function ProposalCard({ proposal, onAction }) {
  const { t } = useTranslation('ai');
  const action = proposal.suggestedAction;
  const hasRoute = action?.type && ACTION_ROUTE[action.type];

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" spacing={1} alignItems="flex-start">
        <Lightbulb sx={{ color: 'warning.main', mt: 0.25 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700}>{proposal.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
            {proposal.rationale}
          </Typography>

          {Array.isArray(proposal.evidence) && proposal.evidence.length > 0 && (
            <Box sx={{ mt: 1.5 }}>
              <CitationList items={proposal.evidence} dense />
            </Box>
          )}

          {action?.type && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1.5 }}>
              {hasRoute ? (
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<ArrowForward />}
                  onClick={() => onAction(action)}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  {t(`advisors.actions.${action.type}`, t('advisors.openScreen'))}
                </Button>
              ) : (
                <Chip size="small" variant="outlined" label={t(`advisors.actions.${action.type}`, action.type)} />
              )}
              <Typography variant="caption" color="text.secondary">
                {t('advisors.proposalOnly')}
              </Typography>
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

export default function AiAdvisors({ campusId }) {
  const { t } = useTranslation('ai');
  const navigate = useNavigate();

  const [advisor, setAdvisor] = useState(ADVISOR_ORDER[0]);
  const [params, setParams] = useState({});
  const [result, setResult] = useState(null);   // { proposals, engine }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blocked, setBlocked] = useState(null);

  const changeAdvisor = (_, value) => {
    if (!value) return;
    setAdvisor(value);
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
    runAiAdvisor(advisor, params, campusId)
      .then((res) => setResult(res.data?.data ?? null))
      .catch((err) => {
        const norm = extractAiError(err);
        if (isUnavailableError(norm.code)) setBlocked(norm.code);
        else setError(norm);
        setResult(null);
      })
      .finally(() => setLoading(false));
  };

  const handleAction = (action) => {
    const screen = ACTION_ROUTE[action.type];
    if (screen && campusId) navigate(`/campus/${campusId}/${screen}`);
  };

  if (blocked) return <AiUnavailable code={blocked} onRetry={() => setBlocked(null)} />;

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, height: '100%', overflow: 'auto' }}>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>{t('advisors.title')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('advisors.subtitle')}</Typography>
      </Stack>

      <ToggleButtonGroup
        value={advisor}
        exclusive
        onChange={changeAdvisor}
        sx={{ flexWrap: 'wrap', gap: 1, mb: 2, '& .MuiToggleButton-root': { border: '1px solid', borderColor: 'divider', borderRadius: 2, textTransform: 'none', px: 2 } }}
      >
        {ADVISOR_ORDER.map((key) => {
          const Icon = ADVISORS[key].icon;
          return (
            <ToggleButton key={key} value={key}>
              <Icon sx={{ fontSize: 18, mr: 1 }} />
              {t(`advisors.names.${key}`)}
            </ToggleButton>
          );
        })}
      </ToggleButtonGroup>

      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <AiParamsBar
          fields={ADVISORS[advisor].params}
          values={params}
          onChange={setParam}
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={run}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {t('advisors.run')}
        </Button>
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
          {result.proposals?.length > 0 ? (
            <>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip size="small" color="warning" label={t('advisors.proposalCount', { count: result.proposals.length })} />
                {result.engine?.modelVersion && (
                  <Typography variant="caption" color="text.secondary">
                    {t('advisors.engine', { version: result.engine.modelVersion })}
                  </Typography>
                )}
              </Stack>
              {result.proposals.map((p, i) => (
                <ProposalCard key={i} proposal={p} onAction={handleAction} />
              ))}
            </>
          ) : (
            <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
              <CheckCircleOutline sx={{ fontSize: 44, color: 'success.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight={700}>{t('advisors.noProposalsTitle')}</Typography>
              <Typography variant="body2" color="text.secondary">{t('advisors.noProposalsHint')}</Typography>
            </Paper>
          )}

          <Divider />
          <Typography variant="caption" color="text.secondary">{t('advisors.disclaimer')}</Typography>
        </Stack>
      )}
    </Box>
  );
}
