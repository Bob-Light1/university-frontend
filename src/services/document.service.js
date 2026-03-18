/**
 * @file document.service.js
 * @description API service layer for the Document Management Module.
 *
 * All endpoints mirror the backend route matrix defined in document.router.js.
 * Campus isolation is enforced server-side via JWT + enforceCampusAccess middleware.
 * This service is a thin HTTP wrapper — no access-control logic is duplicated here.
 *
 * Export endpoints use responseType: 'arraybuffer' so the browser can construct
 * a Blob for programmatic downloads (PDF, raw file, ZIP).
 */

import api from '../api/axiosInstance';

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Paginated list of documents with optional filters.
 * @param {Object} params - { page, limit, type, category, status, tag,
 *                           studentId, teacherId, search, sort, … }
 */
export const listDocuments = (params = {}) =>
  api.get('/documents', { params });

/**
 * Retrieve a single document by its MongoDB _id (full body included).
 * @param {string} id
 */
export const getDocumentById = (id) =>
  api.get(`/documents/${id}`);

/**
 * Full-text search with metadata filters.
 * @param {Object} params - { q, type, status, page, limit, … }
 */
export const searchDocuments = (params = {}) =>
  api.get('/documents/search', { params });

// ─── WRITE ────────────────────────────────────────────────────────────────────

/**
 * Create a new rich-content document (JSON body, no file).
 * @param {Object} payload - Validated against createDocumentSchema
 */
export const createDocument = (payload) =>
  api.post('/documents', payload);

/**
 * Import an external file as a document (multipart/form-data).
 * The file field must be named "file".
 * @param {FormData} formData
 */
export const importDocument = (formData) =>
  api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Partial update of an existing document.
 * Supports both JSON payload and file replacement (multipart/form-data).
 * @param {string} id
 * @param {Object|FormData} payload
 */
