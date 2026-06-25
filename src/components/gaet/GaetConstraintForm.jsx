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
  FormHelperText, Accordion, AccordionSummary, AccordionDetails,
  CircularProgress,
} from '@mui/material';
import {
  Add, Delete, AccessTime, School, MeetingRoom,
  ExpandMore, Save,
  WbSunny, Science, Person, EventBusy,
} from '@mui/icons-material';
import { useFormik, FormikProvider } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  gaetConstraintSchema,
  WEEKDAY_OPTIONS, SESSION_TYPE_OPTIONS, ROOM_TYPE_OPTIONS,
  defaultTimeSlot, defaultCourseRequirement, defaultRoom,
  defaultTeacherPreference, defaultUnavailableSlot,
} from '../../yupSchema/gaetSchema';

// Builds localized { value, label } option arrays from the schema's value lists.
// The schema stays the single source of truth for *values*; labels come from i18n.
const localizeOptions = (options, t, prefix) =>
  options.map((o) => ({ value: o.value, label: t(`${prefix}.${o.value}`) }));

// ─── SESSION TYPE COLORS ─────────────────────────────────────────────────────

const SESSION_COLOR = {
  LECTURE:   '#1976d2',
  TUTORIAL:  '#2e7d32',
  PRACTICAL: '#e65100',
};

// ─── SMALL SHARED FIELD COMPONENTS ───────────────────────────────────────────

