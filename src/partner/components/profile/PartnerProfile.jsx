/**
 * @file PartnerProfile.jsx
 * @description Partner portal — profile management page.
 *
 * Section 1: Personal info (bio, phone, organization, gender)
 * Section 2: Security (change password — current + new + confirm)
 * Section 3: Identity (read-only: partnerCode, tier, partnerType)
 */

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip, Divider,
  TextField, Button, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Snackbar, IconButton, InputAdornment,
} from '@mui/material';
import {
  Save, Lock, Person, Visibility, VisibilityOff, EmojiEvents, Badge,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { getMe, updateMyProfile, changeMyPassword } from '../../../services/partnerService';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import { TIER_COLOR, BRAND_GRADIENT, BRAND_GRADIENT_BTN, BRAND_ORANGE } from '../../../theme/partnerTokens';
import PhoneInput from '../../../components/shared/PhoneInput';
import { yupPhone, yupPassword, yupConfirmPassword } from '../../../utils/validationRules';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = Yup.object({
  bio:          Yup.string().max(500, 'Max 500 characters').notRequired(),
  phone:        yupPhone(false),
  organization: Yup.string().max(100).notRequired(),
  gender:       Yup.string().oneOf(['male', 'female', '']).notRequired(),
});

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword:     yupPassword(),
  confirmPassword: yupConfirmPassword('newPassword'),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function PartnerProfile() {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showPwd,  setShowPwd]  = useState({ current: false, newPwd: false, confirm: false });
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  useEffect(() => {
    getMe()
      .then((r) => setProfile(r.data?.data ?? r.data))
      .catch(() => showSnackbar('Failed to load profile.', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Profile form ─────────────────────────────────────────────────────────────

  const profileFormik = useFormik({
    initialValues: {
      bio:          profile?.bio          ?? '',
      phone:        profile?.phone        ?? '',
      organization: profile?.organization ?? '',
      gender:       profile?.gender       ?? '',
    },
    validationSchema: profileSchema,
    validateOnBlur:   true,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await updateMyProfile(values);
        setProfile((prev) => ({ ...prev, ...(res.data?.data ?? res.data) }));
        showSnackbar('Profile updated successfully.', 'success');
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Failed to update profile.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // ─── Password form ────────────────────────────────────────────────────────────

  const passwordFormik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: passwordSchema,
    validateOnBlur:   true,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        await changeMyPassword(values);
        showSnackbar('Password changed successfully.', 'success');
        resetForm();
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Failed to change password.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: BRAND_ORANGE }} />
      </Box>
    );
  }

  const tierColor = TIER_COLOR[profile?.tier] ?? TIER_COLOR.silver;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>

      {/* ── Identity header ───────────────────────────────────────────────────── */}
      <Paper
        sx={{
          p: 3, mb: 3, borderRadius: 3,
          background: BRAND_GRADIENT,
          color: 'white',
        }}
      >
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Avatar sx={{ width: 64, height: 64, border: '3px solid rgba(255,255,255,0.5)', fontSize: '1.4rem' }}>
            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {profile?.firstName} {profile?.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>{profile?.email}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              {profile?.partnerCode && (
                <Chip
                  icon={<Badge sx={{ fontSize: 12, color: 'white !important' }} />}
                  label={profile.partnerCode}
                  size="small"
                  sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
                />
              )}
              <Chip
                icon={<EmojiEvents sx={{ fontSize: 12, color: `${tierColor} !important` }} />}
                label={profile?.tier ?? 'bronze'}
                size="small"
                sx={{ textTransform: 'capitalize', bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              />
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* ── Section 1: Personal Info ──────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Person color="action" />
          <Typography variant="subtitle1" fontWeight={700}>Personal Information</Typography>
        </Stack>
        <Divider sx={{ mb: 2.5 }} />

        <form onSubmit={profileFormik.handleSubmit} noValidate>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <PhoneInput
                name="phone"
                label="Phone"
                value={profileFormik.values.phone}
                onChange={(v) => profileFormik.setFieldValue('phone', v)}
                onBlur={profileFormik.handleBlur}
                error={profileFormik.touched.phone && Boolean(profileFormik.errors.phone)}
                helperText={profileFormik.touched.phone && profileFormik.errors.phone}
              />
              <TextField
                fullWidth
                name="organization"
                label="Organization"
                value={profileFormik.values.organization}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>

            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                label="Gender"
                value={profileFormik.values.gender}
                onChange={profileFormik.handleChange}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">Prefer not to say</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              name="bio"
              label="Bio (max 500 characters)"
              value={profileFormik.values.bio}
              onChange={profileFormik.handleChange}
              onBlur={profileFormik.handleBlur}
              error={profileFormik.touched.bio && Boolean(profileFormik.errors.bio)}
              helperText={
                (profileFormik.touched.bio && profileFormik.errors.bio) ||
                `${profileFormik.values.bio.length}/500`
              }
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                disabled={profileFormik.isSubmitting}
                startIcon={
                  profileFormik.isSubmitting
                    ? <CircularProgress size={16} color="inherit" />
                    : <Save />
                }
                sx={{
                  textTransform: 'none', fontWeight: 700, borderRadius: 2,
                  background: BRAND_GRADIENT_BTN,
                }}
              >
                {profileFormik.isSubmitting ? 'Saving…' : 'Save Profile'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

      {/* ── Section 2: Security ───────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
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
              { name: 'confirmPassword', label: 'Confirm New Password', key: 'confirm' },
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
                        <IconButton
                          size="small"
                          onClick={() => setShowPwd((p) => ({ ...p, [key]: !p[key] }))}
                          edge="end"
                        >
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
                startIcon={
                  passwordFormik.isSubmitting
                    ? <CircularProgress size={16} color="inherit" />
                    : <Lock />
                }
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
              >
                {passwordFormik.isSubmitting ? 'Updating…' : 'Update Password'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>

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
