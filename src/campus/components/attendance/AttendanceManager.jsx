/**
 * @file AttendanceManager.jsx
 * @description Campus manager attendance dashboard.
 *
 * Tabs:
 *  1. Students   — campus-wide student attendance overview + roll-call per session
 *  2. Teachers   — campus-wide teacher attendance overview + payroll report
 *
 * Roles: CAMPUS_MANAGER, ADMIN, DIRECTOR
 *
 * Routes (registered in CampusRoutes.jsx):
 *  /campus/attendance  → <Attendance /> renders this component
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Stack, Chip, Button,
  Alert, CircularProgress, Paper, Snackbar,
  alpha, useTheme, Dialog, DialogTitle, DialogContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, TablePagination, TextField,
  FormControl, InputLabel, Select, MenuItem,
  DialogActions, Autocomplete, Skeleton,
} from '@mui/material';
import {
  People, School, Refresh,
  CheckCircle, Cancel, HelpOutline, AttachMoney,
  SwapHoriz, ThumbUp, ThumbDown, Add, FilterList,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import api from '../../../api/axiosInstance';
import { useAuth } from '../../../hooks/useAuth';

import KPICards             from '../../../components/shared/KpiCard';
import useAttendance        from '../../../hooks/useAttendance';
import useFormSnackbar      from '../../../hooks/useFormSnackBar';
import {
  AttendanceStatusChip,
  AttendanceSummaryBar,
  JustificationDialog,
  AttendanceEmptyState,
  LockedBadge,
} from '../../../components/attendance/AttendanceShared';
import {
  getTeacherPayrollReport,
  initTeacherAttendance,
  getTeacherPendingSessions,
} from '../../../services/attendanceService';
import {
  getAdminPostponements,
  reviewPostponement,
} from '../../../services/scheduleService';
import { getTeachers } from '../../../services/teacherService';
import { fDate, fTime, fDateTime } from '../../../utils/dateFormat';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AttendanceManager = () => {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800}>Attendance Management</Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor and manage student & teacher attendance across your campus
        </Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
          '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
        }}
      >
        <Tab value={0} label="Students"      icon={<People />}    iconPosition="start" />
        <Tab value={1} label="Teachers"      icon={<School />}    iconPosition="start" />
        <Tab value={2} label="Postponements" icon={<SwapHoriz />} iconPosition="start" />
      </Tabs>

      {tab === 0 && <StudentAttendanceTab />}
      {tab === 1 && <TeacherAttendanceTab />}
      {tab === 2 && <PostponementTab />}
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT ATTENDANCE TAB
// ─────────────────────────────────────────────────────────────────────────────

const StudentAttendanceTab = () => {
  const theme = useTheme();
  const { campusId } = useParams();
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  // ── Class selector ──────────────────────────────────────────────────────────
  const [classes,          setClasses]          = useState([]);
  const [classesLoading,   setClassesLoading]   = useState(true);
  const [selectedClassId,  setSelectedClassId]  = useState(null); // null = show all

  // ── Student selector (within selected class) ────────────────────────────────
  const [classStudents,    setClassStudents]    = useState([]);
  const [studentsLoading,  setStudentsLoading]  = useState(false);
  const [selectedStudentId,setSelectedStudentId]= useState('');

  // ── Date / status filters ───────────────────────────────────────────────────
  const [justifyTarget, setJustifyTarget] = useState(null);
  const [dateFrom,      setDateFrom]      = useState('');
  const [dateTo,        setDateTo]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');

  const {
    records, summary, backendSummary, loading, error, pagination,
    handleFilterChange, handleReset, fetch, toggleStudent, justifyStudent,
    setPage, setLimit,
  } = useAttendance('manager-student');

  // KPI source: prefer server-aggregated summary (whole dataset, not just current page)
  const displaySummary = backendSummary || summary;

  // ── Load classes alphabetically ─────────────────────────────────────────────
  useEffect(() => {
    if (!campusId) return;
    setClassesLoading(true);
    api.get(`/class/campus/${campusId}`)
      .then((res) => {
        const list = (res.data?.data || [])
          .slice()
          .sort((a, b) => (a.className || '').localeCompare(b.className || ''));
        setClasses(list);
        // Auto-select first class
        if (list.length > 0) {
          const firstId = list[0]._id;
          setSelectedClassId(firstId);
          handleFilterChange('classId', firstId);
        }
      })
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusId]);

  // ── Load students when class changes ────────────────────────────────────────
  useEffect(() => {
    if (!selectedClassId) {
      setClassStudents([]);
      setSelectedStudentId('');
      return;
    }
    setStudentsLoading(true);
    api.get('/students', { params: { studentClass: selectedClassId, status: 'active', limit: 200 } })
      .then((res) => {
        const list = (res.data?.data || [])
          .slice()
          .sort((a, b) => `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`));
        setClassStudents(list);
      })
      .catch(() => setClassStudents([]))
      .finally(() => setStudentsLoading(false));
  }, [selectedClassId]);

  // ── Class chip selection ────────────────────────────────────────────────────
  const selectClass = useCallback((classId) => {
    setSelectedClassId(classId);
    setSelectedStudentId('');
    handleFilterChange('studentId', '');
    handleFilterChange('classId', classId || '');
  }, [handleFilterChange]);

  // ── Student filter ──────────────────────────────────────────────────────────
  const handleStudentChange = (studentId) => {
    setSelectedStudentId(studentId);
    handleFilterChange('studentId', studentId);
  };

  // ── Apply / Reset date+status filters ──────────────────────────────────────
  const handleSearch = () => {
    handleFilterChange('from', dateFrom);
    handleFilterChange('to', dateTo);
    handleFilterChange('status', statusFilter);
  };

  const handleFullReset = () => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('');
    setSelectedStudentId('');
    handleReset();
    // Re-apply class filter if one is selected
    if (selectedClassId) handleFilterChange('classId', selectedClassId);
  };

  const handleJustify = async (payload) => {
    try {
      await justifyStudent(justifyTarget._id, payload);
      showSnackbar('Justification saved successfully.', 'success');
    } catch {
      showSnackbar('Failed to save justification.', 'error');
    }
  };

  const handleToggle = async (record) => {
    if (record.isLocked) {
      showSnackbar('Cannot modify a locked record.', 'warning');
      return;
    }
    try {
      await toggleStudent(record._id, !record.status);
      showSnackbar('Attendance updated.', 'success');
    } catch {
      showSnackbar('Failed to update attendance.', 'error');
    }
  };

  const kpis = [
    { key: 'total',   label: 'Total Records',   value: displaySummary.total,              icon: <People />,      color: theme.palette.grey[700] },
    { key: 'present', label: 'Present',          value: displaySummary.present,            icon: <CheckCircle />, color: theme.palette.success.main },
    { key: 'absent',  label: 'Absent',           value: displaySummary.absent,             icon: <Cancel />,      color: theme.palette.error.main },
    { key: 'rate',    label: 'Attendance Rate',  value: `${displaySummary.rate ?? 0}%`,   icon: <HelpOutline />, color: theme.palette.primary.main },
  ];

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* KPI Cards */}
      <Box mb={3}>
        <KPICards metrics={kpis} loading={loading} />
      </Box>

      {/* ── CLASS SELECTOR ──────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <FilterList fontSize="small" color="action" />
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Class
          </Typography>
        </Stack>

        {classesLoading ? (
          <Stack direction="row" spacing={1}>
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={90} height={32} />)}
          </Stack>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {/* "All campus" chip */}
            <Chip
              label="All Campus"
              size="small"
              onClick={() => selectClass(null)}
              color={selectedClassId === null ? 'primary' : 'default'}
              variant={selectedClassId === null ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
            {classes.map((cls) => (
              <Chip
                key={cls._id}
                label={cls.className}
                size="small"
                onClick={() => selectClass(cls._id)}
                color={selectedClassId === cls._id ? 'secondary' : 'default'}
                variant={selectedClassId === cls._id ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        )}

        {/* Student selector — only when a class is selected */}
        {selectedClassId && (
          <Box mt={2}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                Student
              </Typography>
            </Stack>
            <FormControl size="small" sx={{ minWidth: 260 }} disabled={studentsLoading}>
              <InputLabel>
                {studentsLoading ? 'Loading…' : 'All students'}
              </InputLabel>
              <Select
                label={studentsLoading ? 'Loading…' : 'All students'}
                value={selectedStudentId}
                onChange={(e) => handleStudentChange(e.target.value)}
              >
                <MenuItem value=""><em>All students</em></MenuItem>
                {classStudents.map((s) => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.lastName} {s.firstName}
                    {s.matricule ? ` — ${s.matricule}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>

      {/* ── DATE / STATUS FILTERS ───────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end" flexWrap="wrap">
          <TextField
            label="From" type="date" size="small" value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
          />
          <TextField
            label="To" type="date" size="small" value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Present</MenuItem>
              <MenuItem value="false">Absent</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleSearch}>Apply</Button>
          <Button onClick={handleFullReset}>Reset</Button>
          <IconButton onClick={fetch} title="Refresh"><Refresh /></IconButton>
        </Stack>
      </Paper>

      {/* Summary bar */}
      <Box mb={2}>
        <AttendanceSummaryBar summary={displaySummary} />
      </Box>

      {/* ── TABLE ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : records.length === 0 ? (
        <AttendanceEmptyState message="No student attendance records found for this period." />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Justification</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {record.student?.lastName} {record.student?.firstName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.student?.matricule}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{record.class?.className || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.attendanceDate ? fDate(record.attendanceDate) : '—'}
                      </Typography>
                      {record.isLocked && <LockedBadge lockedAt={record.lockedAt} />}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {record.sessionStartTime} – {record.sessionEndTime}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <AttendanceStatusChip
                        status={record.status}
                        isJustified={record.isJustified}
                        isLate={record.isLate}
                      />
                    </TableCell>
                    <TableCell>
                      {record.isJustified ? (
                        <Tooltip title={record.justification || ''}>
                          <Chip label="Justified" size="small" color="info" />
                        </Tooltip>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title={record.status ? 'Mark absent' : 'Mark present'}>
                          <span>
                            <IconButton
                              size="small"
                              color={record.status ? 'error' : 'success'}
                              onClick={() => handleToggle(record)}
                              disabled={record.isLocked}
                            >
                              {record.status
                                ? <Cancel fontSize="small" />
                                : <CheckCircle fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        {!record.status && (
                          <Tooltip title="Add / view justification">
                            <IconButton size="small" color="info" onClick={() => setJustifyTarget(record)}>
                              <HelpOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={pagination.total || records.length}
            page={(pagination.page || 1) - 1}
            rowsPerPage={pagination.limit || 50}
            onPageChange={(_, p) => setPage(p + 1)}
            onRowsPerPageChange={(e) => setLimit(Number(e.target.value))}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="Rows:"
          />
        </TableContainer>
      )}

      <JustificationDialog
        open={Boolean(justifyTarget)}
        record={justifyTarget}
        onClose={() => setJustifyTarget(null)}
        onSubmit={handleJustify}
        readOnly={justifyTarget?.isLocked && justifyTarget?.isJustified}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TEACHER ATTENDANCE TAB
// ─────────────────────────────────────────────────────────────────────────────

const TeacherAttendanceTab = () => {
  const theme = useTheme();
  const { campusId } = useParams();
  const { getUserRole } = useAuth();
  const isCampusManager = getUserRole() === 'CAMPUS_MANAGER';
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [justifyTarget,  setJustifyTarget]  = useState(null);
  const [payrollOpen,    setPayrollOpen]    = useState(false);
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');
  const [isPaidFilter,   setIsPaidFilter]   = useState('');

  const [payRefOpen,   setPayRefOpen]   = useState(false);
  const [payRefTarget, setPayRefTarget] = useState(null);
  const [payRef,       setPayRef]       = useState('');
  const [initOpen,     setInitOpen]     = useState(false);

  // ── Class selector ──────────────────────────────────────────────────────────
  const [classes,        setClasses]        = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [selectedClassId,setSelectedClassId]= useState(null);

  const {
    records, summary, backendSummary, loading, error, pagination,
    fetch, toggleTeacher, justifyTeacher, markPaid, setPage, setLimit,
    handleFilterChange, handleReset,
  } = useAttendance('manager-teacher');

  const displaySummary = backendSummary || summary;

  // ── Load classes ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!campusId) return;
    setClassesLoading(true);
    api.get(`/class/campus/${campusId}`)
      .then((res) => {
        const list = (res.data?.data || [])
          .slice()
          .sort((a, b) => (a.className || '').localeCompare(b.className || ''));
        setClasses(list);
      })
      .catch(() => setClasses([]))
      .finally(() => setClassesLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campusId]);

  const selectClass = useCallback((classId) => {
    setSelectedClassId(classId);
    handleFilterChange('classId', classId || '');
  }, [handleFilterChange]);

  const handleSearch = () => {
    handleFilterChange('from', dateFrom);
    handleFilterChange('to', dateTo);
    handleFilterChange('status', statusFilter);
    handleFilterChange('isPaid', isPaidFilter);
  };

  const handleFullReset = () => {
    setDateFrom(''); setDateTo(''); setStatusFilter(''); setIsPaidFilter('');
    handleReset();
    if (selectedClassId) handleFilterChange('classId', selectedClassId);
  };

  const handleJustify = async (payload) => {
    try {
      await justifyTeacher(justifyTarget._id, payload);
      showSnackbar('Justification saved.', 'success');
    } catch {
      showSnackbar('Failed to save justification.', 'error');
    }
  };

  const handleToggleTeacher = async (record) => {
    if (record.isLocked) { showSnackbar('Cannot modify a locked record.', 'warning'); return; }
    try {
      await toggleTeacher(record._id, !record.status);
      showSnackbar('Attendance updated.', 'success');
    } catch {
      showSnackbar('Failed to update attendance.', 'error');
    }
  };

  const handleMarkPaid = (record) => { setPayRefTarget(record); setPayRef(''); setPayRefOpen(true); };

  const handlePayRefConfirm = async () => {
    if (!payRef.trim()) return;
    try {
      await markPaid(payRefTarget._id, payRef.trim());
      showSnackbar('Session marked as paid.', 'success');
      setPayRefOpen(false);
    } catch {
      showSnackbar('Failed to mark as paid.', 'error');
    }
  };

  const kpis = [
    { key: 'total',   label: 'Total Sessions',  value: displaySummary.total,            icon: <School />,      color: theme.palette.grey[700] },
    { key: 'present', label: 'Present',         value: displaySummary.present,          icon: <CheckCircle />, color: theme.palette.success.main },
    { key: 'absent',  label: 'Absent',          value: displaySummary.absent,           icon: <Cancel />,      color: theme.palette.error.main },
    { key: 'rate',    label: 'Attendance Rate', value: `${displaySummary.rate ?? 0}%`, icon: <HelpOutline />, color: theme.palette.primary.main },
  ];

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box mb={3}>
        <KPICards metrics={kpis} loading={loading} />
      </Box>

      {/* ── CLASS SELECTOR ──────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
          <FilterList fontSize="small" color="action" />
          <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
            Class
          </Typography>
        </Stack>
        {classesLoading ? (
          <Stack direction="row" spacing={1}>
            {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" width={90} height={32} />)}
          </Stack>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label="All Campus"
              size="small"
              onClick={() => selectClass(null)}
              color={selectedClassId === null ? 'primary' : 'default'}
              variant={selectedClassId === null ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600 }}
            />
            {classes.map((cls) => (
              <Chip
                key={cls._id}
                label={cls.className}
                size="small"
                onClick={() => selectClass(cls._id)}
                color={selectedClassId === cls._id ? 'secondary' : 'default'}
                variant={selectedClassId === cls._id ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* ── DATE / STATUS / PAYMENT FILTERS ─────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end" flexWrap="wrap">
          <TextField
            label="From" type="date" size="small" value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
          />
          <TextField
            label="To" type="date" size="small" value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }} sx={{ minWidth: 160 }}
          />
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Present</MenuItem>
              <MenuItem value="false">Absent</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Payment</InputLabel>
            <Select label="Payment" value={isPaidFilter} onChange={(e) => setIsPaidFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Paid</MenuItem>
              <MenuItem value="false">Unpaid</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleSearch}>Apply</Button>
          <Button onClick={handleFullReset}>Reset</Button>
          {isCampusManager && (
            <Button variant="outlined" startIcon={<Add />} onClick={() => setInitOpen(true)}>
              Roll Call
            </Button>
          )}
          <Button variant="outlined" startIcon={<AttachMoney />} onClick={() => setPayrollOpen(true)}>
            Payroll Report
          </Button>
          <IconButton onClick={fetch} title="Refresh"><Refresh /></IconButton>
        </Stack>
      </Paper>

      <Box mb={2}>
        <AttendanceSummaryBar summary={displaySummary} />
      </Box>

      {/* ── TABLE ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : records.length === 0 ? (
        <AttendanceEmptyState message="No teacher attendance records found for this period." />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.06) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {record.teacher?.lastName} {record.teacher?.firstName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {record.teacher?.employmentType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{record.class?.className || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.attendanceDate ? fDate(record.attendanceDate) : '—'}
                      </Typography>
                      {record.isLocked && <LockedBadge lockedAt={record.lockedAt} />}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {record.sessionStartTime} – {record.sessionEndTime}
                      </Typography>
                      {record.isLate && (
                        <Chip
                          label={record.arrivalTime ? `Late ${record.arrivalTime}` : 'Late'}
                          size="small"
                          color="warning"
                          sx={{ ml: 0.5, height: 18, fontSize: '0.6rem' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <AttendanceStatusChip status={record.status} isJustified={record.isJustified} isLate={record.isLate} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {record.sessionDuration != null
                          ? `${Math.floor(record.sessionDuration / 60)}h${String(record.sessionDuration % 60).padStart(2, '0')}`
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {record.status ? (
                        record.isPaid
                          ? <Chip label="Paid" size="small" color="success" />
                          : <Chip label="Unpaid" size="small" color="warning" />
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {isCampusManager && (
                          <>
                            <Tooltip title={record.status ? 'Mark absent' : 'Mark present'}>
                              <span>
                                <IconButton
                                  size="small"
                                  color={record.status ? 'error' : 'success'}
                                  onClick={() => handleToggleTeacher(record)}
                                  disabled={record.isLocked}
                                >
                                  {record.status ? <Cancel fontSize="small" /> : <CheckCircle fontSize="small" />}
                                </IconButton>
                              </span>
                            </Tooltip>
                            {!record.status && (
                              <Tooltip title="Add justification">
                                <IconButton size="small" color="info" onClick={() => setJustifyTarget(record)}>
                                  <HelpOutline fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                        {record.status && !record.isPaid && (
                          <Tooltip title="Mark as paid">
                            <IconButton size="small" color="success" onClick={() => handleMarkPaid(record)}>
                              <AttachMoney fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={pagination.total || records.length}
            page={(pagination.page || 1) - 1}
            rowsPerPage={pagination.limit || 50}
            onPageChange={(_, p) => setPage(p + 1)}
            onRowsPerPageChange={(e) => setLimit(Number(e.target.value))}
            rowsPerPageOptions={[25, 50, 100]}
            labelRowsPerPage="Rows:"
          />
        </TableContainer>
      )}

      {/* Payment reference dialog */}
      <Dialog open={payRefOpen} onClose={() => setPayRefOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>Mark Session as Paid</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus fullWidth label="Payment reference" value={payRef} size="small"
            onChange={(e) => setPayRef(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePayRefConfirm()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayRefOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePayRefConfirm} disabled={!payRef.trim()}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Roll call dialog — CAMPUS_MANAGER only */}
      {initOpen && isCampusManager && (
        <InitAttendanceDialog
          open={initOpen}
          onClose={() => setInitOpen(false)}
          onSuccess={() => { setInitOpen(false); fetch(); }}
          campusId={campusId}
        />
      )}

      {payrollOpen && (
        <PayrollDialog open={payrollOpen} onClose={() => setPayrollOpen(false)} />
      )}

      <JustificationDialog
        open={Boolean(justifyTarget)}
        record={justifyTarget}
        onClose={() => setJustifyTarget(null)}
        onSubmit={handleJustify}
        readOnly={justifyTarget?.isLocked && justifyTarget?.isJustified}
      />

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// POSTPONEMENT TAB
// ─────────────────────────────────────────────────────────────────────────────

const PostponementTab = () => {
  const theme = useTheme();
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [statusFilter,setStatusFilter]= useState('PENDING');
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, limit: 50 });

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [reviewNote,   setReviewNote]   = useState('');
  const [reviewing,    setReviewing]    = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminPostponements({ status: statusFilter, page, limit: 50 });
      const raw = res.data;
      setRows(Array.isArray(raw?.data) ? raw.data : []);
      if (raw?.pagination) setPagination(raw.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load postponement requests.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(1); }, [load]);

  const openReview = (row, decision) => {
    setReviewTarget(row);
    setReviewStatus(decision);
    setReviewNote('');
  };

  const handleReviewConfirm = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    try {
      await reviewPostponement(String(reviewTarget.requestId), {
        status: reviewStatus,
        reviewNote: reviewNote.trim(),
      });
      showSnackbar(`Request ${reviewStatus.toLowerCase()}.`, 'success');
      setReviewTarget(null);
      load(pagination.page);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Review failed.', 'error');
    } finally {
      setReviewing(false);
    }
  };

  const statusColor = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' };

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      {/* Filter bar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={() => load(1)} title="Refresh"><Refresh /></IconButton>
        </Stack>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : rows.length === 0 ? (
        <AttendanceEmptyState message={`No ${statusFilter.toLowerCase()} postponement requests.`} />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.warning.main, 0.06) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Proposed</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  {statusFilter === 'PENDING' && (
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={String(row.requestId)} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.teacher?.lastName} {row.teacher?.firstName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.teacher?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.reference || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.subject}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {fDate(row.sessionStart)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.sessionStart ? fTime(row.sessionStart) : ''}
                        {row.sessionEnd ? ` – ${fTime(row.sessionEnd)}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Tooltip title={row.reason || ''}>
                        <Typography variant="body2" noWrap>{row.reason || '—'}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {row.proposedStart ? (
                        <>
                          <Typography variant="caption">
                            {fDate(row.proposedStart)}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            {fTime(row.proposedStart)}
                            {row.proposedEnd ? ` – ${fTime(row.proposedEnd)}` : ''}
                          </Typography>
                        </>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        color={statusColor[row.status] || 'default'}
                      />
                      {row.reviewNote && (
                        <Tooltip title={row.reviewNote}>
                          <Typography variant="caption" display="block" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                            {row.reviewNote}
                          </Typography>
                        </Tooltip>
                      )}
                    </TableCell>
                    {statusFilter === 'PENDING' && (
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => openReview(row, 'APPROVED')}
                            >
                              <ThumbUp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openReview(row, 'REJECTED')}
                            >
                              <ThumbDown fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={pagination.total || rows.length}
            page={(pagination.page || 1) - 1}
            rowsPerPage={pagination.limit || 50}
            onPageChange={(_, p) => load(p + 1)}
            rowsPerPageOptions={[50]}
          />
        </TableContainer>
      )}

      {/* Review dialog */}
      <Dialog
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>
          {reviewStatus === 'APPROVED' ? 'Approve' : 'Reject'} Postponement
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {reviewTarget && (
            <Box mb={2}>
              <Typography variant="body2">
                <strong>{reviewTarget.teacher?.lastName} {reviewTarget.teacher?.firstName}</strong>
                {' — '}{reviewTarget.reference}
              </Typography>
              <Typography variant="caption" color="text.secondary">{reviewTarget.reason}</Typography>
            </Box>
          )}
          <TextField
            fullWidth
            label="Review note (optional)"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            multiline
            rows={3}
            size="small"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReviewTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={reviewStatus === 'APPROVED' ? 'success' : 'error'}
            onClick={handleReviewConfirm}
            disabled={reviewing}
            startIcon={reviewing ? <CircularProgress size={14} color="inherit" /> : null}
          >
            Confirm {reviewStatus === 'APPROVED' ? 'Approval' : 'Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROLL CALL DIALOG (CAMPUS_MANAGER only)
// ─────────────────────────────────────────────────────────────────────────────

const LATE_MINUTES_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

const InitAttendanceDialog = ({ open, onClose, onSuccess, campusId }) => {
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [campusClasses,  setCampusClasses]  = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [selectedClassId,setSelectedClassId]= useState('');

  const [teacherOptions, setTeacherOptions] = useState([]);
  const [teacherInput,   setTeacherInput]   = useState('');
  const [teacher,        setTeacher]        = useState(null);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  // { [sessionId]: { status: 'present'|'absent'|'late'|'', lateMinutes: 15, remarks: '' } }
  const [attendance,      setAttendance]      = useState({});
  const [pendingSessions, setPendingSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Load campus classes on dialog open
  useEffect(() => {
    if (!campusId || !open) return;
    setClassesLoading(true);
    api.get(`/class/campus/${campusId}`)
      .then((res) => {
        const list = (res.data?.data || [])
          .slice()
          .sort((a, b) => (a.className || '').localeCompare(b.className || ''));
        setCampusClasses(list);
      })
      .catch(() => setCampusClasses([]))
      .finally(() => setClassesLoading(false));
  }, [campusId, open]);

  // Search teachers (debounced)
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await getTeachers({ search: teacherInput, limit: 30, status: 'active' });
        setTeacherOptions(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch {
        setTeacherOptions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [teacherInput]);

  // Load pending sessions when teacher or date changes
  useEffect(() => {
    if (!teacher || !date) { setPendingSessions([]); setAttendance({}); return; }
    setSessionsLoading(true);
    getTeacherPendingSessions(String(teacher._id), date)
      .then((res) => {
        setPendingSessions(Array.isArray(res.data?.data) ? res.data.data : []);
        setAttendance({});
      })
      .catch(() => setPendingSessions([]))
      .finally(() => setSessionsLoading(false));
  }, [teacher, date]);

  const updateAtt = (sessionId, field, value) => {
    setAttendance((prev) => ({
      ...prev,
      [String(sessionId)]: { ...(prev[String(sessionId)] || {}), [field]: value },
    }));
  };

  const markedCount = Object.values(attendance).filter((a) => a.status).length;

  const handleSubmit = async () => {
    const toSubmit = pendingSessions.filter((s) => attendance[String(s._id)]?.status);
    if (!toSubmit.length) { showSnackbar('Mark at least one session.', 'warning'); return; }

    setSubmitting(true);
    let ok = 0;
    const errors = [];
    const pad       = (n) => String(n).padStart(2, '0');
    const toTimeStr = (dt) => `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

    for (const session of toSubmit) {
      const att      = attendance[String(session._id)] || {};
      const isPresent = att.status === 'present' || att.status === 'late';
      const isLate    = att.status === 'late';
      const firstClass = Array.isArray(session.classes) && session.classes.length > 0
        ? session.classes[0] : null;
      const classId   = firstClass?.classId   ? String(firstClass.classId)   : '';
      const subjectId = session.subject?.subjectId
        ? String(session.subject.subjectId)
        : (session.subject?._id ? String(session.subject._id) : '');

      if (!classId || !subjectId) {
        errors.push(`Session ${session.reference || ''}: missing class or subject — skipped.`);
        continue;
      }

      const startDt = new Date(session.startTime);
      const endDt   = new Date(session.endTime);

      try {
        await initTeacherAttendance(String(session._id), {
          teacherId:        String(teacher._id),
          classId,
          subjectId,
          attendanceDate:   date,
          academicYear:     session.academicYear || '',
          semester:         session.semester || 'S1',
          sessionStartTime: toTimeStr(startDt),
          sessionEndTime:   toTimeStr(endDt),
          status:           isPresent,
          isLate,
          lateMinutes:      isLate ? (att.lateMinutes || 15) : undefined,
          remarks:          att.remarks || undefined,
        });
        ok++;
      } catch (err) {
        errors.push(err.response?.data?.message || `Failed: ${session.reference || String(session._id)}`);
      }
    }

    setSubmitting(false);
    if (ok > 0) {
      showSnackbar(`${ok} record(s) saved successfully.`, 'success');
      setTimeout(onSuccess, 800);
    } else if (errors.length) {
      showSnackbar(errors[0], 'error');
    }
  };

  // Sessions optionally filtered by selected class
  const visibleSessions = selectedClassId
    ? pendingSessions.filter((s) =>
        Array.isArray(s.classes) &&
        s.classes.some((c) => String(c.classId) === selectedClassId)
      )
    : pendingSessions;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, height: '90vh', display: 'flex', flexDirection: 'column' } }}>
      <DialogTitle fontWeight={700}>Teacher Roll Call</DialogTitle>

      <DialogContent dividers sx={{ flex: 1, overflow: 'auto' }}>
        <Stack spacing={2} mt={1}>

          {/* ── Date + Class filter ────────────────────────────────────────── */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Session date"
              type="date"
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ flex: 2 }} disabled={classesLoading}>
              <InputLabel>Class (optional)</InputLabel>
              <Select
                label="Class (optional)"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <MenuItem value=""><em>All classes</em></MenuItem>
                {campusClasses.map((c) => (
                  <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* ── Teacher autocomplete ───────────────────────────────────────── */}
          <Autocomplete
            options={teacherOptions}
            getOptionLabel={(o) => `${o.lastName || ''} ${o.firstName || ''}`.trim() || o.email || ''}
            value={teacher}
            onChange={(_, v) => setTeacher(v)}
            inputValue={teacherInput}
            onInputChange={(_, v) => setTeacherInput(v)}
            filterOptions={(x) => x}
            noOptionsText="Type to search teachers…"
            renderInput={(params) => (
              <TextField {...params} label="Teacher" size="small" />
            )}
          />

          {/* ── Pending sessions ───────────────────────────────────────────── */}
          {teacher && date && (
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Pending Sessions
                </Typography>
                {sessionsLoading && <CircularProgress size={14} />}
                {!sessionsLoading && (
                  <Typography variant="caption" color="text.secondary">
                    {visibleSessions.length} session{visibleSessions.length !== 1 ? 's' : ''} without record
                  </Typography>
                )}
              </Stack>

              {!sessionsLoading && pendingSessions.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  All sessions for this teacher on this date already have attendance records.
                </Alert>
              )}

              {!sessionsLoading && pendingSessions.length > 0 && visibleSessions.length === 0 && (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No sessions for the selected class on this date. Try "All classes".
                </Alert>
              )}

              {visibleSessions.map((session) => {
                const sid     = String(session._id);
                const att     = attendance[sid] || {};
                const start   = fTime(session.startTime);
                const end     = fTime(session.endTime);
                const subject = session.subject?.subject_name || '—';
                const clsName = session.classes?.[0]?.className || '—';

                const borderColor =
                  att.status === 'present' ? 'success.main' :
                  att.status === 'late'    ? 'warning.main' :
                  att.status === 'absent'  ? 'error.main'   : 'divider';

                return (
                  <Paper
                    key={sid}
                    variant="outlined"
                    sx={{ p: 2, mb: 1.5, borderRadius: 2, borderColor, transition: 'border-color 0.2s' }}
                  >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>

                      {/* Session info */}
                      <Box sx={{ minWidth: 170 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {start} – {end}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{subject}</Typography>
                        <Box mt={0.5}>
                          <Chip label={clsName} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                        </Box>
                      </Box>

                      {/* Controls */}
                      <Box flex={1}>
                        {/* Status toggle chips */}
                        <Stack direction="row" spacing={1} flexWrap="wrap" mb={att.status ? 1 : 0}>
                          {[
                            { key: 'present', label: 'Present', color: 'success' },
                            { key: 'absent',  label: 'Absent',  color: 'error' },
                            { key: 'late',    label: 'Late',    color: 'warning' },
                          ].map(({ key, label, color }) => (
                            <Chip
                              key={key}
                              label={label}
                              size="small"
                              color={color}
                              variant={att.status === key ? 'filled' : 'outlined'}
                              onClick={() => updateAtt(sid, 'status', att.status === key ? '' : key)}
                              sx={{ fontWeight: 600, cursor: 'pointer' }}
                            />
                          ))}
                        </Stack>

                        {/* Late minutes */}
                        {att.status === 'late' && (
                          <FormControl size="small" sx={{ minWidth: 130, mb: 1 }}>
                            <InputLabel>Delay</InputLabel>
                            <Select
                              label="Delay"
                              value={att.lateMinutes || 15}
                              onChange={(e) => updateAtt(sid, 'lateMinutes', e.target.value)}
                            >
                              {LATE_MINUTES_OPTIONS.map((m) => (
                                <MenuItem key={m} value={m}>{m} min</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}

                        {/* Observation */}
                        {att.status && (
                          <TextField
                            placeholder="Observation (optional)"
                            size="small"
                            fullWidth
                            value={att.remarks || ''}
                            onChange={(e) => updateAtt(sid, 'remarks', e.target.value)}
                          />
                        )}
                      </Box>
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || markedCount === 0}
          startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {submitting ? 'Saving…' : `Save${markedCount > 0 ? ` (${markedCount})` : ''}`}
        </Button>
      </DialogActions>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL REPORT DIALOG
// ─────────────────────────────────────────────────────────────────────────────

const PayrollDialog = ({ open, onClose }) => {
  const theme = useTheme();
  const currentDate = new Date();

  const [month,   setMonth]   = useState(String(currentDate.getMonth() + 1));
  const [year,    setYear]    = useState(String(currentDate.getFullYear()));
  const [isPaid,  setIsPaid]  = useState('');
  const [report,  setReport]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleLoad = async () => {
    setLoading(true);
    try {
      const res = await getTeacherPayrollReport({ month, year, ...(isPaid ? { isPaid } : {}) });
      const raw = res.data;
      setReport(Array.isArray(raw?.data) ? raw.data : []);
      setSummary(raw?.meta?.summary ?? null);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={800}>Payroll Report</DialogTitle>
      <DialogContent dividers>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="flex-end">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Month</InputLabel>
            <Select label="Month" value={month} onChange={(e) => setMonth(e.target.value)}>
              {monthNames.map((m, i) => (
                <MenuItem key={i + 1} value={String(i + 1)}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Year" size="small" type="number"
            value={year} onChange={(e) => setYear(e.target.value)}
            sx={{ width: 100 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Payment</InputLabel>
            <Select label="Payment" value={isPaid} onChange={(e) => setIsPaid(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="true">Paid</MenuItem>
              <MenuItem value="false">Unpaid</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={handleLoad} disabled={loading}>
            {loading ? <CircularProgress size={16} color="inherit" /> : 'Load Report'}
          </Button>
        </Stack>

        {summary && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <Stack direction="row" spacing={4} flexWrap="wrap">
              <Box>
                <Typography variant="h6" fontWeight={800}>{summary.totalTeachers}</Typography>
                <Typography variant="caption" color="text.secondary">Teachers</Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>{summary.totalHoursAll}h</Typography>
                <Typography variant="caption" color="text.secondary">Total Hours</Typography>
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="warning.main">{summary.unpaidSessionsAll}</Typography>
                <Typography variant="caption" color="text.secondary">Unpaid Sessions</Typography>
              </Box>
            </Stack>
          </Paper>
        )}

        {report.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                  <TableCell sx={{ fontWeight: 700 }}>Teacher</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Employment</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sessions</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Hours</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Unpaid</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {report.map((r) => (
                  <TableRow key={r.teacherId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {r.lastName} {r.firstName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{r.email}</Typography>
                    </TableCell>
                    <TableCell><Chip label={r.employmentType || '—'} size="small" /></TableCell>
                    <TableCell>{r.totalSessions}</TableCell>
                    <TableCell fontWeight={600}>{r.totalHours}h</TableCell>
                    <TableCell><Chip label={r.paidSessions} size="small" color="success" /></TableCell>
                    <TableCell>
                      <Chip
                        label={r.unpaidSessions}
                        size="small"
                        color={r.unpaidSessions > 0 ? 'warning' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
          </TableContainer>
        )}

        {!loading && report.length === 0 && (
          <AttendanceEmptyState message="Load a report to see payroll data." />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AttendanceManager;