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

import { useState, useCallback } from 'react';
import {
  Box, Typography, Tabs, Tab, Stack, Chip, Button,
  Alert, CircularProgress, Paper, Grid, Snackbar,
  alpha, useTheme, Dialog, DialogTitle, DialogContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, TablePagination, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem,
  DialogActions,
} from '@mui/material';
import {
  People, School, Lock, Refresh, Search,
  CheckCircle, Cancel, HelpOutline, AttachMoney, Visibility,
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
  AttendanceRateGauge,
} from '../../../components/attendance/AttendanceShared';
import {
  getTeacherPayrollReport,
  getTeacherAttendanceCampusStats,
  getStudentAttendanceCampusOverview,
} from '../../../services/attendance.service';

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const AttendanceManager = () => {
  const theme = useTheme();
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
        <Tab value={0} label="Students" icon={<People />} iconPosition="start" />
        <Tab value={1} label="Teachers" icon={<School />} iconPosition="start" />
      </Tabs>

      {tab === 0 && <StudentAttendanceTab />}
      {tab === 1 && <TeacherAttendanceTab />}
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
  const [search,         setSearch]         = useState('');

  const {
    records, summary, loading, error, pagination,
    filters, handleFilterChange, fetch, toggleStudent, justifyStudent, setPage,
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
                        ? new Date(record.attendanceDate).toLocaleDateString('en-GB')
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

  const {
    records, summary, loading, error, pagination,
    fetch, toggleTeacher, justifyTeacher, markPaid, setPage,
    handleFilterChange,
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

  const handleMarkPaid = async (record) => {
    const ref = prompt('Enter payment reference:');
    if (!ref?.trim()) return;
    try {
      await markPaid(record._id, ref.trim());
      showSnackbar('Session marked as paid.', 'success');
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
          <Button onClick={() => { setDateFrom(''); setDateTo(''); setStatusFilter(''); setIsPaidFilter(''); }}>Reset</Button>
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
                        ? new Date(record.attendanceDate).toLocaleDateString('en-GB')
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