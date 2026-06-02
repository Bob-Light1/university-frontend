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
export const deleteStaffPermanently   = (id)          => api.delete(`/staff/${id}/permanent`);
export const assignStaffRole          = (id, subRoleId) => api.patch(`/staff/${id}/assign-role`, { subRoleId });
export const updateStaffStatus        = (id, status)  => api.patch(`/staff/${id}/status`, { status });
export const resetStaffPassword       = (id, newPassword) => api.patch(`/staff/${id}/reset-password`, { newPassword });

// ─── 2. STAFF ROLES CRUD (Campus Manager) ────────────────────────────────────

export const getStaffRoles    = (params)      => api.get('/staff-roles', { params });
export const createStaffRole  = (data)        => api.post('/staff-roles', data);
export const updateStaffRole  = (id, data)    => api.put(`/staff-roles/${id}`, data);
export const toggleStaffRole  = (id)          => api.patch(`/staff-roles/${id}/toggle`);
export const deleteStaffRole  = (id)          => api.delete(`/staff-roles/${id}`);
export const getOneStaffRole  = (id)          => api.get(`/staff-roles/${id}`);

// ─── 4. STAFF SELF-SERVICE PORTAL (/me/*) ────────────────────────────────────

export const getMyStaffProfile          = ()     => api.get('/staff/me');
export const updateMyStaffProfile       = (data) => api.patch('/staff/me/profile', data);
export const changeMyStaffPassword      = (data) => api.patch('/staff/me/password', data);
export const uploadMyStaffProfileImage  = (url)  => api.patch('/staff/me/profile-image', { profileImageUrl: url });
export const updateMyStaffNotifications = (data) => api.patch('/staff/me/notifications', data);
export const getStaffUploadSignature    = ()     => api.get('/staff/me/upload-signature');

export const getStaffDashboard  = ()         => api.get('/staff/me/dashboard');
export const getStaffStudents   = (params)   => api.get('/staff/me/students',   { params });
export const getStaffAttendance = (params)   => api.get('/staff/me/attendance', { params });
export const getStaffResults    = (params)   => api.get('/staff/me/results',    { params });
export const getStaffCourses    = (params)   => api.get('/staff/me/courses',    { params });
