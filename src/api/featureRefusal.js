/**
 * @file featureRefusal.js
 * @description One-way channel between the axios interceptor and the
 * entitlement provider, for the write-in-flight case (design doc §8.3).
 *
 * A user has the Finance page open when the module is switched off. Their next
 * POST comes back 403 `FEATURE_READ_ONLY` / `FEATURE_DISABLED`, and without
 * special handling that reads as a bug: the button is still on screen, the
 * error says "forbidden", and the navigation still lists a module the campus no
 * longer has.
 *
 * This module exists so the interceptor can say so WITHOUT importing the
 * provider — the provider imports the service, the service imports the axios
 * instance, and closing that loop the other way round would be a cycle. It has
 * no dependency of its own on purpose.
 */

/** @type {Set<(refusal: {code: string, feature: string|null, message: string}) => void>} */
const listeners = new Set();

/**
 * Subscribes to gate refusals.
 *
 * @param {(refusal: {code: string, feature: string|null, message: string}) => void} listener
 * @returns {() => void} unsubscribe.
 */
export const onFeatureRefusal = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Announces a gate refusal. Never throws: a listener that fails must not turn
 * a handled 403 into an unhandled rejection inside the axios interceptor, which
 * would swallow the original error the caller is waiting for.
 *
 * @param {{code: string, feature: string|null, message: string}} refusal
 */
export const emitFeatureRefusal = (refusal) => {
  listeners.forEach((listener) => {
    try { listener(refusal); }
    catch (err) { console.warn('[entitlement] refusal listener failed:', err); }
  });
};
