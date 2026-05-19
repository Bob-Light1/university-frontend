/**
 * @file examination.service.js
 * @description Axios service layer for SEMS — Smart Examination Management System.
 *
 * Aligned with backend router: /api/examination (examination.router.js)
 *
 * Role coverage:
 *  CAMPUS_MANAGER / ADMIN / DIRECTOR → sessions, enrollments, grading, appeals, analytics, certificates
 *  TEACHER                           → questions, sessions (read), grading, appeals (read + resolve)
 *  STUDENT                           → sessions (read), delivery, appeals (submit)
 */

import api, { EXPORT_TIMEOUT } from '../api/axiosInstance';

const BASE = '/examination';

// ─── Question Bank ─────────────────────────────────────────────────────────────

export const listQuestions    = (params = {}) => api.get(`${BASE}/questions`, { params });
export const createQuestion   = (data)        => api.post(`${BASE}/questions`, data);
export const getQuestion      = (id)          => api.get(`${BASE}/questions/${id}`);
export const updateQuestion   = (id, data)    => api.patch(`${BASE}/questions/${id}`, data);
export const deleteQuestion   = (id)          => api.delete(`${BASE}/questions/${id}`);
export const importQuestions  = (data)        => api.post(`${BASE}/questions/import`, data);
export const getQuestionStats = (id)          => api.get(`${BASE}/questions/${id}/stats`);

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const listSessions    = (params = {}) => api.get(`${BASE}/sessions`, { params });
export const createSession   = (data)        => api.post(`${BASE}/sessions`, data);
export const getSession      = (id)          => api.get(`${BASE}/sessions/${id}`);
export const updateSession   = (id, data)    => api.patch(`${BASE}/sessions/${id}`, data);
export const deleteSession   = (id)          => api.delete(`${BASE}/sessions/${id}`);
export const submitSession   = (id)          => api.patch(`${BASE}/sessions/${id}/submit`);
export const approveSession  = (id)          => api.patch(`${BASE}/sessions/${id}/approve`);
export const publishSession  = (id)          => api.patch(`${BASE}/sessions/${id}/publish`);
export const startSession    = (id)          => api.patch(`${BASE}/sessions/${id}/start`);
export const completeSession = (id)          => api.patch(`${BASE}/sessions/${id}/complete`);
export const cancelSession   = (id, data)    => api.patch(`${BASE}/sessions/${id}/cancel`, data);
export const postponeSession = (id, data)    => api.patch(`${BASE}/sessions/${id}/postpone`, data);
export const getSessionHallTickets = (id)    => api.get(`${BASE}/sessions/${id}/hall-tickets`);

// ─── Enrollments ──────────────────────────────────────────────────────────────

export const computeEligibility = (sessionId)    => api.post(`${BASE}/enrollments/compute`, { sessionId });
export const checkIn            = (data)          => api.post(`${BASE}/enrollments/check-in`, data);
export const listEnrollments    = (params = {})   => api.get(`${BASE}/enrollments`, { params });
export const getEnrollment      = (id)            => api.get(`${BASE}/enrollments/${id}`);
export const getHallTicket      = (id)            => api.get(`${BASE}/enrollments/${id}/hall-ticket`);
export const updateEnrollment   = (id, data)      => api.patch(`${BASE}/enrollments/${id}`, data);
export const deleteEnrollment   = (id)            => api.delete(`${BASE}/enrollments/${id}`);

// ─── Delivery (student exam runtime) ──────────────────────────────────────────
// Flow: startAttempt(sessionId) → submissionId → getDeliveryQuestions/saveAnswer/submitExam

export const startAttempt         = (sessionId)          => api.post(`${BASE}/sessions/${sessionId}/start-attempt`);
export const getDeliveryQuestions = (submissionId)        => api.get(`${BASE}/delivery/${submissionId}/questions`);
export const saveAnswer           = (submissionId, data)  => api.patch(`${BASE}/delivery/${submissionId}/answers`, data);
export const submitExam           = (submissionId)        => api.post(`${BASE}/delivery/${submissionId}/submit`);
export const logAntiCheat         = (submissionId, data)  => api.post(`${BASE}/delivery/${submissionId}/anti-cheat`, data);
export const getSubmission        = (submissionId)         => api.get(`${BASE}/delivery/${submissionId}/submission`);

// ─── Grading ──────────────────────────────────────────────────────────────────

export const listGradings       = (params = {}) => api.get(`${BASE}/grading`, { params });
export const gradeSubmission    = (data)        => api.post(`${BASE}/grading`, data);
export const getGrading         = (id)          => api.get(`${BASE}/grading/${id}`);
export const updateGrading      = (id, data)    => api.patch(`${BASE}/grading/${id}`, data);
export const gradingQueue       = (sessionId, params = {}) => api.get(`${BASE}/grading/queue`, { params: { sessionId, ...params } });
export const publishGrades      = (sessionId)   => api.post(`${BASE}/grading/publish`, { sessionId });
export const assignSecondGrader = (id, data)    => api.patch(`${BASE}/grading/${id}/second-grader`, data);
export const submitSecondGrade  = (id, data)    => api.patch(`${BASE}/grading/${id}/second-grade`, data);
export const mediate            = (id, data)    => api.patch(`${BASE}/grading/${id}/mediate`, data);

// ─── Appeals ──────────────────────────────────────────────────────────────────

export const submitAppeal  = (data)        => api.post(`${BASE}/appeals`, data);
export const listAppeals   = (params = {}) => api.get(`${BASE}/appeals`, { params });
export const reviewAppeal  = (id)          => api.patch(`${BASE}/appeals/${id}/review`);
export const resolveAppeal = (id, data)    => api.patch(`${BASE}/appeals/${id}/resolve`, data);

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getCampusOverview  = (params = {}) => api.get(`${BASE}/analytics/campus-overview`, { params });
export const getEarlyWarning    = (params = {}) => api.get(`${BASE}/analytics/early-warning`, { params });
export const exportReport       = (params = {}) => api.get(`${BASE}/analytics/export`, { params, timeout: EXPORT_TIMEOUT });
export const getSessionSnapshot = (id)          => api.get(`${BASE}/analytics/sessions/${id}/snapshot`);
export const getItemAnalysis    = (id)          => api.get(`${BASE}/analytics/sessions/${id}/item-analysis`);

// ─── Certificates ─────────────────────────────────────────────────────────────

export const generateCertificate = (gradingId) => api.post(`${BASE}/certificates/generate/${gradingId}`);
export const verifyCertificate   = (token)     => api.get(`${BASE}/certificates/${token}/verify`);
