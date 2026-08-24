/**
 * @file DocumentManager.jsx
 * @description Document management page for ADMIN / DIRECTOR / CAMPUS_MANAGER.
 *
 * Features:
 *  - Paginated document list with status tabs
 *  - KPI cards (total, draft, published, archived, locked)
 *  - Create / import document
 *  - Edit, publish, archive, lock, duplicate, delete
 *  - Per-row export PDF / download raw
 *  - Detail drawer with share links, versions, audit log
 *  - Mobile-responsive: cards on xs, table on sm+
 *
 * Campus isolation: enforced server-side. No campusId injected here.
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Button,
  Stack,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
  Chip,
  Divider,
  alpha,
} from '@mui/material';
import {
  Add,
  Refresh,
  Delete,
  Edit,
  Visibility,
  PictureAsPdf,
  Download,
  ContentCopy,
  Description,
  CheckCircle,
  Archive as ArchiveIcon,
  Lock as LockIcon,
  CloudUpload,
} from '@mui/icons-material';

import { AuthContext }   from '../../../context/AuthContext';
import KPICards          from '../../../components/shared/KpiCard';
import useDocument       from '../../../hooks/useDocument';
import DocumentFilters   from '../../../components/documents/DocumentFilters';
import DocumentForm      from '../../../components/documents/DocumentForm';
import DocumentDetailDrawer from '../../../components/documents/DocumentDetailDrawer';
import {
  DocumentStatusChip,
  DocumentTypeChip,
  DocumentCategoryChip,
  OfficialBadge,
  DocumentVersionBadge,
  DocumentEmptyState,
  getMimeLabel,
} from '../../../components/documents/DocumentShared';
import { fDate } from '../../../utils/dateFormat';
import HardDeleteDialog from '../../../components/shared/HardDeleteDialog';
import HardDeleteAction from '../../../components/shared/HardDeleteAction';
import { useHardDelete } from '../../../hooks/useHardDelete';

// ─── KPI config ───────────────────────────────────────────────────────────────

const buildKpis = (docs, total) => ({
  total:     { label: 'Total',     value: total,                                            color: '#6366f1' },
  draft:     { label: 'Drafts',    value: docs.filter((d) => d.status === 'DRAFT').length,     color: '#94a3b8' },
  published: { label: 'Published', value: docs.filter((d) => d.status === 'PUBLISHED').length, color: '#22c55e' },
  archived:  { label: 'Archived',  value: docs.filter((d) => d.status === 'ARCHIVED').length,  color: '#a78bfa' },
  locked:    { label: 'Locked',    value: docs.filter((d) => d.status === 'LOCKED').length,    color: '#f43f5e' },
});

// ─── Delete confirm dialog ────────────────────────────────────────────────────

/**
 * Soft-delete confirmation. Permanent deletion is deliberately NOT reachable from here: the
 * registry demands a document be deleted *first* (`requireArchivedFirst`), so a "delete
 * permanently" shortcut on a live document could only ever produce a refusal. It lives in the
 * Deleted tab instead, one deliberate step later, behind the impact → phrase → password →
 * justification flow.
 */
