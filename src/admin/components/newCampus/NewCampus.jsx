/**
 * @file NewCampus.jsx
 * @description Campus creation form — restricted to authenticated ADMIN users.
 *   This page is NOT linked in the public Navbar or Footer.
 *   Access path: /admin → Admin dashboard → "Create Campus" button.
 *   Route protection: ProtectedRoute(allowedRoles=['ADMIN']) in AdminRoutes.jsx.
 *
 *   Changes vs previous version:
 *   - Added a "← Back to admin" navigation link at the top.
 *   - Header gradient updated to match brand palette (#003285 / #2a629a).
 *   - No logic / validation changes.
 *   - FormControl + InputLabel + OutlinedInput pattern preserved throughout.
 */

import { useState }              from 'react';
import { useNavigate }           from 'react-router-dom';
import { useFormik }             from 'formik';
import {
  Box, Card, CardContent, Container, Typography, Grid,
  Button, Snackbar, Alert, IconButton, InputLabel,
  InputAdornment, FormControl, OutlinedInput,
  FormHelperText, CircularProgress, Divider, Paper,
  Fade, Zoom, Stepper, Step, StepLabel, alpha,
  useTheme, useMediaQuery,
} from '@mui/material';
import {
  Visibility, VisibilityOff,
  Business, Person, Email, Phone, Lock, LocationOn,
  PhotoCamera, CheckCircle, ArrowBack, ArrowForward,
  Shield,
} from '@mui/icons-material';
import axios                     from 'axios';

import { createCampusSchema }    from '../../../yupSchema/createCampusSchema';
import UploadCampusImage         from '../../../client/utility-components/uploadImage/UploadCampusImage';
import { API_BASE_URL }          from '../../../config/env';

// ─── Step labels ──────────────────────────────────────────────────────────────

