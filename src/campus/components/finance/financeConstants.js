/**
 * @file financeConstants.js
 * @description Finance enums, display labels, status colours and formatting
 * helpers. Enums mirror the backend models exactly (single source of truth):
 *   - StudentFee.status / fee-status.js → FEE_STATUSES
 *   - feePayment / expense / income .currency → CURRENCIES
 *   - feePayment / expense / income .method   → PAYMENT_METHODS
 *   - Expense.status  → EXPENSE_STATUSES
 *   - Income.status   → INCOME_STATUSES
 *   - Income.source   → INCOME_SOURCES
 *   - Expense.recurringPeriod → RECURRING_PERIODS
 *
 * Keep these literals in lockstep with the backend; never diverge.
 */

// ─── Currencies ─────────────────────────────────────────────────────────────────
export const CURRENCIES = ['XAF', 'USD', 'EUR'];
export const DEFAULT_CURRENCY = 'XAF';

// ─── Payment methods (shared by payments / incomes / expenses) ────────────────────
export const PAYMENT_METHODS = ['Cash', 'Mobile Money', 'Bank Transfer', 'Cheque'];

// ─── Fee (student debt) statuses ──────────────────────────────────────────────────
export const FEE_STATUSES = ['pending', 'partial', 'paid', 'overdue', 'cancelled'];

export const FEE_STATUS_LABEL = {
  pending:   'Pending',
  partial:   'Partial',
  paid:      'Paid',
  overdue:   'Overdue',
  cancelled: 'Cancelled',
};

/** MUI Chip colour per fee status. */
export const FEE_STATUS_COLOR = {
  pending:   'default',
  partial:   'info',
  paid:      'success',
  overdue:   'error',
  cancelled: 'warning',
};

// ─── Expense statuses + workflow ──────────────────────────────────────────────────
export const EXPENSE_STATUSES = ['pending', 'approved', 'paid', 'rejected'];

export const EXPENSE_STATUS_LABEL = {
  pending:  'Pending',
  approved: 'Approved',
  paid:     'Paid',
  rejected: 'Rejected',
};

export const EXPENSE_STATUS_COLOR = {
  pending:  'warning',
  approved: 'info',
  paid:     'success',
  rejected: 'error',
};

/**
 * Allowed workflow transitions per current status (mirrors expense.service
 * transitionExpense rules). Used to render only legal action buttons.
 */
export const EXPENSE_TRANSITIONS = {
  pending:  ['approve', 'reject'],
  approved: ['pay', 'reject'],
  paid:     [],
  rejected: [],
};

// ─── Income statuses + sources ────────────────────────────────────────────────────
export const INCOME_STATUSES = ['pending', 'received', 'cancelled'];

export const INCOME_STATUS_LABEL = {
  pending:   'Pending',
  received:  'Received',
  cancelled: 'Cancelled',
};

export const INCOME_STATUS_COLOR = {
  pending:   'warning',
  received:  'success',
  cancelled: 'default',
};

export const INCOME_SOURCES = [
  'Enrollment Fees',
  'Tuition',
  'Course Payment',
  'Exam',
  'Certification',
  'Grant',
  'Donation',
  'Partnership',
  'Other',
];

// ─── Expense recurrence ─────────────────────────────────────────────────────────
export const RECURRING_PERIODS = ['monthly', 'quarterly', 'yearly'];

export const RECURRING_PERIOD_LABEL = {
  monthly:   'Monthly',
  quarterly: 'Quarterly',
  yearly:    'Yearly',
};

// ─── Months (for the period selector) ─────────────────────────────────────────────
export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

/**
 * Recent years (descending) for the period selector, based on the current
 * calendar year — the backend denormalizes income/expense periods by calendar
 * month/year (see income/expense models' pre-save hooks).
 * @param {number} [span] number of years to include
 * @returns {number[]}
 */
export const recentYears = (span = 6) => {
  const base = new Date().getFullYear();
  return Array.from({ length: span }, (_, i) => base - i);
};

// ─── Formatting helpers ─────────────────────────────────────────────────────────

/**
 * Format an amount with its currency, locale-aware. Falls back to a plain
 * grouped number + currency code for non-ISO currencies.
 * @param {number} amount
 * @param {string} [currency]
 * @returns {string}
 */
export const formatMoney = (amount, currency = DEFAULT_CURRENCY) => {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'XAF' ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
};

/**
 * Short date formatter (locale day). Returns an em dash for empty dates.
 * @param {string|Date|null} date
 * @returns {string}
 */
export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString() : '—';
