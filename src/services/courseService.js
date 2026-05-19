/**
 * @file course.service.js
 * @description API service layer for the global course catalog.
 *
 * All endpoints mirror the backend route matrix defined in course.router.js.
 * Courses are GLOBAL entities — no campusId is ever injected here.
 *
 * Role-based access is enforced server-side. This service is a thin HTTP
 * wrapper and never duplicates access-control logic.
 */

import api from '../api/axiosInstance';

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Paginated list of courses with optional filters.
 * @param {Object} params - Query params (page, limit, search, category, level,
 *                          approvalStatus, difficultyLevel, isLatestVersion, sort, …)
 */
export const listCourses = (params = {}) =>
  api.get('/courses', { params });

/**
 * Retrieve a single course by its MongoDB _id.
 * Non-global roles only see APPROVED courses (server enforced).
 * @param {string} id
 */
export const getCourseById = (id) =>
  api.get(`/courses/${id}`);

/**
 * Retrieve the latest version of a course by its courseCode.
 * @param {string} courseCode
 */
export const getCourseByCode = (courseCode) =>
  api.get(`/courses/code/${courseCode}`);

/**
 * Full version history chain for a course (ADMIN / DIRECTOR only).
 * @param {string} id - Any version _id of the target course
 * @param {Object} params - { page, limit }
 */
export const getCourseVersions = (id, params = {}) =>
  api.get(`/courses/${id}/versions`, { params });

// ─── WRITE ────────────────────────────────────────────────────────────────────

/**
 * Create a new course at version 1, status DRAFT.
 * ADMIN / DIRECTOR only.
 * @param {Object} payload
 */
export const createCourse = (payload) =>
  api.post('/courses', payload);

/**
 * Update a DRAFT or REJECTED course.
 * Guard: 409 if pedagogical fields are sent for an APPROVED course.
 * @param {string} id
 * @param {Object} payload
 */
export const updateCourse = (id, payload) =>
  api.put(`/courses/${id}`, payload);

/**
 * Soft-delete a course (ADMIN only).
 * Blocked if active Subject references exist.
 * @param {string} id
 */
export const deleteCourse = (id) =>
  api.delete(`/courses/${id}`);

/**
 * Restore a soft-deleted course (ADMIN only).
 * @param {string} id
 */
export const restoreCourse = (id) =>
  api.patch(`/courses/${id}/restore`);

// ─── WORKFLOW ─────────────────────────────────────────────────────────────────

/**
 * Transition DRAFT | REJECTED → PENDING_REVIEW.
 * @param {string} id
 * @param {string} [note] - Optional submission note
 */
export const submitCourseForReview = (id, note = '') =>
  api.patch(`/courses/${id}/submit`, { note });

/**
 * Transition PENDING_REVIEW → APPROVED.
 * @param {string} id
 * @param {string} [note]
 */
export const approveCourse = (id, note = '') =>
  api.patch(`/courses/${id}/approve`, { note });

/**
 * Transition PENDING_REVIEW → REJECTED.
 * @param {string} id
 * @param {string} note - Mandatory, min 10 chars
 */
export const rejectCourse = (id, note) =>
  api.patch(`/courses/${id}/reject`, { note });

/**
 * Clone an APPROVED course into a new DRAFT at version + 1 (atomic).
 * @param {string} id
 * @param {boolean} [copyResources=true]
 */
export const createNewVersion = (id, copyResources = true) =>
  api.post(`/courses/${id}/new-version`, { copyResources });

// ─── RESOURCES ────────────────────────────────────────────────────────────────

/**
 * Add a learning resource to a course.
 * ADMIN / DIRECTOR / CAMPUS_MANAGER.
 * @param {string} id         - Course _id
 * @param {Object} resource   - { title, type, url, mimeType?, fileSize?, isPublic? }
 */
export const addCourseResource = (id, resource) =>
  api.post(`/courses/${id}/resources`, resource);

/**
 * Remove a learning resource from a course.
 * ADMIN / DIRECTOR only.
 * @param {string} id         - Course _id
 * @param {string} resourceId - Resource subdoc _id
 */
export const removeCourseResource = (id, resourceId) =>
  api.delete(`/courses/${id}/resources/${resourceId}`);

// ─── SUBJECT LINKING ─────────────────────────────────────────────────────────

/**
 * Link an APPROVED course to a Subject.
 * Campus isolation enforced server-side for CAMPUS_MANAGER.
 * @param {string} subjectId
 * @param {string} courseId
 * @param {string} [classId] - Optional — triggers level compatibility check
 */
export const linkSubjectCourse = (subjectId, courseId, classId) =>
  api.patch(`/subject/${subjectId}/link-course`, { courseId, classId });

/**
 * Unlink the course reference from a Subject.
 * @param {string} subjectId
 */
export const unlinkSubjectCourse = (subjectId) =>
  api.delete(`/subject/${subjectId}/link-course`);