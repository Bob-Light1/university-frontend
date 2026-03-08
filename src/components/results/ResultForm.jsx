/**
 * @file ResultForm.jsx
 * @description Formik + Yup form for creating or editing a single academic result.
 *
 * Props:
 *  open             — dialog open state
 *  onClose          — () => void
 *  onSubmit         — async (values) => void
 *  initialValues    — pre-filled values for edit mode (null = create)
 *  campusId         — current campus ID (injected automatically, campus isolation)
 *  classes          — [{ _id, className }]
 *  subjects         — [{ _id, subject_name, subject_code }]
 *  teachers         — [{ _id, firstName, lastName }]
 *  students         — [{ _id, firstName, lastName, matricule }]
 *                     Populated on-demand by the parent via onClassChange.
 *  studentsLoading  — true while the parent fetches students for the selected class
 *  gradingScales    — [{ _id, name }]
 *  mode             — 'create' | 'edit'
 *  defaultTeacherId — pre-fill teacher for TEACHER role users
 *  readonlyTeacher  — true for TEACHER role: shows name read-only, hides select
 *  onClassChange    — optional (classId: string) => void
 *                     Called when the Class select changes so the parent can
 *                     load the matching students via GET /students?classId=.
 *
 * Key design decisions
 * ─────────────────────
 * 1. toId() normalizes populated Mongoose sub-documents to plain string IDs.
 *    Backend list responses return populated refs (e.g. class: { _id, className }).
 *    MUI Select requires plain strings matching MenuItem value props — passing
 *    an object produces the "[object Object] out-of-range" console warning.
 *
 * 2. enableReinitialize={isEdit} only.
 *    In create mode, every parent re-render (e.g. studentsLoading toggling)
 *    would re-run enableReinitialize, see that current values match initialValues,
 *    and reset dirty=false — permanently disabling the submit button.
 *
 * 3. safeStudentValue() returns '' while studentsLoading=true so MUI never
 *    sees an out-of-range ID during the async fetch window. The real Formik
 *    value is preserved and applied once the options list is populated.
 */

import { useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Divider, Typography,
  CircularProgress, Alert, FormControl, InputLabel, Select,
  Tooltip,
} from '@mui/material';
import { Formik, Form } from 'formik';

import {
  createResultSchema,
  EVALUATION_TYPE, EXAM_PERIOD, EXAM_ATTENDANCE, SEMESTER,
} from '../../yupSchema/createResultSchema';

// ─── Constants ────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = currentYear - 2 + i;
  return `${y}-${y + 1}`;
});

const MENU_PROPS = { PaperProps: { sx: { maxHeight: 260 } } };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * toId — extract a plain string ID from a value that may be:
 *   • already a string ID            → returned as-is
 *   • a populated Mongoose document  → extract _id
 *   • null / undefined               → return ''
 */
const toId = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return String(val._id ?? val.id ?? '');
};

// ─── Field helpers ─────────────────────────────────────────────────────────────

/**
 * FieldSelect — built with FormControl + InputLabel + Select (NOT TextField[select]).
 *
 * Why: TextField[select] places the `id` on a wrapper div, not on the underlying
 * input, breaking the label `for` → input `id` accessibility linkage even with
 * slotProps workarounds (MUI v5/v6 known issue, 2025–2026).
 */
const FieldSelect = ({ label, name, options, formik, required, disabled, onExtraChange }) => {
  const fieldId  = `result-form-${name}`;
  const hasError = formik.touched[name] && Boolean(formik.errors[name]);

  const handleChange = (e) => {
    formik.handleChange(e);
    if (onExtraChange) onExtraChange(e.target.value);
  };

  return (
    <FormControl fullWidth size="small" required={required} disabled={disabled} error={hasError}>
      <InputLabel id={`${fieldId}-label`}>{label}</InputLabel>
      <Select
        id={fieldId}
        labelId={`${fieldId}-label`}
        name={name}
        value={formik.values[name] ?? ''}
        label={label}
        onChange={handleChange}
        onBlur={formik.handleBlur}
        MenuProps={MENU_PROPS}
      >
        {options.map(({ value, label: optLabel }) => (
          <MenuItem key={value} value={value}>{optLabel}</MenuItem>
        ))}
      </Select>
      {hasError && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, mx: 1.75 }}>
          {formik.errors[name]}
        </Typography>
      )}
    </FormControl>
  );
};

