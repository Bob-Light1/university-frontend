/**
 * @file PartnerFilters.jsx
 * @description Filter bar for the campus partner list.
 */

import {
  Stack, TextField, FormControl, InputLabel, Select, MenuItem, Button,
  InputAdornment,
} from '@mui/material';
import { Search, FilterListOff } from '@mui/icons-material';

const STATUS_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'active',    label: 'Active'       },
  { value: 'inactive',  label: 'Inactive'     },
  { value: 'suspended', label: 'Suspended'    },
];

const TYPE_OPTIONS = [
  { value: '',              label: 'All Types'      },
  { value: 'institutional', label: 'Institutional'  },
  { value: 'commercial',    label: 'Commercial'     },
];

const TIER_OPTIONS = [
  { value: '',          label: 'All Tiers' },
  { value: 'bronze',    label: 'Bronze'    },
  { value: 'silver',    label: 'Silver'    },
  { value: 'gold',      label: 'Gold'      },
  { value: 'platinum',  label: 'Platinum'  },
];

const SX_SELECT = { minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const PartnerFilters = ({ filters, onFilterChange, onReset }) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={1.5}
    flexWrap="wrap"
    sx={{ mb: 2 }}
  >
    {/* Search */}
    <TextField
      size="small"
      placeholder="Search name, email, code…"
      value={filters.search}
      onChange={(e) => onFilterChange('search', e.target.value)}
      sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" color="action" />
            </InputAdornment>
          ),
        },
      }}
    />

    {/* Status */}
    <FormControl size="small" sx={SX_SELECT}>
      <InputLabel>Status</InputLabel>
      <Select
        label="Status"
        value={filters.status}
        onChange={(e) => onFilterChange('status', e.target.value)}
      >
        {STATUS_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Type */}
    <FormControl size="small" sx={SX_SELECT}>
      <InputLabel>Type</InputLabel>
      <Select
        label="Type"
        value={filters.partnerType}
        onChange={(e) => onFilterChange('partnerType', e.target.value)}
      >
        {TYPE_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Tier */}
    <FormControl size="small" sx={SX_SELECT}>
      <InputLabel>Tier</InputLabel>
      <Select
        label="Tier"
        value={filters.tier}
        onChange={(e) => onFilterChange('tier', e.target.value)}
      >
        {TIER_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
        ))}
      </Select>
    </FormControl>

    {/* Reset */}
    <Button
      size="small"
      variant="outlined"
      startIcon={<FilterListOff />}
      onClick={onReset}
      sx={{ borderRadius: 2, textTransform: 'none', alignSelf: 'center' }}
    >
      Reset
    </Button>
  </Stack>
);

export default PartnerFilters;
