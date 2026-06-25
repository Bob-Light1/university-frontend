/**
 * @file StudentProfile.jsx
 * @description Student portal — own profile management.
 *
 * Section 1 : Identity header (read-only: name, email, matricule, class)
 * Section 2 : Personal info  (phone, emergencyContact) + photo upload
 * Section 3 : Change password
 * Section 4 : Notification preferences
 */

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Divider,
  TextField, Button, CircularProgress, Alert, Snackbar,
  IconButton, InputAdornment,
} from '@mui/material';
import { Save, Lock, Person, Badge, Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import {
  getMyProfile, updateMyProfile, changeMyPassword,
  uploadMyProfileImage, updateMyNotifications,
} from '../../../services/studentService';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import PhoneInput from '../../../components/shared/PhoneInput';
import ProfileImageUploader from '../../../components/shared/ProfileImageUploader';
import NotificationPreferences from '../../../components/shared/NotificationPreferences';
import LanguagePreferencesSection from '../../../components/shared/LanguagePreferencesSection';
import { yupPhone, yupPassword, yupConfirmPassword } from '../../../utils/validationRules';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = Yup.object({
  phone:                    yupPhone(false),
  emergencyContact_name:    Yup.string().max(100).notRequired(),
  emergencyContact_phone:   yupPhone(false),
  emergencyContact_relation: Yup.string().max(50).notRequired(),
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword:     yupPassword(),
  confirmPassword: yupConfirmPassword('newPassword'),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentProfile() {
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [notifPrefs, setNotifPrefs] = useState({ inapp: true, email: true, whatsapp: false });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  useEffect(() => {
    getMyProfile()
      .then((r) => {
        const data = r.data?.data ?? r.data;
        setProfile(data);
        if (data?.notificationPrefs) setNotifPrefs(data.notificationPrefs);
      })
      .catch(() => showSnackbar('Failed to load profile.', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Profile form ──────────────────────────────────────────────────────────

  const profileFormik = useFormik({
    initialValues: {
      phone:                     profile?.phone                         ?? '',
      emergencyContact_name:     profile?.emergencyContact?.name        ?? '',
      emergencyContact_phone:    profile?.emergencyContact?.phone       ?? '',
      emergencyContact_relation: profile?.emergencyContact?.relationship ?? '',
    },
    validationSchema: profileSchema,
    validateOnBlur:   true,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          phone: values.phone || null,
          emergencyContact: {
            name:         values.emergencyContact_name     || null,
            phone:        values.emergencyContact_phone    || null,
            relationship: values.emergencyContact_relation || null,
          },
        };
        const res = await updateMyProfile(payload);
        setProfile((prev) => ({ ...prev, ...(res.data?.data ?? res.data) }));
        showSnackbar('Profile updated.', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Failed to update profile.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ─── Password form ─────────────────────────────────────────────────────────

  const passwordFormik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: passwordSchema,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await changeMyPassword(values);
        showSnackbar('Password changed.', 'success');
        resetForm();
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Failed to change password.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ─── Photo upload ──────────────────────────────────────────────────────────

  const handlePhotoUploaded = async (url) => {
    try {
      await uploadMyProfileImage(url);
      setProfile((prev) => ({ ...prev, profileImage: url }));
      showSnackbar('Photo updated.', 'success');
    } catch {
      showSnackbar('Failed to save photo.', 'error');
    }
  };

  // ─── Notification preferences ──────────────────────────────────────────────

  const handleSaveNotifs = async () => {
    try {
      await updateMyNotifications(notifPrefs);
      showSnackbar('Preferences saved.', 'success');
    } catch {
      showSnackbar('Failed to save preferences.', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>

      {/* ── Identity header ──────────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3, background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', color: 'white' }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <ProfileImageUploader
            currentImage={profile?.profileImage}
            signatureEndpoint="/students/me/upload-signature"
            onUploaded={handlePhotoUploaded}
            size={72}
          />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {profile?.firstName} {profile?.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>{profile?.email}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
              {profile?.matricule && (
                <Chip
                  icon={<Badge sx={{ fontSize: 12, color: 'white !important' }} />}
                  label={profile.matricule}
                  size="small"
                  sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
                />
              )}
              {profile?.studentClass?.className && (
                <Chip
                  label={profile.studentClass.className}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
                />
              )}
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* ── Section 1: Personal Info ─────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Person color="action" />
          <Typography variant="subtitle1" fontWeight={700}>Personal Information</Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        <form onSubmit={profileFormik.handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <PhoneInput
              name="phone"
              label="Phone Number"
              value={profileFormik.values.phone}
              onChange={(v) => profileFormik.setFieldValue('phone', v)}
              onBlur={profileFormik.handleBlur}
              error={profileFormik.touched.phone && Boolean(profileFormik.errors.phone)}
              helperText={profileFormik.touched.phone && profileFormik.errors.phone}
            />

            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mt: 1 }}>
              Emergency Contact
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Contact Name"
                name="emergencyContact_name"
                value={profileFormik.values.emergencyContact_name}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                label="Relationship"
                name="emergencyContact_relation"
                value={profileFormik.values.emergencyContact_relation}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>

            <PhoneInput
              name="emergencyContact_phone"
              label="Emergency Phone"
              value={profileFormik.values.emergencyContact_phone}
              onChange={(v) => profileFormik.setFieldValue('emergencyContact_phone', v)}
              onBlur={profileFormik.handleBlur}
              error={profileFormik.touched.emergencyContact_phone && Boolean(profileFormik.errors.emergencyContact_phone)}
              helperText={profileFormik.touched.emergencyContact_phone && profileFormik.errors.emergencyContact_phone}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={profileFormik.isSubmitting}
                startIcon={profileFormik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Save />}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
              >
                {profileFormik.isSubmitting ? 'Saving…' : 'Save Profile'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* ── Section 2: Password ──────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Lock color="action" />
          <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        <form onSubmit={passwordFormik.handleSubmit} noValidate>
          <Stack spacing={2.5}>
            {[
              { name: 'currentPassword', label: 'Current Password', key: 'current' },
              { name: 'newPassword',     label: 'New Password',     key: 'newPwd'  },
              { name: 'confirmPassword', label: 'Confirm Password', key: 'confirm' },
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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="outlined"
                color="error"
                disabled={passwordFormik.isSubmitting}
                startIcon={passwordFormik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Lock />}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
              >
                {passwordFormik.isSubmitting ? 'Updating…' : 'Update Password'}
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
        onError={() => showSnackbar('Failed to save preferences.', 'error')}
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
