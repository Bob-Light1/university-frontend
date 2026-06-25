/**
 * @file ActivationResultDialog.jsx
 * @description Shown after creating (or resetting) a user account. Surfaces the
 * one-time activation link and short offline code so an administrator can relay
 * them — essential for users without an email address.
 *
 * The backend returns this payload as `data.activation = { activationUrl, code, expiresAt }`.
 */

import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, TextField, IconButton,
  InputAdornment, Alert, Tooltip,
} from '@mui/material';
import { ContentCopy, CheckCircle } from '@mui/icons-material';

export default function ActivationResultDialog({ open, activation, onClose }) {
  const [copied, setCopied] = useState('');

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
            <Tooltip title={copied === k ? 'Copied!' : 'Copy'}>
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Account ready — share the activation details</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            No password was set. The user activates their account and chooses their own
            password using the link below, or — if they have no email — with their
            username/matricule and the activation code.
          </Alert>

          {copyField('Activation link', activation.activationUrl, 'link')}
          {copyField('Activation code (offline)', activation.code, 'code')}

          {activation.expiresAt && (
            <Typography variant="caption" color="text.secondary">
              Expires on {new Date(activation.expiresAt).toLocaleString()}.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Done</Button>
      </DialogActions>
    </Dialog>
  );
}
