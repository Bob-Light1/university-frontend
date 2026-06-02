/**
 * @file gaetService.js
 * @description Axios service layer for GAET — Générateur Automatique d'Emploi du Temps.
 *
 * Aligned with backend routes registered at /api/gaet:
 *   GET    /gaet/constraints/:campusId
 *   POST   /gaet/constraints
 *   POST   /gaet/generate
 *   GET    /gaet/status/:constraintId
 *   GET    /gaet/preview/:constraintId
 *   POST   /gaet/publish/:constraintId
 *   GET    /gaet/conflicts/:constraintId
 *   DELETE /gaet/generated/:constraintId
 */

import api from '../api/axiosInstance';

// ─── READ ────────────────────────────────────────────────────────────────────

/** GET /gaet/constraints/:campusId — List all constraints for a campus. */
export const getConstraints = (campusId, params = {}) =>
  api.get(`/gaet/constraints/${campusId}`, { params });

/** GET /gaet/status/:constraintId — Poll status during generation. */
export const getStatus = (constraintId) =>
  api.get(`/gaet/status/${constraintId}`);

/** GET /gaet/preview/:constraintId — Generated sessions before publication. */
export const getPreview = (constraintId) =>
  api.get(`/gaet/preview/${constraintId}`);

/** GET /gaet/conflicts/:constraintId — Residual conflict report. */
export const getConflicts = (constraintId) =>
  api.get(`/gaet/conflicts/${constraintId}`);

// ─── WRITE ───────────────────────────────────────────────────────────────────

/** POST /gaet/constraints — Create or update (upsert) constraint document. */
export const createOrUpdateConstraints = (data) =>
  api.post('/gaet/constraints', data);

/** POST /gaet/generate — Trigger generation in a worker thread (returns 202). */
export const generateSchedule = (data) =>
  api.post('/gaet/generate', data);

/** POST /gaet/publish/:constraintId — Publish → StudentSchedule + TeacherSchedule. */
export const publishSchedule = (constraintId) =>
  api.post(`/gaet/publish/${constraintId}`);

/** DELETE /gaet/generated/:constraintId — Cancel a generated (unpublished) timetable. */
export const cancelGenerated = (constraintId) =>
  api.delete(`/gaet/generated/${constraintId}`);
