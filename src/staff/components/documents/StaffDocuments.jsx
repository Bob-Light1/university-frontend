import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip,
  TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Alert, Pagination,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Skeleton,
} from '@mui/material';
import { Search, FolderOpen } from '@mui/icons-material';

import { getStaffDocuments } from '../../../services/staffService';
import PermissionGate         from '../shared/PermissionGate';

const STAFF_PRIMARY = '#00695C';

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const CATEGORY_COLORS = {
  ADMINISTRATIVE: { bg: '#e3f2fd', color: '#1565c0' },
  ACADEMIC:       { bg: '#e8f5e9', color: '#2e7d32' },
  FINANCIAL:      { bg: '#fff8e1', color: '#f57f17' },
  LEGAL:          { bg: '#fce4ec', color: '#c62828' },
  GENERAL:        { bg: '#f5f5f5', color: '#616161' },
};

function DocumentsList() {
  const [docs,     setDocs]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [type,     setType]     = useState('');

  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffDocuments({
        page,
        limit:    LIMIT,
        search:   search   || undefined,
        category: category || undefined,
        type:     type     || undefined,
      });
      setDocs(res.data?.data ?? []);
      setTotal(res.data?.pagination?.total ?? 0);
    } catch {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  }, [page, search, category, type]);

  useEffect(() => { load(); }, [load]);

  const resetPage = () => setPage(1);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <FolderOpen sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Documents</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} published document{total !== 1 ? 's' : ''} on your campus
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search title or description…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select value={category} label="Category" onChange={(e) => { setCategory(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All categories</MenuItem>
            <MenuItem value="ADMINISTRATIVE">Administrative</MenuItem>
            <MenuItem value="ACADEMIC">Academic</MenuItem>
            <MenuItem value="FINANCIAL">Financial</MenuItem>
            <MenuItem value="LEGAL">Legal</MenuItem>
            <MenuItem value="GENERAL">General</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select value={type} label="Type" onChange={(e) => { setType(e.target.value); resetPage(); }} sx={{ borderRadius: 2 }}>
            <MenuItem value="">All types</MenuItem>
            <MenuItem value="NOTICE">Notice</MenuItem>
            <MenuItem value="REPORT">Report</MenuItem>
            <MenuItem value="FORM">Form</MenuItem>
            <MenuItem value="CERTIFICATE">Certificate</MenuItem>
            <MenuItem value="CIRCULAR">Circular</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tags</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 5 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                  ))
                : docs.length === 0
                  ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No documents found.
                      </TableCell>
                    </TableRow>
                  )
                  : docs.map((d) => {
                      const cc = CATEGORY_COLORS[d.category] ?? CATEGORY_COLORS.GENERAL;
                      return (
                        <TableRow key={d._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{d.title}</Typography>
                            {d.description && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {d.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{d.type ?? '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            {d.category && (
                              <Chip label={d.category} size="small" sx={{ bgcolor: cc.bg, color: cc.color, fontWeight: 600 }} />
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" flexWrap="wrap" gap={0.5}>
                              {(d.tags ?? []).slice(0, 3).map((tag, i) => (
                                <Chip key={i} label={tag} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">{fmtDate(d.createdAt)}</Typography>
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

export default function StaffDocuments() {
  return (
    <PermissionGate anyOf={['documents.read', 'documents.manage']}>
      <DocumentsList />
    </PermissionGate>
  );
}
