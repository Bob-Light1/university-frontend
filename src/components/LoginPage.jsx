/**
 * @file LoginPage.jsx
 * @description Unified login component.
 *
 *   variant="public" — 2-step flow:
 *     Step 1: full-screen role selector (large cards, gradient bg)
 *     Step 2: form with adaptive left-panel copy per role + forgot-password modal
 *
 *   variant="admin" — single step, email-only, fixed blue theme.
 *
 *   All @keyframes defined inline — no external CSS file needed.
 */

import { useState }                   from 'react';
import { useNavigate, useLocation }   from 'react-router-dom';
import { useFormik }                  from 'formik';
import * as Yup                       from 'yup';
import {
  Box, Paper, Stack, Typography, Button,
  FormControl, InputLabel, OutlinedInput,
  InputAdornment, IconButton, FormHelperText,
  CircularProgress, Snackbar, Alert,
  Tabs, Tab, Fade, Zoom, alpha,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  MailOutline, LockOutlined, Visibility, VisibilityOff,
  Login as LoginIcon, ArrowBack, Shield,
  Business, School, Badge, RecordVoiceOver,
  FamilyRestroom, Psychology, Handshake,
  LockReset, Home as HomeIcon,
} from '@mui/icons-material';

import { useAuth }                    from '../hooks/useAuth';
import { loginSchema }                from '../yupSchema/loginSchema';
import { yupEmail, yupPasswordLogin } from '../utils/validationRules';

// ── User types ────────────────────────────────────────────────────────────────

const USER_TYPES = [
  {
    value: 'manager', label: 'Manager', icon: Business,
    gradient: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)', color: '#003285',
    description: 'Campus management & administration',
    supportsUsername: false,
  },
  {
    value: 'student', label: 'Student', icon: School,
    gradient: 'linear-gradient(135deg, #2a629a 0%, #4989c8 100%)', color: '#2a629a',
    description: 'Access your results, schedule & attendance',
    supportsUsername: true,
  },
  {
    value: 'teacher', label: 'Teacher', icon: RecordVoiceOver,
    gradient: 'linear-gradient(135deg, #2a629a 0%, #003285 100%)', color: '#2a629a',
    description: 'Courses, evaluations & class management',
    supportsUsername: true,
  },
  {
    value: 'parent', label: 'Parent', icon: FamilyRestroom,
    gradient: 'linear-gradient(135deg, #311b92 0%, #c2185b 100%)', color: '#7b1fa2',
    description: "Monitor your child's progress in real time",
    supportsUsername: true,
  },
  {
    value: 'mentor', label: 'Mentor', icon: Psychology,
    gradient: 'linear-gradient(135deg, #003285 0%, #4989c8 100%)', color: '#003285',
    description: 'Guide and track your assigned students',
    supportsUsername: true,
  },
  {
    value: 'partner', label: 'Partner', icon: Handshake,
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #bf360c 100%)', color: '#e65100',
    description: 'Leads, commissions & affiliate kit',
    supportsUsername: false,
  },
  {
    value: 'staff', label: 'Staff', icon: Badge,
    gradient: 'linear-gradient(135deg, #00695C 0%, #26A69A 100%)', color: '#00695C',
    description: 'Access the tools assigned to your role',
    supportsUsername: true,
  },
];

// ── Adaptive left-panel copy per role ─────────────────────────────────────────

const ROLE_COPY = {
  manager: { tagline: 'Manage your campus',          sub: 'Complete oversight of your institution from a single dashboard.' },
  student: { tagline: 'Track your journey',          sub: 'Results, schedule, attendance — your entire curriculum at a glance.' },
  teacher: { tagline: 'Manage your classes',         sub: 'Courses, attendance, evaluations — organise your teaching with efficiency.' },
  parent:  { tagline: 'Stay connected',              sub: "Follow your child's progress and attendance in real time." },
  mentor:  { tagline: 'Guide your students',         sub: 'Access profiles and track the progress of your mentees.' },
  partner: { tagline: 'Manage your partnerships',   sub: 'Leads, commissions, affiliate kit — your dedicated partner space.' },
  staff:   { tagline: 'Access your tools',           sub: 'Manage the tasks assigned to your role within the campus.' },
};

