import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Avatar, Chip,
  TextField, InputAdornment, Alert, Pagination,
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

function ResultsList() {
  const [results, setResults] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState('');

  const LIMIT = 20;

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffResults({ page, limit: LIMIT });
      setResults(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setError('Failed to load results.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const displayed = search
    ? results.filter((r) => {
        const name = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();
        const subj = (r.subject?.subject_name ?? '').toLowerCase();
        return name.includes(search.toLowerCase()) || subj.includes(search.toLowerCase());
      })
    : results;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Assessment sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Results</Typography>
          <Typography variant="body2" color="text.secondary">Published results on your campus</Typography>
        </Box>
      </Stack>

      <TextField
        size="small" fullWidth placeholder="Filter by student or subject…"
        value={search} onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        slotProps={{
          input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Evaluation</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Score</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Grade</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : displayed.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No results found.
                      </TableCell>
                    </TableRow>
                  )
                  : displayed.map((r) => {
                      const gc = gradeColor(r.score, r.maxScore);
                      return (
                        <TableRow key={r._id} hover>
                          <TableCell>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar src={imgUrl(r.student?.profileImage)} sx={{ width: 30, height: 30, fontSize: 12 }}>
                                {r.student?.firstName?.[0]}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600}>
                                {r.student?.firstName} {r.student?.lastName}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{r.subject?.subject_name ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{r.evaluationTitle ?? '—'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={600}>
                              {r.score ?? '—'}/{r.maxScore ?? '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {r.grade && (
                              <Chip label={r.grade} size="small" sx={{ bgcolor: gc.bg, color: gc.color, fontWeight: 700 }} />
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
