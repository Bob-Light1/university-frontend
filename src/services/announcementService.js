import api from '../api/axiosInstance';

// ─── USER INBOX ───────────────────────────────────────────────────────────────

export const getMyAnnouncements = (params) =>
  api.get('/announcements/my', { params });

export const getUnreadCount = () =>
  api.get('/announcements/my/unread-count');

export const markAsRead = (id) =>
  api.patch(`/announcements/${id}/read`);

export const markAllAsRead = () =>
  api.patch('/announcements/my/read-all');

// ─── ADMIN MANAGEMENT ─────────────────────────────────────────────────────────

export const getAllAnnouncements = (params) =>
  api.get('/announcements', { params });

export const getOneAnnouncement = (id) =>
  api.get(`/announcements/${id}`);

export const createAnnouncement = (data) =>
  api.post('/announcements', data);

export const updateAnnouncement = (id, data) =>
  api.put(`/announcements/${id}`, data);

export const publishAnnouncement = (id) =>
  api.patch(`/announcements/${id}/publish`);

export const archiveAnnouncement = (id) =>
  api.patch(`/announcements/${id}/archive`);

export const togglePin = (id, data = {}) =>
  api.patch(`/announcements/${id}/pin`, data);

export const deleteAnnouncement = (id) =>
  api.delete(`/announcements/${id}`);
