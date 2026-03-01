import React, { useEffect } from 'react';
import {
  Grid, Button, CircularProgress, Collapse,
  Stack, Snackbar, Alert,
  useTheme, useMediaQuery,
} from '@mui/material';
import {
  Person, Email, Phone, Badge, Lock, Domain,
  Business, Work, Star, Psychology, AccessTime, ContactEmergency,
  Check, Cancel,
  MenuBook,
} from '@mui/icons-material';
import NumbersIcon from '@mui/icons-material/Numbers';

import { useFormik } from 'formik';
import { useParams } from 'react-router-dom';

import { createTeacherSchema }   from '../../../yupSchema/createTeacherSchema';
import { createTeacher, updateTeacher } from '../../../services/teacher.service';
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

// ─── Static option lists ─────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other'  },
];

const EMPLOYMENT_OPTIONS = [
  { value: 'full-time',  label: 'Full-time'  },
  { value: 'part-time',  label: 'Part-time'  },
  { value: 'contract',   label: 'Contract'   },
  { value: 'temporary',  label: 'Temporary'  },
];

// ─── Endpoint config (stable reference – defined outside the component) ──────

const ENDPOINTS = {
  campus:      (id) => `/campus/${id}`,
  departments: (id) => `/campus/${id}/departments`,
  subjects: (id) => `/subject?campusId=${id}`,
};

// ─── Component ───────────────────────────────────────────────────────────────

const TeacherForm = ({ initialData, onSuccess, onCancel }) => {
  const { campusId }  = useParams();
  const theme         = useTheme();
  const isMobile      = useMediaQuery(theme.breakpoints.down('sm'));
  const isEdit        = !!initialData;

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();
  const { preview, file: imageFile, accept: acceptImage, remove: removeImage } =
    useImagePreview(initialData?.profileImage);

  // Fetch campus info + departments + subjects in parallel
  const { data: related, loading } = useRelatedData(ENDPOINTS, campusId);
  const campus      = related.campus?.[0]      ?? null;   // single object wrapped in array by the hook
  const departments = related.departments      ?? [];
  const subjects    = related.subjects         ?? [];

  // ── Formik ────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: {
      firstName:              initialData?.firstName              || '',
      lastName:               initialData?.lastName               || '',
      email:                  initialData?.email                  || '',
      username:               initialData?.username               || '',
      password:               '',
      phone:                  initialData?.phone                  || '',
      gender:                 initialData?.gender                 || 'male',
      dateOfBirth:            initialData?.dateOfBirth?.split('T')[0] || '',
      qualification:          initialData?.qualification          || '',
      specialization:         initialData?.specialization         || '',
      experience:             initialData?.experience             ?? 0,
      employmentType:         initialData?.employmentType         || 'full-time',
      department:             initialData?.department?._id        || '',
      subject:                 initialData?.subjects?.[0]?._id     || '',
      matricule:              initialData?.matricule              || '',
      schoolCampus:           initialData?.schoolCampus?._id        || campusId || '',
      emergencyContactName:     initialData?.emergencyContact?.name           || '',
      emergencyContactPhone:    initialData?.emergencyContact?.phone          || '',
      emergencyContactRelation: initialData?.emergencyContact?.relationship   || '',
    },
    validationSchema: createTeacherSchema(isEdit),
    validateOnChange: true,
    validateOnBlur:   true,

    onSubmit: async (values, { resetForm }) => {
      const formData = buildFormData(values, imageFile, isEdit);

      try {
        if (isEdit) {
          await updateTeacher(initialData._id, formData);
          onSuccess?.('Teacher updated successfully');
        } else {
          await createTeacher(formData);
          onSuccess?.('Teacher created successfully');
          resetForm();
          removeImage();
        }
      } catch (err) {
        console.error('TeacherForm submit error:', err);
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

  const deptOptions = departments.map((d) => ({ value: d._id, label: d.name }));
  const subjectOptions = subjects.map((s) => ({ value: s._id, label: s.subject_name || s.name}));

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
            <FormTextField 
              formik={formik} 
              name="firstName"  
              label="First Name"  
              icon={Person} 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField 
              formik={formik} 
              name="lastName"   
              label="Last Name"   
              icon={Person} 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField 
              formik={formik} 
              name="username"   
              label="Username"    
              icon={Badge}  
            />
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
            <FormDateField 
              formik={formik} 
              name="dateOfBirth"
              label="Date of Birth" 
            />
          </Grid>

          {/* ── Contact & security ── */}
          <FormSection title="Contact & Security" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField 
              formik={formik} 
              name="email" 
              label="Email Address" 
              type="email" 
              icon={Email} 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField 
              formik={formik} 
              name="phone" 
              label="Phone Number" 
              icon={Phone} 
            />
          </Grid>

          <Collapse in={!isEdit} sx={{ width: '100%' }}>
            <Grid container spacing={3} sx={{ pl: 3, pr: 3 }}>
              <Grid size={{ xs: 12 }}>
                <FormPasswordField formik={formik} />
              </Grid>
            </Grid>
          </Collapse>

          {/* ── Professional information ── */}
          <FormSection title="Professional Information" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelectField
              formik={formik}
              name="department"
              label="Department"
              icon={Business}
              options={deptOptions}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField 
              formik={formik} 
              name="qualification" 
              label="Qualification" 
              icon={Star} 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField 
              formik={formik} 
              name="specialization" 
              label="Specialization" 
              icon={Psychology} 
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              formik={formik}
              name="experience"
              label="Years of Experience"
              type="number"
              icon={AccessTime}
              slotPropsExtra={{ inputProps: { min: 0, max: 50 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelectField
              formik={formik}
              name="employmentType"
              label="Employment Type"
              icon={Work}
              options={EMPLOYMENT_OPTIONS}
            />
          </Grid>
           <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelectField
              formik={formik}
              name="subject"
              label="Primary Subject"
              icon={MenuBook}
              options={subjectOptions}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CampusField campusName={campus?.campus_name} icon={Domain} />
          </Grid>

          {/* ── Emergency contact ── */}
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

          {/* ── Action buttons ── */}
          <Grid size={{ xs: 12 }} sx={{ mt: 3 }}>
            <FormActions
              isEdit={isEdit}
              submitting={formik.isSubmitting}
              disabled={!formik.isValid || !formik.dirty}
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

export default TeacherForm;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Builds a FormData from the formik values + optional image File.
 * Password is omitted on edit mode when left blank.
 */
const buildFormData = (values, imageFile, isEdit) => {
  const fd = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (isEdit && key === 'password' && !value) return;
    if (value === null || value === '') return;

    //Map form field "subject" -> backend field "subjects" (array)
    if(key === 'subject'){
      fd.append('subjects', value);
      return;
    }

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
      {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Teacher'}
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