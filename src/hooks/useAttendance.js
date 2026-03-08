/**
 * @file useAttendance.js
 * @description Shared data hook for attendance management.
 *
 * Modes:
 *  'manager-student'  → campus overview for student attendance (CAMPUS_MANAGER/ADMIN/DIRECTOR)
 *  'manager-teacher'  → campus overview for teacher attendance (CAMPUS_MANAGER/ADMIN/DIRECTOR)
 *  'teacher-rollcall' → roll-call sheet for a specific session (TEACHER/CAMPUS_MANAGER)
 *  'student-self'     → self-service for connected student
 *  'teacher-self'     → self-service for connected teacher
 *
 * @param {'manager-student'|'manager-teacher'|'teacher-rollcall'|'student-self'|'teacher-self'} mode
 * @param {Object} contextParams — scheduleId (rollcall), academicYear, semester, etc.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getStudentAttendanceCampusOverview,
  getTeacherAttendanceCampusOverview,
  getSessionStudentAttendance,
  getMyStudentAttendance,
  getMyStudentAttendanceStats,
  getMyTeacherAttendance,
  getMyTeacherAttendanceStats,
  toggleStudentAttendance,
  toggleTeacherAttendance,
  justifyStudentAbsence,
  justifyTeacherAbsence,
  submitStudentAttendance,
  lockDailyStudentAttendance,
  lockDailyTeacherAttendance,
  initStudentAttendance,
  assignReplacementTeacher,
  markTeacherSessionPaid,
} from '../services/attendance.service';

// ─── Default filter state per mode ───────────────────────────────────────────

const DEFAULT_FILTERS = {
  from:       '',
  to:         '',
  status:     '',
  classId:    '',
  teacherId:  '',
  isPaid:     '',
  page:       1,
  limit:      50,
};

const DEFAULT_SELF_PARAMS = {
  academicYear: '',
  semester:     '',
  from:         '',
  to:           '',
  period:       'all',
};

// ─── Fetch function map ───────────────────────────────────────────────────────

const FETCH_MAP = {
  'manager-student':  getStudentAttendanceCampusOverview,
  'manager-teacher':  getTeacherAttendanceCampusOverview,
  'student-self':     getMyStudentAttendance,
  'teacher-self':     getMyTeacherAttendance,
};

// ─── Response normaliser ──────────────────────────────────────────────────────

const normalise = (raw) => {
  if (Array.isArray(raw))         return raw;
  if (Array.isArray(raw?.data))   return raw.data;
  if (Array.isArray(raw?.records))return raw.records;
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────

const useAttendance = (mode = 'manager-student', contextParams = {}) => {
  const isSelf     = mode === 'student-self' || mode === 'teacher-self';
  const isRollCall = mode === 'teacher-rollcall';

  const [records,    setRecords]    = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [filters,    setFilters]    = useState(isSelf ? DEFAULT_SELF_PARAMS : DEFAULT_FILTERS);

  // Stable ref avoids stale closures on contextParams from parent
  const ctxRef = useRef(contextParams);
  useEffect(() => { ctxRef.current = contextParams; }, [contextParams]);

  // ─── Fetch list / roll-call ─────────────────────────────────────────────────

  const fetch = useCallback(async () => {
    if (isSelf && (!filters.academicYear || !filters.semester)) return;
    if (isRollCall && !ctxRef.current.scheduleId) return;

    setLoading(true);
    setError(null);

    try {
      let res;

      if (isRollCall) {
        res = await getSessionStudentAttendance(ctxRef.current.scheduleId, {
          date:    ctxRef.current.date,
          classId: ctxRef.current.classId,
        });
      } else {
        const fetchFn = FETCH_MAP[mode];
        const params  = { ...filters, ...ctxRef.current };

        // Remove empty strings to keep query clean
        Object.keys(params).forEach((k) => {
          if (params[k] === '' || params[k] === null || params[k] === undefined) delete params[k];
        });

        res = await fetchFn(params);
      }

      const raw = res.data;
      setRecords(normalise(raw));

      if (raw?.pagination) {
        setPagination((p) => ({ ...p, ...raw.pagination }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load attendance data.');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters, mode, isRollCall, isSelf]);

  useEffect(() => { fetch(); }, [fetch]);

  // ─── Filter helpers ─────────────────────────────────────────────────────────

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (!isSelf) setPagination((prev) => ({ ...prev, page: 1 }));
  }, [isSelf]);

  const handleReset = useCallback(() => {
    setFilters(isSelf ? DEFAULT_SELF_PARAMS : DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [isSelf]);

  // ─── Mutations — Student attendance ────────────────────────────────────────

  const toggleStudent = useCallback(async (attendanceId, status) => {
    await toggleStudentAttendance(attendanceId, { status });
    fetch();
  }, [fetch]);

  const justifyStudent = useCallback(async (attendanceId, payload) => {
    await justifyStudentAbsence(attendanceId, payload);
    fetch();
  }, [fetch]);

  const submitSession = useCallback(async (scheduleId, attendanceDate, classId) => {
    await submitStudentAttendance(scheduleId, { attendanceDate, classId });
    fetch();
  }, [fetch]);

  const initSession = useCallback(async (scheduleId, payload) => {
    await initStudentAttendance(scheduleId, payload);
    fetch();
  }, [fetch]);

  const lockDailyStudents = useCallback(async (date) => {
    await lockDailyStudentAttendance({ date });
    fetch();
  }, [fetch]);

  // ─── Mutations — Teacher attendance ────────────────────────────────────────

  const toggleTeacher = useCallback(async (attendanceId, status) => {
    await toggleTeacherAttendance(attendanceId, { status });
    fetch();
  }, [fetch]);

  const justifyTeacher = useCallback(async (attendanceId, payload) => {
    await justifyTeacherAbsence(attendanceId, payload);
    fetch();
  }, [fetch]);

  const assignReplacement = useCallback(async (attendanceId, payload) => {
    await assignReplacementTeacher(attendanceId, payload);
    fetch();
  }, [fetch]);

  const markPaid = useCallback(async (attendanceId, paymentRef) => {
    await markTeacherSessionPaid(attendanceId, { paymentRef });
    fetch();
  }, [fetch]);

  const lockDailyTeachers = useCallback(async (date) => {
    await lockDailyTeacherAttendance({ date });
    fetch();
  }, [fetch]);

  // ─── Computed summary stats ─────────────────────────────────────────────────

  const summary = useMemo(() => {
    const total     = records.length;
    const present   = records.filter((r) => r.status === true).length;
    const absent    = records.filter((r) => r.status === false).length;
    const justified = records.filter((r) => r.isJustified).length;
    const locked    = records.filter((r) => r.isLocked).length;
    const rate      = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, justified, locked, rate };
  }, [records]);

  return {
    // Data
    records,
    stats,
    summary,
    loading,
    error,
    pagination,
    filters,

    // Refresh
    fetch,

    // Filter actions
    handleFilterChange,
    handleReset,
    setPage: (page) => setPagination((p) => ({ ...p, page })),

    // Student mutations
    toggleStudent,
    justifyStudent,
    submitSession,
    initSession,
    lockDailyStudents,

    // Teacher mutations
    toggleTeacher,
    justifyTeacher,
    assignReplacement,
    markPaid,
    lockDailyTeachers,
  };
};

export default useAttendance;