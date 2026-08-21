/**
 * @file PlanSelector.jsx
 * @description The commercial tier of a campus — ADMIN only (design doc §5).
 *
 * ⚠️ `plan` is the PLATFORM tier, not an AI tier (decision D-D: one grid, one
 * sales pitch). Moving a campus to `premium` therefore widens its WHOLE offer.
 * Phase 2 made that true in the data and left it implied on screen; this
 * component is where it stops being implied — the preview below names the
 * modules the change opens and, more importantly, the ones it closes.
 *
 * A tier downgrade is refused by the server when it would bury records (§6.3.4);
 * the preview is a courtesy, never the control.
 */

import { useMemo } from 'react';
import {
  Box, Stack, Typography, FormControl, InputLabel, Select, MenuItem, Chip, Alert,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

import { useAppTranslation } from '../../hooks/useAppTranslation';
import { useModuleLabel } from '../../hooks/useModuleLabel';

/**
 * @param {Object}   props
 * @param {string}   props.value        - Currently drafted plan.
 * @param {string}   props.current      - Plan stored today.
 * @param {Array}    props.plans        - Tier vocabulary, from the payload.
 * @param {Object}   props.planPresets  - `{ [plan]: string[] }`, from the payload.
 * @param {Function} props.onChange
 * @param {boolean}  [props.disabled]
 */
export default function PlanSelector({
  value, current, plans, planPresets, onChange, disabled = false,
}) {
  const { t } = useAppTranslation('common');
  const moduleLabel = useModuleLabel();

  const delta = useMemo(() => {
    if (!value || value === current || !planPresets) return null;
    // `custom` is a bespoke offer built from overrides: it has no preset, so
    // there is nothing honest to preview.
    const before = planPresets[current];
    const after = planPresets[value];
    if (!before || !after) return null;

    return {
      opened: after.filter((k) => !before.includes(k)),
      closed: before.filter((k) => !after.includes(k)),
    };
  }, [value, current, planPresets]);

  return (
    <Box>
      <FormControl size="small" fullWidth disabled={disabled}>
        <InputLabel>{t('features.pilot.plan')}</InputLabel>
        <Select label={t('features.pilot.plan')} value={value || ''} onChange={(e) => onChange(e.target.value)}>
          {plans.map((plan) => (
            <MenuItem key={plan} value={plan}>
              {t(`features.pilot.planOption.${plan}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
        {t('features.pilot.planHelper')}
      </Typography>

      {delta && (delta.opened.length > 0 || delta.closed.length > 0) && (
        <Alert
          severity={delta.closed.length ? 'warning' : 'info'}
          icon={delta.closed.length ? <TrendingDown /> : <TrendingUp />}
          sx={{ mt: 1.5, borderRadius: 2 }}
        >
          <Stack spacing={1}>
            {delta.opened.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {t('features.pilot.planOpens', { count: delta.opened.length })}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                  {delta.opened.map((key) => (
                    <Chip key={key} size="small" color="success" variant="outlined" label={moduleLabel(key)} />
                  ))}
                </Stack>
              </Box>
            )}
            {delta.closed.length > 0 && (
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {t('features.pilot.planCloses', { count: delta.closed.length })}
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                  {delta.closed.map((key) => (
                    <Chip key={key} size="small" color="error" variant="outlined" label={moduleLabel(key)} />
                  ))}
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {t('features.pilot.planClosesHelp')}
                </Typography>
              </Box>
            )}
          </Stack>
        </Alert>
      )}
    </Box>
  );
}
