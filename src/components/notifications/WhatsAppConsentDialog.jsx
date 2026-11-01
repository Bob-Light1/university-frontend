/** @file WhatsAppConsentDialog.jsx @description Explicit phone-bound opt-in, withdrawal and translated scope. */
import { useFormik } from 'formik';
import { Alert, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, TextField, Typography } from '@mui/material';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import { useAuth } from '../../hooks/useAuth';
import useWhatsAppConsent from '../../hooks/useWhatsAppConsent';
import { whatsappConsentSchema } from '../../yupSchema/whatsappConsentSchema';

/** Inner form is remounted for each authenticated identity and each dialog opening. */
function ConsentForm({ onClose }) {
  const { t } = useAppTranslation('notifications');
  const { consent, error, save } = useWhatsAppConsent();
  const formik = useFormik({
    initialValues: { enabled: consent?.enabled || false, phone: consent?.phone || '' },
    enableReinitialize: true,
    validationSchema: whatsappConsentSchema(t),
    onSubmit: async (values) => {
      try { await save({ ...values, version: consent.currentVersion }); onClose(); } catch { /* The translated alert retains the editable form. */ }
    },
  });
  return (
    <form onSubmit={formik.handleSubmit} data-whatsapp-form>
      <DialogTitle>{t('whatsapp.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography>{t('whatsapp.scope')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('whatsapp.withdrawal')}</Typography>
          {error && <Alert severity="error">{t('whatsapp.error')}</Alert>}
          {!consent ? <CircularProgress size={24} /> : <>
            <FormControlLabel control={<Checkbox name="enabled" checked={formik.values.enabled} onChange={formik.handleChange} disabled={formik.isSubmitting} />} label={t('whatsapp.agree')} />
            <TextField name="phone" label={t('whatsapp.phone')} value={formik.values.phone} onChange={formik.handleChange} onBlur={formik.handleBlur}
              disabled={formik.isSubmitting} inputProps={{ dir: 'ltr', maxLength: 16 }}
              error={Boolean(formik.touched.phone && formik.errors.phone)} helperText={formik.touched.phone && formik.errors.phone || t('whatsapp.phoneHelp')} />
          </>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={formik.isSubmitting}>{t('whatsapp.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={!consent || formik.isSubmitting}>{t('whatsapp.save')}</Button>
      </DialogActions>
    </form>
  );
}
/** Shared account-menu and profile entry point for all nine authenticated roles. */
export default function WhatsAppConsentDialog({ open, onClose }) {
  const { user } = useAuth();
  return <Dialog open={open} onClose={onClose} disableEnforceFocus closeAfterTransition={false} fullWidth maxWidth="sm"
    slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
    {open && <ConsentForm key={`${user?.role}:${user?.id}`} onClose={onClose} />}
  </Dialog>;
}
