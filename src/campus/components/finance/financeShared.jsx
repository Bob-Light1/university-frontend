/**
 * @file financeShared.jsx
 * @description Small reusable UI primitives shared across the Finance pages:
 *   - StatusChip          — coloured status badge driven by label/colour maps
 *   - CurrencySelect      — currency dropdown (XAF / USD / EUR)
 *   - PaymentMethodSelect — payment-method dropdown
 *   - PeriodSelector      — year + (optional) month filter
 *   - StudentPicker       — debounced async student search (Autocomplete)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Chip, FormControl, InputLabel, Select, MenuItem, Stack,
  Autocomplete, TextField, CircularProgress,
} from '@mui/material';

import { getStudents } from '../../../services/studentService';
import {
  CURRENCIES, PAYMENT_METHODS, MONTHS, recentYears,
} from './financeConstants';

const SX_SELECT = { minWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } };

// ─── Status chip ────────────────────────────────────────────────────────────────
/**
 * @param {{ status, labelMap, colorMap, size? }} props
 */
export const StatusChip = ({ status, labelMap = {}, colorMap = {}, size = 'small' }) => (
  <Chip
    label={labelMap[status] ?? status ?? '—'}
    color={colorMap[status] ?? 'default'}
    size={size}
    sx={{ fontWeight: 600 }}
  />
);

// ─── Currency select ──────────────────────────────────────────────────────────────
export const CurrencySelect = ({ value, onChange, name = 'currency', label = 'Currency', size = 'small', fullWidth = false }) => (
  <FormControl size={size} fullWidth={fullWidth} sx={fullWidth ? undefined : SX_SELECT}>
    <InputLabel>{label}</InputLabel>
    <Select name={name} label={label} value={value ?? ''} onChange={onChange} sx={{ borderRadius: 2 }}>
      {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
    </Select>
  </FormControl>
);

// ─── Payment-method select ────────────────────────────────────────────────────────
export const PaymentMethodSelect = ({ value, onChange, name = 'method', label = 'Method', size = 'small', fullWidth = false }) => (
  <FormControl size={size} fullWidth={fullWidth} sx={fullWidth ? undefined : SX_SELECT}>
    <InputLabel>{label}</InputLabel>
    <Select name={name} label={label} value={value ?? ''} onChange={onChange} sx={{ borderRadius: 2 }}>
      {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
    </Select>
  </FormControl>
);

// ─── Period (year + month) selector ───────────────────────────────────────────────
/**
 * @param {{ year, month, onChange, showMonth? }} props
 *   onChange(key, value) — key is 'year' | 'month'; '' clears.
 */
export const PeriodSelector = ({ year, month, onChange, showMonth = true }) => (
  <Stack direction="row" spacing={1.5} flexWrap="wrap">
    <FormControl size="small" sx={SX_SELECT}>
      <InputLabel>Year</InputLabel>
      <Select label="Year" value={year ?? ''} onChange={(e) => onChange('year', e.target.value)}>
        <MenuItem value="">All years</MenuItem>
        {recentYears().map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
      </Select>
    </FormControl>

    {showMonth && (
      <FormControl size="small" sx={SX_SELECT}>
        <InputLabel>Month</InputLabel>
        <Select label="Month" value={month ?? ''} onChange={(e) => onChange('month', e.target.value)}>
          <MenuItem value="">All months</MenuItem>
          {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
        </Select>
      </FormControl>
    )}
  </Stack>
);

// ─── Async student picker ─────────────────────────────────────────────────────────
const studentLabel = (s) =>
  s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() + (s.matricule ? ` (${s.matricule})` : '') : '';

/**
 * Debounced student search backed by GET /students?search=…
 * @param {{ value, onChange, campusId?, label?, size? }} props
 *   value/onChange manage the selected student object (or null).
 */
export const StudentPicker = ({ value, onChange, campusId, label = 'Student', size = 'small' }) => {
  const [input,   setInput]   = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOptions = useCallback(async (search) => {
    setLoading(true);
    try {
      const res = await getStudents({ search, limit: 20, ...(campusId ? { campusId } : {}) });
      setOptions(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [campusId]);

  // Debounce the keystrokes (250 ms).
  useEffect(() => {
    const id = setTimeout(() => fetchOptions(input.trim()), 250);
    return () => clearTimeout(id);
  }, [input, fetchOptions]);

  // Keep the current selection visible even before any search.
  const mergedOptions = useMemo(() => {
    if (value && !options.some((o) => o._id === value._id)) return [value, ...options];
    return options;
  }, [value, options]);

  return (
    <Autocomplete
      size={size}
      fullWidth
      value={value ?? null}
      options={mergedOptions}
      loading={loading}
      isOptionEqualToValue={(o, v) => o._id === v._id}
      getOptionLabel={studentLabel}
      onChange={(_, v) => onChange(v)}
      onInputChange={(_, v) => setInput(v)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
};
