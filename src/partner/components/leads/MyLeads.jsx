/**
 * @file MyLeads.jsx
 * @description Partner portal — own lead list with filters and status view.
 *
 * Data: GET /partners/me/leads (PARTNER role — campus + partner scoped by JWT).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, TablePagination, TextField, FormControl,
  InputLabel, Select, MenuItem, Button, InputAdornment,
  CircularProgress, Alert, Skeleton,
} from '@mui/material';
import { Search, FilterListOff } from '@mui/icons-material';

import { getMyLeads } from '../../../services/partnerService';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  new:               'default',
  contacted:         'info',
  dossier_submitted: 'warning',
  admitted:          'secondary',
  enrolled:          'success',
  rejected:          'error',
  abandoned:         'default',
};

const STATUS_LABEL = {
  new:               'New',
  contacted:         'Contacted',
  dossier_submitted: 'Dossier',
  admitted:          'Admitted',
  enrolled:          'Enrolled',
  rejected:          'Rejected',
  abandoned:         'Abandoned',
};

const SOURCE_LABEL = {
  qr_code:       'QR Code',
  referral_link: 'Link',
  manual_code:   'Manual',
  direct:        'Direct',
};

const DEFAULT_FILTERS = { search: '', status: '', from: '', to: '', page: 1, limit: 20 };
const SX_SELECT = { minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } };

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyLeads() {
  const [leads,      setLeads]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters,    setFilters]    = useState(DEFAULT_FILTERS);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { ...filters };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });
    try {
      const res = await getMyLeads(params);
      const raw = res.data;
      setLeads(Array.isArray(raw?.data) ? raw.data : []);
      if (raw?.pagination) setPagination((p) => ({ ...p, ...raw.pagination }));
    } catch {
      setError('Failed to load leads. Please try again.');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  // ─── Summary chips (computed from current page) ─────────────────────────────

  const enrolled = leads.filter((l) => l.status === 'enrolled').length;
  const inProgress = leads.filter((l) =>
    ['contacted', 'dossier_submitted', 'admitted'].includes(l.status)
  ).length;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: 'auto' }}>

      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>My Leads</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        All prospects referred through your link or QR code.
      </Typography>

      {/* Summary chips */}
      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
        <Chip label={`${pagination.total} total`}   size="small" variant="outlined" />
        <Chip label={`${enrolled} enrolled`}        size="small" color="success" variant="outlined" />
        <Chip label={`${inProgress} in progress`}   size="small" color="warning" variant="outlined" />
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search name, email…"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <FormControl size="small" sx={SX_SELECT}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {Object.entries(STATUS_LABEL).map(([v, l]) => (
              <MenuItem key={v} value={v}>{l}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small" type="date" label="From"
          value={filters.from} onChange={(e) => handleFilterChange('from', e.target.value)}
          sx={SX_SELECT} slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small" type="date" label="To"
          value={filters.to} onChange={(e) => handleFilterChange('to', e.target.value)}
          sx={SX_SELECT} slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button
          size="small" variant="outlined" startIcon={<FilterListOff />}
          onClick={handleReset}
          sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'center' }}
        >
          Reset
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Prospect</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No leads found. Share your referral link or QR code to get started.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {lead.firstName} {lead.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{lead.email}</Typography>
                      {lead.phone && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {lead.phone}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{lead.programInterest || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={SOURCE_LABEL[lead.source] ?? lead.source}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[lead.status] ?? lead.status}
                        color={STATUS_COLOR[lead.status] ?? 'default'}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, p) => handleFilterChange('page', p + 1)}
          onRowsPerPageChange={(e) => handleFilterChange('limit', parseInt(e.target.value, 10))}
        />
      </Paper>
    </Box>
  );
}
