/**
 * @file ExaminationManager.jsx
 * @description Exam management page for CAMPUS_MANAGER / ADMIN / DIRECTOR.
 *
 * Tabs:
 *  - Sessions   : CRUD + lifecycle transitions (DRAFT→SCHEDULED→ONGOING→COMPLETED)
 *  - Enrollments: Compute eligibility, view enrolled students per session
 *  - Grading    : Grade queue, grade dialog, publish grades
 *  - Appeals    : Review and resolve student grade appeals
 *  - Analytics  : Campus KPIs, early-warning list, export
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import {
  Box, Typography, Grid, Button, Stack, Chip, Alert,
  Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Paper, IconButton, Tooltip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Divider, Tab, Tabs, Badge,
  FormControl, InputLabel, Select, MenuItem, FormHelperText,
  InputAdornment,
} from '@mui/material';
import {
  Add, Refresh, Delete, Edit, Visibility,
  PlayArrow, Schedule, CheckCircle, Cancel, PostAdd,
  Publish, Assignment, BarChart, Warning, FileDownload,
  Grade, Gavel, HowToReg,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { getSubmitErrorMessage } from '../../../utils/handleSubmitError';
import { AuthContext } from '../../../context/AuthContext';
import api from '../../../api/axiosInstance';

import * as examService from '../../../services/examination.service';

// ─── Status meta ──────────────────────────────────────────────────────────────

const SESSION_STATUS = {
  DRAFT:      { label: 'Draft',      color: 'default'   },
  SCHEDULED:  { label: 'Scheduled',  color: 'info'      },
  ONGOING:    { label: 'Ongoing',    color: 'warning'   },
  COMPLETED:  { label: 'Completed',  color: 'success'   },
  CANCELLED:  { label: 'Cancelled',  color: 'error'     },
  POSTPONED:  { label: 'Postponed',  color: 'secondary' },
};

const GRADING_STATUS = {
  PENDING:       { label: 'Pending',        color: 'default'   },
  GRADED:        { label: 'Graded',         color: 'info'      },
  DOUBLE_GRADED: { label: 'Double Graded',  color: 'warning'   },
  MEDIATED:      { label: 'Mediated',       color: 'secondary' },
  PUBLISHED:     { label: 'Published',      color: 'success'   },
};

const APPEAL_STATUS = {
  PENDING:      { label: 'Pending',      color: 'default' },
  UNDER_REVIEW: { label: 'Under Review', color: 'warning' },
  RESOLVED:     { label: 'Resolved',     color: 'success' },
  REJECTED:     { label: 'Rejected',     color: 'error'   },
};

// ─── Yup schemas ──────────────────────────────────────────────────────────────

const sessionSchema = Yup.object({
  title:        Yup.string().required('Title is required').min(3),
  subject:      Yup.string().required('Subject is required'),
  teacher:      Yup.string().required('Teacher is required'),
  classes:      Yup.array().min(1, 'At least one class is required'),
  academicYear: Yup.string()
    .required('Academic year is required')
    .matches(/^\d{4}-\d{4}$/, 'Format: YYYY-YYYY'),
  semester:     Yup.string().required('Semester is required'),
  examPeriod:   Yup.string().required('Exam period is required'),
  mode:         Yup.string().required('Mode is required'),
  startTime:    Yup.string().required('Start time is required'),
  endTime:      Yup.string().required('End time is required'),
  duration:     Yup.number().required('Duration is required').positive().integer(),
  maxScore:     Yup.number().required('Max score is required').positive(),
});

// ─── Academic year helper ──────────────────────────────────────────────────────

const getAcademicYears = () => {
  const y = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => {
    const start = y - 2 + i;
    return `${start}-${start + 1}`;
  });
};

// ─── SessionForm dialog ───────────────────────────────────────────────────────

const SessionFormDialog = ({ open, onClose, onSuccess, session, relatedData }) => {
  const isEdit   = Boolean(session?._id);
  const subjects = relatedData.subjects || [];
  const teachers = relatedData.teachers || [];
  const classes  = relatedData.classes  || [];

  const formik = useFormik({
    initialValues: {
      title:        session?.title        ?? '',
      subject:      session?.subject?._id ?? session?.subject ?? '',
      teacher:      session?.teacher?._id ?? session?.teacher ?? '',
      classes:      (session?.classes || []).map((c) => c._id ?? c),
      academicYear: session?.academicYear ?? '',
      semester:     session?.semester     ?? 'S1',
      examPeriod:   session?.examPeriod   ?? 'MIDTERM',
      mode:         session?.mode         ?? 'PHYSICAL',
      startTime:    session?.startTime    ? session.startTime.slice(0, 16) : '',
      endTime:      session?.endTime      ? session.endTime.slice(0, 16)   : '',
      duration:     session?.duration     ?? 60,
      maxScore:     session?.maxScore     ?? 20,
      instructions: session?.instructions ?? '',
    },
    validationSchema: sessionSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting, setErrors }) => {
      try {
        if (isEdit) {
          await examService.updateSession(session._id, values);
        } else {
          await examService.createSession(values);
        }
        onSuccess(isEdit ? 'Session updated.' : 'Session created.');
      } catch (err) {
        setErrors({ submit: getSubmitErrorMessage(err) });
      } finally {
        setSubmitting(false);
      }
    },
  });

  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue } = formik;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      closeAfterTransition={false}
      aria-labelledby="session-form-dialog"
    >
      <DialogTitle id="session-form-dialog">
        {isEdit ? 'Edit Session' : 'Create Exam Session'}
      </DialogTitle>

      <DialogContent dividers>
        <Box component="form" noValidate>
          <Grid container spacing={2}>

            {/* Title */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                name="title"
                label="Session Title"
                value={values.title}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.title && errors.title)}
                helperText={touched.title && errors.title}
              />
            </Grid>

            {/* Subject */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(touched.subject && errors.subject)}>
                <InputLabel id="subject-label">Subject</InputLabel>
                <Select
                  labelId="subject-label"
                  name="subject"
                  value={values.subject}
                  label="Subject"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {subjects.map((s) => (
                    <MenuItem key={s._id} value={s._id}>{s.subject_name}</MenuItem>
                  ))}
                </Select>
                {touched.subject && errors.subject && (
                  <FormHelperText>{errors.subject}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Teacher */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(touched.teacher && errors.teacher)}>
                <InputLabel id="teacher-label">Teacher</InputLabel>
                <Select
                  labelId="teacher-label"
                  name="teacher"
                  value={values.teacher}
                  label="Teacher"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {teachers.map((t) => (
                    <MenuItem key={t._id} value={t._id}>
                      {t.firstName} {t.lastName}
                    </MenuItem>
                  ))}
                </Select>
                {touched.teacher && errors.teacher && (
                  <FormHelperText>{errors.teacher}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Classes (multi-select) */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth error={Boolean(touched.classes && errors.classes)}>
                <InputLabel id="classes-label">Classes</InputLabel>
                <Select
                  labelId="classes-label"
                  multiple
                  name="classes"
                  value={values.classes}
                  label="Classes"
                  onChange={(e) => setFieldValue('classes', e.target.value)}
                  onBlur={handleBlur}
                  renderValue={(selected) =>
                    selected
                      .map((id) => classes.find((c) => c._id === id)?.className || id)
                      .join(', ')
                  }
                >
                  {classes.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>
                  ))}
                </Select>
                {touched.classes && errors.classes && (
                  <FormHelperText>{errors.classes}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Academic Year */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth error={Boolean(touched.academicYear && errors.academicYear)}>
                <InputLabel id="year-label">Academic Year</InputLabel>
                <Select
                  labelId="year-label"
                  name="academicYear"
                  value={values.academicYear}
                  label="Academic Year"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {getAcademicYears().map((y) => (
                    <MenuItem key={y} value={y}>{y}</MenuItem>
                  ))}
                </Select>
                {touched.academicYear && errors.academicYear && (
                  <FormHelperText>{errors.academicYear}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Semester */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth error={Boolean(touched.semester && errors.semester)}>
                <InputLabel id="semester-label">Semester</InputLabel>
                <Select
                  labelId="semester-label"
                  name="semester"
                  value={values.semester}
                  label="Semester"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {['S1', 'S2', 'Annual'].map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </Select>
                {touched.semester && errors.semester && (
                  <FormHelperText>{errors.semester}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Exam Period */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth error={Boolean(touched.examPeriod && errors.examPeriod)}>
                <InputLabel id="period-label">Exam Period</InputLabel>
                <Select
                  labelId="period-label"
                  name="examPeriod"
                  value={values.examPeriod}
                  label="Exam Period"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {['MIDTERM', 'FINAL', 'RETAKE', 'CONTINUOUS', 'SPECIAL'].map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
                {touched.examPeriod && errors.examPeriod && (
                  <FormHelperText>{errors.examPeriod}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Mode */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth error={Boolean(touched.mode && errors.mode)}>
                <InputLabel id="mode-label">Mode</InputLabel>
                <Select
                  labelId="mode-label"
                  name="mode"
                  value={values.mode}
                  label="Mode"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {['PHYSICAL', 'ONLINE', 'HYBRID'].map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
                {touched.mode && errors.mode && (
                  <FormHelperText>{errors.mode}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Duration */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                name="duration"
                label="Duration"
                value={values.duration}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.duration && errors.duration)}
                helperText={touched.duration && errors.duration}
                slotProps={{ input: { endAdornment: <InputAdornment position="end">min</InputAdornment> } }}
              />
            </Grid>

            {/* Max Score */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                name="maxScore"
                label="Max Score"
                value={values.maxScore}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.maxScore && errors.maxScore)}
                helperText={touched.maxScore && errors.maxScore}
              />
            </Grid>

            {/* Start Time */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="datetime-local"
                name="startTime"
                label="Start Time"
                value={values.startTime}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.startTime && errors.startTime)}
                helperText={touched.startTime && errors.startTime}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* End Time */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="datetime-local"
                name="endTime"
                label="End Time"
                value={values.endTime}
                onChange={handleChange}
                onBlur={handleBlur}
                error={Boolean(touched.endTime && errors.endTime)}
                helperText={touched.endTime && errors.endTime}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Instructions */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="instructions"
                label="Instructions (optional)"
                value={values.instructions}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            </Grid>

          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>Cancel</Button>
        <Button
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : <Add />}
          onClick={handleSubmit}
        >
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── CancelDialog ─────────────────────────────────────────────────────────────

const CancelDialog = ({ open, onClose, onConfirm, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>Cancel Session</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth autoFocus
          label="Reason for cancellation"
          multiline rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Back</Button>
        <Button
          variant="contained" color="error"
          disabled={!reason.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Cancel />}
          onClick={() => onConfirm(reason)}
        >
          Confirm Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── PostponeDialog ───────────────────────────────────────────────────────────

const PostponeDialog = ({ open, onClose, onConfirm, loading }) => {
  const [form, setForm] = useState({ startTime: '', endTime: '', reason: '' });
  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>Postpone Session</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth type="datetime-local" name="startTime" label="New Start Time"
            value={form.startTime} onChange={handle} slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth type="datetime-local" name="endTime" label="New End Time"
            value={form.endTime} onChange={handle} slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            fullWidth multiline rows={2} name="reason" label="Reason"
            value={form.reason} onChange={handle}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Back</Button>
        <Button
          variant="contained"
          disabled={!form.startTime || !form.endTime || !form.reason.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <PostAdd />}
          onClick={() => onConfirm(form)}
        >
          Postpone
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── GradeDialog ──────────────────────────────────────────────────────────────

const GradeDialog = ({ open, onClose, onConfirm, grading, loading }) => {
  const maxScore = grading?.maxScore ?? 20;
  const [form, setForm] = useState({
    score:          grading?.score          ?? '',
    graderFeedback: grading?.graderFeedback ?? '',
  });

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>
        Grade Submission — {grading?.student?.firstName} {grading?.student?.lastName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth type="number" name="score" label={`Score (max ${maxScore})`}
            value={form.score} onChange={handle}
            slotProps={{ input: { min: 0, max: maxScore, step: 0.5 } }}
          />
          <TextField
            fullWidth multiline rows={3} name="graderFeedback" label="Feedback (optional)"
            value={form.graderFeedback} onChange={handle}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          disabled={form.score === '' || Number(form.score) < 0 || Number(form.score) > maxScore || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Grade />}
          onClick={() => onConfirm({ ...form, score: Number(form.score), maxScore })}
        >
          Save Grade
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── ResolveAppealDialog ──────────────────────────────────────────────────────

const ResolveAppealDialog = ({ open, onClose, onConfirm, loading }) => {
  const [form, setForm] = useState({ decision: 'RESOLVED', resolution: '', newScore: '' });

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>Resolve Appeal</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="decision-label">Decision</InputLabel>
            <Select
              labelId="decision-label"
              name="decision"
              value={form.decision}
              label="Decision"
              onChange={handle}
            >
              <MenuItem value="RESOLVED">Resolved (accept appeal)</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
          {form.decision === 'RESOLVED' && (
            <TextField
              fullWidth type="number" name="newScore" label="New Score (optional)"
              value={form.newScore} onChange={handle}
              slotProps={{ input: { min: 0, step: 0.5 } }}
            />
          )}
          <TextField
            fullWidth multiline rows={3} name="resolution" label="Resolution notes"
            value={form.resolution} onChange={handle}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          color={form.decision === 'RESOLVED' ? 'success' : 'error'}
          disabled={!form.resolution.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Gavel />}
          onClick={() => onConfirm({
            decision: form.decision,
            resolution: form.resolution,
            ...(form.decision === 'RESOLVED' && form.newScore !== '' && { newScore: Number(form.newScore) }),
          })}
        >
          {form.decision === 'RESOLVED' ? 'Resolve' : 'Reject'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── EnrollmentsDialog ────────────────────────────────────────────────────────

const EnrollmentsDialog = ({ open, onClose, session }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading]         = useState(false);
  const [computing, setComputing]     = useState(false);
  const [page, setPage]               = useState(0);
  const [total, setTotal]             = useState(0);

  const load = useCallback(async () => {
    if (!session?._id) return;
    setLoading(true);
    try {
      const res = await examService.listEnrollments({ sessionId: session._id, page: page + 1, limit: 20 });
      setEnrollments(res.data?.data?.enrollments || res.data?.data || []);
      setTotal(res.data?.pagination?.total || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [session, page]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleCompute = async () => {
    setComputing(true);
    try {
      await examService.computeEligibility(session._id);
      await load();
    } catch {
      // silent
    } finally {
      setComputing(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>
        Enrollments — {session?.title}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            size="small" variant="outlined" startIcon={computing ? <CircularProgress size={14} /> : <HowToReg />}
            onClick={handleCompute} disabled={computing}
          >
            Compute Eligibility
          </Button>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box textAlign="center" py={4}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Seat</TableCell>
                <TableCell>Eligible</TableCell>
                <TableCell>Attendance</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No enrollments yet. Click "Compute Eligibility".</TableCell>
                </TableRow>
              ) : (
                enrollments.map((e) => (
                  <TableRow key={e._id} hover>
                    <TableCell>{e.student?.firstName} {e.student?.lastName}</TableCell>
                    <TableCell>{e.seatNumber || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={e.isEligible ? 'Eligible' : 'Not Eligible'}
                        color={e.isEligible ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{e.attendance ?? '—'}%</TableCell>
                    <TableCell>{e.eligibilityNotes || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={20}
          rowsPerPageOptions={[20]}
          onPageChange={(_, p) => setPage(p)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ExaminationManager = () => {

  const { user } = useContext(AuthContext);
  const campusId = user?.campusId ?? user?.schoolCampus ?? '';

  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState(0);

  // ── Snackbar ───────────────────────────────────────────────────────────────
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // ══════════════════════════════════════════════════════════════════════════
  // SESSIONS state
  // ══════════════════════════════════════════════════════════════════════════
  const [sessions, setSessions]         = useState([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPage, setSessionsPage] = useState(0);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsFilter, setSessionsFilter]   = useState({
    status: '', examPeriod: '', academicYear: '', semester: '', search: '',
  });

  // related data for the form
  const [relatedData, setRelatedData] = useState({ subjects: [], teachers: [], classes: [] });

  // dialogs
  const [sessionFormOpen, setSessionFormOpen]   = useState(false);
  const [editSession, setEditSession]           = useState(null);
  const [cancelDialog, setCancelDialog]         = useState({ open: false, session: null });
  const [postponeDialog, setPostponeDialog]     = useState({ open: false, session: null });
  const [enrollDialog, setEnrollDialog]         = useState({ open: false, session: null });
  const [actionLoading, setActionLoading]       = useState(false);

  // ── Load sessions ──────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const params = { page: sessionsPage + 1, limit: 10 };
      if (sessionsFilter.status)      params.status      = sessionsFilter.status;
      if (sessionsFilter.examPeriod)  params.examPeriod  = sessionsFilter.examPeriod;
      if (sessionsFilter.academicYear) params.academicYear = sessionsFilter.academicYear;
      if (sessionsFilter.semester)    params.semester    = sessionsFilter.semester;
      if (sessionsFilter.search)      params.search      = sessionsFilter.search;

      const res = await examService.listSessions(params);
      setSessions(res.data?.data?.sessions || res.data?.data || []);
      setSessionsTotal(res.data?.pagination?.total || 0);
    } catch {
      showSnack('Failed to load sessions.', 'error');
    } finally {
      setSessionsLoading(false);
    }
  }, [sessionsPage, sessionsFilter]);

  const loadRelatedData = useCallback(async () => {
    try {
      const params = campusId ? { campusId } : {};
      const [subRes, teachRes, classRes] = await Promise.all([
        api.get('/subject',   { params }).catch(() => ({ data: {} })),
        api.get('/teachers',  { params }).catch(() => ({ data: {} })),
        api.get('/class',     { params }).catch(() => ({ data: {} })),
      ]);
      const pick = (res) => {
        const d = res.data?.data;
        return Array.isArray(d) ? d : (d ? [d] : []);
      };
      setRelatedData({
        subjects: pick(subRes),
        teachers: pick(teachRes),
        classes:  pick(classRes),
      });
    } catch {
      // silent
    }
  }, [campusId]);

  useEffect(() => { if (tab === 0) loadSessions(); }, [tab, loadSessions]);
  useEffect(() => { loadRelatedData(); }, [loadRelatedData]);

  // ── Session lifecycle helpers ──────────────────────────────────────────────
  const lifecycleAction = async (fn, successMsg) => {
    setActionLoading(true);
    try {
      await fn();
      showSnack(successMsg);
      loadSessions();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Action failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // GRADING state
  // ══════════════════════════════════════════════════════════════════════════
  const [gradings, setGradings]           = useState([]);
  const [gradingsTotal, setGradingsTotal] = useState(0);
  const [gradingsPage, setGradingsPage]   = useState(0);
  const [gradingsLoading, setGradingsLoading] = useState(false);
  const [gradingFilter, setGradingFilter] = useState({ sessionId: '', status: '' });
  const [gradeDialog, setGradeDialog]     = useState({ open: false, grading: null });
  const [gradeLoading, setGradeLoading]   = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const loadGradings = useCallback(async () => {
    setGradingsLoading(true);
    try {
      const params = { page: gradingsPage + 1, limit: 10 };
      if (gradingFilter.sessionId) params.sessionId = gradingFilter.sessionId;
      if (gradingFilter.status)    params.status    = gradingFilter.status;
      const res = await examService.listGradings(params);
      setGradings(res.data?.data?.gradings || res.data?.data || []);
      setGradingsTotal(res.data?.pagination?.total || 0);
    } catch {
      showSnack('Failed to load gradings.', 'error');
    } finally {
      setGradingsLoading(false);
    }
  }, [gradingsPage, gradingFilter]);

  useEffect(() => { if (tab === 1) loadGradings(); }, [tab, loadGradings]);

  const handleGrade = async (data) => {
    setGradeLoading(true);
    try {
      await examService.gradeSubmission({
        submissionId: gradeDialog.grading?.submission,
        ...data,
      });
      showSnack('Grading saved.');
      setGradeDialog({ open: false, grading: null });
      loadGradings();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Grading failed.', 'error');
    } finally {
      setGradeLoading(false);
    }
  };

  const handlePublishGrades = async (sessionId) => {
    if (!sessionId) { showSnack('Select a session first.', 'warning'); return; }
    setPublishLoading(true);
    try {
      await examService.publishGrades(sessionId);
      showSnack('Grades published successfully.');
      loadGradings();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Publish failed.', 'error');
    } finally {
      setPublishLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // APPEALS state
  // ══════════════════════════════════════════════════════════════════════════
  const [appeals, setAppeals]           = useState([]);
  const [appealsTotal, setAppealsTotal] = useState(0);
  const [appealsPage, setAppealsPage]   = useState(0);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [appealStatusFilter, setAppealStatusFilter] = useState('');
  const [resolveDialog, setResolveDialog] = useState({ open: false, appeal: null });
  const [resolveLoading, setResolveLoading] = useState(false);

  const loadAppeals = useCallback(async () => {
    setAppealsLoading(true);
    try {
      const params = { page: appealsPage + 1, limit: 10 };
      if (appealStatusFilter) params.status = appealStatusFilter;
      const res = await examService.listAppeals(params);
      setAppeals(res.data?.data?.appeals || res.data?.data || []);
      setAppealsTotal(res.data?.pagination?.total || 0);
    } catch {
      showSnack('Failed to load appeals.', 'error');
    } finally {
      setAppealsLoading(false);
    }
  }, [appealsPage, appealStatusFilter]);

  useEffect(() => { if (tab === 2) loadAppeals(); }, [tab, loadAppeals]);

  const handleReviewAppeal = async (id) => {
    try {
      await examService.reviewAppeal(id);
      showSnack('Appeal moved to Under Review.');
      loadAppeals();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed.', 'error');
    }
  };

  const handleResolveAppeal = async (data) => {
    setResolveLoading(true);
    try {
      await examService.resolveAppeal(resolveDialog.appeal._id, data);
      showSnack('Appeal resolved.');
      setResolveDialog({ open: false, appeal: null });
      loadAppeals();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed.', 'error');
    } finally {
      setResolveLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ANALYTICS state
  // ══════════════════════════════════════════════════════════════════════════
  const [overview, setOverview]             = useState(null);
  const [earlyWarning, setEarlyWarning]     = useState([]);
  const [earlyWarningTotal, setEarlyWarningTotal] = useState(0);
  const [earlyWarningPage, setEarlyWarningPage]   = useState(0);
  const [analyticsLoading, setAnalyticsLoading]   = useState(false);
  const [exportLoading, setExportLoading]         = useState(false);
  const [exportYear, setExportYear]               = useState('');

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const [ovRes, ewRes] = await Promise.all([
        examService.getCampusOverview(),
        examService.getEarlyWarning({ page: earlyWarningPage + 1, limit: 10 }),
      ]);
      setOverview(ovRes.data?.data || {});
      setEarlyWarning(ewRes.data?.data?.students || ewRes.data?.data || []);
      setEarlyWarningTotal(ewRes.data?.pagination?.total || 0);
    } catch {
      showSnack('Failed to load analytics.', 'error');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [earlyWarningPage]);

  useEffect(() => { if (tab === 3) loadAnalytics(); }, [tab, loadAnalytics]);

  const handleExport = async () => {
    if (!exportYear) { showSnack('Select an academic year.', 'warning'); return; }
    setExportLoading(true);
    try {
      const res = await examService.exportReport({ academicYear: exportYear, format: 'json' });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `exam-report-${exportYear}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showSnack('Export downloaded.');
    } catch {
      showSnack('Export failed.', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // KPI cards for analytics tab
  // ══════════════════════════════════════════════════════════════════════════
  const kpiCards = overview ? [
    { label: 'Total Sessions',   value: overview.totalSessions   ?? 0, color: '#3b82f6', subtitle: 'All time' },
    { label: 'Ongoing',          value: overview.ongoingSessions ?? 0, color: '#f97316', subtitle: 'In progress' },
    { label: 'Total Graded',     value: overview.totalGraded     ?? 0, color: '#8b5cf6', subtitle: 'Submissions graded' },
    { label: 'Average Score',    value: `${(overview.avgScore ?? 0).toFixed(1)}`, color: '#14b8a6', subtitle: 'Out of max score' },
    { label: 'Passing Rate',     value: `${(overview.passingRate ?? 0).toFixed(1)}%`, color: '#22c55e', subtitle: 'Students passing' },
    { label: 'At-Risk Students', value: overview.atRiskCount     ?? 0, color: '#ef4444', subtitle: 'High dropout risk' },
  ] : [];

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Examination Management</Typography>
      </Stack>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Sessions"    icon={<Assignment fontSize="small" />} iconPosition="start" />
          <Tab label="Grading"     icon={<Grade fontSize="small" />}      iconPosition="start" />
          <Tab label="Appeals"     icon={<Gavel fontSize="small" />}      iconPosition="start" />
          <Tab label="Analytics"   icon={<BarChart fontSize="small" />}   iconPosition="start" />
        </Tabs>
      </Paper>

      {/* ════════════════════════════════════════════════════════════════════
          TAB 0 — SESSIONS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 0 && (
        <Box>
          {/* Filters + actions */}
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth size="small" label="Search"
                  value={sessionsFilter.search}
                  onChange={(e) => setSessionsFilter((p) => ({ ...p, search: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="status-filter-label">Status</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={sessionsFilter.status}
                    label="Status"
                    onChange={(e) => setSessionsFilter((p) => ({ ...p, status: e.target.value }))}
                  >
                    <MenuItem value="">All</MenuItem>
                    {Object.keys(SESSION_STATUS).map((s) => (
                      <MenuItem key={s} value={s}>{SESSION_STATUS[s].label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="period-filter-label">Period</InputLabel>
                  <Select
                    labelId="period-filter-label"
                    value={sessionsFilter.examPeriod}
                    label="Period"
                    onChange={(e) => setSessionsFilter((p) => ({ ...p, examPeriod: e.target.value }))}
                  >
                    <MenuItem value="">All</MenuItem>
                    {['MIDTERM', 'FINAL', 'RETAKE', 'CONTINUOUS', 'SPECIAL'].map((p) => (
                      <MenuItem key={p} value={p}>{p}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="semester-filter-label">Semester</InputLabel>
                  <Select
                    labelId="semester-filter-label"
                    value={sessionsFilter.semester}
                    label="Semester"
                    onChange={(e) => setSessionsFilter((p) => ({ ...p, semester: e.target.value }))}
                  >
                    <MenuItem value="">All</MenuItem>
                    {['S1', 'S2', 'Annual'].map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title="Refresh">
                    <IconButton onClick={loadSessions} disabled={sessionsLoading}>
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="contained" startIcon={<Add />}
                    onClick={() => { setEditSession(null); setSessionFormOpen(true); }}
                  >
                    New Session
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Sessions table */}
          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessionsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No exam sessions found.</TableCell>
                  </TableRow>
                ) : (
                  sessions.map((s) => {
                    const meta = SESSION_STATUS[s.status] || { label: s.status, color: 'default' };
                    return (
                      <TableRow key={s._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {s.academicYear} · {s.semester}
                          </Typography>
                        </TableCell>
                        <TableCell>{s.subject?.subject_name || '—'}</TableCell>
                        <TableCell>{s.examPeriod}</TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {s.startTime ? new Date(s.startTime).toLocaleString() : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>{s.mode}</TableCell>
                        <TableCell>
                          <Chip label={meta.label} color={meta.color} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {/* Enrollments */}
                            <Tooltip title="View Enrollments">
                              <IconButton size="small" onClick={() => setEnrollDialog({ open: true, session: s })}>
                                <HowToReg fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {/* Edit (DRAFT only) */}
                            {s.status === 'DRAFT' && (
                              <Tooltip title="Edit">
                                <IconButton size="small" color="info"
                                  onClick={() => { setEditSession(s); setSessionFormOpen(true); }}>
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {/* Lifecycle */}
                            {s.status === 'DRAFT' && (
                              <Tooltip title="Schedule">
                                <IconButton size="small" color="primary" disabled={actionLoading}
                                  onClick={() => lifecycleAction(() => examService.submitSession(s._id), 'Session scheduled.')}>
                                  <Schedule fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {s.status === 'SCHEDULED' && (
                              <Tooltip title="Start">
                                <IconButton size="small" color="warning" disabled={actionLoading}
                                  onClick={() => lifecycleAction(() => examService.startSession(s._id), 'Session started.')}>
                                  <PlayArrow fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {s.status === 'ONGOING' && (
                              <Tooltip title="Complete">
                                <IconButton size="small" color="success" disabled={actionLoading}
                                  onClick={() => lifecycleAction(() => examService.completeSession(s._id), 'Session completed.')}>
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {/* Postpone */}
                            {['DRAFT', 'SCHEDULED'].includes(s.status) && (
                              <Tooltip title="Postpone">
                                <IconButton size="small"
                                  onClick={() => setPostponeDialog({ open: true, session: s })}>
                                  <PostAdd fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {/* Cancel */}
                            {!['COMPLETED', 'CANCELLED'].includes(s.status) && (
                              <Tooltip title="Cancel">
                                <IconButton size="small" color="error"
                                  onClick={() => setCancelDialog({ open: true, session: s })}>
                                  <Cancel fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {/* Delete (DRAFT only) */}
                            {s.status === 'DRAFT' && (
                              <Tooltip title="Delete">
                                <IconButton size="small" color="error" disabled={actionLoading}
                                  onClick={() => lifecycleAction(() => examService.deleteSession(s._id), 'Session deleted.')}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={sessionsTotal}
              page={sessionsPage}
              rowsPerPage={10}
              rowsPerPageOptions={[10]}
              onPageChange={(_, p) => setSessionsPage(p)}
            />
          </Paper>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 1 — GRADING
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 1 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="grading-status-label">Status</InputLabel>
                  <Select
                    labelId="grading-status-label"
                    value={gradingFilter.status}
                    label="Status"
                    onChange={(e) => setGradingFilter((p) => ({ ...p, status: e.target.value }))}
                  >
                    <MenuItem value="">All</MenuItem>
                    {Object.keys(GRADING_STATUS).map((s) => (
                      <MenuItem key={s} value={s}>{GRADING_STATUS[s].label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title="Refresh"><IconButton onClick={loadGradings}><Refresh /></IconButton></Tooltip>
                  <Button
                    variant="contained" color="success"
                    startIcon={publishLoading ? <CircularProgress size={16} /> : <Publish />}
                    disabled={publishLoading || !gradingFilter.sessionId}
                    onClick={() => handlePublishGrades(gradingFilter.sessionId)}
                  >
                    Publish Grades
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Session</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gradingsLoading ? (
                  <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : gradings.length === 0 ? (
                  <TableRow><TableCell colSpan={5} align="center">No gradings found.</TableCell></TableRow>
                ) : (
                  gradings.map((g) => {
                    const meta = GRADING_STATUS[g.status] || { label: g.status, color: 'default' };
                    return (
                      <TableRow key={g._id} hover>
                        <TableCell>{g.student?.firstName} {g.student?.lastName}</TableCell>
                        <TableCell>{g.examSession?.title || '—'}</TableCell>
                        <TableCell>
                          {g.finalScore != null
                            ? `${g.finalScore} / ${g.maxScore}`
                            : g.score != null
                              ? `${g.score} / ${g.maxScore}`
                              : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip label={meta.label} color={meta.color} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Grade">
                            <IconButton size="small" color="primary"
                              onClick={() => setGradeDialog({ open: true, grading: g })}>
                              <Grade fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div" count={gradingsTotal} page={gradingsPage}
              rowsPerPage={10} rowsPerPageOptions={[10]}
              onPageChange={(_, p) => setGradingsPage(p)}
            />
          </Paper>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 2 — APPEALS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 2 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="appeal-status-label">Status</InputLabel>
                  <Select
                    labelId="appeal-status-label"
                    value={appealStatusFilter}
                    label="Status"
                    onChange={(e) => setAppealStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {Object.keys(APPEAL_STATUS).map((s) => (
                      <MenuItem key={s} value={s}>{APPEAL_STATUS[s].label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <Stack direction="row" justifyContent="flex-end">
                  <Tooltip title="Refresh"><IconButton onClick={loadAppeals}><Refresh /></IconButton></Tooltip>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Paper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Session</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appealsLoading ? (
                  <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
                ) : appeals.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center">No appeals found.</TableCell></TableRow>
                ) : (
                  appeals.map((a) => {
                    const meta = APPEAL_STATUS[a.status] || { label: a.status, color: 'default' };
                    return (
                      <TableRow key={a._id} hover>
                        <TableCell>{a.student?.firstName} {a.student?.lastName}</TableCell>
                        <TableCell>{a.grading?.examSession?.title || '—'}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography variant="caption" noWrap>{a.reason}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={meta.label} color={meta.color} size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            {a.status === 'PENDING' && (
                              <Tooltip title="Start Review">
                                <IconButton size="small" color="warning"
                                  onClick={() => handleReviewAppeal(a._id)}>
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {['PENDING', 'UNDER_REVIEW'].includes(a.status) && (
                              <Tooltip title="Resolve">
                                <IconButton size="small" color="success"
                                  onClick={() => setResolveDialog({ open: true, appeal: a })}>
                                  <Gavel fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div" count={appealsTotal} page={appealsPage}
              rowsPerPage={10} rowsPerPageOptions={[10]}
              onPageChange={(_, p) => setAppealsPage(p)}
            />
          </Paper>
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          TAB 3 — ANALYTICS
      ════════════════════════════════════════════════════════════════════ */}
      {tab === 3 && (
        <Box>
          {analyticsLoading ? (
            <Box textAlign="center" py={6}><CircularProgress /></Box>
          ) : (
            <>
              {/* Overview KPI cards */}
              <Grid container spacing={2} mb={3}>
                {kpiCards.map((k) => (
                  <Grid key={k.label} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Paper sx={{ p: 2, borderLeft: `4px solid ${k.color}` }}>
                      <Typography variant="caption" color="text.secondary">{k.label}</Typography>
                      <Typography variant="h5" fontWeight={700} color={k.color}>{k.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{k.subtitle}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Export */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Export Report
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel id="export-year-label">Academic Year</InputLabel>
                    <Select
                      labelId="export-year-label"
                      value={exportYear}
                      label="Academic Year"
                      onChange={(e) => setExportYear(e.target.value)}
                    >
                      {getAcademicYears().map((y) => (
                        <MenuItem key={y} value={y}>{y}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    startIcon={exportLoading ? <CircularProgress size={16} /> : <FileDownload />}
                    onClick={handleExport}
                    disabled={exportLoading}
                  >
                    Export JSON
                  </Button>
                </Stack>
              </Paper>

              <Divider sx={{ my: 3 }} />

              {/* Early warning list */}
              <Typography variant="subtitle1" fontWeight={600} mb={2}>
                <Badge badgeContent={earlyWarningTotal} color="error" max={99}>
                  <Warning sx={{ mr: 1 }} />
                </Badge>
                Early Warning — At-Risk Students
              </Typography>
              <Paper>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Avg Score</TableCell>
                      <TableCell>Fail Rate</TableCell>
                      <TableCell>Risk Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {earlyWarning.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No at-risk students.</TableCell>
                      </TableRow>
                    ) : (
                      earlyWarning.map((s) => (
                        <TableRow key={s.student?._id || s._id} hover>
                          <TableCell>{s.student?.firstName} {s.student?.lastName}</TableCell>
                          <TableCell>{(s.avgScore ?? 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip
                              label={`${(s.failRate ?? 0).toFixed(1)}%`}
                              color={s.failRate > 50 ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={(s.dropoutRiskScore ?? 0).toFixed(2)}
                              color={s.dropoutRiskScore > 0.7 ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div" count={earlyWarningTotal} page={earlyWarningPage}
                  rowsPerPage={10} rowsPerPageOptions={[10]}
                  onPageChange={(_, p) => setEarlyWarningPage(p)}
                />
              </Paper>
            </>
          )}
        </Box>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          DIALOGS
      ════════════════════════════════════════════════════════════════════ */}

      <SessionFormDialog
        open={sessionFormOpen}
        onClose={() => setSessionFormOpen(false)}
        session={editSession}
        relatedData={relatedData}
        onSuccess={(msg) => {
          showSnack(msg);
          setSessionFormOpen(false);
          loadSessions();
        }}
      />

      <CancelDialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, session: null })}
        loading={actionLoading}
        onConfirm={(reason) =>
          lifecycleAction(
            () => examService.cancelSession(cancelDialog.session._id, { reason }),
            'Session cancelled.',
          ).then(() => setCancelDialog({ open: false, session: null }))
        }
      />

      <PostponeDialog
        open={postponeDialog.open}
        onClose={() => setPostponeDialog({ open: false, session: null })}
        loading={actionLoading}
        onConfirm={(data) =>
          lifecycleAction(
            () => examService.postponeSession(postponeDialog.session._id, data),
            'Session postponed.',
          ).then(() => setPostponeDialog({ open: false, session: null }))
        }
      />

      <GradeDialog
        key={gradeDialog.grading?._id ?? 'grade'}
        open={gradeDialog.open}
        onClose={() => setGradeDialog({ open: false, grading: null })}
        grading={gradeDialog.grading}
        loading={gradeLoading}
        onConfirm={handleGrade}
      />

      <ResolveAppealDialog
        key={resolveDialog.appeal?._id ?? 'resolve'}
        open={resolveDialog.open}
        onClose={() => setResolveDialog({ open: false, appeal: null })}
        loading={resolveLoading}
        onConfirm={handleResolveAppeal}
      />

      <EnrollmentsDialog
        open={enrollDialog.open}
        onClose={() => setEnrollDialog({ open: false, session: null })}
        session={enrollDialog.session}
      />

      {/* Snackbar */}
      {snack.open && (
        <Box
          sx={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          <Alert
            severity={snack.severity}
            onClose={() => setSnack((p) => ({ ...p, open: false }))}
            sx={{ boxShadow: 3 }}
          >
            {snack.msg}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default ExaminationManager;
