/**
 * @file commission_service.js
 * @description Axios service layer for Partner Commission Management endpoints.
 *
 * Aligned with backend router: /api/partners/commissions/* (partner.router.js)
 *
 * All routes require MGR_ROLES (ADMIN, DIRECTOR, CAMPUS_MANAGER) unless noted.
 * Commission config read/write: ADMIN + CAMPUS_MANAGER only.
 */

import api from '../api/axiosInstance';

/**
 * GET /partners/commissions
 * Paginated commission list (campus-scoped).
 * @param {{ status?, partner?, from?, to?, page?, limit? }} params
 */
export const listCommissions = (params = {}) =>
  api.get('/partners/commissions', { params });

/**
 * GET /partners/commissions/export
 * Download CSV export of commissions.
 * @param {{ status?, partner?, from?, to? }} params
 */
export const exportCommissions = (params = {}) =>
  api.get('/partners/commissions/export', { params, responseType: 'blob' });

/**
 * PATCH /partners/commissions/:id/validate
 * Validate a pending commission (moves pending → validated).
 * @param {string} id
 * @param {{ notes?: string }} data
 */
export const validateCommission = (id, data = {}) =>
  api.patch(`/partners/commissions/${id}/validate`, data);

/**
 * PATCH /partners/commissions/:id/pay
 * Mark a validated commission as paid (validated → paid).
 * @param {string} id
 * @param {{ paymentChannel: string, paymentRef?: string, notes?: string }} data
 */
export const markCommissionPaid = (id, data) =>
  api.patch(`/partners/commissions/${id}/pay`, data);

/**
 * PATCH /partners/commissions/:id/dispute
 * Flag a commission for manual review (→ disputed).
 * @param {string} id
 * @param {{ notes?: string }} data
 */
export const disputeCommission = (id, data = {}) =>
  api.patch(`/partners/commissions/${id}/dispute`, data);

/**
 * PATCH /partners/commissions/:id/cancel
 * Cancel a commission. Blocked if already paid.
 * @param {string} id
 * @param {{ cancellationReason: string }} data
 */
export const cancelCommission = (id, data) =>
  api.patch(`/partners/commissions/${id}/cancel`, data);

/**
 * GET /partners/commission-config
 * Read the campus commission configuration.
 */
export const getCommissionConfig = () =>
  api.get('/partners/commission-config');

/**
 * PUT /partners/commission-config
 * Update the campus commission configuration (ADMIN + CAMPUS_MANAGER only).
 * @param {{ ruleType: 'FIXED'|'PERCENTAGE', fixedAmount?: number, percentage?: number, currency?: string }} data
 */
export const updateCommissionConfig = (data) =>
  api.put('/partners/commission-config', data);
