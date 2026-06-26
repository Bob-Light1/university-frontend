/**
 * @file PartnerDashboard.jsx
 * @description Partner portal — KPI overview dashboard.
 *
 * Fetches: GET /partners/me (profile) + GET /partners/me/dashboard (KPIs).
 * Shows tier badge, referral link, KPI cards, recent leads, recent commissions.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Avatar, Stack, Chip,
  CircularProgress, Alert, Divider, Grid,
  Table, TableBody, TableCell, TableHead, TableRow,
  TableContainer, IconButton, Tooltip, LinearProgress,
} from '@mui/material';
import {
  ContentCopy, TrendingUp, People, AttachMoney,
  HourglassEmpty, EmojiEvents, CheckCircle, Paid,
  ArrowForwardIos,
} from '@mui/icons-material';

import { useTheme } from '@mui/material/styles';
import { getMe, getMyDashboard } from '../../../services/partnerService';
import { IMAGE_BASE_URL } from '../../../config/env';
import {
  TIER_COLOR, LEAD_STATUS_COLOR, COMMISSION_STATUS_COLOR,
  BRAND_ORANGE, BRAND_GRADIENT,
} from '../../../theme/partnerTokens';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, color, subtitle }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 2.5, borderRadius: 3, flex: 1,
      borderLeft: `4px solid ${color}`,
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: 4 },
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={900} sx={{ color, lineHeight: 1.2, mt: 0.5 }}>
          {value ?? '—'}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.disabled">{subtitle}</Typography>
        )}
      </Box>
      <Box sx={{
        p: 1, borderRadius: 2,
        bgcolor: `${color}18`,
        color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </Box>
    </Stack>
  </Paper>
);

// ─── Component ────────────────────────────────────────────────────────────────

export default function PartnerDashboard() {
  const navigate  = useNavigate();
  const theme     = useTheme();

  const [profile,          setProfile]          = useState(null);
  const [dashboard,        setDashboard]        = useState(null);
  const [profileLoading,   setProfileLoading]   = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error,            setError]            = useState('');
  const [copied,           setCopied]           = useState(false);

  useEffect(() => {
    getMe()
      .then((r) => setProfile(r.data?.data ?? r.data))
      .catch(() => setError('Failed to load profile.'))
      .finally(() => setProfileLoading(false));

    getMyDashboard()
      .then((r) => {
        // Backend shape: { kpis: {...}, recentLeads, recentCommissions }.
        // Flatten kpis to the root so the cards below can read them directly.
        const d = r.data?.data ?? r.data ?? {};
        setDashboard({
          ...(d.kpis ?? {}),
          recentLeads:       d.recentLeads ?? [],
          recentCommissions: d.recentCommissions ?? [],
        });
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setDashboardLoading(false));
  }, []);

  const loading = profileLoading || dashboardLoading;

  const handleCopyLink = () => {
    if (profile?.referralLink) {
      navigator.clipboard.writeText(profile.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const tierColor = TIER_COLOR[profile?.tier] ?? TIER_COLOR.silver;

  const conversionRate = dashboard?.conversionRate != null
    ? `${Math.round(dashboard.conversionRate)}%`
    : dashboard?.totalLeads > 0
      ? `${Math.round((dashboard.convertedLeads / dashboard.totalLeads) * 100)}%`
      : '0%';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress sx={{ color: BRAND_ORANGE }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: 'auto' }}>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* ── Partner identity card ──────────────────────────────────────────────── */}
      <Paper
        sx={{
          p: 3, mb: 3, borderRadius: 3,
          background: BRAND_GRADIENT,
          color: 'white',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="center">
          <Avatar
            src={profile?.profileImage?.startsWith('http') ? profile.profileImage
              : profile?.profileImage ? `${IMAGE_BASE_URL}/${profile.profileImage}` : null}
            sx={{ width: 72, height: 72, border: '3px solid rgba(255,255,255,0.6)', fontSize: '1.6rem' }}
          >
            {profile?.firstName?.[0]}{profile?.lastName?.[0]}
          </Avatar>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={700}>
              {profile?.firstName} {profile?.lastName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>{profile?.email}</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
              {profile?.partnerCode && (
                <Chip
                  label={profile.partnerCode}
                  size="small"
                  sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)' }}
                />
              )}
              <Chip
                icon={<EmojiEvents sx={{ fontSize: 14, color: `${tierColor} !important` }} />}
                label={profile?.tier ?? 'bronze'}
                size="small"
                sx={{ textTransform: 'capitalize', bgcolor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}
              />
            </Stack>
          </Box>

          {/* Referral link */}
          {profile?.referralLink && (
            <Paper
              sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.15)', maxWidth: 320, width: '100%' }}
            >
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}>
                Your referral link
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption" noWrap sx={{ flex: 1, fontFamily: 'monospace', color: 'white' }}>
                  {profile.referralLink}
                </Typography>
                <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                  <IconButton size="small" onClick={handleCopyLink} sx={{ color: 'white' }}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          )}
        </Stack>

        {/* Tier progress bar */}
        {profile?.tier && profile.tier !== 'platinum' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              Tier: <strong style={{ textTransform: 'capitalize' }}>{profile.tier}</strong>
              {' '}→ {profile.tier === 'bronze' ? 'Silver' : profile.tier === 'silver' ? 'Gold' : 'Platinum'}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={dashboard?.totalLeads > 0 ? Math.min((dashboard.convertedLeads / 10) * 100, 100) : 5}
              sx={{
                mt: 0.5, height: 5, borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 3 },
              }}
            />
          </Box>
        )}
      </Paper>

      {/* ── KPI Cards ──────────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Leads',    value: dashboard?.totalLeads ?? 0,         icon: <People sx={{ fontSize: 24 }} />,        color: theme.palette.info.main,       subtitle: 'Prospects referred' },
          { label: 'Enrolled',       value: dashboard?.convertedLeads ?? 0,     icon: <CheckCircle sx={{ fontSize: 24 }} />,   color: theme.palette.success.dark,    subtitle: 'Converted leads' },
          { label: 'Conversion',     value: conversionRate,                      icon: <TrendingUp sx={{ fontSize: 24 }} />,    color: BRAND_ORANGE,                  subtitle: 'Leads → enrolled' },
          { label: 'Pending Comm.',  value: dashboard?.pendingCommissions ?? 0,  icon: <HourglassEmpty sx={{ fontSize: 24 }} />, color: theme.palette.warning.main,   subtitle: 'Awaiting payment' },
          { label: 'Paid Comm.',     value: dashboard?.paidCommissions ?? 0,     icon: <Paid sx={{ fontSize: 24 }} />,          color: theme.palette.secondary.dark,  subtitle: 'Settled' },
          { label: 'Validated',      value: dashboard?.validatedCommissions ?? 0, icon: <AttachMoney sx={{ fontSize: 24 }} />,  color: theme.palette.info.light,      subtitle: 'Ready to pay' },
        ].map((m) => (
          <Grid item xs={12} sm={6} md={4} key={m.label}>
            <KpiCard {...m} />
          </Grid>
        ))}
      </Grid>

      {/* ── Recent Leads ───────────────────────────────────────────────────────── */}
      {dashboard?.recentLeads?.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, pt: 2, pb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>Recent Leads</Typography>
            <Tooltip title="See all leads">
              <IconButton size="small" onClick={() => navigate('/partner/leads')}>
                <ArrowForwardIos fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Prospect</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboard.recentLeads.map((lead) => (
                  <TableRow key={lead._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {lead.firstName} {lead.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">{lead.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={lead.status}
                        color={LEAD_STATUS_COLOR[lead.status] ?? 'default'}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── Recent Commissions ─────────────────────────────────────────────────── */}
      {dashboard?.recentCommissions?.length > 0 && (
        <Paper variant="outlined" sx={{ borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, pt: 2, pb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>Recent Commissions</Typography>
            <Tooltip title="See all commissions">
              <IconButton size="small" onClick={() => navigate('/partner/commissions')}>
                <ArrowForwardIos fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
          <Divider />
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboard.recentCommissions.map((comm) => (
                  <TableRow key={comm._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        {comm.amount?.toLocaleString()} {comm.currency ?? 'XAF'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={comm.status}
                        color={COMMISSION_STATUS_COLOR[comm.status] ?? 'default'}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comm.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Empty state */}
      {!dashboard?.recentLeads?.length && !dashboard?.recentCommissions?.length && (
        <Paper variant="outlined" sx={{ p: 5, borderRadius: 3, textAlign: 'center' }}>
          <People sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={700}>No activity yet</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Share your referral link to start tracking leads.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
