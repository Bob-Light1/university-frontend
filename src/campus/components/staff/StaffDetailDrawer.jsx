import {
  Box, Typography, Avatar, Stack, Divider, Chip,
  Button, List, ListItem, ListItemIcon, ListItemText,
  IconButton, Paper, Tooltip, Grid,
} from '@mui/material';
import {
  Close, Edit, Email, Phone, Person,
  AdminPanelSettings, Archive, Restore, Security,
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

export default function StaffDetailDrawer({ entity: staff, onClose, onEdit, onArchive, onRestore }) {
  if (!staff) return null;

  const imgUrl = staff.profileImage
    ? staff.profileImage.startsWith('http')
      ? staff.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${staff.profileImage.replace(/^\//, '')}`
    : null;

  const isArchived  = staff.status === 'archived';
  const subRole     = staff.subRole;
  const permissions = subRole?.permissions ?? [];

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
            {staff.firstName?.[0]}{staff.lastName?.[0]}
          </Avatar>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              {staff.firstName} {staff.lastName}
            </Typography>
            {subRole?.name && (
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                {subRole.name}
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
                label={staff.status}
                color={STATUS_COLOR[staff.status] ?? 'default'}
                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
              />
              <Stack direction="row" spacing={0.5}>
                {!isArchived && (
                  <Tooltip title="Edit Staff">
                    <IconButton size="small" color="primary" onClick={onEdit}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {isArchived ? (
                  <Tooltip title="Restore Staff">
                    <IconButton size="small" color="success" onClick={onRestore}>
                      <Restore fontSize="small" />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Archive Staff">
                    <IconButton size="small" color="error" onClick={onArchive}>
                      <Archive fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Paper>

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
                secondary={staff.email}
                onClick={staff.email ? () => { window.location.href = `mailto:${staff.email}`; } : undefined}
              />
              {staff.phone && <InfoItem icon={Phone} label="Phone" secondary={staff.phone} />}
              <InfoItem icon={Person} label="Username" secondary={`@${staff.username}`} />
            </List>
          </Box>

          {/* Role & Permissions */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Role & Permissions
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            {subRole ? (
              <Stack spacing={1.5}>
                <Chip
                  label={subRole.name ?? subRole}
                  color="primary"
                  variant="outlined"
                  icon={<Security />}
                  sx={{ alignSelf: 'flex-start', fontWeight: 700 }}
                />
                {permissions.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={0.75}>
                    {permissions.map((p) => (
                      <Chip
                        key={p}
                        label={p}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ py: 0.5 }}>
                No role assigned.
              </Typography>
            )}
          </Box>

          {/* Account Information */}
          <Box>
            <Typography variant="overline" color="text.secondary" fontSize="0.75rem">
              Account Information
            </Typography>
            <Divider sx={{ mb: 1.5, mt: 0.5 }} />
            <Grid container spacing={1.5}>
              {staff.lastLogin && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Last Login</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {new Date(staff.lastLogin).toLocaleString()}
                  </Typography>
                </Grid>
              )}
              {staff.createdAt && (
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="body2" fontWeight={500}>{fDate(staff.createdAt)}</Typography>
                </Grid>
              )}
              {staff.updatedAt && (
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body2" fontWeight={500}>{fDate(staff.updatedAt)}</Typography>
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
              Edit Staff
            </Button>
          )}
        </Stack>
      </Box>

    </Box>
  );
}
