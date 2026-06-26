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
  Drawer, Alert, Snackbar, Divider,
} from '@mui/material';
import {
  Search, FilterListOff, FileDownload, Visibility, Delete,
  People, CheckCircle, HourglassEmpty, TrendingUp,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import useLead        from '../../../hooks/useLead';
import KPICards       from '../../../components/shared/KpiCard';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import {
  LEAD_STATUS_COLOR, LEAD_STATUS_LABEL, LEAD_SOURCE_LABEL,
} from '../../../theme/partnerTokens';

import LeadDetailDrawer from './LeadDetailDrawer';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <TableRow>
    {Array.from({ length: 7 }).map((_, i) => (
      <TableCell key={i}><Skeleton variant="text" /></TableCell>
    ))}
  </TableRow>
);

const SkeletonCard = () => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </Box>
      <Skeleton variant="rounded" width={70} height={22} />
    </Stack>
    <Skeleton variant="text" width="80%" />
    <Skeleton variant="text" width="50%" />
  </Paper>
);

// ─── Mobile lead card ─────────────────────────────────────────────────────────

const LeadCard = ({ lead, onView, onDelete }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2, borderRadius: 2,
      cursor: 'pointer',
      '&:hover': { boxShadow: 2 },
      transition: 'box-shadow 0.15s',
    }}
    onClick={() => onView(lead)}
  >
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle2" fontWeight={700} noWrap>
            {lead.firstName} {lead.lastName}
          </Typography>
          {lead.honeypotTripped && (
            <Chip label="Bot" size="small" color="error" sx={{ fontSize: '0.65rem', height: 16 }} />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {lead.email}
        </Typography>
      </Box>
      <Chip
        label={LEAD_STATUS_LABEL[lead.status] ?? lead.status}
        color={LEAD_STATUS_COLOR[lead.status] ?? 'default'}
        size="small"
        sx={{ fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}
      />
    </Stack>

    <Divider sx={{ my: 1 }} />

    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }} flexWrap="wrap">
      {lead.partner && (
        <Typography variant="caption" color="text.secondary">
          {lead.partner.firstName} {lead.partner.lastName}
        </Typography>
      )}
      <Chip
        label={LEAD_SOURCE_LABEL[lead.source] ?? lead.source}
        size="small"
        variant="outlined"
        sx={{ fontSize: '0.72rem' }}
      />
      {lead.programInterest && (
        <Typography variant="caption" color="text.secondary">
          {lead.programInterest}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {new Date(lead.createdAt).toLocaleDateString()}
      </Typography>
    </Stack>

    <Stack direction="row" spacing={0.5} justifyContent="flex-end" onClick={(e) => e.stopPropagation()}>
      <Tooltip title="View Details">
        <IconButton size="medium" onClick={() => onView(lead)}>
          <Visibility fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Remove Lead">
        <IconButton
          size="medium"
          color="error"
          onClick={() => onDelete(lead._id)}
          disabled={!!lead.commissionId}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  </Paper>
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
        {Object.entries(LEAD_STATUS_LABEL).map(([v, l]) => (
          <MenuItem key={v} value={v}>{l}</MenuItem>
        ))}
      </Select>
    </FormControl>

    <FormControl size="small" sx={SX_SELECT}>
      <InputLabel>Source</InputLabel>
      <Select label="Source" value={filters.source} onChange={(e) => onChange('source', e.target.value)}>
        <MenuItem value="">All Sources</MenuItem>
        {Object.entries(LEAD_SOURCE_LABEL).map(([v, l]) => (
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
  const theme = useTheme();

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
      showSnackbar(`Lead status updated to "${LEAD_STATUS_LABEL[status] ?? status}".`, 'success');
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

  // ─── KPI metrics ────────────────────────────────────────────────────────────

  const kpiMetrics = [
    {
      label:    'Total Leads',
      value:    pagination.total,
      icon:     <People sx={{ fontSize: 28 }} />,
      color:    theme.palette.info.main,
      subtitle: 'All prospects',
    },
    {
      label:    'Enrolled',
      value:    kpis?.enrolled ?? 0,
      icon:     <CheckCircle sx={{ fontSize: 28 }} />,
      color:    theme.palette.success.dark,
      subtitle: 'Converted leads',
    },
    {
      label:    'In Progress',
      value:    (kpis?.contacted ?? 0) + (kpis?.dossier_submitted ?? 0) + (kpis?.admitted ?? 0),
      icon:     <HourglassEmpty sx={{ fontSize: 28 }} />,
      color:    theme.palette.warning.main,
      subtitle: 'Active pipeline',
    },
    {
      label:    'Conversion Rate',
      value:    pagination.total > 0
        ? `${Math.round(((kpis?.enrolled ?? 0) / pagination.total) * 100)}%`
        : '0%',
      icon:     <TrendingUp sx={{ fontSize: 28 }} />,
      color:    theme.palette.secondary.main,
      subtitle: 'Total → enrolled',
    },
  ];

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>

      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>Lead Pipeline</Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage all referral prospects.
          </Typography>
        </Box>
        <Button
          size="small" variant="outlined" startIcon={<FileDownload />}
          onClick={handleDownload}
          sx={{ textTransform: 'none', borderRadius: 2, alignSelf: { xs: 'flex-end', sm: 'auto' } }}
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

      {/* ── Desktop table (md+) ──────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
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
                        label={LEAD_SOURCE_LABEL[lead.source] ?? lead.source}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.72rem' }}
                      />
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Chip
                        label={LEAD_STATUS_LABEL[lead.status] ?? lead.status}
                        color={LEAD_STATUS_COLOR[lead.status] ?? 'default'}
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
      </Box>

      {/* ── Mobile cards (xs/sm) ─────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </Stack>
        ) : leads.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 5, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No leads found. Prospects will appear here when partners share their referral links.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {leads.map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                onView={handleOpenView}
                onDelete={handleDelete}
              />
            ))}
          </Stack>
        )}
      </Box>

      <TablePagination
        component="div"
        count={pagination.total}
        page={pagination.page - 1}
        rowsPerPage={pagination.limit}
        rowsPerPageOptions={[10, 25, 50]}
        onPageChange={(_, p) => setPage(p + 1)}
        onRowsPerPageChange={(e) => handleFilterChange('limit', parseInt(e.target.value, 10))}
      />

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{ sx: { width: { xs: '100vw', sm: 460 }, borderRadius: { sm: '16px 0 0 16px' } } }}
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
