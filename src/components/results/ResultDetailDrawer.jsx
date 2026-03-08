/**
 * @file ResultDetailDrawer.jsx
 * @description Side drawer for full result details, including score breakdown,
 *              pedagogical feedback, and append-only audit log.
 *
 * Props:
 *  open             — boolean
 *  onClose          — () => void
 *  result           — populated result document
 *  onSubmit         — async (id) => void — only for DRAFT results
 *  onPublish        — async (id) => void — only for SUBMITTED results
 *  onArchive        — async (id) => void — only for PUBLISHED results
 *  onAuditCorrect   — async (id, { score, teacherRemarks, reason }) => void
 *  canPublish       — boolean (manager role)
 *  canAudit         — boolean (ADMIN/DIRECTOR)
 *  loading          — boolean
 */

import {
  Drawer, Box, Typography, Divider, Stack, Chip, Avatar,
  IconButton, Grid, Paper, Button, TextField, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody, Tooltip,
  Alert,
} from '@mui/material';
import {
  Close, Send, Publish, Archive, Edit, History,
  School, Person, Class, MenuBook,
} from '@mui/icons-material';
import { useState } from 'react';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';

import {
  ResultStatusChip, EvalTypeChip, ScoreDisplay, GradeBandBadge,
  SCORE_COLOR,
} from './ResultShared';

// ─── Audit correction schema ──────────────────────────────────────────────────

const auditSchema = Yup.object({
  score:         Yup.number().min(0).nullable(),
  teacherRemarks:Yup.string().nullable(),
  reason:        Yup.string().trim().min(10, 'Reason must be at least 10 characters').required('Reason is required'),
});

