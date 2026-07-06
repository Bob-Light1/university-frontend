/**
 * @file AiSearch.jsx
 * @description Hybrid semantic search over the campus document library
 * (Feature 3, POST /ai/search). Results are verified citations — each is
 * re-authorized server-side (§4.5), so every rendered hit is a document the
 * current user may open. Ranked by relevance; one result per source.
 *
 * Read-only, no ERP write. Feature/entitlement failures render a full notice.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Paper, Typography, TextField, InputAdornment, IconButton,
  CircularProgress, Alert, Chip,
} from '@mui/material';
import { Search, TravelExplore } from '@mui/icons-material';

import CitationList from './CitationList';
import { searchAi } from '../../../services/aiService';
import { extractAiError, errorKey, isUnavailableError } from './aiConstants';
import AiUnavailable from './AiUnavailable';

export default function AiSearch() {
  const { t } = useTranslation('ai');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);   // null = never searched
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [blocked, setBlocked] = useState(null);
  const [lastQuery, setLastQuery] = useState('');

  const run = () => {
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setLastQuery(q);
    searchAi({ query: q, types: ['document'], limit: 10 })
      .then((res) => setResults(res.data?.data?.results ?? []))
      .catch((err) => {
        const norm = extractAiError(err);
        if (isUnavailableError(norm.code)) setBlocked(norm.code);
        else setError(norm);
        setResults(null);
      })
      .finally(() => setLoading(false));
  };

  const onKeyDown = (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } };

  if (blocked) return <AiUnavailable code={blocked} onRetry={() => setBlocked(null)} />;

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Stack spacing={0.5} sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>{t('search.title')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('search.subtitle')}</Typography>
      </Stack>

      <TextField
        fullWidth
        placeholder={t('search.placeholder')}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        inputProps={{ maxLength: 500 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start"><Search color="action" /></InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={run} disabled={!query.trim() || loading} color="primary" edge="end">
                {loading ? <CircularProgress size={20} /> : <TravelExplore />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {error && (
        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {t(errorKey(error.code), { defaultValue: error.message })}
        </Alert>
      )}

      <Box sx={{ flex: 1, overflow: 'auto', mt: 2, minHeight: 0 }}>
        {loading && (
          <Stack alignItems="center" sx={{ py: 4 }}><CircularProgress /></Stack>
        )}

        {!loading && results !== null && (
          <>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Chip size="small" label={t('search.resultCount', { count: results.length })} />
              {lastQuery && (
                <Typography variant="caption" color="text.secondary">
                  {t('search.for', { query: lastQuery })}
                </Typography>
              )}
            </Stack>

            {results.length === 0 ? (
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">{t('search.empty')}</Typography>
              </Paper>
            ) : (
              <CitationList items={results} />
            )}
          </>
        )}

        {!loading && results === null && !error && (
          <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: '100%', color: 'text.secondary', textAlign: 'center' }}>
            <TravelExplore sx={{ fontSize: 44, opacity: 0.5 }} />
            <Typography variant="body2" sx={{ maxWidth: 380 }}>{t('search.hint')}</Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
