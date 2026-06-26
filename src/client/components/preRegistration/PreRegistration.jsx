/**
 * @file PreRegistration.jsx
 * @description Legacy ERP pre-registration entry point — now a thin redirector.
 *
 * Route : /register?ref=PARTNER_CODE[&src=qr]
 *
 * The pre-registration funnel has been consolidated onto the public marketing
 * portal (richer form, quiz, multi-campus, i18n, UTM/attribution). This page used
 * to host a parallel MUI form; it is kept only to keep previously printed/shared
 * `/register?ref=CODE` links and QR codes working — it forwards them to the
 * portal's short referral link `/r/{CODE}` (preserving `src` for scan-vs-click
 * attribution). No form is rendered anymore.
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { PORTAL_URL } from '../../../config/env';

const BRAND_GRADIENT = 'linear-gradient(135deg, #ff7f3e 0%, #ff9f5a 100%)';

/**
 * Builds the portal destination for a legacy ERP referral visit.
 * With a code → portal short link `/r/{CODE}`; without one → portal home.
 */
function buildPortalTarget(ref, src) {
  const base = String(PORTAL_URL || '').replace(/\/+$/, '');
  if (!ref) return `${base}/`;
  const code = encodeURIComponent(ref.toUpperCase().trim());
  const query = src ? `?src=${encodeURIComponent(src)}` : '';
  return `${base}/r/${code}${query}`;
}

export default function PreRegistration() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref') || '';
  const src = searchParams.get('src') || '';

  useEffect(() => {
    // Replace (not push) so the back button skips this transient redirect.
    window.location.replace(buildPortalTarget(ref, src));
  }, [ref, src]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        p: 2,
        background: BRAND_GRADIENT,
        color: 'white',
      }}
    >
      <CircularProgress sx={{ color: 'white' }} size={48} />
      <Typography variant="body1" sx={{ opacity: 0.9 }}>
        Redirecting you to the registration portal…
      </Typography>
    </Box>
  );
}
