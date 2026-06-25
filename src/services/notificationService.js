/**
 * @file notificationService.js
 * @description API client for the personal notification inbox and the admin
 * delivery log. Mirrors the backend module `/api/notifications`.
 *
 * Response shapes (shared response-helpers):
 *   GET    /notifications/my              → { data: [...], pagination: { total, page, limit, ... } }
 *   GET    /notifications/my/unread-count → { data: { count } }
 *   PATCH  /notifications/:id/read        → { success }
 *   PATCH  /notifications/my/read-all     → { data: { modified } }
 *   GET    /notifications                 → { data: [...], pagination } (ADMIN | DIRECTOR | CAMPUS_MANAGER)
 *   POST   /notifications/:id/retry       → { data: { status } }
 */

import api from '../api/axiosInstance';

// ─── Personal inbox (all authenticated roles) ─────────────────────────────────

export const getMyNotifications = (params) =>
  api.get('/notifications/my', { params });

export const getNotificationUnreadCount = () =>
  api.get('/notifications/my/unread-count');

export const markNotificationAsRead = (id) =>
  api.patch(`/notifications/${id}/read`);

export const markAllNotificationsAsRead = () =>
  api.patch('/notifications/my/read-all');

// ─── Admin delivery log (ADMIN | DIRECTOR | CAMPUS_MANAGER) ────────────────────

export const getNotificationLog = (params) =>
  api.get('/notifications', { params });

export const retryNotification = (id) =>
  api.post(`/notifications/${id}/retry`);
