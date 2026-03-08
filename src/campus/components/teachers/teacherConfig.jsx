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
  TrendingUp,
  Schedule,
  Edit,
  Delete,
  Visibility,
  Phone,
  Badge as BadgeIcon,
  ManageAccounts,
  Class as ClassIcon,
} from '@mui/icons-material';
import { IMAGE_BASE_URL } from '../../../config/env';

// ─── KPI Metrics ──────────────────────────────────────────────────────────────

export const getKPIMetrics = (kpis, theme) => [
  {
    label:    'Total Teachers',
    value:    kpis?.teachers?.total || 0,
    icon:     <People sx={{ fontSize: 28 }} />,
    color:    theme.palette.primary.main,
    trend:    3.5,
    subtitle: 'Active staff',
  },
  {
    label:    'New Hires',
    value:    kpis?.teachers?.newThisMonth || 0,
    icon:     <PersonAdd sx={{ fontSize: 28 }} />,
    color:    theme.palette.success.main,
    trend:    8.2,
    subtitle: 'This month',
  },
  {
    label:        'Teaching Hours',
    value:        kpis?.teachers?.totalHours || 0,
    icon:         <Schedule sx={{ fontSize: 28 }} />,
    color:        theme.palette.info.main,
    subtitle:     'Weekly total',
    progress:     kpis?.hoursUtilization || 0,
    progressLabel: 'Utilization',
  },
  {
    label:    'Performance',
    value:    `${(kpis?.avgPerformance || 0).toFixed(1)}%`,
    icon:     <TrendingUp sx={{ fontSize: 28 }} />,
    color:    theme.palette.success.main,
    trend:    4.1,
    subtitle: 'Average rating',
  },
];

// ─── Table Columns ────────────────────────────────────────────────────────────

export const tableColumns = [
  { key: 'teacher',    label: 'Teacher'    },
  { key: 'matricule',  label: 'Matricule'  },
  { key: 'department', label: 'Department' },
  { key: 'subjects',   label: 'Subjects'   },
  { key: 'classes',    label: 'Classes'    },
  { key: 'contact',    label: 'Contact'    },
  { key: 'status',     label: 'Status'     },
  { key: 'actions',    label: 'Actions', align: 'right' },
];

// ─── Filter Configuration ─────────────────────────────────────────────────────

export const getFilterConfig = (relatedData = {}) => {
  const departments = relatedData.departments || [];
  const subjects    = relatedData.subjects    || [];

  return [
    {
      key:     'department',
      label:   'Department',
      type:    'select',
      options: [
        { value: '', label: 'All Departments' },
        ...departments.map((d) => ({ value: d._id, label: d.name })),
      ],
    },
    {
      key:     'subject',
      label:   'Subject',
      type:    'select',
      options: [
        { value: '', label: 'All Subjects' },
        ...subjects.map((s) => ({ value: s._id, label: s.subject_name || s.name })),
      ],
    },
    {
      key:     'status',
      label:   'Status',
      type:    'select',
      options: [
        { value: '',          label: 'All Statuses' },
        { value: 'active',    label: 'Active'       },
        { value: 'on_leave',  label: 'On Leave'     },
        { value: 'suspended', label: 'Suspended'    },
        { value: 'archived',  label: 'Archived'     },
      ],
    },
    {
      key:     'qualification',
      label:   'Qualification',
      type:    'select',
      options: [
        { value: '',         label: 'All Qualifications' },
        { value: 'bachelor', label: "Bachelor's"         },
        { value: 'master',   label: "Master's"           },
        { value: 'phd',      label: 'PhD'                },
      ],
    },
  ];
};

// ─── Table Row Renderer ───────────────────────────────────────────────────────

