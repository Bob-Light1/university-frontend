/**
 * @file AnnouncementInbox.jsx
 * @description Shared announcement inbox for all user-facing portals
 * (Student, Teacher, Parent, Partner, Mentor).
 *
 * Fetches /api/announcements/my — already filtered server-side by campus & role.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Stack, Typography, Paper, Chip, Button, IconButton,
  Skeleton, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, Divider, Tooltip, Badge,
  ToggleButtonGroup, ToggleButton, Pagination, useMediaQuery,
} from '@mui/material';
import {
  PushPin, MarkEmailRead, CheckCircle, Inbox, Close,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import {
  getMyAnnouncements,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../../services/announcementService';
import { TYPE_META, TYPE_FILTERS } from './announcementConstants';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import { fDate, fDateTime } from '../../utils/dateFormat';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 10;

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({ announcement, onRead, onClick }) {
  const theme  = useTheme();
  const { t }  = useAppTranslation('announcements');
  const meta   = TYPE_META[announcement.type] || TYPE_META.info;
  const isRead = announcement.isRead;

  const borderColor =
    announcement.type === 'urgent' ? theme.palette.error.main :
    announcement.type === 'warning' ? theme.palette.warning.main :
    announcement.type === 'event'   ? theme.palette.secondary.main :
    theme.palette.info.main;

  return (
    <Paper
      elevation={isRead ? 0 : 2}
      onClick={() => onClick(announcement)}
      sx={{
        p: 2,
        borderRadius: 2,
        cursor: 'pointer',
        borderLeft: `4px solid ${borderColor}`,
        bgcolor: isRead ? 'action.hover' : 'background.paper',
        opacity: isRead ? 0.8 : 1,
        transition: 'all 0.15s',
        '&:hover': { bgcolor: 'action.selected', transform: 'translateX(2px)' },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">

        {/* Unread dot */}
        <Box sx={{ pt: 0.5, flexShrink: 0 }}>
          {!isRead ? (
            <Box sx={{
              width: 8, height: 8, borderRadius: '50%',
              bgcolor: borderColor, mt: 0.25,
            }} />
          ) : (
            <Box sx={{ width: 8 }} />
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={0.5}>
            <Chip
              icon={<meta.Icon sx={{ fontSize: '14px !important' }} />}
              label={t(meta.labelKey)}
              size="small"
              color={meta.color}
              variant="outlined"
              sx={{ height: 20, fontSize: 11, fontWeight: 700 }}
            />
            {announcement.pinned && (
              <Chip
                icon={<PushPin sx={{ fontSize: '12px !important' }} />}
                label="Pinned"
                size="small"
                color="primary"
                variant="outlined"
                sx={{ height: 20, fontSize: 11 }}
              />
            )}
            {!isRead && (
              <Chip label="New" size="small" color="success" sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />
            )}
          </Stack>

          <Typography
            variant="body2"
            fontWeight={isRead ? 500 : 700}
            noWrap
            sx={{ mb: 0.25 }}
          >
            {announcement.title}
          </Typography>

          <Typography variant="caption" color="text.secondary" noWrap>
            {announcement.content.slice(0, 120)}{announcement.content.length > 120 ? '…' : ''}
          </Typography>

          <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
            {fDate(announcement.publishedAt)}
          </Typography>
        </Box>

        {/* Mark read button */}
        {!isRead && (
          <Tooltip title="Mark as read">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onRead(announcement._id); }}
              sx={{ flexShrink: 0, color: 'success.main' }}
            >
              <CheckCircle fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
}

// ─── Detail Dialog ────────────────────────────────────────────────────────────

function AnnouncementDetailDialog({ announcement, onClose }) {
  const { t } = useAppTranslation('announcements');
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!announcement) return null;
  const meta = TYPE_META[announcement.type] || TYPE_META.info;

  return (
    <Dialog
      open={Boolean(announcement)}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableEnforceFocus
      closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: isMobile ? 0 : 3 } } }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ flex: 1 }}>
            <Chip
              icon={<meta.Icon />}
              label={t(meta.labelKey)}
              color={meta.color}
              size="small"
              sx={{ fontWeight: 700 }}
            />
            {announcement.pinned && (
              <Chip icon={<PushPin />} label="Pinned" size="small" color="primary" />
            )}
            {announcement.expiresAt && (
              <Chip
                label={`Expires ${fDate(announcement.expiresAt)}`}
                size="small"
                variant="outlined"
                color="warning"
              />
            )}
          </Stack>
          {isMobile && (
            <IconButton size="small" onClick={onClose} sx={{ flexShrink: 0 }}>
              <Close fontSize="small" />
            </IconButton>
          )}
        </Stack>
        <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
          {announcement.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Published {fDateTime(announcement.publishedAt)}
        </Typography>
      </DialogTitle>

      <Divider />

      <DialogContent>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}>
          {announcement.content}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function InboxSkeleton() {
  return (
    <Stack spacing={1.5}>
      {[1, 2, 3, 4].map((i) => (
        <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: 2 }}>
          <Stack direction="row" spacing={1.5}>
            <Skeleton variant="circular" width={8} height={8} sx={{ mt: 1 }} />
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} mb={0.5}>
                <Skeleton variant="rounded" width={60} height={20} />
              </Stack>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="80%" height={16} />
              <Skeleton variant="text" width={80} height={14} />
            </Box>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnnouncementInbox() {
  const { t } = useAppTranslation('announcements');
  const [announcements, setAnnouncements] = useState([]);
  const [total,         setTotal]         = useState(0);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [page,          setPage]          = useState(1);
  const [typeFilter,    setTypeFilter]    = useState('');
  const [unreadOnly,    setUnreadOnly]    = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [markingAll,    setMarkingAll]    = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getMyAnnouncements({
        page,
        limit: LIMIT,
        ...(typeFilter  && { type: typeFilter }),
        ...(unreadOnly  && { unreadOnly: 'true' }),
      });
      setAnnouncements(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, unreadOnly]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data.data?.count ?? 0);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetchUnreadCount();
  }, [fetchAnnouncements, fetchUnreadCount]);

  const handleRead = useCallback(async (id) => {
    try {
      await markAsRead(id);
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? { ...a, isRead: true } : a))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  }, []);

  const handleCardClick = useCallback(async (ann) => {
    setSelected(ann);
    if (!ann.isRead) await handleRead(ann._id);
  }, [handleRead]);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllAsRead();
      setUnreadCount(0);
      // Refetch so every visible card (and pagination) reflects the updated isRead state.
      await fetchAnnouncements();
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  const handleTypeChange = (_, val) => {
    setTypeFilter(val ?? '');
    setPage(1);
  };

  const pageCount = Math.ceil(total / LIMIT);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 800, mx: 'auto' }}>

      {/* ── Header ── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <Inbox color="primary" sx={{ fontSize: 32 }} />
          </Badge>
          <Box>
            <Typography variant="h5" fontWeight={700}>Announcements</Typography>
            <Typography variant="caption" color="text.secondary">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            variant={unreadOnly ? 'contained' : 'outlined'}
            onClick={() => { setUnreadOnly((v) => !v); setPage(1); }}
            sx={{ textTransform: 'none', borderRadius: 2, flex: { xs: 1, sm: 'none' } }}
          >
            {unreadOnly ? 'Show All' : 'Unread Only'}
          </Button>
          {unreadCount > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAll}
              disabled={markingAll}
              sx={{ textTransform: 'none', borderRadius: 2, flex: { xs: 1, sm: 'none' } }}
            >
              Mark All Read
            </Button>
          )}
        </Stack>
      </Stack>

      {/* ── Type filter ── */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={handleTypeChange}
          size="small"
          sx={{ gap: 0.5, flexWrap: 'wrap' }}
        >
          {TYPE_FILTERS.map(({ value, labelKey }) => (
            <ToggleButton
              key={value}
              value={value}
              sx={{
                borderRadius: '20px !important',
                border: '1px solid !important',
                px: 1.5,
                textTransform: 'none',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {t(labelKey)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* ── Content ── */}
      {loading ? (
        <InboxSkeleton />
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
      ) : announcements.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CheckCircle sx={{ fontSize: 56, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            {unreadOnly ? 'No unread announcements' : 'No announcements'}
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {unreadOnly
              ? 'You\'re all caught up! Toggle to see past announcements.'
              : 'Nothing to display for the selected filter.'}
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {announcements.map((ann) => (
            <AnnouncementCard
              key={ann._id}
              announcement={ann}
              onRead={handleRead}
              onClick={handleCardClick}
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
          />
        </Box>
      )}

      {/* ── Detail dialog ── */}
      <AnnouncementDetailDialog
        announcement={selected}
        onClose={() => setSelected(null)}
      />
    </Box>
  );
}
