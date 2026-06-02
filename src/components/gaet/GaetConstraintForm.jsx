/**
 * @file GaetConstraintForm.jsx
 * @description Full constraint configuration form for GAET.
 *
 * Three tabbed sections:
 *   1. Time Slots     — weekly grid availability (day + hours + break flag)
 *   2. Courses        — one CourseRequirement per class/subject/teacher combination
 *   3. Rooms          — physical rooms available for allocation
 *
 * Uses Formik + FieldArray for dynamic array fields.
 * MUI rules (project standard): FormControl+InputLabel+Select, Grid size={{}}, slotProps.paper.
 */

import { useState } from 'react';
import {
  Box, Grid, Tabs, Tab, Button, Stack, Typography,
  FormControl, InputLabel, Select, MenuItem, TextField,
  Checkbox, FormControlLabel, IconButton, Divider,
  Alert, Chip, Tooltip, alpha, useTheme, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormHelperText, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import {
  Add, Delete, AccessTime, School, MeetingRoom,
  ExpandMore, Save,
  WbSunny, Science,
} from '@mui/icons-material';
import { useFormik, FormikProvider } from 'formik';
import {
  gaetConstraintSchema,
  WEEKDAY_OPTIONS, SESSION_TYPE_OPTIONS, ROOM_TYPE_OPTIONS, SEMESTER_OPTIONS,
  defaultTimeSlot, defaultCourseRequirement, defaultRoom,
} from '../../yupSchema/gaetSchema';

// ─── SESSION TYPE COLORS ─────────────────────────────────────────────────────

const SESSION_COLOR = {
  LECTURE:   '#1976d2',
  TUTORIAL:  '#2e7d32',
  PRACTICAL: '#e65100',
};

// ─── SMALL SHARED FIELD COMPONENTS ───────────────────────────────────────────

const MuiSelect = ({ id, label, value, onChange, options, error, helperText, size = 'small', required }) => (
  <FormControl fullWidth size={size} error={error} required={required}>
    <InputLabel>{label}</InputLabel>
    <Select value={value} onChange={onChange} label={label}>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
      ))}
    </Select>
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);

// ─── SECTION 1: TIME SLOTS ────────────────────────────────────────────────────

