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
import { lighten, useTheme } from '@mui/material/styles';
import {
  MailOutline, LockOutlined, Visibility, VisibilityOff,
  Login as LoginIcon, ArrowBack, Shield,
  Business, School, Badge, RecordVoiceOver,
  FamilyRestroom, Psychology, Handshake,
  LockReset, Home as HomeIcon,
} from '@mui/icons-material';

import { useAuth }                    from '../hooks/useAuth';
import { useAppTranslation }          from '../hooks/useAppTranslation';
import { loginSchema }                from '../yupSchema/loginSchema';
import { yupEmail, yupPasswordLogin } from '../utils/validationRules';

// ── User types ────────────────────────────────────────────────────────────────
// Visual/behavioural metadata only. Human-readable copy (label, description,
// tagline, sub) lives in the `auth` namespace under `login.roles.<value>`.

const USER_TYPES = [
  {
    value: 'manager', icon: Business,
    gradient: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)', color: '#003285',
    supportsUsername: false,
  },
  {
    value: 'student', icon: School,
    gradient: 'linear-gradient(135deg, #2a629a 0%, #4989c8 100%)', color: '#2a629a',
    supportsUsername: true,
  },
  {
    value: 'teacher', icon: RecordVoiceOver,
    gradient: 'linear-gradient(135deg, #2a629a 0%, #003285 100%)', color: '#2a629a',
    supportsUsername: true,
  },
  {
    value: 'parent', icon: FamilyRestroom,
    gradient: 'linear-gradient(135deg, #311b92 0%, #c2185b 100%)', color: '#7b1fa2',
    supportsUsername: true,
  },
  {
    value: 'mentor', icon: Psychology,
    gradient: 'linear-gradient(135deg, #003285 0%, #4989c8 100%)', color: '#003285',
    supportsUsername: true,
  },
  {
    value: 'partner', icon: Handshake,
    // #e65100 only reached 3.79:1 on white — too low for the small bold tab
    // labels that use it. #c2410c keeps the gradient's orange family at 5.18:1.
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #bf360c 100%)', color: '#c2410c',
    supportsUsername: false,
  },
  {
    value: 'staff', icon: Badge,
    gradient: 'linear-gradient(135deg, #00695C 0%, #26A69A 100%)', color: '#00695C',
    supportsUsername: true,
  },
];

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

/**
 * Role/brand accent tuned to the current surface. The brand hexes above are deep
 * enough for white-on-brand gradients but illegible as a foreground on the dark
 * `paper` surface — lighten them when the palette flips.
 * @param {('light'|'dark')} mode
 * @param {string} color
 * @returns {string}
 */
