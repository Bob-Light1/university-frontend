/**
 * @file ConfirmActionDialog.jsx
 * @description Reusable professional confirmation dialog for archive / restore actions.
 *
 * @param {boolean}  open
 * @param {'archive'|'restore'} action
 * @param {string}   entityLabel   - Human-readable entity name, e.g. "John Doe" or "Science Class"
 * @param {string}   entityType    - Already-translated entity kind, e.g. "partner", "campus", "teacher"
 * @param {boolean}  busy          - Shows spinner on confirm button while request is in flight
 * @param {Function} onClose
 * @param {Function} onConfirm
 */

import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, CircularProgress, Box,
} from '@mui/material';
import { Inventory2, Unarchive } from '@mui/icons-material';
import { Trans } from 'react-i18next';
import { useAppTranslation } from '../../hooks/useAppTranslation';

const CONFIG = {
  archive: {
    titleKey: 'confirmDialog.archiveTitle',
    busyKey:  'confirmDialog.archiving',
    bodyKey:  'confirmDialog.archiveBody',
    noteKey:  'confirmDialog.archiveNote',
    icon:     <Inventory2 sx={{ fontSize: 40, color: 'error.main' }} />,
    color:    'error',
  },
  restore: {
    titleKey: 'confirmDialog.restoreTitle',
    busyKey:  'confirmDialog.restoring',
    bodyKey:  'confirmDialog.restoreBody',
    noteKey:  'confirmDialog.restoreNote',
    icon:     <Unarchive sx={{ fontSize: 40, color: 'success.main' }} />,
    color:    'success',
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
  const { t } = useAppTranslation('common');
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
            {t(cfg.titleKey)}
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" lineHeight={1.7}>
          <Trans
            i18nKey={cfg.bodyKey}
            ns="common"
            values={{ label: entityLabel, suffix: entityType ? ` (${entityType})` : '' }}
            components={{ b: <Box component="strong" sx={{ color: 'text.primary' }} /> }}
          />
          <br />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {t(cfg.noteKey)}
          </Typography>
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={busy}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {t('action.cancel')}
        </Button>
        <Button
          variant="contained"
          color={cfg.color}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={14} color="inherit" /> : null}
          onClick={onConfirm}
          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
        >
          {busy ? t(cfg.busyKey) : t(cfg.titleKey)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmActionDialog;
