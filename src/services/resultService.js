/**
 * @file result.service.js
 * @description Axios service layer for academic results endpoints.
 *
 * Aligned with backend router: /api/results (result.router.js)
 *
 * Role coverage:
 *  CAMPUS_MANAGER / ADMIN / DIRECTOR → full management + analytics + workflow
 *  TEACHER                           → CRUD on own results + submit + stats
 *  STUDENT                           → read-only own published results + transcript
 */

import api from '../api/axiosInstance';

const BASE = '/results';

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * GET /results
 * Paginated list with optional filters.
 * @param {{ classId?, subjectId?, teacherId?, studentId?, status?,
 *           evaluationType?, academicYear?, semester?, examPeriod?,
 *           campusId?, page?, limit? }} params
 */
export const getResults = (params = {}) =>
  api.get(BASE, { params });

/**
 * GET /results/:id
 * Full result detail with audit log.
 * @param {string} id
 */
export const getResultById = (id) =>
  api.get(`${BASE}/${id}`);

/**
 * POST /results
 * Create a single result (DRAFT).
 * @param {Object} data - Full result payload
 */
export const createResult = (data) =>
  api.post(BASE, data);

/**
 * PUT /results/:id
 * Update a DRAFT or SUBMITTED result.
 * @param {string} id
 * @param {Object} data - Partial update payload
 */
export const updateResult = (id, data) =>
  api.put(`${BASE}/${id}`, data);

/**
 * DELETE /results/:id
 * Soft-delete. DRAFT only for non-admin roles.
 * @param {string} id
 */
export const deleteResult = (id) =>
  api.delete(`${BASE}/${id}`);

// ─── BULK & IMPORT ────────────────────────────────────────────────────────────

/**
 * POST /results/bulk
 * Bulk create results for an entire class.
 * @param {{ classId, subjectId, teacherId, evaluationType, evaluationTitle,
 *           academicYear, semester, maxScore, results: Array, examDate?,
 *           examPeriod?, gradingScale? }} data
 */
export const bulkCreateResults = (data) =>
  api.post(`${BASE}/bulk`, data);

/**
 * POST /results/upload-csv
 * Import results via CSV file (multipart/form-data).
 * @param {FormData} formData - Includes file + context fields
 */
export const uploadResultsCSV = (formData) =>
  api.post(`${BASE}/upload-csv`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── WORKFLOW ─────────────────────────────────────────────────────────────────

/**
 * POST /results/:id/submit
 * Submit a single DRAFT result → SUBMITTED.
 * @param {string} id
 */
export const submitResult = (id) =>
  api.post(`${BASE}/${id}/submit`);

/**
 * POST /results/submit-batch
 * Submit all DRAFTs for an evaluation → SUBMITTED.
 * @param {{ classId, subjectId, evaluationTitle, academicYear, semester }} data
 */
export const submitBatch = (data) =>
  api.post(`${BASE}/submit-batch`, data);

/**
 * PATCH /results/:id/publish
 * Publish a single SUBMITTED result → PUBLISHED.
 * @param {string} id
 */
export const publishResult = (id) =>
  api.patch(`${BASE}/${id}/publish`);

/**
 * PATCH /results/publish-batch
 * Publish all SUBMITTED results for an evaluation → PUBLISHED.
 * @param {{ classId, subjectId, evaluationTitle, academicYear, semester }} data
 */
export const publishBatch = (data) =>
  api.patch(`${BASE}/publish-batch`, data);

/**
 * PATCH /results/:id/archive
 * Archive a PUBLISHED result → ARCHIVED.
 * @param {string} id
 */
export const archiveResult = (id) =>
  api.patch(`${BASE}/${id}/archive`);

/**
 * PATCH /results/lock-semester
 * Lock a semester: freeze all results + generate FinalTranscripts.
 * @param {{ academicYear, semester, schoolCampus? }} data
 */
export const lockSemester = (data) =>
  api.patch(`${BASE}/lock-semester`, data);

/**
 * PATCH /results/audit/:id
 * Post-publication correction — ADMIN/DIRECTOR only.
 * @param {string} id
 * @param {{ score?, teacherRemarks?, reason }} data
 */
export const auditCorrection = (id, data) =>
  api.patch(`${BASE}/audit/${id}`, data);

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

/**
 * GET /results/transcript/:studentId
 * Live transcript computed on-the-fly.
 * @param {string} studentId
 * @param {{ academicYear? }} params
 */
export const getTranscript = (studentId, params = {}) =>
  api.get(`${BASE}/transcript/${studentId}`, { params });

/**
 * GET /results/final-transcripts/:studentId
 * Stored final transcript generated at semester lock.
 * @param {string} studentId
 * @param {{ academicYear, semester }} params
 */
export const getFinalTranscript = (studentId, params) =>
  api.get(`${BASE}/final-transcripts/${studentId}`, { params });

/**
 * POST /results/final-transcripts/:id/validate
 * Validate a final transcript DRAFT → VALIDATED.
 * @param {string} id
 * @param {{ decision?, generalAppreciation? }} data
 */
export const validateTranscript = (id, data = {}) =>
  api.post(`${BASE}/final-transcripts/${id}/validate`, data);

/**
 * GET /results/statistics/:classId
 * Statistical distribution for a single evaluation.
 * @param {string} classId
 * @param {{ subjectId, evaluationTitle, academicYear, semester }} params
 */
export const getClassStatistics = (classId, params) =>
  api.get(`${BASE}/statistics/${classId}`, { params });

/**
 * GET /results/retake-list/:classId
 * Students eligible for retake, grouped by subject.
 * @param {string} classId
 * @param {{ subjectId?, academicYear, semester }} params
 */
export const getRetakeList = (classId, params) =>
  api.get(`${BASE}/retake-list/${classId}`, { params });

/**
 * GET /results/campus/overview
 * High-level analytics dashboard for the campus.
 * @param {{ academicYear?, semester?, campusId? }} params
 */
export const getCampusOverview = (params = {}) =>
  api.get(`${BASE}/campus/overview`, { params });

// ─── GRADING SCALES ───────────────────────────────────────────────────────────

/**
 * GET /results/grading-scales
 * List active grading scales for the campus.
 */
export const listGradingScales = () =>
  api.get(`${BASE}/grading-scales`);

/**
 * POST /results/grading-scales
 * Create a new grading scale.
 * @param {Object} data
 */
export const createGradingScale = (data) =>
  api.post(`${BASE}/grading-scales`, data);

/**
 * PATCH /results/grading-scales/:id
 * Update an existing grading scale.
 * @param {string} id
 * @param {Object} data
 */
export const updateGradingScale = (id, data) =>
  api.patch(`${BASE}/grading-scales/${id}`, data);