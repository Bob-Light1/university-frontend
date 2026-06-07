/**
 * @file CompetitionAdmin.jsx
 * @description Admin page for the monthly quiz competition (Phase 2).
 *
 * Manages the prize schedule, closing date and active flag per campus & period.
 * Winners are frozen by the closing cron (or the "Close now" action) and shown
 * read-only. Accessible to ADMIN / DIRECTOR under /admin.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Stack, Typography, Paper, Chip, Button, IconButton, Tooltip,
  Alert, Skeleton, MenuItem, Select, FormControl, InputLabel, Dialog,
  DialogTitle, DialogContent, DialogActions, CircularProgress, Pagination,
  TextField, FormControlLabel, Switch, Divider, useMediaQuery,
} from '@mui/material';
import {
  Add, Edit, Delete, EmojiEvents, Lock, PlayArrow, Pause, Close, CheckCircle,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getAllCampuses } from '../../../services/admin_service';
import { competitionApi } from '../../../services/portalContentService';

const LIMIT = 15;

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const emptyPrize  = () => ({ rank: 1, description: { fr: '', en: '' }, value: '' });

// ─── Confirm ────────────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, color = 'error', onConfirm, onClose, loading }) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent><Typography variant="body2">{message}</Typography></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" color={color} onClick={onConfirm} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{ textTransform: 'none', borderRadius: 2 }}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Form dialog (prizes editor) ──────────────────────────────────────────────
function CompetitionFormDialog({ open, onClose, onSubmit, initial, mode }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [period, setPeriod]           = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [isActive, setIsActive]       = useState(true);
  const [prizes, setPrizes]           = useState([emptyPrize()]);
  const [error, setError]             = useState(null);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPeriod(initial?.period || '');
    setClosingDate(toDateInput(initial?.closingDate));
    setIsActive(initial?.isActive ?? true);
    setPrizes(initial?.prizes?.length
      ? initial.prizes.map((p) => ({ rank: p.rank, description: { fr: p.description?.fr || '', en: p.description?.en || '' }, value: p.value || '' }))
      : [emptyPrize()]);
  }, [open, initial]);

  const updatePrize = (i, patch) => setPrizes((ps) => ps.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const addPrize    = () => setPrizes((ps) => [...ps, { ...emptyPrize(), rank: ps.length + 1 }]);
  const removePrize = (i) => setPrizes((ps) => ps.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!/^\d{4}-\d{2}$/.test(period)) { setError('Period must be YYYY-MM.'); return; }
    if (!closingDate) { setError('Closing date is required.'); return; }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        period,
        closingDate: new Date(closingDate).toISOString(),
        isActive,
        prizes: prizes.map((p) => ({
          rank: Number(p.rank),
          description: { fr: p.description.fr, en: p.description.en?.trim() ? p.description.en : null },
          value: p.value?.trim() ? p.value : null,
        })),
      });
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'edit' ? 'Edit competition' : 'New competition'}
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField fullWidth size="small" label="Period (YYYY-MM) *" placeholder="2026-07"
              value={period} onChange={(e) => setPeriod(e.target.value)} />
            <TextField fullWidth size="small" label="Closing date *" type="date"
              value={closingDate} onChange={(e) => setClosingDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label="Active (visible on the portal)" />

          <Divider textAlign="left"><Typography variant="caption" fontWeight={700}>PRIZES</Typography></Divider>
          {prizes.map((p, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label="Rank" type="number" sx={{ width: 90 }}
                    value={p.rank} onChange={(e) => updatePrize(i, { rank: e.target.value })} />
                  <TextField size="small" label="Value" fullWidth placeholder="-20% + certificate"
                    value={p.value} onChange={(e) => updatePrize(i, { value: e.target.value })} />
                  <Tooltip title="Remove">
                    <span>
                      <IconButton size="small" color="error" onClick={() => removePrize(i)} disabled={prizes.length === 1}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
                <TextField size="small" label="Description (FR) *" fullWidth
                  value={p.description.fr} onChange={(e) => updatePrize(i, { description: { ...p.description, fr: e.target.value } })} />
                <TextField size="small" label="Description (EN)" fullWidth
                  value={p.description.en} onChange={(e) => updatePrize(i, { description: { ...p.description, en: e.target.value } })} />
              </Stack>
            </Paper>
          ))}
          <Button startIcon={<Add />} onClick={addPrize} sx={{ textTransform: 'none', alignSelf: 'flex-start' }}>
            Add prize
          </Button>

          {/* Winners (read-only) */}
          {initial?.winners?.length > 0 && (
            <>
              <Divider textAlign="left"><Typography variant="caption" fontWeight={700}>WINNERS</Typography></Divider>
              <Stack spacing={0.5}>
                {initial.winners.map((w) => (
                  <Typography key={w.rank} variant="body2">
                    #{w.rank} — {w.displayName || '—'} ({w.score}/100)
                  </Typography>
                ))}
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>
          {mode === 'edit' ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function CompetitionAdmin() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [items,   setItems]   = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [page,    setPage]    = useState(1);

  const [campuses,         setCampuses]         = useState([]);
  const [selectedCampusId, setSelectedCampusId] = useState('');
  const [activeFilter,     setActiveFilter]     = useState('');

  const [formOpen,      setFormOpen]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [confirmData,   setConfirmData]   = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack,         setSnack]         = useState(null);

  useEffect(() => {
    getAllCampuses({ limit: 200 }).then(({ data }) => setCampuses(data.data || [])).catch(() => {});
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await competitionApi.list({
        page, limit: LIMIT,
        ...(activeFilter && { active: activeFilter }),
        ...(selectedCampusId && { campusId: selectedCampusId }),
      });
      setItems(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      setError('Failed to load competitions.');
    } finally {
      setLoading(false);
    }
  }, [page, activeFilter, selectedCampusId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showSnack = (msg, severity = 'success') => {
    setSnack({ msg, severity });
    setTimeout(() => setSnack(null), 3000);
  };

  const handleSubmit = async (values) => {
    if (editTarget) {
      await competitionApi.update(editTarget._id, values);
      showSnack('Competition updated.');
    } else {
      await competitionApi.create({ ...values, campusId: selectedCampusId });
      showSnack('Competition created.');
    }
    fetchItems();
  };

  const handleToggleActive = async (item) => {
    try {
      await competitionApi.toggleActive(item._id, { isActive: !item.isActive });
      showSnack(item.isActive ? 'Deactivated.' : 'Activated.');
      fetchItems();
    } catch (e) {
      showSnack(e.response?.data?.message || 'Failed.', 'error');
    }
  };

  const handleClose = (item) => setConfirmData({
    title: 'Close competition',
    message: `Freeze winners for ${item.period} from the period's quiz scores and deactivate it? This cannot be undone.`,
    color: 'warning',
    action: async () => { await competitionApi.close(item._id); showSnack('Competition closed.'); fetchItems(); },
  });

  const handleDelete = (item) => setConfirmData({
    title: 'Delete competition',
    message: `Competition ${item.period} will be permanently removed. This cannot be undone.`,
    color: 'error',
    action: async () => { await competitionApi.remove(item._id); showSnack('Competition deleted.'); fetchItems(); },
  });

  const runConfirm = async () => {
    if (!confirmData?.action) return;
    setActionLoading(true);
    try { await confirmData.action(); }
    catch (e) { showSnack(e.response?.data?.message || 'Action failed.', 'error'); }
    finally { setActionLoading(false); setConfirmData(null); }
  };

  const openCreate = () => {
    if (!selectedCampusId) { showSnack('Select a campus before creating.', 'warning'); return; }
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
          <EmojiEvents color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Competitions</Typography>
            <Typography variant="caption" color="text.secondary">{total} item{total !== 1 ? 's' : ''}</Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
          New competition
        </Button>
      </Stack>

      {/* Campus + filter */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: 'action.hover' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl size="small" fullWidth>
            <InputLabel>Campus</InputLabel>
            <Select value={selectedCampusId} label="Campus"
              onChange={(e) => { setSelectedCampusId(e.target.value); setPage(1); }}>
              <MenuItem value="">All campuses</MenuItem>
              {campuses.map((c) => <MenuItem key={c._id} value={c._id}>{c.campus_name || c._id}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select value={activeFilter} label="Status"
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Closed</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {snack && (
        <Alert severity={snack.severity} icon={snack.severity === 'success' ? <CheckCircle /> : undefined}
          sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSnack(null)}>{snack.msg}</Alert>
      )}

      {/* Content */}
      {loading ? (
        <Stack spacing={1}>{[1, 2, 3].map((i) => (
          <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 2 }}>
            <Skeleton variant="text" width="50%" /><Skeleton variant="text" width="30%" />
          </Paper>
        ))}</Stack>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <EmojiEvents sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>No competitions</Typography>
          <Typography variant="body2" color="text.disabled">Create one with the button above.</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {items.map((item) => (
            <Paper key={item._id} elevation={1}
              sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${item.isActive ? theme.palette.success.main : theme.palette.grey[400]}` }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Chip label={item.isActive ? 'Active' : 'Closed'} size="small"
                  color={item.isActive ? 'success' : 'default'} sx={{ fontWeight: 700, fontSize: 11 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700}>{item.period}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.prizes?.length || 0} prize{(item.prizes?.length || 0) !== 1 ? 's' : ''}
                    {' · '}Closes {new Date(item.closingDate).toLocaleDateString()}
                    {item.winners?.length ? ` · ${item.winners.length} winners` : ''}
                  </Typography>
                </Box>
                {isMobile && <Divider sx={{ opacity: 0.4, width: '100%' }} />}
                <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                  <Tooltip title={item.isActive ? 'Deactivate' : 'Activate'}>
                    <IconButton size="small" color={item.isActive ? 'warning' : 'success'} onClick={() => handleToggleActive(item)}>
                      {item.isActive ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={item.isActive ? 'Close now (freeze winners)' : 'Already closed'}>
                    <span>
                      <IconButton size="small" color="primary" onClick={() => handleClose(item)} disabled={!item.isActive}>
                        <Lock fontSize="small" />
                      </IconButton>
                    </span>
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
            color="primary" shape="rounded" size={isMobile ? 'small' : 'medium'} siblingCount={isMobile ? 0 : 1} />
        </Box>
      )}

      <CompetitionFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editTarget}
        mode={editTarget ? 'edit' : 'create'}
      />

      <ConfirmDialog
        open={Boolean(confirmData)}
        title={confirmData?.title}
        message={confirmData?.message}
        color={confirmData?.color}
        onConfirm={runConfirm}
        onClose={() => setConfirmData(null)}
        loading={actionLoading}
      />
    </Box>
  );
}
