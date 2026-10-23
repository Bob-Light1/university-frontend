/**
 * @file ActivationResultDialog.jsx
 * @description Shown after creating (or resetting) a user account. Surfaces the
 * one-time activation link and short offline code so an administrator can relay
 * them — essential for users without an email address.
 *
 * The backend returns this payload as `data.activation = { activationUrl, code, expiresAt }`.
 */

import { useState } from 'react';
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import { fDateTime } from '../../../utils/dateFormat';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, TextField, IconButton,
  InputAdornment, Alert, Tooltip,
} from '@mui/material';
import { ContentCopy, CheckCircle } from '@mui/icons-material';

export default function ActivationResultDialog({ open, activation, onClose }) {
  const [copied, setCopied] = useState('');
  const { t } = useAppTranslation('common');

  if (!activation) return null;

  const copy = (value, key) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  // Plain render helper (not a component) — avoids re-creating a component on render.
  const copyField = (label, value, k) => (
    <TextField
      label={label}
      value={value}
      fullWidth
      InputProps={{
        readOnly: true,
        endAdornment: (
          <InputAdornment position="end">
            <Tooltip title={copied === k ? t('admission.activation.copied') : t('admission.activation.copy')}>
              <IconButton edge="end" onClick={() => copy(value, k)}>
                {copied === k ? <CheckCircle color="success" /> : <ContentCopy />}
              </IconButton>
            </Tooltip>
          </InputAdornment>
        ),
      }}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>{t('admission.activation.title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            {t('admission.activation.notice')}
          </Alert>

          {copyField(t('admission.activation.link'), activation.activationUrl, 'link')}
          {copyField(t('admission.activation.code'), activation.code, 'code')}

          {activation.expiresAt && (
            <Typography variant="caption" color="text.secondary">
              {t('admission.activation.expires', { date: fDateTime(activation.expiresAt) })}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">{t('admission.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
