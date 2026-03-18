/**
 * @file student.service.js
 * @description Axios service layer for student CRUD endpoints.
 *
 * Aligned with backend router: /api/students (student.router.js)
 * Mirrors the structure of teacher.service.js for consistency.
 *
 * All multipart requests (create / update with profile image) pass FormData
 * directly — Axios sets the Content-Type boundary automatically.
 */

import api from '../api/axiosInstance';

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * POST /students
 * Create a new student.  Expects a FormData payload (multipart/form-data).
 * @param {FormData} formData
 */
export const createStudent = (formData) =>
  api.post('/students', formData);

/**
 * PUT /students/:id
 * Update an existing student.  Expects a FormData payload.
 * @param {string}   id
 * @param {FormData} formData
 */
export const updateStudent = (id, formData) =>
  api.put(`/students/${id}`, formData);

/**
 * GET /students
 * Paginated list with optional filters.
 * @param {{ campusId?, classId?, status?, search?, page?, limit? }} params
 */
export const getStudents = (params = {}) =>
  api.get('/students', { params });

/**
 * GET /students/:id
 * Full student detail (own profile or staff roles).
 * @param {string} id
 */
export const getStudentById = (id) =>
  api.get(`/students/${id}`);

/**
 * DELETE /students/:id
 * Soft-archive a student (sets status → 'archived').
 * @param {string} id
 */
export const archiveStudent = (id) =>
  api.delete(`/students/${id}`);

/**
 * PATCH /students/:id/restore
 * Restore a previously archived student.
 * @param {string} id
 */
export const restoreStudent = (id) =>
  api.patch(`/students/${id}/restore`);

/**
 * DELETE /students/:id/permanent
 * Permanently delete a student record (ADMIN only).
 * @param {string} id
 */
export const deleteStudentPermanently = (id) =>
  api.delete(`/students/${id}/permanent`);

// ─── BULK ─────────────────────────────────────────────────────────────────────

/**
 * POST /students/bulk/change-class
 * Move a set of students to a new class.
 * @param {{ studentIds: string[], newClassId: string }} data
 */
export const bulkChangeStudentClass = (data) =>
  api.post('/students/bulk/change-class', data);

/**
 * POST /students/bulk/archive
 * Archive multiple students at once.
 * @param {{ studentIds: string[] }} data
 */
export const bulkArchiveStudents = (data) =>
  api.post('/students/bulk/archive', data);

/**
 * POST /students/bulk/email
 * Send an email to multiple students.
 * @param {{ studentIds: string[], subject: string, message: string }} data
 */
export const bulkEmailStudents = (data) =>
  api.post('/students/bulk/email', data);

// ─── IMPORT / EXPORT ──────────────────────────────────────────────────────────

/**
 * GET /students/export/csv
 * Download student list as CSV.
 * @param {Object} params - Optional filters
 */
export const exportStudentsCSV = (params = {}) =>
  api.get('/students/export/csv', { params, responseType: 'blob' });

/**
 * GET /students/export/excel
 * Download student list as Excel.
 * @param {Object} params - Optional filters
 */
export const exportStudentsExcel = (params = {}) =>
  api.get('/students/export/excel', { params, responseType: 'blob' });

/**
 * POST /students/import
 * Import students from a CSV or Excel file.
 * @param {FormData} formData - Contains the file field
 */
export const importStudents = (formData) =>
  api.post('/students/import', formData);