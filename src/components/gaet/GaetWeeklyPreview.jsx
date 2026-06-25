/**
 * @file GaetWeeklyPreview.jsx
 * @description Weekly timetable preview for generated GAET sessions.
 *
 * Renders one card column per active weekday, with session cards inside
 * ordered by start hour. Each card is enriched with subject/teacher/class
 * names resolved via the courseRequirements array from the constraint.
 *
 * Props:
 *   sessions           – generatedSessions array from backend
 *   courseRequirements – courseRequirements from constraint (for name lookup)
 *   classOptions       – [{ value, label }] from related data
 *   subjectOptions     – [{ value, label }]
 *   teacherOptions     – [{ value, label }]
 */

import { useMemo } from 'react';
import {
  Box, Grid, Paper, Typography, Stack, Chip, Avatar,
  alpha, useTheme, Divider,
} from '@mui/material';
import {
  School, Person, MeetingRoom, AccessTime,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const ORDERED_DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

const SESSION_TYPE_COLOR = {
  LECTURE:   '#1976d2',
  TUTORIAL:  '#2e7d32',
  PRACTICAL: '#e65100',
};

// Sessions may end on a fractional hour (e.g. a 90-min session → 9.5 → "09:30").
const formatHour = (h) => {
  if (h === undefined || h === null) return '—';
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

// ─── SESSION CARD ─────────────────────────────────────────────────────────────

const SessionCard = ({ session, courseReq, subjectOptions, teacherOptions, classOptions }) => {
  const theme = useTheme();
  const { t } = useTranslation('gaet');

  const subject = subjectOptions?.find((o) => o.value === String(courseReq?.subjectId ?? ''))?.label ?? '—';
  const teacher = teacherOptions?.find((o) => o.value === String(courseReq?.teacherId ?? ''))?.label ?? '—';
  const klass   = classOptions?.find((o) => o.value === String(courseReq?.classId ?? ''))?.label ?? '—';
  const type    = courseReq?.sessionType ?? 'LECTURE';
  const color   = SESSION_TYPE_COLOR[type] ?? theme.palette.primary.main;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        borderColor: alpha(color, 0.35),
        bgcolor: alpha(color, 0.04),
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: `0 2px 12px ${alpha(color, 0.2)}` },
      }}
    >
      {/* Color header strip */}
      <Box sx={{ height: 4, bgcolor: color }} />

      <Box sx={{ p: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3, flex: 1, mr: 1 }}>
            {subject}
          </Typography>
          <Chip
            label={t(`sessionType.${type}`)}
            size="small"
            sx={{
              bgcolor: alpha(color, 0.12),
              color,
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 20,
            }}
          />
        </Stack>

        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <AccessTime sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              {formatHour(session.slot?.startHour)} – {formatHour(session.slot?.endHour)}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <School sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {klass}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Person sx={{ fontSize: 13, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" noWrap>
              {teacher}
            </Typography>
          </Stack>

          {session.roomName && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <MeetingRoom sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {session.roomName}
              </Typography>
            </Stack>
          )}
        </Stack>
      </Box>
    </Paper>
  );
};

// ─── DAY COLUMN ──────────────────────────────────────────────────────────────

const DayColumn = ({ day, sessions, crMap, subjectOptions, teacherOptions, classOptions }) => {
  const theme = useTheme();
  const { t } = useTranslation('gaet');
  return (
    <Paper
      variant="outlined"
      sx={{ borderRadius: 2.5, overflow: 'hidden', height: '100%' }}
    >
      {/* Day header */}
      <Box
        sx={{
          px: 2, py: 1.5,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderBottom: `1px solid ${theme.palette.divider}`,
          textAlign: 'center',
        }}
      >
        <Typography variant="subtitle2" fontWeight={800} color="primary.main">
          {t(`weekday.${day}`)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t('preview.dayCount', { count: sessions.length })}
        </Typography>
      </Box>

      {/* Sessions */}
      <Stack spacing={1.5} sx={{ p: 1.5 }}>
        {sessions.map((session, idx) => (
          <SessionCard
            key={session._id ?? `session-${idx}`}
            session={session}
            courseReq={crMap[String(session.courseRequirementRef)]}
            subjectOptions={subjectOptions}
            teacherOptions={teacherOptions}
            classOptions={classOptions}
          />
        ))}
      </Stack>
    </Paper>
  );
};

// ─── STATS BAR ───────────────────────────────────────────────────────────────

const StatsBar = ({ sessions }) => {
  const { t } = useTranslation('gaet');
  const counts = sessions.reduce((acc, s) => {
    const type = s._cr?.sessionType ?? 'LECTURE';
    acc[type] = (acc[type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
      {Object.entries(counts).map(([type, count]) => (
        <Stack key={type} direction="row" alignItems="center" spacing={0.75}>
          <Box
            sx={{
              width: 10, height: 10, borderRadius: '50%',
              bgcolor: SESSION_TYPE_COLOR[type] ?? '#999',
            }}
          />
          <Typography variant="caption" fontWeight={600}>
            {t('preview.statCount', { count, type: t(`sessionType.${type}`, { defaultValue: type }) })}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────

const EmptyPreview = () => {
  const { t } = useTranslation('gaet');
  return (
    <Box
      sx={{
        textAlign: 'center', py: 8, borderRadius: 3,
        border: '2px dashed', borderColor: 'divider',
      }}
    >
      <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: alpha('#1976d2', 0.08), width: 64, height: 64 }}>
        <School sx={{ fontSize: 32, color: 'primary.main' }} />
      </Avatar>
      <Typography variant="h6" fontWeight={700} mb={1}>
        {t('preview.emptyTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t('preview.emptyBody')}
      </Typography>
    </Box>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

const GaetWeeklyPreview = ({ sessions = [], courseRequirements = [], subjectOptions = [], teacherOptions = [], classOptions = [] }) => {
  const { t } = useTranslation('gaet');
  // Build courseRequirement lookup map
  const crMap = useMemo(
    () => Object.fromEntries((courseRequirements ?? []).map((cr) => [String(cr._id), cr])),
    [courseRequirements]
  );

  // Enrich sessions with their course requirement for stats
  const enrichedSessions = useMemo(
    () => sessions.map((s) => ({ ...s, _cr: crMap[String(s.courseRequirementRef)] })),
    [sessions, crMap]
  );

  // Group by day, ordered
  const sessionsByDay = useMemo(() => {
    const byDay = {};
    enrichedSessions.forEach((s) => {
      const day = s.slot?.day;
      if (!day) return;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(s);
    });
    Object.values(byDay).forEach((arr) =>
      arr.sort((a, b) => (a.slot?.startHour ?? 0) - (b.slot?.startHour ?? 0))
    );
    return byDay;
  }, [enrichedSessions]);

  const activeDays = ORDERED_DAYS.filter((d) => sessionsByDay[d]?.length > 0);

  if (!sessions.length) return <EmptyPreview />;

  return (
    <Box>
      {/* Stats header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        spacing={1}
      >
        <Typography variant="h6" fontWeight={700}>
          {t('preview.summary', { sessions: sessions.length, days: activeDays.length })}
        </Typography>
        <StatsBar sessions={enrichedSessions} />
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {/* Day columns */}
      <Grid container spacing={2}>
        {activeDays.map((day) => (
          <Grid key={day} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <DayColumn
              day={day}
              sessions={sessionsByDay[day]}
              crMap={crMap}
              subjectOptions={subjectOptions}
              teacherOptions={teacherOptions}
              classOptions={classOptions}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default GaetWeeklyPreview;