const STEPS = ['Campus Information', 'Manager Details', 'Location & Image'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NewCampus() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [imageResetKey, setImageResetKey] = useState(0);
  const [isLoading,    setIsLoading]     = useState(false);
  const [activeStep,   setActiveStep]   = useState(0);
  const [snackbar,     setSnackbar]      = useState({ open: false, message: '', severity: 'success' });

  // ── Formik ──────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: {
      campus_name:    '',
      campus_number:  '',
      manager_name:   '',
      manager_phone:  '',
      email:          '',
      password:       '',
      confirm_password: '',
      campus_image:   null,
      location: {
        address: '', city: '', country: 'Cameroon',
        coordinates: { lat: null, lng: null },
      },
    },
    validationSchema: createCampusSchema,
    validateOnChange: true,
    validateOnBlur:   true,
    onSubmit: async (values) => {
      if (!values.campus_image) {
        setSnackbar({ open: true, message: 'Please select a campus image.', severity: 'warning' });
        return;
      }
      setIsLoading(true);
      try {
        const formData = new FormData();
        formData.append('campus_name',   values.campus_name);
        formData.append('manager_name',  values.manager_name);
        formData.append('email',         values.email);
        formData.append('password',      values.password);
        formData.append('manager_phone', values.manager_phone);
        if (values.campus_number) formData.append('campus_number', values.campus_number);
        if (values.campus_image instanceof File)
          formData.append('campus_image', values.campus_image, values.campus_image.name);
        if (values.location.address) formData.append('location[address]', values.location.address);
        if (values.location.city)    formData.append('location[city]',    values.location.city);
        formData.append('location[country]', values.location.country);

        await axios.post(`${API_BASE_URL}/campus/create`, formData, {
          headers: {
            'Content-Type':  'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          timeout: 30000, // 30 s — prevents infinite spinner if server hangs
        });

        setSnackbar({ open: true, message: '✨ Campus created successfully!', severity: 'success' });
        formik.resetForm();
        setImageResetKey((p) => p + 1);
        setActiveStep(0);

      } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED';
        setSnackbar({
          open:     true,
          message:  isTimeout
            ? 'Request timed out. Please check your connection and try again.'
            : error.response?.data?.message || 'An error occurred while creating the campus.',
          severity: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  // ── Step navigation ──────────────────────────────────────────────────────────

  const STEP_FIELDS = [
    ['campus_name', 'campus_number'],
    ['manager_name', 'manager_phone', 'email', 'password', 'confirm_password'],
    ['campus_image'],
  ];

  const handleNext = () => {
    const fields = STEP_FIELDS[activeStep];
    const hasErrors = fields.some((f) => formik.touched[f] && formik.errors[f]);
    if (hasErrors) { fields.forEach((f) => formik.setFieldTouched(f, true)); return; }
    setActiveStep((p) => p + 1);
  };

  const handleBack = () => setActiveStep((p) => p - 1);

  // ── Step content ─────────────────────────────────────────────────────────────

  const getStepContent = (step) => {
    // Shared input styles
    const inputSx = {
      borderRadius: 2,
      '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
    };

    switch (step) {
      // ── Step 0: Campus info ──────────────────────────────────────────────────
      case 0:
        return (
          <Fade in timeout={500}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <SectionTitle>Campus Information</SectionTitle>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth error={formik.touched.campus_name && Boolean(formik.errors.campus_name)}>
                  <InputLabel htmlFor="campus_name">Campus Name *</InputLabel>
                  <OutlinedInput
                    id="campus_name" name="campus_name" label="Campus Name *"
                    value={formik.values.campus_name}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                    disabled={isLoading}
                    startAdornment={<InputAdornment position="start"><Business sx={{ color: 'primary.main' }} /></InputAdornment>}
                    sx={inputSx}
                  />
                  {formik.touched.campus_name && formik.errors.campus_name && (
                    <FormHelperText>{formik.errors.campus_name}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth error={formik.touched.campus_number && Boolean(formik.errors.campus_number)}>
                  <InputLabel htmlFor="campus_number">Campus Number (Optional)</InputLabel>
                  <OutlinedInput
                    id="campus_number" name="campus_number" label="Campus Number (Optional)"
                    value={formik.values.campus_number}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                    disabled={isLoading}
                    startAdornment={<InputAdornment position="start"><Business sx={{ color: 'text.secondary' }} /></InputAdornment>}
                    sx={inputSx}
                  />
                  {formik.touched.campus_number && formik.errors.campus_number && (
                    <FormHelperText>{formik.errors.campus_number}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Fade>
        );

      // ── Step 1: Manager details ──────────────────────────────────────────────
      case 1:
        return (
          <Fade in timeout={500}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <SectionTitle>Manager Details</SectionTitle>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth error={formik.touched.manager_name && Boolean(formik.errors.manager_name)}>
                  <InputLabel htmlFor="manager_name">Manager Full Name *</InputLabel>
                  <OutlinedInput
                    id="manager_name" name="manager_name" label="Manager Full Name *"
                    value={formik.values.manager_name}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                    disabled={isLoading}
                    startAdornment={<InputAdornment position="start"><Person sx={{ color: 'primary.main' }} /></InputAdornment>}
                    sx={inputSx}
                  />
                  {formik.touched.manager_name && formik.errors.manager_name && (
                    <FormHelperText>{formik.errors.manager_name}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={formik.touched.email && Boolean(formik.errors.email)}>
                  <InputLabel htmlFor="nc-email">Email Address *</InputLabel>
                  <OutlinedInput
                    id="nc-email" name="email" type="email" label="Email Address *"
                    value={formik.values.email}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                    disabled={isLoading}
                    startAdornment={<InputAdornment position="start"><Email sx={{ color: 'primary.main' }} /></InputAdornment>}
                    sx={inputSx}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <FormHelperText>{formik.errors.email}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={formik.touched.manager_phone && Boolean(formik.errors.manager_phone)}>
                  <InputLabel htmlFor="manager_phone">Phone Number *</InputLabel>
                  <OutlinedInput
                    id="manager_phone" name="manager_phone" label="Phone Number *"
                    value={formik.values.manager_phone}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                    disabled={isLoading}
                    startAdornment={<InputAdornment position="start"><Phone sx={{ color: 'primary.main' }} /></InputAdornment>}
                    sx={inputSx}
                  />
                  {formik.touched.manager_phone && formik.errors.manager_phone && (
                    <FormHelperText>{formik.errors.manager_phone}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {[
                { id: 'nc-password',  name: 'password',         label: 'Password *',         autoComplete: 'new-password' },
                { id: 'nc-confirm',   name: 'confirm_password', label: 'Confirm Password *',  autoComplete: 'new-password' },
              ].map(({ id, name, label, autoComplete }) => (
                <Grid key={id} size={{ xs: 12 }}>
                  <FormControl fullWidth error={formik.touched[name] && Boolean(formik.errors[name])}>
                    <InputLabel htmlFor={id}>{label}</InputLabel>
                    <OutlinedInput
                      id={id} name={name} label={label}
                      type={showPassword ? 'text' : 'password'}
                      value={formik.values[name]}
                      onChange={formik.handleChange} onBlur={formik.handleBlur}
                      disabled={isLoading}
                      autoComplete={autoComplete}
                      startAdornment={<InputAdornment position="start"><Lock sx={{ color: 'primary.main' }} /></InputAdornment>}
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
                      sx={inputSx}
                    />
                    {formik.touched[name] && formik.errors[name] && (
                      <FormHelperText>{formik.errors[name]}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
              ))}
            </Grid>
          </Fade>
        );

      // ── Step 2: Location + image ─────────────────────────────────────────────
      case 2:
        return (
          <Fade in timeout={500}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <SectionTitle>Location &amp; Campus Image</SectionTitle>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel htmlFor="location-city">City (Optional)</InputLabel>
                  <OutlinedInput
                    id="location-city" name="location.city" label="City (Optional)"
                    value={formik.values.location.city}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                    disabled={isLoading}
                    startAdornment={<InputAdornment position="start"><LocationOn sx={{ color: 'text.secondary' }} /></InputAdornment>}
                    sx={inputSx}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel htmlFor="location-country">Country</InputLabel>
                  <OutlinedInput
                    id="location-country" name="location.country" label="Country"
                    value={formik.values.location.country}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                    disabled={isLoading}
                    startAdornment={<InputAdornment position="start"><LocationOn sx={{ color: 'text.secondary' }} /></InputAdornment>}
                    sx={inputSx}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <InputLabel htmlFor="location-address">Address (Optional)</InputLabel>
                  <OutlinedInput
                    id="location-address" name="location.address" label="Address (Optional)"
                    value={formik.values.location.address}
                    onChange={formik.handleChange} onBlur={formik.handleBlur}
                    disabled={isLoading} multiline rows={2}
                    startAdornment={<InputAdornment position="start"><LocationOn sx={{ color: 'text.secondary' }} /></InputAdornment>}
                    sx={inputSx}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3, borderRadius: 3,
                    border: `2px dashed ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.primary.main, 0.02),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PhotoCamera sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="subtitle1" fontWeight="bold">Campus Image *</Typography>
                  </Box>
                  <UploadCampusImage
                    key={imageResetKey}
                    onImageChange={(file) => formik.setFieldValue('campus_image', file)}
                    disabled={isLoading}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Fade>
        );

      default:
        return null;
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        minHeight: '100vh', width: '100%',
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #001030 0%, #002875 50%, #001845 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        py: 4,
        '&::before': {
          content: '""', position: 'absolute', inset: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 40%, rgba(73,137,200,0.08) 0%, transparent 55%),
            radial-gradient(circle at 75% 70%, rgba(255,127,62,0.06) 0%, transparent 60%)
          `,
        },
      }}
    >
      {/* Back to admin link */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/')}
        aria-label="Return to admin dashboard"
        sx={{
          position: 'fixed', top: 20, left: 20,
          color: 'rgba(255,255,255,0.55)',
          fontSize: '0.78rem', textTransform: 'none',
          '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
        }}
      >
        Admin Dashboard
      </Button>

      <Container maxWidth="md">
        <Zoom in timeout={500}>
          <Card
            elevation={24}
            sx={{
              borderRadius: 4,
              background: 'rgba(255,255,255,0.97)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            {/* ── Card header ── */}
            <Box sx={{
              background: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
              color: 'white', p: 4, textAlign: 'center',
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <Box sx={{
                  width: 72, height: 72, borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Shield sx={{ fontSize: 38 }} />
                </Box>
              </Box>
              <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5 }}>
                Create New Campus
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.85 }}>
                Establish a new campus of distinction
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Stepper */}
              <Stepper
                activeStep={activeStep}
                sx={{
                  mb: 4,
                  '& .MuiStepLabel-root .Mui-completed': { color: 'success.main' },
                  '& .MuiStepLabel-root .Mui-active':    { color: 'primary.main' },
                }}
              >
                {STEPS.map((label, index) => (
                  <Step key={label}>
                    <StepLabel
                      slots={{
                        stepIcon: activeStep > index
                          ? () => <CheckCircle color="success" />
                          : undefined,
                      }}
                    >
                      {!isMobile && label}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Divider sx={{ mb: 4 }} />

              {/* Form */}
              <Box component="form" onSubmit={formik.handleSubmit}>
                {getStepContent(activeStep)}

                {/* Navigation */}
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'space-between' }}>
                  <Button
                    disabled={activeStep === 0 || isLoading}
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                    variant="outlined"
                    sx={{ borderRadius: 2, px: 3, py: 1.5, fontWeight: 'bold', textTransform: 'none' }}
                  >
                    Back
                  </Button>

                  <Box sx={{ flex: 1 }} />

                  {activeStep === STEPS.length - 1 ? (
                    <Button
                      type="submit" variant="contained" disabled={isLoading}
                      endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                      sx={{
                        borderRadius: 2, px: 4, py: 1.5,
                        fontWeight: 'bold', textTransform: 'none',
                        background: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
                        boxShadow: '0 6px 20px rgba(0,50,133,0.35)',
                        '&:hover': { boxShadow: '0 8px 28px rgba(0,50,133,0.45)' },
                      }}
                    >
                      {isLoading ? 'Creating…' : 'Create Campus'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext} variant="contained"
                      endIcon={<ArrowForward />}
                      sx={{
                        borderRadius: 2, px: 4, py: 1.5,
                        fontWeight: 'bold', textTransform: 'none',
                        background: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Zoom>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open} autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        slots={{ transition: Zoom }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity} variant="filled" elevation={6}
          sx={{ borderRadius: 2, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Styled section title used inside step content */
function SectionTitle({ children }) {
  return (
    <Typography
      variant="h6"
      fontWeight="bold"
      sx={{
        background: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}