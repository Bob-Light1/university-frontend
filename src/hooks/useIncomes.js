/**
 * @file useIncomes.js
 * @description Campus hook for institutional income records (CRUD).
 *
 * Consumed by: IncomesManager.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  listIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
} from '../services/financeService';

const DEFAULT_FILTERS = {
  source:  '',
  status:  '',
  year:    '',
  month:   '',
  student: '',
  page:    1,
  limit:   20,
};

const clean = (obj) => {
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    if (out[k] === '' || out[k] == null) delete out[k];
  });
  return out;
};

const useIncomes = (campusId) => {
  const [incomes,    setIncomes]    = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listIncomes(clean({ ...filters, campusId }));
      setIncomes(Array.isArray(res.data?.data) ? res.data.data : []);
      if (res.data?.pagination) setPagination((p) => ({ ...p, ...res.data.pagination }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load incomes.');
      setIncomes([]);
    } finally {
      setLoading(false);
    }
  }, [filters, campusId]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  }, []);

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const setPage = useCallback((page) => setFilters((prev) => ({ ...prev, page })), []);

  const create = useCallback(async (data) => {
    const res = await createIncome({ ...data, schoolCampus: campusId });
    await fetch();
    return res.data;
  }, [fetch, campusId]);

  const update = useCallback(async (id, data) => {
    const res = await updateIncome(id, data);
    await fetch();
    return res.data;
  }, [fetch]);

  const remove = useCallback(async (id) => {
    const res = await deleteIncome(id);
    await fetch();
    return res.data;
  }, [fetch]);

  return {
    incomes, pagination, filters, loading, error,
    fetch, handleFilterChange, handleReset, setPage,
    create, update, remove,
  };
};

export default useIncomes;
