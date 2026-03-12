/**
 * @file CourseForm.jsx
 * @description Create / Edit form for the global course catalog.
 *
 * Renders inside a Dialog (triggered by CourseManager).
 * Uses Formik + Yup for validation.
 *
 * Props:
 *  open           {boolean}
 *  onClose        {Function}
 *  onSubmit       {Function}  (values) => Promise<void>
 *  initialValues  {Object|null}  — null = create mode
 *  levels         {Array}     — Level documents for the level selector
 *  courses        {Array}     — All courses for prerequisite selector
 *  mode           {'create'|'edit'}
 */

import { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Chip,
  Box,
  Typography,
  Divider,
  IconButton,
  Stack,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close,
  Add,
  Delete,
  Save,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { Formik, Form, FieldArray, getIn } from 'formik';
import { useState } from 'react';
import { COURSE_ENUMS } from './CourseShared';
import { createCourseSchema } from '../../yupSchema/createCourseSchema';

// ─── Empty initial values ─────────────────────────────────────────────────────

const EMPTY_VALUES = {
  courseCode:        '',
  title:             '',
  category:          '',
  level:             '',
  discipline:        '',
  languages:         ['fr'],
  difficultyLevel:   'INTERMEDIATE',
  visibility:        'INTERNAL',
  description:       '',
  objectives:        [],
  prerequisites:     [],
  syllabus:          [],
  durationWeeks:     '',
  creditHours:       '',
  estimatedWorkload: { lecture: 0, practical: 0, selfStudy: 0 },
  tags:              [],
};

// ─── Tag input helper ─────────────────────────────────────────────────────────

const TagInput = ({ tags, onChange, error, helperText }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const t = input.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 15) {
      onChange([...tags, t]);
      setInput('');
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} mb={1}>
        <TextField
          size="small"
          placeholder="Add a tag…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          error={!!error}
          sx={{ flex: 1 }}
        />
        <Button size="small" variant="outlined" onClick={add} disabled={!input.trim()}>
          Add
        </Button>
      </Stack>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {tags.map((t) => (
          <Chip
            key={t}
            label={t}
            size="small"
            onDelete={() => onChange(tags.filter((x) => x !== t))}
          />
        ))}
      </Box>
      {helperText && (
        <FormHelperText error={!!error}>{helperText}</FormHelperText>
      )}
    </Box>
  );
};

// ─── Objectives array helper ──────────────────────────────────────────────────

