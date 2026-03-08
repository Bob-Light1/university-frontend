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
  ManageAccounts,
  Class as ClassIcon,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

/**
 * TEACHER DETAIL DRAWER
 *
 * Displays the complete profile of a teacher.
 * Classes section shows which class the teacher manages (classManager badge).
 *
 * @param {Object}   props.entity    - Populated teacher document
 * @param {Function} props.onClose   - Close callback
 * @param {Function} props.onEdit    - Edit callback
 * @param {Function} props.onArchive - Archive callback
 */
const TeacherDetailDrawer = ({ entity: teacher, onClose, onEdit, onArchive }) => {
  if (!teacher) return null;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today     = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
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
    contract:    'info',
    temporary:   'default',
  };

  const statusColor =
    teacher.status === 'active'    ? 'success' :
    teacher.status === 'inactive'  ? 'warning' :
    teacher.status === 'suspended' ? 'error'   : 'default';

  // Determine which class (if any) this teacher manages.
  // The populated class objects carry classManager as an object or ObjectId.
  const teacherId = teacher._id?.toString();
  const managedClassId = teacher.classes?.find((cls) => {
    const mgr = cls.classManager;
    if (!mgr) return false;
    return (mgr._id?.toString() ?? mgr.toString()) === teacherId;
  })?._id?.toString();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
              width: 100, height: 100,
              border: '4px solid white',
              boxShadow: 3,
              fontSize: '2rem', fontWeight: 700,
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

      {/* ── Content ────────────────────────────────────────────────────────── */}
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
              <DetailListItem icon={<Badge color="action" />}  primary="Matricule" secondary={teacher.matricule || 'N/A'} />
              <DetailListItem icon={<Person color="action" />} primary="Username"  secondary={teacher.username  || 'N/A'} />
              <DetailListItem
                icon={
                  teacher.gender === 'male'   ? <Male color="action" />   :
                  teacher.gender === 'female' ? <Female color="action" /> :
                  <Person color="action" />
                }
                primary="Gender"
                secondary={teacher.gender
                  ? teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1)
                  : 'N/A'}
              />
              <DetailListItem
                icon={<Cake color="action" />}
                primary="Date of Birth"
                secondary={
                  teacher.dateOfBirth
                    ? `${formatDate(teacher.dateOfBirth)}${age ? ` (${age} years old)` : ''}`
                    : 'N/A'
                }
              />
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
                <ListItemIcon sx={{ minWidth: 40 }}><Email color="action" /></ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary={teacher.email || 'N/A'}
                  onClick={() => window.location.href = `mailto:${teacher.email}`}
                  slotProps={{
                    primary:   { variant: 'caption', color: 'text.secondary' },
                    secondary: {
                      variant: 'body2', fontWeight: 600,
                      sx: { wordBreak: 'break-word', color: 'primary.main', textDecoration: 'underline', cursor: 'pointer' },
                    },
                  }}
                />
              </ListItem>
              <DetailListItem icon={<Phone color="action" />} primary="Phone" secondary={teacher.phone || 'N/A'} />
            </List>
          </Box>

          {/* Professional Information */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Professional Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <DetailListItem icon={<Business color="action" />}   primary="Department"      secondary={teacher.department?.name || 'N/A'} />
              <DetailListItem icon={<Star color="action" />}       primary="Qualification"   secondary={teacher.qualification    || 'N/A'} />
              {teacher.specialization && (
                <DetailListItem icon={<Psychology color="action" />} primary="Specialization" secondary={teacher.specialization} />
              )}
              <DetailListItem
                icon={<AccessTime color="action" />}
                primary="Experience"
                secondary={
                  teacher.experience != null
                    ? `${teacher.experience} year${teacher.experience !== 1 ? 's' : ''}`
                    : 'N/A'
                }
              />
              <DetailListItem
                icon={<Work color="action" />}
                primary="Employment Type"
                secondary={
                  teacher.employmentType
                    ? teacher.employmentType.charAt(0).toUpperCase() + teacher.employmentType.slice(1)
                    : 'N/A'
                }
              />
              <DetailListItem icon={<Cake color="action" />} primary="Hire Date" secondary={formatDate(teacher.hireDate)} />
            </List>
          </Box>

          {/* Subjects Taught */}
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

          {/* Classes Assigned */}
          {teacher.classes?.length > 0 && (
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
                Classes Assigned
              </Typography>
              <Divider sx={{ mb: 2, mt: 0.5 }} />
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {teacher.classes.map((cls) => {
                  const isManager = cls._id?.toString() === managedClassId;
                  return (
                    <Tooltip
                      key={cls._id}
                      title={isManager ? 'Class Manager (homeroom teacher)' : ''}
                      disableHoverListener={!isManager}
                    >
                      <Chip
                        label={cls.className}
                        size="small"
                        color={isManager ? 'primary' : 'secondary'}
                        variant={isManager ? 'filled' : 'outlined'}
                        icon={isManager
                          ? <ManageAccounts sx={{ fontSize: 14 }} />
                          : <ClassIcon sx={{ fontSize: 14 }} />
                        }
                      />
                    </Tooltip>
                  );
                })}
              </Stack>
              {managedClassId && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  <ManageAccounts sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                  Filled chip = Class Manager
                </Typography>
              )}
            </Box>
          )}

          {/* Campus */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Campus
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <DetailListItem icon={<Domain color="action" />} primary="Campus" secondary={teacher.schoolCampus?.campus_name || 'N/A'} />
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
                <DetailListItem
                  icon={<Person color="action" />}
                  primary={teacher.emergencyContact.relationship || 'Contact'}
                  secondary={`${teacher.emergencyContact.name}${teacher.emergencyContact.phone ? ` — ${teacher.emergencyContact.phone}` : ''}`}
                />
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
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(teacher.createdAt)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(teacher.updatedAt)}</Typography>
              </Grid>
              {teacher.lastLogin && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" color="text.secondary">Last Login</Typography>
                  <Typography variant="body2" fontWeight={500}>{formatDate(teacher.lastLogin)}</Typography>
                </Grid>
              )}
            </Grid>
          </Box>

        </Stack>
      </Box>

      {/* ── Footer Actions ──────────────────────────────────────────────────── */}
      <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" fullWidth onClick={onClose} sx={{ borderRadius: 2 }}>
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

// ─── Shared sub-component ─────────────────────────────────────────────────────

/**
 * Reusable read-only list row used throughout the drawer.
 */
const DetailListItem = ({ icon, primary, secondary }) => (
  <ListItem disablePadding sx={{ py: 1 }}>
    <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
    <ListItemText
      primary={primary}
      secondary={secondary}
      slotProps={{
        primary:   { variant: 'caption', color: 'text.secondary' },
        secondary: { variant: 'body2',   fontWeight: 600 },
      }}
    />
  </ListItem>
);