/**
 * @file useHardDelete.js
 * @description Single entry point every screen uses to expose the danger zone.
 *
 * Two things were previously duplicated — or worse, guessed — by each screen that wanted a
 * permanent-deletion button:
 *
 *   1. **Who may run it.** GenericEntityPage hard-coded `ADMIN`, which happens to match the five
 *      actor entities and nothing else: `announcement` and `document` are also open to DIRECTOR,
 *      `staff-role` to CAMPUS_MANAGER. A hard-coded gate is a second source of truth for a rule
 *      the registry already owns, and it fails in the direction nobody notices — the button is
 *      simply missing for an operator who is entitled to it.
 *   2. **Whether the row must be archived first.** `requireArchivedFirst` is declared per entity
 *      in the registry (`staff-role`, for instance, has no soft-delete marker at all and is
 *      therefore deletable while live).
 *
 * Both travel on `GET /danger-zone/entities`, so both are read from there. The catalogue is
 * fetched once per session and shared by every mounted consumer.
 *
 * This is a convenience gate, never a security control: the server re-checks the role on the
 * impact preview and again on the deletion itself.
 */

import { useCallback, useEffect, useMemo, useState, useContext } from 'react';

import { AuthContext } from '../context/AuthContext';
import { getDeletableEntities } from '../services/dangerZoneService';

/**
 * Mirrors `DANGER_ZONE_ROLES` in `shared/lib/hard-delete/hard-delete.constants.js`, which gates
 * the router itself. Any other role gets a 403 on the catalogue, so it is not even asked for:
 * the danger zone lives on screens (documents, courses, announcements) that students and
 * teachers also open, and a 403 per page load is noise in every log for a button that can never
 * be shown.
 */
const DANGER_ZONE_ROLES = ['ADMIN', 'DIRECTOR', 'CAMPUS_MANAGER'];

// ── Catalogue cache ───────────────────────────────────────────────────────────
// The catalogue is derived from the caller's role and does not change while that caller is
// signed in, and several consumers can mount at once (a table row action plus a detail drawer).
// One request is issued and its result — including a failure, which must not be retried on every
// mount — is shared.
//
// The cache is keyed by the identity it was fetched for, so a different account can never read
// the previous one's permissions out of it, whether it arrives through a reload or an in-app
// switch.

const CACHE = new Map(); // identity → { catalogue } | { promise }

/**
 * Fetches the catalogue for one identity and memoizes it.
 *
 * A rejected request resolves to an empty catalogue rather than propagating: the only
 * consequence is a hidden button, and the deletion endpoints enforce the real rule anyway.
 *
 * @param {string} identity - Cache key: the signed-in user, role included.
 * @returns {Promise<{ entities: Map<string, Object>, policy: Object }>}
 */
const loadCatalogue = (identity) => {
  const cached = CACHE.get(identity);
  if (cached?.catalogue) return Promise.resolve(cached.catalogue);
  if (cached?.promise)   return cached.promise;

  const promise = getDeletableEntities()
    .then((res) => {
      const payload = res.data?.data ?? {};
      return {
        entities: new Map((payload.entities ?? []).map((entry) => [entry.key, entry])),
        policy: payload.policy ?? {},
      };
    })
    .catch(() => ({ entities: new Map(), policy: {} }))
    .then((catalogue) => {
      CACHE.set(identity, { catalogue });
      return catalogue;
    });

  CACHE.set(identity, { promise });
  return promise;
};

/**
 * Subscribes to the catalogue of the signed-in operator.
 *
 * @returns {{ catalogue: Object|null, loading: boolean }}
 */
const useDangerZoneCatalogue = () => {
  const { user, hasRole, getUserRole } = useContext(AuthContext);
  const eligible = hasRole(DANGER_ZONE_ROLES);
  const identity = eligible
    ? `${user?._id ?? user?.id ?? 'unknown'}:${getUserRole() ?? ''}`
    : null;

  // Read straight from the cache during render rather than mirroring it into state. That is
  // what makes an identity switch safe: the value shown always belongs to the identity being
  // rendered, so a previous operator's permissions can never survive one render into the next.
  const catalogue = identity ? CACHE.get(identity)?.catalogue ?? null : null;

  // State exists only to re-render once the fetch lands; the value itself comes from the cache.
  const [, onCatalogueLoaded] = useState(0);

  useEffect(() => {
    if (!identity || CACHE.get(identity)?.catalogue) return undefined;

    let active = true;
    loadCatalogue(identity).then(() => {
      if (active) onCatalogueLoaded((n) => n + 1);
    });

    return () => { active = false; };
  }, [identity]);

  return { catalogue, loading: Boolean(identity) && !catalogue };
};

/**
 * Danger-zone wiring for one entity type.
 *
 * @param {string|null} entityType        - Registry key (`'class'`, `'document'`…). Falsy disables.
 * @param {Object}      [options]
 * @param {Function}    [options.onDeleted] - Called with the deletion receipt after a success,
 *                                            typically to refresh the list.
 * @returns {{
 *   enabled: boolean,                    // the operator may hard-delete this entity type
 *   requireArchivedFirst: boolean,       // the row must already be soft-deleted
 *   canDelete: (isArchived: boolean) => boolean,  // full gate for one row
 *   requestDelete: (id: string, label?: string) => void,
 *   dialogProps: Object,                 // spread onto <HardDeleteDialog />
 * }}
 */
export const useHardDelete = (entityType, { onDeleted } = {}) => {
  const { catalogue } = useDangerZoneCatalogue();
  const [target, setTarget] = useState(null); // { id, label }

  const entry = entityType ? catalogue?.entities.get(entityType) : undefined;
  const enabled = Boolean(entry);

  // Defaults to `true` while the catalogue is loading: assuming a row is deletable before the
  // server has said so would flash a permanent-deletion button on a live record.
  const requireArchivedFirst = entry?.requireArchivedFirst ?? true;

  const canDelete = useCallback(
    (isArchived) => enabled && (!requireArchivedFirst || Boolean(isArchived)),
    [enabled, requireArchivedFirst],
  );

  const requestDelete = useCallback((id, label = '') => {
    if (!id) return;
    setTarget({ id, label });
  }, []);

  const handleClose = useCallback(() => setTarget(null), []);

  const handleDeleted = useCallback((receipt) => {
    setTarget(null);
    onDeleted?.(receipt);
  }, [onDeleted]);

  const dialogProps = useMemo(() => ({
    open: Boolean(target),
    entityType,
    entityId: target?.id,
    entityLabel: target?.label,
    onClose: handleClose,
    onDeleted: handleDeleted,
  }), [target, entityType, handleClose, handleDeleted]);

  return { enabled, requireArchivedFirst, canDelete, requestDelete, dialogProps };
};

export default useHardDelete;
