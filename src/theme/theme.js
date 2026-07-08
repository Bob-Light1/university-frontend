/**
 * @file theme.js
 * @description Central MUI theme factory, mode-aware (light | dark).
 *
 * Single source of truth for the app palette. RtlProvider calls buildTheme()
 * whenever the direction or resolved colour mode changes.
 *
 * Design intent:
 *  - Light mode stays visually close to MUI's defaults so the existing UI is
 *    unchanged; only the extra semantic tokens below are added.
 *  - Dark mode uses a deep slate background tuned to the brand blue (#003285)
 *    and a legible, desaturated primary so text/controls keep contrast.
 *
 * Semantic tokens added on top of the MUI palette (both modes):
 *  - `background.neutral`  — subtle surface: table headers, drop zones, side
 *    panels. Solid (not translucent) so sticky table headers stay opaque.
 *  - `<color>.lighter` / `<color>.50` / `<color>.100` on primary, secondary,
 *    error, warning, info and success — tinted surfaces for selected cards,
 *    bulk-action bars, score badges and empty-state avatars.
 *  All of these were referenced across the app *before* they existed in the
 *  palette (`bgcolor: 'primary.lighter'`, `'success.50'`, `'background.neutral'`
 *  …). MUI then fell back to the raw string as a CSS colour, which is invalid —
 *  so those surfaces silently rendered with **no background at all**, in both
 *  modes. They are now defined once here, derived from the mode-aware palette.
 *
 * Component overrides:
 *  - `MuiTableCell.head` — every table header gets `background.neutral` and an
 *    explicit `text.primary`. Previously headers either had no background or a
 *    hardcoded `grey.50`/`grey.100`, which stays light in dark mode and made the
 *    (white) header text unreadable.
 *
 * Brand gradients per portal live in the *Tokens.js files and expose their own
 * dark variants (consumed via resolvedMode) — they are not part of this palette.
 * Status/badge tints live in `statusTokens.js`.
 */

import { createTheme, alpha } from '@mui/material/styles';

// Brand-tuned dark surfaces (slate with a cool/blue cast to match #003285).
const DARK_BACKGROUND = '#0f1720';
const DARK_PAPER = '#161f2b';
const DARK_NEUTRAL = '#1e2836';

// Light neutral: the grey MUI itself uses for subtle surfaces (grey.100-ish).
const LIGHT_NEUTRAL = '#f4f6f8';

/**
 * Build the MUI theme for a given direction and resolved colour mode.
 * @param {Object} [opts]
 * @param {('ltr'|'rtl')} [opts.direction='ltr']
 * @param {('light'|'dark')} [opts.mode='light'] - Already resolved (no 'system').
 * @returns {import('@mui/material/styles').Theme}
 */
export function buildTheme({ direction = 'ltr', mode = 'light' } = {}) {
  const isDark = mode === 'dark';

  // Pass 1 — base palette. Built first so pass 2 can derive tints from the
  // augmented primary colour (alpha() needs the resolved `primary.main`).
  const base = createTheme({
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

  const neutral = isDark ? DARK_NEUTRAL : LIGHT_NEUTRAL;

  // Dark surfaces need a stronger tint to read against `paper`; light surfaces
  // need a lighter one to stay subtle against white. Alpha (rather than a fixed
  // hex) keeps the tint correct on `paper`, `default` and `neutral` alike.
  const soft = (main) => alpha(main, isDark ? 0.18 : 0.08);
  const softer = (main) => alpha(main, isDark ? 0.28 : 0.16);

  /** `lighter`/`50`/`100` tinted-surface shades for one semantic colour. */
  const tintedShades = (main) => ({
    lighter: soft(main),
    50: soft(main),
    100: softer(main),
  });

  const { primary, secondary, error, warning, info, success } = base.palette;

  // Pass 2 — semantic tokens + component overrides, deep-merged onto the base.
  return createTheme(base, {
    palette: {
      background: { neutral },
      primary: tintedShades(primary.main),
      secondary: tintedShades(secondary.main),
      error: tintedShades(error.main),
      warning: tintedShades(warning.main),
      info: tintedShades(info.main),
      success: tintedShades(success.main),
    },
    components: {
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: neutral,
            color: base.palette.text.primary,
            fontWeight: 700,
          },
        },
      },
    },
  });
}
