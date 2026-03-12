/**
 * @file useDocument.js
 * @description Data and action hook for the Document Management Module.
 *
 * Consumed by: DocumentManager, DocumentTeacher, DocumentStudent.
 * Mirrors the pattern of useCourse.js / useResult.js.
 *
 * Usage:
 *   const doc = useDocument('manager');  // 'manager' | 'teacher' | 'student'
 */

import { useState, useCallback, useRef } from 'react';

import {
  listDocuments,
  getDocumentById,
  createDocument,
  importDocument,
  updateDocument,
  softDeleteDocument,
  hardDeleteDocument,
  searchDocuments,
  publishDocument,
  archiveDocument,
  restoreDocument,
  duplicateDocument,
  lockDocument,
  unlockDocument,
  markOfficial,
  exportDocumentPdf,
  exportDocumentRaw,
  bulkExportDocuments,
  createShareLink,
  listShareLinks,
  revokeShareLink,
  getDocumentAudit,
  getCampusAudit,
  listDocumentVersions,
  restoreDocumentVersion,
} from '../services/document.service';

// ─── Default filter state ─────────────────────────────────────────────────────

const DEFAULT_FILTERS = {
  type:         '',
  category:     '',
  status:       '',
  tag:          '',
  studentId:    '',
  teacherId:    '',
  courseId:     '',
  semester:     '',
  academicYear: '',
  search:       '',
  sort:         'createdAt_desc',
  page:         1,
  limit:        25,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param {'manager'|'teacher'|'student'} mode
 */
const useDocument = (mode = 'manager') => {
  // ── Data state ─────────────────────────────────────────────────────────────
  const [documents, setDocuments] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  // ── Filter / pagination state ──────────────────────────────────────────────
  const [filters, setFilters] = useState(() => ({
    ...DEFAULT_FILTERS,
    // Teachers and students see only PUBLISHED docs (server also enforces this)
    status: mode === 'manager' ? '' : 'PUBLISHED',
  }));

  // ── Abort controller ref — cancels stale in-flight requests ───────────────
  const abortRef = useRef(null);

  // ─── FETCH LIST ────────────────────────────────────────────────────────────

  const fetch = useCallback(async (overrides = {}) => {
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

      const res = await listDocuments(cleanParams);

      const body  = res.data;
      const data  = body?.data ?? body?.records ?? [];
      const count = body?.pagination?.total ?? body?.total ?? data.length;

      setDocuments(data);
      setTotal(count);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to load documents.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // ─── FILTER HELPERS ────────────────────────────────────────────────────────

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters({
      ...DEFAULT_FILTERS,
      status: mode === 'manager' ? '' : 'PUBLISHED',
    });
  }, [mode]);

  const setPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // ─── CRUD ACTIONS ──────────────────────────────────────────────────────────

  const create = useCallback(async (payload) => {
    const res = await createDocument(payload);
    return res.data?.data ?? res.data;
  }, []);

  const importFile = useCallback(async (formData) => {
    const res = await importDocument(formData);
    return res.data?.data ?? res.data;
  }, []);

  const update = useCallback(async (id, payload) => {
    const res = await updateDocument(id, payload);
    return res.data?.data ?? res.data;
  }, []);

  const remove = useCallback(async (id, reason) => {
    const res = await softDeleteDocument(id, reason);
    return res.data?.data ?? res.data;
  }, []);

  const hardRemove = useCallback(async (id, reason) => {
    const res = await hardDeleteDocument(id, reason);
    return res.data?.data ?? res.data;
  }, []);

  const fetchById = useCallback(async (id) => {
    const res = await getDocumentById(id);
    return res.data?.data ?? res.data;
  }, []);

  // ─── WORKFLOW ACTIONS ──────────────────────────────────────────────────────

  const publish   = useCallback(async (id, reason)  => { const r = await publishDocument(id, reason);   return r.data?.data ?? r.data; }, []);
  const archive   = useCallback(async (id, reason)  => { const r = await archiveDocument(id, reason);   return r.data?.data ?? r.data; }, []);
  const restore   = useCallback(async (id, reason)  => { const r = await restoreDocument(id, reason);   return r.data?.data ?? r.data; }, []);
  const duplicate = useCallback(async (id)          => { const r = await duplicateDocument(id);         return r.data?.data ?? r.data; }, []);
  const lock      = useCallback(async (id, reason)  => { const r = await lockDocument(id, reason);      return r.data?.data ?? r.data; }, []);
  const unlock    = useCallback(async (id, reason)  => { const r = await unlockDocument(id, reason);    return r.data?.data ?? r.data; }, []);
  const official  = useCallback(async (id, reason)  => { const r = await markOfficial(id, reason);      return r.data?.data ?? r.data; }, []);

  // ─── EXPORT ACTIONS ────────────────────────────────────────────────────────

  /**
   * Triggers a browser download for the PDF export of a document.
   * @param {string} id
   * @param {string} filename - Suggested filename without extension
   */
  const downloadPdf = useCallback(async (id, filename = 'document') => {
    const res  = await exportDocumentPdf(id);
    const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href     = url;
    link.download = `${filename}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Triggers a browser download for the raw file of an IMPORTED document.
   * @param {string} id
   * @param {string} filename - Suggested filename with extension
   */
  const downloadRaw = useCallback(async (id, filename = 'document') => {
    const res  = await exportDocumentRaw(id);
    const contentType = res.headers?.['content-type'] ?? 'application/octet-stream';
    const url  = URL.createObjectURL(new Blob([res.data], { type: contentType }));
    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  /** Bulk export multiple documents as a ZIP/PDF archive. */
  const bulkExport = useCallback(async (documentIds, options = {}) => {
    const res = await bulkExportDocuments(documentIds, options);
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
    const link = document.createElement('a');
    link.href     = url;
    link.download = 'documents-export.zip';
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // ─── SHARE ACTIONS ─────────────────────────────────────────────────────────

  const share         = useCallback(async (id, opts)     => { const r = await createShareLink(id, opts); return r.data?.data ?? r.data; }, []);
  const fetchShares   = useCallback(async (id)           => { const r = await listShareLinks(id);         return r.data?.data ?? r.data; }, []);
  const revokeShare   = useCallback(async (shareId)      => { const r = await revokeShareLink(shareId);   return r.data?.data ?? r.data; }, []);

  // ─── AUDIT ACTIONS ─────────────────────────────────────────────────────────

  const fetchAudit       = useCallback(async (id, params)  => { const r = await getDocumentAudit(id, params); return r.data?.data ?? r.data; }, []);
  const fetchCampusAudit = useCallback(async (params)      => { const r = await getCampusAudit(params);        return r.data?.data ?? r.data; }, []);

  // ─── VERSION ACTIONS ───────────────────────────────────────────────────────

  const fetchVersions     = useCallback(async (id, params)  => { const r = await listDocumentVersions(id, params);          return r.data?.data ?? r.data; }, []);
  const restoreVersion    = useCallback(async (id, v, rsn)  => { const r = await restoreDocumentVersion(id, v, rsn);        return r.data?.data ?? r.data; }, []);

  // ─── PUBLIC API ────────────────────────────────────────────────────────────

  return {
    // State
    documents,
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
    importFile,
    update,
    remove,
    hardRemove,

    // Workflow
    publish,
    archive,
    restore,
    duplicate,
    lock,
    unlock,
    official,

    // Export
    downloadPdf,
    downloadRaw,
    bulkExport,

    // Share
    share,
    fetchShares,
    revokeShare,

    // Audit
    fetchAudit,
    fetchCampusAudit,

    // Versions
    fetchVersions,
    restoreVersion,
  };
};

export default useDocument;