export const renderTableRow = (teacher, helpers) => {
  const { selected, onSelect, onView, onEdit, onArchive, theme, isMobile } = helpers;

  const profileImageUrl = teacher.profileImage
    ? teacher.profileImage.startsWith('http')
      ? teacher.profileImage
      : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${teacher.profileImage.replace(/^\//, '')}`
    : null;

  // Detect if this teacher is a classManager of any class.
  // The populated class object carries classManager as an object or ObjectId.
  const teacherId = teacher._id?.toString();
  const isClassManager = (teacher.classes || []).some((cls) => {
    const mgr = cls.classManager;
    if (!mgr) return false;
    return (mgr._id?.toString() ?? mgr.toString()) === teacherId;
  });

  return (
    <TableRow key={teacher._id} hover selected={selected}>

      {/* Checkbox */}
      <TableCell padding="checkbox">
        <Checkbox checked={selected} onChange={onSelect} />
      </TableCell>

      {/* Teacher Info */}
      <TableCell>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={profileImageUrl}
            sx={{
              width: 40, height: 40,
              border: `2px solid ${theme.palette.primary.light}`,
            }}
          >
            {teacher.firstName?.[0]}
            {teacher.lastName?.[0]}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="subtitle2" fontWeight={600}>
                {teacher.firstName} {teacher.lastName}
              </Typography>
              {/* Class Manager badge in teacher name cell */}
              {isClassManager && (
                <Tooltip title="Class Manager">
                  <ManageAccounts sx={{ fontSize: 16, color: 'primary.main' }} />
                </Tooltip>
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {teacher.email}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* Matricule */}
      <TableCell>
        <Chip
          icon={<BadgeIcon />}
          label={teacher.matricule || 'N/A'}
          size="small"
          variant="outlined"
        />
      </TableCell>

      {/* Department */}
      <TableCell>
        <Typography variant="body2" fontWeight={500}>
          {teacher.department?.name || '—'}
        </Typography>
      </TableCell>

      {/* Subjects */}
      <TableCell>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {(teacher.subjects || []).slice(0, 2).map((subject) => (
            <Chip
              key={subject._id}
              label={subject.subject_name}
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
          {teacher.subjects?.length > 2 && (
            <Chip
              label={`+${teacher.subjects.length - 2}`}
              size="small"
              sx={{ fontSize: '0.7rem' }}
            />
          )}
        </Stack>
      </TableCell>

      {/* Classes — show first 2, overflow count, manager star */}
      {!isMobile && (
        <TableCell>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {(teacher.classes || []).slice(0, 2).map((cls) => {
              const isMgr = cls.classManager &&
                (cls.classManager._id?.toString() ?? cls.classManager.toString()) === teacherId;
              return (
                <Tooltip
                  key={cls._id}
                  title={isMgr ? 'Class Manager' : ''}
                  disableHoverListener={!isMgr}
                >
                  <Chip
                    label={cls.className}
                    size="small"
                    color={isMgr ? 'primary' : 'default'}
                    variant={isMgr ? 'filled' : 'outlined'}
                    icon={isMgr
                      ? <ManageAccounts sx={{ fontSize: 12 }} />
                      : <ClassIcon sx={{ fontSize: 12 }} />
                    }
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Tooltip>
              );
            })}
            {teacher.classes?.length > 2 && (
              <Chip
                label={`+${teacher.classes.length - 2}`}
                size="small"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {(!teacher.classes || teacher.classes.length === 0) && (
              <Typography variant="caption" color="text.secondary">—</Typography>
            )}
          </Stack>
        </TableCell>
      )}

      {/* Contact */}
      <TableCell>
        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Phone sx={{ fontSize: 14 }} />
          {teacher.phone}
        </Typography>
      </TableCell>

      {/* Status */}
      {!isMobile && (
        <TableCell>
          <Chip
            label={teacher.status || 'active'}
            size="small"
            color={teacher.status === 'active' ? 'success' : 'warning'}
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

// ─── Main Configuration Object ────────────────────────────────────────────────

export const teacherConfig = {
  entityName:       'Teacher',
  entityNamePlural: 'Teachers',
  apiEndpoint:      'teachers',

  addButtonText:       'Add New Teacher',
  addButtonIcon:       <PersonAdd />,
  searchPlaceholder:   'Search by name, email, staff ID…',

  getKPIMetrics,
  tableColumns,
  getFilterConfig,
  renderTableRow,

  bulkActions: ['changeDepartment', 'sendEmail', 'archive', 'export'],

  relatedDataEndpoints: {
    // Campus-scoped routes (format B)
    departments: (campusId) => `/campus/${campusId}/departments`,
    classes:     (campusId) => `/campus/${campusId}/classes`,
    // Generic route with campusId query param (format A)
    subjects:    (campusId) => `/subject?campusId=${campusId}`,
  },
};

export default teacherConfig;