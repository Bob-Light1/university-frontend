import { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Avatar, Stack, Divider,
  Chip, CircularProgress, Alert, Button, Snackbar,
  TextField, Switch, FormControlLabel, MenuItem, Select,
  FormControl, InputLabel,
} from '@mui/material';
import {
  Edit, Save, Cancel, Phone, Email, Language,
  NotificationsActive, Home, Lock,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { getMe, updateMyProfile, changeMyPassword } from '../../../services/parentService';
import { IMAGE_BASE_URL } from '../../../config/env';
import LanguagePreferencesSection from '../../../components/shared/LanguagePreferencesSection';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const profileUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const LANGUAGE_OPTIONS = [
  { value: 'en',    label: 'English'  },
  { value: 'fr',    label: 'Français' },
  { value: 'es',    label: 'Español'  },
  { value: 'ar',    label: 'العربية'  },
  { value: 'zh-CN', label: '中文'     },
  { value: 'de',    label: 'Deutsch'  },
];

// ─── Profile Edit Form ────────────────────────────────────────────────────────

const ProfileForm = ({ parent, onSaved, onCancel }) => {
  const theme = useTheme();

  const formik = useFormik({
    initialValues: {
      phone:             parent.phone             || '',
      preferredLanguage: parent.preferredLanguage || 'fr',
      notifEmail:    parent.notificationPrefs?.email    ?? true,
      notifWhatsapp: parent.notificationPrefs?.whatsapp ?? false,
      street:     parent.address?.street     || '',
      city:       parent.address?.city       || '',
      state:      parent.address?.state      || '',
      country:    parent.address?.country    || '',
      postalCode: parent.address?.postalCode || '',
    },
    validationSchema: Yup.object({
      phone: Yup.string()
        .matches(/^\+?[0-9\s()-]{6,20}$/, 'Please enter a valid phone number')
        .required('Phone number is required'),
      preferredLanguage: Yup.string()
        .oneOf(['en', 'fr', 'es', 'ar', 'zh-CN', 'de']).required(),
    }),
    validateOnChange: true,
    validateOnBlur:   true,

    onSubmit: async (values) => {
      const payload = {
        phone:             values.phone,
        preferredLanguage: values.preferredLanguage,
        notificationPrefs: {
          inapp:    true, // baseline inbox — always on
          email:    values.notifEmail,
          whatsapp: values.notifWhatsapp,
        },
        address: {
          street:     values.street     || null,
          city:       values.city       || null,
          state:      values.state      || null,
          country:    values.country    || null,
          postalCode: values.postalCode || null,
        },
      };

      await updateMyProfile(payload);
      onSaved();
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <Grid container spacing={2}>

        <Grid size={{ xs: 12 }}>
          <Typography variant="overline" color="primary" fontWeight={700}>
            Contact
          </Typography>
          <Divider sx={{ mb: 2, mt: 0.5 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            size="small"
            name="phone"
            label="Phone Number"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
            slotProps={{ input: { startAdornment: <Phone fontSize="small" sx={{ mr: 1, color: 'action.active' }} /> } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
            <InputLabel>Preferred Language</InputLabel>
            <Select
              name="preferredLanguage"
              value={formik.values.preferredLanguage}
              label="Preferred Language"
              onChange={formik.handleChange}
            >
              {LANGUAGE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="overline" color="primary" fontWeight={700}>
            Address <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography>
          </Typography>
          <Divider sx={{ mb: 2, mt: 0.5 }} />
        </Grid>

        {[
          { name: 'street',     label: 'Street'      },
          { name: 'city',       label: 'City'        },
          { name: 'state',      label: 'State'       },
          { name: 'country',    label: 'Country'     },
          { name: 'postalCode', label: 'Postal Code' },
        ].map(({ name, label }) => (
          <Grid key={name} size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth size="small"
              name={name} label={label}
              value={formik.values[name]}
              onChange={formik.handleChange}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        ))}

        <Grid size={{ xs: 12 }}>
          <Typography variant="overline" color="primary" fontWeight={700}>
            Notification Preferences
          </Typography>
          <Divider sx={{ mb: 1, mt: 0.5 }} />
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <FormControlLabel
              control={<Switch checked disabled />}
              label="In-app (always on)"
            />
            <FormControlLabel
              control={<Switch name="notifEmail" checked={formik.values.notifEmail} onChange={formik.handleChange} />}
              label="Email"
            />
            <FormControlLabel
              control={<Switch name="notifWhatsapp" checked={formik.values.notifWhatsapp} onChange={formik.handleChange} />}
              label="WhatsApp"
            />
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" startIcon={<Cancel />} onClick={onCancel}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained" type="submit"
              startIcon={formik.isSubmitting ? <CircularProgress size={18} color="inherit" /> : <Save />}
              disabled={formik.isSubmitting || !formik.isValid}
              sx={{ borderRadius: 2, textTransform: 'none', boxShadow: theme.shadows[4] }}
            >
              {formik.isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </Stack>
        </Grid>

      </Grid>
    </form>
  );
};

// ─── Password Change Form ─────────────────────────────────────────────────────

const PasswordForm = ({ onSaved, onCancel }) => {
  const theme = useTheme();

  const formik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword:     '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string().required('Current password is required'),
      newPassword: Yup.string()
        .min(8, 'At least 8 characters')
        .matches(/[A-Z]/, 'One uppercase letter')
        .matches(/[a-z]/, 'One lowercase letter')
        .matches(/[0-9]/, 'One number')
        .required('New password is required'),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
        .required('Please confirm your new password'),
    }),
    validateOnChange: true,
    validateOnBlur:   true,

    onSubmit: async (values, { resetForm }) => {
      await changeMyPassword({
        currentPassword: values.currentPassword,
        newPassword:     values.newPassword,
      });
      onSaved();
      resetForm();
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <Grid container spacing={2}>
        {[
          { name: 'currentPassword', label: 'Current Password' },
          { name: 'newPassword',     label: 'New Password'     },
          { name: 'confirmPassword', label: 'Confirm New Password' },
        ].map(({ name, label }) => (
          <Grid key={name} size={{ xs: 12 }}>
            <TextField
              fullWidth size="small"
              name={name} label={label} type="password"
              value={formik.values[name]}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched[name] && Boolean(formik.errors[name])}
              helperText={formik.touched[name] && formik.errors[name]}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        ))}
        <Grid size={{ xs: 12 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button variant="outlined" startIcon={<Cancel />} onClick={onCancel}
              sx={{ borderRadius: 2, textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained" type="submit" color="warning"
              startIcon={formik.isSubmitting ? <CircularProgress size={18} color="inherit" /> : <Lock />}
              disabled={formik.isSubmitting || !formik.isValid}
              sx={{ borderRadius: 2, textTransform: 'none', boxShadow: theme.shadows[4] }}
            >
              {formik.isSubmitting ? 'Updating…' : 'Update Password'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ParentProfile = () => {
  const [parent,    setParent]    = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [editMode,  setEditMode]  = useState(false);
  const [pwdMode,   setPwdMode]   = useState(false);
  const [snackbar,  setSnackbar]  = useState({ open: false, message: '', severity: 'success' });

  const showSnack = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const fetchProfile = () => {
    setLoading(true);
    getMe()
      .then(({ data }) => setParent(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile.'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchProfile, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!parent) return null;

  const avatarUrl = profileUrl(parent.profileImage);

  const languageLabel = {
    en: 'English', fr: 'Français', es: 'Español',
    ar: 'العربية', 'zh-CN': '中文', de: 'Deutsch',
  }[parent.preferredLanguage] ?? parent.preferredLanguage;

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>

      {/* ── Profile Card ───────────────────────────────────────────────────── */}
      <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #1a5276 0%, #2e86c1 100%)',
            color: 'white',
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <Avatar
              src={avatarUrl}
              sx={{ width: 96, height: 96, border: '4px solid white', fontSize: '2rem', fontWeight: 700 }}
            >
              {parent.firstName?.[0]}{parent.lastName?.[0]}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight={700}>
                {parent.firstName} {parent.lastName}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                {parent.email}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                <Chip
                  label={parent.status}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
                />
                <Chip
                  label={parent.parentRef || 'N/A'}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white', fontFamily: 'monospace' }}
                />
                {parent.relationship && (
                  <Chip
                    label={parent.relationship.charAt(0).toUpperCase() + parent.relationship.slice(1)}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }}
                  />
                )}
              </Stack>
            </Box>
            {!editMode && !pwdMode && (
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setEditMode(true)}
                sx={{
                  color: 'white', borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
                  borderRadius: 2, textTransform: 'none',
                }}
              >
                Edit Profile
              </Button>
            )}
          </Stack>
        </Box>

        {/* Read-only info row */}
        {!editMode && !pwdMode && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Phone fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Phone</Typography>
                    <Typography variant="body2" fontWeight={600}>{parent.phone}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Language fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Language</Typography>
                    <Typography variant="body2" fontWeight={600}>{languageLabel}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <NotificationsActive fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">Notifications</Typography>
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                      {[['inapp', 'IN-APP'], ['email', 'EMAIL'], ['whatsapp', 'WHATSAPP']].map(([k, lbl]) => (
                        <Chip
                          key={k}
                          label={lbl}
                          size="small"
                          color={parent.notificationPrefs?.[k] ? 'primary' : 'default'}
                          variant={parent.notificationPrefs?.[k] ? 'filled' : 'outlined'}
                          sx={{ height: 18, fontSize: '0.6rem' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Grid>

              {parent.address && Object.values(parent.address).some(Boolean) && (
                <Grid size={{ xs: 12 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Home fontSize="small" color="action" sx={{ mt: 0.3 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Address</Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {[
                          parent.address.street,
                          parent.address.city,
                          parent.address.state,
                          parent.address.postalCode,
                          parent.address.country,
                        ].filter(Boolean).join(', ')}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              )}
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Button
              variant="outlined"
              startIcon={<Lock />}
              color="warning"
              onClick={() => setPwdMode(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Change Password
            </Button>
          </Box>
        )}

        {/* Edit Profile Form */}
        {editMode && (
          <Box sx={{ p: 3 }}>
            <ProfileForm
              parent={parent}
              onSaved={() => {
                setEditMode(false);
                showSnack('Profile updated successfully.');
                fetchProfile();
              }}
              onCancel={() => setEditMode(false)}
            />
          </Box>
        )}

        {/* Change Password Form */}
        {pwdMode && (
          <Box sx={{ p: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <Lock color="warning" />
              <Typography variant="subtitle1" fontWeight={700}>
                Change Password
              </Typography>
            </Stack>
            <PasswordForm
              onSaved={() => {
                setPwdMode(false);
                showSnack('Password updated successfully.');
              }}
              onCancel={() => setPwdMode(false)}
            />
          </Box>
        )}
      </Paper>

      {/* Campus info */}
      {parent.schoolCampus && (
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Email fontSize="small" color="primary" />
            <Box>
              <Typography variant="caption" color="text.secondary">Campus</Typography>
              <Typography variant="body2" fontWeight={600}>
                {parent.schoolCampus.campus_name || 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Language & Region */}
      <Box sx={{ mt: 3 }}>
        <LanguagePreferencesSection />
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ParentProfile;
