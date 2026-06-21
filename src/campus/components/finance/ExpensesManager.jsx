/**
 * @file ExpensesManager.jsx
 * @description Institutional expenses: paginated list with filters, create/edit,
 * the approval workflow (approve / reject / pay) and a category-management panel.
 *
 * Workflow buttons render only legal transitions (EXPENSE_TRANSITIONS). Illegal
 * transitions and edits to a paid expense return 409 — surfaced via snackbar.
 *
 * Backend: /finance/expenses (+ /approve, /reject, /pay) — campus-scoped.
 */

import { useState } from 'react';
import {
  Box, Stack, Typography, Button, Paper, Alert, Snackbar, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, IconButton, Tooltip, Skeleton, FormControl, InputLabel,
  Select, MenuItem, CircularProgress,
} from '@mui/material';
import {
  Add, Edit, Delete, FilterListOff, Category, CheckCircle, Cancel, Paid, Repeat,
} from '@mui/icons-material';

import useExpenses from '../../../hooks/useExpenses';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import { StatusChip, PeriodSelector } from './financeShared';
import {
  EXPENSE_STATUSES, EXPENSE_STATUS_LABEL, EXPENSE_STATUS_COLOR, EXPENSE_TRANSITIONS,
  formatMoney, formatDate,
} from './financeConstants';
import ExpenseFormDialog from './ExpenseFormDialog';
import ExpenseCategoriesPanel from './ExpenseCategoriesPanel';

const WORKFLOW_META = {
  approve: { label: 'Approve', icon: <CheckCircle fontSize="small" />, color: 'info' },
  pay:     { label: 'Mark paid', icon: <Paid fontSize="small" />, color: 'success' },
  reject:  { label: 'Reject', icon: <Cancel fontSize="small" />, color: 'error' },
};

const ExpensesManager = ({ campusId }) => {
  const {
    expenses, categories, pagination, filters, loading, error,
    fetch, handleFilterChange, handleReset, setPage,
    create, update, transition, remove, createCategory, removeCategory,
  } = useExpenses(campusId);

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();
  const [editing,      setEditing]      = useState(null);   // expense or {} for new
  const [catsOpen,     setCatsOpen]     = useState(false);
  const [busyId,       setBusyId]       = useState(null);

  const handleSubmit = async (payload) => {
    if (editing?._id) {
      await update(editing._id, payload);
      showSnackbar('Expense updated.', 'success');
    } else {
      await create(payload);
      showSnackbar('Expense created.', 'success');
    }
  };

  const handleTransition = async (expense, action) => {
    setBusyId(expense._id);
    try {
      await transition(expense._id, action);
      showSnackbar(`Expense ${action === 'pay' ? 'paid' : `${action}d`}.`, 'success');
    } catch (err) {
      // 409 → illegal transition (e.g. another user moved it first).
      showSnackbar(err.response?.data?.message || 'Action not allowed for the current status.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Delete the expense "${expense.title}"?`)) return;
    setBusyId(expense._id);
    try {
      await remove(expense._id);
      showSnackbar('Expense deleted.', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to delete expense.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>Expenses</Typography>
          <Typography variant="body2" color="text.secondary">
            Record outflows and run them through the approval workflow.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined" startIcon={<Category />} onClick={() => setCatsOpen(true)}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Categories
          </Button>
          <Button
            variant="contained" color="error" startIcon={<Add />} onClick={() => setEditing({})}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}
          >
            New Expense
          </Button>
        </Stack>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <MenuItem value="">All statuses</MenuItem>
            {EXPENSE_STATUSES.map((s) => <MenuItem key={s} value={s}>{EXPENSE_STATUS_LABEL[s]}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
            <MenuItem value="">All categories</MenuItem>
            {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>
        <PeriodSelector
          year={filters.year} month={filters.month}
          onChange={(key, value) => handleFilterChange(key, value)}
        />
        <Button
          size="small" variant="outlined" startIcon={<FilterListOff />} onClick={handleReset}
          sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'center' }}
        >
          Reset
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={fetch}>{error}</Alert>}

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton variant="text" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : expenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No expenses found.
                </TableCell>
              </TableRow>
            ) : (
              expenses.map((exp) => {
                const busy = busyId === exp._id;
                const transitions = EXPENSE_TRANSITIONS[exp.status] ?? [];
                const editable = exp.status !== 'paid';
                return (
                  <TableRow key={exp._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="body2" fontWeight={500}>{exp.title}</Typography>
                        {exp.isRecurring && (
                          <Tooltip title={`Recurring (${exp.recurringPeriod ?? ''})`}>
                            <Repeat sx={{ fontSize: 14, color: 'text.secondary' }} />
                          </Tooltip>
                        )}
                      </Stack>
                      {exp.reference && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {exp.reference}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={exp.expenseCategory?.name ?? '—'} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} color="error.main">
                        {formatMoney(exp.amount, exp.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatDate(exp.expenseDate)}</TableCell>
                    <TableCell>
                      <StatusChip status={exp.status} labelMap={EXPENSE_STATUS_LABEL} colorMap={EXPENSE_STATUS_COLOR} />
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                        {transitions.map((action) => {
                          const meta = WORKFLOW_META[action];
                          return (
                            <Tooltip key={action} title={meta.label}>
                              <span>
                                <IconButton
                                  size="small" color={meta.color} disabled={busy}
                                  onClick={() => handleTransition(exp, action)}
                                >
                                  {busy ? <CircularProgress size={14} /> : meta.icon}
                                </IconButton>
                              </span>
                            </Tooltip>
                          );
                        })}
                        {editable && (
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary" onClick={() => setEditing(exp)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete">
                          <span>
                            <IconButton size="small" color="error" disabled={busy} onClick={() => handleDelete(exp)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page - 1}
        rowsPerPage={pagination.limit}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, p) => setPage(p + 1)}
        onRowsPerPageChange={(e) => handleFilterChange('limit', parseInt(e.target.value, 10))}
      />

      {/* Dialogs */}
      <ExpenseFormDialog
        open={Boolean(editing)}
        expense={editing?._id ? editing : null}
        categories={categories}
        onClose={() => setEditing(null)}
        onSubmit={handleSubmit}
      />
      <ExpenseCategoriesPanel
        open={catsOpen}
        categories={categories}
        onClose={() => setCatsOpen(false)}
        onCreate={createCategory}
        onDelete={removeCategory}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={closeSnackbar} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ExpensesManager;
