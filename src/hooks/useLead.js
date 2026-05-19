/**
 * @file useLead.js
 * @description Campus Manager hook for the lead pipeline.
 *
 * Consumed by: LeadPipeline, LeadDetailDrawer
 *
 * The `summaryFilter` pattern is applied on the backend — KPIs are not
 * affected by the active status filter (same principle as attendance).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  listLeads,
  getLead,
  updateLeadStatus,
  deleteLead,
  exportLeads,
} from '../services/leadService';

const DEFAULT_FILTERS = {
  search:  '',
  status:  '',
  partner: '',
  source:  '',
  from:    '',
  to:      '',
  page:    1,
  limit:   25,
};

const useLead = () => {
  const [leads,      setLeads]      = useState([]);
  const [kpis,       setKpis]       = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  // ─── Fetch list ─────────────────────────────────────────────────────────────

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = { ...filters };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });

    try {
      const res = await listLeads(params);
      const raw = res.data;
      setLeads(Array.isArray(raw?.data) ? raw.data : []);
      if (raw?.kpis)       setKpis(raw.kpis);
      if (raw?.pagination) setPagination((p) => ({ ...p, ...raw.pagination }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  // ─── Filter helpers ─────────────────────────────────────────────────────────

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const setPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const changeLeadStatus = useCallback(async (id, status, note = '', tuitionFee) => {
    const payload = { status, note };
    if (tuitionFee !== undefined) payload.tuitionFee = tuitionFee;
    const res = await updateLeadStatus(id, payload);
    await fetch();
    return res.data;
  }, [fetch]);

  const removeLead = useCallback(async (id) => {
    const res = await deleteLead(id);
    await fetch();
    return res.data;
  }, [fetch]);

  const fetchDetail = useCallback(async (id) => {
    const res = await getLead(id);
    return res.data?.data ?? res.data;
  }, []);

  const downloadCSV = useCallback(async () => {
    const params = { ...filters };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });
    delete params.page;
    delete params.limit;

    const res = await exportLeads(params);
    const url = URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filters]);

  // ─── Computed breakdown ─────────────────────────────────────────────────────

  const statusCounts = useMemo(() => {
    const counts = {
      new: 0, contacted: 0, dossier_submitted: 0,
      admitted: 0, enrolled: 0, rejected: 0, abandoned: 0,
    };
    leads.forEach((l) => { if (counts[l.status] !== undefined) counts[l.status]++; });
    return counts;
  }, [leads]);

  return {
    // Data
    leads,
    kpis,
    statusCounts,
    pagination,
    filters,
    loading,
    error,

    // Refresh
    fetch,

    // Filter actions
    handleFilterChange,
    handleReset,
    setPage,

    // Mutations
    changeLeadStatus,
    removeLead,
    fetchDetail,
    downloadCSV,
  };
};

export default useLead;
