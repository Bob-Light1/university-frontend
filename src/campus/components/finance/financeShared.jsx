/**
 * @file financeShared.jsx
 * @description Small reusable UI primitives shared across the Finance pages:
 *   - StatusChip          — coloured status badge driven by label/colour maps
 *   - ReceiptButton       — per-row PDF receipt download of a payment
 *   - CurrencySelect      — currency dropdown (XAF / USD / EUR)
 *   - PaymentMethodSelect — payment-method dropdown
 *   - PeriodSelector      — year + (optional) month filter
 *   - StudentPicker       — debounced async student search (Autocomplete)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chip, FormControl, InputLabel, Select, MenuItem, Stack,
  Autocomplete, TextField, CircularProgress, IconButton, Tooltip, Snackbar, Alert,
} from '@mui/material';
import { ReceiptLong } from '@mui/icons-material';

import { getStudents } from '../../../services/studentService';
import usePaymentReceipt from '../../../hooks/usePaymentReceipt';
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

// ─── Receipt download ───────────────────────────────────────────────────────────
/**
 * Downloads the PDF receipt of one payment.
 *
 * Self-contained on purpose: it carries its own spinner AND its own error
 * surface, so the three payment tables that render it (campus fee detail,
 * campus student ledger, the student's own page) drop it into a cell without
 * each wiring a failure path — three wirings would be three chances to swallow
 * the server's message, which is how the commission receipt ended up reporting
 * every failure as "not yet available".
 *
 * The route is open to the campus roles AND to the paying student; nothing is
 * gated here, because the server answers 404 for a payment outside the caller's
 * scope and the button is only ever rendered next to a payment the caller can
 * already read.
 *
 * @param {{ paymentId: string, campusId?: string, size?: 'small'|'medium' }} props
 */
export const ReceiptButton = ({ paymentId, campusId, size = 'small' }) => {
  const { t } = useTranslation('finance');
  const { download, downloadingId, error, clearError } = usePaymentReceipt({ campusId });
  const busy = downloadingId === paymentId;

  return (
    <>
      <Tooltip title={t('receipt.download')}>
        {/* The span keeps the tooltip alive while the button is disabled. */}
        <span>
          <IconButton
            size={size}
            onClick={() => download(paymentId)}
            disabled={busy}
            aria-label={t('receipt.download')}
          >
            {busy ? <CircularProgress size={18} /> : <ReceiptLong fontSize={size} />}
          </IconButton>
        </span>
      </Tooltip>
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={clearError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={clearError} sx={{ borderRadius: 2 }}>{error}</Alert>
      </Snackbar>
    </>
  );
};

// ─── Currency select ──────────────────────────────────────────────────────────────
export const CurrencySelect = ({ value, onChange, name = 'currency', label, size = 'small', fullWidth = false }) => {
  const { t } = useTranslation('finance');
  const resolvedLabel = label ?? t('fields.currency');
  return (
    <FormControl size={size} fullWidth={fullWidth} sx={fullWidth ? undefined : SX_SELECT}>
      <InputLabel>{resolvedLabel}</InputLabel>
      <Select name={name} label={resolvedLabel} value={value ?? ''} onChange={onChange} sx={{ borderRadius: 2 }}>
        {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </Select>
    </FormControl>
  );
};

// ─── Payment-method select ────────────────────────────────────────────────────────
export const PaymentMethodSelect = ({ value, onChange, name = 'method', label, size = 'small', fullWidth = false }) => {
  const { t } = useTranslation('finance');
  const resolvedLabel = label ?? t('fields.method');
  return (
    <FormControl size={size} fullWidth={fullWidth} sx={fullWidth ? undefined : SX_SELECT}>
      <InputLabel>{resolvedLabel}</InputLabel>
      <Select name={name} label={resolvedLabel} value={value ?? ''} onChange={onChange} sx={{ borderRadius: 2 }}>
        {PAYMENT_METHODS.map((m) => <MenuItem key={m} value={m}>{t(`enums.paymentMethod.${m}`)}</MenuItem>)}
      </Select>
    </FormControl>
  );
};

// ─── Period (year + month) selector ───────────────────────────────────────────────
/**
 * @param {{ year, month, onChange, showMonth? }} props
 *   onChange(key, value) — key is 'year' | 'month'; '' clears.
 */
export const PeriodSelector = ({ year, month, onChange, showMonth = true }) => {
  const { t } = useTranslation('finance');
  return (
    <Stack direction="row" spacing={1.5} flexWrap="wrap">
      <FormControl size="small" sx={SX_SELECT}>
        <InputLabel>{t('fields.year')}</InputLabel>
        <Select label={t('fields.year')} value={year ?? ''} onChange={(e) => onChange('year', e.target.value)}>
          <MenuItem value="">{t('filters.allYears')}</MenuItem>
          {recentYears().map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </Select>
      </FormControl>

      {showMonth && (
        <FormControl size="small" sx={SX_SELECT}>
          <InputLabel>{t('fields.month')}</InputLabel>
          <Select label={t('fields.month')} value={month ?? ''} onChange={(e) => onChange('month', e.target.value)}>
            <MenuItem value="">{t('filters.allMonths')}</MenuItem>
            {MONTHS.map((m) => <MenuItem key={m.value} value={m.value}>{t(`enums.months.${m.value}`)}</MenuItem>)}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
};

// ─── Async student picker ─────────────────────────────────────────────────────────
const studentLabel = (s) =>
  s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() + (s.matricule ? ` (${s.matricule})` : '') : '';

/**
 * Debounced student search backed by GET /students?search=…
 * @param {{ value, onChange, campusId?, label?, size? }} props
 *   value/onChange manage the selected student object (or null).
 */
export const StudentPicker = ({ value, onChange, campusId, label, size = 'small' }) => {
  const { t } = useTranslation('finance');
  const resolvedLabel = label ?? t('fields.student');
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
          label={resolvedLabel}
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
