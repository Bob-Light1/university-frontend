/**
 * @file AiValuesSection.jsx
 * @description What stays genuinely AI-specific once the AI joins the module
 * grid: the LLM profile, the monthly token budget, and the four sub-features
 * (design doc §10, phase 2 — "the AI is a module like the others FOR
 * ACTIVATION, and keeps its own logic where it really differs").
 *
 * Activation itself is NOT here. Whether a campus has the AI at all is the `ai`
 * row of the module matrix, like every other module; this panel only carries
 * the values that have no equivalent elsewhere. Two places to switch the same
 * module on was exactly the duplication phase 2 removed.
 *
 * The tier is not here either, for the same reason: `plan` is the platform tier
 * (D-D), it lives above with the offer, and this panel shows what the current
 * tier grants so the consequence of changing it is visible rather than implied.
 */

import {
  Box, Stack, Typography, TextField, Switch, FormControlLabel, FormGroup,
  Button, Tooltip, Alert,
} from '@mui/material';
import { RestartAlt } from '@mui/icons-material';

import { AI_FEATURES, formatTokens } from '../ai/aiConstants';
import { aiPresetFor } from './aiPreset';
import { useAppTranslation } from '../../hooks/useAppTranslation';

const FEATURE_ORDER = [
  AI_FEATURES.CHAT, AI_FEATURES.SEARCH, AI_FEATURES.ANALYTICS, AI_FEATURES.ADVISORS,
];

/**
 * @param {Object}   props
 * @param {Object}   props.value    - `{ llmProfile, monthlyTokenBudget, features }`.
 * @param {string}   props.plan     - The drafted platform tier.
 * @param {boolean}  props.subscribed - Whether the `ai` module is on at all.
 * @param {Function} props.onChange - `(patch) => void`.
 * @param {boolean}  [props.disabled]
 */
export default function AiValuesSection({ value, plan, subscribed, onChange, disabled = false }) {
  const { t } = useAppTranslation('common');

  const budgetInvalid =
    value.monthlyTokenBudget === '' ||
    !Number.isInteger(Number(value.monthlyTokenBudget)) ||
    Number(value.monthlyTokenBudget) < 0;

  return (
    <Stack spacing={2.5}>
      {!subscribed && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {t('features.pilot.ai.notSubscribed')}
        </Alert>
      )}

      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Typography variant="body2" color="text.secondary">
          {t('features.pilot.ai.presetNote', { plan: t(`features.pilot.planOption.${plan}`) })}
        </Typography>
        <Tooltip title={t('features.pilot.ai.presetTooltip')}>
          <span>
            <Button
              size="small"
              variant="outlined"
              startIcon={<RestartAlt />}
              disabled={disabled}
              onClick={() => onChange(aiPresetFor(plan))}
              sx={{ borderRadius: 2, textTransform: 'none', whiteSpace: 'nowrap' }}
            >
              {t('features.pilot.ai.applyPreset')}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <TextField
        size="small"
        fullWidth
        label={t('features.pilot.ai.llmProfile')}
        value={value.llmProfile}
        onChange={(e) => onChange({ llmProfile: e.target.value })}
        disabled={disabled}
        error={value.llmProfile.trim().length === 0}
        helperText={t('features.pilot.ai.llmProfileHelper')}
        inputProps={{ maxLength: 50 }}
      />

      <TextField
        size="small"
        fullWidth
        type="number"
        label={t('features.pilot.ai.budget')}
        value={value.monthlyTokenBudget}
        onChange={(e) => onChange({ monthlyTokenBudget: e.target.value })}
        disabled={disabled}
        error={budgetInvalid}
        helperText={
          budgetInvalid
            ? t('features.pilot.ai.budgetError')
            : t('features.pilot.ai.budgetHelper', {
              tokens: formatTokens(value.monthlyTokenBudget),
            })
        }
        inputProps={{ min: 0, step: 100000 }}
      />

      <Box>
        <Typography variant="body2" fontWeight={600}>{t('features.pilot.ai.features')}</Typography>
        <Typography variant="caption" color="text.secondary">
          {t('features.pilot.ai.featuresHelper')}
        </Typography>
        <FormGroup sx={{ mt: 1 }}>
          {FEATURE_ORDER.map((key) => (
            <FormControlLabel
              key={key}
              disabled={disabled}
              control={
                <Switch
                  size="small"
                  checked={Boolean(value.features[key])}
                  onChange={() => onChange({
                    features: { ...value.features, [key]: !value.features[key] },
                  })}
                />
              }
              label={<Typography variant="body2">{t(`features.pilot.ai.feature.${key}`)}</Typography>}
            />
          ))}
        </FormGroup>
      </Box>
    </Stack>
  );
}
