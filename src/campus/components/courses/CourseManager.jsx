/**
 * @file CourseManager.jsx
 * @description Course management page for ADMIN / DIRECTOR / CAMPUS_MANAGER.
 *
 * Visual improvements over previous version:
 *  - Tighter, more intentional spacing and hierarchy
 *  - Status-coloured row highlights in the table
 *  - Mobile-first responsive: table becomes card list on xs
 *  - Action buttons grouped with consistent sizing
 *  - Better empty state positioning
 *  - Tab badge uses correct MUI pattern (no nested Badge text trick)
 *
 * Campus isolation: Courses are GLOBAL — no campusId in queries.
 * Backend enforces role-based visibility on approvalStatus.
 */

import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  Chip,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  Add,
  Refresh,
  Delete,
  Edit,
  Visibility,
  History,
  Restore,
  MenuBook,
  HourglassTop,
  CheckCircle,
  Cancel,
  Archive,
} from '@mui/icons-material';

import { AuthContext } from '../../../context/AuthContext';
import KPICards from '../../../components/shared/KpiCard';
import useCourse from '../../../hooks/useCourse';
import { getCourseVersions } from '../../../services/course.service';
import api from '../../../api/axiosInstance';

import CourseFilters       from '../../../components/courses/CourseFilters';
import CourseForm          from '../../../components/courses/CourseForm';
import CourseDetailDrawer  from '../../../components/courses/CourseDetailDrawer';
import {
  ApprovalStatusChip,
  DifficultyChip,
  CategoryChip,
  VersionBadge,
  CourseEmptyState,
} from '../../../components/courses/CourseShared';

// ─── KPI config ───────────────────────────────────────────────────────────────

const STATUS_META = {
  DRAFT:          { color: '#94a3b8', bg: '#f8fafc', icon: <Edit sx={{ fontSize: 18 }} /> },
  PENDING_REVIEW: { color: '#f97316', bg: '#fff7ed', icon: <HourglassTop sx={{ fontSize: 18 }} /> },
  APPROVED:       { color: '#22c55e', bg: '#f0fdf4', icon: <CheckCircle sx={{ fontSize: 18 }} /> },
  REJECTED:       { color: '#ef4444', bg: '#fef2f2', icon: <Cancel sx={{ fontSize: 18 }} /> },
};

const buildKpis = (courses, total) => ({
  total:    total,
  draft:    courses.filter((c) => c.approvalStatus === 'DRAFT').length,
  pending:  courses.filter((c) => c.approvalStatus === 'PENDING_REVIEW').length,
  approved: courses.filter((c) => c.approvalStatus === 'APPROVED').length,
  rejected: courses.filter((c) => c.approvalStatus === 'REJECTED').length,
});

// ─── Version history dialog ───────────────────────────────────────────────────