const ObjectivesField = ({ objectives, onChange, error }) => {
  const [input, setInput] = useState('');

  const add = () => {
    const t = input.trim();
    if (t && objectives.length < 10) {
      onChange([...objectives, t]);
      setInput('');
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} mb={1}>
        <TextField
          size="small"
          placeholder="Add a learning objective…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          fullWidth
          inputProps={{ maxLength: 300 }}
        />
        <Button size="small" variant="outlined" onClick={add} disabled={!input.trim()}>
          Add
        </Button>
      </Stack>
      <Stack spacing={0.5}>
        {objectives.map((o, i) => (
          <Stack key={i} direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 20 }}>
              {i + 1}.
            </Typography>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {o}
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={() => onChange(objectives.filter((_, j) => j !== i))}
            >
              <Delete fontSize="inherit" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
};

// ─── Syllabus FieldArray ──────────────────────────────────────────────────────

const SyllabusField = ({ values, errors, touched }) => (
  <FieldArray name="syllabus">
    {({ push, remove, swap }) => (
      <Box>
        {values.syllabus.length === 0 && (
          <Typography variant="body2" color="text.disabled" sx={{ mb: 1 }}>
            No syllabus units yet.
          </Typography>
        )}
        <Stack spacing={1.5}>
          {values.syllabus.map((unit, i) => {
            const unitErrors  = getIn(errors,  `syllabus[${i}]`) || {};
            const unitTouched = getIn(touched, `syllabus[${i}]`) || {};
            return (
              <Box
                key={i}
                sx={{
                  p:            1.5,
                  border:       1,
                  borderColor:  'divider',
                  borderRadius: 1,
                  bgcolor:      'background.default',
                }}
              >
                <Grid container spacing={1.5} alignItems="flex-start">
                  {/* Period number */}
                  <Grid size={{ xs: 4, sm: 2 }}>
                    <TextField
                      size="small"
                      label="№"
                      name={`syllabus[${i}].periodNumber`}
                      type="number"
                      value={unit.periodNumber}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        unit.periodNumber = isNaN(v) ? '' : v;
                      }}
                      error={unitTouched.periodNumber && !!unitErrors.periodNumber}
                      helperText={unitTouched.periodNumber && unitErrors.periodNumber}
                      fullWidth
                      inputProps={{ min: 1, max: 60 }}
                    />
                  </Grid>

                  {/* Period type */}
                  <Grid size={{ xs: 8, sm: 3 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`syl-ptype-${i}`}>Period type</InputLabel>
                      <Select
                        labelId={`syl-ptype-${i}`}
                        id={`syl-ptype-sel-${i}`}
                        value={unit.periodType || 'week'}
                        label="Period type"
                        onChange={(e) => { unit.periodType = e.target.value; }}
                      >
                        {COURSE_ENUMS.PERIOD_TYPE.map((p) => (
                          <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Title */}
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      size="small"
                      label="Title"
                      name={`syllabus[${i}].title`}
                      value={unit.title}
                      onChange={(e) => { unit.title = e.target.value; }}
                      error={unitTouched.title && !!unitErrors.title}
                      helperText={unitTouched.title && unitErrors.title}
                      fullWidth
                      inputProps={{ maxLength: 150 }}
                    />
                  </Grid>

                  {/* Actions */}
                  <Grid size={{ xs: 12, sm: 2 }}>
                    <Stack direction="row" spacing={0.5} justifyContent={{ xs: 'flex-end', sm: 'flex-start' }}>
                      <IconButton size="small" onClick={() => i > 0 && swap(i, i - 1)} disabled={i === 0}>
                        <ArrowUpward fontSize="inherit" />
                      </IconButton>
                      <IconButton size="small" onClick={() => i < values.syllabus.length - 1 && swap(i, i + 1)} disabled={i === values.syllabus.length - 1}>
                        <ArrowDownward fontSize="inherit" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => remove(i)}>
                        <Delete fontSize="inherit" />
                      </IconButton>
                    </Stack>
                  </Grid>

                  {/* Content */}
                  <Grid size={12}>
                    <TextField
                      size="small"
                      label="Content / Description"
                      name={`syllabus[${i}].content`}
                      value={unit.content || ''}
                      onChange={(e) => { unit.content = e.target.value; }}
                      fullWidth
                      multiline
                      minRows={2}
                      inputProps={{ maxLength: 1000 }}
                    />
                  </Grid>

                  {/* Session type + estimated hours */}
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id={`syl-stype-${i}`}>Session type</InputLabel>
                      <Select
                        labelId={`syl-stype-${i}`}
                        id={`syl-stype-sel-${i}`}
                        value={unit.sessionType || 'LECTURE'}
                        label="Session type"
                        onChange={(e) => { unit.sessionType = e.target.value; }}
                      >
                        {COURSE_ENUMS.SESSION_TYPE.map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField
                      size="small"
                      label="Est. hours"
                      name={`syllabus[${i}].estimatedHours`}
                      type="number"
                      value={unit.estimatedHours || ''}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        unit.estimatedHours = isNaN(v) ? '' : v;
                      }}
                      fullWidth
                      inputProps={{ min: 0.5, max: 20, step: 0.5 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            );
          })}
        </Stack>

        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          sx={{ mt: 1.5 }}
          onClick={() =>
            push({
              periodNumber:   values.syllabus.length + 1,
              periodType:     'week',
              title:          '',
              content:        '',
              sessionType:    'LECTURE',
              estimatedHours: '',
            })
          }
          disabled={values.syllabus.length >= 60}
        >
          Add unit
        </Button>
      </Box>
    )}
  </FieldArray>
);

// ─── Prerequisites FieldArray ─────────────────────────────────────────────────

const PrerequisitesField = ({ values, errors, touched, availableCourses }) => (
  <FieldArray name="prerequisites">
    {({ push, remove }) => (
      <Box>
        {values.prerequisites.length === 0 && (
          <Typography variant="body2" color="text.disabled" sx={{ mb: 1 }}>
            No prerequisites defined.
          </Typography>
        )}
        <Stack spacing={1}>
          {values.prerequisites.map((prereq, i) => {
            const pErrors  = getIn(errors,  `prerequisites[${i}]`) || {};
            const pTouched = getIn(touched, `prerequisites[${i}]`) || {};
            return (
              <Grid container key={i} spacing={1.5} alignItems="center">
                <Grid size={{ xs: 12, sm: 7 }}>
                  <FormControl fullWidth size="small" error={pTouched.course && !!pErrors.course}>
                    <InputLabel id={`prereq-course-${i}`}>Course</InputLabel>
                    <Select
                      labelId={`prereq-course-${i}`}
                      id={`prereq-course-sel-${i}`}
                      value={prereq.course || ''}
                      label="Course"
                      onChange={(e) => { prereq.course = e.target.value; }}
                    >
                      {availableCourses.map((c) => (
                        <MenuItem key={c._id} value={c._id}>
                          {c.courseCode} — {c.title}
                        </MenuItem>
                      ))}
                    </Select>
                    {pTouched.course && pErrors.course && (
                      <FormHelperText>{pErrors.course}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 10, sm: 4 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id={`prereq-type-${i}`}>Type</InputLabel>
                    <Select
                      labelId={`prereq-type-${i}`}
                      id={`prereq-type-sel-${i}`}
                      value={prereq.type || 'REQUIRED'}
                      label="Type"
                      onChange={(e) => { prereq.type = e.target.value; }}
                    >
                      {COURSE_ENUMS.PREREQUISITE_TYPE.map((t) => (
                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 2, sm: 1 }}>
                  <IconButton size="small" color="error" onClick={() => remove(i)}>
                    <Delete fontSize="inherit" />
                  </IconButton>
                </Grid>
              </Grid>
            );
          })}
        </Stack>

        <Button
          size="small"
          variant="outlined"
          startIcon={<Add />}
          sx={{ mt: 1.5 }}
          onClick={() => push({ course: '', type: 'REQUIRED' })}
          disabled={values.prerequisites.length >= 10}
        >
          Add prerequisite
        </Button>
      </Box>
    )}
  </FieldArray>
);

// ─── MAIN FORM ────────────────────────────────────────────────────────────────

const CourseForm = ({
  open,
  onClose,
  onSubmit,
  initialValues  = null,
  levels         = [],
  courses        = [],
  mode           = 'create',
}) => {
  const [tab,        setTab]        = useState(0);
  const [submitError, setSubmitError] = useState('');

  // Build initial values — merging defaults with existing data
  const formInitials = useMemo(() => {
    if (!initialValues) return EMPTY_VALUES;
    return {
      ...EMPTY_VALUES,
      ...initialValues,
      level:  initialValues.level?._id ?? initialValues.level ?? '',
      // normalise prerequisites array
      prerequisites: (initialValues.prerequisites || []).map((p) => ({
        course: p.course?._id ?? p.course ?? '',
        type:   p.type ?? 'REQUIRED',
      })),
      tags:        initialValues.tags ?? [],
      objectives:  initialValues.objectives ?? [],
      languages:   initialValues.languages ?? ['fr'],
      estimatedWorkload: {
        lecture:   initialValues.estimatedWorkload?.lecture   ?? 0,
        practical: initialValues.estimatedWorkload?.practical ?? 0,
        selfStudy: initialValues.estimatedWorkload?.selfStudy ?? 0,
      },
    };
  }, [initialValues]);

  // Filter out the course being edited from the prerequisites selector
  const availablePrereqCourses = useMemo(
    () => courses.filter((c) => c._id !== initialValues?._id),
    [courses, initialValues],
  );

  const isApproved = initialValues?.approvalStatus === 'APPROVED';

  const handleSubmit = async (values, helpers) => {
    setSubmitError('');
    try {
      // Convert empty strings to undefined / null for numeric fields
      const payload = {
        ...values,
        courseCode:    values.courseCode.toUpperCase().trim(),
        durationWeeks: values.durationWeeks !== '' ? Number(values.durationWeeks) : undefined,
        creditHours:   values.creditHours   !== '' ? Number(values.creditHours)   : undefined,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Submission failed.';
      setSubmitError(msg);
    } finally {
      helpers.setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      closeAfterTransition={false}
      aria-labelledby="course-form-title"
    >
      <Formik
        initialValues={formInitials}
        validationSchema={createCourseSchema(isApproved)}
        enableReinitialize
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, isSubmitting, setFieldValue, handleChange, handleBlur }) => (
          <Form>
            <DialogTitle id="course-form-title" sx={{ borderBottom: 1, borderColor: 'divider', pr: 6 }}>
              {mode === 'edit' ? `Edit Course — ${initialValues?.courseCode}` : 'New Course'}
              <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, pb: 1 }}>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
                  {submitError}
                </Alert>
              )}

              {isApproved && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This course is <strong>Approved</strong>. Pedagogical fields (title, objectives,
                  syllabus, creditHours) are locked. Use "New Version" to revise them.
                </Alert>
              )}

              {/* Tab navigation */}
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
                <Tab label="Basics" />
                <Tab label="Pedagogy" />
                <Tab label="Syllabus" />
                <Tab label="Prerequisites" />
              </Tabs>

              {/* ── Tab 0: Basics ── */}
              {tab === 0 && (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Course Code *"
                      name="courseCode"
                      value={values.courseCode}
                      onChange={(e) => setFieldValue('courseCode', e.target.value.toUpperCase())}
                      onBlur={handleBlur}
                      error={touched.courseCode && !!errors.courseCode}
                      helperText={touched.courseCode && errors.courseCode}
                      disabled={isApproved}
                      inputProps={{ maxLength: 30 }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Title *"
                      name="title"
                      value={values.title}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.title && !!errors.title}
                      helperText={touched.title && errors.title}
                      disabled={isApproved}
                      inputProps={{ maxLength: 150 }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small" error={touched.category && !!errors.category}>
                      <InputLabel id="cf-category-lbl">Category *</InputLabel>
                      <Select
                        labelId="cf-category-lbl"
                        id="cf-category-select"
                        name="category"
                        value={values.category}
                        label="Category *"
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        {COURSE_ENUMS.CATEGORY.map((c) => (
                          <MenuItem key={c} value={c}>{c}</MenuItem>
                        ))}
                      </Select>
                      {touched.category && errors.category && (
                        <FormHelperText>{errors.category}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small" error={touched.level && !!errors.level}>
                      <InputLabel id="cf-level-lbl">Level *</InputLabel>
                      <Select
                        labelId="cf-level-lbl"
                        id="cf-level-select"
                        name="level"
                        value={values.level}
                        label="Level *"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={isApproved}
                      >
                        {levels.map((l) => (
                          <MenuItem key={l._id} value={l._id}>{l.name}</MenuItem>
                        ))}
                      </Select>
                      {touched.level && errors.level && (
                        <FormHelperText>{errors.level}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="cf-diff-lbl">Difficulty</InputLabel>
                      <Select
                        labelId="cf-diff-lbl"
                        id="cf-diff-select"
                        name="difficultyLevel"
                        value={values.difficultyLevel}
                        label="Difficulty"
                        onChange={handleChange}
                      >
                        {COURSE_ENUMS.DIFFICULTY.map((d) => (
                          <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="cf-vis-lbl">Visibility</InputLabel>
                      <Select
                        labelId="cf-vis-lbl"
                        id="cf-vis-select"
                        name="visibility"
                        value={values.visibility}
                        label="Visibility"
                        onChange={handleChange}
                      >
                        {COURSE_ENUMS.VISIBILITY.map((v) => (
                          <MenuItem key={v.value} value={v.value}>{v.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Discipline"
                      name="discipline"
                      value={values.discipline}
                      onChange={handleChange}
                      inputProps={{ maxLength: 100 }}
                    />
                  </Grid>

                  {/* Languages multi-select */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth size="small" error={touched.languages && !!errors.languages}>
                      <InputLabel id="cf-lang-lbl">Languages *</InputLabel>
                      <Select
                        labelId="cf-lang-lbl"
                        id="cf-lang-select"
                        multiple
                        value={values.languages}
                        label="Languages *"
                        onChange={(e) => setFieldValue('languages', e.target.value)}
                        renderValue={(selected) =>
                          selected.map((s) => {
                            const l = COURSE_ENUMS.LANGUAGE.find((x) => x.value === s);
                            return l?.label ?? s;
                          }).join(', ')
                        }
                      >
                        {COURSE_ENUMS.LANGUAGE.map((l) => (
                          <MenuItem key={l.value} value={l.value}>
                            <Checkbox checked={values.languages.includes(l.value)} />
                            <ListItemText primary={l.label} />
                          </MenuItem>
                        ))}
                      </Select>
                      {touched.languages && errors.languages && (
                        <FormHelperText>{errors.languages}</FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Tags */}
                  <Grid size={12}>
                    <Typography variant="body2" fontWeight={600} mb={0.5}>Tags</Typography>
                    <TagInput
                      tags={values.tags}
                      onChange={(t) => setFieldValue('tags', t)}
                      error={touched.tags && !!errors.tags}
                      helperText={touched.tags && errors.tags}
                    />
                  </Grid>
                </Grid>
              )}

              {/* ── Tab 1: Pedagogy ── */}
              {tab === 1 && (
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={3}
                      maxRows={8}
                      size="small"
                      label="Description"
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      inputProps={{ maxLength: 2000 }}
                      helperText={`${(values.description || '').length}/2000`}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Duration (weeks)"
                      name="durationWeeks"
                      type="number"
                      value={values.durationWeeks}
                      onChange={handleChange}
                      inputProps={{ min: 0, max: 104 }}
                      disabled={isApproved}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Credit hours"
                      name="creditHours"
                      type="number"
                      value={values.creditHours}
                      onChange={handleChange}
                      inputProps={{ min: 0, max: 30, step: 0.5 }}
                      disabled={isApproved}
                    />
                  </Grid>

                  <Grid size={12}>
                    <Divider sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Estimated Workload (hours)
                      </Typography>
                    </Divider>
                    <Grid container spacing={1.5}>
                      {['lecture', 'practical', 'selfStudy'].map((k) => (
                        <Grid key={k} size={{ xs: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label={k.charAt(0).toUpperCase() + k.slice(1).replace('S', ' S')}
                            name={`estimatedWorkload.${k}`}
                            type="number"
                            value={values.estimatedWorkload[k]}
                            onChange={handleChange}
                            inputProps={{ min: 0, step: 0.5 }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>

                  <Grid size={12}>
                    <Divider sx={{ mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Learning Objectives (max 10)
                      </Typography>
                    </Divider>
                    <ObjectivesField
                      objectives={values.objectives}
                      onChange={(o) => setFieldValue('objectives', o)}
                      error={touched.objectives && errors.objectives}
                    />
                  </Grid>
                </Grid>
              )}

              {/* ── Tab 2: Syllabus ── */}
              {tab === 2 && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Syllabus units are locked on Approved courses. Create a new version to modify them.
                  </Alert>
                  {isApproved ? (
                    <Typography variant="body2" color="text.secondary">
                      Syllabus editing is not available for Approved courses.
                    </Typography>
                  ) : (
                    <SyllabusField values={values} errors={errors} touched={touched} />
                  )}
                </Box>
              )}

              {/* ── Tab 3: Prerequisites ── */}
              {tab === 3 && (
                <PrerequisitesField
                  values={values}
                  errors={errors}
                  touched={touched}
                  availableCourses={availablePrereqCourses}
                />
              )}
            </DialogContent>

            <DialogActions sx={{ borderTop: 1, borderColor: 'divider', px: 3, py: 1.5 }}>
              <Button onClick={onClose} disabled={isSubmitting} color="inherit">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : <Save />}
              >
                {mode === 'edit' ? 'Save changes' : 'Create course'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>
    </Dialog>
  );
};

export default CourseForm;