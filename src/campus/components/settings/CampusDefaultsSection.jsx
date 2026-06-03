import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Paper, Stack, Typography, Divider, Box,
  FormControl, InputLabel, Select, MenuItem,
  ListSubheader, Button, CircularProgress,
  Snackbar, Alert, Skeleton,
} from '@mui/material';
import { Public, Schedule, Grade } from '@mui/icons-material';
import api from '../../../api/axiosInstance';
import { LANGUAGE_META, SUPPORTED_LANGUAGES } from '../../../i18n/i18n';

// ── Timezone options grouped by region ───────────────────────────────────────

const TIMEZONE_GROUPS = [
  {
    label: 'UTC',
    zones: ['UTC'],
  },
  {
    label: 'Africa',
    zones: [
      'Africa/Abidjan','Africa/Accra','Africa/Addis_Ababa','Africa/Algiers',
      'Africa/Bamako','Africa/Bangui','Africa/Brazzaville','Africa/Cairo',
      'Africa/Casablanca','Africa/Dakar','Africa/Dar_es_Salaam','Africa/Douala',
      'Africa/Freetown','Africa/Harare','Africa/Johannesburg','Africa/Kampala',
      'Africa/Khartoum','Africa/Kigali','Africa/Kinshasa','Africa/Lagos',
      'Africa/Libreville','Africa/Lome','Africa/Luanda','Africa/Malabo',
      'Africa/Nairobi','Africa/Ndjamena','Africa/Niamey','Africa/Nouakchott',
      'Africa/Ouagadougou','Africa/Tripoli','Africa/Tunis','Africa/Windhoek',
    ],
  },
  {
    label: 'Europe',
    zones: [
      'Europe/Amsterdam','Europe/Athens','Europe/Berlin','Europe/Brussels',
      'Europe/Budapest','Europe/Copenhagen','Europe/Dublin','Europe/Helsinki',
      'Europe/Istanbul','Europe/Lisbon','Europe/London','Europe/Luxembourg',
      'Europe/Madrid','Europe/Moscow','Europe/Oslo','Europe/Paris',
      'Europe/Prague','Europe/Rome','Europe/Stockholm','Europe/Vienna',
      'Europe/Warsaw','Europe/Zurich',
    ],
  },
  {
    label: 'Asia',
    zones: [
      'Asia/Baghdad','Asia/Bangkok','Asia/Beirut','Asia/Dubai',
      'Asia/Hong_Kong','Asia/Jakarta','Asia/Jerusalem','Asia/Karachi',
      'Asia/Kolkata','Asia/Kuala_Lumpur','Asia/Muscat','Asia/Qatar',
      'Asia/Riyadh','Asia/Seoul','Asia/Shanghai','Asia/Singapore',
      'Asia/Taipei','Asia/Tehran','Asia/Tokyo',
    ],
  },
  {
    label: 'America',
    zones: [
      'America/Bogota','America/Buenos_Aires','America/Caracas','America/Chicago',
      'America/Denver','America/Lima','America/Los_Angeles','America/Mexico_City',
      'America/New_York','America/Panama','America/Sao_Paulo','America/Toronto',
      'America/Vancouver',
    ],
  },
  {
    label: 'Pacific / Atlantic',
    zones: [
      'Pacific/Auckland','Pacific/Fiji','Pacific/Honolulu',
      'Atlantic/Azores','Atlantic/Cape_Verde','Indian/Mauritius','Indian/Reunion',
    ],
  },
];

