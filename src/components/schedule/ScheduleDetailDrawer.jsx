import { useCallback, useRef } from 'react';
import {
  Drawer, Box, Stack, Typography, Divider, Chip, Button,
  IconButton, Avatar, alpha, useTheme,
} from '@mui/material';
import {
  Close, CalendarMonth, AccessTime, Class,
  LocationOn, Videocam, MenuBook, Edit, Cancel, Launch, CheckCircle,
} from '@mui/icons-material';
import ScheduleStatusChip from './ScheduleStatusChip';
import { fTime, fDateWeekdayLong } from '../../utils/dateFormat';

const SESSION_TYPE_COLOR = {
  LECTURE:   '#1976d2',
  TUTORIAL:  '#7b1fa2',
  PRACTICAL: '#388e3c',
  SEMINAR:   '#f57c00',
  EXAM:      '#d32f2f',
  OTHER:     '#455a64',
};

/**
 * Side drawer showing full session details.
 * Shared between all roles — action buttons are conditionally rendered.
 *
 * Props:
 *   session      – StudentSchedule / TeacherSchedule document (may be null while closing)
 *   open         – boolean
 *   onClose      – () => void
 *   onEdit       – (session) => void   (shown if showEdit)
 *   onCancel     – (session) => void   (shown if showCancel && status !== CANCELLED)
 *   onPublish    – (session) => void   (shown if showPublish && status === DRAFT)
 *   showEdit     – boolean
 *   showCancel   – boolean
 *   showPublish  – boolean
 *   extraFooter  – ReactNode  — optional slot rendered BELOW the standard action row,
 *                              inside the sticky footer. Used by teacher-specific drawers
 *                              to inject roll-call / postponement buttons without
 *                              forking this shared component.
 *
 * ── aria-hidden focus defence ───────────────────────────────────────────────
 * 1. blurBeforeClose() — blur the active element synchronously before onClose.
 * 2. disableRestoreFocus — prevents MUI from moving focus back into the paper.
 * 3. disableEnforceFocus — stops FocusTrap fighting our blur() call.
 * 4. Null guard INSIDE the Drawer — keeps the shell alive for the exit animation.
 * ────────────────────────────────────────────────────────────────────────────
 */
