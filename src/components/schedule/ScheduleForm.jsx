import { CircularProgress, Grid, Button, Stack, Typography, Switch, FormControlLabel, Chip, Box } from '@mui/material';
import {
  CalendarMonth, AccessTime, Person, LocationOn,
  Videocam, MenuBook, Check, Cancel, Add, Remove,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import { studentScheduleSchema } from '../../yupSchema/studentScheduleSchema';
import { FormTextField, FormSelectField } from '../form/FormFields';
import FormSection from '../form/FormSection';
import { SESSION_TYPE_OPTIONS } from '../../theme/scheduleTokens';

// ─── STATIC OPTIONS ───────────────────────────────────────────────────────────

const SEMESTER_OPTIONS = [
  { value: 'S1',     label: 'Semester 1' },
  { value: 'S2',     label: 'Semester 2' },
  { value: 'Annual', label: 'Annual'     },
];

const STATUS_OPTIONS = [
  { value: 'DRAFT',     label: 'Draft'     },
  { value: 'PUBLISHED', label: 'Published' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Converts a stored ISO string (or Date) to the "datetime-local" input value
 * format: "YYYY-MM-DDTHH:mm" (no seconds, no timezone).
 */
const toLocalDatetimeValue = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  // toISOString gives UTC; slice to minutes
  return d.toISOString().slice(0, 16);
};

/**
 * Builds the flat Formik initial values from an optional existing session (edit mode).
 * campusId and academicYear are always injected from the parent (campus isolation).
 */
const buildInitialValues = (d, campusId, academicYear) => ({
  schoolCampus: campusId            || d?.schoolCampus          || '',
  academicYear: academicYear        || d?.academicYear           || '',
  semester:     d?.semester         || 'S1',
  sessionType:  d?.sessionType      || 'LECTURE',
  // Flat IDs — Yup validates these; onSubmit assembles nested objects
  subjectId:    d?.subject?.subjectId  ? String(d.subject.subjectId)  : '',
  teacherId:    d?.teacher?.teacherId  ? String(d.teacher.teacherId)  : '',
  classIds:     d?.classes?.map((c) => String(c.classId)) ?? [],
  startTime:    toLocalDatetimeValue(d?.startTime),
  endTime:      toLocalDatetimeValue(d?.endTime),
  isVirtual:    d?.isVirtual          ?? false,
  // Physical room
  roomCode:     d?.room?.code         || '',
  roomBuilding: d?.room?.building     || '',
  // Virtual meeting — backend stores "meetingUrl" (not "joinUrl")
  meetingUrl:   d?.virtualMeeting?.meetingUrl || '',
  platform:     d?.virtualMeeting?.platform   || '',
  // Content
  topic:        d?.topic       || '',
  description:  d?.description || '',
  status:       d?.status      || 'DRAFT',
});

// ─── COMPONENT ────────────────────────────────────────────────────────────────

/**
 * Session creation / edit form — used by the CAMPUS_MANAGER schedule page.
 *
 * Props:
 *  - initialData     {Object|null}  — existing session document (edit mode)
 *  - campusId        {string}       — enforced from AuthContext (campus isolation)
 *  - academicYear    {string}       — current academic year
 *  - teacherOptions  {Array}        — [{ value, label, firstName, lastName, email }]
 *  - classOptions    {Array}        — [{ value, label }]
 *  - subjectOptions  {Array}        — [{ value, label, code }]
 *  - onSubmit        {Function}     — async (payload, isEdit, sessionId?) => void
 *  - onCancel        {Function}     — called when user clicks Cancel
 */
const ScheduleForm = ({
  initialData,
  campusId,
  academicYear,
  teacherOptions = [],
  classOptions   = [],
  subjectOptions = [],
  onSubmit,
  onCancel,
}) => {
  const isEdit = Boolean(initialData);

  const formik = useFormik({
    initialValues:    buildInitialValues(initialData, campusId, academicYear),
    enableReinitialize: true,
    validationSchema: studentScheduleSchema,

    onSubmit: async (values, { resetForm }) => {
      /**
       * Build the flat payload expected by the backend createSession / updateSession.
       *
       * Contract (studentSchedule.controller.js):
       *   The controller receives flat IDs (subjectId, teacherId, classIds[]) and
       *   resolves them into denormalised nested objects via resolveSessionParticipants().
       *   Sending nested { subject: { subjectId } } objects causes a 400 because the
       *   controller destructures req.body expecting top-level scalar fields only.
       */
      const payload = {
        schoolCampus: values.schoolCampus,
        academicYear: values.academicYear,
        semester:     values.semester,
        sessionType:  values.sessionType,
        startTime:    new Date(values.startTime).toISOString(),
        endTime:      new Date(values.endTime).toISOString(),
        isVirtual:    values.isVirtual,
        status:       values.status,

        // Flat IDs — the backend resolves these against the DB with campus-isolation checks
        subjectId: values.subjectId,
        teacherId: values.teacherId,
        classIds:  values.classIds,

        // Location block — mutually exclusive based on isVirtual flag
        ...(values.isVirtual
          ? {
              virtualMeeting: {
                meetingUrl: values.meetingUrl,
                platform:   values.platform || undefined,
              },
            }
          : {
              room: {
                code:     values.roomCode,
                building: values.roomBuilding || undefined,
              },
            }
        ),

        // Optional content fields — omit when empty to avoid overwriting with ''
        ...(values.topic       ? { topic:       values.topic       } : {}),
        ...(values.description ? { description: values.description } : {}),
      };

      await onSubmit(payload, isEdit, initialData?._id);
      if (!isEdit) resetForm();
    },
  });

  // Toggle a classId in/out of the classIds array
  const toggleClass = (classId) => {
    const next = formik.values.classIds.includes(classId)
      ? formik.values.classIds.filter((id) => id !== classId)
      : [...formik.values.classIds, classId];
    formik.setFieldValue('classIds', next, true); // true = run validation
  };

  // Submit button is disabled only while submitting — dirty/valid handled by Formik
  const isSubmitDisabled = formik.isSubmitting;

  return (
    <form onSubmit={formik.handleSubmit} noValidate>
      <Grid container spacing={3}>

        {/* ── Academic context ───────────────────────────────────────── */}
        <FormSection title="Academic Context" />

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField
            formik={formik}
            name="academicYear"
            label="Academic Year (e.g. 2024-2025)"
            icon={CalendarMonth}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormSelectField formik={formik} name="semester" label="Semester" options={SEMESTER_OPTIONS} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormSelectField formik={formik} name="sessionType" label="Session Type" options={SESSION_TYPE_OPTIONS} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormSelectField
            formik={formik}
            name="subjectId"
            label="Subject"
            icon={MenuBook}
            options={subjectOptions}
          />
        </Grid>

        {/* ── Participants ────────────────────────────────────────────── */}
        <FormSection title="Participants" />

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormSelectField
            formik={formik}
            name="teacherId"
            label="Teacher"
            icon={Person}
            options={teacherOptions}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Classes
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {classOptions.map((c) => {
              const selected = formik.values.classIds.includes(c.value);
              return (
                <Chip
                  key={c.value}
                  label={c.label}
                  icon={selected ? <Remove fontSize="small" /> : <Add fontSize="small" />}
                  onClick={() => toggleClass(c.value)}
                  color={selected ? 'primary' : 'default'}
                  variant={selected ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer', mb: 1 }}
                />
              );
            })}
          </Stack>
          {formik.touched.classIds && formik.errors.classIds && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              {formik.errors.classIds}
            </Typography>
          )}
        </Grid>

        {/* ── Date & Time ─────────────────────────────────────────────── */}
        <FormSection title="Date & Time" />

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField
            formik={formik}
            name="startTime"
            label="Start Time"
            type="datetime-local"
            icon={AccessTime}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField
            formik={formik}
            name="endTime"
            label="End Time"
            type="datetime-local"
            icon={AccessTime}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* ── Location ────────────────────────────────────────────────── */}
        <FormSection title="Location" />

        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formik.values.isVirtual}
                onChange={(e) => formik.setFieldValue('isVirtual', e.target.checked, true)}
              />
            }
            label="Virtual session"
          />
        </Grid>

        {formik.values.isVirtual ? (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField
                formik={formik}
                name="meetingUrl"
                label="Meeting URL"
                icon={Videocam}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField formik={formik} name="platform" label="Platform (Zoom, Teams…)" />
            </Grid>
          </>
        ) : (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField formik={formik} name="roomCode" label="Room Code" icon={LocationOn} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormTextField formik={formik} name="roomBuilding" label="Building" />
            </Grid>
          </>
        )}

        {/* ── Content (optional) ──────────────────────────────────────── */}
        <FormSection title="Content (optional)" />

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormTextField formik={formik} name="topic" label="Topic" icon={MenuBook} />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FormTextField
            formik={formik}
            name="description"
            label="Description"
            multiline
            rows={3}
          />
        </Grid>

        {/* ── Status ──────────────────────────────────────────────────── */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormSelectField formik={formik} name="status" label="Status" options={STATUS_OPTIONS} />
        </Grid>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <Grid size={{ xs: 12 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="flex-end"
          >
            {onCancel && (
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={onCancel}
                disabled={formik.isSubmitting}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              variant="contained"
              startIcon={
                formik.isSubmitting
                  ? <CircularProgress size={18} color="inherit" />
                  : <Check />
              }
              disabled={isSubmitDisabled}
              sx={{ textTransform: 'none', borderRadius: 2 }}
            >
              {formik.isSubmitting
                ? 'Saving…'
                : isEdit
                  ? 'Save Changes'
                  : 'Create Session'}
            </Button>
          </Stack>
        </Grid>

      </Grid>
    </form>
  );
};

export default ScheduleForm;