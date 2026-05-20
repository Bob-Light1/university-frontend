/**
 * @file CommissionPayModal.jsx
 * @description Dialog to mark a validated commission as paid.
 *
 * Requires: paymentChannel (always), paymentRef (unless cash).
 *
 * @param {boolean}  open
 * @param {Object}   commission
 * @param {Function} onClose
 * @param {Function} onSuccess(commissionId, { paymentChannel, paymentRef, notes })
 */

import { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, FormControl, InputLabel,
  Select, MenuItem, TextField, FormHelperText,
  CircularProgress, Alert,
} from '@mui/material';
import { AttachMoney, Payment } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import useFormSnackbar from '../../../hooks/useFormSnackBar';

// ─── Payment channel options ──────────────────────────────────────────────────

const CHANNEL_OPTIONS = [
  { value: 'momo_mtn',      label: 'MTN Mobile Money'  },
  { value: 'momo_orange',   label: 'Orange Money'       },
  { value: 'bank_transfer', label: 'Bank Transfer'      },
  { value: 'cash',          label: 'Cash'               },
  { value: 'other',         label: 'Other'              },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = Yup.object({
  paymentChannel: Yup.string().required('Payment channel is required'),
  paymentRef:     Yup.string().when('paymentChannel', {
    is:        (v) => v && v !== 'cash',
    then:      (s) => s.trim().required('Payment reference is required for non-cash payments'),
    otherwise: (s) => s.notRequired(),
  }),
  notes: Yup.string().max(300).notRequired(),
});

// ─── Component ────────────────────────────────────────────────────────────────

const CommissionPayModal = ({ open, commission, onClose, onSuccess }) => {
  const { showSnackbar } = useFormSnackbar();

  const handleClose = () => {
    document.activeElement?.blur();
    onClose();
  };

  const formik = useFormik({
    initialValues: { paymentChannel: '', paymentRef: '', notes: '' },
    validationSchema: schema,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSuccess(commission._id, values);
        resetForm();
        handleClose();
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Failed to mark commission as paid.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (!open) formik.resetForm();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!commission) return null;

  const isCash   = formik.values.paymentChannel === 'cash';
  const amount   = commission.amount?.toLocaleString();
  const currency = commission.currency ?? 'XAF';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AttachMoney sx={{ color: 'success.main' }} />
          <Typography variant="h6" fontWeight={700}>Mark Commission as Paid</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>

          {/* Amount summary */}
          <Alert
            severity="success"
            icon={<Payment />}
            sx={{ borderRadius: 2 }}
          >
            <Typography variant="body2">
              Paying commission of{' '}
              <strong>{amount} {currency}</strong>
              {commission.partner && (
                <> to <strong>{commission.partner.firstName} {commission.partner.lastName}</strong></>
              )}
              {commission.lead && (
                <> for lead <strong>{commission.lead.firstName} {commission.lead.lastName}</strong></>
              )}
            </Typography>
          </Alert>

          {/* Payment channel */}
          <FormControl
            fullWidth
            error={formik.touched.paymentChannel && Boolean(formik.errors.paymentChannel)}
          >
            <InputLabel>Payment Channel *</InputLabel>
            <Select
              name="paymentChannel"
              label="Payment Channel *"
              value={formik.values.paymentChannel}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              sx={{ borderRadius: 2 }}
            >
              {CHANNEL_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
            {formik.touched.paymentChannel && formik.errors.paymentChannel && (
              <FormHelperText>{formik.errors.paymentChannel}</FormHelperText>
            )}
          </FormControl>

          {/* Payment reference — hidden for cash */}
          {!isCash && (
            <TextField
              fullWidth
              name="paymentRef"
              label={`Payment Reference${isCash ? '' : ' *'}`}
              placeholder="Transaction ID, cheque number…"
              value={formik.values.paymentRef}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.paymentRef && Boolean(formik.errors.paymentRef)}
              helperText={formik.touched.paymentRef && formik.errors.paymentRef}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          )}

          {/* Notes */}
          <TextField
            fullWidth
            multiline
            rows={2}
            name="notes"
            label="Notes (optional)"
            value={formik.values.notes}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          color="success"
          disabled={formik.isSubmitting}
          onClick={() => formik.handleSubmit()}
          startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AttachMoney />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {formik.isSubmitting ? 'Saving…' : 'Confirm Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommissionPayModal;
