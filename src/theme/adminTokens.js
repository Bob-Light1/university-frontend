/**
 * @file adminTokens.js
 * @description Design tokens for the Admin / Director portal.
 *
 * Single source of truth for brand colors, gradients and status maps.
 * Used by: AdminDashboard, AdminAccounts, AdminProfile, CampusList, NewCampus.
 */

export const ADMIN_PRIMARY   = '#003285';
export const ADMIN_SECONDARY = '#2a629a';

export const ADMIN_GRADIENT     = 'linear-gradient(135deg, #003285 0%, #2a629a 100%)';
export const ADMIN_GRADIENT_BTN = ADMIN_GRADIENT;
export const ADMIN_SHADOW       = '0 6px 20px rgba(0, 50, 133, 0.35)';

// ─── Dark-mode variants ────────────────────────────────────────────────────────
// #003285 is legible as white-on-brand (gradient banners) in both modes, but too
// dark to use as a foreground colour on a dark `paper` surface. These accessors
// return the surface-legible brand colour for the current resolved palette mode.

export const ADMIN_PRIMARY_DARK  = '#5b8fd6';
export const ADMIN_GRADIENT_DARK = 'linear-gradient(135deg, #0a2a5c 0%, #1e4a8a 100%)';

/** Brand primary tuned to stay legible on the current surface (light|dark). */
export const adminPrimary  = (mode) => (mode === 'dark' ? ADMIN_PRIMARY_DARK : ADMIN_PRIMARY);
/** Brand banner gradient, slightly deepened for dark surfaces. */
export const adminGradient = (mode) => (mode === 'dark' ? ADMIN_GRADIENT_DARK : ADMIN_GRADIENT);

// Campus / entity status → MUI Chip color name
export const CAMPUS_STATUS_COLOR = {
  active:   'success',
  inactive: 'default',
  archived: 'error',
};
