/**
 * @file EntitlementDialog.jsx
 * @description The OFFER of one campus, edited by the platform administration
 * (CAMPUS_ENTITLEMENT_DESIGN.md §5, phase 4).
 *
 *   GET   /admin/campuses/:id/entitlement → tier, module matrix, AI values, audit
 *   PATCH /admin/campuses/:id/entitlement → the whole change, in ONE call
 *
 * Replaces `AiEntitlementDialog.jsx`. That dialog piloted a single module
 * through a tier field that had silently become the tier of the WHOLE platform
 * (decision D-D, phase 2): an admin switching a campus to `premium` for its AI
 * was widening its entire offer without any screen saying so. Here the tier sits
 * above the matrix its change moves, and the preview names the modules it opens
 * and closes before anything is saved.
 *
 * Everything editable in this dialog belongs to the same layer and travels in
 * one PATCH — tier, module states, quotas and AI values alike. One call means
 * one audit row, one refusal, and no half-applied state where the tier moved
 * but the modules it governs did not.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Stack, Typography, Divider, IconButton, Button, Chip,
  Tabs, Tab, Alert, CircularProgress, Skeleton,
} from '@mui/material';
import { Close, Tune, AutoAwesome } from '@mui/icons-material';

import {
  getCampusOffer, updateCampusOffer,
} from '../../../services/entitlementService';
import { useEntitlementPilot, NO_DRAFT } from '../../../hooks/useEntitlementPilot';
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import EntitlementMatrix from '../../../components/entitlement/EntitlementMatrix';
import EntitlementRefusal from '../../../components/entitlement/EntitlementRefusal';
import EntitlementAudit from '../../../components/entitlement/EntitlementAudit';
import PlanSelector from '../../../components/entitlement/PlanSelector';
import AiValuesSection from '../../../components/entitlement/AiValuesSection';
import { FEATURE_STATES } from '../../../config/featureConstants';
import { ADMIN_GRADIENT } from '../../../theme/adminTokens';

/** Editable shape of the AI values, from whichever side the server answered. */
const toAiForm = (ai) => ({
  llmProfile: ai?.llmProfile || 'free',
  monthlyTokenBudget: Number.isFinite(ai?.monthlyTokenBudget) ? ai.monthlyTokenBudget : 0,
  features: { ...(ai?.features || {}) },
});

/**
 * @param {Object}   props
 * @param {boolean}  props.open
 * @param {Object}   props.campus  - `{ _id, campus_name }` (list row).
 * @param {Function} props.onClose
 * @param {Function} props.onSaved - `(campusName) => void`, for the parent snackbar.
 */
