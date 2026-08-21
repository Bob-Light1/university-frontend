/**
 * @file ModuleRow.jsx
 * @description One module in a pilot matrix: its name, what it is worth to this
 * campus today, and the three states an operator may put it in (design doc
 * §4.1).
 *
 * Shared by the ADMIN offer dialog and the CAMPUS_MANAGER modules tab — the two
 * differ only in which layer they write, and that difference already travels on
 * the payload as `allowedStates`. A state this layer may not select is rendered
 * DISABLED rather than removed: "you cannot switch this on" and "this does not
 * exist" are different sentences, and the manager needs the first one to know
 * there is something to ask their admin for.
 */

import {
  Box, Stack, Typography, Chip, Tooltip, TextField,
  ToggleButton, ToggleButtonGroup, Collapse, IconButton,
} from '@mui/material';
import { Lock, Undo, EventBusy } from '@mui/icons-material';

import { FEATURE_STATES } from '../../config/featureConstants';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import { useModuleLabel } from '../../hooks/useModuleLabel';

const STATE_ORDER = [FEATURE_STATES.ENABLED, FEATURE_STATES.READ_ONLY, FEATURE_STATES.HIDDEN];

const STATE_COLOR = {
  [FEATURE_STATES.ENABLED]: 'success',
  [FEATURE_STATES.READ_ONLY]: 'warning',
  [FEATURE_STATES.HIDDEN]: 'error',
};

/** `<input type="date">` wants `YYYY-MM-DD`; the API speaks ISO instants. */
const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

/**
 * @param {Object}   props
 * @param {Object}   props.feature - One entry of the report's `features` array.
 * @param {Object}   props.row     - Draft row `{ state, until, reason }`.
 * @param {boolean}  props.dirty
 * @param {boolean}  props.reasonMissing
 * @param {Object}   props.requirements - `{ minReasonLength, maxReasonLength, maxUntilMonths }`.
 * @param {Function} props.onChange - `(patch) => void`.
 * @param {Function} props.onReset
 * @param {boolean}  [props.disabled]
 */
export default function ModuleRow({
  feature, row, dirty, reasonMissing, requirements, onChange, onReset, disabled = false,
}) {
  const { t } = useAppTranslation('common');
  const moduleLabel = useModuleLabel();

  const allowed = feature.allowedStates || STATE_ORDER;
  const locked = feature.core || allowed.length <= 1;
  const restricting = row.state !== FEATURE_STATES.ENABLED;

  return (
    <Box
      sx={{
        py: 1.5,
        px: { xs: 1, sm: 2 },
        borderRadius: 2,
        bgcolor: dirty ? 'action.hover' : 'transparent',
        transition: 'background-color 120ms',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
      >
        {/* ── Identity + badges ─────────────────────────────────────────────── */}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" fontWeight={600}>
              {moduleLabel(feature.key, feature.label)}
            </Typography>

            {feature.core && (
              <Tooltip title={t('features.pilot.badge.coreHelp')}>
                <Chip size="small" icon={<Lock sx={{ fontSize: 14 }} />}
                  label={t('features.pilot.badge.core')} variant="outlined" />
              </Tooltip>
            )}

            {!feature.core && feature.planState === FEATURE_STATES.HIDDEN && (
              <Tooltip title={t('features.pilot.badge.notInPlanHelp', { plan: feature.minPlan })}>
                <Chip size="small" color="info" variant="outlined"
                  label={t('features.pilot.badge.notInPlan', { plan: feature.minPlan })} />
              </Tooltip>
            )}

            {/* "Included in the plan" versus "decided for this campus" — the
                distinction the admin needs to know what a tier change moves. */}
            {(feature.overrides?.admin || feature.overrides?.campus) ? (
              <Chip size="small" color="secondary" variant="outlined"
                label={t(feature.overrides?.campus
                  ? 'features.pilot.badge.overrideCampus'
                  : 'features.pilot.badge.overrideAdmin')} />
            ) : (
              !feature.core && feature.planState !== FEATURE_STATES.HIDDEN && (
                <Chip size="small" variant="outlined" label={t('features.pilot.badge.included')} />
              )
            )}

            {row.until && (
              <Tooltip title={t('features.pilot.badge.untilHelp')}>
                <Chip size="small" color="warning" variant="outlined"
                  icon={<EventBusy sx={{ fontSize: 14 }} />}
                  label={t('features.pilot.badge.until', {
                    date: new Date(row.until).toLocaleDateString(),
                  })} />
              </Tooltip>
            )}
          </Stack>

          {/* The reason behind the state in force — a disappeared button needs
              a why, and this is where the manager reads the admin's. */}
          {(feature.overrides?.campus?.reason || feature.overrides?.admin?.reason) && !dirty && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              “{feature.overrides?.campus?.reason || feature.overrides?.admin?.reason}”
            </Typography>
          )}

          {feature.minState === FEATURE_STATES.READ_ONLY && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {t('features.pilot.badge.floored')}
            </Typography>
          )}
        </Box>

        {/* ── The three states ──────────────────────────────────────────────── */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <ToggleButtonGroup
            exclusive
            size="small"
            value={row.state}
            onChange={(_, value) => value && onChange({ state: value })}
            disabled={disabled || locked}
          >
            {STATE_ORDER.map((state) => {
              const permitted = allowed.includes(state);
              const button = (
                <ToggleButton
                  key={state}
                  value={state}
                  disabled={disabled || !permitted}
                  color={STATE_COLOR[state]}
                  sx={{ textTransform: 'none', px: 1.5, fontSize: 12 }}
                >
                  {t(`features.pilot.state.${state}`)}
                </ToggleButton>
              );
              return permitted ? button : (
                // A disabled MUI button swallows its own tooltip; the span is
                // what gives the manager the "ask your admin" explanation.
                <Tooltip
                  key={state}
                  title={t('features.pilot.state.notAllowed', {
                    state: t(`features.pilot.state.${feature.offerState}`),
                  })}
                >
                  <span>{button}</span>
                </Tooltip>
              );
            })}
          </ToggleButtonGroup>

          {dirty && (
            <Tooltip title={t('features.pilot.discardRow')}>
              <IconButton size="small" onClick={onReset} disabled={disabled}>
                <Undo fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>

      {/* ── Justification + time box, only once the row actually changed ────── */}
      <Collapse in={dirty} unmountOnExit>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
          <TextField
            size="small"
            fullWidth
            label={t('features.pilot.reason')}
            value={row.reason}
            onChange={(e) => onChange({ reason: e.target.value })}
            disabled={disabled}
            error={reasonMissing}
            helperText={
              restricting
                ? t('features.pilot.reasonHelper', { min: requirements.minReasonLength })
                : t('features.pilot.reasonOptional')
            }
            inputProps={{ maxLength: requirements.maxReasonLength }}
          />
          <TextField
            size="small"
            type="date"
            label={t('features.pilot.until')}
            value={toDateInput(row.until)}
            onChange={(e) => onChange({ until: e.target.value || null })}
            disabled={disabled}
            helperText={t('features.pilot.untilHelper')}
            InputLabelProps={{ shrink: true }}
            // The window the guard accepts, resolved when the report loaded —
            // a time box that could run for years is a permanent decision
            // wearing a temporary label (D-F).
            inputProps={{ min: requirements.untilMin, max: requirements.untilMax }}
            sx={{ minWidth: { sm: 200 } }}
          />
        </Stack>
      </Collapse>
    </Box>
  );
}
