'use strict';
import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Chip, CircularProgress,
  Alert, Box, Divider, ToggleButton, ToggleButtonGroup,
  IconButton,
} from '@mui/material';
import {
  Add, Remove, Group, PersonAdd, PersonRemove,
  Refresh, Close,
} from '@mui/icons-material';
import api              from '../../../api/axiosInstance';
import { assignStudents } from '../../../services/mentorService';

// ─── Mode definitions ─────────────────────────────────────────────────────────

const MODES = [
  {
    value:       'add',
    label:       'Add',
    description: 'Add students from selected classes without removing existing assignments.',
    icon:        <PersonAdd fontSize="small" />,
    color:       'success',
  },
  {
    value:       'remove',
    label:       'Remove',
    description: 'Remove students of selected classes from this mentor.',
    icon:        <PersonRemove fontSize="small" />,
    color:       'error',
  },
  {
    value:       'replace',
    label:       'Replace all',
    description: 'Replace all current student assignments with those from the selected classes.',
    icon:        <Refresh fontSize="small" />,
    color:       'warning',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Dialog for bulk-assigning students to a mentor by selecting campus classes.
 *
 * Props:
 *  open       {boolean}   - Controls visibility
 *  onClose    {Function}  - Called when dialog should close
 *  mentor     {Object}    - Mentor document (needs _id, firstName, lastName, schoolCampus)
 *  onSuccess  {Function}  - Called with API response data after a successful assignment
 */
export default function AssignStudentsDialog({ open, onClose, mentor, onSuccess }) {
  const [classes,     setClasses]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [mode,        setMode]        = useState('add');
  const [result,      setResult]      = useState(null); // summary from last successful call

  const campusId = mentor?.schoolCampus?._id ?? mentor?.schoolCampus;

  // Fetch classes whenever the dialog opens
  useEffect(() => {
    if (!open || !campusId) return;
    setLoading(true);
    setError('');
    setResult(null);
    api.get(`/campus/${campusId}/classes`)
      .then((r) => setClasses(r.data?.data ?? r.data ?? []))
      .catch(() => setError('Failed to load campus classes.'))
      .finally(() => setLoading(false));
  }, [open, campusId]);

  const handleClose = () => {
    if (submitting) return;
    setSelectedIds([]);
    setMode('add');
    setError('');
    setResult(null);
    onClose();
  };

  const toggleClass = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      setError('Please select at least one class.');
      return;
    }
    setSubmitting(true);
    setError('');
    setResult(null);
    try {
      const { data } = await assignStudents(mentor._id, {
        classIds:   selectedIds,
        studentIds: [],
        mode,
      });
      setResult(data.data?.summary ?? null);
      onSuccess?.(data);
      // Keep dialog open a moment so the user can see the summary, then close
      setTimeout(handleClose, 1500);
    } catch (err) {
      setError(err.response?.data?.message ?? 'Assignment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const modeObj  = MODES.find((m) => m.value === mode);
  const btnLabel = `${mode === 'add' ? 'Add' : mode === 'remove' ? 'Remove' : 'Replace'} — ${selectedIds.length} class${selectedIds.length !== 1 ? 'es' : ''}`;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth disableEnforceFocus>
      {/* ── Header ── */}
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight={700} component="span">
              Assign Students
            </Typography>
            {mentor && (
              <Typography variant="body2" color="text.secondary" component="div">
                {mentor.firstName} {mentor.lastName}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={submitting}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={3}>

          {/* ── Mode selector ─────────────────────────────────────────── */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Assignment mode
            </Typography>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, val) => { if (val) setMode(val); }}
              size="small"
              fullWidth
            >
              {MODES.map((m) => (
                <ToggleButton key={m.value} value={m.value} color={m.color}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {m.icon}
                    <span>{m.label}</span>
                  </Stack>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
              {modeObj?.description}
            </Typography>
          </Box>

          {/* ── Class chips ───────────────────────────────────────────── */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Select classes
              {selectedIds.length > 0 && (
                <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>
                  ({selectedIds.length} selected)
                </Typography>
              )}
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={28} />
              </Box>
            ) : classes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No active classes found for this campus.
              </Typography>
            ) : (
              <Stack direction="row" flexWrap="wrap" spacing={1} useFlexGap>
                {classes.map((c) => {
                  const selected = selectedIds.includes(c._id);
                  return (
                    <Chip
                      key={c._id}
                      label={c.className}
                      icon={selected ? <Remove fontSize="small" /> : <Add fontSize="small" />}
                      onClick={() => toggleClass(c._id)}
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer', mb: 0.5 }}
                    />
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* ── Success summary ───────────────────────────────────────── */}
          {result && (
            <Alert severity="success" icon={<Group />} sx={{ borderRadius: 2 }}>
              Done — {result.affected} student{result.affected !== 1 ? 's' : ''}{' '}
              {mode === 'add' ? 'added' : mode === 'remove' ? 'removed' : 'set'}.
              Mentor now has {result.total} student{result.total !== 1 ? 's' : ''} total.
            </Alert>
          )}

          {/* ── Error ─────────────────────────────────────────────────── */}
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
          )}

        </Stack>
      </DialogContent>
      <Divider />

      {/* ── Footer actions ── */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button variant="outlined" onClick={handleClose} disabled={submitting} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || selectedIds.length === 0 || loading}
          color={modeObj?.color ?? 'primary'}
          startIcon={
            submitting
              ? <CircularProgress size={16} color="inherit" />
              : <Group />
          }
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {submitting ? 'Saving…' : btnLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
