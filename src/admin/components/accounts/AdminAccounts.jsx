/**
 * @file AdminAccounts.jsx
 * @description Admin portal — create Admin/Director accounts and manage existing ones.
 *
 * Endpoints used:
 *  POST  /api/admin/create       — create account
 *  GET   /api/admin/all          — list accounts (paginated)
 *  PATCH /api/admin/:id/status   — activate / deactivate / suspend
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Divider, Alert,
  FormControl, InputLabel, OutlinedInput, Select,
  MenuItem, Button, IconButton, InputAdornment,
  FormHelperText, CircularProgress, Chip, Snackbar,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, Avatar,
} from '@mui/material';
import {
  PersonAdd, Visibility, VisibilityOff,
  ManageAccounts, CheckCircle, Block, PauseCircle,
  Refresh, VerifiedUser, History,
} from '@mui/icons-material';
import { ADMIN_PRIMARY, ADMIN_GRADIENT, ADMIN_SHADOW } from '../../../theme/adminTokens';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { yupEmail, yupPassword, yupConfirmPassword } from '../../../utils/validationRules';

import { createAdminAccount, listAdminAccounts, updateAdminStatus } from '../../../services/admin_service';
import { useAuth } from '../../../hooks/useAuth';
import useFormSnackbar from '../../../hooks/useFormSnackBar';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: 'success', icon: <CheckCircle fontSize="small" /> },
  inactive:  { label: 'Inactive',  color: 'default', icon: <PauseCircle fontSize="small" /> },
  suspended: { label: 'Suspended', color: 'error',   icon: <Block       fontSize="small" /> },
};

// ─── Validation ───────────────────────────────────────────────────────────────

const schema = Yup.object({
  admin_name:      Yup.string().trim().min(3, 'Minimum 3 characters').required('Name is required'),
  email:           yupEmail(),
  role:            Yup.string().oneOf(['ADMIN', 'DIRECTOR']).required('Role is required'),
  password:        yupPassword(),
  confirmPassword: yupConfirmPassword('password'),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminAccounts() {
  const { user }   = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [accounts,      setAccounts]      = useState([]);
  const [accountsLoad,  setAccountsLoad]  = useState(true);
  const [statusLoading, setStatusLoading] = useState(null); // id currently being updated

  // ── Fetch accounts ──────────────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    setAccountsLoad(true);
    try {
      const res = await listAdminAccounts({ limit: 100 });
      setAccounts(res.data?.data ?? []);
    } catch {
      showSnackbar('Failed to load accounts.', 'error');
    } finally {
      setAccountsLoad(false);
    }
  }, [showSnackbar]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // ── Status change ───────────────────────────────────────────────────────────

  const handleStatusChange = async (id, newStatus) => {
    setStatusLoading(id);
    try {
      await updateAdminStatus(id, newStatus);
      setAccounts((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a))
      );
      showSnackbar(`Account ${newStatus === 'active' ? 'activated' : newStatus === 'suspended' ? 'suspended' : 'deactivated'}.`, 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setStatusLoading(null);
    }
  };

  // ── Create form ─────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: {
      admin_name:      '',
      email:           '',
      role:            'ADMIN',
      password:        '',
      confirmPassword: '',
    },
    validationSchema: schema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        await createAdminAccount({
          admin_name: values.admin_name.trim(),
          email:      values.email.trim().toLowerCase(),
          role:       values.role,
          password:   values.password,
        });
        showSnackbar(
          `${values.role === 'DIRECTOR' ? 'Director' : 'Admin'} account created successfully.`,
          'success',
        );
        resetForm();
        fetchAccounts();
      } catch (err) {
        showSnackbar(err.response?.data?.message || 'Failed to create account.', 'error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const busy = formik.isSubmitting;

  const field = (name, label, type = 'text', extra = {}) => (
    <FormControl fullWidth size="small" error={formik.touched[name] && Boolean(formik.errors[name])}>
      <InputLabel htmlFor={name}>{label}</InputLabel>
      <OutlinedInput
        id={name}
        name={name}
        type={type}
        label={label}
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        disabled={busy}
        sx={{ borderRadius: 2 }}
        {...extra}
      />
      {formik.touched[name] && formik.errors[name] && (
        <FormHelperText>{formik.errors[name]}</FormHelperText>
      )}
    </FormControl>
  );

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        onClick={() => setShowPassword((p) => !p)}
        edge="end" disabled={busy}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Admin Accounts</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create and manage platform-level Admin and Director accounts.
      </Typography>

      <Stack spacing={3}>

        {/* ── Role info banner ─────────────────────────────────────────────── */}
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Role differences</Typography>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Chip label="ADMIN" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Full platform access — can create campuses and other admin accounts.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <Chip label="DIRECTOR" size="small" color="warning" variant="outlined" sx={{ fontWeight: 700, flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                Campus oversight and reporting — no account creation rights.
              </Typography>
            </Stack>
          </Stack>
        </Alert>

        {/* ── Create form ──────────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <PersonAdd sx={{ color: ADMIN_PRIMARY }} />
            <Typography variant="subtitle1" fontWeight={700}>Create New Account</Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2}>

              {field('admin_name', 'Full Name')}
              {field('email', 'Email Address', 'email')}

              <FormControl size="small" fullWidth error={formik.touched.role && Boolean(formik.errors.role)}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  label="Role"
                  value={formik.values.role}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  disabled={busy}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="DIRECTOR">Director</MenuItem>
                </Select>
                {formik.touched.role && formik.errors.role && (
                  <FormHelperText>{formik.errors.role}</FormHelperText>
                )}
              </FormControl>

              <FormControl size="small" fullWidth error={formik.touched.password && Boolean(formik.errors.password)}>
                <InputLabel htmlFor="password">Password</InputLabel>
                <OutlinedInput
                  id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Password"
                  value={formik.values.password}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  disabled={busy} endAdornment={passwordAdornment}
                  sx={{ borderRadius: 2 }}
                />
                {formik.touched.password && formik.errors.password && (
                  <FormHelperText>{formik.errors.password}</FormHelperText>
                )}
              </FormControl>

              <FormControl size="small" fullWidth error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}>
                <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
                <OutlinedInput
                  id="confirmPassword" name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  label="Confirm Password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange} onBlur={formik.handleBlur}
                  disabled={busy} endAdornment={passwordAdornment}
                  sx={{ borderRadius: 2 }}
                />
                {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                  <FormHelperText>{formik.errors.confirmPassword}</FormHelperText>
                )}
              </FormControl>

              <Alert severity="info" sx={{ borderRadius: 2, py: 0.5 }}>
                Password must be at least 8 characters with one uppercase, one lowercase, and one number.
              </Alert>

              <Button
                type="submit" variant="contained" disabled={busy}
                startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}
                sx={{
                  textTransform: 'none', fontWeight: 700, borderRadius: 2, py: 1.2,
                  background: ADMIN_GRADIENT, boxShadow: ADMIN_SHADOW,
                }}
              >
                {busy ? 'Creating…' : 'Create Account'}
              </Button>

            </Stack>
          </Box>
        </Paper>

        {/* ── Existing accounts ────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between"
            sx={{ p: 3, pb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <ManageAccounts sx={{ color: ADMIN_PRIMARY }} />
              <Typography variant="subtitle1" fontWeight={700}>Existing Accounts</Typography>
            </Stack>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={fetchAccounts} disabled={accountsLoad}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Divider />

          {accountsLoad ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={28} />
            </Box>
          ) : accounts.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No accounts found.</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Account</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created by</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Last Login</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {accounts.map((account) => {
                    const isSelf      = account._id === user?.id;
                    const isUpdating  = statusLoading === account._id;
                    const cfg         = STATUS_CONFIG[account.status] ?? STATUS_CONFIG.inactive;
                    const isProtected = account.isBootstrap || isSelf;

                    // Build status history tooltip content (last 5 entries, newest first)
                    const history = [...(account.statusHistory ?? [])].reverse().slice(0, 5);
                    const historyTooltip = history.length > 0
                      ? history.map((h) =>
                          `${new Date(h.changedAt).toLocaleDateString()} — ${h.status}${h.note ? ` (${h.note})` : ''}`
                        ).join('\n')
                      : 'No history';

                    return (
                      <TableRow key={account._id} hover>
                        {/* Account */}
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              sx={{
                                width: 32, height: 32, fontSize: '0.85rem', fontWeight: 700,
                                bgcolor: account.role === 'DIRECTOR' ? 'warning.main' : 'primary.main',
                              }}
                            >
                              {account.admin_name?.[0]?.toUpperCase() ?? 'A'}
                            </Avatar>
                            <Box>
                              <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
                                <Typography variant="body2" fontWeight={600}>
                                  {account.admin_name}
                                </Typography>
                                {account.isBootstrap && (
                                  <Tooltip title="Bootstrap account — status is permanently protected">
                                    <Chip
                                      icon={<VerifiedUser sx={{ fontSize: '0.7rem !important' }} />}
                                      label="Bootstrap"
                                      size="small"
                                      color="secondary"
                                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                                    />
                                  </Tooltip>
                                )}
                                {isSelf && (
                                  <Chip label="You" size="small"
                                    sx={{ height: 18, fontSize: '0.65rem' }} />
                                )}
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {account.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Chip
                            label={account.role}
                            size="small"
                            color={account.role === 'DIRECTOR' ? 'warning' : 'primary'}
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>

                        {/* Status + history tooltip */}
                        <TableCell>
                          <Tooltip title={<Box sx={{ whiteSpace: 'pre-line', fontSize: '0.7rem' }}>{historyTooltip}</Box>} arrow>
                            <Chip
                              icon={cfg.icon}
                              label={cfg.label}
                              size="small"
                              color={cfg.color}
                              variant="outlined"
                              deleteIcon={<History sx={{ fontSize: '0.85rem !important' }} />}
                              onDelete={() => {}}
                              sx={{ cursor: 'default' }}
                            />
                          </Tooltip>
                        </TableCell>

                        {/* Created by */}
                        <TableCell>
                          {account.createdBy ? (
                            <Typography variant="caption" color="text.secondary">
                              {account.createdBy.admin_name}
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="secondary.main" fontWeight={600}>
                              Self (bootstrap)
                            </Typography>
                          )}
                        </TableCell>

                        {/* Last login */}
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {account.lastLogin
                              ? new Date(account.lastLogin).toLocaleDateString()
                              : '—'}
                          </Typography>
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right">
                          {isUpdating ? (
                            <CircularProgress size={18} />
                          ) : isProtected ? (
                            <Typography variant="caption" color="text.disabled">—</Typography>
                          ) : (
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              {account.status !== 'active' && (
                                <Tooltip title="Activate">
                                  <IconButton size="small" color="success"
                                    onClick={() => handleStatusChange(account._id, 'active')}>
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {account.status !== 'suspended' && (
                                <Tooltip title="Suspend">
                                  <IconButton size="small" color="error"
                                    onClick={() => handleStatusChange(account._id, 'suspended')}>
                                    <Block fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {account.status !== 'inactive' && (
                                <Tooltip title="Deactivate">
                                  <IconButton size="small"
                                    onClick={() => handleStatusChange(account._id, 'inactive')}>
                                    <PauseCircle fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

      </Stack>

      <Snackbar
        open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={closeSnackbar} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}
