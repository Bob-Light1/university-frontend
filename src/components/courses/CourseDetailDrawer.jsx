/**
 * @file CourseDetailDrawer.jsx
 * @description Right-side detail drawer for a course.
 *
 * Fix applied: <button> nesting error — the Section action (IconButton) was rendered
 * INSIDE AccordionSummary (which renders as <button>). Moved action outside the
 * AccordionSummary into a sibling Box to comply with HTML spec.
 *
 * Props:
 *  open             {boolean}
 *  onClose          {Function}
 *  course           {Object|null}
 *  onEdit           {Function}
 *  onSubmit         {Function(id)}
 *  onApprove        {Function(id)}
 *  onReject         {Function(id, note)}
 *  onNewVersion     {Function(id, copyRes)}
 *  onAddResource    {Function(id, res)}
 *  onRemoveResource {Function(courseId, resId)}
 *  onDelete         {Function(id)}
 *  role             {string}  'ADMIN' | 'DIRECTOR' | 'CAMPUS_MANAGER' | 'TEACHER' | 'STUDENT'
 */

import { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Divider,
  IconButton,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  alpha,
} from '@mui/material';
import {
  Close,
  Edit,
  Delete,
  ExpandMore,
  PictureAsPdf,
  VideoLibrary,
  Link,
  Description,
  TableChart,
  Attachment,
  Send,
  CheckCircle,
  Cancel,
  ContentCopy,
  Add,
  OpenInNew,
} from '@mui/icons-material';
import {
  ApprovalStatusChip,
  DifficultyChip,
  CategoryChip,
  VisibilityChip,
  VersionBadge,
  WorkloadSummary,
  COURSE_ENUMS,
} from './CourseShared';
import { format } from 'date-fns';

// ─── Constants ────────────────────────────────────────────────────────────────

const RESOURCE_ICONS = {
  PDF:         <PictureAsPdf color="error"   fontSize="small" />,
  VIDEO:       <VideoLibrary color="primary" fontSize="small" />,
  LINK:        <Link         color="info"    fontSize="small" />,
  DOCUMENT:    <Description  color="action"  fontSize="small" />,
  SPREADSHEET: <TableChart   color="success" fontSize="small" />,
  OTHER:       <Attachment   color="action"  fontSize="small" />,
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return format(new Date(d), 'dd MMM yyyy'); } catch { return '—'; }
};

// ─── Section helper ───────────────────────────────────────────────────────────

/**
 * Section layout helper.
 *
 * FIX: When collapsible, the `action` button was previously placed inside
 * AccordionSummary (a <button>), causing nested <button> hydration errors.
 * Solution: render the action OUTSIDE of AccordionSummary, as a sibling,
 * using a flex wrapper Box around the entire Accordion header.
 */
