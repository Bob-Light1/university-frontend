/**
 * @file useFees.js
 * @description Campus hook for student debts (fees) + payments.
 *
 * Pagination/filtering mirror the backend listFees contract. The campusId
 * (from the route) is forwarded as a query param: ignored server-side for
 * local roles, used by global roles (ADMIN/DIRECTOR) to scope the viewed campus.
 *
 * Consumed by: FeesManager.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  listFees,
  createFee,
  recordPayment,
  remindFee,
  deleteFee,
} from '../services/financeService';

const DEFAULT_FILTERS = {
  status:       '',
  student:      '',
  academicYear: '',
  page:         1,
  limit:        20,
};

const clean = (obj) => {
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    if (out[k] === '' || out[k] == null) delete out[k];
  });
  return out;
};

const useFees = (campusId) => {
  const { t } = useTranslation('finance');
  const [fees,       setFees]       = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listFees(clean({ ...filters, campusId }));
      setFees(Array.isArray(res.data?.data) ? res.data.data : []);
      if (res.data?.pagination) setPagination((p) => ({ ...p, ...res.data.pagination }));
    } catch (err) {
      setError(err.response?.data?.message || t('errors.loadFees'));
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, [filters, campusId, t]);

  useEffect(() => { fetch(); }, [fetch]);

  // ─── Filters ────────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  }, []);

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const setPage = useCallback((page) => setFilters((prev) => ({ ...prev, page })), []);

  // ─── Mutations (campus injected into the create payload) ──────────────────────
  const create = useCallback(async (data) => {
    const res = await createFee({ ...data, schoolCampus: campusId });
    await fetch();
    return res.data;
  }, [fetch, campusId]);

  const pay = useCallback(async (feeId, data) => {
    const res = await recordPayment(feeId, data);
    await fetch();
    return res.data;
  }, [fetch]);

  const remind = useCallback(async (feeId) => {
    const res = await remindFee(feeId);
    return res.data;
  }, []);

  const remove = useCallback(async (feeId) => {
    const res = await deleteFee(feeId);
    await fetch();
    return res.data;
  }, [fetch]);

  return {
    fees, pagination, filters, loading, error,
    fetch, handleFilterChange, handleReset, setPage,
    create, pay, remind, remove,
  };
};

export default useFees;
