/**
 * @file staffTokens.js
 * @description Design tokens for the Staff portal.
 *
 * Staff uses the same teal as the Director portal (#00695C). This file
 * centralises it — the value was previously duplicated as a local const in every
 * staff component — and exposes a dark-surface-legible variant so brand accents
 * stay readable when the app switches to dark mode.
 */

export const STAFF_PRIMARY      = '#00695C';
export const STAFF_PRIMARY_DARK = '#4db6ac';

/** Brand primary tuned to stay legible on the current surface (light|dark). */
export const staffPrimary = (mode) => (mode === 'dark' ? STAFF_PRIMARY_DARK : STAFF_PRIMARY);
