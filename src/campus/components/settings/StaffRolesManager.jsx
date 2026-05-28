import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Button, Chip,
  Card, CardContent, CardActions, IconButton, Tooltip,
  Alert, CircularProgress, Divider, Switch, FormControlLabel,
} from '@mui/material';
import {
  Add, Edit, Delete, AdminPanelSettings, Security,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

import { getStaffRoles, toggleStaffRole, deleteStaffRole } from '../../../services/staffService';
import StaffRoleForm from './StaffRoleForm';
import useFormSnackbar from '../../../hooks/useFormSnackBar';

export default function StaffRolesManager() {
  const { campusId } = useParams();
  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [formOpen,   setFormOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffRoles({ campusId, limit: 100 });
      setRoles(res.data?.data ?? []);
    } catch {
      setError('Failed to load staff roles.');
    } finally {
      setLoading(false);
    }
  }, [campusId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = () => { setEditTarget(null); setFormOpen(true); };
  const handleEdit   = (r)  => { setEditTarget(r);   setFormOpen(true); };

  const handleSaved = (saved) => {
    setRoles((prev) => {
      const idx = prev.findIndex((r) => r._id === saved._id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    showSnackbar(editTarget ? 'Role updated.' : 'Role created.', 'success');
  };

  const handleToggle = async (role) => {
    try {
      const res = await toggleStaffRole(role._id);
      const updated = res.data?.data ?? res.data;
      setRoles((prev) => prev.map((r) => r._id === updated._id ? updated : r));
    } catch {
      showSnackbar('Failed to toggle role.', 'error');
    }
  };

  const handleDelete = async (role) => {
    if (!window.confirm(`Delete role "${role.name}"? This action cannot be undone.`)) return;
    try {
      await deleteStaffRole(role._id);
      setRoles((prev) => prev.filter((r) => r._id !== role._id));
      showSnackbar('Role deleted.', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to delete role.', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Staff Roles</Typography>
          <Typography variant="body2" color="text.secondary">
            Define sub-roles and their permission sets for campus staff members.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          New Role
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {roles.length === 0 ? (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: 'divider',
            borderRadius: 3,
            p: 5,
            textAlign: 'center',
          }}
        >
          <AdminPanelSettings sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No staff roles yet.</Typography>
          <Button
            onClick={handleCreate}
            startIcon={<Add />}
            sx={{ mt: 2, textTransform: 'none' }}
          >
            Create the first role
          </Button>
        </Box>
      ) : (
        <Stack spacing={2}>
          {roles.map((role) => (
            <Card
              key={role._id}
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: role.isActive ? 'primary.light' : 'divider',
                opacity: role.isActive ? 1 : 0.6,
              }}
            >
              <CardContent sx={{ pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Security fontSize="small" color="primary" />
                      <Typography variant="subtitle1" fontWeight={700}>{role.name}</Typography>
                      <Chip
                        label={role.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={role.isActive ? 'success' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                    {role.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {role.description}
                      </Typography>
                    )}
                  </Box>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={role.isActive}
                        onChange={() => handleToggle(role)}
                        size="small"
                        color="primary"
                      />
                    }
                    label=""
                  />
                </Stack>

                <Divider sx={{ my: 1 }} />

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    {role.permissions?.length ?? 0} permission{role.permissions?.length !== 1 ? 's' : ''}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={0.5}>
                    {(role.permissions ?? []).map((p) => (
                      <Chip
                        key={p}
                        label={p}
                        size="small"
                        sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}
                      />
                    ))}
                    {(!role.permissions || role.permissions.length === 0) && (
                      <Typography variant="caption" color="text.disabled">No permissions assigned</Typography>
                    )}
                  </Stack>
                </Box>
              </CardContent>

              <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(role)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => handleDelete(role)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      <StaffRoleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        role={editTarget}
      />
    </Box>
  );
}
