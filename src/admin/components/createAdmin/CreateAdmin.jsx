import * as React from 'react';
import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Typography,
  Grid,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
  FormHelperText,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { PersonOutline, MailOutline, Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';

import api from '../../../api/axiosInstance';
import { createAdminSchema } from '../../../yupSchema/createAdminSchema';
import useFormSnackbar from '../../../hooks/useFormSnackBar';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

/** Role options aligned with backend ADMIN_ROLES enum */
const ROLE_OPTIONS = [
  { value: 'ADMIN',    label: 'Admin'    },
  { value: 'DIRECTOR', label: 'Director' },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function CreateAdmin() {
  const [showPassword, setShowPassword] = useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const formik = useFormik({
    initialValues: {
      admin_name:       '',
      email:            '',
      role:             'ADMIN',
      password:         '',
      confirm_password: '',
    },
    validationSchema: createAdminSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        // Backend expects JSON — no FormData needed (no file upload on this endpoint)
        await api.post('/admin/create', {
          admin_name: values.admin_name.trim(),
          email:      values.email.trim().toLowerCase(),
          role:       values.role,
          password:   values.password,
          // confirm_password is client-side only — never sent to the API
        });

        showSnackbar(`${values.role === 'DIRECTOR' ? 'Director' : 'Admin'} account created successfully.`, 'success');
        resetForm();
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          'An error occurred while creating the account.';
        showSnackbar(message, 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const isLoading = formik.isSubmitting;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={0}
          sx={{
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            px: { xs: 2, sm: 3 },
            py: 3,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          }}
        >
          <CardContent>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h5" fontWeight="900" sx={{ color: '#0077be' }}>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Set up a new Admin or Director account
              </Typography>
            </Box>

            {/* Form */}
            <Box component="form" onSubmit={formik.handleSubmit} noValidate>
              <Grid container spacing={2}>

                {/* Admin Name */}
                <Grid size={12}>
                  <FormControl
                    fullWidth
                    error={formik.touched.admin_name && Boolean(formik.errors.admin_name)}
                  >
                    <InputLabel htmlFor="admin_name">Full name</InputLabel>
                    <OutlinedInput
                      id="admin_name"
                      name="admin_name"
                      label="Full name"
                      value={formik.values.admin_name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={isLoading}
                      startAdornment={
                        <InputAdornment position="start">
                          <PersonOutline sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      }
                    />
                    {formik.touched.admin_name && formik.errors.admin_name && (
                      <FormHelperText>{formik.errors.admin_name}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Email */}
                <Grid size={12}>
                  <FormControl
                    fullWidth
                    error={formik.touched.email && Boolean(formik.errors.email)}
                  >
                    <InputLabel htmlFor="email">Email address</InputLabel>
                    <OutlinedInput
                      id="email"
                      type="email"
                      name="email"
                      label="Email address"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={isLoading}
                      startAdornment={
                        <InputAdornment position="start">
                          <MailOutline sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      }
                    />
                    {formik.touched.email && formik.errors.email && (
                      <FormHelperText>{formik.errors.email}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Role — FormControl + InputLabel + Select (never TextField[select]) */}
                <Grid size={12}>
                  <FormControl
                    fullWidth
                    error={formik.touched.role && Boolean(formik.errors.role)}
                  >
                    <InputLabel id="role-label">Role</InputLabel>
                    <Select
                      labelId="role-label"
                      id="role"
                      name="role"
                      label="Role"
                      value={formik.values.role}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={isLoading}
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.role && formik.errors.role && (
                      <FormHelperText>{formik.errors.role}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Password */}
                <Grid size={12}>
                  <FormControl
                    fullWidth
                    error={formik.touched.password && Boolean(formik.errors.password)}
                  >
                    <InputLabel htmlFor="password">Password</InputLabel>
                    <OutlinedInput
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      label="Password"
                      value={formik.values.password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={isLoading}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((p) => !p)}
                            edge="end"
                            disabled={isLoading}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                    {formik.touched.password && formik.errors.password && (
                      <FormHelperText>{formik.errors.password}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Confirm Password */}
                <Grid size={12}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched.confirm_password &&
                      Boolean(formik.errors.confirm_password)
                    }
                  >
                    <InputLabel htmlFor="confirm_password">Confirm password</InputLabel>
                    <OutlinedInput
                      id="confirm_password"
                      type={showPassword ? 'text' : 'password'}
                      name="confirm_password"
                      label="Confirm password"
                      value={formik.values.confirm_password}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      disabled={isLoading}
                      endAdornment={
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((p) => !p)}
                            edge="end"
                            disabled={isLoading}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      }
                    />
                    {formik.touched.confirm_password && formik.errors.confirm_password && (
                      <FormHelperText>{formik.errors.confirm_password}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Submit */}
                <Grid size={12}>
                  <Button
                    type="submit"
                    fullWidth
                    size="large"
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #0077be 30%, #00a8cc 90%)',
                      boxShadow: '0 4px 15px rgba(0, 119, 190, 0.4)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #005f99 30%, #008eb0 90%)',
                      },
                    }}
                  >
                    {isLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} color="inherit" />
                        <span>Creating account…</span>
                      </Box>
                    ) : (
                      'Create account'
                    )}
                  </Button>
                </Grid>

              </Grid>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Global feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}