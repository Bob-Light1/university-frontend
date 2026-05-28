import { useState } from 'react';
import {
  Grid, TextField, Button, CircularProgress,
  Stack, Alert, InputAdornment, IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { createMentor, updateMentor } from '../../../services/staffService';
import PhoneInput from '../../../components/shared/PhoneInput';
import { yupPhone, yupPassword } from '../../../utils/validationRules';

const createSchema = Yup.object({
  firstName:      Yup.string().min(2).max(50).required('First name is required'),
  lastName:       Yup.string().min(2).max(50).required('Last name is required'),
  username:       Yup.string().min(3).max(30)
    .matches(/^[a-z0-9_.-]+$/, 'Lowercase letters, numbers, dots, hyphens, underscores only')
    .required('Username is required'),
  email:          Yup.string().email('Invalid email').notRequired(),
  phone:          yupPhone(false),
  specialization: Yup.string().max(200).notRequired(),
  password:       yupPassword(),
});

const editSchema = Yup.object({
  firstName:      Yup.string().min(2).max(50).required('First name is required'),
  lastName:       Yup.string().min(2).max(50).required('Last name is required'),
  username:       Yup.string().min(3).max(30)
    .matches(/^[a-z0-9_.-]+$/, 'Lowercase letters, numbers, dots, hyphens, underscores only')
    .required('Username is required'),
  email:          Yup.string().email('Invalid email').notRequired(),
  phone:          yupPhone(false),
  specialization: Yup.string().max(200).notRequired(),
});

const SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

export default function MentorForm({ entity: mentor, onSuccess, onCancel }) {
  const isEdit = Boolean(mentor?._id);
  const [showPwd, setShowPwd]   = useState(false);
  const [apiError, setApiError] = useState('');

  const formik = useFormik({
    initialValues: {
      firstName:      mentor?.firstName      ?? '',
      lastName:       mentor?.lastName       ?? '',
      username:       mentor?.username       ?? '',
      email:          mentor?.email          ?? '',
      phone:          mentor?.phone          ?? '',
      specialization: mentor?.specialization ?? '',
      password:       '',
    },
    validationSchema: isEdit ? editSchema : createSchema,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      setApiError('');
      try {
        const payload = { ...values };
        if (!payload.email)          delete payload.email;
        if (!payload.phone)          delete payload.phone;
        if (!payload.specialization) delete payload.specialization;
        if (isEdit)                  delete payload.password;

        const res = isEdit
          ? await updateMentor(mentor._id, payload)
          : await createMentor(payload);

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
    value:      formik.values[name],
    onChange:   formik.handleChange,
    onBlur:     formik.handleBlur,
    error:      formik.touched[name] && Boolean(formik.errors[name]),
    helperText: formik.touched[name] && formik.errors[name],
    sx:         SX,
    fullWidth:  true,
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
        <Grid item xs={12} sm={6}>
          <TextField label="Specialization" {...f('specialization')} />
        </Grid>

        {!isEdit && (
          <Grid item xs={12}>
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

        <Grid item xs={12}>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={onCancel} sx={{ textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
              startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              {formik.isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Mentor'}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </form>
  );
}
