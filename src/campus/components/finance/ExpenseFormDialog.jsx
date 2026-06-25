/**
 * @file ExpenseFormDialog.jsx
 * @description Create / edit an expense (POST /expenses, PATCH /expenses/:id).
 * Validated with expenseSchema. Editing a *paid* expense is blocked server-side
 * (409 LOCKED) — surfaced inline here.
 */

import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack,
  TextField, Typography, CircularProgress, FormControl, InputLabel,
  Select, MenuItem, Box, FormControlLabel, Switch,
} from '@mui/material';
import { MoneyOff } from '@mui/icons-material';

import { expenseSchema } from '../../../yupSchema/financeSchemas';
import { CurrencySelect, PaymentMethodSelect } from './financeShared';
import FinanceAttachments from './FinanceAttachments';
import {
  RECURRING_PERIODS, DEFAULT_CURRENCY,
} from './financeConstants';

const ROUNDED = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const ExpenseFormDialog = ({ open, expense, categories = [], onClose, onSubmit }) => {
  const { t } = useTranslation('finance');
  const editing = Boolean(expense?._id);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      expenseCategory: expense?.expenseCategory?._id ?? expense?.expenseCategory ?? '',
      title: expense?.title ?? '',
      amount: expense?.amount ?? '',
      currency: expense?.currency ?? DEFAULT_CURRENCY,
      paymentMethod: expense?.paymentMethod ?? '',
      expenseDate: toDateInput(expense?.expenseDate) || new Date().toISOString().slice(0, 10),
      isRecurring: expense?.isRecurring ?? false,
      recurringPeriod: expense?.recurringPeriod ?? '',
      reference: expense?.reference ?? '',
      description: expense?.description ?? '',
      attachments: Array.isArray(expense?.attachments) ? expense.attachments : [],
      notes: expense?.notes ?? '',
    },
    validate: async (values) => {
      try {
        await expenseSchema.validate(values, { abortEarly: false });
        return {};
      } catch (err) {
        const errors = {};
        (err.inner ?? []).forEach((e) => { if (e.path && !errors[e.path]) errors[e.path] = e.message; });
        return errors;
      }
    },
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      setStatus(null);
      const payload = {
        expenseCategory: values.expenseCategory,
        title: values.title.trim(),
        amount: Number(values.amount),
        currency: values.currency,
        paymentMethod: values.paymentMethod,
        expenseDate: values.expenseDate,
        isRecurring: values.isRecurring,
        recurringPeriod: values.isRecurring ? values.recurringPeriod : undefined,
        reference: values.reference?.trim() || undefined,
        description: values.description?.trim() || undefined,
        attachments: values.attachments,
        notes: values.notes?.trim() || undefined,
      };
      try {
        await onSubmit(payload);
        onClose();
      } catch (err) {
        const msg = err.response?.status === 409
          ? (err.response?.data?.message || t('expenseForm.lockedError'))
          : (err.response?.data?.message || t('expenseForm.saveError'));
        setStatus(msg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClose = () => { document.activeElement?.blur(); onClose(); };
  const fieldError = (name) => formik.touched[name] && formik.errors[name];

  return (
    <Dialog
      open={open} onClose={handleClose} maxWidth="sm" fullWidth
      disableEnforceFocus closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <MoneyOff sx={{ color: 'error.main' }} />
          <Typography variant="h6" fontWeight={700}>{editing ? t('expenseForm.titleEdit') : t('expenseForm.titleNew')}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          {formik.status && <Typography variant="body2" color="error">{formik.status}</Typography>}

          <FormControl fullWidth error={Boolean(fieldError('expenseCategory'))}>
            <InputLabel>{`${t('fields.category')} *`}</InputLabel>
            <Select
              name="expenseCategory" label={`${t('fields.category')} *`}
              value={formik.values.expenseCategory} onChange={formik.handleChange}
              sx={{ borderRadius: 2 }}
            >
              {categories.length === 0 && <MenuItem value="" disabled>{t('expenseForm.noCategories')}</MenuItem>}
              {categories.map((c) => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
            </Select>
            {fieldError('expenseCategory') && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{formik.errors.expenseCategory}</Typography>
            )}
          </FormControl>

          <TextField
            fullWidth name="title" label={`${t('fields.title')} *`}
            value={formik.values.title}
            onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={Boolean(fieldError('title'))} helperText={fieldError('title')}
            sx={ROUNDED}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth name="amount" label={`${t('fields.amount')} *`} type="number"
              value={formik.values.amount}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={Boolean(fieldError('amount'))} helperText={fieldError('amount')}
              sx={ROUNDED}
            />
            <CurrencySelect fullWidth value={formik.values.currency} onChange={formik.handleChange} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Box sx={{ width: '100%' }}>
              <PaymentMethodSelect fullWidth name="paymentMethod" label={`${t('fields.paymentMethod')} *`} value={formik.values.paymentMethod} onChange={formik.handleChange} />
              {fieldError('paymentMethod') && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{formik.errors.paymentMethod}</Typography>
              )}
            </Box>
            <TextField
              fullWidth name="expenseDate" label={`${t('fields.date')} *`} type="date"
              value={formik.values.expenseDate}
              onChange={formik.handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(fieldError('expenseDate'))} helperText={fieldError('expenseDate')}
              sx={ROUNDED}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <FormControlLabel
              control={<Switch name="isRecurring" checked={formik.values.isRecurring} onChange={formik.handleChange} />}
              label={t('fields.recurring')}
            />
            {formik.values.isRecurring && (
              <FormControl fullWidth error={Boolean(fieldError('recurringPeriod'))}>
                <InputLabel>{`${t('fields.period')} *`}</InputLabel>
                <Select name="recurringPeriod" label={`${t('fields.period')} *`} value={formik.values.recurringPeriod} onChange={formik.handleChange} sx={{ borderRadius: 2 }}>
                  {RECURRING_PERIODS.map((p) => <MenuItem key={p} value={p}>{t(`enums.recurringPeriod.${p}`)}</MenuItem>)}
                </Select>
                {fieldError('recurringPeriod') && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{formik.errors.recurringPeriod}</Typography>
                )}
              </FormControl>
            )}
          </Stack>

          <TextField
            fullWidth name="reference" label={t('fields.reference')}
            value={formik.values.reference}
            onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={Boolean(fieldError('reference'))} helperText={fieldError('reference')}
            sx={ROUNDED}
          />

          <FinanceAttachments
            value={formik.values.attachments}
            onChange={(urls) => formik.setFieldValue('attachments', urls)}
            disabled={formik.isSubmitting}
          />

          <TextField
            fullWidth name="notes" label={t('fields.notes')} multiline minRows={2}
            value={formik.values.notes}
            onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={Boolean(fieldError('notes'))} helperText={fieldError('notes')}
            sx={ROUNDED}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>{t('actions.cancel')}</Button>
        <Button
          variant="contained" color="error" disabled={formik.isSubmitting}
          onClick={() => formik.handleSubmit()}
          startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <MoneyOff />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {formik.isSubmitting ? t('actions.saving') : editing ? t('expenseForm.submitEdit') : t('expenseForm.submitNew')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseFormDialog;
