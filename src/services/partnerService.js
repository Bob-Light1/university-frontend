/**
 * @file partner_service.js
 * @description Axios service layer for Partner Management endpoints.
 *
 * Aligned with backend router: /api/partners (partner.router.js)
 *
 * Three groups of endpoints:
 *   1. Public (no auth)           — login, forgot/reset password, pre-register, resolveCode
 *   2. Partner self-service       — PARTNER role (portal: /me/*)
 *   3. Campus Manager CRUD        — ADMIN, DIRECTOR, CAMPUS_MANAGER
 */

import api from '../api/axiosInstance';

// ─── PUBLIC ───────────────────────────────────────────────────────────────────

/**
 * POST /partners/auth/login
 * @param {{ email: string, password: string }} credentials
 */
export const loginPartner = (credentials) =>
  api.post('/partners/auth/login', credentials);

/**
 * POST /partners/auth/forgot-password
 * @param {{ email: string }} data
 */
export const forgotPassword = (data) =>
  api.post('/partners/auth/forgot-password', data);

/**
 * POST /partners/auth/reset-password/:token
 * @param {string} token
 * @param {{ newPassword: string, confirmPassword: string }} data
 */
export const resetPassword = (token, data) =>
  api.post(`/partners/auth/reset-password/${token}`, data);

/**
 * POST /partners/public/pre-register
 * Public prospect pre-registration (honeypot anti-spam included in payload).
 * @param {{ firstName, lastName, email, phone, programInterest, partnerCode, website? }} data
 */
export const publicPreRegister = (data) =>
  api.post('/partners/public/pre-register', data);

/**
 * GET /partners/public/resolve/:code
 * Resolve a partnerCode → campus branding (no auth).
 * @param {string} code
 */
export const resolveCode = (code) =>
  api.get(`/partners/public/resolve/${code}`);

// ─── PARTNER SELF-SERVICE (PORTAL) ───────────────────────────────────────────

/**
 * GET /partners/me
 * Return the authenticated partner's own profile.
 */
export const getMe = () =>
  api.get('/partners/me');

/**
 * PUT /partners/me/profile
 * Update own profile (bio, phone, socialLinks, contacts, organization, gender).
 * @param {Object} data
 */
export const updateMyProfile = (data) =>
  api.put('/partners/me/profile', data);

/**
 * PUT /partners/me/password
 * Change own password.
 * @param {{ currentPassword: string, newPassword: string, confirmPassword: string }} data
 */
export const changeMyPassword = (data) =>
  api.put('/partners/me/password', data);

/**
 * POST /partners/me/profile-image
 * Store Cloudinary URL after direct upload.
 * @param {string} profileImageUrl
 */
export const uploadMyProfileImage = (profileImageUrl) =>
  api.post('/partners/me/profile-image', { profileImageUrl });

/**
 * GET /partners/me/dashboard
 * KPI dashboard for the authenticated partner.
 */
export const getMyDashboard = () =>
  api.get('/partners/me/dashboard');

/**
 * GET /partners/me/leads
 * Paginated leads attributed to the authenticated partner.
 * @param {{ status?, search?, from?, to?, page?, limit? }} params
 */
export const getMyLeads = (params = {}) =>
  api.get('/partners/me/leads', { params });

/**
 * GET /partners/me/commissions
 * Paginated commissions for the authenticated partner.
 * @param {{ status?, from?, to?, page?, limit? }} params
 */
export const getMyCommissions = (params = {}) =>
  api.get('/partners/me/commissions', { params });

/**
 * GET /partners/me/commissions/:id/receipt
 * Download PDF receipt for a specific commission.
 * @param {string} commissionId
 */
export const downloadMyReceipt = (commissionId) =>
  api.get(`/partners/me/commissions/${commissionId}/receipt`, { responseType: 'blob' });

/**
 * GET /partners/me/kit
 * Download the partner's affiliate kit.
 * @param {string} [type='qr'] - 'qr' | 'pdf' | 'message'
 */
export const downloadMyKit = (type = 'qr') =>
  api.get('/partners/me/kit', { params: { type }, responseType: 'blob' });

// ─── CAMPUS MANAGER — PARTNER CRUD ───────────────────────────────────────────

/**
 * POST /partners/auth/register
 * Create a new partner account (manager-initiated).
 * @param {Object} data - Partner fields including password
 */
export const registerPartner = (data) =>
  api.post('/partners/auth/register', data);

/**
 * GET /partners
 * Paginated list with optional filters.
 * @param {{ search?, status?, partnerType?, tier?, campusId?, page?, limit? }} params
 */
export const listPartners = (params = {}) =>
  api.get('/partners', { params });

/**
 * GET /partners/export
 * Download CSV export of all partners (campus-scoped).
 */
export const exportPartners = () =>
  api.get('/partners/export', { responseType: 'blob' });

/**
 * GET /partners/:id
 * Full partner detail with computed stats.
 * @param {string} id
 */
export const getPartner = (id) =>
  api.get(`/partners/${id}`);

/**
 * PUT /partners/:id
 * Update a partner's profile (manager-facing).
 * @param {string} id
 * @param {Object} data
 */
export const updatePartner = (id, data) =>
  api.put(`/partners/${id}`, data);

/**
 * PATCH /partners/:id/status
 * Toggle partner status (active ↔ inactive ↔ suspended).
 * @param {string} id
 * @param {'active'|'inactive'|'suspended'} status
 */
export const togglePartnerStatus = (id, status) =>
  api.patch(`/partners/${id}/status`, { status });

/**
 * DELETE /partners/:id
 * Soft-archive a partner (ADMIN only). Blocked if pending commissions exist.
 * @param {string} id
 */
export const archivePartner = (id) =>
  api.delete(`/partners/${id}`);

/**
 * POST /partners/:id/qr-code
 * Regenerate QR code for a partner.
 * @param {string} id
 */
export const regenerateQR = (id) =>
  api.post(`/partners/${id}/qr-code`);

/**
 * GET /partners/:id/kit
 * Download affiliate kit for a specific partner.
 * @param {string} id
 * @param {string} [type='qr'] - 'qr' | 'pdf' | 'message'
 */
export const downloadKit = (id, type = 'qr') =>
  api.get(`/partners/${id}/kit`, { params: { type }, responseType: 'blob' });

/**
 * GET /partners/:id/commission-summary
 * Aggregated commission statistics for a specific partner.
 * @param {string} id
 */
export const getCommissionSummary = (id) =>
  api.get(`/partners/${id}/commission-summary`);

/**
 * GET /partners/leads?partnerId=:id&limit=10
 * Fetch the last leads for a specific partner (manager view).
 * @param {string} partnerId
 * @param {number} [limit=10]
 */
export const getPartnerLeads = (partnerId, limit = 10) =>
  api.get('/partners/leads', { params: { partnerId, limit } });
