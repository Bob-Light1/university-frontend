import {
  Avatar, Box, Stack, Typography, Chip,
  IconButton, Tooltip, TableRow, TableCell, Checkbox,
} from '@mui/material';
import {
  PersonAdd, People, Group, Edit, Visibility, Restore,
  ManageAccounts,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

// ─── KPI Metrics ──────────────────────────────────────────────────────────────

export const getKPIMetrics = (kpis, theme) => [
  {
    label:    'Total Mentors',
    value:    kpis?.mentors?.total ?? 0,
    icon:     <People sx={{ fontSize: 28 }} />,
    color:    theme.palette.primary.main,
    subtitle: 'All mentors',
  },
  {
    label:    'Active',
    value:    kpis?.mentors?.active ?? 0,
    icon:     <PersonAdd sx={{ fontSize: 28 }} />,
    color:    theme.palette.success.main,
    subtitle: 'Currently active',
  },
  {
    label:    'Students Assigned',
    value:    kpis?.mentors?.studentsAssigned ?? 0,
    icon:     <Group sx={{ fontSize: 28 }} />,
    color:    theme.palette.info.main,
    subtitle: 'Total assignments',
  },
];

// ─── Table Columns ────────────────────────────────────────────────────────────

export const tableColumns = [
  { key: 'mentor',         label: 'Mentor'         },
  { key: 'specialization', label: 'Specialization' },
  { key: 'assignments',    label: 'Students'       },
  { key: 'status',         label: 'Status'         },
  { key: 'actions',        label: 'Actions', align: 'right' },
];

// ─── Filter Config ────────────────────────────────────────────────────────────

export const getFilterConfig = () => [
  {
    key:     'status',
    label:   'Status',
    type:    'select',
    options: [
      { value: '',           label: 'All Statuses' },
      { value: 'active',     label: 'Active'       },
      { value: 'inactive',   label: 'Inactive'     },
      { value: 'suspended',  label: 'Suspended'    },
      { value: 'archived',   label: 'Archived'     },
    ],
  },
];

// ─── Table Row ────────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  active:    'success',
  inactive:  'warning',
  suspended: 'error',
  archived:  'default',
};

export const renderTableRow = (mentor, helpers) => {
  const { selected, onSelect, onView, onEdit, onArchive, onRestore, theme } = helpers;

  const imgUrl = mentor.profileImage
    ? mentor.profileImage.startsWith('http')
      ? mentor.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${mentor.profileImage.replace(/^\//, '')}`
    : null;

  const isArchived = mentor.status === 'archived';

  return (
    <TableRow key={mentor._id} hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelect} />
      </TableCell>

      <TableCell>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={imgUrl} sx={{ width: 38, height: 38, border: `2px solid ${theme.palette.primary.light}` }}>
            {mentor.firstName?.[0]}{mentor.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {mentor.firstName} {mentor.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">{mentor.email}</Typography>
          </Box>
        </Stack>
      </TableCell>

      <TableCell>
        <Typography variant="body2" color="text.secondary">
          {mentor.specialization || '—'}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={`${mentor.students?.length ?? 0} students`}
          size="small"
          variant="outlined"
          icon={<Group sx={{ fontSize: 14 }} />}
        />
      </TableCell>

      <TableCell>
        <Chip
          label={mentor.status}
          size="small"
          color={STATUS_COLOR[mentor.status] ?? 'default'}
          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
        />
      </TableCell>

      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="View">
            <IconButton size="small" onClick={onView}><Visibility fontSize="small" /></IconButton>
          </Tooltip>
          {!isArchived && (
            <Tooltip title="Edit">
              <IconButton size="small" color="info" onClick={onEdit}><Edit fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {isArchived ? (
            <Tooltip title="Restore">
              <IconButton size="small" color="success" onClick={onRestore}><Restore fontSize="small" /></IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Archive">
              <IconButton size="small" color="error" onClick={onArchive}><ManageAccounts fontSize="small" /></IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ─── Main Config Object ───────────────────────────────────────────────────────

export const mentorConfig = {
  entityName:       'Mentor',
  entityNamePlural: 'Mentors',
  apiEndpoint:      'mentors',

  addButtonText:     'Add Mentor',
  addButtonIcon:     <PersonAdd />,
  searchPlaceholder: 'Search by name, email, username…',

  getKPIMetrics,
  tableColumns,
  getFilterConfig,
  renderTableRow,

  bulkActions: ['sendEmail', 'archive', 'export'],

  relatedDataEndpoints: {},
};

export default mentorConfig;
