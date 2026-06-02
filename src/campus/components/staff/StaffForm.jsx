import { useEffect, useState } from 'react';
import {
  Grid, Button, CircularProgress, Collapse,
  Stack, Alert, Box, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Person, Email, Badge as BadgeIcon,
  AdminPanelSettings, Check, Cancel,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams } from 'react-router-dom';

import api                  from '../../../api/axiosInstance';
import { createStaff, updateStaff } from '../../../services/staffService';
import PhoneInput           from '../../../components/shared/PhoneInput';
import ProfileImageUploader from '../../../components/shared/ProfileImageUploader';
import { yupPhone, yupPassword } from '../../../utils/validationRules';
import FormSection          from '../../../components/form/FormSection';
import {
  FormTextField, FormSelectField, FormPasswordField,
} from '../../../components/form/FormFields';

// ─── Schemas ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffForm({ initialData: staff, onSuccess, onCancel }) {
  const isEdit   = Boolean(staff?._id);
  const { campusId } = useParams();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [roles,        setRoles]        = useState([]);
  const [apiError,     setApiError]     = useState('');
  const [profileImage, setProfileImage] = useState(staff?.profileImage ?? null);

  useEffect(() => {
    api.get('/staff-roles', { params: { campusId, isActive: 'true', limit: 100 } })
      .then((r) => setRoles(r.data?.data ?? []))
      .catch(() => {});
  }, [campusId]);

  const roleOptions = [
    { value: '', label: '— No role —' },
    ...roles.map((r) => ({
      value: r._id,
      label: `${r.name} (${r.permissions?.length ?? 0} permissions)`,
    })),
  ];

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
        if (profileImage)     payload.profileImage = profileImage;

        isEdit
          ? await updateStaff(staff._id, payload)
          : await createStaff(payload);

        onSuccess(`Staff member ${isEdit ? 'updated' : 'created'} successfully`);
      } catch (err) {
        setApiError(err.response?.data?.message || 'Operation failed.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <Grid container spacing={3}>

        {apiError && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>{apiError}</Alert>
          </Grid>
        )}

        {/* ── Profile image ──────────────────────────────────────────────────── */}
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <ProfileImageUploader
              currentImage={profileImage}
              signatureEndpoint="/staff/upload-signature"
              onUploaded={(url) => setProfileImage(url)}
              size={100}
            />
          </Box>
        </Grid>

        {/* ── Personal Information ───────────────────────────────────────────── */}
        <FormSection title="Personal Information" />

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField formik={formik} name="firstName" label="First Name" icon={Person} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField formik={formik} name="lastName"  label="Last Name"  icon={Person} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField formik={formik} name="username"  label="Username"   icon={BadgeIcon} />
        </Grid>

        {/* ── Contact ───────────────────────────────────────────────────────── */}
        <FormSection title="Contact" />

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField formik={formik} name="email" label="Email Address" type="email" icon={Email} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PhoneInput
            name="phone"
            label="Phone Number"
            value={formik.values.phone}
            onChange={(v) => formik.setFieldValue('phone', v)}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
          />
        </Grid>

        {/* ── Role ──────────────────────────────────────────────────────────── */}
        <FormSection title="Role" />

        <Grid size={{ xs: 12 }}>
          <FormSelectField
            formik={formik}
            name="subRole"
            label="Sub-Role"
            icon={AdminPanelSettings}
            options={roleOptions}
          />
        </Grid>

        {/* ── Security — password only on create ────────────────────────────── */}
        <Collapse in={!isEdit} sx={{ width: '100%' }}>
          <Grid container spacing={3} sx={{ pl: 3, pr: 3 }}>
            <FormSection title="Security" />
            <Grid size={{ xs: 12 }}>
              <FormPasswordField formik={formik} />
            </Grid>
          </Grid>
        </Collapse>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={onCancel}
              startIcon={<Cancel />}
              fullWidth={isMobile}
              sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={formik.isSubmitting}
              startIcon={formik.isSubmitting ? <CircularProgress size={20} color="inherit" /> : <Check />}
              fullWidth={isMobile}
              sx={{
                px: 4, py: 1.5, borderRadius: 2,
                textTransform: 'none', fontWeight: 600,
                boxShadow: theme.shadows[4],
                '&:hover': { boxShadow: theme.shadows[8] },
              }}
            >
              {formik.isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Staff'}
            </Button>
          </Stack>
        </Grid>

      </Grid>
    </form>
  );
}
