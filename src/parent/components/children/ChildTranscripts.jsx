import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Chip, Avatar, CircularProgress,
  Alert, Grid, Button, Snackbar, Divider, MenuItem, Select,
  FormControl, InputLabel,
} from '@mui/material';
import {
  ArrowBack, Description, VerifiedUser, Lock, DrawOutlined,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { getMyChildren, getChildTranscripts, signTranscript } from '../../../services/parent.service';
import { IMAGE_BASE_URL } from '../../../config/env';
import { fDateLong } from '../../../utils/dateFormat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const profileUrl = (img) => {
  if (!img) return null;
  return img.startsWith('http')
    ? img
    : `${IMAGE_BASE_URL.replace(/\/$/, '')}/${img.replace(/^\//, '')}`;
};

// ─── Child Header ─────────────────────────────────────────────────────────────

const ChildHeader = ({ student, children, onSelect, onBack }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={2}
      sx={{
        p: 2, mb: 3, borderRadius: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
        <Chip
          icon={<ArrowBack sx={{ color: 'white !important' }} />}
          label="Dashboard"
          onClick={onBack}
          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer' }}
        />
        {children.map((c) => (
          <Chip
            key={c._id}
            avatar={<Avatar src={profileUrl(c.profileImage)} sx={{ width: 24, height: 24 }}>{c.firstName?.[0]}</Avatar>}
            label={`${c.firstName} ${c.lastName}`}
            onClick={() => onSelect(c._id)}
            sx={{
              bgcolor: c._id === student?._id ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
              color: 'white',
              fontWeight: c._id === student?._id ? 700 : 400,
              cursor: 'pointer',
            }}
          />
        ))}
      </Stack>
      {student && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Avatar src={profileUrl(student.profileImage)} sx={{ width: 48, height: 48, border: '2px solid white' }}>
            {student.firstName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={700}>{student.firstName} {student.lastName}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>Final Transcripts</Typography>
          </Box>
        </Stack>
      )}
    </Paper>
  );
};

// ─── Transcript Card ──────────────────────────────────────────────────────────

const TranscriptCard = ({ transcript, onSign, signing }) => {
  const isSealed    = transcript.status === 'SEALED';
  const isSigned    = !!transcript.parentSignature?.signedAt;
  const canSign     = !isSigned && transcript.status === 'VALIDATED';

  const statusColor = isSealed ? 'default' : 'success';
  const statusLabel = isSealed ? 'Sealed' : 'Validated';

  return (
    <Paper elevation={2} sx={{ p: 2.5, borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" spacing={1}>

        {/* Left: meta */}
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Description color="primary" />
            <Typography variant="subtitle1" fontWeight={700}>
              {transcript.academicYear} — Semester {transcript.semester}
            </Typography>
          </Stack>
          {transcript.class && (
            <Typography variant="body2" color="text.secondary">
              Class: {transcript.class.className}
              {transcript.class.level ? ` · Level ${transcript.class.level}` : ''}
            </Typography>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
            <Chip label={statusLabel} size="small" color={statusColor} sx={{ fontWeight: 600 }} />
            {isSealed && <Chip icon={<Lock sx={{ fontSize: 14 }} />} label="Sealed" size="small" variant="outlined" />}
            {isSigned && (
              <Chip
                icon={<VerifiedUser sx={{ fontSize: 14 }} />}
                label="Signed by you"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        {/* Right: signature info / sign button */}
        <Box sx={{ textAlign: 'right', minWidth: 160 }}>
          {isSigned ? (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Signed on
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {fDateLong(transcript.parentSignature.signedAt)}
              </Typography>
            </Box>
          ) : canSign ? (
            <Button
              variant="contained"
              size="small"
              startIcon={signing ? <CircularProgress size={16} color="inherit" /> : <DrawOutlined />}
              disabled={signing}
              onClick={() => onSign(transcript._id)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {signing ? 'Signing…' : 'Sign Transcript'}
            </Button>
          ) : (
            <Typography variant="caption" color="text.secondary" fontStyle="italic">
              {isSealed ? 'Signature not required' : 'Pending'}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Grade summary if available */}
      {transcript.averageGrade != null && (
        <>
          <Divider sx={{ my: 1.5 }} />
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">Average</Typography>
              <Typography variant="h6" fontWeight={700}>{transcript.averageGrade?.toFixed(2)}</Typography>
            </Box>
            {transcript.rank != null && (
              <Box>
                <Typography variant="caption" color="text.secondary">Class Rank</Typography>
                <Typography variant="h6" fontWeight={700}>#{transcript.rank}</Typography>
              </Box>
            )}
            {transcript.appreciation && (
              <Box>
                <Typography variant="caption" color="text.secondary">Appreciation</Typography>
                <Typography variant="body2" fontWeight={600}>{transcript.appreciation}</Typography>
              </Box>
            )}
          </Stack>
        </>
      )}
    </Paper>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ChildTranscripts = () => {
  const { studentId } = useParams();
  const navigate      = useNavigate();

  const [children,     setChildren]     = useState([]);
  const [transcripts,  setTranscripts]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [signingId,    setSigningId]    = useState(null);
  const [snackbar,     setSnackbar]     = useState({ open: false, message: '', severity: 'success' });
  const [filters,      setFilters]      = useState({ academicYear: '', semester: '' });

  const student = children.find((c) => c._id === studentId);

  useEffect(() => {
    getMyChildren()
      .then(({ data }) => setChildren(data.data?.children ?? []))
      .catch(() => {});
  }, []);

  const fetchTranscripts = useCallback(() => {
    if (!studentId) return;
    setLoading(true);
    setError(null);
    getChildTranscripts(studentId, {
      academicYear: filters.academicYear || undefined,
      semester:     filters.semester     || undefined,
    })
      .then(({ data }) => setTranscripts(data.data?.transcripts ?? []))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load transcripts.'))
      .finally(() => setLoading(false));
  }, [studentId, filters]);

  useEffect(() => { fetchTranscripts(); }, [fetchTranscripts]);

  const handleSign = async (transcriptId) => {
    setSigningId(transcriptId);
    try {
      await signTranscript(studentId, transcriptId);
      setSnackbar({ open: true, message: 'Transcript signed successfully.', severity: 'success' });
      fetchTranscripts();
    } catch (err) {
      setSnackbar({
        open:     true,
        message:  err.response?.data?.message || 'Failed to sign transcript.',
        severity: 'error',
      });
    } finally {
      setSigningId(null);
    }
  };

  const handleSelect = (id) => navigate(`/parent/children/${id}/transcripts`);
  const handleBack   = () => navigate('/parent');

  const pendingSignatures = transcripts.filter(
    (t) => !t.parentSignature?.signedAt && t.status === 'VALIDATED'
  ).length;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <ChildHeader student={student} children={children} onSelect={handleSelect} onBack={handleBack} />

      {/* Pending banner */}
      {!loading && pendingSignatures > 0 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          You have {pendingSignatures} transcript{pendingSignatures > 1 ? 's' : ''} awaiting your signature.
        </Alert>
      )}

      {/* Filters */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
        <FormControl size="small" sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Academic Year</InputLabel>
          <Select
            value={filters.academicYear}
            label="Academic Year"
            onChange={(e) => setFilters((f) => ({ ...f, academicYear: e.target.value }))}
          >
            <MenuItem value="">All Years</MenuItem>
            {['2025-2026', '2024-2025', '2023-2024'].map((y) => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <InputLabel>Semester</InputLabel>
          <Select
            value={filters.semester}
            label="Semester"
            onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
          >
            <MenuItem value="">All</MenuItem>
            {['1', '2', '3'].map((s) => <MenuItem key={s} value={s}>Semester {s}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>

      {/* Content */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : transcripts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Description sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No transcripts available yet.</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {transcripts.map((t) => (
            <TranscriptCard
              key={t._id}
              transcript={t}
              onSign={handleSign}
              signing={signingId === t._id}
            />
          ))}
        </Stack>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChildTranscripts;
