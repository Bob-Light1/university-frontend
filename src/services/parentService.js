/**
 * @file parent.service.js
 * @description Axios service layer for Parent Management endpoints.
 *
 * Aligned with backend router: /api/parents (parent.router.js)
 *
 * Two groups of endpoints:
 *   1. Admin/Manager CRUD  — used by ADMIN, DIRECTOR, CAMPUS_MANAGER
 *   2. Parent self-service — used by PARENT role (portal)
 */

import api from '../api/axiosInstance';

// ─── ADMIN / MANAGER CRUD ─────────────────────────────────────────────────────

/**
 * POST /parents
 * Create a new parent account.
 * @param {FormData} data - Multipart form data (fields + optional profileImage)
 */
export const createParent = (data) =>
  api.post('/parents', data);

/**
 * GET /parents
 * Paginated list with optional filters.
 * @param {{ campusId?, status?, search?, page?, limit? }} params
 */
export const getParents = (params = {}) =>
  api.get('/parents', { params });

/**
 * GET /parents/:id
 * Full parent detail (populated children + campus).
 * @param {string} id
 */
export const getParentById = (id) =>
  api.get(`/parents/${id}`);

/**
 * PUT /parents/:id
 * Update a parent's profile (admin-facing).
 * @param {string}   id
 * @param {FormData} data - Multipart form data (fields + optional profileImage)
 */
export const updateParent = (id, data) =>
  api.put(`/parents/${id}`, data);

/**
 * PATCH /parents/:id/status
 * Change a parent's account status.
 * @param {string} id
 * @param {'active'|'inactive'|'suspended'} status
 */
export const updateParentStatus = (id, status) =>
  api.patch(`/parents/${id}/status`, { status });

/**
 * PATCH /parents/:id/children
 * Replace the parent's children[] array.
 * @param {string}   id
 * @param {string[]} children - Array of student ObjectIds
 */
export const updateParentChildren = (id, children) =>
  api.patch(`/parents/${id}/children`, { children });

/**
 * PATCH /parents/:id/reset-password
 * Admin-initiated password reset — returns a temp password.
 * @param {string} id
 */
export const resetParentPassword = (id) =>
  api.patch(`/parents/${id}/reset-password`);

/**
 * DELETE /parents/:id
 * Soft-delete (all managers) or hard-delete (?hard=true, ADMIN only).
 * @param {string}  id
 * @param {boolean} hard - Pass true for permanent deletion
 */
export const deleteParent = (id, hard = false) =>
  api.delete(`/parents/${id}`, { params: hard ? { hard: 'true' } : {} });

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

/**
 * GET /parents/stats
 * Platform-wide parent stats (ADMIN/DIRECTOR see all, CM sees own campus).
 * @param {{ campusId? }} params
 */
export const getParentStats = (params = {}) =>
  api.get('/parents/stats', { params });

/**
 * GET /parents/stats/campus/:campusId
 * Detailed stats for a single campus.
 * @param {string} campusId
 */
export const getCampusParentStats = (campusId) =>
  api.get(`/parents/stats/campus/${campusId}`);

/**
 * GET /parents/by-student/:studentId
 * All parents linked to a specific student.
 * @param {string} studentId
 */
export const getParentsByStudent = (studentId) =>
  api.get(`/parents/by-student/${studentId}`);

// ─── PARENT SELF-SERVICE (PORTAL) ─────────────────────────────────────────────

/**
 * POST /parents/login
 * Authenticate a parent and return a JWT.
 * @param {{ email: string, password: string, campusId?: string }} credentials
 */
export const loginParent = (credentials) =>
  api.post('/parents/login', credentials);

/**
 * GET /parents/me
 * Return the authenticated parent's own profile.
 */
export const getMe = () =>
  api.get('/parents/me');

/**
 * PUT /parents/me/password
 * Change own password.
 * @param {{ currentPassword: string, newPassword: string }} data
 */
export const changeMyPassword = (data) =>
  api.put('/parents/me/password', data);

/**
 * PUT /parents/me/profile
 * Update own profile (phone, address, preferredLanguage, notificationPrefs).
 * @param {Object} data
 */
export const updateMyProfile = (data) =>
  api.put('/parents/me/profile', data);

/**
 * POST /parents/me/profile-image
 * Store Cloudinary URL after a direct upload.
 * @param {string} profileImageUrl
 */
export const uploadMyProfileImage = (profileImageUrl) =>
  api.post('/parents/me/profile-image', { profileImageUrl });

/**
 * GET /parents/me/dashboard
 * Dashboard overview for all linked children.
 */
export const getMyDashboard = () =>
  api.get('/parents/me/dashboard');

/**
 * GET /parents/me/children
 * Return the parent's linked children.
 */
export const getMyChildren = () =>
  api.get('/parents/me/children');

/**
 * GET /parents/me/children/:studentId/results
 * Published results for one child.
 * @param {string} studentId
 * @param {{ academicYear?, semester?, subject?, page?, limit? }} params
 */
export const getChildResults = (studentId, params = {}) =>
  api.get(`/parents/me/children/${studentId}/results`, { params });

/**
 * GET /parents/me/children/:studentId/transcripts
 * Final transcripts (VALIDATED or SEALED) for one child.
 * @param {string} studentId
 * @param {{ academicYear?, semester? }} params
 */
export const getChildTranscripts = (studentId, params = {}) =>
  api.get(`/parents/me/children/${studentId}/transcripts`, { params });

/**
 * POST /parents/me/children/:studentId/transcripts/:transcriptId/sign
 * Record digital acknowledgement of a transcript.
 * @param {string} studentId
 * @param {string} transcriptId
 */
export const signTranscript = (studentId, transcriptId) =>
  api.post(`/parents/me/children/${studentId}/transcripts/${transcriptId}/sign`);

/**
 * GET /parents/me/children/:studentId/schedule
 * Upcoming schedule sessions for one child.
 * @param {string} studentId
 * @param {{ days? }} params
 */
export const getChildSchedule = (studentId, params = {}) =>
  api.get(`/parents/me/children/${studentId}/schedule`, { params });

/**
 * GET /parents/me/children/:studentId/attendance
 * Attendance records for one child.
 * @param {string} studentId
 * @param {{ academicYear?, semester?, status?, page?, limit? }} params
 */
export const getChildAttendance = (studentId, params = {}) =>
  api.get(`/parents/me/children/${studentId}/attendance`, { params });

/**
 * GET /parents/me/children/:studentId/teachers
 * Teachers currently scheduled for one child's class.
 * @param {string} studentId
 */
export const getChildTeachers = (studentId) =>
  api.get(`/parents/me/children/${studentId}/teachers`);

/**
 * GET /parents/me/children/:studentId/comments
 * Pedagogical feedback (comments) from published results.
 * @param {string} studentId
 * @param {{ academicYear?, semester?, page?, limit? }} params
 */
export const getChildComments = (studentId, params = {}) =>
  api.get(`/parents/me/children/${studentId}/comments`, { params });
