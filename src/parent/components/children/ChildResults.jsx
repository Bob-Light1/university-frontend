import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Chip, Avatar, CircularProgress,
  Alert, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, MenuItem, Select, FormControl, InputLabel,
  Grid,
} from '@mui/material';
import {
  ArrowBack, TrendingUp, School,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { getMyChildren, getChildResults } from '../../../services/parentService';
import { IMAGE_BASE_URL } from '../../../config/env';
import { fDate } from '../../../utils/dateFormat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const profileUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const GRADE_COLOR = { A: 'success', B: 'primary', C: 'info', D: 'warning', E: 'error', F: 'error' };

// ─── Child Header ─────────────────────────────────────────────────────────────

const ChildHeader = ({ student, children, onSelect, onBack }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2, mb: 3, borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Chip
          icon={<ArrowBack sx={{ color: 'white !important' }} />}
          label="Dashboard"
          onClick={onBack}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}
        />
        {children.map((c) => (
          <Chip
            key={c._id}
            avatar={<Avatar src={profileUrl(c.profileImage)} sx={{ width: 24, height: 24 }}>{c.firstName?.[0]}</Avatar>}
            label={`${c.firstName} ${c.lastName}`}
            onClick={() => onSelect(c._id)}
            color={c._id === student?._id ? 'default' : 'default'}
            sx={{
              bgcolor: c._id === student?._id ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
              color: 'white',
              fontWeight: c._id === student?._id ? 700 : 400,
              cursor: 'pointer',
            }}
          />
        ))}
      </Stack>
      {student && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Avatar
            src={profileUrl(student.profileImage)}
            sx={{ width: 48, height: 48, border: '2px solid white' }}
          >
            {student.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{student.firstName} {student.lastName}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Academic Results</Typography>
          </Box>
        </Stack>
      )}
    </Paper>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ChildResults = () => {
  const { studentId } = useParams();
  const navigate      = useNavigate();

  const [children, setChildren]       = useState([]);
  const [results,  setResults]        = useState([]);
  const [total,    setTotal]          = useState(0);
  const [page,     setPage]           = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading,  setLoading]        = useState(true);
  const [error,    setError]          = useState(null);
  const [filters,  setFilters]        = useState({ academicYear: '', semester: '' });

  const student = children.find((c) => c._id === studentId);

  // ── Fetch children list once ───────────────────────────────────────────────
  useEffect(() => {
    getMyChildren()
      .then(({ data }) => setChildren(data.data?.children ?? []))
      .catch(() => {});
  }, []);

  // ── Fetch results when studentId / page / filters change ──────────────────
  const fetchResults = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    getChildResults(studentId, {
      page:         page + 1,
      limit:        rowsPerPage,
      academicYear: filters.academicYear || undefined,
      semester:     filters.semester     || undefined,
    })
      .then(({ data }) => {
        setResults(data.data?.results ?? []);
        setTotal(data.data?.total    ?? 0);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load results.'))
      .finally(() => setLoading(false));
  }, [studentId, page, rowsPerPage, filters]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleSelect = (id) => navigate(`/parent/children/${id}/results`);
  const handleBack   = () => navigate('/parent');

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <ChildHeader
        student={student}
        children={children}
        onSelect={handleSelect}
        onBack={handleBack}
      />

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Academic Year</InputLabel>
          <Select
            value={filters.academicYear}
            label="Academic Year"
            onChange={(e) => { setFilters((f) => ({ ...f, academicYear: e.target.value })); setPage(0); }}
          >
            <MenuItem value="">All Years</MenuItem>
            {['2025-2026', '2024-2025', '2023-2024'].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Semester</InputLabel>
          <Select
            value={filters.semester}
            label="Semester"
            onChange={(e) => { setFilters((f) => ({ ...f, semester: e.target.value })); setPage(0); }}
          >
            <MenuItem value="">All</MenuItem>
            {/* Values MUST match the backend SEMESTER enum (S1/S2/Annual);
                sending 1/2/3 silently returned zero results. */}
            {[['S1', 'Semester 1'], ['S2', 'Semester 2'], ['Annual', 'Annual']].map(([v, l]) => (
              <MenuItem key={v} value={v}>{l}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Table */}
      <Paper elevation={2} sx={{ borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>
        ) : results.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <TrendingUp sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No published results found.</Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><Typography variant="caption" fontWeight={700}>Subject</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Evaluation</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Year / Semester</Typography></TableCell>
                  <TableCell align="center"><Typography variant="caption" fontWeight={700}>Score</Typography></TableCell>
                  <TableCell align="center"><Typography variant="caption" fontWeight={700}>Grade</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Teacher</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Published</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <School fontSize="small" color="primary" />
                        <Typography variant="body2" fontWeight={500}>
                          {r.subject?.subject_name || '—'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.evaluationTitle || r.evaluationType || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {r.academicYear} {r.semester ? `· ${r.semester}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700}>
                        {r.normalizedScore != null ? r.normalizedScore : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {/* gradeBand is an object snapshot ({ letterGrade, label, … }) —
                          render its letterGrade, never the object itself. */}
                      {r.gradeBand?.letterGrade ? (
                        <Chip
                          label={r.gradeBand.letterGrade}
                          size="small"
                          color={GRADE_COLOR[r.gradeBand.letterGrade] || 'default'}
                          sx={{ fontWeight: 700, minWidth: 30 }}
                        />
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {r.teacher ? `${r.teacher.firstName} ${r.teacher.lastName}` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{fDate(r.publishedAt)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ChildResults;