const MuiSelect = ({ label, value, onChange, options, error, helperText, size = 'small', required }) => (
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
  const { t } = useTranslation('gaet');
  const slots = formik.values.timeSlots ?? [];
  const weekdayOptions = localizeOptions(WEEKDAY_OPTIONS, t, 'weekday');

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
            {t('form.timeSlots.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('form.timeSlots.subtitle')}
          </Typography>
        </Stack>
        <Button
          startIcon={<Add />}
          variant="outlined"
          size="small"
          onClick={addSlot}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {t('form.timeSlots.add')}
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
            {t('form.timeSlots.empty')}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {slots.map((slot, idx) => {
            const err = formik.errors?.timeSlots?.[idx];
            const tch = formik.touched?.timeSlots?.[idx];
            return (
              <Paper
                key={slot._id ?? `ts-${idx}`}
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: slot.isBreak ? alpha('#ed6c02', 0.04) : 'transparent' }}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <MuiSelect
                      label={t('form.timeSlots.day')}
                      value={slot.day}
                      onChange={(e) => setSlotField(idx, 'day', e.target.value)}
                      options={weekdayOptions}
                      error={tch?.day && Boolean(err?.day)}
                      helperText={tch?.day && err?.day}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label={t('form.timeSlots.start')}
                      value={slot.startHour}
                      onChange={(e) => setSlotField(idx, 'startHour', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 0, max: 23 } }}
                      error={tch?.startHour && Boolean(err?.startHour)}
                      helperText={tch?.startHour && err?.startHour}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label={t('form.timeSlots.end')}
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
                          {t('form.timeSlots.break')} {slot.isBreak && <Chip label={t('form.timeSlots.break')} size="small" color="warning" sx={{ ml: 0.5 }} />}
                        </Typography>
                      }
                    />
                  </Grid>
                  <Grid size={{ xs: 4, sm: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title={t('form.timeSlots.removeSlot')}>
                      <IconButton size="small" color="error" onClick={() => removeSlot(idx)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Grid>
                </Grid>

                {/* Duration display */}
                {!slot.isBreak && slot.endHour > slot.startHour && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {t('form.timeSlots.duration', {
                      hours: slot.endHour - slot.startHour,
                      start: `${String(slot.startHour).padStart(2, '0')}:00`,
                      end:   `${String(slot.endHour).padStart(2, '0')}:00`,
                    })}
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
  const { t }   = useTranslation('gaet');
  const err     = formik.errors?.courseRequirements?.[idx];
  const tch     = formik.touched?.courseRequirements?.[idx];
  const color   = SESSION_COLOR[cr.sessionType] ?? theme.palette.primary.main;
  const sessionTypeOptions = localizeOptions(SESSION_TYPE_OPTIONS, t, 'sessionType');
  const roomTypeOptions    = localizeOptions(ROOM_TYPE_OPTIONS, t, 'roomType');

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
    const subj = subjectOptions?.find((o) => o.value === cr.subjectId)?.label ?? t('form.courses.newCourse');
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
                  label={t(`sessionType.${cr.sessionType}`, { defaultValue: cr.sessionType })}
                  size="small"
                  sx={{ bgcolor: alpha(color, 0.12), color, fontWeight: 600, fontSize: '0.65rem', height: 18 }}
                />
              )}
              {cr.hoursPerWeek > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t('form.courses.hoursPerWeekShort', { hours: cr.hoursPerWeek })}
                </Typography>
              )}
              {cr.studentCount > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t('form.courses.studentsShort', { count: cr.studentCount })}
                </Typography>
              )}
            </Stack>
          </Box>
          <Tooltip title={t('form.courses.remove')}>
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
              label={`${t('form.courses.class')} *`}
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
              label={`${t('form.courses.subject')} *`}
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
              label={`${t('form.courses.teacher')} *`}
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
              label={`${t('form.courses.sessionType')} *`}
              value={cr.sessionType}
              onChange={(e) => set('sessionType', e.target.value)}
              options={sessionTypeOptions}
              required
            />
          </Grid>
          {/* Hours/week */}
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField
              fullWidth size="small" type="number" label={`${t('form.courses.hoursPerWeek')} *`}
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
              fullWidth size="small" type="number" label={t('form.courses.duration')}
              value={cr.sessionDuration}
              onChange={(e) => set('sessionDuration', Number(e.target.value))}
              slotProps={{ htmlInput: { min: 30, max: 480 } }}
            />
          </Grid>
          {/* Student Count */}
          <Grid size={{ xs: 6, sm: 2 }}>
            <TextField
              fullWidth size="small" type="number" label={`${t('form.courses.students')} *`}
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
              label={t('form.courses.roomType')}
              value={cr.roomType}
              onChange={(e) => set('roomType', e.target.value)}
              options={roomTypeOptions}
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
                    <Typography variant="body2">{t('form.courses.requiresLab')}</Typography>
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
                    <Typography variant="body2">{t('form.courses.preferMorning')}</Typography>
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
  const { t }   = useTranslation('gaet');
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
            {t('form.courses.title')}
            {courses.length > 0 && (
              <Chip label={courses.length} size="small" color="primary" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('form.courses.subtitle')}
          </Typography>
        </Stack>
        <Button
          startIcon={<Add />} variant="outlined" size="small" onClick={addCourse}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {t('form.courses.add')}
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
            {t('form.courses.empty')}
          </Typography>
        </Paper>
      ) : (
        <Box>
          {courses.map((cr, idx) => (
            <CourseRow
              key={cr._id ?? `cr-${idx}`}
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
  const { t } = useTranslation('gaet');
  const rooms = formik.values.roomRegistry ?? [];
  const roomTypeOptions = localizeOptions(ROOM_TYPE_OPTIONS, t, 'roomType');

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
            {t('form.rooms.title')}
            {rooms.length > 0 && (
              <Chip label={rooms.length} size="small" color="secondary" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('form.rooms.subtitle')}
          </Typography>
        </Stack>
        <Button
          startIcon={<Add />} variant="outlined" size="small" onClick={addRoom}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {t('form.rooms.add')}
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
            {t('form.rooms.empty')}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {rooms.map((room, idx) => {
            const err = formik.errors?.roomRegistry?.[idx];
            const tch = formik.touched?.roomRegistry?.[idx];
            return (
              <Paper key={room._id ?? `room-${idx}`} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth size="small" label={`${t('form.rooms.name')} *`}
                      value={room.name}
                      onChange={(e) => setRoomField(idx, 'name', e.target.value)}
                      placeholder={t('form.rooms.namePlaceholder')}
                      error={tch?.name && Boolean(err?.name)}
                      helperText={tch?.name && err?.name}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 2 }}>
                    <TextField
                      fullWidth size="small" type="number" label={`${t('form.rooms.capacity')} *`}
                      value={room.capacity}
                      onChange={(e) => setRoomField(idx, 'capacity', Number(e.target.value))}
                      slotProps={{ htmlInput: { min: 1 } }}
                      error={tch?.capacity && Boolean(err?.capacity)}
                      helperText={tch?.capacity && err?.capacity}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <MuiSelect
                      label={t('form.rooms.type')}
                      value={room.type}
                      onChange={(e) => setRoomField(idx, 'type', e.target.value)}
                      options={roomTypeOptions}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                    <Tooltip title={t('form.rooms.remove')}>
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

// ─── SECTION 4: TEACHER PREFERENCES ──────────────────────────────────────────

const TeacherPrefRow = ({ idx, pref, formik, teacherOptions }) => {
  const { t } = useTranslation('gaet');
  const err   = formik.errors?.teacherPreferences?.[idx];
  const tch   = formik.touched?.teacherPreferences?.[idx];
  const weekdayOptions = localizeOptions(WEEKDAY_OPTIONS, t, 'weekday');

  const setField = (field, value) => {
    const updated = (formik.values.teacherPreferences ?? []).map((p, i) =>
      i === idx ? { ...p, [field]: value } : p
    );
    formik.setFieldValue('teacherPreferences', updated);
  };

  const remove = () =>
    formik.setFieldValue(
      'teacherPreferences',
      (formik.values.teacherPreferences ?? []).filter((_, i) => i !== idx)
    );

  const slots      = pref.unavailableSlots ?? [];
  const addSlot    = () => setField('unavailableSlots', [...slots, defaultUnavailableSlot()]);
  const removeSlot = (j) => setField('unavailableSlots', slots.filter((_, i) => i !== j));
  const setSlot    = (j, field, value) =>
    setField('unavailableSlots', slots.map((s, i) => (i === j ? { ...s, [field]: value } : s)));

  const togglePreferredDay = (day) => {
    const current = pref.preferredDays ?? [];
    setField('preferredDays', current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day]);
  };

  const teacherLabel =
    teacherOptions?.find((o) => o.value === pref.teacherId)?.label ?? t('form.teacherPrefs.newTeacher');

  return (
    <Accordion
      variant="outlined"
      sx={{ borderRadius: '12px !important', mb: 1, '&:before': { display: 'none' } }}
    >
      <AccordionSummary expandIcon={<ExpandMore />} sx={{ borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5} flex={1} mr={1}>
          <Person sx={{ color: 'primary.main' }} />
          <Box flex={1}>
            <Typography variant="body2" fontWeight={700} noWrap>{teacherLabel}</Typography>
            <Stack direction="row" spacing={1.5} mt={0.25}>
              {slots.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t('form.teacherPrefs.slotsCount', { count: slots.length })}
                </Typography>
              )}
              {(pref.preferredDays?.length ?? 0) > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t('form.teacherPrefs.preferredCount', { count: pref.preferredDays.length })}
                </Typography>
              )}
            </Stack>
          </Box>
          <Tooltip title={t('form.teacherPrefs.remove')}>
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
          {/* Teacher */}
          <Grid size={{ xs: 12, sm: 7 }}>
            <MuiSelect
              label={`${t('form.teacherPrefs.teacher')} *`}
              value={pref.teacherId}
              onChange={(e) => setField('teacherId', e.target.value)}
              options={teacherOptions}
              error={tch?.teacherId && Boolean(err?.teacherId)}
              helperText={tch?.teacherId && err?.teacherId}
              required
            />
          </Grid>
          {/* Max consecutive hours */}
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              fullWidth size="small" type="number"
              label={t('form.teacherPrefs.maxConsecutive')}
              value={pref.maxConsecutiveHours}
              onChange={(e) => setField('maxConsecutiveHours', Number(e.target.value))}
              slotProps={{ htmlInput: { min: 1, max: 12 } }}
              error={tch?.maxConsecutiveHours && Boolean(err?.maxConsecutiveHours)}
              helperText={(tch?.maxConsecutiveHours && err?.maxConsecutiveHours) || t('form.teacherPrefs.maxConsecutiveHelp')}
            />
          </Grid>

          {/* Preferred days */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {t('form.teacherPrefs.preferredDays')}
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap mt={0.5}>
              {weekdayOptions.map((d) => {
                const active = (pref.preferredDays ?? []).includes(d.value);
                return (
                  <Chip
                    key={d.value}
                    label={d.label}
                    size="small"
                    color={active ? 'primary' : 'default'}
                    variant={active ? 'filled' : 'outlined'}
                    onClick={() => togglePreferredDay(d.value)}
                    sx={{ cursor: 'pointer' }}
                  />
                );
              })}
            </Stack>
          </Grid>

          {/* Unavailable slots */}
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <EventBusy sx={{ fontSize: 16, color: 'error.main' }} />
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  {t('form.teacherPrefs.unavailable')}
                </Typography>
              </Stack>
              <Button startIcon={<Add />} size="small" onClick={addSlot} sx={{ textTransform: 'none' }}>
                {t('form.teacherPrefs.addSlot')}
              </Button>
            </Stack>
            {slots.length === 0 ? (
              <Typography variant="caption" color="text.disabled">
                {t('form.teacherPrefs.noSlots')}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {slots.map((slot, j) => {
                  const sErr = err?.unavailableSlots?.[j];
                  const sTch = tch?.unavailableSlots?.[j];
                  return (
                    <Grid container spacing={1} key={j} alignItems="center">
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <MuiSelect
                          label={t('form.teacherPrefs.day')}
                          value={slot.day}
                          onChange={(e) => setSlot(j, 'day', e.target.value)}
                          options={weekdayOptions}
                        />
                      </Grid>
                      <Grid size={{ xs: 5, sm: 3 }}>
                        <TextField
                          fullWidth size="small" type="number" label={t('form.teacherPrefs.slotStart')}
                          value={slot.startHour}
                          onChange={(e) => setSlot(j, 'startHour', Number(e.target.value))}
                          slotProps={{ htmlInput: { min: 0, max: 23 } }}
                          error={sTch?.startHour && Boolean(sErr?.startHour)}
                          helperText={sTch?.startHour && sErr?.startHour}
                        />
                      </Grid>
                      <Grid size={{ xs: 5, sm: 3 }}>
                        <TextField
                          fullWidth size="small" type="number" label={t('form.teacherPrefs.slotEnd')}
                          value={slot.endHour}
                          onChange={(e) => setSlot(j, 'endHour', Number(e.target.value))}
                          slotProps={{ htmlInput: { min: 1, max: 24 } }}
                          error={sTch?.endHour && Boolean(sErr?.endHour)}
                          helperText={sTch?.endHour && sErr?.endHour}
                        />
                      </Grid>
                      <Grid size={{ xs: 2, sm: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title={t('form.teacherPrefs.removeSlot')}>
                          <IconButton size="small" color="error" onClick={() => removeSlot(j)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  );
                })}
              </Stack>
            )}
          </Grid>
        </Grid>
      </AccordionDetails>
    </Accordion>
  );
};

const TeacherPreferencesSection = ({ formik, teacherOptions }) => {
  const theme = useTheme();
  const { t } = useTranslation('gaet');
  const prefs = formik.values.teacherPreferences ?? [];

  const addPref = () =>
    formik.setFieldValue('teacherPreferences', [...prefs, defaultTeacherPreference()]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Stack spacing={0.25}>
          <Typography variant="subtitle2" fontWeight={700}>
            {t('form.teacherPrefs.title')}
            {prefs.length > 0 && (
              <Chip label={prefs.length} size="small" color="primary" sx={{ ml: 1 }} />
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('form.teacherPrefs.subtitle')}
          </Typography>
        </Stack>
        <Button
          startIcon={<Add />} variant="outlined" size="small" onClick={addPref}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {t('form.teacherPrefs.add')}
        </Button>
      </Stack>

      {prefs.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3, textAlign: 'center', borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.03),
            borderStyle: 'dashed',
          }}
        >
          <Person sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {t('form.teacherPrefs.empty')}
          </Typography>
        </Paper>
      ) : (
        <Box>
          {prefs.map((pref, idx) => (
            <TeacherPrefRow
              key={pref._id ?? `tp-${idx}`}
              idx={idx}
              pref={pref}
              formik={formik}
              teacherOptions={teacherOptions}
            />
          ))}
        </Box>
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
  const { t } = useTranslation('gaet');
  const [activeTab, setActiveTab] = useState(0);

  // Backend returns semesterStartDate as an ISO datetime; <input type="date">
  // needs a plain YYYY-MM-DD value.
  const toDateInput = (v) => (v ? String(v).slice(0, 10) : '');

  const formik = useFormik({
    initialValues: {
      academicYear:       academicYear || initialData?.academicYear || '',
      semester:           semester     || initialData?.semester     || 'S1',
      semesterStartDate:  toDateInput(initialData?.semesterStartDate),
      timeSlots:          initialData?.timeSlots          ?? [],
      courseRequirements: initialData?.courseRequirements ?? [],
      roomRegistry:       initialData?.roomRegistry       ?? [],
      teacherPreferences: initialData?.teacherPreferences ?? [],
    },
    validationSchema: gaetConstraintSchema,
    enableReinitialize: true,
    onSubmit: (values) => {
      onSave({
        academicYear: values.academicYear,
        semester:     values.semester,
        semesterStartDate:  values.semesterStartDate || null,
        timeSlots:          values.timeSlots,
        courseRequirements: values.courseRequirements,
        roomRegistry:       values.roomRegistry,
        teacherPreferences: values.teacherPreferences,
      });
    },
  });

  // Tab counters + error indicators
  const slotCount   = formik.values.timeSlots?.length          ?? 0;
  const courseCount = formik.values.courseRequirements?.length  ?? 0;
  const roomCount   = formik.values.roomRegistry?.length        ?? 0;
  const prefCount   = formik.values.teacherPreferences?.length  ?? 0;

  const slotError   = formik.submitCount > 0 && formik.errors.timeSlots;
  const courseError = formik.submitCount > 0 && formik.errors.courseRequirements;
  const roomError   = formik.submitCount > 0 && formik.errors.roomRegistry;
  const prefError   = formik.submitCount > 0 && formik.errors.teacherPreferences;

  const LAST_TAB = 3;

  return (
    <FormikProvider value={formik}>
      <Box component="form" onSubmit={formik.handleSubmit} noValidate>
        {/* Semester start date — anchors published sessions to the academic calendar */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 5, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label={t('form.semesterStart.label')}
              value={formik.values.semesterStartDate}
              onChange={(e) => formik.setFieldValue('semesterStartDate', e.target.value)}
              onBlur={() => formik.setFieldTouched('semesterStartDate', true)}
              slotProps={{ inputLabel: { shrink: true } }}
              error={formik.touched.semesterStartDate && Boolean(formik.errors.semesterStartDate)}
              helperText={
                (formik.touched.semesterStartDate && formik.errors.semesterStartDate) ||
                t('form.semesterStart.helper')
              }
            />
          </Grid>
        </Grid>

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
                <span>{t('form.timeSlots.tab')}</span>
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
                <span>{t('form.courses.tab')}</span>
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
                <span>{t('form.rooms.tab')}</span>
                {roomCount > 0 && (
                  <Chip label={roomCount} size="small" color={roomError ? 'error' : 'secondary'} sx={{ height: 18, fontSize: '0.65rem' }} />
                )}
              </Stack>
            }
          />
          <Tab
            label={
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Person sx={{ fontSize: 18 }} />
                <span>{t('form.teacherPrefs.tab')}</span>
                {prefCount > 0 && (
                  <Chip label={prefCount} size="small" color={prefError ? 'error' : 'primary'} sx={{ height: 18, fontSize: '0.65rem' }} />
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
          {activeTab === 3 && (
            <TeacherPreferencesSection formik={formik} teacherOptions={teacherOptions} />
          )}
        </Box>

        {/* Navigation helper */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent={{ xs: 'flex-start', sm: 'space-between' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          mt={3}
          spacing={{ xs: 1.5, sm: 0 }}
        >
          <Stack direction="row" spacing={1}>
            {activeTab > 0 && (
              <Button
                variant="text"
                size="small"
                onClick={() => setActiveTab((prev) => prev - 1)}
                sx={{ textTransform: 'none' }}
              >
                ← {t('form.nav.previous')}
              </Button>
            )}
            {activeTab < LAST_TAB && (
              <Button
                variant="text"
                size="small"
                onClick={() => setActiveTab((prev) => prev + 1)}
                sx={{ textTransform: 'none' }}
              >
                {t('form.nav.next')} →
              </Button>
            )}
          </Stack>

          {!readOnly && (
            <Button
              type="submit"
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              disabled={saving}
              sx={{
                fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {saving ? t('form.saving') : t('form.save')}
            </Button>
          )}
        </Stack>
      </Box>
    </FormikProvider>
  );
};

export default GaetConstraintForm;
