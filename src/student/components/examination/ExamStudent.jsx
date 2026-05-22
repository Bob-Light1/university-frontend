/**
 * @file ExamStudent.jsx
 * @description Exam view for STUDENT role.
 *
 * Tabs:
 *  - My Exams   : Upcoming (SCHEDULED) and active (ONGOING) sessions
 *  - Take Exam  : Active exam interface — questions, auto-save, anti-cheat, timer, submit
 *  - My Results : Published gradings for this student
 *  - My Appeals : Appeals submitted by this student + submit new appeal
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Stack, Chip, Alert,
  Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, Paper, IconButton, Tooltip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Tab, Tabs, LinearProgress,
  Radio, RadioGroup, FormControlLabel,
} from '@mui/material';

import {
  PlayArrow, Send, Refresh, Assignment, Grade,
  Gavel, Timer, Warning,
} from '@mui/icons-material';

import * as examService from '../../../services/examinationService';
import { fDate, fDateTime, fTime } from '../../../utils/dateFormat';

// ─── Status helpers ───────────────────────────────────────────────────────────

const SESSION_STATUS = {
  SCHEDULED: { label: 'Scheduled', color: 'info'    },
  ONGOING:   { label: 'Ongoing',   color: 'warning' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'error'   },
  POSTPONED: { label: 'Postponed', color: 'secondary'},
};

const GRADING_STATUS = {
  PENDING:   { label: 'Pending',   color: 'default' },
  GRADED:    { label: 'Graded',    color: 'info'    },
  PUBLISHED: { label: 'Published', color: 'success' },
};

const APPEAL_STATUS = {
  PENDING:      { label: 'Pending',      color: 'default' },
  UNDER_REVIEW: { label: 'Under Review', color: 'warning' },
  RESOLVED:     { label: 'Resolved',     color: 'success' },
  REJECTED:     { label: 'Rejected',     color: 'error'   },
};

// ─── Countdown timer ──────────────────────────────────────────────────────────

const useCountdown = (endTime) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(endTime) - Date.now()) / 1000));
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  const hh = String(Math.floor(remaining / 3600)).padStart(2, '0');
  const mm = String(Math.floor((remaining % 3600) / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return { remaining, display: `${hh}:${mm}:${ss}` };
};

// ─── SubmitAppealDialog ───────────────────────────────────────────────────────

const SubmitAppealDialog = ({ open, onClose, onConfirm, gradingId, loading }) => {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>Submit Grade Appeal</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Describe clearly why you believe your grade should be reconsidered (min 20 characters).
        </Alert>
        <TextField
          fullWidth multiline rows={4}
          label="Reason for appeal"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          disabled={reason.trim().length < 20 || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Gavel />}
          onClick={() => onConfirm({ gradingId, reason })}
        >
          Submit Appeal
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── TakeExam panel ───────────────────────────────────────────────────────────

const TakeExamPanel = ({ attempt, onSubmitted, showSnack }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { remaining, display } = useCountdown(attempt?.endTime);
  const antiCheatSent = useRef(false);
  const submittingRef = useRef(false);
  const questionsRef  = useRef([]);

  // Load questions
  useEffect(() => {
    if (!attempt?.submissionId) return;
    examService.getDeliveryQuestions(attempt.submissionId)
      .then((res) => {
        const data = res.data?.data || {};
        const qs   = data.questions || [];
        setQuestions(qs);
        questionsRef.current = qs;
        const saved = {};
        (data.savedAnswers || []).forEach((a) => {
          saved[a.questionId] = a.selectedOption ?? a.openText ?? '';
        });
        setAnswers(saved);
      })
      .catch(() => showSnack('Failed to load questions.', 'error'))
      .finally(() => setLoading(false));
  // showSnack is stable (inline arrow in parent) — intentionally excluded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // Anti-cheat: detect tab switch
  useEffect(() => {
    if (!attempt?.submissionId) return;
    const handle = () => {
      if (document.hidden && !antiCheatSent.current) {
        antiCheatSent.current = true;
        examService.logAntiCheat(attempt.submissionId, { event: 'TAB_SWITCH' })
          .finally(() => { antiCheatSent.current = false; });
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [attempt]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      await examService.submitExam(attempt.submissionId);
      showSnack(auto ? 'Time up — exam submitted automatically.' : 'Exam submitted successfully.', 'success');
      onSubmitted();
    } catch (err) {
      showSnack(err.response?.data?.message || 'Submission failed.', 'error');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
      setConfirmOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, onSubmitted]);

  // Auto-submit when timer reaches zero
  useEffect(() => {
    if (remaining === 0 && questionsRef.current.length > 0) {
      handleSubmit(true);
    }
  }, [remaining, handleSubmit]);

  const handleAnswer = async (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setSaving((prev) => ({ ...prev, [questionId]: true }));
    try {
      await examService.saveAnswer(attempt.submissionId, { questionId, selectedOption: value });
    } catch {
      // silent — answer is still in local state
    } finally {
      setSaving((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleTextAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleTextBlur = async (questionId) => {
    setSaving((prev) => ({ ...prev, [questionId]: true }));
    try {
      await examService.saveAnswer(attempt.submissionId, {
        questionId,
        openText: answers[questionId] || '',
      });
    } catch {
      // silent
    } finally {
      setSaving((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  if (loading) {
    return <Box textAlign="center" py={6}><CircularProgress /></Box>;
  }

  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== '' && answers[k] != null).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const timeWarning = remaining > 0 && remaining < 300; // < 5 min

  return (
    <Box>
      {/* Timer + progress bar */}
      <Paper sx={{ p: 2, mb: 3, position: 'sticky', top: 64, zIndex: 10 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2">
            {answeredCount} / {questions.length} answered
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Timer color={timeWarning ? 'error' : 'action'} />
            <Typography
              variant="h6"
              fontWeight={700}
              color={timeWarning ? 'error.main' : 'text.primary'}
            >
              {display}
            </Typography>
          </Stack>
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1 }} />
      </Paper>

      {timeWarning && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          Less than 5 minutes remaining!
        </Alert>
      )}

      {/* Questions */}
      <Stack spacing={3} mb={4}>
        {questions.map((q, idx) => (
          <Paper key={q._id} sx={{ p: 3 }} variant="outlined">
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography variant="subtitle1" fontWeight={600}>
                Q{idx + 1}. {q.questionText}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {saving[q._id] && <CircularProgress size={14} />}
                <Chip label={`${q.points ?? 1} pt${(q.points ?? 1) > 1 ? 's' : ''}`} size="small" variant="outlined" />
              </Stack>
            </Stack>

            {/* MCQ */}
            {q.questionType === 'MCQ' && (
              <RadioGroup
                value={answers[q._id] ?? ''}
                onChange={(e) => handleAnswer(q._id, e.target.value)}
              >
                {(q.options || []).map((opt, oi) => (
                  <FormControlLabel
                    key={oi}
                    value={opt.text}
                    control={<Radio />}
                    label={opt.text}
                  />
                ))}
              </RadioGroup>
            )}

            {/* Open / Essay */}
            {['OPEN', 'ESSAY', 'SHORT_ANSWER'].includes(q.questionType) && (
              <TextField
                fullWidth
                multiline
                rows={q.questionType === 'ESSAY' ? 6 : 3}
                placeholder="Your answer…"
                value={answers[q._id] ?? ''}
                onChange={(e) => handleTextAnswer(q._id, e.target.value)}
                onBlur={() => handleTextBlur(q._id)}
              />
            )}

            {/* True/False */}
            {q.questionType === 'TRUE_FALSE' && (
              <RadioGroup
                value={answers[q._id] ?? ''}
                onChange={(e) => handleAnswer(q._id, e.target.value)}
                row
              >
                <FormControlLabel value="true"  control={<Radio />} label="True"  />
                <FormControlLabel value="false" control={<Radio />} label="False" />
              </RadioGroup>
            )}
          </Paper>
        ))}
      </Stack>

      {/* Submit */}
      <Box textAlign="right">
        <Button
          variant="contained" size="large" color="success"
          startIcon={submitting ? <CircularProgress size={18} /> : <Send />}
          onClick={() => setConfirmOpen(true)}
          disabled={submitting}
        >
          Submit Exam
        </Button>
      </Box>

      {/* Confirm submit dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" disableEnforceFocus closeAfterTransition={false}>
        <DialogTitle>Submit Exam?</DialogTitle>
        <DialogContent>
          <Typography>
            You have answered {answeredCount} of {questions.length} questions.
            {answeredCount < questions.length && (
              <strong> {questions.length - answeredCount} question(s) left unanswered.</strong>
            )}
          </Typography>
          <Typography mt={1} color="text.secondary">This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>Back</Button>
          <Button
            variant="contained" color="success"
            startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            Confirm Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const ExamStudent = () => {
  const [tab, setTab] = useState(0);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });
  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // active exam attempt (set when student starts an exam)
  const [activeAttempt, setActiveAttempt] = useState(null);

  // ── My Exams ───────────────────────────────────────────────────────────────
  const [sessions, setSessions]           = useState([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPage, setSessionsPage]   = useState(0);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [startingId, setStartingId]       = useState(null);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await examService.listSessions({
        status: 'SCHEDULED,ONGOING',
        page: sessionsPage + 1,
        limit: 10,
      });
      setSessions(res.data?.data?.sessions || res.data?.data || []);
      setSessionsTotal(res.data?.pagination?.total || 0);
    } catch {
      showSnack('Failed to load sessions.', 'error');
    } finally {
      setSessionsLoading(false);
    }
  }, [sessionsPage]);

  useEffect(() => { if (tab === 0) loadSessions(); }, [tab, loadSessions]);

  const handleStartExam = async (session) => {
    setStartingId(session._id);
    try {
      const res = await examService.startAttempt(session._id);
      const data = res.data?.data || {};
      setActiveAttempt({
        submissionId: data.submissionId,
        sessionTitle: session.title,
        startedAt:    data.startedAt,
        endTime:      data.endTime,
        duration:     data.duration,
      });
      setTab(1);
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to start exam.', 'error');
    } finally {
      setStartingId(null);
    }
  };

  // ── My Results ─────────────────────────────────────────────────────────────
  const [results, setResults]           = useState([]);
  const [resultsTotal, setResultsTotal] = useState(0);
  const [resultsPage, setResultsPage]   = useState(0);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [appealDialog, setAppealDialog] = useState({ open: false, gradingId: null });
  const [appealLoading, setAppealLoading] = useState(false);

  const loadResults = useCallback(async () => {
    setResultsLoading(true);
    try {
      const res = await examService.listGradings({ status: 'PUBLISHED', page: resultsPage + 1, limit: 10 });
      setResults(res.data?.data?.gradings || res.data?.data || []);
      setResultsTotal(res.data?.pagination?.total || 0);
    } catch {
      showSnack('Failed to load results.', 'error');
    } finally {
      setResultsLoading(false);
    }
  }, [resultsPage]);

  useEffect(() => { if (tab === 2) loadResults(); }, [tab, loadResults]);

  const handleSubmitAppeal = async ({ gradingId, reason }) => {
    setAppealLoading(true);
    try {
      await examService.submitAppeal({ gradingId, reason });
      showSnack('Appeal submitted successfully.');
      setAppealDialog({ open: false, gradingId: null });
    } catch (err) {
      showSnack(err.response?.data?.message || 'Failed to submit appeal.', 'error');
    } finally {
      setAppealLoading(false);
    }
  };

  // ── My Appeals ─────────────────────────────────────────────────────────────
  const [appeals, setAppeals]           = useState([]);
  const [appealsTotal, setAppealsTotal] = useState(0);
  const [appealsPage, setAppealsPage]   = useState(0);
  const [appealsLoading, setAppealsLoading] = useState(false);

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

  useEffect(() => { if (tab === 3) loadAppeals(); }, [tab, loadAppeals]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Typography variant="h5" fontWeight={700} mb={3}>Examination</Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="My Exams"   icon={<Assignment fontSize="small" />}  iconPosition="start" />
          <Tab
            label="Take Exam"
            icon={<PlayArrow fontSize="small" />}
            iconPosition="start"
            disabled={!activeAttempt}
          />
          <Tab label="My Results" icon={<Grade fontSize="small" />}      iconPosition="start" />
          <Tab label="My Appeals" icon={<Gavel fontSize="small" />}      iconPosition="start" />
        </Tabs>
      </Paper>

      {/* ── Tab 0: My Exams ─────────────────────────────────────────────── */}
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
                <TableCell>Exam</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Mode</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessionsLoading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : sessions.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No upcoming exams.</TableCell></TableRow>
              ) : (
                sessions.map((s) => {
                  const meta = SESSION_STATUS[s.status] || { label: s.status, color: 'default' };
                  const isStarting = startingId === s._id;
                  return (
                    <TableRow key={s._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{s.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.academicYear} · {s.semester} · {s.examPeriod}
                        </Typography>
                      </TableCell>
                      <TableCell>{s.subject?.subjectName || '—'}</TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {fDateTime(s.startTime)}
                        </Typography>
                      </TableCell>
                      <TableCell>{s.duration} min</TableCell>
                      <TableCell>{s.mode}</TableCell>
                      <TableCell>
                        <Chip label={meta.label} color={meta.color} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        {s.status === 'ONGOING' && s.mode !== 'PHYSICAL' && (
                          <Button
                            size="small" variant="contained" color="warning"
                            startIcon={isStarting ? <CircularProgress size={14} /> : <PlayArrow />}
                            disabled={isStarting}
                            onClick={() => handleStartExam(s)}
                          >
                            {activeAttempt?.sessionTitle === s.title ? 'Resume' : 'Start'}
                          </Button>
                        )}
                        {s.status === 'SCHEDULED' && (
                          <Chip label="Not started yet" size="small" variant="outlined" />
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

      {/* ── Tab 1: Take Exam ─────────────────────────────────────────────── */}
      {tab === 1 && activeAttempt && (
        <Box>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>{activeAttempt.sessionTitle}</Typography>
            <Typography variant="caption" color="text.secondary">
              Started at {fTime(activeAttempt.startedAt)}
            </Typography>
          </Paper>
          <TakeExamPanel
            attempt={activeAttempt}
            showSnack={showSnack}
            onSubmitted={() => {
              setActiveAttempt(null);
              setTab(2);
              loadResults();
            }}
          />
        </Box>
      )}

      {/* ── Tab 2: My Results ────────────────────────────────────────────── */}
      {tab === 2 && (
        <Paper>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title="Refresh">
              <IconButton onClick={loadResults} disabled={resultsLoading}><Refresh /></IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Feedback</TableCell>
                <TableCell align="right">Appeal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resultsLoading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : results.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No published results yet.</TableCell></TableRow>
              ) : (
                results.map((g) => {
                  const meta  = GRADING_STATUS[g.status] || { label: g.status, color: 'default' };
                  const score = g.finalScore ?? g.score;
                  const pct   = score != null && g.maxScore ? (score / g.maxScore) * 100 : null;
                  return (
                    <TableRow key={g._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {g.examSession?.title || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {g.examSession?.subject?.subjectName || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {score != null ? (
                          <Stack spacing={0.5}>
                            <Typography
                              variant="body2" fontWeight={700}
                              color={pct >= 50 ? 'success.main' : 'error.main'}
                            >
                              {score} / {g.maxScore}
                            </Typography>
                            <LinearProgress
                              variant="determinate" value={pct}
                              color={pct >= 50 ? 'success' : 'error'}
                              sx={{ width: 80, borderRadius: 1 }}
                            />
                          </Stack>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={meta.label} color={meta.color} size="small" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="caption" color="text.secondary">
                          {g.graderFeedback || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {g.status === 'PUBLISHED' && (
                          <Button
                            size="small" variant="outlined" color="warning"
                            startIcon={<Gavel />}
                            onClick={() => setAppealDialog({ open: true, gradingId: g._id })}
                          >
                            Appeal
                          </Button>
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
            component="div" count={resultsTotal} page={resultsPage}
            rowsPerPage={10} rowsPerPageOptions={[10]}
            onPageChange={(_, p) => setResultsPage(p)}
          />
        </Paper>
      )}

      {/* ── Tab 3: My Appeals ────────────────────────────────────────────── */}
      {tab === 3 && (
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
                <TableCell>Exam</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Resolution</TableCell>
                <TableCell>Submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appealsLoading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress size={24} /></TableCell></TableRow>
              ) : appeals.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No appeals submitted.</TableCell></TableRow>
              ) : (
                appeals.map((a) => {
                  const meta = APPEAL_STATUS[a.status] || { label: a.status, color: 'default' };
                  return (
                    <TableRow key={a._id} hover>
                      <TableCell>{a.grading?.examSession?.title || '—'}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="caption">{a.reason}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={meta.label} color={meta.color} size="small" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="caption" color="text.secondary">
                          {a.resolution || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {fDate(a.createdAt)}
                        </Typography>
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
      <SubmitAppealDialog
        key={appealDialog.gradingId ?? 'appeal'}
        open={appealDialog.open}
        onClose={() => setAppealDialog({ open: false, gradingId: null })}
        gradingId={appealDialog.gradingId}
        loading={appealLoading}
        onConfirm={handleSubmitAppeal}
      />

      {/* Snackbar */}
      {snack.open && (
        <Box sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
          <Alert
            severity={snack.severity}
            onClose={() => setSnack((p) => ({ ...p, open: false }))}
            sx={{ boxShadow: 3 }}
          >
            {snack.msg}
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default ExamStudent;
