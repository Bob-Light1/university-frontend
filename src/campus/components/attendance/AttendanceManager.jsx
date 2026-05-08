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
  DialogActions, Autocomplete,
} from '@mui/material';
import {
  People, School, Refresh,
  CheckCircle, Cancel, HelpOutline, AttachMoney,
  SwapHoriz, ThumbUp, ThumbDown, Add,
} from '@mui/icons-material';

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
} from '../../../services/attendance.service';
import {
  getAdminPostponements,
  reviewPostponement,
  getTeacherSessionsAdmin,
} from '../../../services/schedule.service';
import { getTeachers } from '../../../services/teacher.service';
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
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [justifyTarget,  setJustifyTarget]  = useState(null);
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('');

  const {
    records, summary, loading, error, pagination,
    handleFilterChange, fetch, toggleStudent, justifyStudent, setPage,
  } = useAttendance('manager-student');

  // Apply filters
  const handleSearch = () => {
    handleFilterChange('from', dateFrom);
    handleFilterChange('to', dateTo);
    handleFilterChange('status', statusFilter);
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
    { key: 'total',     label: 'Total Records', value: summary.total,     icon: <People />,      color: theme.palette.grey[700] },
    { key: 'present',   label: 'Present',       value: summary.present,   icon: <CheckCircle />, color: theme.palette.success.main },
    { key: 'absent',    label: 'Absent',        value: summary.absent,    icon: <Cancel />,      color: theme.palette.error.main },
    { key: 'rate',      label: 'Attendance Rate', value: `${summary.rate}%`, icon: <HelpOutline />, color: theme.palette.primary.main },
  ];

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box mb={3}>
        <KPICards metrics={kpis} loading={loading} />
      </Box>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end" flexWrap="wrap">
          <TextField
            label="From"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
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
          <Button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); handleFilterChange('from', ''); handleFilterChange('to', ''); handleFilterChange('status', ''); }}>
            Reset
          </Button>
          <IconButton onClick={fetch} title="Refresh"><Refresh /></IconButton>
        </Stack>
      </Paper>

      {/* Summary bar */}
      <Box mb={2}>
        <AttendanceSummaryBar summary={summary} />
      </Box>

      {/* Table */}
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
                      {record.attendanceDate
                        ? fDate(record.attendanceDate)
                        : '—'}
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
            onPageChange={(_, page) => setPage(page + 1)}
            rowsPerPageOptions={[50]}
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

  const {
    records, summary, loading, error, pagination,
    fetch, toggleTeacher, justifyTeacher, markPaid, setPage,
    handleFilterChange, handleReset,
  } = useAttendance('manager-teacher');

  const handleSearch = () => {
    handleFilterChange('from', dateFrom);
    handleFilterChange('to', dateTo);
    handleFilterChange('status', statusFilter);
    handleFilterChange('isPaid', isPaidFilter);
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
    if (record.isLocked) {
      showSnackbar('Cannot modify a locked record.', 'warning');
      return;
    }
    try {
      await toggleTeacher(record._id, !record.status);
      showSnackbar('Attendance updated.', 'success');
    } catch {
      showSnackbar('Failed to update attendance.', 'error');
    }
  };

  const handleMarkPaid = (record) => {
    setPayRefTarget(record);
    setPayRef('');
    setPayRefOpen(true);
  };

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
    { key: 'total',   label: 'Total Sessions', value: summary.total,     icon: <School />,      color: theme.palette.grey[700] },
    { key: 'present', label: 'Present',        value: summary.present,   icon: <CheckCircle />, color: theme.palette.success.main },
    { key: 'absent',  label: 'Absent',         value: summary.absent,    icon: <Cancel />,      color: theme.palette.error.main },
    { key: 'rate',    label: 'Attendance Rate', value: `${summary.rate}%`, icon: <HelpOutline />, color: theme.palette.primary.main },
  ];

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box mb={3}>
        <KPICards metrics={kpis} loading={loading} />
      </Box>

      {/* Filters */}
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
          <Button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setIsPaidFilter(''); handleReset(); }}>Reset</Button>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={() => setInitOpen(true)}
          >
            Init Attendance
          </Button>
          <Button
            variant="outlined"
            startIcon={<AttachMoney />}
            onClick={() => setPayrollOpen(true)}
          >
            Payroll Report
          </Button>
          <IconButton onClick={fetch} title="Refresh"><Refresh /></IconButton>
        </Stack>
      </Paper>

      <Box mb={2}>
        <AttendanceSummaryBar summary={summary} />
      </Box>

      {/* Table */}
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
                      {record.attendanceDate
                        ? fDate(record.attendanceDate)
                        : '—'}
                    </Typography>
                    {record.isLocked && <LockedBadge lockedAt={record.lockedAt} />}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {record.sessionStartTime} – {record.sessionEndTime}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <AttendanceStatusChip status={record.status} isJustified={record.isJustified} />
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
                      <Tooltip title={record.status ? 'Mark absent' : 'Mark present'}>
                        <span>
                          <IconButton
                            size="small"
                            color={record.status ? 'error' : 'success'}
                            onClick={() => handleToggleTeacher(record)}
                            disabled={record.isLocked}
                          >
                            {record.status
                              ? <Cancel fontSize="small" />
                              : <CheckCircle fontSize="small" />}
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
            onPageChange={(_, page) => setPage(page + 1)}
            rowsPerPageOptions={[50]}
          />
        </TableContainer>
      )}

      {/* Payment reference dialog */}
      <Dialog
        open={payRefOpen}
        onClose={() => setPayRefOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>Mark Session as Paid</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            label="Payment reference"
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
            size="small"
            onKeyDown={(e) => e.key === 'Enter' && handlePayRefConfirm()}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPayRefOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePayRefConfirm}
            disabled={!payRef.trim()}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Init attendance dialog */}
      {initOpen && (
        <InitAttendanceDialog
          open={initOpen}
          onClose={() => setInitOpen(false)}
          onSuccess={() => { setInitOpen(false); fetch(); }}
        />
      )}

      {/* Payroll report dialog */}
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
// INIT ATTENDANCE DIALOG
// ─────────────────────────────────────────────────────────────────────────────

