/**
 * @file HardDeleteDialog.jsx
 * @description The single confirmation surface for permanent deletion across the platform.
 *
 * A permanent deletion cannot be undone, so this dialog never offers a one-click path. It
 * mirrors the four backend controls (CLAUDE.md §5.2), in order:
 *
 *   Step 1 — Impact.  The server is asked what the deletion would destroy. The operator reads
 *            a real, server-computed report before anything can be typed. If a protected
 *            record blocks the deletion, the flow stops here: there is no override.
 *   Step 2 — Confirmation.  The operator retypes the exact phrase, re-enters their own
 *            password and writes a justification that is stored in the deletion ledger.
 *
 * The ticket returned by step 1 expires; the remaining time is shown, and once it lapses the
 * operator must re-run the preview rather than submit a stale approval.
 *
 * @param {boolean}  open
 * @param {string}   entityType   - Backend registry key, e.g. 'student'.
 * @param {string}   entityId     - Target document id.
 * @param {string}   [entityLabel]- Optional label shown before the preview resolves.
 * @param {Function} onClose      - Called on cancel or after a successful deletion.
 * @param {Function} [onDeleted]  - Called with the deletion receipt on success.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Stack, CircularProgress, Box, Alert, AlertTitle,
  TextField, Divider, Chip, List, ListItem, ListItemText, LinearProgress,
} from '@mui/material';
import {
  DeleteForever, WarningAmber, Block, ArrowForward, LockOutlined, Refresh,
} from '@mui/icons-material';

import { useAppTranslation } from '../../hooks/useAppTranslation';
import { getDeletionImpact, executeHardDelete } from '../../services/dangerZoneService';

/**
 * Fallback only. The real bound travels on the impact report
 * (`requirements.minReasonLength`), because the backend owns it — this constant just keeps the
 * field usable if an older API version answers without the requirements block.
 */
const MIN_REASON_LENGTH_FALLBACK = 10;

/**
 * The status the backend returns when the ticket no longer authorizes anything — it expired, it
 * was issued for a different impact report, or a protected record appeared while the operator
 * was typing. Resubmitting the same ticket can only fail again, so the dialog drops back to the
 * preview step instead of leaving a dead Confirm button armed.
 */
const STALE_TICKET_STATUS = 409;

/** Visual weight per relation mode — the operator must read "block" differently from "detach". */
const MODE_STYLE = {
  block:   { color: 'error',   labelKey: 'hardDelete.modeBlock' },
  cascade: { color: 'warning', labelKey: 'hardDelete.modeCascade' },
  detach:  { color: 'info',    labelKey: 'hardDelete.modeDetach' },
  // RETAIN: the related document is untouched and keeps pointing at the removed id — either
  // provenance stored in a required field, or an append-only ledger. Nothing is destroyed, so
  // it reads as neutral; it is still shown, because a stale reference the operator never saw
  // is precisely what the backend registry refuses to leave implicit.
  retain:  { color: 'default', labelKey: 'hardDelete.modeRetain' },
};

