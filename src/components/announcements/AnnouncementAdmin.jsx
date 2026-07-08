/**
 * @file AnnouncementAdmin.jsx
 * @description Shared announcement management page for ADMIN, CAMPUS_MANAGER,
 * and STAFF (with 'announcements' permission).
 *
 * Props:
 *  - isAdminGlobal {boolean} — if true, shows announcements from all campuses
 *                              and a campus-filter chip (ADMIN / DIRECTOR only).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Stack, Typography, Paper, Chip, Button,
  IconButton, Tooltip, Alert, Skeleton, Divider,
  TextField, InputAdornment, MenuItem, Select,
  FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress,
  Pagination, useMediaQuery,
} from '@mui/material';
import {
  Add, Search, Publish, Archive, PushPin, PushPinOutlined,
  Edit, Delete, Campaign, FilterList, CheckCircle,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  publishAnnouncement,
  archiveAnnouncement,
  togglePin,
  deleteAnnouncement,
} from '../../services/announcementService';
import { getAllCampuses } from '../../services/admin_service';
import AnnouncementFormDialog from './AnnouncementFormDialog';
import { TYPE_META, TYPE_FILTERS, STATUS_META, TARGET_LABEL_KEYS } from './announcementConstants';
import { fDate } from '../../utils/dateFormat';
import { useAppTranslation } from '../../hooks/useAppTranslation';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 15;

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({ open, title, message, onConfirm, onClose, loading, severity = 'warning' }) {
  const { t } = useAppTranslation('common');

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth
      disableEnforceFocus closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>
          {t('action.cancel')}
        </Button>
        <Button
          variant="contained"
          color={severity}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {t('action.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Row Skeleton ─────────────────────────────────────────────────────────────

function RowSkeleton() {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 1 }}>
      {isMobile ? (
        <Stack spacing={1}>
          <Stack direction="row" spacing={1}>
            <Skeleton variant="rounded" width={70} height={22} />
            <Skeleton variant="rounded" width={60} height={22} />
          </Stack>
          <Skeleton variant="text" width="65%" height={20} />
          <Skeleton variant="text" width="45%" height={16} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton variant="circular" width={28} height={28} />
            <Skeleton variant="circular" width={28} height={28} />
          </Box>
        </Stack>
      ) : (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Skeleton variant="rounded" width={70} height={22} />
          <Skeleton variant="rounded" width={60} height={22} />
          <Skeleton variant="text" sx={{ flex: 1 }} />
          <Skeleton variant="rounded" width={80} height={22} />
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="circular" width={28} height={28} />
        </Stack>
      )}
    </Paper>
  );
}

// ─── Announcement Row ─────────────────────────────────────────────────────────

function AnnouncementRow({ announcement, onPublish, onArchive, onPin, onEdit, onDelete }) {
  const theme      = useTheme();
  const isMobile   = useMediaQuery(theme.breakpoints.down('sm'));
  const { t }      = useAppTranslation('announcements');
  const typeMeta   = TYPE_META[announcement.type]   || TYPE_META.info;
  const statusMeta = STATUS_META[announcement.status] || STATUS_META.draft;

  const isDraft     = announcement.status === 'draft';
  const isPublished = announcement.status === 'published';
  const isArchived  = announcement.status === 'archived';
  const canEdit     = !isPublished;

  const borderColor =
    announcement.type === 'urgent'  ? theme.palette.error.main :
    announcement.type === 'warning' ? theme.palette.warning.main :
    announcement.type === 'event'   ? theme.palette.secondary.main :
    theme.palette.info.main;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        borderLeft: `4px solid ${borderColor}`,
        opacity: isArchived ? 0.75 : 1,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >

        {/* Status + type chips */}
        <Stack direction="row" spacing={0.5} flexShrink={0}>
          <Chip
            label={t(statusMeta.labelKey)}
            size="small"
            color={statusMeta.color}
            sx={{ fontWeight: 700, fontSize: 11 }}
          />
          <Chip
            icon={<typeMeta.Icon sx={{ fontSize: '14px !important' }} />}
            label={t(typeMeta.labelKey)}
            size="small"
            color={typeMeta.color}
            variant="outlined"
            sx={{ fontSize: 11 }}
          />
        </Stack>

        {/* Title + meta */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {announcement.pinned && (
              <PushPin sx={{ fontSize: 14, color: 'primary.main' }} />
            )}
            <Typography variant="body2" fontWeight={700} noWrap>
              {announcement.title}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary">
              {announcement.targetRoles
                .map((r) => (TARGET_LABEL_KEYS[r] ? t(TARGET_LABEL_KEYS[r]) : r))
                .join(', ')}
            </Typography>
            {announcement.expiresAt && (
              <Typography variant="caption" color="warning.main">
                {t('row.expires', { date: fDate(announcement.expiresAt) })}
              </Typography>
            )}
            {isPublished && (
              <Typography variant="caption" color="text.disabled">
                {t('row.published', { date: fDate(announcement.publishedAt) })}
              </Typography>
            )}
            {isArchived && (
              <Typography variant="caption" color="text.disabled">
                {t('row.archived', { date: fDate(announcement.archivedAt) })}
              </Typography>
            )}
          </Stack>
        </Box>

        {isMobile && <Divider sx={{ opacity: 0.4 }} />}

        {/* Actions */}
        <Stack direction="row" spacing={0.5} flexShrink={0} sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}>
          {/* Publish */}
          {(isDraft || isArchived) && (
            <Tooltip title={t('action.publish')}>
              <IconButton size="small" color="success" onClick={() => onPublish(announcement)}>
                <Publish fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Archive */}
          {isPublished && (
            <Tooltip title={t('action.archive')}>
              <IconButton size="small" color="warning" onClick={() => onArchive(announcement)}>
                <Archive fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Pin toggle */}
          <Tooltip title={announcement.pinned ? t('action.unpin') : t('action.pin')}>
            <IconButton size="small" color="primary" onClick={() => onPin(announcement)}>
              {announcement.pinned
                ? <PushPin fontSize="small" />
                : <PushPinOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Edit */}
          <Tooltip title={canEdit ? t('action.edit') : t('action.editDisabled')}>
            <span>
              <IconButton size="small" onClick={() => onEdit(announcement)} disabled={!canEdit}>
                <Edit fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* Delete */}
          <Tooltip title={t('action.delete')}>
            <IconButton size="small" color="error" onClick={() => onDelete(announcement)}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnnouncementAdmin({ isAdminGlobal = false }) {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { t }    = useAppTranslation(['announcements', 'common']);

  const [announcements, setAnnouncements] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [page,          setPage]          = useState(1);

  // Campus selector (ADMIN / DIRECTOR only)
  const [campuses,          setCampuses]          = useState([]);
  const [selectedCampusId,  setSelectedCampusId]  = useState('');

  // Filters
  const [search,          setSearch]          = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status,          setStatus]          = useState('');
  const [typeFilter,      setTypeFilter]      = useState('');
  const [pinnedOnly,      setPinnedOnly]      = useState(false);

  // Dialogs
  const [formOpen,     setFormOpen]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [confirmData,  setConfirmData]  = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack,         setSnack]         = useState(null); // { msg, severity }

  // Fetch campus list once when admin view is global.
  useEffect(() => {
    if (!isAdminGlobal) return;
    getAllCampuses({ limit: 200 })
      .then(({ data }) => setCampuses(data.data || []))
      .catch(() => {});
  }, [isAdminGlobal]);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAllAnnouncements({
        page,
        limit: LIMIT,
        ...(status         && { status }),
        ...(typeFilter     && { type: typeFilter }),
        ...(pinnedOnly     && { pinned: 'true' }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(isAdminGlobal && selectedCampusId && { campusId: selectedCampusId }),
      });
      setAnnouncements(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, status, typeFilter, pinnedOnly, debouncedSearch, isAdminGlobal, selectedCampusId, t]);

  // Debounce search input — also resets page so the user lands on page 1.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch whenever any filter / page / debouncedSearch changes.
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const showSnack = (msg, severity = 'success') => {
    setSnack({ msg, severity });
    setTimeout(() => setSnack(null), 3000);
  };

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCreate = async (values) => {
    const payload = isAdminGlobal
      ? { ...values, campusId: selectedCampusId }
      : values;
    await createAnnouncement(payload);
    showSnack(t('toast.created'));
    fetchAnnouncements();
  };

  const handleEdit = async (values) => {
    await updateAnnouncement(editTarget._id, values);
    showSnack(t('toast.updated'));
    fetchAnnouncements();
  };

  const handlePublish = (ann) => setConfirmData({
    title: t('confirm.publishTitle'),
    message: t('confirm.publishMessage', { title: ann.title }),
    severity: 'success',
    action: async () => {
      await publishAnnouncement(ann._id);
      showSnack(t('toast.published'));
      fetchAnnouncements();
    },
  });

  const handleArchive = (ann) => setConfirmData({
    title: t('confirm.archiveTitle'),
    message: t('confirm.archiveMessage', { title: ann.title }),
    severity: 'warning',
    action: async () => {
      await archiveAnnouncement(ann._id);
      showSnack(t('toast.archived'));
      fetchAnnouncements();
    },
  });

  const handlePin = async (ann) => {
    try {
      await togglePin(ann._id);
      showSnack(ann.pinned ? t('toast.unpinned') : t('toast.pinned'));
      fetchAnnouncements();
    } catch (e) {
      showSnack(e.response?.data?.message || t('toast.pinFailed'), 'error');
    }
  };

  const handleDelete = (ann) => setConfirmData({
    title: t('confirm.deleteTitle'),
    message: t('confirm.deleteMessage', { title: ann.title }),
    severity: 'error',
    action: async () => {
      await deleteAnnouncement(ann._id);
      showSnack(t('toast.deleted'));
      fetchAnnouncements();
    },
  });

  const runConfirm = async () => {
    if (!confirmData?.action) return;
    setActionLoading(true);
    try {
      await confirmData.action();
    } catch (e) {
      showSnack(e.response?.data?.message || t('toast.actionFailed'), 'error');
    } finally {
      setActionLoading(false);
      setConfirmData(null);
    }
  };

  const pageCount = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 1000, mx: 'auto' }}>

      {/* ── Header ── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Campaign color="primary" sx={{ fontSize: 36 }} />
          <Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h5" fontWeight={700}>{t('title')}</Typography>
              {isAdminGlobal && (
                <Chip label={t('globalChip')} size="small" color="info" variant="outlined" />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {t('count', { count: total })}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            if (isAdminGlobal && !selectedCampusId) {
              showSnack(t('selectCampusFirst'), 'warning');
              return;
            }
            setEditTarget(null);
            setFormOpen(true);
          }}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
        >
          {t('new')}
        </Button>
      </Stack>

      {/* ── Campus selector (ADMIN / DIRECTOR only) ── */}
      {isAdminGlobal && (
        <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: 'action.hover' }}>
          <FormControl size="small" fullWidth>
            <InputLabel>{t('campus')}</InputLabel>
            <Select
              value={selectedCampusId}
              label={t('campus')}
              onChange={(e) => { setSelectedCampusId(e.target.value); setPage(1); }}
            >
              <MenuItem value="">{t('allCampuses')}</MenuItem>
              {campuses.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.campus_name || c._id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}

      {/* ── Filters ── */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, mb: 2, bgcolor: 'action.hover' }}>
        <Stack spacing={1.5}>

          {/* Search — full width on every breakpoint */}
          <TextField
            size="small"
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start"><Search /></InputAdornment> },
            }}
            fullWidth
          />

          {/* Status · Type · Pinned — single row on all breakpoints */}
          <Stack direction="row" spacing={1} alignItems="center">
            <FilterList sx={{ color: 'text.secondary', flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />

            <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
              <InputLabel>{t('common:field.status')}</InputLabel>
              <Select
                value={status}
                label={t('common:field.status')}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              >
                <MenuItem value="">{t('filter.allStatuses')}</MenuItem>
                <MenuItem value="draft">{t('status.draft')}</MenuItem>
                <MenuItem value="published">{t('status.published')}</MenuItem>
                <MenuItem value="archived">{t('status.archived')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
              <InputLabel>{t('common:field.type')}</InputLabel>
              <Select
                value={typeFilter}
                label={t('common:field.type')}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              >
                {TYPE_FILTERS.map(({ value, labelKey }) => (
                  <MenuItem key={value} value={value}>{t(labelKey)}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Pinned: icon-button on mobile, full button on desktop */}
            {isMobile ? (
              <Tooltip title={pinnedOnly ? t('filter.showAll') : t('filter.pinnedOnly')}>
                <IconButton
                  size="small"
                  color={pinnedOnly ? 'primary' : 'default'}
                  onClick={() => { setPinnedOnly((v) => !v); setPage(1); }}
                  sx={{
                    border: '1px solid',
                    borderColor: pinnedOnly ? 'primary.main' : 'divider',
                    borderRadius: 1.5,
                    flexShrink: 0,
                  }}
                >
                  {pinnedOnly ? <PushPin fontSize="small" /> : <PushPinOutlined fontSize="small" />}
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                size="small"
                variant={pinnedOnly ? 'contained' : 'outlined'}
                startIcon={<PushPin />}
                onClick={() => { setPinnedOnly((v) => !v); setPage(1); }}
                sx={{ textTransform: 'none', borderRadius: 2, flexShrink: 0 }}
              >
                {t('filter.pinnedOnly')}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* ── Snack ── */}
      {snack && (
        <Alert
          severity={snack.severity}
          icon={snack.severity === 'success' ? <CheckCircle /> : undefined}
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setSnack(null)}
        >
          {snack.msg}
        </Alert>
      )}

      {/* ── Content ── */}
      {loading ? (
        <Stack spacing={1}>
          {[1, 2, 3, 4].map((i) => <RowSkeleton key={i} />)}
        </Stack>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : announcements.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Campaign sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            {t('empty.title')}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {t('empty.hint')}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {announcements.map((ann) => (
            <AnnouncementRow
              key={ann._id}
              announcement={ann}
              onPublish={handlePublish}
              onArchive={handleArchive}
              onPin={handlePin}
              onEdit={(a) => { setEditTarget(a); setFormOpen(true); }}
              onDelete={handleDelete}
            />
          ))}
        </Stack>
      )}

      {/* ── Pagination ── */}
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            shape="rounded"
            size={isMobile ? 'small' : 'medium'}
            siblingCount={isMobile ? 0 : 1}
          />
        </Box>
      )}

      {/* ── Form Dialog ── */}
      <AnnouncementFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={editTarget ? handleEdit : handleCreate}
        initialValues={editTarget}
        mode={editTarget ? 'edit' : 'create'}
      />

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        open={Boolean(confirmData)}
        title={confirmData?.title}
        message={confirmData?.message}
        severity={confirmData?.severity}
        onConfirm={runConfirm}
        onClose={() => setConfirmData(null)}
        loading={actionLoading}
      />
    </Box>
  );
}
