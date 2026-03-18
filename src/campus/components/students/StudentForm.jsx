import React, { useEffect } from 'react';
import {
  Grid, Button, CircularProgress, Collapse,
  Stack, Snackbar, Alert,
  useTheme, useMediaQuery,
} from '@mui/material';
import {
  Person, Email, Phone, Badge,
  Domain, School, Check, Cancel, ContactEmergency,
} from '@mui/icons-material';
import NumbersIcon from '@mui/icons-material/Numbers';

import { useFormik } from 'formik';
import { useParams } from 'react-router-dom';

import { createStudentSchema }   from '../../../yupSchema/createStudentSchema';
import { createStudent, updateStudent } from '../../../services/student.service';
import useRelatedData             from '../../../hooks/useRelatedData';
import useFormSnackbar            from '../../../hooks/useFormSnackBar';
import useImagePreview            from '../../../hooks/useImagePreview';
import { getSubmitErrorMessage }  from '../../../utils/handleSubmitError';

import ProfileImageUpload from '../../../components/form/ProfileImageUpload';
import FormSection        from '../../../components/form/FormSection';
import {
  FormTextField, FormDateField,
  FormSelectField, FormPasswordField, CampusField,
} from '../../../components/form/FormFields';

// ─── Static option lists ──────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
];

// ─── Endpoint config (stable reference — defined outside component) ───────────

const ENDPOINTS = {
  campus:  (id) => `/campus/${id}`,
  classes: (id) => `/campus/${id}/classes`,
};

/**
 * Emergency-contact flat Formik keys → nested emergencyContact sub-document.
 * Multer flattens multipart text fields as plain strings, so we JSON-serialise
 * the sub-object and let the backend (genericEntity_controller) deserialise it.
 */
const EMERGENCY_KEY_MAP = {
  emergencyContactName:     'name',
  emergencyContactPhone:    'phone',
  emergencyContactRelation: 'relationship',
};

// ─── buildFormData ────────────────────────────────────────────────────────────

/**
 * Build a multipart FormData payload from Formik values.
 *  - Filters null / undefined / '' to avoid sending the literal string "undefined".
 *  - Omits password on edit when left blank.
 *  - Collapses emergencyContact* flat keys into a JSON blob.
 *
 * @param {Object}  values    - Formik values
 * @param {File}    imageFile - Profile image File or null
 * @param {boolean} isEdit    - Edit mode flag
 * @returns {FormData}
 */
