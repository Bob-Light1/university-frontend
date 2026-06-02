/**
 * @file ScheduleGaet.jsx
 * @description GAET — Générateur Automatique d'Emploi du Temps.
 *              Orchestrator page for the Campus Manager.
 *
 * Workflow (4 steps):
 *   1. Configure constraints (timeSlots, courseRequirements, roomRegistry)
 *   2. Generate (worker thread — poll every 3s)
 *   3. Review quality metrics and conflicts
 *   4. Publish → StudentSchedule + TeacherSchedule
 *
 * Status state machine:
 *   DRAFT → GENERATING → GENERATED | PARTIALLY_GENERATED → PUBLISHED
 *                     → FAILED → (retry)
 *   → CANCELLED → DRAFT
 *
 * Access: CAMPUS_MANAGER only (route guard enforces this).
 * ADMIN / DIRECTOR are read-only — they cannot generate or publish.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Grid, Stack, Typography, Button, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem,
  TextField, Alert, Snackbar, Paper,
  LinearProgress,
  Chip, Avatar, alpha, useTheme,
} from '@mui/material';
import {
  AutoAwesome, CalendarMonth, WarningAmber,
  Refresh, Schedule, CheckCircleOutline,
  EmojiEvents,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

import useGaet          from '../../../hooks/useGaet';
import useFormSnackbar  from '../../../hooks/useFormSnackBar';
import useRelatedData   from '../../../hooks/useRelatedData';
import { useAuth }      from '../../../hooks/useAuth';

import GaetConstraintForm from '../../../components/gaet/GaetConstraintForm';
import GaetQualityPanel   from '../../../components/gaet/GaetQualityPanel';
import GaetGenerateButton from '../../../components/gaet/GaetGenerateButton';
import GaetStatusChip     from '../../../components/gaet/GaetStatusChip';
import GaetWeeklyPreview  from '../../../components/gaet/GaetWeeklyPreview';
import { SEMESTER_OPTIONS } from '../../../yupSchema/gaetSchema';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FORM_ENDPOINTS = {
  teachers: (id) => `/campus/${id}/teachers`,
  classes:  (id) => `/class/campus/${id}`,
  subjects: (id) => `/subject?campusId=${id}`,
};

const currentAcademicYear = () => {
  const y = new Date().getFullYear();
  const m = new Date().getMonth();
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
};

// ─── GENERATING PROGRESS BANNER ──────────────────────────────────────────────

const GeneratingBanner = () => (
  <Alert
    severity="info"
    icon={<Schedule />}
    sx={{ borderRadius: 2, mb: 2 }}
  >
    <Stack spacing={0.75}>
      <Typography variant="body2" fontWeight={700}>
        Timetable generation in progress…
      </Typography>
      <Typography variant="caption" color="text.secondary">
        The algorithm is running in a background thread. This page will update automatically when complete.
      </Typography>
      <LinearProgress color="info" sx={{ borderRadius: 1, mt: 1 }} />
    </Stack>
  </Alert>
);

// ─── CONFLICT PANEL ──────────────────────────────────────────────────────────

const ConflictsPanel = ({ conflicts }) => {
  const theme = useTheme();

  if (!conflicts.conflictCount && !conflicts.unplacedCourses?.length) {
    return (
      <Alert severity="success" icon={<CheckCircleOutline />} sx={{ borderRadius: 2 }}>
        No conflicts detected — all hard constraints satisfied.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {conflicts.conflictCount > 0 && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={700}>
            {conflicts.conflictCount} conflict{conflicts.conflictCount !== 1 ? 's' : ''} detected
          </Typography>
        </Alert>
      )}

      {conflicts.conflicts?.map((c, idx) => (
        <Paper
          key={idx}
          variant="outlined"
          sx={{
            p: 2, borderRadius: 2,
            borderColor: alpha(theme.palette.error.main, 0.3),
            bgcolor: alpha(theme.palette.error.main, 0.04),
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Stack spacing={0.5} flex={1}>
              <Typography variant="body2" fontWeight={700} color="error.main">
                {c.type ?? 'Conflict'}
              </Typography>
              {c.day && (
                <Typography variant="caption" color="text.secondary">
                  Day: {c.day} &nbsp;·&nbsp; {c.startHour}:00 – {c.endHour}:00
                </Typography>
              )}
              {c.message && (
                <Typography variant="caption" color="text.secondary">
                  {c.message}
                </Typography>
              )}
            </Stack>
            <Chip label="Conflict" color="error" size="small" variant="outlined" />
          </Stack>
        </Paper>
      ))}

      {conflicts.unplacedCourses?.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={1} color="warning.dark">
            Unplaced Courses ({conflicts.unplacedCourses.length})
          </Typography>
          <Stack spacing={1}>
            {conflicts.unplacedCourses.map((item, idx) => (
              <Paper
                key={idx}
                variant="outlined"
                sx={{
                  p: 1.5, borderRadius: 2,
                  borderColor: alpha(theme.palette.warning.main, 0.3),
                  bgcolor: alpha(theme.palette.warning.main, 0.04),
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {item.reason ?? 'Could not be placed with current constraints'}
                  </Typography>
                  <Chip label="Unplaced" color="warning" size="small" variant="outlined" />
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

// ─── EMPTY SELECTOR STATE ─────────────────────────────────────────────────────

const EmptyState = () => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        textAlign: 'center', py: 6,
        bgcolor: alpha(theme.palette.primary.main, 0.03),
        borderRadius: 3, border: '2px dashed',
        borderColor: alpha(theme.palette.primary.main, 0.15),
        mb: 3,
      }}
    >
      <Avatar
        sx={{
          mx: 'auto', mb: 2,
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          width: 72, height: 72,
        }}
      >
        <AutoAwesome sx={{ fontSize: 36, color: 'primary.main' }} />
      </Avatar>
      <Typography variant="h5" fontWeight={800} mb={1}>
        No timetable configured
      </Typography>
      <Typography variant="body2" color="text.secondary" maxWidth={420} mx="auto">
        Fill in the form below to configure constraints and generate the timetable for this semester.
      </Typography>
    </Box>
  );
};

// ─── KPI SUMMARY STRIP ───────────────────────────────────────────────────────

const ConstraintSummary = ({ constraint }) => {
  if (!constraint) return null;
  const slots   = constraint.timeSlots?.length          ?? 0;
  const courses = constraint.courseRequirements?.length  ?? 0;
  const rooms   = constraint.roomRegistry?.length        ?? 0;

  const items = [
    { label: 'Time Slots',  value: slots,   color: '#1976d2' },
    { label: 'Courses',     value: courses, color: '#2e7d32' },
    { label: 'Rooms',       value: rooms,   color: '#7b1fa2' },
  ];

  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      {items.map(({ label, value, color }) => (
        <Stack key={label} direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
          <Typography variant="body2" fontWeight={600}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

const ScheduleGaet = () => {
  const { campusId } = useParams();
  const { user }     = useAuth();
  const theme        = useTheme();

  const canWrite = user?.role === 'CAMPUS_MANAGER';

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  // ─ Academic context selectors ─
  const [academicYear, setAcademicYear] = useState(currentAcademicYear);
  const [semester,     setSemester]     = useState('S1');

  // ─ Active tab ─
  const [activeTab, setActiveTab] = useState(0);

  // ─ Related data (teachers, classes, subjects) ─
  const { data: related } = useRelatedData(FORM_ENDPOINTS, campusId);

  const teacherOptions = useMemo(
    () => (related.teachers ?? []).map((t) => ({
      value: t._id, label: `${t.firstName} ${t.lastName}`,
    })),
    [related.teachers]
  );
  const classOptions = useMemo(
    () => (related.classes ?? []).map((c) => ({ value: c._id, label: c.className })),
    [related.classes]
  );
  const subjectOptions = useMemo(
    () => (related.subjects ?? []).map((s) => ({ value: s._id, label: s.subject_name })),
    [related.subjects]
  );

  // ─ GAET hook ─
  const {
    constraint, status, qualityReport, preview, conflicts,
    loading, saving, publishing, error,
    loadConstraint, saveConstraints,
    generate, fetchPreview, fetchConflicts,
    publish, cancelGenerated,
  } = useGaet(campusId);

  // Load constraint when year/semester changes
  useEffect(() => {
    if (academicYear && semester) {
      loadConstraint(academicYear, semester);
      setActiveTab(0);
    }
  }, [academicYear, semester, loadConstraint]);

  // Fetch preview and conflicts when status becomes terminal
  useEffect(() => {
    if (!constraint?._id) return;
    const needsPreview = ['GENERATED', 'PARTIALLY_GENERATED', 'PUBLISHED'].includes(status);
    if (needsPreview) {
      fetchPreview(constraint._id);
      fetchConflicts(constraint._id);
    }
  }, [status, constraint, fetchPreview, fetchConflicts]);

  // ─ Handlers ─

  const handleSave = useCallback(async (formValues) => {
    try {
      await saveConstraints({ academicYear, semester, ...formValues });
      showSnackbar('Constraints saved successfully.', 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }, [saveConstraints, academicYear, semester, showSnackbar]);

  const handleGenerate = useCallback(async () => {
    try {
      await generate(academicYear, semester, showSnackbar);
      setActiveTab(0); // show status while generating
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }, [generate, academicYear, semester, showSnackbar]);

  const handlePublish = useCallback(async () => {
    if (!constraint?._id) return;
    try {
      await publish(constraint._id, showSnackbar);
    } catch {
      // error handled inside hook
    }
  }, [publish, constraint, showSnackbar]);

  const handleCancel = useCallback(async () => {
    if (!constraint?._id) return;
    await cancelGenerated(constraint._id, showSnackbar);
    setActiveTab(0);
  }, [cancelGenerated, constraint, showSnackbar]);

  // ─ Tab config ─

  const hasResult = ['GENERATED', 'PARTIALLY_GENERATED', 'PUBLISHED'].includes(status);

  const tabs = [
    {
      label: 'Configuration',
      icon:  <AutoAwesome sx={{ fontSize: 18 }} />,
      show:  true,
    },
    {
      label:  'Preview',
      icon:   <CalendarMonth sx={{ fontSize: 18 }} />,
      show:   hasResult,
      badge:  hasResult ? preview.length : 0,
    },
    {
      label:  'Quality',
      icon:   <EmojiEvents sx={{ fontSize: 18 }} />,
      show:   hasResult && Boolean(qualityReport),
    },
    {
      label:  'Conflicts',
      icon:   <WarningAmber sx={{ fontSize: 18 }} />,
      show:   hasResult,
      badge:  conflicts?.conflictCount > 0 ? conflicts.conflictCount : 0,
      badgeColor: 'error',
    },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  // Keep activeTab in bounds when tabs change
  const safeActiveTab = Math.min(activeTab, visibleTabs.length - 1);

  // ─ Render ─

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        mb={3}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), width: 44, height: 44 }}>
              <AutoAwesome color="primary" />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight={800} lineHeight={1.2}>
                GAET
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Automatic Timetable Generator
              </Typography>
            </Box>
            {status && <GaetStatusChip status={status} />}
          </Stack>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {canWrite
              ? 'Configure constraints, generate, review and publish your semester timetable.'
              : 'View generated timetables for this campus.'}
          </Typography>
        </Box>

        {/* Generate / Publish actions */}
        {canWrite && constraint && status !== 'GENERATING' && (
          <GaetGenerateButton
            status={status}
            disabled={!constraint?.courseRequirements?.length || !constraint?.timeSlots?.length || !constraint?.roomRegistry?.length}
            disabledMsg="Complete all three constraint sections before generating"
            publishing={publishing}
            onGenerate={handleGenerate}
            onPublish={handlePublish}
            onCancel={handleCancel}
          />
        )}
      </Stack>

      {/* ── Academic context selectors ────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 5, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Academic Year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2024-2025"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Semester</InputLabel>
              <Select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                label="Semester"
              >
                {SEMESTER_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3, md: 5 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
            >
              <ConstraintSummary constraint={constraint} />
              {constraint?.updatedAt && (
                <Typography variant="caption" color="text.disabled" noWrap>
                  Updated {new Date(constraint.updatedAt).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </Typography>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Error alert ──────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Generating progress ───────────────────────────────────────────── */}
      {status === 'GENERATING' && <GeneratingBanner />}

      {/* ── Failed alert ─────────────────────────────────────────────────── */}
      {status === 'FAILED' && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button size="small" startIcon={<Refresh />} onClick={handleGenerate} sx={{ textTransform: 'none' }}>
              Retry
            </Button>
          }
        >
          Generation failed. Verify that your constraints are not over-constrained and retry.
        </Alert>
      )}

      {/* ── Published info ────────────────────────────────────────────────── */}
      {status === 'PUBLISHED' && (
        <Alert
          severity="success"
          icon={<CheckCircleOutline />}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          <Typography variant="body2" fontWeight={600}>
            Timetable published successfully.
          </Typography>
          {constraint?.publishedAt && (
            <Typography variant="caption">
              Published on{' '}
              {new Date(constraint.publishedAt).toLocaleDateString('en-GB', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Typography>
          )}
        </Alert>
      )}

      {/* ── No constraint yet: show info banner + create form ───────────── */}
      {!loading && !constraint && (
        <>
          <EmptyState />
          {canWrite && (
            <GaetConstraintForm
              initialData={null}
              academicYear={academicYear}
              semester={semester}
              teacherOptions={teacherOptions}
              classOptions={classOptions}
              subjectOptions={subjectOptions}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </>
      )}

      {/* ── Main content (tabs) ───────────────────────────────────────────── */}
      {constraint && (
        <>
          {/* Tab bar */}
          <Tabs
            value={safeActiveTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              borderBottom: `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
              '& .Mui-selected': { fontWeight: 700 },
            }}
          >
            {visibleTabs.map((tab) => (
              <Tab
                key={tab.label}
                label={
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge > 0 && (
                      <Chip
                        label={tab.badge}
                        size="small"
                        color={tab.badgeColor ?? 'primary'}
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    )}
                  </Stack>
                }
              />
            ))}
          </Tabs>

          {/* Tab 0: Configuration */}
          {visibleTabs[safeActiveTab]?.label === 'Configuration' && (
            <GaetConstraintForm
              initialData={constraint}
              academicYear={academicYear}
              semester={semester}
              teacherOptions={teacherOptions}
              classOptions={classOptions}
              subjectOptions={subjectOptions}
              onSave={handleSave}
              saving={saving}
              readOnly={!canWrite || status === 'GENERATING' || status === 'PUBLISHED'}
            />
          )}

          {/* Tab 1: Preview */}
          {visibleTabs[safeActiveTab]?.label === 'Preview' && (
            <GaetWeeklyPreview
              sessions={preview}
              courseRequirements={constraint?.courseRequirements}
              subjectOptions={subjectOptions}
              teacherOptions={teacherOptions}
              classOptions={classOptions}
            />
          )}

          {/* Tab 2: Quality */}
          {visibleTabs[safeActiveTab]?.label === 'Quality' && (
            <GaetQualityPanel
              report={qualityReport}
              status={status}
              courseRequirements={constraint?.courseRequirements}
              subjectOptions={subjectOptions}
              classOptions={classOptions}
            />
          )}

          {/* Tab 3: Conflicts */}
          {visibleTabs[safeActiveTab]?.label === 'Conflicts' && (
            <ConflictsPanel conflicts={conflicts} />
          )}
        </>
      )}

      {/* ── Snackbar ─────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={
          snackbar.severity === 'error'   ? null :
          snackbar.severity === 'warning' ? 7000 : 4000
        }
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ScheduleGaet;
