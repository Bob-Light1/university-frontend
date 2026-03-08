/**
 * @file ResultFilters.jsx
 * @description Filter bar shared across result management pages.
 *
 * Props:
 *  filters            — current filter state
 *  onFilterChange     — (key, value) => void
 *  onReset            — () => void
 *  mode               — 'manager' | 'teacher' (student has no filters)
 *  classes            — array of { _id, className } for class select
 *  subjects           — array of { _id, subject_name, subject_code } for subject select
 *  teachers           — array of { _id, firstName, lastName } (manager only)
 *  loading            — disables inputs during fetch
 */

import {
  Box, Grid, TextField, MenuItem, Stack, Tooltip, IconButton,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { FilterAlt, RestartAlt } from '@mui/icons-material';

import { EVALUATION_TYPE, RESULT_STATUS, SEMESTER } from '../../yupSchema/createResultSchema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const currentYear = new Date().getFullYear();
const ACADEMIC_YEARS = Array.from({ length: 5 }, (_, i) => {
  const y = currentYear - 2 + i;
  return `${y}-${y + 1}`;
});

/**
 * Stable MenuProps — constrains dropdown height to avoid layout overflow.
 * NOTE: do NOT use displayEmpty:true here; it causes label/value overlap in MUI v6
 * when there is no explicit renderValue. Instead, we render an empty-string MenuItem
 * as the "all" option directly in the JSX.
 */
const MENU_PROPS = { PaperProps: { sx: { maxHeight: 260 } } };

// ─── Reusable select field ─────────────────────────────────────────────────────

/**
 * FilterSelect — thin wrapper around MUI TextField[select] that:
 *  - assigns a stable `id` so the InputLabel `for` attribute is valid (fixes E3)
 *  - passes `labelId` to the Select slot so MUI's aria linkage is consistent
 *  - avoids displayEmpty to prevent label/value text overlap (fixes E1)
 */

const FilterSelect = ({ id, label, value, onChange, disabled, children }) => {
  return (
    <FormControl 
      fullWidth 
      size="small" 
      disabled={disabled}
    >
      <InputLabel id={`${id}-label`}>{label}</InputLabel>
      
      <Select
        id={id}                      // ← id sur le Select → correspond au for
        labelId={`${id}-label`}     // lie le label
        value={value ?? ''}
        label={label}                // important pour le shrink
        onChange={onChange}
        MenuProps={MENU_PROPS}
      >
        {children}
      </Select>
    </FormControl>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

const ResultFilters = ({
  filters = {},
  onFilterChange,
  onReset,
  mode     = 'manager',
  classes  = [],
  subjects = [],
  teachers = [],
  loading  = false,
}) => {
  const isManager = mode === 'manager';

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        mb: 2,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
        <FilterAlt fontSize="small" color="action" />
        <Box sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.secondary' }}>
          Filters
        </Box>
      </Stack>

      <Grid container spacing={1.5}>

        {/* Academic year */}
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FilterSelect
            id="filter-academic-year"
            label="Academic Year"
            value={filters.academicYear}
            onChange={(e) => onFilterChange('academicYear', e.target.value)}
            disabled={loading}
          >
            <MenuItem value="">All years</MenuItem>
            {ACADEMIC_YEARS.map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </FilterSelect>
        </Grid>

        {/* Semester */}
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FilterSelect
            id="filter-semester"
            label="Semester"
            value={filters.semester}
            onChange={(e) => onFilterChange('semester', e.target.value)}
            disabled={loading}
          >
            <MenuItem value="">All</MenuItem>
            {SEMESTER.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </FilterSelect>
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FilterSelect
            id="filter-status"
            label="Status"
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            disabled={loading}
          >
            <MenuItem value="">All statuses</MenuItem>
            {RESULT_STATUS.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </FilterSelect>
        </Grid>

        {/* Evaluation type */}
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <FilterSelect
            id="filter-eval-type"
            label="Type"
            value={filters.evaluationType}
            onChange={(e) => onFilterChange('evaluationType', e.target.value)}
            disabled={loading}
          >
            <MenuItem value="">All types</MenuItem>
            {EVALUATION_TYPE.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </FilterSelect>
        </Grid>

        {/* Class */}
        {classes.length > 0 && (
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FilterSelect
              id="filter-class"
              label="Class"
              value={filters.classId}
              onChange={(e) => onFilterChange('classId', e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">All classes</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c._id} value={c._id}>{c.className}</MenuItem>
              ))}
            </FilterSelect>
          </Grid>
        )}

        {/* Subject */}
        {subjects.length > 0 && (
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FilterSelect
              id="filter-subject"
              label="Subject"
              value={filters.subjectId}
              onChange={(e) => onFilterChange('subjectId', e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">All subjects</MenuItem>
              {subjects.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.subject_code ? `[${s.subject_code}] ` : ''}{s.subject_name}
                </MenuItem>
              ))}
            </FilterSelect>
          </Grid>
        )}

        {/* Teacher — manager only */}
        {isManager && teachers.length > 0 && (
          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FilterSelect
              id="filter-teacher"
              label="Teacher"
              value={filters.teacherId}
              onChange={(e) => onFilterChange('teacherId', e.target.value)}
              disabled={loading}
            >
              <MenuItem value="">All teachers</MenuItem>
              {teachers.map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  {t.firstName} {t.lastName}
                </MenuItem>
              ))}
            </FilterSelect>
          </Grid>
        )}

        {/* Reset button */}
        <Grid size={{ xs: 6, sm: 'auto' }} sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <Tooltip title="Reset filters">
           <span>
             <IconButton onClick={onReset} disabled={loading} size="small">
              <RestartAlt />
             </IconButton>
           </span>
          </Tooltip>
        </Grid>

      </Grid>
    </Box>
  );
};

export default ResultFilters;