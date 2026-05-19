/**
 * @file usePartner.js
 * @description Campus Manager hook for Partner list + CRUD operations.
 *
 * Consumed by: PartnerManager, PartnerList, PartnerDetailDrawer
 *
 * Fetches paginated partner list, exposes filter helpers,
 * and wraps every mutation with an automatic list refresh.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  listPartners,
  registerPartner,
  updatePartner,
  togglePartnerStatus,
  archivePartner,
  regenerateQR,
  exportPartners,
} from '../services/partnerService';

const DEFAULT_FILTERS = {
  search:      '',
  status:      '',
  partnerType: '',
  tier:        '',
  page:        1,
  limit:       20,
};

const usePartner = () => {
  const [partners,   setPartners]   = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
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
      const res = await listPartners(params);
      const raw = res.data;
      setPartners(Array.isArray(raw?.data) ? raw.data : []);
      if (raw?.pagination) setPagination((p) => ({ ...p, ...raw.pagination }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load partners.');
      setPartners([]);
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

  const createPartner = useCallback(async (data) => {
    const res = await registerPartner(data);
    await fetch();
    return res.data;
  }, [fetch]);

  const editPartner = useCallback(async (id, data) => {
    const res = await updatePartner(id, data);
    await fetch();
    return res.data;
  }, [fetch]);

  const changeStatus = useCallback(async (id, status) => {
    const res = await togglePartnerStatus(id, status);
    await fetch();
    return res.data;
  }, [fetch]);

  const removePartner = useCallback(async (id) => {
    const res = await archivePartner(id);
    await fetch();
    return res.data;
  }, [fetch]);

  const refreshQR = useCallback(async (id) => {
    const res = await regenerateQR(id);
    await fetch();
    return res.data;
  }, [fetch]);

  const downloadCSV = useCallback(async () => {
    const res = await exportPartners();
    const url = URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement('a');
    a.href    = url;
    a.download = `partners_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    // Data
    partners,
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
    createPartner,
    editPartner,
    changeStatus,
    removePartner,
    refreshQR,
    downloadCSV,
  };
};

export default usePartner;
