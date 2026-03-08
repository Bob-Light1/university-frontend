/**
 * @file attendance.service.js
 * @description Axios service layer for student & teacher attendance endpoints.
 *
 * Aligned with backend routers:
 *   - /api/attendance/student  (studentAttendance.router.js)
 *   - /api/attendance/teacher  (teacherAttendance.router.js)
 */

import api from '../api/axiosInstance';

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ATTENDANCE — Session management (roles: TEACHER, CAMPUS_MANAGER, ADMIN, DIRECTOR)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /attendance/student/sessions/:scheduleId/init
 * Initialise the attendance sheet for all enrolled students of a session.
 * @param {string} scheduleId
 * @param {{ classId, attendanceDate, academicYear, semester, sessionStartTime?, sessionEndTime?, schoolCampus? }} data
 */
export const initStudentAttendance = (scheduleId, data) =>
  api.post(`/attendance/student/sessions/${scheduleId}/init`, data);

/**
 * GET /attendance/student/sessions/:scheduleId
 * Full roll-call sheet for a session.
 * @param {string} scheduleId
 * @param {{ date?: string, classId?: string }} params
 */
export const getSessionStudentAttendance = (scheduleId, params) =>
  api.get(`/attendance/student/sessions/${scheduleId}`, { params });

/**
 * PATCH /attendance/student/sessions/:scheduleId/submit
 * Lock all attendance records for a session (irreversible).
 * @param {string} scheduleId
 * @param {{ attendanceDate: string, classId?: string }} data
 */
export const submitStudentAttendance = (scheduleId, data) =>
  api.patch(`/attendance/student/sessions/${scheduleId}/submit`, data);

/**
 * PATCH /attendance/student/:attendanceId/toggle
 * Toggle a student's attendance status (present/absent).
 * @param {string} attendanceId
 * @param {{ status: boolean }} data
 */
export const toggleStudentAttendance = (attendanceId, data) =>
  api.patch(`/attendance/student/${attendanceId}/toggle`, data);

/**
 * PATCH /attendance/student/:attendanceId/justify
 * Add or update absence justification.
 * @param {string} attendanceId
 * @param {{ justification: string, justificationDocument?: string }} data
 */
export const justifyStudentAbsence = (attendanceId, data) =>
  api.patch(`/attendance/student/${attendanceId}/justify`, data);

/**
 * PATCH /attendance/student/lock-daily
 * Lock all student attendance records for a given date on the campus.
 * @param {{ date?: string }} data
 */
export const lockDailyStudentAttendance = (data = {}) =>
  api.patch('/attendance/student/lock-daily', data);

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ATTENDANCE — Analytics (roles: CAMPUS_MANAGER, ADMIN, DIRECTOR)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /attendance/student/campus/overview
 * Paginated list of all attendance records on the campus.
 * @param {{ from?, to?, classId?, status?, page?, limit? }} params
 */
export const getStudentAttendanceCampusOverview = (params) =>
  api.get('/attendance/student/campus/overview', { params });

/**
 * GET /attendance/student/class/:classId/stats
 * Aggregated attendance stats for a class.
 * @param {string} classId
 * @param {{ date?: string, period?: 'day'|'week'|'month'|'year' }} params
 */
export const getClassAttendanceStats = (classId, params) =>
  api.get(`/attendance/student/class/${classId}/stats`, { params });

/**
 * GET /attendance/student/:studentId/stats
 * Attendance stats for a specific student.
 * @param {string} studentId
 * @param {{ academicYear: string, semester: string, period?: string }} params
 */
export const getStudentAttendanceStats = (studentId, params) =>
  api.get(`/attendance/student/${studentId}/stats`, { params });

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ATTENDANCE — Self-service (role: STUDENT)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /attendance/student/me
 * Attendance history for the connected student.
 * @param {{ academicYear: string, semester: string, from?: string, to?: string }} params
 */
export const getMyStudentAttendance = (params) =>
  api.get('/attendance/student/me', { params });

/**
 * GET /attendance/student/me/stats
 * Attendance statistics for the connected student.
 * @param {{ academicYear: string, semester: string, period?: 'all'|'month'|'week' }} params
 */
