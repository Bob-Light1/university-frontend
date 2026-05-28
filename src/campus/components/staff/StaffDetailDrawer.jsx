import {
  Box, Typography, Avatar, Stack, Divider, Chip,
  Button, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Close, Edit, Email, Phone, Person,
  AdminPanelSettings, Archive, Restore,
  Badge as BadgeIcon, Security,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

const STATUS_COLOR = {
  active:    'success',
  inactive:  'warning',
  suspended: 'error',
  archived:  'default',
};

export default function StaffDetailDrawer({ entity: staff, onClose, onEdit, onArchive, onRestore }) {
  if (!staff) return null;

  const imgUrl = staff.profileImage
    ? staff.profileImage.startsWith('http')
      ? staff.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${staff.profileImage.replace(/^\//, '')}`
    : null;

  const isArchived = staff.status === 'archived';
  const subRole    = staff.subRole;
  const permissions = subRole?.permissions ?? [];

  return (
    <Box sx={{ width: { xs: '100vw', sm: 420 }, p: 3, height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Staff Details</Typography>
        <Button size="small" onClick={onClose} sx={{ minWidth: 0 }}><Close /></Button>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {/* Identity */}
      <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar src={imgUrl} sx={{ width: 80, height: 80, fontSize: 28 }}>
          {staff.firstName?.[0]}{staff.lastName?.[0]}
        </Avatar>
        <Box textAlign="center">
          <Typography variant="h6" fontWeight={700}>
            {staff.firstName} {staff.lastName}
          </Typography>
          <Chip
            label={staff.status}
            size="small"
            color={STATUS_COLOR[staff.status] ?? 'default'}
            sx={{ fontWeight: 600, textTransform: 'capitalize', mt: 0.5 }}
          />
        </Box>
      </Stack>

      {/* Contact info */}
      <List dense disablePadding sx={{ mb: 2 }}>
        {staff.email && (
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}><Email fontSize="small" color="action" /></ListItemIcon>
            <ListItemText primary={staff.email} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        )}
        {staff.phone && (
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}><Phone fontSize="small" color="action" /></ListItemIcon>
            <ListItemText primary={staff.phone} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        )}
        <ListItem disableGutters>
          <ListItemIcon sx={{ minWidth: 36 }}><Person fontSize="small" color="action" /></ListItemIcon>
          <ListItemText primary={`@${staff.username}`} primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }} />
        </ListItem>
        {staff.lastLogin && (
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}><BadgeIcon fontSize="small" color="action" /></ListItemIcon>
            <ListItemText
              primary={`Last login: ${new Date(staff.lastLogin).toLocaleString()}`}
              primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
            />
          </ListItem>
        )}
      </List>

      <Divider sx={{ mb: 2 }} />

      {/* Sub-role & permissions */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <AdminPanelSettings fontSize="small" color="action" />
        <Typography variant="subtitle2" fontWeight={700}>Sub-Role & Permissions</Typography>
      </Stack>

      {subRole ? (
        <Box>
          <Chip
            label={subRole.name ?? subRole}
            color="primary"
            variant="outlined"
            icon={<Security />}
            sx={{ mb: 1.5, fontWeight: 700 }}
          />
          {permissions.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.5}>
              {permissions.map((p) => (
                <Chip key={p} label={p} size="small" sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }} />
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.disabled">No role assigned.</Typography>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Actions */}
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {!isArchived && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<Edit />}
            onClick={onEdit}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Edit
          </Button>
        )}
        {isArchived ? (
          <Button
            variant="outlined"
            color="success"
            size="small"
            startIcon={<Restore />}
            onClick={onRestore}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Restore
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<Archive />}
            onClick={onArchive}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Archive
          </Button>
        )}
      </Stack>
    </Box>
  );
}
