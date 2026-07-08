/**
 * @file statusTokens.js
 * @description Mode-aware tinted colours for status chips, badges and row tints.
 *
 * Portal components used to inline pale-on-dark literals such as
 * `{ bg: '#e8f5e9', color: '#2e7d32' }`. Those pairs are self-consistent but
 * stay bright in dark mode, which breaks the surface hierarchy — and any
 * component that painted `bg` behind *theme-driven* text (a card, a table row)
 * rendered white text on a near-white background.
 *
 * `statusTint(mode, hue)` is the single source of truth: it returns the
 * background, foreground, border and soft row tint for a semantic hue on the
 * current surface.
 *
 * Usage (inside an `sx` callback so the mode is always current):
 *   sx={(t) => { const s = statusTint(t.palette.mode, 'success');
 *                return { bgcolor: s.bg, color: s.color }; }}
 */

import { alpha } from '@mui/material/styles';

/**
 * Semantic hues. `light` holds the pale background / saturated foreground pair;
 * `darkFg` is a desaturated foreground legible on the dark `paper` surface
 * (#161f2b) — the dark background/border are derived from it with alpha so they
 * sit *behind* the surface rather than on top of it.
 *
 * Every pair below clears WCAG AA (≥ 4.5:1) for the chip's own foreground on its
 * own background, on both surfaces. Three values were retuned from the literals
 * previously inlined in the portals, which failed AA:
 *   - light `warning` #e65100 → #c44100 (3.46:1 → 4.67:1)
 *   - light `amber`   #f57f17 → #9a5c00 (2.49:1 → 5.06:1)
 *   - dark  `error`   #e57373 → #ef9a9a (4.30:1 → 5.48:1)
 */
const HUES = Object.freeze({
  success: { light: { bg: '#e8f5e9', color: '#2e7d32' }, darkFg: '#81c784' },
  warning: { light: { bg: '#fff3e0', color: '#c44100' }, darkFg: '#ffb74d' },
  error:   { light: { bg: '#fdecea', color: '#c62828' }, darkFg: '#ef9a9a' },
  info:    { light: { bg: '#e3f2fd', color: '#1565c0' }, darkFg: '#64b5f6' },
  amber:   { light: { bg: '#fff8e1', color: '#9a5c00' }, darkFg: '#ffd54f' },
  purple:  { light: { bg: '#f3e5f5', color: '#6a1b9a' }, darkFg: '#ce93d8' },
  pink:    { light: { bg: '#fce4ec', color: '#c62828' }, darkFg: '#f48fb1' },
  neutral: { light: { bg: '#f5f5f5', color: '#616161' }, darkFg: '#b0bec5' },
});

/** Fallback hue for unknown status keys. */
export const DEFAULT_HUE = 'neutral';

/**
 * Resolve a semantic hue to surface-appropriate colours.
 * @param {('light'|'dark')} mode - Resolved palette mode.
 * @param {keyof HUES} hue - Semantic hue key; unknown keys fall back to neutral.
 * @returns {{ bg: string, color: string, border: string, softBg: string }}
 *   `bg`/`color` for chips and badges, `border` for outlined variants, and
 *   `softBg` for whole-row or whole-card tints (safe behind theme-driven text).
 */
export function statusTint(mode, hue) {
  const entry = HUES[hue] ?? HUES[DEFAULT_HUE];

  if (mode === 'dark') {
    const fg = entry.darkFg;
    return {
      bg: alpha(fg, 0.18),
      color: fg,
      border: alpha(fg, 0.35),
      softBg: alpha(fg, 0.08),
    };
  }

  const { bg, color } = entry.light;
  return {
    bg,
    color,
    border: alpha(color, 0.3),
    softBg: alpha(color, 0.08),
  };
}

/**
 * Foreground-only accessor — for icons and text that sit directly on `paper`
 * (no tinted background of their own).
 * @param {('light'|'dark')} mode
 * @param {keyof HUES} hue
 * @returns {string}
 */
export function statusColor(mode, hue) {
  return statusTint(mode, hue).color;
}
