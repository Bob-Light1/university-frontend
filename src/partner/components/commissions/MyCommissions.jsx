/**
 * @file MyCommissions.jsx
 * @description Partner portal — own commission list with receipt download.
 *
 * Data: GET /partners/me/commissions (PARTNER role — campus + partner scoped by JWT).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, TablePagination, FormControl,
  InputLabel, Select, MenuItem, Button, IconButton,
  Tooltip, CircularProgress, Alert, Skeleton, TextField,
} from '@mui/material';
import {
  FilterListOff, Receipt, HourglassEmpty, CheckCircle, Paid, AttachMoney,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { getMyCommissions, downloadMyReceipt } from '../../../services/partnerService';
import {
  COMMISSION_STATUS_COLOR, COMMISSION_STATUS_LABEL,
} from '../../../theme/partnerTokens';

const DEFAULT_FILTERS = { status: '', from: '', to: '', page: 1, limit: 20 };
const SX_SELECT = { minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } };

// ─── Skeleton card ────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="55%" />
        <Skeleton variant="text" width="40%" />
      </Box>
      <Skeleton variant="rounded" width={70} height={22} />
    </Stack>
    <Skeleton variant="text" width="70%" />
  </Paper>
);

// ─── Mobile commission card ───────────────────────────────────────────────────

const CommissionCard = ({ comm, downloading, onDownload }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {comm.amount?.toLocaleString()} {comm.currency ?? 'XAF'}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
          {comm.lead ? `${comm.lead.firstName} ${comm.lead.lastName}` : 'No lead'}
        </Typography>
      </Box>
      <Chip
        label={COMMISSION_STATUS_LABEL[comm.status] ?? comm.status}
        color={COMMISSION_STATUS_COLOR[comm.status] ?? 'default'}
        size="small"
        sx={{ fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}
      />
    </Stack>

    <Divider sx={{ my: 1 }} />

    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
        <Chip
          label={comm.ruleSnapshot?.ruleType === 'PERCENTAGE'
            ? `${comm.ruleSnapshot.percentage}%`
            : 'Fixed'}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem' }}
        />
        <Typography variant="caption" color="text.secondary">
          {new Date(comm.createdAt).toLocaleDateString()}
        </Typography>
        {comm.status === 'paid' && comm.paidAt && (
          <Typography variant="caption" color="success.main">
            Paid {new Date(comm.paidAt).toLocaleDateString()}
          </Typography>
        )}
      </Stack>
      {comm.status === 'paid' && (
        <Tooltip title="Download receipt">
          <span>
            <IconButton
              size="small"
              disabled={downloading === comm._id}
              onClick={() => onDownload(comm._id)}
            >
              {downloading === comm._id
                ? <CircularProgress size={16} />
                : <Receipt fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  </Paper>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function MyCommissions() {
  const theme = useTheme();

  const [commissions, setCommissions] = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, limit: 20, total: 0 });
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [downloading, setDownloading] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { ...filters };
    Object.keys(params).forEach((k) => {
      if (params[k] === '' || params[k] == null) delete params[k];
    });
    try {
      const res = await getMyCommissions(params);
      const raw = res.data;
      setCommissions(Array.isArray(raw?.data) ? raw.data : []);
      if (raw?.pagination) setPagination((p) => ({ ...p, ...raw.pagination }));
    } catch {
      setError('Failed to load commissions. Please try again.');
      setCommissions([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const handleDownloadReceipt = async (id) => {
    setDownloading(id);
    try {
      const res = await downloadMyReceipt(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `receipt_${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Receipt download is not yet available for this commission.');
    } finally {
      setDownloading(null);
    }
  };

  const totalAmount = commissions
    .filter((c) => c.status === 'paid')
    .reduce((s, c) => s + (c.amount ?? 0), 0);

  const pending   = commissions.filter((c) => c.status === 'pending').length;
  const validated = commissions.filter((c) => c.status === 'validated').length;
  const paid      = commissions.filter((c) => c.status === 'paid').length;

  const summaryCards = [
    { label: 'Pending',   value: pending,                    icon: <HourglassEmpty />, color: theme.palette.warning.main  },
    { label: 'Validated', value: validated,                  icon: <CheckCircle />,    color: theme.palette.info.main     },
    { label: 'Paid',      value: paid,                       icon: <Paid />,           color: theme.palette.success.dark  },
    {
      label: `Paid Out (${commissions[0]?.currency ?? 'XAF'})`,
      value: totalAmount.toLocaleString(),
      icon: <AttachMoney />,
      color: theme.palette.secondary.dark,
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1000, mx: 'auto' }}>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>My Commissions</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Track commissions earned from your referred leads.
      </Typography>

      {/* Summary cards */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
        {summaryCards.map(({ label, value, icon, color }) => (
          <Paper
            key={label}
            variant="outlined"
            sx={{ p: 2, flex: 1, borderRadius: 2, borderLeft: `4px solid ${color}` }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color }}>{value}</Typography>
              </Box>
              <Box sx={{ color, opacity: 0.6 }}>{icon}</Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
        <FormControl size="small" sx={SX_SELECT}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {Object.entries(COMMISSION_STATUS_LABEL).map(([v, l]) => (
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

      {error && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Desktop table (md+) ──────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rule</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Lead</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Receipt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}><Skeleton variant="text" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : commissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No commissions yet. They are generated when a referred prospect enrolls.
                    </TableCell>
                  </TableRow>
                ) : (
                  commissions.map((comm) => (
                    <TableRow key={comm._id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {comm.amount?.toLocaleString()} {comm.currency ?? 'XAF'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={comm.ruleSnapshot?.ruleType === 'PERCENTAGE'
                            ? `${comm.ruleSnapshot.percentage}%`
                            : 'Fixed'}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        {comm.lead ? (
                          <Typography variant="body2">
                            {comm.lead.firstName} {comm.lead.lastName}
                          </Typography>
                        ) : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={COMMISSION_STATUS_LABEL[comm.status] ?? comm.status}
                          color={COMMISSION_STATUS_COLOR[comm.status] ?? 'default'}
                          size="small"
                          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                        />
                        {comm.status === 'paid' && comm.paidAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                            {new Date(comm.paidAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {comm.status === 'paid' && (
                          <Tooltip title="Download receipt">
                            <span>
                              <IconButton
                                size="small"
                                disabled={downloading === comm._id}
                                onClick={() => handleDownloadReceipt(comm._id)}
                              >
                                {downloading === comm._id
                                  ? <CircularProgress size={16} />
                                  : <Receipt fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
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

      {/* ── Mobile cards (xs/sm) ─────────────────────────────────────────────── */}
      <Box sx={{ display: { xs: 'block', md: 'none' } }}>
        {loading ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </Stack>
        ) : commissions.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 5, borderRadius: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No commissions yet. They are generated when a referred prospect enrolls.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {commissions.map((comm) => (
              <CommissionCard
                key={comm._id}
                comm={comm}
                downloading={downloading}
                onDownload={handleDownloadReceipt}
              />
            ))}
          </Stack>
        )}
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          rowsPerPage={pagination.limit}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={(_, p) => handleFilterChange('page', p + 1)}
          onRowsPerPageChange={(e) => handleFilterChange('limit', parseInt(e.target.value, 10))}
        />
      </Box>

    </Box>
  );
}
