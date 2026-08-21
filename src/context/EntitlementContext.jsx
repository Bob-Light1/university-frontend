/**
 * @file EntitlementContext.jsx
 * @description Single source of the per-campus module states on the frontend.
 *
 * Design doc: `backend/docs/architecture/CAMPUS_ENTITLEMENT_DESIGN.md` §8
 * (phase 3). The rule the whole layer rests on:
 *
 *   **The frontend re-implements NO access rule.** It fetches the effective
 *   state of every module once, relays it, and renders accordingly. Whoever
 *   changes a rule changes it in `shared/utils/entitlement.js`, once. A second
 *   copy here would drift, and the copy that drifts is always the permissive
 *   one.
 *
 * Three behaviours worth reading before touching this file:
 *
 * 1. **Fail-open (§4.3).** A failed fetch, an unknown key, a campus with no
 *    entitlement — all resolve to `enabled`. Entitlement is commercial
 *    packaging, not a security boundary; the server gate is what enforces it.
 *    A frontend that failed CLOSED would blank the platform on a hiccup.
 *
 * 2. **Nothing gated renders before the answer arrives.** Consumers wait on
 *    `ready` instead of assuming. Assuming "enabled" would flash menu entries
 *    and buttons that then vanish — precisely the dead-button experience §4.1.2
 *    forbids. The wait is one request, cached for the whole session, and it
 *    never blocks the ungated parts of the shell.
 *
 * 3. **Global roles are not narrowed (§5.2).** ADMIN / DIRECTOR pass every
 *    gate server-side, so nothing is hidden from them. When they browse inside
 *    a tenant (`/campus/:campusId`) the campus's real states are still fetched,
 *    so a screen can show the "disabled for this campus" badge instead of
 *    pretending the module is fully live.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';

import { AuthContext } from './AuthContext';
import { getEntitlement } from '../services/entitlementService';
import { onFeatureRefusal } from '../api/featureRefusal';
import { useAppTranslation } from '../hooks/useAppTranslation';
import { FEATURE_ERROR_CODES, FEATURE_STATES } from '../config/featureConstants';

export const EntitlementContext = createContext(undefined);

/**
 * Everything on, no plan, no registry. The answer whenever the states are not
 * known: an unauthenticated visitor, a campus predating the system, a failed
 * request. Mirrors `ALL_ENABLED` in `shared/utils/entitlement.js`.
 */
const ALL_ENABLED = Object.freeze({
  campusId:     null,
  plan:         null,
  unrestricted: false,
  features:     Object.freeze({}),   // empty → every lookup falls through to ENABLED
  registry:     Object.freeze({}),
});

/**
 * Campus context carried by the URL. ADMIN and DIRECTOR browse other tenants
 * through `/campus/:campusId`, and the states they must see there are that
 * campus's, not the platform's.
 */
const CAMPUS_PATH = /^\/campus\/([a-f\d]{24})(?:\/|$)/i;

// ── Session cache ─────────────────────────────────────────────────────────────
// The states are per identity and per campus context, and they change only when
// an operator edits them — a per-mount refetch would issue one request per page
// navigation for an answer that is stable for the whole session.
//
// Keyed by the identity it was fetched for, so a different account can never
// read the previous one's offer out of it, whether it arrives through a reload
// or an in-app switch (same reasoning as `useHardDelete`).

const CACHE = new Map(); // cacheKey → { value } | { promise }

/**
 * Fetches one (identity, campus) pair and memoizes it.
 *
 * A rejected request resolves to {@link ALL_ENABLED} rather than propagating:
 * fail-open (§4.3). The consequence of being wrong in that direction is a
 * module shown to a campus that did not buy it — a support ticket. The other
 * direction is every tenant losing its platform because one request timed out.
 *
 * @param {string} cacheKey
 * @param {string|null} campusId
 * @returns {Promise<typeof ALL_ENABLED>}
 */
const loadEntitlement = (cacheKey, campusId) => {
  const cached = CACHE.get(cacheKey);
  if (cached?.value)   return Promise.resolve(cached.value);
  if (cached?.promise) return cached.promise;

  const promise = getEntitlement({ campusId })
    .then((res) => {
      const payload = res.data?.data ?? {};
      return {
        campusId:     payload.campusId ?? null,
        plan:         payload.plan ?? null,
        unrestricted: Boolean(payload.unrestricted),
        features:     payload.features ?? {},
        registry:     payload.registry ?? {},
      };
    })
    .catch((err) => {
      console.warn('[entitlement] hydration failed — every module stays enabled:', err?.message);
      return ALL_ENABLED;
    })
    .then((value) => {
      CACHE.set(cacheKey, { value });
      return value;
    });

  CACHE.set(cacheKey, { promise });
  return promise;
};

