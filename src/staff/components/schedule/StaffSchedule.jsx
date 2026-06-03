import { useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Grid,
  TextField, MenuItem, Select, FormControl, InputLabel,
  Alert, Pagination, Skeleton, IconButton, Tooltip, Divider,
} from '@mui/material';
import {
  CalendarMonth, AccessTime, Person, Class, Refresh,
} from '@mui/icons-material';

import { getStaffSchedule }   from '../../../services/staffService';
import PermissionGate         from '../shared/PermissionGate';
import usePaginatedList       from '../../../hooks/usePaginatedList';
import { useAppTranslation }  from '../../../hooks/useAppTranslation';

const STAFF_PRIMARY = '#00695C';

const STATUS_BG = {
  PUBLISHED: { bg: '#e8f5e9', color: '#2e7d32' },
  DRAFT:     { bg: '#f5f5f5', color: '#616161' },
  CANCELLED: { bg: '#fdecea', color: '#c62828' },
  POSTPONED: { bg: '#fff3e0', color: '#e65100' },
  COMPLETED: { bg: '#e3f2fd', color: '#1565c0' },
};

const SESSION_TYPE_COLOR = {
  LECTURE:  '#1565c0',
  LAB:      '#2e7d32',
  TUTORIAL: '#e65100',
  SEMINAR:  '#6a1b9a',
  WORKSHOP: '#00695C',
};

const ROWS_OPTIONS = [10, 20, 50, 100];

function SessionCard({ s, t, i18n }) {
  const sc    = STATUS_BG[s.status] ?? { bg: '#f5f5f5', color: '#616161' };
  const color = SESSION_TYPE_COLOR[s.sessionType] ?? STAFF_PRIMARY;

  const classes = (s.classes ?? []).map((c) => c?.className ?? c).filter(Boolean);
  const teacher = s.teacher
    ? `${s.teacher.firstName ?? ''} ${s.teacher.lastName ?? ''}`.trim()
    : null;

  const fmtTime = (d) =>
    new Date(d).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' });

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        borderLeft: `4px solid ${color}`,
        p: 2,
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {s.subject?.subject_name ?? s.name ?? s.title ?? '—'}
            </Typography>
            {s.subject?.subject_code && (
              <Typography variant="caption" color="text.secondary">{s.subject.subject_code}</Typography>
            )}
          </Box>
          <Stack direction="row" spacing={0.5} flexShrink={0}>
            <Chip
              label={t(`common:status.${s.status?.toLowerCase() ?? 'draft'}`)}
              size="small"
              sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: 10 }}
            />
            {s.sessionType && (
              <Chip
                label={t(`common:sessionType.${s.sessionType}`, { defaultValue: s.sessionType })}
                size="small"
                sx={{ bgcolor: color + '18', color, fontWeight: 600, fontSize: 10 }}
              />
            )}
          </Stack>
        </Stack>

        <Divider />

        <Stack spacing={0.5}>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
            </Typography>
          </Stack>
          {teacher && (
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Person sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">{teacher}</Typography>
            </Stack>
          )}
          {classes.length > 0 && (
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
              <Class sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
              <Stack direction="row" flexWrap="wrap" gap={0.5}>
                {classes.slice(0, 3).map((c, i) => (
                  <Chip key={i} label={c} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
                ))}
                {classes.length > 3 && (
                  <Chip label={`+${classes.length - 3}`} size="small" sx={{ height: 18, fontSize: 10 }} />
                )}
              </Stack>
            </Stack>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function ScheduleList() {
  const { t, i18n } = useAppTranslation(['schedule', 'common']);

  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [status,   setStatus]   = useState('');
  const [limit,    setLimit]    = useState(20);

  const fetcher = useCallback(
    (page) => getStaffSchedule({ page, limit, from: fromDate || undefined, to: toDate || undefined, status: status || undefined }),
    [limit, fromDate, toDate, status],
  );

  const {
    items: sessions, total, page, setPage, loading, error, refresh,
  } = usePaginatedList(fetcher);

  const totalPages = Math.ceil(total / limit);
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);
  const handleFilter = (setter) => (e) => { setter(e.target.value); setPage(1); };

  const fmtDayHeader = (d) =>
    new Date(d).toLocaleDateString(i18n.language, {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });

  const grouped = sessions.reduce((acc, s) => {
    const day = new Date(s.startTime).toISOString().split('T')[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {});
  const days = Object.keys(grouped).sort();

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      {/* ── Header ── */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <CalendarMonth sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box flex={1}>
          <Typography variant="h5" fontWeight={800}>{t('common:nav.schedule')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('common:onCampus.sessions', { count: total })}
          </Typography>
        </Box>
        <Tooltip title={t('common:action.refresh')}>
          <IconButton onClick={refresh} size="small" disabled={loading}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── Filters ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }} flexWrap="wrap">
        <TextField
          size="small" type="date" label={t('schedule:filter.from')} value={fromDate}
          onChange={handleFilter(setFromDate)}
          sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small" type="date" label={t('schedule:filter.to')} value={toDate}
          onChange={handleFilter(setToDate)}
          sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{t('schedule:filter.status')}</InputLabel>
          <Select value={status} label={t('schedule:filter.status')} onChange={handleFilter(setStatus)} sx={{ borderRadius: 2 }}>
            <MenuItem value="">{t('common:all')}</MenuItem>
            {['PUBLISHED', 'DRAFT', 'POSTPONED', 'CANCELLED', 'COMPLETED'].map((s) => (
              <MenuItem key={s} value={s}>{t(`common:status.${s.toLowerCase()}`)}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Grouped cards ── */}
      {loading
        ? (
          <Grid container spacing={2}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={130} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        )
        : sessions.length === 0
          ? (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">{t('schedule:noSessions')}</Typography>
            </Paper>
          )
          : days.map((day) => (
              <Box key={day} sx={{ mb: 3 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <CalendarMonth sx={{ fontSize: 16, color: STAFF_PRIMARY }} />
                  <Typography variant="subtitle2" fontWeight={700} color={STAFF_PRIMARY} sx={{ textTransform: 'capitalize' }}>
                    {fmtDayHeader(day)}
                  </Typography>
                  <Chip label={grouped[day].length} size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#e8f5e9', color: STAFF_PRIMARY }} />
                </Stack>
                <Grid container spacing={2}>
                  {grouped[day].map((s) => (
                    <Grid item xs={12} sm={6} md={4} key={s._id}>
                      <SessionCard s={s} t={t} i18n={i18n} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))
      }

      {/* ── Footer ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={1.5} sx={{ mt: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small">
            <Select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} sx={{ borderRadius: 2, fontSize: 13 }}>
              {ROWS_OPTIONS.map((n) => <MenuItem key={n} value={n}>{t('common:perPage', { count: n })}</MenuItem>)}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            {total === 0 ? t('schedule:noSessions') : t('common:range', { start: rangeStart, end: rangeEnd, total })}
          </Typography>
        </Stack>
        {totalPages > 1 && (
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" shape="rounded" size="small" />
        )}
      </Stack>
    </Box>
  );
}

export default function StaffSchedule() {
  return (
    <PermissionGate anyOf={['schedule.read', 'schedule.manage']}>
      <ScheduleList />
    </PermissionGate>
  );
}
