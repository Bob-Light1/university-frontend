import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Stack,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Collapse,
  useTheme,
  useMediaQuery,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Search,
  FilterList,
  Close,
  Refresh,
  FileDownload,
  FileUpload,
} from '@mui/icons-material';

/**
 * REUSABLE ADVANCED FILTER BAR COMPONENT - FIXED
 * 
 * @param {String} searchValue - Current search value
 * @param {Function} onSearchChange - Search change handler
 * @param {Array|Function} filters - Array of filter configurations (or function that returns array)
 * @param {Object} filterValues - Current filter values
 * @param {Function} onFilterChange - Filter change handler
 * @param {Function} onReset - Reset all filters
 * @param {Function} onExport - Export action
 * @param {Function} onImport - Import action
 * @param {String} searchPlaceholder - Search input placeholder
 */

const FilterBar = ({
  searchValue,
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onReset,
  onExport,
  onImport,
  searchPlaceholder = 'Search...',
  showActions = true,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ========================================
  // Normalize filters to array
  // ========================================
  const filtersArray = useMemo(() => {
    // If filters is a function, call it (with empty args)
    if (typeof filters === 'function') {
      console.warn('[FilterBar] Received function for filters prop. Calling it with empty args.');
      try {
        const result = filters();
        return Array.isArray(result) ? result : [];
      } catch (err) {
        console.error('[FilterBar] Error calling filters function:', err);
        return [];
      }
    }
    
    // If filters is not an array, return empty array
    if (!Array.isArray(filters)) {
      console.warn('[FilterBar] filters prop must be an array, received:', typeof filters);
      return [];
    }
    
    return filters;
  }, [filters]);

  // Count active filters
  const activeFiltersCount = Object.values(filterValues).filter(
    (v) => v !== '' && v !== null && v !== undefined
  ).length;


  // ========================================
  // Use filtersArray instead of filters
  // ========================================
  const getActiveFilterChips = useMemo(() => {
    return filtersArray
      .filter((f) => filterValues[f.key])
      .map((f) => ({
        key: f.key,
        label: f.label,
        value: f.options?.find((opt) => opt.value === filterValues[f.key])?.label || filterValues[f.key],
      }));
  }, [filtersArray, filterValues]);

   // Handle filter removal via chip
  const handleRemoveFilter = (filterKey) => {
    if (onFilterChange) {
      onFilterChange(filterKey, '');
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2 }}>
        {/* Main Search Bar */}
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            {/* Search Input */}
            <TextField
              fullWidth
              id="global-search"                    // ← id fixe → très recommandé
              label="Global search"
              placeholder={searchPlaceholder}
              value={searchValue || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchValue && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => onSearchChange && onSearchChange('')}>
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />

            {/* Action Buttons */}
            <Stack direction="row" spacing={1} flexShrink={0}>
              {/* Advanced Filters Toggle */}
              {filtersArray.length > 0 && (
                <Tooltip title="Advanced Filters">
                  <Button
                    variant={showAdvanced ? 'contained' : 'outlined'}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    startIcon={<FilterList />}
                    sx={{
                      minWidth: isMobile ? 'auto' : 140,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    {!isMobile && 'Filters'}
                    {activeFiltersCount > 0 && (
                      <Chip
                        label={activeFiltersCount}
                        size="small"
                        sx={{
                          ml: 1,
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: theme.palette.primary.dark,
                        }}
                      />
                    )}
                  </Button>
                </Tooltip>
              )}

              {/* Reset Filters */}
              {activeFiltersCount > 0 && onReset && (
                <Tooltip title="Reset Filters">
                  <IconButton
                    color="error"
                    onClick={onReset}
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.error.main}`,
                    }}
                  >
                    <Refresh />
                  </IconButton>
                </Tooltip>
              )}

              {/* Import/Export Actions */}
              {showActions && !isMobile && (
                <>
                  {onExport && (
                    <Tooltip title="Export">
                      <IconButton
                        color="primary"
                        onClick={onExport}
                        sx={{
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.primary.main}`,
                        }}
                      >
                        <FileDownload />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onImport && (
                    <Tooltip title="Import">
                      <IconButton
                        color="secondary"
                        onClick={onImport}
                        sx={{
                          borderRadius: 2,
                          border: `1px solid ${theme.palette.secondary.main}`,
                        }}
                      >
                        <FileUpload />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </Stack>
          </Stack>

          {/* Active Filter Chips */}
          {getActiveFilterChips.length > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {getActiveFilterChips.map((chip) => (
                <Chip
                  key={chip.key}
                  label={`${chip.label}: ${chip.value}`}
                  onDelete={() => handleRemoveFilter(chip.key)}
                  size="small"
                  sx={{ borderRadius: 1.5 }}
                />
              ))}
            </Stack>
          )}

          {/* Advanced Filters - Collapsible */}
          {filtersArray.length > 0 && (
            <Collapse in={showAdvanced}>
              <Box
                sx={{
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={2}
                  flexWrap="wrap"
                  useFlexGap
                >
                  {filtersArray.map((filter) => {
                    if (filter.type === 'select' && !(filter.options?.length > 0)) return null;
                    
                    const fieldSx = {
                      minWidth: 200,
                      flex: { xs: '1 1 100%', sm: '1 1 200px' },
                      '& .MuiOutlinedInput-root': { borderRadius: 2 },
                    };
                    
                    if (filter.type === 'select') {
                      const labelId = `filter-${filter.key}-label`;
                      const inputId = `filter-${filter.key}`;

                      return (
                        <FormControl key={filter.key} size="small" sx={fieldSx}>
                          <InputLabel id={labelId}>{filter.label}</InputLabel>
                          <Select
                            labelId={labelId}
                            id={inputId}
                            name={filter.key}
                            value={filterValues[filter.key] || ''}
                            label={filter.label}
                            onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                          >
                            {filter.options.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      );
                    }

                    // ── Text / date / number filter ───────────────────────
                    return (
                      <TextField
                        key={filter.key}
                        id={`filter-${filter.key}`}
                        label={filter.label}
                        type={filter.type || 'text'}
                        value={filterValues[filter.key] || ''}
                        onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                        size="small"
                        sx={fieldSx}
                        slotProps={{
                        input: {
                          id: inputId,
                        },
                        inputLabel: {
                          shrink: filter.type === 'date',
                        }
                      }}
                      />
                    );
                  })}
                </Stack>
              </Box>
            </Collapse>
          )}
        </Stack>
      </Box>

      {/* Mobile Actions - Bottom */}
      {showActions && isMobile && (onExport || onImport) && (
        <Box
          sx={{
            p: 2,
            bgcolor: 'background.neutral',
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" spacing={1} justifyContent="center">
            {onExport && (
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={onExport}
                size="small"
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Export
              </Button>
            )}
            {onImport && (
              <Button
                variant="outlined"
                startIcon={<FileUpload />}
                onClick={onImport}
                size="small"
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Import
              </Button>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};

export default FilterBar;