import {
  Box, Typography, Paper, Stack, Grid, Button, Divider, Alert,
} from '@mui/material';
import {
  Print, Assessment, Group, ChecklistRtl,
  LibraryBooks, FolderOpen, OpenInNew,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useStaffPermission } from '../../hooks/useStaffPermission';
import PermissionGate         from '../shared/PermissionGate';
import { useAppTranslation }  from '../../../hooks/useAppTranslation';

const STAFF_PRIMARY = '#00695C';

const PrintCard = ({ icon, title, description, to, disabled, t }) => {
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
          startIcon={<OpenInNew />}
          disabled={disabled}
          onClick={(e) => { e.stopPropagation(); if (!disabled) navigate(to); }}
          sx={{
            alignSelf: 'flex-start',
            textTransform: 'none',
            borderRadius: 2,
            bgcolor: disabled ? undefined : STAFF_PRIMARY,
            '&:hover': { bgcolor: disabled ? undefined : '#004d40' },
          }}
        >
          {disabled ? t('common:noAccess') : t('common:goToModule')}
        </Button>
      </Stack>
    </Paper>
  );
};

function PrintHub() {
  const { has } = useStaffPermission();
  const { t }   = useAppTranslation(['print', 'common']);

  const modules = [
    {
      icon:        <Assessment sx={{ fontSize: 28 }} />,
      title:       t('common:nav.results'),
      description: t('print:module.results'),
      to:          '/staff/results',
      perm:        'results.read',
    },
    {
      icon:        <Group sx={{ fontSize: 28 }} />,
      title:       t('common:nav.students'),
      description: t('print:module.students'),
      to:          '/staff/students',
      perm:        'students.read',
    },
    {
      icon:        <ChecklistRtl sx={{ fontSize: 28 }} />,
      title:       t('common:nav.attendance'),
      description: t('print:module.attendance'),
      to:          '/staff/attendance',
      perm:        'attendance.read',
    },
    {
      icon:        <LibraryBooks sx={{ fontSize: 28 }} />,
      title:       t('common:nav.examinations'),
      description: t('print:module.examinations'),
      to:          '/staff/exams',
      perm:        'examinations.read',
    },
    {
      icon:        <FolderOpen sx={{ fontSize: 28 }} />,
      title:       t('common:nav.documents'),
      description: t('print:module.documents'),
      to:          '/staff/documents',
      perm:        'documents.read',
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 960, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Print sx={{ color: STAFF_PRIMARY, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={800}>{t('print:center.title')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('print:center.subtitle')}</Typography>
        </Box>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        {t('print:center.info')}
      </Alert>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="subtitle2" color="text.secondary" fontWeight={600}
        sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {t('print:center.available')}
      </Typography>

      <Grid container spacing={2}>
        {modules.map((m) => (
          <Grid item xs={12} sm={6} key={m.title}>
            <PrintCard {...m} disabled={!has(m.perm)} t={t} />
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
