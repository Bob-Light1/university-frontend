/**
 * @file ResultManager.jsx
 * @description Results management page for CAMPUS_MANAGER / ADMIN / DIRECTOR.
 *
 * Features:
 *  - KPI overview (total, draft, submitted, published, avg, pass rate)
 *  - Campus analytics overview
 *  - Full results table with filters (class, subject, teacher, status, type, year, semester)
 *  - Create / Edit / Delete (DRAFT only)
 *  - Bulk entry + CSV upload
 *  - Workflow: Submit batch, Publish batch, Lock semester
 *  - Result detail drawer with audit correction
 *  - Retake list view
 *
 * Campus isolation: enforced by the backend; campusId comes from req.user.
 */

import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Typography, Grid, Button, Stack, Chip, Alert,
  Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Paper, IconButton, Tooltip, TextField,
  MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Divider, Tab, Tabs, Badge,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add, CloudUpload, Publish, Lock, Refresh, Delete, Edit,
  Visibility, BarChart, PlaylistAddCheck, Warning, Send,
} from '@mui/icons-material';

import { AuthContext } from '../../../context/AuthContext';
import KPICards from '../../../components/shared/KpiCard';

import useResult from '../../../hooks/useResult';
import {
  getResultById,
  uploadResultsCSV,
  listGradingScales,
} from '../../../services/result.service';
import api from '../../../api/axiosInstance';

import ResultFilters     from '../../../components/results/ResultFilters';
import ResultForm        from '../../../components/results/ResultForm';
import BulkResultForm    from '../../../components/results/BulkResultForm';
import ResultDetailDrawer from '../../../components/results/ResultDetailDrawer';
import {
  ResultStatusChip, EvalTypeChip, ScoreDisplay, ResultEmptyState,
} from '../../../components/results/ResultShared';

// ─── Semester lock dialog ─────────────────────────────────────────────────────
         
