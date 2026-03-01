import { useEffect } from 'react';
import {
  Grid, Button, CircularProgress, Collapse,
  Stack, Snackbar, Alert,
  useTheme, useMediaQuery,
} from '@mui/material';
import {
  Person, Email, Phone, Badge,
  Domain, School, Check, Cancel,
} from '@mui/icons-material';
import NumbersIcon from '@mui/icons-material/Numbers';

import { useFormik } from 'formik';
import { useParams } from 'react-router-dom';

import { createStudentSchema }  from '../../../yupSchema/createStudentSchema';
import api                      from '../../../api/axiosInstance';
import useRelatedData           from '../../../hooks/useRelatedData';
import useFormSnackbar          from '../../../hooks/useFormSnackBar';
import useImagePreview          from '../../../hooks/useImagePreview';
import { getSubmitErrorMessage } from '../../../utils/handleSubmitError';

import ProfileImageUpload from '../../../components/form/ProfileImageUpload';
import FormSection        from '../../../components/form/FormSection';
import {
  FormTextField, FormDateField,
  FormSelectField, FormPasswordField, CampusField,
} from '../../../components/form/FormFields';

// ─── Static option lists ─────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
];

// ─── Endpoint config (stable reference – defined outside the component) ──────

const ENDPOINTS = {
  campus:  (id) => `/campus/${id}`,
  classes: (id) => `/campus/${id}/classes`,
};

// ─── Component ───────────────────────────────────────────────────────────────

const StudentForm = ({ initialData, onSuccess, onCancel }) => {
  const { campusId } = useParams();
  const theme        = useTheme();
  const isMobile     = useMediaQuery(theme.breakpoints.down('sm'));
  const isEdit       = !!initialData;

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();
  const { preview, file: imageFile, accept: acceptImage, remove: removeImage } =
    useImagePreview(initialData?.profileImage);

  // campus is a single object returned in an array; classes is a list
  const { data: related, loading } = useRelatedData(ENDPOINTS, campusId);
  const campus  = related.campus?.[0] ?? null;
  const classes = related.classes     ?? [];

  // ── Formik ────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: {
      firstName:    initialData?.firstName              || '',
      lastName:     initialData?.lastName               || '',
      email:        initialData?.email                  || '',
      username:     initialData?.username               || '',
      password:     '',
      phone:        initialData?.phone                  || '',
      gender:       initialData?.gender                 || 'male',
      matricule:    initialData?.matricule              || '',
      dateOfBirth:  initialData?.dateOfBirth?.split('T')[0] || '',
      studentClass: initialData?.studentClass?._id     || '',
      schoolCampus: initialData?.schoolCampus?._id     || campusId || '',
    },
    validationSchema: createStudentSchema(isEdit),
    validateOnChange: true,
    validateOnBlur:   true,

    onSubmit: async (values, { resetForm }) => {
      const formData = buildFormData(values, imageFile, isEdit);

      try {
        if (isEdit) {
          await api.put(`/students/${initialData._id}`, formData);
          onSuccess?.('Student updated successfully');
        } else {
          await api.post('/students', formData);
          onSuccess?.('Student created successfully');
          resetForm();
          removeImage();
        }
      } catch (err) {
        console.error('StudentForm submit error:', err);
        showSnackbar(getSubmitErrorMessage(err), 'error');
      }
    },
  });

  // Keep schoolCampus in sync once campus data is loaded
  useEffect(() => {
    const id = campus?._id ?? campusId;
    if (id && formik.values.schoolCampus !== id) {
      formik.setFieldValue('schoolCampus', id, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus?._id]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner />;

  const classOptions = classes.map((c) => ({ value: c._id, label: c.className }));

  return (
    <>
      <form onSubmit={formik.handleSubmit} noValidate>
        <Grid container spacing={3}>

          {/* Profile image */}
          <Grid size={{ xs: 12 }}>
            <ProfileImageUpload
              preview={preview}
              altText={`${formik.values.firstName} ${formik.values.lastName}`}
              onFileAccepted={acceptImage}
              onRemove={removeImage}
              onError={(msg) => showSnackbar(msg, 'error')}
            />
          </Grid>

          {/* ── Personal information ── */}
          <FormSection title="Personal Information" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="firstName" label="First Name" icon={Person} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="lastName"  label="Last Name"  icon={Person} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="username"  label="Username"   icon={Badge}  />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="matricule" label="Matricule (auto-generated if empty)"  icon={NumbersIcon} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelectField
              formik={formik}
              name="gender"
              label="Gender"
              options={GENDER_OPTIONS}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDateField formik={formik} name="dateOfBirth" label="Date of Birth" />
          </Grid>

          {/* ── Contact & security ── */}
          <FormSection title="Contact & Security" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="email" label="Email Address" type="email" icon={Email} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="phone" label="Phone Number" icon={Phone} />
          </Grid>

          <Collapse in={!isEdit} sx={{ width: '100%' }}>
            <Grid container spacing={3} sx={{ pl: 3, pr: 3 }}>
              <Grid size={{ xs: 12 }}>
                <FormPasswordField formik={formik} />
              </Grid>
            </Grid>
          </Collapse>

          {/* ── Academic assignment ── */}
          <FormSection title="Academic Assignment" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelectField
              formik={formik}
              name="studentClass"
              label="Class"
              icon={School}
              options={classOptions}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CampusField campusName={campus?.campus_name} icon={Domain} />
          </Grid>

          {/* ── Action buttons ── */}
          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <FormActions
              isEdit={isEdit}
              submitting={formik.isSubmitting}
              disabled={!formik.isValid}
              onCancel={onCancel}
              isMobile={isMobile}
              theme={theme}
            />
          </Grid>

        </Grid>
      </form>

      <FormSnackbar snackbar={snackbar} onClose={closeSnackbar} theme={theme} />
    </>
  );
};

export default StudentForm;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildFormData = (values, imageFile, isEdit) => {
  const fd = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (isEdit && key === 'password' && !value) return;
    if (value === null || value === '') return; 
      fd.append(key, value);
  });

  if (imageFile instanceof File) fd.append('profileImage', imageFile);

  return fd;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
    <CircularProgress />
  </div>
);

const FormActions = ({ isEdit, submitting, disabled, onCancel, isMobile, theme }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
    {onCancel && (
      <Button
        variant="outlined"
        onClick={onCancel}
        startIcon={<Cancel />}
        disabled={submitting}
        fullWidth={isMobile}
        sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
      >
        Cancel
      </Button>
    )}
    <Button
      variant="contained"
      type="submit"
      startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <Check />}
      disabled={submitting || disabled}
      fullWidth={isMobile}
      sx={{
        px: 4, py: 1.5, borderRadius: 2,
        textTransform: 'none', fontWeight: 600,
        boxShadow: theme.shadows[4],
        '&:hover': { boxShadow: theme.shadows[8] },
      }}
    >
      {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Student'}
    </Button>
  </Stack>
);

const FormSnackbar = ({ snackbar, onClose, theme }) => (
  <Snackbar
    open={snackbar.open}
    autoHideDuration={4000}
    onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    <Alert
      onClose={onClose}
      severity={snackbar.severity}
      variant="filled"
      sx={{ width: '100%', borderRadius: 2, boxShadow: theme.shadows[8] }}
    >
      {snackbar.message}
    </Alert>
  </Snackbar>
);