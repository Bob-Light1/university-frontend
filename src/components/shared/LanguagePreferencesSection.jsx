import { Paper, Stack, Typography, Divider } from '@mui/material';
import { Language } from '@mui/icons-material';
import { LanguageSelector } from './LanguageSelector';
import { useAppTranslation } from '../../hooks/useAppTranslation';

/**
 * Drop-in Paper card for all profile pages.
 * Wraps LanguageSelector with the same visual framing as NotificationPreferences.
 *
 * Props:
 *  onSaved  (langCode) => void  — optional callback after a successful save
 */
export default function LanguagePreferencesSection({ onSaved }) {
  const { t } = useAppTranslation('settings');
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Language color="action" />
        <Typography variant="subtitle1" fontWeight={700}>{t('language.title')}</Typography>
      </Stack>
      <Divider sx={{ mb: 2.5 }} />

      <LanguageSelector onSaved={onSaved} />
    </Paper>
  );
}
