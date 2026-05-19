/**
 * @file academic_print.service.js
 * @description Axios service layer for the Academic Print Module.
 *
 * Aligned with backend router: /api/print
 */

import api from '../api/axiosInstance';

// ─────────────────────────────────────────────────────────────────────────────
// PREVIEW (stream PDF into the browser)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /print/preview
 * Returns a PDF blob for in-browser preview.
 *
 * @param {{ type: string, studentId?: string, classId?: string, params?: object }} data
 * @returns {Promise<AxiosResponse<Blob>>}
 */
export const previewAcademicPdf = (data) =>
  api.post('/print/preview', data, { responseType: 'blob' });

// ─────────────────────────────────────────────────────────────────────────────
// JOB MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /print/jobs
 * List recent batch print jobs for the campus.
 * @param {{ page?: number, limit?: number }} params
 */
export const listPrintJobs = (params) =>
  api.get('/print/jobs', { params });

/**
 * POST /print/batch
 * Enqueue a batch generation job.
 *
 * @param {{
 *   type: 'STUDENT_CARD'|'TRANSCRIPT'|'ENROLLMENT'|'TIMETABLE',
 *   classId?: string,
 *   studentIds?: string[],
 *   params: { academicYear?: string, semester?: string, weekStart?: string }
 * }} data
 */
export const startBatchPrintJob = (data) =>
  api.post('/print/batch', data);

/**
 * GET /print/batch/:jobId
 * Get status and results of a batch job.
 * @param {string} jobId
 */
export const getBatchJobStatus = (jobId) =>
  api.get(`/print/batch/${jobId}`);

/**
 * GET /print/batch/:jobId/download/:fileName
 * Download a single result PDF from a batch job.
 * @param {string} jobId
 * @param {string} fileName
 */
export const downloadBatchResult = (jobId, fileName) =>
  api.get(`/print/batch/${jobId}/download/${encodeURIComponent(fileName)}`, { responseType: 'blob' });