// ── Redirect map ──────────────────────────────────────────────────────────────

const REDIRECT_MAP = {
  manager: (u) => `/campus/${u.id}`,
  student: ()  => '/student',
  teacher: ()  => '/teacher',
  parent:  ()  => '/parent',
  mentor:  ()  => '/mentor',
  partner: ()  => '/partner',
  staff:   ()  => '/staff',
};

// ── Admin theme ───────────────────────────────────────────────────────────────

const ADMIN_GRADIENT = 'linear-gradient(135deg, #003285 0%, #2a629a 100%)';
const ADMIN_COLOR    = '#003285';

// Fixed neutral gradient for Step 1 — independent of any role selection.
// This ensures the "back" button always restores the same visual state.
const STEP1_GRADIENT = 'linear-gradient(135deg, #0d1b3e 0%, #1c3a6e 100%)';

// ── Bubbles (no CSS file) ─────────────────────────────────────────────────────

const BUBBLES = [
  { w: 320, h: 320, color: 'rgba(182,216,250,0.35)', top:   -80,  left:  -80,  dur: '58s' },
  { w: 420, h: 420, color: 'rgba(140,203,230,0.25)', bottom:-120, right: -100, dur: '56s' },
  { w: 260, h: 260, color: 'rgba(255,255,255,0.48)', top:  '30%', left: '70%', dur: '52s' },
  { w: 200, h: 200, color: 'rgba(181,183,185,0.2)',  top:  '70%', left: '10%', dur: '50s' },
];

// ── Admin schema ──────────────────────────────────────────────────────────────

const adminSchema = Yup.object({
  identifier: yupEmail(),
  password:   yupPasswordLogin(),
});

// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage({ variant = 'public' }) {
  const isAdmin   = variant === 'admin';
  const navigate  = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();

  const [step,           setStep]           = useState(1); // 1 = role picker, 2 = form
  const [showPassword,   setShowPassword]   = useState(false);
  const [userType,       setUserType]       = useState('manager');
  const [identifierMode, setIdentifierMode] = useState('email');
  const [forgotOpen,     setForgotOpen]     = useState(false);
  const [snackbar,       setSnackbar]       = useState({ open: false, message: '', severity: 'success' });

  const currentType = USER_TYPES.find((t) => t.value === userType) ?? USER_TYPES[0];
  const RoleIcon    = currentType.icon;
  const roleCopy    = ROLE_COPY[userType] ?? ROLE_COPY.manager;
  const activeGrad  = isAdmin ? ADMIN_GRADIENT : currentType.gradient;
  const activeColor = isAdmin ? ADMIN_COLOR    : currentType.color;

  // ── Formik ────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues:    { identifier: '', password: '' },
    validationSchema: isAdmin ? adminSchema : loginSchema,
    validateOnChange: true,
    validateOnBlur:   true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        let dest;
        if (isAdmin) {
          const result = await login(
            { email: values.identifier.trim().toLowerCase(), password: values.password },
            'admin',
          );
          const role = result?.data?.user?.role;
          dest = role === 'DIRECTOR' ? '/director/dashboard' : '/admin/dashboard';
        } else {
          const credentials = {
            password: values.password,
            [identifierMode === 'username' ? 'username' : 'email']: values.identifier,
          };
          const result   = await login(credentials, userType);
          const userData = result.data.user;
          dest = state?.from ?? (REDIRECT_MAP[userType]?.(userData) || '/');
        }
        setSnackbar({ open: true, message: 'Welcome back!', severity: 'success' });
        setTimeout(() => navigate(dest, { replace: true }), 900);
      } catch (err) {
        setSnackbar({ open: true, message: err.message || 'Login failed. Please check your credentials.', severity: 'error' });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const isLoading = formik.isSubmitting;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const selectRole = (value) => {
    if (value !== userType) {
      setUserType(value);
      formik.resetForm();
      const newType = USER_TYPES.find((t) => t.value === value);
      if (!newType?.supportsUsername) setIdentifierMode('email');
    }
    setStep(2);
  };

  const handleModeChange = (_, mode) => {
    setIdentifierMode(mode);
    formik.setFieldValue('identifier', '');
    formik.setFieldTouched('identifier', false);
  };

  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // ── Shared background wrapper ─────────────────────────────────────────────

  const bgSx = {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    p: { xs: 2, sm: 3 }, position: 'relative', overflow: 'hidden',
    background: activeGrad, transition: 'background 0.5s ease',
    '@keyframes floatBubble': {
      '0%':   { transform: 'translateY(0) translateX(0) scale(1)' },
      '50%':  { transform: 'translateY(-60px) translateX(40px) scale(1.1)' },
      '100%': { transform: 'translateY(0) translateX(0) scale(1)' },
    },
    '@keyframes logoFloat': {
      '0%, 100%': { transform: 'translateY(0px)' },
      '50%':      { transform: 'translateY(-14px)' },
    },
    '@keyframes pulse': {
      '0%, 100%': { opacity: 0.5 },
      '50%':      { opacity: 1 },
    },
  };

  const bubblesJsx = (
    <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {BUBBLES.map((b, i) => (
        <Box key={i} sx={{
          position: 'absolute', borderRadius: '50%', opacity: 0.6,
          width: b.w, height: b.h, bgcolor: b.color,
          top: b.top, left: b.left, bottom: b.bottom, right: b.right,
          animation: `floatBubble ${b.dur} linear infinite`,
        }} />
      ))}
    </Box>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Role picker (public variant only)
  // ─────────────────────────────────────────────────────────────────────────

  if (!isAdmin && step === 1) {
    return (
      <Box sx={{ ...bgSx, background: STEP1_GRADIENT }}>
        {/* Bubbles — inlined to avoid inner-component remount flicker */}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {BUBBLES.map((b, i) => (
            <Box key={i} sx={{
              position: 'absolute', borderRadius: '50%', opacity: 0.6,
              width: b.w, height: b.h, bgcolor: b.color,
              top: b.top, left: b.left, bottom: b.bottom, right: b.right,
              animation: `floatBubble ${b.dur} linear infinite`,
            }} />
          ))}
        </Box>
        <Fade in timeout={500}>
          <Box sx={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 960, textAlign: 'center' }}>

            {/* Wordmark */}
            <Typography variant="h3" fontWeight={900} sx={{ color: 'white', mb: 1, letterSpacing: -1 }}>
              wewigo
            </Typography>
            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 300, mb: 5 }}>
              Who are you?
            </Typography>

            {/* Role cards grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: { xs: 1.5, sm: 2 },
              mb: 4,
            }}>
              {USER_TYPES.map(({ value, label, icon: Icon, color, description }) => {
                const sel = userType === value;
                return (
                  <Box
                    key={value}
                    role="button" tabIndex={0}
                    onClick={() => selectRole(value)}
                    onKeyDown={(e) => e.key === 'Enter' && selectRole(value)}
                    sx={{
                      cursor: 'pointer', outline: 'none',
                      bgcolor: 'white', borderRadius: 3,
                      p: { xs: 2, sm: 3 },
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                      border: `2px solid ${sel ? color : 'transparent'}`,
                      boxShadow: sel
                        ? `0 8px 32px ${alpha(color, 0.35)}`
                        : '0 2px 12px rgba(0,0,0,0.1)',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        borderColor: color,
                        boxShadow: `0 14px 40px ${alpha(color, 0.3)}`,
                      },
                      '&:focus-visible': { boxShadow: `0 0 0 3px white, 0 0 0 5px ${color}` },
                    }}
                  >
                    <Box sx={{
                      width: 60, height: 60, borderRadius: '50%',
                      bgcolor: alpha(color, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon sx={{ fontSize: 30, color }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                      {label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, textAlign: 'center' }}>
                      {description}
                    </Typography>
                  </Box>
                );
              })}

              {/* 8th card — wewigo home, balances the 4-column grid */}
              <Box
                role="button" tabIndex={0}
                onClick={() => navigate('/')}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
                aria-label="Back to wewigo home"
                sx={{
                  cursor: 'pointer', outline: 'none',
                  borderRadius: 3,
                  p: { xs: 2, sm: 3 },
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  border: '2px solid rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.22s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    background: 'rgba(255,255,255,0.18)',
                    border: '2px solid rgba(255,255,255,0.45)',
                    boxShadow: '0 14px 40px rgba(0,0,0,0.22)',
                  },
                  '&:focus-visible': { boxShadow: '0 0 0 3px white, 0 0 0 5px rgba(255,255,255,0.4)' },
                }}
              >
                <Box sx={{
                  width: 60, height: 60, borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <HomeIcon sx={{ fontSize: 30, color: 'white' }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white' }}>
                  wewigo
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, textAlign: 'center' }}>
                  Back to home
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Click your role to continue
            </Typography>
          </Box>
        </Fade>
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Login form (both variants)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Box sx={bgSx}>
      {bubblesJsx}

      {/* Back to site — admin only */}
      {isAdmin && (
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')}
          sx={{
            position: 'fixed', top: 20, left: 20, zIndex: 10,
            color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', textTransform: 'none',
            '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
          }}>
          Back to site
        </Button>
      )}

      <Fade key={`step2-${userType}`} in timeout={400}>
        <Paper elevation={24} sx={{
          display: 'flex', width: '100%',
          maxWidth: isAdmin ? 1000 : 1100,
          borderRadius: 4, overflow: 'hidden',
          minHeight: isAdmin ? 560 : 580,
          zIndex: 2, position: 'relative',
          backgroundColor: 'rgba(255,255,255,0.98)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
        }}>

          {/* ── Left branding panel (md+) ─────────────────────────────── */}
          <Box sx={{
            flex: 1, display: { xs: 'none', md: 'flex' },
            flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            background: activeGrad, color: 'white',
            p: 6, textAlign: 'center',
            position: 'relative', overflow: 'hidden',
            transition: 'background 0.5s ease',
            '&::before': {
              content: '""', position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1), transparent 50%)',
              animation: 'pulse 4s ease-in-out infinite',
            },
          }}>
            <Fade in timeout={600}>
              <Box sx={{ position: 'relative', zIndex: 1 }}>

                {isAdmin && (
                  <Box sx={{
                    width: 72, height: 72, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 3,
                  }}>
                    <Shield sx={{ fontSize: 40 }} />
                  </Box>
                )}

                <Typography variant="h2" fontWeight={900} gutterBottom>wewigo</Typography>

                {/* Adaptive tagline (public) or fixed (admin) */}
                <Fade key={userType} in timeout={400}>
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 1, opacity: 0.97 }}>
                      {isAdmin ? 'Administration Portal' : roleCopy.tagline}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.82, fontWeight: 300, mb: 4, maxWidth: 340, mx: 'auto', lineHeight: 1.6 }}>
                      {isAdmin
                        ? 'Manage campuses, accounts and platform configuration.'
                        : roleCopy.sub}
                    </Typography>
                  </Box>
                </Fade>

                {/* Floating emblem */}
                <Box sx={{ width: 170, height: 170, mx: 'auto', position: 'relative', animation: 'logoFloat 6s ease-in-out infinite' }}>
                  <Box sx={{ position: 'absolute', inset: 0,  borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)' }} />
                  <Box sx={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.3)', bgcolor: 'rgba(255,255,255,0.05)' }} />
                  <Box sx={{
                    position: 'absolute', inset: 44, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.18)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    backdropFilter: 'blur(4px)',
                  }}>
                    {isAdmin
                      ? <Shield sx={{ fontSize: 44, color: 'white' }} />
                      : <School  sx={{ fontSize: 44, color: 'white' }} />}
                  </Box>
                </Box>

              </Box>
            </Fade>
          </Box>

          {/* ── Right form panel ─────────────────────────────────────── */}
          <Box sx={{
            flex: 1, p: { xs: 3, sm: 5 }, bgcolor: 'white',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            overflowY: 'auto',
          }}>
            <Fade in timeout={500}>
              <Box>

                {/* "← Change role" — public step 2 only */}
                {!isAdmin && (
                  <Button
                    startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
                    onClick={() => setStep(1)}
                    size="small"
                    sx={{
                      mb: 2.5, textTransform: 'none', fontSize: '0.8rem',
                      color: 'text.secondary', pl: 0,
                      '&:hover': { color: activeColor, bgcolor: 'transparent' },
                    }}
                  >
                    Change role
                  </Button>
                )}

                {/* Header */}
                <Stack spacing={0.5} sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    {!isAdmin && (
                      <Box sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: alpha(activeColor, 0.1),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background-color 0.4s ease',
                      }}>
                        <RoleIcon sx={{ fontSize: 18, color: activeColor }} />
                      </Box>
                    )}
                    <Typography variant="h4" fontWeight={900} sx={{
                      background: activeGrad, transition: 'all 0.5s ease',
                      backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                      {isAdmin ? 'Administration' : `Sign in as ${currentType.label}`}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ pl: isAdmin ? 0 : 6.5 }}>
                    {isAdmin ? 'Sign in to access the management portal' : 'Enter your credentials to continue'}
                  </Typography>

                  {isAdmin && (
                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1,
                      px: 1.5, py: 0.5, borderRadius: 1, width: 'fit-content',
                      bgcolor: alpha(ADMIN_COLOR, 0.07),
                      border: `1px solid ${alpha(ADMIN_COLOR, 0.18)}`,
                    }}>
                      <Shield sx={{ fontSize: 13, color: ADMIN_COLOR }} />
                      <Typography variant="caption" sx={{ color: ADMIN_COLOR, fontWeight: 600, fontSize: '0.7rem' }}>
                        Restricted access — authorised personnel only
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Form */}
                <Box component="form" onSubmit={formik.handleSubmit} noValidate>
                  <Stack spacing={2.5}>

                    {/* Identifier field */}
                    <Box>
                      {!isAdmin && currentType.supportsUsername && (
                        <Tabs
                          value={identifierMode}
                          onChange={handleModeChange}
                          sx={{
                            mb: 1.5, minHeight: 36, borderBottom: 1, borderColor: 'divider',
                            '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontSize: '0.82rem', py: 0.5, px: 1.5 },
                            '& .Mui-selected':      { color: `${activeColor} !important`, fontWeight: 700 },
                            '& .MuiTabs-indicator': { backgroundColor: activeColor, transition: 'background-color 0.5s ease' },
                          }}
                        >
                          <Tab value="email"    label="Email"    icon={<MailOutline sx={{ fontSize: 15 }} />} iconPosition="start" />
                          <Tab value="username" label="Username" icon={<Badge sx={{ fontSize: 15 }} />}       iconPosition="start" />
                        </Tabs>
                      )}

                      <FormControl fullWidth error={formik.touched.identifier && Boolean(formik.errors.identifier)}>
                        <InputLabel htmlFor="login-identifier">
                          {isAdmin || identifierMode === 'email' ? 'Email address' : 'Username'}
                        </InputLabel>
                        <OutlinedInput
                          id="login-identifier" name="identifier"
                          label={isAdmin || identifierMode === 'email' ? 'Email address' : 'Username'}
                          value={formik.values.identifier}
                          onChange={formik.handleChange} onBlur={formik.handleBlur}
                          disabled={isLoading}
                          autoComplete={identifierMode === 'username' && !isAdmin ? 'username' : 'email'}
                          startAdornment={
                            <InputAdornment position="start">
                              {identifierMode === 'username' && !isAdmin
                                ? <Badge      sx={{ color: activeColor }} />
                                : <MailOutline sx={{ color: activeColor }} />}
                            </InputAdornment>
                          }
                          sx={{
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                            '&:hover .MuiOutlinedInput-notchedOutline':      { borderColor: activeColor },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: activeColor },
                          }}
                        />
                        {formik.touched.identifier && formik.errors.identifier && (
                          <FormHelperText>{formik.errors.identifier}</FormHelperText>
                        )}
                      </FormControl>
                    </Box>

                    {/* Password field */}
                    <FormControl fullWidth error={formik.touched.password && Boolean(formik.errors.password)}>
                      <InputLabel htmlFor="login-password">Password</InputLabel>
                      <OutlinedInput
                        id="login-password" name="password"
                        type={showPassword ? 'text' : 'password'}
                        label="Password"
                        value={formik.values.password}
                        onChange={formik.handleChange} onBlur={formik.handleBlur}
                        disabled={isLoading} autoComplete="current-password"
                        startAdornment={
                          <InputAdornment position="start">
                            <LockOutlined sx={{ color: activeColor }} />
                          </InputAdornment>
                        }
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword((p) => !p)}
                              edge="end" disabled={isLoading}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        }
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                          '&:hover .MuiOutlinedInput-notchedOutline':      { borderColor: activeColor },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: activeColor },
                        }}
                      />
                      {formik.touched.password && formik.errors.password && (
                        <FormHelperText>{formik.errors.password}</FormHelperText>
                      )}
                    </FormControl>

                    {/* Submit */}
                    <Button
                      type="submit" fullWidth size="large" variant="contained"
                      disabled={isLoading}
                      startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                      sx={{
                        py: 1.8, borderRadius: 2, fontWeight: 700,
                        fontSize: '1rem', textTransform: 'none',
                        background: activeGrad, transition: 'all 0.3s ease',
                        boxShadow: `0 8px 20px ${alpha(activeColor, 0.3)}`,
                        '&:hover':  { transform: 'translateY(-2px)', boxShadow: `0 12px 28px ${alpha(activeColor, 0.4)}` },
                        '&:active': { transform: 'translateY(0)' },
                      }}
                    >
                      {isLoading ? 'Connecting…' : isAdmin ? 'Sign in' : `Sign in as ${currentType.label}`}
                    </Button>
                  </Stack>
                </Box>

                {/* Footer */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {isAdmin ? 'Need help? Contact your system administrator.' : 'Need help? Contact your campus administrator.'}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setForgotOpen(true)}
                    sx={{ textTransform: 'none', fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap', ml: 1 }}
                  >
                    Forgot password?
                  </Button>
                </Stack>

              </Box>
            </Fade>
          </Box>

        </Paper>
      </Fade>

      {/* ── Forgot password modal ─────────────────────────────────────────── */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth
        disableEnforceFocus closeAfterTransition={false}
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            bgcolor: alpha(activeColor, 0.1),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LockReset sx={{ fontSize: 22, color: activeColor }} />
          </Box>
          Forgot your password?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {isAdmin
              ? 'To reset your password, please contact your system administrator. They can reset it from the admin dashboard.'
              : 'To reset your password, contact the administrator of your campus. They can reset it directly from their dashboard under your account.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setForgotOpen(false)}
            variant="contained" size="small"
            sx={{
              textTransform: 'none', borderRadius: 2, fontWeight: 600,
              background: activeGrad,
            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} slots={{ transition: Zoom }}>
        <Alert severity={snackbar.severity} variant="filled" elevation={6}
          onClose={closeSnackbar} sx={{ borderRadius: 2, fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}
