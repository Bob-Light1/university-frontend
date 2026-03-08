/**
 * @file ResultTeacher.jsx
 * @description Results management page for TEACHER role.
 *
 * Features:
 *  - List of own results (filtered by teacher ID from auth context)
 *  - Create single result / Bulk entry for a class
 *  - Edit DRAFT results
 *  - Submit DRAFT → SUBMITTED (individually or batch)
 *  - View class statistics (distribution chart)
 *  - View retake-eligible students
 *  - Detail drawer (read-only for SUBMITTED/PUBLISHED)
 *
 * Data loading strategy:
 *  - classes:  GET /class/teacher/:teacherId
 *              Returns classes where the teacher is classManager OR in teachers[].
 *              Campus isolation enforced server-side via JWT.
 *  - subjects: GET /subject  (scoped to teacher's campus via JWT campusId)
 *  - students: Loaded ON-DEMAND when a class is selected in a form, via
 *              GET /students?classId=:id  —  avoids loading hundreds of
 *              students at mount when only one class will be needed.
 *
 * Security: The backend enforces teacher isolation:
 *  - getResults:          filter by req.user.id — teacher sees only own results
 *  - submit:              only own results (result.teacher === req.user.id)
 *  - getClassesByTeacher: verifies req.user.id === teacherId param (see class_controller)
 */

