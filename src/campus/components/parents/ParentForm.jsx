import { useEffect, useMemo, useState } from 'react';
import {
  Grid, Button, CircularProgress,
  Stack, Snackbar, Alert,
  useTheme, useMediaQuery, Box, Chip, Typography,
} from '@mui/material';
import {
  Person, Email, Domain,
  FamilyRestroom, Badge, Work, Language, Cancel, Check,
  Add, Remove, LocationOn,
} from '@mui/icons-material';

import { useFormik } from 'formik';
import { useParams } from 'react-router-dom';

import { createParentSchema }         from '../../../yupSchema/createParentSchema';
import { createParent, updateParent } from '../../../services/parentService';
import ActivationResultDialog          from '../common/ActivationResultDialog';
import useRelatedData                  from '../../../hooks/useRelatedData';
import useFormSnackbar                 from '../../../hooks/useFormSnackBar';
import useImagePreview                 from '../../../hooks/useImagePreview';
import { getSubmitErrorMessage }       from '../../../utils/handleSubmitError';

import ProfileImageUpload from '../../../components/form/ProfileImageUpload';
import FormSection        from '../../../components/form/FormSection';
import {
  FormTextField,
  FormSelectField,
  FormDateField,
  CampusField,
} from '../../../components/form/FormFields';
import PhoneInput from '../../../components/shared/PhoneInput';

// ─── Static option lists ──────────────────────────────────────────────────────

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'father',   label: 'Father'   },
  { value: 'mother',   label: 'Mother'   },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other',    label: 'Other'    },
];

const LANGUAGE_OPTIONS = [
  { value: 'en',    label: 'English'  },
  { value: 'fr',    label: 'Français' },
  { value: 'es',    label: 'Español'  },
  { value: 'ar',    label: 'العربية'  },
  { value: 'zh-CN', label: '中文'     },
  { value: 'de',    label: 'Deutsch'  },
];

// ─── Endpoint config ──────────────────────────────────────────────────────────

const ENDPOINTS = {
  campus:   (id) => `/campus/${id}`,
  students: (id) => `/students?campusId=${id}`,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a multipart FormData payload from Formik values.
 * - Password is omitted on edit when left blank.
 * - `children[]` sent as repeated field (backend expects array).
 * - Profile image appended as `profileImage` when a File is provided.
 */
const buildFormData = (values, imageFile, isEdit) => {
  const fd = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    // Skip blank password in edit mode
    if (isEdit && key === 'password' && !value) return;

    // Skip null / empty scalar values
    if (value === null || value === undefined || value === '') return;

    // Send each child id as a repeated "children" field
    if (key === 'children') {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach((id) => fd.append('children', id));
      }
      return;
    }

    fd.append(key, value);
  });

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
      {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Parent'}
    </Button>
  </Stack>
);

/**
 * Chip-based multi-select for linking students (children) to a parent.
 * Maximum 10 children per parent.
 */
