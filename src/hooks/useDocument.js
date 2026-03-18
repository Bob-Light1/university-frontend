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

import api, { EXPORT_TIMEOUT } from '../api/axiosInstance';
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
  createShareLink,
  listShareLinks,
  revokeShareLink,
  getDocumentAudit,
  getCampusAudit,
  listDocumentVersions,
  restoreDocumentVersion,
} from '../services/document.service';

// ─── Binary download helper ────────────────────────────────────────────────────

/**
 * Performs a binary GET request bypassing the global 10 s timeout.
 * Used for PDF generation and raw file streaming, which can take up to 90 s.
 * responseType: 'blob' ensures the browser handles the binary payload correctly.
 *
 * @param {string} url - Relative API path
 * @returns {Promise<import('axios').AxiosResponse>}
 */
const fetchBinary = (url) =>
  api.get(url, { responseType: 'blob', timeout: EXPORT_TIMEOUT });

/**
 * Triggers a browser file download from a Blob response.
 * Cleans up the object URL immediately after the download is initiated.
 *
 * @param {Blob}   blob     - Binary data received from the server
 * @param {string} filename - Full filename including extension
 * @param {string} mime     - MIME type (fallback if blob.type is absent)
 */
const triggerDownload = (blob, filename, mime = 'application/octet-stream') => {
  const type = blob.type || mime;
  const url  = URL.createObjectURL(new Blob([blob], { type }));
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

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
   * Uses a dedicated 90 s timeout — PDF generation is server-side and can be slow.
   *
   * @param {string} id
   * @param {string} filename - Suggested filename without extension
   */
  const downloadPdf = useCallback(async (id, filename = 'document') => {
    const res = await fetchBinary(`/documents/${id}/export/pdf`);
    triggerDownload(res.data, `${filename}.pdf`, 'application/pdf');
  }, []);

  /**
   * Triggers a browser download for the raw file of an IMPORTED document.
   * Uses a dedicated 90 s timeout — large files may take time to stream.
   *
   * @param {string} id
   * @param {string} filename - Suggested filename with extension
   */
  const downloadRaw = useCallback(async (id, filename = 'document') => {
    const res = await fetchBinary(`/documents/${id}/export/raw`);
    // Prefer server-provided content-type for correct file association
    const mime = res.headers?.['content-type'] ?? 'application/octet-stream';
    triggerDownload(res.data, filename, mime);
  }, []);

  /**
   * Bulk export multiple documents as a ZIP archive.
   * Uses a dedicated 90 s timeout — ZIP packaging of many PDFs can be slow.
   *
   * @param {string[]} documentIds
   * @param {object}   options      - Optional extra params forwarded to the backend
   */
  const bulkExport = useCallback(async (documentIds, options = {}) => {
    const res = await api.post(
      '/documents/bulk/export',
      { documentIds, ...options },
      { responseType: 'blob', timeout: EXPORT_TIMEOUT },
    );
    triggerDownload(res.data, 'documents-export.zip', 'application/zip');
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