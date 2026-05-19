/**
 * @file useCommission.js
 * @description Campus Manager hook for commission management + config.
 *
 * Consumed by: CommissionManager, CommissionPayModal
 *
 * KPI counts are fetched from the backend summary (summaryFilter pattern)
 * and are not affected by the active status display filter.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  listCommissions,
  validateCommission,
  markCommissionPaid,
  disputeCommission,
  cancelCommission,
  getCommissionConfig,
  updateCommissionConfig,
  exportCommissions,
} from '../services/commissionService';

const DEFAULT_FILTERS = {
  status:  '',
  partner: '',
  from:    '',
  to:      '',
  page:    1,
  limit:   25,
};

const useCommission = () => {
  const [commissions,      setCommissions]      = useState([]);
  const [kpis,             setKpis]             = useState(null);
  const [commissionConfig, setCommissionConfig] = useState(null);
  const [pagination,       setPagination]       = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [filters,          setFilters]          = useState(DEFAULT_FILTERS);
  const [loading,          setLoading]          = useState(false);
  const [configLoading,    setConfigLoading]    = useState(false);
  const [error,            setError]            = useState(null);

  // ─── Fetch commissions ───────────────────────────────────────────────────────

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = { ...filters };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });

    try {
      const res = await listCommissions(params);
      const raw = res.data;
      setCommissions(Array.isArray(raw?.data) ? raw.data : []);
      if (raw?.kpis)       setKpis(raw.kpis);
      if (raw?.pagination) setPagination((p) => ({ ...p, ...raw.pagination }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load commissions.');
      setCommissions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  // ─── Fetch commission config ─────────────────────────────────────────────────

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await getCommissionConfig();
      setCommissionConfig(res.data?.data ?? res.data);
    } catch {
      // Config may not be set yet — not a hard failure
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

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

  const validate = useCallback(async (id, notes = '') => {
    const res = await validateCommission(id, { notes });
    await fetch();
    return res.data;
  }, [fetch]);

  const markPaid = useCallback(async (id, data) => {
    const res = await markCommissionPaid(id, data);
    await fetch();
    return res.data;
  }, [fetch]);

  const dispute = useCallback(async (id, notes = '') => {
    const res = await disputeCommission(id, { notes });
    await fetch();
    return res.data;
  }, [fetch]);

  const cancel = useCallback(async (id, cancellationReason) => {
    const res = await cancelCommission(id, { cancellationReason });
    await fetch();
    return res.data;
  }, [fetch]);

  const saveConfig = useCallback(async (data) => {
    const res = await updateCommissionConfig(data);
    await fetchConfig();
    return res.data;
  }, [fetchConfig]);

  const downloadCSV = useCallback(async () => {
    const params = { ...filters };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });
    delete params.page;
    delete params.limit;

    const res = await exportCommissions(params);
    const url = URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `commissions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filters]);

  return {
    // Data
    commissions,
    kpis,
    commissionConfig,
    pagination,
    filters,
    loading,
    configLoading,
    error,

    // Refresh
    fetch,
    fetchConfig,

    // Filter actions
    handleFilterChange,
    handleReset,
    setPage,

    // Mutations
    validate,
    markPaid,
    dispute,
    cancel,
    saveConfig,
    downloadCSV,
  };
};

export default useCommission;
