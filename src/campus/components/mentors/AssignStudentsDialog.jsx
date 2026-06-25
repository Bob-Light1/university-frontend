'use strict';
import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, Typography, Chip, CircularProgress,
  Alert, Box, Divider, ToggleButton, ToggleButtonGroup,
  IconButton, Tabs, Tab, Autocomplete, TextField, Avatar,
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
    description: 'Add the selected students without removing existing assignments.',
    icon:        <PersonAdd fontSize="small" />,
    color:       'success',
  },
  {
    value:       'remove',
    label:       'Remove',
    description: 'Remove the selected students from this mentor.',
    icon:        <PersonRemove fontSize="small" />,
    color:       'error',
  },
  {
    value:       'replace',
    label:       'Replace all',
    description: 'Replace all current student assignments with the current selection.',
    icon:        <Refresh fontSize="small" />,
    color:       'warning',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Dialog for assigning students to a mentor — by whole classes and/or by
 * individual students. The backend (PATCH /mentors/:id/assign-students) merges
 * `classIds` and `studentIds` and enforces the single-mentor invariant.
 *
 * Props:
 *  open       {boolean}   - Controls visibility
 *  onClose    {Function}  - Called when dialog should close
 *  mentor     {Object}    - Mentor document (needs _id, firstName, lastName, schoolCampus)
 *  onSuccess  {Function}  - Called with API response data after a successful assignment
 */
export default function AssignStudentsDialog({ open, onClose, mentor, onSuccess }) {
  const [tab,         setTab]         = useState('class'); // 'class' | 'student'
  const [classes,     setClasses]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [mode,        setMode]        = useState('add');
  const [result,      setResult]      = useState(null); // summary from last successful call

  // Individual-student picker state
  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentInput,   setStudentInput]   = useState('');
  const [studentLoading, setStudentLoading] = useState(false);
  const searchTimer = useRef(null);

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

  // Debounced async search of campus students for the individual picker
  useEffect(() => {
    if (!open || !campusId || tab !== 'student') return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setStudentLoading(true);
      api.get(`/campus/${campusId}/students`, {
        params: { search: studentInput || undefined, limit: 20, status: 'active' },
      })
        .then((r) => setStudentOptions(r.data?.data ?? []))
        .catch(() => setStudentOptions([]))
        .finally(() => setStudentLoading(false));
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [open, campusId, tab, studentInput]);

  const resetState = () => {
    setTab('class');
    setSelectedClassIds([]);
    setSelectedStudents([]);
    setStudentInput('');
    setStudentOptions([]);
    setMode('add');
    setError('');
    setResult(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose();
  };

  const toggleClass = (id) => {
    setSelectedClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalSelected = selectedClassIds.length + selectedStudents.length;

  const handleSubmit = async () => {
    if (totalSelected === 0) {
      setError('Please select at least one class or student.');
      return;
    }
    setSubmitting(true);
    setError('');
    setResult(null);
    try {
      const { data } = await assignStudents(mentor._id, {
        classIds:   selectedClassIds,
        studentIds: selectedStudents.map((s) => s._id),
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
  const verb     = mode === 'add' ? 'Add' : mode === 'remove' ? 'Remove' : 'Replace';
  const btnLabel = `${verb} — ${totalSelected} selected`;

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

          {/* ── Target selector: by class or by student ───────────────── */}
          <Box>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="fullWidth"
              sx={{ minHeight: 40, mb: 2, '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 } }}
            >
              <Tab value="class"   label="By class" />
              <Tab value="student" label="By student" />
            </Tabs>

            {tab === 'class' ? (
              <>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Select classes
                  {selectedClassIds.length > 0 && (
                    <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>
                      ({selectedClassIds.length} selected)
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
                      const selected = selectedClassIds.includes(c._id);
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
              </>
            ) : (
              <>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Select students
                  {selectedStudents.length > 0 && (
                    <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>
                      ({selectedStudents.length} selected)
                    </Typography>
                  )}
                </Typography>
                <Autocomplete
                  multiple
                  filterSelectedOptions
                  value={selectedStudents}
                  onChange={(_, val) => setSelectedStudents(val)}
                  inputValue={studentInput}
                  onInputChange={(_, val) => setStudentInput(val)}
                  options={studentOptions}
                  loading={studentLoading}
                  isOptionEqualToValue={(opt, val) => opt._id === val._id}
                  getOptionLabel={(o) =>
                    `${o.firstName ?? ''} ${o.lastName ?? ''}${o.matricule ? ` (${o.matricule})` : ''}`.trim()
                  }
                  noOptionsText={studentInput ? 'No students found' : 'Type to search…'}
                  renderOption={(props, o) => (
                    <Box component="li" {...props} key={o._id}>
                      <Avatar sx={{ width: 26, height: 26, fontSize: 12, mr: 1.5 }}>
                        {o.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {o.firstName} {o.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {o.matricule ?? '—'} · {o.studentClass?.className ?? 'No class'}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search by name or matricule…"
                      size="small"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {studentLoading ? <CircularProgress color="inherit" size={18} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        },
                      }}
                    />
                  )}
                />
              </>
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
          disabled={submitting || totalSelected === 0 || loading}
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
