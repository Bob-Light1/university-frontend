/**
 * @file CourseTeacher.jsx
 * @description Course catalog view for TEACHER role.
 *
 * Displays all APPROVED + latest-version courses.
 * Teachers can:
 *  - Browse, filter, and search the global catalog
 *  - View full course detail (syllabus, objectives, all resources)
 *  - Add resources (non-public resources visible to staff)
 *
 * Teachers cannot create, edit, approve, or delete courses.
 * Campus isolation: irrelevant for the global catalog (backend enforced).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Snackbar,
  Tooltip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Clear,
  Visibility,
  MenuBook,
  Refresh,
} from '@mui/icons-material';

import useCourse from '../../../hooks/useCourse';
import { addCourseResource } from '../../../services/course.service';
import api from '../../../api/axiosInstance';

import CourseDetailDrawer from '../../../components/courses/CourseDetailDrawer';
import {
  ApprovalStatusChip,
  DifficultyChip,
  CategoryChip,
  WorkloadSummary,
  CourseEmptyState,
  COURSE_ENUMS,
} from '../../../components/courses/CourseShared';

// ─── Course card ──────────────────────────────────────────────────────────────

const CourseCard = ({ course, onView }) => (
  <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <CardContent sx={{ flex: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Typography variant="caption" fontWeight={700} color="text.secondary" fontFamily="monospace">
          {course.courseCode}
        </Typography>
        <DifficultyChip level={course.difficultyLevel} />
      </Stack>

      <Typography variant="subtitle2" fontWeight={700} mb={0.5} sx={{
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {course.title}
      </Typography>

      <Stack direction="row" spacing={0.5} mb={1} flexWrap="wrap">
        <CategoryChip category={course.category} />
        <Chip label={course.level?.name ?? '—'} size="small" variant="outlined" color="secondary" />
      </Stack>

      {course.description && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {course.description}
        </Typography>
      )}

      <Box mt={1}>
        <WorkloadSummary workload={course.estimatedWorkload} />
      </Box>
    </CardContent>
    <CardActions sx={{ pt: 0 }}>
      <Button size="small" startIcon={<Visibility />} onClick={() => onView(course)}>
        View details
      </Button>
      {course.creditHours != null && (
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {course.creditHours} credits
        </Typography>
      )}
    </CardActions>
  </Card>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const CourseTeacher = () => {
  const course = useCourse('teacher');

  const [levels,       setLevels]       = useState([]);
  const [detailOpen,   setDetailOpen]   = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [snackbar,     setSnackbar]     = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Load levels for filter
  useEffect(() => {
    api.get('/level', { params: { limit: 100 } })
      .then((res) => setLevels(res.data?.data ?? res.data?.records ?? []))
      .catch(() => {});
  }, []);

  // Fetch on filter change
  useEffect(() => {
    course.fetch();
  }, [course.filters]);

  const openDetail = async (c) => {
    try {
      const detail = await course.fetchById(c._id);
      setDetailTarget(detail);
    } catch {
      setDetailTarget(c);
    }
    setDetailOpen(true);
  };

  const handleAddResource = async (courseId, res) => {
    try {
      await addCourseResource(courseId, res);
      showSnackbar('Resource added successfully.');
      // Refresh detail
      if (detailTarget?._id === courseId) {
        const updated = await course.fetchById(courseId);
        setDetailTarget(updated);
      }
    } catch (err) {
      throw err; // Let drawer handle the error display
    }
  };

  const totalPages = Math.ceil(course.total / (course.filters.limit ?? 25));

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Course Catalog</Typography>
          <Typography variant="body2" color="text.secondary">
            Browse approved courses available for your classes
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <span>
            <IconButton size="small" onClick={() => course.fetch()} disabled={course.loading}>
              <Refresh fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* Filters (simplified for teachers) */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid size={{ xs: 12, sm: 5, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search courses…"
              value={course.filters.search || ''}
              onChange={(e) => course.handleFilterChange('search', e.target.value)}
              disabled={course.loading}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                endAdornment: course.filters.search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => course.handleFilterChange('search', '')}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="ct-cat-lbl">Category</InputLabel>
              <Select
                labelId="ct-cat-lbl"
                id="ct-cat-sel"
                value={course.filters.category || ''}
                label="Category"
                onChange={(e) => course.handleFilterChange('category', e.target.value)}
              >
                <MenuItem value=""><em>All</em></MenuItem>
                {COURSE_ENUMS.CATEGORY.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="ct-lvl-lbl">Level</InputLabel>
              <Select
                labelId="ct-lvl-lbl"
                id="ct-lvl-sel"
                value={course.filters.level || ''}
                label="Level"
                onChange={(e) => course.handleFilterChange('level', e.target.value)}
              >
                <MenuItem value=""><em>All</em></MenuItem>
                {levels.map((l) => (
                  <MenuItem key={l._id} value={l._id}>{l.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="ct-diff-lbl">Difficulty</InputLabel>
              <Select
                labelId="ct-diff-lbl"
                id="ct-diff-sel"
                value={course.filters.difficultyLevel || ''}
                label="Difficulty"
                onChange={(e) => course.handleFilterChange('difficultyLevel', e.target.value)}
              >
                <MenuItem value=""><em>All</em></MenuItem>
                {COURSE_ENUMS.DIFFICULTY.map((d) => (
                  <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 'auto' }}>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              onClick={course.handleReset}
              startIcon={<Clear fontSize="small" />}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error */}
      {course.error && (
        <Alert severity="error" sx={{ mb: 2 }}>{course.error}</Alert>
      )}

      {/* Results count */}
      <Typography variant="body2" color="text.secondary" mb={2}>
        {course.total} course{course.total !== 1 ? 's' : ''} found
      </Typography>

      {/* Card grid */}
      {course.loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={36} />
        </Box>
      ) : course.courses.length === 0 ? (
        <CourseEmptyState
          message="No courses available"
          subtext="No approved courses match your current filters."
        />
      ) : (
        <>
          <Grid container spacing={2}>
            {course.courses.map((c) => (
              <Grid key={c._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <CourseCard course={c} onView={openDetail} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={course.filters.page ?? 1}
                onChange={(_, p) => course.setPage(p)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Detail drawer */}
      <CourseDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailTarget(null); }}
        course={detailTarget}
        onEdit={() => {}}         // Teachers cannot edit
        onSubmit={() => {}}       // Teachers cannot submit
        onApprove={() => {}}
        onReject={() => {}}
        onNewVersion={() => {}}
        onAddResource={handleAddResource}
        onRemoveResource={() => {}}
        onDelete={() => {}}
        role="TEACHER"
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
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

export default CourseTeacher;