import { useEffect, useState } from 'react';
import {
  Grid, TextField, Button, CircularProgress,
  FormControl, InputLabel, Select, MenuItem,
  Stack, Alert, FormHelperText, InputAdornment, IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams } from 'react-router-dom';

import api from '../../../api/axiosInstance';
import { createStaff, updateStaff } from '../../../services/staffService';
import PhoneInput from '../../../components/shared/PhoneInput';
import { yupPhone, yupPassword } from '../../../utils/validationRules';

const createSchema = Yup.object({
  firstName: Yup.string().min(2).max(50).required('First name is required'),
  lastName:  Yup.string().min(2).max(50).required('Last name is required'),
  username:  Yup.string().min(3).max(30)
    .matches(/^[a-z0-9_.-]+$/, 'Lowercase letters, numbers, dots, hyphens, underscores only')
    .required('Username is required'),
  email:     Yup.string().email('Invalid email').notRequired(),
  phone:     yupPhone(false),
  password:  yupPassword(),
  subRole:   Yup.string().notRequired(),
});

const editSchema = Yup.object({
  firstName: Yup.string().min(2).max(50).required('First name is required'),
  lastName:  Yup.string().min(2).max(50).required('Last name is required'),
  username:  Yup.string().min(3).max(30)
    .matches(/^[a-z0-9_.-]+$/, 'Lowercase letters, numbers, dots, hyphens, underscores only')
    .required('Username is required'),
  email:     Yup.string().email('Invalid email').notRequired(),
  phone:     yupPhone(false),
  subRole:   Yup.string().notRequired(),
});

const SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

export default function StaffForm({ entity: staff, onSuccess, onCancel }) {
  const isEdit = Boolean(staff?._id);
  const { campusId } = useParams();

  const [roles, setRoles]         = useState([]);
  const [showPwd, setShowPwd]     = useState(false);
  const [apiError, setApiError]   = useState('');

  useEffect(() => {
    api.get('/staff-roles', { params: { campusId, isActive: 'true', limit: 100 } })
      .then((r) => setRoles(r.data?.data ?? []))
      .catch(() => {});
  }, [campusId]);

  const formik = useFormik({
    initialValues: {
      firstName: staff?.firstName ?? '',
      lastName:  staff?.lastName  ?? '',
      username:  staff?.username  ?? '',
      email:     staff?.email     ?? '',
      phone:     staff?.phone     ?? '',
      password:  '',
      subRole:   staff?.subRole?._id ?? staff?.subRole ?? '',
    },
    validationSchema: isEdit ? editSchema : createSchema,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError('');
      try {
        const payload = { ...values };
        if (!payload.email)   delete payload.email;
        if (!payload.phone)   delete payload.phone;
        if (!payload.subRole) delete payload.subRole;
        if (isEdit)           delete payload.password;

        const res = isEdit
          ? await updateStaff(staff._id, payload)
          : await createStaff(payload);

        onSuccess(res.data?.data ?? res.data, isEdit ? 'updated' : 'created');
      } catch (err) {
        setApiError(err.response?.data?.message || 'Operation failed.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const f = (name) => ({
    name,
    value:     formik.values[name],
    onChange:  formik.handleChange,
    onBlur:    formik.handleBlur,
    error:     formik.touched[name] && Boolean(formik.errors[name]),
    helperText: formik.touched[name] && formik.errors[name],
    sx:        SX,
    fullWidth: true,
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <Grid container spacing={2}>
        {apiError && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>
          </Grid>
        )}

        <Grid item xs={12} sm={6}>
          <TextField label="First Name" {...f('firstName')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Last Name" {...f('lastName')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Username" {...f('username')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Email" type="email" {...f('email')} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <PhoneInput
            name="phone"
            label="Phone"
            value={formik.values.phone}
            onChange={(v) => formik.setFieldValue('phone', v)}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
          />
        </Grid>

        {/* En création : Password à droite du Phone */}
        {!isEdit && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Password"
              type={showPwd ? 'text' : 'password'}
              {...f('password')}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setShowPwd((p) => !p)} edge="end">
                        {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
        )}

        {/* En édition : Sub-Role occupe les 6 colonnes restantes à côté du Phone
            En création : Sub-Role prend toute la largeur sous Phone + Password  */}
        <Grid item xs={12} sm={isEdit ? 6 : 12}>
          <FormControl fullWidth sx={SX} error={formik.touched.subRole && Boolean(formik.errors.subRole)}>
            <InputLabel>Sub-Role (optional)</InputLabel>
            <Select
              name="subRole"
              value={formik.values.subRole}
              label="Sub-Role (optional)"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <MenuItem value=""><em>No role</em></MenuItem>
              {roles.map((r) => (
                <MenuItem key={r._id} value={r._id}>
                  {r.name} ({r.permissions?.length ?? 0} permissions)
                </MenuItem>
              ))}
            </Select>
            {formik.touched.subRole && formik.errors.subRole && (
              <FormHelperText>{formik.errors.subRole}</FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onCancel} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
              startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              {formik.isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Staff'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
}
