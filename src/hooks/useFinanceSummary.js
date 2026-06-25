/**
 * @file useFinanceSummary.js
 * @description Loads the financial summary (income vs expense vs net) for a
 * campus and period, plus a per-month breakdown for the year used to feed the
 * revenue/expense chart (12 parallel /summary calls — the backend exposes no
 * single monthly-series endpoint yet).
 *
 * Consumed by: FinanceOverview.
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getSummary } from '../services/financeService';
import { MONTHS } from '../campus/components/finance/financeConstants';

const EMPTY = { income: { total: 0, count: 0 }, expense: { total: 0, count: 0 }, net: 0 };

const useFinanceSummary = (campusId, initialYear = new Date().getFullYear()) => {
  const { t } = useTranslation('finance');
  const [period,         setPeriod]         = useState({ year: initialYear, month: '' });
  const [summary,        setSummary]        = useState(EMPTY);
  const [monthly,        setMonthly]        = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [error,          setError]          = useState(null);

  const baseParams = useCallback(() => {
    const p = { campusId };
    if (period.year)  p.year = period.year;
    if (period.month) p.month = period.month;
    return p;
  }, [campusId, period]);

  // ─── Headline summary (respects year + optional month) ────────────────────────
  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSummary(baseParams());
      setSummary(res.data?.data ?? EMPTY);
    } catch (err) {
      setError(err.response?.data?.message || t('errors.loadSummary'));
      setSummary(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [baseParams, t]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // ─── Monthly series for the chart (depends on the year only) ──────────────────
  const fetchMonthly = useCallback(async () => {
    if (!period.year) { setMonthly([]); return; }
    setMonthlyLoading(true);
    try {
      const results = await Promise.all(
        MONTHS.map((m) =>
          getSummary({ campusId, year: period.year, month: m.value })
            .then((res) => res.data?.data ?? EMPTY)
            .catch(() => EMPTY)
        )
      );
      setMonthly(
        results.map((r, i) => ({
          // Numeric month (1-12); the chart translates it at render time.
          month:   MONTHS[i].value,
          income:  r.income?.total ?? 0,
          expense: r.expense?.total ?? 0,
          net:     r.net ?? 0,
        }))
      );
    } finally {
      setMonthlyLoading(false);
    }
  }, [campusId, period.year]);

  useEffect(() => { fetchMonthly(); }, [fetchMonthly]);

  return {
    period, setPeriod,
    summary, monthly,
    loading, monthlyLoading, error,
    refresh: fetchSummary,
  };
};

export default useFinanceSummary;
