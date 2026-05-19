import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Chip, Avatar, CircularProgress,
  Alert, Table, TableHead, TableRow, TableCell, TableBody,
  TablePagination, MenuItem, Select, FormControl, InputLabel,
  LinearProgress, Grid,
} from '@mui/material';
import {
  ArrowBack, CheckCircle, Cancel, AccessTime,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { getMyChildren, getChildAttendance } from '../../../services/parentService';
import { IMAGE_BASE_URL } from '../../../config/env';
import { fDateWeekday } from '../../../utils/dateFormat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const profileUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

// ─── Summary Stat Box ─────────────────────────────────────────────────────────

const StatBox = ({ label, value, color, icon }) => (
  <Paper elevation={1} sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${color}`, flex: 1 }}>
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h6" fontWeight={700}>{value}</Typography>
      </Box>
    </Stack>
  </Paper>
);

// ─── Child Header ─────────────────────────────────────────────────────────────

const ChildHeader = ({ student, children, onSelect, onBack }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2, mb: 3, borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Chip
          icon={<ArrowBack sx={{ color: 'white !important' }} />}
          label="Dashboard"
          onClick={onBack}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}
        />
        {children.map((c) => (
          <Chip
            key={c._id}
            avatar={<Avatar src={profileUrl(c.profileImage)} sx={{ width: 24, height: 24 }}>{c.firstName?.[0]}</Avatar>}
            label={`${c.firstName} ${c.lastName}`}
            onClick={() => onSelect(c._id)}
            sx={{
              bgcolor: c._id === student?._id ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
              color: 'white',
              fontWeight: c._id === student?._id ? 700 : 400,
              cursor: 'pointer',
            }}
          />
        ))}
      </Stack>
      {student && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Avatar src={profileUrl(student.profileImage)} sx={{ width: 48, height: 48, border: '2px solid white' }}>
            {student.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{student.firstName} {student.lastName}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Attendance Records</Typography>
          </Box>
        </Stack>
      )}
    </Paper>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ChildAttendance = () => {
  const { studentId } = useParams();
  const navigate      = useNavigate();
  const theme         = useTheme();

  const [children,    setChildren]    = useState([]);
  const [records,     setRecords]     = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [filters,     setFilters]     = useState({ academicYear: '', semester: '', status: '' });

  const student = children.find((c) => c._id === studentId);

  useEffect(() => {
    getMyChildren()
      .then(({ data }) => setChildren(data.data?.children ?? []))
      .catch(() => {});
  }, []);

  const fetchAttendance = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    getChildAttendance(studentId, {
      page:         page + 1,
      limit:        rowsPerPage,
      academicYear: filters.academicYear || undefined,
      semester:     filters.semester     || undefined,
      status:       filters.status !== '' ? filters.status : undefined,
    })
      .then(({ data }) => {
        setRecords(data.data?.records ?? []);
        setSummary(data.data?.summary ?? null);
        setTotal(data.data?.total    ?? 0);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load attendance.'))
      .finally(() => setLoading(false));
  }, [studentId, page, rowsPerPage, filters]);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);

  const handleSelect = (id) => navigate(`/parent/children/${id}/attendance`);
  const handleBack   = () => navigate('/parent');

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <ChildHeader student={student} children={children} onSelect={handleSelect} onBack={handleBack} />

      {/* Summary KPIs */}
      {summary && (
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
          <StatBox
            label="Attendance Rate"
            value={`${summary.attendanceRate}%`}
            color={
              summary.attendanceRate >= 90 ? theme.palette.success.main :
              summary.attendanceRate >= 75 ? theme.palette.warning.main :
              theme.palette.error.main
            }
            icon={<AccessTime />}
          />
          <StatBox
            label="Present"
            value={summary.presentCount ?? 0}
            color={theme.palette.success.main}
            icon={<CheckCircle />}
          />
          <StatBox
            label="Absent"
            value={summary.absentCount ?? 0}
            color={theme.palette.error.main}
            icon={<Cancel />}
          />
          <StatBox
            label="Total Sessions"
            value={summary.totalSessions ?? 0}
            color={theme.palette.info.main}
            icon={<AccessTime />}
          />
        </Stack>
      )}

      {/* Attendance bar */}
      {summary && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Overall attendance</Typography>
            <Typography variant="caption" fontWeight={700}>{summary.attendanceRate}%</Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(summary.attendanceRate, 100)}
            sx={{
              height: 8, borderRadius: 4,
              bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor:
                  summary.attendanceRate >= 90 ? theme.palette.success.main :
                  summary.attendanceRate >= 75 ? theme.palette.warning.main :
                  theme.palette.error.main,
              },
            }}
          />
        </Box>
      )}

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Academic Year</InputLabel>
          <Select
            value={filters.academicYear}
            label="Academic Year"
            onChange={(e) => { setFilters((f) => ({ ...f, academicYear: e.target.value })); setPage(0); }}
          >
            <MenuItem value="">All Years</MenuItem>
            {['2025-2026', '2024-2025', '2023-2024'].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Semester</InputLabel>
          <Select
            value={filters.semester}
            label="Semester"
            onChange={(e) => { setFilters((f) => ({ ...f, semester: e.target.value })); setPage(0); }}
          >
            <MenuItem value="">All</MenuItem>
            {['1', '2', '3'].map((s) => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status}
            label="Status"
            onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(0); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Present</MenuItem>
            <MenuItem value="false">Absent</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Table */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>
        ) : records.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <AccessTime sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No attendance records found.</Typography>
          </Box>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell><Typography variant="caption" fontWeight={700}>Date</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Subject</Typography></TableCell>
                  <TableCell align="center"><Typography variant="caption" fontWeight={700}>Status</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Justified</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Recorded By</Typography></TableCell>
                  <TableCell><Typography variant="caption" fontWeight={700}>Year / Sem</Typography></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r._id} hover>
                    <TableCell>
                      <Typography variant="body2">{fDateWeekday(r.attendanceDate)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {r.subject?.subject_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {r.status ? (
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: 14 }} />}
                          label="Present"
                          size="small"
                          color="success"
                          sx={{ fontWeight: 600 }}
                        />
                      ) : (
                        <Chip
                          icon={<Cancel sx={{ fontSize: 14 }} />}
                          label="Absent"
                          size="small"
                          color="error"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {r.isJustified ? (
                        <Chip label="Justified" size="small" color="warning" variant="outlined" />
                      ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {r.recordedBy ? `${r.recordedBy.firstName} ${r.recordedBy.lastName}` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {r.academicYear}{r.semester ? ` · S${r.semester}` : ''}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              rowsPerPageOptions={[10, 20, 50]}
            />
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ChildAttendance;
