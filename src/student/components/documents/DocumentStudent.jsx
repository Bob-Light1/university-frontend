/**
 * @file DocumentStudent.jsx
 * @description Document page for STUDENT role.
 *
 * Read-only access. Students can:
 *   - View their own documents (PUBLISHED/LOCKED only — server enforced)
 *   - Download PDF
 *   - Download raw file (IMPORTED type)
 *   - View document details
 *
 * Students CANNOT create, edit, delete, share, or manage workflows.
 */

import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Typography,
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
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  useTheme,
  Chip,
  Button,
} from '@mui/material';
import {
  Refresh,
  Visibility,
  PictureAsPdf,
  Download,
} from '@mui/icons-material';

import { AuthContext } from '../../../context/AuthContext';
import useDocument     from '../../../hooks/useDocument';
import DocumentFilters from '../../../components/documents/DocumentFilters';
import DocumentDetailDrawer from '../../../components/documents/DocumentDetailDrawer';
import {
  DocumentStatusChip,
  DocumentTypeChip,
  OfficialBadge,
  DocumentEmptyState,
  getMimeLabel,
} from '../../../components/documents/DocumentShared';

// ─── Component ────────────────────────────────────────────────────────────────

const DocumentStudent = () => {
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useContext(AuthContext);

  const hookRef = useDocument('student');
  const {
    documents, total, loading, error,
    filters, fetch, handleFilterChange, handleReset, setPage,
  } = hookRef;

  const [drawerDoc, setDrawerDoc] = useState(null);

  // ── Pre-filter by current student ID ──────────────────────────────────────
  useEffect(() => {
    if (user?._id) handleFilterChange('studentId', user._id);
  }, [user?._id]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetch(); }, [fetch, filters]);

  const renderCard = (doc) => (
    <Card key={doc._id} variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap>{doc.title}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
          {doc.ref}
        </Typography>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>
          <DocumentTypeChip type={doc.type} />
          {doc.isOfficial && <OfficialBadge size="small" />}
        </Stack>
        {doc.metadata?.academicYear && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {doc.metadata.academicYear} · {doc.metadata.semester ?? ''}
          </Typography>
        )}
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
          <Typography variant="h5" fontWeight={700}>My Documents</Typography>
          <Typography variant="body2" color="text.secondary">
            Your official records, transcripts, and course materials.
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton size="small" onClick={() => fetch()} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : <Refresh />}
          </IconButton>
        </Tooltip>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters — read-only student does not need type or status selector */}
      <DocumentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        userRole="STUDENT"
        hideStatusFilter
      />

      {/* List */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {isMobile ? (
          <Box sx={{ p: 1.5 }}>
            {loading && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 3 }} />}
            {!loading && documents.length === 0 && (
              <DocumentEmptyState
                message="No documents available"
                subtext="Your official documents will appear here once published."
              />
            )}
            {!loading && documents.map(renderCard)}
          </Box>
        ) : (
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Year</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Issued</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Download</TableCell>
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
                      message="No documents available"
                      subtext="Your official documents will appear here once published."
                    />
                  </TableCell>
                </TableRow>
              )}
              {!loading && documents.map((doc) => (
                <TableRow
                  key={doc._id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setDrawerDoc(doc)}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{doc.title}</Typography>
                        <Typography
                          variant="caption"
                          color="text.disabled"
                          sx={{ fontFamily: 'monospace' }}
                        >
                          {doc.ref}
                        </Typography>
                      </Box>
                      {doc.isOfficial && <OfficialBadge size="small" />}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <DocumentTypeChip type={doc.type} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">
                      {doc.metadata?.academicYear ?? '—'}
                      {doc.metadata?.semester ? ` · ${doc.metadata.semester}` : ''}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {doc.publishedAt ? new Date(doc.publishedAt).toLocaleDateString() : '—'}
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
                        <IconButton
                          size="small"
                          onClick={() => hookRef.downloadPdf(doc._id, doc.title)}
                        >
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {doc.type === 'IMPORTED' && (
                        <Tooltip title={`Download ${getMimeLabel(doc.importedFile?.mimeType)}`}>
                          <IconButton
                            size="small"
                            onClick={() => hookRef.downloadRaw(doc._id, doc.importedFile?.originalName)}
                          >
                            <Download fontSize="small" />
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

      {/* Read-only detail drawer */}
      <DocumentDetailDrawer
        open={!!drawerDoc}
        doc={drawerDoc}
        onClose={() => setDrawerDoc(null)}
        onEdit={() => {}}     // No-op for students
        onDelete={() => {}}   // No-op for students
        onRefresh={() => {}}
        hookRef={hookRef}
      />

    </Box>
  );
};

export default DocumentStudent;