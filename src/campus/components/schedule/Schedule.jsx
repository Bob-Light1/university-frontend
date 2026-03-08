import { useState, useCallback } from 'react';
import {
  Box, Grid, Typography, Button, Tab, Tabs, Dialog,
  DialogTitle, DialogContent, Snackbar, Alert, Stack,
  Avatar, alpha, useTheme,
} from '@mui/material';
import { Add, CalendarMonth, List, School, TrendingUp } from '@mui/icons-material';
import { useParams } from 'react-router-dom';

import KPICards             from '../../../components/shared/KpiCard';
import ScheduleFilters      from '../../../components/schedule/ScheduleFilters';
import ScheduleCalendar     from '../../../components/schedule/ScheduleCalendar';
import ScheduleCard         from '../../../components/schedule/ScheduleCard';
import ScheduleDetailDrawer from '../../../components/schedule/ScheduleDetailDrawer';
import ScheduleForm         from '../../../components/schedule/ScheduleForm';
import useSchedule          from '../../../hooks/useSchedule';
import useFormSnackbar      from '../../../hooks/useFormSnackBar';
import useRelatedData       from '../../../hooks/useRelatedData';
// FIX: replaced createStudentSchedule / updateStudentSchedule (deleted)
//      with createSession / updateSession from the corrected service
import { createSession, updateSession } from '../../../services/schedule.service';

const FORM_ENDPOINTS = {
  teachers: (id) => `/campus/${id}/teachers`,
  classes:  (id) => `/class/campus/${id}`,
  subjects: (id) => `/subject?campusId=${id}`,
};

const buildKpis = (stats, theme) => [
  { key: 'total',    label: 'Total Sessions',  value: stats.total,    icon: <CalendarMonth />, color: theme.palette.primary.main, subtitle: 'All scheduled sessions' },
  { key: 'live',     label: 'Live Now',         value: stats.live,     icon: <TrendingUp />,   color: theme.palette.success.main,  subtitle: 'Sessions currently in progress', alert: stats.live > 0 ? stats.live : undefined },
  { key: 'upcoming', label: 'Upcoming',         value: stats.upcoming, icon: <School />,       color: theme.palette.info.main,     subtitle: 'Scheduled for the future' },
  { key: 'past',     label: 'Completed',        value: stats.past,     icon: <List />,         color: theme.palette.grey[600],     subtitle: 'Past sessions' },
];

