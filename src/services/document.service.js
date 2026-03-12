/**
 * @file document.service.js
 * @description API service layer for the Document Management Module.
 *
 * Mirrors the backend route matrix defined in document.router.js.
 * Campus isolation is enforced server-side — this service never injects campusId.
 * Role-based access is enforced server-side. This is a thin HTTP wrapper.
 */

import api from '../api/axiosInstance';

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * List documents with optional filters and pagination.
 * @param {Object} params - { type, category, status, tag, studentId, teacherId,
 *                           courseId, semester, academicYear, page, limit }
 */
export const listDocuments = (params = {}) =>
  api.get('/documents', { params });

/**
 * Retrieve a single document by MongoDB _id (full body included).
 * @param {string} id
 */
export const getDocumentById = (id) =>
  api.get(`/documents/${id}`);

/**
 * Create a rich-content document (JSON body).
 * @param {Object} payload
 */
export const createDocument = (payload) =>
  api.post('/documents', payload);

/**
 * Create an IMPORTED document via multipart/form-data file upload.
 * @param {FormData} formData - Must include `file` field + metadata fields
 */
export const importDocument = (formData) =>
  api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Partially update a document.
 * @param {string} id
 * @param {Object} payload - { reason?, ...fields }
 */
export const updateDocument = (id, payload) =>
  api.patch(`/documents/${id}`, payload);

/**
 * Soft-delete a document.
 * @param {string} id
 * @param {string} reason - Required for PUBLISHED/LOCKED documents
 */
export const softDeleteDocument = (id, reason) =>
  api.delete(`/documents/${id}`, { data: { reason } });

/**
 * Hard-delete a document (ADMIN / DIRECTOR only).
 * @param {string} id
 * @param {string} reason
 */
export const hardDeleteDocument = (id, reason) =>
  api.delete(`/documents/${id}?hard=true`, { data: { reason } });

// ─── SEARCH ───────────────────────────────────────────────────────────────────

/**
 * Full-text search with metadata filters.
 * @param {Object} params - { q?, type?, status?, category?, tag?, studentId?,
 *                           teacherId?, courseId?, semester?, academicYear?, page, limit }
 */
export const searchDocuments = (params = {}) =>
  api.get('/documents/search', { params });

// ─── WORKFLOW ─────────────────────────────────────────────────────────────────

export const publishDocument   = (id, reason)  => api.post(`/documents/${id}/publish`,       { reason });
export const archiveDocument   = (id, reason)  => api.post(`/documents/${id}/archive`,       { reason });
export const restoreDocument   = (id, reason)  => api.post(`/documents/${id}/restore`,       { reason });
export const duplicateDocument = (id)          => api.post(`/documents/${id}/duplicate`);
export const lockDocument      = (id, reason)  => api.post(`/documents/${id}/lock`,          { reason });
export const unlockDocument    = (id, reason)  => api.post(`/documents/${id}/unlock`,        { reason });
export const markOfficial      = (id, reason)  => api.post(`/documents/${id}/mark-official`, { reason });

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Export a document as PDF — returns blob URL.
 * @param {string} id
 */
export const exportDocumentPdf = (id) =>
  api.get(`/documents/${id}/export/pdf`, { responseType: 'blob' });

/**
 * Export raw file for IMPORTED documents.
 * @param {string} id
 */
export const exportDocumentRaw = (id) =>
  api.get(`/documents/${id}/export/raw`, { responseType: 'blob' });

/**
 * Bulk export selected documents as PDF archive.
 * @param {string[]} documentIds
 * @param {Object}   options - { format?, compress? }
 */
export const bulkExportDocuments = (documentIds, options = {}) =>
  api.post('/documents/bulk/export', { documentIds, ...options }, { responseType: 'blob' });

/**
 * Enqueue a print job for multiple documents.
 * @param {string[]} documentIds
 * @param {Object}   printConfig
 */
export const enqueuePrintJob = (documentIds, printConfig = {}) =>
  api.post('/documents/bulk/print', { documentIds, printConfig });

/**
 * Poll print job status.
 * @param {string} jobId
 */
export const getPrintJobStatus = (jobId) =>
  api.get(`/documents/print-jobs/${jobId}`);

// ─── SHARE ────────────────────────────────────────────────────────────────────

/**
 * Create a signed, expiring share link for a PUBLISHED/LOCKED document.
 * @param {string} id
 * @param {Object} options - { expiresInHours?, maxDownloads? }
 */
export const createShareLink = (id, options = {}) =>
  api.post(`/documents/${id}/share`, options);

/**
 * List all active share links for a document (metadata only — no tokens).
 * @param {string} id
 */
export const listShareLinks = (id) =>
  api.get(`/documents/${id}/shares`);

/**
 * Revoke a share link immediately.
 * @param {string} shareId
 */
export const revokeShareLink = (shareId) =>
  api.delete(`/documents/share/${shareId}`);

// ─── AUDIT ────────────────────────────────────────────────────────────────────

/**
 * Paginated audit log for a specific document.
 * @param {string} id
 * @param {Object} params - { page, limit }
 */
export const getDocumentAudit = (id, params = {}) =>
  api.get(`/documents/${id}/audit`, { params });

/**
 * Campus-wide audit log.
 * @param {Object} params - { page, limit, action?, userId? }
 */
export const getCampusAudit = (params = {}) =>
  api.get('/documents/audit/campus', { params });

// ─── VERSIONS ─────────────────────────────────────────────────────────────────

export const listDocumentVersions = (id, params = {}) =>
  api.get(`/documents/${id}/versions`, { params });

export const getDocumentVersion = (id, version) =>
  api.get(`/documents/${id}/versions/${version}`);

export const restoreDocumentVersion = (id, version, reason) =>
  api.post(`/documents/${id}/versions/${version}/restore`, { reason });

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

export const listTemplates        = (params = {}) => api.get('/documents/templates', { params });
export const getTemplate          = (id)          => api.get(`/documents/templates/${id}`);
export const createTemplate       = (payload)     => api.post('/documents/templates', payload);
export const updateTemplate       = (id, payload) => api.patch(`/documents/templates/${id}`, payload);
export const deleteTemplate       = (id)          => api.delete(`/documents/templates/${id}`);
export const generateFromTemplate = (id, data)    => api.post(`/documents/templates/${id}/generate`, data);
export const previewTemplate      = (id, data)    => api.post(`/documents/templates/${id}/preview`, data);

// ─── TYPED GENERATION ─────────────────────────────────────────────────────────

export const generateStudentCard   = (studentId, opts = {}) =>
  api.post(`/documents/generate/student-card/${studentId}`, opts);

export const generateTeacherPayslip = (teacherId, opts = {}) =>
  api.post(`/documents/generate/teacher-payslip/${teacherId}`, opts);

export const generateClassList = (classId, opts = {}) =>
  api.post(`/documents/generate/class-list/${classId}`, opts);

// ─── PUBLIC (no auth) ─────────────────────────────────────────────────────────

/**
 * Public document verification via QR code ref.
 * No authentication required — use plain fetch or axios without interceptors.
 * @param {string} ref - Document ref (DOC-XXXX-...)
 */
export const verifyDocument = (ref) =>
  api.get(`/documents/verify/${ref}`);