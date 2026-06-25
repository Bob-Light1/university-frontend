/**
 * @file PaymentDialog.jsx
 * @description Record-a-payment dialog (POST /finance/fees/:id/payments).
 *
 * The amount is validated client-side against the current remaining balance
 * (the server stays authoritative). On a concurrency conflict — the backend
 * returns 400 "balance changed concurrently" when a competing payment lands
 * first — we surface a clear retry prompt and ask the parent to re-fetch.
 */

import { useMemo } from 'react';
import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack,
  TextField, Typography, CircularProgress, Alert, Box,
} from '@mui/material';
import { Payment } from '@mui/icons-material';

import { buildPaymentSchema } from '../../../yupSchema/financeSchemas';
import { PaymentMethodSelect } from './financeShared';
import { formatMoney } from './financeConstants';

const ROUNDED = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const PaymentDialog = ({ open, fee, onClose, onSubmit }) => {
  const { t } = useTranslation('finance');
  const balance = useMemo(
    () => Math.max(0, (fee?.amountDue ?? 0) - (fee?.amountPaid ?? 0)),
    [fee],
  );
  const schema = useMemo(() => buildPaymentSchema(balance), [balance]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: { amount: '', method: '', reference: '', paidAt: '', notes: '' },
    validate: async (values) => {
      try {
        await schema.validate(values, { abortEarly: false });
        return {};
      } catch (err) {
        const errors = {};
        (err.inner ?? []).forEach((e) => {
          if (e.path && !errors[e.path]) errors[e.path] = e.message;
        });
        return errors;
      }
    },
    onSubmit: async (values, { setSubmitting, resetForm, setStatus }) => {
      setStatus(null);
      try {
        await onSubmit({
          amount: Number(values.amount),
          method: values.method,
          reference: values.reference?.trim() || undefined,
          paidAt: values.paidAt || undefined,
          notes: values.notes?.trim() || undefined,
        });
        resetForm();
        onClose();
      } catch (err) {
        // 400/409 with a concurrency or overpay message → keep the dialog open
        // with a clear, actionable error (the parent re-fetches the fee).
        setStatus(err.response?.data?.message || t('payment.failed'));
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClose = () => { document.activeElement?.blur(); formik.resetForm(); onClose(); };
  const fieldError = (name) => formik.touched[name] && formik.errors[name];

  return (
    <Dialog
      open={open} onClose={handleClose} maxWidth="sm" fullWidth
      disableEnforceFocus closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Payment sx={{ color: 'success.main' }} />
          <Typography variant="h6" fontWeight={700}>{t('payment.title')}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          {fee && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="body2">
                <strong>{fee.label}</strong> — {t('payment.remainingBalance')}:{' '}
                <strong>{formatMoney(balance, fee.currency)}</strong>
              </Typography>
            </Alert>
          )}

          {formik.status && (
            <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => formik.setStatus(null)}>
              {formik.status}
            </Alert>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth name="amount" label={`${t('fields.amount')} *`} type="number"
              value={formik.values.amount}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={Boolean(fieldError('amount'))} helperText={fieldError('amount')}
              sx={ROUNDED}
            />
            <Box sx={{ width: '100%' }}>
              <PaymentMethodSelect
                fullWidth
                value={formik.values.method}
                onChange={formik.handleChange}
              />
              {fieldError('method') && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {formik.errors.method}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth name="reference" label={t('payment.referenceLabel')}
              value={formik.values.reference}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={Boolean(fieldError('reference'))} helperText={fieldError('reference')}
              sx={ROUNDED}
            />
            <TextField
              fullWidth name="paidAt" label={t('payment.paymentDate')} type="date"
              value={formik.values.paidAt}
              onChange={formik.handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={ROUNDED}
            />
          </Stack>

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
          variant="contained" color="success"
          disabled={formik.isSubmitting || balance <= 0}
          onClick={() => formik.handleSubmit()}
          startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Payment />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {formik.isSubmitting ? t('payment.recording') : t('payment.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;
