/**
 * @file admin_service.js
 * @description Axios service layer for Admin / Director platform endpoints.
 *
 * Endpoint groups:
 *   1. Admin self-service    — GET /api/admin/me, PUT /api/admin/me/password
 *   2. Campus management     — GET|POST|PUT|DELETE /api/campus/*
 *   3. Admin account mgmt    — POST /api/admin/create
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
 * PUT /admin/me/password
 * @param {{ currentPassword: string, newPassword: string, confirmPassword: string }} data
 */
export const updateAdminPassword = (data) =>
  api.put('/admin/me/password', data);

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
 * GET /campus/:id/dashboard-stats
 * Dashboard KPIs for a specific campus.
 * @param {string} id
 */
export const getCampusStats = (id) =>
  api.get(`/campus/${id}/dashboard-stats`);

// ─── ADMIN ACCOUNT MANAGEMENT ─────────────────────────────────────────────────

/**
 * POST /admin/create
 * Create a new Admin or Director account.
 * @param {{ admin_name: string, email: string, role: 'ADMIN'|'DIRECTOR', password: string }} data
 */
export const createAdminAccount = (data) =>
  api.post('/admin/create', data);
