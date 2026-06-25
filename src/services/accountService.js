import api from '../api/axiosInstance';

/**
 * @file accountService.js
 * @description API client for the account-activation flow (modules/account).
 */

/** Validate a link token before rendering the password form. */
export const inspectActivationToken = (token) =>
  api.get(`/account/activate/${token}`);

/**
 * Activate an account by setting the user-chosen password.
 * @param {Object} payload { token, password } | { identifier, code, password }
 */
export const activateAccount = (payload) =>
  api.post('/account/activate', payload);

/**
 * Re-issue an activation token for a still-pending account (admin).
 * @param {string} model One of: mentors | staff | students | teachers | parents
 * @param {string} id    Account _id
 */
export const resendActivation = (model, id) =>
  api.post(`/account/${model}/${id}/resend`);