const Schedule = () => {
  const { campusId } = useParams();
  const theme        = useTheme();

  const [view,          setView]          = useState('calendar');
  const [formOpen,      setFormOpen]      = useState(false);
  const [editTarget,    setEditTarget]    = useState(null);
  const [detailSession, setDetailSession] = useState(null);
  const [detailOpen,    setDetailOpen]    = useState(false);

  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  // FIX: mode was 'student' — corrected to 'admin'
  // 'admin' → GET /schedules/student/admin/overview (paginated, campus-scoped)
  const {
    sessions, loading, filters, stats, pagination,
    handleFilterChange, handleReset, handleDelete,
    handleStatusUpdate, setPage, fetch,
  } = useSchedule('admin', { campusId });

  const { data: related } = useRelatedData(FORM_ENDPOINTS, campusId);

  const teacherOptions = (related.teachers ?? []).map((t) => ({
    value: t._id, 
    label: `${t.firstName} ${t.lastName}`,
    firstName: t.firstName, 
    lastName: t.lastName, 
    email: t.email,
  }));
  const classOptions   = (related.classes  ?? []).map((c) => ({
      value: c._id, 
      label: c.className 
  }));
  const subjectOptions = (related.subjects ?? []).map((s) => ({ 
      value: s._id, 
      label: s.subject_name, 
      code: s.subject_code 
  }));

  /**
   * Blur the active element before closing the drawer to prevent the
   * aria-hidden violation that occurs when MUI hides the modal root while
   * a descendant still holds focus during the exit transition.
   */
  const handleCloseDrawer = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setDetailOpen(false);
  }, []);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (session) => {
    // Blur before closing the drawer so MUI can safely apply aria-hidden
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setDetailOpen(false);
    setEditTarget(session);
    setFormOpen(true);
  };

  const handleFormSubmit = useCallback(async (payload, isEdit, id) => {
    try {
      // FIX: was createStudentSchedule / updateStudentSchedule (deleted from service)
      if (isEdit) { await updateSession(id, payload); showSnackbar('Session updated successfully', 'success'); }
      else        { await createSession(payload);      showSnackbar('Session created successfully', 'success'); }
      setFormOpen(false);
      fetch();
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Failed to save session', 'error');
    }
  }, [fetch, showSnackbar]);

  const handleDeleteWithFeedback = useCallback(async (id) => {
    try {
      await handleDelete(id);
      showSnackbar('Session deleted', 'success');
    } catch {
      showSnackbar('Failed to delete session', 'error');
    }
  }, [handleDelete, showSnackbar]);

  const handleViewSession = (session) => { 
    setDetailSession(session); 
    setDetailOpen(true); 
  };

  // FIX: was handleStatusUpdate(id, { status: 'CANCELLED', reason })
  // Corrected to the new hook signature: handleStatusUpdate(id, action, payload)
  const handleCancelSession = useCallback(async (session) => {
    try {
      await handleStatusUpdate(session._id, 'cancel', { reason: 'Cancelled by campus manager' });
      setDetailSession((prev) =>
        prev?._id === session._id ? { ...prev, status: 'CANCELLED' } : prev
      );
      showSnackbar('Session cancelled', 'warning');
    } catch {
      showSnackbar('Failed to cancel session', 'error');
    }
  }, [handleStatusUpdate, showSnackbar]);

  const handlePublishSession = useCallback(async (session) => {
    try {
      await handleStatusUpdate(session._id, 'publish');
      setDetailSession((prev) =>
        prev?._id === session._id ? { ...prev, status: 'PUBLISHED' } : prev
      );
      showSnackbar('Session published', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message ?? 'Failed to publish session', 'error');
    }
  }, [handleStatusUpdate, showSnackbar]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Schedule Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage all class sessions for your campus
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}
          sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
          New Session
        </Button>
      </Stack>

      <Box mb={3}><KPICards metrics={buildKpis(stats, theme)} loading={loading} /></Box>

      <Box mb={3}>
        <ScheduleFilters
          searchValue={filters.search}
          onSearchChange={(v) => handleFilterChange('search', v)}
          filterValues={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          showImport
        />
      </Box>

      <Box mb={2}>
        <Tabs value={view} onChange={(_, v) => setView(v)}
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}>
          <Tab value="calendar" label="Calendar" icon={<CalendarMonth />} iconPosition="start" />
          <Tab value="list"     label="List"     icon={<List />}          iconPosition="start" />
        </Tabs>
      </Box>

      {view === 'calendar' ? (
        <ScheduleCalendar sessions={sessions} onView={handleViewSession}
          onEdit={handleOpenEdit} onDelete={handleDeleteWithFeedback} />
      ) : (
        <Grid container spacing={2}>
          {loading
            ? [1,2,3,4,5,6].map((k) => (
                <Grid key={k} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ height: 200, bgcolor: 'action.hover', borderRadius: 2 }} />
                </Grid>
              ))
            : sessions.length === 0
              ? <Grid size={{ xs: 12 }}><EmptyState onAction={handleOpenCreate} /></Grid>
              : sessions.map((s) => (
                  <Grid key={s._id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <ScheduleCard session={s} onView={handleViewSession}
                      onEdit={handleOpenEdit} onDelete={handleDeleteWithFeedback} />
                  </Grid>
                ))
          }
        </Grid>
      )}

      <ScheduleDetailDrawer
        session={detailSession}
        open={detailOpen}
        onClose={handleCloseDrawer}
        onEdit={handleOpenEdit}
        onCancel={handleCancelSession}
        onPublish={handlePublishSession}
        showEdit
        showCancel
        showPublish
      />

      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="create-schedule-session"
        slotProps={{
          paper: { sx: { borderRadius: 3 } },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editTarget ? 'Edit Session' : 'Create New Session'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <ScheduleForm
            initialData={editTarget} 
            campusId={campusId}
            teacherOptions={teacherOptions} 
            classOptions={classOptions} 
            subjectOptions={subjectOptions}
            onSubmit={handleFormSubmit} 
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity} 
          variant="filled" 
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const EmptyState = ({ onAction }) => {
  const theme = useTheme();
  return (
    <Box 
      sx={{ 
          textAlign: 'center', 
          py: 8, 
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderRadius: 3, 
          border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}` 
        }}
    >
      <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), width: 64, height: 64 }}>
        <CalendarMonth sx={{ fontSize: 32, color: 'primary.main' }} />
      </Avatar>
      <Typography variant="h6" fontWeight={700} mb={1}>No sessions found</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Create the first session for your campus
      </Typography>
      <Button variant="contained" startIcon={<Add />} onClick={onAction}
        sx={{ textTransform: 'none', borderRadius: 2 }}>
        Create Session
      </Button>
    </Box>
  );
};

export default Schedule;