const roleAccent = (mode, color) => (mode === 'dark' ? lighten(color, 0.45) : color);

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
  const { t }     = useAppTranslation(['auth', 'common']);
  const { palette: { mode } } = useTheme();

  const [step,           setStep]           = useState(1); // 1 = role picker, 2 = form
  const [showPassword,   setShowPassword]   = useState(false);
  const [userType,       setUserType]       = useState('manager');
  const [identifierMode, setIdentifierMode] = useState('email');
  const [forgotOpen,     setForgotOpen]     = useState(false);
  const [snackbar,       setSnackbar]       = useState({ open: false, message: '', severity: 'success' });

  const currentType = USER_TYPES.find((ut) => ut.value === userType) ?? USER_TYPES[0];
  const RoleIcon    = currentType.icon;
  const roleLabel   = t(`login.roles.${userType}.label`);
  const roleTagline = t(`login.roles.${userType}.tagline`);
  const roleSub     = t(`login.roles.${userType}.sub`);
  const activeGrad  = isAdmin ? ADMIN_GRADIENT : currentType.gradient;
  const activeColor = isAdmin ? ADMIN_COLOR    : currentType.color;
  // Same hue, but legible when it lands on the `paper` surface (form panel,
  // dialog) instead of on the brand gradient.
  const activeAccent = roleAccent(mode, activeColor);

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
        setSnackbar({ open: true, message: t('login.welcomeBack'), severity: 'success' });
        setTimeout(() => navigate(dest, { replace: true }), 900);
      } catch (err) {
        setSnackbar({ open: true, message: err.message || t('login.failed'), severity: 'error' });
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
              {t('login.step1.whoAreYou')}
            </Typography>

            {/* Role cards grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: { xs: 1.5, sm: 2 },
              mb: 4,
            }}>
              {USER_TYPES.map(({ value, icon: Icon, color }) => {
                const sel = userType === value;
                const cardAccent = roleAccent(mode, color);
                return (
                  <Box
                    key={value}
                    role="button" tabIndex={0}
                    onClick={() => selectRole(value)}
                    onKeyDown={(e) => e.key === 'Enter' && selectRole(value)}
                    sx={{
                      // The card sits on the brand gradient but is a real surface:
                      // it must follow the palette, otherwise `text.primary`
                      // (white in dark mode) lands on a hardcoded white card.
                      cursor: 'pointer', outline: 'none',
                      bgcolor: 'background.paper', borderRadius: 3,
                      p: { xs: 2, sm: 3 },
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                      border: `2px solid ${sel ? cardAccent : 'transparent'}`,
                      boxShadow: sel
                        ? `0 8px 32px ${alpha(cardAccent, 0.35)}`
                        : '0 2px 12px rgba(0,0,0,0.1)',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        borderColor: cardAccent,
                        boxShadow: `0 14px 40px ${alpha(cardAccent, 0.3)}`,
                      },
                      '&:focus-visible': {
                        boxShadow: (t) => `0 0 0 3px ${t.palette.background.paper}, 0 0 0 5px ${cardAccent}`,
                      },
                    }}
                  >
                    <Box sx={{
                      width: 60, height: 60, borderRadius: '50%',
                      bgcolor: alpha(cardAccent, 0.1),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon sx={{ fontSize: 30, color: cardAccent }} />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                      {t(`login.roles.${value}.label`)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, textAlign: 'center' }}>
                      {t(`login.roles.${value}.description`)}
                    </Typography>
                  </Box>
                );
              })}

              {/* 8th card — wewigo home, balances the 4-column grid */}
              <Box
                role="button" tabIndex={0}
                onClick={() => navigate('/')}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
                aria-label={t('login.step1.backToHomeAria')}
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
                  {t('login.step1.backToHome')}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {t('login.step1.clickRole')}
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
          {t('login.admin.backToSite')}
        </Button>
      )}

      <Fade key={`step2-${userType}`} in timeout={400}>
        <Paper elevation={24} sx={{
          display: 'flex', width: '100%',
          maxWidth: isAdmin ? 1000 : 1100,
          borderRadius: 4, overflow: 'hidden',
          minHeight: isAdmin ? 560 : 580,
          zIndex: 2, position: 'relative',
          backgroundColor: (t) => alpha(t.palette.background.paper, 0.98),
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
                      {isAdmin ? t('login.admin.portalTitle') : roleTagline}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.82, fontWeight: 300, mb: 4, maxWidth: 340, mx: 'auto', lineHeight: 1.6 }}>
                      {isAdmin ? t('login.admin.portalSub') : roleSub}
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
            flex: 1, p: { xs: 3, sm: 5 }, bgcolor: 'background.paper',
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
                      '&:hover': { color: activeAccent, bgcolor: 'transparent' },
                    }}
                  >
                    {t('login.public.changeRole')}
                  </Button>
                )}

                {/* Header */}
                <Stack spacing={0.5} sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    {!isAdmin && (
                      <Box sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: alpha(activeAccent, 0.1),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background-color 0.4s ease',
                      }}>
                        <RoleIcon sx={{ fontSize: 18, color: activeAccent }} />
                      </Box>
                    )}
                    {/* Gradient-clipped text is unreadable on a dark surface
                        (the brand stops are near-black there) — fall back to the
                        surface-legible accent. */}
                    <Typography variant="h4" fontWeight={900} sx={{
                      transition: 'all 0.5s ease',
                      ...(mode === 'dark'
                        ? { color: activeAccent }
                        : {
                            background: activeGrad,
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }),
                    }}>
                      {isAdmin ? t('login.admin.heading') : t('login.public.signInAs', { role: roleLabel })}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ pl: isAdmin ? 0 : 6.5 }}>
                    {isAdmin ? t('login.admin.subheading') : t('login.public.enterCredentials')}
                  </Typography>

                  {isAdmin && (
                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.75, mt: 1,
                      px: 1.5, py: 0.5, borderRadius: 1, width: 'fit-content',
                      bgcolor: alpha(activeAccent, 0.07),
                      border: `1px solid ${alpha(activeAccent, 0.18)}`,
                    }}>
                      <Shield sx={{ fontSize: 13, color: activeAccent }} />
                      <Typography variant="caption" sx={{ color: activeAccent, fontWeight: 600, fontSize: '0.7rem' }}>
                        {t('login.admin.restricted')}
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
                            '& .Mui-selected':      { color: `${activeAccent} !important`, fontWeight: 700 },
                            '& .MuiTabs-indicator': { backgroundColor: activeAccent, transition: 'background-color 0.5s ease' },
                          }}
                        >
                          <Tab value="email"    label={t('login.emailTab')} icon={<MailOutline sx={{ fontSize: 15 }} />} iconPosition="start" />
                          <Tab value="username" label={t('login.username')} icon={<Badge sx={{ fontSize: 15 }} />}       iconPosition="start" />
                        </Tabs>
                      )}

                      <FormControl fullWidth error={formik.touched.identifier && Boolean(formik.errors.identifier)}>
                        <InputLabel htmlFor="login-identifier">
                          {isAdmin || identifierMode === 'email' ? t('login.email') : t('login.username')}
                        </InputLabel>
                        <OutlinedInput
                          id="login-identifier" name="identifier"
                          label={isAdmin || identifierMode === 'email' ? t('login.email') : t('login.username')}
                          value={formik.values.identifier}
                          onChange={formik.handleChange} onBlur={formik.handleBlur}
                          disabled={isLoading}
                          autoComplete={identifierMode === 'username' && !isAdmin ? 'username' : 'email'}
                          startAdornment={
                            <InputAdornment position="start">
                              {identifierMode === 'username' && !isAdmin
                                ? <Badge      sx={{ color: activeAccent }} />
                                : <MailOutline sx={{ color: activeAccent }} />}
                            </InputAdornment>
                          }
                          sx={{
                            borderRadius: 2,
                            '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                            '&:hover .MuiOutlinedInput-notchedOutline':      { borderColor: activeAccent },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: activeAccent },
                          }}
                        />
                        {formik.touched.identifier && formik.errors.identifier && (
                          <FormHelperText>{formik.errors.identifier}</FormHelperText>
                        )}
                      </FormControl>
                    </Box>

                    {/* Password field */}
                    <FormControl fullWidth error={formik.touched.password && Boolean(formik.errors.password)}>
                      <InputLabel htmlFor="login-password">{t('login.password')}</InputLabel>
                      <OutlinedInput
                        id="login-password" name="password"
                        type={showPassword ? 'text' : 'password'}
                        label={t('login.password')}
                        value={formik.values.password}
                        onChange={formik.handleChange} onBlur={formik.handleBlur}
                        disabled={isLoading} autoComplete="current-password"
                        startAdornment={
                          <InputAdornment position="start">
                            <LockOutlined sx={{ color: activeAccent }} />
                          </InputAdornment>
                        }
                        endAdornment={
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword((p) => !p)}
                              edge="end" disabled={isLoading}
                              aria-label={showPassword ? t('common:a11y.hidePassword') : t('common:a11y.showPassword')}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        }
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
                          '&:hover .MuiOutlinedInput-notchedOutline':      { borderColor: activeAccent },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: activeAccent },
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
                      {isLoading ? t('login.connecting') : isAdmin ? t('login.admin.submit') : t('login.public.signInAs', { role: roleLabel })}
                    </Button>
                  </Stack>
                </Box>

                {/* Footer */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {isAdmin ? t('login.admin.needHelp') : t('login.public.needHelp')}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setForgotOpen(true)}
                    sx={{ textTransform: 'none', fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap', ml: 1 }}
                  >
                    {t('login.forgotPassword')}
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
            bgcolor: alpha(activeAccent, 0.1),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LockReset sx={{ fontSize: 22, color: activeAccent }} />
          </Box>
          {t('login.forgot.title')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {isAdmin ? t('login.forgot.adminBody') : t('login.forgot.publicBody')}
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
            {t('login.forgot.gotIt')}
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