const HardDeleteDialog = ({
  open,
  entityType,
  entityId,
  entityLabel = '',
  onClose,
  onDeleted,
}) => {
  const { t } = useAppTranslation('common');

  const [loading,  setLoading]  = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [report,   setReport]   = useState(null);
  const [error,    setError]    = useState('');
  const [phrase,   setPhrase]   = useState('');
  const [password, setPassword] = useState('');
  const [reason,   setReason]   = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);

  // ── Step 1: fetch the impact report ────────────────────────────────────────
  /**
   * Runs the preview and arms a fresh ticket.
   *
   * Also the recovery path: a ticket lives five minutes, and reading a long impact report or
   * hesitating over the justification outlasts it easily. Without a way back to step 1 the only
   * exit was closing and reopening the dialog, and until then the Confirm button stayed armed
   * over a ticket the server had already stopped honouring.
   *
   * The typed fields are cleared on every run — a new ticket is a new approval, and the password
   * in particular must never sit in state across one.
   */
  const runPreview = useCallback(() => {
    if (!entityType || !entityId) return;

    setLoading(true);
    setError('');
    setReport(null);
    setPhrase('');
    setPassword('');
    setReason('');

    getDeletionImpact(entityType, entityId)
      .then((res) => setReport(res.data?.data ?? null))
      .catch((err) => setError(err.response?.data?.message || t('hardDelete.previewFailed')))
      .finally(() => setLoading(false));
  }, [entityType, entityId, t]);

  useEffect(() => {
    if (open) runPreview();
  }, [open, runPreview]);

  // ── Ticket countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!report?.expiresAt) { setSecondsLeft(0); return; }

    const tick = () => {
      const remaining = Math.max(0, Math.floor((new Date(report.expiresAt) - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [report?.expiresAt]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const blocked      = Boolean(report && !report.deletable);
  const ticketLapsed = Boolean(report?.deletable && secondsLeft === 0);

  // The bound comes from the server that will enforce it (CLAUDE.md §0.1 — the backend is the
  // single source of truth); the constant is only a floor for an API that does not send it.
  const minReasonLength = report?.requirements?.minReasonLength ?? MIN_REASON_LENGTH_FALLBACK;

  const phraseMatches = useMemo(() => {
    if (!report?.confirmationPhrase) return false;
    return phrase.trim().replace(/\s+/g, ' ').toUpperCase() === report.confirmationPhrase;
  }, [phrase, report?.confirmationPhrase]);

  const canSubmit =
    Boolean(report?.deletable) &&
    !ticketLapsed &&
    phraseMatches &&
    password.length > 0 &&
    reason.trim().length >= minReasonLength &&
    !busy;

  const handleClose = useCallback(() => {
    if (busy) return;
    document.activeElement?.blur();
    onClose?.();
  }, [busy, onClose]);

  const handleConfirm = useCallback(async () => {
    if (!canSubmit) return;

    setBusy(true);
    setError('');

    try {
      const res = await executeHardDelete(entityType, entityId, {
        ticket:             report.ticket,
        confirmationPhrase: phrase.trim(),
        password,
        reason:             reason.trim(),
      });

      onDeleted?.(res.data?.data ?? null);
      onClose?.();
    } catch (err) {
      const message = err.response?.data?.message || t('hardDelete.deleteFailed');

      // A 409 means the ticket is spent. Keeping the report on screen would leave the operator
      // resubmitting a token the server has already refused; the honest move is back to step 1,
      // where they re-read an impact report that may well have changed under them.
      if (err.response?.status === STALE_TICKET_STATUS) {
        setReport(null);
        setPassword('');
      }

      setError(message);
    } finally {
      setBusy(false);
    }
  }, [canSubmit, entityType, entityId, report, phrase, password, reason, onDeleted, onClose, t]);

  const targetLabel = report?.entity?.label || entityLabel;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <DeleteForever sx={{ fontSize: 40, color: 'error.main' }} />
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {t('hardDelete.title')}
            </Typography>
            {targetLabel && (
              <Typography variant="body2" color="text.secondary">
                {targetLabel}
                {report?.entity?.identifier ? ` · ${report.entity.identifier}` : ''}
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {loading && (
          <Stack spacing={1.5} sx={{ py: 3 }}>
            <LinearProgress color="error" />
            <Typography variant="body2" color="text.secondary" textAlign="center">
              {t('hardDelete.computingImpact')}
            </Typography>
          </Stack>
        )}

        {/* No report on screen: either the preview failed, or a 409 discarded a spent ticket.
            Both are recoverable by re-running the preview, so the action is offered here rather
            than forcing the operator to close and reopen the dialog. */}
        {!loading && error && !report && (
          <Alert
            severity="error"
            sx={{ mt: 1 }}
            action={
              <Button
                size="small"
                color="inherit"
                startIcon={<Refresh />}
                onClick={runPreview}
                sx={{ textTransform: 'none' }}
              >
                {t('hardDelete.rerunPreview')}
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {!loading && report && (
          <Stack spacing={2.5}>

            {/* ── Irreversibility warning ── */}
            <Alert severity="error" icon={<WarningAmber />}>
              <AlertTitle sx={{ fontWeight: 700 }}>{t('hardDelete.irreversibleTitle')}</AlertTitle>
              {t('hardDelete.irreversibleBody')}
            </Alert>

            {/* ── Blockers ── */}
            {blocked && (
              <Alert severity="warning" icon={<Block />}>
                <AlertTitle sx={{ fontWeight: 700 }}>{t('hardDelete.blockedTitle')}</AlertTitle>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {report.cascade?.overLimit
                    ? t('hardDelete.cascadeOverLimitBody', {
                        count: report.cascade.total,
                        limit: report.cascade.limit,
                      })
                    : t('hardDelete.blockedBody')}
                </Typography>
                <List dense disablePadding>
                  {report.blockers.map((b) => (
                    <ListItem key={`${b.model}-${b.label}`} disableGutters sx={{ py: 0.25 }}>
                      <ListItemText
                        primary={`${b.label} — ${b.count}`}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Alert>
            )}

            {/* ── Impact report ── */}
            {report.impact.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  {t('hardDelete.impactTitle')}
                </Typography>
                <Stack spacing={0.75}>
                  {report.impact.map((line) => {
                    const style = MODE_STYLE[line.mode] ?? MODE_STYLE.detach;
                    return (
                      <Stack
                        key={`${line.model}-${line.label}`}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Typography variant="body2">{line.label}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {/* Counts are capped server-side; "10000+" is the honest rendering. */}
                          <Typography variant="body2" fontWeight={700}>
                            {line.capped ? `${line.count}+` : line.count}
                          </Typography>
                          <Chip
                            size="small"
                            color={style.color}
                            variant="outlined"
                            label={t(style.labelKey)}
                          />
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {report.impact.length === 0 && !blocked && (
              <Typography variant="body2" color="text.secondary">
                {t('hardDelete.noSideEffects')}
              </Typography>
            )}

            {/* ── Step 2: the three controls ── */}
            {!blocked && (
              <>
                <Divider />

                {ticketLapsed && (
                  <Alert
                    severity="warning"
                    action={
                      <Button
                        size="small"
                        color="inherit"
                        startIcon={<Refresh />}
                        onClick={runPreview}
                        disabled={busy}
                        sx={{ textTransform: 'none' }}
                      >
                        {t('hardDelete.rerunPreview')}
                      </Button>
                    }
                  >
                    {t('hardDelete.ticketExpired')}
                  </Alert>
                )}

                {!ticketLapsed && secondsLeft > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {t('hardDelete.ticketCountdown', { seconds: secondsLeft })}
                  </Typography>
                )}

                <TextField
                  label={t('hardDelete.phraseLabel')}
                  helperText={
                    <Box component="span">
                      {t('hardDelete.phraseHelper')}{' '}
                      <Box component="code" sx={{ fontWeight: 700, color: 'error.main' }}>
                        {report.confirmationPhrase}
                      </Box>
                    </Box>
                  }
                  value={phrase}
                  onChange={(e) => setPhrase(e.target.value)}
                  error={phrase.length > 0 && !phraseMatches}
                  fullWidth
                  autoComplete="off"
                  disabled={busy || ticketLapsed}
                  slotProps={{ htmlInput: { spellCheck: 'false', autoCapitalize: 'characters' } }}
                />

                <TextField
                  label={t('hardDelete.passwordLabel')}
                  helperText={t('hardDelete.passwordHelper')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  autoComplete="current-password"
                  disabled={busy || ticketLapsed}
                  slotProps={{ input: { startAdornment: <LockOutlined sx={{ mr: 1, color: 'text.disabled' }} /> } }}
                />

                <TextField
                  label={t('hardDelete.reasonLabel')}
                  helperText={t('hardDelete.reasonHelper', { min: minReasonLength })}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  error={reason.length > 0 && reason.trim().length < minReasonLength}
                  slotProps={{ htmlInput: { maxLength: report.requirements?.maxReasonLength } }}
                  fullWidth
                  multiline
                  minRows={2}
                  disabled={busy || ticketLapsed}
                />

                {error && <Alert severity="error">{error}</Alert>}
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          disabled={busy}
          sx={{ textTransform: 'none', borderRadius: 2 }}
        >
          {blocked ? t('action.close') : t('action.cancel')}
        </Button>

        {!blocked && report && (
          <Button
            variant="contained"
            color="error"
            disabled={!canSubmit}
            startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <ArrowForward />}
            onClick={handleConfirm}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            {busy ? t('hardDelete.deleting') : t('hardDelete.confirmButton')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default HardDeleteDialog;
