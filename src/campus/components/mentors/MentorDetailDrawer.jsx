import {
  Box, Typography, Avatar, Stack, Divider, Chip,
  Button, List, ListItem, ListItemIcon, ListItemText,
  IconButton, Paper, Tooltip, Grid,
} from '@mui/material';
import {
  Close, Edit, Email, Phone, Person,
  Archive, Restore, Psychology,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';
import { fDate } from '../../../utils/dateFormat';

const STATUS_COLOR = {
  active:    'success',
  inactive:  'warning',
  suspended: 'error',
  archived:  'default',
};

const InfoItem = ({ icon: Icon, label, secondary, onClick }) => (
  <ListItem disablePadding sx={{ py: 1 }} onClick={onClick}>
    <ListItemIcon sx={{ minWidth: 40 }}>
      <Icon color="action" />
    </ListItemIcon>
    <ListItemText
      primary={label}
      secondary={secondary || '—'}
      slotProps={{
        primary:   { variant: 'caption', color: 'text.secondary' },
        secondary: {
          variant:    'body2',
          fontWeight: 600,
          ...(onClick && {
            sx: {
              wordBreak:      'break-word',
              color:          'primary.main',
              textDecoration: 'underline',
              cursor:         'pointer',
            },
          }),
        },
      }}
    />
  </ListItem>
);

const StatBox = ({ label, value, color }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', flex: 1 }}>
    <Typography variant="h4" fontWeight={800} sx={{ color }}>
      {value ?? 0}
    </Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Paper>
);

export default function MentorDetailDrawer({ entity: mentor, onClose, onEdit, onArchive, onRestore }) {
  if (!mentor) return null;

  const imgUrl = mentor.profileImage
    ? mentor.profileImage.startsWith('http')
      ? mentor.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${mentor.profileImage.replace(/^\//, '')}`
    : null;

  const isArchived = mentor.status === 'archived';

  return (
    <Box sx={{ width: { xs: '100vw', sm: 440 }, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          aria-label="Close"
        >
          <Close />
        </IconButton>

        <Stack alignItems="center" spacing={2} sx={{ mt: 6 }}>
          <Avatar
            src={imgUrl}
            sx={{ width: 100, height: 100, border: '4px solid white', boxShadow: 3, fontSize: 34 }}
          >
            {mentor.firstName?.[0]}{mentor.lastName?.[0]}
          </Avatar>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              {mentor.firstName} {mentor.lastName}
            </Typography>
            {mentor.specialization && (
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                {mentor.specialization}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Stack spacing={3}>

          {/* Status & quick actions */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Chip
                label={mentor.status}
                color={STATUS_COLOR[mentor.status] ?? 'default'}
                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
              />
              <Stack direction="row" spacing={0.5}>
                {!isArchived && (
                  <Tooltip title="Edit Mentor">
                    <IconButton size="small" color="primary" onClick={onEdit}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {isArchived ? (
                  <Tooltip title="Restore Mentor">
                    <IconButton size="small" color="success" onClick={onRestore}>
                      <Restore fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Archive Mentor">
                    <IconButton size="small" color="error" onClick={onArchive}>
                      <Archive fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Paper>

          {/* Assignments */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Assignments
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <Stack direction="row" spacing={1.5}>
              <StatBox label="Students" value={mentor.students?.length ?? 0} color="primary.main" />
              <StatBox label="Classes"  value={mentor.classes?.length  ?? 0} color="success.main" />
            </Stack>
          </Box>

          {/* Contact Information */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <InfoItem
                icon={Email}
                label="Email"
                secondary={mentor.email}
                onClick={mentor.email ? () => { window.location.href = `mailto:${mentor.email}`; } : undefined}
              />
              {mentor.phone && <InfoItem icon={Phone} label="Phone" secondary={mentor.phone} />}
              <InfoItem icon={Person} label="Username" secondary={`@${mentor.username}`} />
            </List>
          </Box>

          {/* Specialization */}
          {mentor.specialization && (
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
                Specialization
              </Typography>
              <Divider sx={{ mb: 1.5, mt: 0.5 }} />
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Psychology color="primary" sx={{ mt: 0.25, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {mentor.specialization}
                  </Typography>
                </Stack>
              </Paper>
            </Box>
          )}

          {/* Account Information */}
          <Box>
            <Typography variant="overline" color="text.secondary" fontSize="0.75rem">
              Account Information
            </Typography>
            <Divider sx={{ mb: 1.5, mt: 0.5 }} />
            <Grid container spacing={1.5}>
              {mentor.createdAt && (
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="body2" fontWeight={500}>{fDate(mentor.createdAt)}</Typography>
                </Grid>
              )}
              {mentor.updatedAt && (
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body2" fontWeight={500}>{fDate(mentor.updatedAt)}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>

        </Stack>
      </Box>

      {/* ── Footer Actions ───────────────────────────────────────────────────── */}
      <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" fullWidth onClick={onClose} sx={{ borderRadius: 2 }}>
            Close
          </Button>
          {!isArchived && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<Edit />}
              onClick={onEdit}
              sx={{ borderRadius: 2 }}
            >
              Edit Mentor
            </Button>
          )}
        </Stack>
      </Box>

    </Box>
  );
}
