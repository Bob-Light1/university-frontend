/**
 * @file GaetGenerateButton.jsx
 * @description Status-driven action bar for the GAET lifecycle.
 *
 * Renders the correct set of action buttons based on constraint status:
 *   DRAFT / CANCELLED  → [Generate]
 *   GENERATING         → [Generating… (disabled)]
 *   GENERATED          → [Regenerate] [Publish]
 *   PARTIALLY_GENERATED→ [Regenerate] [Publish (warning)] [Cancel]
 *   PUBLISHED          → [Published ✓] (link to schedule)
 *   FAILED             → [Retry]
 */

import {
  Stack, Button, CircularProgress, Tooltip, Typography,
} from '@mui/material';
import {
  PlayArrow, Refresh, CloudUpload, Cancel, CheckCircle, ErrorOutline,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

// ─── STATUS ACTIONS ──────────────────────────────────────────────────────────

const GenerateButton = ({ onGenerate, disabled }) => {
  const { t } = useTranslation('gaet');
  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<PlayArrow />}
      onClick={onGenerate}
      disabled={disabled}
      sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3 }}
    >
      {t('actions.generate')}
    </Button>
  );
};

const GeneratingState = () => {
  const { t } = useTranslation('gaet');
  return (
    <Button
      variant="contained"
      color="info"
      disabled
      startIcon={<CircularProgress size={16} color="inherit" />}
      sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3, minWidth: 200 }}
    >
      {t('actions.generating')}
    </Button>
  );
};

const GeneratedActions = ({ status, onPublish, onRegenerate, onCancel, publishing }) => {
  const { t } = useTranslation('gaet');
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <Tooltip title={t('actions.tooltipCancel')}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Cancel />}
          onClick={onCancel}
          sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
        >
          {t('actions.cancel')}
        </Button>
      </Tooltip>
      <Tooltip title={t('actions.tooltipRegenerate')}>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<Refresh />}
          onClick={onRegenerate}
          sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
        >
          {t('actions.regenerate')}
        </Button>
      </Tooltip>
      <Tooltip
        title={
          status === 'PARTIALLY_GENERATED'
            ? t('actions.tooltipPublishPartial')
            : t('actions.tooltipPublishFull')
        }
      >
        <Button
          variant="contained"
          color={status === 'PARTIALLY_GENERATED' ? 'warning' : 'success'}
          startIcon={publishing ? <CircularProgress size={16} color="inherit" /> : <CloudUpload />}
          onClick={onPublish}
          disabled={publishing}
          sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3 }}
        >
          {publishing ? t('actions.publishing') : t('actions.publish')}
        </Button>
      </Tooltip>
    </Stack>
  );
};

const PublishedState = () => {
  const { t } = useTranslation('gaet');
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <CheckCircle color="success" />
      <Typography variant="body2" fontWeight={700} color="success.main">
        {t('actions.published')}
      </Typography>
    </Stack>
  );
};

const FailedActions = ({ onRetry }) => {
  const { t } = useTranslation('gaet');
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <ErrorOutline color="error" />
      <Button
        variant="contained"
        color="error"
        startIcon={<Refresh />}
        onClick={onRetry}
        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
      >
        {t('actions.retry')}
      </Button>
    </Stack>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

/**
 * GaetGenerateButton
 *
 * Props:
 *   status       {string}    — current GAET constraint status
 *   disabled     {boolean}   — disable generate (e.g. constraint has no courses yet)
 *   publishing   {boolean}   — publish in progress
 *   onGenerate   {Function}  — trigger generation
 *   onPublish    {Function}  — trigger publication
 *   onCancel     {Function}  — cancel generated timetable
 *   disabledMsg  {string}    — tooltip when disabled
 */
const GaetGenerateButton = ({
  status,
  disabled = false,
  publishing = false,
  onGenerate,
  onPublish,
  onCancel,
  disabledMsg = '',
}) => {
  const handleGenerate  = onGenerate;
  const handleRegenerate = onGenerate; // same action

  if (!status || status === 'DRAFT' || status === 'CANCELLED') {
    return disabled ? (
      <Tooltip title={disabledMsg}>
        <span>
          <GenerateButton onGenerate={handleGenerate} disabled />
        </span>
      </Tooltip>
    ) : (
      <GenerateButton onGenerate={handleGenerate} disabled={false} />
    );
  }

  if (status === 'GENERATING') return <GeneratingState />;

  if (status === 'GENERATED' || status === 'PARTIALLY_GENERATED') {
    return (
      <GeneratedActions
        status={status}
        onPublish={onPublish}
        onRegenerate={handleRegenerate}
        onCancel={onCancel}
        publishing={publishing}
      />
    );
  }

  if (status === 'PUBLISHED') return <PublishedState />;

  if (status === 'FAILED') return <FailedActions onRetry={handleGenerate} />;

  return null;
};

export default GaetGenerateButton;
