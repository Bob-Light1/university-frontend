/**
 * @file DocumentDetailDrawer.jsx
 * @description Right-side detail drawer for a single document.
 *
 * Shows full metadata, content preview, workflow actions (publish, archive, lock, etc.),
 * export/download buttons, share link management, version history, and audit log.
 *
 * Accessible to all roles — action buttons are conditionally rendered based on role.
 *
 * Fixes applied (v1.2):
 *  1. AuditPanel / SharePanel: ListItemText secondary prop passed a <Stack> (div) which
 *     MUI wraps in a <Typography component="p"> — <div> inside <p> is invalid HTML.
 *     Fixed by adding secondaryTypographyProps={{ component: 'div' }} on all affected
 *     ListItemText instances and wrapping secondary content in <Box component="span">
 *     stacks where needed.
 *  2. aria-hidden focus leak (Drawer close): blurs the active element before calling
 *     onClose() — prevents MUI from applying aria-hidden while a focusable descendant
 *     still holds focus.
 *  3. aria-hidden focus leak (Edit / Delete buttons): when the user clicks Edit or
 *     Delete inside the Drawer, the clicked button retains focus. MUI then opens a
 *     Dialog (DocumentForm / confirm) on top of the Drawer. When that Dialog closes,
 *     MUI sets aria-hidden="true" on the Drawer while the button inside it still holds
 *     focus → browser warning. Fix: blur the active element before delegating to
 *     onEdit() / onDelete(), via dedicated handleEdit / handleDelete wrappers.
 *     This mirrors the pattern already in place for handleClose.
 */

import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Divider,
  Button,
  IconButton,
  Chip,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Close,
  Edit,
  Delete,
  PictureAsPdf,
  Share,
  Lock,
  LockOpen,
  Archive,
  Restore,
  CheckCircle,
  ContentCopy,
  VerifiedUser,
  History,
  ManageSearch,
  Download,
  LinkOff,
} from '@mui/icons-material';

import { AuthContext } from '../../context/AuthContext';
import {
  DocumentStatusChip,
  DocumentTypeChip,
  DocumentCategoryChip,
  OfficialBadge,
  DocumentVersionBadge,
  FileSizeDisplay,
  AuditActionChip,
  canUserEdit,
  canUserShare,
  canUserWorkflow,
  getMimeLabel,
} from './DocumentShared';

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAWER_WIDTH = 480;

/**
 * Blur the currently focused element, if any.
 * Called before opening a Dialog from inside a Drawer to prevent MUI from
 * applying aria-hidden on the Drawer while a descendant still holds focus.
 */
const blurActive = () => {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
};

// ─── Reason dialog — used for publish / archive / lock / delete ───────────────

