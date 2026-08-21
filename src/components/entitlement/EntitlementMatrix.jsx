/**
 * @file EntitlementMatrix.jsx
 * @description The list of modules an operator pilots — the shared body of the
 * ADMIN offer dialog and the CAMPUS_MANAGER modules tab (design doc phase 4).
 *
 * Modules are grouped by what they cost, not by alphabet: what an operator
 * scans for is "what is included, what did somebody decide for this campus,
 * and what would I have to buy". The core group comes last — it is the group
 * nobody can act on, and putting the unactionable rows first is how a screen
 * teaches its user to scroll past everything.
 */

import { useMemo, useState } from 'react';
import {
  Box, Stack, Typography, TextField, Divider, InputAdornment, Chip,
} from '@mui/material';
import { Search } from '@mui/icons-material';

import { FEATURE_STATES } from '../../config/featureConstants';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import { useModuleLabel } from '../../hooks/useModuleLabel';
import ModuleRow from './ModuleRow';

/**
 * @param {Object}   props
 * @param {Array}    props.features     - The report's `features` array.
 * @param {Object}   props.draft        - `{ [key]: { state, until, reason } }`.
 * @param {Array}    props.changed      - Rows the pilot hook considers dirty.
 * @param {Array}    props.missingReason
 * @param {Object}   props.requirements
 * @param {Function} props.onChange     - `(key, patch) => void`.
 * @param {Function} props.onReset      - `(key) => void`.
 * @param {boolean}  [props.disabled]
 */
export default function EntitlementMatrix({
  features, draft, changed, missingReason, requirements, onChange, onReset, disabled = false,
}) {
  const { t } = useAppTranslation('common');
  const moduleLabel = useModuleLabel();
  const [query, setQuery] = useState('');

  const dirtyKeys = useMemo(() => new Set(changed.map((c) => c.key)), [changed]);
  const missingKeys = useMemo(() => new Set(missingReason.map((c) => c.key)), [missingReason]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const visible = features.filter((f) =>
      !needle || moduleLabel(f.key, f.label).toLowerCase().includes(needle) || f.key.includes(needle));

    return [
      {
        id: 'available',
        rows: visible.filter((f) => !f.core && f.offerState !== FEATURE_STATES.HIDDEN),
      },
      {
        id: 'unsold',
        rows: visible.filter((f) => !f.core && f.offerState === FEATURE_STATES.HIDDEN),
      },
      { id: 'core', rows: visible.filter((f) => f.core) },
    ].filter((group) => group.rows.length > 0);
  }, [features, query, moduleLabel]);

  return (
    <Box>
      <TextField
        size="small"
        fullWidth
        placeholder={t('features.pilot.search')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
          ),
        }}
        sx={{ mb: 1.5 }}
      />

      {groups.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          {t('features.pilot.noMatch')}
        </Typography>
      )}

      <Stack spacing={2}>
        {groups.map((group) => (
          <Box key={group.id}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, px: { xs: 1, sm: 2 } }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700}>
                {t(`features.pilot.group.${group.id}`)}
              </Typography>
              <Chip size="small" label={group.rows.length} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, px: { xs: 1, sm: 2 } }}>
              {t(`features.pilot.group.${group.id}Help`)}
            </Typography>

            <Stack divider={<Divider flexItem />}>
              {group.rows.map((feature) => (
                <ModuleRow
                  key={feature.key}
                  feature={feature}
                  row={draft[feature.key] || { state: feature.state, until: null, reason: '' }}
                  dirty={dirtyKeys.has(feature.key)}
                  reasonMissing={missingKeys.has(feature.key)}
                  requirements={requirements}
                  onChange={(patch) => onChange(feature.key, patch)}
                  onReset={() => onReset(feature.key)}
                  disabled={disabled}
                />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