const SEMESTERS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

const InitAttendanceDialog = ({ open, onClose, onSuccess }) => {
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  // Step 1 — teacher + date
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [teacherInput,   setTeacherInput]   = useState('');
  const [teacher,        setTeacher]        = useState(null);
  const [date,           setDate]           = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  // Step 2 — session list
  const [sessions,       setSessions]       = useState([]);
  const [sessionsLoading,setSessionsLoading]= useState(false);
  const [session,        setSession]        = useState(null);

  // Step 3 — derived / editable fields
  const [classId,        setClassId]        = useState('');
  const [academicYear,   setAcademicYear]   = useState('');
  const [semester,       setSemester]       = useState('S1');

  const [submitting,     setSubmitting]     = useState(false);

  // Search teachers (debounced by typing)
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await getTeachers({ search: teacherInput, limit: 20 });
        const raw = res.data;
        const list = Array.isArray(raw?.data) ? raw.data : [];
        setTeacherOptions(list);
      } catch {
        setTeacherOptions([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [teacherInput]);

  // Load sessions when teacher + date are set
  useEffect(() => {
    if (!teacher || !date) { setSessions([]); setSession(null); return; }
    setSessionsLoading(true);
    setSession(null);
    getTeacherSessionsAdmin(teacher._id, { from: date, to: date, includeAllStatuses: 'true' })
      .then((res) => {
        const raw = res.data;
        const list = Array.isArray(raw?.data) ? raw.data : [];
        setSessions(list);
      })
      .catch(() => setSessions([]))
      .finally(() => setSessionsLoading(false));
  }, [teacher, date]);

  // Auto-fill fields when session is selected
  useEffect(() => {
    if (!session) return;
    // Use first class if available
    const firstClass = Array.isArray(session.classes) && session.classes.length > 0
      ? session.classes[0]
      : null;
    setClassId(firstClass?.classId ? String(firstClass.classId) : '');
    setAcademicYear(session.academicYear || '');
    setSemester(session.semester || 'S1');
  }, [session]);

  const canSubmit = teacher && session && classId && academicYear && semester;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const startDt = new Date(session.startTime);
      const endDt   = new Date(session.endTime);
      const pad = (n) => String(n).padStart(2, '0');
      const toTimeStr = (dt) => `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

      await initTeacherAttendance(session._id, {
        teacherId:        String(teacher._id),
        classId,
        subjectId:        String(session.subject?.subjectId ?? session.subject?._id ?? ''),
        attendanceDate:   date,
        academicYear,
        semester,
        sessionStartTime: toTimeStr(startDt),
        sessionEndTime:   toTimeStr(endDt),
      });
      showSnackbar('Attendance record initialised.', 'success');
      setTimeout(onSuccess, 800);
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to initialise attendance.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>Init Teacher Attendance</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          {/* Teacher search */}
          <Autocomplete
            options={teacherOptions}
            getOptionLabel={(o) => `${o.lastName || ''} ${o.firstName || ''}`.trim() || o.email || String(o._id)}
            value={teacher}
            onChange={(_, v) => setTeacher(v)}
            inputValue={teacherInput}
            onInputChange={(_, v) => setTeacherInput(v)}
            filterOptions={(x) => x}
            noOptionsText="No teachers found"
            renderInput={(params) => (
              <TextField {...params} label="Teacher" size="small" />
            )}
          />

          {/* Date */}
          <TextField
            label="Session date"
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {/* Session selector */}
          <FormControl size="small" disabled={!teacher || sessionsLoading}>
            <InputLabel>Session</InputLabel>
            <Select
              label="Session"
              value={session?._id || ''}
              onChange={(e) => {
                const s = sessions.find((x) => String(x._id) === e.target.value);
                setSession(s || null);
              }}
            >
              {sessions.length === 0 && (
                <MenuItem disabled value="">
                  {sessionsLoading ? 'Loading…' : 'No sessions on this date'}
                </MenuItem>
              )}
              {sessions.map((s) => {
                const start = fTime(s.startTime);
                const end   = fTime(s.endTime);
                return (
                  <MenuItem key={String(s._id)} value={String(s._id)}>
                    {start}–{end} · {s.subject?.subject_name || s.reference || String(s._id)}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Class ID — auto-filled, editable override */}
          <TextField
            label="Class ID"
            size="small"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            helperText="Auto-filled from session. Override if needed."
          />

          {/* Academic year + semester */}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Academic year"
              size="small"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              placeholder="2024-2025"
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Semester</InputLabel>
              <Select
                label="Semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              >
                {SEMESTERS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : null}
        >
          Create Record
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