const TimeSlotsSection = ({ formik }) => {
  const theme = useTheme();
  const slots = formik.values.timeSlots ?? [];

  const addSlot = () =>
    formik.setFieldValue('timeSlots', [...slots, defaultTimeSlot()]);

  const removeSlot = (idx) =>
    formik.setFieldValue('timeSlots', slots.filter((_, i) => i !== idx));

  const setSlotField = (idx, field, value) => {
    const updated = slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    formik.setFieldValue('timeSlots', updated);
  };

  const topError = formik.touched.timeSlots &&
    typeof formik.errors.timeSlots === 'string' ? formik.errors.timeSlots : null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={700}>
            Available Time Slots
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Define the weekly time windows the algorithm may use.
          </Typography>
        </Stack>
        <Button
          startIcon={<Add />}
          variant="outlined"
          size="small"
          onClick={addSlot}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Add Slot
        </Button>
      </Stack>

      {topError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{topError}</Alert>
      )}

      {slots.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3, textAlign: 'center', borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderStyle: 'dashed',
          }}
        >
          <AccessTime sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No time slots defined. Click "Add Slot" to start.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {slots.map((slot, idx) => {
            const err = formik.errors?.timeSlots?.[idx];
            const tch = formik.touched?.timeSlots?.[idx];
            return (
              <Paper
                key={idx}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: slot.isBreak ? alpha('#ed6c02', 0.04) : 'transparent' }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <MuiSelect
                      label="Day"
                      value={slot.day}
                      onChange={(e) => setSlotField(idx, 'day', e.target.value)}
                      options={WEEKDAY_OPTIONS}
                      error={tch?.day && Boolean(err?.day)}
                      helperText={tch?.day && err?.day}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label="Start (h)"
                      value={slot.startHour}
                      onChange={(e) => setSlotField(idx, 'startHour', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 0, max: 23 } }}
                      error={tch?.startHour && Boolean(err?.startHour)}
                      helperText={tch?.startHour && err?.startHour}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label="End (h)"
                      value={slot.endHour}
                      onChange={(e) => setSlotField(idx, 'endHour', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 1, max: 24 } }}
                      error={tch?.endHour && Boolean(err?.endHour)}
                      helperText={tch?.endHour && err?.endHour}
                    />
                  </Grid>
                  <Grid size={{ xs: 8, sm: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={slot.isBreak}
                          onChange={(e) => setSlotField(idx, 'isBreak', e.target.checked)}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          Break {slot.isBreak && <Chip label="Break" size="small" color="warning" sx={{ ml: 0.5 }} />}
                        </Typography>
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="Remove slot">
                      <IconButton size="small" color="error" onClick={() => removeSlot(idx)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>

                {/* Duration display */}
                {!slot.isBreak && slot.endHour > slot.startHour && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Duration: {(slot.endHour - slot.startHour)}h &nbsp;·&nbsp;
                    {String(slot.startHour).padStart(2, '0')}:00 – {String(slot.endHour).padStart(2, '0')}:00
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

// ─── SECTION 2: COURSE REQUIREMENTS ──────────────────────────────────────────

const CourseRow = ({ idx, cr, formik, teacherOptions, classOptions, subjectOptions }) => {
  const theme   = useTheme();
  const err     = formik.errors?.courseRequirements?.[idx];
  const tch     = formik.touched?.courseRequirements?.[idx];
  const color   = SESSION_COLOR[cr.sessionType] ?? theme.palette.primary.main;

  const set = (field, value) => {
    const updated = (formik.values.courseRequirements ?? []).map((c, i) =>
      i === idx ? { ...c, [field]: value } : c
    );
    formik.setFieldValue('courseRequirements', updated);
  };

  const remove = () =>
    formik.setFieldValue(
      'courseRequirements',
      (formik.values.courseRequirements ?? []).filter((_, i) => i !== idx)
    );

  const label = (() => {
    const subj = subjectOptions?.find((o) => o.value === cr.subjectId)?.label ?? 'New course';
    const cls  = classOptions?.find((o) => o.value === cr.classId)?.label;
    return cls ? `${subj} — ${cls}` : subj;
  })();

  return (
    <Accordion
      variant="outlined"
      sx={{ borderRadius: '12px !important', mb: 1, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMore />} sx={{ borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flex={1} mr={1}>
          <Box
            sx={{
              width: 8, height: 36, borderRadius: 1,
              bgcolor: color, flexShrink: 0,
            }}
          />
          <Box flex={1}>
            <Typography variant="body2" fontWeight={700} noWrap>{label}</Typography>
            <Stack direction="row" spacing={1} mt={0.25}>
              {cr.sessionType && (
                <Chip
                  label={cr.sessionType}
                  size="small"
                  sx={{ bgcolor: alpha(color, 0.12), color, fontWeight: 600, fontSize: '0.65rem', height: 18 }}
                />
              )}
              {cr.hoursPerWeek > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {cr.hoursPerWeek}h/week
                </Typography>
              )}
              {cr.studentCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {cr.studentCount} students
                </Typography>
              )}
            </Stack>
          </Box>
          <Tooltip title="Remove this course requirement">
            <IconButton
              size="small" color="error"
              onClick={(e) => { e.stopPropagation(); remove(); }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {/* Class */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <MuiSelect
              label="Class *"
              value={cr.classId}
              onChange={(e) => set('classId', e.target.value)}
              options={classOptions}
              error={tch?.classId && Boolean(err?.classId)}
              helperText={tch?.classId && err?.classId}
              required
            />
          </Grid>
          {/* Subject */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <MuiSelect
              label="Subject *"
              value={cr.subjectId}
              onChange={(e) => set('subjectId', e.target.value)}
              options={subjectOptions}
              error={tch?.subjectId && Boolean(err?.subjectId)}
              helperText={tch?.subjectId && err?.subjectId}
              required
            />
          </Grid>
          {/* Teacher */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <MuiSelect
              label="Teacher *"
              value={cr.teacherId}
              onChange={(e) => set('teacherId', e.target.value)}
              options={teacherOptions}
              error={tch?.teacherId && Boolean(err?.teacherId)}
              helperText={tch?.teacherId && err?.teacherId}
              required
            />
          </Grid>
          {/* Session Type */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <MuiSelect
              label="Session Type *"
              value={cr.sessionType}
              onChange={(e) => set('sessionType', e.target.value)}
              options={SESSION_TYPE_OPTIONS}
              required
            />
          </Grid>
          {/* Hours/week */}
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField
              fullWidth size="small" type="number" label="h/week *"
              value={cr.hoursPerWeek}
              onChange={(e) => set('hoursPerWeek', Number(e.target.value))}
              slotProps={{ htmlInput: { min: 1, max: 40 } }}
              error={tch?.hoursPerWeek && Boolean(err?.hoursPerWeek)}
              helperText={tch?.hoursPerWeek && err?.hoursPerWeek}
            />
          </Grid>
          {/* Session Duration */}
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField
              fullWidth size="small" type="number" label="Duration (min)"
              value={cr.sessionDuration}
              onChange={(e) => set('sessionDuration', Number(e.target.value))}
              slotProps={{ htmlInput: { min: 30, max: 480 } }}
            />
          </Grid>
          {/* Student Count */}
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField
              fullWidth size="small" type="number" label="Students *"
              value={cr.studentCount}
              onChange={(e) => set('studentCount', Number(e.target.value))}
              slotProps={{ htmlInput: { min: 1 } }}
              error={tch?.studentCount && Boolean(err?.studentCount)}
              helperText={tch?.studentCount && err?.studentCount}
            />
          </Grid>
          {/* Room Type */}
          <Grid size={{ xs: 12, sm: 3 }}>
            <MuiSelect
              label="Room Type"
              value={cr.roomType}
              onChange={(e) => set('roomType', e.target.value)}
              options={ROOM_TYPE_OPTIONS}
            />
          </Grid>
          {/* Toggles */}
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={cr.requiresLab}
                    onChange={(e) => set('requiresLab', e.target.checked)}
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Science sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">Requires Lab</Typography>
                  </Stack>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={cr.preferMorning}
                    onChange={(e) => set('preferMorning', e.target.checked)}
                  />
                }
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <WbSunny sx={{ fontSize: 16, color: '#f59e0b' }} />
                    <Typography variant="body2">Prefer Morning</Typography>
                  </Stack>
                }
              />
            </Stack>
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

const CoursesSection = ({ formik, teacherOptions, classOptions, subjectOptions }) => {
  const theme   = useTheme();
  const courses = formik.values.courseRequirements ?? [];

  const addCourse = () =>
    formik.setFieldValue('courseRequirements', [...courses, defaultCourseRequirement()]);

  const topError = formik.touched.courseRequirements &&
    typeof formik.errors.courseRequirements === 'string'
    ? formik.errors.courseRequirements : null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={700}>
            Course Requirements
            {courses.length > 0 && (
              <Chip label={courses.length} size="small" color="primary" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            One entry per class + subject + teacher combination.
          </Typography>
        </Stack>
        <Button
          startIcon={<Add />} variant="outlined" size="small" onClick={addCourse}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Add Course
        </Button>
      </Stack>

      {topError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{topError}</Alert>
      )}

      {courses.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3, textAlign: 'center', borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderStyle: 'dashed',
          }}
        >
          <School sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No courses defined. Click "Add Course" to create a planning unit.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {courses.map((cr, idx) => (
            <CourseRow
              key={idx}
              idx={idx}
              cr={cr}
              formik={formik}
              teacherOptions={teacherOptions}
              classOptions={classOptions}
              subjectOptions={subjectOptions}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

// ─── SECTION 3: ROOMS ─────────────────────────────────────────────────────────

const RoomsSection = ({ formik }) => {
  const theme = useTheme();
  const rooms = formik.values.roomRegistry ?? [];

  const addRoom = () =>
    formik.setFieldValue('roomRegistry', [...rooms, defaultRoom()]);

  const removeRoom = (idx) =>
    formik.setFieldValue('roomRegistry', rooms.filter((_, i) => i !== idx));

  const setRoomField = (idx, field, value) => {
    const updated = rooms.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    formik.setFieldValue('roomRegistry', updated);
  };

  const topError = formik.touched.roomRegistry &&
    typeof formik.errors.roomRegistry === 'string' ? formik.errors.roomRegistry : null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={700}>
            Room Registry
            {rooms.length > 0 && (
              <Chip label={rooms.length} size="small" color="secondary" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Physical rooms available for timetable allocation.
          </Typography>
        </Stack>
        <Button
          startIcon={<Add />} variant="outlined" size="small" onClick={addRoom}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Add Room
        </Button>
      </Stack>

      {topError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{topError}</Alert>
      )}

      {rooms.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3, textAlign: 'center', borderRadius: 2,
            bgcolor: alpha(theme.palette.secondary.main, 0.03),
            borderStyle: 'dashed',
          }}
        >
          <MeetingRoom sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No rooms defined. Click "Add Room" to register a room.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {rooms.map((room, idx) => {
            const err = formik.errors?.roomRegistry?.[idx];
            const tch = formik.touched?.roomRegistry?.[idx];
            return (
              <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth size="small" label="Room Name *"
                      value={room.name}
                      onChange={(e) => setRoomField(idx, 'name', e.target.value)}
                      placeholder="e.g. Amphi A, Lab 201"
                      error={tch?.name && Boolean(err?.name)}
                      helperText={tch?.name && err?.name}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label="Capacity *"
                      value={room.capacity}
                      onChange={(e) => setRoomField(idx, 'capacity', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 1 } }}
                      error={tch?.capacity && Boolean(err?.capacity)}
                      helperText={tch?.capacity && err?.capacity}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <MuiSelect
                      label="Room Type"
                      value={room.type}
                      onChange={(e) => setRoomField(idx, 'type', e.target.value)}
                      options={ROOM_TYPE_OPTIONS}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                    <Tooltip title="Remove room">
                      <IconButton size="small" color="error" onClick={() => removeRoom(idx)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

// ─── MAIN FORM ────────────────────────────────────────────────────────────────

/**
 * GaetConstraintForm
 *
 * Props:
 *   initialData      — existing GaetConstraint document (edit mode) or null
 *   academicYear     — fixed academic year (controlled by parent)
 *   semester         — fixed semester (controlled by parent)
 *   teacherOptions   — [{ value, label }]
 *   classOptions     — [{ value, label }]
 *   subjectOptions   — [{ value, label }]
 *   onSave           — async ({ timeSlots, courseRequirements, roomRegistry }) => void
 *   saving           — boolean (save in progress)
 *   readOnly         — disable editing (e.g. when PUBLISHED)
 */
const GaetConstraintForm = ({
  initialData,
  academicYear,
  semester,
  teacherOptions = [],
  classOptions   = [],
  subjectOptions = [],
  onSave,
  saving  = false,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const formik = useFormik({
    initialValues: {
      academicYear:       academicYear || initialData?.academicYear || '',
      semester:           semester     || initialData?.semester     || 'S1',
      timeSlots:          initialData?.timeSlots          ?? [],
      courseRequirements: initialData?.courseRequirements ?? [],
      roomRegistry:       initialData?.roomRegistry       ?? [],
    },
    validationSchema: gaetConstraintSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      onSave({
        academicYear: values.academicYear,
        semester:     values.semester,
        timeSlots:          values.timeSlots,
        courseRequirements: values.courseRequirements,
        roomRegistry:       values.roomRegistry,
      });
    },
  });

  // Tab counters + error indicators
  const slotCount   = formik.values.timeSlots?.length          ?? 0;
  const courseCount = formik.values.courseRequirements?.length  ?? 0;
  const roomCount   = formik.values.roomRegistry?.length        ?? 0;

  const slotError   = formik.submitCount > 0 && formik.errors.timeSlots;
  const courseError = formik.submitCount > 0 && formik.errors.courseRequirements;
  const roomError   = formik.submitCount > 0 && formik.errors.roomRegistry;

  return (
    <FormikProvider value={formik}>
      <Box component="form" onSubmit={formik.handleSubmit} noValidate>
        {/* Tabs navigation */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            mb: 3,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { fontWeight: 700 },
          }}
        >
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <AccessTime sx={{ fontSize: 18 }} />
                <span>Time Slots</span>
                {slotCount > 0 && (
                  <Chip label={slotCount} size="small" color={slotError ? 'error' : 'primary'} sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <School sx={{ fontSize: 18 }} />
                <span>Courses</span>
                {courseCount > 0 && (
                  <Chip label={courseCount} size="small" color={courseError ? 'error' : 'primary'} sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <MeetingRoom sx={{ fontSize: 18 }} />
                <span>Rooms</span>
                {roomCount > 0 && (
                  <Chip label={roomCount} size="small" color={roomError ? 'error' : 'secondary'} sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Stack>
            }
          />
        </Tabs>

        {/* Tab panels */}
        <Box sx={{ minHeight: 300 }}>
          {activeTab === 0 && <TimeSlotsSection formik={formik} />}
          {activeTab === 1 && (
            <CoursesSection
              formik={formik}
              teacherOptions={teacherOptions}
              classOptions={classOptions}
              subjectOptions={subjectOptions}
            />
          )}
          {activeTab === 2 && <RoomsSection formik={formik} />}
        </Box>

        {/* Navigation helper */}
        <Stack direction="row" justifyContent="space-between" mt={3} alignItems="center">
          <Stack direction="row" spacing={1}>
            {activeTab > 0 && (
              <Button
                variant="text"
                size="small"
                onClick={() => setActiveTab((t) => t - 1)}
                sx={{ textTransform: 'none' }}
              >
                ← Previous
              </Button>
            )}
            {activeTab < 2 && (
              <Button
                variant="text"
                size="small"
                onClick={() => setActiveTab((t) => t + 1)}
                sx={{ textTransform: 'none' }}
              >
                Next →
              </Button>
            )}
          </Stack>

          {!readOnly && (
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? undefined : <Save />}
              disabled={saving}
              sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3 }}
            >
              {saving ? 'Saving…' : 'Save Configuration'}
            </Button>
          )}
        </Stack>
      </Box>
    </FormikProvider>
  );
};

export default GaetConstraintForm;
