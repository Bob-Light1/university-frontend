/**
 * @file ExamTeacher.jsx
 * @description Exam management view for TEACHER role.
 *
 * Tabs:
 *  - My Sessions  : Sessions assigned to this teacher
 *  - Grading Queue: Submissions pending grading + analytics (snapshot, item-analysis)
 *  - Appeals      : Appeals for teacher's sessions — review + resolve
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Chip, Alert,
  Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Paper, IconButton, Tooltip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Tab, Tabs, FormControl, InputLabel,
  Select, MenuItem,
} from '@mui/material';
import { Refresh, Grade, Gavel, Visibility, BarChart } from '@mui/icons-material';

import * as examService from '../../../services/examination.service';
import { fDateTime } from '../../../utils/dateFormat';

// ─── Status meta ──────────────────────────────────────────────────────────────

const SESSION_STATUS = {
  DRAFT:     { label: 'Draft',     color: 'default'   },
  SCHEDULED: { label: 'Scheduled', color: 'info'      },
  ONGOING:   { label: 'Ongoing',   color: 'warning'   },
  COMPLETED: { label: 'Completed', color: 'success'   },
  CANCELLED: { label: 'Cancelled', color: 'error'     },
  POSTPONED: { label: 'Postponed', color: 'secondary' },
};

const GRADING_STATUS = {
  PENDING:       { label: 'Pending',       color: 'default'   },
  GRADED:        { label: 'Graded',        color: 'info'      },
  DOUBLE_GRADED: { label: 'Double Graded', color: 'warning'   },
  MEDIATED:      { label: 'Mediated',      color: 'secondary' },
  PUBLISHED:     { label: 'Published',     color: 'success'   },
};

const APPEAL_STATUS = {
  PENDING:      { label: 'Pending',      color: 'default' },
  UNDER_REVIEW: { label: 'Under Review', color: 'warning' },
  RESOLVED:     { label: 'Resolved',     color: 'success' },
  REJECTED:     { label: 'Rejected',     color: 'error'   },
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
        Grade — {grading?.student?.firstName} {grading?.student?.lastName}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth type="number" name="score"
            label={`Score (max ${maxScore})`}
            value={form.score} onChange={handle}
            slotProps={{ input: { min: 0, max: maxScore, step: 0.5 } }}
          />
          <TextField
            fullWidth multiline rows={3} name="graderFeedback"
            label="Feedback (optional)"
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
            <InputLabel id="teacher-decision-label">Decision</InputLabel>
            <Select
              labelId="teacher-decision-label"
              name="decision"
              value={form.decision}
              label="Decision"
              onChange={handle}
            >
              <MenuItem value="RESOLVED">Resolved (accept)</MenuItem>
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

// ─── SnapshotDialog ───────────────────────────────────────────────────────────

const SnapshotDialog = ({ open, onClose, session }) => {
  const [snapshot, setSnapshot]         = useState(null);
  const [itemAnalysis, setItemAnalysis] = useState([]);
  // Starts true so the spinner shows immediately on mount (key prop resets it)
  const [loading, setLoading]           = useState(true);

  const fetchData = useCallback(() => {
    if (!session?._id) return;
    Promise.all([
      examService.getSessionSnapshot(session._id).catch(() => null),
      examService.getItemAnalysis(session._id).catch(() => null),
    ]).then(([snapRes, itemRes]) => {
      setSnapshot(snapRes?.data?.data || null);
      setItemAnalysis(itemRes?.data?.data?.itemAnalysis || []);
    }).finally(() => setLoading(false));
  }, [session]);

  useEffect(() => { if (open) fetchData(); }, [open, fetchData]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>Analytics — {session?.title}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box textAlign="center" py={4}><CircularProgress /></Box>
        ) : (
          <>
            {snapshot ? (
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={600}>Session Snapshot</Typography>
                <Typography variant="body2" color="text.secondary">
                  Computed at: {snapshot.computedAt ? fDateTime(snapshot.computedAt) : 'Pending'}
                </Typography>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 2 }}>
                Analytics snapshot not yet available. Complete and publish grades first.
              </Alert>
            )}
            {itemAnalysis.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Item Analysis</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Question</TableCell>
                      <TableCell>Difficulty</TableCell>
                      <TableCell>Discrimination</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {itemAnalysis.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.questionText?.slice(0, 60) || `Q${i + 1}`}…</TableCell>
                        <TableCell>
                          <Chip
                            label={(item.difficultyIndex ?? 0).toFixed(2)}
                            size="small"
                            color={item.difficultyIndex < 0.3 ? 'error' : item.difficultyIndex < 0.7 ? 'success' : 'warning'}
                          />
                        </TableCell>
                        <TableCell>{(item.discriminationIndex ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ExamTeacher = () => {
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // ── Sessions ───────────────────────────────────────────────────────────────
  const [sessions, setSessions]         = useState([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPage, setSessionsPage] = useState(0);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [snapshotDialog, setSnapshotDialog]   = useState({ open: false, session: null });

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await examService.listSessions({ page: sessionsPage + 1, limit: 10 });
      setSessions(res.data?.data?.sessions || res.data?.data || []);
      setSessionsTotal(res.data?.pagination?.total || 0);
    } catch {
      showSnack('Failed to load sessions.', 'error');
    } finally {
      setSessionsLoading(false);
    }
  }, [sessionsPage]);

  useEffect(() => { if (tab === 0) loadSessions(); }, [tab, loadSessions]);

  // ── Grading ────────────────────────────────────────────────────────────────
  const [gradings, setGradings]           = useState([]);
  const [gradingsTotal, setGradingsTotal] = useState(0);
  const [gradingsPage, setGradingsPage]   = useState(0);
  const [gradingsLoading, setGradingsLoading] = useState(false);
  const [gradingStatusFilter, setGradingStatusFilter] = useState('PENDING');
  const [gradeDialog, setGradeDialog]     = useState({ open: false, grading: null });
  const [gradeLoading, setGradeLoading]   = useState(false);

  const loadGradings = useCallback(async () => {
    setGradingsLoading(true);
    try {
      const params = { page: gradingsPage + 1, limit: 10 };
      if (gradingStatusFilter) params.status = gradingStatusFilter;
      const res = await examService.listGradings(params);
      setGradings(res.data?.data?.gradings || res.data?.data || []);
      setGradingsTotal(res.data?.pagination?.total || 0);
    } catch {
      showSnack('Failed to load grading queue.', 'error');
    } finally {
      setGradingsLoading(false);
    }
  }, [gradingsPage, gradingStatusFilter]);

  useEffect(() => { if (tab === 1) loadGradings(); }, [tab, loadGradings]);

  const handleGrade = async (data) => {
    setGradeLoading(true);
    try {
      await examService.gradeSubmission({
        submissionId: gradeDialog.grading?.submission,
        ...data,
      });
      showSnack('Grade saved.');
      setGradeDialog({ open: false, grading: null });
      loadGradings();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to save grade.', 'error');
    } finally {
      setGradeLoading(false);
    }
  };

  // ── Appeals ────────────────────────────────────────────────────────────────
  const [appeals, setAppeals]           = useState([]);
  const [appealsTotal, setAppealsTotal] = useState(0);
  const [appealsPage, setAppealsPage]   = useState(0);
  const [appealsLoading, setAppealsLoading] = useState(false);
  const [resolveDialog, setResolveDialog]   = useState({ open: false, appeal: null });
  const [resolveLoading, setResolveLoading] = useState(false);

  const loadAppeals = useCallback(async () => {
    setAppealsLoading(true);
    try {
      const res = await examService.listAppeals({ page: appealsPage + 1, limit: 10 });
      setAppeals(res.data?.data?.appeals || res.data?.data || []);
      setAppealsTotal(res.data?.pagination?.total || 0);
    } catch {
      showSnack('Failed to load appeals.', 'error');
    } finally {
      setAppealsLoading(false);
    }
  }, [appealsPage]);

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700} mb={3}>Examination</Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="My Sessions"   />
          <Tab label="Grading Queue" />
          <Tab label="Appeals"       />
        </Tabs>
      </Paper>

      {/* ── My Sessions ─────────────────────────────────────────────────── */}
      {tab === 0 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadSessions} disabled={sessionsLoading}><Refresh /></IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Analytics</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessionsLoading ? (
                <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : sessions.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">No sessions assigned.</TableCell></TableRow>
              ) : (
                sessions.map((s) => {
                  const meta = SESSION_STATUS[s.status] || { label: s.status, color: 'default' };
                  return (
                    <TableRow key={s._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.academicYear} · {s.semester}</Typography>
                      </TableCell>
                      <TableCell>{s.subject?.subjectName || '—'}</TableCell>
                      <TableCell>{s.examPeriod}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {fDateTime(s.startTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={meta.label} color={meta.color} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        {s.status === 'COMPLETED' && (
                          <Tooltip title="View Analytics">
                            <IconButton size="small" color="primary"
                              onClick={() => setSnapshotDialog({ open: true, session: s })}>
                              <BarChart fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
            component="div" count={sessionsTotal} page={sessionsPage}
            rowsPerPage={10} rowsPerPageOptions={[10]}
            onPageChange={(_, p) => setSessionsPage(p)}
          />
        </Paper>
      )}

      {/* ── Grading Queue ────────────────────────────────────────────────── */}
      {tab === 1 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="grading-filter-label">Status</InputLabel>
                <Select
                  labelId="grading-filter-label"
                  value={gradingStatusFilter}
                  label="Status"
                  onChange={(e) => setGradingStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {Object.keys(GRADING_STATUS).map((s) => (
                    <MenuItem key={s} value={s}>{GRADING_STATUS[s].label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Tooltip title="Refresh">
                <IconButton onClick={loadGradings} disabled={gradingsLoading}><Refresh /></IconButton>
              </Tooltip>
            </Stack>
          </Paper>

          <Paper>
            <Box sx={{ overflowX: 'auto' }}>
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
                  <TableRow><TableCell colSpan={5} align="center">No submissions to grade.</TableCell></TableRow>
                ) : (
                  gradings.map((g) => {
                    const meta = GRADING_STATUS[g.status] || { label: g.status, color: 'default' };
                    return (
                      <TableRow key={g._id} hover>
                        <TableCell>{g.student?.firstName} {g.student?.lastName}</TableCell>
                        <TableCell>{g.examSession?.title || '—'}</TableCell>
                        <TableCell>
                          {g.finalScore != null ? `${g.finalScore} / ${g.maxScore}`
                            : g.score != null ? `${g.score} / ${g.maxScore}` : '—'}
                        </TableCell>
                        <TableCell>
                          <Chip label={meta.label} color={meta.color} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          {['PENDING', 'GRADED'].includes(g.status) && (
                            <Tooltip title="Grade">
                              <IconButton size="small" color="primary"
                                onClick={() => setGradeDialog({ open: true, grading: g })}>
                                <Grade fontSize="small" />
                              </IconButton>
                            </Tooltip>
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
              component="div" count={gradingsTotal} page={gradingsPage}
              rowsPerPage={10} rowsPerPageOptions={[10]}
              onPageChange={(_, p) => setGradingsPage(p)}
            />
          </Paper>
        </Box>
      )}

      {/* ── Appeals ──────────────────────────────────────────────────────── */}
      {tab === 2 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadAppeals} disabled={appealsLoading}><Refresh /></IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Session</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appealsLoading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : appeals.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No appeals to review.</TableCell></TableRow>
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
          </Box>
          <TablePagination
            component="div" count={appealsTotal} page={appealsPage}
            rowsPerPage={10} rowsPerPageOptions={[10]}
            onPageChange={(_, p) => setAppealsPage(p)}
          />
        </Paper>
      )}

      {/* Dialogs */}
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

      <SnapshotDialog
        key={snapshotDialog.session?._id ?? 'snapshot'}
        open={snapshotDialog.open}
        onClose={() => setSnapshotDialog({ open: false, session: null })}
        session={snapshotDialog.session}
      />

      {/* Snackbar */}
      {snack.open && (
        <Box sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))} sx={{ boxShadow: 3 }}>
            {snack.msg}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default ExamTeacher;
