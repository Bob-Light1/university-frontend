/**
 * @file admin_service.js
 * @description Axios service layer for Admin / Director platform endpoints.
 *
 * Endpoint groups:
 *   1. Admin self-service    — GET /api/admin/me, PATCH /api/admin/me/password
 *   2. Campus management     — GET|POST|PUT|DELETE /api/campus/*
 *   3. Admin account mgmt    — POST /api/admin/create, GET /api/admin/all,
 *                              PATCH /api/admin/:id/status
 */

import api from '../api/axiosInstance';

// ─── ADMIN SELF-SERVICE ───────────────────────────────────────────────────────

/**
 * GET /admin/me
 * Return the authenticated admin/director's own profile.
 */
export const getAdminMe = () =>
  api.get('/admin/me');

/**
 * PATCH /admin/me/password
 * @param {{ currentPassword: string, newPassword: string }} data
 */
export const updateAdminPassword = (data) =>
  api.patch('/admin/me/password', data);

export const updateAdminProfile        = (data) => api.patch('/admin/me/profile', data);
export const uploadAdminProfileImage   = (url)  => api.patch('/admin/me/profile-image', { profileImageUrl: url });
export const updateAdminNotifications  = (data) => api.patch('/admin/me/notifications', data);
export const getAdminUploadSignature   = ()     => api.get('/admin/me/upload-signature');

// ─── CAMPUS MANAGEMENT ────────────────────────────────────────────────────────

/**
 * GET /campus/all
 * Paginated list of all campuses platform-wide.
 * @param {{ page?, limit?, search?, status?, city? }} params
 */
export const getAllCampuses = (params = {}) =>
  api.get('/campus/all', { params });

/**
 * GET /campus/:id
 * Full campus detail.
 * @param {string} id
 */
export const getCampus = (id) =>
  api.get(`/campus/${id}`);

/**
 * PUT /campus/:id
 * Update campus information.
 * @param {string} id
 * @param {Object} data
 */
export const updateCampus = (id, data) =>
  api.put(`/campus/${id}`, data);

/**
 * DELETE /campus/:id
 * Archive a campus (ADMIN / DIRECTOR only).
 * @param {string} id
 */
export const archiveCampus = (id) =>
  api.delete(`/campus/${id}`);

/**
 * PATCH /campus/:id/restore
 * Restore an archived campus back to active status.
 * @param {string} id
 */
export const restoreCampus = (id) =>
  api.patch(`/campus/${id}/restore`);

/**
 * GET /campus/:id/dashboard
 * Dashboard KPIs for a specific campus.
 * @param {string} id
 */
export const getCampusStats = (id) =>
  api.get(`/campus/${id}/dashboard`);

// ─── ADMIN ACCOUNT MANAGEMENT ─────────────────────────────────────────────────

/**
 * POST /admin/create
 * Create a new Admin or Director account.
 * @param {{ admin_name: string, email: string, role: 'ADMIN'|'DIRECTOR', password: string }} data
 */
export const createAdminAccount = (data) =>
  api.post('/admin/create', data);

/**
 * GET /admin/all
 * Paginated list of all Admin / Director accounts (ADMIN only).
 * @param {{ role?, status?, search?, page?, limit? }} params
 */
export const listAdminAccounts = (params = {}) =>
  api.get('/admin/all', { params });

/**
 * PATCH /admin/:id/status
 * Change the status of an admin account (ADMIN only).
 * @param {string} id
 * @param {'active'|'inactive'|'suspended'} status
 */
export const updateAdminStatus = (id, status) =>
  api.patch(`/admin/${id}/status`, { status });

// ─── AI ENTITLEMENT (Phase 3 — §11.3) ─────────────────────────────────────────

/**
 * GET /admin/campuses/:id/ai-entitlement
 * Current per-campus AI entitlement + last audit entries (ADMIN | DIRECTOR).
 * data = { campusId, campusName, aiEntitlement, audit[] }.
 * @param {string} id - Campus ObjectId.
 */
export const getCampusAiEntitlement = (id) =>
  api.get(`/admin/campuses/${id}/ai-entitlement`);

/**
 * PUT /admin/campuses/:id/ai-entitlement
 * Activate / update the AI entitlement of a campus. Only the explicitly
 * provided fields are sent; a plan change without explicit budget/features
 * applies the backend D10 preset. data = { campusId, campusName, aiEntitlement }.
 * @param {string} id - Campus ObjectId.
 * @param {{ enabled?: boolean, plan?: string, llmProfile?: string,
 *   monthlyTokenBudget?: number, features?: Object }} data
 */
export const updateCampusAiEntitlement = (id, data) =>
  api.put(`/admin/campuses/${id}/ai-entitlement`, data);
