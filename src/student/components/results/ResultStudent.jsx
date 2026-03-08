/**
 * @file ResultStudent.jsx
 * @description Self-service result & transcript page for STUDENT role.
 *
 * Features:
 *  - KPI cards: total results, average /20, pass rate, dropout risk colour
 *  - Tabbed view: My Grades | Transcript (by semester)
 *  - Live transcript (aggregated server-side)
 *  - Grade detail drawer (read-only — no actions)
 *  - Score colour coding per semester/subject
 *
 * Security: Backend ensures student only sees their own PUBLISHED results.
 */

import { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Grid, Stack, Alert, Paper,
  Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, IconButton, Tooltip, CircularProgress,
  Chip, Divider, Tab, Tabs, Accordion, AccordionSummary,
  AccordionDetails, LinearProgress, Avatar,
} from '@mui/material';
import {
  ExpandMore, School, TrendingUp, CheckCircle,
  Visibility, ErrorOutline,
} from '@mui/icons-material';

import { AuthContext } from '../../../context/AuthContext';
import KPICards from '../../../components/shared/KpiCard';

import useResult from '../../../hooks/useResult';
import { getResultById, getTranscript } from '../../../services/result.service';

import ResultDetailDrawer from '../../../components/results/ResultDetailDrawer';
import {
  ResultStatusChip, EvalTypeChip, ScoreDisplay, ResultEmptyState,
  SCORE_COLOR, RESULT_STATUS_META,
} from '../../../components/results/ResultShared';

// ─── Progress bar with colour ─────────────────────────────────────────────────

const ScoreBar = ({ score }) => {
  const pct = Math.round(((score ?? 0) / 20) * 100);
  const color = score == null ? 'grey'
    : score < 7  ? 'error'
    : score < 10 ? 'warning'
    : score < 14 ? 'info'
    : 'success';

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(pct, 100)}
          color={color}
          sx={{ height: 6, borderRadius: 3 }}
        />
      </Box>
      <Typography variant="caption" fontWeight={700} color={`${color}.main`} sx={{ minWidth: 32 }}>
        {score != null ? `${score}` : '—'}
      </Typography>
    </Stack>
  );
};

// ─── Semester accordion ────────────────────────────────────────────────────────

