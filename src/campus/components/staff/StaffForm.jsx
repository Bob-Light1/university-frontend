import { useEffect, useState } from 'react';
import {
  Grid, Button, CircularProgress,
  Stack, Alert, Box, useTheme, useMediaQuery,
} from '@mui/material';
import {
  Person, Email, Badge as BadgeIcon,
  AdminPanelSettings, Check, Cancel, LocationOn,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useParams } from 'react-router-dom';

import api                  from '../../../api/axiosInstance';
import { createStaff, updateStaff } from '../../../services/staffService';
import PhoneInput           from '../../../components/shared/PhoneInput';
import ProfileImageUploader from '../../../components/shared/ProfileImageUploader';
import { yupPhone } from '../../../utils/validationRules';
import FormSection          from '../../../components/form/FormSection';
import {
  FormTextField, FormSelectField,
} from '../../../components/form/FormFields';
import ActivationResultDialog from '../common/ActivationResultDialog';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createSchema = Yup.object({
  firstName:    Yup.string().min(2).max(50).required(),
  lastName:     Yup.string().min(2).max(50).required(),
  username:     Yup.string().min(3).max(30)
    .matches(/^[a-z0-9_.-]+$/, 'Lowercase letters, numbers, dots, hyphens, underscores only')
    .required(),
  email:        Yup.string().email().notRequired(),
  phone:        yupPhone(false),
  subRole:      Yup.string().notRequired(),
  neighborhood: Yup.string().max(100).notRequired(),
});

const editSchema = Yup.object({
  firstName:    Yup.string().min(2).max(50).required(),
  lastName:     Yup.string().min(2).max(50).required(),
  username:     Yup.string().min(3).max(30)
    .matches(/^[a-z0-9_.-]+$/, 'Lowercase letters, numbers, dots, hyphens, underscores only')
    .required(),
  email:        Yup.string().email().notRequired(),
  phone:        yupPhone(false),
  subRole:      Yup.string().notRequired(),
  neighborhood: Yup.string().max(100).notRequired(),
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function StaffForm({ initialData: staff, onSuccess, onCancel }) {
  const { t }     = useAppTranslation('staff');
  const isEdit    = Boolean(staff?._id);
  const { campusId } = useParams();
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));

  const [roles,        setRoles]        = useState([]);
  const [apiError,     setApiError]     = useState('');
  const [profileImage, setProfileImage] = useState(staff?.profileImage ?? null);
  const [activationResult, setActivationResult] = useState(null);

  useEffect(() => {
    api.get('/staff-roles', { params: { campusId, isActive: 'true', limit: 100 } })
      .then((r) => setRoles(r.data?.data ?? []))
      .catch(() => {});
  }, [campusId]);

  const roleOptions = [
    { value: '', label: t('staff:form.noRole') },
    ...roles.map((r) => ({
      value: r._id,
      label: `${r.name} (${r.permissions?.length ?? 0} permissions)`,
    })),
  ];

  const formik = useFormik({
    initialValues: {
      firstName:    staff?.firstName    ?? '',
      lastName:     staff?.lastName     ?? '',
      username:     staff?.username     ?? '',
      email:        staff?.email        ?? '',
      phone:        staff?.phone        ?? '',
      password:     '',
      subRole:      staff?.subRole?._id ?? staff?.subRole ?? '',
      neighborhood: staff?.neighborhood ?? '',
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
        delete payload.password; // Account activation: user sets their own password.
        if (profileImage)     payload.profileImage = profileImage;

        if (isEdit) {
          await updateStaff(staff._id, payload);
          onSuccess(t('staff:form.updatedSuccess'));
        } else {
          const res = await createStaff(payload);
          const activation = res?.data?.data?.activation;
          if (activation) setActivationResult(activation);
          else onSuccess(t('staff:form.createdSuccess'));
        }
      } catch (err) {
        setApiError(err.response?.data?.message || t('staff:form.failed'));
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <>
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
        <FormSection title={t('staff:form.personalInfo')} />

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField formik={formik} name="firstName" label={t('staff:form.firstName')} icon={Person} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField formik={formik} name="lastName"  label={t('staff:form.lastName')}  icon={Person} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField formik={formik} name="username"  label={t('staff:form.username')}  icon={BadgeIcon} />
        </Grid>

        {/* ── Contact ───────────────────────────────────────────────────────── */}
        <FormSection title={t('staff:form.contact')} />

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField formik={formik} name="email" label={t('staff:form.emailAddress')} type="email" icon={Email} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PhoneInput
            name="phone"
            label={t('staff:form.phoneNumber')}
            value={formik.values.phone}
            onChange={(v) => formik.setFieldValue('phone', v)}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
          />
        </Grid>

        {/* ── Location ──────────────────────────────────────────────────────── */}
        <FormSection title={t('staff:form.location')} subtitle={t('staff:form.locationOptional')} />

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField
            formik={formik}
            name="neighborhood"
            label={t('staff:form.neighborhood')}
            icon={LocationOn}
          />
        </Grid>

        {/* ── Role ──────────────────────────────────────────────────────────── */}
        <FormSection title={t('staff:form.role')} />

        <Grid size={{ xs: 12 }}>
          <FormSelectField
            formik={formik}
            name="subRole"
            label={t('staff:form.subRole')}
            icon={AdminPanelSettings}
            options={roleOptions}
          />
        </Grid>

        {/* No password field: the staff member sets their own via the
            activation flow (see ActivationResultDialog shown after creation). */}

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
              {t('staff:form.cancel')}
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
              {formik.isSubmitting
                ? t('staff:form.saving')
                : isEdit
                  ? t('staff:form.saveChanges')
                  : t('staff:form.createStaff')}
            </Button>
          </Stack>
        </Grid>

      </Grid>
    </form>

    <ActivationResultDialog
      open={!!activationResult}
      activation={activationResult}
      onClose={() => {
        setActivationResult(null);
        onSuccess(t('staff:form.createdSuccess'));
      }}
    />
    </>
  );
}
