/**
 * @file ContentAdmin.jsx
 * @description Generic admin list page for Phase 2 portal content resources
 * (testimonials, FAQ, course previews). Campus-scoped CRUD with search, publish
 * toggle and delete. Driven by a `config` object so each resource is a thin wrapper.
 *
 * Mounted under /admin (ADMIN / DIRECTOR), so the campus selector is always shown
 * and a campus must be picked before creating an item.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Stack, Typography, Paper, Chip, Button, IconButton, Tooltip,
  Alert, Skeleton, TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Pagination, useMediaQuery, Divider,
} from '@mui/material';
import {
  Add, Search, Edit, Delete, Visibility, VisibilityOff, CheckCircle,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getAllCampuses } from '../../services/admin_service';
import ContentFormDialog from './ContentFormDialog';

const LIMIT = 15;

function ConfirmDialog({ open, title, message, onConfirm, onClose, loading }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent><Typography variant="body2">{message}</Typography></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" color="error" onClick={onConfirm} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{ textTransform: 'none', borderRadius: 2 }}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ContentAdmin({ config }) {
  const { title, pluralTitle, icon: Icon, service, fields, renderPrimary, renderSecondary } = config;
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(1);

  const [campuses,         setCampuses]         = useState([]);
  const [selectedCampusId, setSelectedCampusId] = useState('');

  const [search,          setSearch]          = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [published,       setPublished]       = useState(''); // '', 'true', 'false'

  const [formOpen,      setFormOpen]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [confirmData,   setConfirmData]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack,         setSnack]         = useState(null);

  useEffect(() => {
    getAllCampuses({ limit: 200 })
      .then(({ data }) => setCampuses(data.data || []))
      .catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await service.list({
        page, limit: LIMIT,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(published && { published }),
        ...(selectedCampusId && { campusId: selectedCampusId }),
      });
      setItems(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      setError(`Failed to load ${pluralTitle.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, published, selectedCampusId, service, pluralTitle]);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showSnack = (msg, severity = 'success') => {
    setSnack({ msg, severity });
    setTimeout(() => setSnack(null), 3000);
  };

  const handleCreate = async (values) => {
    await service.create({ ...values, campusId: selectedCampusId });
    showSnack(`${title} created.`);
    fetchItems();
  };

  const handleEdit = async (values) => {
    await service.update(editTarget._id, values);
    showSnack(`${title} updated.`);
    fetchItems();
  };

  const handleTogglePublish = async (item) => {
    try {
      await service.togglePublish(item._id, { isPublished: !item.isPublished });
      showSnack(item.isPublished ? 'Unpublished.' : 'Published.');
      fetchItems();
    } catch (e) {
      showSnack(e.response?.data?.message || 'Failed to update status.', 'error');
    }
  };

  const handleDelete = (item) => setConfirmData({
    title: `Delete ${title}`,
    message: 'This item will be permanently removed. This cannot be undone.',
    action: async () => {
      await service.remove(item._id);
      showSnack(`${title} deleted.`);
      fetchItems();
    },
  });

  const runConfirm = async () => {
    if (!confirmData?.action) return;
    setActionLoading(true);
    try {
      await confirmData.action();
    } catch (e) {
      showSnack(e.response?.data?.message || 'Action failed.', 'error');
    } finally {
      setActionLoading(false);
      setConfirmData(null);
    }
  };

  const openCreate = () => {
    if (!selectedCampusId) {
      showSnack('Select a campus before creating.', 'warning');
      return;
    }
    setEditTarget(null);
    setFormOpen(true);
  };

  const pageCount = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 1000, mx: 'auto' }}>

      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1.5} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Icon color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>{pluralTitle}</Typography>
            <Typography variant="caption" color="text.secondary">
              {total} item{total !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
          New {title}
        </Button>
      </Stack>

      {/* Campus selector */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: 'action.hover' }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Campus</InputLabel>
          <Select value={selectedCampusId} label="Campus"
            onChange={(e) => { setSelectedCampusId(e.target.value); setPage(1); }}>
            <MenuItem value="">All campuses</MenuItem>
            {campuses.map((c) => (
              <MenuItem key={c._id} value={c._id}>{c.campus_name || c._id}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Filters */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: 'action.hover' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField size="small" placeholder={`Search ${pluralTitle.toLowerCase()}…`}
            value={search} onChange={(e) => setSearch(e.target.value)} fullWidth
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> } }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={published} label="Status"
              onChange={(e) => { setPublished(e.target.value); setPage(1); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Published</MenuItem>
              <MenuItem value="false">Draft</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Snack */}
      {snack && (
        <Alert severity={snack.severity}
          icon={snack.severity === 'success' ? <CheckCircle /> : undefined}
          sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSnack(null)}>
          {snack.msg}
        </Alert>
      )}

      {/* Content */}
      {loading ? (
        <Stack spacing={1}>
          {[1, 2, 3, 4].map((i) => (
            <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 2 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
            </Paper>
          ))}
        </Stack>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Icon sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            No {pluralTitle.toLowerCase()}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Create your first item with the button above.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {items.map((item) => (
            <Paper key={item._id} elevation={1}
              sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${item.isPublished ? theme.palette.success.main : theme.palette.grey[400]}` }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}
                alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Chip label={item.isPublished ? 'Published' : 'Draft'} size="small"
                  color={item.isPublished ? 'success' : 'default'}
                  sx={{ fontWeight: 700, fontSize: 11 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>{renderPrimary(item)}</Typography>
                  {renderSecondary && (
                    <Typography variant="caption" color="text.secondary"
                      sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {renderSecondary(item)}
                    </Typography>
                  )}
                </Box>
                {isMobile && <Divider sx={{ opacity: 0.4, width: '100%' }} />}
                <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                  <Tooltip title={item.isPublished ? 'Unpublish' : 'Publish'}>
                    <IconButton size="small" color={item.isPublished ? 'warning' : 'success'}
                      onClick={() => handleTogglePublish(item)}>
                      {item.isPublished ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => { setEditTarget(item); setFormOpen(true); }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(item)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)}
            color="primary" shape="rounded" size={isMobile ? 'small' : 'medium'}
            siblingCount={isMobile ? 0 : 1} />
        </Box>
      )}

      <ContentFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={editTarget ? handleEdit : handleCreate}
        initialValues={editTarget}
        mode={editTarget ? 'edit' : 'create'}
        title={title}
        fields={fields}
      />

      <ConfirmDialog
        open={Boolean(confirmData)}
        title={confirmData?.title}
        message={confirmData?.message}
        onConfirm={runConfirm}
        onClose={() => setConfirmData(null)}
        loading={actionLoading}
      />
    </Box>
  );
}
