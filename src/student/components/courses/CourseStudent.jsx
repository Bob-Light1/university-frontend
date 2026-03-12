/**
 * @file CourseStudent.jsx
 * @description Course catalog view for STUDENT role.
 *
 * Displays only APPROVED + latest-version courses.
 * Private resources (isPublic: false) are hidden server-side.
 * Students can:
 *  - Browse, filter, and search the catalog
 *  - View course detail with public resources
 *
 * Students cannot modify anything.
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
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
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  Clear,
  Visibility,
  MenuBook,
  PictureAsPdf,
  VideoLibrary,
  Link,
  Description,
  TableChart,
  Attachment,
  OpenInNew,
  School,
  AccessTime,
  Star,
} from '@mui/icons-material';

import useCourse from '../../../hooks/useCourse';
import api from '../../../api/axiosInstance';
import CourseDetailDrawer from '../../../components/courses/CourseDetailDrawer';
import {
  DifficultyChip,
  CategoryChip,
  WorkloadSummary,
  CourseEmptyState,
  COURSE_ENUMS,
} from '../../../components/courses/CourseShared';

// ─── Resource type icons ──────────────────────────────────────────────────────

const RESOURCE_ICONS = {
  PDF:         <PictureAsPdf color="error"   fontSize="small" />,
  VIDEO:       <VideoLibrary color="primary" fontSize="small" />,
  LINK:        <Link         color="info"    fontSize="small" />,
  DOCUMENT:    <Description  color="action"  fontSize="small" />,
  SPREADSHEET: <TableChart   color="success" fontSize="small" />,
  OTHER:       <Attachment   color="action"  fontSize="small" />,
};

// ─── Student course card ──────────────────────────────────────────────────────

const StudentCourseCard = ({ course, onView }) => {
  const workload = course.estimatedWorkload || {};
  const total    = (workload.lecture ?? 0) + (workload.practical ?? 0) + (workload.selfStudy ?? 0);

  return (
    <Card
      variant="outlined"
      sx={{
        height:        '100%',
        display:       'flex',
        flexDirection: 'column',
        transition:    'box-shadow 0.2s',
        '&:hover':     { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ flex: 1 }}>
        {/* Header row */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Typography variant="caption" fontWeight={700} color="primary.main" fontFamily="monospace">
            {course.courseCode}
          </Typography>
          <DifficultyChip level={course.difficultyLevel} />
        </Stack>

        {/* Title */}
        <Typography
          variant="subtitle1"
          fontWeight={700}
          mb={0.75}
          sx={{
            overflow:          'hidden',
            display:           '-webkit-box',
            WebkitLineClamp:   2,
            WebkitBoxOrient:   'vertical',
          }}
        >
          {course.title}
        </Typography>

        {/* Tags row */}
        <Stack direction="row" spacing={0.5} mb={1.5} flexWrap="wrap">
          <CategoryChip category={course.category} />
          {course.level?.name && (
            <Chip
              icon={<School fontSize="inherit" />}
              label={course.level.name}
              size="small"
              variant="outlined"
              color="secondary"
            />
          )}
        </Stack>

        {/* Description */}
        {course.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            mb={1.5}
            sx={{
              overflow:        'hidden',
              display:         '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {course.description}
          </Typography>
        )}

        {/* Stats */}
        <Stack direction="row" spacing={2} mb={1}>
          {total > 0 && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AccessTime fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">{total}h</Typography>
            </Stack>
          )}
          {course.creditHours != null && (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Star fontSize="small" color="warning" />
              <Typography variant="caption" color="text.secondary">
                {course.creditHours} credits
              </Typography>
            </Stack>
          )}
          {(course.objectives || []).length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {course.objectives.length} objective{course.objectives.length !== 1 ? 's' : ''}
            </Typography>
          )}
        </Stack>

        {/* Resources preview */}
        {(course.resources || []).length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {course.resources.length} resource{course.resources.length !== 1 ? 's' : ''} available
          </Typography>
        )}
      </CardContent>

      <Divider />
      <CardActions>
        <Button
          size="small"
          startIcon={<Visibility />}
          onClick={() => onView(course)}
          fullWidth
        >
          View course
        </Button>
      </CardActions>
    </Card>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const CourseStudent = () => {
  const course = useCourse('student');

  const [levels,       setLevels]       = useState([]);
  const [detailOpen,   setDetailOpen]   = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);

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

  const totalPages = Math.ceil(course.total / (course.filters.limit ?? 25));

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            <MenuBook sx={{ mr: 1, verticalAlign: 'middle' }} />
            Course Catalog
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Explore {course.total} approved course{course.total !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Stack>

      {/* Filters */}
      <Box
        sx={{
          display:      'flex',
          flexWrap:     'wrap',
          gap:          1,
          mb:           3,
          p:            2,
          borderRadius: 2,
          border:       1,
          borderColor:  'divider',
          bgcolor:      'background.paper',
        }}
      >
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search courses…"
          value={course.filters.search || ''}
          onChange={(e) => course.handleFilterChange('search', e.target.value)}
          disabled={course.loading}
          sx={{ flex: '1 1 200px', minWidth: 160 }}
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

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="cs-cat-lbl">Category</InputLabel>
          <Select
            labelId="cs-cat-lbl"
            id="cs-cat-sel"
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

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="cs-lvl-lbl">Level</InputLabel>
          <Select
            labelId="cs-lvl-lbl"
            id="cs-lvl-sel"
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

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="cs-diff-lbl">Difficulty</InputLabel>
          <Select
            labelId="cs-diff-lbl"
            id="cs-diff-sel"
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

        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={course.handleReset}
          startIcon={<Clear fontSize="small" />}
        >
          Reset
        </Button>
      </Box>

      {/* Loading bar */}
      {course.loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Error */}
      {course.error && (
        <Alert severity="error" sx={{ mb: 2 }}>{course.error}</Alert>
      )}

      {/* Results */}
      {!course.loading && course.courses.length === 0 ? (
        <CourseEmptyState
          message="No courses available"
          subtext="There are no approved courses matching your search."
        />
      ) : (
        <>
          <Grid container spacing={2}>
            {course.courses.map((c) => (
              <Grid key={c._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <StudentCourseCard course={c} onView={openDetail} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={course.filters.page ?? 1}
                onChange={(_, p) => course.setPage(p)}
                color="primary"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Detail drawer — read-only for students */}
      <CourseDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailTarget(null); }}
        course={detailTarget}
        onEdit={() => {}}
        onSubmit={() => {}}
        onApprove={() => {}}
        onReject={() => {}}
        onNewVersion={() => {}}
        onAddResource={() => {}}
        onRemoveResource={() => {}}
        onDelete={() => {}}
        role="STUDENT"
      />
    </Box>
  );
};

export default CourseStudent;