const ScheduleDetailDrawer = ({
  session,
  open,
  onClose,
  onEdit,
  onCancel,
  onPublish,
  showEdit    = false,
  showCancel  = false,
  showPublish = false,
  extraFooter = null,   // ← new prop: custom ReactNode injected in the footer
}) => {
  const theme    = useTheme();
  const paperRef = useRef(null);

  const blurBeforeClose = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
  }, []);

  const handleClose = useCallback(() => {
    blurBeforeClose();
    onClose?.();
  }, [blurBeforeClose, onClose]);

  const handleCloseButton = useCallback((e) => {
    e.currentTarget.blur();
    onClose?.();
  }, [onClose]);

  // ── Derived display values (safe when session is null) ─────────────────────
  const color    = session
    ? (SESSION_TYPE_COLOR[session.sessionType] ?? theme.palette.primary.main)
    : theme.palette.primary.main;
  const start    = session ? new Date(session.startTime) : null;
  const end      = session ? new Date(session.endTime)   : null;
  const duration = session
    ? (session.durationMinutes ?? Math.round((end - start) / 60000))
    : 0;

  const fmtDate = (d) => fDateWeekdayLong(d);
  const fmtTime = (d) => fTime(d);

  const meetingLink =
    session?.virtualMeeting?.joinUrl || session?.virtualMeeting?.meetingUrl;

  const canPublish = showPublish && session?.status === 'DRAFT';
  const canCancel  = showCancel  && session?.status !== 'CANCELLED';

  // Footer is rendered when at least one standard action OR extraFooter is present
  const hasFooter = showEdit || canCancel || canPublish || !!extraFooter;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      disableRestoreFocus
      disableEnforceFocus
      ModalProps={{ keepMounted: false }}
      slotProps={{
        paper: {
          ref: paperRef,
          tabIndex: -1,
          sx: {
            width:         { xs: '100%', sm: 440 },
            display:       'flex',
            flexDirection: 'column',
            mt: 6,
            outline: 'none',
          },
        },
      }}
    >
      {session && (
        <>
          {/* ── Coloured header ─────────────────────────────────────────────── */}
          <Box
            sx={{
              bgcolor:      alpha(color, 0.1),
              borderBottom: `3px solid ${color}`,
              p:            3,
              flexShrink:   0,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1} minWidth={0}>
                <Typography variant="h6" fontWeight={800} noWrap>
                  {session.subject?.subject_name ?? 'Session'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[session.subject?.subject_code, session.reference]
                    .filter(Boolean)
                    .join(' \u00b7 ')}
                </Typography>
              </Box>

              <IconButton
                onClick={handleCloseButton}
                size="small"
                sx={{ flexShrink: 0 }}
                aria-label="Close session detail"
              >
                <Close />
              </IconButton>
            </Stack>

            <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap" useFlexGap>
              <ScheduleStatusChip status={session.status} />
              <Chip
                label={session.sessionType}
                size="small"
                sx={{ bgcolor: alpha(color, 0.2), color, fontWeight: 600 }}
              />
              {session.isVirtual && (
                <Chip
                  label="Virtual"
                  size="small"
                  icon={<Videocam fontSize="small" />}
                  color="info"
                />
              )}
            </Stack>
          </Box>

          {/* ── Scrollable body ──────────────────────────────────────────────── */}
          <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
            <Stack spacing={3}>

              <DetailSection title="Date & Time">
                <DetailRow icon={<CalendarMonth />} label="Date"     value={fmtDate(start)} />
                <DetailRow icon={<CalendarMonth />} label="Start"    value={fmtTime(start)} />
                <DetailRow icon={<CalendarMonth />} label="End"      value={fmtTime(end)}   />
                <DetailRow icon={<CalendarMonth />} label="Duration" value={`${duration} min`} />
              </DetailSection>

              {session.teacher && (
                <DetailSection title="Teacher">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36, fontSize: 14 }}>
                      {(session.teacher.firstName?.[0] ?? '') +
                       (session.teacher.lastName?.[0]  ?? '')}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {[session.teacher.firstName, session.teacher.lastName]
                          .filter(Boolean)
                          .join(' ') || 'N/A'}
                      </Typography>
                      {session.teacher.email && (
                        <Typography variant="caption" color="text.secondary">
                          {session.teacher.email}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </DetailSection>
              )}

              {session.classes?.length > 0 && (
                <DetailSection title="Classes">
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {session.classes.map((c) => {
                      const keyVal    = c.classId?.toString() ?? c._id?.toString() ?? c.className;
                      const chipLabel = c.className || String(c.classId ?? '');
                      return (
                        <Chip
                          key={keyVal}
                          label={chipLabel}
                          size="small"
                          icon={<Class fontSize="small" />}
                        />
                      );
                    })}
                  </Stack>
                </DetailSection>
              )}

              <DetailSection title="Location">
                {session.isVirtual ? (
                  <Stack spacing={1}>
                    <DetailRow
                      icon={<Videocam />}
                      label="Platform"
                      value={session.virtualMeeting?.platform ?? 'Online'}
                    />
                    {meetingLink && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Launch />}
                        href={meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                      >
                        Join Meeting
                      </Button>
                    )}
                  </Stack>
                ) : (
                  <>
                    <DetailRow
                      icon={<LocationOn />}
                      label="Room"
                      value={session.room?.code ?? 'N/A'}
                    />
                    <DetailRow
                      icon={<LocationOn />}
                      label="Building"
                      value={session.room?.building ?? '\u2014'}
                    />
                  </>
                )}
              </DetailSection>

              {(session.topic || session.description) && (
                <DetailSection title="Content">
                  {session.topic && (
                    <DetailRow icon={<MenuBook />} label="Topic" value={session.topic} />
                  )}
                  {session.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {session.description}
                    </Typography>
                  )}
                </DetailSection>
              )}

              <DetailSection title="Academic">
                <DetailRow icon={<CalendarMonth />} label="Year"     value={session.academicYear} />
                <DetailRow icon={<CalendarMonth />} label="Semester" value={session.semester}     />
              </DetailSection>

            </Stack>
          </Box>

          {/* ── Sticky footer ────────────────────────────────────────────────── */}
          {hasFooter && (
            <Box
              sx={{
                p:          2,
                borderTop:  `1px solid ${theme.palette.divider}`,
                flexShrink: 0,
                mb:         6,
              }}
            >
              {/* Standard action row (publish / cancel / edit) */}
              {(showEdit || canCancel || canPublish) && (
                <Stack direction="row" spacing={1} justifyContent="flex-end" mb={extraFooter ? 1.5 : 0}>
                  {canPublish && (
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircle />}
                      onClick={() => onPublish?.(session)}
                      sx={{ textTransform: 'none' }}
                    >
                      Publish
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Cancel />}
                      onClick={() => onCancel?.(session)}
                      sx={{ textTransform: 'none' }}
                    >
                      Cancel Session
                    </Button>
                  )}
                  {showEdit && (
                    <Button
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={() => onEdit?.(session)}
                      sx={{ textTransform: 'none' }}
                    >
                      Edit
                    </Button>
                  )}
                </Stack>
              )}

              {/* Extra footer slot — used by teacher-specific drawers */}
              {extraFooter}
            </Box>
          )}
        </>
      )}
    </Drawer>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const DetailSection = ({ title, children }) => (
  <Box>
    <Typography variant="overline" color="text.secondary" fontWeight={700}>
      {title}
    </Typography>
    <Divider sx={{ mb: 1 }} />
    <Stack spacing={0.75}>{children}</Stack>
  </Box>
);

const DetailRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1} alignItems="flex-start">
    <Box sx={{ color: 'text.secondary', mt: 0.25, display: 'flex', flexShrink: 0 }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={500}>{value ?? '\u2014'}</Typography>
    </Box>
  </Stack>
);

export default ScheduleDetailDrawer;