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
import { useTranslation } from 'react-i18next';

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

const GeneratingBanner = () => {
  const { t } = useTranslation('gaet');
  return (
    <Alert
      severity="info"
      icon={<Schedule />}
      sx={{ borderRadius: 2, mb: 2 }}
    >
      <Stack spacing={0.75}>
        <Typography variant="body2" fontWeight={700}>
          {t('banner.generatingTitle')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('banner.generatingBody')}
        </Typography>
        <LinearProgress color="info" sx={{ borderRadius: 1, mt: 1 }} />
      </Stack>
    </Alert>
  );
};

// ─── CONFLICT PANEL ──────────────────────────────────────────────────────────

// Sessions may start/end on a fractional hour (e.g. 9.5 → "09:30").
const fmtHour = (h) => {
  if (h === undefined || h === null) return '—';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const ConflictsPanel = ({ conflicts }) => {
  const theme = useTheme();
  const { t } = useTranslation('gaet');

  if (!conflicts.conflictCount && !conflicts.unplacedCourses?.length) {
    return (
      <Alert severity="success" icon={<CheckCircleOutline />} sx={{ borderRadius: 2 }}>
        {t('conflicts.none')}
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {conflicts.conflictCount > 0 && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="body2" fontWeight={700}>
            {t('conflicts.detected', { count: conflicts.conflictCount })}
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
                {c.type ? t(`conflicts.types.${c.type}`, { defaultValue: c.type }) : t('conflicts.types.fallback')}
              </Typography>
              {c.day && (
                <Typography variant="caption" color="text.secondary">
                  {t('conflicts.day')}: {t(`weekday.${c.day}`, { defaultValue: c.day })} &nbsp;·&nbsp; {fmtHour(c.startHour)} – {fmtHour(c.endHour)}
                </Typography>
              )}
              {c.roomName && (
                <Typography variant="caption" color="text.secondary">
                  {t('conflicts.room')}: {c.roomName}
                </Typography>
              )}
            </Stack>
            <Chip label={t('conflicts.label')} color="error" size="small" variant="outlined" />
          </Stack>
        </Paper>
      ))}

      {conflicts.unplacedCourses?.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={1} color="warning.dark">
            {t('conflicts.unplacedTitle', { count: conflicts.unplacedCourses.length })}
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
                    {item.reason ?? t('conflicts.unplacedDefaultReason')}
                  </Typography>
                  <Chip label={t('conflicts.unplacedLabel')} color="warning" size="small" variant="outlined" />
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
  const { t } = useTranslation('gaet');
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
        {t('empty.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" maxWidth={420} mx="auto">
        {t('empty.body')}
      </Typography>
    </Box>
  );
};

// ─── KPI SUMMARY STRIP ───────────────────────────────────────────────────────

const ConstraintSummary = ({ constraint }) => {
  const { t } = useTranslation('gaet');
  if (!constraint) return null;
  const slots   = constraint.timeSlots?.length          ?? 0;
  const courses = constraint.courseRequirements?.length  ?? 0;
  const rooms   = constraint.roomRegistry?.length        ?? 0;

  const items = [
    { label: t('summary.timeSlots'), value: slots,   color: '#1976d2' },
    { label: t('summary.courses'),   value: courses, color: '#2e7d32' },
    { label: t('summary.rooms'),     value: rooms,   color: '#7b1fa2' },
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
  const { t, i18n }  = useTranslation('gaet');

  const canWrite = user?.role === 'CAMPUS_MANAGER';

  // Localized semester options (values stay sourced from the schema).
  const semesterOptions = useMemo(
    () => SEMESTER_OPTIONS.map((o) => ({ value: o.value, label: t(`semesterOptions.${o.value}`) })),
    [t]
  );

  // Date formatter following the active UI language.
  const formatDate = useCallback(
    (value, options) => new Date(value).toLocaleDateString(i18n.language, options),
    [i18n.language]
  );

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
    }
  }, [academicYear, semester, loadConstraint]);

  // Switch academic context: reload happens via the effect above; reset to the
  // Configuration tab here (in the event handler, not the effect) so the tab
  // change does not trigger a cascading render.
  const handleAcademicYearChange = useCallback((value) => {
    setAcademicYear(value);
    setActiveTab(0);
  }, []);

  const handleSemesterChange = useCallback((value) => {
    setSemester(value);
    setActiveTab(0);
  }, []);

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
      showSnackbar(t('messages.saved'), 'success');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }, [saveConstraints, academicYear, semester, showSnackbar, t]);

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
      key:   'configuration',
      label: t('tabs.configuration'),
      icon:  <AutoAwesome sx={{ fontSize: 18 }} />,
      show:  true,
    },
    {
      key:    'preview',
      label:  t('tabs.preview'),
      icon:   <CalendarMonth sx={{ fontSize: 18 }} />,
      show:   hasResult,
      badge:  hasResult ? preview.length : 0,
    },
    {
      key:    'quality',
      label:  t('tabs.quality'),
      icon:   <EmojiEvents sx={{ fontSize: 18 }} />,
      show:   hasResult && Boolean(qualityReport),
    },
    {
      key:    'conflicts',
      label:  t('tabs.conflicts'),
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
                {t('title')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('subtitle')}
              </Typography>
            </Box>
            {status && <GaetStatusChip status={status} />}
          </Stack>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {canWrite ? t('header.manager') : t('header.viewer')}
          </Typography>
        </Box>

        {/* Generate / Publish actions */}
        {canWrite && constraint && status !== 'GENERATING' && (
          <GaetGenerateButton
            status={status}
            disabled={!constraint?.courseRequirements?.length || !constraint?.timeSlots?.length || !constraint?.roomRegistry?.length}
            disabledMsg={t('actions.disabledHint')}
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
              label={t('context.academicYear')}
              value={academicYear}
              onChange={(e) => handleAcademicYearChange(e.target.value)}
              placeholder={t('context.academicYearPlaceholder')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('context.semester')}</InputLabel>
              <Select
                value={semester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                label={t('context.semester')}
              >
                {semesterOptions.map((o) => (
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
                  {t('context.updated', {
                    date: formatDate(constraint.updatedAt, {
                      day: '2-digit', month: 'short', year: 'numeric',
                    }),
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
              {t('banner.retry')}
            </Button>
          }
        >
          {t('banner.failed')}
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
            {t('banner.publishedTitle')}
          </Typography>
          {constraint?.publishedAt && (
            <Typography variant="caption">
              {t('banner.publishedOn', {
                date: formatDate(constraint.publishedAt, {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                }),
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
                key={tab.key}
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
          {visibleTabs[safeActiveTab]?.key === 'configuration' && (
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
          {visibleTabs[safeActiveTab]?.key === 'preview' && (
            <GaetWeeklyPreview
              sessions={preview}
              courseRequirements={constraint?.courseRequirements}
              subjectOptions={subjectOptions}
              teacherOptions={teacherOptions}
              classOptions={classOptions}
            />
          )}

          {/* Tab 2: Quality */}
          {visibleTabs[safeActiveTab]?.key === 'quality' && (
            <GaetQualityPanel
              report={qualityReport}
              status={status}
              courseRequirements={constraint?.courseRequirements}
              subjectOptions={subjectOptions}
              classOptions={classOptions}
            />
          )}

          {/* Tab 3: Conflicts */}
          {visibleTabs[safeActiveTab]?.key === 'conflicts' && (
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
