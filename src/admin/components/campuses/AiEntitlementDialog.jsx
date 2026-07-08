/**
 * @file AiEntitlementDialog.jsx
 * @description Admin console — per-campus AI "Premium" entitlement editor
 * (Phase 3 — PHASE3_AI_DESIGN.md §11.3). Reads and writes the single source of
 * truth stored on the Campus document via the ADMIN-only endpoints:
 *
 *   GET /admin/campuses/:id/ai-entitlement  → current entitlement + audit trail
 *   PUT /admin/campuses/:id/ai-entitlement  → update (partial, backend merges)
 *
 * The backend applies the D10 preset (budget + feature set) when the plan
 * changes without an explicit override; this dialog previews that preset
 * locally so the admin sees the effect before saving, and leaves every field
 * overridable. Nothing here is trusted for security — the gateway re-enforces
 * plan / feature / budget on every AI call.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Stack, Typography, Divider, IconButton, Button, Switch,
  FormControl, InputLabel, Select, MenuItem, TextField, Chip,
  FormControlLabel, FormGroup, Alert, CircularProgress, Skeleton,
  Accordion, AccordionSummary, AccordionDetails, Tooltip,
} from '@mui/material';
import {
  Close, AutoAwesome, ExpandMore, HistoryToggleOff, RestartAlt,
} from '@mui/icons-material';

import {
  getCampusAiEntitlement,
  updateCampusAiEntitlement,
} from '../../../services/admin_service';
import {
  AI_PLANS, AI_FEATURES, AI_PLAN_FEATURES, AI_PLAN_BUDGETS, formatTokens,
} from '../../../components/ai/aiConstants';
import { ADMIN_GRADIENT } from '../../../theme/adminTokens';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_OPTIONS = [AI_PLANS.FREE, AI_PLANS.STANDARD, AI_PLANS.PREMIUM];

const FEATURE_META = [
  { key: AI_FEATURES.CHAT, labelKey: 'feature.chat' },
  { key: AI_FEATURES.SEARCH, labelKey: 'feature.search' },
  { key: AI_FEATURES.ANALYTICS, labelKey: 'feature.analytics' },
  { key: AI_FEATURES.ADVISORS, labelKey: 'feature.advisors' },
];

/** Defaults for a campus that has never been provisioned. */
const emptyEntitlement = () => ({
  enabled: false,
  plan: AI_PLANS.FREE,
  llmProfile: 'free',
  monthlyTokenBudget: AI_PLAN_BUDGETS[AI_PLANS.FREE],
  features: { ...AI_PLAN_FEATURES[AI_PLANS.FREE] },
});