export const updateDocument = (id, payload) => {
  const isFormData = payload instanceof FormData;
  return api.patch(`/documents/${id}`, payload, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
};

/**
 * Soft-delete a document (sets deletedAt, retains for retention policy).
 * @param {string} id
 */
export const softDeleteDocument = (id) =>
  api.delete(`/documents/${id}`);

/**
 * Permanently destroy a document and its storage artefacts.
 * ADMIN only. Pass { hard: true } in the query string.
 * @param {string} id
 */
export const hardDeleteDocument = (id) =>
  api.delete(`/documents/${id}`, { params: { hard: true } });

// ─── WORKFLOW ─────────────────────────────────────────────────────────────────

/**
 * Transition DRAFT → PUBLISHED.
 * @param {string} id
 * @param {string} [reason]
 */
export const publishDocument = (id, reason = '') =>
  api.post(`/documents/${id}/publish`, { reason });

/**
 * Transition PUBLISHED → ARCHIVED.
 * @param {string} id
 * @param {string} [reason]
 */
export const archiveDocument = (id, reason = '') =>
  api.post(`/documents/${id}/archive`, { reason });

/**
 * Restore a soft-deleted document.
 * @param {string} id
 * @param {string} [reason]
 */
export const restoreDocument = (id, reason = '') =>
  api.post(`/documents/${id}/restore`, { reason });

/**
 * Clone a document into a new DRAFT copy.
 * @param {string} id
 */
export const duplicateDocument = (id) =>
  api.post(`/documents/${id}/duplicate`);

/**
 * Lock a document to prevent further edits.
 * @param {string} id
 * @param {string} [reason]
 */
export const lockDocument = (id, reason = '') =>
  api.post(`/documents/${id}/lock`, { reason });

/**
 * Unlock a previously locked document.
 * @param {string} id
 * @param {string} [reason]
 */
export const unlockDocument = (id, reason = '') =>
  api.post(`/documents/${id}/unlock`, { reason });

/**
 * Mark a document as the official reference version.
 * Triggers auto-lock server-side.
 * @param {string} id
 * @param {string} [reason]
 */
export const markOfficial = (id, reason = '') =>
  api.post(`/documents/${id}/mark-official`, { reason });

// ─── EXPORT ───────────────────────────────────────────────────────────────────

/**
 * Download the PDF export of a document.
 * Uses responseType 'arraybuffer' so the caller can construct a Blob for
 * programmatic download without needing a separate <a href> server URL.
 *
 * Rate limited: 5 requests/min per user (enforced server-side).
 *
 * @param {string} id - Document _id
 * @returns {Promise<AxiosResponse>} — res.data is an ArrayBuffer
 */
export const exportDocumentPdf = (id) =>
  api.get(`/documents/${id}/export/pdf`, {
    responseType: 'arraybuffer',
  });

/**
 * Download the original imported file of an IMPORTED document.
 * Uses responseType 'arraybuffer'. The caller should read
 * res.headers['content-type'] to determine MIME type for the Blob.
 *
 * Only available for documents of type IMPORTED.
 *
 * @param {string} id - Document _id
 * @returns {Promise<AxiosResponse>} — res.data is an ArrayBuffer
 */
export const exportDocumentRaw = (id) =>
  api.get(`/documents/${id}/export/raw`, {
    responseType: 'arraybuffer',
  });

/**
 * Bulk export up to 50 documents as a single ZIP archive containing PDFs.
 * CAMPUS_MANAGER or higher role required (enforced server-side).
 * Rate limited: 5 requests/min per user.
 *
 * @param {string[]} documentIds - Array of document _id strings (max 50)
 * @param {Object}   [options]   - Reserved for future filter/format options
 * @returns {Promise<AxiosResponse>} — res.data is an ArrayBuffer (ZIP)
 */
export const bulkExportDocuments = (documentIds, options = {}) =>
  api.post(
    '/documents/bulk/export',
    { documentIds, ...options },
    { responseType: 'arraybuffer' },
  );

// ─── PRINT ────────────────────────────────────────────────────────────────────

/**
 * Enqueue a print job for one or more documents.
 * Returns a jobId for polling via getPrintJobStatus.
 *
 * @param {string[]} documentIds
 * @returns {Promise<AxiosResponse>} — { jobId, status: 'PENDING' }
 */
export const enqueuePrintJob = (documentIds) =>
  api.post('/documents/bulk/print', { documentIds });

/**
 * Poll the status of a previously enqueued print job.
 * @param {string} jobId
 * @returns {Promise<AxiosResponse>} — { status, downloadUrl? }
 */
export const getPrintJobStatus = (jobId) =>
  api.get(`/documents/print-jobs/${jobId}`);

// ─── SHARE ────────────────────────────────────────────────────────────────────

/**
 * Create a time-limited share link for a document.
 * @param {string} id
 * @param {Object} opts - { expiresIn, maxAccess, allowDownload, password }
 */
export const createShareLink = (id, opts = {}) =>
  api.post(`/documents/${id}/share`, opts);

/**
 * List all active share links for a document.
 * @param {string} id
 */
export const listShareLinks = (id) =>
  api.get(`/documents/${id}/shares`);

/**
 * Revoke (delete) a specific share link.
 * @param {string} shareId - ShareLink _id
 */
export const revokeShareLink = (shareId) =>
  api.delete(`/documents/share/${shareId}`);

// ─── AUDIT ────────────────────────────────────────────────────────────────────

/**
 * Retrieve the audit trail for a specific document.
 * @param {string} id
 * @param {Object} [params] - { page, limit, action }
 */
export const getDocumentAudit = (id, params = {}) =>
  api.get(`/documents/${id}/audit`, { params });

/**
 * Retrieve the campus-wide audit trail (ADMIN / DIRECTOR only).
 * @param {Object} [params] - { page, limit, action, userId, from, to }
 */
export const getCampusAudit = (params = {}) =>
  api.get('/documents/audit/campus', { params });

// ─── VERSIONS ─────────────────────────────────────────────────────────────────

/**
 * List all stored versions of a document.
 * @param {string} id
 * @param {Object} [params] - { page, limit }
 */
export const listDocumentVersions = (id, params = {}) =>
  api.get(`/documents/${id}/versions`, { params });

/**
 * Retrieve a specific version snapshot by version number.
 * @param {string} id
 * @param {number} version
 */
export const getDocumentVersion = (id, version) =>
  api.get(`/documents/${id}/versions/${version}`);

/**
 * Restore a document to a previous version (creates a new version entry).
 * @param {string} id
 * @param {number} version
 * @param {string} [reason]
 */
export const restoreDocumentVersion = (id, version, reason = '') =>
  api.post(`/documents/${id}/versions/${version}/restore`, { reason });

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

/**
 * Create a reusable document template.
 * @param {Object} payload
 */
export const createTemplate = (payload) =>
  api.post('/documents/templates', payload);

/**
 * List all templates available to the current campus.
 * @param {Object} [params]
 */
export const listTemplates = (params = {}) =>
  api.get('/documents/templates', { params });

/**
 * Get a single template by _id.
 * @param {string} id
 */
export const getTemplateById = (id) =>
  api.get(`/documents/templates/${id}`);

/**
 * Update a template.
 * @param {string} id
 * @param {Object} payload
 */
export const updateTemplate = (id, payload) =>
  api.patch(`/documents/templates/${id}`, payload);

/**
 * Delete a template.
 * @param {string} id
 */
export const deleteTemplate = (id) =>
  api.delete(`/documents/templates/${id}`);

/**
 * Generate a document from a template, binding provided variables.
 * @param {string} id       - Template _id
 * @param {Object} variables - Key-value pairs matching template placeholders
 */
export const generateFromTemplate = (id, variables = {}) =>
  api.post(`/documents/templates/${id}/generate`, { variables });

/**
 * Preview a template with sample variable values (returns HTML string).
 * @param {string} id
 * @param {Object} [variables]
 */
export const previewTemplate = (id, variables = {}) =>
  api.post(`/documents/templates/${id}/preview`, { variables });

// ─── TYPED GENERATION ─────────────────────────────────────────────────────────

/**
 * Auto-generate a student ID card document.
 * @param {string} studentId
 */
export const generateStudentCard = (studentId) =>
  api.post(`/documents/generate/student-card/${studentId}`);

/**
 * Auto-generate a teacher payslip document.
 * @param {string} teacherId
 */
export const generateTeacherPayslip = (teacherId) =>
  api.post(`/documents/generate/teacher-payslip/${teacherId}`);

/**
 * Auto-generate a class enrollment list document.
 * @param {string} classId
 */
export const generateClassList = (classId) =>
  api.post(`/documents/generate/class-list/${classId}`);

// ─── PUBLIC (no auth required) ────────────────────────────────────────────────

/**
 * Access a document via a public share token (no authentication required).
 * Used for read-only shared document pages.
 * @param {string} token
 */
export const accessSharedDocument = (token) =>
  api.get(`/documents/share/${token}`);

/**
 * Verify a document by its public reference (QR code verification).
 * Returns metadata only — never exposes document content.
 * @param {string} ref - e.g. "DOC-2025-CAM-AB12CD34"
 */
export const verifyDocumentByRef = (ref) =>
  api.get(`/documents/verify/${ref}`);