// ─── Info row ─────────────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1} alignItems="flex-start" py={0.5}>
    <Box sx={{ color: 'text.disabled', pt: 0.25 }}>{icon}</Box>
    <Box>
      <Typography variant="caption" color="text.disabled" display="block">{label}</Typography>
      <Typography variant="body2">{value ?? '—'}</Typography>
    </Box>
  </Stack>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ResultDetailDrawer = ({
  open,
  onClose,
  result,
  onSubmit,
  onPublish,
  onArchive,
  onAuditCorrect,
  canPublish  = false,
  canAudit    = false,
  loading     = false,
}) => {
  const [showAudit, setShowAudit] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!result) return null;

  const { student, subject, teacher, class: cls } = result;

  // ─── Workflow action handler ────────────────────────────────────────────────

  const handleAction = async (fn, ...args) => {
    setActionLoading(true);
    try { await fn(result._id, ...args); }
    finally { setActionLoading(false); }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: { 
          sx: { width: { xs: '100%', sm: 520 }, mt: 7 },
        }
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ px: 3, py: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>Result Detail</Typography>
          <IconButton onClick={onClose} sx={{ color: 'primary.contrastText' }} size="small">
            <Close />
          </IconButton>
        </Stack>
        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          CODE : {result.reference ?? result._id}
        </Typography>
      </Box>

      <Box sx={{ p: 3, overflow: 'auto', flex: 1 }}>

        {/* ── Status + type ───────────────────────────────────────────────── */}
        <Stack direction="row" spacing={1} mb={2}>
          <ResultStatusChip status={result.status} />
          <EvalTypeChip type={result.evaluationType} />
          {result.periodLocked && (
            <Chip label="Locked" size="small" color="error" variant="outlined" />
          )}
        </Stack>

        {/* ── Score ───────────────────────────────────────────────────────── */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            SCORE
          </Typography>
          <ScoreDisplay
            score={result.normalizedScore}
            rawScore={result.score}
            maxScore={result.maxScore}
            size="lg"
          />
          {result.coefficient !== 1 && (
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Coefficient: {result.coefficient}
            </Typography>
          )}
          {result.gradeBand && <GradeBandBadge gradeBand={result.gradeBand} />}
          <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
            Raw: {result.score} / {result.maxScore}
          </Typography>
        </Paper>

        {/* ── Evaluation info ──────────────────────────────────────────────── */}
        <Typography variant="overline" color="text.disabled">Evaluation</Typography>
        <Divider sx={{ mb: 1 }} />
        <Grid container spacing={1} mb={2}>
          <Grid size={{ xs: 12 }}>
            <InfoRow icon={<MenuBook fontSize="small" />} label="Title" value={result.evaluationTitle} />
          </Grid>
          <Grid size={{ xs:  6 }}>
            <InfoRow icon={null} label="Academic Year" value={result.academicYear} />
          </Grid>
          <Grid size={{ xs:  6 }}>
            <InfoRow icon={null} label="Semester" value={result.semester} />
          </Grid>
          <Grid size={{ xs:  6 }}>
            <InfoRow icon={null} label="Exam Period" value={result.examPeriod ?? '—'} />
          </Grid>
          <Grid size={{ xs:  6 }}>
            <InfoRow icon={null} label="Exam Attendance" value={result.examAttendance} />
          </Grid>
          {result.examDate && (
            <Grid size={{ xs:  6 }}>
              <InfoRow icon={null} label="Exam Date"
                value={new Date(result.examDate).toLocaleDateString()} />
            </Grid>
          )}
        </Grid>

        {/* ── Participants ─────────────────────────────────────────────────── */}
        <Typography variant="overline" color="text.disabled">Participants</Typography>
        <Divider sx={{ mb: 1 }} />
        <Grid container spacing={1} mb={2}>
          <Grid size={{ xs: 12 }}>
            <InfoRow icon={<School fontSize="small" />} label="Student"
              value={student ? `${student.firstName} ${student.lastName} (${student.matricule ?? ''})` : '—'} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <InfoRow icon={<Class fontSize="small" />} label="Class"
              value={cls?.className ?? '—'} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <InfoRow icon={<MenuBook fontSize="small" />} label="Subject"
              value={subject ? `${subject.subject_code ?? ''} ${subject.subject_name}` : '—'} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <InfoRow icon={<Person fontSize="small" />} label="Teacher"
              value={teacher ? `${teacher.firstName} ${teacher.lastName}` : '—'} />
          </Grid>
        </Grid>

        {/* ── Feedback ─────────────────────────────────────────────────────── */}
        {(result.teacherRemarks || result.strengths || result.improvements) && (
          <>
            <Typography variant="overline" color="text.disabled">Pedagogical Feedback</Typography>
            <Divider sx={{ mb: 1 }} />
            {result.teacherRemarks && (
              <Box mb={1}>
                <Typography variant="caption" color="text.secondary">Remarks</Typography>
                <Typography variant="body2">{result.teacherRemarks}</Typography>
              </Box>
            )}
            {result.strengths && (
              <Box mb={1}>
                <Typography variant="caption" color="text.secondary">Strengths</Typography>
                <Typography variant="body2">{result.strengths}</Typography>
              </Box>
            )}
            {result.improvements && (
              <Box mb={1}>
                <Typography variant="caption" color="text.secondary">Areas for Improvement</Typography>
                <Typography variant="body2">{result.improvements}</Typography>
              </Box>
            )}
            {result.specialCircumstances && (
              <Box mb={1}>
                <Typography variant="caption" color="text.secondary">Special Circumstances</Typography>
                <Typography variant="body2">{result.specialCircumstances}</Typography>
              </Box>
            )}
          </>
        )}

        {/* ── Workflow actions ─────────────────────────────────────────────── */}
        <Typography variant="overline" color="text.disabled">Actions</Typography>
        <Divider sx={{ mb: 1 }} />
        <Stack direction="row" spacing={1} flexWrap="wrap" mb={7}>
          {result.status === 'DRAFT' && onSubmit && (
            <Button
              size="small" variant="contained" color="warning"
              startIcon={actionLoading ? <CircularProgress size={14} /> : <Send />}
              disabled={actionLoading}
              onClick={() => handleAction(onSubmit)}
            >
              Submit for Review
            </Button>
          )}
          {result.status === 'SUBMITTED' && canPublish && onPublish && (
            <Button
              size="small" variant="contained" color="success"
              startIcon={actionLoading ? <CircularProgress size={14} /> : <Publish />}
              disabled={actionLoading}
              onClick={() => handleAction(onPublish)}
            >
              Publish
            </Button>
          )}
          {result.status === 'PUBLISHED' && canPublish && onArchive && (
            <Button
              size="small" variant="outlined" color="secondary"
              startIcon={actionLoading ? <CircularProgress size={14} /> : <Archive />}
              disabled={actionLoading}
              onClick={() => handleAction(onArchive)}
            >
              Archive
            </Button>
          )}
          {canAudit && ['SUBMITTED', 'PUBLISHED', 'ARCHIVED'].includes(result.status) && (
            <Button
              size="small" variant="outlined"
              startIcon={<Edit />}
              onClick={() => setShowAudit((v) => !v)}
            >
              Audit Correction
            </Button>
          )}
        </Stack>

        {/* ── Audit correction form ─────────────────────────────────────────── */}
        {showAudit && canAudit && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2, borderColor: 'warning.main' }}>
            <Typography variant="subtitle2" color="warning.main" gutterBottom>
              Post-Publication Correction (ADMIN/DIRECTOR)
            </Typography>
            <Formik
              initialValues={{ score: result.score, teacherRemarks: result.teacherRemarks ?? '', reason: '' }}
              validationSchema={auditSchema}
              onSubmit={async (values, helpers) => {
                try {
                  await onAuditCorrect(result._id, values);
                  setShowAudit(false);
                } catch (err) {
                  helpers.setStatus({ error: err.response?.data?.message || 'Failed.' });
                } finally {
                  helpers.setSubmitting(false);
                }
              }}
            >
              {(formik) => (
                <Form>
                  {formik.status?.error && <Alert severity="error" sx={{ mb: 1 }}>{formik.status.error}</Alert>}
                  <Grid container spacing={1.5}>
                    <Grid size={{ xs:  6 }}>
                      <TextField 
                        fullWidth 
                        size="small" 
                        label="New Score" 
                        type="number"
                        name="score" 
                        value={formik.values.score}
                        onChange={formik.handleChange}
                        slotProps={{
                          htmlInput: { 
                            min: 0, 
                            max: result.maxScore, 
                            step: 0.25, 
                          }
                        }}
                        helperText={`Max: ${result.maxScore}`}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField fullWidth size="small" label="Updated Remarks" multiline rows={2}
                        name="teacherRemarks" value={formik.values.teacherRemarks}
                        onChange={formik.handleChange}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField 
                        fullWidth 
                        size="small" 
                        label="Reason (required, min 10 chars) *"
                        name="reason" 
                        value={formik.values.reason}
                        onChange={formik.handleChange} 
                        onBlur={formik.handleBlur}
                        error={formik.touched.reason && Boolean(formik.errors.reason)}
                        helperText={formik.touched.reason && formik.errors.reason}
                        multiline 
                        rows={2}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button
                        type="submit" variant="contained" color="warning" size="small"
                        disabled={formik.isSubmitting}
                        startIcon={formik.isSubmitting ? <CircularProgress size={14} /> : <History />}
                      >
                        Apply Correction
                      </Button>
                    </Grid>
                  </Grid>
                </Form>
              )}
            </Formik>
          </Paper>
        )}

        {/* ── Audit log ────────────────────────────────────────────────────── */}
        {result.auditLog?.length > 0 && (
          <>
            <Typography variant="overline" color="text.disabled">
              Audit Log ({result.auditLog.length})
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Field</TableCell>
                    <TableCell>Old</TableCell>
                    <TableCell>New</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.auditLog.map((entry) => (
                    <TableRow key={entry._id}>
                      <TableCell sx={{ fontSize: '0.7rem' }}>
                        {new Date(entry.modifiedAt).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem' }}>{entry.field}</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', color: 'error.main' }}>
                        {String(entry.oldValue ?? '—')}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', color: 'success.main' }}>
                        {String(entry.newValue ?? '—')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default ResultDetailDrawer;