/** @file axiosInstance.js
 * @description Shared authenticated API transport and entitlement refusals.
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import { GATE_ERROR_CODES } from '../config/featureConstants';
import { emitFeatureRefusal } from './featureRefusal';
import { AUTH_ERRORS, getAccessToken, clearSession, tokenClaims } from './sessionClient';

/**
 * Default request timeout for regular API calls (10 s).
 * PDF/binary export endpoints use EXPORT_TIMEOUT instead,
 * because server-side PDF generation (Puppeteer / wkhtmltopdf) can take
 * several seconds even for cached documents.
 */
export const DEFAULT_TIMEOUT = 10_000;

/**
 * Extended timeout for PDF export and bulk binary download requests (90 s).
 * Covers: cold PDF generation, ZIP packaging, large imported-file streaming.
 */
export const EXPORT_TIMEOUT = 90_000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
});

// Allows manual injection/removal of the token (after login, logout, etc.)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

window.addEventListener('erp-session-cleared', () => setAuthToken(null));

// Always use the current storage identity; cached defaults must not outlive logout.
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('token');
  if (token && !config.skipAuth) config.headers.Authorization = `Bearer ${await getAccessToken()}`;
  else delete config.headers.Authorization;
  config.sessionId = tokenClaims(config.headers.Authorization?.slice(7))?.sid;
  return config;
});

// Response interceptor: handles refresh + queue
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    // A delayed response must never retry a mutation under a newer login.
    if (originalRequest.sessionId && originalRequest.sessionId !== tokenClaims(localStorage.getItem('token'))?.sid) {
      return Promise.reject(error);
    }

    const code = error.response?.data?.errors?.code;
    if (error.response?.status === 401 && code === AUTH_ERRORS.EXPIRED && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await getAccessToken(true);
        return api(originalRequest);
      } catch (refreshError) {
        window.location.assign('/login?session_expired=true');
        return Promise.reject(refreshError);
      }
    }
    if (error.response?.status === 401 && code === AUTH_ERRORS.INVALID) {
      clearSession();
      window.location.assign('/login?session_expired=true');
    }

    // Entitlement gate refusal → tell the provider before rejecting.
    //
    // A 403 carrying FEATURE_DISABLED / FEATURE_READ_ONLY is NOT a role
    // refusal: the module was switched off (or frozen) for this campus while
    // the page was open. The provider re-hydrates the flags and shows an
    // explicit message, so the navigation and the buttons catch up instead of
    // leaving the user in front of a screen that no longer exists (§8.3).
    //
    // The error is still rejected: the caller's own error handling runs as
    // usual, this only adds the platform-level reaction on top.
    if (error.response?.status === 403) {
      const code = error.response?.data?.errors?.code;
      if (GATE_ERROR_CODES.includes(code)) {
        emitFeatureRefusal({
          code,
          feature: error.response?.data?.errors?.feature ?? null,
          message: error.response?.data?.message ?? '',
        });
      }
    }

    // Other errors → let them pass
    return Promise.reject(error);
  }
);

export default api;