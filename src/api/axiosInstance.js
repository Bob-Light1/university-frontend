import axios from 'axios';
import { API_BASE_URL } from '../config/env';

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

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Supports httpOnly cookies for refresh token (recommended)
  timeout: 15000,        // Avoids requests that hang for too long
});


let isRefreshing = false;
let failedQueue = [];

// Utility function to manage the queue
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

// Allows manual injection/removal of the token (after login, logout, etc.)
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Request interceptor: adds the token if present (fallback to localStorage)
api.interceptors.request.use(
  (config) => {
    // If the token is not already in the headers (e.g., after refresh)
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('token'); // or sessionStorage, or your store
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handles refresh + queue
api.interceptors.response.use(
  (response) => response,
  async (error) => {
   const originalRequest = error.config || {};

    // Case for 401 not already handled
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Already refreshing → we put it on hold
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // First 401 → we initiate the refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call to refresh (adapt the URL if different)
        const { data } = await refreshClient.post('/auth/refresh');
        const newAccessToken = data.accessToken;
        // Optional: data.refreshToken if your backend returns a new one

        setAuthToken(newAccessToken);
        localStorage.setItem('token', newAccessToken); // or your store

        // Resolves all pending requests with the new token
        processQueue(null, newAccessToken);

        // Restart the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed → forced logout
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true'; // Maybe with a parameter to show a message
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Other errors → let them pass
    return Promise.reject(error);
  }
);

export default api;