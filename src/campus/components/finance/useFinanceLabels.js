/**
 * @file useFinanceLabels.js
 * @description Hook returning translated finance enum label maps, keyed by the
 * raw backend value. Centralises the `enums.*` lookups so every consumer
 * (status chips, selects) shares one source instead of duplicating `t(...)`
 * calls. Kept out of `financeShared.jsx` so that file only exports components
 * (react-refresh constraint).
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  FEE_STATUSES, EXPENSE_STATUSES, INCOME_STATUSES, RECURRING_PERIODS,
} from './financeConstants';

/**
 * @returns {{ feeStatus, expenseStatus, incomeStatus, recurringPeriod }}
 *   Each value is a `{ [rawValue]: translatedLabel }` map.
 */
export const useFinanceLabels = () => {
  const { t } = useTranslation('finance');
  return useMemo(() => {
    const mapOf = (group, keys) =>
      Object.fromEntries(keys.map((k) => [k, t(`enums.${group}.${k}`)]));
    return {
      feeStatus:       mapOf('feeStatus', FEE_STATUSES),
      expenseStatus:   mapOf('expenseStatus', EXPENSE_STATUSES),
      incomeStatus:    mapOf('incomeStatus', INCOME_STATUSES),
      recurringPeriod: mapOf('recurringPeriod', RECURRING_PERIODS),
    };
  }, [t]);
};

export default useFinanceLabels;