import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Typography, Grid, Button, Stack, Alert, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, IconButton, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, Tab, Tabs,
} from '@mui/material';
import {
  Add, Send, Refresh, Visibility, Edit, BarChart,
  PlaylistAddCheck, CloudUpload, Delete,
} from '@mui/icons-material';
import {
  BarChart as RechartBar, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';

import { AuthContext } from '../../../context/AuthContext';
import KPICards from '../../../components/shared/KpiCard';

import useResult from '../../../hooks/useResult';
import {
  getResultById, listGradingScales,
  getClassStatistics, getRetakeList,
} from '../../../services/result.service';
import api from '../../../api/axiosInstance';

import ResultFilters      from '../../../components/results/ResultFilters';
import ResultForm         from '../../../components/results/ResultForm';
import BulkResultForm     from '../../../components/results/BulkResultForm';
import ResultDetailDrawer from '../../../components/results/ResultDetailDrawer';
import {
  ResultStatusChip, EvalTypeChip, ScoreDisplay, ResultEmptyState,
} from '../../../components/results/ResultShared';

// ─── Component ────────────────────────────────────────────────────────────────

const ResultTeacher = () => {
  const { user } = useContext(AuthContext);
  const teacherId = user?._id ?? user?.id ?? '';
  const campusId  = user?.campusId ?? user?.schoolCampus ?? '';

  const {
    results, summary, loading, error,
    pagination, filters,
    fetch, handleFilterChange, handleReset, setPage,
    create, update, remove, bulkCreate,
    submit, submitAllBatch,
  } = useResult('teacher', { teacherId });

  const [tab, setTab] = useState(0);

  // ── Reference data (loaded once at mount) ─────────────────────────────────
  const [classes,       setClasses]       = useState([]);
  const [subjects,      setSubjects]      = useState([]);
  const [gradingScales, setGradingScales] = useState([]);
  const [refLoading,    setRefLoading]    = useState(false);
  const [refError,      setRefError]      = useState('');

  // ── Students (loaded on-demand per form — isolated to avoid cross-form contamination) ──
  const [singleStudents,  setSingleStudents]  = useState([]);
  const [bulkStudents,    setBulkStudents]    = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // ── Modal / drawer state ───────────────────────────────────────────────────
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailOpen,     setDetailOpen]     = useState(false);
  const [formOpen,       setFormOpen]       = useState(false);
  const [bulkOpen,       setBulkOpen]       = useState(false);
  const [editTarget,     setEditTarget]     = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleteLoading,  setDeleteLoading]  = useState(false);

  // ── Analytics ──────────────────────────────────────────────────────────────
  const [statistics, setStatistics] = useState(null);
  const [retakeList, setRetakeList] = useState([]);

  const [snackMsg, setSnackMsg] = useState('');

  // ── Load reference data at mount ──────────────────────────────────────────
  useEffect(() => {
    if (!teacherId) return;

    const load = async () => {
      setRefLoading(true);
      setRefError('');
      try {
        const [cls, sub, scales] = await Promise.all([
          // GET /class/teacher/:teacherId
          // Fixed backend: queries classManager OR teachers[] with campus isolation.
          // Response: sendSuccess → { success, message, data: Class[] }
          api.get(`/class/teacher/${teacherId}`),

          // GET /subject — buildCampusFilter(TEACHER) → { schoolCampus: user.campusId }
          // isActive=true excludes archived subjects.
          // Response: sendPaginated → { success, message, data: Subject[], pagination }
          api.get('/subject', { params: { limit: 100, isActive: true } }),

          // GET /results/grading-scales — campus-scoped by backend
          listGradingScales(),
        ]);

        // sendSuccess wraps array directly in .data
        setClasses(cls.data?.data ?? []);

        // sendPaginated wraps array in .data as well
        setSubjects(sub.data?.data ?? []);

        // Handle both sendSuccess and sendPaginated shapes defensively
        setGradingScales(
          scales.data?.data ?? scales.data?.records ?? []
        );

      } catch (err) {
        console.error('ResultTeacher: failed to load reference data', err);
        setRefError('Failed to load form data. Please refresh the page.');
      } finally {
        setRefLoading(false);
      }
    };

    load();
  }, [teacherId]);

  // ── Load students on-demand when teacher selects a class ──────────────────
  /**
   * fetchStudentsByClass — called by ResultForm.onClassChange and
   * BulkResultForm.onClassChange when the Class select changes.
   *
   * The `formType` parameter isolates the student list per form so that
   * switching classes in BulkResultForm never contaminates ResultForm's list
   * and vice versa. This prevents the "wrong student" data-integrity bug.
   *
   * @param {string} classId  — selected class _id, or '' to clear
   * @param {'single'|'bulk'} formType — which form triggered the load
   */
  const fetchStudentsByClass = useCallback(async (classId, formType = 'single') => {
    const setter = formType === 'bulk' ? setBulkStudents : setSingleStudents;
    if (!classId) {
      setter([]);
      return;
    }
    setStudentsLoading(true);
    try {
      // sendPaginated → { success, message, data: Student[], pagination }
      const res = await api.get('/students', {
        params: { classId, status: 'active', limit: 200 },
      });
      setter(res.data?.data ?? []);
    } catch (err) {
      console.error('ResultTeacher: failed to load students for class', classId, err);
      setter([]);
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  // ── Open full result detail ────────────────────────────────────────────────
  const openDetail = async (id) => {
    try {
      const res = await getResultById(id);
      setSelectedResult(res.data?.data ?? null);
      setDetailOpen(true);
    } catch { /* silent */ }
  };

  // ── Load class stats (tab 1) ───────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 1 || !filters.classId || !filters.subjectId) return;
    const load = async () => {
      try {
        const res = await getClassStatistics(filters.classId, {
          subjectId:       filters.subjectId,
          evaluationTitle: filters.evaluationTitle ?? '',
          academicYear:    filters.academicYear,
          semester:        filters.semester,
        });
        setStatistics(res.data?.data ?? null);
      } catch { setStatistics(null); }
    };
    load();
  }, [tab, filters]);

  // ── Load retake list (tab 2) ───────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 2 || !filters.classId || !filters.academicYear || !filters.semester) return;
    const load = async () => {
      try {
        const res = await getRetakeList(filters.classId, {
          subjectId:    filters.subjectId || undefined,
          academicYear: filters.academicYear,
          semester:     filters.semester,
        });
        const raw = res.data?.data;
        setRetakeList(Array.isArray(raw) ? raw : raw?.students ?? []);
      } catch { setRetakeList([]); }
    };
    load();
  }, [tab, filters]);

  // ── Batch submit ───────────────────────────────────────────────────────────
  const handleSubmitBatch = async () => {
    if (!filters.classId || !filters.subjectId || !filters.academicYear || !filters.semester) {
      setSnackMsg('Set class, subject, academic year and semester filters first.');
      return;
    }
    const res = await submitAllBatch({
      classId:         filters.classId,
      subjectId:       filters.subjectId,
      evaluationTitle: filters.evaluationTitle ?? '',
      academicYear:    filters.academicYear,
      semester:        filters.semester,
    });
    setSnackMsg(res?.message ?? 'Batch submitted.');
  };

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try { await remove(deleteTarget._id); }
    finally { setDeleteTarget(null); setDeleteLoading(false); }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────

  // Single-element teachers array: for TEACHER role only self can create results
  const selfAsTeacher = [{
    _id:       teacherId,
    firstName: user?.firstName ?? '',
    lastName:  user?.lastName  ?? '',
  }];

  // ── KPI metrics ───────────────────────────────────────────────────────────
  const kpiMetrics = [
    { key: 'total',     label: 'My Results',    value: pagination.total ?? summary.total,
      icon: <BarChart />, color: '#3b82f6' },
    { key: 'draft',     label: 'Drafts',        value: summary.draft,
      icon: <Edit />,     color: '#94a3b8' },
    { key: 'submitted', label: 'Submitted',     value: summary.submitted,
      icon: <Send />,     color: '#f97316' },
    { key: 'avg',       label: 'Class Avg /20', value: summary.avg?.toFixed(2) ?? '—',
      icon: <PlaylistAddCheck />, color: '#10b981' },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>My Results</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage grades for your classes and subjects
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button size="small" startIcon={<Refresh />} onClick={fetch} disabled={loading}>
            Refresh
          </Button>
          <Button size="small" variant="outlined" startIcon={<CloudUpload />}
            onClick={() => { setBulkStudents([]); setBulkOpen(true); }}>
            Bulk Entry
          </Button>
          <Button size="small" variant="outlined" color="warning"
            startIcon={<Send />} onClick={handleSubmitBatch}>
            Submit Batch
          </Button>
          <Button variant="contained" size="small" startIcon={<Add />}
            onClick={() => { setSingleStudents([]); setEditTarget(null); setFormOpen(true); }}>
            New Result
          </Button>
        </Stack>
      </Stack>

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <Box mb={3}>
        <KPICards metrics={kpiMetrics} loading={loading} />
      </Box>

      {/* ── Alerts ─────────────────────────────────────────────────────── */}
      {snackMsg && (
        <Alert severity="info" onClose={() => setSnackMsg('')} sx={{ mb: 2 }}>
          {snackMsg}
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {refError && (
        <Alert severity="warning" sx={{ mb: 2 }}
          action={<Button size="small" onClick={() => window.location.reload()}>Retry</Button>}>
          {refError}
        </Alert>
      )}

      {/* ── Filters ────────────────────────────────────────────────────── */}
      <ResultFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        mode="teacher"
        classes={classes}
        subjects={subjects}
        loading={loading}
      />

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Results" />
        <Tab label="Class Statistics" />
        <Tab label="Retake List" />
      </Tabs>

      {/* ── Tab 0: Results table ───────────────────────────────────────── */}
      {tab === 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Evaluation</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <ResultEmptyState
                        message="No results found"
                        subtext="Use 'New Result' or 'Bulk Entry' to create grades."
                      />
                    </TableCell>
                  </TableRow>
                ) : results.map((r) => (
                  <TableRow key={r._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {r.student?.firstName} {r.student?.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.student?.matricule}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.subject?.subject_name ?? '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <EvalTypeChip type={r.evaluationType} />
                      <Typography variant="caption" display="block" mt={0.25}>
                        {r.evaluationTitle}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{r.semester} {r.academicYear}</Typography>
                    </TableCell>
                    <TableCell>
                      <ScoreDisplay score={r.normalizedScore} rawScore={r.score} maxScore={r.maxScore} />
                    </TableCell>
                    <TableCell>
                      <ResultStatusChip status={r.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => openDetail(r._id)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {r.status === 'DRAFT' && (
                        <>
                          <Tooltip title="Submit for review">
                            <span>
                              <IconButton size="small" color="warning"
                                onClick={() => submit(r._id)}>
                                <Send fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <span>
                              <IconButton size="small"
                                onClick={() => {
                                  // Extract the class ID (may be a populated object from the list response)
                                  const classId = r.class?._id ?? r.class ?? '';
                                  // Pre-fetch students for the class so the Student select
                                  // is populated when the edit dialog opens
                                  setSingleStudents([]);
                                  if (classId) fetchStudentsByClass(classId, 'single');
                                  setEditTarget(r);
                                  setFormOpen(true);
                                }}>
                                <Edit fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <span>
                              <IconButton size="small" color="error"
                                onClick={() => setDeleteTarget(r)}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={pagination.total}
            page={(pagination.page ?? 1) - 1}
            rowsPerPage={pagination.limit ?? 50}
            rowsPerPageOptions={[25, 50, 100]}
            onPageChange={(_, p) => setPage(p + 1)}
            onRowsPerPageChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
          />
        </Paper>
      )}

      {/* ── Tab 1: Class statistics ─────────────────────────────────────── */}
      {tab === 1 && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          {!statistics ? (
            <Alert severity="info">
              Select a class, subject, academic year and semester to see the score distribution.
            </Alert>
          ) : (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={700}>{statistics.count}</Typography>
                  <Typography variant="caption" color="text.secondary">Students</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={700}>{statistics.mean}</Typography>
                  <Typography variant="caption" color="text.secondary">Class Average /20</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={700}>{statistics.passingRate}%</Typography>
                  <Typography variant="caption" color="text.secondary">Pass Rate</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box textAlign="center">
                  <Typography variant="h4" fontWeight={700}>{statistics.stdDev}</Typography>
                  <Typography variant="caption" color="text.secondary">Std Dev</Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>Score Distribution</Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartBar data={statistics.distribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <RTooltip />
                    <Bar dataKey="count" fill="#3b82f6" name="Students" radius={[3, 3, 0, 0]} />
                  </RechartBar>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          )}
        </Paper>
      )}

      {/* ── Tab 2: Retake list ──────────────────────────────────────────── */}
      {tab === 2 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {!filters.classId || !filters.academicYear || !filters.semester ? (
            <Box p={4}>
              <Alert severity="info">
                Select a class, academic year and semester to view retake-eligible students.
              </Alert>
            </Box>
          ) : retakeList.length === 0 ? (
            <ResultEmptyState
              message="No students eligible for retake"
              subtext="All students passed, or no results found for the selected filters."
            />
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Score /20</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {retakeList.map((r) => (
                  <TableRow key={r._id} hover>
                    <TableCell>
                      {r.student?.firstName} {r.student?.lastName}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {r.student?.matricule}
                      </Typography>
                    </TableCell>
                    <TableCell>{r.subject?.subject_name}</TableCell>
                    <TableCell>
                      <ScoreDisplay score={r.normalizedScore} rawScore={r.score} maxScore={r.maxScore} />
                    </TableCell>
                    <TableCell>
                      <Chip label="Retake Eligible" color="warning" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {/*
       * ResultForm — single result creation / edit.
       *
       * students:       populated on-demand via onClassChange → singleStudents.
       *                 Isolated from BulkResultForm's student list.
       * studentsLoading: forwarded so the Student select can show a loading hint.
       * teachers:       single-element array containing only the logged-in teacher.
       *                 Pre-filled via defaultTeacherId.
       */}
      <ResultForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); setSingleStudents([]); }}
        onSubmit={
          editTarget
            ? (values) => update(editTarget._id, values)
            : (values) => create(values)
        }
        initialValues={editTarget}
        campusId={campusId}
        mode={editTarget ? 'edit' : 'create'}
        classes={classes}
        subjects={subjects}
        teachers={selfAsTeacher}
        students={singleStudents}
        studentsLoading={studentsLoading}
        gradingScales={gradingScales}
        defaultTeacherId={teacherId}
        readonlyTeacher
        onClassChange={(classId) => {
          setSingleStudents([]);                      // clear immediately on class change
          fetchStudentsByClass(classId, 'single');    // load for single form only
        }}
      />

      {/*
       * BulkResultForm — bulk creation for a whole class.
       *
       * students:       populated on-demand via onClassChange → bulkStudents.
       *                 Isolated from ResultForm's student list.
       * studentsLoading: forwarded so the form can disable Next while loading.
       */}
      <BulkResultForm
        open={bulkOpen}
        onClose={() => { setBulkOpen(false); setBulkStudents([]); }}
        onSubmit={bulkCreate}
        campusId={campusId}
        classes={classes}
        subjects={subjects}
        teachers={selfAsTeacher}
        students={bulkStudents}
        studentsLoading={studentsLoading}
        gradingScales={gradingScales}
        defaultTeacherId={teacherId}
        onClassChange={(classId) => {
          setBulkStudents([]);                      // clear immediately on class change
          fetchStudentsByClass(classId, 'bulk');    // load for bulk form only
        }}
      />

      {/* ── Delete confirm ──────────────────────────────────────────────── */}
      {deleteTarget && (
        <Dialog open onClose={() => setDeleteTarget(null)} maxWidth="xs">
          <DialogTitle>Delete Result</DialogTitle>
          <DialogContent>
            <Alert severity="warning">
              Delete DRAFT result for{' '}
              <strong>
                {deleteTarget.student?.firstName} {deleteTarget.student?.lastName}
              </strong>?
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={16} /> : <Delete />}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* ── Detail drawer ───────────────────────────────────────────────── */}
      <ResultDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        result={selectedResult}
        onSubmit={submit}
        canPublish={false}
        canAudit={false}
      />
    </Box>
  );
};

export default ResultTeacher;