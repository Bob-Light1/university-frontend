/**
 * @file AdminAccounts.jsx
 * @description Admin portal — create new Admin / Director accounts.
 *
 * Note: there is no GET /api/admin/all endpoint yet — the list section
 * shows a placeholder. Account creation uses POST /api/admin/create.
 */

import { useState } from 'react';
import {
  Box, Typography, Paper, Stack, Divider, Alert,
  FormControl, InputLabel, OutlinedInput, Select,
  MenuItem, Button, IconButton, InputAdornment,
  FormHelperText, CircularProgress, Chip,
} from '@mui/material';
import {
  PersonAdd, Visibility, VisibilityOff,
  ManageAccounts, InfoOutlined,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { createAdminAccount } from '../../../services/admin_service';
import useFormSnackbar         from '../../../hooks/useFormSnackBar';

// ─── Validation ───────────────────────────────────────────────────────────────

const schema = Yup.object({
  admin_name:       Yup.string().trim().min(3, 'Minimum 3 characters').required('Name is required'),
  email:            Yup.string().trim().email('Invalid email').required('Email is required'),
  role:             Yup.string().oneOf(['ADMIN', 'DIRECTOR']).required('Role is required'),
  password:         Yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
  confirmPassword:  Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm the password'),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAccounts() {
  const [showPassword, setShowPassword] = useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const formik = useFormik({
    initialValues: {
      admin_name:      '',
      email:           '',
      role:            'ADMIN',
      password:        '',
      confirmPassword: '',
    },
    validationSchema: schema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        await createAdminAccount({
          admin_name: values.admin_name.trim(),
          email:      values.email.trim().toLowerCase(),
          role:       values.role,
          password:   values.password,
        });
        showSnackbar(
          `${values.role === 'DIRECTOR' ? 'Director' : 'Admin'} account created successfully.`,
          'success',
        );
        resetForm();
      } catch (err) {
        showSnackbar(
          err.response?.data?.message || 'Failed to create account.',
          'error',
        );
      } finally {
        setSubmitting(false);
      }
    },
  });

  const busy = formik.isSubmitting;

  const field = (name, label, type = 'text', extra = {}) => (
    <FormControl fullWidth size="small" error={formik.touched[name] && Boolean(formik.errors[name])}>
      <InputLabel htmlFor={name}>{label}</InputLabel>
      <OutlinedInput
        id={name}
        name={name}
        type={type}
        label={label}
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        disabled={busy}
        sx={{ borderRadius: 2 }}
        {...extra}
      />
      {formik.touched[name] && formik.errors[name] && (
        <FormHelperText>{formik.errors[name]}</FormHelperText>
      )}
    </FormControl>
  );

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setShowPassword((p) => !p)}
        edge="end"
        disabled={busy}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>

      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Admin Accounts</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create platform-level Admin and Director accounts.
      </Typography>

      <Stack spacing={3}>

        {/* ── Info banner ──────────────────────────────────────────────────────── */}
        <Alert
          severity="info"
          icon={<InfoOutlined />}
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Role differences
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip
              label="ADMIN — Full platform access, can create campuses and other admins"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontSize: '0.72rem' }}
            />
            <Chip
              label="DIRECTOR — Campus oversight, reporting, no account creation"
              size="small"
              color="warning"
              variant="outlined"
              sx={{ fontSize: '0.72rem' }}
            />
          </Stack>
        </Alert>

        {/* ── Create form ──────────────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <PersonAdd sx={{ color: '#003285' }} />
            <Typography variant="subtitle1" fontWeight={700}>Create New Account</Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2}>

              {field('admin_name', 'Full Name')}
              {field('email', 'Email Address', 'email')}

              {/* Role select */}
              <FormControl size="small" fullWidth error={formik.touched.role && Boolean(formik.errors.role)}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  label="Role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={busy}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="DIRECTOR">Director</MenuItem>
                </Select>
                {formik.touched.role && formik.errors.role && (
                  <FormHelperText>{formik.errors.role}</FormHelperText>
                )}
              </FormControl>

              {/* Password */}
              <FormControl size="small" fullWidth error={formik.touched.password && Boolean(formik.errors.password)}>
                <InputLabel htmlFor="password">Password</InputLabel>
                <OutlinedInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={busy}
                  endAdornment={passwordAdornment}
                  sx={{ borderRadius: 2 }}
                />
                {formik.touched.password && formik.errors.password && (
                  <FormHelperText>{formik.errors.password}</FormHelperText>
                )}
              </FormControl>

              {/* Confirm password */}
              <FormControl size="small" fullWidth error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}>
                <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
                <OutlinedInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={busy}
                  endAdornment={passwordAdornment}
                  sx={{ borderRadius: 2 }}
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <FormHelperText>{formik.errors.confirmPassword}</FormHelperText>
                )}
              </FormControl>

              <Button
                type="submit"
                variant="contained"
                disabled={busy}
                startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}
                sx={{
                  textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1.2,
                  background: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
                }}
              >
                {busy ? 'Creating…' : 'Create Account'}
              </Button>

            </Stack>
          </Box>
        </Paper>

        {/* ── Account list placeholder ─────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <ManageAccounts sx={{ color: '#003285' }} />
            <Typography variant="subtitle1" fontWeight={700}>Existing Accounts</Typography>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Account listing is not yet available — the{' '}
            <code>GET /api/admin/all</code> endpoint is pending implementation.
          </Alert>
        </Paper>

      </Stack>

      {/* ── Snackbar ─────────────────────────────────────────────────────────── */}
      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={closeSnackbar}
          sx={{
            position: 'fixed', bottom: 24, left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: 2, zIndex: 9999,
          }}
        >
          {snackbar.message}
        </Alert>
      )}

    </Box>
  );
}
