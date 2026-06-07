import api from '../api/axiosInstance';

/**
 * Phase 2 portal content admin API (base: /api/portal-admin).
 *
 * Manages the content surfaced by the public portal:
 *   testimonials · faq · course previews · monthly competition.
 *
 * Access: ADMIN / DIRECTOR (all campuses) and CAMPUS_MANAGER (own campus).
 * Each list response is paginated: { data: [...], pagination: { total, page, limit } }.
 */

// ─── Generic content CRUD factory (testimonials, faq, course-previews) ─────────

const contentApi = (resource) => ({
  list:          (params)     => api.get(`/portal-admin/${resource}`, { params }),
  getOne:        (id)         => api.get(`/portal-admin/${resource}/${id}`),
  create:        (data)       => api.post(`/portal-admin/${resource}`, data),
  update:        (id, data)   => api.put(`/portal-admin/${resource}/${id}`, data),
  togglePublish: (id, data)   => api.patch(`/portal-admin/${resource}/${id}/publish`, data),
  remove:        (id)         => api.delete(`/portal-admin/${resource}/${id}`),
});

export const testimonialsApi  = contentApi('testimonials');
export const faqApi           = contentApi('faq');
export const coursePreviewsApi = contentApi('course-previews');

// ─── Competition (prize schedule + cron-driven winners) ────────────────────────

export const competitionApi = {
  list:         (params)   => api.get('/portal-admin/competition', { params }),
  getOne:       (id)       => api.get(`/portal-admin/competition/${id}`),
  create:       (data)     => api.post('/portal-admin/competition', data),
  update:       (id, data) => api.put(`/portal-admin/competition/${id}`, data),
  toggleActive: (id, data) => api.patch(`/portal-admin/competition/${id}/toggle-active`, data),
  close:        (id)       => api.post(`/portal-admin/competition/${id}/close`),
  remove:       (id)       => api.delete(`/portal-admin/competition/${id}`),
};
