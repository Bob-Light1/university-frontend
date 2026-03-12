/**
 * @file DocumentFilters.jsx
 * @description Filter toolbar for the Document Management Module.
 *
 * Provides type, category, status, semester, academic year filters,
 * plus a text search field. Respects role-based type access.
 */

import {
  Box,
  Stack,
  InputAdornment,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Search, FilterAltOff } from '@mui/icons-material';

import { DOCUMENT_ENUMS, getAccessibleTypes } from './DocumentShared';

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   filters:           Object,
 *   onFilterChange:    (key: string, value: string) => void,
 *   onReset:           () => void,
 *   userRole:          string,
 *   hideTypeFilter?:   boolean,
 *   hideStatusFilter?: boolean,
 * }} props
 */
const DocumentFilters = ({
  filters,
  onFilterChange,
  onReset,
  userRole       = 'CAMPUS_MANAGER',
  hideTypeFilter = false,
  hideStatusFilter = false,
}) => {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const accessibleTypes = getAccessibleTypes(userRole);

  const hasActiveFilters = Object.entries(filters).some(
    ([key, val]) => !['page', 'limit', 'sort'].includes(key) && val !== '',
  );

  return (
    <Box sx={{ mb: 2 }}>
      <Stack
        direction={isMobile ? 'column' : 'row'}
        spacing={1.5}
        flexWrap="wrap"
        alignItems={isMobile ? 'stretch' : 'center'}
      >
        {/* Full-text search */}
        <TextField
          size="small"
          placeholder="Search documents…"
          value={filters.search ?? ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Type filter */}
        {!hideTypeFilter && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="doc-filter-type-label">Type</InputLabel>
            <Select
              labelId="doc-filter-type-label"
              id="doc-filter-type"
              label="Type"
              value={filters.type ?? ''}
              onChange={(e) => onFilterChange('type', e.target.value)}
            >
              <MenuItem value="">All types</MenuItem>
              {accessibleTypes.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Category filter */}
        <FormControl size="small" sx={{ minWidth: 155 }}>
          <InputLabel id="doc-filter-cat-label">Category</InputLabel>
          <Select
            labelId="doc-filter-cat-label"
            id="doc-filter-cat"
            label="Category"
            value={filters.category ?? ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
          >
            <MenuItem value="">All categories</MenuItem>
            {DOCUMENT_ENUMS.CATEGORY.map((c) => (
              <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status filter */}
        {!hideStatusFilter && (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="doc-filter-status-label">Status</InputLabel>
            <Select
              labelId="doc-filter-status-label"
              id="doc-filter-status"
              label="Status"
              value={filters.status ?? ''}
              onChange={(e) => onFilterChange('status', e.target.value)}
            >
              <MenuItem value="">All statuses</MenuItem>
              {DOCUMENT_ENUMS.STATUS.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Semester filter */}
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="doc-filter-sem-label">Semester</InputLabel>
          <Select
            labelId="doc-filter-sem-label"
            id="doc-filter-sem"
            label="Semester"
            value={filters.semester ?? ''}
            onChange={(e) => onFilterChange('semester', e.target.value)}
          >
            <MenuItem value="">All semesters</MenuItem>
            {DOCUMENT_ENUMS.SEMESTER.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Academic year filter */}
        <TextField
          size="small"
          placeholder="Year (e.g. 2024-2025)"
          value={filters.academicYear ?? ''}
          onChange={(e) => onFilterChange('academicYear', e.target.value)}
          sx={{ minWidth: 160 }}
        />

        {/* Reset button */}
        {hasActiveFilters && (
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<FilterAltOff />}
            onClick={onReset}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Reset
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default DocumentFilters;