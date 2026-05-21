/**
 * @file CampusList.jsx
 * @description Admin portal — full campus list with search, filter, and actions.
 *
 * Data: GET /campus/all (public endpoint, no campus isolation)
 * Actions:
 *   DELETE /campus/:id         (archive — ADMIN/DIRECTOR only)
 *   PATCH  /campus/:id/restore (restore — ADMIN/DIRECTOR only)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate }                       from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, TablePagination, TextField, FormControl,
  InputLabel, Select, MenuItem, Button, IconButton,
  InputAdornment, Avatar, Alert,
  Skeleton, Tooltip,
} from '@mui/material';
import {
  Search, FilterListOff, AddBusiness,
  Visibility, Business, Inventory2, Unarchive,
} from '@mui/icons-material';

import { getAllCampuses, archiveCampus, restoreCampus } from '../../../services/admin_service';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import ConfirmActionDialog from '../../../components/shared/ConfirmActionDialog';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR = { active: 'success', inactive: 'default', archived: 'error' };
const DEFAULT_FILTERS = { search: '', status: '', page: 1, limit: 20 };
const SX_INPUT = { minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } };

// ─── Component ────────────────────────────────────────────────────────────────

export default function CampusList() {
  const navigate = useNavigate();
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [campuses,      setCampuses]      = useState([]);
  const [pagination,    setPagination]    = useState({ page: 1, limit: 20, total: 0 });
  const [filters,       setFilters]       = useState(DEFAULT_FILTERS);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: 'archive', campus: null, busy: false });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = { ...filters };
    Object.keys(params).forEach((k) => { if (!params[k] && params[k] !== 0) delete params[k]; });
    try {
      const res = await getAllCampuses(params);
      setCampuses(Array.isArray(res.data?.data) ? res.data.data : []);
      if (res.data?.pagination) setPagination((p) => ({ ...p, ...res.data.pagination }));
    } catch {
      setError('Failed to load campuses.');
      setCampuses([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const handleAskArchive = (campus) =>
    setConfirmDialog({ open: true, action: 'archive', campus, busy: false });

  const handleAskRestore = (campus) =>
    setConfirmDialog({ open: true, action: 'restore', campus, busy: false });

  const handleConfirmAction = async () => {
    const { action, campus } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, busy: true }));
    try {
      if (action === 'archive') {
        await archiveCampus(campus._id);
        showSnackbar(`${campus.campus_name} archived.`, 'success');
      } else {
        await restoreCampus(campus._id);
        showSnackbar(`${campus.campus_name} restored.`, 'success');
      }
      fetch();
    } catch (err) {
      showSnackbar(err.response?.data?.message || `Failed to ${action} campus.`, 'error');
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false, busy: false }));
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Campuses</Typography>
          <Typography variant="body2" color="text.secondary">
            All campuses registered on the platform.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddBusiness />}
          onClick={() => navigate('/admin/new-campus')}
          sx={{
            textTransform: 'none', fontWeight: 700, borderRadius: 2,
            background: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
          }}
        >
          New Campus
        </Button>
      </Stack>

      {/* ── Filters ─────────────────────────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} flexWrap="wrap" sx={{ mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search name, manager, email…"
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          sx={{ minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
        <FormControl size="small" sx={SX_INPUT}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>
        <Button
          size="small" variant="outlined" startIcon={<FilterListOff />}
          onClick={handleReset}
          sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'center' }}
        >
          Reset
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Table ───────────────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Campus</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Manager</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton variant="text" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : campuses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No campuses found.
                  </TableCell>
                </TableRow>
              ) : (
                campuses.map((c) => (
                  <TableRow key={c._id} hover>

                    {/* Campus name + number */}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={c.campus_image}
                          sx={{
                            width: 36, height: 36,
                            bgcolor: '#003285', fontSize: '0.85rem', fontWeight: 700,
                          }}
                        >
                          <Business sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{c.campus_name}</Typography>
                          {c.campus_number && (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {c.campus_number}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Manager */}
                    <TableCell>
                      <Typography variant="body2">{c.manager_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                      {c.manager_phone && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {c.manager_phone}
                        </Typography>
                      )}
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {[c.location?.city, c.location?.country].filter(Boolean).join(', ') || '—'}
                      </Typography>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        label={c.status}
                        color={STATUS_COLOR[c.status] ?? 'default'}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View campus portal">
                          <IconButton size="small" onClick={() => navigate(`/campus/${c._id}`)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        {c.status === 'archived' ? (
                          <Tooltip title="Restore campus">
                            <IconButton size="small" color="success" onClick={() => handleAskRestore(c)}>
                              <Unarchive fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Archive campus">
                            <IconButton size="small" color="error" onClick={() => handleAskArchive(c)}>
                              <Inventory2 fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
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

      {/* ── Archive / Restore confirm dialog ────────────────────────────────────── */}
      <ConfirmActionDialog
        open={confirmDialog.open}
        action={confirmDialog.action}
        entityLabel={confirmDialog.campus?.campus_name ?? ''}
        entityType="campus"
        busy={confirmDialog.busy}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmAction}
      />

      {/* ── Snackbar ────────────────────────────────────────────────────────────── */}
      {snackbar.open && (
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={closeSnackbar}
          sx={{
            position: 'fixed', bottom: 24, left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: 2, zIndex: 9999,
          }}
        >
          {snackbar.message}
        </Alert>
      )}

    </Box>
  );
}
