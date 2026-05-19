/**
 * @file PreRegistration.jsx
 * @description Public prospect pre-registration page.
 *
 * Route   : /register?ref=PARTNER_CODE
 * Flow    : resolveCode(ref) → campus branding → form → publicPreRegister
 * Security: honeypot field (anti-bot), rate-limited on backend (10 req/h/IP)
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  CircularProgress,
  Fade,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Paper,
  Stack,
  Typography,
  Zoom,
  alpha,
} from '@mui/material';
import {
  CheckCircleOutline,
  ErrorOutline,
  PersonOutline,
  EmailOutlined,
  PhoneOutlined,
  SchoolOutlined,
  Handshake,
} from '@mui/icons-material';

import { resolveCode, publicPreRegister } from '../../../services/partnerService';
import '../../styles/animated-background.css';

// ─── Partner brand colors ─────────────────────────────────────────────────────

const BRAND = {
  color:    '#ff7f3e',
  gradient: 'linear-gradient(135deg, #ff7f3e 0%, #ff9f5a 100%)',
};

// ─── Validation schema ────────────────────────────────────────────────────────

const schema = Yup.object({
  firstName:       Yup.string().trim().min(2, 'At least 2 characters').max(50).required('First name is required'),
  lastName:        Yup.string().trim().min(2, 'At least 2 characters').max(50).required('Last name is required'),
  email:           Yup.string().email('Invalid email address').required('Email is required'),
  phone:           Yup.string()
    .matches(/^[+\d\s\-()/]{7,20}$/, 'Invalid phone number')
    .required('Phone number is required'),
  programInterest: Yup.string().max(200),
  website:         Yup.string(), // honeypot — never shown to the user
});

// ─── Error message map ────────────────────────────────────────────────────────

const ERROR_MESSAGES = {
  409: 'This email or phone number is already registered for this campus.',
  422: 'You cannot register using your own partner link.',
  429: 'Too many registration attempts. Please try again in 1 hour.',
};

// ─────────────────────────────────────────────────────────────────────────────

export default function PreRegistration() {
  const [searchParams]  = useSearchParams();
  const partnerCode     = searchParams.get('ref') || '';

  const [campus,    setCampus]    = useState(null);
  const [resolving, setResolving] = useState(true);
  const [linkError, setLinkError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ─── Resolve partnerCode on mount ──────────────────────────────────────────

  useEffect(() => {
    if (!partnerCode) {
      setLinkError('No partner code found. Please use the link provided by your partner.');
      setResolving(false);
      return;
    }

    resolveCode(partnerCode)
      .then((res) => {
        setCampus(res.data?.data ?? res.data);
      })
      .catch(() => {
        setLinkError('This referral link is invalid or has expired.');
      })
      .finally(() => {
        setResolving(false);
      });
  }, [partnerCode]);

  // ─── Formik ─────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: {
      firstName:       '',
      lastName:        '',
      email:           '',
      phone:           '',
      programInterest: '',
      website:         '', // honeypot
    },
    validationSchema: schema,
    validateOnBlur: true,
    onSubmit: async (values) => {
      setIsLoading(true);
      setSubmitError('');
      try {
        await publicPreRegister({
          firstName:       values.firstName,
          lastName:        values.lastName,
          email:           values.email,
          phone:           values.phone,
          programInterest: values.programInterest,
          partnerCode,
          website:         values.website, // honeypot passed transparently
        });
        setSubmitted(true);
      } catch (err) {
        const status  = err.response?.status;
        const message = err.response?.data?.message;
        setSubmitError(ERROR_MESSAGES[status] || message || 'An error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
  });

  // ─── Loading state ───────────────────────────────────────────────────────────

  if (resolving) {
    return (
      <Box
        sx={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: BRAND.gradient,
        }}
      >
        <CircularProgress sx={{ color: 'white' }} size={48} />
      </Box>
    );
  }

  // ─── Invalid link state ──────────────────────────────────────────────────────

  if (linkError) {
    return (
      <Box
        sx={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          p: 2, background: BRAND.gradient,
        }}
        className="animated-background"
      >
        <Box className="bubbles">
          <span className="bubble b1" /><span className="bubble b2" />
          <span className="bubble b3" /><span className="bubble b4" />
        </Box>
        <Zoom in timeout={500}>
          <Paper
            elevation={24}
            sx={{ p: 5, maxWidth: 480, textAlign: 'center', borderRadius: 4, zIndex: 2, position: 'relative' }}
          >
            <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Invalid Link
            </Typography>
            <Typography color="text.secondary">{linkError}</Typography>
          </Paper>
        </Zoom>
      </Box>
    );
  }

  // ─── Success state ───────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <Box
        sx={{
          minHeight: '100vh', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          p: 2, background: BRAND.gradient,
        }}
        className="animated-background"
      >
        <Box className="bubbles">
          <span className="bubble b1" /><span className="bubble b2" />
          <span className="bubble b3" /><span className="bubble b4" />
        </Box>
        <Zoom in timeout={500}>
          <Paper
            elevation={24}
            sx={{ p: 5, maxWidth: 520, textAlign: 'center', borderRadius: 4, zIndex: 2, position: 'relative' }}
          >
            <CheckCircleOutline sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Registration Received!
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Thank you{formik.values.firstName ? `, ${formik.values.firstName}` : ''}. Your application has been submitted
              to{campus?.name ? ` ${campus.name}` : ' the campus'}.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Our admissions team will reach out to you shortly.
            </Typography>
          </Paper>
        </Zoom>
      </Box>
    );
  }

  // ─── Form ────────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        p: 2, background: BRAND.gradient,
        position: 'relative', overflow: 'hidden',
      }}
      className="animated-background"
    >
      <Box className="bubbles">
        <span className="bubble b1" /><span className="bubble b2" />
        <span className="bubble b3" /><span className="bubble b4" />
      </Box>

      <Zoom in timeout={600}>
        <Paper
          elevation={24}
          sx={{
            display: 'flex', width: '100%', maxWidth: 960,
            borderRadius: 4, overflow: 'hidden',
            zIndex: 2, position: 'relative',
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255,255,255,0.98)',
            boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
          }}
        >
          {/* ── Left branding panel ── */}
          <Box
            sx={{
              flex: 1, display: { xs: 'none', md: 'flex' },
              flexDirection: 'column', justifyContent: 'center',
              alignItems: 'center', background: BRAND.gradient,
              color: 'white', p: 6, textAlign: 'center',
              position: 'relative', overflow: 'hidden',
              transition: 'background 0.5s ease',
              '&::before': {
                content: '""', position: 'absolute', inset: 0,
                background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.12), transparent 55%)',
              },
            }}
          >
            <Fade in timeout={1000}>
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Handshake sx={{ fontSize: 72, mb: 2, opacity: 0.95 }} />
                <Typography variant="h4" fontWeight={900} gutterBottom>
                  {campus?.name ?? 'Enroll Today'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 300, maxWidth: 320, mx: 'auto' }}>
                  Fill in your details and our admissions team will contact you shortly.
                </Typography>
                {partnerCode && (
                  <Box
                    sx={{
                      mt: 4, px: 2.5, py: 1, borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.18)', display: 'inline-block',
                    }}
                  >
                    <Typography variant="caption" sx={{ opacity: 0.85, letterSpacing: 1 }}>
                      Partner code: <strong>{partnerCode}</strong>
                    </Typography>
                  </Box>
                )}
              </Box>
            </Fade>
          </Box>

          {/* ── Right form panel ── */}
          <Box
            sx={{
              flex: 1, p: { xs: 3, sm: 5 }, bgcolor: 'white',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}
          >
            <Fade in timeout={800}>
              <Box>
                <Stack spacing={0.5} sx={{ mb: 4 }}>
                  <Typography
                    variant="h4" fontWeight={900}
                    sx={{
                      background: BRAND.gradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Pre-Register
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start your admission process — no commitment required.
                  </Typography>
                </Stack>

                {/* Honeypot — hidden from real users */}
                <Box
                  aria-hidden="true"
                  sx={{
                    position: 'absolute', left: '-9999px', top: '-9999px',
                    opacity: 0, height: 0, width: 0, overflow: 'hidden',
                  }}
                >
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formik.values.website}
                    onChange={formik.handleChange}
                  />
                </Box>

                <form onSubmit={formik.handleSubmit} noValidate>
                  <Stack spacing={2.5}>

                    {/* First + Last name row */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <FormControl
                        fullWidth
                        error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                      >
                        <InputLabel htmlFor="pr-firstName">First Name</InputLabel>
                        <OutlinedInput
                          id="pr-firstName"
                          name="firstName"
                          label="First Name"
                          value={formik.values.firstName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          disabled={isLoading}
                          autoComplete="given-name"
                          startAdornment={<PersonOutline sx={{ color: BRAND.color, mr: 1 }} />}
                          sx={{ borderRadius: 2 }}
                        />
                        {formik.touched.firstName && formik.errors.firstName && (
                          <FormHelperText>{formik.errors.firstName}</FormHelperText>
                        )}
                      </FormControl>

                      <FormControl
                        fullWidth
                        error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                      >
                        <InputLabel htmlFor="pr-lastName">Last Name</InputLabel>
                        <OutlinedInput
                          id="pr-lastName"
                          name="lastName"
                          label="Last Name"
                          value={formik.values.lastName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          disabled={isLoading}
                          autoComplete="family-name"
                          startAdornment={<PersonOutline sx={{ color: BRAND.color, mr: 1 }} />}
                          sx={{ borderRadius: 2 }}
                        />
                        {formik.touched.lastName && formik.errors.lastName && (
                          <FormHelperText>{formik.errors.lastName}</FormHelperText>
                        )}
                      </FormControl>
                    </Stack>

                    {/* Email */}
                    <FormControl
                      fullWidth
                      error={formik.touched.email && Boolean(formik.errors.email)}
                    >
                      <InputLabel htmlFor="pr-email">Email Address</InputLabel>
                      <OutlinedInput
                        id="pr-email"
                        type="email"
                        name="email"
                        label="Email Address"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={isLoading}
                        autoComplete="email"
                        startAdornment={<EmailOutlined sx={{ color: BRAND.color, mr: 1 }} />}
                        sx={{ borderRadius: 2 }}
                      />
                      {formik.touched.email && formik.errors.email && (
                        <FormHelperText>{formik.errors.email}</FormHelperText>
                      )}
                    </FormControl>

                    {/* Phone */}
                    <FormControl
                      fullWidth
                      error={formik.touched.phone && Boolean(formik.errors.phone)}
                    >
                      <InputLabel htmlFor="pr-phone">Phone Number</InputLabel>
                      <OutlinedInput
                        id="pr-phone"
                        type="tel"
                        name="phone"
                        label="Phone Number"
                        value={formik.values.phone}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={isLoading}
                        autoComplete="tel"
                        startAdornment={<PhoneOutlined sx={{ color: BRAND.color, mr: 1 }} />}
                        sx={{ borderRadius: 2 }}
                      />
                      {formik.touched.phone && formik.errors.phone && (
                        <FormHelperText>{formik.errors.phone}</FormHelperText>
                      )}
                    </FormControl>

                    {/* Program interest (optional) */}
                    <FormControl
                      fullWidth
                      error={formik.touched.programInterest && Boolean(formik.errors.programInterest)}
                    >
                      <InputLabel htmlFor="pr-program">Program of Interest (optional)</InputLabel>
                      <OutlinedInput
                        id="pr-program"
                        name="programInterest"
                        label="Program of Interest (optional)"
                        value={formik.values.programInterest}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        disabled={isLoading}
                        startAdornment={<SchoolOutlined sx={{ color: BRAND.color, mr: 1 }} />}
                        sx={{ borderRadius: 2 }}
                      />
                      {formik.touched.programInterest && formik.errors.programInterest && (
                        <FormHelperText>{formik.errors.programInterest}</FormHelperText>
                      )}
                    </FormControl>

                    {/* Submit error */}
                    {submitError && (
                      <Box
                        sx={{
                          p: 1.5, borderRadius: 2,
                          bgcolor: alpha('#f44336', 0.08),
                          border: '1px solid', borderColor: alpha('#f44336', 0.3),
                        }}
                      >
                        <Typography variant="body2" color="error.main">
                          {submitError}
                        </Typography>
                      </Box>
                    )}

                    {/* Submit button */}
                    <Button
                      type="submit"
                      fullWidth
                      size="large"
                      variant="contained"
                      disabled={isLoading}
                      startIcon={
                        isLoading
                          ? <CircularProgress size={20} color="inherit" />
                          : <Handshake />
                      }
                      sx={{
                        py: 1.8, borderRadius: 2, fontWeight: 'bold',
                        fontSize: '1rem', textTransform: 'none',
                        background: BRAND.gradient,
                        boxShadow: `0 8px 20px ${alpha(BRAND.color, 0.3)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 12px 28px ${alpha(BRAND.color, 0.4)}`,
                        },
                        '&:active': { transform: 'translateY(0)' },
                      }}
                    >
                      {isLoading ? 'Submitting…' : 'Submit Application'}
                    </Button>

                    <Typography variant="caption" color="text.secondary" textAlign="center">
                      By submitting this form you agree to be contacted regarding your admission.
                    </Typography>
                  </Stack>
                </form>
              </Box>
            </Fade>
          </Box>
        </Paper>
      </Zoom>
    </Box>
  );
}
