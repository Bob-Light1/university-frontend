/**
 * @file StaffProfile.jsx
 * @description Staff portal — own profile management.
 *
 * Section 1 : Identity header (photo, name, email, sub-role)
 * Section 2 : Personal info (phone)
 * Section 3 : Change password
 * Section 4 : Notification preferences
 */

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Divider,
  TextField, Button, CircularProgress, Alert, Snackbar,
  IconButton, InputAdornment,
} from '@mui/material';
import { Save, Lock, Person, Security, Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import {
  getMyStaffProfile, updateMyStaffProfile, changeMyStaffPassword,
  uploadMyStaffProfileImage, updateMyStaffNotifications,
} from '../../../services/staffService';
import useFormSnackbar    from '../../../hooks/useFormSnackBar';
import PhoneInput         from '../../../components/shared/PhoneInput';
import ProfileImageUploader  from '../../../components/shared/ProfileImageUploader';
import NotificationPreferences from '../../../components/shared/NotificationPreferences';
import LanguagePreferencesSection from '../../../components/shared/LanguagePreferencesSection';
import { yupPhone, yupPassword, yupConfirmPassword } from '../../../utils/validationRules';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

const STAFF_GRADIENT = 'linear-gradient(135deg, #00695C 0%, #26A69A 100%)';
const STAFF_PRIMARY  = '#00695C';

export default function StaffProfile() {
  const { t } = useAppTranslation(['staff', 'common']);

  const profileSchema = Yup.object({
    phone: yupPhone(false),
  });

  const passwordSchema = Yup.object({
    currentPassword: Yup.string().required(t('staff:profile.currentPasswordRequired')),
    newPassword:     yupPassword(),
    confirmPassword: yupConfirmPassword('newPassword'),
  });

  const [profile,    setProfile]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [notifPrefs, setNotifPrefs] = useState({ email: true, sms: false, push: false });
  const [showPwd,    setShowPwd]    = useState({ current: false, newPwd: false, confirm: false });
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  useEffect(() => {
    getMyStaffProfile()
      .then((r) => {
        const data = r.data?.data ?? r.data;
        setProfile(data);
        if (data?.notificationPrefs) setNotifPrefs(data.notificationPrefs);
      })
      .catch(() => showSnackbar(t('staff:profile.loadError'), 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Profile form ──────────────────────────────────────────────────────────

  const profileFormik = useFormik({
    initialValues:  { phone: profile?.phone ?? '' },
    validationSchema: profileSchema,
    validateOnBlur:   true,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await updateMyStaffProfile({ phone: values.phone || null });
        setProfile((prev) => ({ ...prev, ...(res.data?.data ?? res.data) }));
        showSnackbar(t('staff:profile.profileUpdated'), 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || t('staff:profile.updateError'), 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ─── Password form ─────────────────────────────────────────────────────────

  const passwordFormik = useFormik({
    initialValues:    { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: passwordSchema,
    validateOnBlur:   true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await changeMyStaffPassword(values);
        showSnackbar(t('staff:profile.passwordChanged'), 'success');
        resetForm();
      } catch (err) {
        showSnackbar(err.response?.data?.message || t('staff:profile.passwordError'), 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ─── Photo upload ──────────────────────────────────────────────────────────

  const handlePhotoUploaded = async (url) => {
    try {
      await uploadMyStaffProfileImage(url);
      setProfile((prev) => ({ ...prev, profileImage: url }));
      showSnackbar(t('staff:profile.photoUpdated'), 'success');
    } catch {
      showSnackbar(t('staff:profile.photoError'), 'error');
    }
  };

  // ─── Notifications ─────────────────────────────────────────────────────────

  const handleSaveNotifs = async () => {
    try {
      await updateMyStaffNotifications(notifPrefs);
      showSnackbar(t('staff:profile.prefsSaved'), 'success');
    } catch {
      showSnackbar(t('staff:profile.prefsError'), 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const subRole = profile?.subRole;

  const pwdFields = [
    { name: 'currentPassword', label: t('staff:profile.currentPassword'), key: 'current' },
    { name: 'newPassword',     label: t('staff:profile.newPassword'),     key: 'newPwd'  },
    { name: 'confirmPassword', label: t('staff:profile.confirmPassword'), key: 'confirm' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>

      {/* ── Identity header ── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: STAFF_GRADIENT, color: 'white' }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <ProfileImageUploader
            currentImage={profile?.profileImage}
            signatureEndpoint="/staff/me/upload-signature"
            onUploaded={handlePhotoUploaded}
            size={72}
          />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {profile?.firstName} {profile?.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>{profile?.email}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
              {subRole?.name && (
                <Chip
                  icon={<Security sx={{ fontSize: 12, color: 'white !important' }} />}
                  label={subRole.name}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
                />
              )}
              {profile?.schoolCampus?.campus_name && (
                <Chip
                  label={profile.schoolCampus.campus_name}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* ── Section 1: Personal Info ── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Person color="action" />
          <Typography variant="subtitle1" fontWeight={700}>{t('staff:profile.personalInfo')}</Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        <form onSubmit={profileFormik.handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <PhoneInput
              name="phone"
              label={t('staff:profile.phoneNumber')}
              value={profileFormik.values.phone}
              onChange={(v) => profileFormik.setFieldValue('phone', v)}
              onBlur={profileFormik.handleBlur}
              error={profileFormik.touched.phone && Boolean(profileFormik.errors.phone)}
              helperText={profileFormik.touched.phone && profileFormik.errors.phone}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={profileFormik.isSubmitting}
                startIcon={profileFormik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Save />}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, background: STAFF_GRADIENT }}
              >
                {profileFormik.isSubmitting ? t('staff:profile.saving') : t('staff:profile.saveProfile')}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* ── Section 2: Password ── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Lock color="action" />
          <Typography variant="subtitle1" fontWeight={700}>{t('staff:profile.changePassword')}</Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        <form onSubmit={passwordFormik.handleSubmit} noValidate>
          <Stack spacing={2.5}>
            {pwdFields.map(({ name, label, key }) => (
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="outlined"
                color="error"
                disabled={passwordFormik.isSubmitting}
                startIcon={passwordFormik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Lock />}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
              >
                {passwordFormik.isSubmitting ? t('staff:profile.updating') : t('staff:profile.updatePassword')}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* ── Section 3: Notifications ── */}
      <NotificationPreferences
        value={notifPrefs}
        onChange={setNotifPrefs}
        onSave={handleSaveNotifs}
        onError={() => showSnackbar(t('staff:profile.prefsError'), 'error')}
      />

      {/* ── Section 4: Language & Region ── */}
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
