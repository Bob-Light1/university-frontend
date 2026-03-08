/**
 * @file BulkResultForm.jsx
 * @description Bulk result entry form for an entire class.
 *
 * Step 1 — Set evaluation context (class, subject, type, title, etc.)
 * Step 2 — Enter individual scores for each enrolled student.
 *
 * Props:
 *  open             — dialog open
 *  onClose          — () => void
 *  onSubmit         — async (payload) => void
 *  campusId         — current campus ID
 *  classes          — [{ _id, className }]
 *  subjects         — [{ _id, subject_name, subject_code }]
 *  teachers         — [{ _id, firstName, lastName }]
 *  students         — [{ _id, firstName, lastName, matricule }]
 *                     Provided by parent (loaded on-demand via onClassChange).
 *  gradingScales    — [{ _id, name }]
 *  defaultTeacherId — pre-fill for TEACHER role
 *  onClassChange    — (classId: string) => void
 *                     Called when Class select changes so the parent can
 *                     fetch the matching students via GET /students?classId=.
 *
 * FIX (2026-03): Students are no longer read from classDoc.students[]
 * (which contains unpopulated ObjectIds after a /class?campusId= call).
 * Instead the parent fetches them via GET /students?classId= and injects
 * them through the `students` prop, which is wired to `onClassChange`.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, TextField, MenuItem, Typography, Box,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Alert, Stack, CircularProgress,
  Stepper, Step, StepLabel,
  FormControl, InputLabel, Select, FormHelperText,
} from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import {
  EVALUATION_TYPE, EXAM_PERIOD, SEMESTER, EXAM_ATTENDANCE,
} from '../../yupSchema/createResultSchema';

// ─── Constants ────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = currentYear - 2 + i;
  return `${y}-${y + 1}`;
});

const MENU_PROPS = { PaperProps: { sx: { maxHeight: 260 } } };

// ─── Step 1 schema — evaluation context ──────────────────────────────────────

const contextSchema = Yup.object({
  classId:         Yup.string().required('Class is required'),
  subjectId:       Yup.string().required('Subject is required'),
  teacherId:       Yup.string().required('Teacher is required'),
  academicYear:    Yup.string().required('Academic year is required'),
  semester:        Yup.string().required('Semester is required'),
  evaluationType:  Yup.string().required('Evaluation type is required'),
  evaluationTitle: Yup.string().trim().min(2).max(200).required('Evaluation title is required'),
  maxScore:        Yup.number().min(1).required('Max score is required'),
  examDate:        Yup.string().nullable(),
  examPeriod:      Yup.string().nullable(),
  gradingScale:    Yup.string().nullable(),   // optional — passed through to payload
});

// ─── Reusable select helper ────────────────────────────────────────────────────

/**
 * BulkSelect — built with FormControl + InputLabel + Select (NOT TextField[select]).
 *
 * Why: TextField[select] places the `id` on a wrapper div, not the underlying input,
 * breaking label `for` → input `id` accessibility linkage in MUI v5/v6 (2025–2026).
 */
const BulkSelect = ({
  id, label, name, value, onChange, onBlur,
  error, helperText, required, children,
}) => (
  <FormControl fullWidth size="small" required={required} error={error}>
    <InputLabel id={`${id}-label`}>{label}</InputLabel>
    <Select
      id={id}
      labelId={`${id}-label`}
      name={name}
      value={value ?? ''}
      label={label}
      onChange={onChange}
      onBlur={onBlur}
      MenuProps={MENU_PROPS}
    >
      {children}
    </Select>
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);

// ─── Component ────────────────────────────────────────────────────────────────

