/**
 * @file mentorTokens.js
 * @description Design tokens for the Mentor portal.
 *
 * Mentor reuses the deep admin blue (#003285). This file centralises it — the
 * value was previously duplicated as a local const in every mentor component —
 * and exposes a dark-surface-legible variant so brand accents stay readable when
 * the app switches to dark mode.
 */

export const MENTOR_PRIMARY      = '#003285';
export const MENTOR_PRIMARY_DARK = '#5b8fd6';

/** Brand primary tuned to stay legible on the current surface (light|dark). */
export const mentorPrimary = (mode) => (mode === 'dark' ? MENTOR_PRIMARY_DARK : MENTOR_PRIMARY);
