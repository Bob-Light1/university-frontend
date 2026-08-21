/**
 * @file dangerZoneService.js
 * @description Axios client for the harmonized permanent-deletion API (`/api/danger-zone`).
 *
 * Permanent deletion is a two-call flow, and it is deliberately impossible to shortcut:
 *
 *   1. `getDeletionImpact()` returns what would be destroyed, what blocks the deletion, the
 *      exact phrase the operator must type, and a short-lived ticket.
 *   2. `executeHardDelete()` replays that ticket together with the phrase, the operator's
 *      password and a written justification.
 *
 * The backend recomputes the impact on step 2 and refuses the ticket if anything changed in
 * between, so the ticket must never be cached across sessions or reused.
 *
 * Entity type keys (`student`, `teacher`, `parent`, `mentor`, `staff`, `staff-role`, `class`,
 * `subject`, `department`, `level`, `course`, `partner`, `announcement`, `campus`,
 * `document`) are defined by the backend registry — it is the single source of truth.
 */

import api from '../api/axiosInstance';

/**
 * GET /danger-zone/entities
 * Entity types the current user may permanently delete, plus the confirmation policy
 * (minimum reason length, ticket TTL) the dialog must enforce.
 */
export const getDeletableEntities = () =>
  api.get('/danger-zone/entities');

/**
 * GET /danger-zone/:entityType/:id/impact
 * Read-only impact report. Issues the ticket required by {@link executeHardDelete}.
 *
 * @param {string} entityType - Registry key, e.g. 'student'.
 * @param {string} id         - Target document id.
 */
export const getDeletionImpact = (entityType, id) =>
  api.get(`/danger-zone/${entityType}/${id}/impact`);

/**
 * DELETE /danger-zone/:entityType/:id
 * Performs the permanent deletion. Every field is mandatory.
 *
 * @param {string} entityType
 * @param {string} id
 * @param {Object} confirmation
 * @param {string} confirmation.ticket             - From the impact preview.
 * @param {string} confirmation.confirmationPhrase - Typed verbatim by the operator.
 * @param {string} confirmation.password           - The operator's own password.
 * @param {string} confirmation.reason             - Written justification (min. 10 chars).
 */
export const executeHardDelete = (entityType, id, confirmation) =>
  api.delete(`/danger-zone/${entityType}/${id}`, { data: confirmation });

/**
 * GET /danger-zone/history
 * Paginated ledger of permanent deletions — completed and refused alike.
 *
 * @param {Object} [params] - `{ entityType, outcome, campusId, page, limit }`
 */
export const getDeletionHistory = (params = {}) =>
  api.get('/danger-zone/history', { params });
