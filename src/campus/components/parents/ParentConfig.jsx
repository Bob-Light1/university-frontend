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
  People,
  FamilyRestroom,
  TrendingUp,
  Edit,
  Delete,
  Restore,
  Visibility,
  Phone,
  Badge as BadgeIcon,
  ChildCare,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

// ─── KPI Metrics ──────────────────────────────────────────────────────────────

export const getKPIMetrics = (kpis, theme) => [
  {
    label:    'Total Parents',
    value:    kpis?.total || 0,
    icon:     <People sx={{ fontSize: 28 }} />,
    color:    theme.palette.primary.main,
    trend:    2.1,
    subtitle: 'Active accounts',
  },
  {
    label:    'New (30 days)',
    value:    kpis?.recentLast30d || 0,
    icon:     <PersonAdd sx={{ fontSize: 28 }} />,
    color:    theme.palette.success.main,
    trend:    5.4,
    subtitle: 'Registered recently',
  },
  {
    label:    'Families',
    value:    kpis?.byRelationship?.father || 0,
    icon:     <FamilyRestroom sx={{ fontSize: 28 }} />,
    color:    theme.palette.info.main,
    subtitle: 'Fathers on record',
  },
  {
    label:    'Active Rate',
    value:    kpis?.total
      ? `${Math.round(((kpis?.byStatus?.active || 0) / kpis.total) * 100)}%`
      : '0%',
    icon:     <TrendingUp sx={{ fontSize: 28 }} />,
    color:    theme.palette.success.main,
    trend:    1.2,
    subtitle: 'Accounts active',
  },
];

// ─── Table Columns ────────────────────────────────────────────────────────────

export const tableColumns = [
  { key: 'parent',       label: 'Parent'       },
  { key: 'ref',          label: 'Reference'    },
  { key: 'relationship', label: 'Relationship' },
  { key: 'children',     label: 'Children'     },
  { key: 'contact',      label: 'Contact'      },
  { key: 'status',       label: 'Status'       },
  { key: 'actions',      label: 'Actions', align: 'right' },
];

// ─── Filter Configuration ─────────────────────────────────────────────────────

export const getFilterConfig = () => [
  {
    key:     'status',
    label:   'Status',
    type:    'select',
    options: [
      { value: '',          label: 'All Statuses' },
      { value: 'active',    label: 'Active'       },
      { value: 'inactive',  label: 'Inactive'     },
      { value: 'suspended', label: 'Suspended'    },
      { value: 'archived',  label: 'Archived'     },
    ],
  },
  {
    key:     'relationship',
    label:   'Relationship',
    type:    'select',
    options: [
      { value: '',         label: 'All'      },
      { value: 'father',   label: 'Father'   },
      { value: 'mother',   label: 'Mother'   },
      { value: 'guardian', label: 'Guardian' },
      { value: 'other',    label: 'Other'    },
    ],
  },
];

// ─── Table Row Renderer ───────────────────────────────────────────────────────

export const renderTableRow = (parent, helpers) => {
  const { selected, onSelect, onView, onEdit, onArchive, onRestore, theme, isMobile } = helpers;

  const profileImageUrl = parent.profileImage
    ? parent.profileImage.startsWith('http')
      ? parent.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${parent.profileImage.replace(/^\//, '')}`
    : null;

  const isArchived = parent.status === 'archived';

  const statusColor =
    isArchived                    ? 'default' :
    parent.status === 'active'    ? 'success' :
    parent.status === 'suspended' ? 'error'   : 'warning';

  const statusLabel = isArchived ? 'Archived' : (parent.status || 'active');

  const relationshipLabel = {
    father:   'Father',
    mother:   'Mother',
    guardian: 'Guardian',
    other:    'Other',
  }[parent.relationship] ?? parent.relationship;

  return (
    <TableRow key={parent._id} hover selected={selected}>

      {/* Checkbox */}
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelect} />
      </TableCell>

      {/* Parent Info */}
      <TableCell>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={profileImageUrl}
            sx={{
              width: 40, height: 40,
              border: `2px solid ${theme.palette.primary.light}`,
            }}
          >
            {parent.firstName?.[0]}
            {parent.lastName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {parent.firstName} {parent.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {parent.email}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* Reference */}
      <TableCell>
        <Chip
          icon={<BadgeIcon />}
          label={parent.parentRef || 'N/A'}
          size="small"
          variant="outlined"
        />
      </TableCell>

      {/* Relationship */}
      <TableCell>
        <Typography variant="body2" fontWeight={500}>
          {relationshipLabel}
        </Typography>
      </TableCell>

      {/* Children count */}
      {!isMobile && (
        <TableCell>
          <Chip
            icon={<ChildCare sx={{ fontSize: 14 }} />}
            label={`${parent.children?.length ?? 0} child${parent.children?.length !== 1 ? 'ren' : ''}`}
            size="small"
            color={parent.children?.length > 0 ? 'primary' : 'default'}
            variant="outlined"
          />
        </TableCell>
      )}

      {/* Contact */}
      <TableCell>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Phone sx={{ fontSize: 14 }} />
          {parent.phone}
        </Typography>
      </TableCell>

      {/* Status */}
      {!isMobile && (
        <TableCell>
          <Chip
            label={statusLabel}
            size="small"
            color={statusColor}
            sx={{ fontWeight: 600, textTransform: 'capitalize' }}
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
          {!isArchived && (
            <Tooltip title="Edit">
              <IconButton size="small" color="info" onClick={onEdit}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isArchived ? (
            <Tooltip title="Restore">
              <IconButton size="small" color="success" onClick={onRestore}>
                <Restore fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Archive">
              <IconButton size="small" color="error" onClick={onArchive}>
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>

    </TableRow>
  );
};

// ─── Main Configuration Object ────────────────────────────────────────────────

export const parentConfig = {
  entityName:       'Parent',
  entityNamePlural: 'Parents',
  apiEndpoint:      'parents',

  addButtonText:     'Add New Parent',
  addButtonIcon:     <PersonAdd />,
  searchPlaceholder: 'Search by name, email, reference…',

  getKPIMetrics,
  tableColumns,
  getFilterConfig,
  renderTableRow,

  bulkActions: ['sendEmail', 'archive', 'export'],

  relatedDataEndpoints: {},
};

export default parentConfig;
