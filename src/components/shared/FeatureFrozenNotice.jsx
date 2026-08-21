/**
 * @file FeatureFrozenNotice.jsx
 * @description The single "this module is frozen" banner (design doc §4.1,
 * §6.2), extracted so the three places that announce `read_only` cannot drift.
 *
 * §6.2 rules per-button granularity out of v1: a frozen module is announced
 * ONCE, above the surface, rather than by masking half its controls — a screen
 * with three buttons hidden and two left is a screen whose user concludes the
 * remaining two are broken. The axios interceptor (§8.3) catches whatever they
 * still try.
 *
 * Renders nothing unless the module is genuinely frozen for THIS operator:
 * global roles are bound by no entitlement (§5.2), so telling them the surface
 * is read-only would be false — their writes go through.
 *
 *   <FeatureFrozenNotice feature="department" />
 */

import { Alert } from '@mui/material';

import { useFeature } from '../../hooks/useFeature';
import { useAppTranslation } from '../../hooks/useAppTranslation';

/**
 * @param {Object} props
 * @param {string} props.feature - Registry key.
 * @param {boolean} [props.square=true] - Flush against a page or dialog edge.
 */
const FeatureFrozenNotice = ({ feature, square = true }) => {
  const { ready, visible, readOnly, unrestricted, label } = useFeature(feature);
  const { t } = useAppTranslation('common');

  if (!feature || !ready || !visible || !readOnly || unrestricted) return null;

  return (
    <Alert severity="info" square={square} sx={square ? { borderRadius: 0 } : undefined}>
      {t('features.frozenBody', { module: label || feature })}
    </Alert>
  );
};

export default FeatureFrozenNotice;