const ChildrenChips = ({ formik, studentOptions }) => {
  const MAX_CHILDREN = 10;
  const selectedIds  = formik.values.children || [];

  const toggle = (studentId) => {
    const isSelected = selectedIds.includes(studentId);
    if (isSelected) {
      formik.setFieldValue('children', selectedIds.filter((id) => id !== studentId), true);
    } else {
      if (selectedIds.length >= MAX_CHILDREN) return;
      formik.setFieldValue('children', [...selectedIds, studentId], true);
    }
  };

  if (studentOptions.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" fontStyle="italic">
        No active students found for this campus.
      </Typography>
    );
  }

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      {studentOptions.map(({ value, label }) => {
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

// ─── Main component ───────────────────────────────────────────────────────────

const ParentForm = ({ initialData, onSuccess, onCancel }) => {
  const { campusId } = useParams();
  const theme        = useTheme();
  const isMobile     = useMediaQuery(theme.breakpoints.down('sm'));
  const isEdit       = !!initialData;

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();
  const [activationResult, setActivationResult] = useState(null);
  const { preview, file: imageFile, accept: acceptImage, remove: removeImage } =
    useImagePreview(initialData?.profileImage);

  const { data: related, loading } = useRelatedData(ENDPOINTS, campusId);
  const campus   = related.campus?.[0]  ?? null;
  const students = related.students     ?? [];

  // ── Derived option list ─────────────────────────────────────────────────────

  const studentOptions = useMemo(
    () => students.map((s) => ({
      value: s._id,
      label: `${s.firstName} ${s.lastName}`,
    })),
    [students]
  );

  // ── Formik ──────────────────────────────────────────────────────────────────

  const formik = useFormik({
    initialValues: {
      firstName:         initialData?.firstName         || '',
      lastName:          initialData?.lastName          || '',
      email:             initialData?.email             || '',
      phone:             initialData?.phone             || '',
      password:          '',
      gender:            initialData?.gender            || 'male',
      relationship:      initialData?.relationship      || 'father',
      dateOfBirth:       initialData?.dateOfBirth?.split('T')[0] || '',
      nationalId:        initialData?.nationalId        || '',
      occupation:        initialData?.occupation        || '',
      preferredLanguage: initialData?.preferredLanguage || 'fr',
      notes:             initialData?.notes             || '',
      schoolCampus:      initialData?.schoolCampus?._id || campusId || '',
      neighborhood:      initialData?.neighborhood      || '',
      // Normalize children[] to an array of string IDs
      children: (initialData?.children || []).map((c) => c._id ?? c),
    },
    validationSchema: createParentSchema(isEdit),
    validateOnChange: true,
    validateOnBlur:   true,

    onSubmit: async (values, { resetForm }) => {
      const formData = buildFormData(values, imageFile, isEdit);

      try {
        if (isEdit) {
          await updateParent(initialData._id, formData);
          onSuccess?.('Parent updated successfully');
        } else {
          const res = await createParent(formData);
          resetForm();
          removeImage();
          const activation = res?.data?.data?.activation;
          if (activation) setActivationResult(activation);
          else onSuccess?.('Parent account created successfully');
        }
      } catch (err) {
        console.error('ParentForm submit error:', err);
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

          {/* ── Personal Information ──────────────────────────────────── */}
          <FormSection title="Personal Information" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="firstName"  label="First Name"  icon={Person} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="lastName"   label="Last Name"   icon={Person} />
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
            <FormSelectField
              formik={formik}
              name="relationship"
              label="Relationship to Child"
              icon={FamilyRestroom}
              options={RELATIONSHIP_OPTIONS}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormDateField formik={formik} name="dateOfBirth" label="Date of Birth" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="nationalId"  label="National ID (optional)"  icon={Badge} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField formik={formik} name="occupation"  label="Occupation (optional)"   icon={Work}  />
          </Grid>

          {/* ── Contact & Security ────────────────────────────────────── */}
          <FormSection title="Contact & Security" />

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
              required
            />
          </Grid>

          {/* No password field: the parent sets their own via the activation
              flow (see ActivationResultDialog shown after creation). */}

          {/* ── Linked Children ───────────────────────────────────────── */}
          <FormSection title="Linked Children" subtitle="(select the parent's child(ren) — max 10)" />

          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {formik.values.children.length > 0
                ? `${formik.values.children.length} student${formik.values.children.length > 1 ? 's' : ''} selected`
                : 'Select students enrolled at this campus'}
            </Typography>

            <ChildrenChips formik={formik} studentOptions={studentOptions} />

            {formik.touched.children && formik.errors.children && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {typeof formik.errors.children === 'string'
                  ? formik.errors.children
                  : 'Invalid selection'}
              </Typography>
            )}
          </Grid>

          {/* ── Location ─────────────────────────────────────────────── */}
          <FormSection title="Location" subtitle="(optional)" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormTextField
              formik={formik}
              name="neighborhood"
              label="Neighborhood"
              icon={LocationOn}
            />
          </Grid>

          {/* ── Preferences ──────────────────────────────────────────── */}
          <FormSection title="Preferences" subtitle="(optional)" />

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelectField
              formik={formik}
              name="preferredLanguage"
              label="Preferred Language"
              icon={Language}
              options={LANGUAGE_OPTIONS}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <CampusField campusName={campus?.campus_name} icon={Domain} />
          </Grid>

          {/* ── Admin Notes ──────────────────────────────────────────── */}
          <FormSection title="Internal Notes" subtitle="(admin only — not visible to parent)" />

          <Grid size={{ xs: 12 }}>
            <FormTextField
              formik={formik}
              name="notes"
              label="Notes"
              multiline
              rows={3}
            />
          </Grid>

          {/* ── Actions ──────────────────────────────────────────────── */}
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', borderRadius: 2, boxShadow: theme.shadows[8] }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ActivationResultDialog
        open={!!activationResult}
        activation={activationResult}
        onClose={() => {
          setActivationResult(null);
          onSuccess?.('Parent account created successfully');
        }}
      />
    </>
  );
};

export default ParentForm;