const BulkResultForm = ({
  open,
  onClose,
  onSubmit,
  campusId         = '',
  classes          = [],
  subjects         = [],
  teachers         = [],
  students         = [],      // populated by parent via onClassChange
  studentsLoading  = false,   // true while parent fetches students for the selected class
  gradingScales    = [],
  defaultTeacherId = '',
  onClassChange    = null,    // (classId) => void
}) => {
  const [activeStep,   setActiveStep]   = useState(0);
  const [context,      setContext]      = useState(null);
  // Persist step-1 form values so the Back button restores what the user typed
  const [step1Values,  setStep1Values]  = useState(null);
  const [rows,         setRows]         = useState([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState(null);
  // Tracks whether any score has been entered in step 2 so we can warn before reset
  const [isDirty,      setIsDirty]      = useState(false);

  /**
   * Re-build the score rows whenever the students prop updates (after onClassChange
   * fires and the parent fetches the correct student list from the API).
   *
   * This replaces the old pattern of reading classDoc.students[] (unpopulated ObjectIds).
   */
  useEffect(() => {
    if (activeStep === 0) return; // Only rebuild after step 1 is confirmed
    setRows(
      students.map((s) => ({
        studentId:      s._id,
        firstName:      s.firstName  ?? '—',
        lastName:       s.lastName   ?? '',
        matricule:      s.matricule  ?? '',
        score:          '',
        examAttendance: 'present',
        teacherRemarks: '',
        coefficient:    1,
      }))
    );
  }, [students, activeStep]);

  // Update a single row field
  const handleRowChange = (index, field, value) => {
    setIsDirty(true); // mark as dirty as soon as any score/remark is entered
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // Auto-set score to 0 when absent
      if (field === 'examAttendance' && value === 'absent') {
        next[index].score = 0;
      }
      return next;
    });
  };

  // Bulk-fill all scores with a common value
  const handleFillAll = (value) => {
    setRows((prev) => prev.map((r) => ({ ...r, score: value })));
  };

  const handleStep1Submit = (values) => {
    setContext(values);
    setStep1Values(values);   // persist so Back button can restore them
    setIsDirty(false); // entering step 2 resets dirty flag (rows about to be rebuilt)
    setActiveStep(1);
    // rows will be populated by the useEffect above once students prop updates
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError(null);

    if (rows.length === 0) {
      setError('No students found for the selected class. Please verify the class has enrolled students.');
      setSubmitting(false);
      return;
    }

    // Validate: all present students must have a numeric score within range
    const invalid = rows.filter(
      (r) =>
        r.examAttendance !== 'absent' &&
        (r.score === '' || r.score === null || isNaN(Number(r.score))),
    );
    if (invalid.length > 0) {
      setError(`Please enter a score for all ${invalid.length} remaining student(s).`);
      setSubmitting(false);
      return;
    }

    // Block scores that exceed maxScore or are negative (client-side safety net)
    const outOfRange = rows.filter(
      (r) =>
        r.examAttendance !== 'absent' &&
        (Number(r.score) < 0 || Number(r.score) > context.maxScore),
    );
    if (outOfRange.length > 0) {
      setError(
        `${outOfRange.length} score(s) are out of range (must be between 0 and ${context.maxScore}).`,
      );
      setSubmitting(false);
      return;
    }

    const payload = {
      ...context,
      schoolCampus: campusId,
      gradingScale: context.gradingScale || null,   // include the chosen grading scale
      results: rows.map((r) => ({
        studentId:      r.studentId,
        score:          Number(r.score),
        coefficient:    Number(r.coefficient) || 1,
        examAttendance: r.examAttendance,
        teacherRemarks: r.teacherRemarks || null,
      })),
    };

    try {
      await onSubmit(payload);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save results.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setActiveStep(0);
    setContext(null);
    setStep1Values(null);
    setRows([]);
    setError(null);
    setIsDirty(false);
    onClose();
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      disableEnforceFocus
      closeAfterTransition={false}
      aria-labelledby="bulk-result-form-title"
    >
      <DialogTitle id="bulk-result-form-title">
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Bulk Result Entry</Typography>
          <Chip label={`Step ${activeStep + 1} of 2`} size="small" color="primary" />
        </Stack>
        <Stepper activeStep={activeStep} sx={{ mt: 2 }} alternativeLabel>
          {['Evaluation Context', 'Enter Scores'].map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* ── STEP 1: Context ─────────────────────────────────────────────── */}
        {activeStep === 0 && (
          <Formik
            initialValues={step1Values ?? {
              classId:         '',
              subjectId:       '',
              teacherId:       defaultTeacherId || '',
              academicYear:    `${currentYear}-${currentYear + 1}`,
              semester:        'S1',
              evaluationType:  'CC',
              evaluationTitle: '',
              maxScore:        20,
              examDate:        '',
              examPeriod:      '',
              gradingScale:    '',
            }}
            enableReinitialize={false}
            validationSchema={contextSchema}
            onSubmit={handleStep1Submit}
          >
            {(formik) => (
              <Form id="bulk-step1">
                <Grid container spacing={2}>

                  {/* Class — fires onClassChange so the parent loads students */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <BulkSelect
                      id="bulk-classId"
                      label="Class *"
                      name="classId"
                      value={formik.values.classId}
                      onChange={(e) => {
                        // If scores have already been entered, confirm before discarding them
                        if (isDirty && activeStep === 1) {
                          if (!window.confirm(
                            'Changing the class will discard all scores entered. Continue?'
                          )) return;
                          setIsDirty(false);
                        }
                        formik.handleChange(e);
                        if (onClassChange) onClassChange(e.target.value);
                      }}
                      onBlur={formik.handleBlur}
                      error={formik.touched.classId && Boolean(formik.errors.classId)}
                      helperText={formik.touched.classId && formik.errors.classId}
                      required
                    >
                      <MenuItem value="">— Select class —</MenuItem>
                      {classes.map((c) => (
                        <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>
                      ))}
                    </BulkSelect>
                  </Grid>

                  {/* Subject */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <BulkSelect
                      id="bulk-subjectId"
                      label="Subject *"
                      name="subjectId"
                      value={formik.values.subjectId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.subjectId && Boolean(formik.errors.subjectId)}
                      helperText={formik.touched.subjectId && formik.errors.subjectId}
                      required
                    >
                      <MenuItem value="">— Select subject —</MenuItem>
                      {subjects.map((s) => (
                        <MenuItem key={s._id} value={s._id}>
                          {s.subject_code ? `[${s.subject_code}] ` : ''}{s.subject_name}
                        </MenuItem>
                      ))}
                    </BulkSelect>
                  </Grid>

                  {/* Teacher — readonly when pre-filled (TEACHER role) */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {defaultTeacherId ? (
                      /*
                       * TEACHER role: show own name read-only, hidden value kept
                       * in Formik via defaultTeacherId injected in initialValues.
                       */
                      <TextField
                        fullWidth
                        size="small"
                        id="bulk-teacherId-display"
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
                      <BulkSelect
                        id="bulk-teacherId"
                        label="Teacher *"
                        name="teacherId"
                        value={formik.values.teacherId}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.teacherId && Boolean(formik.errors.teacherId)}
                        helperText={formik.touched.teacherId && formik.errors.teacherId}
                        required
                      >
                        <MenuItem value="">— Select teacher —</MenuItem>
                        {teachers.map((t) => (
                          <MenuItem key={t._id} value={t._id}>
                            {t.firstName} {t.lastName}
                          </MenuItem>
                        ))}
                      </BulkSelect>
                    )}
                  </Grid>

                  {/* Academic Year */}
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <BulkSelect
                      id="bulk-academicYear"
                      label="Academic Year *"
                      name="academicYear"
                      value={formik.values.academicYear}
                      onChange={formik.handleChange}
                      required
                    >
                      {ACADEMIC_YEARS.map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </BulkSelect>
                  </Grid>

                  {/* Semester */}
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <BulkSelect
                      id="bulk-semester"
                      label="Semester *"
                      name="semester"
                      value={formik.values.semester}
                      onChange={formik.handleChange}
                      required
                    >
                      {SEMESTER.map((s) => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </BulkSelect>
                  </Grid>

                  {/* Evaluation Type */}
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <BulkSelect
                      id="bulk-evaluationType"
                      label="Evaluation Type *"
                      name="evaluationType"
                      value={formik.values.evaluationType}
                      onChange={formik.handleChange}
                      required
                    >
                      {EVALUATION_TYPE.map((t) => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </BulkSelect>
                  </Grid>

                  {/* Evaluation Title */}
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      fullWidth
                      size="small"
                      id="bulk-evaluationTitle"
                      label="Evaluation Title *"
                      name="evaluationTitle"
                      value={formik.values.evaluationTitle}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.evaluationTitle && Boolean(formik.errors.evaluationTitle)}
                      helperText={formik.touched.evaluationTitle && formik.errors.evaluationTitle}
                      slotProps={{ inputLabel: { htmlFor: 'bulk-evaluationTitle' } }}
                    />
                  </Grid>

                  {/* Max Score */}
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      id="bulk-maxScore"
                      label="Max Score *"
                      type="number"
                      name="maxScore"
                      value={formik.values.maxScore}
                      onChange={formik.handleChange}
                      error={formik.touched.maxScore && Boolean(formik.errors.maxScore)}
                      helperText={formik.touched.maxScore && formik.errors.maxScore}
                      slotProps={{
                        inputLabel: { htmlFor: 'bulk-maxScore' },
                        htmlInput:  { min: 1 },
                      }}
                    />
                  </Grid>

                  {/* Exam Date */}
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <TextField
                      fullWidth
                      size="small"
                      id="bulk-examDate"
                      label="Exam Date"
                      type="date"
                      name="examDate"
                      value={formik.values.examDate}
                      onChange={formik.handleChange}
                      slotProps={{
                        inputLabel: { shrink: true, htmlFor: 'bulk-examDate' },
                        htmlInput:  { max: new Date().toISOString().split('T')[0] },
                      }}
                    />
                  </Grid>

                  {/* Exam Period */}
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <BulkSelect
                      id="bulk-examPeriod"
                      label="Exam Period"
                      name="examPeriod"
                      value={formik.values.examPeriod}
                      onChange={formik.handleChange}
                    >
                      <MenuItem value="">— None —</MenuItem>
                      {EXAM_PERIOD.map((p) => (
                        <MenuItem key={p} value={p}>{p}</MenuItem>
                      ))}
                    </BulkSelect>
                  </Grid>

                  {/* Grading Scale */}
                  {gradingScales.length > 0 && (
                    <Grid size={{ xs: 12, sm: 3 }}>
                      <BulkSelect
                        id="bulk-gradingScale"
                        label="Grading Scale"
                        name="gradingScale"
                        value={formik.values.gradingScale}
                        onChange={formik.handleChange}
                      >
                        <MenuItem value="">— Default —</MenuItem>
                        {gradingScales.map((g) => (
                          <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>
                        ))}
                      </BulkSelect>
                    </Grid>
                  )}

                  {/* Student count preview — feedback before going to step 2 */}
                  {formik.values.classId && (
                    <Grid size={{ xs: 12 }}>
                      <Alert
                        severity={
                          studentsLoading ? 'info'
                          : students.length > 0 ? 'success'
                          : 'warning'
                        }
                        sx={{ py: 0.5 }}
                      >
                        {studentsLoading
                          ? 'Loading students…'
                          : students.length > 0
                            ? `${students.length} student(s) ready for score entry.`
                            : 'No active students found for this class.'}
                      </Alert>
                    </Grid>
                  )}
                </Grid>

                {/* Hidden submit trigger — fired by the DialogActions Next button */}
                <button type="submit" id="bulk-step1-btn" style={{ display: 'none' }} />
              </Form>
            )}
          </Formik>
        )}

        {/* ── STEP 2: Scores table ─────────────────────────────────────────── */}
        {activeStep === 1 && context && (
          <Box>
            {/* Context summary */}
            <Box sx={{ bgcolor: 'primary.50', borderRadius: 1, p: 1.5, mb: 2 }}>
              <Typography variant="body2" color="primary.main" fontWeight={600}>
                {context.evaluationTitle} — {context.evaluationType} — {context.semester}{' '}
                {context.academicYear} — Max: {context.maxScore}
              </Typography>
            </Box>

            {rows.length === 0 ? (
              <Alert severity="warning">
                No students found for the selected class. Go back and verify the class selection.
              </Alert>
            ) : (
              <>
                {/* Bulk fill toolbar */}
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">Quick fill:</Typography>
                  {[0, 10, 20].map((v) => (
                    <Button
                      key={v}
                      size="small"
                      variant="outlined"
                      onClick={() => handleFillAll(Math.min(v, context.maxScore))}
                    >
                      {v}
                    </Button>
                  ))}
                </Stack>

                {/* Scores table */}
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Matricule</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Attendance</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Score / {context.maxScore}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Coeff.</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow key={row.studentId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {row.firstName} {row.lastName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {row.matricule || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {/*
                             * Inline attendance select — kept as TextField[select] intentionally:
                             * this is a non-labelled inline cell control, not a form field
                             * requiring accessible label linkage. The accessibility rule applies
                             * to labelled form controls only.
                             */}
                            <TextField
                              select
                              size="small"
                              variant="standard"
                              value={row.examAttendance}
                              onChange={(e) => handleRowChange(i, 'examAttendance', e.target.value)}
                              slotProps={{
                                select: { MenuProps: MENU_PROPS, sx: { fontSize: '0.8rem' } },
                              }}
                              sx={{ minWidth: 90 }}
                            >
                              {EXAM_ATTENDANCE.map((a) => (
                                <MenuItem key={a} value={a}>{a}</MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              variant="outlined"
                              value={row.score}
                              onChange={(e) => handleRowChange(i, 'score', e.target.value)}
                              disabled={row.examAttendance === 'absent'}
                              slotProps={{
                                htmlInput: { min: 0, max: context.maxScore, step: 0.25 },
                              }}
                              sx={{ width: 90 }}
                              error={
                                row.examAttendance !== 'absent' &&
                                row.score !== '' &&
                                (Number(row.score) < 0 || Number(row.score) > context.maxScore)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              variant="outlined"
                              value={row.coefficient}
                              onChange={(e) => handleRowChange(i, 'coefficient', e.target.value)}
                              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                              sx={{ width: 70 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              variant="outlined"
                              placeholder="Optional"
                              value={row.teacherRemarks}
                              onChange={(e) => handleRowChange(i, 'teacherRemarks', e.target.value)}
                              sx={{ width: 160 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  {rows.length} student(s) — {rows.filter((r) => r.score !== '').length} score(s) entered
                </Typography>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        {activeStep === 0 && (
          <Button
            variant="contained"
            endIcon={studentsLoading ? <CircularProgress size={16} color="inherit" /> : <ArrowForward />}
            onClick={() => document.getElementById('bulk-step1-btn').click()}
            disabled={studentsLoading}
          >
            {studentsLoading ? 'Loading…' : 'Next: Enter Scores'}
          </Button>
        )}
        {activeStep === 1 && (
          <>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => setActiveStep(0)}
              disabled={submitting}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleFinalSubmit}
              disabled={submitting || rows.length === 0}
              startIcon={submitting ? <CircularProgress size={16} /> : null}
            >
              Save {rows.length} Results
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BulkResultForm;