/**
 * @file FeatureGuard.jsx
 * @description Route-level entitlement gate — COMPOSED with `ProtectedRoute`,
 * never substituted for it (design doc §8.2).
 *
 * The two answer different questions and both must be asked:
 *   - `ProtectedRoute` → "is this caller authenticated, and does their ROLE
 *     allow this area?"
 *   - `FeatureGuard`   → "did this CAMPUS buy this module?"
 *
 * A user who reaches a hidden module by typing its URL — a bookmark, a link in
 * an old email, a browser autocompletion — gets an explicit "not activated"
 * screen rather than a 404 or, worse, a page that half-loads and then fills
 * with 403s. That screen is the only place in the product where a hidden module
 * is visible at all, and it exists precisely so the dead end is legible.
 *
 * `read_only` PASSES: the page must render, its history must stay readable, and
 * only the mutating affordances inside it are withheld (that is `FeatureGate`
 * with `mode="write"`). Blocking the route on a frozen module would amputate
 * the history the state exists to preserve (§4.1).
 *
 * A frozen module is ANNOUNCED here, once, above the page. The alternative —
 * masking every mutating control across four modules and a dozen tabs — is the
 * per-button granularity §6.2 rules out of v1, and doing it by halves is worse
 * than not doing it: a page with three buttons hidden and two left is a page
 * whose user concludes the remaining two are broken. One banner states the rule
 * for the whole screen, and the axios interceptor (§8.3) catches whatever the
 * user still tries. Screens that want to go finer have `FeatureGate
 * mode="write"`.
 */

import { Alert, Box, Button, Typography } from '@mui/material';
import { Outlet, useNavigate } from 'react-router-dom';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import Loader from '../components/Loader';
import { useFeature } from '../hooks/useFeature';
import { useAppTranslation } from '../hooks/useAppTranslation';

/**
 * @param {Object} props
 * @param {string} props.feature - Registry key guarding this route.
 * @param {React.ReactNode} [props.children] - Guarded element. Omit to use the
 *   component as a layout route, in which case it renders an `<Outlet />`.
 */
const FeatureGuard = ({ feature, children }) => {
  const { ready, visible, readOnly, unrestricted, label } = useFeature(feature);
  const { t } = useAppTranslation('common');
  const navigate = useNavigate();

  // Never decide before the answer is in: rendering the page and then replacing
  // it with a refusal (or the reverse) is worse than waiting one request.
  if (!ready) return <Loader fullScreen />;

  if (!visible) {
    return (
      <Box
        sx={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', gap: 2, p: 3, textAlign: 'center',
        }}
      >
        <LockOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
        <Typography variant="h5" fontWeight={700}>
          {t('features.notActivatedTitle')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 460 }}>
          {t('features.notActivatedBody', { module: label || feature })}
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)} sx={{ mt: 1 }}>
          {t('action.back')}
        </Button>
      </Box>
    );
  }

  const page = children ?? <Outlet />;

  // Global roles are bound by nothing (§5.2): telling them the page is
  // read-only would be false — their writes go through.
  if (!readOnly || unrestricted) return page;

  return (
    <>
      <Alert severity="info" square sx={{ borderRadius: 0 }}>
        {t('features.frozenBody', { module: label || feature })}
      </Alert>
      {page}
    </>
  );
};

export default FeatureGuard;
