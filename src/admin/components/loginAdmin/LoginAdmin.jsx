import * as React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  FormHelperText,
  CircularProgress,
  Snackbar,
  Alert,
  Fade,
  Zoom,
  alpha,
} from '@mui/material';
import {
  MailOutline,
  LockOutlined,
  Visibility,
  VisibilityOff,
  Business,
  Handshake,
  Login as LoginIcon,
} from '@mui/icons-material';

import { useAuth } from '../../../hooks/useAuth';
import '../../styles/Background.css';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

/**
 * Roles available on the Admin login screen.
 *
 * Both ADMIN and DIRECTOR authenticate through the same endpoint:
 *   POST /api/admin/login  (see admin.router.js)
 * The backend resolves the actual role from the stored account —
 * selecting a role here only affects the UI theme color.
 */
const USER_TYPES = [
  {
    value: 'admin',
    label: 'Admin',
    icon: Business,
    gradient: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
    color: '#003285',
  },
  {
    value: 'director',
    label: 'Director',
    icon: Handshake,
    gradient: 'linear-gradient(135deg, #ff7f3e 0%, #ff9f5a 100%)',
    color: '#ff7f3e',
  },
];

// ─── VALIDATION ───────────────────────────────────────────────────────────────

/**
 * Login schema: email + password.
 * Username login is not supported by the admin backend endpoint.
 */
