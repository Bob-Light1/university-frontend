/**
 * @file useCourse.js
 * @description Data and action hook for the course module.
 *
 * Consumed by: CourseManager, CourseTeacher, CourseStudent.
 * Mirrors the pattern of useResult.js / useAttendance.js.
 *
 * Usage:
 *   const course = useCourse('manager');  // 'manager' | 'teacher' | 'student'
 */

import { useState, useCallback, useRef } from 'react';

import {
  listCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  restoreCourse,
  submitCourseForReview,
  approveCourse,
  rejectCourse,
  createNewVersion,
  addCourseResource,
  removeCourseResource,
} from '../services/course.service';

// ─── Default filter state ─────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  search:          '',
  category:        '',
  level:           '',
  approvalStatus:  '',
  difficultyLevel: '',
  language:        '',
  tag:             '',
  visibility:      '',
  sort:            'createdAt_desc',
  page:            1,
  limit:           25,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {'manager'|'teacher'|'student'} mode - Controls default filter presets
 */
const useCourse = (mode = 'manager') => {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [courses,    setCourses]    = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  // ── Filter / pagination state ──────────────────────────────────────────────
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    // Non-manager roles see APPROVED only (server also enforces this)
    approvalStatus: mode === 'manager' ? '' : 'APPROVED',
  }));

  // ── Abort controller ref — cancels stale in-flight requests ───────────────
  const abortRef = useRef(null);

  // ─── FETCH LIST ──────────────────────────────────────────────────────────────

  const fetch = useCallback(async (overrides = {}) => {
    // Cancel previous in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const params = { ...filters, ...overrides };

      // Strip empty strings so the backend doesn't receive them as filters
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined),
      );

      const res = await listCourses(cleanParams);

      const body  = res.data;
      const data  = body?.data ?? body?.records ?? [];
      const count = body?.pagination?.total ?? body?.total ?? data.length;

      setCourses(data);
      setTotal(count);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load courses.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ─── FILTER HELPERS ───────────────────────────────────────────────────────

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      approvalStatus: mode === 'manager' ? '' : 'APPROVED',
    });
  }, [mode]);

  const setPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // ─── CRUD ACTIONS ─────────────────────────────────────────────────────────

  /**
   * Create a new course (ADMIN / DIRECTOR).
   * Returns the created course or throws.
   */
  const create = useCallback(async (payload) => {
    const res  = await createCourse(payload);
    return res.data?.data ?? res.data;
  }, []);

  /**
   * Update a DRAFT / REJECTED course.
   * Returns the updated course or throws.
   */
  const update = useCallback(async (id, payload) => {
    const res = await updateCourse(id, payload);
    return res.data?.data ?? res.data;
  }, []);

  /**
   * Soft-delete a course.
   * Returns response data (may include warning + dependentCourses).
   */
  const remove = useCallback(async (id) => {
    const res = await deleteCourse(id);
    return res.data?.data ?? res.data;
  }, []);

  /** Restore a soft-deleted course (ADMIN only). */
  const restore = useCallback(async (id) => {
    const res = await restoreCourse(id);
    return res.data?.data ?? res.data;
  }, []);

  // ─── WORKFLOW ACTIONS ──────────────────────────────────────────────────────

  /** Submit DRAFT | REJECTED → PENDING_REVIEW */
  const submit = useCallback(async (id, note = '') => {
    const res = await submitCourseForReview(id, note);
    return res.data?.data ?? res.data;
  }, []);

  /** Approve PENDING_REVIEW → APPROVED */
  const approve = useCallback(async (id, note = '') => {
    const res = await approveCourse(id, note);
    return res.data?.data ?? res.data;
  }, []);

  /** Reject PENDING_REVIEW → REJECTED */
  const reject = useCallback(async (id, note) => {
    const res = await rejectCourse(id, note);
    return res.data?.data ?? res.data;
  }, []);

  /** Clone APPROVED → new DRAFT (version + 1) */
  const newVersion = useCallback(async (id, copyResources = true) => {
    const res = await createNewVersion(id, copyResources);
    return res.data?.data ?? res.data;
  }, []);

  // ─── RESOURCE ACTIONS ─────────────────────────────────────────────────────

  /** Add resource to a course. */
  const addResource = useCallback(async (courseId, resource) => {
    const res = await addCourseResource(courseId, resource);
    return res.data?.data ?? res.data;
  }, []);

  /** Remove a resource from a course. */
  const removeResource = useCallback(async (courseId, resourceId) => {
    const res = await removeCourseResource(courseId, resourceId);
    return res.data?.data ?? res.data;
  }, []);

  // ─── SINGLE FETCH ─────────────────────────────────────────────────────────

  /** Fetch a single course detail by id. */
  const fetchById = useCallback(async (id) => {
    const res = await getCourseById(id);
    return res.data?.data ?? res.data;
  }, []);

  // ─── PUBLIC API ───────────────────────────────────────────────────────────

  return {
    // State
    courses,
    total,
    loading,
    error,
    filters,

    // Data
    fetch,
    fetchById,

    // Filters
    handleFilterChange,
    handleReset,
    setPage,

    // CRUD
    create,
    update,
    remove,
    restore,

    // Workflow
    submit,
    approve,
    reject,
    newVersion,

    // Resources
    addResource,
    removeResource,
  };
};

export default useCourse;