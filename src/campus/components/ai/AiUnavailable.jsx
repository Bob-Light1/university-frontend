/**
 * @file AiUnavailable.jsx
 * @description Full-panel notice shown when a whole AI feature or the campus
 * subscription is unavailable (AI_DISABLED / AI_NOT_ENABLED /
 * AI_FEATURE_NOT_IN_PLAN). Distinct from a transient inline error: this is a
 * stable state the user cannot retry away, so it explains the situation and,
 * for entitlement gaps, points to the campus administrator.
 */

import { useTranslation } from 'react-i18next';
import { Box, Typography, Button, Stack } from '@mui/material';
import { CloudOff, WorkspacePremium, Lock } from '@mui/icons-material';

import { AI_ERROR_CODES, errorKey } from './aiConstants';

const ICONS = {
  [AI_ERROR_CODES.AI_DISABLED]: CloudOff,
  [AI_ERROR_CODES.AI_NOT_ENABLED]: Lock,
  [AI_ERROR_CODES.AI_FEATURE_NOT_IN_PLAN]: WorkspacePremium,
};

export default function AiUnavailable({ code, onRetry }) {
  const { t } = useTranslation('ai');
  const Icon = ICONS[code] || CloudOff;
  const isUpgrade = code === AI_ERROR_CODES.AI_FEATURE_NOT_IN_PLAN;

  return (
    <Box
      sx={{
        height: '100%', minHeight: 320, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', p: 4,
      }}
    >
      <Icon sx={{ fontSize: 56, color: isUpgrade ? 'warning.main' : 'text.disabled', mb: 2 }} />
      <Typography variant="h6" fontWeight={700} gutterBottom>
        {t(`${errorKey(code)}.title`)}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
        {t(`${errorKey(code)}.description`)}
      </Typography>
      {onRetry && (
        <Stack sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={onRetry} sx={{ textTransform: 'none', borderRadius: 2 }}>
            {t('actions.retry')}
          </Button>
        </Stack>
      )}
    </Box>
  );
}
