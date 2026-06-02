/**
 * @file GaetStatusChip.jsx
 * @description Status chip for GAET constraint lifecycle states.
 *
 * States: DRAFT | GENERATING | GENERATED | PARTIALLY_GENERATED | PUBLISHED | FAILED | CANCELLED
 */

import { Chip, CircularProgress, Box } from '@mui/material';
import {
  EditNote,
  AutoAwesome,
  CheckCircle,
  Warning,
  PublishedWithChanges,
  ErrorOutline,
  Cancel,
} from '@mui/icons-material';

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    color: 'default',
    icon: <EditNote sx={{ fontSize: 16 }} />,
  },
  GENERATING: {
    label: 'Generating…',
    color: 'info',
    icon: <CircularProgress size={14} color="inherit" />,
  },
  GENERATED: {
    label: 'Generated',
    color: 'success',
    icon: <CheckCircle sx={{ fontSize: 16 }} />,
  },
  PARTIALLY_GENERATED: {
    label: 'Partial',
    color: 'warning',
    icon: <Warning sx={{ fontSize: 16 }} />,
  },
  PUBLISHED: {
    label: 'Published',
    color: 'success',
    icon: <PublishedWithChanges sx={{ fontSize: 16 }} />,
  },
  FAILED: {
    label: 'Failed',
    color: 'error',
    icon: <ErrorOutline sx={{ fontSize: 16 }} />,
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'default',
    icon: <Cancel sx={{ fontSize: 16 }} />,
  },
};

const GaetStatusChip = ({ status, size = 'medium', sx = {} }) => {
  if (!status) return null;
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'default', icon: <AutoAwesome sx={{ fontSize: 16 }} /> };

  return (
    <Chip
      label={config.label}
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
