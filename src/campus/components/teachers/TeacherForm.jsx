import React, { useEffect, useMemo } from 'react';
import {
  Grid, Button, CircularProgress, Collapse,
  Stack, Snackbar, Alert,
  useTheme, useMediaQuery,
  Box, Chip, Typography,
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
} from '@mui/material';
import {
  Person, Email, Phone, Badge, Lock, Domain,
  Business, Work, Star, Psychology, AccessTime, ContactEmergency,
  Check, Cancel,
  MenuBook, Add, Remove, ManageAccounts,
  Class as ClassIcon,
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

// ─── Static option lists ──────────────────────────────────────────────────────

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

// ─── Shared sx ────────────────────────────────────────────────────────────────

const SELECT_SX = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

// ─── Endpoint config (stable reference — defined outside component) ───────────

const ENDPOINTS = {
  campus:      (id) => `/campus/${id}`,
  departments: (id) => `/campus/${id}/departments`,
  subjects:    (id) => `/subject?campusId=${id}`,
  // Classes scoped to this campus — needed for assignment and classManager election
  classes:     (id) => `/campus/${id}/classes`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve which class (if any) this teacher currently manages.
 * The Class document stores classManager as a Teacher ObjectId.
 * We scan the loaded class list to find the match.
 *
 * @param {Object}   teacher     - Teacher document (with _id field)
 * @param {Array}    classList   - All Class objects for this campus
 * @returns {string} classId or empty string
 */
const resolveCurrentClassManagerOf = (teacher, classList) => {
  if (!teacher?._id || !Array.isArray(classList)) return '';
  const teacherId = teacher._id.toString();
  const managed   = classList.find(
    (c) => c.classManager &&
      (c.classManager._id?.toString() ?? c.classManager.toString()) === teacherId
  );
  return managed?._id ?? '';
};

/**
 * Build a multipart FormData payload from Formik values.
 * - Password is omitted on edit when left blank.
 * - `subjects[]` sent as repeated field (backend expects array).
 * - `classes[]` sent as repeated field (backend expects array).
 * - `classManagerOf` sent as scalar (or omitted when empty).
 *
 * @param {Object}  values    - Formik values
 * @param {File}    imageFile - Profile image File or null
 * @param {boolean} isEdit    - Edit mode flag
 * @returns {FormData}
 */
/**
 * Emergency-contact flat Formik keys that must be collapsed into the
 * nested `emergencyContact` object expected by the backend schema.
 */
const EMERGENCY_KEY_MAP = {
  emergencyContactName:     'name',
  emergencyContactPhone:    'phone',
  emergencyContactRelation: 'relationship',
};

const buildFormData = (values, imageFile, isEdit) => {
  const fd = new FormData();

  // Accumulate emergency-contact sub-fields; send as JSON blob at the end
  // (multer does not support bracket-notation nesting for text fields).
  const emergencyContact = {};

  Object.entries(values).forEach(([key, value]) => {
    // Skip blank password in edit mode
    if (isEdit && key === 'password' && !value) return;

    // Skip null / empty scalar values
    if (value === null || value === undefined || value === '') return;

    // Collect emergency contact sub-fields into a single object
    if (EMERGENCY_KEY_MAP[key]) {
      emergencyContact[EMERGENCY_KEY_MAP[key]] = value;
      return;
    }

    // Map "subject" (single select) → "subjects" array on the backend
    if (key === 'subject') {
      fd.append('subjects', value);
      return;
    }

    // Send each selected class as a repeated "classes" field
    if (key === 'classes') {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach((classId) => fd.append('classes', classId));
      }
      return;
    }

    // classManagerOf — send only when non-empty
    if (key === 'classManagerOf') {
      if (value) fd.append('classManagerOf', value);
      return;
    }

    fd.append(key, value);
  });

  // Serialize emergencyContact as a JSON string so multer receives it as a
  // single text field; the backend (genericEntity_controller) will parse it.
  if (Object.keys(emergencyContact).length > 0) {
    fd.append('emergencyContact', JSON.stringify(emergencyContact));
  }

  if (imageFile instanceof File) fd.append('profileImage', imageFile);

  return fd;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const LoadingSpinner = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
    <CircularProgress />
  </Box>
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

// ─── ClassAssignment block ────────────────────────────────────────────────────

/**
 * Chip-based multi-select for assigning classes to a teacher.
 * De-selecting a chip that was the classManagerOf auto-clears that field.
 */
const ClassChips = ({ formik, classOptions }) => {
  const selectedIds = formik.values.classes || [];

  const toggle = (classId) => {
    const isSelected = selectedIds.includes(classId);
    if (isSelected) {
      // Remove from list
      formik.setFieldValue('classes', selectedIds.filter((id) => id !== classId), true);
      // Clear classManagerOf if it was this class
      if (formik.values.classManagerOf === classId) {
        formik.setFieldValue('classManagerOf', '', true);
      }
    } else {
      formik.setFieldValue('classes', [...selectedIds, classId], true);
    }
  };

  if (classOptions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        No active classes found for this campus.
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {classOptions.map(({ value, label }) => {
        const selected = selectedIds.includes(value);
        return (
          <Chip
            key={value}
            label={label}
            icon={selected ? <Remove fontSize="small" /> : <Add fontSize="small" />}
            onClick={() => toggle(value)}
            color={selected ? 'primary' : 'default'}
            variant={selected ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer', mb: 1 }}
          />
        );
      })}
    </Stack>
  );
};

/**
 * FormControl + InputLabel + Select for classManagerOf.
 * Only rendered when at least one class is assigned.
 * Follows the project rule: never TextField[select].
 */
const ClassManagerSelect = ({ formik, assignedOptions }) => {
  const labelId  = 'classManagerOf-label';
  const hasError = formik.touched.classManagerOf && Boolean(formik.errors.classManagerOf);

  // Guard: clear stale value if no longer in assigned list
  const safeValue = assignedOptions.some((o) => o.value === formik.values.classManagerOf)
    ? formik.values.classManagerOf
    : '';

  return (
    <FormControl fullWidth error={hasError} sx={SELECT_SX}>
      <InputLabel id={labelId}>Class Manager of (optional)</InputLabel>
      <Select
        labelId={labelId}
        id="classManagerOf"
        name="classManagerOf"
        value={safeValue}
        label="Class Manager of (optional)"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        startAdornment={
          <ManageAccounts fontSize="small" color="action" sx={{ mr: 1 }} />
        }
      >
        {/* Allow clearing the selection */}
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {assignedOptions.map(({ value, label }) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>

      {hasError && (
        <FormHelperText>{formik.errors.classManagerOf}</FormHelperText>
      )}
    </FormControl>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const TeacherForm = ({ initialData, onSuccess, onCancel }) => {
  const { campusId }  = useParams();
  const theme         = useTheme();
  const isMobile      = useMediaQuery(theme.breakpoints.down('sm'));
  const isEdit        = !!initialData;

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();
  const { preview, file: imageFile, accept: acceptImage, remove: removeImage } =
    useImagePreview(initialData?.profileImage);

  // Fetch all reference data in parallel — campus, departments, subjects, classes
  const { data: related, loading } = useRelatedData(ENDPOINTS, campusId);
  const campus      = related.campus?.[0]   ?? null;
  const departments = related.departments   ?? [];
  const subjects    = related.subjects      ?? [];
  const classes     = related.classes       ?? [];

  // ── Formik ─────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: {
      firstName:              initialData?.firstName                  || '',
      lastName:               initialData?.lastName                   || '',
      email:                  initialData?.email                      || '',
      username:               initialData?.username                   || '',
      password:               '',
      phone:                  initialData?.phone                      || '',
      gender:                 initialData?.gender                     || 'male',
      dateOfBirth:            initialData?.dateOfBirth?.split('T')[0] || '',
      qualification:          initialData?.qualification              || '',
      specialization:         initialData?.specialization             || '',
      experience:             initialData?.experience                 ?? 0,
      employmentType:         initialData?.employmentType             || 'full-time',
      department:             initialData?.department?._id            || '',
      subject:                initialData?.subjects?.[0]?._id         || '',
      // Normalize classes[] to an array of string IDs
      classes:                (initialData?.classes || []).map((c) => c._id ?? c),
      // classManagerOf is resolved once the class list is loaded (see effect below)
      classManagerOf:         '',
      matricule:              initialData?.matricule                  || '',
      schoolCampus:           initialData?.schoolCampus?._id         || campusId || '',
      emergencyContactName:     initialData?.emergencyContact?.name         || '',
      emergencyContactPhone:    initialData?.emergencyContact?.phone        || '',
      emergencyContactRelation: initialData?.emergencyContact?.relationship || '',
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

  // Sync schoolCampus once campus data is loaded
  useEffect(() => {
    const id = campus?._id ?? campusId;
    if (id && formik.values.schoolCampus !== id) {
      formik.setFieldValue('schoolCampus', id, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campus?._id]);

  // Resolve classManagerOf once the class list is available (edit mode only)
  useEffect(() => {
    if (!isEdit || classes.length === 0) return;
    const managerClassId = resolveCurrentClassManagerOf(initialData, classes);
    if (managerClassId) {
      formik.setFieldValue('classManagerOf', managerClassId, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classes.length]);

  // ── Derived option lists ────────────────────────────────────────────────────

  const deptOptions = useMemo(
    () => departments.map((d) => ({ value: d._id, label: d.name })),
    [departments]
  );
  const subjectOptions = useMemo(
    () => subjects.map((s) => ({ value: s._id, label: s.subject_name || s.name })),
    [subjects]
  );
  const classOptions = useMemo(
    () => classes.map((c) => ({ value: c._id, label: c.className })),
    [classes]
  );

  // Options available for classManager select = only assigned classes
  const assignedClassOptions = useMemo(
    () => classOptions.filter(({ value }) => formik.values.classes.includes(value)),
    [classOptions, formik.values.classes]
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <form onSubmit={formik.handleSubmit} noValidate>
        <Grid container spacing={3}>

          {/* ── Profile image ──────────────────────────────────────────── */}
          <Grid size={{ xs: 12 }}>
            <ProfileImageUpload
              preview={preview}
              altText={`${formik.values.firstName} ${formik.values.lastName}`}
              onFileAccepted={acceptImage}
              onRemove={removeImage}
              onError={(msg) => showSnackbar(msg, 'error')}
            />
          </Grid>

          {/* ── Personal information ───────────────────────────────────── */}
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

          {/* ── Contact & Security ────────────────────────────────────── */}
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

          {/* ── Professional information ───────────────────────────────── */}
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
            <FormTextField formik={formik} name="qualification"  label="Qualification"      icon={Star}       />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="specialization" label="Specialization"     icon={Psychology} />
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

          {/* ── Class assignment ───────────────────────────────────────── */}
          <FormSection title="Class Assignment" />

          {/* Class chips multi-select */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Select the classes this teacher will teach
            </Typography>

            <ClassChips formik={formik} classOptions={classOptions} />

            {formik.touched.classes && formik.errors.classes && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {typeof formik.errors.classes === 'string'
                  ? formik.errors.classes
                  : 'Invalid class selection'}
              </Typography>
            )}
          </Grid>

          {/* classManager select — only when ≥1 class is assigned */}
          {formik.values.classes.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <ClassManagerSelect
                formik={formik}
                assignedOptions={assignedClassOptions}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Designate this teacher as the Class Manager (homeroom teacher) of one of their classes.
              </Typography>
            </Grid>
          )}

          {/* ── Emergency contact ──────────────────────────────────────── */}
          <FormSection title="Emergency Contact" subtitle="(optional)" />

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormTextField formik={formik} name="emergencyContactName"     label="Contact Name"  icon={ContactEmergency} />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormTextField formik={formik} name="emergencyContactPhone"    label="Contact Phone" icon={Phone}            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormTextField formik={formik} name="emergencyContactRelation" label="Relationship"                          />
          </Grid>

          {/* ── Action buttons ─────────────────────────────────────────── */}
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