const GRADE_OPTIONS = [
  { value: 'FRACTION', label: '12/20 — Fraction' },
  { value: 'PERCENT',  label: '60% — Percent'    },
  { value: 'LETTER',   label: 'B+ — Letter grade' },
  { value: 'GPA',      label: '3.5 — GPA'         },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampusDefaultsSection() {
  const { campusId } = useParams();

  const [defaults, setDefaults]   = useState(null);   // fetched campus defaults
  const [form, setForm]           = useState(null);   // controlled form state
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [snackbar, setSnackbar]   = useState({ open: false, message: '', severity: 'success' });

  const savedRef = useRef(null); // track last-saved values for hasChanged

  // ── Fetch current campus defaults ─────────────────────────────────────────
  useEffect(() => {
    if (!campusId) return;
    setLoading(true);
    api.get(`/campus/${campusId}`)
      .then(({ data }) => {
        const { defaultLanguage = 'en', defaultTimezone = 'UTC', defaultGradeFormat = 'FRACTION' } = data.data ?? {};
        const initial = { defaultLanguage, defaultTimezone, defaultGradeFormat };
        setDefaults(initial);
        setForm(initial);
        savedRef.current = initial;
      })
      .catch(() => {
        setSnackbar({ open: true, message: 'Failed to load campus settings.', severity: 'error' });
      })
      .finally(() => setLoading(false));
  }, [campusId]);

  const hasChanged = form && savedRef.current && (
    form.defaultLanguage   !== savedRef.current.defaultLanguage   ||
    form.defaultTimezone   !== savedRef.current.defaultTimezone   ||
    form.defaultGradeFormat !== savedRef.current.defaultGradeFormat
  );

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/campus/${campusId}/defaults`, form);
      savedRef.current = { ...form };
      setSnackbar({ open: true, message: 'Campus defaults saved.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save campus defaults.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Public color="action" />
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Campus Defaults</Typography>
          <Typography variant="caption" color="text.secondary">
            Applied to new users on this campus who haven't set their own preferences yet.
          </Typography>
        </Box>
      </Stack>
      <Divider sx={{ mb: 3 }} />

      {loading ? (
        <Stack spacing={2}>
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={56} />
        </Stack>
      ) : !form ? null : (
        <Stack spacing={2.5} maxWidth={420}>

          {/* Default Language */}
          <FormControl fullWidth size="small">
            <InputLabel id="def-lang-label">Default Language</InputLabel>
            <Select
              labelId="def-lang-label"
              value={form.defaultLanguage}
              label="Default Language"
              onChange={handleChange('defaultLanguage')}
            >
              {SUPPORTED_LANGUAGES.map((code) => {
                const meta = LANGUAGE_META[code];
                return (
                  <MenuItem key={code} value={code}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">{meta?.nativeName ?? code}</Typography>
                      {meta?.rtl && (
                        <Typography variant="caption" color="info.main">(RTL)</Typography>
                      )}
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Default Timezone */}
          <FormControl fullWidth size="small">
            <InputLabel id="def-tz-label">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Schedule sx={{ fontSize: 16 }} />
                <span>Default Timezone</span>
              </Stack>
            </InputLabel>
            <Select
              labelId="def-tz-label"
              value={form.defaultTimezone}
              label="Default Timezone"
              onChange={handleChange('defaultTimezone')}
              MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
            >
              {TIMEZONE_GROUPS.flatMap(({ label, zones }) => [
                <ListSubheader key={`hdr-${label}`} sx={{ fontWeight: 700, lineHeight: '32px' }}>
                  {label}
                </ListSubheader>,
                ...zones.map((tz) => (
                  <MenuItem key={tz} value={tz} sx={{ pl: 3 }}>
                    <Typography variant="body2">{tz.replace(/_/g, ' ')}</Typography>
                  </MenuItem>
                )),
              ])}
            </Select>
          </FormControl>

          {/* Default Grade Format */}
          <FormControl fullWidth size="small">
            <InputLabel id="def-grade-label">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Grade sx={{ fontSize: 16 }} />
                <span>Default Grade Format</span>
              </Stack>
            </InputLabel>
            <Select
              labelId="def-grade-label"
              value={form.defaultGradeFormat}
              label="Default Grade Format"
              onChange={handleChange('defaultGradeFormat')}
            >
              {GRADE_OPTIONS.map(({ value, label }) => (
                <MenuItem key={value} value={value}>
                  <Typography variant="body2">{label}</Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider />

          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
            disabled={saving || !hasChanged}
            sx={{ alignSelf: 'flex-start' }}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
          >
            Save Campus Defaults
          </Button>
        </Stack>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
