import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Alert,
  FormGroup, FormControlLabel, Checkbox, Typography,
  Box, Divider, Stack, Chip,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { createStaffRole, updateStaffRole } from '../../../services/staffService';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

// ─── Permission groups matching backend staff-permissions.js ─────────────────

const PERMISSION_GROUPS = [
  { labelKey: 'Students',     keys: ['students.read',     'students.manage']     },
  { labelKey: 'Teachers',     keys: ['teachers.read',     'teachers.manage']     },
  { labelKey: 'Parents',      keys: ['parents.read',      'parents.manage']      },
  { labelKey: 'Finance',      keys: ['finance.read',      'finance.manage']      },
  { labelKey: 'Schedule',     keys: ['schedule.read',     'schedule.manage']     },
  { labelKey: 'Attendance',   keys: ['attendance.read',   'attendance.manage']   },
  { labelKey: 'Results',      keys: ['results.read',      'results.manage']      },
  { labelKey: 'Courses',      keys: ['courses.read',      'courses.manage']      },
  { labelKey: 'Documents',    keys: ['documents.read',    'documents.manage']    },
  { labelKey: 'Examinations', keys: ['examinations.read', 'examinations.manage'] },
  { labelKey: 'Other',        keys: ['announcements',     'messages',  'print']  },
];

const schema = Yup.object({
  name:        Yup.string().min(2).max(60).required(),
  description: Yup.string().max(200).notRequired(),
});

const SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

export default function StaffRoleForm({ open, onClose, onSaved, role }) {
  const { t }    = useAppTranslation('staff');
  const { campusId } = useParams();
  const isEdit   = Boolean(role?._id);
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
          // campus is required by the backend for global roles (ADMIN/DIRECTOR);
          // a CAMPUS_MANAGER's own campus is derived from the token server-side.
          : await createStaffRole(campusId ? { ...values, campus: campusId } : values);
        onSaved(res.data?.data ?? res.data);
        onClose();
      } catch (err) {
        setApiError(err.response?.data?.message || t('staff:roleForm.failed'));
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      disableEnforceFocus closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {isEdit ? t('staff:roleForm.editTitle') : t('staff:roleForm.createTitle')}
        </DialogTitle>
        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {apiError && <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>}

            <TextField
              fullWidth
              label={t('staff:roleForm.roleName')}
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
              label={t('staff:roleForm.descriptionOptional')}
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
                <Typography variant="subtitle2" fontWeight={700}>{t('staff:roleForm.permissions')}</Typography>
                <Chip
                  label={t('staff:roleForm.selected', { count: formik.values.permissions.length })}
                  size="small"
                  color={formik.values.permissions.length > 0 ? 'primary' : 'default'}
                />
              </Stack>

              <Stack spacing={1.5}>
                {PERMISSION_GROUPS.map((group) => {
                  const allSelected  = group.keys.every((k) => formik.values.permissions.includes(k));
                  const someSelected = group.keys.some((k)  => formik.values.permissions.includes(k));
                  return (
                    <Box
                      key={group.labelKey}
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
                          <Typography variant="subtitle2" fontWeight={700}>
                            {t(`staff:roleForm.permGroup.${group.labelKey}`)}
                          </Typography>
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
          <Button onClick={onClose} sx={{ textTransform: 'none', borderRadius: 2 }}>
            {t('staff:roleForm.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {formik.isSubmitting
              ? t('staff:roleForm.saving')
              : isEdit
                ? t('staff:roleForm.saveChanges')
                : t('staff:roleForm.createRole')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
