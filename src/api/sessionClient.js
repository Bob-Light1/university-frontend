/** @file sessionClient.js
 * @description Cookie-based session lifecycle shared by Axios, bootstrap and SSE.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/env';

// Mirrors modules/account/session.constants.js; pinned by the backend contract test.
export const AUTH_ERRORS = Object.freeze({ EXPIRED: 'AUTH_ACCESS_EXPIRED', INVALID: 'AUTH_SESSION_INVALID' });
const client = axios.create({ baseURL: API_BASE_URL, withCredentials: true, timeout: 15000,
  headers: { 'X-Requested-With': 'ERP' } });
let pendingRefresh;

/** Decode only for refresh scheduling; the backend verifies signature and session. */
export function tokenClaims(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); }
  catch { return null; }
}

/** Remove all cached identity, including authorization defaults through the event. */
export function clearSession() {
  for (const key of ['token', 'user', 'userType']) localStorage.removeItem(key);
  window.dispatchEvent(new Event('erp-session-cleared'));
}

/** Serialize cookie rotation across tabs where Web Locks is supported. */
const sessionLock = (run) => navigator.locks
  ? navigator.locks.request('erp-session', run) : run();

/** Return a current access token, coalescing requests and detecting identity changes. */
export async function getAccessToken(force = false) {
  const original = localStorage.getItem('token');
  const claims = tokenClaims(original);
  if (!claims?.sid) throw new Error('Session requires sign-in.');
  if (!force && claims.exp * 1000 > Date.now() + 30000) return original;
  if (!pendingRefresh) {
    pendingRefresh = sessionLock(async () => {
      const current = localStorage.getItem('token');
      if (tokenClaims(current)?.sid !== claims.sid) throw new Error('Session changed.');
      if (current !== original && tokenClaims(current).exp * 1000 > Date.now() + 30000) return current;
      const { data } = await client.post('/account/session/refresh', { sessionId: claims.sid });
      const token = data.data?.token;
      if (tokenClaims(token)?.sid !== claims.sid || tokenClaims(localStorage.getItem('token'))?.sid !== claims.sid) {
        throw new Error('Session changed.');
      }
      localStorage.setItem('token', token);
      return token;
    }).catch((error) => {
      // Never clear a newer identity because a previous session's request failed.
      if (tokenClaims(localStorage.getItem('token'))?.sid === claims.sid) clearSession();
      throw error;
    }).finally(() => { pendingRefresh = null; });
  }
  return pendingRefresh;
}

/** Revoke on the server before removing the browser identity. */
export async function endSession() {
  return sessionLock(async () => {
    const token = localStorage.getItem('token');
    const claims = tokenClaims(token);
    if (claims?.sid) {
      try { await client.post('/account/session/logout', { sessionId: claims.sid }); }
      catch {
        // The cookie can belong to another account after a login in a different tab.
        // A valid access token still authorizes revocation of this exact session.
        await client.post('/account/session/revoke', {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    }
    clearSession();
  });
}

/** Serialize login with refresh/logout so an older response cannot replace its cookie. */
export async function startSession(endpoint, credentials) {
  return sessionLock(async () => {
    const { data } = await client.post(endpoint, credentials);
    localStorage.setItem('token', data.data.token);
    return data;
  });
}
