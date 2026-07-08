/**
 * @file AiWorkspace.jsx
 * @description Platform-level AI workspace for the GLOBAL roles (ADMIN,
 * DIRECTOR), mounted at /admin/ai and /director/ai.
 *
 * Global roles have no campus in their JWT. The AI gateway answers them in a
 * "platform context" (all features, zero-cost LLM profile) whose corpus and ERP
 * aggregates are empty by construction — analytics and advisors are even
 * rejected server-side without a campus scope. So this workspace makes the
 * tenant an explicit, first-class choice: pick a campus, then the whole hub
 * (chat · search · analytics · advisors · usage gauge) runs against it.
 *
 * The selected campus travels as `?campusId=` on every gateway call. It cannot
 * escalate anything: the campus's own entitlement (plan, features, budget) is
 * re-resolved server-side on each request (§11.3).
 *
 * The selection is remembered across sessions (localStorage) so a director
 * returns straight to the campus they were working on.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Stack, Paper, Typography, Autocomplete, TextField, Avatar,
  Skeleton, Alert, Chip,
} from '@mui/material';
import { AutoAwesome, Business } from '@mui/icons-material';

import AiAssistant from './AiAssistant';
import { getAllCampuses } from '../../services/admin_service';

/** Remembers the last tenant the user worked on. */
const LS_CAMPUS_KEY = 'ai_workspace_campus';

/** Upper bound of the campus picker — one request, no pagination UI. */
const CAMPUS_PAGE_SIZE = 200;

const readStoredCampus = () => {
  try { return localStorage.getItem(LS_CAMPUS_KEY) || null; }
  catch { return null; }
};

const writeStoredCampus = (id) => {
  try {
    if (id) localStorage.setItem(LS_CAMPUS_KEY, id);
    else localStorage.removeItem(LS_CAMPUS_KEY);
  } catch { /* private mode — selection stays in memory */ }
};

export default function AiWorkspace() {
  const { t } = useTranslation('ai');

  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setError]   = useState(false);
  const [campusId, setCampusId] = useState(null);

  useEffect(() => {
    let active = true;
    getAllCampuses({ page: 1, limit: CAMPUS_PAGE_SIZE, status: 'active' })
      .then((res) => {
        if (!active) return;
        const items = Array.isArray(res.data?.data) ? res.data.data : [];
        setCampuses(items);
        // Restore the previous tenant only if it is still an active campus.
        const stored = readStoredCampus();
        const restored = items.find((c) => c._id === stored);
        setCampusId(restored ? restored._id : null);
      })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selected = useMemo(
    () => campuses.find((c) => c._id === campusId) ?? null,
    [campuses, campusId],
  );

  const handleSelect = (_, campus) => {
    const id = campus?._id ?? null;
    setCampusId(id);
    writeStoredCampus(id);
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* ── Tenant picker ──────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <AutoAwesome sx={{ color: 'secondary.main', fontSize: 26 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {t('workspace.title')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('workspace.subtitle')}
              </Typography>
            </Box>
          </Stack>

          {loading ? (
            <Skeleton variant="rounded" height={40} sx={{ width: { xs: '100%', md: 320 } }} />
          ) : (
            <Autocomplete
              options={campuses}
              value={selected}
              onChange={handleSelect}
              getOptionLabel={(c) => c.campus_name ?? ''}
              isOptionEqualToValue={(a, b) => a._id === b._id}
              noOptionsText={t('workspace.noCampuses')}
              sx={{ width: { xs: '100%', md: 320 } }}
              renderOption={(props, c) => {
                const { key, ...optionProps } = props;
                return (
                  <Box component="li" key={key} {...optionProps} sx={{ gap: 1.25 }}>
                    <Avatar src={c.campus_image} sx={{ width: 26, height: 26 }}>
                      <Business sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{c.campus_name}</Typography>
                      {c.campus_number && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {c.campus_number}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField {...params} size="small" label={t('workspace.selectCampus')} />
              )}
            />
          )}
        </Stack>
      </Paper>

      {loadError && (
        <Alert severity="error" sx={{ borderRadius: 2, mb: 2 }}>
          {t('workspace.loadError')}
        </Alert>
      )}

      {/* ── Hub, scoped to the selected tenant ─────────────────────────────── */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        {campusId ? (
          // Remount on tenant change: every panel (thread, results, gauge) must
          // start from a clean slate rather than show campus A's data under
          // campus B's header.
          <Paper variant="outlined" sx={{ borderRadius: 3, height: '100%', overflow: 'hidden' }}>
            <AiAssistant key={campusId} campusId={campusId} />
          </Paper>
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1.5}
            sx={{ height: '100%', minHeight: 320, textAlign: 'center', color: 'text.secondary' }}
          >
            <Business sx={{ fontSize: 48, opacity: 0.4 }} />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {t('workspace.emptyTitle')}
            </Typography>
            <Typography variant="body2" sx={{ maxWidth: 460 }}>
              {t('workspace.emptyHint')}
            </Typography>
            {!loading && !loadError && (
              <Chip size="small" label={t('workspace.campusCount', { count: campuses.length })} />
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
