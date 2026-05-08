import { useState, useEffect, useCallback, useContext } from 'react';
import {
  Box, Typography, Tabs, Tab, Stack, Button,
  FormControl, InputLabel, Select, MenuItem,
  Autocomplete, TextField, Alert, Chip, Divider,
  Paper, CircularProgress, Tooltip, IconButton,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Snackbar,
  useTheme,
} from '@mui/material';
import {
  CreditCard, Description, AssignmentInd, CalendarMonth,
  Preview, Print, Refresh, OpenInNew, History,
  People, School,
} from '@mui/icons-material';

import { AuthContext }                from '../../../context/AuthContext';
import { startBatchPrintJob, listPrintJobs } from '../../../services/academic_print.service';
import api                            from '../../../api/axiosInstance';

import AcademicPrintPreviewDialog     from './AcademicPrintPreviewDialog';
import AcademicBatchDrawer            from './AcademicBatchDrawer';
import { fDateTime } from '../../../utils/dateFormat';

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = [
  { value: 'STUDENT_CARD',  label: 'ID Cards',       icon: <CreditCard /> },
  { value: 'TRANSCRIPT',    label: 'Transcripts',    icon: <Description /> },
  { value: 'ENROLLMENT',    label: 'Certificates',   icon: <AssignmentInd /> },
  { value: 'TIMETABLE',     label: 'Timetables',     icon: <CalendarMonth /> },
  { value: 'STUDENT_LIST',  label: 'Student List',   icon: <People /> },
  { value: 'TEACHER_LIST',  label: 'Teacher List',   icon: <School /> },
];

// Types that require only a class selection (no individual student needed)
const CLASS_ONLY_TABS = ['TIMETABLE', 'STUDENT_LIST', 'TEACHER_LIST'];

const CURRENT_YEAR = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
const YEARS = [0, 1, 2].map((i) => {
  const y = new Date().getFullYear() - i;
  return `${y}-${y + 1}`;
});

const STATUS_COLORS = {
  PENDING: 'default', PROCESSING: 'info', DONE: 'success',
  PARTIAL: 'warning', ERROR: 'error',
};

const currentMonday = () => {
  const d   = new Date();
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return d.toISOString().split('T')[0];
};

// ── Component ─────────────────────────────────────────────────────────────────