const DeleteDialog = ({ open, doc, onConfirm, onClose, canHardDelete }) => {
  const [reason, setReason] = useState('');

  const handleClose = () => { setReason(''); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
      disableEnforceFocus closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle>Delete Document</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          Are you sure you want to delete <strong>{doc?.title}</strong>?
        </Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          rows={2}
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {canHardDelete && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            This keeps the document recoverable. To destroy it and every version irreversibly,
            delete it first, then use the <strong>Deleted</strong> tab.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" color="inherit" onClick={handleClose}>Cancel</Button>
        <Button variant="contained" color="error" onClick={() => onConfirm(reason)}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Status tabs config ───────────────────────────────────────────────────────

/**
 * The trash tab. It is NOT a `status` value — `Document.status` is a workflow state and stays
 * PUBLISHED on a soft-deleted document (CLAUDE.md §5.1); deletion is `deletedAt`. The tab
 * therefore switches the `deleted` query flag rather than the status filter.
 */
const DELETED_TAB = '__deleted';

const STATUS_TABS = [
  { value: '',          label: 'All' },
  { value: 'DRAFT',     label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED',  label: 'Archived' },
  { value: 'LOCKED',    label: 'Locked' },
];

// ─── Main component ───────────────────────────────────────────────────────────

const DocumentManager = () => {
  const { campusId } = useParams();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const { getUserRole } = useContext(AuthContext);
  const userRole        = getUserRole();
  const isAdmin         = ['ADMIN', 'DIRECTOR'].includes(userRole);

  const hookRef = useDocument('manager');
  const {
    documents, total, loading, error,
    filters, fetch, handleFilterChange, handleReset, setPage,
    remove,
  } = hookRef;

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [formOpen,    setFormOpen]    = useState(false);
  const [editDoc,     setEditDoc]     = useState(null);
  const [drawerDoc,   setDrawerDoc]   = useState(null);
  const [deleteDoc,   setDeleteDoc]   = useState(null);
  const [snack,       setSnack]       = useState(null);
  const [statusTab,   setStatusTab]   = useState('');

  const inTrash = statusTab === DELETED_TAB;

  // ── Fetch on filter change ─────────────────────────────────────────────────
  useEffect(() => { fetch(); }, [fetch, filters]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStatusTab = (_, val) => {
    setStatusTab(val);
    // The two filters are mutually exclusive: the trash lists soft-deleted documents whatever
    // their workflow status, and every other tab lists live ones.
    handleFilterChange('status',  val === DELETED_TAB ? '' : val);
    handleFilterChange('deleted', val === DELETED_TAB ? 'true' : '');
  };

  /**
   * Resetting the filters clears `deleted` along with everything else, so the tab has to follow
   * it back to All — otherwise the trash tab would stay selected over a list of live documents.
   */
  const handleResetFilters = useCallback(() => {
    setStatusTab('');
    handleReset();
  }, [handleReset]);

  const handleFormSuccess = useCallback((doc) => {
    setFormOpen(false);
    setEditDoc(null);
    setSnack({ severity: 'success', message: `Document "${doc?.document?.title ?? doc?.title}" saved.` });
    fetch();
  }, [fetch]);

  const handleDelete = useCallback(async (reason) => {
    try {
      await remove(deleteDoc._id, reason);
      setDeleteDoc(null);
      setSnack({ severity: 'success', message: 'Document deleted.' });
      if (drawerDoc?._id === deleteDoc._id) setDrawerDoc(null);
      fetch();
    } catch (err) {
      setSnack({ severity: 'error', message: err?.response?.data?.message ?? 'Delete failed.' });
    }
  }, [deleteDoc, remove, drawerDoc, fetch]);

  // Permanent deletion — the registry opens `document` to ADMIN and DIRECTOR and demands the
  // document be deleted first; both rules are read from `GET /danger-zone/entities`.
  const hardDelete = useHardDelete('document', {
    onDeleted: () => {
      setDrawerDoc(null);
      setSnack({ severity: 'success', message: 'Document permanently deleted.' });
      fetch();
    },
  });

  const handleRefresh = useCallback(() => { fetch(); }, [fetch]);

  // ── Row actions ────────────────────────────────────────────────────────────

  const kpis = buildKpis(documents, total);
  const kpiCards = Object.values(kpis).map((k) => ({
    title: k.label,
    value: k.value,
    color: k.color,
  }));

  // ── Mobile card renderer ───────────────────────────────────────────────────

  const renderMobileCard = (doc) => (
    <Card key={doc._id} variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap>{doc.title}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {doc.ref}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>
          <DocumentStatusChip status={doc.status} />
          <DocumentTypeChip   type={doc.type} />
          {doc.isOfficial && <OfficialBadge size="small" />}
        </Stack>
      </CardContent>
      <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
        {inTrash ? (
          <HardDeleteAction
            onHardDelete={
              hardDelete.canDelete(true)
                ? () => hardDelete.requestDelete(doc._id, doc.title)
                : null
            }
          />
        ) : (
        <>
        <Tooltip title="View details">
          <span>
            <IconButton size="small" onClick={() => setDrawerDoc(doc)}>
              <Visibility fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Download PDF">
          <span>
            <IconButton size="small" onClick={() => hookRef.downloadPdf(doc._id, doc.title)}>
              <PictureAsPdf fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Edit">
          <span>
            <IconButton size="small" onClick={() => { setEditDoc(doc); setFormOpen(true); }}>
              <Edit fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete">
          <span>
            <IconButton size="small" color="error" onClick={() => setDeleteDoc(doc)}>
              <Delete fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        </>
        )}
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>Documents</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage institutional documents, files, and generated assets.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <span>
              <IconButton size="small" onClick={handleRefresh} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : <Refresh />}
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setEditDoc(null); setFormOpen(true); }}
            size="small"
          >
            New Document
          </Button>
        </Stack>
      </Stack>

      {/* ── KPI cards ─────────────────────────────────────────────────────────── */}
      <KPICards items={kpiCards} sx={{ mb: 3 }} />

      {/* ── Error ─────────────────────────────────────────────────────────────── */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Status tabs ───────────────────────────────────────────────────────── */}
      <Tabs
        value={statusTab}
        onChange={handleStatusTab}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {STATUS_TABS.map((t) => (
          <Tab key={t.value} value={t.value} label={t.label} sx={{ minHeight: 40, py: 0 }} />
        ))}
        {/* Offered only to operators the registry lets act on a deleted document — permanent
            deletion is the only thing this tab can do. */}
        {hardDelete.enabled && (
          <Tab
            value={DELETED_TAB}
            label="Deleted"
            sx={{ minHeight: 40, py: 0, color: 'error.main' }}
          />
        )}
      </Tabs>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <DocumentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        userRole={userRole}
        hideStatusFilter  // Status is controlled by the tabs above
      />

      {/* ── Document list ─────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>

        {isMobile ? (
          <Box sx={{ p: 1.5 }}>
            {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 3 }} />}
            {!loading && documents.length === 0 && (
              <DocumentEmptyState
                message={inTrash ? 'The trash is empty' : 'No documents found'}
                subtext={inTrash
                  ? 'Deleted documents appear here until they are permanently destroyed.'
                  : 'Create a new document or adjust your filters.'}
              />
            )}
            {!loading && documents.map(renderMobileCard)}
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Updated</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <DocumentEmptyState />
                  </TableCell>
                </TableRow>
              )}
              {!loading && documents.map((doc) => (
                <TableRow
                  key={doc._id}
                  hover
                  sx={{
                    // A soft-deleted document is not readable: every detail endpoint filters on
                    // `deletedAt: null`, so opening the drawer here would only 404.
                    cursor: inTrash ? 'default' : 'pointer',
                    opacity: inTrash ? 0.65 : 1,
                    bgcolor:
                      doc.status === 'LOCKED'    ? alpha(theme.palette.error.main, 0.04)   :
                      doc.status === 'PUBLISHED' ? alpha(theme.palette.success.main, 0.04) :
                      doc.status === 'ARCHIVED'  ? alpha(theme.palette.action.selected, 1) :
                      'inherit',
                  }}
                  onClick={() => { if (!inTrash) setDrawerDoc(doc); }}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 240 }}>
                          {doc.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {doc.ref}
                        </Typography>
                      </Box>
                      {doc.isOfficial && <OfficialBadge size="small" />}
                      <DocumentVersionBadge version={doc.currentVersion ?? 1} />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <DocumentTypeChip type={doc.type} />
                  </TableCell>
                  <TableCell>
                    <DocumentStatusChip status={doc.status} />
                  </TableCell>
                  <TableCell>
                    <DocumentCategoryChip category={doc.category} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                      {fDate(doc.updatedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0} justifyContent="flex-end">
                      {inTrash ? (
                        <HardDeleteAction
                          onHardDelete={
                            hardDelete.canDelete(true)
                              ? () => hardDelete.requestDelete(doc._id, doc.title)
                              : null
                          }
                        />
                      ) : (
                      <>
                      <Tooltip title="View details">
                        <span>
                          <IconButton size="small" onClick={() => setDrawerDoc(doc)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Download PDF">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => hookRef.downloadPdf(doc._id, doc.title)}
                          >
                          <PictureAsPdf fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      {doc.type === 'IMPORTED' && (
                        <Tooltip title="Download file">
                          <IconButton
                            size="small"
                            onClick={() => hookRef.downloadRaw(doc._id, doc.importedFile?.originalName)}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => { setEditDoc(doc); setFormOpen(true); }}
                          disabled={doc.status === 'LOCKED' && !isAdmin}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDoc(doc)}
                          disabled={doc.status === 'LOCKED' && !isAdmin}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* ── Pagination ──────────────────────────────────────────────────────── */}
        <TablePagination
          component="div"
          count={total}
          page={Math.max(0, (filters.page ?? 1) - 1)}
          rowsPerPage={filters.limit ?? 25}
          onPageChange={(_, p)   => setPage(p + 1)}
          onRowsPerPageChange={(e) => handleFilterChange('limit', +e.target.value)}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      {/* ── Create / Edit form dialog ──────────────────────────────────────────── */}
      <DocumentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDoc(null); }}
        onSuccess={handleFormSuccess}
        initial={editDoc}
        isEdit={!!editDoc}
        hookRef={hookRef}
        campusId={campusId ?? ''}
      />

      {/* ── Detail drawer ─────────────────────────────────────────────────────── */}
      <DocumentDetailDrawer
        open={!!drawerDoc}
        doc={drawerDoc}
        onClose={() => setDrawerDoc(null)}
        onEdit={(d)   => { setEditDoc(d); setFormOpen(true); }}
        onDelete={(d) => setDeleteDoc(d)}
        onRefresh={() => { fetch(); setDrawerDoc(null); }}
        hookRef={hookRef}
      />

      {/* ── Delete confirm ─────────────────────────────────────────────────────── */}
      <DeleteDialog
        open={!!deleteDoc}
        doc={deleteDoc}
        onConfirm={handleDelete}
        onClose={() => setDeleteDoc(null)}
        canHardDelete={hardDelete.enabled}
      />

      {/* ── Permanent deletion (impact preview → phrase + password + reason) ───── */}
      {hardDelete.enabled && <HardDeleteDialog {...hardDelete.dialogProps} />}

      {/* ── Snackbar ───────────────────────────────────────────────────────────── */}
      <Snackbar
        open={!!snack}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {snack && (
          <Alert severity={snack.severity} onClose={() => setSnack(null)} variant="filled">
            {snack.message}
          </Alert>
        )}
      </Snackbar>

    </Box>
  );
};

export default DocumentManager;