export default function EntitlementDialog({ open, campus, onClose, onSaved }) {
  const { t } = useAppTranslation(['common']);
  const [tab, setTab] = useState(0);

  const pilot = useEntitlementPilot({
    campusId: campus?._id,
    fetcher: getCampusOffer,
    mutator: updateCampusOffer,
    enabled: open,
  });

  const { report, plan, setPlan, saving, loading } = pilot;

  // ── AI values, held next to the matrix and submitted with it ───────────────
  //
  // The draft is keyed on the report OBJECT rather than synchronised by an
  // effect: a fresh report — another campus opened in this same mounted dialog,
  // or the reload that follows a save — drops the draft on its own, where an
  // effect would leave one render showing the previous campus's budget.
  const aiPristine = useMemo(() => toAiForm(report?.ai), [report]);
  const [aiDraft, setAiDraft] = useState({ source: NO_DRAFT, value: null });
  const ai = aiDraft.source === report ? aiDraft.value : aiPristine;

  const aiChanged = useMemo(
    () => JSON.stringify(ai) !== JSON.stringify(aiPristine),
    [ai, aiPristine],
  );

  const patchAi = useCallback(
    (patch) => setAiDraft({ source: report, value: { ...ai, ...patch } }),
    [report, ai],
  );

  /** Whether the `ai` module is on at all — the matrix owns that, not this panel. */
  const aiSubscribed = (report?.features || [])
    .find((f) => f.key === 'ai')?.state !== FEATURE_STATES.HIDDEN;

  const budgetInvalid = !Number.isInteger(Number(ai.monthlyTokenBudget))
    || Number(ai.monthlyTokenBudget) < 0;

  const canSave = (pilot.canSave || (aiChanged && !saving && !loading))
    && !budgetInvalid
    && ai.llmProfile.trim().length > 0
    && pilot.missingReason.length === 0;

  const handleSave = async () => {
    // Only the AI DEVIATIONS are worth sending; the server prunes what matches
    // the preset, so a campus that follows its tier keeps following it when the
    // tier moves instead of dragging a frozen copy of the old grid behind it.
    const extra = aiChanged
      ? {
        quotas: { aiMonthlyTokens: Number(ai.monthlyTokenBudget) },
        ai: { llmProfile: ai.llmProfile.trim(), features: ai.features },
      }
      : {};

    const ok = await pilot.save(extra);
    if (ok) onSaved?.(report?.campusName || campus?.campus_name || '');
  };

  const dirty = pilot.dirty || aiChanged;

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center',
            background: ADMIN_GRADIENT, color: '#fff', flexShrink: 0,
          }}>
            <Tune fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={700} noWrap>
              {t('features.pilot.title')}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {report?.campusName || campus?.campus_name}
            </Typography>
          </Box>
          {report?.plan && (
            <Chip
              size="small"
              label={t(`features.pilot.planOption.${report.plan}`)}
              sx={{ ml: 'auto', mr: 1, fontWeight: 700 }}
            />
          )}
        </Stack>

        <IconButton
          onClick={onClose}
          disabled={saving}
          sx={{ position: 'absolute', top: 12, right: 12 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<Tune fontSize="small" />} iconPosition="start"
          label={t('features.pilot.tab.modules')} sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }} />
        <Tab icon={<AutoAwesome fontSize="small" />} iconPosition="start"
          label={t('features.pilot.tab.ai')} sx={{ textTransform: 'none', fontWeight: 600, minHeight: 48 }} />
      </Tabs>

      <DialogContent sx={{ pt: 2.5 }}>
        <EntitlementRefusal
          refusal={pilot.refusal}
          warnings={pilot.warnings}
          onClose={pilot.clearRefusal}
        />

        {loading ? (
          <Stack spacing={1.5}>
            {[1, 2, 3, 4, 5].map((k) => <Skeleton key={k} variant="rounded" height={48} />)}
          </Stack>
        ) : !report ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{t('features.pilot.loadError')}</Alert>
        ) : tab === 0 ? (
          <Stack spacing={2.5}>
            <PlanSelector
              value={plan}
              current={report.plan}
              plans={report.plans || []}
              planPresets={report.planPresets || {}}
              onChange={setPlan}
              disabled={saving}
            />

            <Divider />

            <EntitlementMatrix
              features={pilot.features}
              draft={pilot.draft}
              changed={pilot.changed}
              missingReason={pilot.missingReason}
              requirements={pilot.requirements}
              onChange={pilot.patchRow}
              onReset={pilot.resetRow}
              disabled={saving}
            />

            <EntitlementAudit entries={report.audit || []} />
          </Stack>
        ) : (
          <AiValuesSection
            value={ai}
            plan={plan || report.plan}
            subscribed={aiSubscribed}
            onChange={patchAi}
            disabled={saving}
          />
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        {dirty && (
          <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
            {t('features.pilot.pending', { count: pilot.changed.length + (aiChanged ? 1 : 0) })}
          </Typography>
        )}
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none', borderRadius: 2 }}>
          {t('action.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Tune />}
          sx={{
            textTransform: 'none', fontWeight: 700, borderRadius: 2,
            background: ADMIN_GRADIENT, '&.Mui-disabled': { background: undefined },
          }}
        >
          {saving ? t('features.pilot.saving') : t('features.pilot.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