/** Drops one entry so the next read re-fetches it (used after a gate refusal). */
const invalidate = (cacheKey) => { if (cacheKey) CACHE.delete(cacheKey); };

/**
 * Provides the effective module states to the whole authenticated tree.
 *
 * Mounted once, above the router outlet, in `main.jsx`.
 */
export function EntitlementProvider({ children }) {
  const { user, loading: authLoading, getUserRole } = useContext(AuthContext);
  const { t } = useAppTranslation('common');

  // Read from the PATH rather than from a route param: this provider is mounted
  // above the route tree so it can serve every portal at once, and
  // `/campus/:campusId` is the only place a caller browses a tenant that is not
  // their own. `useLocation` keeps it reactive across in-app navigation.
  const { pathname } = useLocation();
  const campusInPath = CAMPUS_PATH.exec(pathname)?.[1] ?? null;

  const identity = user ? `${user._id ?? user.id ?? 'unknown'}:${getUserRole() ?? ''}` : null;
  // Scoped roles never send a campus — the server reads it from their token
  // (CLAUDE.md §2). Only a global role can address another tenant.
  const campusQuery = user && campusInPath ? campusInPath : null;
  const cacheKey = identity ? `${identity}:${campusQuery ?? 'self'}` : null;

  const [refusal, setRefusal] = useState(null);
  // State exists only to re-render once a fetch lands; the value itself is read
  // from the cache during render, so it always belongs to the identity being
  // rendered rather than to whoever was signed in when the effect last ran.
  const [, onLoaded] = useState(0);

  const cachedValue = cacheKey ? CACHE.get(cacheKey)?.value ?? null : null;

  useEffect(() => {
    if (!cacheKey || CACHE.get(cacheKey)?.value) return undefined;

    let active = true;
    loadEntitlement(cacheKey, campusQuery).then(() => {
      if (active) onLoaded((n) => n + 1);
    });
    return () => { active = false; };
  }, [cacheKey, campusQuery]);

  // ── Write in flight (§8.3) ─────────────────────────────────────────────────
  // The gate refused a call the user had every reason to believe would work.
  // Drop the cached states, re-fetch them, and say so — the navigation and the
  // buttons then catch up on their own through the same context.
  useEffect(() => onFeatureRefusal((detail) => {
    setRefusal(detail);
    if (!cacheKey) return;
    invalidate(cacheKey);
    loadEntitlement(cacheKey, campusQuery).then(() => onLoaded((n) => n + 1));
  }), [cacheKey, campusQuery]);

  const value = useMemo(() => {
    const resolved = cachedValue ?? ALL_ENABLED;
    // `ready` is false only while the FIRST fetch of this key is in flight.
    // An unauthenticated tree is ready immediately: it has nothing to gate.
    const ready = !cacheKey ? !authLoading : Boolean(cachedValue);

    /**
     * Effective state of one module. An unregistered or unknown key resolves to
     * ENABLED — fail-open (§4.3), never a lookup failure.
     */
    const stateOf = (key) => resolved.features?.[key] ?? FEATURE_STATES.ENABLED;

    return {
      ready,
      plan:         resolved.plan,
      campusId:     resolved.campusId,
      unrestricted: resolved.unrestricted,
      features:     resolved.features,
      /** Registry metadata (label, core, minPlan) keyed by module — from the server. */
      registry:     resolved.registry,
      stateOf,
      /** Refetches the states — after an operator changed them from a pilot screen. */
      refresh: () => {
        // No identity means nothing was ever fetched: refreshing would issue a
        // request for a caller who is not signed in.
        if (!cacheKey) return Promise.resolve(ALL_ENABLED);
        invalidate(cacheKey);
        return loadEntitlement(cacheKey, campusQuery).then(() => onLoaded((n) => n + 1));
      },
    };
  }, [cachedValue, cacheKey, campusQuery, authLoading]);

  const closeRefusal = useCallback(() => setRefusal(null), []);

  const refusalMessage = refusal
    ? t(refusal.code === FEATURE_ERROR_CODES.FEATURE_READ_ONLY
        ? 'features.refusedReadOnly'
        : 'features.refusedDisabled')
    : '';

  return (
    <EntitlementContext.Provider value={value}>
      {children}
      {/* Owned here rather than by each screen: the refusal can land on ANY
          page, including one that has no snackbar of its own. */}
      <Snackbar
        open={Boolean(refusal)}
        autoHideDuration={8000}
        onClose={closeRefusal}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={closeRefusal} severity="warning" variant="filled" sx={{ width: '100%' }}>
          {refusalMessage}
        </Alert>
      </Snackbar>
    </EntitlementContext.Provider>
  );
}

export default EntitlementProvider;
