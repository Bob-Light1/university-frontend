import api from "../api/axiosInstance";

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

/**
 * GET /teachers/me/dashboard
 * Aggregated KPIs for the authenticated teacher's home screen.
 * Returns: profile, stats, todaySessions, upcomingSessions, pendingRollCalls.
 */
export const getTeacherDashboard = () =>
  api.get('/teachers/me/dashboard');

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const createTeacher = (data) => api.post('/teachers', data);

export const updateTeacher = (id, data) => api.put(`/teachers/${id}`, data);

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

    // Subjects scoped to this campus
    api.get('/subject', {
      params: { campusId },
      signal,
    }),

    // Classes scoped to this campus — used to assign classes to a teacher
    // and to elect them as classManager of a given class
    api.get('/class', {
      params: { campusId, limit: 200 },
      signal,
    }),
  ]);