/**
 * @file NotificationPreferences.jsx
 * @description Reusable panel for editing notification preferences. The keys mirror
 * the real delivery channels honoured by the backend: in-app, email, WhatsApp.
 * In-app is the baseline inbox — always on and not user-disableable.
 * Used in all profile pages (Student, Teacher, Admin, Mentor, Staff, Parent).
 *
 * Props:
 *  value       { inapp: bool, email: bool, whatsapp: bool }
 *  onChange    (updatedPrefs) => void  — called immediately on toggle
 *  onSave      () => Promise           — called when user clicks Save
 *  onError     (err) => void           — called if onSave rejects (optional)
 *  loading     bool
 *  accentColor string  — MUI color or hex used for the save button
 */

import { useState } from 'react';
import {
  Paper, Stack, Typography, Divider, Switch,
  Button, CircularProgress,
} from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { useAppTranslation } from '../../hooks/useAppTranslation';

export default function NotificationPreferences({
  value = { inapp: true, email: true, whatsapp: false },
  onChange,
  onSave,
  onError,
  loading = false,
  accentColor = 'primary',
}) {
  const { t } = useAppTranslation('common');
  const [saving, setSaving] = useState(false);

  // `locked` channels are always on and cannot be toggled (the in-app inbox is the
  // baseline — every user always receives in-app notifications).
  const PREFS_META = [
    { key: 'inapp',    label: t('notifPref.inapp'),    description: t('notifPref.inappDesc'),    locked: true },
    { key: 'email',    label: t('notifPref.email'),    description: t('notifPref.emailDesc') },
    { key: 'whatsapp', label: t('notifPref.whatsapp'), description: t('notifPref.whatsappDesc') },
  ];

  const handleToggle = (key, locked) => {
    if (locked || !onChange) return;
    onChange({ ...value, [key]: !value[key] });
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave();
    } catch (err) {
      if (onError) onError(err);
    } finally {
      setSaving(false);
    }
  };

  const isBusy = loading || saving;

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Notifications color="action" />
        <Typography variant="subtitle1" fontWeight={700}>{t('notifPref.title')}</Typography>
      </Stack>
      <Divider sx={{ mb: 2.5 }} />

      <Stack spacing={1.5}>
        {PREFS_META.map(({ key, label, description, locked }) => (
          <Stack
            key={key}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 0.5 }}
          >
            <Stack>
              <Typography variant="body2" fontWeight={600}>{label}</Typography>
              <Typography variant="caption" color="text.secondary">{description}</Typography>
            </Stack>
            <Switch
              checked={locked ? true : Boolean(value[key])}
              onChange={() => handleToggle(key, locked)}
              disabled={isBusy || locked}
              color="primary"
            />
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isBusy}
          startIcon={isBusy ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            ...(accentColor !== 'primary' && {
              bgcolor: accentColor,
              '&:hover': { bgcolor: accentColor, filter: 'brightness(0.92)' },
            }),
          }}
        >
          {isBusy ? t('notifPref.saving') : t('notifPref.save')}
        </Button>
      </Stack>
    </Paper>
  );
}
