/**
 * @file FeeFormDialog.jsx
 * @description Create-a-student-debt dialog (POST /finance/fees).
 * Validated with feeSchema. The campus is injected server-side / by the hook.
 */

import { useFormik } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack,
  TextField, Typography, CircularProgress, Box,
} from '@mui/material';
import { AddCard } from '@mui/icons-material';

import { feeSchema } from '../../../yupSchema/financeSchemas';
import { CurrencySelect, StudentPicker } from './financeShared';
import { DEFAULT_CURRENCY } from './financeConstants';

const ROUNDED = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const FeeFormDialog = ({ open, campusId, onClose, onSubmit }) => {
  const { t } = useTranslation('finance');
  const formik = useFormik({
    initialValues: {
      student: null,        // selected student object (picker)
      label: '',
      amountDue: '',
      currency: DEFAULT_CURRENCY,
      academicYear: '',
      dueDate: '',
      notes: '',
    },
    // Validate manually: the picker holds a student object, but the schema
    // expects the ObjectId string — so we adapt the shape before validating.
    validate: async (values) => {
      try {
        await feeSchema.validate(
          { ...values, student: values.student?._id ?? '' },
          { abortEarly: false },
        );
        return {};
      } catch (err) {
        const errors = {};
        (err.inner ?? []).forEach((e) => {
          if (e.path && !errors[e.path]) errors[e.path] = e.message;
        });
        return errors;
      }
    },
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await onSubmit({
          student: values.student?._id,
          label: values.label.trim(),
          amountDue: Number(values.amountDue),
          currency: values.currency,
          academicYear: values.academicYear?.trim() || undefined,
          dueDate: values.dueDate || null,
          notes: values.notes?.trim() || undefined,
        });
        resetForm();
        onClose();
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
          <AddCard sx={{ color: 'info.main' }} />
          <Typography variant="h6" fontWeight={700}>{t('feeForm.title')}</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          <Box>
            <StudentPicker
              value={formik.values.student}
              campusId={campusId}
              onChange={(v) => formik.setFieldValue('student', v)}
            />
            {fieldError('student') && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {formik.errors.student}
              </Typography>
            )}
          </Box>

          <TextField
            fullWidth name="label" label={`${t('fields.label')} *`}
            placeholder={t('placeholders.feeLabel')}
            value={formik.values.label}
            onChange={formik.handleChange} onBlur={formik.handleBlur}
            error={Boolean(fieldError('label'))} helperText={fieldError('label')}
            sx={ROUNDED}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth name="amountDue" label={`${t('fields.amountDue')} *`} type="number"
              value={formik.values.amountDue}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={Boolean(fieldError('amountDue'))} helperText={fieldError('amountDue')}
              sx={ROUNDED}
            />
            <CurrencySelect
              fullWidth
              value={formik.values.currency}
              onChange={formik.handleChange}
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth name="academicYear" label={t('fields.academicYear')}
              placeholder={t('placeholders.academicYear')}
              value={formik.values.academicYear}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={Boolean(fieldError('academicYear'))} helperText={fieldError('academicYear')}
              sx={ROUNDED}
            />
            <TextField
              fullWidth name="dueDate" label={t('fields.dueDate')} type="date"
              value={formik.values.dueDate}
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
          variant="contained" disabled={formik.isSubmitting}
          onClick={() => formik.handleSubmit()}
          startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AddCard />}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {formik.isSubmitting ? t('feeForm.creating') : t('feeForm.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeeFormDialog;
