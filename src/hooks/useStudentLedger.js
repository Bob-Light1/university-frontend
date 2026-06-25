/**
 * @file useStudentLedger.js
 * @description Loads a student's consolidated finance ledger
 * (debts + payments + totals).
 *
 * Two modes:
 *   - management: pass a `studentId` → GET /finance/students/:id/ledger
 *   - student self-service: pass `mine: true` → GET /finance/my/ledger
 *
 * Consumed by: StudentLedgerDrawer (management), StudentFinance (student).
 */

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getStudentLedger, getMyLedger } from '../services/financeService';

const EMPTY = { fees: [], payments: [], totals: { totalDue: 0, totalPaid: 0, balance: 0 } };

const useStudentLedger = ({ studentId = null, campusId = null, mine = false } = {}) => {
  const { t } = useTranslation('finance');
  const [ledger,  setLedger]  = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    if (!mine && !studentId) { setLedger(EMPTY); return; }
    setLoading(true);
    setError(null);
    try {
      const res = mine
        ? await getMyLedger()
        : await getStudentLedger(studentId, campusId ? { campusId } : {});
      setLedger(res.data?.data ?? EMPTY);
    } catch (err) {
      setError(err.response?.data?.message || t('errors.loadLedger'));
      setLedger(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [studentId, campusId, mine, t]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ledger, loading, error, refresh: fetch };
};

export default useStudentLedger;
