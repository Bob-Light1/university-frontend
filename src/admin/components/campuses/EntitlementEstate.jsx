/**
 * @file EntitlementEstate.jsx
 * @description The estate matrix — every campus × every module, on one screen
 * (CAMPUS_ENTITLEMENT_DESIGN.md §13.1: "the admin sells a plan, opens or closes
 * a module per campus, and sees who has what").
 *
 *   GET /admin/entitlement/overview
 *
 * Read-only by design. Editing goes through the per-campus dialog, which is
 * where the refusal checks live: a matrix cell that could be toggled would be a
 * second write path that skips the justification and the impact report.
 *
 * The row that matters most is the one nobody configured: a campus with no
 * entitlement resolves to everything enabled (fail-open, §4.3), which is
 * exactly the tenant getting every paid module for free. It is flagged rather
 * than filtered out.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Stack, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Tooltip, TextField, Skeleton, Alert, IconButton,
  InputAdornment, FormControlLabel, Switch,
} from '@mui/material';
import { Search, Tune, Refresh } from '@mui/icons-material';

import { getEstateOverview } from '../../../services/entitlementService';
import { FEATURE_STATES } from '../../../config/featureConstants';
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import { useModuleLabel } from '../../../hooks/useModuleLabel';
import EntitlementDialog from './EntitlementDialog';

/** One glyph per state — a 26-column table has no room for words. */
const CELL = {
  [FEATURE_STATES.ENABLED]: { symbol: '●', color: 'success.main' },
  [FEATURE_STATES.READ_ONLY]: { symbol: '◐', color: 'warning.main' },
  [FEATURE_STATES.HIDDEN]: { symbol: '○', color: 'text.disabled' },
};

export default function EntitlementEstate() {
  const { t } = useAppTranslation(['common', 'admin']);
  const moduleLabel = useModuleLabel();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [coreHidden, setCoreHidden] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getEstateOverview();
      setData(res.data?.data || null);
    } catch (err) {
      setError(err.response?.data?.message || t('features.pilot.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  // Core modules are enabled for everyone by construction (§5.1) — nine columns
  // of identical dots is nine columns of noise on the screen built for spotting
  // differences. Kept behind a toggle rather than dropped: "why is Settings not
  // listed?" is a fair question.
  const columns = useMemo(
    () => (data?.features || []).filter((f) => !coreHidden || !f.core),
    [data, coreHidden],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.campuses || []).filter((c) =>
      !needle || (c.campusName || '').toLowerCase().includes(needle));
  }, [data, query]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Tune sx={{ fontSize: 28, color: 'text.secondary' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800}>{t('features.pilot.estate.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('features.pilot.estate.subtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('action.refresh')}>
          <IconButton onClick={load} disabled={loading}><Refresh /></IconButton>
        </Tooltip>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ sm: 'center' }}
        sx={{ mb: 2 }}
      >
        <TextField
          size="small"
          placeholder={t('features.pilot.estate.search')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
            ),
          }}
          sx={{ minWidth: 240 }}
        />
        <FormControlLabel
          control={<Switch size="small" checked={coreHidden} onChange={(e) => setCoreHidden(e.target.checked)} />}
          label={<Typography variant="body2">{t('features.pilot.estate.hideCore')}</Typography>}
        />
        <Stack direction="row" spacing={2} sx={{ ml: { sm: 'auto' } }}>
          {Object.entries(CELL).map(([state, { symbol, color }]) => (
            <Stack key={state} direction="row" spacing={0.5} alignItems="center">
              <Typography sx={{ color, lineHeight: 1 }}>{symbol}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t(`features.pilot.state.${state}`)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack spacing={1}>
          {[1, 2, 3, 4, 5, 6].map((k) => <Skeleton key={k} variant="rounded" height={44} />)}
        </Stack>
      ) : rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {t('features.pilot.estate.empty')}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>
                  {t('features.pilot.estate.campus')}
                </TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 110 }}>
                  {t('features.pilot.plan')}
                </TableCell>
                {columns.map((f) => (
                  // Vertical headers: 26 horizontal module names produce a table
                  // wider than any screen, and a matrix that must be scrolled
                  // sideways to be read is a matrix nobody compares rows in.
                  <TableCell key={f.key} align="center" sx={{ p: 0.5 }}>
                    <Tooltip title={moduleLabel(f.key, f.label)}>
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        sx={{
                          writingMode: 'vertical-rl',
                          transform: 'rotate(180deg)',
                          whiteSpace: 'nowrap',
                          maxHeight: 130,
                          overflow: 'hidden',
                        }}
                      >
                        {moduleLabel(f.key, f.label)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((campus) => (
                <TableRow
                  key={campus.campusId}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setEditing({ _id: campus.campusId, campus_name: campus.campusName })}
                >
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {campus.campusName || campus.campusId}
                      </Typography>
                      {campus.status === 'archived' && (
                        <Chip size="small" variant="outlined" label={t('status.archived')} />
                      )}
                      {!campus.configured && (
                        <Tooltip title={t('features.pilot.estate.unconfiguredHelp')}>
                          <Chip size="small" color="warning" variant="outlined"
                            label={t('features.pilot.estate.unconfigured')} />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={t(`features.pilot.planOption.${campus.plan}`)}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>

                  {columns.map((f) => {
                    const cell = CELL[campus.states[f.key]] || CELL[FEATURE_STATES.ENABLED];
                    return (
                      <TableCell key={f.key} align="center" sx={{ p: 0.5 }}>
                        <Tooltip
                          title={`${moduleLabel(f.key, f.label)} — ${t(`features.pilot.state.${campus.states[f.key]}`)}`}
                        >
                          <Typography sx={{ color: cell.color, lineHeight: 1 }}>{cell.symbol}</Typography>
                        </Tooltip>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Editing is the per-campus dialog, never a cell: it is the path that
          carries the justification, the impact report and the audit row. */}
      <EntitlementDialog
        open={Boolean(editing)}
        campus={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />
    </Box>
  );
}
