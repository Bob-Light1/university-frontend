import {
  Avatar,
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  TableRow,
  TableCell,
  Checkbox,
} from '@mui/material';
import {
  PersonAdd,
  Groups,
  TrendingUp,
  Warning,
  Edit,
  Delete,
  Visibility,
  Phone,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

/**
 * STUDENT ENTITY CONFIGURATION
 * All student-specific settings in one place
 */

// ========================================
// KPI METRICS
// ========================================
export const getKPIMetrics = (kpis, theme) => [
  {
    label: 'Total Students',
    value: kpis?.students?.total || 0,
    icon: <Groups sx={{ fontSize: 28 }} />,
    color: theme.palette.primary.main,
    trend: 5.2,
    subtitle: 'Active enrollments',
  },
  {
    label: 'New Enrollments',
    value: kpis?.students?.newThisMonth || 0,
    icon: <PersonAdd sx={{ fontSize: 28 }} />,
    color: theme.palette.success.main,
    trend: 12.5,
    subtitle: 'This month',
  },
  {
    label: 'Absence Rate',
    value: `${(kpis?.avgAbsenceRate || 0).toFixed(1)}%`,
    icon: <Warning sx={{ fontSize: 28 }} />,
    color: (kpis?.avgAbsenceRate || 0) > 10 
      ? theme.palette.error.main 
      : theme.palette.warning.main,
    trend: -2.1,
    subtitle: 'Average campus rate',
    progress: kpis?.avgAbsenceRate || 0,
    progressLabel: 'Attendance',
  },
  {
    label: 'Payment Alerts',
    value: kpis?.paymentAlerts || 0,
    icon: <TrendingUp sx={{ fontSize: 28 }} />,
    color: theme.palette.error.main,
    alert: (kpis?.paymentAlerts || 0) > 0 ? kpis.paymentAlerts : null,
    subtitle: 'Pending payments',
  },
];

// ========================================
// TABLE COLUMNS
// ========================================
export const tableColumns = [
  { key: 'student', label: 'Student' },
  { key: 'matricule', label: 'Matricule' },
  { key: 'class', label: 'Class' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions', align: 'right' },
];

// ========================================
// FILTERS CONFIGURATION
// ========================================
export const getFilterConfig = (relatedData = {}) => {
  const classes = relatedData.classes || [];

  return [
    {
      key: 'studentClass',
      label: 'Class',
      type: 'select',
      options: [
        { value: '', label: 'All Classes' },
        ...classes.map((c) => ({ value: c._id, label: c.className })),
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: '', label: 'All Statuses' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'suspended', label: 'Suspended' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: [
        { value: '', label: 'All Genders' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ],
    },
  ];
};

// ========================================
// TABLE ROW RENDERER
// ========================================
export const renderTableRow = (student, helpers) => {
  const { selected, onSelect, onView, onEdit, onArchive, theme, isMobile } = helpers;

  const profileImageUrl = student.profileImage 
    ? (student.profileImage.startsWith('http') 
        ? student.profileImage 
        : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${student.profileImage.replace(/^\//, '')}`)
    : null;

  
  return (
    <TableRow key={student._id} hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelect} />
      </TableCell>

      {/* Student Info */}
      <TableCell>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={profileImageUrl}
            sx={{
              width: 40,
              height: 40,
              border: `2px solid ${theme.palette.primary.light}`,
            }}
          >
            {student.firstName?.[0]}
            {student.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {student.firstName} {student.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {student.email}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* Matricule */}
      <TableCell>
        <Chip
          icon={<BadgeIcon />}
          label={student.matricule || 'STD'}
          size="small"
          variant="outlined"
        />
      </TableCell>

      {/* Class */}
      <TableCell>
        <Typography variant="body2" fontWeight={500}>
          {student.studentClass?.className || 'N/A'}
        </Typography>
      </TableCell>

      {/* Contact */}
      <TableCell>
        <Typography variant="caption" sx={{ display: 'flex', gap: 0.5 }}>
          <Phone sx={{ fontSize: 14 }} />
          {student.phone}
        </Typography>
      </TableCell>

      {/* Status */}
      {!isMobile && (
        <TableCell>
          <Chip
            label={student.status || 'active'}
            size="small"
            color={student.status === 'active' ? 'success' : 'warning'}
            sx={{ fontWeight: 600 }}
          />
        </TableCell>
      )}

      {/* Actions */}
      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="View Details">
            <IconButton size="small" onClick={onView}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" color="info" onClick={onEdit}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Archive">
            <IconButton size="small" color="error" onClick={onArchive}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ========================================
// MAIN CONFIGURATION OBJECT
// ========================================
export const studentConfig = {
  // Entity identification
  entityName: 'Student',
  entityNamePlural: 'Students',
  apiEndpoint: 'students',
  
  // UI Customization
  addButtonText: 'Enroll New Student',
  addButtonIcon: <PersonAdd />,
  searchPlaceholder: 'Search by name, email, matricule, phone...',
  
  // Features
  getKPIMetrics,
  tableColumns,
  getFilterConfig,
  renderTableRow,
  
  // Available bulk actions
  bulkActions: ['changeClass', 'sendEmail', 'archive', 'export'],
  
  // Related data to fetch
  relatedDataEndpoints: {
    classes: '/class',
  },
};

export default studentConfig;