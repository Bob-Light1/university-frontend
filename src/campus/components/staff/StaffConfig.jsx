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

export const getKPIMetrics = (kpis, theme, t) => [
  {
    label:    t('staff:kpi.totalStaff'),
    value:    kpis?.staff?.total ?? 0,
    icon:     <People sx={{ fontSize: 28 }} />,
    color:    theme.palette.primary.main,
    subtitle: t('staff:kpi.allMembers'),
  },
  {
    label:    t('staff:kpi.active'),
    value:    kpis?.staff?.active ?? 0,
    icon:     <PersonAdd sx={{ fontSize: 28 }} />,
    color:    theme.palette.success.main,
    subtitle: t('staff:kpi.currentlyActive'),
  },
  {
    label:    t('staff:kpi.withRole'),
    value:    kpis?.staff?.withRole ?? 0,
    icon:     <AdminPanelSettings sx={{ fontSize: 28 }} />,
    color:    theme.palette.info.main,
    subtitle: t('staff:kpi.roleAssigned'),
  },
  {
    label:    t('staff:kpi.withoutRole'),
    value:    kpis?.staff?.withoutRole ?? 0,
    icon:     <ManageAccounts sx={{ fontSize: 28 }} />,
    color:    theme.palette.warning.main,
    subtitle: t('staff:kpi.noRoleYet'),
  },
];

// ─── Table Columns ────────────────────────────────────────────────────────────

export const getTableColumns = (t) => [
  { key: 'staff',   label: t('staff:list.colMember') },
  { key: 'role',    label: t('staff:list.colRole')   },
  { key: 'contact', label: t('staff:list.colContact') },
  { key: 'status',  label: t('staff:list.colStatus') },
  { key: 'actions', label: t('staff:list.colActions'), align: 'right' },
];

// ─── Filter Configuration ─────────────────────────────────────────────────────

export const getFilterConfig = (t) => [
  {
    key:     'status',
    label:   t('staff:list.filterStatus'),
    type:    'select',
    options: [
      { value: '',           label: t('staff:list.filterAllStatuses') },
      { value: 'active',     label: t('common:status.active')         },
      { value: 'inactive',   label: t('common:status.inactive')       },
      { value: 'suspended',  label: t('common:status.suspended')      },
      { value: 'archived',   label: t('common:status.archived')       },
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

export const renderTableRow = (staff, helpers, t) => {
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
          : <Typography variant="caption" color="text.disabled">{t('staff:list.noRole')}</Typography>
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
          <Tooltip title={t('staff:list.tooltipView')}>
            <IconButton size="small" onClick={onView}><Visibility fontSize="small" /></IconButton>
          </Tooltip>
          {!isArchived && (
            <Tooltip title={t('staff:list.tooltipEdit')}>
              <IconButton size="small" color="info" onClick={onEdit}><Edit fontSize="small" /></IconButton>
            </Tooltip>
          )}
          {isArchived
            ? (
              <Tooltip title={t('staff:list.tooltipRestore')}>
                <IconButton size="small" color="success" onClick={onRestore}><Restore fontSize="small" /></IconButton>
              </Tooltip>
            )
            : (
              <Tooltip title={t('staff:list.tooltipArchive')}>
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

// ─── Static config (translation-independent) ─────────────────────────────────

export const staffConfig = {
  entityName:       'Staff',
  entityNamePlural: 'Staff Members',
  apiEndpoint:      'staff',
  bulkActions:      ['sendEmail', 'archive', 'export'],
  relatedDataEndpoints: {},
};

export default staffConfig;
