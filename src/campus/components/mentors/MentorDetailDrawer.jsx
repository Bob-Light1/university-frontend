import {
  Box, Typography, Avatar, Stack, Divider, Chip, Button,
  List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import {
  Close, Edit, Email, Phone, Person,
  Archive, Restore, Group, Psychology,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

const STATUS_COLOR = {
  active:    'success',
  inactive:  'warning',
  suspended: 'error',
  archived:  'default',
};

export default function MentorDetailDrawer({ entity: mentor, onClose, onEdit, onArchive, onRestore }) {
  if (!mentor) return null;

  const imgUrl = mentor.profileImage
    ? mentor.profileImage.startsWith('http')
      ? mentor.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${mentor.profileImage.replace(/^\//, '')}`
    : null;

  const isArchived = mentor.status === 'archived';

  return (
    <Box sx={{ width: { xs: '100vw', sm: 420 }, p: 3, height: '100%', overflow: 'auto' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Mentor Details</Typography>
        <Button size="small" onClick={onClose} sx={{ minWidth: 0 }}><Close /></Button>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      <Stack alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <Avatar src={imgUrl} sx={{ width: 80, height: 80, fontSize: 28 }}>
          {mentor.firstName?.[0]}{mentor.lastName?.[0]}
        </Avatar>
        <Box textAlign="center">
          <Typography variant="h6" fontWeight={700}>{mentor.firstName} {mentor.lastName}</Typography>
          {mentor.specialization && (
            <Typography variant="body2" color="text.secondary">{mentor.specialization}</Typography>
          )}
          <Chip
            label={mentor.status}
            size="small"
            color={STATUS_COLOR[mentor.status] ?? 'default'}
            sx={{ fontWeight: 600, textTransform: 'capitalize', mt: 0.5 }}
          />
        </Box>
      </Stack>

      <List dense disablePadding sx={{ mb: 2 }}>
        {mentor.email && (
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}><Email fontSize="small" color="action" /></ListItemIcon>
            <ListItemText primary={mentor.email} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        )}
        {mentor.phone && (
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}><Phone fontSize="small" color="action" /></ListItemIcon>
            <ListItemText primary={mentor.phone} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        )}
        <ListItem disableGutters>
          <ListItemIcon sx={{ minWidth: 36 }}><Person fontSize="small" color="action" /></ListItemIcon>
          <ListItemText primary={`@${mentor.username}`} primaryTypographyProps={{ variant: 'body2', fontFamily: 'monospace' }} />
        </ListItem>
        {mentor.specialization && (
          <ListItem disableGutters>
            <ListItemIcon sx={{ minWidth: 36 }}><Psychology fontSize="small" color="action" /></ListItemIcon>
            <ListItemText primary={mentor.specialization} primaryTypographyProps={{ variant: 'body2' }} />
          </ListItem>
        )}
      </List>

      <Divider sx={{ mb: 2 }} />

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
        <Group fontSize="small" color="action" />
        <Typography variant="subtitle2" fontWeight={700}>Assignments</Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Chip label={`${mentor.students?.length ?? 0} students`} size="small" variant="outlined" />
        <Chip label={`${mentor.classes?.length ?? 0} classes`}   size="small" variant="outlined" />
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack direction="row" spacing={1}>
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
