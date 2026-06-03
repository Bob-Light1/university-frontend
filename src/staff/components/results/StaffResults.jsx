import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip,
  TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Alert, Pagination,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
} from '@mui/material';
import { Search, Assessment } from '@mui/icons-material';

import { getStaffResults } from '../../../services/staffService';
import { IMAGE_BASE_URL }  from '../../../config/env';
import PermissionGate      from '../shared/PermissionGate';

const STAFF_PRIMARY = '#00695C';

const imgUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const gradeColor = (score, max) => {
  if (!max) return {};
  const pct = score / max;
  if (pct >= 0.75) return { bg: '#e8f5e9', color: '#2e7d32' };
  if (pct >= 0.50) return { bg: '#fff3e0', color: '#e65100' };
  return { bg: '#fdecea', color: '#c62828' };
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = CURRENT_YEAR - i;
  return `${y}-${y + 1}`;
});

function ResultsList() {
  const [results,  setResults]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [semester, setSemester] = useState('');
  const [year,     setYear]     = useState('');
  const [evalType, setEvalType] = useState('');

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffResults({
        page,
        limit:          LIMIT,
        academicYear:   year     || undefined,
        semester:       semester || undefined,
        evaluationType: evalType || undefined,
      });
      setResults(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setError('Failed to load results.');
    } finally {
      setLoading(false);
    }
  }, [page, year, semester, evalType]);

  useEffect(() => { load(); }, [load]);

  const resetPage = () => setPage(1);

  // Client-side text filter within the current page
  const displayed = search
    ? results.filter((r) => {
        const name = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();
        const subj = (r.subject?.subject_name ?? '').toLowerCase();
        const mat  = (r.student?.matricule ?? '').toLowerCase();
        const q    = search.toLowerCase();
        return name.includes(q) || subj.includes(q) || mat.includes(q);
      })
    : results;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Assessment sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Results</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} published result{total !== 1 ? 's' : ''} on your campus
          </Typography>
        </Box>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Filter by student or subject…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 2, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Academic Year</InputLabel>
          <Select value={year} label="Academic Year" onChange={(e) => { setYear(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All years</MenuItem>
            {YEARS.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Semester</InputLabel>
          <Select value={semester} label="Semester" onChange={(e) => { setSemester(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="S1">S1</MenuItem>
            <MenuItem value="S2">S2</MenuItem>
            <MenuItem value="Annual">Annual</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Eval. Type</InputLabel>
          <Select value={evalType} label="Eval. Type" onChange={(e) => { setEvalType(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All types</MenuItem>
            <MenuItem value="CC">CC</MenuItem>
            <MenuItem value="EXAM">Exam</MenuItem>
            <MenuItem value="RETAKE">Retake</MenuItem>
            <MenuItem value="PROJECT">Project</MenuItem>
            <MenuItem value="PRACTICAL">Practical</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Evaluation</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Score</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">/ 20</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : displayed.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No results found.
                      </TableCell>
                    </TableRow>
                  )
                  : displayed.map((r) => {
                      const gc = gradeColor(r.score, r.maxScore);
                      const norm = r.normalizedScore ?? (r.maxScore ? +((r.score / r.maxScore) * 20).toFixed(2) : null);
                      return (
                        <TableRow key={r._id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar src={imgUrl(r.student?.profileImage)} sx={{ width: 30, height: 30, fontSize: 12 }}>
                                {r.student?.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {r.student?.firstName} {r.student?.lastName}
                                </Typography>
                                {r.student?.matricule && (
                                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                                    {r.student.matricule}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{r.subject?.subject_name ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{r.evaluationTitle ?? '—'}</Typography>
                            {r.evaluationType && (
                              <Chip label={r.evaluationType} size="small" sx={{ mt: 0.3, height: 16, fontSize: 10 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{r.semester ?? '—'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {r.score ?? '—'}/{r.maxScore ?? '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {norm !== null && (
                              <Chip
                                label={norm}
                                size="small"
                                sx={{ bgcolor: gc.bg, color: gc.color, fontWeight: 700, minWidth: 44 }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {totalPages > 1 && (
        <Stack alignItems="center" sx={{ mt: 2.5 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" />
        </Stack>
      )}
    </Box>
  );
}

export default function StaffResults() {
  return (
    <PermissionGate anyOf={['results.read', 'results.manage']}>
      <ResultsList />
    </PermissionGate>
  );
}
