import {
  Box, Typography, Paper, Stack, Grid, Button, Divider, Alert,
} from '@mui/material';
import {
  Print, Assessment, Group, ChecklistRtl,
  LibraryBooks, FolderOpen, OpenInNew,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useStaffPermission } from '../../hooks/useStaffPermission';
import PermissionGate          from '../shared/PermissionGate';

const STAFF_PRIMARY = '#00695C';

const PrintCard = ({ icon, title, description, to, disabled }) => {
  const navigate = useNavigate();
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5, borderRadius: 3,
        opacity: disabled ? 0.45 : 1,
        transition: 'box-shadow 0.15s',
        '&:hover': disabled ? {} : { boxShadow: 3, cursor: 'pointer' },
      }}
      onClick={() => !disabled && navigate(to)}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ color: STAFF_PRIMARY }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          {!disabled && <OpenInNew sx={{ fontSize: 14, color: 'text.secondary', ml: 'auto' }} />}
        </Stack>
        <Typography variant="body2" color="text.secondary">{description}</Typography>
        <Button
          size="small"
          variant={disabled ? 'outlined' : 'contained'}
          startIcon={<Print />}
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); if (!disabled) window.print(); }}
          sx={{
            alignSelf: 'flex-start',
            textTransform: 'none',
            borderRadius: 2,
            bgcolor: disabled ? undefined : STAFF_PRIMARY,
            '&:hover': { bgcolor: disabled ? undefined : '#004d40' },
          }}
        >
          {disabled ? 'No access' : 'Go to module'}
        </Button>
      </Stack>
    </Paper>
  );
};

function PrintHub() {
  const { has } = useStaffPermission();
  const navigate = useNavigate();

  const modules = [
    {
      icon:        <Assessment sx={{ fontSize: 28 }} />,
      title:       'Results',
      description: 'Print published academic results for your campus students.',
      to:          '/staff/results',
      perm:        'results.read',
    },
    {
      icon:        <Group sx={{ fontSize: 28 }} />,
      title:       'Students',
      description: 'Print the campus student list with matricule and class information.',
      to:          '/staff/students',
      perm:        'students.read',
    },
    {
      icon:        <ChecklistRtl sx={{ fontSize: 28 }} />,
      title:       'Attendance',
      description: 'Print attendance records filtered by date range or class.',
      to:          '/staff/attendance',
      perm:        'attendance.read',
    },
    {
      icon:        <LibraryBooks sx={{ fontSize: 28 }} />,
      title:       'Examinations',
      description: 'Print examination session timetables and rosters.',
      to:          '/staff/exams',
      perm:        'examinations.read',
    },
    {
      icon:        <FolderOpen sx={{ fontSize: 28 }} />,
      title:       'Documents',
      description: 'Print institutional documents published on your campus.',
      to:          '/staff/documents',
      perm:        'documents.read',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 960, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Print sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>Print Center</Typography>
          <Typography variant="body2" color="text.secondary">
            Navigate to a module and use your browser's print function (Ctrl+P / Cmd+P).
          </Typography>
        </Box>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        To print a report, open the corresponding module, apply your filters, then press <strong>Ctrl+P</strong> (or <strong>Cmd+P</strong> on Mac). All tables are print-optimised.
      </Alert>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" color="text.secondary" fontWeight={600} sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Available modules
      </Typography>

      <Grid container spacing={2}>
        {modules.map((m) => (
          <Grid item xs={12} sm={6} key={m.title}>
            <PrintCard {...m} disabled={!has(m.perm)} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function StaffPrint() {
  return (
    <PermissionGate permission="print">
      <PrintHub />
    </PermissionGate>
  );
}
