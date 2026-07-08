/**
 * @file CitationList.jsx
 * @description Renders the verified citations returned by the AI gateway.
 *
 * Handles both citation shapes of the frozen contract (Annexe B):
 *   - search results: { sourceType, sourceId, title, snippet, score, url }
 *   - chat citations:  { sourceType, sourceId, label, url }
 * Every citation is server-re-authorized (§4.5), so a rendered item is always
 * a source the current user is allowed to open. When `url` is present the title
 * links to it (ERP document deep-link); otherwise it is plain text.
 */

import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Typography, Link, Chip, Paper, Tooltip,
} from '@mui/material';
import { InsertDriveFile, Verified } from '@mui/icons-material';

const citationKey = (c, i) => `${c.sourceType || 'src'}:${c.sourceId || i}`;

export default function CitationList({ items = [], dense = false }) {
  const { t } = useTranslation('ai');
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
        <Verified sx={{ fontSize: 16, color: 'success.main' }} />
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          {t('citations.title', { count: items.length })}
        </Typography>
      </Stack>

      <Stack spacing={1}>
        {items.map((c, i) => {
          const label = c.title || c.label || c.sourceId || t('citations.untitled');
          return (
            <Paper
              key={citationKey(c, i)}
              variant="outlined"
              sx={{ p: dense ? 1 : 1.25, borderRadius: 2, display: 'flex', gap: 1 }}
            >
              <InsertDriveFile sx={{ fontSize: 18, color: 'text.disabled', mt: 0.25 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {c.url ? (
                    <Link
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{ fontWeight: 600, fontSize: 14, wordBreak: 'break-word' }}
                    >
                      {label}
                    </Link>
                  ) : (
                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-word' }}>
                      {label}
                    </Typography>
                  )}
                  {typeof c.score === 'number' && (
                    <Tooltip title={t('citations.relevance')}>
                      <Chip
                        size="small"
                        label={`${Math.round(c.score * 100)}%`}
                        sx={{ height: 18, fontSize: 11 }}
                      />
                    </Tooltip>
                  )}
                </Stack>
                {c.snippet && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.25 }}
                  >
                    {c.snippet}
                  </Typography>
                )}
              </Box>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}
