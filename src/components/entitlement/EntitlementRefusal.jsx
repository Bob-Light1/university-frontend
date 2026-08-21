/**
 * @file EntitlementRefusal.jsx
 * @description Renders a refused entitlement change — the whole list of
 * blockers, never one at a time (design doc §6.3.3).
 *
 * The refusals this displays are the ones no screen can predict: a module that
 * holds institutional records, a module another collection still needs on this
 * campus. They are probed against the campus's real data at save time, so the
 * matrix deliberately lets the operator ask for them and shows the answer here.
 * Greying the choice out beforehand would mean guessing, and guessing wrong in
 * the direction where the operator simply cannot do a thing they are entitled to.
 */

import { Alert, AlertTitle, Box, Stack, Typography, Chip } from '@mui/material';

import { useAppTranslation } from '../../hooks/useAppTranslation';
import { useModuleLabel } from '../../hooks/useModuleLabel';

/**
 * @param {Object} props
 * @param {{message: string, blockers: Array}|null} props.refusal
 * @param {Array}  [props.warnings] - Soft edges that will degrade (§6.3.1) —
 *   shown, never enforced.
 * @param {Function} [props.onClose]
 */
export default function EntitlementRefusal({ refusal, warnings = [], onClose }) {
  const { t } = useAppTranslation('common');
  const moduleLabel = useModuleLabel();

  if (!refusal && !warnings.length) return null;

  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      {refusal && (
        <Alert severity="error" onClose={onClose} sx={{ borderRadius: 2 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>{t('features.pilot.refusalTitle')}</AlertTitle>
          <Typography variant="body2">{refusal.message}</Typography>

          {refusal.blockers.length > 1 && (
            <Stack component="ul" spacing={0.5} sx={{ pl: 2, mt: 1, mb: 0 }}>
              {refusal.blockers.map((b, i) => (
                <Box component="li" key={`${b.code}-${b.feature}-${i}`}>
                  <Typography variant="body2">
                    {b.feature ? `${moduleLabel(b.feature)} — ` : ''}{b.message}
                  </Typography>
                  {b.detail.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                      {b.detail.map((d) => (
                        <Chip key={String(d)} size="small" variant="outlined" label={String(d)} />
                      ))}
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>{t('features.pilot.warningTitle')}</AlertTitle>
          <Stack component="ul" spacing={0.25} sx={{ pl: 2, mb: 0 }}>
            {warnings.map((w, i) => (
              <Typography component="li" variant="body2" key={`${w.feature}-${i}`}>
                {w.feature ? `${moduleLabel(w.feature)} — ` : ''}{w.message}
              </Typography>
            ))}
          </Stack>
        </Alert>
      )}
    </Stack>
  );
}
