import React from 'react';
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
  School,
  Domain,
  Badge,
  Cake,
  Person,
  Male,
  Female,
  Archive,
  ContactEmergency,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  });
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today     = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// ─── Sub-component: info list item ───────────────────────────────────────────

const InfoItem = ({ icon: Icon, label, secondary, onClick }) => (
  <ListItem disablePadding sx={{ py: 1 }} onClick={onClick}>
    <ListItemIcon sx={{ minWidth: 40 }}>
      <Icon color="action" />
    </ListItemIcon>
    <ListItemText
      primary={label}
      secondary={secondary || 'N/A'}
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

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * StudentDetailDrawer
 *
 * Displays full student information in the side-drawer opened by GenericEntityPage.
 * The Drawer wrapper itself is provided by GenericEntityPage — this component
 * only renders the inner content.
 *
 * Props injected by GenericEntityPage:
 *  entity    {Object}   - The student document
 *  open      {boolean}  - Drawer open state (used by parent wrapper)
 *  onClose   {Function} - Close the drawer
 *  onEdit    {Function} - Open the edit form for this student
 *  onArchive {Function} - Archive this student
 */
const StudentDetailDrawer = ({ entity: student, onClose, onEdit, onArchive }) => {
  if (!student) return null;

  const age = calculateAge(student.dateOfBirth);

  const profileImageUrl = student.profileImage
    ? (student.profileImage.startsWith('http')
        ? student.profileImage
        : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${student.profileImage.replace(/^\//, '')}`)
    : null;

  // Emergency contact — may be absent on older records
  const ec = student.emergencyContact;
  const hasEmergencyContact = ec && (ec.name || ec.phone || ec.relationship);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'white', position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          aria-label="Close drawer"
        >
          <Close />
        </IconButton>

        <Stack alignItems="center" spacing={2} sx={{ mt: 6 }}>
          <Avatar
            src={profileImageUrl}
            sx={{ width: 100, height: 100, border: '4px solid white', boxShadow: 3 }}
          >
            <Person sx={{ fontSize: 50 }} />
          </Avatar>
          <Box textAlign="center">
            <Typography variant="h5" fontWeight={700}>
              {student.firstName} {student.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {student.email}
            </Typography>
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
                label={student.status || 'active'}
                color={student.status === 'active' ? 'success' : 'warning'}
                sx={{ fontWeight: 600, textTransform: 'capitalize' }}
              />
              <Stack direction="row" spacing={1}>
                <Tooltip title="Edit Student">
                  <IconButton size="small" color="primary" onClick={onEdit}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
                {onArchive && (
                  <Tooltip title="Archive Student">
                    <IconButton size="small" color="error" onClick={onArchive}>
                      <Archive fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Stack>
          </Paper>

          {/* ── Personal Information ─────────────────────────────────────────── */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Personal Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <InfoItem icon={Badge}  label="Matricule" secondary={student.matricule} />
              <InfoItem icon={Person} label="Username"  secondary={student.username}  />
              <InfoItem
                icon={student.gender === 'male' ? Male : student.gender === 'female' ? Female : Person}
                label="Gender"
                secondary={
                  student.gender
                    ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1)
                    : undefined
                }
              />
              <InfoItem
                icon={Cake}
                label="Date of Birth"
                secondary={
                  student.dateOfBirth
                    ? `${formatDate(student.dateOfBirth)}${age ? ` (${age} years old)` : ''}`
                    : undefined
                }
              />
            </List>
          </Box>

          {/* ── Contact Information ──────────────────────────────────────────── */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Contact Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <InfoItem
                icon={Email}
                label="Email"
                secondary={student.email}
                onClick={student.email ? () => window.location.href = `mailto:${student.email}` : undefined}
              />
              <InfoItem icon={Phone} label="Phone" secondary={student.phone} />
            </List>
          </Box>

          {/* ── Academic Information ─────────────────────────────────────────── */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
              Academic Information
            </Typography>
            <Divider sx={{ mb: 2, mt: 0.5 }} />
            <List disablePadding>
              <InfoItem
                icon={School}
                label="Class"
                secondary={student.studentClass?.className}
              />
              <InfoItem
                icon={Domain}
                label="Campus"
                secondary={student.schoolCampus?.campus_name}
              />
            </List>
          </Box>

          {/* ── Emergency Contact (shown only when data is present) ──────────── */}
          {hasEmergencyContact && (
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} fontSize="0.875rem">
                Emergency Contact
              </Typography>
              <Divider sx={{ mb: 2, mt: 0.5 }} />
              <List disablePadding>
                {ec.name && (
                  <InfoItem icon={ContactEmergency} label="Name"         secondary={ec.name}         />
                )}
                {ec.phone && (
                  <InfoItem icon={Phone}            label="Phone"        secondary={ec.phone}        />
                )}
                {ec.relationship && (
                  <InfoItem icon={Person}           label="Relationship" secondary={ec.relationship} />
                )}
              </List>
            </Box>
          )}

          {/* ── Account timestamps ───────────────────────────────────────────── */}
          <Box>
            <Typography variant="overline" color="text.secondary" fontSize="0.75rem">
              Account Information
            </Typography>
            <Divider sx={{ mb: 1, mt: 0.5 }} />
            <Grid container spacing={1}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Created</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(student.createdAt)}</Typography>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                <Typography variant="body2" fontWeight={500}>{formatDate(student.updatedAt)}</Typography>
              </Grid>
            </Grid>
          </Box>

        </Stack>
      </Box>

      {/* ── Footer Actions ───────────────────────────────────────────────────── */}
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
            Edit Student
          </Button>
        </Stack>
      </Box>

    </Box>
  );
};

export default StudentDetailDrawer;