const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Please enter a valid email address.')
    .required('Email is required.'),
  password: yup
    .string()
    .min(1, 'Password is required.')
    .required('Password is required.'),
});

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function LoginAdmin() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [selectedType, setSelectedType] = useState('admin');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const currentType = USER_TYPES.find((t) => t.value === selectedType) ?? USER_TYPES[0];

  // ── Formik ──────────────────────────────────────────────────────────────────
  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        /**
         * Both admin and director share the same /admin/login endpoint.
         * AuthContext maps userType 'admin' → '/admin/login'.
         * The returned user.role ('ADMIN' | 'DIRECTOR') is the authoritative value.
         */
        await login(
          { email: values.email.trim().toLowerCase(), password: values.password },
          'admin', // always 'admin' — the router handles both roles
        );

        setSnackbar({
          open: true,
          message: `Welcome back!`,
          severity: 'success',
        });

        setTimeout(() => navigate('/'), 1000);
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.message || 'Login failed. Please check your credentials.',
          severity: 'error',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const isLoading = formik.isSubmitting;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTypeSelect = (value) => {
    if (value !== selectedType) {
      setSelectedType(value);
      formik.resetForm();
    }
  };

  return (
    <Box
      className="animated-background"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background: currentType.gradient,
        transition: 'background 0.5s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated bubbles */}
      <Box className="bubbles">
        <span className="bubble b1" />
        <span className="bubble b2" />
        <span className="bubble b3" />
        <span className="bubble b4" />
      </Box>

      <Zoom in timeout={600}>
        <Paper
          elevation={24}
          sx={{
            display: 'flex',
            width: '100%',
            maxWidth: 1100,
            borderRadius: 4,
            overflow: 'hidden',
            minHeight: 600,
            zIndex: 2,
            position: 'relative',
            backgroundColor: 'rgba(255,255,255,0.98)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
          }}
        >
          {/* ── Left branding panel (md+) ─────────────────────────────────── */}
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: currentType.gradient,
              color: 'white',
              p: 6,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              transition: 'background 0.5s ease',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1), transparent 50%)',
                animation: 'pulse 4s ease-in-out infinite',
              },
              '@keyframes pulse': {
                '0%, 100%': { opacity: 0.5 },
                '50%':       { opacity: 1   },
              },
            }}
          >
            <Fade in timeout={1000}>
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h2" fontWeight="900" gutterBottom>
                  wewigo
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ opacity: 0.9, fontWeight: 300, mb: 4, maxWidth: 380, mx: 'auto' }}
                >
                  The excellent platform for managing your educational institution
                </Typography>
                <Box
                  component="img"
                  src="/vite.svg"
                  alt="Wewigo"
                  sx={{
                    width: '60%',
                    maxWidth: 260,
                    filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))',
                    animation: 'float 6s ease-in-out infinite',
                  }}
                />
              </Box>
            </Fade>
          </Box>

          {/* ── Right form panel ─────────────────────────────────────────── */}
          <Box
            sx={{
              flex: 1,
              p: { xs: 3, sm: 6 },
              bgcolor: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Fade in timeout={800}>
              <Box>
                {/* Title */}
                <Stack spacing={0.5} sx={{ mb: 4 }}>
                  <Typography
                    variant="h4"
                    fontWeight="900"
                    sx={{
                      background: currentType.gradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      transition: 'all 0.5s ease',
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Select your role and sign in to continue
                  </Typography>
                </Stack>

                {/* Role picker */}
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ mb: 2, color: 'text.secondary' }}
                  >
                    I am a:
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                    {USER_TYPES.map((type) => {
                      const Icon       = type.icon;
                      const isSelected = selectedType === type.value;

                      return (
                        <Box
                          key={type.value}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleTypeSelect(type.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleTypeSelect(type.value)}
                          sx={{
                            cursor: 'pointer',
                            borderRadius: 3,
                            p: 2,
                            textAlign: 'center',
                            border: '2px solid',
                            borderColor: isSelected ? type.color : 'divider',
                            bgcolor: isSelected ? alpha(type.color, 0.08) : 'background.paper',
                            transition: 'all 0.25s ease',
                            boxShadow: isSelected
                              ? `0 8px 24px ${alpha(type.color, 0.35)}`
                              : 'none',
                            outline: 'none',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              borderColor: type.color,
                              boxShadow: `0 6px 18px ${alpha(type.color, 0.25)}`,
                            },
                            '&:focus-visible': {
                              boxShadow: `0 0 0 3px ${alpha(type.color, 0.4)}`,
                            },
                          }}
                        >
                          <Icon
                            sx={{
                              fontSize: 28,
                              mb: 1,
                              color: isSelected ? type.color : 'text.secondary',
                            }}
                          />
                          <Typography
                            variant="body2"
                            fontWeight={isSelected ? 700 : 500}
                            color={isSelected ? type.color : 'text.primary'}
                          >
                            {type.label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Login form */}
                <Box component="form" onSubmit={formik.handleSubmit} noValidate>
                  <Stack spacing={3}>
                    {/* Email */}
                    <FormControl
                      fullWidth
                      error={formik.touched.email && Boolean(formik.errors.email)}
                    >
                      <InputLabel htmlFor="email">Email address</InputLabel>
                      <OutlinedInput
                        id="email"
                        name="email"
                        type="email"
                        label="Email address"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={isLoading}
                        autoComplete="email"
                        startAdornment={
                          <InputAdornment position="start">
                            <MailOutline sx={{ color: currentType.color }} />
                          </InputAdornment>
                        }
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentType.color },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: currentType.color },
                        }}
                      />
                      {formik.touched.email && formik.errors.email && (
                        <FormHelperText>{formik.errors.email}</FormHelperText>
                      )}
                    </FormControl>

                    {/* Password */}
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
                        autoComplete="current-password"
                        startAdornment={
                          <InputAdornment position="start">
                            <LockOutlined sx={{ color: currentType.color }} />
                          </InputAdornment>
                        }
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
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentType.color },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: currentType.color },
                        }}
                      />
                      {formik.touched.password && formik.errors.password && (
                        <FormHelperText>{formik.errors.password}</FormHelperText>
                      )}
                    </FormControl>

                    {/* Submit */}
                    <Button
                      type="submit"
                      fullWidth
                      size="large"
                      variant="contained"
                      disabled={isLoading}
                      startIcon={
                        isLoading
                          ? <CircularProgress size={20} color="inherit" />
                          : <LoginIcon />
                      }
                      sx={{
                        py: 1.8,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        textTransform: 'none',
                        background: currentType.gradient,
                        boxShadow: `0 8px 20px ${alpha(currentType.color, 0.3)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 28px ${alpha(currentType.color, 0.4)}`,
                        },
                        '&:active': { transform: 'translateY(0)' },
                      }}
                    >
                      {isLoading ? 'Connecting…' : `Sign in as ${currentType.label}`}
                    </Button>
                  </Stack>
                </Box>

                {/* Footer */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Need help?{' '}
                    <Box
                      component="a"
                      href="#"
                      sx={{ color: currentType.color, fontWeight: 600, textDecoration: 'none' }}
                    >
                      Contact Support
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Fade>
          </Box>
        </Paper>
      </Zoom>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        slots={{ transition: Zoom }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          elevation={6}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}