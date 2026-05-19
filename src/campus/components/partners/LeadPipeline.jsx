/**
 * @file LeadPipeline.jsx
 * @description Campus Manager — Lead pipeline table.
 *
 * Uses useLead hook. Status transitions are handled inside LeadDetailDrawer.
 * The table shows all leads campus-wide (or partner-scoped if filtered).
 */

import { useState } from 'react';
import {
  Box, Stack, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Chip,
  TextField, FormControl, InputLabel, Select, MenuItem,
  InputAdornment, IconButton, Tooltip, Skeleton, Paper,
  Drawer, Alert, Snackbar,
} from '@mui/material';
import {
  Search, FilterListOff, FileDownload, Visibility, Delete,
  People, CheckCircle, Cancel, HourglassEmpty, TrendingUp,
} from '@mui/icons-material';

import useLead        from '../../../hooks/useLead';
import KPICards       from '../../../components/shared/KpiCard';
import useFormSnackbar from '../../../hooks/useFormSnackBar';

import LeadDetailDrawer from './LeadDetailDrawer';

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

// ─── Source label ─────────────────────────────────────────────────────────────

const SOURCE_LABEL = {
  qr_code:       'QR Code',
  referral_link: 'Link',
  manual_code:   'Manual',
  direct:        'Direct',
};

// ─── Skeleton row ─────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <TableRow>
    {Array.from({ length: 7 }).map((_, i) => (
      <TableCell key={i}><Skeleton variant="text" /></TableCell>
    ))}
  </TableRow>
);

// ─── Filter bar ───────────────────────────────────────────────────────────────

const SX_SELECT = { minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const Filters = ({ filters, onChange, onReset }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
    <TextField
      size="small"
      placeholder="Search name, email…"
      value={filters.search}
      onChange={(e) => onChange('search', e.target.value)}
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
      <Select label="Status" value={filters.status} onChange={(e) => onChange('status', e.target.value)}>
        <MenuItem value="">All Statuses</MenuItem>
        {Object.entries(STATUS_LABEL).map(([v, l]) => (
          <MenuItem key={v} value={v}>{l}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl size="small" sx={SX_SELECT}>
      <InputLabel>Source</InputLabel>
      <Select label="Source" value={filters.source} onChange={(e) => onChange('source', e.target.value)}>
        <MenuItem value="">All Sources</MenuItem>
        {Object.entries(SOURCE_LABEL).map(([v, l]) => (
          <MenuItem key={v} value={v}>{l}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <TextField
      size="small" type="date" label="From"
      value={filters.from} onChange={(e) => onChange('from', e.target.value)}
      sx={SX_SELECT} slotProps={{ inputLabel: { shrink: true } }}
    />
    <TextField
      size="small" type="date" label="To"
      value={filters.to} onChange={(e) => onChange('to', e.target.value)}
      sx={SX_SELECT} slotProps={{ inputLabel: { shrink: true } }}
    />

    <Button
      size="small" variant="outlined" startIcon={<FilterListOff />} onClick={onReset}
      sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'center' }}
    >
      Reset
    </Button>
  </Stack>
);

// ─── Main component ───────────────────────────────────────────────────────────

const LeadPipeline = () => {
  const {
    leads, kpis, pagination, filters, loading, error,
    fetch, handleFilterChange, handleReset, setPage,
    changeLeadStatus, removeLead, downloadCSV,
  } = useLead();

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [viewTarget,  setViewTarget]  = useState(null);

  const handleOpenView = (lead) => {
    setViewTarget(lead);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setViewTarget(null);
  };

  const handleStatusChange = async (id, status, note, tuitionFee) => {
    try {
      await changeLeadStatus(id, status, note, tuitionFee);
      showSnackbar(`Lead status updated to "${STATUS_LABEL[status] ?? status}".`, 'success');
      handleCloseDrawer();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to update lead status.', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await removeLead(id);
      showSnackbar('Lead removed.', 'success');
      if (viewTarget?._id === id) handleCloseDrawer();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to remove lead.', 'error');
    }
  };

  const handleDownload = async () => {
    try {
      await downloadCSV();
    } catch {
      showSnackbar('Export failed.', 'error');
    }
  };

  // ─── KPI metrics from backend summary ───────────────────────────────────────

  const kpiMetrics = [
    {
      label:    'Total Leads',
      value:    pagination.total,
      icon:     <People sx={{ fontSize: 28 }} />,
      color:    '#1976d2',
      subtitle: 'All prospects',
    },
    {
      label:    'Enrolled',
      value:    kpis?.enrolled ?? 0,
      icon:     <CheckCircle sx={{ fontSize: 28 }} />,
      color:    '#2e7d32',
      subtitle: 'Converted leads',
    },
    {
      label:    'In Progress',
      value:    (kpis?.contacted ?? 0) + (kpis?.dossier_submitted ?? 0) + (kpis?.admitted ?? 0),
      icon:     <HourglassEmpty sx={{ fontSize: 28 }} />,
      color:    '#ed6c02',
      subtitle: 'Active pipeline',
    },
    {
      label:    'Conversion Rate',
      value:    pagination.total > 0
        ? `${Math.round(((kpis?.enrolled ?? 0) / pagination.total) * 100)}%`
        : '0%',
      icon:     <TrendingUp sx={{ fontSize: 28 }} />,
      color:    '#9c27b0',
      subtitle: 'Total → enrolled',
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: 3 }}>

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Lead Pipeline</Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage all referral prospects.
          </Typography>
        </Box>
        <Button
          size="small" variant="outlined" startIcon={<FileDownload />}
          onClick={handleDownload}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Export CSV
        </Button>
      </Stack>

      {/* KPIs */}
      {!loading && <Box sx={{ mb: 2.5 }}><KPICards metrics={kpiMetrics} /></Box>}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={fetch}>{error}</Alert>
      )}

      {/* Filters */}
      <Filters filters={filters} onChange={handleFilterChange} onReset={handleReset} />

      {/* Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Prospect</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Partner</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Program</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                  No leads found. Prospects will appear here when partners share their referral links.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow
                  key={lead._id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleOpenView(lead)}
                >
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
                    {lead.honeypotTripped && (
                      <Chip label="Bot" size="small" color="error" sx={{ fontSize: '0.65rem', height: 16, mt: 0.3 }} />
                    )}
                  </TableCell>

                  <TableCell>
                    {lead.partner ? (
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {lead.partner.firstName} {lead.partner.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {lead.partnerCode}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
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

                  <TableCell onClick={(e) => e.stopPropagation()}>
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

                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => handleOpenView(lead)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove Lead">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(lead._id)}
                          disabled={!!lead.commissionId}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page - 1}
        rowsPerPage={pagination.limit}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_, p) => setPage(p + 1)}
        onRowsPerPageChange={() => {}}
      />

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: 460, borderRadius: '16px 0 0 16px' } }}
      >
        <LeadDetailDrawer
          lead={viewTarget}
          onClose={handleCloseDrawer}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={closeSnackbar} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeadPipeline;
