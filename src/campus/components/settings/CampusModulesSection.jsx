/**
 * @file CampusModulesSection.jsx
 * @description The USAGE layer of the entitlement, piloted by the campus
 * manager (CAMPUS_ENTITLEMENT_DESIGN.md §5, phase 4).
 *
 *   GET   /campus/:id/entitlement → the offer, and what is switched on inside it
 *   PATCH /campus/:id/entitlement → module overrides, bounded by that offer
 *
 * This is the onboarding screen of the reference journey (§13.2, act 2): a
 * manager who runs sixty students and no formal accounting switches off what
 * they do not use, and their staff's menu drops from twenty-four entries to
 * eleven. That is where adoption is won or lost — every module left on is a
 * dead button somebody will click once.
 *
 * A manager restricts freely and widens never (D-E: and they switch back on
 * without asking anyone — they can never exceed the plan anyway, so an approval
 * loop would add no guarantee and make the admin a bottleneck). The ceiling is
 * not restated here: it travels per module as `allowedStates`, computed by the
 * server's own guard.
 */

import { useParams } from 'react-router-dom';
import {
  Box, Stack, Typography, Button, Chip, Alert, Skeleton, CircularProgress, Snackbar,
} from '@mui/material';
import { useState } from 'react';

import {
  getCampusUsage, updateCampusUsage,
} from '../../../services/entitlementService';
import { useEntitlementPilot } from '../../../hooks/useEntitlementPilot';
import { useEntitlement } from '../../../hooks/useFeature';
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import EntitlementMatrix from '../../../components/entitlement/EntitlementMatrix';
import EntitlementRefusal from '../../../components/entitlement/EntitlementRefusal';

export default function CampusModulesSection() {
  const { campusId } = useParams();
  const { t } = useAppTranslation('common');
  const [saved, setSaved] = useState(false);

  // The signed-in user's own flags come from the provider; changing them here
  // must move the menu of the person doing it, not only the database.
  const { refresh } = useEntitlement();

  const pilot = useEntitlementPilot({
    campusId,
    fetcher: getCampusUsage,
    mutator: updateCampusUsage,
  });

  const handleSave = async () => {
    const ok = await pilot.save();
    if (!ok) return;
    setSaved(true);
    // Re-hydrate rather than reload: the manager has just changed which modules
    // exist for their own account, and a stale navigation would keep offering
    // an entry whose page now answers "module not activated".
    await refresh?.();
  };

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {t('features.pilot.managerTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('features.pilot.managerSubtitle')}
          </Typography>
        </Box>
        {pilot.report?.plan && (
          <Chip
            size="small"
            label={t('features.pilot.currentPlan', {
              plan: t(`features.pilot.planOption.${pilot.report.plan}`),
            })}
            sx={{ fontWeight: 700 }}
          />
        )}
      </Stack>

      <EntitlementRefusal
        refusal={pilot.refusal}
        warnings={pilot.warnings}
        onClose={pilot.clearRefusal}
      />

      {pilot.loading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3, 4, 5].map((k) => <Skeleton key={k} variant="rounded" height={48} />)}
        </Stack>
      ) : !pilot.report ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{t('features.pilot.loadError')}</Alert>
      ) : (
        <>
          <EntitlementMatrix
            features={pilot.features}
            draft={pilot.draft}
            changed={pilot.changed}
            missingReason={pilot.missingReason}
            requirements={pilot.requirements}
            onChange={pilot.patchRow}
            onReset={pilot.resetRow}
            disabled={pilot.saving}
          />

          <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ mt: 3 }}>
            {pilot.dirty && (
              <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>
                {t('features.pilot.pending', { count: pilot.changed.length })}
              </Typography>
            )}
            <Button
              onClick={pilot.reload}
              disabled={!pilot.dirty || pilot.saving}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              {t('features.pilot.discard')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!pilot.canSave}
              startIcon={pilot.saving ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              {pilot.saving ? t('features.pilot.saving') : t('features.pilot.save')}
            </Button>
          </Stack>
        </>
      )}

      <Snackbar
        open={saved}
        autoHideDuration={4000}
        onClose={() => setSaved(false)}
        message={t('features.pilot.savedToast')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
