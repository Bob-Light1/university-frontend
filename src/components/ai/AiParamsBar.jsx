/**
 * @file AiParamsBar.jsx
 * @description Shared parameter controls for analytics reports and advisors.
 * Renders only the params whitelisted for the current report/advisor
 * (academicYear / semester / months) — the same whitelist the gateway enforces
 * (ai.aggregates.js), so the UI never sends a key the server would reject.
 *
 * Values map verbatim to the backend validators: academicYear = YYYY-YYYY,
 * semester ∈ result SEMESTER enum (S1/S2/Annual), months = integer 3..24.
 */

import { useTranslation } from 'react-i18next';
import {
  Stack, TextField, MenuItem,
} from '@mui/material';

const SEMESTER_OPTIONS = ['S1', 'S2', 'Annual'];

/**
 * @param {Object}   props
 * @param {string[]} props.fields - subset of ['academicYear','semester','months']
 * @param {Object}   props.values - current values
 * @param {Function} props.onChange - (key, value) => void
 * @param {boolean}  [props.disabled]
 */
export default function AiParamsBar({ fields = [], values = {}, onChange, disabled }) {
  const { t } = useTranslation('ai');
  if (!fields.length) return null;

  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap alignItems="center">
      {fields.includes('academicYear') && (
        <TextField
          size="small"
          label={t('params.academicYear')}
          placeholder="2025-2026"
          value={values.academicYear ?? ''}
          onChange={(e) => onChange('academicYear', e.target.value)}
          disabled={disabled}
          sx={{ width: 150 }}
          inputProps={{ maxLength: 9 }}
        />
      )}

      {fields.includes('semester') && (
        <TextField
          select
          size="small"
          label={t('params.semester')}
          value={values.semester ?? ''}
          onChange={(e) => onChange('semester', e.target.value)}
          disabled={disabled}
          sx={{ width: 150 }}
        >
          <MenuItem value="">{t('params.any')}</MenuItem>
          {SEMESTER_OPTIONS.map((s) => (
            <MenuItem key={s} value={s}>{t(`params.semesterOptions.${s}`, s)}</MenuItem>
          ))}
        </TextField>
      )}

      {fields.includes('months') && (
        <TextField
          type="number"
          size="small"
          label={t('params.months')}
          value={values.months ?? ''}
          onChange={(e) => onChange('months', e.target.value)}
          disabled={disabled}
          sx={{ width: 130 }}
          inputProps={{ min: 3, max: 24 }}
        />
      )}
    </Stack>
  );
}