const buildFormData = (values, imageFile, isEdit) => {
  const fd = new FormData();
  const emergencyContact = {};

  Object.entries(values).forEach(([key, value]) => {
    // Skip blank password in edit mode
    if (isEdit && key === 'password' && !value) return;

    // Skip null / undefined / empty string — never send "undefined" as a string
    if (value === null || value === undefined || value === '') return;

    // Collect emergency-contact sub-fields
    if (EMERGENCY_KEY_MAP[key]) {
      emergencyContact[EMERGENCY_KEY_MAP[key]] = value;
      return;
    }

    fd.append(key, value);
  });

  // Serialise as JSON; the controller parses it back into a proper sub-document
  if (Object.keys(emergencyContact).length > 0) {
    fd.append('emergencyContact', JSON.stringify(emergencyContact));
  }

  if (imageFile instanceof File) fd.append('profileImage', imageFile);

  return fd;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

const StudentForm = ({ initialData, onSuccess, onCancel }) => {
  const { campusId } = useParams();
  const theme        = useTheme();
  const isMobile     = useMediaQuery(theme.breakpoints.down('sm'));
  const isEdit       = !!initialData;

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();
  const { preview, file: imageFile, accept: acceptImage, remove: removeImage } =
    useImagePreview(initialData?.profileImage);

  // campus is a single object returned inside an array; classes is a list
  const { data: related, loading } = useRelatedData(ENDPOINTS, campusId);
  const campus  = related.campus?.[0] ?? null;
  const classes = related.classes     ?? [];

  // ── Formik ────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: {
      // ── Personal information ──────────────────────────────────────────────
      firstName:    initialData?.firstName                    || '',
      lastName:     initialData?.lastName                     || '',
      username:     initialData?.username                     || '',
      password:     '',
      gender:       initialData?.gender                       || 'male',
      dateOfBirth:  initialData?.dateOfBirth?.split('T')[0]   || '',
      matricule:    initialData?.matricule                    || '',
      // ── Contact & security ────────────────────────────────────────────────
      email:        initialData?.email                        || '',
      phone:        initialData?.phone                        || '',
      // ── Academic assignment ───────────────────────────────────────────────
      studentClass: initialData?.studentClass?._id            || '',
      schoolCampus: initialData?.schoolCampus?._id            || campusId || '',
      // ── Emergency contact (optional) ──────────────────────────────────────
      emergencyContactName:     initialData?.emergencyContact?.name         || '',
      emergencyContactPhone:    initialData?.emergencyContact?.phone        || '',
      emergencyContactRelation: initialData?.emergencyContact?.relationship || '',
    },
    validationSchema: createStudentSchema(isEdit),
    validateOnChange: true,
    validateOnBlur:   true,

    onSubmit: async (values, { resetForm }) => {
      const formData = buildFormData(values, imageFile, isEdit);

      try {
        if (isEdit) {
          await updateStudent(initialData._id, formData);
          onSuccess?.('Student updated successfully');
        } else {
          await createStudent(formData);
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

  // Keep schoolCampus in sync once campus data is loaded (campus isolation)
  useEffect(() => {
    const id = campus?._id ?? campusId;
    if (id && formik.values.schoolCampus !== id) {
      formik.setFieldValue('schoolCampus', id, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus?._id]);

  // ── Derived option lists ──────────────────────────────────────────────────

  const classOptions = classes.map((c) => ({ value: c._id, label: c.className }));

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <form onSubmit={formik.handleSubmit} noValidate>
        <Grid container spacing={3}>

          {/* ── Profile image ──────────────────────────────────────────────── */}
          <Grid size={{ xs: 12 }}>
            <ProfileImageUpload
              preview={preview}
              altText={`${formik.values.firstName} ${formik.values.lastName}`}
              onFileAccepted={acceptImage}
              onRemove={removeImage}
              onError={(msg) => showSnackbar(msg, 'error')}
            />
          </Grid>

          {/* ── Personal information ───────────────────────────────────────── */}
          <FormSection title="Personal Information" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="firstName"  label="First Name"  icon={Person} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="lastName"   label="Last Name"   icon={Person} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="username"   label="Username"    icon={Badge}  />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              formik={formik}
              name="matricule"
              label="Matricule (auto-generated if empty)"
              icon={NumbersIcon}
            />
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

          {/* ── Contact & security ────────────────────────────────────────── */}
          <FormSection title="Contact & Security" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="email" label="Email Address" type="email" icon={Email} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="phone" label="Phone Number"  icon={Phone} />
          </Grid>

          <Collapse in={!isEdit} sx={{ width: '100%' }}>
            <Grid container spacing={3} sx={{ pl: 3, pr: 3 }}>
              <Grid size={{ xs: 12 }}>
                <FormPasswordField formik={formik} />
              </Grid>
            </Grid>
          </Collapse>

          {/* ── Academic assignment ───────────────────────────────────────── */}
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

          {/* ── Emergency contact (optional) ──────────────────────────────── */}
          <FormSection title="Emergency Contact" subtitle="(optional)" />

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormTextField
              formik={formik}
              name="emergencyContactName"
              label="Contact Name"
              icon={ContactEmergency}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormTextField
              formik={formik}
              name="emergencyContactPhone"
              label="Contact Phone"
              icon={Phone}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormTextField
              formik={formik}
              name="emergencyContactRelation"
              label="Relationship"
            />
          </Grid>

          {/* ── Action buttons ─────────────────────────────────────────────── */}
          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <FormActions
              isEdit={isEdit}
              submitting={formik.isSubmitting}
              // In create mode, also require at least one field to be touched
              // (dirty check) to prevent the button being blocked on fresh mount.
              disabled={!formik.isValid || (!isEdit && !formik.dirty)}
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