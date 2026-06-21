/**
 * @file financeService.js
 * @description Axios service layer for the Finance module endpoints.
 *
 * Aligned with the backend router: /api/finance/* (finance.routes.js).
 *
 * Surfaces:
 *   - Management (ADMIN / DIRECTOR / CAMPUS_MANAGER): fees, payments, ledgers,
 *     summary, incomes, expenses, expense categories.
 *   - Student (STUDENT): own ledger only (read-only).
 *
 * Campus isolation is enforced server-side from the JWT. A `campusId` query
 * param is only honoured for global roles (ADMIN / DIRECTOR) to switch campus —
 * local roles must never send it from a free field.
 */

import api from '../api/axiosInstance';

// ─── Student debts (fees) ──────────────────────────────────────────────────────

/**
 * GET /finance/fees
 * Paginated list of student debts (campus-scoped).
 * @param {{ status?, student?, academicYear?, page?, limit?, campusId? }} params
 */
export const listFees = (params = {}) => api.get('/finance/fees', { params });

/**
 * POST /finance/fees
 * Create a debt for a student.
 * @param {{ student, label, amountDue, currency?, dueDate?, academicYear?, notes?, schoolCampus? }} data
 */
export const createFee = (data) => api.post('/finance/fees', data);

/**
 * GET /finance/fees/:id
 * A debt with its payment history → { fee, payments }.
 * @param {string} id
 * @param {{ campusId? }} params  campusId is only honoured for global roles.
 */
export const getFee = (id, params = {}) => api.get(`/finance/fees/${id}`, { params });

/**
 * POST /finance/fees/:id/payments
 * Apply a payment to a debt.
 * @param {string} id
 * @param {{ amount, method, reference?, paidAt?, notes? }} data
 */
export const recordPayment = (id, data) => api.post(`/finance/fees/${id}/payments`, data);

/**
 * POST /finance/fees/:id/remind
 * (Re)send the outstanding-balance reminder to the student.
 * @param {string} id
 */
export const remindFee = (id) => api.post(`/finance/fees/${id}/remind`);

/**
 * DELETE /finance/fees/:id
 * Soft-delete a debt.
 * @param {string} id
 */
export const deleteFee = (id) => api.delete(`/finance/fees/${id}`);

// ─── Ledgers ────────────────────────────────────────────────────────────────────

/**
 * GET /finance/students/:studentId/ledger
 * A student's consolidated ledger → { fees, payments, totals } (management).
 * @param {string} studentId
 * @param {{ campusId? }} params
 */
export const getStudentLedger = (studentId, params = {}) =>
  api.get(`/finance/students/${studentId}/ledger`, { params });

/**
 * GET /finance/my/ledger
 * The current student's own ledger → { fees, payments, totals } (STUDENT).
 */
export const getMyLedger = () => api.get('/finance/my/ledger');

// ─── Financial summary ───────────────────────────────────────────────────────────

/**
 * GET /finance/summary
 * Received income vs paid expenses and the net → { income, expense, net }.
 * @param {{ year?, month?, campusId? }} params
 */
export const getSummary = (params = {}) => api.get('/finance/summary', { params });

// ─── Supporting documents (attachments) ───────────────────────────────────────────

/**
 * GET /finance/upload-signature
 * Signed Cloudinary params for a direct browser upload of an income/expense
 * supporting document (receipt / invoice). Returns only a secure URL to store.
 */
export const getUploadSignature = () => api.get('/finance/upload-signature');

// ─── Incomes ──────────────────────────────────────────────────────────────────────

/**
 * GET /finance/incomes
 * Paginated list of incomes (campus-scoped).
 * @param {{ source?, status?, year?, month?, student?, page?, limit?, campusId? }} params
 */
export const listIncomes = (params = {}) => api.get('/finance/incomes', { params });

/**
 * POST /finance/incomes
 * Create an income record.
 * @param {object} data
 */
export const createIncome = (data) => api.post('/finance/incomes', data);

/**
 * GET /finance/incomes/:id
 * @param {string} id
 */
export const getIncome = (id) => api.get(`/finance/incomes/${id}`);

/**
 * PATCH /finance/incomes/:id
 * @param {string} id
 * @param {object} data
 */
export const updateIncome = (id, data) => api.patch(`/finance/incomes/${id}`, data);

/**
 * DELETE /finance/incomes/:id
 * @param {string} id
 */
export const deleteIncome = (id) => api.delete(`/finance/incomes/${id}`);

// ─── Expenses ─────────────────────────────────────────────────────────────────────

/**
 * GET /finance/expenses
 * Paginated list of expenses (campus-scoped).
 * @param {{ status?, category?, year?, month?, page?, limit?, campusId? }} params
 */
export const listExpenses = (params = {}) => api.get('/finance/expenses', { params });

/**
 * POST /finance/expenses
 * Create an expense (status: pending).
 * @param {object} data
 */
export const createExpense = (data) => api.post('/finance/expenses', data);

/**
 * GET /finance/expenses/:id
 * @param {string} id
 */
export const getExpense = (id) => api.get(`/finance/expenses/${id}`);

/**
 * PATCH /finance/expenses/:id
 * Update a non-paid expense (409 LOCKED if already paid).
 * @param {string} id
 * @param {object} data
 */
export const updateExpense = (id, data) => api.patch(`/finance/expenses/${id}`, data);

/**
 * POST /finance/expenses/:id/approve — pending → approved.
 * @param {string} id
 */
export const approveExpense = (id) => api.post(`/finance/expenses/${id}/approve`);

/**
 * POST /finance/expenses/:id/reject — pending|approved → rejected.
 * @param {string} id
 */
export const rejectExpense = (id) => api.post(`/finance/expenses/${id}/reject`);

/**
 * POST /finance/expenses/:id/pay — approved → paid.
 * @param {string} id
 */
export const payExpense = (id) => api.post(`/finance/expenses/${id}/pay`);

/**
 * DELETE /finance/expenses/:id
 * @param {string} id
 */
export const deleteExpense = (id) => api.delete(`/finance/expenses/${id}`);

// ─── Expense categories ─────────────────────────────────────────────────────────

/**
 * GET /finance/expense-categories
 * List of expense categories (non-paginated → { data: [...] }).
 */
export const listExpenseCategories = () => api.get('/finance/expense-categories');

/**
 * POST /finance/expense-categories
 * Create a category (409 on duplicate name).
 * @param {{ name, description? }} data
 */
export const createExpenseCategory = (data) => api.post('/finance/expense-categories', data);

/**
 * DELETE /finance/expense-categories/:id
 * Soft-delete a category (409 if still referenced by an expense).
 * @param {string} id
 */
export const deleteExpenseCategory = (id) => api.delete(`/finance/expense-categories/${id}`);
