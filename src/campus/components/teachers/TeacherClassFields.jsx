/**
 * TeacherClassFields
 * ──────────────────────────────────────────────────────────────────────────────
 * Reusable block used inside the Teacher create / edit form.
 *
 * Renders:
 *   1. A chip-based multi-select for assigning classes to the teacher.
 *   2. A FormControl+Select dropdown to elect the teacher as classManager
 *      of one of the already-assigned classes (visible only when ≥1 class
 *      is selected).
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────────
 * @param {Object}   formik        - Formik instance from the parent form.
 * @param {Array}    classOptions  - [{ value: string, label: string }]
 *                                   All active classes of the campus.
 * @param {boolean}  loading       - Show skeleton while class list is loading.
 *
 * Formik fields consumed / written
 * ──────────────────────────────────────────────────────────────────────────────
 * • formik.values.classes        {string[]}     - selected class IDs
 * • formik.values.classManagerOf {string|null}  - class ID the teacher manages
 *
 * Integration (TeacherForm.jsx)
 * ──────────────────────────────────────────────────────────────────────────────
 * 1. Add to Yup schema  → already done in createTeacherSchema.js
 * 2. Add initial values:
 *      classes:        teacher?.classes?.map(c => c._id || c) ?? [],
 *      classManagerOf: existingManagerClass?._id ?? '',
 * 3. Add to submit payload:
 *      classes:        formik.values.classes,
 *      classManagerOf: formik.values.classManagerOf || null,
 * 4. Add to getTeacherFormData() → already done in teacher_service.js
 */

import React, { useMemo } from 'react';
import {
  Box,
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { Add, Remove, ManageAccounts } from '@mui/icons-material';
import FormSection from './FormSection';

// ─── Sub-component: class chip multi-select ───────────────────────────────────

/**
 * Renders a list of chips — one per class in the campus.
 * Clicking a chip toggles inclusion in formik.values.classes[].
 * If a chip is de-selected and was the classManagerOf, that field is cleared.
 */
const ClassChips = ({ formik, classOptions }) => {
  const selectedIds = formik.values.classes || [];

  const toggle = (classId) => {
    const isSelected = selectedIds.includes(classId);

    if (isSelected) {
      // Remove from the classes list
      const next = selectedIds.filter((id) => id !== classId);
      formik.setFieldValue('classes', next, true);

      // Clear classManagerOf if the removed class was the managed one
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
        const isSelected = selectedIds.includes(value);
        return (
          <Chip
            key={value}
            label={label}
            icon={isSelected ? <Remove fontSize="small" /> : <Add fontSize="small" />}
            onClick={() => toggle(value)}
            color={isSelected ? 'primary' : 'default'}
            variant={isSelected ? 'filled' : 'outlined'}
            sx={{ cursor: 'pointer', mb: 1 }}
          />
        );
      })}
    </Stack>
  );
};

// ─── Sub-component: classManager select ──────────────────────────────────────

/**
 * Select dropdown — only renders when at least one class is selected.
 * Uses FormControl + InputLabel + Select (never TextField[select]) to ensure
 * correct <label for> → <input id> accessibility link.
 */
const ClassManagerSelect = ({ formik, assignedOptions }) => {
  const fieldName = 'classManagerOf';
  const labelId   = `${fieldName}-label`;
  const hasError  = formik.touched[fieldName] && Boolean(formik.errors[fieldName]);

  // Guard: if the stored value is no longer in the assigned list, clear it
  const safeValue = assignedOptions.some((o) => o.value === formik.values[fieldName])
    ? formik.values[fieldName]
    : '';

  return (
    <FormControl fullWidth error={hasError} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
      <InputLabel id={labelId}>Class Manager of (optional)</InputLabel>
      <Select
        labelId={labelId}
        id={fieldName}
        name={fieldName}
        value={safeValue}
        label="Class Manager of (optional)"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        startAdornment={
          <ManageAccounts
            fontSize="small"
            color="action"
            sx={{ mr: 1 }}
          />
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
        <FormHelperText>{formik.errors[fieldName]}</FormHelperText>
      )}
    </FormControl>
  );
};

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * TeacherClassFields
 *
 * Drop this block inside your TeacherForm Grid container:
 *
 * ```jsx
 * <TeacherClassFields
 *   formik={formik}
 *   classOptions={classOptions}   // from getTeacherFormData()[3].data.data
 *   loading={loadingFormData}
 * />
 * ```
 */
const TeacherClassFields = ({ formik, classOptions = [], loading = false }) => {
  const selectedIds = formik.values.classes || [];

  // Build the options subset for the classManager select
  // (only classes already assigned to this teacher are valid choices)
  const assignedClassOptions = useMemo(
    () => classOptions.filter(({ value }) => selectedIds.includes(value)),
    [classOptions, selectedIds]
  );

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <FormSection title="Class Assignment" />
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rounded" width={90} height={32} />
            ))}
          </Stack>
        </Box>
      </>
    );
  }

  return (
    <>
      {/* ── Section header ──────────────────────────────────────────────────── */}
      <FormSection title="Class Assignment" />

      {/* ── Class chips ─────────────────────────────────────────────────────── */}
      <Box sx={{ gridColumn: '1 / -1' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Select the classes this teacher will teach
        </Typography>

        <ClassChips formik={formik} classOptions={classOptions} />

        {/* Validation error for the classes array */}
        {formik.touched.classes && formik.errors.classes && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
            {typeof formik.errors.classes === 'string'
              ? formik.errors.classes
              : 'Invalid class selection'}
          </Typography>
        )}
      </Box>

      {/* ── ClassManager select — only when classes are selected ────────────── */}
      {selectedIds.length > 0 && (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <ClassManagerSelect
            formik={formik}
            assignedOptions={assignedClassOptions}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            Designate this teacher as the Class Manager (homeroom teacher) of one of their classes.
          </Typography>
        </Box>
      )}
    </>
  );
};

export default TeacherClassFields;