/**
 * LanguageSelector — shared component injected in all portal Settings pages.
 *
 * Rules:
 * - FormControl + InputLabel + Select (never TextField[select])
 * - SVG flags via country-flag-icons npm package (local, no CDN, no emoji)
 * - Instant preview: changeLanguage(code, false) — no local/server persist
 * - Save button: persists to server + localStorage/cookie + updates AuthContext user
 * - Save button disabled when nothing has changed since last save
 */
import { useState, useRef, useContext } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem,
  Chip, Box, Typography, Divider, Button,
  CircularProgress, Snackbar, Alert,
} from '@mui/material';
import * as AllFlags from 'country-flag-icons/react/3x2';
import { useLanguage } from '../../hooks/useLanguage';
import { useAppTranslation } from '../../hooks/useAppTranslation';
import useFormSnackbar from '../../hooks/useFormSnackBar';
import api from '../../api/axiosInstance';
import { AuthContext } from '../../context/AuthContext';

function FlagIcon({ countryCode, size = 20 }) {
  const FlagComponent = AllFlags[countryCode];
  if (!FlagComponent) return null;
  return (
    <FlagComponent
      title={countryCode}
      style={{ width: size * 1.5, height: size, borderRadius: 2, flexShrink: 0, display: 'block' }}
    />
  );
}

export function LanguageSelector({ onSaved }) {
  const { language, changeLanguage, supportedLangs, languageMeta } = useLanguage();
  const { t } = useAppTranslation('settings');
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();
  const { updateUser } = useContext(AuthContext);

  const [selected, setSelected] = useState(language);
  const [saving,   setSaving]   = useState(false);

  // Track the language as it was at last save — needed because `language` from
  // useLanguage() updates immediately when the preview fires (persist=false),
  // so comparing selected !== language would always be false after any selection.
  const savedLangRef = useRef(language);
  const hasChanged = selected !== savedLangRef.current;

  const handleChange = async (e) => {
    const code = e.target.value;
    setSelected(code);
    // Instant preview only — no localStorage/cookie/server persist
    await changeLanguage(code, false);
  };

  const handleSave = async () => {
    setSaving(true);
    const previousLang = savedLangRef.current;
    try {
      await api.patch('/api/settings', { preferredLanguage: selected });
      // Write local storage + cookie now that the save is confirmed
      const secure = location.protocol === 'https:' ? ';Secure' : '';
      document.cookie = `erp_lang=${selected};path=/;SameSite=Lax;max-age=31536000${secure}`;
      localStorage.setItem('erp_language', selected);
      // Keep AuthContext user in sync so next page reload picks up the correct language
      updateUser?.({ preferredLanguage: selected });
      savedLangRef.current = selected;
      showSnackbar(t('language.saved'), 'success');
      onSaved?.(selected);
    } catch {
      // Rollback preview to the last saved language
      await changeLanguage(previousLang, false);
      setSelected(previousLang);
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
                      label={t('language.rtlBadge')}
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