const ReasonDialog = ({ open, title, required = false, onConfirm, onClose, confirmLabel = 'Confirm' }) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(reason);
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          rows={3}
          size="small"
          label={required ? 'Reason (required)' : 'Reason (optional)'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={required && !reason.trim()}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Share link panel ─────────────────────────────────────────────────────────

const SharePanel = ({ documentId, hookRef, docStatus }) => {
  const [shares,   setShares]   = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [creating, setCreating] = useState(false);
  const [newLink,  setNewLink]  = useState(null);
  const [opts, setOpts] = useState({ expiresInHours: 48, maxDownloads: 5 });

  const loadShares = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hookRef.fetchShares(documentId);
      setShares(data?.shares ?? data ?? []);
    } finally {
      setLoading(false);
    }
  }, [documentId, hookRef]);

  useEffect(() => { loadShares(); }, [loadShares]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const result = await hookRef.share(documentId, opts);
      setNewLink(result);
      loadShares();
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (shareId) => {
    await hookRef.revokeShare(shareId);
    loadShares();
  };

  const canShare = ['PUBLISHED', 'LOCKED'].includes(docStatus);

  return (
    <Box>
      {!canShare && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Only PUBLISHED or LOCKED documents can be shared.
        </Alert>
      )}

      {newLink && (
        <Alert
          severity="success"
          sx={{ mb: 1.5, wordBreak: 'break-all' }}
          onClose={() => setNewLink(null)}
        >
          <Typography variant="caption" fontWeight={700}>
            Share link created — copy it now. It will not be shown again.
          </Typography>
          <Box sx={{ mt: 0.5, fontFamily: 'monospace', fontSize: '0.7rem' }}>
            {newLink.shareUrl}
          </Box>
        </Alert>
      )}

      {canShare && (
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <TextField
              size="small"
              type="number"
              label="Expires in (hours)"
              value={opts.expiresInHours}
              onChange={(e) => setOpts((p) => ({ ...p, expiresInHours: +e.target.value }))}
              sx={{ width: 160 }}
              inputProps={{ min: 1 }}
            />
            <TextField
              size="small"
              type="number"
              label="Max downloads"
              value={opts.maxDownloads}
              onChange={(e) => setOpts((p) => ({ ...p, maxDownloads: +e.target.value }))}
              sx={{ width: 140 }}
              inputProps={{ min: 1 }}
            />
          </Stack>
          <Button
            size="small"
            variant="contained"
            startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <Share />}
            onClick={handleCreate}
            disabled={creating}
          >
            Create Share Link
          </Button>
        </Box>
      )}

      {loading ? (
        <CircularProgress size={20} />
      ) : shares.length === 0 ? (
        <Typography variant="body2" color="text.disabled">No active share links.</Typography>
      ) : (
        <List dense disablePadding>
          {shares.map((s) => (
            <ListItem key={s._id} disableGutters divider>
              {/*
                FIX 1: secondary contains a <Stack> (renders as <div>).
                MUI wraps secondary in <Typography component="p"> by default → <div> in <p>.
                Resolved by secondaryTypographyProps={{ component: 'div' }}.
              */}
              <ListItemText
                primary={
                  <Typography variant="caption" fontFamily="monospace">
                    {s._id}
                  </Typography>
                }
                secondary={
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Typography variant="caption">
                      Expires: {new Date(s.expiresAt).toLocaleString()}
                    </Typography>
                    <Typography variant="caption">
                      Downloads: {s.downloadCount}/{s.maxDownloads}
                    </Typography>
                  </Stack>
                }
                secondaryTypographyProps={{ component: 'div' }}
              />
              <ListItemSecondaryAction>
                <Tooltip title="Revoke link">
                  <IconButton size="small" color="error" onClick={() => handleRevoke(s._id)}>
                    <LinkOff fontSize="small" />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

// ─── Version history panel ────────────────────────────────────────────────────

const VersionPanel = ({ documentId, hookRef, userRole }) => {
  const [versions,  setVersions]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [restoring, setRestoring] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await hookRef.fetchVersions(documentId);
        setVersions(data?.versions ?? data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId, hookRef]);

  const handleRestore = async (version, reason) => {
    setRestoring(null);
    await hookRef.restoreVersion(documentId, version, reason);
  };

  const canRestore = canUserWorkflow(userRole);

  if (loading) return <CircularProgress size={20} />;
  if (!versions.length) return (
    <Typography variant="body2" color="text.disabled">No version history yet.</Typography>
  );

  return (
    <List dense disablePadding>
      {versions.map((v) => (
        <ListItem key={v._id} disableGutters divider>
          {/*
            FIX 1: secondary is a plain Typography — no block element, no issue here.
            secondaryTypographyProps kept for consistency and future safety.
          */}
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip label={`v${v.version}`} size="small" variant="outlined" />
                <Typography variant="caption">{v.snapshotReason}</Typography>
              </Stack>
            }
            secondary={new Date(v.takenAt).toLocaleString()}
            secondaryTypographyProps={{ component: 'div', variant: 'caption', color: 'text.secondary' }}
          />
          {canRestore && (
            <ListItemSecondaryAction>
              <Tooltip title="Restore this version">
                <IconButton size="small" onClick={() => setRestoring(v.version)}>
                  <Restore fontSize="small" />
                </IconButton>
              </Tooltip>
            </ListItemSecondaryAction>
          )}
          <ReasonDialog
            open={restoring === v.version}
            title={`Restore to v${v.version}`}
            required
            onConfirm={(reason) => handleRestore(v.version, reason)}
            onClose={() => setRestoring(null)}
            confirmLabel="Restore"
          />
        </ListItem>
      ))}
    </List>
  );
};

// ─── Audit log panel ──────────────────────────────────────────────────────────

const AuditPanel = ({ documentId, hookRef }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await hookRef.fetchAudit(documentId, { limit: 30 });
        const list = data?.records ?? data?.data ?? data ?? [];
        setEntries(list);
      } finally {
        setLoading(false);
      }
    })();
  }, [documentId, hookRef]);

  if (loading) return <CircularProgress size={20} />;
  if (!entries.length) return (
    <Typography variant="body2" color="text.disabled">No audit entries.</Typography>
  );

  return (
    <List dense disablePadding>
      {entries.map((e) => (
        <ListItem key={e._id} disableGutters divider sx={{ alignItems: 'flex-start' }}>
          {/*
            FIX 1 (main fix): both primary and secondary contain <Stack> / block elements.
            MUI renders secondary inside <Typography component="p"> by default → invalid HTML.
            secondaryTypographyProps={{ component: 'div' }} changes the wrapper to a <div>,
            making <div> inside <div> valid.
            Same fix applied to primary via primaryTypographyProps.
          */}
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <AuditActionChip action={e.action} />
                <Typography variant="caption" color="text.secondary">
                  {e.userModel}
                </Typography>
              </Stack>
            }
            secondary={
              <Stack spacing={0.25}>
                {e.reason && (
                  <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                    &ldquo;{e.reason}&rdquo;
                  </Typography>
                )}
                <Typography variant="caption" color="text.disabled">
                  {new Date(e.performedAt).toLocaleString()}
                </Typography>
              </Stack>
            }
            primaryTypographyProps={{ component: 'div' }}
            secondaryTypographyProps={{ component: 'div' }}
          />
        </ListItem>
      ))}
    </List>
  );
};

