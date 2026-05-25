import FilterBar from '../shared/FilterBar';
import { SESSION_TYPE_OPTIONS } from '../../theme/scheduleTokens';

const STATUS_OPTIONS = [
  { value: 'DRAFT',     label: 'Draft'     },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'POSTPONED', label: 'Postponed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SEMESTER_OPTIONS = [
  { value: 'S1',     label: 'Semester 1' },
  { value: 'S2',     label: 'Semester 2' },
  { value: 'Annual', label: 'Annual'     },
];

/**
 * Schedule-specific filter bar — wraps the shared FilterBar with
 * the correct filter definitions for every schedule view.
 */
const ScheduleFilters = ({
  searchValue,
  onSearchChange,
  filterValues,
  onFilterChange,
  onReset,
  onExport,
  onImport,
  showImport = false,
}) => {
  const filters = [
    { key: 'status',      label: 'Status',       type: 'select', options: STATUS_OPTIONS       },
    { key: 'semester',    label: 'Semester',      type: 'select', options: SEMESTER_OPTIONS     },
    { key: 'sessionType', label: 'Session Type',  type: 'select', options: SESSION_TYPE_OPTIONS },
    { key: 'dateFrom',    label: 'From',          type: 'date'                                  },
    { key: 'dateTo',      label: 'To',            type: 'date'                                  },
  ];

  return (
    <FilterBar
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      filters={filters}
      filterValues={filterValues}
      onFilterChange={onFilterChange}
      onReset={onReset}
      onExport={onExport}
      onImport={showImport ? onImport : undefined}
      searchPlaceholder="Search by subject, teacher, room…"
    />
  );
};

export default ScheduleFilters;