import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Alert,
  FormGroup, FormControlLabel, Checkbox, Typography,
  Box, Divider, Stack, Chip,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { createStaffRole, updateStaffRole } from '../../../services/staffService';

// ─── Permission groups matching backend staff-permissions.js ─────────────────

const PERMISSION_GROUPS = [
  { label: 'Students',     keys: ['students.read',     'students.manage']     },
  { label: 'Teachers',     keys: ['teachers.read',     'teachers.manage']     },
  { label: 'Parents',      keys: ['parents.read',      'parents.manage']      },
  { label: 'Finance',      keys: ['finance.read',      'finance.manage']      },
  { label: 'Schedule',     keys: ['schedule.read',     'schedule.manage']     },
  { label: 'Attendance',   keys: ['attendance.read',   'attendance.manage']   },
  { label: 'Results',      keys: ['results.read',      'results.manage']      },
  { label: 'Courses',      keys: ['courses.read',      'courses.manage']      },
  { label: 'Documents',    keys: ['documents.read',    'documents.manage']    },
  { label: 'Examinations', keys: ['examinations.read', 'examinations.manage'] },
  { label: 'Other',        keys: ['announcements',     'messages',  'print']  },
];

const schema = Yup.object({
  name:        Yup.string().min(2).max(60).required('Role name is required'),
  description: Yup.string().max(200).notRequired(),
});

const SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

export default function StaffRoleForm({ open, onClose, onSaved, role }) {
  const isEdit  = Boolean(role?._id);
  const [apiError, setApiError] = useState('');

  const formik = useFormik({
    initialValues: {
      name:        role?.name        ?? '',
      description: role?.description ?? '',
      permissions: role?.permissions ?? [],
    },
    enableReinitialize: true,
    validationSchema: schema,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError('');
      try {
        const res = isEdit
          ? await updateStaffRole(role._id, values)
          : await createStaffRole(values);
        onSaved(res.data?.data ?? res.data);
        onClose();
      } catch (err) {
        setApiError(err.response?.data?.message || 'Operation failed.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const togglePermission = (key) => {
    const current = formik.values.permissions;
    formik.setFieldValue(
      'permissions',
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );
  };

  const toggleGroup = (keys) => {
    const current = formik.values.permissions;
    const allSelected = keys.every((k) => current.includes(k));
    if (allSelected) {
      formik.setFieldValue('permissions', current.filter((k) => !keys.includes(k)));
    } else {
      const merged = [...new Set([...current, ...keys])];
      formik.setFieldValue('permissions', merged);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEdit ? 'Edit Staff Role' : 'Create Staff Role'}
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {apiError && <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>}

            <TextField
              fullWidth
              label="Role Name"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              sx={SX}
            />

            <TextField
              fullWidth
              label="Description (optional)"
              name="description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
              multiline
              rows={2}
              sx={SX}
            />

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>Permissions</Typography>
                <Chip
                  label={`${formik.values.permissions.length} selected`}
                  size="small"
                  color={formik.values.permissions.length > 0 ? 'primary' : 'default'}
                />
              </Stack>

              <Stack spacing={1.5}>
                {PERMISSION_GROUPS.map((group) => {
                  const allSelected = group.keys.every((k) => formik.values.permissions.includes(k));
                  const someSelected = group.keys.some((k) => formik.values.permissions.includes(k));
                  return (
                    <Box
                      key={group.label}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected && !allSelected}
                            onChange={() => toggleGroup(group.keys)}
                            size="small"
                          />
                        }
                        label={
                          <Typography variant="subtitle2" fontWeight={700}>{group.label}</Typography>
                        }
                        sx={{ mb: 0.5 }}
                      />
                      <FormGroup row sx={{ pl: 3, gap: 0 }}>
                        {group.keys.map((key) => (
                          <FormControlLabel
                            key={key}
                            control={
                              <Checkbox
                                checked={formik.values.permissions.includes(key)}
                                onChange={() => togglePermission(key)}
                                size="small"
                              />
                            }
                            label={
                              <Typography variant="caption" fontFamily="monospace">{key}</Typography>
                            }
                            sx={{ mr: 2 }}
                          />
                        ))}
                      </FormGroup>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {formik.isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
