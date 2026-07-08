/**
 * @file AnnouncementFormDialog.jsx
 * @description Reusable create/edit dialog for announcements.
 * Used by admin, campus-manager, and staff portals.
 */

import { useEffect } from 'react';
import { useFormik } from 'formik';
import {
  Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, FormControlLabel, Checkbox,
  Stack, Chip, Box, Typography, CircularProgress,
  ToggleButton, ToggleButtonGroup, IconButton, useMediaQuery,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { announcementSchema } from '../../yupSchema/announcementSchema';
import { TYPE_OPTIONS, ROLE_OPTIONS } from './announcementConstants';
import { useAppTranslation } from '../../hooks/useAppTranslation';

const defaultValues = {
  title:       '',
  content:     '',
  type:        'info',
  targetRoles: ['ALL'],
  pinned:      false,
  pinnedUntil: '',
  expiresAt:   '',
};

/**
 * Convert a calendar-day input ("YYYY-MM-DD") to an end-of-day local ISO
 * timestamp. Keeps a same-day deadline strictly in the future (the announcement
 * stays live through the whole chosen day) instead of expiring at 00:00 UTC.
 */
const endOfDayISO = (dateStr) =>
  dateStr ? new Date(`${dateStr}T23:59:59.999`).toISOString() : null;

export default function AnnouncementFormDialog({
  open,
  onClose,
  onSubmit,
  initialValues,
  mode = 'create',
}) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t }    = useAppTranslation(['announcements', 'common']);

  const formik = useFormik({
    initialValues: initialValues
      ? {
          title:       initialValues.title       || '',
          content:     initialValues.content     || '',
          type:        initialValues.type        || 'info',
          targetRoles: initialValues.targetRoles || ['ALL'],
          pinned:      initialValues.pinned      || false,
          pinnedUntil: initialValues.pinnedUntil
            ? initialValues.pinnedUntil.slice(0, 10)
            : '',
          expiresAt:   initialValues.expiresAt
            ? initialValues.expiresAt.slice(0, 10)
            : '',
        }
      : defaultValues,
    validationSchema: announcementSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, setStatus }) => {
      try {
        await onSubmit({
          ...values,
          // Auto-unpin only applies while pinned.
          pinnedUntil: values.pinned ? endOfDayISO(values.pinnedUntil) : null,
          expiresAt:   endOfDayISO(values.expiresAt),
        });
        onClose();
      } catch (err) {
        setStatus({ error: err.response?.data?.message || t('form.saveFailed') });
      } finally {
        setSubmitting(false);
      }
    },
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!open) formik.resetForm(); }, [open]);

  const toggleRole = (role) => {
    const current = formik.values.targetRoles;
    if (role === 'ALL') {
      formik.setFieldValue('targetRoles', ['ALL']);
      return;
    }
    const withoutAll = current.filter((r) => r !== 'ALL');
    const next = withoutAll.includes(role)
      ? withoutAll.filter((r) => r !== role)
      : [...withoutAll, role];
    formik.setFieldValue('targetRoles', next.length === 0 ? ['ALL'] : next);
  };

  const isSelected = (role) => formik.values.targetRoles.includes(role);

  return (
    <Dialog
      open={open}
      onClose={formik.isSubmitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableEnforceFocus
      closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {mode === 'create' ? t('form.newTitle') : t('form.editTitle')}
        {isMobile && (
          <IconButton onClick={onClose} disabled={formik.isSubmitting} size="small" edge="end">
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2.5}>

            {/* Server-side / network error */}
            {formik.status?.error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {formik.status.error}
              </Alert>
            )}

            {/* Title */}
            <TextField
              label={t('form.title')}
              name="title"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={
                (formik.touched.title && formik.errors.title) ||
                t('form.counter', { current: String(formik.values.title.length), max: '150' })
              }
              fullWidth
              required
              size="small"
            />

            {/* Content */}
            <TextField
              label={t('form.content')}
              name="content"
              value={formik.values.content}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.content && Boolean(formik.errors.content)}
              helperText={
                (formik.touched.content && formik.errors.content) ||
                t('form.counter', { current: String(formik.values.content.length), max: '3000' })
              }
              multiline
              rows={5}
              fullWidth
              required
              size="small"
            />

            {/* Type */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                {t('form.type')}
              </Typography>
              <ToggleButtonGroup
                value={formik.values.type}
                exclusive
                onChange={(_, val) => val && formik.setFieldValue('type', val)}
                size="small"
                sx={{ flexWrap: 'wrap', gap: 0.5 }}
              >
                {TYPE_OPTIONS.map(({ value, labelKey, color, Icon }) => (
                  <ToggleButton
                    key={value}
                    value={value}
                    color={color}
                    sx={{
                      borderRadius: '20px !important',
                      border: '1px solid !important',
                      px: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    <Icon sx={{ fontSize: 16, mr: 0.5 }} />
                    {t(labelKey)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Target Audience */}
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                {t('form.targetAudience')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {ROLE_OPTIONS.map(({ value, labelKey }) => (
                  <Chip
                    key={value}
                    label={t(labelKey)}
                    onClick={() => toggleRole(value)}
                    color={isSelected(value) ? 'primary' : 'default'}
                    variant={isSelected(value) ? 'filled' : 'outlined'}
                    size="small"
                    clickable
                    sx={{ fontWeight: 600 }}
                  />
                ))}
              </Box>
              {formik.touched.targetRoles && formik.errors.targetRoles && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {formik.errors.targetRoles}
                </Typography>
              )}
            </Box>

            {/* Expiry date */}
            <TextField
              label={t('form.expiresAt')}
              name="expiresAt"
              type="date"
              value={formik.values.expiresAt}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.expiresAt && Boolean(formik.errors.expiresAt)}
              helperText={formik.touched.expiresAt && formik.errors.expiresAt}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />

            {/* Pinned */}
            <FormControlLabel
              control={
                <Checkbox
                  name="pinned"
                  checked={formik.values.pinned}
                  onChange={formik.handleChange}
                  color="primary"
                />
              }
              label={t('form.pin')}
            />

            {formik.values.pinned && (
              <TextField
                label={t('form.autoUnpin')}
                name="pinnedUntil"
                type="date"
                value={formik.values.pinnedUntil}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.pinnedUntil && Boolean(formik.errors.pinnedUntil)}
                helperText={formik.touched.pinnedUntil && formik.errors.pinnedUntil}
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}

          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={onClose}
            disabled={formik.isSubmitting}
            sx={{ textTransform: 'none' }}
          >
            {t('common:action.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <CircularProgress size={16} /> : null}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {mode === 'create' ? t('form.createDraft') : t('form.saveChanges')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