const AcademicPrintPanel = () => {
  const { user }  = useContext(AuthContext);
  const theme     = useTheme();

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('STUDENT_CARD');

  // ── Shared filters ─────────────────────────────────────────────────────────
  const [classes,        setClasses]        = useState([]);
  const [classId,        setClassId]        = useState('');
  const [academicYear,   setAcademicYear]   = useState(CURRENT_YEAR);
  const [semester,       setSemester]       = useState('S1');
  const [weekStart,      setWeekStart]      = useState(currentMonday());
  const [loadingClasses, setLoadingClasses] = useState(false);

  // ── Student selector (preview of a single student) ─────────────────────────
  const [students,        setStudents]        = useState([]);
  const [studentInput,    setStudentInput]    = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // ── Preview dialog ─────────────────────────────────────────────────────────
  const [previewOpen,    setPreviewOpen]    = useState(false);
  const [previewStudent, setPreviewStudent] = useState(null);

  // ── Batch ──────────────────────────────────────────────────────────────────
  const [batchLoading, setBatchLoading] = useState(false);
  const [activeJobId,  setActiveJobId]  = useState(null);
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  // ── Job history ────────────────────────────────────────────────────────────
  const [jobs,        setJobs]        = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // ── Snackbar ───────────────────────────────────────────────────────────────
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const showSnack = (message, severity = 'info') => setSnack({ open: true, message, severity });

  // ── Load classes ───────────────────────────────────────────────────────────
  // Campus isolation is handled server-side via JWT — no campusId param needed.
  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const res = await api.get('/class', { params: { limit: 200 } });
      setClasses(res.data?.data ?? []);
    } catch {
      showSnack('Could not load classes.', 'error');
    } finally {
      setLoadingClasses(false);
    }
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  // ── Load students (debounced) when class or search changes ─────────────────
  const loadStudents = useCallback(async (search = '') => {
    if (!classId) { setStudents([]); return; }
    setLoadingStudents(true);
    try {
      const res = await api.get('/students', {
        params: { classId, search, status: 'active', limit: 50 },
      });
      setStudents(res.data?.data ?? []);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [classId]);

  useEffect(() => {
    setSelectedStudent(null);
    setStudents([]);
    if (classId) loadStudents('');
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => loadStudents(studentInput), 350);
    return () => clearTimeout(t);
  }, [studentInput, loadStudents]);

  // ── Load job history ────────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await listPrintJobs({ limit: 20 });
      setJobs(res.data?.data ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  // ── Preview ─────────────────────────────────────────────────────────────────
  const handlePreview = () => {
    if (CLASS_ONLY_TABS.includes(tab)) {
      if (!classId) return showSnack('Select a class first.', 'warning');
      setPreviewStudent(null);
      setPreviewOpen(true);
      return;
    }
    if (!selectedStudent) return showSnack('Select a student first.', 'warning');
    if (tab === 'TRANSCRIPT' && (!academicYear || !semester)) {
      return showSnack('Set academic year and semester.', 'warning');
    }
    setPreviewStudent(selectedStudent);
    setPreviewOpen(true);
  };

  const previewParams = {
    academicYear,
    semester,
    weekStart: tab === 'TIMETABLE' ? weekStart : undefined,
  };

  // ── Batch print ─────────────────────────────────────────────────────────────
  const handleBatch = async () => {
    if (!classId) return showSnack('Select a class first.', 'warning');
    if (tab === 'TRANSCRIPT' && (!academicYear || !semester)) {
      return showSnack('Set academic year and semester.', 'warning');
    }

    setBatchLoading(true);
    try {
      const res = await startBatchPrintJob({
        type:   tab,
        classId,
        params: {
          academicYear,
          semester,
          weekStart: tab === 'TIMETABLE' ? weekStart : undefined,
        },
      });
      const jobId = res.data?.data?.jobId;
      setActiveJobId(jobId);
      setDrawerOpen(true);
      showSnack('Batch job started. Track progress in the panel.', 'success');
      loadJobs();
    } catch (err) {
      showSnack(err?.response?.data?.message ?? 'Failed to start batch job.', 'error');
    } finally {
      setBatchLoading(false);
    }
  };

  const selectedClass = classes.find((c) => c._id === classId);

  const previewLabel = CLASS_ONLY_TABS.includes(tab)
    ? (selectedClass?.className || classId)
    : (selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : '');

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box>
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>Academic Documents</Typography>
        <Typography variant="body2" color="text.secondary">
          Generate student ID cards, transcripts, enrollment certificates and class timetables.
          Preview individual documents or batch-print an entire class.
        </Typography>
      </Box>

      {/* ── Document type tabs ─────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setSelectedStudent(null); setStudentInput(''); }}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {TABS.map((t) => (
            <Tab
              key={t.value} value={t.value} label={t.label} icon={t.icon}
              iconPosition="start" sx={{ minHeight: 56 }}
            />
          ))}
        </Tabs>

        <Box p={3}>
          <Stack spacing={2.5}>
            {/* ── Filters row ──────────────────────────────────────────────── */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">

              {/* Class selector */}
              <FormControl size="small" sx={{ minWidth: 220 }} disabled={loadingClasses}>
                <InputLabel>
                  {loadingClasses ? 'Loading classes…' : 'Class'}
                </InputLabel>
                <Select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  label={loadingClasses ? 'Loading classes…' : 'Class'}
                >
                  <MenuItem value=""><em>— Select class —</em></MenuItem>
                  {classes.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Academic year — not shown for TIMETABLE */}
              {tab !== 'TIMETABLE' && (
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    label="Academic Year"
                  >
                    {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                  </Select>
                </FormControl>
              )}

              {/* Semester — only for TRANSCRIPT */}
              {tab === 'TRANSCRIPT' && (
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    label="Semester"
                  >
                    <MenuItem value="S1">Semester 1</MenuItem>
                    <MenuItem value="S2">Semester 2</MenuItem>
                    <MenuItem value="Annual">Annual</MenuItem>
                  </Select>
                </FormControl>
              )}

              {/* Week picker — only for TIMETABLE */}
              {tab === 'TIMETABLE' && (
                <TextField
                  size="small"
                  type="date"
                  label="Week of (Monday)"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 190 }}
                />
              )}
            </Stack>

            {/* ── Student selector (preview only, not for class-level types) ── */}
            {!CLASS_ONLY_TABS.includes(tab) && (
              <Autocomplete
                options={students}
                getOptionLabel={(s) =>
                  `${s.firstName} ${s.lastName}${s.matricule ? ' · ' + s.matricule : ''}`
                }
                value={selectedStudent}
                onChange={(_, v) => setSelectedStudent(v)}
                inputValue={studentInput}
                onInputChange={(_, v) => setStudentInput(v)}
                loading={loadingStudents}
                disabled={!classId}
                noOptionsText={classId ? 'No students found' : 'Select a class first'}
                size="small"
                sx={{ maxWidth: 420 }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Student (for preview)"
                    placeholder="Search by name or matricule…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingStudents && <CircularProgress size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}

            {/* ── Action buttons ─────────────────────────────────────────── */}
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={handlePreview}
                disabled={CLASS_ONLY_TABS.includes(tab) ? !classId : !selectedStudent}
              >
                Preview
              </Button>

              <Button
                variant="contained"
                startIcon={
                  batchLoading
                    ? <CircularProgress size={16} color="inherit" />
                    : <Print />
                }
                onClick={handleBatch}
                disabled={!classId || batchLoading}
              >
                {batchLoading
                  ? 'Starting…'
                  : `Print All${selectedClass ? ' — ' + selectedClass.className : ''}`
                }
              </Button>

              {activeJobId && (
                <Button
                  variant="outlined"
                  startIcon={<OpenInNew />}
                  onClick={() => setDrawerOpen(true)}
                  color="secondary"
                >
                  View Last Job
                </Button>
              )}
            </Stack>

            {/* ── Type-specific hints ────────────────────────────────────── */}
            {tab === 'STUDENT_CARD' && (
              <Alert severity="info" sx={{ mt: 0.5 }}>
                ID cards are generated in CR80 format (85.6×54mm). Each card embeds a QR code
                linking to the student verification URL.
              </Alert>
            )}
            {tab === 'TRANSCRIPT' && (
              <Alert severity="info" sx={{ mt: 0.5 }}>
                Transcripts are fetched from locked semester records (FinalTranscript).
                Make sure the semester has been closed before printing.
              </Alert>
            )}
            {tab === 'TIMETABLE' && (
              <Alert severity="info" sx={{ mt: 0.5 }}>
                The timetable shows all published sessions for the selected week.
                Choose the Monday of the target week above.
              </Alert>
            )}
            {tab === 'STUDENT_LIST' && (
              <Alert severity="info" sx={{ mt: 0.5 }}>
                Generates a printable A4 roster of all active students in the selected class,
                sorted alphabetically. Select a class and click Preview or Print.
              </Alert>
            )}
            {tab === 'TEACHER_LIST' && (
              <Alert severity="info" sx={{ mt: 0.5 }}>
                Generates a printable A4 list of instructors assigned to the selected class,
                derived from scheduled sessions. Select a class and click Preview or Print.
              </Alert>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* ── Job history ─────────────────────────────────────────────────────── */}
      <Paper variant="outlined">
        <Box px={2.5} py={1.5} display="flex" alignItems="center" gap={1}>
          <History fontSize="small" color="action" />
          <Typography variant="subtitle1" fontWeight="bold" flex={1}>Recent Batch Jobs</Typography>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadJobs} disabled={loadingJobs}>
              <Refresh fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />

        {loadingJobs && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={28} />
          </Box>
        )}

        {!loadingJobs && jobs.length === 0 && (
          <Box py={4} textAlign="center">
            <Typography variant="body2" color="text.secondary">No batch jobs yet.</Typography>
          </Box>
        )}

        {!loadingJobs && jobs.length > 0 && (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Year / Semester</TableCell>
                  <TableCell align="center">Total</TableCell>
                  <TableCell align="center">Done</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((j) => (
                  <TableRow key={j.id} hover>
                    <TableCell>
                      <Chip label={j.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {j.params?.academicYear || '—'}
                        {j.params?.semester ? ` · ${j.params.semester}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">{j.progress?.total ?? '—'}</TableCell>
                    <TableCell align="center">
                      {j.progress?.done ?? '—'}
                      {j.progress?.failed > 0 && (
                        <Typography component="span" variant="caption" color="error.main">
                          {' '}({j.progress.failed} failed)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={j.status}
                        color={STATUS_COLORS[j.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {fDateTime(j.startedAt)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<OpenInNew fontSize="small" />}
                        onClick={() => { setActiveJobId(j.id); setDrawerOpen(true); }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* ── Preview Dialog ─────────────────────────────────────────────────── */}
      <AcademicPrintPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        type={tab}
        studentId={!CLASS_ONLY_TABS.includes(tab) ? previewStudent?._id : undefined}
        classId={CLASS_ONLY_TABS.includes(tab) ? classId : undefined}
        params={previewParams}
        label={previewLabel}
      />

      {/* ── Batch Drawer ───────────────────────────────────────────────────── */}
      <AcademicBatchDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        jobId={activeJobId}
      />

      {/* ── Snackbar ───────────────────────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AcademicPrintPanel;
