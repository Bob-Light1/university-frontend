/**
 * @file useResult.js
 * @description Shared data hook for academic result management.
 *
 * Modes:
 *  'manager'  → campus-level management (CAMPUS_MANAGER / ADMIN / DIRECTOR)
 *  'teacher'  → teacher's own class results (TEACHER)
 *  'student'  → student's own published results (STUDENT)
 *
 * @param {'manager'|'teacher'|'student'} mode
 * @param {Object} contextParams  — academicYear, semester, classId, subjectId, etc.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getResults,
  createResult,
  updateResult,
  deleteResult,
  bulkCreateResults,
  submitResult,
  submitBatch,
  publishResult,
  publishBatch,
  archiveResult,
  lockSemester,
  auditCorrection,
  getClassStatistics,
  getRetakeList,
  getCampusOverview,
} from '../services/resultService';

// ─── Default filter state per mode ────────────────────────────────────────────

const DEFAULT_MANAGER_FILTERS = {
  academicYear:   '',
  semester:       '',
  status:         '',
  evaluationType: '',
  classId:        '',
  subjectId:      '',
  teacherId:      '',
  page:           1,
  limit:          50,
};

const DEFAULT_TEACHER_FILTERS = {
  academicYear:   '',
  semester:       '',
  status:         '',
  evaluationType: '',
  classId:        '',
  subjectId:      '',
  page:           1,
  limit:          50,
};

const DEFAULT_STUDENT_FILTERS = {
  academicYear: '',
  semester:     '',
  page:         1,
  limit:        50,
};

const FILTER_DEFAULTS = {
  manager: DEFAULT_MANAGER_FILTERS,
  teacher: DEFAULT_TEACHER_FILTERS,
  student: DEFAULT_STUDENT_FILTERS,
};

// ─── Response normaliser ───────────────────────────────────────────────────────

const normalise = (raw) => {
  if (Array.isArray(raw))           return raw;
  if (Array.isArray(raw?.data))     return raw.data;
  if (Array.isArray(raw?.results))  return raw.results;
  if (Array.isArray(raw?.records))  return raw.records;
  return [];
};

// ─────────────────────────────────────────────────────────────────────────────

const useResult = (mode = 'manager', contextParams = {}) => {
  const [results,    setResults]    = useState([]);
  const [overview,   setOverview]   = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [retakeList, setRetakeList] = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });
  const [filters,    setFilters]    = useState(FILTER_DEFAULTS[mode] ?? DEFAULT_MANAGER_FILTERS);

  // Stable values refetch when the selected campus changes.
  const contextKey = JSON.stringify(contextParams);
  const context = useMemo(() => JSON.parse(contextKey), [contextKey]);

  // ─── Fetch results list ────────────────────────────────────────────────────

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = { ...filters, ...context };

      // Strip empty/null params to keep the query clean
      Object.keys(params).forEach((k) => {
        if (params[k] === '' || params[k] === null || params[k] === undefined)
          delete params[k];
      });

      const res = await getResults(params);
      const raw = res.data;

      setResults(normalise(raw));

      if (raw?.pagination) {
        setPagination((p) => ({ ...p, ...raw.pagination }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load results.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [filters, context]);

  useEffect(() => { fetch(); }, [fetch]);

  // ─── Fetch campus overview (manager only) ──────────────────────────────────

  const fetchOverview = useCallback(async (params = {}) => {
    if (mode !== 'manager') return;
    try {
      const res = await getCampusOverview({ ...params, ...context });
      setOverview(res.data?.data ?? null);
    } catch (err) {
      console.error('[useResult] fetchOverview error:', err.response?.data?.message);
    }
  }, [mode, context]);

  // ─── Fetch class statistics ────────────────────────────────────────────────

  const fetchStatistics = useCallback(async (classId, params) => {
    if (!classId) return;
    try {
      const res = await getClassStatistics(classId, { ...params, ...context });
      setStatistics(res.data?.data ?? null);
    } catch (err) {
      setStatistics(null);
      console.error('[useResult] fetchStatistics error:', err.response?.data?.message);
    }
  }, [context]);

  // ─── Fetch retake list ─────────────────────────────────────────────────────

  const fetchRetakeList = useCallback(async (classId, params) => {
    if (!classId) return;
    try {
      const res = await getRetakeList(classId, { ...params, ...context });
      setRetakeList(normalise(res.data?.data));
    } catch (err) {
      setRetakeList([]);
      console.error('[useResult] fetchRetakeList error:', err.response?.data?.message);
    }
  }, [context]);

  // ─── Filter helpers ────────────────────────────────────────────────────────

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(FILTER_DEFAULTS[mode] ?? DEFAULT_MANAGER_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [mode]);

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const create = useCallback(async (data) => {
    const res = await createResult(data, context);
    await fetch();
    return res.data?.data;
  }, [fetch, context]);

  const update = useCallback(async (id, data) => {
    const res = await updateResult(id, data, context);
    await fetch();
    return res.data?.data;
  }, [fetch, context]);

  const remove = useCallback(async (id) => {
    await deleteResult(id, context);
    await fetch();
  }, [fetch, context]);

  const bulkCreate = useCallback(async (data) => {
    const res = await bulkCreateResults(data, context);
    await fetch();
    // Return the inner payload ({ inserted, skipped, errors }) — BulkResultForm
    // reads those keys directly. Returning the full envelope (res.data) left
    // result.skipped undefined, so partial-failure summaries were never shown.
    return res.data?.data ?? res.data;
  }, [fetch, context]);

  // Workflow actions

  const submit = useCallback(async (id) => {
    await submitResult(id, context);
    await fetch();
  }, [fetch, context]);

  const submitAllBatch = useCallback(async (data) => {
    const res = await submitBatch(data, context);
    await fetch();
    return res.data;
  }, [fetch, context]);

  const publish = useCallback(async (id) => {
    await publishResult(id, context);
    await fetch();
  }, [fetch, context]);

  const publishAllBatch = useCallback(async (data) => {
    const res = await publishBatch(data, context);
    await fetch();
    return res.data;
  }, [fetch, context]);

  const archive = useCallback(async (id) => {
    await archiveResult(id, context);
    await fetch();
  }, [fetch, context]);

  const lockSem = useCallback(async (data) => {
    const res = await lockSemester(data, context);
    await fetch();
    return res.data;
  }, [fetch, context]);

  const auditCorrect = useCallback(async (id, data) => {
    const res = await auditCorrection(id, data, context);
    await fetch();
    return res.data?.data;
  }, [fetch, context]);

  // ─── Computed KPI summary ──────────────────────────────────────────────────

  const summary = useMemo(() => {
    const total     = results.length;
    const draft     = results.filter((r) => r.status === 'DRAFT').length;
    const submitted = results.filter((r) => r.status === 'SUBMITTED').length;
    const published = results.filter((r) => r.status === 'PUBLISHED').length;
    const archived  = results.filter((r) => r.status === 'ARCHIVED').length;

    const scores    = results
      .filter((r) => r.status === 'PUBLISHED' && r.normalizedScore != null)
      .map((r) => r.normalizedScore);

    const avg = scores.length
      ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      : null;

    const passing = scores.filter((s) => s >= 10).length;
    const passRate = scores.length
      ? parseFloat(((passing / scores.length) * 100).toFixed(1))
      : null;

    return { total, draft, submitted, published, archived, avg, passRate };
  }, [results]);

  return {
    // Data
    results,
    overview,
    statistics,
    retakeList,
    summary,
    loading,
    error,
    pagination,
    filters,

    // Refresh
    fetch,
    fetchOverview,
    fetchStatistics,
    fetchRetakeList,

    // Filter actions
    handleFilterChange,
    handleReset,
    setPage: (page) => {
      setFilters((prev) => ({ ...prev, page }));
      setPagination((prev) => ({ ...prev, page }));
    },

    // CRUD mutations
    create,
    update,
    remove,
    bulkCreate,

    // Workflow mutations
    submit,
    submitAllBatch,
    publish,
    publishAllBatch,
    archive,
    lockSem,
    auditCorrect,
  };
};

export default useResult;