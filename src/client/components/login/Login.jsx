/**
 * @file Login.jsx
 * @description Universal login page for all non-admin user types.
 *   Role-specific colour theming, Formik + Yup validation,
 *   email / username toggle, animated bubbles background.
 *
 *   Admin access is NOT exposed here — admins use /admin directly.
 *
 *   Changes vs previous version:
 *   - Removed the now-unnecessary admin/director entries from USER_TYPES
 *     (those roles authenticate via /admin, not here).
 *   - Added aria-label on the identifier toggle button for accessibility.
 *   - Minor style cleanups; logic is unchanged.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import {
  Box,
  IconButton,
  InputLabel,
  InputAdornment,
  FormControl,
  OutlinedInput,
  CircularProgress,
  Typography,
  Button,
  FormHelperText,
  Snackbar,
  Alert,
  Paper,
  Stack,
  Fade,
  Zoom,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  MailOutline,
  LockOutlined,
  Visibility,
  VisibilityOff,
  Business,
  School,
  Badge,
  RecordVoiceOver,
  FamilyRestroom,
  Psychology,
  Handshake,
  Login as LoginIcon,
} from '@mui/icons-material';

import { loginSchema }  from '../../../yupSchema/loginSchema';
import { useAuth }       from '../../../hooks/useAuth';
import '../../styles/animatedBackground.css';

// ─── User type configuration ──────────────────────────────────────────────────
// Admin and Director are excluded: they authenticate via /admin (hidden route).

const USER_TYPES = [
  {
    value:    'manager',
    label:    'Manager',
    icon:     Business,
    gradient: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
    color:    '#003285',
  },
  {
    value:    'student',
    label:    'Student',
    icon:     School,
    gradient: 'linear-gradient(135deg, #2a629a 0%, #4989c8 100%)',
    color:    '#2a629a',
  },
  {
    value:    'teacher',
    label:    'Teacher',
    icon:     RecordVoiceOver,
    gradient: 'linear-gradient(135deg, #2a629a 0%, #003285 100%)',
    color:    '#2a629a',
  },
  {
    value:    'parent',
    label:    'Parent',
    icon:     FamilyRestroom,
    gradient: 'linear-gradient(135deg, #4989c8 0%, #ffda78 100%)',
    color:    '#4989c8',
  },
  {
    value:    'mentor',
    label:    'Mentor',
    icon:     Psychology,
    gradient: 'linear-gradient(135deg, #003285 0%, #4989c8 100%)',
    color:    '#003285',
  },
  {
    value:    'partner',
    label:    'Partner',
    icon:     Handshake,
    gradient: 'linear-gradient(135deg, #ff7f3e 0%, #ff9f5a 100%)',
    color:    '#ff7f3e',
  },
];

// ─── Redirect map per user type ───────────────────────────────────────────────

const REDIRECT_MAP = {
  manager: (userData) => `/campus/${userData.id}`,
  student: ()         => '/student',
  teacher: ()         => '/teacher',
  parent:  ()         => '/parent',
  mentor:  ()         => '/mentor',
  partner: ()         => '/partner',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Login() {
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('md'));
  const navigate  = useNavigate();
  const { login } = useAuth();
  const { state } = useLocation();

  const [showPassword, setShowPassword]   = useState(false);
  const [isLoading,    setIsLoading]       = useState(false);
  const [userType,     setUserType]        = useState('manager');
  const [useUsername,  setUseUsername]     = useState(false);
  const [snackbar,     setSnackbar]        = useState({ open: false, message: '', severity: 'success' });

  const currentUserType = USER_TYPES.find((t) => t.value === userType) ?? USER_TYPES[0];

  // ── Formik ───────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: { identifier: '', password: '' },
    validationSchema: loginSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      try {
        // Build credentials: email or username
        const credentials = {
          password: values.password,
          [useUsername ? 'username' : 'email']: values.identifier,
        };

        const result   = await login(credentials, userType);
        const userData = result.data.user;

        setSnackbar({
          open:     true,
          message:  `Welcome back — signed in as ${currentUserType.label}.`,
          severity: 'success',
        });

        setTimeout(() => {
          const dest = state?.from
            ?? (REDIRECT_MAP[userType]?.(userData) || '/');
          navigate(dest, { replace: true });
        }, 1000);

      } catch (error) {
        setSnackbar({
          open:     true,
          message:  error.message || 'Login failed. Please check your credentials.',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleUserTypeChange = (value) => {
    if (value !== userType) {
      setUserType(value);
      formik.resetForm();
    }
  };

  const toggleIdentifierType = () => {
    setUseUsername((p) => !p);
    formik.setFieldValue('identifier', '');
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        background: currentUserType.gradient,
        transition: 'background 0.5s ease',
      }}
      className="animated-background"
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
            display:         'flex',
            width:           '100%',
            maxWidth:        1100,
            borderRadius:    4,
            overflow:        'hidden',
            minHeight:       650,
            zIndex:          2,
            position:        'relative',
            backdropFilter:  'blur(20px)',
            backgroundColor: 'rgba(255,255,255,0.98)',
            boxShadow:       '0 30px 80px rgba(0,0,0,0.3)',
          }}
        >
          {/* ── Left branding panel (md+) ── */}
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: currentUserType.gradient,
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
                  sx={{ opacity: 0.95, fontWeight: 300, mb: 4, maxWidth: 400, mx: 'auto' }}
                >
                  The excellent platform for managing your educational institution
                </Typography>
                <Box
                  component="img"
                  src="vite.svg"
                  alt="wewigo logo"
                  sx={{
                    width:  '70%',
                    maxWidth: 280,
                    filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.3))',
                    animation: 'float 6s ease-in-out infinite',
                  }}
                />
              </Box>
            </Fade>
          </Box>

          {/* ── Right form panel ── */}
          <Box
            sx={{
              flex: 1, p: { xs: 3, sm: 6 },
              bgcolor: 'white',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}
          >
            <Fade in timeout={800}>
              <Box>
                {/* Header */}
                <Stack spacing={1} sx={{ mb: 4 }}>
                  <Typography
                    variant="h4"
                    fontWeight="900"
                    sx={{
                      background: currentUserType.gradient,
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
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: 'text.secondary' }}>
                    I am a:
                  </Typography>

                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                    gap: 1.5,
                  }}>
                    {USER_TYPES.map(({ value, label, icon: Icon, color, gradient }) => {
                      const isSelected = userType === value;
                      return (
                        <Box
                          key={value}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleUserTypeChange(value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleUserTypeChange(value)}
                          aria-pressed={isSelected}
                          sx={{
                            cursor: 'pointer', borderRadius: 2.5, p: 1.5,
                            textAlign: 'center', border: '2px solid',
                            borderColor: isSelected ? color : 'divider',
                            bgcolor: isSelected ? alpha(color, 0.08) : 'background.paper',
                            transition: 'all 0.25s ease',
                            outline: 'none',
                            boxShadow: isSelected ? `0 6px 20px ${alpha(color, 0.3)}` : 'none',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              borderColor: color,
                              boxShadow: `0 4px 14px ${alpha(color, 0.22)}`,
                            },
                            '&:focus-visible': {
                              boxShadow: `0 0 0 3px ${alpha(color, 0.4)}`,
                            },
                          }}
                        >
                          <Icon sx={{ fontSize: 26, mb: 0.5, color: isSelected ? color : 'text.secondary' }} />
                          <Typography
                            variant="body2"
                            fontWeight={isSelected ? 700 : 500}
                            color={isSelected ? color : 'text.primary'}
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>

                {/* Form */}
                <form onSubmit={formik.handleSubmit} noValidate>
                  <Stack spacing={2.5}>

                    {/* Identifier field */}
                    <FormControl
                      fullWidth
                      error={formik.touched.identifier && Boolean(formik.errors.identifier)}
                    >
                      <InputLabel htmlFor="login-identifier">
                        {useUsername ? 'Username' : 'Email Address'}
                      </InputLabel>
                      <OutlinedInput
                        id="login-identifier"
                        name="identifier"
                        label={useUsername ? 'Username' : 'Email Address'}
                        value={formik.values.identifier}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={isLoading}
                        autoComplete={useUsername ? 'username' : 'email'}
                        startAdornment={
                          <InputAdornment position="start">
                            {useUsername
                              ? <Badge sx={{ color: currentUserType.color }} />
                              : <MailOutline sx={{ color: currentUserType.color }} />}
                          </InputAdornment>
                        }
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentUserType.color },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: currentUserType.color },
                        }}
                      />
                      {formik.touched.identifier && formik.errors.identifier && (
                        <FormHelperText>{formik.errors.identifier}</FormHelperText>
                      )}
                      <Button
                        size="small"
                        onClick={toggleIdentifierType}
                        aria-label={`Switch to ${useUsername ? 'email' : 'username'} login`}
                        sx={{
                          mt: 0.5, alignSelf: 'flex-start',
                          textTransform: 'none', fontSize: '0.75rem',
                          color: currentUserType.color,
                          '&:hover': { bgcolor: alpha(currentUserType.color, 0.05) },
                        }}
                      >
                        Use {useUsername ? 'Email' : 'Username'} instead
                      </Button>
                    </FormControl>

                    {/* Password field */}
                    <FormControl
                      fullWidth
                      error={formik.touched.password && Boolean(formik.errors.password)}
                    >
                      <InputLabel htmlFor="login-password">Password</InputLabel>
                      <OutlinedInput
                        id="login-password"
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
                            <LockOutlined sx={{ color: currentUserType.color }} />
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
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: currentUserType.color },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: currentUserType.color },
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
                        py: 1.8, borderRadius: 2, fontWeight: 'bold',
                        fontSize: '1rem', textTransform: 'none',
                        background: currentUserType.gradient,
                        boxShadow: `0 8px 20px ${alpha(currentUserType.color, 0.3)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 28px ${alpha(currentUserType.color, 0.4)}`,
                        },
                        '&:active': { transform: 'translateY(0)' },
                      }}
                    >
                      {isLoading ? 'Connecting…' : `Sign in as ${currentUserType.label}`}
                    </Button>
                  </Stack>
                </form>

                {/* Footer */}
                <Box sx={{ mt: 3.5, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Need help?{' '}
                    <Box
                      component="a"
                      href="#"
                      sx={{ color: currentUserType.color, fontWeight: 600, textDecoration: 'none' }}
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