export const getMyStudentAttendanceStats = (params) =>
  api.get('/attendance/student/me/stats', { params });

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER ATTENDANCE — Session management (roles: CAMPUS_MANAGER, ADMIN, DIRECTOR)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /attendance/teacher/sessions/:scheduleId/init
 * Create (upsert) a teacher attendance record for a session.
 * @param {string} scheduleId
 * @param {{ teacherId, classId, subjectId, attendanceDate, academicYear, semester,
 *           sessionStartTime?, sessionEndTime?, schoolCampus? }} data
 */
export const initTeacherAttendance = (scheduleId, data) =>
  api.post(`/attendance/teacher/sessions/${scheduleId}/init`, data);

/**
 * GET /attendance/teacher/sessions/:scheduleId
 * Attendance record(s) for a teacher session.
 * @param {string} scheduleId
 * @param {{ date?: string }} params
 */
export const getSessionTeacherAttendance = (scheduleId, params) =>
  api.get(`/attendance/teacher/sessions/${scheduleId}`, { params });

/**
 * PATCH /attendance/teacher/:attendanceId/toggle
 * Mark a teacher as present or absent.
 * @param {string} attendanceId
 * @param {{ status: boolean }} data
 */
export const toggleTeacherAttendance = (attendanceId, data) =>
  api.patch(`/attendance/teacher/${attendanceId}/toggle`, data);

/**
 * PATCH /attendance/teacher/:attendanceId/justify
 * Add a justification for a teacher absence.
 */
export const justifyTeacherAbsence = (attendanceId, data) =>
  api.patch(`/attendance/teacher/${attendanceId}/justify`, data);

/**
 * PATCH /attendance/teacher/:attendanceId/replacement
 * Assign a replacement teacher for a missed session.
 * @param {string} attendanceId
 * @param {{ replacementTeacherId: string, replacementNotes?: string }} data
 */
export const assignReplacementTeacher = (attendanceId, data) =>
  api.patch(`/attendance/teacher/${attendanceId}/replacement`, data);

/**
 * PATCH /attendance/teacher/:attendanceId/pay
 * Mark a session as paid.
 * @param {string} attendanceId
 * @param {{ paymentRef: string }} data
 */
export const markTeacherSessionPaid = (attendanceId, data) =>
  api.patch(`/attendance/teacher/${attendanceId}/pay`, data);

/**
 * PATCH /attendance/teacher/lock-daily
 * Lock all teacher attendance records for a given date on the campus.
 */
export const lockDailyTeacherAttendance = (data = {}) =>
  api.patch('/attendance/teacher/lock-daily', data);

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER ATTENDANCE — Analytics (roles: CAMPUS_MANAGER, ADMIN, DIRECTOR)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /attendance/teacher/campus/overview
 * Paginated overview of all teacher attendance records.
 * @param {{ from?, to?, teacherId?, status?, isPaid?, page?, limit? }} params
 */
export const getTeacherAttendanceCampusOverview = (params) =>
  api.get('/attendance/teacher/campus/overview', { params });

/**
 * GET /attendance/teacher/campus/stats
 * Aggregated stats (totals, rate) for teacher attendance on the campus.
 * @param {{ date?: string, period?: 'day'|'month'|'year' }} params
 */
export const getTeacherAttendanceCampusStats = (params) =>
  api.get('/attendance/teacher/campus/stats', { params });

/**
 * GET /attendance/teacher/campus/payroll
 * Payroll report: hours delivered per teacher.
 * @param {{ month: number, year: number, isPaid?: 'true'|'false' }} params
 */
export const getTeacherPayrollReport = (params) =>
  api.get('/attendance/teacher/campus/payroll', { params });

/**
 * GET /attendance/teacher/:teacherId/stats
 * Attendance stats for a specific teacher.
 * @param {string} teacherId
 * @param {{ academicYear: string, semester: string, period?: string }} params
 */
export const getTeacherAttendanceStats = (teacherId, params) =>
  api.get(`/attendance/teacher/${teacherId}/stats`, { params });

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER ATTENDANCE — Self-service (role: TEACHER)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /attendance/teacher/me
 * Attendance history for the connected teacher.
 * @param {{ academicYear: string, semester: string, from?: string, to?: string }} params
 */
export const getMyTeacherAttendance = (params) =>
  api.get('/attendance/teacher/me', { params });

/**
 * GET /attendance/teacher/me/stats
 * Attendance statistics for the connected teacher.
 * @param {{ academicYear: string, semester: string, period?: 'all'|'month'|'week' }} params
 */
export const getMyTeacherAttendanceStats = (params) =>
  api.get('/attendance/teacher/me/stats', { params });