/** Normalises the API entitlement into a complete, editable form shape. */
const toForm = (ent) => {
  const base = emptyEntitlement();
  if (!ent) return base;
  return {
    enabled: Boolean(ent.enabled),
    plan: ent.plan ?? base.plan,
    llmProfile: ent.llmProfile ?? base.llmProfile,
    monthlyTokenBudget: Number.isFinite(ent.monthlyTokenBudget)
      ? ent.monthlyTokenBudget
      : base.monthlyTokenBudget,
    features: { ...base.features, ...(ent.features || {}) },
  };
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {boolean}  props.open
 * @param {Object}   props.campus       - { _id, campus_name } (list row).
 * @param {Function} props.onClose
 * @param {Function} props.onSaved      - (campusName) => void, for the parent snackbar.
 */
export default function AiEntitlementDialog({ open, campus, onClose, onSaved }) {
  const { t: tBase } = useAppTranslation(['admin', 'common']);
  // Scoped translator: `t('plan')` → `aiEntitlement.plan`.
  const t = useCallback((key, opts) => tBase(`aiEntitlement.${key}`, opts), [tBase]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyEntitlement());
  const [audit, setAudit] = useState([]);
  const [everProvisioned, setEverProvisioned] = useState(false);

  const campusId = campus?._id;

  const load = useCallback(async () => {
    if (!campusId) return;
    setLoading(true);
    setError('');
    try {
      const res = await getCampusAiEntitlement(campusId);
      const data = res.data?.data || {};
      setForm(toForm(data.aiEntitlement));
      setAudit(Array.isArray(data.audit) ? data.audit : []);
      setEverProvisioned(Boolean(data.aiEntitlement));
    } catch (err) {
      setError(err.response?.data?.message || t('loadError'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  // ── Field handlers ──────────────────────────────────────────────────────────

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  /**
   * Switching plan mirrors the backend D10 preset (budget + feature set), which
   * the server would otherwise apply. The admin can still override afterwards.
   */
  const handlePlanChange = (plan) =>
    setForm((f) => ({
      ...f,
      plan,
      monthlyTokenBudget: AI_PLAN_BUDGETS[plan] ?? f.monthlyTokenBudget,
      features: { ...AI_PLAN_FEATURES[plan] },
    }));

  const toggleFeature = (key) =>
    setForm((f) => ({ ...f, features: { ...f.features, [key]: !f.features[key] } }));

  const applyPreset = () => handlePlanChange(form.plan);

  const budgetError =
    form.monthlyTokenBudget === '' ||
    !Number.isInteger(Number(form.monthlyTokenBudget)) ||
    Number(form.monthlyTokenBudget) < 0;

  const canSave = !loading && !saving && !budgetError && form.llmProfile.trim().length > 0;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await updateCampusAiEntitlement(campusId, {
        enabled: form.enabled,
        plan: form.plan,
        llmProfile: form.llmProfile.trim(),
        monthlyTokenBudget: Number(form.monthlyTokenBudget),
        features: form.features,
      });
      onSaved?.(res.data?.data?.campusName || campus?.campus_name || t('fallbackCampus'));
      onClose?.();
    } catch (err) {
      const errs = err.response?.data?.errors;
      const detail = Array.isArray(errs) ? errs.map((e) => e.message).join(' · ') : null;
      setError(detail || err.response?.data?.message || t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center',
            background: ADMIN_GRADIENT, color: '#fff', flexShrink: 0,
          }}>
            <AutoAwesome fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>{t('title')}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {campus?.campus_name}
            </Typography>
          </Box>
        </Stack>
        <IconButton
          onClick={onClose}
          disabled={saving}
          sx={{ position: 'absolute', top: 12, right: 12 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {loading ? (
          <Stack spacing={2} sx={{ py: 1 }}>
            {[1, 2, 3, 4].map((k) => <Skeleton key={k} variant="rounded" height={52} />)}
          </Stack>
        ) : (
          <Stack spacing={2.5} sx={{ pt: 1 }}>

            {!everProvisioned && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                {t('neverProvisioned')}
              </Alert>
            )}

            {/* Enabled */}
            <FormControlLabel
              control={
                <Switch
                  checked={form.enabled}
                  onChange={(e) => setField('enabled', e.target.checked)}
                  color="success"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {t('enabledLabel')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('enabledDesc')}
                  </Typography>
                </Box>
              }
            />

            <Divider />

            {/* Plan + preset */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }}>
              <FormControl size="small" fullWidth>
                <InputLabel>{t('plan')}</InputLabel>
                <Select
                  label={t('plan')}
                  value={form.plan}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  {PLAN_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p} sx={{ textTransform: 'capitalize' }}>
                      {t('planOption', { plan: p, tokens: formatTokens(AI_PLAN_BUDGETS[p]) })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title={t('presetTooltip')}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<RestartAlt />}
                  onClick={applyPreset}
                  sx={{ borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap' }}
                >
                  {t('preset')}
                </Button>
              </Tooltip>
            </Stack>

            {/* LLM profile */}
            <TextField
              size="small"
              label={t('llmProfile')}
              value={form.llmProfile}
              onChange={(e) => setField('llmProfile', e.target.value)}
              error={form.llmProfile.trim().length === 0}
              helperText={t('llmProfileHelper')}
              inputProps={{ maxLength: 50 }}
              fullWidth
            />

            {/* Budget */}
            <TextField
              size="small"
              type="number"
              label={t('budget')}
              value={form.monthlyTokenBudget}
              onChange={(e) => setField('monthlyTokenBudget', e.target.value)}
              error={budgetError}
              helperText={
                budgetError
                  ? t('budgetError')
                  : t('budgetHelper', { tokens: formatTokens(form.monthlyTokenBudget) })
              }
              inputProps={{ min: 0, step: 100000 }}
              fullWidth
            />

            {/* Features */}
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{t('features')}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t('featuresHelper')}
              </Typography>
              <FormGroup sx={{ mt: 1 }}>
                {FEATURE_META.map(({ key, labelKey }) => (
                  <FormControlLabel
                    key={key}
                    control={
                      <Switch
                        size="small"
                        checked={Boolean(form.features[key])}
                        onChange={() => toggleFeature(key)}
                      />
                    }
                    label={<Typography variant="body2">{t(labelKey)}</Typography>}
                  />
                ))}
              </FormGroup>
            </Box>

            {/* Audit trail */}
            <Accordion
              variant="outlined"
              sx={{ borderRadius: 2, '&:before': { display: 'none' } }}
              disableGutters
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HistoryToggleOff fontSize="small" color="action" />
                  <Typography variant="body2" fontWeight={600}>
                    {t('changeHistory')}
                  </Typography>
                  <Chip size="small" label={audit.length} />
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {audit.length === 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    {t('noChanges')}
                  </Typography>
                ) : (
                  <Stack spacing={1} divider={<Divider flexItem />}>
                    {audit.map((a, i) => (
                      <Box key={a._id || i}>
                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                          <Typography variant="caption" fontWeight={600}>
                            {a.actorRole || t('unknownActor')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {a.at ? new Date(a.at).toLocaleString() : ''}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}
                        >
                          {a.changes ? JSON.stringify(a.changes) : '—'}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </AccordionDetails>
            </Accordion>

          </Stack>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>
          {tBase('common:action.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <AutoAwesome />}
          sx={{
            textTransform: 'none', fontWeight: 700, borderRadius: 2,
            background: ADMIN_GRADIENT, '&.Mui-disabled': { background: undefined },
          }}
        >
          {saving ? t('saving') : t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