const VersionHistoryDialog = ({ open, onClose, courseId, courseCode }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!open || !courseId) return;
    setLoading(true);
    getCourseVersions(courseId)
      .then((res) => setVersions(res.data?.data ?? []))
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
  }, [open, courseId]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>Version History — {courseCode}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : versions.length === 0 ? (
          <Alert severity="info">No version history available.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Latest</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.map((v) => (
                <TableRow key={v._id}>
                  <TableCell><VersionBadge version={v.version} isLatest={v.isLatestVersion} /></TableCell>
                  <TableCell><ApprovalStatusChip status={v.approvalStatus} /></TableCell>
                  <TableCell>{v.isLatestVersion ? '✓' : ''}</TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Mobile course card ───────────────────────────────────────────────────────

const CourseCard = ({ course: c, onView, onEdit, onHistory, onDelete, isGlobal, isAdmin }) => {
  const sm = STATUS_META[c.approvalStatus] ?? STATUS_META.DRAFT;

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderLeftWidth: 4,
        borderLeftColor: sm.color,
        bgcolor: c.isDeleted ? 'action.hover' : sm.bg,
        opacity: c.isDeleted ? 0.6 : 1,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" mb={0.5}>
          <Typography variant="caption" fontFamily="monospace" fontWeight={800}
            sx={{ bgcolor: alpha(sm.color, 0.1), color: sm.color, px: 0.75, py: 0.2, borderRadius: 0.75 }}>
            {c.courseCode}
          </Typography>
          <VersionBadge version={c.version} isLatest={c.isLatestVersion} />
          <ApprovalStatusChip status={c.approvalStatus} />
        </Stack>
        <Typography variant="subtitle2" fontWeight={700} mb={0.25}>
          {c.title}
        </Typography>
        {c.discipline && (
          <Typography variant="caption" color="text.secondary">{c.discipline}</Typography>
        )}
        <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap" gap={0.5}>
          <CategoryChip category={c.category} />
          <DifficultyChip level={c.difficultyLevel} />
          {c.level?.name && <Chip label={c.level.name} size="small" variant="outlined" />}
        </Stack>
      </CardContent>

      <Divider />

      <CardActions sx={{ px: 1.5, py: 1, justifyContent: 'flex-end' }}>
        {!c.isDeleted ? (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="View detail">
              <IconButton size="small" onClick={() => onView(c)}><Visibility fontSize="small" /></IconButton>
            </Tooltip>
            {isGlobal && (
              <Tooltip title="Version history">
                <IconButton size="small" onClick={() => onHistory(c)}><History fontSize="small" /></IconButton>
              </Tooltip>
            )}
            {isGlobal && (c.approvalStatus === 'DRAFT' || c.approvalStatus === 'REJECTED') && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(c)}><Edit fontSize="small" /></IconButton>
              </Tooltip>
            )}
            {isAdmin && (
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onDelete(c)}><Delete fontSize="small" /></IconButton>
              </Tooltip>
            )}
          </Stack>
        ) : (
          isAdmin && (
            <Tooltip title="Restore">
              <IconButton size="small" color="success" onClick={() => onDelete(c)}><Restore fontSize="small" /></IconButton>
            </Tooltip>
          )
        )}
      </CardActions>
    </Card>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const CourseManager = () => {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { getUserRole } = useContext(AuthContext);
  const role     = getUserRole();
  const isGlobal = role === 'ADMIN' || role === 'DIRECTOR';
  const isAdmin  = role === 'ADMIN';

  const course = useCourse('manager');
  const [levels, setLevels] = useState([]);

  // UI state
  const [formOpen,           setFormOpen]           = useState(false);
  const [detailOpen,         setDetailOpen]         = useState(false);
  const [historyOpen,        setHistoryOpen]        = useState(false);
  const [deleteDialogOpen,   setDeleteDialogOpen]   = useState(false);
  const [restoreDialogOpen,  setRestoreDialogOpen]  = useState(false);
  const [editTarget,         setEditTarget]         = useState(null);
  const [detailTarget,       setDetailTarget]       = useState(null);
  const [historyTarget,      setHistoryTarget]      = useState(null);
  const [deleteTarget,       setDeleteTarget]       = useState(null);
  const [actionLoading,      setActionLoading]      = useState(false);
  const [snackbar,           setSnackbar]           = useState({ open: false, message: '', severity: 'success' });
  const [tab,                setTab]                = useState(0); // 0=active, 1=deleted

  // ── Reference data ───────────────────────────────────────────────────────

  useEffect(() => {
    api.get('/level', { params: { limit: 100 } })
      .then((res) => setLevels(res.data?.data ?? res.data?.records ?? []))
      .catch((err) => console.error('[CourseManager] levels load error:', err?.message));
  }, []);

  // ── Load courses ─────────────────────────────────────────────────────────

  useEffect(() => {
    course.fetch({
      includeDeleted: tab === 1 ? 'true' : undefined,
      isDeleted:      tab === 1 ? 'true' : undefined,
    });
  }, [course.filters, tab]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const reload = useCallback(() => {
    course.fetch({
      includeDeleted: tab === 1 ? 'true' : undefined,
      isDeleted:      tab === 1 ? 'true' : undefined,
    });
  }, [course.fetch, tab]);

  const openDetail = useCallback(async (c) => {
    try {
      const detail = await course.fetchById(c._id);
      setDetailTarget(detail);
    } catch {
      setDetailTarget(c);
    }
    setDetailOpen(true);
  }, [course]);

  const openDelete = (c) => { setDeleteTarget(c); setDeleteDialogOpen(true); };
  const openEdit   = (c) => { setEditTarget(c);   setFormOpen(true);         };
  const openHistory = (c) => { setHistoryTarget(c); setHistoryOpen(true);    };

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const handleCreate = async (values) => {
    await course.create(values);
    showSnackbar('Course created successfully.');
    reload();
  };

  const handleUpdate = async (values) => {
    await course.update(editTarget._id, values);
    showSnackbar('Course updated successfully.');
    reload();
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      const res = await course.remove(deleteTarget._id);
      showSnackbar(res?.warning ?? 'Course deleted.', res?.warning ? 'warning' : 'success');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      showSnackbar(err?.response?.data?.message ?? 'Delete failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      await course.restore(deleteTarget._id);
      showSnackbar('Course restored.');
      setRestoreDialogOpen(false);
      setDeleteTarget(null);
      reload();
    } catch (err) {
      showSnackbar(err?.response?.data?.message ?? 'Restore failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Workflow handlers ─────────────────────────────────────────────────────

  const handleSubmit  = async (id) => { await course.submit(id);         showSnackbar('Submitted for review.'); reload(); };
  const handleApprove = async (id) => { await course.approve(id);        showSnackbar('Course approved.');      reload(); };
  const handleReject  = async (id, note) => { await course.reject(id, note); showSnackbar('Course rejected.'); reload(); };

  const handleNewVersion = async (id, copyRes) => {
    const created = await course.newVersion(id, copyRes);
    showSnackbar(`New version v${created.version} created as DRAFT.`);
    reload();
  };

  const handleAddResource = async (id, res) => {
    await course.addResource(id, res);
    showSnackbar('Resource added.');
    if (detailTarget?._id === id) {
      const updated = await course.fetchById(id);
      setDetailTarget(updated);
    }
    reload();
  };

  const handleRemoveResource = async (courseId, resId) => {
    await course.removeResource(courseId, resId);
    showSnackbar('Resource removed.');
    if (detailTarget?._id === courseId) {
      const updated = await course.fetchById(courseId);
      setDetailTarget(updated);
    }
    reload();
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = buildKpis(course.courses, course.total);

  const kpiMetrics = [
    { key: 'total',    label: 'Total',          value: kpis.total,    color: '#3b82f6', icon: <MenuBook /> },
    { key: 'draft',    label: 'Draft',          value: kpis.draft,    color: '#94a3b8', icon: <Edit /> },
    { key: 'pending',  label: 'Pending Review', value: kpis.pending,  color: '#f97316', icon: <HourglassTop /> },
    { key: 'approved', label: 'Approved',       value: kpis.approved, color: '#22c55e', icon: <CheckCircle /> },
    { key: 'rejected', label: 'Rejected',       value: kpis.rejected, color: '#ef4444', icon: <Cancel /> },
  ];

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 } }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        mb={3}
      >
        <Box>
          <Typography variant="h5" fontWeight={800} gutterBottom={false}>
            Course Catalog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Global repository — {course.total} course{course.total !== 1 ? 's' : ''}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Refresh">
            <span>
              <IconButton
                size="small"
                onClick={reload}
                disabled={course.loading}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {isGlobal && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => { setEditTarget(null); setFormOpen(true); }}
              size="small"
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              New Course
            </Button>
          )}
        </Stack>
      </Stack>

      {/* ── KPI cards ─────────────────────────────────────────────────────── */}
      <KPICards metrics={kpiMetrics} loading={course.loading} sx={{ mb: 3 }} />

      {/* ── Error banner ──────────────────────────────────────────────────── */}
      {course.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {course.error}
        </Alert>
      )}

      {/* ── Tabs: active / archived (admin only) ──────────────────────────── */}
      {isAdmin && (
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Active" />
          <Tab
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Archive fontSize="small" />
                <span>Archived</span>
              </Stack>
            }
          />
        </Tabs>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <CourseFilters
        filters={course.filters}
        onFilterChange={course.handleFilterChange}
        onReset={course.handleReset}
        levels={levels}
        mode="manager"
        loading={course.loading}
      />

      {/* ── Content: table (md+) / card list (xs–sm) ──────────────────────── */}
      {isMobile ? (
        /* ── Mobile card list ─────────────────────────────────────────── */
        <Box>
          {course.loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <CircularProgress size={32} />
            </Box>
          ) : course.courses.length === 0 ? (
            <CourseEmptyState
              message="No courses found"
              subtext={isGlobal
                ? 'Create your first course using the button above.'
                : 'No approved courses are available yet.'}
            />
          ) : (
            <Stack spacing={1.5}>
              {course.courses.map((c) => (
                <CourseCard
                  key={c._id}
                  course={c}
                  onView={openDetail}
                  onEdit={(c) => { openEdit(c); }}
                  onHistory={openHistory}
                  onDelete={(c) => {
                    if (c.isDeleted) { setDeleteTarget(c); setRestoreDialogOpen(true); }
                    else openDelete(c);
                  }}
                  isGlobal={isGlobal}
                  isAdmin={isAdmin}
                />
              ))}
            </Stack>
          )}

          {/* Pagination for mobile */}
          {course.courses.length > 0 && (
            <TablePagination
              component="div"
              count={course.total}
              page={(course.filters.page ?? 1) - 1}
              rowsPerPage={course.filters.limit ?? 25}
              rowsPerPageOptions={[10, 25, 50]}
              onPageChange={(_, p) => course.setPage(p + 1)}
              onRowsPerPageChange={(e) =>
                course.handleFilterChange('limit', parseInt(e.target.value))}
              sx={{ mt: 1 }}
            />
          )}
        </Box>
      ) : (
        /* ── Desktop table ────────────────────────────────────────────── */
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['Code', 'Title', 'Category', 'Level', 'Difficulty', 'Status', 'Version', ''].map((h) => (
                    <TableCell
                      key={h}
                      align={h === '' ? 'right' : 'left'}
                      sx={{ fontWeight: 700, py: 1.5, whiteSpace: 'nowrap' }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {course.loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={28} />
                    </TableCell>
                  </TableRow>
                ) : course.courses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} sx={{ p: 0 }}>
                      <CourseEmptyState
                        message="No courses found"
                        subtext={isGlobal
                          ? 'Create your first course using the button above.'
                          : 'No approved courses are available yet.'}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  course.courses.map((c) => {
                    const sm = STATUS_META[c.approvalStatus] ?? STATUS_META.DRAFT;
                    return (
                      <TableRow
                        key={c._id}
                        hover
                        onClick={() => !c.isDeleted && openDetail(c)}
                        sx={{
                          cursor: c.isDeleted ? 'default' : 'pointer',
                          opacity: c.isDeleted ? 0.5 : 1,
                          borderLeft: `3px solid ${sm.color}`,
                          '&:hover td': { bgcolor: alpha(sm.color, 0.04) },
                          transition: 'background 0.15s',
                        }}
                      >
                        {/* Code */}
                        <TableCell sx={{ py: 1 }}>
                          <Typography
                            variant="caption"
                            fontWeight={800}
                            fontFamily="monospace"
                            sx={{
                              bgcolor: alpha(sm.color, 0.1),
                              color: sm.color,
                              px: 0.75,
                              py: 0.2,
                              borderRadius: 0.75,
                            }}
                          >
                            {c.courseCode}
                          </Typography>
                        </TableCell>

                        {/* Title */}
                        <TableCell sx={{ maxWidth: 220, py: 1 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {c.title}
                          </Typography>
                          {c.discipline && (
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {c.discipline}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell sx={{ py: 1 }}>
                          <CategoryChip category={c.category} />
                        </TableCell>

                        <TableCell sx={{ py: 1 }}>
                          <Typography variant="body2">{c.level?.name ?? '—'}</Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1 }}>
                          <DifficultyChip level={c.difficultyLevel} />
                        </TableCell>

                        <TableCell sx={{ py: 1 }}>
                          <ApprovalStatusChip status={c.approvalStatus} />
                        </TableCell>

                        <TableCell sx={{ py: 1 }}>
                          <VersionBadge version={c.version} isLatest={c.isLatestVersion} />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ py: 1, whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                          {!c.isDeleted ? (
                            <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                              <Tooltip title="View detail">
                                <IconButton size="small" onClick={() => openDetail(c)}>
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {isGlobal && (
                                <Tooltip title="Version history">
                                  <IconButton size="small" onClick={() => openHistory(c)}>
                                    <History fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {isGlobal && (c.approvalStatus === 'DRAFT' || c.approvalStatus === 'REJECTED') && (
                                <Tooltip title="Edit">
                                  <IconButton size="small" onClick={() => openEdit(c)}>
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {isAdmin && (
                                <Tooltip title="Delete">
                                  <IconButton size="small" color="error" onClick={() => openDelete(c)}>
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          ) : (
                            isAdmin && (
                              <Tooltip title="Restore">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => { setDeleteTarget(c); setRestoreDialogOpen(true); }}
                                >
                                  <Restore fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Box>

          <TablePagination
            component="div"
            count={course.total}
            page={(course.filters.page ?? 1) - 1}
            rowsPerPage={course.filters.limit ?? 25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            onPageChange={(_, p) => course.setPage(p + 1)}
            onRowsPerPageChange={(e) =>
              course.handleFilterChange('limit', parseInt(e.target.value))}
          />
        </Paper>
      )}

      {/* ── Course form dialog ───────────────────────────────────────────── */}
      <CourseForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSubmit={editTarget ? handleUpdate : handleCreate}
        initialValues={editTarget}
        levels={levels}
        courses={course.courses}
        mode={editTarget ? 'edit' : 'create'}
      />

      {/* ── Detail drawer ────────────────────────────────────────────────── */}
      <CourseDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailTarget(null); }}
        course={detailTarget}
        onEdit={() => { setDetailOpen(false); setEditTarget(detailTarget); setFormOpen(true); }}
        onSubmit={handleSubmit}
        onApprove={handleApprove}
        onReject={handleReject}
        onNewVersion={handleNewVersion}
        onAddResource={handleAddResource}
        onRemoveResource={handleRemoveResource}
        onDelete={() => { setDetailOpen(false); setDeleteTarget(detailTarget); setDeleteDialogOpen(true); }}
        role={role}
      />

      {/* ── Version history dialog ───────────────────────────────────────── */}
      <VersionHistoryDialog
        open={historyOpen}
        onClose={() => { setHistoryOpen(false); setHistoryTarget(null); }}
        courseId={historyTarget?._id}
        courseCode={historyTarget?.courseCode}
      />

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth disableEnforceFocus closeAfterTransition={false}>
        <DialogTitle>Delete Course</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Delete <strong>{deleteTarget?.courseCode} — {deleteTarget?.title}</strong>?
            <br />
            Soft delete — blocked if active subjects reference this course.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button
            variant="contained" color="error"
            onClick={handleDelete}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Restore confirm ──────────────────────────────────────────────── */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="xs" fullWidth disableEnforceFocus closeAfterTransition={false}>
        <DialogTitle>Restore Course</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Restore <strong>{deleteTarget?.courseCode}</strong> to active status?
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)} disabled={actionLoading}>Cancel</Button>
          <Button
            variant="contained" color="success"
            onClick={handleRestore}
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} /> : <Restore />}
          >
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ─────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
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

export default CourseManager;