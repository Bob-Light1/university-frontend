/**
 * @file mentorService.js
 * @description Axios service layer for the Mentor module.
 *
 * Aligned with backend router: /api/mentors (mentor.router.js)
 *
 * Sections:
 *  1. CM-facing  — Mentor CRUD       (/api/mentors)
 *  2. Self-service profile            (/me/*)
 *  3. Read-only scope                 (/me/dashboard, /me/students, /me/results, /me/attendance, /me/courses)
 */

import api from '../api/axiosInstance';

// ─── 1. MENTOR CRUD (Campus Manager) ─────────────────────────────────────────

export const getMentors              = (params)      => api.get('/mentors', { params });
export const createMentor            = (data)        => api.post('/mentors', data);
export const updateMentor            = (id, data)    => api.put(`/mentors/${id}`, data);
export const archiveMentor           = (id)          => api.delete(`/mentors/${id}`);
export const restoreMentor           = (id)          => api.patch(`/mentors/${id}/restore`);
export const deleteMentorPermanently = (id)          => api.delete(`/mentors/${id}/permanent`);
export const updateMentorStatus      = (id, status)  => api.patch(`/mentors/${id}/status`, { status });
export const getCMUploadSignature    = ()            => api.get('/mentors/upload-signature');

/**
 * Bulk-assign students to a mentor via class resolution.
 * @param {string} id      - Mentor _id
 * @param {{ classIds?: string[], studentIds?: string[], mode: 'add'|'remove'|'replace' }} payload
 */
export const assignStudents = (id, payload) =>
  api.patch(`/mentors/${id}/assign-students`, payload);

// ─── 2. SELF-SERVICE PROFILE ──────────────────────────────────────────────────

export const getMyProfile          = ()     => api.get('/mentors/me');
export const updateMyProfile       = (data) => api.patch('/mentors/me/profile', data);
export const changeMyPassword      = (data) => api.patch('/mentors/me/password', data);
export const uploadMyProfileImage  = (url)  => api.patch('/mentors/me/profile-image', { profileImageUrl: url });
export const updateMyNotifications = (data) => api.patch('/mentors/me/notifications', data);
export const getProfileUploadSignature = ()  => api.get('/mentors/me/upload-signature');

// ─── 3. READ-ONLY SCOPE ───────────────────────────────────────────────────────

/** Aggregated KPIs for the mentor dashboard. */
export const getMentorDashboard = () =>
  api.get('/mentors/me/dashboard');

/**
 * List the mentor's assigned students.
 * @param {Object} params  { search?, status?, classId?, page?, limit? }
 */
export const getMyStudents = (params = {}) =>
  api.get('/mentors/me/students', { params });

/**
 * Published results for the mentor's assigned students.
 * @param {Object} params  { studentId?, subjectId?, academicYear?, semester?, page?, limit? }
 */
export const getMyResults = (params = {}) =>
  api.get('/mentors/me/results', { params });

/**
 * Attendance records for the mentor's assigned classes / students.
 * @param {Object} params  { classId?, studentId?, status?, from?, to?, page?, limit? }
 */
export const getMyAttendance = (params = {}) =>
  api.get('/mentors/me/attendance', { params });

/**
 * Campus courses (published, read-only).
 * @param {Object} params  { search?, page?, limit? }
 */
export const getMyCourses = (params = {}) =>
  api.get('/mentors/me/courses', { params });
