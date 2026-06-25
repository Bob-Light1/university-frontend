/**
 * @file IncomeFormDialog.jsx
 * @description Create / edit an income record (POST /incomes, PATCH /incomes/:id).
 * Validated with incomeSchema. The student link is optional (async picker).
 */

import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack,
  TextField, Typography, CircularProgress, FormControl, InputLabel,
  Select, MenuItem, Box,
} from '@mui/material';
import { ReceiptLong } from '@mui/icons-material';

import { incomeSchema } from '../../../yupSchema/financeSchemas';
import { CurrencySelect, PaymentMethodSelect, StudentPicker } from './financeShared';
import { useFinanceLabels } from './useFinanceLabels';
import FinanceAttachments from './FinanceAttachments';
import {
  INCOME_SOURCES, INCOME_STATUSES, DEFAULT_CURRENCY,
} from './financeConstants';

const ROUNDED = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };
const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const IncomeFormDialog = ({ open, income, campusId, onClose, onSubmit }) => {
  const { t } = useTranslation('finance');
  const { incomeStatus: incomeStatusLabel } = useFinanceLabels();
  const editing = Boolean(income?._id);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title: income?.title ?? '',
      source: income?.source ?? '',
      amount: income?.amount ?? '',
      currency: income?.currency ?? DEFAULT_CURRENCY,
      paymentMethod: income?.paymentMethod ?? '',
      incomeDate: toDateInput(income?.incomeDate) || new Date().toISOString().slice(0, 10),
      status: income?.status ?? 'received',
      student: income?.student ?? null,   // populated student object (or null)
      reference: income?.reference ?? '',
      description: income?.description ?? '',
      attachments: Array.isArray(income?.attachments) ? income.attachments : [],
      notes: income?.notes ?? '',
    },
    validate: async (values) => {
      try {
        await incomeSchema.validate(
          { ...values, student: values.student?._id ?? '' },
          { abortEarly: false },
        );
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
        title: values.title.trim(),
        source: values.source,
        amount: Number(values.amount),
        currency: values.currency,
        paymentMethod: values.paymentMethod,
        incomeDate: values.incomeDate,
        status: values.status,
        student: values.student?._id || undefined,
        reference: values.reference?.trim() || undefined,
        description: values.description?.trim() || undefined,
        attachments: values.attachments,
        notes: values.notes?.trim() || undefined,
      };
      try {
        await onSubmit(payload);
        onClose();
      } catch (err) {
        setStatus(err.response?.data?.message || t('incomeForm.saveError'));
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
          <ReceiptLong sx={{ color: 'success.main' }} />
          <Typography variant="h6" fontWeight={700}>{editing ? t('incomeForm.titleEdit') : t('incomeForm.titleNew')}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          {formik.status && (
            <Typography variant="body2" color="error">{formik.status}</Typography>
          )}

          <TextField
            fullWidth name="title" label={`${t('fields.title')} *`}
            value={formik.values.title}
            onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={Boolean(fieldError('title'))} helperText={fieldError('title')}
            sx={ROUNDED}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth error={Boolean(fieldError('source'))}>
              <InputLabel>{`${t('fields.source')} *`}</InputLabel>
              <Select name="source" label={`${t('fields.source')} *`} value={formik.values.source} onChange={formik.handleChange} sx={{ borderRadius: 2 }}>
                {INCOME_SOURCES.map((s) => <MenuItem key={s} value={s}>{t(`enums.incomeSource.${s}`)}</MenuItem>)}
              </Select>
              {fieldError('source') && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{formik.errors.source}</Typography>
              )}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('fields.status')}</InputLabel>
              <Select name="status" label={t('fields.status')} value={formik.values.status} onChange={formik.handleChange} sx={{ borderRadius: 2 }}>
                {INCOME_STATUSES.map((s) => <MenuItem key={s} value={s}>{incomeStatusLabel[s]}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>

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
              fullWidth name="incomeDate" label={`${t('fields.date')} *`} type="date"
              value={formik.values.incomeDate}
              onChange={formik.handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
              error={Boolean(fieldError('incomeDate'))} helperText={fieldError('incomeDate')}
              sx={ROUNDED}
            />
          </Stack>

          <StudentPicker
            value={formik.values.student}
            campusId={campusId}
            label={t('incomeForm.studentOptional')}
            onChange={(v) => formik.setFieldValue('student', v)}
          />

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
          variant="contained" color="success" disabled={formik.isSubmitting}
          onClick={() => formik.handleSubmit()}
          startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <ReceiptLong />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {formik.isSubmitting ? t('actions.saving') : editing ? t('incomeForm.submitEdit') : t('incomeForm.submitNew')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IncomeFormDialog;
