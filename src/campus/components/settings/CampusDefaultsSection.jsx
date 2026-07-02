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
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import { groupTimezones, prettyTimezone } from '../../../utils/timezones';

const GRADE_VALUES = ['FRACTION', 'PERCENT', 'LETTER', 'GPA'];

// ── Component ─────────────────────────────────────────────────────────────────

export default function CampusDefaultsSection() {
  const { campusId } = useParams();
  const { t } = useAppTranslation('settings');

  const [form, setForm]           = useState(null);   // controlled form state
  const [timezones, setTimezones] = useState(['UTC']); // authoritative list from backend
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [snackbar, setSnackbar]   = useState({ open: false, message: '', severity: 'success' });

  const savedRef = useRef(null); // track last-saved values for hasChanged

  // ── Fetch current campus defaults + the authoritative options whitelist ─────
  useEffect(() => {
    if (!campusId) return;
    setLoading(true);
    Promise.all([
      api.get(`/campus/${campusId}`),
      api.get('/settings/options').catch(() => null), // non-fatal: page still works
    ])
      .then(([campusRes, optionsRes]) => {
        const { defaultLanguage = 'en', defaultTimezone = 'UTC', defaultGradeFormat = 'FRACTION' } =
          campusRes.data.data ?? {};
        const initial = { defaultLanguage, defaultTimezone, defaultGradeFormat };
        setForm(initial);
        savedRef.current = initial;

        // Build the timezone option list from the backend whitelist, always
        // including the campus's current value so the Select never shows blank.
        const serverZones = optionsRes?.data?.data?.timezones ?? [];
        const merged = serverZones.includes(defaultTimezone)
          ? serverZones
          : [...serverZones, defaultTimezone];
        setTimezones(merged.length ? merged : [defaultTimezone]);
      })
      .catch(() => {
        setSnackbar({ open: true, message: t('campus.loadError'), severity: 'error' });
      })
      .finally(() => setLoading(false));
  }, [campusId]); // eslint-disable-line react-hooks/exhaustive-deps -- refetch only on campus change

  const timezoneGroups = groupTimezones(timezones);
  const regionLabel = (label) => t(`timezone.${label.toLowerCase()}`, { defaultValue: label });

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
      setSnackbar({ open: true, message: t('campus.saveSuccess'), severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: t('campus.saveError'), severity: 'error' });
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
          <Typography variant="subtitle1" fontWeight={700}>{t('campus.title')}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t('campus.subtitle')}
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
            <InputLabel id="def-lang-label">{t('campus.defaultLanguage')}</InputLabel>
            <Select
              labelId="def-lang-label"
              value={form.defaultLanguage}
              label={t('campus.defaultLanguage')}
              onChange={handleChange('defaultLanguage')}
            >
              {SUPPORTED_LANGUAGES.map((code) => {
                const meta = LANGUAGE_META[code];
                return (
                  <MenuItem key={code} value={code}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">{meta?.nativeName ?? code}</Typography>
                      {meta?.rtl && (
                        <Typography variant="caption" color="info.main">
                          {t('language.rtlBadge')}
                        </Typography>
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
                <span>{t('campus.defaultTimezone')}</span>
              </Stack>
            </InputLabel>
            <Select
              labelId="def-tz-label"
              value={form.defaultTimezone}
              label={t('campus.defaultTimezone')}
              onChange={handleChange('defaultTimezone')}
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

          {/* Default Grade Format */}
          <FormControl fullWidth size="small">
            <InputLabel id="def-grade-label">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Grade sx={{ fontSize: 16 }} />
                <span>{t('campus.defaultGradeFormat')}</span>
              </Stack>
            </InputLabel>
            <Select
              labelId="def-grade-label"
              value={form.defaultGradeFormat}
              label={t('campus.defaultGradeFormat')}
              onChange={handleChange('defaultGradeFormat')}
            >
              {GRADE_VALUES.map((value) => (
                <MenuItem key={value} value={value}>
                  <Typography variant="body2">{t(`grade.${value}`)}</Typography>
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
            {t('campus.save')}
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
