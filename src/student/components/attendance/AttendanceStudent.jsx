/**
 * @file AttendanceStudent.jsx
 * @description Attendance self-service page for students.
 *
 * Features:
 *  - Attendance statistics (rate, present/absent/justified counts)
 *  - Full attendance history table with justification viewer
 *  - Period filters (academic year, semester, date range)
 *
 * Role: STUDENT
 *
 * Route: /student/attendance
 */

import { useState, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Chip, Alert,
  CircularProgress, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button,
  alpha, useTheme, Grid, Tooltip,
} from '@mui/material';
import {
  CheckCircle, Cancel, HelpOutline, CalendarMonth,
  TrendingUp, School,
} from '@mui/icons-material';

import KPICards          from '../../../components/shared/KpiCard';
import useAttendance     from '../../../hooks/useAttendance';
import {
  AttendanceStatusChip,
  AttendanceRateGauge,
  AttendanceEmptyState,
  AttendanceSelfFilters,
  AttendanceLinearBar,
  JustificationDialog,
} from '../../../components/attendance/AttendanceShared';
import { getMyStudentAttendanceStats } from '../../../services/attendance.service';

// ─────────────────────────────────────────────────────────────────────────────

const AttendanceStudent = () => {
  const theme = useTheme();

  const { records, loading, error, filters, handleFilterChange } =
    useAttendance('student-self');

  const [statsData,    setStatsData]    = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [viewRecord,   setViewRecord]   = useState(null); // view justification

  const loadStats = useCallback(async () => {
    if (!filters.academicYear || !filters.semester) return;
    setStatsLoading(true);
    try {
      const res = await getMyStudentAttendanceStats({
        academicYear: filters.academicYear,
        semester:     filters.semester,
        period:       filters.period || 'all',
      });
      setStatsData(res.data?.data ?? null);
    } finally {
      setStatsLoading(false);
    }
  }, [filters.academicYear, filters.semester, filters.period]);

  // KPI cards built from stats API response
  const kpis = statsData ? [
    {
      key:   'total',
      label: 'Total Sessions',
      value: statsData.totalSessions,
      icon:  <CalendarMonth />,
      color: theme.palette.grey[700],
    },
    {
      key:   'present',
      label: 'Present',
      value: statsData.presentCount,
      icon:  <CheckCircle />,
      color: theme.palette.success.main,
    },
    {
      key:   'absent',
      label: 'Absent',
      value: statsData.absentCount,
      icon:  <Cancel />,
      color: theme.palette.error.main,
    },
    {
      key:   'justified',
      label: 'Justified',
      value: statsData.justifiedAbsences,
      icon:  <HelpOutline />,
      color: theme.palette.info.main,
    },
  ] : [];

  const attendanceRate = statsData?.attendanceRate ?? 0;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight={800}>My Attendance</Typography>
        <Typography variant="body2" color="text.secondary">
          View your attendance history and track your presence across all subjects
        </Typography>
      </Box>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} alignItems="flex-end" flexWrap="wrap">
        <AttendanceSelfFilters filters={filters} onChange={handleFilterChange} />
        <Button
          variant="contained"
          onClick={loadStats}
          disabled={!filters.academicYear || !filters.semester || statsLoading}
        >
          {statsLoading ? <CircularProgress size={16} color="inherit" /> : 'View Stats'}
        </Button>
      </Stack>

      {/* Stats section */}
      {statsData && (
        <Box mb={4}>
          {/* Rate gauge + KPI cards */}
          <Grid container spacing={3} alignItems="stretch">
            {/* Gauge */}
            <Grid item xs={12} sm={4} md={3}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3, textAlign: 'center', borderRadius: 3, height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(
                    attendanceRate >= 80
                      ? theme.palette.success.main
                      : attendanceRate >= 60
                        ? theme.palette.warning.main
                        : theme.palette.error.main,
                    0.05,
                  ),
                }}
              >
                <AttendanceRateGauge rate={attendanceRate} size={80} />
                <Typography variant="body2" fontWeight={600} mt={1}>
                  Attendance Rate
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {filters.period === 'week' ? 'This week'
                    : filters.period === 'month' ? 'This month'
                    : `${filters.semester} — ${filters.academicYear}`}
                </Typography>

                {/* Contextual message */}
                <Box mt={2}>
                  {attendanceRate < 60 && (
                    <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
                      Your attendance is critically low. Please contact your class coordinator.
                    </Alert>
                  )}
                  {attendanceRate >= 60 && attendanceRate < 80 && (
                    <Alert severity="warning" sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
                      Your attendance needs improvement to meet the minimum requirement.
                    </Alert>
                  )}
                  {attendanceRate >= 80 && (
                    <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.75rem' }}>
                      Good attendance! Keep it up.
                    </Alert>
                  )}
                </Box>
              </Paper>
            </Grid>

            {/* KPI cards */}
            <Grid item xs={12} sm={8} md={9}>
              <KPICards metrics={kpis} />
              <Box mt={2}>
                <AttendanceLinearBar rate={attendanceRate} label="Overall attendance rate" />
              </Box>
              {statsData.unjustifiedAbsences > 0 && (
                <Box mt={1}>
                  <AttendanceLinearBar
                    rate={
                      statsData.totalSessions > 0
                        ? ((statsData.totalSessions - statsData.unjustifiedAbsences) / statsData.totalSessions) * 100
                        : 0
                    }
                    label={`Unjustified absences: ${statsData.unjustifiedAbsences}`}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Attendance history table */}
      <Typography variant="h6" fontWeight={700} mb={2}>Attendance History</Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : records.length === 0 ? (
        <AttendanceEmptyState
          message={
            !filters.academicYear
              ? 'Select an academic year and semester to view your attendance records.'
              : 'No attendance records found for the selected period.'
          }
        />
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Session</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Class</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Justification</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow
                  key={record._id}
                  hover
                  sx={{
                    bgcolor: record.status
                      ? 'transparent'
                      : record.isJustified
                        ? alpha(theme.palette.info.main, 0.03)
                        : alpha(theme.palette.error.main, 0.03),
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {record.attendanceDate
                        ? new Date(record.attendanceDate).toLocaleDateString('en-GB', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {record.sessionStartTime && record.sessionEndTime
                        ? `${record.sessionStartTime} – ${record.sessionEndTime}`
                        : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{record.class?.className || '—'}</Typography>
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
                      <Tooltip title="View justification details">
                        <Chip
                          label="View"
                          size="small"
                          color="info"
                          onClick={() => setViewRecord(record)}
                          clickable
                        />
                      </Tooltip>
                    ) : record.status ? (
                      '—'
                    ) : (
                      <Typography variant="caption" color="error.main">
                        No justification
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* View justification — read-only for students */}
      <JustificationDialog
        open={Boolean(viewRecord)}
        record={viewRecord}
        onClose={() => setViewRecord(null)}
        onSubmit={async () => {}}  // No-op: students cannot edit justifications
        readOnly
      />
    </Box>
  );
};

export default AttendanceStudent;