const SemesterBlock = ({ semData }) => (
  <Accordion defaultExpanded variant="outlined" sx={{ borderRadius: 2, mb: 2, '&:first-of-type': { borderRadius: 2 } }}>
    <AccordionSummary expandIcon={<ExpandMore />}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
        <Typography fontWeight={700}>
          {semData.semester} — {semData.academicYear}
        </Typography>
        <Chip
          size="small"
          label={semData.generalAverage != null ? `Avg: ${semData.generalAverage} / 20` : 'No avg'}
          color={semData.generalAverage != null
            ? semData.generalAverage >= 10 ? 'success' : 'error'
            : 'default'}
        />
      </Stack>
    </AccordionSummary>
    <AccordionDetails sx={{ p: 0 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Avg / 20</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Evaluations</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {semData.subjects.map((sub) => (
            <TableRow key={sub.subjectId} hover>
              <TableCell>
                <Typography variant="body2" fontWeight={500}>{sub.subjectName}</Typography>
                <Typography variant="caption" color="text.secondary">{sub.subjectCode}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" fontWeight={700}
                  color={SCORE_COLOR(sub.average)}>
                  {sub.average ?? '—'}
                </Typography>
              </TableCell>
              <TableCell sx={{ minWidth: 160 }}>
                <ScoreBar score={sub.average} />
              </TableCell>
              <TableCell>
                <Stack spacing={0.25}>
                  {sub.evaluations?.map((ev, i) => (
                    <Stack key={i} direction="row" spacing={0.5} alignItems="center">
                      <EvalTypeChip type={ev.evaluationType} size="small" />
                      <Typography variant="caption" color="text.secondary">{ev.evaluationTitle}:</Typography>
                      <Typography variant="caption" fontWeight={700}
                        color={SCORE_COLOR(ev.normalizedScore)}>
                        {ev.normalizedScore?.toFixed(2) ?? `${ev.score}/${ev.maxScore}`}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </AccordionDetails>
  </Accordion>
);

// ─── Main component ───────────────────────────────────────────────────────────

const ResultStudent = () => {
  const { user } = useContext(AuthContext);
  const studentId = user?._id ?? user?.id ?? '';

  const {
    results, summary, loading, error,
    pagination, filters,
    handleFilterChange, setPage,
  } = useResult('student');

  const [tab,            setTab]            = useState(0);
  const [transcript,     setTranscript]     = useState(null);
  const [transcriptLoad, setTranscriptLoad] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailOpen,     setDetailOpen]     = useState(false);

  // Load transcript on tab switch
  useEffect(() => {
    if (tab !== 1 || !studentId) return;
    const load = async () => {
      setTranscriptLoad(true);
      try {
        const res = await getTranscript(studentId);
        setTranscript(res.data?.data ?? null);
      } catch { setTranscript(null); }
      finally { setTranscriptLoad(false); }
    };
    load();
  }, [tab, studentId]);

  // Open detail drawer
  const openDetail = async (id) => {
    try {
      const res = await getResultById(id);
      setSelectedResult(res.data?.data ?? null);
      setDetailOpen(true);
    } catch { /* silent */ }
  };

  // KPI metrics
  const kpiMetrics = [
    { key: 'total',    label: 'My Results',   value: pagination.total ?? summary.total,
      icon: <School />,      color: '#3b82f6' },
    { key: 'avg',      label: 'General Avg',  value: summary.avg?.toFixed(2) ?? '—',
      icon: <TrendingUp />,  color: '#10b981' },
    { key: 'passRate', label: 'Pass Rate',    value: summary.passRate != null ? `${summary.passRate}%` : '—',
      icon: <CheckCircle />, color: '#8b5cf6' },
    { key: 'published',label: 'Published',    value: summary.published,
      icon: <CheckCircle />, color: '#14b8a6' },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h5" fontWeight={700}>My Grades</Typography>
        <Typography variant="body2" color="text.secondary">
          View your academic results and transcripts
        </Typography>
      </Box>

      {/* KPIs */}
      <Box mb={3}>
        <KPICards metrics={kpiMetrics} loading={loading} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="My Grades" />
        <Tab label="Transcript" />
      </Tabs>

      {/* ── Tab 0: Grade list ────────────────────────────────────────────── */}
      {tab === 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Evaluation</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Detail</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : results.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <ResultEmptyState
                        message="No results published yet"
                        subtext="Your grades will appear here once your teacher publishes them."
                      />
                    </TableCell>
                  </TableRow>
                ) : results.map((r) => (
                  <TableRow key={r._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {r.subject?.subject_name ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {r.subject?.subject_code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.evaluationTitle}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{r.semester} {r.academicYear}</Typography>
                    </TableCell>
                    <TableCell>
                      <ScoreDisplay
                        score={r.normalizedScore}
                        rawScore={r.score}
                        maxScore={r.maxScore}
                      />
                    </TableCell>
                    <TableCell>
                      <EvalTypeChip type={r.evaluationType} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View details">
                        <IconButton size="small" onClick={() => openDetail(r._id)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
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

      {/* ── Tab 1: Transcript ────────────────────────────────────────────── */}
      {tab === 1 && (
        <Box>
          {transcriptLoad ? (
            <Box textAlign="center" py={8}><CircularProgress /></Box>
          ) : !transcript ? (
            <Alert severity="info">No transcript data available yet.</Alert>
          ) : (
            <>
              {/* Student header */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {transcript.student?.firstName} {transcript.student?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Matricule: {transcript.student?.matricule ?? '—'}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              {/* Semester blocks */}
              {transcript.semesters?.length === 0 ? (
                <ResultEmptyState message="No published results yet" />
              ) : (
                transcript.semesters?.map((sem) => (
                  <SemesterBlock
                    key={`${sem.academicYear}-${sem.semester}`}
                    semData={sem}
                  />
                ))
              )}
            </>
          )}
        </Box>
      )}

      {/* Detail drawer — student: read only, no workflow actions */}
      <ResultDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        result={selectedResult}
        canPublish={false}
        canAudit={false}
      />
    </Box>
  );
};

export default ResultStudent;