const Section = ({ title, children, collapsible = false, action = null }) => {
  if (collapsible) {
    return (
      <Box sx={{ mb: 1 }}>
        {/* Flex row: accordion + optional action button side-by-side */}
        <Stack direction="row" alignItems="flex-start" spacing={0.5}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Accordion
              disableGutters
              elevation={0}
              sx={{
                '&::before': { display: 'none' },
                bgcolor: 'transparent',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                sx={{ px: 0, py: 0.5, minHeight: 36, '& .MuiAccordionSummary-content': { my: 0 } }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  {title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                {children}
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Action rendered OUTSIDE AccordionSummary — avoids button-in-button */}
          {action && (
            <Box sx={{ pt: 0.5, flexShrink: 0 }}>
              {action}
            </Box>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
          {title}
        </Typography>
        {action}
      </Stack>
      <Divider sx={{ mb: 1 }} />
      {children}
    </Box>
  );
};

// ─── Row helper ───────────────────────────────────────────────────────────────

const Row = ({ label, children }) => (
  <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.5 }}>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ minWidth: 120, pt: 0.25, fontWeight: 500 }}
    >
      {label}
    </Typography>
    <Box sx={{ flex: 1 }}>{children}</Box>
  </Stack>
);

// ─── Reject dialog ────────────────────────────────────────────────────────────

const RejectDialog = ({ open, onClose, onConfirm, loading }) => {
  const [note, setNote] = useState('');
  const handleConfirm = () => { onConfirm(note); setNote(''); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>Reject Course</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth multiline minRows={3}
          label="Rejection note *"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          helperText={`${note.length}/500 — minimum 10 characters`}
          error={note.length > 0 && note.length < 10}
          sx={{ mt: 1 }}
          inputProps={{ maxLength: 500 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
        <Button
          variant="contained" color="error"
          onClick={handleConfirm}
          disabled={note.length < 10 || loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Cancel />}
        >
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── New version dialog ───────────────────────────────────────────────────────

const NewVersionDialog = ({ open, onClose, onConfirm, loading, courseCode }) => {
  const [copyResources, setCopyResources] = useState(true);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableEnforceFocus closeAfterTransition={false}>
      <DialogTitle>Create New Version</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          A new DRAFT will be cloned from <strong>{courseCode}</strong> (version + 1).
          The original will be marked as not the latest version.
        </Alert>
        <FormControlLabel
          control={<Switch checked={copyResources} onChange={(e) => setCopyResources(e.target.checked)} />}
          label="Copy resources to new version"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(copyResources)}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <ContentCopy />}
        >
          Create new version
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Add resource dialog ──────────────────────────────────────────────────────

const AddResourceDialog = ({ open, onClose, onConfirm, loading }) => {
  const [form, setForm]       = useState({ title: '', type: 'LINK', url: '', isPublic: true });
  const [formError, setFormError] = useState('');

  const handle = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    if (!form.title.trim()) return setFormError('Title is required.');
    if (!form.url.trim())   return setFormError('URL is required.');
    setFormError('');
    onConfirm(form);
    setForm({ title: '', type: 'LINK', url: '', isPublic: true });
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth 
      disableEnforceFocus 
      closeAfterTransition={false}
    >
      <DialogTitle>Add Resource</DialogTitle>
      <DialogContent>
        {formError && <Alert severity="error" sx={{ mb: 1.5 }}>{formError}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField 
            fullWidth 
            size="small"
            label="Title *" 
            value={form.title} 
            onChange={handle('title')} 
            inputProps={{ maxLength: 200 }} 
          />

          {/* Resource type — FormControl + InputLabel + Select (no TextField[select]) */}
          <FormControl fullWidth size="small">
            <InputLabel id="add-res-type-lbl">Type</InputLabel>
            <Select
              labelId="add-res-type-lbl"
              id="add-res-type-sel"
              value={form.type}
              label="Type"
              onChange={handle('type')}
            >
              {COURSE_ENUMS.RESOURCE_TYPE.map((t) => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField 
            fullWidth 
            size="small" 
            label="URL *" 
            value={form.url} 
            onChange={handle('url')} 
            placeholder="https://…" 
            slotProps = {{
              htmlInput:{ maxLength: 500 },
            }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.isPublic}
                onChange={(e) => setForm((p) => ({ ...p, isPublic: e.target.checked }))}
              />
            }
            label="Visible to students"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <Add />}
        >
          Add resource
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── MAIN DRAWER ─────────────────────────────────────────────────────────────

const CourseDetailDrawer = ({
  open,
  onClose,
  course,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onNewVersion,
  onAddResource,
  onRemoveResource,
  onDelete,
  role = 'TEACHER',
}) => {
  const [rejectOpen,      setRejectOpen]      = useState(false);
  const [newVersionOpen,  setNewVersionOpen]  = useState(false);
  const [addResourceOpen, setAddResourceOpen] = useState(false);
  const [actionLoading,   setActionLoading]   = useState(false);
  const [actionError,     setActionError]     = useState('');

  if (!course) return null;

  const isGlobal  = role === 'ADMIN' || role === 'DIRECTOR';
  const isManager = isGlobal || role === 'CAMPUS_MANAGER';
  const isStudent = role === 'STUDENT';
  const status    = course.approvalStatus;

  // ── Workflow action wrapper ─────────────────────────────────────────────────

  const runAction = async (fn) => {
    setActionLoading(true);
    setActionError('');
    try {
      await fn();
      onClose();
    } catch (err) {
      setActionError(err?.response?.data?.message ?? err?.message ?? 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit         = () => runAction(() => onSubmit(course._id));
  const handleApprove        = () => runAction(() => onApprove(course._id));
  const handleReject         = (note) => { setRejectOpen(false); runAction(() => onReject(course._id, note)); };
  const handleNewVersion     = (copyRes) => { setNewVersionOpen(false); runAction(() => onNewVersion(course._id, copyRes)); };
  const handleAddResource    = (res) => { setAddResourceOpen(false); runAction(() => onAddResource(course._id, res)); };
  const handleRemoveResource = (resId) => runAction(() => onRemoveResource(course._id, resId));
  const handleDelete         = () => runAction(() => onDelete(course._id));

  // ── Status color accent ────────────────────────────────────────────────────

  const STATUS_ACCENT = {
    DRAFT:          '#94a3b8',
    PENDING_REVIEW: '#f97316',
    APPROVED:       '#22c55e',
    REJECTED:       '#ef4444',
  };
  const accent = STATUS_ACCENT[status] ?? '#94a3b8';

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '100%', sm: 500, md: 540 },
            maxWidth: '96vw',
            display: 'flex',
            flexDirection: 'column',
            mt:7
          },
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Box
          sx={{
            px: 2.5,
            pt: 2,
            pb: 1.5,
            borderBottom: `3px solid ${accent}`,
            bgcolor: alpha(accent, 0.04),
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" mb={0.75}>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  fontFamily="monospace"
                  sx={{
                    bgcolor: alpha(accent, 0.12),
                    color: accent,
                    px: 1,
                    py: 0.25,
                    borderRadius: 1,
                    letterSpacing: 0.5,
                  }}
                >
                  {course.courseCode}
                </Typography>
                <VersionBadge version={course.version} isLatest={course.isLatestVersion} />
                <ApprovalStatusChip status={status} />
              </Stack>
              <Typography variant="h6" fontWeight={700} lineHeight={1.3} noWrap>
                {course.title}
              </Typography>
              {course.discipline && (
                <Typography variant="caption" color="text.secondary">
                  {course.discipline}
                </Typography>
              )}
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ mt: 0.5, flexShrink: 0 }}>
              <Close fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <Box sx={{ overflowY: 'auto', flex: 1, px: 2.5, py: 2 }}>
          {actionError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError('')}>
              {actionError}
            </Alert>
          )}

          {/* Classification */}
          <Section title="Classification">
            <Row label="Category"><CategoryChip category={course.category} /></Row>
            <Row label="Level">
              <Typography variant="body2">{course.level?.name ?? '—'}</Typography>
            </Row>
            <Row label="Difficulty"><DifficultyChip level={course.difficultyLevel} /></Row>
            <Row label="Visibility"><VisibilityChip visibility={course.visibility} /></Row>
            <Row label="Languages">
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {(course.languages || []).map((l) => {
                  const lang = COURSE_ENUMS.LANGUAGE.find((x) => x.value === l);
                  return <Chip key={l} label={lang?.label ?? l} size="small" variant="outlined" />;
                })}
              </Stack>
            </Row>
            {(course.tags || []).length > 0 && (
              <Row label="Tags">
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                  {course.tags.map((t) => <Chip key={t} label={t} size="small" />)}
                </Stack>
              </Row>
            )}
          </Section>

          {/* Workload */}
          <Section title="Workload">
            {course.durationWeeks != null && (
              <Row label="Duration">
                <Typography variant="body2">{course.durationWeeks} weeks</Typography>
              </Row>
            )}
            {course.creditHours != null && (
              <Row label="Credit hours">
                <Typography variant="body2">{course.creditHours}</Typography>
              </Row>
            )}
            <Row label="Breakdown">
              <WorkloadSummary workload={course.estimatedWorkload} />
            </Row>
          </Section>

          {/* Description */}
          {course.description && (
            <Section title="Description">
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                {course.description}
              </Typography>
            </Section>
          )}

          {/* Objectives */}
          {(course.objectives || []).length > 0 && (
            <Section title={`Objectives (${course.objectives.length})`}>
              <List dense disablePadding>
                {course.objectives.map((o, i) => (
                  <ListItem key={i} disablePadding sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          <Box component="span" sx={{ fontWeight: 700, color: accent, mr: 0.5 }}>
                            {i + 1}.
                          </Box>
                          {o}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Section>
          )}

          {/* Prerequisites */}
          {(course.prerequisites || []).length > 0 && (
            <Section title={`Prerequisites (${course.prerequisites.length})`}>
              <List dense disablePadding>
                {course.prerequisites.map((p) => (
                  <ListItem key={p._id} disablePadding sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          <Box component="span" fontFamily="monospace" fontWeight={700} sx={{ mr: 0.5 }}>
                            {p.course?.courseCode}
                          </Box>
                          {p.course?.title ?? 'Unknown'}
                        </Typography>
                      }
                      secondary={
                        <Chip
                          label={p.type}
                          size="small"
                          color={p.type === 'REQUIRED' ? 'error' : 'default'}
                          variant="outlined"
                          sx={{ mt: 0.25 }}
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Section>
          )}

          {/* Syllabus — collapsible, no action → no nesting issue */}
          {(course.syllabus || []).length > 0 && (
            <Section title={`Syllabus (${course.syllabus.length} units)`} collapsible>
              <List dense disablePadding>
                {course.syllabus.map((u, i) => (
                  <ListItem key={u._id ?? i} disablePadding sx={{ py: 0.5, alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          {u.periodType} {u.periodNumber}: {u.title}
                        </Typography>
                      }
                      secondary={
                        <>
                          {u.content && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {u.content}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={0.5} mt={0.25}>
                            <Chip label={u.sessionType} size="small" variant="outlined" />
                            {u.estimatedHours && (
                              <Chip label={`${u.estimatedHours}h`} size="small" />
                            )}
                          </Stack>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Section>
          )}

          {/* Resources — collapsible WITH action (fix applied here) */}
          <Section
            title={`Resources (${(course.resources || []).length})`}
            collapsible
            action={
              isManager ? (
                <Tooltip title="Add resource">
                  {/* IconButton is a sibling of Accordion, not inside AccordionSummary */}
                  <IconButton
                    size="small"
                    onClick={() => setAddResourceOpen(true)}
                    aria-label="Add resource"
                  >
                    <Add fontSize="small" />
                  </IconButton>
                </Tooltip>
              ) : null
            }
          >
            {(course.resources || []).length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                No resources attached.
              </Typography>
            ) : (
             <List dense disablePadding>
              {course.resources
                .filter((r) => (isStudent ? r.isPublic !== false : true))
                .map((r) => (
                  <ListItem 
                    key={r._id} 
                    disablePadding 
                    sx={{ py: 0.25 }}
                    // Move the logic here
                    secondaryAction={
                      !isStudent && (
                        <>
                          <Tooltip title="Open">
                            <IconButton
                              size="small"
                              component="a"
                              href={r.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <OpenInNew fontSize="inherit" />
                            </IconButton>
                          </Tooltip>
                          {isGlobal && (
                            <Tooltip title="Remove">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveResource(r._id)}
                              >
                                <Delete fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )
                    }
                  >
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {RESOURCE_ICONS[r.type] ?? RESOURCE_ICONS.OTHER}
                    </ListItemIcon>
                    <ListItemText
                      primary={<Typography variant="body2">{r.title}</Typography>}
                      secondary={
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.25}>
                          <Chip label={r.type} size="small" variant="outlined" />
                          {r.isPublic === false && (
                            <Chip label="Staff only" size="small" color="warning" />
                          )}
                        </Stack>
                      }
                    />
                  </ListItem>
                ))}
            </List>
            )}
          </Section>

          {/* Approval history */}
          {isManager && (course.approvalHistory || []).length > 0 && (
            <Section title="Approval History" collapsible>
              <List dense disablePadding>
                {[...course.approvalHistory].reverse().map((h) => (
                  <ListItem key={h._id} disablePadding sx={{ py: 0.25, alignItems: 'flex-start' }}>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <ApprovalStatusChip status={h.status} size="small" />
                          <Typography variant="caption" color="text.secondary">
                            {fmtDate(h.actedAt)}
                            {h.actor && ` — ${h.actor.firstName} ${h.actor.lastName}`}
                          </Typography>
                        </Stack>
                      }
                      secondary={h.note && (
                        <Typography variant="caption" color="text.secondary">
                          {h.note}
                        </Typography>
                      )}
                    />
                  </ListItem>
                ))}
              </List>
            </Section>
          )}

          {/* Metadata */}
          <Section title="Metadata">
            <Row label="Created by">
              <Typography variant="body2">
                {course.createdBy
                  ? `${course.createdBy.firstName} ${course.createdBy.lastName}`
                  : '—'}
              </Typography>
            </Row>
            <Row label="Created on">
              <Typography variant="body2">{fmtDate(course.createdAt)}</Typography>
            </Row>
            <Row label="Last updated">
              <Typography variant="body2">{fmtDate(course.updatedAt)}</Typography>
            </Row>
          </Section>
        </Box>

        {/* ── Action bar (ADMIN / DIRECTOR only) ──────────────────────────── */}
        {isGlobal && (
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.default',
              position: 'sticky',
              mb:7,
            }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {(status === 'DRAFT' || status === 'REJECTED') && (
                <Button size="small" variant="outlined" startIcon={<Edit />} onClick={onEdit}>
                  Edit
                </Button>
              )}
              {(status === 'DRAFT' || status === 'REJECTED') && (
                <Button
                  size="small" variant="contained" color="primary"
                  startIcon={actionLoading ? <CircularProgress size={14} /> : <Send />}
                  onClick={handleSubmit}
                  disabled={actionLoading}
                >
                  Submit
                </Button>
              )}
              {status === 'PENDING_REVIEW' && (
                <Button
                  size="small" variant="contained" color="success"
                  startIcon={actionLoading ? <CircularProgress size={14} /> : <CheckCircle />}
                  onClick={handleApprove}
                  disabled={actionLoading}
                >
                  Approve
                </Button>
              )}
              {status === 'PENDING_REVIEW' && (
                <Button
                  size="small" variant="outlined" color="error"
                  startIcon={<Cancel />}
                  onClick={() => setRejectOpen(true)}
                  disabled={actionLoading}
                >
                  Reject
                </Button>
              )}
              {status === 'APPROVED' && (
                <Button
                  size="small" variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={() => setNewVersionOpen(true)}
                  disabled={actionLoading}
                >
                  New version
                </Button>
              )}
              {role === 'ADMIN' && (status === 'DRAFT' || status === 'REJECTED') && (
                <Button
                  size="small" variant="outlined" color="error"
                  startIcon={<Delete />}
                  onClick={handleDelete}
                  disabled={actionLoading}
                >
                  Delete
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* Sub-dialogs */}
      <RejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
        loading={actionLoading}
      />
      <NewVersionDialog
        open={newVersionOpen}
        onClose={() => setNewVersionOpen(false)}
        onConfirm={handleNewVersion}
        loading={actionLoading}
        courseCode={course.courseCode}
      />
      <AddResourceDialog
        open={addResourceOpen}
        onClose={() => setAddResourceOpen(false)}
        onConfirm={handleAddResource}
        loading={actionLoading}
      />
    </>
  );
};

export default CourseDetailDrawer;