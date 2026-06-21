/**
 * @file useExpenses.js
 * @description Campus hook for institutional expenses: list/CRUD, the approval
 * workflow (approve / reject / pay) and the expense-category lookup CRUD.
 *
 * Consumed by: ExpensesManager, ExpenseCategoriesPanel.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  listExpenses,
  createExpense,
  updateExpense,
  approveExpense,
  rejectExpense,
  payExpense,
  deleteExpense,
  listExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
} from '../services/financeService';

const DEFAULT_FILTERS = {
  status:   '',
  category: '',
  year:     '',
  month:    '',
  page:     1,
  limit:    20,
};

const clean = (obj) => {
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    if (out[k] === '' || out[k] == null) delete out[k];
  });
  return out;
};

const WORKFLOW = { approve: approveExpense, reject: rejectExpense, pay: payExpense };

const useExpenses = (campusId) => {
  const [expenses,   setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  // ─── Expenses ─────────────────────────────────────────────────────────────────
  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listExpenses(clean({ ...filters, campusId }));
      setExpenses(Array.isArray(res.data?.data) ? res.data.data : []);
      if (res.data?.pagination) setPagination((p) => ({ ...p, ...res.data.pagination }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load expenses.');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filters, campusId]);

  useEffect(() => { fetch(); }, [fetch]);

  // ─── Categories ───────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await listExpenseCategories();
      setCategories(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      // Non-fatal: the form will just show an empty category list.
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // ─── Filters ────────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }));
  }, []);

  const handleReset = useCallback(() => setFilters(DEFAULT_FILTERS), []);
  const setPage = useCallback((page) => setFilters((prev) => ({ ...prev, page })), []);

  // ─── Expense mutations ────────────────────────────────────────────────────────
  const create = useCallback(async (data) => {
    const res = await createExpense({ ...data, schoolCampus: campusId });
    await fetch();
    return res.data;
  }, [fetch, campusId]);

  const update = useCallback(async (id, data) => {
    const res = await updateExpense(id, data);
    await fetch();
    return res.data;
  }, [fetch]);

  const transition = useCallback(async (id, action) => {
    const fn = WORKFLOW[action];
    if (!fn) throw new Error(`Unknown workflow action: ${action}`);
    const res = await fn(id);
    await fetch();
    return res.data;
  }, [fetch]);

  const remove = useCallback(async (id) => {
    const res = await deleteExpense(id);
    await fetch();
    return res.data;
  }, [fetch]);

  // ─── Category mutations ───────────────────────────────────────────────────────
  const createCategory = useCallback(async (data) => {
    const res = await createExpenseCategory(data);
    await fetchCategories();
    return res.data;
  }, [fetchCategories]);

  const removeCategory = useCallback(async (id) => {
    const res = await deleteExpenseCategory(id);
    await fetchCategories();
    return res.data;
  }, [fetchCategories]);

  return {
    expenses, categories, pagination, filters, loading, error,
    fetch, fetchCategories, handleFilterChange, handleReset, setPage,
    create, update, transition, remove,
    createCategory, removeCategory,
  };
};

export default useExpenses;
