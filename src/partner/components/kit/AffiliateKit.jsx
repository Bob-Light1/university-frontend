/**
 * @file AffiliateKit.jsx
 * @description Partner portal — affiliate kit page.
 *
 * Shows QR code, referral link (copy), WhatsApp message template, and download button.
 * The QR file URL is constructed from IMAGE_BASE_URL + campusId + qrCodeFileName.
 */

import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Stack, Chip, Divider,
  Button, IconButton, Tooltip, CircularProgress,
  Alert, TextField, Snackbar,
} from '@mui/material';
import {
  QrCode2, ContentCopy, Download, WhatsApp, Share,
  LinkOutlined, Badge, Sms,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { getMe, downloadMyKit } from '../../../services/partnerService';
import { IMAGE_BASE_URL }       from '../../../config/env';
import useFormSnackbar           from '../../../hooks/useFormSnackBar';
import {
  BRAND_ORANGE, BRAND_GRADIENT_BTN,
  WHATSAPP_GREEN, WHATSAPP_GREEN_HOVER, WHATSAPP_BG, WHATSAPP_BORDER,
  SMS_BG, SMS_BORDER,
} from '../../../theme/partnerTokens';

// ─── Component ────────────────────────────────────────────────────────────────

export default function AffiliateKit() {
  const theme = useTheme();
  const [profile,     setProfile]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [copied,      setCopied]      = useState(null); // 'link' | 'msg' | 'sms' | null
  const [downloading, setDownloading] = useState(false);
  const { snackbar, showSnackbar, closeSnackbar } = useFormSnackbar();

  useEffect(() => {
    getMe()
      .then((r) => setProfile(r.data?.data ?? r.data))
      .catch(() => showSnackbar('Failed to load profile.', 'error'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: BRAND_ORANGE }} />
      </Box>
    );
  }

  const qrUrl = profile?.qrCodeFileName
    ? profile.qrCodeFileName.startsWith('http')
      ? profile.qrCodeFileName
      : `${IMAGE_BASE_URL}/uploads/${profile.schoolCampus}/partners/qr/${profile.qrCodeFileName}`
    : null;

  const whatsappMsg = profile?.referralLink
    ? `Bonjour ! Je vous invite à vous pré-inscrire dans notre établissement. Utilisez mon lien personnalisé pour commencer votre dossier : ${profile.referralLink}\n\nCode partenaire : ${profile.partnerCode ?? ''}`
    : '';

  const smsMsg = profile?.referralLink
    ? `Inscrivez-vous via mon lien : ${profile.referralLink} Code: ${profile.partnerCode ?? ''}`
    : '';
  const smsCharCount = smsMsg.length;
  const smsSplits    = Math.ceil(smsCharCount / 160);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = async (type = 'qr') => {
    setDownloading(true);
    try {
      const res = await downloadMyKit(type);
      const isPdf = type === 'pdf';
      const url = URL.createObjectURL(
        new Blob([res.data], isPdf ? { type: 'application/pdf' } : undefined),
      );
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${isPdf ? 'flyer' : 'qr'}_${profile?.partnerCode ?? 'kit'}.${isPdf ? 'pdf' : 'png'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showSnackbar('Download failed. Please try again.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 760, mx: 'auto' }}>

      <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Affiliate Kit</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Use these tools to share your referral link and track incoming leads.
      </Typography>

      <Stack spacing={3}>

        {/* ── QR Code ─────────────────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <QrCode2 sx={{ color: BRAND_ORANGE }} />
            <Typography variant="subtitle1" fontWeight={700}>QR Code</Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            {qrUrl ? (
              <Box
                component="img"
                src={qrUrl}
                alt="Partner QR Code"
                sx={{
                  width: '100%', maxWidth: 180, aspectRatio: '1 / 1',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1, flexShrink: 0,
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%', maxWidth: 180, aspectRatio: '1 / 1',
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <QrCode2 sx={{ fontSize: 64, color: 'text.disabled' }} />
              </Box>
            )}

            <Stack spacing={1.5} sx={{ flex: 1, width: '100%' }}>
              {profile?.partnerCode && (
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Partner Code
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                    <Chip
                      icon={<Badge sx={{ fontSize: 14 }} />}
                      label={profile.partnerCode}
                      sx={{ fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}
                    />
                  </Stack>
                </Box>
              )}

              <Typography variant="body2" color="text.secondary">
                This QR code links directly to the pre-registration form pre-filled with your partner code.
                Prospects can scan it with their phone camera.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  variant="contained"
                  startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
                  onClick={() => handleDownload('qr')}
                  disabled={!qrUrl || downloading}
                  sx={{
                    textTransform: 'none', fontWeight: 700, borderRadius: 2, alignSelf: 'flex-start',
                    background: BRAND_GRADIENT_BTN,
                  }}
                >
                  {downloading ? 'Downloading…' : 'Download QR Code'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleDownload('pdf')}
                  disabled={!profile?.referralLink || downloading}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, alignSelf: 'flex-start' }}
                >
                  Download Flyer (PDF)
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        {/* ── Referral Link ────────────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <LinkOutlined sx={{ color: BRAND_ORANGE }} />
            <Typography variant="subtitle1" fontWeight={700}>Referral Link</Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

          {profile?.referralLink ? (
            <Stack spacing={1.5}>
              <TextField
                fullWidth
                value={profile.referralLink}
                size="small"
                slotProps={{ input: { readOnly: true } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: 'monospace' } }}
              />
              <Stack direction="row" spacing={1}>
                <Tooltip title={copied === 'link' ? 'Copied!' : 'Copy link'}>
                  <Button
                    size="small"
                    variant={copied === 'link' ? 'contained' : 'outlined'}
                    color={copied === 'link' ? 'success' : 'primary'}
                    startIcon={<ContentCopy />}
                    onClick={() => handleCopy(profile.referralLink, 'link')}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    {copied === 'link' ? 'Copied!' : 'Copy Link'}
                  </Button>
                </Tooltip>
                {navigator.share && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Share />}
                    onClick={() => navigator.share({ url: profile.referralLink, title: 'Register with my link' })}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    Share
                  </Button>
                )}
              </Stack>
            </Stack>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              No referral link generated yet. Contact your campus manager.
            </Alert>
          )}
        </Paper>

        {/* ── SMS Template ─────────────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Sms sx={{ color: theme.palette.info.main }} />
            <Typography variant="subtitle1" fontWeight={700}>SMS Template</Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

          {smsMsg ? (
            <>
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 2, bgcolor: SMS_BG, borderColor: SMS_BORDER }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {smsMsg}
                </Typography>
              </Paper>

              {smsCharCount > 160 && (
                <Alert severity="warning" sx={{ mt: 1.5, borderRadius: 2 }}>
                  {smsCharCount} characters — will be split into {smsSplits} SMS messages.
                </Alert>
              )}

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                <Tooltip title={copied === 'sms' ? 'Copied!' : 'Copy SMS'}>
                  <Button
                    size="small"
                    variant={copied === 'sms' ? 'contained' : 'outlined'}
                    color={copied === 'sms' ? 'success' : 'primary'}
                    startIcon={<ContentCopy />}
                    onClick={() => handleCopy(smsMsg, 'sms')}
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                  >
                    {copied === 'sms' ? 'Copied!' : 'Copy SMS'}
                  </Button>
                </Tooltip>
                <Typography variant="caption" color="text.secondary">
                  {smsCharCount}/160 chars
                </Typography>
              </Stack>
            </>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              No referral link generated yet. Contact your campus manager.
            </Alert>
          )}
        </Paper>

        {/* ── WhatsApp Template ────────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <WhatsApp sx={{ color: WHATSAPP_GREEN }} />
            <Typography variant="subtitle1" fontWeight={700}>WhatsApp Message Template</Typography>
          </Stack>
          <Divider sx={{ mb: 2.5 }} />

          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 2, bgcolor: WHATSAPP_BG, borderColor: WHATSAPP_BORDER }}
          >
            <Typography
              variant="body2"
              sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: 'inherit' }}
            >
              {whatsappMsg || 'Referral link not available.'}
            </Typography>
          </Paper>

          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Tooltip title={copied === 'msg' ? 'Copied!' : 'Copy message'}>
              <Button
                size="small"
                variant={copied === 'msg' ? 'contained' : 'outlined'}
                color={copied === 'msg' ? 'success' : 'inherit'}
                startIcon={<ContentCopy />}
                disabled={!whatsappMsg}
                onClick={() => handleCopy(whatsappMsg, 'msg')}
                sx={{ textTransform: 'none', borderRadius: 2 }}
              >
                {copied === 'msg' ? 'Copied!' : 'Copy Message'}
              </Button>
            </Tooltip>
            {profile?.referralLink && (
              <Button
                size="small"
                variant="contained"
                startIcon={<WhatsApp />}
                component="a"
                href={`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  textTransform: 'none', borderRadius: 2,
                  bgcolor: WHATSAPP_GREEN,
                  '&:hover': { bgcolor: WHATSAPP_GREEN_HOVER },
                }}
              >
                Open WhatsApp
              </Button>
            )}
          </Stack>
        </Paper>

      </Stack>

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
}
