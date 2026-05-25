/**
 * @file AdminProfile.jsx
 * @description Admin / Director portal — own profile view and password change.
 *
 * Data: GET /admin/me
 * Action: PUT /admin/me/password — { currentPassword, newPassword }
 */

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Stack, Divider, Avatar,
  Chip, FormControl, InputLabel, OutlinedInput,
  Button, IconButton, InputAdornment, FormHelperText,
  CircularProgress, Alert, List, ListItem, ListItemIcon,
  ListItemText, Skeleton, Snackbar,
} from '@mui/material';
import { ADMIN_PRIMARY, ADMIN_GRADIENT, ADMIN_SHADOW } from '../../../theme/adminTokens';
import {
  Person, Email, Shield, Lock, Visibility, VisibilityOff,
  CheckCircle, Schedule,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { getAdminMe, updateAdminPassword } from '../../../services/admin_service';
import useFormSnackbar from '../../../hooks/useFormSnackBar';

// ─── Validation ───────────────────────────────────────────────────────────────

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword:     Yup.string()
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Must contain at least one number')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
    .required('Please confirm the new password'),
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
  const [profile,      setProfile]      = useState(null);
  const [profileLoad,  setProfileLoad]  = useState(true);
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  useEffect(() => {
    getAdminMe()
      .then((r) => setProfile(r.data?.data ?? r.data))
      .catch(() => showSnackbar('Failed to load profile.', 'error'))
      .finally(() => setProfileLoad(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword:     '',
      confirmPassword: '',
    },
    validationSchema: passwordSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        await updateAdminPassword({
          currentPassword: values.currentPassword,
          newPassword:     values.newPassword,
        });
        showSnackbar('Password updated successfully.', 'success');
        resetForm();
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Failed to update password.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const busy = formik.isSubmitting;

  const pwField = (name, label, show, onToggle) => (
    <FormControl size="small" fullWidth error={formik.touched[name] && Boolean(formik.errors[name])}>
      <InputLabel htmlFor={name}>{label}</InputLabel>
      <OutlinedInput
        id={name}
        name={name}
        type={show ? 'text' : 'password'}
        label={label}
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        disabled={busy}
        sx={{ borderRadius: 2 }}
        endAdornment={
          <InputAdornment position="end">
            <IconButton onClick={onToggle} edge="end" disabled={busy} size="small">
              {show ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        }
      />
      {formik.touched[name] && formik.errors[name] && (
        <FormHelperText>{formik.errors[name]}</FormHelperText>
      )}
    </FormControl>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>My Profile</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Your platform account details and security settings.
      </Typography>

      <Stack spacing={3}>

        {/* ── Profile card ──────────────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          {/* Header */}
          <Box sx={{ p: 3, background: ADMIN_GRADIENT, color: 'white' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 64, height: 64,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.4)',
                  fontSize: '1.6rem', fontWeight: 700,
                }}
              >
                {profileLoad
                  ? <Person />
                  : (profile?.admin_name?.[0]?.toUpperCase() ?? 'A')}
              </Avatar>
              <Box>
                {profileLoad ? (
                  <>
                    <Skeleton width={160} height={28} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                    <Skeleton width={120} height={20} sx={{ bgcolor: 'rgba(255,255,255,0.15)', mt: 0.5 }} />
                  </>
                ) : (
                  <>
                    <Typography variant="h6" fontWeight={700}>{profile?.admin_name}</Typography>
                    <Chip
                      label={profile?.role === 'DIRECTOR' ? 'Director' : 'Platform Admin'}
                      size="small"
                      icon={<Shield sx={{ fontSize: '0.75rem !important', color: 'white !important' }} />}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                        border: '1px solid rgba(255,255,255,0.3)',
                        mt: 0.5,
                      }}
                    />
                  </>
                )}
              </Box>
            </Stack>
          </Box>

          {/* Details */}
          <Box sx={{ p: 2.5 }}>
            {profileLoad ? (
              <Stack spacing={1}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} variant="text" height={40} />
                ))}
              </Stack>
            ) : (
              <List disablePadding>
                <DetailItem
                  icon={<Email color="action" fontSize="small" />}
                  primary="Email"
                  secondary={profile?.email}
                />
                <DetailItem
                  icon={<Shield color="action" fontSize="small" />}
                  primary="Role"
                  secondary={profile?.role}
                />
                <DetailItem
                  icon={<CheckCircle color="action" fontSize="small" />}
                  primary="Status"
                  secondary={profile?.status}
                />
                <DetailItem
                  icon={<Schedule color="action" fontSize="small" />}
                  primary="Last Login"
                  secondary={profile?.lastLogin
                    ? new Date(profile.lastLogin).toLocaleString()
                    : 'Not recorded'}
                />
              </List>
            )}
          </Box>
        </Paper>

        {/* ── Change password ───────────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Lock sx={{ color: ADMIN_PRIMARY }} />
            <Typography variant="subtitle1" fontWeight={700}>Change Password</Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2}>
              {pwField('currentPassword', 'Current Password',     showCurrent, () => setShowCurrent((p) => !p))}
              {pwField('newPassword',     'New Password',         showNew,     () => setShowNew((p) => !p))}
              {pwField('confirmPassword', 'Confirm New Password', showConfirm, () => setShowConfirm((p) => !p))}

              <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>
                Password must be at least 8 characters, contain one uppercase letter and one number.
              </Alert>

              <Button
                type="submit"
                variant="contained"
                disabled={busy}
                startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <Lock />}
                sx={{
                  textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1.2,
                  background: ADMIN_GRADIENT, boxShadow: ADMIN_SHADOW,
                  alignSelf: 'flex-start',
                }}
              >
                {busy ? 'Updating…' : 'Update Password'}
              </Button>
            </Stack>
          </Box>
        </Paper>

      </Stack>

      {/* ── Snackbar ─────────────────────────────────────────────────────────── */}
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
