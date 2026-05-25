/**
 * @file LeadDetailDrawer.jsx
 * @description Lead detail panel — status history timeline + status transition.
 *
 * VALID_TRANSITIONS mirrors the backend state machine exactly.
 * On transition to 'enrolled', a tuitionFee field appears (needed by commission engine).
 *
 * @param {Object}   lead
 * @param {Function} onClose
 * @param {Function} onStatusChange(id, status, note, tuitionFee?)
 * @param {Function} onDelete(id)
 */

import { useState } from 'react';
import {
  Box, Typography, Stack, Chip, IconButton, Divider,
  Button, TextField, List, ListItem, ListItemIcon, ListItemText,
  Paper, Alert, Tooltip, CircularProgress,
} from '@mui/material';
import {
  Close, Email, Phone, School, QrCode2, Link,
  Warning, Delete, FiberManualRecord,
} from '@mui/icons-material';

// ─── Pipeline state machine ───────────────────────────────────────────────────

const VALID_TRANSITIONS = {
  new:               ['contacted', 'rejected', 'abandoned'],
  contacted:         ['dossier_submitted', 'rejected', 'abandoned'],
  dossier_submitted: ['admitted', 'rejected', 'abandoned'],
  admitted:          ['enrolled', 'rejected', 'abandoned'],
  enrolled:          [],
  rejected:          [],
  abandoned:         [],
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_COLOR = {
  new:               'default',
  contacted:         'info',
  dossier_submitted: 'warning',
  admitted:          'secondary',
  enrolled:          'success',
  rejected:          'error',
  abandoned:         'default',
};

const STATUS_LABEL = {
  new:               'New',
  contacted:         'Contacted',
  dossier_submitted: 'Dossier Submitted',
  admitted:          'Admitted',
  enrolled:          'Enrolled',
  rejected:          'Rejected',
  abandoned:         'Abandoned',
};

const TRANSITION_VARIANT = {
  enrolled:  'contained',
  admitted:  'contained',
  contacted: 'outlined',
  dossier_submitted: 'outlined',
  rejected:  'outlined',
  abandoned: 'outlined',
};

const TRANSITION_COLOR = {
  enrolled:          'success',
  admitted:          'primary',
  contacted:         'info',
  dossier_submitted: 'warning',
  rejected:          'error',
  abandoned:         'inherit',
};

const SOURCE_LABEL = {
  qr_code:       'QR Code',
  referral_link: 'Referral Link',
  manual_code:   'Manual Code',
  direct:        'Direct',
};

const FRAUD_ICON = { IP_BURST: '⚡', SELF_REFERRAL: '🚫', DUPLICATE_LEAD: '👥', MANUAL_REVIEW: '🔍' };

// ─── Detail row ───────────────────────────────────────────────────────────────

const DetailItem = ({ icon, primary, secondary }) => (
  <ListItem disablePadding sx={{ py: 0.6 }}>
    <ListItemIcon sx={{ minWidth: 34 }}>{icon}</ListItemIcon>
    <ListItemText
      primary={primary}
      secondary={secondary || '—'}
      slotProps={{
        primary:   { variant: 'caption', color: 'text.secondary' },
        secondary: { variant: 'body2',   fontWeight: 500 },
      }}
    />
  </ListItem>
);

// ─── Component ────────────────────────────────────────────────────────────────

const LeadDetailDrawer = ({ lead, onClose, onStatusChange, onDelete }) => {
  const [note,        setNote]        = useState('');
  const [tuitionFee,  setTuitionFee]  = useState('');
  const [transitioning, setTransitioning] = useState(false);
  const [activeTarget,  setActiveTarget]  = useState(null);

  if (!lead) return null;

  const nextStatuses = VALID_TRANSITIONS[lead.status] ?? [];
  const canDelete    = !lead.commissionId;

  const handleTransition = async (targetStatus) => {
    setTransitioning(true);
    setActiveTarget(targetStatus);
    try {
      const fee = targetStatus === 'enrolled' && tuitionFee
        ? parseFloat(tuitionFee)
        : undefined;
      await onStatusChange(lead._id, targetStatus, note, fee);
      setNote('');
      setTuitionFee('');
    } finally {
      setTransitioning(false);
      setActiveTarget(null);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: 2.5,
          background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
          color: 'white',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          size="small"
        >
          <Close />
        </IconButton>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            {lead.firstName} {lead.lastName}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.3 }}>
            {lead.email}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap">
            <Chip
              label={STATUS_LABEL[lead.status] ?? lead.status}
              color={STATUS_COLOR[lead.status]}
              size="small"
              sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.22)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
            />
            {lead.partnerCode && (
              <Chip
                label={lead.partnerCode}
                size="small"
                sx={{ fontFamily: 'monospace', bgcolor: 'rgba(255,255,255,0.14)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              />
            )}
          </Stack>
        </Box>
      </Box>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>
        <Stack spacing={2.5}>

          {/* Fraud flags */}
          {lead.fraudFlags?.length > 0 && (
            <Alert severity="warning" icon={<Warning />} sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Fraud Flags</Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {lead.fraudFlags.map((f) => (
                  <Chip
                    key={f}
                    label={`${FRAUD_ICON[f] ?? ''} ${f}`}
                    size="small"
                    color="warning"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                ))}
              </Stack>
            </Alert>
          )}

          {/* Contact info */}
          <Box>
            <Typography variant="overline" color="primary" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
              Contact
            </Typography>
            <Divider sx={{ mb: 1, mt: 0.3 }} />
            <List disablePadding>
              <DetailItem icon={<Email color="action" fontSize="small" />}  primary="Email"   secondary={lead.email} />
              <DetailItem icon={<Phone color="action" fontSize="small" />}  primary="Phone"   secondary={lead.phone} />
              <DetailItem icon={<School color="action" fontSize="small" />} primary="Program" secondary={lead.programInterest} />
              <DetailItem
                icon={lead.source === 'qr_code' ? <QrCode2 color="action" fontSize="small" /> : <Link color="action" fontSize="small" />}
                primary="Source"
                secondary={SOURCE_LABEL[lead.source] ?? lead.source}
              />
            </List>
          </Box>

          {/* Partner */}
          {lead.partner && (
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
                Referred By
              </Typography>
              <Divider sx={{ mb: 1, mt: 0.3 }} />
              <Typography variant="body2" fontWeight={500}>
                {lead.partner.firstName} {lead.partner.lastName}
              </Typography>
              <Typography variant="caption" color="text.secondary">{lead.partner.email}</Typography>
            </Box>
          )}

          {/* Status history */}
          {lead.statusHistory?.length > 0 && (
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
                Status History
              </Typography>
              <Divider sx={{ mb: 1.5, mt: 0.3 }} />
              <Stack spacing={0}>
                {[...lead.statusHistory].reverse().map((event, idx) => (
                  <Stack key={idx} direction="row" spacing={1.5} alignItems="flex-start">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                      <FiberManualRecord
                        sx={{
                          fontSize: 10,
                          color: idx === 0 ? 'primary.main' : 'text.disabled',
                        }}
                      />
                      {idx < lead.statusHistory.length - 1 && (
                        <Box sx={{ width: 1, flex: 1, bgcolor: 'divider', minHeight: 20 }} />
                      )}
                    </Box>
                    <Box sx={{ pb: 1.5 }}>
                      <Chip
                        label={STATUS_LABEL[event.status] ?? event.status}
                        color={STATUS_COLOR[event.status]}
                        size="small"
                        sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                        {event.changedAt ? new Date(event.changedAt).toLocaleString() : ''}
                        {event.note ? ` — ${event.note}` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {/* Status transition */}
          {nextStatuses.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Advance Status
              </Typography>

              {/* Tuition fee — shown only when enrolled is a valid next step */}
              {nextStatuses.includes('enrolled') && (
                <TextField
                  size="small"
                  fullWidth
                  type="number"
                  label="Tuition Fee (for commission calc)"
                  value={tuitionFee}
                  onChange={(e) => setTuitionFee(e.target.value)}
                  sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  placeholder="e.g. 500000"
                />
              )}

              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                label="Note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {nextStatuses.map((target) => (
                  <Button
                    key={target}
                    size="small"
                    variant={TRANSITION_VARIANT[target] ?? 'outlined'}
                    color={TRANSITION_COLOR[target] ?? 'inherit'}
                    disabled={transitioning}
                    onClick={() => handleTransition(target)}
                    startIcon={
                      transitioning && activeTarget === target
                        ? <CircularProgress size={12} color="inherit" />
                        : null
                    }
                    sx={{ textTransform: 'none', borderRadius: 2, minWidth: 90 }}
                  >
                    {STATUS_LABEL[target] ?? target}
                  </Button>
                ))}
              </Stack>
            </Paper>
          )}

          {/* Terminal state notice */}
          {nextStatuses.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              This lead has reached a terminal status (<strong>{STATUS_LABEL[lead.status]}</strong>)
              and cannot be advanced further.
            </Alert>
          )}

          {/* Delete */}
          <Box>
            <Divider sx={{ mb: 1.5 }} />
            <Tooltip title={canDelete ? '' : 'Cannot remove — a commission is attached to this lead.'}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  disabled={!canDelete}
                  onClick={() => onDelete(lead._id)}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Remove Lead
                </Button>
              </span>
            </Tooltip>
          </Box>

        </Stack>
      </Box>
    </Box>
  );
};

export default LeadDetailDrawer;
