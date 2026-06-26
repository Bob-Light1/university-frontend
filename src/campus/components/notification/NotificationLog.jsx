/**
 * @file NotificationLog.jsx
 * @description Admin delivery log for the notification module
 * (ADMIN | DIRECTOR | CAMPUS_MANAGER). Consumes:
 *   - GET  /api/notifications        (paginated, campus-isolated server-side)
 *   - POST /api/notifications/:id/retry
 *
 * Surfaces every dispatched row (one channel × one recipient) with its delivery
 * status, attempts and last error, and lets a manager manually replay a failed
 * external send. Campus isolation is enforced by the backend; for ADMIN/DIRECTOR
 * the current campus (from the route) is forwarded as a scope hint.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Typography, Paper, Chip, Button, IconButton, Tooltip,
  Alert, TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, Pagination, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, CircularProgress, Skeleton, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchIcon       from '@mui/icons-material/Search';
import ReplayIcon       from '@mui/icons-material/Replay';
import RefreshIcon      from '@mui/icons-material/Refresh';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ChatIcon         from '@mui/icons-material/Chat';
import NotificationsIcon from '@mui/icons-material/Notifications';

import {
  getNotificationLog,
  retryNotification,
} from '../../../services/notificationService';
import { fDateTime } from '../../../utils/dateFormat';

// ─── Constants ────────────────────────────────────────────────────────────────

const LIMIT = 15;

const CHANNELS = ['inapp', 'email', 'whatsapp'];
const STATUSES = ['pending', 'sending', 'sent', 'failed', 'skipped', 'read'];

// Status → MUI palette colour.
const STATUS_COLOR = {
  sent:    'success',
  read:    'info',
  pending: 'warning',
  sending: 'info',
  failed:  'error',
  skipped: 'default',
};

// Channel → icon.
const CHANNEL_ICON = {
  inapp:    NotificationsIcon,
  email:    MarkEmailReadIcon,
  whatsapp: ChatIcon,
};

// A row is replayable only for an external channel that hasn't been delivered and
// is not already in flight (`sending` is a transient worker-claim state).
const isRetryable = (row) =>
  row.channel !== 'inapp' && !['sent', 'read', 'sending'].includes(row.status);

// ─── Component ─────────────────────────────────────────────────────────────────

export default function NotificationLog() {
  const { t } = useTranslation('notifications', { useSuspense: false });
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { campusId } = useParams();

  const [rows,     setRows]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [retrying, setRetrying] = useState(null); // row id being replayed

  // Filters
  const [channel,     setChannel]     = useState('');
  const [status,      setStatus]      = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');

  const fetchLog = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await getNotificationLog({
        page,
        limit: LIMIT,
        ...(channel && { channel }),
        ...(status  && { status }),
        ...(search  && { search }),
        ...(campusId && { campusId }), // scope hint — ignored by backend for scoped roles
      });
      setRows(data?.data || []);
      setTotal(data?.pagination?.total ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, channel, status, search, campusId]);

  useEffect(() => { fetchLog(); }, [fetchLog]);

  // Debounce free-text search.
  useEffect(() => {
    const id = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  const handleRetry = async (id) => {
    setRetrying(id);
    try {
      const { data } = await retryNotification(id);
      const newStatus = data?.data?.status;
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, status: newStatus || r.status } : r)));
    } catch { /* keep row as-is; surfaced via the unchanged status */ } finally {
      setRetrying(null);
    }
  };

  const resetFilters = () => {
    setChannel(''); setStatus(''); setSearchInput(''); setSearch(''); setPage(1);
  };

  const pageCount = Math.ceil(total / LIMIT);

  // ── Renderers ────────────────────────────────────────────────────────────────

  const StatusChip = ({ value }) => (
    <Chip
      label={t(`log.status.${value}`, { defaultValue: value })}
      size="small"
      color={STATUS_COLOR[value] || 'default'}
      variant={value === 'skipped' ? 'outlined' : 'filled'}
      sx={{ height: 22, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}
    />
  );

  const ChannelCell = ({ value }) => {
    const Icon = CHANNEL_ICON[value] || NotificationsIcon;
    return (
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Icon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{value}</Typography>
      </Stack>
    );
  };

  const RetryButton = ({ row }) => {
    if (!isRetryable(row)) return null;
    const busy = retrying === row._id;
    return (
      <Tooltip title={t('log.retry', { defaultValue: 'Replay delivery' })}>
        <span>
          <IconButton
            size="small"
            color="primary"
            disabled={busy}
            onClick={() => handleRetry(row._id)}
          >
            {busy ? <CircularProgress size={16} /> : <ReplayIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
    );
  };

  // ── Filters bar ────────────────────────────────────────────────────────────
  const filtersBar = (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={1.5}
      sx={{ mb: 2 }}
      alignItems={{ xs: 'stretch', md: 'center' }}
    >
      <TextField
        size="small"
        placeholder={t('log.searchPlaceholder', { defaultValue: 'Search subject, recipient, template…' })}
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ flex: 1, minWidth: 200 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
          ),
        }}
      />

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>{t('log.channel', { defaultValue: 'Channel' })}</InputLabel>
        <Select
          label={t('log.channel', { defaultValue: 'Channel' })}
          value={channel}
          onChange={(e) => { setChannel(e.target.value); setPage(1); }}
        >
          <MenuItem value="">{t('log.all', { defaultValue: 'All' })}</MenuItem>
          {CHANNELS.map((c) => (
            <MenuItem key={c} value={c} sx={{ textTransform: 'capitalize' }}>{c}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>{t('log.statusLabel', { defaultValue: 'Status' })}</InputLabel>
        <Select
          label={t('log.statusLabel', { defaultValue: 'Status' })}
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <MenuItem value="">{t('log.all', { defaultValue: 'All' })}</MenuItem>
          {STATUSES.map((s) => (
            <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>
              {t(`log.status.${s}`, { defaultValue: s })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Tooltip title={t('log.reset', { defaultValue: 'Reset filters' })}>
        <IconButton onClick={resetFilters} size="small"><RefreshIcon /></IconButton>
      </Tooltip>
    </Stack>
  );

  // ── Mobile card list ─────────────────────────────────────────────────────────
  const mobileList = (
    <Stack spacing={1.25}>
      {rows.map((row) => (
        <Paper key={row._id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} noWrap>
                {row.subject || row.template}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {row.to || '—'} · {row.template}
              </Typography>
              <Typography variant="caption" color="text.disabled">
                {fDateTime(row.createdAt)}
              </Typography>
            </Box>
            <RetryButton row={row} />
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <ChannelCell value={row.channel} />
            <StatusChip value={row.status} />
            {row.attempts > 0 && (
              <Typography variant="caption" color="text.secondary">
                {t('log.attempts', { defaultValue: 'attempts' })}: {row.attempts}/{row.maxAttempts}
              </Typography>
            )}
          </Stack>
          {row.lastError && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', wordBreak: 'break-word' }}>
              {row.lastError}
            </Typography>
          )}
        </Paper>
      ))}
    </Stack>
  );

  // ── Desktop table ──────────────────────────────────────────────────────────
  const desktopTable = (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap' } }}>
            <TableCell>{t('log.date', { defaultValue: 'Date' })}</TableCell>
            <TableCell>{t('log.channel', { defaultValue: 'Channel' })}</TableCell>
            <TableCell>{t('log.subjectCol', { defaultValue: 'Subject' })}</TableCell>
            <TableCell>{t('log.recipient', { defaultValue: 'Recipient' })}</TableCell>
            <TableCell>{t('log.template', { defaultValue: 'Template' })}</TableCell>
            <TableCell align="center">{t('log.statusLabel', { defaultValue: 'Status' })}</TableCell>
            <TableCell align="center">{t('log.attempts', { defaultValue: 'Attempts' })}</TableCell>
            <TableCell align="right">{t('log.action', { defaultValue: 'Action' })}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row._id} hover>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Typography variant="caption">{fDateTime(row.createdAt)}</Typography>
              </TableCell>
              <TableCell><ChannelCell value={row.channel} /></TableCell>
              <TableCell sx={{ maxWidth: 240 }}>
                <Typography variant="body2" noWrap title={row.subject || ''}>
                  {row.subject || '—'}
                </Typography>
              </TableCell>
              <TableCell sx={{ maxWidth: 180 }}>
                <Typography variant="caption" noWrap title={row.to || ''}>
                  {row.to || (row.channel === 'inapp' ? t('log.inApp', { defaultValue: 'in-app' }) : '—')}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="caption" color="text.secondary">{row.template}</Typography>
              </TableCell>
              <TableCell align="center">
                {row.lastError ? (
                  <Tooltip title={row.lastError}>
                    <span><StatusChip value={row.status} /></span>
                  </Tooltip>
                ) : (
                  <StatusChip value={row.status} />
                )}
              </TableCell>
              <TableCell align="center">
                <Typography variant="caption" color="text.secondary">
                  {row.attempts}/{row.maxAttempts}
                </Typography>
              </TableCell>
              <TableCell align="right"><RetryButton row={row} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <MarkEmailReadIcon color="primary" sx={{ fontSize: 30 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {t('log.title', { defaultValue: 'Notification Delivery Log' })}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t('log.subtitle', { defaultValue: 'Track and replay multi-channel deliveries' })}
          </Typography>
        </Box>
      </Stack>

      {filtersBar}

      {loading ? (
        <Stack spacing={1}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={48} />
          ))}
        </Stack>
      ) : error ? (
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={fetchLog}>{t('retry', { defaultValue: 'Retry' })}</Button>}
        >
          {t('log.loadError', { defaultValue: 'Failed to load the delivery log.' })}
        </Alert>
      ) : rows.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MarkEmailReadIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            {t('log.empty', { defaultValue: 'No notifications found' })}
          </Typography>
        </Box>
      ) : (
        <>
          {isMobile ? mobileList : desktopTable}

          {pageCount > 1 && (
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
              />
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
