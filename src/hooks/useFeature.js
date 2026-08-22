/**
 * @file useFeature.js
 * @description The only way a component asks "may this campus use module X?".
 *
 * Design doc §8.2. Every screen goes through this hook — never through a
 * hard-coded module list, never through `user.plan`. Restating a rule in a
 * component is a second source of truth for something the backend registry
 * owns, and it fails in the direction nobody notices: the section is simply
 * missing for a campus entitled to it (exactly what the hard-coded
 * `hasRole(['ADMIN'])` did to the danger zone before `useHardDelete`).
 *
 * Fail-open (§4.3): an unknown key, a campus with no entitlement and a failed
 * hydration all answer `enabled`. The server gate is the enforcement point.
 */

import { useContext } from 'react';

import { EntitlementContext } from '../context/EntitlementContext';
import { FEATURE_STATES } from '../config/featureConstants';
import { useModuleLabel } from './useModuleLabel';

/**
 * The whole entitlement context — plan, registry metadata, refresh.
 * Prefer {@link useFeature} when you only care about one module.
 *
 * @returns {Object} `{ ready, plan, campusId, unrestricted, features, registry, stateOf, refresh }`
 */
export const useEntitlement = () => {
  const context = useContext(EntitlementContext);
  if (context === undefined) {
    throw new Error('useEntitlement must be used within an EntitlementProvider');
  }
  return context;
};

/**
 * Should a surface for a module in this state be drawn at all?
 *
 * The single expression of §4.1.2 + §5.2: `hidden` removes the surface, a
 * global role keeps it (they are bound by no entitlement), and `read_only`
 * keeps it because the history it holds must stay reachable — only the
 * mutating actions inside disappear (§4.1).
 *
 * Exported because three surfaces answer this question — `useFeature` below,
 * the navigation in `AppShell`, and the campus dashboard's module grid — and
 * a rule copied three times is a rule that drifts twice.
 *
 * @param {string} state - One of FEATURE_STATES.
 * @param {boolean} unrestricted - The caller is a global role (§5.2).
 * @returns {boolean}
 */
export const isVisibleState = (state, unrestricted) =>
  unrestricted || state !== FEATURE_STATES.HIDDEN;

/**
 * Effective state of one module for the current caller.
 *
 * `visible` and `canWrite` already fold in the unrestricted-role rule (§5.2),
 * so a caller never has to check the role itself. `state` stays the campus's
 * REAL state even for a global role — that is what a "disabled for this campus"
 * badge renders from.
 *
 * @param {string|null|undefined} key - Registry key (`'finance'`, `'gaet'`…).
 *   Falsy means "not gated": everything is permitted, which is what lets a
 *   generic component take an optional `feature` prop.
 * @returns {{
 *   ready: boolean,        // the states have been hydrated
 *   state: string,         // 'enabled' | 'read_only' | 'hidden'
 *   visible: boolean,      // render the entry / section at all
 *   canWrite: boolean,     // render the mutating actions
 *   readOnly: boolean,     // frozen: history stays, mutations do not
 *   hidden: boolean,       // not part of this campus's offer
 *   restricted: boolean,   // the campus does not have it fully — drives the badge
 *   unrestricted: boolean, // the caller is a global role, bound by nothing
 *   label: string|null,    // module name, translated — for a badge or an empty state
 * }}
 */
export const useFeature = (key) => {
  const { ready, stateOf, unrestricted, registry } = useEntitlement();
  const moduleLabel = useModuleLabel();

  const state = key ? stateOf(key) : FEATURE_STATES.ENABLED;
  const restricted = state !== FEATURE_STATES.ENABLED;

  return {
    ready,
    state,
    // Global roles are bound by no entitlement, on the server as here: hiding a
    // module from an admin would hide the very thing they are there to fix.
    visible:  isVisibleState(state, unrestricted),
    canWrite: unrestricted || state === FEATURE_STATES.ENABLED,
    readOnly: state === FEATURE_STATES.READ_ONLY,
    hidden:   state === FEATURE_STATES.HIDDEN,
    restricted,
    unrestricted,
    // Translated where a translation exists, English registry label otherwise
    // (phase 4). Every surface that names a module goes through the same
    // resolver, so the refusal screen and the pilot matrix cannot call the
    // same key two different things.
    label: key ? moduleLabel(key, registry?.[key]?.label || null) : null,
  };
};

export default useFeature;
