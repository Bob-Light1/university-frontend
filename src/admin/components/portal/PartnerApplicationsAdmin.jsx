/**
 * @file PartnerApplicationsAdmin.jsx
 * @description Admin review page for partner applications submitted via the portal (spec §4.9).
 *
 * Lists pending/approved/rejected PartnerApplication records.
 * Admins can approve or reject each pending application.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Stack, Typography, Paper, Chip, Button, Alert, Skeleton,
  MenuItem, Select, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Pagination,
} from '@mui/material';
import HandshakeIcon   from '@mui/icons-material/Handshake';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon      from '@mui/icons-material/Cancel';
import api from '../../../api/axiosInstance';

const LIMIT = 20;

const STATUS_COLORS = {
  pending:  'warning',
  approved: 'success',
  rejected: 'error',
};

const TYPE_LABELS = {
  influencer:     'Influencer',
  church_leader:  'Church leader',
  student_leader: 'Student leader',
  teacher:        'Teacher',
  parent:         'Parent',
  other:          'Other',
};

const CHANNEL_LABELS = {
  online:  'Online',
  offline: 'Offline',
  hybrid:  'Hybrid',
};

export default function PartnerApplicationsAdmin() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState('pending');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Review dialog state
  const [reviewOpen,   setReviewOpen]   = useState(false);
  const [reviewing,    setReviewing]    = useState(null);   // the application being reviewed
  const [reviewAction, setReviewAction] = useState('');     // 'approved' | 'rejected'
  const [reviewNote,   setReviewNote]   = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: LIMIT };
      if (status !== 'all') params.status = status;
      const res = await api.get('/portal-admin/applications', { params });
      setItems(res.data.data ?? []);
      setTotal(res.data.pagination?.total ?? 0);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openReview = (app, action) => {
    setReviewing(app);
    setReviewAction(action);
    setReviewNote('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!reviewing) return;
    setSubmitting(true);
    try {
      await api.patch(`/portal-admin/applications/${reviewing._id}/review`, {
        status:     reviewAction,
        reviewNote: reviewNote.trim() || undefined,
      });
      setReviewOpen(false);
      fetchItems();
    } catch (err) {
      setError(err?.response?.data?.message || 'Review failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={3}>
        <HandshakeIcon color="primary" />
        <Typography variant="h5" fontWeight={700}>Partner Applications</Typography>
        <Chip label={`${total} total`} size="small" variant="outlined" />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Filter by status */}
      <FormControl size="small" sx={{ mb: 3, minWidth: 160 }}>
        <InputLabel>Status</InputLabel>
        <Select value={status} label="Status" onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </Select>
      </FormControl>

      {/* List */}
      {loading ? (
        <Stack gap={1.5}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} variant="rounded" height={90} />)}
        </Stack>
      ) : items.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={6}>
          No applications found.
        </Typography>
      ) : (
        <Stack gap={1.5}>
          {items.map((app) => (
            <Paper key={app._id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                <Box>
                  <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
                    <Typography fontWeight={600}>
                      {app.firstName} {app.lastName}
                    </Typography>
                    <Chip
                      label={app.status}
                      color={STATUS_COLORS[app.status] || 'default'}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">{app.email}</Typography>
                  {app.phone && (
                    <Typography variant="body2" color="text.secondary">{app.phone}</Typography>
                  )}
                  <Stack direction="row" gap={1} mt={0.75} flexWrap="wrap">
                    <Chip label={TYPE_LABELS[app.commercialType] || app.commercialType} size="small" variant="outlined" />
                    <Chip label={CHANNEL_LABELS[app.channelType]  || app.channelType}   size="small" variant="outlined" />
                  </Stack>
                  {app.message && (
                    <Typography variant="body2" mt={0.75} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      "{app.message}"
                    </Typography>
                  )}
                  {app.reviewNote && (
                    <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
                      Note: {app.reviewNote}
                    </Typography>
                  )}
                </Box>

                {app.status === 'pending' && (
                  <Stack direction="row" gap={1} alignSelf={{ xs: 'flex-start', sm: 'center' }}>
                    <Button
                      size="small" variant="contained" color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => openReview(app, 'approved')}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="small" variant="outlined" color="error"
                      startIcon={<CancelIcon />}
                      onClick={() => openReview(app, 'rejected')}
                      sx={{ textTransform: 'none', borderRadius: 2 }}
                    >
                      Reject
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
        </Box>
      )}

      {/* Review confirmation dialog */}
      <Dialog
        open={reviewOpen}
        onClose={submitting ? undefined : () => setReviewOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle fontWeight={700}>
          {reviewAction === 'approved' ? 'Approve application' : 'Reject application'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            {reviewing && `${reviewing.firstName} ${reviewing.lastName} — ${reviewing.email}`}
          </Typography>
          <TextField
            label="Internal note (optional)"
            multiline rows={3} fullWidth size="small"
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder="Reason for approval / rejection…"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReviewOpen(false)} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={reviewAction === 'approved' ? 'success' : 'error'}
            onClick={submitReview}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : null}
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            Confirm {reviewAction}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
