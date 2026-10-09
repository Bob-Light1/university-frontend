/** @file authService.js
 * @description Verified session lifecycle; role-specific login belongs to AuthContext.
 */
import api from '../api/axiosInstance';
import { endSession } from '../api/sessionClient';

/** Revoke the current session. */
export const logout = endSession;
/** Verify the current server-side session. */
export const getMe = () => api.get('/account/session');
/** Revoke every session belonging to the authenticated account. */
export const logoutAll = () => api.post('/account/session/logout-all');
