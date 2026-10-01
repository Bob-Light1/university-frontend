/**
 * @file LoginPage.jsx
 * @description Application component with shared deployment branding.
 */
import Brand from './shared/Brand';
import { BRAND } from '../config/brand';
import { useEffect, useRef, useState }                   from 'react';
import { Link, useNavigate, useLocation }   from 'react-router-dom';
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

// ── Admin schema ──────────────────────────────────────────────────────────────

const adminSchema = Yup.object({
  identifier: yupEmail(),
  password:   yupPasswordLogin(),
});

// ─────────────────────────────────────────────────────────────────────────────

/** Accessible role selection and shared credential form, preserving login routing. */
export default function LoginPage({ variant = 'public' }) {
  const isAdmin   = variant === 'admin';
  const navigate  = useNavigate();
  const { state } = useLocation();
  const { login } = useAuth();
  const { t }     = useAppTranslation(['auth', 'common']);
  const { palette: { mode } } = useTheme();

  const identifierInput = useRef(null);
  const roleButtons = useRef({});
  const previousStep = useRef(1);

  const [step,           setStep]           = useState(1); // 1 = role picker, 2 = form
  const [showPassword,   setShowPassword]   = useState(false);
  const [userType,       setUserType]       = useState('manager');
  const [identifierMode, setIdentifierMode] = useState('email');
  const [forgotOpen,     setForgotOpen]     = useState(false);
  const [snackbar,       setSnackbar]       = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (step === previousStep.current) return;
    previousStep.current = step;
    const target = step === 2 ? identifierInput.current : roleButtons.current[userType];
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, [step, userType]);

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
    setShowPassword(false);
    setStep(2);
  };

  const handleModeChange = (_, mode) => {
    setIdentifierMode(mode);
    formik.setFieldValue('identifier', '');
    formik.setFieldTouched('identifier', false);
  };

  const closeSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  // Keep semantic error/disabled boundaries when role-colored fields are focused.
  const inputSx = {
    borderRadius: 2,
    '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2, borderColor: 'text.secondary' },
    '&:hover:not(.Mui-error):not(.Mui-disabled) .MuiOutlinedInput-notchedOutline': { borderColor: activeAccent },
    '&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: activeAccent },
  };

  // ── Shared background wrapper ─────────────────────────────────────────────

  const bgSx = {
    minHeight: isAdmin ? '100dvh' : 'calc(100dvh - 80px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    px: { xs: 2, sm: 3 }, py: { xs: isAdmin ? 8 : 4, sm: 6 }, position: 'relative',
    background: isAdmin ? activeGrad : 'var(--entry-bg)',
    '& *, & *::before, & *::after': {
      '@media (prefers-reduced-motion: reduce)': { animation: 'none !important', transition: 'none !important' },
    },
    '& .MuiButton-root:focus-visible, & .MuiIconButton-root:focus-visible': {
      outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 3,
    },
    '& input': { scrollMarginTop: '110px' },
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1 — Role picker (public variant only)
  // ─────────────────────────────────────────────────────────────────────────

  if (!isAdmin && step === 1) {
    return (
      <Box className="product-login-page" sx={bgSx}>
        <Box sx={{ width: '100%', maxWidth: 1000, textAlign: 'center' }}>
          <Typography component="h1" variant="h3" fontWeight={700}
            sx={{ color: 'var(--ink)', fontSize: { xs: '2rem', sm: '2.6rem' }, mb: 1 }}>
            {t('login.title')}
          </Typography>
          <Typography sx={{ color: 'var(--muted)', mb: { xs: 3, sm: 4 } }}>{t('login.step1.whoAreYou')}</Typography>
          <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
            gap: { xs: 1.5, sm: 2 }, mb: 3,
            '@media (max-width: 359px)': { gridTemplateColumns: '1fr' },
          }}>
            {USER_TYPES.map(type => {
              const { value, icon: Icon, color } = type;
              const cardAccent = roleAccent(mode, color);
              return <Box component="button" type="button" key={value} data-login-role={value}
                ref={element => { roleButtons.current[value] = element; }} onClick={() => selectRole(value)}
                sx={{
                  cursor: 'pointer', font: 'inherit', textAlign: 'center', minWidth: 0,
                  bgcolor: 'background.paper', color: 'text.primary', borderRadius: 3,
                  p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                  border: '1px solid', borderColor: 'divider', boxShadow: '0 3px 12px rgba(0,0,0,0.03)',
                  transition: 'border-color .2s, box-shadow .2s',
                  '&:hover': { borderColor: cardAccent, boxShadow: `0 5px 18px ${alpha(cardAccent, 0.15)}` },
                  '&:focus-visible': { outline: `3px solid ${cardAccent}`, outlineOffset: 3 },
                }}>
                <Box component="span" sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: alpha(cardAccent, 0.1), display: 'grid', placeItems: 'center' }}>
                  <Icon sx={{ fontSize: 26, color: cardAccent }} />
                </Box>
                <Typography component="span" fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{t(`login.roles.${value}.label`)}</Typography>
                <Typography component="span" variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: '0.82rem' }}>{t(`login.roles.${value}.description`)}</Typography>
              </Box>;
            })}
            <Box component={Link} to="/" aria-label={t('login.step1.backToHomeAria', { brand: BRAND.name })}
              sx={{ p: 3, borderRadius: 3, border: '1px dashed', borderColor: 'divider', color: 'var(--muted)', textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, '&:hover': { color: 'var(--ink)', bgcolor: 'action.hover' }, '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 3 } }}>
              <HomeIcon /><Typography component="span" variant="body2">{t('login.step1.backToHome')}</Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: 'var(--muted)' }}>{t('login.step1.clickRole')}</Typography>
        </Box>
      </Box>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2 — Login form (both variants)
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Box className={isAdmin ? undefined : "product-login-page"} sx={bgSx}>

      {/* Back to site — admin only */}
      {isAdmin && (
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/')}
          sx={{
            position: 'absolute', top: 12, insetInlineStart: 12, zIndex: 10,
            color: 'white', fontSize: '0.78rem', textTransform: 'none',
            '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
          }}>
          {t('login.admin.backToSite')}
        </Button>
      )}

      <Fade key={`step2-${userType}`} in timeout={400}>
        <Paper elevation={24} sx={{
          display: 'flex', width: '100%',
          maxWidth: isAdmin ? 1000 : 980,
          borderRadius: 4, overflow: 'hidden',
          minHeight: { xs: 'auto', md: 560 },
          zIndex: 2, position: 'relative',
          backgroundColor: (t) => alpha(t.palette.background.paper, 0.98),
          boxShadow: '0 16px 48px rgba(0,0,0,0.10)', border: '1px solid', borderColor: 'divider',
        }}>

          {/* ── Left branding panel (md+) ─────────────────────────────── */}
          <Box sx={{
            flex: 1, display: { xs: 'none', md: 'flex' },
            flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            background: activeColor, color: 'white',
            p: 6, textAlign: 'center',
            position: 'relative', overflow: 'hidden',
            transition: 'background 0.5s ease',
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

                <Typography variant="h2" fontWeight={900} gutterBottom><Brand /></Typography>

                {/* Adaptive tagline (public) or fixed (admin) */}
                <Fade key={userType} in timeout={400}>
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ mb: 1, opacity: 0.97 }}>
                      {isAdmin ? t('login.admin.portalTitle') : roleTagline}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 300, mb: 4, maxWidth: 340, mx: 'auto', lineHeight: 1.6 }}>
                      {isAdmin ? t('login.admin.portalSub') : roleSub}
                    </Typography>
                  </Box>
                </Fade>

                {/* Static emblem */}
                <Box sx={{ width: 170, height: 170, mx: 'auto', position: 'relative' }}>
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
            flex: 1, minWidth: 0, p: { xs: 2.5, sm: 4, md: 5 }, bgcolor: 'background.paper',
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
                    data-testid="login-change-role"
                    disabled={isLoading}
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
                    <Typography component="h1" variant="h4" fontWeight={700} sx={{
                      color: 'text.primary', fontSize: { xs: '1.6rem', sm: '2rem' }, overflowWrap: 'anywhere',
                    }}>
                      {isAdmin ? t('login.admin.heading') : t('login.public.signInAs', { role: roleLabel })}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
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
                          aria-label={t('login.emailTab') + ' / ' + t('login.username')}
                          variant="fullWidth"
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
                          inputRef={identifierInput}
                          type={identifierMode === 'email' ? 'email' : 'text'}
                          inputProps={{ autoCapitalize: 'none', spellCheck: false }}
                          aria-describedby={formik.touched.identifier && formik.errors.identifier ? 'login-identifier-error' : undefined}
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
                          sx={inputSx}
                        />
                        {formik.touched.identifier && formik.errors.identifier && (
                          <FormHelperText id="login-identifier-error">{formik.errors.identifier}</FormHelperText>
                        )}
                      </FormControl>
                    </Box>

                    {/* Password field */}
                    <FormControl fullWidth error={formik.touched.password && Boolean(formik.errors.password)}>
                      <InputLabel htmlFor="login-password">{t('login.password')}</InputLabel>
                      <OutlinedInput
                        id="login-password" name="password"
                        aria-describedby={formik.touched.password && formik.errors.password ? 'login-password-error' : undefined}
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
                        sx={inputSx}
                      />
                      {formik.touched.password && formik.errors.password && (
                        <FormHelperText id="login-password-error">{formik.errors.password}</FormHelperText>
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
                        background: mode === 'dark' ? activeAccent : activeColor,
                        color: mode === 'dark' ? 'background.paper' : '#fff',
                        transition: 'box-shadow .2s ease',
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
                <Stack spacing={1} alignItems="flex-start" sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {isAdmin ? t('login.admin.needHelp') : t('login.public.needHelp')}
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setForgotOpen(true)}
                    sx={{ textTransform: 'none', fontSize: '0.78rem', color: 'text.secondary', minHeight: 44, px: 0, textAlign: 'start' }}
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
              background: mode === 'dark' ? activeAccent : activeColor,
              color: mode === 'dark' ? 'background.paper' : '#fff',
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
