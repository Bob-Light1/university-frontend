/**
 * @file ConfirmActionDialog.jsx
 * @description Reusable professional confirmation dialog for archive / restore actions.
 *
 * @param {boolean}  open
 * @param {'archive'|'restore'} action
 * @param {string}   entityLabel   - Human-readable entity name, e.g. "John Doe" or "Science Class"
 * @param {string}   entityType    - Entity kind, e.g. "partner", "campus", "teacher"
 * @param {boolean}  busy          - Shows spinner on confirm button while request is in flight
 * @param {Function} onClose
 * @param {Function} onConfirm
 */

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, CircularProgress, Box,
} from '@mui/material';
import { Inventory2, Unarchive, WarningAmber } from '@mui/icons-material';

const CONFIG = {
  archive: {
    title:       'Archive',
    icon:        <Inventory2 sx={{ fontSize: 40, color: 'error.main' }} />,
    color:       'error',
    verb:        'archive',
    description: (label, type) =>
      <>
        Do you really want to archive{' '}
        <Box component="strong" sx={{ color: 'text.primary' }}>{label}</Box>
        {type ? ` (${type})` : ''}?
        <br />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          The record will be hidden but all data will be retained. You can restore it at any time.
        </Typography>
      </>,
  },
  restore: {
    title:       'Restore',
    icon:        <Unarchive sx={{ fontSize: 40, color: 'success.main' }} />,
    color:       'success',
    verb:        'restore',
    description: (label, type) =>
      <>
        Do you really want to restore{' '}
        <Box component="strong" sx={{ color: 'text.primary' }}>{label}</Box>
        {type ? ` (${type})` : ''}?
        <br />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          The record will become active again and visible across the platform.
        </Typography>
      </>,
  },
};

const ConfirmActionDialog = ({
  open,
  action = 'archive',
  entityLabel = '',
  entityType  = '',
  busy        = false,
  onClose,
  onConfirm,
}) => {
  const cfg = CONFIG[action] ?? CONFIG.archive;

  const handleClose = () => {
    if (busy) return;
    document.activeElement?.blur();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      disableEnforceFocus
      closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {cfg.icon}
          <Typography variant="h6" fontWeight={700}>
            {cfg.title}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
          {cfg.description(entityLabel, entityType)}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={busy}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color={cfg.color}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : null}
          onClick={onConfirm}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {busy ? `${cfg.title}ing…` : cfg.title}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmActionDialog;
