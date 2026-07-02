'use strict';

/**
 * @file directorTokens.js
 * @description Design tokens for the Director portal.
 * Teal palette — visually distinct from Admin's deep blue (#003285).
 */

export const DIRECTOR_PRIMARY   = '#00695c';
export const DIRECTOR_SECONDARY = '#26a69a';

export const DIRECTOR_GRADIENT     = 'linear-gradient(135deg, #00695c 0%, #26a69a 100%)';
export const DIRECTOR_GRADIENT_BTN = DIRECTOR_GRADIENT;
export const DIRECTOR_SHADOW       = '0 6px 20px rgba(0, 105, 92, 0.35)';

// ─── Dark-mode variants ────────────────────────────────────────────────────────
// Teal deep enough for white-on-brand banners but too dark as a foreground on a
// dark surface — these accessors return the surface-legible colour per mode.

export const DIRECTOR_PRIMARY_DARK  = '#4db6ac';
export const DIRECTOR_GRADIENT_DARK = 'linear-gradient(135deg, #0a3d38 0%, #1f6f65 100%)';

/** Brand primary tuned to stay legible on the current surface (light|dark). */
export const directorPrimary  = (mode) => (mode === 'dark' ? DIRECTOR_PRIMARY_DARK : DIRECTOR_PRIMARY);
/** Brand banner gradient, slightly deepened for dark surfaces. */
export const directorGradient = (mode) => (mode === 'dark' ? DIRECTOR_GRADIENT_DARK : DIRECTOR_GRADIENT);

export const CAMPUS_STATUS_COLOR = {
  active:   'success',
  inactive: 'default',
  archived: 'error',
};
