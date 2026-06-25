/**
 * @file ActivateAccount.jsx
 * @description Public account-activation page.
 *
 *   Two modes:
 *     - link mode    : URL = /activate/:token — the token is validated on mount,
 *                      then the user only chooses a password.
 *     - offline mode : URL = /activate (no token) — the user supplies their
 *                      identifier (username / email / matricule) + the short code
 *                      handed over by an administrator, then chooses a password.
 *
 *   On success the user is redirected to /login.
 */

import { useEffect, useState }            from 'react';
import { useParams, useNavigate }         from 'react-router-dom';
import { useFormik }                      from 'formik';
import {
  Box, Paper, Stack, Typography, Button,
  FormControl, InputLabel, OutlinedInput,
  InputAdornment, IconButton, FormHelperText,
  CircularProgress, Snackbar, Alert,
} from '@mui/material';
import {
  LockOutlined, Visibility, VisibilityOff,
  PersonOutline, VpnKeyOutlined, CheckCircleOutline,
} from '@mui/icons-material';

import { inspectActivationToken, activateAccount } from '../../../services/accountService';
import { activateLinkSchema, activateCodeSchema }  from '../../../yupSchema/activateSchema';

export default function ActivateAccount() {
  const { token }  = useParams();
  const navigate   = useNavigate();
  const linkMode   = Boolean(token);

  const [checking, setChecking]   = useState(linkMode);
  const [tokenValid, setTokenVal] = useState(!linkMode);
  const [greeting, setGreeting]   = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [snack, setSnack]         = useState({ open: false, severity: 'error', message: '' });

  const notify = (severity, message) => setSnack({ open: true, severity, message });

  // Link mode: validate the token before showing the form.
  useEffect(() => {
    if (!linkMode) return;
    let active = true;
    (async () => {
      try {
        const { data } = await inspectActivationToken(token);
        if (!active) return;
        setTokenVal(true);
        setGreeting(data?.data?.firstName || '');
      } catch {
        if (active) setTokenVal(false);
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => { active = false; };
  }, [linkMode, token]);

  const formik = useFormik({
    initialValues: linkMode
      ? { password: '', confirmPassword: '' }
      : { identifier: '', code: '', password: '', confirmPassword: '' },
    validationSchema: linkMode ? activateLinkSchema : activateCodeSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = linkMode
          ? { token, password: values.password }
          : { identifier: values.identifier.trim(), code: values.code.trim(), password: values.password };
        await activateAccount(payload);
        notify('success', 'Your account has been activated. Redirecting to sign in…');
        setTimeout(() => navigate('/login'), 1600);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.errors?.[0]?.message ||
          'Activation failed. Please check your details and try again.';
        notify('error', message);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fieldError = (name) => formik.touched[name] && Boolean(formik.errors[name]);
  const fieldHelp  = (name) => (formik.touched[name] && formik.errors[name]) || ' ';

  // ── Loading / invalid-token states (link mode) ──────────────────────────────
  if (checking) {
    return (
      <CenterBox>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">Validating your activation link…</Typography>
      </CenterBox>
    );
  }

  if (linkMode && !tokenValid) {
    return (
      <CenterBox>
        <Paper elevation={3} sx={{ p: 4, maxWidth: 440, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>Link invalid or expired</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            This activation link is no longer valid. Ask an administrator to re-issue one,
            or activate your account with the code they provided.
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/activate')}>
            Use an activation code instead
          </Button>
        </Paper>
      </CenterBox>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <CenterBox>
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 460 }}>
        <Stack spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <CheckCircleOutline color="primary" sx={{ fontSize: 44 }} />
          <Typography variant="h5" fontWeight={700}>Activate your account</Typography>
          <Typography color="text.secondary" textAlign="center">
            {greeting ? `Hello ${greeting}, ` : ''}choose a password to finish setting up your account.
          </Typography>
        </Stack>

        <form onSubmit={formik.handleSubmit} noValidate>
          <Stack spacing={2}>
            {!linkMode && (
              <>
                <FormControl variant="outlined" error={fieldError('identifier')} fullWidth>
                  <InputLabel htmlFor="identifier">Username, email or matricule</InputLabel>
                  <OutlinedInput
                    id="identifier"
                    name="identifier"
                    label="Username, email or matricule"
                    value={formik.values.identifier}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    startAdornment={<InputAdornment position="start"><PersonOutline /></InputAdornment>}
                  />
                  <FormHelperText>{fieldHelp('identifier')}</FormHelperText>
                </FormControl>

                <FormControl variant="outlined" error={fieldError('code')} fullWidth>
                  <InputLabel htmlFor="code">Activation code</InputLabel>
                  <OutlinedInput
                    id="code"
                    name="code"
                    label="Activation code"
                    value={formik.values.code}
                    onChange={(e) => formik.setFieldValue('code', e.target.value.toUpperCase())}
                    onBlur={formik.handleBlur}
                    startAdornment={<InputAdornment position="start"><VpnKeyOutlined /></InputAdornment>}
                  />
                  <FormHelperText>{fieldHelp('code')}</FormHelperText>
                </FormControl>
              </>
            )}

            <FormControl variant="outlined" error={fieldError('password')} fullWidth>
              <InputLabel htmlFor="password">New password</InputLabel>
              <OutlinedInput
                id="password"
                name="password"
                type={showPw ? 'text' : 'password'}
                label="New password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                startAdornment={<InputAdornment position="start"><LockOutlined /></InputAdornment>}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPw((v) => !v)} edge="end">
                      {showPw ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
              />
              <FormHelperText>{fieldHelp('password')}</FormHelperText>
            </FormControl>

            <FormControl variant="outlined" error={fieldError('confirmPassword')} fullWidth>
              <InputLabel htmlFor="confirmPassword">Confirm password</InputLabel>
              <OutlinedInput
                id="confirmPassword"
                name="confirmPassword"
                type={showPw ? 'text' : 'password'}
                label="Confirm password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                startAdornment={<InputAdornment position="start"><LockOutlined /></InputAdornment>}
              />
              <FormHelperText>{fieldHelp('confirmPassword')}</FormHelperText>
            </FormControl>

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={formik.isSubmitting}
              startIcon={formik.isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
            >
              {formik.isSubmitting ? 'Activating…' : 'Activate account'}
            </Button>
          </Stack>
        </form>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </CenterBox>
  );
}

function CenterBox({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: (t) => t.palette.grey[100],
      }}
    >
      {children}
    </Box>
  );
}
