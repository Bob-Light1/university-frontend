import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Chip, Avatar, CircularProgress,
  Alert, Divider, MenuItem, Select, FormControl, InputLabel,
} from '@mui/material';
import {
  ArrowBack, EventNote, AccessTime, Videocam, MeetingRoom,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { getMyChildren, getChildSchedule } from '../../../services/parent.service';
import { IMAGE_BASE_URL } from '../../../config/env';
import { fDateWeekdayLong, fTime } from '../../../utils/dateFormat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const profileUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

const formatDay  = (d) => fDateWeekdayLong(d);
const formatTime = (d) => fTime(d);

// ─── Child Header ─────────────────────────────────────────────────────────────

const ChildHeader = ({ student, children, onSelect, onBack }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2, mb: 3, borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Chip
          icon={<ArrowBack sx={{ color: 'white !important' }} />}
          label="Dashboard"
          onClick={onBack}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}
        />
        {children.map((c) => (
          <Chip
            key={c._id}
            avatar={<Avatar src={profileUrl(c.profileImage)} sx={{ width: 24, height: 24 }}>{c.firstName?.[0]}</Avatar>}
            label={`${c.firstName} ${c.lastName}`}
            onClick={() => onSelect(c._id)}
            sx={{
              bgcolor: c._id === student?._id ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
              color: 'white',
              fontWeight: c._id === student?._id ? 700 : 400,
              cursor: 'pointer',
            }}
          />
        ))}
      </Stack>
      {student && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Avatar src={profileUrl(student.profileImage)} sx={{ width: 48, height: 48, border: '2px solid white' }}>
            {student.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{student.firstName} {student.lastName}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Upcoming Schedule</Typography>
          </Box>
        </Stack>
      )}
    </Paper>
  );
};

// ─── Session Card ─────────────────────────────────────────────────────────────

const SessionCard = ({ session }) => {
  const theme = useTheme();
  const isVirtual = session.isVirtual;

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2, borderRadius: 2,
        borderLeft: `4px solid ${isVirtual ? theme.palette.info.main : theme.palette.primary.main}`,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Box
          sx={{
            minWidth: 48, height: 48, borderRadius: 2,
            bgcolor: isVirtual ? 'info.light' : 'primary.light',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isVirtual
            ? <Videocam sx={{ color: 'info.dark' }} />
            : <MeetingRoom sx={{ color: 'primary.dark' }} />
          }
        </Box>
        <Box flex={1}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle2" fontWeight={700}>
              {session.subject?.subject_name || 'Session'}
            </Typography>
            {session.sessionType && (
              <Chip
                label={session.sessionType}
                size="small"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem', textTransform: 'capitalize' }}
              />
            )}
            {isVirtual && (
              <Chip label="Online" size="small" color="info" sx={{ height: 18, fontSize: '0.65rem' }} />
            )}
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 14 }} />
              {formatTime(session.startTime)} — {formatTime(session.endTime)}
            </Typography>
            {session.room?.code && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <MeetingRoom sx={{ fontSize: 14 }} />
                {session.room.code}{session.room.building ? ` · ${session.room.building}` : ''}
              </Typography>
            )}
            {session.teacher && (
              <Typography variant="caption" color="text.secondary">
                {session.teacher.firstName} {session.teacher.lastName}
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ChildSchedule = () => {
  const { studentId } = useParams();
  const navigate      = useNavigate();

  const [children, setChildren] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [days,     setDays]     = useState(7);

  const student = children.find((c) => c._id === studentId);

  useEffect(() => {
    getMyChildren()
      .then(({ data }) => setChildren(data.data?.children ?? []))
      .catch(() => {});
  }, []);

  const fetchSchedule = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    getChildSchedule(studentId, { days })
      .then(({ data }) => setSchedule(data.data?.schedule ?? []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load schedule.'))
      .finally(() => setLoading(false));
  }, [studentId, days]);

  useEffect(() => { fetchSchedule(); }, [fetchSchedule]);

  const handleSelect = (id) => navigate(`/parent/children/${id}/schedule`);
  const handleBack   = () => navigate('/parent');

  // Group sessions by day
  const grouped = schedule.reduce((acc, session) => {
    const dayKey = formatDay(session.startTime);
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(session);
    return acc;
  }, {});

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <ChildHeader student={student} children={children} onSelect={handleSelect} onBack={handleBack} />

      {/* Days filter */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Upcoming</InputLabel>
          <Select
            value={days}
            label="Upcoming"
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {[3, 7, 14, 30].map((d) => (
              <MenuItem key={d} value={d}>Next {d} days</MenuItem>
            ))}
          </Select>
        </FormControl>
        {!loading && (
          <Typography variant="body2" color="text.secondary">
            {schedule.length} session{schedule.length !== 1 ? 's' : ''} found
          </Typography>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : schedule.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <EventNote sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            No upcoming sessions in the next {days} day{days !== 1 ? 's' : ''}.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {Object.entries(grouped).map(([day, sessions]) => (
            <Box key={day}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <EventNote fontSize="small" color="primary" />
                <Typography variant="subtitle1" fontWeight={700} color="primary">
                  {day}
                </Typography>
                <Chip
                  label={`${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              <Stack spacing={1.5}>
                {sessions.map((s) => (
                  <SessionCard key={s._id} session={s} />
                ))}
              </Stack>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default ChildSchedule;
