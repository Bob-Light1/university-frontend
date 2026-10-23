/**
 * @file lead_service.js
 * @description Axios service layer for Partner Lead Management endpoints.
 *
 * Aligned with backend router: /api/partners/leads/* (partner.router.js)
 *
 * All routes require authentication.
 * - PARTNER role: read-only access to their own leads (via /partners/me/leads in partner_service.js)
 * - MGR_ROLES (ADMIN, DIRECTOR, CAMPUS_MANAGER): full CRUD across campus
 */

import api from '../api/axiosInstance';

/**
 * GET /partners/leads
 * Paginated lead list (campus-scoped for MGR; campus+partner-scoped for PARTNER role).
 * @param {{ search?, status?, partner?, source?, from?, to?, page?, limit? }} params
 */
export const listLeads = (params = {}) =>
  api.get('/partners/leads', { params });

/**
 * GET /partners/leads/export
 * Download CSV export of leads.
 * @param {{ status?, partner?, source?, from?, to? }} params
 */
export const exportLeads = (params = {}) =>
  api.get('/partners/leads/export', { params, responseType: 'blob' });

/**
 * GET /partners/leads/:id
 * Full lead detail including status history.
 * @param {string} id
 */
export const getLead = (id) =>
  api.get(`/partners/leads/${id}`);

/**
 * PATCH /partners/leads/:id/status
 * Advance or change the lead's pipeline status.
 * @param {string} id
 * @param {{ status: string, note?: string, tuitionFee?: number }} data
 */
export const updateLeadStatus = (id, data) =>
  api.patch(`/partners/leads/${id}/status`, data);

/**
 * DELETE /partners/leads/:id
 * Soft-delete a lead (marks as 'abandoned'). Blocked if a commission is attached.
 * @param {string} id
 */
export const deleteLead = (id, revision) =>
  api.delete(`/partners/leads/${id}`, { data: { revision } });

/** Read the management dossier, private-file metadata and requirement snapshot. */
export const getDossier = (id) => api.get(`/partners/leads/${id}/dossier`);
/** Upload only to an authorized draft dossier. */
export const uploadDossierFile = (id, file, category, revision) => {
  const data = new FormData();
  data.append('file', file);
  data.append('category', category);
  data.append('revision', revision);
  return api.post(`/partners/leads/${id}/dossier/files`, data);
};
/** Download an authorized private attachment. */
export const downloadDossierFile = (id, fileId) => api.get(`/partners/leads/${id}/dossier/files/${fileId}`, { responseType: 'blob' });
/** Archive a draft file while retaining its history and stored bytes. */
export const archiveDossierFile = (id, fileId, revision) => api.delete(`/partners/leads/${id}/dossier/files/${fileId}`, { data: { revision } });
/** Send a private access link to the stored candidate email. */
export const issueDossierAccess = (id) => api.post(`/partners/leads/${id}/dossier/access`);
/** Revoke existing candidate access. */
export const revokeDossierAccess = (id) => api.delete(`/partners/leads/${id}/dossier/access`);
/** Read the selected campus's required attachment categories. */
export const getAdmissionConfig = (campusId) => api.get('/partners/admission/config', { params: { campusId } });
/** Configure requirements for future submissions only. */
export const setAdmissionConfig = (campusId, requirements) => api.put('/partners/admission/config', { requirements }, { params: { campusId } });
