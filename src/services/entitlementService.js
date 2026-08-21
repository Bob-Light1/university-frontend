/**
 * @file entitlementService.js
 * @description Axios client for the per-campus entitlement hydration endpoint.
 *
 * ONE call, one contract: `GET /api/settings/entitlement` answers with the
 * EFFECTIVE state of every module for the caller. Design doc §8.1 — it lives
 * on its own endpoint rather than inside the nine login responses, so a change
 * to the entitlement contract touches one route instead of nine.
 *
 * The response carries STATES, never rules (§8.2). Nothing in this layer
 * decides what a state means; that is the resolver's job on the server and the
 * provider's job to relay.
 */

import api from '../api/axiosInstance';

/**
 * GET /settings/entitlement
 *
 * Scoped roles always get their own campus — `campusId` is ignored for them and
 * read from the token server-side (CLAUDE.md §2). Global roles (ADMIN /
 * DIRECTOR) get the whole estate enabled, narrowed to one tenant when they pass
 * `campusId`, which is what lets an admin see a campus exactly as its manager
 * does.
 *
 * @param {Object} [options]
 * @param {string|null} [options.campusId] - Tenant context for a global role.
 * @returns {Promise<import('axios').AxiosResponse>} `{ campusId, plan,
 *   unrestricted, states, features, registry }` under `data.data`.
 */
export const getEntitlement = ({ campusId } = {}) =>
  api.get('/settings/entitlement', { params: campusId ? { campusId } : undefined });

// ─── Phase 4 — the two pilot layers (design doc §5) ──────────────────────────
//
// Hydration above answers "what may I use?"; everything below answers "what is
// this campus allowed to use, and who decided?". They are separate endpoints
// because they are separate questions with separate audiences — and separate
// permissions: the calls below are refused to everyone but the two operators
// entitled to them, by the server, not by this file.

/**
 * GET /admin/campuses/:id/entitlement — the OFFER layer of one campus.
 *
 * @param {string} campusId
 * @returns {Promise<import('axios').AxiosResponse>} `{ plan, quotas, features,
 *   plans, planPresets, requirements, audit }` under `data.data`. Each feature
 *   carries its effective `state`, the `offerState` ceiling, what the tier alone
 *   grants (`planState`), the `allowedStates` this layer may select, and both
 *   layers' overrides side by side.
 * @access ADMIN | DIRECTOR
 */
export const getCampusOffer = (campusId) =>
  api.get(`/admin/campuses/${campusId}/entitlement`);

/**
 * PATCH /admin/campuses/:id/entitlement — sells, opens or closes modules.
 *
 * @param {string} campusId
 * @param {Object} payload - `{ plan?, modules?, quotas?, ai? }`.
 * @returns {Promise<import('axios').AxiosResponse>}
 * @access ADMIN | DIRECTOR
 */
export const updateCampusOffer = (campusId, payload) =>
  api.patch(`/admin/campuses/${campusId}/entitlement`, payload);

/**
 * GET /admin/entitlement/overview — the estate matrix, every campus × module.
 *
 * @returns {Promise<import('axios').AxiosResponse>} `{ campuses, features,
 *   plans, planPresets }` under `data.data`.
 * @access ADMIN | DIRECTOR
 */
export const getEstateOverview = () => api.get('/admin/entitlement/overview');

/**
 * GET /campus/:id/entitlement — the USAGE layer: what the manager switched on
 * inside the offer sold to them.
 *
 * @param {string} campusId
 * @returns {Promise<import('axios').AxiosResponse>}
 * @access ADMIN | DIRECTOR | CAMPUS_MANAGER (own campus)
 */
export const getCampusUsage = (campusId) => api.get(`/campus/${campusId}/entitlement`);

/**
 * PATCH /campus/:id/entitlement — the manager's own toggles.
 *
 * `plan` is refused here by the server rather than ignored, so this client
 * never sends one: a manager who believed they changed their tier and got a
 * 200 would have been told something false about their bill.
 *
 * @param {string} campusId
 * @param {Object} payload - `{ modules: [{ key, state, until?, reason }] }`.
 * @returns {Promise<import('axios').AxiosResponse>}
 * @access ADMIN | DIRECTOR | CAMPUS_MANAGER (own campus)
 */
export const updateCampusUsage = (campusId, payload) =>
  api.patch(`/campus/${campusId}/entitlement`, payload);

export default {
  getEntitlement,
  getCampusOffer,
  updateCampusOffer,
  getEstateOverview,
  getCampusUsage,
  updateCampusUsage,
};
