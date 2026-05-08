import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Drawer, Box, Typography, IconButton, Divider, LinearProgress,
  List, ListItem, ListItemText, ListItemSecondaryAction, Chip,
  Button, Tooltip, Alert, CircularProgress, Stack,
} from '@mui/material';
import {
  Close, Download, CheckCircle, ErrorOutline,
  HourglassEmpty, Refresh,
} from '@mui/icons-material';

import { getBatchJobStatus, downloadBatchResult } from '../../../services/academic_print.service';
import { fTime } from '../../../utils/dateFormat';

const STATUS_COLORS = {
  PENDING:    'default',
  PROCESSING: 'info',
  DONE:       'success',
  PARTIAL:    'warning',
  ERROR:      'error',
  CANCELLED:  'default',
};

const STATUS_ICONS = {
  PENDING:    <HourglassEmpty fontSize="small" />,
  PROCESSING: <CircularProgress size={14} />,
  DONE:       <CheckCircle color="success" fontSize="small" />,
  PARTIAL:    <ErrorOutline color="warning" fontSize="small" />,
  ERROR:      <ErrorOutline color="error" fontSize="small" />,
};

/**
 * AcademicBatchDrawer
 *
 * Right-side drawer that displays the progress and results of a batch print job.
 * Polls the backend every 3s while the job is PENDING or PROCESSING.
 *
 * Props:
 *   open    {boolean}
 *   onClose {() => void}
 *   jobId   {string|null}
 */
const AcademicBatchDrawer = ({ open, onClose, jobId }) => {
  const [job,       setJob]       = useState(null);
  const [loadErr,   setLoadErr]   = useState(null);
  const [downloading, setDownloading] = useState({}); // { [fileName]: true }
  const pollRef = useRef(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await getBatchJobStatus(jobId);
      setJob(res.data.data);
      setLoadErr(null);
    } catch (err) {
      setLoadErr(err?.response?.data?.message ?? 'Could not load job status.');
    }
  }, [jobId]);

  // Polling: every 3s while job is active
  useEffect(() => {
    if (!open || !jobId) return;
    fetchJob();
    pollRef.current = setInterval(() => {
      setJob((prev) => {
        const active = ['PENDING', 'PROCESSING'].includes(prev?.status);
        if (!active) clearInterval(pollRef.current);
        return prev;
      });
      fetchJob();
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [open, jobId, fetchJob]);

  // Stop polling when job finishes
  useEffect(() => {
    if (job && !['PENDING', 'PROCESSING'].includes(job.status)) {
      clearInterval(pollRef.current);
    }
  }, [job?.status]);

  const handleDownloadResult = async (result) => {
    if (!result.fileName || downloading[result.fileName]) return;
    setDownloading((d) => ({ ...d, [result.fileName]: true }));
    try {
      const res  = await downloadBatchResult(jobId, result.fileName);
      const url  = URL.createObjectURL(res.data);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = result.fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // download error — silently ignore, user can retry
    } finally {
      setDownloading((d) => ({ ...d, [result.fileName]: false }));
    }
  };

  const progress = job?.progress;
  const pct      = progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  const isActive = ['PENDING', 'PROCESSING'].includes(job?.status);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box px={2.5} py={2} display="flex" alignItems="center" gap={1}>
        <Typography variant="h6" fontWeight="bold" flex={1}>Batch Print Job</Typography>
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={fetchJob} disabled={!jobId}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={onClose}><Close /></IconButton>
      </Box>
      <Divider />

      {/* Body */}
      <Box flex={1} overflow="auto" px={2.5} py={2}>
        {!jobId && (
          <Alert severity="info">No batch job selected.</Alert>
        )}

        {jobId && loadErr && (
          <Alert severity="error" action={
            <Button size="small" color="inherit" onClick={fetchJob}>Retry</Button>
          }>
            {loadErr}
          </Alert>
        )}

        {job && (
          <Stack spacing={2}>
            {/* Status + type */}
            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip
                icon={STATUS_ICONS[job.status]}
                label={job.status}
                color={STATUS_COLORS[job.status]}
                size="small"
              />
              <Chip label={job.type} variant="outlined" size="small" />
              {job.params?.academicYear && <Chip label={job.params.academicYear} variant="outlined" size="small" />}
              {job.params?.semester && <Chip label={job.params.semester} variant="outlined" size="small" />}
            </Box>

            {/* Progress bar */}
            {progress && (
              <Box>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    {progress.done} / {progress.total} processed
                    {progress.failed > 0 && ` (${progress.failed} failed)`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{pct}%</Typography>
                </Box>
                <LinearProgress
                  variant={isActive && progress.done === 0 ? 'indeterminate' : 'determinate'}
                  value={pct}
                  color={job.status === 'ERROR' ? 'error' : job.status === 'PARTIAL' ? 'warning' : 'primary'}
                  sx={{ borderRadius: 1, height: 6 }}
                />
              </Box>
            )}

            {/* Timing info */}
            {job.startedAt && (
              <Typography variant="caption" color="text.secondary">
                Started: {fTime(job.startedAt)}
                {job.completedAt && ` · Completed: ${fTime(job.completedAt)}`}
              </Typography>
            )}

            {/* Results list */}
            {job.results?.length > 0 && (
              <>
                <Divider />
                <Typography variant="subtitle2" fontWeight="bold">
                  Results ({job.results.length})
                </Typography>
                <List dense disablePadding>
                  {job.results.map((r, i) => (
                    <ListItem
                      key={r.targetId || i}
                      divider={i < job.results.length - 1}
                      sx={{ px: 0, py: 0.5 }}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={0.75}>
                            {r.error
                              ? <ErrorOutline color="error" fontSize="small" />
                              : <CheckCircle color="success" fontSize="small" />
                            }
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {r.targetName || r.targetId}
                            </Typography>
                          </Box>
                        }
                        secondary={r.error
                          ? <Typography variant="caption" color="error.main">{r.error}</Typography>
                          : null
                        }
                      />
                      {r.fileName && !r.error && (
                        <ListItemSecondaryAction>
                          <Tooltip title="Download PDF">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadResult(r)}
                              disabled={!!downloading[r.fileName]}
                            >
                              {downloading[r.fileName]
                                ? <CircularProgress size={16} />
                                : <Download fontSize="small" />
                              }
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {isActive && progress?.done === 0 && (
              <Alert severity="info" icon={<CircularProgress size={16} />}>
                Generating PDFs… this may take a moment.
              </Alert>
            )}
          </Stack>
        )}
      </Box>

      {/* Footer */}
      <Divider />
      <Box px={2.5} py={1.5} display="flex" justifyContent="flex-end">
        <Button onClick={onClose} color="inherit">Close</Button>
      </Box>
    </Drawer>
  );
};

export default AcademicBatchDrawer;
