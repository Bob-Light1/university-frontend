/**
 * @file AdminProfile.jsx
 * @description Admin / Director portal — own profile management.
 *
 * Section 1 : Identity header (photo upload, name, email, role chip)
 * Section 2 : Editable display name
 * Section 3 : Change password
 * Section 4 : Notification preferences
 */

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Stack, Divider,
  Chip, TextField, Button, IconButton, InputAdornment,
  CircularProgress, Alert, Snackbar,
  List, ListItem, ListItemIcon, ListItemText, Skeleton,
} from '@mui/material';
import { ADMIN_PRIMARY, ADMIN_GRADIENT, ADMIN_SHADOW, adminPrimary } from '../../../theme/adminTokens';
import {
  Person, Email, Shield, Lock, Visibility, VisibilityOff,
  CheckCircle, Schedule, Save,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import i18n from '../../../i18n/i18n';
import { yupPassword, yupConfirmPassword } from '../../../utils/validationRules';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

import {
  getAdminMe, updateAdminPassword,
  updateAdminProfile, uploadAdminProfileImage, updateAdminNotifications,
} from '../../../services/admin_service';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import ProfileImageUploader from '../../../components/shared/ProfileImageUploader';
import NotificationPreferences from '../../../components/shared/NotificationPreferences';
import LanguagePreferencesSection from '../../../components/shared/LanguagePreferencesSection';

// ─── Schemas ──────────────────────────────────────────────────────────────────
// Messages are lazy thunks so a language switch is reflected on the next
// validation pass (module-scope schemas would otherwise freeze their language).

const nameSchema = Yup.object({
  admin_name: Yup.string()
    .min(2, () => i18n.t('admin:profile.validation.nameMin'))
    .max(100)
    .required(() => i18n.t('admin:profile.validation.nameRequired')),
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required(() => i18n.t('errors:validation.currentPasswordRequired')),
  newPassword:     yupPassword(),
  confirmPassword: yupConfirmPassword('newPassword'),
});

// ─── DetailItem ───────────────────────────────────────────────────────────────

const DetailItem = ({ icon, primary, secondary }) => (
  <ListItem disablePadding sx={{ py: 0.75 }}>
    <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
    <ListItemText
      primary={primary}
      secondary={secondary || '—'}
      slotProps={{
        primary:   { variant: 'caption', color: 'text.secondary' },
        secondary: { variant: 'body2', fontWeight: 500 },
      }}
    />
  </ListItem>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminProfile() {
  const { t } = useAppTranslation(['admin', 'common']);
  const [profile,     setProfile]     = useState(null);
  const [profileLoad, setProfileLoad] = useState(true);
  const [notifPrefs,  setNotifPrefs]  = useState({ inapp: true, email: true, whatsapp: false });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const isDirector = profile?.role === 'DIRECTOR';

  useEffect(() => {
    getAdminMe()
      .then((r) => {
        const data = r.data?.data ?? r.data;
        setProfile(data);
        if (data?.notificationPrefs) setNotifPrefs(data.notificationPrefs);
      })
      .catch(() => showSnackbar(t('profile.toast.loadFailed'), 'error'))
      .finally(() => setProfileLoad(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Name form ────────────────────────────────────────────────────────────

  const nameFormik = useFormik({
    initialValues: { admin_name: profile?.admin_name ?? '' },
    validationSchema: nameSchema,
    validateOnBlur: true,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await updateAdminProfile({ admin_name: values.admin_name });
        const doc = res.data?.data ?? res.data;
        setProfile((prev) => ({ ...prev, admin_name: doc.admin_name ?? prev.admin_name }));
        showSnackbar(t('profile.toast.updated'), 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || t('profile.toast.updateFailed'), 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ─── Password form ────────────────────────────────────────────────────────

  const passwordFormik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: passwordSchema,
    validateOnBlur: true,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        await updateAdminPassword({
          currentPassword: values.currentPassword,
          newPassword:     values.newPassword,
        });
        showSnackbar(t('profile.toast.passwordUpdated'), 'success');
        resetForm();
      } catch (err) {
        showSnackbar(err.response?.data?.message || t('profile.toast.passwordFailed'), 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ─── Photo upload ─────────────────────────────────────────────────────────

  const handlePhotoUploaded = async (url) => {
    try {
      await uploadAdminProfileImage(url);
      setProfile((prev) => ({ ...prev, profileImage: url }));
      showSnackbar(t('profile.toast.photoUpdated'), 'success');
    } catch {
      showSnackbar(t('profile.toast.photoFailed'), 'error');
    }
  };

  // ─── Notification preferences ─────────────────────────────────────────────

  const handleSaveNotifs = async () => {
    try {
      await updateAdminNotifications(notifPrefs);
      showSnackbar(t('profile.toast.prefsSaved'), 'success');
    } catch {
      showSnackbar(t('profile.toast.prefsFailed'), 'error');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>

      {/* ── Identity header ──────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: ADMIN_GRADIENT, color: 'white' }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <ProfileImageUploader
            currentImage={profile?.profileImage}
            signatureEndpoint="/admin/me/upload-signature"
            onUploaded={handlePhotoUploaded}
            size={72}
          />
          <Box>
            {profileLoad ? (
              <>
                <Skeleton width={160} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                <Skeleton width={120} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.15)', mt: 0.5 }} />
              </>
            ) : (
              <>
                <Typography variant="h6" fontWeight={700}>{profile?.admin_name}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>{profile?.email}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                  <Chip
                    icon={<Shield sx={{ fontSize: 12, color: 'white !important' }} />}
                    label={isDirector ? t('profile.roleDirector') : t('profile.roleAdmin')}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 600 }}
                  />
                  {profile?.status && (
                    <Chip
                      label={t(`common:status.${profile.status}`)}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                    />
                  )}
                </Stack>
              </>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* ── Section 1: Display Name ──────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Person color="action" />
          <Typography variant="subtitle1" fontWeight={700}>{t('profile.personalInfo')}</Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        {profileLoad ? (
          <Stack spacing={1}>
            {[90, 70].map((w, i) => <Skeleton key={i} variant="text" width={`${w}%`} height={40} />)}
          </Stack>
        ) : (
          <>
            <List disablePadding sx={{ mb: 2.5 }}>
              <DetailItem icon={<Email color="action" fontSize="small" />}    primary={t('profile.email')}     secondary={profile?.email} />
              <DetailItem icon={<Shield color="action" fontSize="small" />}   primary={t('profile.role')}      secondary={profile?.role} />
              <DetailItem icon={<CheckCircle color="action" fontSize="small" />} primary={t('profile.status')}  secondary={profile?.status ? t(`common:status.${profile.status}`) : '—'} />
              <DetailItem icon={<Schedule color="action" fontSize="small" />} primary={t('profile.lastLogin')} secondary={profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : t('profile.notRecorded')} />
            </List>
            <Divider sx={{ mb: 2.5 }} />

            <form onSubmit={nameFormik.handleSubmit} noValidate>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label={t('profile.displayName')}
                  name="admin_name"
                  value={nameFormik.values.admin_name}
                  onChange={nameFormik.handleChange}
                  onBlur={nameFormik.handleBlur}
                  error={nameFormik.touched.admin_name && Boolean(nameFormik.errors.admin_name)}
                  helperText={nameFormik.touched.admin_name && nameFormik.errors.admin_name}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={nameFormik.isSubmitting}
                    startIcon={nameFormik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Save />}
                    sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, background: ADMIN_GRADIENT, boxShadow: ADMIN_SHADOW }}
                  >
                    {nameFormik.isSubmitting ? t('profile.saving') : t('profile.saveProfile')}
                  </Button>
                </Box>
              </Stack>
            </form>
          </>
        )}
      </Paper>

      {/* ── Section 2: Password ──────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Lock sx={(th) => ({ color: adminPrimary(th.palette.mode) })} />
          <Typography variant="subtitle1" fontWeight={700}>{t('profile.changePassword')}</Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        <form onSubmit={passwordFormik.handleSubmit} noValidate>
          <Stack spacing={2.5}>
            {[
              { name: 'currentPassword', label: t('profile.currentPassword'), key: 'current' },
              { name: 'newPassword',     label: t('profile.newPassword'),     key: 'newPwd'  },
              { name: 'confirmPassword', label: t('profile.confirmPassword'), key: 'confirm' },
            ].map(({ name, label, key }) => (
              <TextField
                key={name}
                fullWidth
                type={showPwd[key] ? 'text' : 'password'}
                name={name}
                label={label}
                value={passwordFormik.values[name]}
                onChange={passwordFormik.handleChange}
                onBlur={passwordFormik.handleBlur}
                error={passwordFormik.touched[name] && Boolean(passwordFormik.errors[name])}
                helperText={passwordFormik.touched[name] && passwordFormik.errors[name]}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPwd((p) => ({ ...p, [key]: !p[key] }))} edge="end">
                          {showPwd[key] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            ))}

            <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>
              {t('profile.passwordHint')}
            </Alert>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={passwordFormik.isSubmitting}
                startIcon={passwordFormik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Lock />}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, background: ADMIN_GRADIENT, boxShadow: ADMIN_SHADOW }}
              >
                {passwordFormik.isSubmitting ? t('profile.updating') : t('profile.updatePassword')}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* ── Section 3: Notifications ─────────────────────────────────────────── */}
      <NotificationPreferences
        value={notifPrefs}
        onChange={setNotifPrefs}
        onSave={handleSaveNotifs}
        onError={() => showSnackbar(t('profile.toast.prefsFailed'), 'error')}
      />

      {/* ── Section 4: Language & Region ─────────────────────────────────────── */}
      <Box sx={{ mt: 3 }}>
        <LanguagePreferencesSection />
      </Box>

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
}
