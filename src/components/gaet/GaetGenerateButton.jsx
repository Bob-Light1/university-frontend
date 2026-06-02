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
  Stack, Button, CircularProgress, Tooltip, Alert, Typography,
} from '@mui/material';
import {
  PlayArrow, Refresh, CloudUpload, Cancel, CheckCircle, ErrorOutline,
} from '@mui/icons-material';

// ─── STATUS ACTIONS ──────────────────────────────────────────────────────────

const GenerateButton = ({ onGenerate, disabled }) => (
  <Button
    variant="contained"
    color="primary"
    startIcon={<PlayArrow />}
    onClick={onGenerate}
    disabled={disabled}
    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3 }}
  >
    Generate Timetable
  </Button>
);

const GeneratingState = () => (
  <Button
    variant="contained"
    color="info"
    disabled
    startIcon={<CircularProgress size={16} color="inherit" />}
    sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2, px: 3, minWidth: 200 }}
  >
    Generating…
  </Button>
);

const GeneratedActions = ({ status, onPublish, onRegenerate, onCancel, publishing }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
    <Tooltip title="Discard and cancel the generated timetable">
      <Button
        variant="outlined"
        color="error"
        startIcon={<Cancel />}
        onClick={onCancel}
        sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
      >
        Cancel
      </Button>
    </Tooltip>
    <Tooltip title="Run the algorithm again with current constraints">
      <Button
        variant="outlined"
        color="primary"
        startIcon={<Refresh />}
        onClick={onRegenerate}
        sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
      >
        Regenerate
      </Button>
    </Tooltip>
    <Tooltip
      title={
        status === 'PARTIALLY_GENERATED'
          ? 'Some courses were not placed — publish partial timetable'
          : 'Publish to StudentSchedule and TeacherSchedule'
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
        {publishing ? 'Publishing…' : 'Publish Timetable'}
      </Button>
    </Tooltip>
  </Stack>
);

const PublishedState = () => (
  <Stack direction="row" alignItems="center" spacing={1}>
    <CheckCircle color="success" />
    <Typography variant="body2" fontWeight={700} color="success.main">
      Timetable published successfully
    </Typography>
  </Stack>
);

const FailedActions = ({ onRetry }) => (
  <Stack direction="row" spacing={1.5} alignItems="center">
    <ErrorOutline color="error" />
    <Button
      variant="contained"
      color="error"
      startIcon={<Refresh />}
      onClick={onRetry}
      sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 2 }}
    >
      Retry Generation
    </Button>
  </Stack>
);

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