// ─── Main Drawer ──────────────────────────────────────────────────────────────

/**
 * @param {{
 *   open:      boolean,
 *   doc:       Object | null,
 *   onClose:   () => void,
 *   onEdit:    (doc: Object) => void,
 *   onDelete:  (doc: Object) => void,
 *   onRefresh: () => void,
 *   hookRef:   Object,
 * }} props
 */
const DocumentDetailDrawer = ({
  open,
  doc,
  onClose,
  onEdit,
  onDelete,
  onRefresh,
  hookRef,
}) => {
  const theme   = useTheme();
  const { getUserRole } = useContext(AuthContext);
  const userRole        = getUserRole();

  const [tab,        setTab]       = useState(0);
  const [actionBusy, setActionBusy] = useState(null);
  const [error,      setError]     = useState(null);
  const [reasonFor,  setReasonFor]  = useState(null);

  // ── Reset tab on open ──────────────────────────────────────────────────────
  useEffect(() => { if (open) { setTab(0); setError(null); } }, [open, doc?._id]);

  /**
   * FIX 2 — aria-hidden focus leak (Drawer close).
   *
   * When this Drawer closes right after a Dialog (DocumentForm) closes, MUI
   * sets aria-hidden="true" on #root while the Dialog's submit button may still
   * hold focus. This triggers a browser accessibility warning and can break
   * screen-reader navigation.
   *
   * Solution: blur the focused element before handing control to onClose().
   * This is the same pattern used in ScheduleTeacher.jsx (handleCloseDrawer).
   */
  const handleClose = useCallback(() => {
    blurActive();
    onClose();
  }, [onClose]);

  /**
   * FIX 3 — aria-hidden focus leak (Edit button).
   *
   * When the user clicks the Edit IconButton inside the Drawer, that button
   * retains focus. The DocumentForm Dialog then opens on top of the Drawer.
   * When the Dialog closes (submit or cancel), MUI sets aria-hidden="true" on
   * the Drawer while the Edit button inside it still holds focus.
   *
   * Solution: blur the active element before opening the Dialog so that MUI
   * can safely transfer focus to the Dialog's first focusable element, and
   * later restore it to the Drawer's close button without triggering the
   * aria-hidden warning.
   */
  const handleEdit = useCallback((document) => {
    blurActive();
    onEdit(document);
  }, [onEdit]);

  /**
   * FIX 3 (same pattern) — aria-hidden focus leak (Delete button).
   *
   * The Delete button triggers a confirmation Dialog. Same focus-retention
   * problem applies — blur before delegating.
   */
  const handleDelete = useCallback((document) => {
    blurActive();
    onDelete(document);
  }, [onDelete]);

  if (!doc) return null;

  const editable     = canUserEdit(userRole, doc.type);
  const shareable    = canUserShare(userRole);
  const workflowable = canUserWorkflow(userRole);

  const isLocked    = doc.status === 'LOCKED';
  const isPublished = doc.status === 'PUBLISHED';
  const isDraft     = doc.status === 'DRAFT';
  const isArchived  = doc.status === 'ARCHIVED';

  const isManager = ['ADMIN', 'DIRECTOR'].includes(userRole);

  // ── Workflow action dispatcher ─────────────────────────────────────────────

  const runAction = async (action, reason) => {
    setActionBusy(action);
    setError(null);
    setReasonFor(null);
    try {
      switch (action) {
        case 'publish':   await hookRef.publish(doc._id, reason);   break;
        case 'archive':   await hookRef.archive(doc._id, reason);   break;
        case 'restore':   await hookRef.restore(doc._id, reason);   break;
        case 'lock':      await hookRef.lock(doc._id, reason);      break;
        case 'unlock':    await hookRef.unlock(doc._id, reason);    break;
        case 'official':  await hookRef.official(doc._id, reason);  break;
        case 'duplicate': await hookRef.duplicate(doc._id);         break;
        default: break;
      }
      onRefresh();
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Action failed.');
    } finally {
      setActionBusy(null);
    }
  };

  const ActionBtn = ({ action, icon, label, color = 'primary', variant = 'outlined', disabled = false }) => (
    <Button
      size="small"
      variant={variant}
      color={color}
      startIcon={actionBusy === action ? <CircularProgress size={14} color="inherit" /> : icon}
      onClick={() => setReasonFor(action)}
      disabled={!!actionBusy || disabled}
      sx={{ minWidth: 0 }}
    >
      {label}
    </Button>
  );

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width:   { xs: '100vw', sm: DRAWER_WIDTH },
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <Box sx={{ px: 2.5, pt: 2, pb: 1.5 }}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                {doc.title}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: 'monospace' }}
              >
                {doc.ref}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose} sx={{ mt: -0.5 }}>
              <Close />
            </IconButton>
          </Stack>

          {/* Status / type row */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ mt: 1 }}>
            <DocumentStatusChip   status={doc.status} />
            <DocumentTypeChip     type={doc.type} />
            <DocumentCategoryChip category={doc.category} />
            {doc.isOfficial && <OfficialBadge />}
            <DocumentVersionBadge version={doc.currentVersion ?? 1} />
          </Stack>
        </Box>

        <Divider />

        {/* ── Action toolbar ──────────────────────────────────────────────────── */}
        {(editable || workflowable) && (
          <Box sx={{ px: 2.5, py: 1 }}>
            {error && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setError(null)}>{error}</Alert>}
            <Stack direction="row" spacing={1} flexWrap="wrap">

              {/* Download PDF */}
              <Tooltip title="Download PDF">
                <IconButton
                  size="small"
                  onClick={() => hookRef.downloadPdf(doc._id, doc.title)}
                  disabled={!!actionBusy}
                >
                  <PictureAsPdf fontSize="small" />
                </IconButton>
              </Tooltip>

              {/* Download raw (IMPORTED only) */}
              {doc.type === 'IMPORTED' && doc.importedFile && (
                <Tooltip title={`Download ${getMimeLabel(doc.importedFile.mimeType)}`}>
                  <IconButton
                    size="small"
                    onClick={() => hookRef.downloadRaw(doc._id, doc.importedFile.originalName)}
                    disabled={!!actionBusy}
                  >
                    <Download fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Edit — FIX 3: use handleEdit to blur before opening DocumentForm Dialog */}
              {editable && (isDraft || (isPublished && isManager)) && (
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(doc)}>
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Duplicate */}
              {workflowable && (
                <Tooltip title="Duplicate">
                  <IconButton size="small" onClick={() => runAction('duplicate')} disabled={!!actionBusy}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Divider */}
              <Box sx={{ borderLeft: `1px solid ${theme.palette.divider}`, mx: 0.5 }} />

              {/* Workflow */}
              {workflowable && isDraft     && <ActionBtn action="publish"  icon={<CheckCircle />} label="Publish"  color="success" />}
              {workflowable && isPublished && <ActionBtn action="archive"  icon={<Archive />}     label="Archive" />}
              {workflowable && isArchived  && <ActionBtn action="restore"  icon={<Restore />}    label="Restore"  color="secondary" />}
              {workflowable && isPublished && !isLocked && <ActionBtn action="lock"   icon={<Lock />}     label="Lock"     color="warning" />}
              {workflowable && isLocked    && isManager  && <ActionBtn action="unlock" icon={<LockOpen />} label="Unlock"   color="warning" />}
              {workflowable && !doc.isOfficial && <ActionBtn action="official" icon={<VerifiedUser />} label="Official" color="info" />}

              {/* Delete — FIX 3: use handleDelete to blur before opening confirm Dialog */}
              {editable && !isLocked && (
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => handleDelete(doc)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        )}

        <Divider />

        {/* ── Tabs ────────────────────────────────────────────────────────────── */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ px: 2.5, borderBottom: 1, borderColor: 'divider', minHeight: 40 }}
          TabIndicatorProps={{ sx: { height: 3 } }}
        >
          <Tab label="Details"  sx={{ minHeight: 40, py: 0 }} />
          {shareable    && <Tab label="Share"    sx={{ minHeight: 40, py: 0 }} />}
          {workflowable && <Tab label="Versions" sx={{ minHeight: 40, py: 0 }} />}
          {workflowable && <Tab label="Audit"    sx={{ minHeight: 40, py: 0 }} />}
        </Tabs>

        {/* ── Tab panels ──────────────────────────────────────────────────────── */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 2.5, py: 2 }}>

          {/* DETAILS tab */}
          {tab === 0 && (
            <Stack spacing={2}>
              {doc.description && (
                <Typography variant="body2" color="text.secondary">
                  {doc.description}
                </Typography>
              )}

              {/* Tags */}
              {doc.tags?.length > 0 && (
                <Stack direction="row" spacing={0.75} flexWrap="wrap">
                  {doc.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}

              <Divider />

              {/* Metadata grid */}
              <Box
                sx={{
                  display:             'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap:                 1.5,
                }}
              >
                {[
                  { label: 'Status',        value: <DocumentStatusChip status={doc.status} /> },
                  { label: 'Type',          value: <DocumentTypeChip type={doc.type} /> },
                  { label: 'Category',      value: <DocumentCategoryChip category={doc.category} /> },
                  { label: 'Version',       value: <DocumentVersionBadge version={doc.currentVersion ?? 1} /> },
                  { label: 'Academic Year', value: doc.metadata?.academicYear ?? '—' },
                  { label: 'Semester',      value: doc.metadata?.semester ?? '—' },
                  {
                    label: 'Created',
                    value: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—',
                  },
                  {
                    label: 'Published',
                    value: doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString() : '—',
                  },
                  { label: 'Downloads', value: doc.downloadCount ?? 0 },
                  { label: 'Prints',    value: doc.printCount ?? 0 },
                ].map(({ label, value }) => (
                  <Box key={label}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {label}
                    </Typography>
                    {typeof value === 'string' || typeof value === 'number' ? (
                      <Typography variant="body2" fontWeight={500}>{value}</Typography>
                    ) : value}
                  </Box>
                ))}
              </Box>

              {/* Imported file info */}
              {doc.importedFile && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      Imported File
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={getMimeLabel(doc.importedFile.mimeType)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="body2">{doc.importedFile.originalName}</Typography>
                      <FileSizeDisplay bytes={doc.importedFile.sizeBytes} />
                    </Stack>
                  </Box>
                </>
              )}

              {/* Last audit entry */}
              {doc.lastAuditEntry && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                      Last Activity
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AuditActionChip action={doc.lastAuditEntry.action} />
                      <Typography variant="caption" color="text.secondary">
                        {doc.lastAuditEntry.userModel} ·{' '}
                        {new Date(doc.lastAuditEntry.performedAt).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          )}

          {/* SHARE tab */}
          {tab === 1 && shareable && (
            <SharePanel
              documentId={doc._id}
              hookRef={hookRef}
              docStatus={doc.status}
            />
          )}

          {/* VERSIONS tab */}
          {tab === 2 && workflowable && (
            <VersionPanel
              documentId={doc._id}
              hookRef={hookRef}
              userRole={userRole}
            />
          )}

          {/* AUDIT tab */}
          {tab === 3 && workflowable && (
            <AuditPanel documentId={doc._id} hookRef={hookRef} />
          )}
        </Box>
      </Drawer>

      {/* Reason dialogs for workflow actions */}
      {[
        { action: 'publish',  title: 'Publish Document',  required: false, label: 'Publish'  },
        { action: 'archive',  title: 'Archive Document',  required: false, label: 'Archive'  },
        { action: 'restore',  title: 'Restore Document',  required: false, label: 'Restore'  },
        { action: 'lock',     title: 'Lock Document',     required: false, label: 'Lock'     },
        { action: 'unlock',   title: 'Unlock Document',   required: true,  label: 'Unlock'   },
        { action: 'official', title: 'Mark as Official',  required: false, label: 'Mark'     },
      ].map(({ action, title, required, label }) => (
        <ReasonDialog
          key={action}
          open={reasonFor === action}
          title={title}
          required={required}
          confirmLabel={label}
          onConfirm={(r) => runAction(action, r)}
          onClose={() => setReasonFor(null)}
        />
      ))}
    </>
  );
};

export default DocumentDetailDrawer;