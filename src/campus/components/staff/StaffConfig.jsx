import {
  Avatar, Box, Stack, Typography, Chip,
  IconButton, Tooltip, TableRow, TableCell, Checkbox,
} from '@mui/material';
import {
  PersonAdd, People, AdminPanelSettings,
  Edit, Visibility, Restore, Badge as BadgeIcon,
  ManageAccounts,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

// ─── KPI Metrics ──────────────────────────────────────────────────────────────

export const getKPIMetrics = (kpis, theme) => [
  {
    label:    'Total Staff',
    value:    kpis?.staff?.total ?? 0,
    icon:     <People sx={{ fontSize: 28 }} />,
    color:    theme.palette.primary.main,
    subtitle: 'All members',
  },
  {
    label:    'Active',
    value:    kpis?.staff?.active ?? 0,
    icon:     <PersonAdd sx={{ fontSize: 28 }} />,
    color:    theme.palette.success.main,
    subtitle: 'Currently active',
  },
  {
    label:    'With Role',
    value:    kpis?.staff?.withRole ?? 0,
    icon:     <AdminPanelSettings sx={{ fontSize: 28 }} />,
    color:    theme.palette.info.main,
    subtitle: 'Role assigned',
  },
  {
    label:    'Without Role',
    value:    kpis?.staff?.withoutRole ?? 0,
    icon:     <ManageAccounts sx={{ fontSize: 28 }} />,
    color:    theme.palette.warning.main,
    subtitle: 'No role yet',
  },
];

// ─── Table Columns ────────────────────────────────────────────────────────────

export const tableColumns = [
  { key: 'staff',   label: 'Staff Member' },
  { key: 'role',    label: 'Sub-Role'     },
  { key: 'contact', label: 'Contact'      },
  { key: 'status',  label: 'Status'       },
  { key: 'actions', label: 'Actions', align: 'right' },
];

// ─── Filter Configuration ─────────────────────────────────────────────────────

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

// ─── Table Row Renderer ───────────────────────────────────────────────────────

const STATUS_COLOR = {
  active:    'success',
  inactive:  'warning',
  suspended: 'error',
  archived:  'default',
};

export const renderTableRow = (staff, helpers) => {
  const { selected, onSelect, onView, onEdit, onArchive, onRestore, theme } = helpers;

  const imgUrl = staff.profileImage
    ? staff.profileImage.startsWith('http')
      ? staff.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${staff.profileImage.replace(/^\//, '')}`
    : null;

  const isArchived = staff.status === 'archived';

  return (
    <TableRow key={staff._id} hover selected={selected}>
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelect} />
      </TableCell>

      {/* Name + email */}
      <TableCell>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={imgUrl} sx={{ width: 38, height: 38, border: `2px solid ${theme.palette.primary.light}` }}>
            {staff.firstName?.[0]}{staff.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {staff.firstName} {staff.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">{staff.email}</Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* Sub-role */}
      <TableCell>
        {staff.subRole
          ? (
            <Chip
              icon={<BadgeIcon />}
              label={staff.subRole.name ?? staff.subRole}
              size="small"
              color="primary"
              variant="outlined"
            />
          )
          : <Typography variant="caption" color="text.disabled">No role</Typography>
        }
      </TableCell>

      {/* Contact */}
      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {staff.phone || staff.username || '—'}
        </Typography>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Chip
          label={staff.status}
          size="small"
          color={STATUS_COLOR[staff.status] ?? 'default'}
          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
        />
      </TableCell>

      {/* Actions */}
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
          {isArchived
            ? (
              <Tooltip title="Restore">
                <IconButton size="small" color="success" onClick={onRestore}><Restore fontSize="small" /></IconButton>
              </Tooltip>
            )
            : (
              <Tooltip title="Archive">
                <IconButton size="small" color="error" onClick={onArchive}>
                  <ManageAccounts fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          }
        </Stack>
      </TableCell>
    </TableRow>
  );
};

// ─── Main Config Object ───────────────────────────────────────────────────────

export const staffConfig = {
  entityName:       'Staff',
  entityNamePlural: 'Staff Members',
  apiEndpoint:      'staff',

  addButtonText:     'Add Staff Member',
  addButtonIcon:     <PersonAdd />,
  searchPlaceholder: 'Search by name, email, username…',

  getKPIMetrics,
  tableColumns,
  getFilterConfig,
  renderTableRow,

  bulkActions: ['sendEmail', 'archive', 'export'],

  relatedDataEndpoints: {},
};

export default staffConfig;
