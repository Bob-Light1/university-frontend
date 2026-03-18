/**
 * @file DocumentTeacher.jsx
 * @description Document page for TEACHER role.
 *
 * Constraints enforced by backend (and mirrored here for UX):
 *   - Can only create COURSE_MATERIAL documents
 *   - Can view COURSE_MATERIAL linked to their courses (read-only for other types)
 *   - Cannot share, lock, or manage versions of restricted types
 *   - Cannot access STUDENT_TRANSCRIPT, TEACHER_PAYSLIP, etc.
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TablePagination,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  CardActions,
  Snackbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Add,
  Refresh,
  Visibility,
  PictureAsPdf,
  Download,
  Edit,
  Delete,
} from '@mui/icons-material';

import useDocument             from '../../../hooks/useDocument';
import DocumentFilters         from '../../../components/documents/DocumentFilters';
import DocumentForm            from '../../../components/documents/DocumentForm';
import DocumentDetailDrawer    from '../../../components/documents/DocumentDetailDrawer';
import {
  DocumentStatusChip,
  DocumentTypeChip,
  DocumentVersionBadge,
  DocumentEmptyState,
} from '../../../components/documents/DocumentShared';

// ─── Component ────────────────────────────────────────────────────────────────

const DocumentTeacher = () => {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const hookRef = useDocument('teacher');
  const {
    documents, total, loading, error,
    filters, fetch, handleFilterChange, handleReset, setPage,
    remove,
  } = hookRef;

  const [formOpen,  setFormOpen]  = useState(false);
  const [editDoc,   setEditDoc]   = useState(null);
  const [drawerDoc, setDrawerDoc] = useState(null);
  const [snack,     setSnack]     = useState(null);

  // ── Force type filter to COURSE_MATERIAL only ─────────────────────────────
  useEffect(() => {
    handleFilterChange('type', 'COURSE_MATERIAL');
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch, filters]);

  const handleFormSuccess = useCallback((doc) => {
    setFormOpen(false);
    setEditDoc(null);
    setSnack({ severity: 'success', message: `Document saved.` });
    fetch();
  }, [fetch]);

  const handleDelete = useCallback(async (doc) => {
    try {
      await remove(doc._id, '');
      setDrawerDoc(null);
      setSnack({ severity: 'success', message: 'Document deleted.' });
      fetch();
    } catch (err) {
      setSnack({ severity: 'error', message: err?.response?.data?.message ?? 'Delete failed.' });
    }
  }, [remove, fetch]);

  const renderCard = (doc) => (
    <Card key={doc._id} variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap>{doc.title}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {doc.ref}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>
          <DocumentStatusChip   status={doc.status} />
          <DocumentVersionBadge version={doc.currentVersion ?? 1} />
        </Stack>
      </CardContent>
      <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
        <Tooltip title="View details">
          <IconButton size="small" onClick={() => setDrawerDoc(doc)}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download PDF">
          <IconButton size="small" onClick={() => hookRef.downloadPdf(doc._id, doc.title)}>
            <PictureAsPdf fontSize="small" />
          </IconButton>
        </Tooltip>
        {doc.status === 'DRAFT' && (
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => { setEditDoc(doc); setFormOpen(true); }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>

      {/* Header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>My Course Materials</Typography>
          <Typography variant="body2" color="text.secondary">
            Create and manage documents for your courses.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          
          
            
          <Tooltip title="Refresh">
            <span>
              <IconButton size="small" onClick={() => fetch()} disabled={loading}>
                {loading ? <CircularProgress size={18} /> : <Refresh />}
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            size="small"
            onClick={() => { setEditDoc(null); setFormOpen(true); }}
          >
            New Material
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters — type is locked to COURSE_MATERIAL */}
      <DocumentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        userRole="TEACHER"
        hideTypeFilter
      />

      {/* List */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {isMobile ? (
          <Box sx={{ p: 1.5 }}>
            {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 3 }} />}
            {!loading && documents.length === 0 && (
              <DocumentEmptyState
                message="No course materials yet"
                subtext="Create your first document using the New Material button."
              />
            )}
            {!loading && documents.map(renderCard)}
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>Updated</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!loading && documents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <DocumentEmptyState
                      message="No course materials yet"
                      subtext="Create your first document using the New Material button."
                    />
                  </TableCell>
                </TableRow>
              )}
              {!loading && documents.map((doc) => (
                <TableRow key={doc._id} hover sx={{ cursor: 'pointer' }} onClick={() => setDrawerDoc(doc)}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{doc.title}</Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                      {doc.ref}
                    </Typography>
                  </TableCell>
                  <TableCell><DocumentStatusChip status={doc.status} /></TableCell>
                  <TableCell>
                    <Typography variant="caption">{doc.metadata?.semester ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Stack direction="row" spacing={0} justifyContent="flex-end">
                      <Tooltip title="View details">
                        <IconButton size="small" onClick={() => setDrawerDoc(doc)}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download PDF">
                        <IconButton size="small" onClick={() => hookRef.downloadPdf(doc._id, doc.title)}>
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
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
                      {doc.status === 'DRAFT' && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => { setEditDoc(doc); setFormOpen(true); }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <TablePagination
          component="div"
          count={total}
          page={Math.max(0, (filters.page ?? 1) - 1)}
          rowsPerPage={filters.limit ?? 25}
          onPageChange={(_, p)     => setPage(p + 1)}
          onRowsPerPageChange={(e) => handleFilterChange('limit', +e.target.value)}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </Paper>

      {/* Form */}
      <DocumentForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditDoc(null); }}
        onSuccess={handleFormSuccess}
        initial={editDoc}
        isEdit={!!editDoc}
        hookRef={hookRef}
        forceType="COURSE_MATERIAL"
      />

      {/* Detail drawer */}
      <DocumentDetailDrawer
        open={!!drawerDoc}
        doc={drawerDoc}
        onClose={() => setDrawerDoc(null)}
        onEdit={(d)   => { setEditDoc(d); setFormOpen(true); }}
        onDelete={handleDelete}
        onRefresh={() => { fetch(); setDrawerDoc(null); }}
        hookRef={hookRef}
      />

      {/* Snackbar */}
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

export default DocumentTeacher;