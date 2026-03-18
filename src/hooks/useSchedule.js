/**
 * @file useSchedule.js
 * @description Shared data hook for schedule management.
 *
 * Modes:
 *  'admin'   → GET /schedules/student/admin/overview (paginated, all roles)
 *  'teacher' → GET /schedules/teacher/me (date-range, teacher self-service)
 *
 * @param {'admin' | 'teacher'} mode
 * @param {Object} internalParams — campusId, teacherId, classId... (API-only, never in UI)
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  getScheduleOverview,
  getMyTeacherCalendar,
  softDeleteSession,
  cancelSession,
  publishSession,
} from '../services/schedule.service';

const DEFAULT_FILTERS = {
  search: '', status: '', semester: '',
  sessionType: '', dateFrom: '', dateTo: '',
};

const DEFAULT_PAGINATION = { page: 1, limit: 20, total: 0 };

/** Formats a Date to YYYY-MM-DD (ISO date string, no time). */
const toISODate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * Returns the start of today as an ISO date string (YYYY-MM-DD).
 * Used as the default `from` parameter for the admin overview so sessions
 * from today onwards are always shown regardless of the backend default.
 */
const todayISO = () => toISODate(new Date());

/**
 * Returns a date 90 days from today as an ISO date string.
 * Covers a full academic term so newly-created future sessions are visible.
 */
const in90DaysISO = () => toISODate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

/**
 * Returns a date 30 days in the past as an ISO date string.
 * Used as the teacher calendar default `from` so recently-past sessions
 * (e.g. last month's classes) remain visible without manual filter input.
 */
const minus30DaysISO = () => toISODate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

const normaliseSessionsResponse = (raw) => {
  if (Array.isArray(raw))            return raw;
  if (Array.isArray(raw?.data))      return raw.data;
  if (Array.isArray(raw?.sessions))  return raw.sessions;
  if (Array.isArray(raw?.schedules)) return raw.schedules;
  return [];
};

const useSchedule = (mode = 'admin', internalParams = {}) => {
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);

  // Stable ref prevents spurious re-fetches on parent re-renders with inline objects
  const internalRef = useRef(internalParams);
  useEffect(() => { internalRef.current = internalParams; }, [internalParams]);

  const fetchFn = mode === 'teacher' ? getMyTeacherCalendar : getScheduleOverview;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...internalRef.current,
        ...filters,
        page:  pagination.page,
        limit: pagination.limit,
      };

      // Teacher calendar uses 'from'/'to' instead of 'dateFrom'/'dateTo', and has no pagination.
      // Inject a wide default window (-30d → +90d) so ALL published sessions are visible
      // without the teacher needing to manually adjust filters.
      // The backend's own default is only the current week (7 days), which is far too narrow.
      if (mode === 'teacher') {
        if (!params.dateFrom) params.dateFrom = minus30DaysISO();
        if (!params.dateTo)   params.dateTo   = in90DaysISO();
        if (params.dateFrom) { params.from = params.dateFrom; delete params.dateFrom; }
        if (params.dateTo)   { params.to   = params.dateTo;   delete params.dateTo; }
        delete params.page;
        delete params.limit;
      }

      // Admin overview: inject a wide default window when no date range is set by the user.
      // This ensures sessions created for future dates (weeks or months ahead) are always
      // visible immediately after creation without requiring the user to adjust the filter.
      if (mode === 'admin') {
        if (!params.dateFrom) params.dateFrom = todayISO();
        if (!params.dateTo)   params.dateTo   = in90DaysISO();
        // Remap to the query params expected by getCampusOverview
        if (params.dateFrom) { params.from = params.dateFrom; delete params.dateFrom; }
        if (params.dateTo)   { params.to   = params.dateTo;   delete params.dateTo; }
      }

      const res = await fetchFn(params);
      const raw = res.data;
      setSessions(normaliseSessionsResponse(raw).filter(Boolean));

      if (mode === 'admin' && raw?.pagination) {
        setPagination((p) => ({ ...p, ...raw.pagination }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedule.');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, fetchFn, mode]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  /** Soft-delete (admin only) — DELETE /schedules/student/admin/sessions/:id */
  const handleDelete = useCallback(async (id) => {
    await softDeleteSession(id);
    fetch();
  }, [fetch]);

  /**
   * Status transition — maps UI action to the correct discrete backend endpoint.
   * 'publish' → PATCH …/publish
   * 'cancel'  → PATCH …/cancel  + optional { reason }
   */
  const handleStatusUpdate = useCallback(async (id, action, payload = {}) => {
    if (action === 'publish')      await publishSession(id);
    else if (action === 'cancel')  await cancelSession(id, payload);
    else throw new Error(`Unknown schedule action: "${action}". Use 'publish' or 'cancel'.`);
    fetch();
  }, [fetch]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total:    sessions.length,
      upcoming: sessions.filter((s) => new Date(s.startTime) > now).length,
      live:     sessions.filter((s) => new Date(s.startTime) <= now && new Date(s.endTime) >= now).length,
      past:     sessions.filter((s) => new Date(s.endTime) < now).length,
    };
  }, [sessions]);

  return {
    sessions, loading, error, pagination, filters, stats,
    fetch, handleFilterChange, handleReset, handleDelete, handleStatusUpdate,
    setPage: (page) => setPagination((p) => ({ ...p, page })),
  };
};

export default useSchedule;