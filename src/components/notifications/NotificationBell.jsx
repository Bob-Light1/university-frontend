/**
 * @file NotificationBell.jsx
 * @description Shared personal-notification bell rendered in the top AppBar of
 * every authenticated portal (Student, Teacher, Parent, Mentor, Partner, Campus,
 * Admin, Director, Staff). Consumes the backend module `/api/notifications`:
 *
 *   - badge      → GET /notifications/my/unread-count   (polled every 60 s)
 *   - popover    → GET /notifications/my                (paginated, load-more)
 *   - per item   → PATCH /notifications/:id/read
 *   - mark all   → PATCH /notifications/my/read-all
 *
 * The component is self-contained (its own state + polling) so it can live in
 * the AppBar without any portal-specific wiring. All copy is i18n-driven
 * (`notifications` namespace) with English defaults so it stays correct even
 * before the namespace lazy-loads.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge, IconButton, Tooltip, Popover, Box, Stack, Typography,
  Divider, Button, CircularProgress, List, ListItemButton,
} from '@mui/material';

import NotificationsIcon       from '@mui/icons-material/Notifications';
import DoneAllIcon             from '@mui/icons-material/DoneAll';
import AssessmentIcon          from '@mui/icons-material/Assessment';
import ExplicitIcon            from '@mui/icons-material/Explicit';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CelebrationIcon         from '@mui/icons-material/Celebration';
import VerifiedUserIcon        from '@mui/icons-material/VerifiedUser';
import WarningAmberIcon        from '@mui/icons-material/WarningAmber';

import {
  getMyNotifications,
  getNotificationUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../../services/notificationService';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE      = 8;
const POLL_INTERVAL  = 60_000; // unread-count refresh cadence (ms)

// Template → visual identity (icon + MUI palette colour).
const TEMPLATE_META = {
  'result.published':  { Icon: AssessmentIcon,           color: 'info.main' },
  'exam.graded':       { Icon: ExplicitIcon,             color: 'primary.main' },
  'payment.reminder':  { Icon: AccountBalanceWalletIcon, color: 'warning.main' },
  'account.welcome':   { Icon: CelebrationIcon,          color: 'success.main' },
  'account.activate':  { Icon: VerifiedUserIcon,         color: 'success.main' },
  'fraud.alert':       { Icon: WarningAmberIcon,         color: 'error.main' },
};
const DEFAULT_META = { Icon: NotificationsIcon, color: 'text.secondary' };

// ─── Relative-time helper (lightweight, locale-aware) ──────────────────────────

const useRelativeTime = () => {
  const { i18n } = useTranslation();
  return useCallback((value) => {
    if (!value) return '';
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const sec = Math.round(diffMs / 1000);
    const min = Math.round(sec / 60);
    const hr  = Math.round(min / 60);
    const day = Math.round(hr / 24);
    try {
      const rtf = new Intl.RelativeTimeFormat(i18n.language || 'en', { numeric: 'auto' });
      if (sec < 60)  return rtf.format(-sec, 'second');
      if (min < 60)  return rtf.format(-min, 'minute');
      if (hr  < 24)  return rtf.format(-hr,  'hour');
      if (day < 30)  return rtf.format(-day, 'day');
      return date.toLocaleDateString(i18n.language || 'en');
    } catch {
      return date.toLocaleString();
    }
  }, [i18n.language]);
};

// ─── Single notification row ───────────────────────────────────────────────────

function NotificationItem({ item, onRead, relTime }) {
  const meta   = TEMPLATE_META[item.template] || DEFAULT_META;
  const isRead = Boolean(item.readAt) || item.status === 'read';
  const { Icon } = meta;

  return (
    <ListItemButton
      onClick={() => { if (!isRead) onRead(item._id); }}
      sx={{
        alignItems: 'flex-start',
        gap: 1.25,
        py: 1.25,
        px: 2,
        bgcolor: isRead ? 'transparent' : 'action.hover',
        cursor: isRead ? 'default' : 'pointer',
      }}
    >
      <Box sx={{ pt: 0.25, color: meta.color, flexShrink: 0 }}>
        <Icon fontSize="small" />
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          {!isRead && (
            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
          )}
          <Typography
            variant="body2"
            fontWeight={isRead ? 500 : 700}
            noWrap
            sx={{ flex: 1, minWidth: 0 }}
          >
            {item.subject || item.template}
          </Typography>
        </Stack>

        {item.body && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              whiteSpace: 'pre-wrap',
              mt: 0.25,
            }}
          >
            {item.body}
          </Typography>
        )}

        <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.25 }}>
          {relTime(item.createdAt)}
        </Typography>
      </Box>
    </ListItemButton>
  );
}

// ─── Bell ───────────────────────────────────────────────────────────────────────

export default function NotificationBell() {
  const { t } = useTranslation('notifications', { useSuspense: false });
  const relTime = useRelativeTime();

  const [anchorEl,    setAnchorEl]    = useState(null);
  const [items,       setItems]       = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [markingAll,  setMarkingAll]  = useState(false);
  const [error,       setError]       = useState(false);

  const open = Boolean(anchorEl);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // ── Unread badge (initial + polling) ─────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await getNotificationUnreadCount();
      if (mountedRef.current) setUnreadCount(data?.data?.count ?? 0);
    } catch { /* silent — badge is non-critical */ }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  // ── Inbox paging ─────────────────────────────────────────────────────────────
  const loadPage = useCallback(async (nextPage) => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await getMyNotifications({ page: nextPage, limit: PAGE_SIZE });
      if (!mountedRef.current) return;
      const rows = data?.data || [];
      setItems((prev) => (nextPage === 1 ? rows : [...prev, ...rows]));
      setTotal(data?.pagination?.total ?? 0);
      setPage(nextPage);
    } catch {
      if (mountedRef.current) setError(true);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    loadPage(1);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Re-sync the badge with the server in case items were read elsewhere.
    fetchUnreadCount();
  };

  const handleRead = useCallback(async (id) => {
    // Optimistic: flip locally, decrement badge, reconcile on failure.
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString(), status: 'read' } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markNotificationAsRead(id);
    } catch {
      fetchUnreadCount();
    }
  }, [fetchUnreadCount]);

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsAsRead();
      if (!mountedRef.current) return;
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString(), status: 'read' })));
      setUnreadCount(0);
    } catch { /* silent */ } finally {
      if (mountedRef.current) setMarkingAll(false);
    }
  };

  const hasMore = items.length < total;

  return (
    <>
      <Tooltip title={t('title', { defaultValue: 'Notifications' })}>
        <IconButton color="inherit" aria-label="notifications" onClick={handleOpen}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { mt: 1, width: 380, maxWidth: '95vw', borderRadius: 2, overflow: 'hidden' } } }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5 }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            {t('title', { defaultValue: 'Notifications' })}
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={markingAll ? <CircularProgress size={14} color="inherit" /> : <DoneAllIcon />}
              onClick={handleMarkAll}
              disabled={markingAll}
              sx={{ textTransform: 'none' }}
            >
              {t('markAllRead', { defaultValue: 'Mark all as read' })}
            </Button>
          )}
        </Stack>
        <Divider />

        {/* Body */}
        <Box sx={{ maxHeight: 440, overflowY: 'auto' }}>
          {loading && items.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={26} />
            </Box>
          ) : error && items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
              <Typography variant="body2" color="error">
                {t('loadError', { defaultValue: 'Failed to load notifications.' })}
              </Typography>
              <Button size="small" onClick={() => loadPage(1)} sx={{ mt: 1, textTransform: 'none' }}>
                {t('retry', { defaultValue: 'Retry' })}
              </Button>
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <NotificationsIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                {t('empty', { defaultValue: 'No notifications' })}
              </Typography>
            </Box>
          ) : (
            <>
              <List disablePadding>
                {items.map((item, i) => (
                  <Box key={item._id}>
                    <NotificationItem item={item} onRead={handleRead} relTime={relTime} />
                    {i < items.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>

              {hasMore && (
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Button
                    size="small"
                    onClick={() => loadPage(page + 1)}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
                    sx={{ textTransform: 'none' }}
                  >
                    {t('loadMore', { defaultValue: 'Load more' })}
                  </Button>
                </Box>
              )}
            </>
          )}
        </Box>
      </Popover>
    </>
  );
}
