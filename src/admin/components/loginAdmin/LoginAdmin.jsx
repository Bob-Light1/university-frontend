/**
 * @file LoginAdmin.jsx
 * @description Admin / Director login page.
 *   Accessible at the hidden route /admin (not linked in the public UI).
 *   Both ADMIN and DIRECTOR authenticate via POST /api/admin/login.
 *   The backend resolves the real role from the DB record.
 */

import { useState }     from 'react';
import { useNavigate }  from 'react-router-dom';
import { useFormik }    from 'formik';
import * as Yup         from 'yup';
import {
  Box, Paper, Stack, Typography, Button,
  FormControl, InputLabel, OutlinedInput,
  InputAdornment, IconButton, FormHelperText,
  CircularProgress, Snackbar, Alert, Fade, Zoom, alpha,
} from '@mui/material';
import {
  MailOutline, LockOutlined,
  Visibility, VisibilityOff,
  Login as LoginIcon,
  ArrowBack,
  Shield,
} from '@mui/icons-material';

import { useAuth } from '../../../hooks/useAuth';
import { yupEmail, yupPasswordLogin } from '../../../utils/validationRules';
import '../../styles/Background.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const ADMIN_GRADIENT = 'linear-gradient(135deg, #003285 0%, #2a629a 100%)';
const ADMIN_COLOR    = '#003285';

// ─── Validation ───────────────────────────────────────────────────────────────

const loginSchema = Yup.object({
  email:    yupEmail(),
  password: yupPasswordLogin(),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginAdmin() {
  const navigate  = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar]         = useState({ open: false, message: '', severity: 'success' });

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const result = await login(
          { email: values.email.trim().toLowerCase(), password: values.password },
          'admin',
        );
        setSnackbar({ open: true, message: 'Welcome back!', severity: 'success' });
        const role = result?.data?.user?.role;
        const dest = role === 'DIRECTOR' ? '/director/dashboard' : '/admin/dashboard';
        setTimeout(() => navigate(dest), 1000);
      } catch (error) {
        setSnackbar({
          open:     true,
          message:  error.message || 'Login failed. Please check your credentials.',
          severity: 'error',
        });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const isLoading = formik.isSubmitting;

  return (
    <Box
      className="animated-background"
      sx={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 2, position: 'relative', overflow: 'hidden',
        background: ADMIN_GRADIENT,
      }}
    >
      {/* Bubbles */}
      <Box className="bubbles">
        <span className="bubble b1" />
        <span className="bubble b2" />
        <span className="bubble b3" />
        <span className="bubble b4" />
      </Box>

      {/* Back link */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/')}
        aria-label="Return to public site"
        sx={{
          position: 'fixed', top: 20, left: 20,
          color: 'rgba(255,255,255,0.55)',
          fontSize: '0.78rem', textTransform: 'none',
          '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
        }}
      >
        Back to site
      </Button>

      <Zoom in timeout={600}>
        <Paper
          elevation={24}
          sx={{
            display: 'flex', width: '100%', maxWidth: 1100,
            borderRadius: 4, overflow: 'hidden', minHeight: 600,
            zIndex: 2, position: 'relative',
            backgroundColor: 'rgba(255,255,255,0.98)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
          }}
        >
          {/* ── Left branding panel (md+) ── */}
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              background: ADMIN_GRADIENT,
              color: 'white', p: 6, textAlign: 'center',
              position: 'relative', overflow: 'hidden',
              '&::before': {
                content: '""', position: 'absolute', inset: 0,
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
                <Box sx={{
                  width: 72, height: 72, borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto', mb: 3,
                }}>
                  <Shield sx={{ fontSize: 40 }} />
                </Box>
                <Typography variant="h2" fontWeight="900" gutterBottom>wewigo</Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300, mb: 4, maxWidth: 380, mx: 'auto' }}>
                  Administration Portal
                </Typography>
                <Box
                  component="img"
                  src="/vite.svg"
                  alt="wewigo"
                  sx={{
                    width: '60%', maxWidth: 260,
                    filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))',
                    animation: 'float 6s ease-in-out infinite',
                  }}
                />
              </Box>
            </Fade>
          </Box>

          {/* ── Right form panel ── */}
          <Box sx={{
            flex: 1, p: { xs: 3, sm: 6 }, bgcolor: 'white',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
          }}>
            <Fade in timeout={800}>
              <Box>
                {/* Title */}
                <Stack spacing={0.5} sx={{ mb: 4 }}>
                  <Typography
                    variant="h4" fontWeight="900"
                    sx={{
                      background: ADMIN_GRADIENT,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Administration
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Sign in to access the management portal
                  </Typography>

                  <Box sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.75,
                    mt: 1, px: 1.5, py: 0.5, borderRadius: 1,
                    bgcolor: alpha(ADMIN_COLOR, 0.07),
                    border: `1px solid ${alpha(ADMIN_COLOR, 0.18)}`,
                    width: 'fit-content',
                  }}>
                    <Shield sx={{ fontSize: 13, color: ADMIN_COLOR }} />
                    <Typography variant="caption" sx={{ color: ADMIN_COLOR, fontWeight: 600, fontSize: '0.7rem' }}>
                      Restricted access — authorised personnel only
                    </Typography>
                  </Box>
                </Stack>

                {/* Form */}
                <Box component="form" onSubmit={formik.handleSubmit} noValidate>
                  <Stack spacing={3}>

                    <FormControl fullWidth error={formik.touched.email && Boolean(formik.errors.email)}>
                      <InputLabel htmlFor="admin-email">Email address</InputLabel>
                      <OutlinedInput
                        id="admin-email" name="email" type="email"
                        label="Email address"
                        value={formik.values.email}
                        onChange={formik.handleChange} onBlur={formik.handleBlur}
                        disabled={isLoading} autoComplete="email"
                        startAdornment={
                          <InputAdornment position="start">
                            <MailOutline sx={{ color: ADMIN_COLOR }} />
                          </InputAdornment>
                        }
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                          '&:hover .MuiOutlinedInput-notchedOutline':  { borderColor: ADMIN_COLOR },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ADMIN_COLOR },
                        }}
                      />
                      {formik.touched.email && formik.errors.email && (
                        <FormHelperText>{formik.errors.email}</FormHelperText>
                      )}
                    </FormControl>

                    <FormControl fullWidth error={formik.touched.password && Boolean(formik.errors.password)}>
                      <InputLabel htmlFor="admin-password">Password</InputLabel>
                      <OutlinedInput
                        id="admin-password" name="password"
                        type={showPassword ? 'text' : 'password'}
                        label="Password"
                        value={formik.values.password}
                        onChange={formik.handleChange} onBlur={formik.handleBlur}
                        disabled={isLoading} autoComplete="current-password"
                        startAdornment={
                          <InputAdornment position="start">
                            <LockOutlined sx={{ color: ADMIN_COLOR }} />
                          </InputAdornment>
                        }
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword((p) => !p)}
                              edge="end" disabled={isLoading}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        }
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                          '&:hover .MuiOutlinedInput-notchedOutline':  { borderColor: ADMIN_COLOR },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ADMIN_COLOR },
                        }}
                      />
                      {formik.touched.password && formik.errors.password && (
                        <FormHelperText>{formik.errors.password}</FormHelperText>
                      )}
                    </FormControl>

                    <Button
                      type="submit" fullWidth size="large" variant="contained"
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                      sx={{
                        py: 1.8, borderRadius: 2,
                        fontWeight: 'bold', fontSize: '1rem', textTransform: 'none',
                        background: ADMIN_GRADIENT,
                        boxShadow: `0 8px 20px ${alpha(ADMIN_COLOR, 0.3)}`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 28px ${alpha(ADMIN_COLOR, 0.4)}`,
                        },
                        '&:active': { transform: 'translateY(0)' },
                      }}
                    >
                      {isLoading ? 'Connecting…' : 'Sign in'}
                    </Button>

                  </Stack>
                </Box>

                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Need help?{' '}
                    <Box component="a" href="#"
                      sx={{ color: ADMIN_COLOR, fontWeight: 600, textDecoration: 'none' }}>
                      Contact Support
                    </Box>
                  </Typography>
                </Box>
              </Box>
            </Fade>
          </Box>
        </Paper>
      </Zoom>

      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        slots={{ transition: Zoom }}
      >
        <Alert severity={snackbar.severity} variant="filled" elevation={6}
          sx={{ borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
