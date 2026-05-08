import {
  Card, CardContent, CardActions, Stack, Typography, Box,
  IconButton, Chip, Tooltip, Divider, alpha, useTheme,
} from '@mui/material';
import {
  AccessTime, LocationOn, Person, Class, Edit, Delete,
  Videocam, CalendarMonth, MoreVert,
} from '@mui/icons-material';
import ScheduleStatusChip from './ScheduleStatusChip';
import { fTime, fDateWeekday } from '../../utils/dateFormat';

const SESSION_TYPE_COLOR = {
  LECTURE: '#1976d2', TUTORIAL: '#7b1fa2', LAB: '#388e3c',
  SEMINAR: '#f57c00', EXAM: '#d32f2f',    OTHER: '#455a64',
};

/**
 * Safely resolves a display label from a class sub-document.
 * Backend stores classes as [{ classId, className? }] — className may be
 * absent on lean (non-populated) documents.
 */
const resolveClassName = (c) => c?.className || c?.label || String(c?.classId ?? '');

const ScheduleCard = ({ session, onEdit, onDelete, onView, compact = false, showActions = true }) => {
  const theme = useTheme();

  // Guard: never crash the calendar on a malformed entry
  if (!session?._id) return null;

  const color     = SESSION_TYPE_COLOR[session.sessionType] ?? theme.palette.primary.main;
  const startTime = new Date(session.startTime);
  const endTime   = new Date(session.endTime);
  const formatTime = (d) => fTime(d);
  const formatDate = (d) => fDateWeekday(d);

  if (compact) {
    return (
      <Box onClick={() => onView?.(session)} sx={{
        p: 1, borderRadius: 1, bgcolor: alpha(color, 0.12), borderLeft: `3px solid ${color}`,
        cursor: onView ? 'pointer' : 'default', '&:hover': onView ? { bgcolor: alpha(color, 0.2) } : {},
      }}>
        <Typography variant="caption" fontWeight={700} color={color} noWrap>
          {session.subject?.subject_name ?? 'Session'}
        </Typography>
        <Typography variant="caption" display="block" color="text.secondary">
          {formatTime(startTime)} – {formatTime(endTime)}
        </Typography>
      </Box>
    );
  }

  const teacherName = [session.teacher?.firstName, session.teacher?.lastName]
    .filter(Boolean).join(' ') || null;

  const classesLabel = session.classes?.length
    ? session.classes.map(resolveClassName).filter(Boolean).join(', ')
    : null;

  // FIX: was room.name (doesn't exist in schema) → room.building
  const locationNode = session.isVirtual ? (
    <InfoRow icon={<Videocam fontSize="small" color="primary" />} text="Virtual session" />
  ) : session.room?.code ? (
    <InfoRow
      icon={<LocationOn fontSize="small" />}
      text={`Room ${session.room.code}${session.room.building ? ` — ${session.room.building}` : ''}`}
    />
  ) : null;

  return (
    <Card sx={{
      borderLeft: `4px solid ${color}`, transition: 'all 0.2s ease',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: theme.shadows[6] },
    }}>
      <CardContent sx={{ pb: 1 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1} minWidth={0}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {session.subject?.subject_name ?? 'Unnamed Session'}
              </Typography>
              {session.subject?.subject_code && (
                <Typography variant="caption" color="text.secondary">
                  {session.subject.subject_code}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
              <ScheduleStatusChip status={session.status} />
              <Chip label={session.sessionType} size="small"
                sx={{ bgcolor: alpha(color, 0.12), color, fontWeight: 600 }} />
            </Stack>
          </Stack>
          <Divider />
          <Stack spacing={0.75}>
            <InfoRow icon={<CalendarMonth fontSize="small" />} text={formatDate(startTime)} />
            <InfoRow icon={<AccessTime fontSize="small" />} text={`${formatTime(startTime)} – ${formatTime(endTime)}`} />
            {teacherName  && <InfoRow icon={<Person fontSize="small" />} text={teacherName}  />}
            {classesLabel && <InfoRow icon={<Class  fontSize="small" />} text={classesLabel} />}
            {locationNode}
          </Stack>
        </Stack>
      </CardContent>

      {showActions && (onEdit || onDelete || onView) && (
        <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
          {onView   && <Tooltip title="View details"><IconButton size="small" onClick={() => onView(session)}><MoreVert fontSize="small" /></IconButton></Tooltip>}
          {onEdit   && <Tooltip title="Edit session"><IconButton size="small" color="primary" onClick={() => onEdit(session)}><Edit fontSize="small" /></IconButton></Tooltip>}
          {onDelete && <Tooltip title="Delete session"><IconButton size="small" color="error"   onClick={() => onDelete(session._id)}><Delete fontSize="small" /></IconButton></Tooltip>}
        </CardActions>
      )}
    </Card>
  );
};

const InfoRow = ({ icon, text }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Box sx={{ color: 'text.secondary', display: 'flex', flexShrink: 0 }}>{icon}</Box>
    <Typography variant="body2" color="text.secondary" noWrap>{text}</Typography>
  </Stack>
);

export default ScheduleCard;