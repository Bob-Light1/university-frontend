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
import { useAppTranslation } from '../../../hooks/useAppTranslation';

const LIMIT = 15;

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
const emptyPrize  = () => ({ rank: 1, description: { fr: '', en: '' }, value: '' });

// ─── Confirm ────────────────────────────────────────────────────────────────────
function ConfirmDialog({ open, title, message, color = 'error', onConfirm, onClose, loading }) {
  const { t } = useAppTranslation('common');

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent><Typography variant="body2">{message}</Typography></DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>{t('action.cancel')}</Button>
        <Button variant="contained" color={color} onClick={onConfirm} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{ textTransform: 'none', borderRadius: 2 }}>{t('action.confirm')}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Form dialog (prizes editor) ──────────────────────────────────────────────
function CompetitionFormDialog({ open, onClose, onSubmit, initial, mode }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t }    = useAppTranslation(['admin', 'common']);

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
    if (!/^\d{4}-\d{2}$/.test(period)) { setError(t('competition.form.periodError')); return; }
    if (!closingDate) { setError(t('competition.form.closingRequired')); return; }
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
      setError(e.response?.data?.message || t('competition.form.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" fullScreen={isMobile}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mode === 'edit' ? t('competition.form.editTitle') : t('competition.form.newTitle')}
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField fullWidth size="small" label={t('competition.form.period')} placeholder={t('competition.form.periodPlaceholder')}
              value={period} onChange={(e) => setPeriod(e.target.value)} />
            <TextField fullWidth size="small" label={t('competition.form.closingDate')} type="date"
              value={closingDate} onChange={(e) => setClosingDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
          <FormControlLabel control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
            label={t('competition.form.activeLabel')} />

          <Divider textAlign="left"><Typography variant="caption" fontWeight={700}>{t('competition.form.prizes')}</Typography></Divider>
          {prizes.map((p, i) => (
            <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField size="small" label={t('competition.form.rank')} type="number" sx={{ width: 90 }}
                    value={p.rank} onChange={(e) => updatePrize(i, { rank: e.target.value })} />
                  <TextField size="small" label={t('competition.form.value')} fullWidth placeholder={t('competition.form.valuePlaceholder')}
                    value={p.value} onChange={(e) => updatePrize(i, { value: e.target.value })} />
                  <Tooltip title={t('competition.form.remove')}>
                    <span>
                      <IconButton size="small" color="error" onClick={() => removePrize(i)} disabled={prizes.length === 1}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
                <TextField size="small" label={t('competition.form.descriptionFr')} fullWidth
                  value={p.description.fr} onChange={(e) => updatePrize(i, { description: { ...p.description, fr: e.target.value } })} />
                <TextField size="small" label={t('competition.form.descriptionEn')} fullWidth
                  value={p.description.en} onChange={(e) => updatePrize(i, { description: { ...p.description, en: e.target.value } })} />
              </Stack>
            </Paper>
          ))}
          <Button startIcon={<Add />} onClick={addPrize} sx={{ textTransform: 'none', alignSelf: 'flex-start' }}>
            {t('competition.form.addPrize')}
          </Button>

          {/* Winners (read-only) */}
          {initial?.winners?.length > 0 && (
            <>
              <Divider textAlign="left"><Typography variant="caption" fontWeight={700}>{t('competition.form.winners')}</Typography></Divider>
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
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>{t('common:action.cancel')}</Button>
        <Button variant="contained" onClick={submit} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>
          {mode === 'edit' ? t('common:action.save') : t('common:action.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function CompetitionAdmin() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t }    = useAppTranslation(['admin', 'common']);

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
      setError(t('competition.loadError'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, activeFilter, selectedCampusId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showSnack = (msg, severity = 'success') => {
    setSnack({ msg, severity });
    setTimeout(() => setSnack(null), 3000);
  };

  const handleSubmit = async (values) => {
    if (editTarget) {
      await competitionApi.update(editTarget._id, values);
      showSnack(t('competition.toast.updated'));
    } else {
      await competitionApi.create({ ...values, campusId: selectedCampusId });
      showSnack(t('competition.toast.created'));
    }
    fetchItems();
  };

  const handleToggleActive = async (item) => {
    try {
      await competitionApi.toggleActive(item._id, { isActive: !item.isActive });
      showSnack(item.isActive ? t('competition.toast.deactivated') : t('competition.toast.activated'));
      fetchItems();
    } catch (e) {
      showSnack(e.response?.data?.message || t('competition.toast.failed'), 'error');
    }
  };

  const handleClose = (item) => setConfirmData({
    title: t('competition.confirm.closeTitle'),
    message: t('competition.confirm.closeMessage', { period: item.period }),
    color: 'warning',
    action: async () => { await competitionApi.close(item._id); showSnack(t('competition.toast.closed')); fetchItems(); },
  });

  const handleDelete = (item) => setConfirmData({
    title: t('competition.confirm.deleteTitle'),
    message: t('competition.confirm.deleteMessage', { period: item.period }),
    color: 'error',
    action: async () => { await competitionApi.remove(item._id); showSnack(t('competition.toast.deleted')); fetchItems(); },
  });

  const runConfirm = async () => {
    if (!confirmData?.action) return;
    setActionLoading(true);
    try { await confirmData.action(); }
    catch (e) { showSnack(e.response?.data?.message || t('competition.toast.actionFailed'), 'error'); }
    finally { setActionLoading(false); setConfirmData(null); }
  };

  const openCreate = () => {
    if (!selectedCampusId) { showSnack(t('competition.toast.selectCampus'), 'warning'); return; }
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
            <Typography variant="h5" fontWeight={700}>{t('competition.title')}</Typography>
            <Typography variant="caption" color="text.secondary">{t('competition.itemCount', { count: total })}</Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
          {t('competition.new')}
        </Button>
      </Stack>

      {/* Campus + filter */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: 'action.hover' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl size="small" fullWidth>
            <InputLabel>{t('competition.campus')}</InputLabel>
            <Select value={selectedCampusId} label={t('competition.campus')}
              onChange={(e) => { setSelectedCampusId(e.target.value); setPage(1); }}>
              <MenuItem value="">{t('competition.allCampuses')}</MenuItem>
              {campuses.map((c) => <MenuItem key={c._id} value={c._id}>{c.campus_name || c._id}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t('common:field.status')}</InputLabel>
            <Select value={activeFilter} label={t('common:field.status')}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}>
              <MenuItem value="">{t('common:all')}</MenuItem>
              <MenuItem value="true">{t('competition.statusActive')}</MenuItem>
              <MenuItem value="false">{t('competition.statusClosed')}</MenuItem>
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
          <Typography variant="h6" color="text.secondary" fontWeight={600}>{t('competition.empty')}</Typography>
          <Typography variant="body2" color="text.disabled">{t('competition.emptyHint')}</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {items.map((item) => (
            <Paper key={item._id} elevation={1}
              sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${item.isActive ? theme.palette.success.main : theme.palette.grey[400]}` }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
                <Chip label={item.isActive ? t('competition.statusActive') : t('competition.statusClosed')} size="small"
                  color={item.isActive ? 'success' : 'default'} sx={{ fontWeight: 700, fontSize: 11 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700}>{item.period}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('competition.prizeCount', { count: item.prizes?.length || 0 })}
                    {' · '}{t('competition.closesOn', { date: new Date(item.closingDate).toLocaleDateString() })}
                    {item.winners?.length ? ` · ${t('competition.winnerCount', { count: item.winners.length })}` : ''}
                  </Typography>
                </Box>
                {isMobile && <Divider sx={{ opacity: 0.4, width: '100%' }} />}
                <Stack direction="row" spacing={0.5} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
                  <Tooltip title={item.isActive ? t('competition.action.deactivate') : t('competition.action.activate')}>
                    <IconButton size="small" color={item.isActive ? 'warning' : 'success'} onClick={() => handleToggleActive(item)}>
                      {item.isActive ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={item.isActive ? t('competition.action.closeNow') : t('competition.action.alreadyClosed')}>
                    <span>
                      <IconButton size="small" color="primary" onClick={() => handleClose(item)} disabled={!item.isActive}>
                        <Lock fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t('common:action.edit')}>
                    <IconButton size="small" onClick={() => { setEditTarget(item); setFormOpen(true); }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common:action.delete')}>
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
