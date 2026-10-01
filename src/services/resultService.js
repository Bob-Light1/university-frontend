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
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const getResultById = (id, params = {}) =>
  api.get(`${BASE}/${id}`, { params });

/**
 * POST /results
 * Create a single result (DRAFT).
 * @param {Object} data - Full result payload
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const createResult = (data, params = {}) =>
  api.post(BASE, data, { params });

/**
 * PUT /results/:id
 * Update a DRAFT or SUBMITTED result.
 * @param {string} id
 * @param {Object} data - Partial update payload
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const updateResult = (id, data, params = {}) =>
  api.put(`${BASE}/${id}`, data, { params });

/**
 * DELETE /results/:id
 * Soft-delete. DRAFT only for non-admin roles.
 * @param {string} id
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const deleteResult = (id, params = {}) =>
  api.delete(`${BASE}/${id}`, { params });

// ─── BULK & IMPORT ────────────────────────────────────────────────────────────

/**
 * POST /results/bulk
 * Bulk create results for an entire class.
 * @param {{ classId, subjectId, teacherId, evaluationType, evaluationTitle,
 *           academicYear, semester, maxScore, results: Array, examDate?,
 *           examPeriod?, gradingScale? }} data
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const bulkCreateResults = (data, params = {}) =>
  api.post(`${BASE}/bulk`, data, { params });

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
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const submitResult = (id, params = {}) =>
  api.post(`${BASE}/${id}/submit`, {}, { params });

/**
 * POST /results/submit-batch
 * Submit all DRAFTs for an evaluation → SUBMITTED.
 * @param {{ classId, subjectId, evaluationTitle, academicYear, semester }} data
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const submitBatch = (data, params = {}) =>
  api.post(`${BASE}/submit-batch`, data, { params });

/**
 * PATCH /results/:id/publish
 * Publish a single SUBMITTED result → PUBLISHED.
 * @param {string} id
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const publishResult = (id, params = {}) =>
  api.patch(`${BASE}/${id}/publish`, {}, { params });

/**
 * PATCH /results/publish-batch
 * Publish all SUBMITTED results for an evaluation → PUBLISHED.
 * @param {{ classId, subjectId, evaluationTitle, academicYear, semester }} data
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const publishBatch = (data, params = {}) =>
  api.patch(`${BASE}/publish-batch`, data, { params });

/**
 * PATCH /results/:id/archive
 * Archive a PUBLISHED result → ARCHIVED.
 * @param {string} id
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const archiveResult = (id, params = {}) =>
  api.patch(`${BASE}/${id}/archive`, {}, { params });

/**
 * PATCH /results/lock-semester
 * Lock a semester within the effective campus and generate FinalTranscripts.
 * Global actors must supply params.campusId or data.schoolCampus.
 * @param {{ academicYear, semester, schoolCampus? }} data
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const lockSemester = (data, params = {}) =>
  api.patch(`${BASE}/lock-semester`, data, { params });

/**
 * PATCH /results/audit/:id
 * Post-publication correction — ADMIN/DIRECTOR only.
 * @param {string} id
 * @param {{ score?, teacherRemarks?, reason }} data
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const auditCorrection = (id, data, params = {}) =>
  api.patch(`${BASE}/audit/${id}`, data, { params });

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
 * @param {{ campusId?: string }} [params={}] Selected campus for global actors.
 */
export const listGradingScales = (params = {}) =>
  api.get(`${BASE}/grading-scales`, { params });

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