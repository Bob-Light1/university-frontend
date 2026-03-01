import {
  Box,
  IconButton,
  Typography,
  Avatar,
  Stack,
  Divider,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Edit,
  Email,
  Phone,
  Domain,
  Badge,
  Cake,
  Person,
  Male,
  Female,
  Archive,
  Work,
  School,
  Star,
  Psychology,
  AccessTime,
  Business,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

/**
 * TEACHER DETAIL DRAWER
 *
 * Shows complete teacher information
 *
 * @param {Object}   props.entity    - Selected teacher
 * @param {Boolean}  props.open      - Drawer open/close state
 * @param {Function} props.onClose   - Close callback
 * @param {Function} props.onEdit    - Edit callback
 * @param {Function} props.onArchive - Archive callback
 */
const TeacherDetailDrawer = ({ entity: teacher, onClose, onEdit, onArchive }) => {
  if (!teacher) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = calculateAge(teacher.dateOfBirth);

  const profileImageUrl = teacher.profileImage
    ? teacher.profileImage.startsWith('http')
      ? teacher.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${teacher.profileImage.replace(/^\//, '')}`
    : null;

  const employmentColors = {
    'full-time': 'success',
    'part-time': 'warning',
    contract: 'info',
    temporary: 'default',
  };

  const statusColor = teacher.status === 'active' ? 'success'
    : teacher.status === 'inactive' ? 'warning'
    : teacher.status === 'suspended' ? 'error'
    : 'default';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #003285 0%, #2a629a 100%)',
          color: 'white',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
        >
          <Close />
        </IconButton>

        <Stack alignItems="center" spacing={2} sx={{ mt: 5 }}>
          <Avatar
            src={profileImageUrl}
            sx={{
              width: 100,
              height: 100,
              border: '4px solid white',
              boxShadow: 3,
              fontSize: '2rem',
              fontWeight: 700,
              bgcolor: 'rgba(255,255,255,0.2)',
            }}
          >
            {teacher.firstName?.[0]}
            {teacher.lastName?.[0]}
          </Avatar>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              {teacher.firstName} {teacher.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
              {teacher.email}
            </Typography>
            {teacher.department?.name && (
              <Chip
                label={teacher.department.name}
                size="small"
                sx={{
                  mt: 1,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              />
            )}
          </Box>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        <Stack spacing={3}>
          {/* Status & Quick Actions */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1}>
                <Chip
                  label={teacher.status || 'active'}
                  color={statusColor}
                  size="small"
                  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                />
                {teacher.employmentType && (
                  <Chip
                    label={teacher.employmentType}
                    color={employmentColors[teacher.employmentType] || 'default'}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit Teacher">
                  <IconButton size="small" color="primary" onClick={onEdit}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                {onArchive && (
                  <Tooltip title="Archive Teacher">
                    <IconButton size="small" color="error" onClick={onArchive}>
                      <Archive fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Paper>

          {/* Personal Information */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Personal Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Badge color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Matricule"
                  secondary={teacher.matricule || 'TEA'}
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>

              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Person color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Username"
                  secondary={teacher.username || 'N/A'}
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>

              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {teacher.gender === 'male' ? (
                    <Male color="action" />
                  ) : teacher.gender === 'female' ? (
                    <Female color="action" />
                  ) : (
                    <Person color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary="Gender"
                  secondary={
                    teacher.gender
                      ? teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1)
                      : 'N/A'
                  }
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>

              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Cake color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Date of Birth"
                  secondary={
                    teacher.dateOfBirth
                      ? `${formatDate(teacher.dateOfBirth)}${age ? ` (${age} years old)` : ''}`
                      : 'N/A'
                  }
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>
            </List>
          </Box>

          {/* Contact Information */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Email color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={teacher.email || 'N/A'}
                  onClick={() => window.location.href = `mailto:${teacher.email}`}
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: {
                      variant: 'body2',
                      fontWeight: 600,
                      sx: {
                        wordBreak: 'break-word',
                        color: 'primary.main',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                      },
                    },
                  }}
                />
              </ListItem>

              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Phone color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Phone"
                  secondary={teacher.phone || 'N/A'}
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>
            </List>
          </Box>

          {/* Professional Information */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Professional Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Business color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Department"
                  secondary={teacher.department?.name || 'N/A'}
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>

              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Star color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Qualification"
                  secondary={teacher.qualification || 'N/A'}
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>

              {teacher.specialization && (
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Psychology color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Specialization"
                    secondary={teacher.specialization}
                    slotProps={{
                      primary: { variant: 'caption', color: 'text.secondary' },
                      secondary: { variant: 'body2', fontWeight: 600 },
                    }}
                  />
                </ListItem>
              )}

              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AccessTime color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Experience"
                  secondary={
                    teacher.experience !== undefined && teacher.experience !== null
                      ? `${teacher.experience} year${teacher.experience !== 1 ? 's' : ''}`
                      : 'N/A'
                  }
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>

              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Work color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Employment Type"
                  secondary={
                    teacher.employmentType
                      ? teacher.employmentType.charAt(0).toUpperCase() +
                        teacher.employmentType.slice(1)
                      : 'N/A'
                  }
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>

              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Cake color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Hire Date"
                  secondary={formatDate(teacher.hireDate)}
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>
            </List>
          </Box>

          {/* Subjects */}
          {teacher.subjects?.length > 0 && (
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
                Subjects Taught
              </Typography>
              <Divider sx={{ mb: 2, mt: 0.5 }} />
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {teacher.subjects.map((subject) => (
                  <Chip
                    key={subject._id}
                    icon={<School sx={{ fontSize: 14 }} />}
                    label={subject.subject_name}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Classes */}
          {teacher.classes?.length > 0 && (
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
                Classes Assigned
              </Typography>
              <Divider sx={{ mb: 2, mt: 0.5 }} />
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {teacher.classes.map((cls) => (
                  <Chip
                    key={cls._id}
                    label={cls.className}
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Campus */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Campus
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <ListItem disablePadding sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Domain color="action" />
                </ListItemIcon>
                <ListItemText
                  primary="Campus"
                  secondary={teacher.schoolCampus?.campus_name || 'N/A'}
                  slotProps={{
                    primary: { variant: 'caption', color: 'text.secondary' },
                    secondary: { variant: 'body2', fontWeight: 600 },
                  }}
                />
              </ListItem>
            </List>
          </Box>

          {/* Emergency Contact */}
          {teacher.emergencyContact?.name && (
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
                Emergency Contact
              </Typography>
              <Divider sx={{ mb: 2, mt: 0.5 }} />
              <List disablePadding>
                <ListItem disablePadding sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Person color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={teacher.emergencyContact.relationship || 'Contact'}
                    secondary={`${teacher.emergencyContact.name}${teacher.emergencyContact.phone ? ` — ${teacher.emergencyContact.phone}` : ''}`}
                    slotProps={{
                      primary: { variant: 'caption', color: 'text.secondary' },
                      secondary: { variant: 'body2', fontWeight: 600 },
                    }}
                  />
                </ListItem>
              </List>
            </Box>
          )}

          {/* Account Info */}
          <Box>
            <Typography variant="overline" color="text.secondary" fontSize="0.75rem">
              Account Information
            </Typography>
            <Divider sx={{ mb: 1, mt: 0.5 }} />
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDate(teacher.createdAt)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {formatDate(teacher.updatedAt)}
                </Typography>
              </Grid>
              {teacher.lastLogin && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">
                    Last Login
                  </Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(teacher.lastLogin)}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>
        </Stack>
      </Box>

      {/* Footer Actions */}
      <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Edit />}
            onClick={onEdit}
            sx={{ borderRadius: 2 }}
          >
            Edit Teacher
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

export default TeacherDetailDrawer;