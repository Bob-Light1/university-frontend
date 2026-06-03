/**
 * LanguageSelector — shared component injected in all 9 portal Settings pages.
 *
 * Rules:
 * - FormControl + InputLabel + Select (never TextField[select])
 * - SVG flags via country-flag-icons (no emoji — broken on Windows)
 * - Instant preview: i18n.changeLanguage() fires immediately (persist=false)
 * - Save button persists to server via PATCH /api/settings
 */
import { useState } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem,
  Chip, Box, Typography, Divider, Button,
  CircularProgress, Snackbar, Alert,
} from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import useFormSnackbar from '../../hooks/useFormSnackBar';
import api from '../../api/axiosInstance';

function FlagIcon({ countryCode, size = 20 }) {
  try {
    // country-flag-icons provides SVG URLs
    return (
      <img
        src={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode}.svg`}
        alt={countryCode}
        width={size * 1.5}
        height={size}
        style={{ borderRadius: 2, flexShrink: 0 }}
      />
    );
  } catch {
    return null;
  }
}

export function LanguageSelector({ onSaved }) {
  const { language, changeLanguage, supportedLangs, languageMeta } = useLanguage();
  const { t } = useAppTranslation('settings');
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  const [selected, setSelected]   = useState(language);
  const [saving,   setSaving]     = useState(false);

  const handleChange = async (e) => {
    const code = e.target.value;
    setSelected(code);
    // Instant preview — no server persist yet
    await changeLanguage(code, false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/settings', { preferredLanguage: selected });
      // Also write cookie + localStorage
      document.cookie = `erp_lang=${selected};path=/;SameSite=Lax;max-age=31536000`;
      localStorage.setItem('erp_language', selected);
      showSnackbar(t('language.saved'), 'success');
      onSaved?.(selected);
    } catch {
      showSnackbar(t('api.serverError', { ns: 'errors' }), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        {t('language.title')}
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel id="language-select-label">{t('language.select')}</InputLabel>
        <Select
          labelId="language-select-label"
          id="language-select"
          value={selected}
          label={t('language.select')}
          onChange={handleChange}
          renderValue={(code) => {
            const meta = languageMeta[code];
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {meta && <FlagIcon countryCode={meta.flagCode} />}
                <span>{meta?.nativeName ?? code}</span>
              </Box>
            );
          }}
        >
          {supportedLangs.map((code) => {
            const meta = languageMeta[code];
            return (
              <MenuItem key={code} value={code}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                  {meta && <FlagIcon countryCode={meta.flagCode} />}
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {meta?.nativeName ?? code}
                  </Typography>
                  {meta?.rtl && (
                    <Chip
                      label="RTL"
                      size="small"
                      color="info"
                      variant="outlined"
                      sx={{ ml: 'auto', fontSize: 10, height: 18 }}
                    />
                  )}
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <Typography variant="caption" color="text.secondary">
        {t('language.preview')}
      </Typography>

      <Divider />

      <Button
        variant="contained"
        size="small"
        onClick={handleSave}
        disabled={saving}
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
