/**
 * @file PartnerDetailDrawer.jsx
 * @description 480px drawer showing the full partner profile with 5 tabs.
 *
 * Tabs:
 *   0. Profile     — contact info, type, convention, bio
 *   1. Leads       — lead KPIs from computed partner stats
 *   2. Commissions — commission summary via getCommissionSummary()
 *   3. Kit         — QR code + referral link + download
 *   4. Settings    — status, regenerate QR, archive
 *
 * @param {Object|null} entity     - Partner document (with totalLeads, totalConverted)
 * @param {Function}    onClose
 * @param {Function}    onEdit
 * @param {Function}    onToggleStatus
 * @param {Function}    onArchive
 * @param {Function}    onRegenerateQR
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Avatar, Stack, Divider, Chip, IconButton,
  Tabs, Tab, Button, List, ListItem, ListItemIcon, ListItemText,
  Paper, CircularProgress, Tooltip, Alert, Snackbar,
  Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Skeleton,
} from '@mui/material';
import {
  Close, Edit, Email, Phone, Domain, Badge,
  ContentCopy, Download, QrCode2, Block, CheckCircle,
  Delete, Refresh, TrendingUp, People, AttachMoney,
  EmojiEvents, Business, School, LinkOutlined,
} from '@mui/icons-material';

import { getCommissionSummary, downloadKit, getPartnerLeads } from '../../../services/partnerService';
import { IMAGE_BASE_URL } from '../../../config/env';
import useFormSnackbar from '../../../hooks/useFormSnackBar';
import {
  BRAND_GRADIENT, BRAND_GRADIENT_BTN,
  BRAND_ORANGE, WHATSAPP_BG,
  TIER_COLOR, LEAD_STATUS_COLOR, LEAD_STATUS_LABEL,
  partnerStatusColor,
} from '../../../theme/partnerTokens';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusChipColor = partnerStatusColor;

const DetailItem = ({ icon, primary, secondary }) => (
  <ListItem disablePadding sx={{ py: 0.75 }}>
    <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
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

const KpiBox = ({ label, value, color }) => (
  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: 'center', flex: 1 }}>
    <Typography variant="h5" fontWeight={800} sx={{ color }}>
      {value ?? '—'}
    </Typography>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
  </Paper>
);

// ─── Component ────────────────────────────────────────────────────────────────

const PartnerDetailDrawer = ({
  entity: partner,
  onClose,
  onEdit,
  onToggleStatus,
  onArchive,
  onRegenerateQR,
}) => {
  const [tab,            setTab]            = useState(0);
  const [commSummary,    setCommSummary]    = useState(null);
  const [commLoading,    setCommLoading]    = useState(false);
  const [leads,          setLeads]          = useState([]);
  const [leadsLoading,   setLeadsLoading]   = useState(false);
  const [copied,         setCopied]         = useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  // ─── Fetch commission summary on tab 2 ──────────────────────────────────────

  const fetchCommSummary = useCallback(async () => {
    if (!partner?._id) return;
    setCommLoading(true);
    try {
      const res = await getCommissionSummary(partner._id);
      setCommSummary(res.data?.data ?? res.data);
    } catch {
      setCommSummary(null);
    } finally {
      setCommLoading(false);
    }
  }, [partner?._id]);

  const fetchLeads = useCallback(async () => {
    if (!partner?._id) return;
    setLeadsLoading(true);
    try {
      const res = await getPartnerLeads(partner._id, 10);
      setLeads(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch {
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [partner?._id]);

  useEffect(() => {
    if (tab === 1) fetchLeads();
    if (tab === 2) fetchCommSummary();
  }, [tab, fetchLeads, fetchCommSummary]);

  // Reset tab when partner changes
  useEffect(() => { setTab(0); }, [partner?._id]);

  if (!partner) return null;

  const tierColor    = TIER_COLOR[partner.tier] ?? TIER_COLOR.silver;
  const totalLeads   = partner.totalLeads   ?? 0;
  const totalConverted = partner.totalConverted ?? 0;
  const conversion   = totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0;

  // QR image URL (dev: local uploads; prod: Cloudinary-hosted if starts with http)
  const qrUrl = partner.qrCodeFileName
    ? partner.qrCodeFileName.startsWith('http')
      ? partner.qrCodeFileName
      : `${IMAGE_BASE_URL}/uploads/${partner.schoolCampus}/partners/qr/${partner.qrCodeFileName}`
    : null;

  const handleCopyLink = () => {
    if (partner.referralLink) {
      navigator.clipboard.writeText(partner.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadKit = async () => {
    try {
      const res = await downloadKit(partner._id, 'qr');
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `qr_${partner.partnerCode}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showSnackbar('Failed to download kit.', 'error');
    }
  };

  const handleArchive = async () => {
    try {
      await onArchive(partner._id);
      onClose();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Cannot archive — pending commissions exist.', 'error');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ width: { xs: '100vw', sm: 480 }, height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          background: BRAND_GRADIENT,
          color: 'white',
          position: 'relative',
          marginTop: 5,
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8, color: 'white' }}
          aria-label="close"
        >
          <Close />
        </IconButton>

        <Stack alignItems="center" spacing={1.5} sx={{ mt: 3 }}>
          <Avatar
            src={partner.profileImage}
            sx={{
              width: 88, height: 88,
              border: '3px solid white',
              boxShadow: 3,
              fontSize: '1.8rem', fontWeight: 700,
              bgcolor: 'rgba(255,255,255,0.2)',
            }}
          >
            {partner.firstName?.[0]}{partner.lastName?.[0]}
          </Avatar>

          <Box textAlign="center">
            <Typography variant="h6" fontWeight={700}>
              {partner.firstName} {partner.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              {partner.email}
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
              {partner.partnerCode && (
                <Chip
                  icon={<Badge sx={{ fontSize: 12, color: 'white !important' }} />}
                  label={partner.partnerCode}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.18)', color: 'white',
                    fontFamily: 'monospace', fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.4)',
                  }}
                />
              )}
              <Chip
                icon={<EmojiEvents sx={{ fontSize: 12, color: `${tierColor} !important` }} />}
                label={partner.tier ?? 'bronze'}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)', color: 'white',
                  textTransform: 'capitalize',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', minHeight: 44 }}
        TabIndicatorProps={{ sx: { bgcolor: BRAND_ORANGE } }}
      >
        {['Profile', 'Leads', 'Commissions', 'Kit', 'Settings'].map((label) => (
          <Tab key={label} label={label} sx={{ minHeight: 44, textTransform: 'none', fontSize: '0.82rem' }} />
        ))}
      </Tabs>

      {/* ── Tab Content ───────────────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2.5 }}>

        {/* ── Tab 0: Profile ─────────────────────────────────────────────────── */}
        {tab === 0 && (
          <Stack spacing={2.5}>
            {/* Status */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Chip
                  label={partner.status}
                  color={statusChipColor(partner.status)}
                  size="small"
                  sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                />
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Edit">
                    <IconButton size="small" color="info" onClick={() => onEdit(partner)}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>

            {/* Contact */}
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
                Contact
              </Typography>
              <Divider sx={{ mb: 1, mt: 0.3 }} />
              <List disablePadding>
                <DetailItem icon={<Email color="action" fontSize="small" />} primary="Email"  secondary={partner.email} />
                <DetailItem icon={<Phone color="action" fontSize="small" />} primary="Phone"  secondary={partner.phone} />
                <DetailItem icon={<Domain color="action" fontSize="small" />} primary="Organization" secondary={partner.organization} />
              </List>
            </Box>

            {/* Partner type */}
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
                Partner Type
              </Typography>
              <Divider sx={{ mb: 1, mt: 0.3 }} />
              <List disablePadding>
                <DetailItem
                  icon={partner.partnerType === 'institutional'
                    ? <School color="action" fontSize="small" />
                    : <Business color="action" fontSize="small" />}
                  primary="Type"
                  secondary={partner.partnerType}
                />
                {partner.institutionType && (
                  <DetailItem icon={<School color="action" fontSize="small" />} primary="Institution" secondary={partner.institutionType} />
                )}
                {partner.commercialType && (
                  <DetailItem icon={<Business color="action" fontSize="small" />} primary="Commercial" secondary={partner.commercialType} />
                )}
                {partner.channelType && (
                  <DetailItem icon={<Domain color="action" fontSize="small" />} primary="Channel" secondary={partner.channelType} />
                )}
              </List>
            </Box>

            {/* Bio */}
            {partner.bio && (
              <Box>
                <Typography variant="overline" color="primary" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
                  Bio
                </Typography>
                <Divider sx={{ mb: 1, mt: 0.3 }} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {partner.bio}
                </Typography>
              </Box>
            )}

            {/* Convention */}
            {partner.convention?.startDate && (
              <Box>
                <Typography variant="overline" color="primary" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
                  Convention
                </Typography>
                <Divider sx={{ mb: 1, mt: 0.3 }} />
                <List disablePadding>
                  <DetailItem icon={<Badge color="action" fontSize="small" />} primary="Period"
                    secondary={`${partner.convention.startDate?.slice(0, 10)} → ${partner.convention.endDate?.slice(0, 10) ?? '...'}`}
                  />
                  {partner.convention.commissionType && (
                    <DetailItem icon={<AttachMoney color="action" fontSize="small" />} primary="Commission"
                      secondary={`${partner.convention.commissionType} — ${partner.convention.commissionValue ?? ''} ${partner.convention.currency ?? ''}`}
                    />
                  )}
                  {partner.convention.notes && (
                    <DetailItem icon={<Domain color="action" fontSize="small" />} primary="Notes" secondary={partner.convention.notes} />
                  )}
                </List>
              </Box>
            )}
          </Stack>
        )}

        {/* ── Tab 1: Leads ───────────────────────────────────────────────────── */}
        {tab === 1 && (
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.5}>
              <KpiBox label="Total Leads"    value={totalLeads}       color="primary.main"  />
              <KpiBox label="Enrolled"       value={totalConverted}   color="success.main"  />
              <KpiBox label="Conversion"     value={`${conversion}%`} color={conversion >= 50 ? 'success.main' : 'warning.main'} />
            </Stack>
            <Typography variant="overline" color="primary" fontWeight={700} sx={{ fontSize: '0.75rem' }}>
              Last 10 Leads
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Prospect</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leadsLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 3 }).map((__, j) => (
                            <TableCell key={j}><Skeleton variant="text" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center" sx={{ py: 3, color: 'text.secondary', fontSize: '0.8rem' }}>
                          No leads yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead._id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} fontSize="0.78rem">
                              {lead.firstName} {lead.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                              {lead.email}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={LEAD_STATUS_LABEL[lead.status] ?? lead.status}
                              color={LEAD_STATUS_COLOR[lead.status] ?? 'default'}
                              size="small"
                              sx={{ fontWeight: 600, fontSize: '0.67rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                              {new Date(lead.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        )}

        {/* ── Tab 2: Commissions ─────────────────────────────────────────────── */}
        {tab === 2 && (
          <Stack spacing={2}>
            {commLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : commSummary ? (
              <>
                <Stack direction="row" spacing={1.5} flexWrap="wrap">
                  <KpiBox label="Pending"   value={commSummary.pending   ?? 0} color="warning.main"  />
                  <KpiBox label="Validated" value={commSummary.validated ?? 0} color="info.main"     />
                  <KpiBox label="Paid"      value={commSummary.paid      ?? 0} color="success.main"  />
                </Stack>
                {(commSummary.totalAmount != null) && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                    <Typography variant="h6" fontWeight={700} color="success.main">
                      {commSummary.totalAmount?.toLocaleString()} {commSummary.currency ?? 'XAF'}
                    </Typography>
                  </Paper>
                )}
              </>
            ) : (
              <Alert severity="info" sx={{ borderRadius: 2 }}>No commission data yet.</Alert>
            )}
          </Stack>
        )}

        {/* ── Tab 3: Kit ─────────────────────────────────────────────────────── */}
        {tab === 3 && (
          <Stack spacing={2.5} alignItems="center">
            {qrUrl ? (
              <Box
                component="img"
                src={qrUrl}
                alt="Partner QR Code"
                sx={{
                  width: '100%', maxWidth: 200, aspectRatio: '1 / 1',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1,
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%', maxWidth: 200, aspectRatio: '1 / 1',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <QrCode2 sx={{ fontSize: 64, color: 'text.disabled' }} />
              </Box>
            )}

            {/* Referral link */}
            {partner.referralLink && (
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5, borderRadius: 2, width: '100%',
                  display: 'flex', alignItems: 'center', gap: 1,
                }}
              >
                <LinkOutlined color="action" fontSize="small" />
                <Typography
                  variant="caption"
                  noWrap sx={{ flex: 1, fontFamily: 'monospace', color: 'text.secondary' }}
                >
                  {partner.referralLink}
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                  <IconButton size="small" onClick={handleCopyLink}>
                    <ContentCopy fontSize="small" color={copied ? 'success' : 'action'} />
                  </IconButton>
                </Tooltip>
              </Paper>
            )}

            {/* WhatsApp message preview */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, width: '100%', bgcolor: WHATSAPP_BG }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                WhatsApp Message Template
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.78rem', lineHeight: 1.6, color: 'text.primary' }}>
                {`Bonjour ! Je vous invite à vous pré-inscrire à notre établissement. Utilisez mon lien personnalisé pour commencer : ${partner.referralLink ?? '[link]'}`}
              </Typography>
            </Paper>

            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={handleDownloadKit}
              fullWidth
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: 2,
                background: BRAND_GRADIENT_BTN,
              }}
            >
              Download QR Code
            </Button>
          </Stack>
        )}

        {/* ── Tab 4: Settings ────────────────────────────────────────────────── */}
        {tab === 4 && (
          <Stack spacing={2.5}>

            {/* Status toggle */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Account Status
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {['active', 'inactive', 'suspended'].map((s) => (
                  <Button
                    key={s}
                    size="small"
                    variant={partner.status === s ? 'contained' : 'outlined'}
                    color={s === 'active' ? 'success' : s === 'suspended' ? 'error' : 'inherit'}
                    onClick={() => onToggleStatus(partner._id, s)}
                    sx={{ textTransform: 'capitalize', borderRadius: 2, minWidth: 90 }}
                    disabled={partner.status === s}
                  >
                    {s}
                  </Button>
                ))}
              </Stack>
            </Paper>

            {/* Regenerate QR */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                QR Code
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => onRegenerateQR(partner._id)}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Regenerate QR Code
              </Button>
            </Paper>

            {/* Archive */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: 'error.light' }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom color="error">
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Archiving a partner is irreversible. It will be blocked if pending commissions exist.
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleArchive}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                Archive Partner
              </Button>
            </Paper>

          </Stack>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={closeSnackbar} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PartnerDetailDrawer;
