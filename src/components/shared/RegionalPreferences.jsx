/**
 * RegionalPreferences — user-level timezone & date-format settings.
 *
 * Rendered inside LanguagePreferencesSection so every portal's profile page
 * (and the campus Settings → Language & Region tab) exposes it for free.
 *
 * Only genuinely-wired preferences are surfaced here:
 *  - timezone   → drives all date/time rendering via configureLocale()
 *  - dateFormat → drives numeric short dates via configureDateFormat()
 * theme & gradeFormat are intentionally omitted (no consuming infrastructure yet),
 * to avoid shipping controls that silently do nothing.
 */
import { useState, useEffect, useRef, useContext } from 'react';
import {
  Box, FormControl, InputLabel, Select, MenuItem, ListSubheader,
  Typography, Button, CircularProgress, Snackbar, Alert, Skeleton, Stack,
} from '@mui/material';
import { Schedule, CalendarMonth } from '@mui/icons-material';
import api from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../hooks/useLanguage';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import useFormSnackbar from '../../hooks/useFormSnackBar';
import { configureLocale, configureDateFormat } from '../../utils/dateFormat';
import { groupTimezones, prettyTimezone } from '../../utils/timezones';

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', key: 'DMY' },
  { value: 'MM/DD/YYYY', key: 'MDY' },
  { value: 'YYYY-MM-DD', key: 'YMD' },
];

export default function RegionalPreferences() {
  const { t } = useAppTranslation('settings');
  const { language } = useLanguage();
  const { user, updateUser } = useContext(AuthContext);
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [form, setForm]           = useState(null);     // { timezone, dateFormat }
  const [timezones, setTimezones] = useState(['UTC']);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  const savedRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      api.get('/settings'),
      api.get('/settings/options').catch(() => null),
    ])
      .then(([prefsRes, optionsRes]) => {
        if (!active) return;
        const prefs = prefsRes.data?.data ?? {};
        const timezone   = prefs.timezone   || 'UTC';
        const dateFormat = prefs.dateFormat || 'DD/MM/YYYY';
        const initial = { timezone, dateFormat };
        setForm(initial);
        savedRef.current = initial;

        const serverZones = optionsRes?.data?.data?.timezones ?? [];
        const merged = serverZones.includes(timezone) ? serverZones : [...serverZones, timezone];
        setTimezones(merged.length ? merged : [timezone]);
      })
      .catch(() => {
        if (active) showSnackbar(t('api.serverError', { ns: 'errors' }), 'error');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- fetch once on mount

  const timezoneGroups = groupTimezones(timezones);
  const regionLabel = (label) => t(`timezone.${label.toLowerCase()}`, { defaultValue: label });

  const hasChanged = form && savedRef.current && (
    form.timezone   !== savedRef.current.timezone ||
    form.dateFormat !== savedRef.current.dateFormat
  );

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const previous = savedRef.current;
    try {
      await api.patch('/settings', form);
      // Apply immediately, app-wide, so every date/time reflects the new prefs.
      configureLocale(language, form.timezone, user?.preferredLocale);
      configureDateFormat(form.dateFormat);
      updateUser?.({ timezone: form.timezone, dateFormat: form.dateFormat });
      savedRef.current = { ...form };
      showSnackbar(t('regionSaved'), 'success');
    } catch {
      setForm(previous); // rollback the form on failure
      showSnackbar(t('api.serverError', { ns: 'errors' }), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Stack spacing={2} sx={{ maxWidth: 400 }}>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={40} />
      </Stack>
    );
  }

  if (!form) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
      {/* Timezone */}
      <FormControl fullWidth size="small">
        <InputLabel id="tz-select-label">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Schedule sx={{ fontSize: 16 }} />
            <span>{t('timezone.select')}</span>
          </Stack>
        </InputLabel>
        <Select
          labelId="tz-select-label"
          value={form.timezone}
          label={t('timezone.select')}
          onChange={handleChange('timezone')}
          MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
        >
          {timezoneGroups.flatMap(({ label, zones }) => [
            <ListSubheader key={`hdr-${label}`} sx={{ fontWeight: 700, lineHeight: '32px' }}>
              {regionLabel(label)}
            </ListSubheader>,
            ...zones.map((tz) => (
              <MenuItem key={tz} value={tz} sx={{ pl: 3 }}>
                <Typography variant="body2">{prettyTimezone(tz)}</Typography>
              </MenuItem>
            )),
          ])}
        </Select>
      </FormControl>
      <Typography variant="caption" color="text.secondary" sx={{ mt: -1 }}>
        {t('timezone.help')}
      </Typography>

      {/* Date format */}
      <FormControl fullWidth size="small">
        <InputLabel id="date-fmt-label">
          <Stack direction="row" spacing={0.5} alignItems="center">
            <CalendarMonth sx={{ fontSize: 16 }} />
            <span>{t('date.format')}</span>
          </Stack>
        </InputLabel>
        <Select
          labelId="date-fmt-label"
          value={form.dateFormat}
          label={t('date.format')}
          onChange={handleChange('dateFormat')}
        >
          {DATE_FORMATS.map(({ value, key }) => (
            <MenuItem key={value} value={value}>
              <Typography variant="body2">{t(`date.${key}`)}</Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        size="small"
        onClick={handleSave}
        disabled={saving || !hasChanged}
        sx={{ alignSelf: 'flex-start' }}
        startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
      >
        {t('save')}
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={closeSnackbar} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