const LockSemesterDialog = ({ open, onClose, onConfirm, loading }) => {
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('S1');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => {
    const y = currentYear - 2 + i;
    return `${y}-${y + 1}`;
  });

  // IDs uniques pour les labels
  const academicYearId = 'lock-academic-year';
  const semesterId = 'lock-semester';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableEnforceFocus
      closeAfterTransition={false}
      aria-labelledby="result-manager"
    >
      <DialogTitle>Lock Semester</DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This will freeze all PUBLISHED results and generate official transcripts.
          <br />
          This action cannot be undone.
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 8 }}>
            <FormControl fullWidth size="small">
              <InputLabel id={`${academicYearId}-label`}>Academic Year</InputLabel>
              <Select
                id={academicYearId}
                labelId={`${academicYearId}-label`}
                value={academicYear}
                label="Academic Year"
                onChange={(e) => setAcademicYear(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="" disabled>
                  — Select academic year —
                </MenuItem>
                {years.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id={`${semesterId}-label`}>Semester</InputLabel>
              <Select
                id={semesterId}
                labelId={`${semesterId}-label`}
                value={semester}
                label="Semester"
                onChange={(e) => setSemester(e.target.value)}
                disabled={loading}
              >
                {['S1', 'S2', 'Annual'].map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={!academicYear || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Lock />}
          onClick={() => onConfirm({ academicYear, semester })}
        >
          Lock Semester
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ResultManager = () => {
  const { user, getUserRole } = useContext(AuthContext);
  const role      = getUserRole();
  const campusId  = user?.campusId ?? user?.schoolCampus ?? '';
  const isAdmin   = role === 'ADMIN' || role === 'DIRECTOR';

  // Data hook
  const {
    results, overview, summary, loading, error,
    pagination, filters,
    fetch, fetchOverview,
    handleFilterChange, handleReset, setPage,
    create, update, remove, bulkCreate,
    submit, submitAllBatch, publish, publishAllBatch,
    archive, lockSem, auditCorrect,
  } = useResult('manager');

  // Local state
  const [tab,              setTab]              = useState(0);
  const [classes,          setClasses]          = useState([]);
  const [subjects,         setSubjects]         = useState([]);
  const [teachers,         setTeachers]         = useState([]);
  const [students,         setStudents]         = useState([]);
  const [gradingScales,    setGradingScales]    = useState([]);
  const [selectedResult,   setSelectedResult]   = useState(null);
  const [detailOpen,       setDetailOpen]       = useState(false);
  const [formOpen,         setFormOpen]         = useState(false);
  const [bulkOpen,         setBulkOpen]         = useState(false);
  const [lockOpen,         setLockOpen]         = useState(false);
  const [lockLoading,      setLockLoading]      = useState(false);
  const [editTarget,       setEditTarget]       = useState(null);
  const [deleteTarget,     setDeleteTarget]     = useState(null);
  const [deleteLoading,    setDeleteLoading]    = useState(false);
  const [snackMsg,         setSnackMsg]         = useState('');

  /**
   * Load all reference data needed by forms and filters.
   * Campus isolation is enforced server-side (req.user); campusId is passed only
   * as an optional hint for ADMIN/DIRECTOR who may see multiple campuses.
   *
   * E1 fix: do NOT guard on campusId — ADMIN / DIRECTOR users have no campusId
   * in their token and the guard was silently preventing data from loading.
   */
  useEffect(() => {
    const load = async () => {
      try {
        const [cls, sub, tch, stu, scales] = await Promise.all([
          api.get('/class',    { params: { limit: 200 } }),
          api.get('/subject',  { params: { limit: 200 } }),
          api.get('/teachers', { params: { limit: 200 } }),
          api.get('/students', { params: { limit: 500, status: 'active' } }),
          listGradingScales(),
        ]);

        // sendPaginated returns { data: [...], pagination: {...} }
        // sendSuccess returns  { data: [...] }
        // Support both shapes for resilience.
        const pick = (res) =>
          Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.records)
            ? res.data.records
            : Array.isArray(res.data?.results)
            ? res.data.results
            : [];

        setClasses(pick(cls));
        setSubjects(pick(sub));
        setTeachers(pick(tch));
        setStudents(pick(stu));
        setGradingScales(Array.isArray(scales.data?.data) ? scales.data.data : []);
      } catch (err) {
        console.error(
          '[ResultManager] reference data load error:',
          err?.response?.data?.message ?? err?.message,
        );
      }
    };

    load();
    // Re-run only when the campus context changes (e.g. ADMIN switches campus)
  }, [campusId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load overview on first render
  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // ─── Open detail drawer ──────────────────────────────────────────────────

  const openDetail = async (resultId) => {
    try {
      const res = await getResultById(resultId);
      setSelectedResult(res.data?.data ?? null);
      setDetailOpen(true);
    } catch { /* silent */ }
  };

  // ─── KPI metrics ─────────────────────────────────────────────────────────

  const kpiMetrics = [
    {
      key: 'total', label: 'Total Results', value: pagination.total ?? summary.total,
      icon: <BarChart />, color: '#3b82f6',
    },
    {
      key: 'submitted', label: 'Pending Review', value: summary.submitted,
      icon: <Send />, color: '#f97316',
      trend: summary.submitted > 0 ? 'up' : null,
    },
    {
      key: 'avg', label: 'Class Avg (/20)',
      value: summary.avg != null ? summary.avg.toFixed(2) : '—',
      icon: <BarChart />, color: '#10b981',
    },
    {
      key: 'passRate', label: 'Pass Rate',
      value: summary.passRate != null ? `${summary.passRate}%` : '—',
      icon: <PlaylistAddCheck />, color: '#8b5cf6',
    },
  ];

  // ─── Batch workflow ───────────────────────────────────────────────────────

  const handlePublishBatch = async () => {
    if (!filters.classId || !filters.subjectId || !filters.academicYear || !filters.semester) {
      setSnackMsg('Set class, subject, academic year and semester filters first.');
      return;
    }
    await publishAllBatch({
      classId: filters.classId,
      subjectId: filters.subjectId,
      evaluationTitle: filters.evaluationTitle ?? '',
      academicYear: filters.academicYear,
      semester: filters.semester,
    });
    setSnackMsg('Batch published successfully.');
  };

  const handleLockSemester = async (data) => {
    setLockLoading(true);
    try {
      const res = await lockSem(data);
      setSnackMsg(res?.message ?? 'Semester locked.');
      setLockOpen(false);
    } finally {
      setLockLoading(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try { await remove(deleteTarget._id); }
    finally { setDeleteTarget(null); setDeleteLoading(false); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} spacing={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Results Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Academic grades — campus-wide overview
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button size="small" startIcon={<Refresh />} onClick={fetch} disabled={loading}>
            Refresh
          </Button>
          <Button size="small" variant="outlined" startIcon={<CloudUpload />}
            onClick={() => setBulkOpen(true)}>
            Bulk Entry
          </Button>
          <Button size="small" variant="outlined" color="warning"
            startIcon={<Send />} onClick={handlePublishBatch}>
            Publish Batch
          </Button>
          <Button size="small" variant="outlined" color="error"
            startIcon={<Lock />} onClick={() => setLockOpen(true)}>
            Lock Semester
          </Button>
          <Button variant="contained" size="small" startIcon={<Add />}
            onClick={() => { setEditTarget(null); setFormOpen(true); }}>
            New Result
          </Button>
        </Stack>
      </Stack>

      {/* KPIs */}
      <Box mb={3}>
        <KPICards metrics={kpiMetrics} loading={loading} />
      </Box>

      {snackMsg && (
        <Alert severity="info" onClose={() => setSnackMsg('')} sx={{ mb: 2 }}>
          {snackMsg}
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <ResultFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        mode="manager"
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        loading={loading}
      />

      {/* Results table */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
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
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <ResultEmptyState
                      message="No results found"
                      subtext="Adjust filters or create new results."
                    />
                  </TableCell>
                </TableRow>
              ) : results.map((r) => (
                <TableRow key={r._id} hover sx={{ cursor: 'pointer' }}
                  onClick={() => openDetail(r._id)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {r.student?.firstName} {r.student?.lastName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.student?.matricule}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.class?.className ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.subject?.subject_name ?? '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.subject?.subject_code}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {r.teacher?.firstName} {r.teacher?.lastName}
                    </Typography>
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
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="View detail">
                      <IconButton size="small" onClick={() => openDetail(r._id)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {r.status === 'DRAFT' && (
                      <>
                        <Tooltip title="Edit">
                          <IconButton size="small"
                            onClick={() => { setEditTarget(r); setFormOpen(true); }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error"
                            onClick={() => setDeleteTarget(r)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {r.status === 'SUBMITTED' && (
                      <Tooltip title="Publish">
                        <IconButton size="small" color="success"
                          onClick={() => publish(r._id)}>
                          <Publish fontSize="small" />
                        </IconButton>
                      </Tooltip>
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

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {/* Create / Edit form */}
      <ResultForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={editTarget
          ? (values) => update(editTarget._id, values)
          : (values) => create(values)
        }
        initialValues={editTarget}
        campusId={campusId}
        mode={editTarget ? 'edit' : 'create'}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        students={students}
        gradingScales={gradingScales}
      />

      {/* Bulk entry */}
      <BulkResultForm
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSubmit={bulkCreate}
        campusId={campusId}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        gradingScales={gradingScales}
      />

      {/* Lock semester */}
      <LockSemesterDialog
        open={lockOpen}
        onClose={() => setLockOpen(false)}
        onConfirm={handleLockSemester}
        loading={lockLoading}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <Dialog open onClose={() => setDeleteTarget(null)} maxWidth="xs">
          <DialogTitle>Delete Result</DialogTitle>
          <DialogContent>
            <Alert severity="warning">
              Delete DRAFT result for <strong>
                {deleteTarget.student?.firstName} {deleteTarget.student?.lastName}
              </strong>? This is irreversible.
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

      {/* Detail drawer */}
      <ResultDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        result={selectedResult}
        onSubmit={submit}
        onPublish={publish}
        onArchive={archive}
        onAuditCorrect={auditCorrect}
        canPublish
        canAudit={isAdmin}
      />
    </Box>
  );
};

export default ResultManager;