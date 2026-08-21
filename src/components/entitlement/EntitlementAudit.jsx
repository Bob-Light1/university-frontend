/**
 * @file EntitlementAudit.jsx
 * @description The append-only trail of entitlement decisions on one campus
 * (design doc §12 — every mutation is traced with actor, reason and timestamp).
 *
 * Rendered as sentences rather than as the raw JSON the AI console used to
 * print: the audience is whoever asks "why did Finance disappear in March?",
 * and `{"layer":"admin","modules":[{"key":"finance"…` does not answer that
 * question at a glance.
 *
 * `foldedLegacy` gets its own line on purpose. Those overrides were created by
 * the migration fold on the first write (§3.2), not decided by the actor whose
 * name sits on the row — presenting them as that actor's decisions would put a
 * choice nobody made under somebody's name.
 */

import {
  Box, Stack, Typography, Divider, Chip, Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { ExpandMore, HistoryToggleOff } from '@mui/icons-material';

import { useAppTranslation } from '../../hooks/useAppTranslation';
import { useModuleLabel } from '../../hooks/useModuleLabel';

/**
 * @param {Object} props
 * @param {Array}  props.entries - `[{ at, actorId, actorRole, changes }]`, newest first.
 */
export default function EntitlementAudit({ entries = [] }) {
  const { t } = useAppTranslation('common');
  const moduleLabel = useModuleLabel();

  return (
    <Accordion variant="outlined" disableGutters sx={{ borderRadius: 2, '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Stack direction="row" spacing={1} alignItems="center">
          <HistoryToggleOff fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={600}>{t('features.pilot.history')}</Typography>
          <Chip size="small" label={entries.length} />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        {entries.length === 0 ? (
          <Typography variant="caption" color="text.secondary">
            {t('features.pilot.historyEmpty')}
          </Typography>
        ) : (
          <Stack spacing={1.25} divider={<Divider flexItem />}>
            {entries.map((entry, index) => {
              const changes = entry.changes || {};
              const modules = Array.isArray(changes.modules) ? changes.modules : [];

              return (
                <Box key={entry._id || `${entry.at}-${index}`}>
                  <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="baseline">
                    <Typography variant="caption" fontWeight={700}>
                      {entry.actorRole || t('features.pilot.unknownActor')}
                      {changes.layer && (
                        <Typography component="span" variant="caption" color="text.secondary">
                          {` · ${t(`features.pilot.layer.${changes.layer}`)}`}
                        </Typography>
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {entry.at ? new Date(entry.at).toLocaleString() : ''}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.25} sx={{ mt: 0.5 }}>
                    {changes.plan && (
                      <Typography variant="caption">
                        {t('features.pilot.auditPlan', {
                          plan: t(`features.pilot.planOption.${changes.plan}`),
                        })}
                      </Typography>
                    )}

                    {changes.quotas && (
                      <Typography variant="caption">{t('features.pilot.auditQuotas')}</Typography>
                    )}
                    {changes.ai && (
                      <Typography variant="caption">{t('features.pilot.auditAi')}</Typography>
                    )}

                    {modules.map((m, i) => (
                      <Typography variant="caption" key={`${m.key}-${i}`}>
                        {t('features.pilot.auditModule', {
                          module: moduleLabel(m.key),
                          state: t(`features.pilot.state.${m.state}`),
                        })}
                        {m.until ? ` · ${t('features.pilot.badge.until', {
                          date: new Date(m.until).toLocaleDateString(),
                        })}` : ''}
                        {m.reason ? ` — “${m.reason}”` : ''}
                      </Typography>
                    ))}

                    {changes.foldedLegacy && (
                      <Typography variant="caption" color="text.secondary" fontStyle="italic">
                        {t('features.pilot.auditFolded')}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
