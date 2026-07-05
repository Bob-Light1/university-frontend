import api from "../api/axiosInstance";

// ─── TEACHER SELF-SERVICE (Phase 2 — Profile) ────────────────────────────────

export const getMyProfile              = ()     => api.get('/teachers/me');
export const updateMyProfile           = (data) => api.patch('/teachers/me/profile', data);
export const changeMyPassword          = (data) => api.patch('/teachers/me/password', data);
export const uploadMyProfileImage      = (url)  => api.patch('/teachers/me/profile-image', { profileImageUrl: url });
export const updateMyNotifications     = (data) => api.patch('/teachers/me/notifications', data);
export const getProfileUploadSignature = ()     => api.get('/teachers/me/upload-signature');

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

/**
 * GET /teachers/me/dashboard
 * Aggregated KPIs for the authenticated teacher's home screen.
 * Returns: profile, stats, todaySessions, upcomingSessions, pendingRollCalls.
 */
export const getTeacherDashboard = () =>
  api.get('/teachers/me/dashboard');

/** GET /teachers — Paginated list of teachers for the campus. */
export const getTeachers = (params) =>
  api.get('/teachers', { params });

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const createTeacher = (data) => api.post('/teachers', data);

export const updateTeacher = (id, data) => api.put(`/teachers/${id}`, data);

export const archiveTeacher = (id) => api.delete(`/teachers/${id}`);

export const restoreTeacher = (id) => api.patch(`/teachers/${id}/restore`);

export const deleteTeacherPermanently = (id) => api.delete(`/teachers/${id}/permanent`);

// ─── FORM DATA ────────────────────────────────────────────────────────────────

/**
 * Fetch all reference data required by the teacher create/edit form.
 * Requests run in parallel for performance.
 *
 * @param {string}     campusId - Campus ObjectId (enforced by campus isolation)
 * @param {AbortSignal} signal  - AbortController signal for cleanup on unmount
 * @returns {Promise<[campusRes, departmentsRes, subjectsRes, classesRes]>}
 */
export const getTeacherFormData = (campusId, signal) =>
  Promise.all([
    // Campus info (used to display the read-only campus field)
    api.get(`/campus/${campusId}`, { signal }),

    // Departments scoped to this campus
    api.get('/department', {
      params: { campusId },
      signal,
    }),

    // Subjects scoped to this campus — limit=200 so the subject picker is not
    // silently capped at the default page size (mirrors the class fetch below).
    api.get('/subject', {
      params: { campusId, limit: 200 },
      signal,
    }),

    // Classes scoped to this campus — used to assign classes to a teacher
    // and to elect them as classManager of a given class
    api.get('/class', {
      params: { campusId, limit: 200 },
      signal,
    }),
  ]);