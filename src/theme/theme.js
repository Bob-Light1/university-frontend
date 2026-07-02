/**
 * @file theme.js
 * @description Central MUI theme factory, mode-aware (light | dark).
 *
 * Single source of truth for the app palette. RtlProvider calls buildTheme()
 * whenever the direction or resolved colour mode changes.
 *
 * Design intent:
 *  - Light mode is kept identical to MUI's defaults so the existing UI is
 *    visually unchanged; only dark mode adds overrides.
 *  - Dark mode uses a deep slate background tuned to the brand blue (#003285)
 *    and a legible, desaturated primary so text/controls keep contrast.
 * Brand gradients per portal live in the *Tokens.js files and expose their own
 * dark variants (consumed via resolvedMode) — they are not part of this palette.
 */

import { createTheme } from '@mui/material/styles';

// Brand-tuned dark surfaces (slate with a cool/blue cast to match #003285).
const DARK_BACKGROUND = '#0f1720';
const DARK_PAPER = '#161f2b';

/**
 * Build the MUI theme for a given direction and resolved colour mode.
 * @param {Object} [opts]
 * @param {('ltr'|'rtl')} [opts.direction='ltr']
 * @param {('light'|'dark')} [opts.mode='light'] - Already resolved (no 'system').
 * @returns {import('@mui/material/styles').Theme}
 */
export function buildTheme({ direction = 'ltr', mode = 'light' } = {}) {
  const isDark = mode === 'dark';

  return createTheme({
    direction,
    palette: {
      mode,
      // Light mode intentionally inherits MUI defaults (no regression).
      ...(isDark && {
        primary: { main: '#5b8fd6' },
        background: { default: DARK_BACKGROUND, paper: DARK_PAPER },
      }),
    },
  });
}
