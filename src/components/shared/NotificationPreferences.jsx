/**
 * @file NotificationPreferences.jsx
 * @description Reusable panel for editing notification preferences (email / sms / push).
 * Used in all profile pages (Student, Teacher, Admin, Partner, Parent).
 *
 * Props:
 *  value       { email: bool, sms: bool, push: bool }
 *  onChange    (updatedPrefs) => void  — called immediately on toggle
 *  onSave      () => Promise           — called when user clicks Save
 *  onError     (err) => void           — called if onSave rejects (optional)
 *  loading     bool
 *  accentColor string  — MUI color or hex used for the save button
 */

import { useState } from 'react';
import {
  Paper, Stack, Typography, Divider, Switch,
  FormControlLabel, Button, CircularProgress,
} from '@mui/material';
import { Notifications } from '@mui/icons-material';

const PREFS_META = [
  { key: 'email', label: 'Email', description: 'Receive notifications by email' },
  { key: 'sms',   label: 'SMS',   description: 'Receive text messages for urgent alerts' },
  { key: 'push',  label: 'Push',  description: 'In-app and browser push notifications' },
];

export default function NotificationPreferences({
  value = { email: true, sms: false, push: false },
  onChange,
  onSave,
  onError,
  loading = false,
  accentColor = 'primary',
}) {
  const [saving, setSaving] = useState(false);

  const handleToggle = (key) => {
    if (onChange) onChange({ ...value, [key]: !value[key] });
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
        <Typography variant="subtitle1" fontWeight={700}>Notification Preferences</Typography>
      </Stack>
      <Divider sx={{ mb: 2.5 }} />

      <Stack spacing={1.5}>
        {PREFS_META.map(({ key, label, description }) => (
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
              checked={Boolean(value[key])}
              onChange={() => handleToggle(key)}
              disabled={isBusy}
              color={accentColor !== 'primary' ? 'primary' : 'primary'}
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
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {isBusy ? 'Saving…' : 'Save Preferences'}
        </Button>
      </Stack>
    </Paper>
  );
}
