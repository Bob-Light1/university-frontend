/**
 * @file GaetStatusChip.jsx
 * @description Status chip for GAET constraint lifecycle states.
 *
 * States: DRAFT | GENERATING | GENERATED | PARTIALLY_GENERATED | PUBLISHED | FAILED | CANCELLED
 */

import { Chip, CircularProgress, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  EditNote,
  AutoAwesome,
  CheckCircle,
  Warning,
  PublishedWithChanges,
  ErrorOutline,
  Cancel,
} from '@mui/icons-material';

// Color + icon per status. Labels are resolved from the `gaet` namespace at render.
const STATUS_CONFIG = {
  DRAFT: {
    color: 'default',
    icon: <EditNote sx={{ fontSize: 16 }} />,
  },
  GENERATING: {
    color: 'info',
    icon: <CircularProgress size={14} color="inherit" />,
  },
  GENERATED: {
    color: 'success',
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
  },
  PARTIALLY_GENERATED: {
    color: 'warning',
    icon: <Warning sx={{ fontSize: 16 }} />,
  },
  PUBLISHED: {
    color: 'success',
    icon: <PublishedWithChanges sx={{ fontSize: 16 }} />,
  },
  FAILED: {
    color: 'error',
    icon: <ErrorOutline sx={{ fontSize: 16 }} />,
  },
  CANCELLED: {
    color: 'default',
    icon: <Cancel sx={{ fontSize: 16 }} />,
  },
};

const GaetStatusChip = ({ status, size = 'medium', sx = {} }) => {
  const { t } = useTranslation('gaet');
  if (!status) return null;
  const config = STATUS_CONFIG[status] ?? { color: 'default', icon: <AutoAwesome sx={{ fontSize: 16 }} /> };
  const label  = STATUS_CONFIG[status] ? t(`status.${status}`) : status;

  return (
    <Chip
      label={label}
      color={config.color}
      size={size}
      icon={
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 0.5 }}>
          {config.icon}
        </Box>
      }
      variant={status === 'DRAFT' || status === 'CANCELLED' ? 'outlined' : 'filled'}
      sx={{ fontWeight: 600, ...sx }}
    />
  );
};

export default GaetStatusChip;
