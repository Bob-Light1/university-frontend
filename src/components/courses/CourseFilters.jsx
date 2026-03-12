/**
 * @file CourseFilters.jsx
 * @description Filter bar for course list pages.
 *
 * Props:
 *  filters           {Object}   - Current filter state from useCourse
 *  onFilterChange    {Function} - (key, value) => void
 *  onReset           {Function} - Reset all filters
 *  levels            {Array}    - Level documents for level filter
 *  mode              {string}   - 'manager' | 'teacher' | 'student'
 *  loading           {boolean}
 */

import { useCallback } from 'react';
import {
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search, Clear, FilterList } from '@mui/icons-material';
import { COURSE_ENUMS } from './CourseShared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest first' },
  { value: 'createdAt_asc',  label: 'Oldest first' },
  { value: 'title_asc',      label: 'Title A → Z' },
  { value: 'title_desc',     label: 'Title Z → A' },
  { value: 'creditHours_asc', label: 'Credit hours ↑' },
  { value: 'version_desc',   label: 'Latest version' },
];

// ─── Component ───────────────────────────────────────────────────────────────

const CourseFilters = ({
  filters,
  onFilterChange,
  onReset,
  levels     = [],
  mode       = 'manager',
  loading    = false,
}) => {
  const isManager = mode === 'manager';

  const handleSearch = useCallback(
    (e) => onFilterChange('search', e.target.value),
    [onFilterChange],
  );

  const handleClearSearch = useCallback(
    () => onFilterChange('search', ''),
    [onFilterChange],
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={1.5} alignItems="center">

        {/* Search */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search courses…"
            value={filters.search || ''}
            onChange={handleSearch}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: filters.search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        </Grid>

        {/* Category */}
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="cf-category-label">Category</InputLabel>
            <Select
              labelId="cf-category-label"
              id="cf-category"
              value={filters.category || ''}
              label="Category"
              onChange={(e) => onFilterChange('category', e.target.value)}
              disabled={loading}
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {COURSE_ENUMS.CATEGORY.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Level */}
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="cf-level-label">Level</InputLabel>
            <Select
              labelId="cf-level-label"
              id="cf-level"
              value={filters.level || ''}
              label="Level"
              onChange={(e) => onFilterChange('level', e.target.value)}
              disabled={loading}
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {levels.map((l) => (
                <MenuItem key={l._id} value={l._id}>{l.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Difficulty */}
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="cf-diff-label">Difficulty</InputLabel>
            <Select
              labelId="cf-diff-label"
              id="cf-diff"
              value={filters.difficultyLevel || ''}
              label="Difficulty"
              onChange={(e) => onFilterChange('difficultyLevel', e.target.value)}
              disabled={loading}
            >
              <MenuItem value=""><em>All</em></MenuItem>
              {COURSE_ENUMS.DIFFICULTY.map((d) => (
                <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Approval status — managers only */}
        {isManager && (
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="cf-status-label">Status</InputLabel>
              <Select
                labelId="cf-status-label"
                id="cf-status"
                value={filters.approvalStatus || ''}
                label="Status"
                onChange={(e) => onFilterChange('approvalStatus', e.target.value)}
                disabled={loading}
              >
                <MenuItem value=""><em>All</em></MenuItem>
                {COURSE_ENUMS.APPROVAL_STATUS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Sort */}
        <Grid size={{ xs: 6, sm: 3, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="cf-sort-label">Sort</InputLabel>
            <Select
              labelId="cf-sort-label"
              id="cf-sort"
              value={filters.sort || 'createdAt_desc'}
              label="Sort"
              onChange={(e) => onFilterChange('sort', e.target.value)}
              disabled={loading}
            >
              {SORT_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Reset */}
        <Grid size={{ xs: 12, sm: 'auto' }}>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={onReset}
            disabled={loading}
            startIcon={<Clear fontSize="small" />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Reset
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CourseFilters;