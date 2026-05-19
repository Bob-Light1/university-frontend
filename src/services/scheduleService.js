/**
 * @file schedule.service.js
 * @description Axios service layer for schedule endpoints.
 *
 * Aligned with backend routers:
 *   - /api/schedules/student  (studentSchedule.router.js)
 *   - /api/schedules/teacher  (teacherSchedule.router.js)
 */

import api from '../api/axiosInstance';

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT — Self-service (role: STUDENT)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /schedules/student/me — Personal calendar for the connected student. */
export const getMyStudentCalendar = (params) =>
  api.get('/schedules/student/me', { params });

/** GET /schedules/student/export/ics — ICS download (Google Cal / Apple / Outlook). */
export const exportStudentCalendarICS = (params) =>
  api.get('/schedules/student/export/ics', { params, responseType: 'blob' });

/** GET /schedules/student/:id — Details of a single published session. */
export const getStudentSessionById = (id) =>
  api.get(`/schedules/student/${id}`);

/** GET /schedules/student/:id/attendance — Attendance summary for a session. */
export const getStudentSessionAttendance = (id) =>
  api.get(`/schedules/student/${id}/attendance`);

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ADMIN — Session management (roles: ADMIN, DIRECTOR, CAMPUS_MANAGER)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /schedules/student/admin/overview — Paginated session overview. */
export const getScheduleOverview = (params) =>
  api.get('/schedules/student/admin/overview', { params });

/** GET /schedules/student/admin/room-occupancy — Room occupancy report. */
export const getRoomOccupancyReport = (params) =>
  api.get('/schedules/student/admin/room-occupancy', { params });

/** POST /schedules/student/admin/sessions — Create a new session (DRAFT). */
export const createSession = (data) =>
  api.post('/schedules/student/admin/sessions', data);

/** PUT /schedules/student/admin/sessions/:id — Update an existing session. */
export const updateSession = (id, data) =>
  api.put(`/schedules/student/admin/sessions/${id}`, data);

/** PATCH /schedules/student/admin/sessions/:id/publish — DRAFT → PUBLISHED. */
export const publishSession = (id) =>
  api.patch(`/schedules/student/admin/sessions/${id}/publish`);

/** PATCH /schedules/student/admin/sessions/:id/cancel — Cancel a session. */
export const cancelSession = (id, data = {}) =>
  api.patch(`/schedules/student/admin/sessions/${id}/cancel`, data);

/** DELETE /schedules/student/admin/sessions/:id — Soft-delete a session. */
export const softDeleteSession = (id) =>
  api.delete(`/schedules/student/admin/sessions/${id}`);

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER — Self-service (role: TEACHER)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /schedules/teacher/me — Connected teacher's calendar + weekly workload. */
export const getMyTeacherCalendar = (params) =>
  api.get('/schedules/teacher/me', { params });

/** GET /schedules/teacher/me/workload — Workload summary (WEEKLY or MONTHLY). */
export const getMyWorkloadSummary = (params) =>
  api.get('/schedules/teacher/me/workload', { params });

/** GET /schedules/teacher/availability — Connected teacher's availability slots. */
export const getMyAvailability = () =>
  api.get('/schedules/teacher/availability');

/** PUT /schedules/teacher/availability — Submit or replace availability (idempotent). */
export const upsertAvailability = (data) =>
  api.put('/schedules/teacher/availability', data);

/** GET /schedules/teacher/:id — Details of a single teacher session. */
export const getTeacherSessionById = (id) =>
  api.get(`/schedules/teacher/${id}`);

/** GET /schedules/teacher/:id/students — Student roster for roll-call interface. */
export const getStudentRoster = (id) =>
  api.get(`/schedules/teacher/${id}/students`);

/** PATCH /schedules/teacher/:id/rollcall/open — Open roll-call (max 30 min before start). */
export const openRollCall = (id) =>
  api.patch(`/schedules/teacher/${id}/rollcall/open`);

/** PATCH /schedules/teacher/:id/rollcall/submit — Lock attendance counts. */
export const submitRollCall = (id, data) =>
  api.patch(`/schedules/teacher/${id}/rollcall/submit`, data);

/** POST /schedules/teacher/:id/postpone — Teacher submits a postponement request. */
export const requestPostponement = (id, data) =>
  api.post(`/schedules/teacher/${id}/postpone`, data);

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER ADMIN — Management (roles: ADMIN, DIRECTOR, CAMPUS_MANAGER)
// ─────────────────────────────────────────────────────────────────────────────

/** GET /schedules/teacher/admin/workload — Aggregated workload report for payroll. */
export const getAllTeachersWorkload = (params) =>
  api.get('/schedules/teacher/admin/workload', { params });

/** GET /schedules/teacher/admin/:teacherId/sessions — All sessions for a teacher (admin view). */
export const getTeacherSessionsAdmin = (teacherId, params) =>
  api.get(`/schedules/teacher/admin/${teacherId}/sessions`, { params });

/** PATCH /schedules/teacher/admin/postpone/:requestId/review — Approve or reject a postponement. */
export const reviewPostponement = (requestId, data) =>
  api.patch(`/schedules/teacher/admin/postpone/${requestId}/review`, data);

/** GET /schedules/teacher/admin/postponements — List postponement requests for the campus. */
export const getAdminPostponements = (params) =>
  api.get('/schedules/teacher/admin/postponements', { params });