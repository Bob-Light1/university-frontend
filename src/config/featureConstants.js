/**
 * @file featureConstants.js
 * @description Frontend mirror of the per-campus entitlement constants
 * (`shared/constants/features.constants.js` — the backend is the single source
 * of truth, CLAUDE.md §0.1). Design doc:
 * `backend/docs/architecture/CAMPUS_ENTITLEMENT_DESIGN.md`, phase 3.
 *
 * Only the two frozen VOCABULARIES are mirrored: the three states and the error
 * codes. The list of feature keys, their labels and their plan tier are NOT
 * duplicated here — they travel on `GET /api/settings/entitlement` (its
 * `registry` field), so adding a module to the backend registry never requires
 * a frontend release.
 *
 * ⚠️ FAIL-OPEN, like the backend (§4.3). An unknown or missing key means
 * `enabled`, the exact inverse of the campus-isolation and soft-delete helpers.
 * Entitlement is commercial packaging, not a security control: the gate on the
 * server is what enforces it, and everything here only decides what is worth
 * drawing.
 */

/** The three states a module can take on a campus (design doc §4.1). */
export const FEATURE_STATES = Object.freeze({
  ENABLED:   'enabled',
  READ_ONLY: 'read_only',
  HIDDEN:    'hidden',
});

/**
 * Dedicated codes travelling in `errors.code` of a 403. A bare 403 is
 * indistinguishable from a role refusal, which is precisely what makes the
 * write-in-flight case (§8.3) impossible to handle without these: the axios
 * interceptor keys off them to re-hydrate the flags instead of showing
 * "forbidden" on a module that was switched off one second ago.
 */
export const FEATURE_ERROR_CODES = Object.freeze({
  /** Gate: the module is hidden for this campus. */
  FEATURE_DISABLED:  'FEATURE_DISABLED',
  /** Gate: the module is frozen — reads pass, this write does not. */
  FEATURE_READ_ONLY: 'FEATURE_READ_ONLY',
});

/** The subset of {@link FEATURE_ERROR_CODES} the gate itself can raise. */
export const GATE_ERROR_CODES = Object.freeze([
  FEATURE_ERROR_CODES.FEATURE_DISABLED,
  FEATURE_ERROR_CODES.FEATURE_READ_ONLY,
]);

/** Roles bound by no entitlement — they navigate the whole estate (§5.2). */
export const UNRESTRICTED_ROLES = Object.freeze(['ADMIN', 'DIRECTOR']);