/**
 * FieldText — standard MUI TextField for non-select inputs.
 */
const FieldText = ({
  label, name, formik, required, disabled,
  type = 'text', multiline, rows, maxRows, inputProps,
}) => {
  const fieldId = `result-form-${name}`;

  const textFieldProps = {
    fullWidth: true,
    size:      'small',
    id:        fieldId,
    label,
    name,
    type,
    value:       formik.values[name] ?? '',
    onChange:    formik.handleChange,
    onBlur:      formik.handleBlur,
    error:       formik.touched[name] && Boolean(formik.errors[name]),
    helperText:  formik.touched[name] && formik.errors[name],
    required,
    disabled,
    multiline,
    slotProps: {
      inputLabel: type === 'date' ? { shrink: true, htmlFor: fieldId } : { htmlFor: fieldId },
      htmlInput:  inputProps,
    },
  };

  if (rows != null)       textFieldProps.rows    = rows;
  else if (maxRows != null) textFieldProps.maxRows = maxRows;

  return <TextField {...textFieldProps} />;
};

// ─── Default initial values ────────────────────────────────────────────────────

const DEFAULT_VALUES = {
  schoolCampus:         '',
  academicYear:         `${currentYear}-${currentYear + 1}`,
  semester:             'S1',
  evaluationType:       'CC',
  evaluationTitle:      '',
  examDate:             '',
  examPeriod:           '',
  examAttendance:       'present',
  specialCircumstances: '',
  student:              '',
  class:                '',
  subject:              '',
  teacher:              '',
  score:                '',
  maxScore:             20,
  coefficient:          1,
  gradingScale:         '',
  teacherRemarks:       '',
  strengths:            '',
  improvements:         '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const ResultForm = ({
  open,
  onClose,
  onSubmit,
  initialValues    = null,
  campusId         = '',
  classes          = [],
  subjects         = [],
  teachers         = [],
  students         = [],
  studentsLoading  = false,
  gradingScales    = [],
  mode             = 'create',
  defaultTeacherId = '',
  readonlyTeacher  = false,
  onClassChange    = null,
}) => {
  const isEdit       = mode === 'edit';
  const isCreateMode = !isEdit;

  /**
   * Build normalized Formik initial values.
   *
   * Spread order (later keys win):
   *   1. DEFAULT_VALUES  — safe fallback for every field
   *   2. ...iv           — stored document values (may include populated objects)
   *   3. Ref fields      — toId() normalizes populated objects → plain string IDs
   *   4. schoolCampus    — campus isolation: always enforce the prop value
   *   5. teacher         — TEACHER role pre-fill takes priority
   *   6. examDate        — normalize to YYYY-MM-DD for <input type="date">
   */
  const startValues = useMemo(() => {
    const iv = initialValues ?? {};
    return {
      ...DEFAULT_VALUES,                                     // 1
      ...iv,                                                 // 2
      class:        toId(iv.class),                         // 3
      subject:      toId(iv.subject),                       // 3
      student:      toId(iv.student),                       // 3
      gradingScale: toId(iv.gradingScale),                  // 3
      schoolCampus: campusId || toId(iv.schoolCampus),      // 4
      teacher:      defaultTeacherId || toId(iv.teacher) || '',  // 5
      examDate:     iv.examDate ? String(iv.examDate).substring(0, 10) : '',  // 6
    };
  }, [initialValues, campusId, defaultTeacherId]);

  /**
   * safeStudentValue — returns '' while students are loading so MUI Select
   * never receives an ID that isn't yet in its options list.
   * The actual Formik value is unaffected and applied after loading ends.
   */
  const safeStudentValue = (vals) => (studentsLoading ? '' : (vals.student ?? ''));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      closeAfterTransition={false}
      aria-labelledby="result-form-title"
    >
      <Formik
        initialValues={startValues}
        validationSchema={createResultSchema}
        enableReinitialize={isEdit}
        onSubmit={async (values, helpers) => {
          try {
            await onSubmit({
              ...values,
              score:        Number(values.score),
              maxScore:     Number(values.maxScore),
              coefficient:  Number(values.coefficient),
              examDate:     values.examDate  || null,
              examPeriod:   values.examPeriod || null,
              gradingScale: values.gradingScale || null,
            });
            onClose();
          } catch (err) {
            helpers.setStatus({ error: err.response?.data?.message || 'An error occurred.' });
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(formik) => (
          <Form noValidate>
            <DialogTitle id="result-form-title">
              {isEdit ? 'Edit Result' : 'New Result'}
            </DialogTitle>

            <DialogContent dividers>
              {formik.status?.error && (
                <Alert severity="error" sx={{ mb: 2 }}>{formik.status.error}</Alert>
              )}

              {/* ── Academic Context ─────────────────────────────────── */}
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ mb: 1, display: 'block' }}>
                ACADEMIC CONTEXT
              </Typography>
              <Grid container spacing={2} mb={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FieldSelect
                    label="Academic Year *"
                    name="academicYear"
                    formik={formik}
                    required
                    options={ACADEMIC_YEARS.map((y) => ({ value: y, label: y }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FieldSelect
                    label="Semester *"
                    name="semester"
                    formik={formik}
                    required
                    options={SEMESTER.map((s) => ({ value: s, label: s }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FieldSelect
                    label="Evaluation Type *"
                    name="evaluationType"
                    formik={formik}
                    required
                    options={EVALUATION_TYPE.map((t) => ({ value: t, label: t }))}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <FieldText
                    label="Evaluation Title *"
                    name="evaluationTitle"
                    formik={formik}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FieldText
                    label="Exam Date"
                    name="examDate"
                    type="date"
                    formik={formik}
                    inputProps={{ max: new Date().toISOString().split('T')[0] }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FieldSelect
                    label="Exam Period"
                    name="examPeriod"
                    formik={formik}
                    options={[
                      { value: '', label: '— None —' },
                      ...EXAM_PERIOD.map((p) => ({ value: p, label: p })),
                    ]}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <FieldSelect
                    label="Exam Attendance *"
                    name="examAttendance"
                    formik={formik}
                    required
                    options={EXAM_ATTENDANCE.map((a) => ({
                      value: a,
                      label: a.charAt(0).toUpperCase() + a.slice(1),
                    }))}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* ── Participants ─────────────────────────────────────── */}
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ mb: 1, display: 'block' }}>
                PARTICIPANTS
              </Typography>
              <Grid container spacing={2} mb={2}>

                {/* Class — must precede Student so onClassChange fires first */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldSelect
                    label="Class *"
                    name="class"
                    formik={formik}
                    required
                    disabled={isEdit}
                    options={[
                      { value: '', label: '— Select class —' },
                      ...classes.map((c) => ({ value: c._id, label: c.className })),
                    ]}
                    onExtraChange={(classId) => {
                      // Clear stale student ID whenever the class changes
                      formik.setFieldValue('student', '');
                      if (onClassChange) onClassChange(classId);
                    }}
                  />
                </Grid>

                {/*
                 * Student — custom select to apply safeStudentValue().
                 * While studentsLoading=true we pass value='' so MUI never
                 * sees an out-of-range ID during the async fetch window.
                 */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl
                    fullWidth
                    size="small"
                    required
                    disabled={isEdit || studentsLoading}
                    error={formik.touched.student && Boolean(formik.errors.student)}
                  >
                    <InputLabel id="result-form-student-label">Student *</InputLabel>
                    <Select
                      id="result-form-student"
                      labelId="result-form-student-label"
                      name="student"
                      value={safeStudentValue(formik.values)}
                      label="Student *"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      MenuProps={MENU_PROPS}
                    >
                      <MenuItem value="">
                        {studentsLoading
                          ? '— Loading students… —'
                          : students.length === 0
                            ? '— Select a class first —'
                            : '— Select student —'}
                      </MenuItem>
                      {students.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.firstName} {s.lastName}
                          {s.matricule ? ` (${s.matricule})` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                    {formik.touched.student && formik.errors.student && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, mx: 1.75 }}>
                        {formik.errors.student}
                      </Typography>
                    )}
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldSelect
                    label="Subject *"
                    name="subject"
                    formik={formik}
                    required
                    disabled={isEdit}
                    options={[
                      { value: '', label: '— Select subject —' },
                      ...subjects.map((s) => ({
                        value: s._id,
                        label: s.subject_code
                          ? `[${s.subject_code}] ${s.subject_name}`
                          : s.subject_name,
                      })),
                    ]}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  {readonlyTeacher ? (
                    /*
                     * TEACHER role — name shown read-only.
                     * The real Formik value is set via defaultTeacherId in startValues.
                     */
                    <TextField
                      fullWidth
                      size="small"
                      label="Teacher"
                      value={
                        teachers.length > 0
                          ? `${teachers[0].firstName} ${teachers[0].lastName}`
                          : '—'
                      }
                      InputProps={{ readOnly: true }}
                      slotProps={{ inputLabel: { shrink: true } }}
                      helperText="Automatically set to your account"
                    />
                  ) : (
                    <FieldSelect
                      label="Teacher *"
                      name="teacher"
                      formik={formik}
                      required
                      options={[
                        { value: '', label: '— Select teacher —' },
                        ...teachers.map((t) => ({
                          value: t._id,
                          label: `${t.firstName} ${t.lastName}`,
                        })),
                      ]}
                    />
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* ── Scoring ──────────────────────────────────────────── */}
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ mb: 1, display: 'block' }}>
                SCORING
              </Typography>
              <Grid container spacing={2} mb={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FieldText
                    label="Score *"
                    name="score"
                    type="number"
                    formik={formik}
                    required
                    inputProps={{ min: 0, step: 0.25 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FieldText
                    label="Max Score *"
                    name="maxScore"
                    type="number"
                    formik={formik}
                    required
                    inputProps={{ min: 1, step: 1 }}
                  />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <FieldText
                    label="Coefficient"
                    name="coefficient"
                    type="number"
                    formik={formik}
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Grid>
                {gradingScales.length > 0 && (
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <FieldSelect
                      label="Grading Scale"
                      name="gradingScale"
                      formik={formik}
                      options={[
                        { value: '', label: '— Default —' },
                        ...gradingScales.map((g) => ({ value: g._id, label: g.name })),
                      ]}
                    />
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* ── Feedback ─────────────────────────────────────────── */}
              <Typography variant="caption" color="text.secondary" fontWeight={700}
                sx={{ mb: 1, display: 'block' }}>
                PEDAGOGICAL FEEDBACK (optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <FieldText
                    label="Teacher Remarks"
                    name="teacherRemarks"
                    formik={formik}
                    multiline
                    rows={2}
                    maxRows={4}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldText
                    label="Strengths"
                    name="strengths"
                    formik={formik}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FieldText
                    label="Areas for Improvement"
                    name="improvements"
                    formik={formik}
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FieldText
                    label="Special Circumstances"
                    name="specialCircumstances"
                    formik={formik}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={onClose} disabled={formik.isSubmitting}>
                Cancel
              </Button>
              {/*
               * Tooltip on a <span> wrapper: MUI Tooltip cannot capture
               * pointer events from a directly disabled Button.
               */}
              <Tooltip
                title={isEdit && !formik.dirty ? 'No changes to save' : ''}
                disableHoverListener={isCreateMode || formik.dirty}
              >
                <span>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={formik.isSubmitting || (isEdit && !formik.dirty)}
                    startIcon={formik.isSubmitting ? <CircularProgress size={16} /> : null}
                  >
                    {isEdit ? 'Save Changes' : 'Create Result'}
                  </Button>
                </span>
              </Tooltip>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default ResultForm;