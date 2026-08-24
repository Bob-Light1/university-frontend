/**
 * @file staffService.js
 * @description Axios service layer for Staff management.
 *
 * Sections:
 *  1. CM-facing  — Staff CRUD       (/api/staff)
 *  2. CM-facing  — StaffRole CRUD   (/api/staff-roles)
 *  3. Staff self-service portal      (/api/staff/me/*)
 */

import api from '../api/axiosInstance';

// ─── 1. STAFF CRUD (Campus Manager) ──────────────────────────────────────────

export const getStaff                 = (params)      => api.get('/staff', { params });
export const createStaff              = (data)        => api.post('/staff', data);
export const updateStaff              = (id, data)    => api.put(`/staff/${id}`, data);
export const archiveStaff             = (id)          => api.delete(`/staff/${id}`);
export const restoreStaff             = (id)          => api.patch(`/staff/${id}/restore`);
/**
 * Permanent deletion — compatibility alias for `DELETE /danger-zone/staff/:id`.
 *
 * Requires the full confirmation payload: the ticket returned by
 * `getDeletionImpact('staff', id)`, the exact phrase, the operator's password and a written
 * justification. Prefer `dangerZoneService.executeHardDelete()` for new code — it is the
 * canonical entry point and the one HardDeleteDialog uses.
 *
 * @param {string} id
 * @param {Object} confirmation - `{ ticket, confirmationPhrase, password, reason }`
 */
export const deleteStaffPermanently   = (id, confirmation) =>
  api.delete(`/staff/${id}/permanent`, { data: confirmation });
export const assignStaffRole          = (id, subRoleId) => api.patch(`/staff/${id}/assign-role`, { subRoleId });
export const updateStaffStatus        = (id, status)  => api.patch(`/staff/${id}/status`, { status });
// Secure reset: the backend re-issues an activation link/code (returned in the
// response) so the staff member sets their own password — no plaintext is sent.
export const resetStaffPassword       = (id)          => api.patch(`/staff/${id}/reset-password`);

export const getCMUploadSignature    = ()           => api.get('/staff/upload-signature');

// ─── 2. STAFF ROLES CRUD (Campus Manager) ────────────────────────────────────

export const getStaffRoles    = (params)      => api.get('/staff-roles', { params });
export const createStaffRole  = (data)        => api.post('/staff-roles', data);
export const updateStaffRole  = (id, data)    => api.put(`/staff-roles/${id}`, data);
export const toggleStaffRole  = (id)          => api.patch(`/staff-roles/${id}/toggle`);
export const getOneStaffRole  = (id)          => api.get(`/staff-roles/${id}`);

// Deleting a staff role is a PERMANENT deletion: `DELETE /staff-roles/:id` is a danger-zone
// alias that requires a ticket, the typed confirmation phrase, the operator's password and a
// reason. Go through `dangerZoneService` + `HardDeleteDialog` — a bare `api.delete()` here
// would only ever return 400.

// ─── 4. STAFF SELF-SERVICE PORTAL (/me/*) ────────────────────────────────────

export const getMyStaffProfile          = ()     => api.get('/staff/me');
export const updateMyStaffProfile       = (data) => api.patch('/staff/me/profile', data);
export const changeMyStaffPassword      = (data) => api.patch('/staff/me/password', data);
export const uploadMyStaffProfileImage  = (url)  => api.patch('/staff/me/profile-image', { profileImageUrl: url });
export const updateMyStaffNotifications = (data) => api.patch('/staff/me/notifications', data);
export const getStaffUploadSignature    = ()     => api.get('/staff/me/upload-signature');

export const getStaffDashboard    = ()       => api.get('/staff/me/dashboard');
export const getStaffStudents     = (params) => api.get('/staff/me/students',     { params });
export const getStaffAttendance   = (params) => api.get('/staff/me/attendance',   { params });
export const getStaffResults      = (params) => api.get('/staff/me/results',      { params });
export const getStaffCourses      = (params) => api.get('/staff/me/courses',      { params });
export const getStaffTeachers     = (params) => api.get('/staff/me/teachers',     { params });
export const getStaffSchedule     = (params) => api.get('/staff/me/schedule',     { params });
export const getStaffDocuments    = (params) => api.get('/staff/me/documents',    { params });
export const getStaffExaminations = (params) => api.get('/staff/me/examinations', { params });
