import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Drawer,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Paper,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Menu,
  MenuItem,
  TextField,
  Fab,
  Skeleton,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Add,
  Close,
  SwapHoriz,
  Email,
  Block,
  Download,
  Edit,
  Visibility,
  Delete,
  Inbox,
  MoreVert,
  FileDownload,
  FileUpload,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';

import KPICards from './KpiCard';
import FilterBar from './FilterBar';
import ExportDialog from './Exportdialog';
import ImportDialog from './Importdialog';
import { BulkClassModal, BulkEmailModal } from './BulkModals';
import useEntityManager from '../../hooks/useEntityManager';
import useBulkActions from '../../hooks/useBulkActions';
import useRelatedData from '../../hooks/useRelatedData';

/**
 * GENERIC ENTITY MANAGEMENT PAGE
 *
 * @param {string}   entityName              - Singular entity label (e.g. "Teacher")
 * @param {string}   entityNamePlural        - Plural entity label (e.g. "Teachers")
 * @param {string}   apiEndpoint             - Base API path (e.g. "teacher")
 * @param {Array}    tableColumns            - Column definitions for the table header
 * @param {Function} filterConfig            - Function(relatedData) => filter array, or static array
 * @param {Function} getKPIMetrics           - Function(kpis, theme) => metrics array
 * @param {Component} FormComponent          - Create/Edit form component
 * @param {Component} DetailComponent        - Detail drawer component
 * @param {Function} renderTableRow          - Function(entity, helpers) => <TableRow />
 * @param {Array}    bulkActions             - Enabled bulk action keys
 * @param {string}   addButtonText           - Override "Add {entityName}" button label
 * @param {ReactNode} addButtonIcon          - Override add button icon
 * @param {string}   searchPlaceholder       - Override search input placeholder
 * @param {boolean}  showArchiveToggle       - Show "Show Archived" toggle
 * @param {boolean}  enableImport            - Show import feature
 * @param {boolean}  enableExport            - Show export feature
 * @param {Object}   relatedDataEndpoints    - Map of key → API path for related data
 *                                            e.g. { departments: '/department', subjects: '/subject' }
 *                                            Each endpoint receives campusId as query param.
 *                                            Result is passed to filterConfig(relatedData).
 */
const GenericEntityPage = ({
  entityName,
  entityNamePlural,
  apiEndpoint,
  tableColumns,
  filterConfig,
  getKPIMetrics,
  FormComponent,
  DetailComponent,
  renderTableRow,
  bulkActions = ['changeClass', 'sendEmail', 'archive', 'export'],
  addButtonText,
  addButtonIcon,
  searchPlaceholder,
  showArchiveToggle = false,
  enableImport = true,
  enableExport = true,
  relatedDataEndpoints = {},
  extraHeaderActions = null,    // Optional ReactNode rendered next to Add button
}) => {
  const { campusId } = useParams();
  const theme = useTheme();

  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.down('md'));
  const isMobile = isSm;

  // ============================================================
  // DATA HOOKS
  // ============================================================

  const {
    entities,
    total,
    loading,
    kpis,
    kpiLoading,
    fetchEntities,
    fetchKPIs,
    deleteEntity,
    filters,
    setFilters,
    search,
    setSearch,
    includeArchived,
    setIncludeArchived,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  } = useEntityManager({ apiEndpoint, campusId, initialRowsPerPage: 10 });

  const {
    selectedIds,
    selectedCount,
    hasSelection,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    isSelected,
    bulkChangeClass,
    bulkSendEmail,
    bulkArchive,
    processing,
  } = useBulkActions({
    apiEndpoint,
    entities,
    onSuccess: () => { fetchEntities(); fetchKPIs(); },
    onError: (error) => showSnackbar(error, 'error'),
  });

  // ---- Related data (departments, subjects, classes, etc.) ----
  // Always include 'classes' unless the config already defines it,
  // since BulkClassModal needs it for the changeClass action.
  const mergedEndpoints = useMemo(() => ({
    classes: '/class',         // default – always available for bulk changeClass
    ...relatedDataEndpoints,   // config may override or add more
  }), [relatedDataEndpoints]);

  const { data: relatedData, loading: relatedDataLoading } = useRelatedData(mergedEndpoints, campusId);

  // ============================================================
  // LOCAL UI STATE
  // ============================================================

  const [isFormModalOpen,      setIsFormModalOpen]      = useState(false);
  const [isDrawerOpen,         setIsDrawerOpen]         = useState(false);
  const [isBulkClassModalOpen, setIsBulkClassModalOpen] = useState(false);
  const [isBulkEmailModalOpen, setIsBulkEmailModalOpen] = useState(false);
  const [isExportDialogOpen,   setIsExportDialogOpen]   = useState(false);
  const [isImportDialogOpen,   setIsImportDialogOpen]   = useState(false);
  const [selectedEntity,       setSelectedEntity]       = useState(null);
  const [viewEntity,           setViewEntity]           = useState(null);
  const [bulkMenuAnchor,       setBulkMenuAnchor]       = useState(null);
  const [moreMenuAnchor,       setMoreMenuAnchor]       = useState(null);
  const [bulkClassId,          setBulkClassId]          = useState('');
  const [bulkEmail,            setBulkEmail]            = useState({ subject: '', message: '' });
  const [snackbar,             setSnackbar]             = useState({ open: false, message: '', severity: 'success' });

  // ============================================================
  // COMPUTED
  // ============================================================

  // filterConfig can be:
  //   - a function(relatedData) → filter array   (new style – full relatedData object)
  //   - a function(classes)     → filter array   (legacy style – only classes)
  //   - a static array
  const computedFilters = useMemo(() => {
     if (relatedDataLoading) return [];

    if (typeof filterConfig === 'function') {
      // Detect legacy signature: function expects a plain array (classes only)
      // We call it with the full relatedData object; configs that only use
      // getFilterConfig(classes) will still work because relatedData.classes is an array.
      return filterConfig(relatedData);
    }
    if (Array.isArray(filterConfig)) return filterConfig;
    return [];
  }, [filterConfig, relatedData, relatedDataLoading]);

  const metrics = useMemo(
    () => getKPIMetrics(kpis, theme),
    [kpis, theme, getKPIMetrics]
  );

  // ============================================================
  // HANDLERS
  // ============================================================

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  }, [setFilters, setPage]);

  const handleResetFilters = useCallback(() => {
    setFilters({});
    setSearch('');
    setPage(0);
  }, [setFilters, setSearch, setPage]);

  const handleOpenFormModal  = useCallback((entity = null) => { 
      setSelectedEntity(entity); 
      setIsFormModalOpen(true); 
     }, []);

  const handleOpenDrawer = useCallback((entity) => { 
      setViewEntity(entity);
      setIsDrawerOpen(true); 
    }, []);

  const handleArchive = useCallback(async (id) => {
    if (!window.confirm(`Are you sure you want to archive this ${entityName}?`)) return;
    const result = await deleteEntity(id);
    showSnackbar(
      result.success
        ? `${entityName} archived successfully`
        : result.error || `Failed to archive ${entityName}`,
      result.success ? 'success' : 'error'
    );
  }, [entityName, deleteEntity, showSnackbar]);

  const handleFormSuccess = useCallback((message) => {
    setIsFormModalOpen(false);
    fetchEntities();
    fetchKPIs();
    showSnackbar(message);
  }, [fetchEntities, fetchKPIs, showSnackbar]);

  const handleImportSuccess = useCallback((message) => {
    setIsImportDialogOpen(false);
    fetchEntities();
    fetchKPIs();
    showSnackbar(message, 'success');
  }, [fetchEntities, fetchKPIs, showSnackbar]);

  // ---- Bulk ----
  const handleBulkChangeClassSubmit = useCallback(async () => {
    if (!bulkClassId) { showSnackbar('Please select a class', 'error'); return; }
    const result = await bulkChangeClass(bulkClassId);
    if (result.success) { setIsBulkClassModalOpen(false); setBulkClassId(''); showSnackbar(result.message); }
    else showSnackbar(result.error, 'error');
  }, [bulkClassId, bulkChangeClass, showSnackbar]);

  const handleBulkSendEmailSubmit = useCallback(async () => {
    if (!bulkEmail.subject || !bulkEmail.message) { 
      showSnackbar('Please fill in subject and message', 'error'); 
      return; 
    }
    const result = await bulkSendEmail(bulkEmail.subject, bulkEmail.message);
    if (result.success) { 
      setIsBulkEmailModalOpen(false); 
      setBulkEmail({ subject: '', message: '' }); 
      showSnackbar(result.message); 
    }
    else showSnackbar(result.error, 'error');
  }, [bulkEmail, bulkSendEmail, showSnackbar]);

  const handleBulkArchiveSubmit = useCallback(async () => {
    if (!window.confirm(`Archive ${selectedCount} ${entityName}(s)?`)) return;
    const result = await bulkArchive();
    showSnackbar(result.success ? result.message : result.error, result.success ? 'success' : 'error');
  }, [selectedCount, entityName, bulkArchive, showSnackbar]);

  const handleBulkAction = useCallback((action) => {
    setBulkMenuAnchor(null);
    const map = {
      changeClass: () => setIsBulkClassModalOpen(true),
      sendEmail:   () => setIsBulkEmailModalOpen(true),
      archive:     () => handleBulkArchiveSubmit(),
      export:      () => setIsExportDialogOpen(true),
    };
    map[action]?.();
  }, [handleBulkArchiveSubmit]);

  // ============================================================
  // SMALL INTERNAL COMPONENTS
  // ============================================================

  const ArchiveToggle = () => (
    <FormControlLabel
      control={
        <Switch
          checked={includeArchived}
          onChange={(e) => { setIncludeArchived(e.target.checked); setPage(0); }}
          color="secondary"
        />
      }
      label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Show Archived</Typography>}
    />
  );

  const EmptyState = () => (
    <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
      <Inbox sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No {entityNamePlural.toLowerCase()} found
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Try adjusting your filters or add a new {entityName.toLowerCase()}.
      </Typography>
      <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenFormModal()} sx={{ borderRadius: 2 }}>
        Add {entityName}
      </Button>
    </Box>
  );

  const MobileCard = ({ entity }) => (
    <Card elevation={2} sx={{ borderRadius: 2, transition: 'all 0.2s', '&:hover': { boxShadow: theme.shadows[4] } }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Checkbox checked={isSelected(entity._id)} onChange={() => handleSelectOne(entity._id)} sx={{ mt: -1 }} />
          <Stack spacing={0.5} flex={1}>
            <Typography variant="subtitle2" fontWeight={600}>
              {entity.firstName} {entity.lastName || entity.name || ''}
            </Typography>
            {entity.email && (
              <Typography variant="caption" color="text.secondary">{entity.email}</Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'flex-end', px: 2 }}>
        <IconButton 
          size="small" 
          onClick={() => handleOpenDrawer(entity)}    
          sx={{ color: 'primary.main' }}
        >
          <Visibility fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleOpenFormModal(entity)} 
          sx={{ color: 'info.main'    }}
        >
          <Edit fontSize="small" />
        </IconButton>
        <IconButton 
          size="small" 
          onClick={() => handleArchive(entity._id)}   
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" />
        </IconButton>
      </CardActions>
    </Card>
  );

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <Box component="main" sx={{ py: { xs: 2, sm: 4, md: 6 } }}>
      <Container maxWidth="xl">
        <Stack spacing={{ xs: 3, md: 4 }}>

          {/* ── Header ── */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <Box>
              <Typography variant={isXs ? 'h5' : 'h4'} fontWeight={700} gutterBottom>
                {entityNamePlural} Management
              </Typography>
              <Typography color="text.secondary" variant="body2">
                Comprehensive {entityNamePlural.toLowerCase()} oversight and administration
              </Typography>
            </Box>

            {/* Archive toggle – mobile */}
            {isXs && showArchiveToggle && (
              <Box><ArchiveToggle /></Box>
            )}

            {/* Actions – desktop */}
            {!isXs && (
              <Stack direction="row" spacing={1} alignItems="center">
                {showArchiveToggle && <ArchiveToggle />}

                
                {(enableImport || enableExport) && (
                  <IconButton
                    onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                    sx={{ borderRadius: 2, border: 1, borderColor: 'divider' }}
                  >
                    <MoreVert />
                  </IconButton>
                )}

                {/* Extra actions slot (e.g. "Manage Departments") */}
                {extraHeaderActions}


                <Button
                  startIcon={addButtonIcon || <Add />}
                  variant="contained"
                  onClick={() => handleOpenFormModal()}
                  sx={{ 
                    px: 3, 
                    py: 1.5, 
                    borderRadius: 2, 
                    textTransform: 'none', 
                    fontWeight: 600, 
                    boxShadow: theme.shadows[4], 
                    whiteSpace: 'nowrap' 
                  }}
                >
                  {addButtonText || `Add ${entityName}`}
                </Button>
              </Stack>
            )}
          </Stack>

          {/* ── KPIs ── */}
          <KPICards metrics={metrics} loading={kpiLoading} />

          {/* ── Filters ── */}
          <FilterBar
            searchValue={search}
            onSearchChange={setSearch}
            filters={computedFilters}
            filterValues={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
            searchPlaceholder={searchPlaceholder || `Search ${entityNamePlural.toLowerCase()}...`}
          />

          {/* ── Bulk action bar ── */}
          {hasSelection && (
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2, bgcolor: 'primary.lighter' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="body2" fontWeight={600} noWrap>
                  {selectedCount} selected
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={!isXs && <SwapHoriz />}
                    onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                    disabled={processing}
                  >
                    {isXs ? 'Actions' : 'Bulk Actions'}
                  </Button>
                  <IconButton size="small" onClick={clearSelection}>
                    <Close fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
            </Paper>
          )}

          {/* ── Content ── */}
          {loading ? (
            <Paper elevation={3} sx={{ borderRadius: 3, p: 2 }}>
              <Stack spacing={2}>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 2 }} />
                ))}
              </Stack>
            </Paper>
          ) : entities.length === 0 ? (
            <Paper elevation={3} sx={{ borderRadius: 3 }}><EmptyState /></Paper>
          ) : isMobile ? (
            <Stack spacing={2}>
              {entities.map((entity) => <MobileCard key={entity._id} entity={entity} />)}
            </Stack>
          ) : (
            <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <TableContainer sx={{
                overflowX: 'auto',
                '&::-webkit-scrollbar': { height: 8 },
                '&::-webkit-scrollbar-track': { bgcolor: 'grey.100' },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.400', borderRadius: 4, '&:hover': { bgcolor: 'grey.600' } },
              }}>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ bgcolor: 'background.neutral' }}>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.length > 0 && selectedIds.length === entities.length}
                          indeterminate={selectedIds.length > 0 && selectedIds.length < entities.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </TableCell>
                      {tableColumns.map((col) => (
                        <TableCell key={col.key} sx={{ fontWeight: 700 }} align={col.align || 'left'}>
                          {col.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entities.map((entity) =>
                      renderTableRow(entity, {
                        selected:  isSelected(entity._id),
                        onSelect:  () => handleSelectOne(entity._id),
                        onView:    () => handleOpenDrawer(entity),
                        onEdit:    () => handleOpenFormModal(entity),
                        onArchive: () => handleArchive(entity._id),
                        theme,
                        isMobile,
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Divider />
              <TablePagination
                component="div"
                count={total}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 25, 50]}
                sx={{ '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: { xs: '0.75rem', sm: '0.875rem' } } }}
              />
            </Paper>
          )}
        </Stack>
      </Container>

      {/* ── FAB (mobile) ── */}
      {isXs && (
        <Fab
          color="primary"
          onClick={() => handleOpenFormModal()}
          sx={{ position: 'fixed', bottom: { xs: 80, sm: 16 }, right: 16, zIndex: 1000 }}
        >
          <Add />
        </Fab>
      )}

      {/* ── Import / Export menu ── */}
      <Menu anchorEl={moreMenuAnchor} open={Boolean(moreMenuAnchor)} onClose={() => setMoreMenuAnchor(null)}>
        {enableImport && (
          <MenuItem onClick={() => { setIsImportDialogOpen(true); setMoreMenuAnchor(null); }}>
            <FileUpload sx={{ mr: 1 }} /> Import
          </MenuItem>
        )}
        {enableExport && (
          <MenuItem onClick={() => { setIsExportDialogOpen(true); setMoreMenuAnchor(null); }}>
            <FileDownload sx={{ mr: 1 }} /> Export
          </MenuItem>
        )}
      </Menu>

      {/* ── Form modal ── */}
      <Dialog
        open={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isXs}
        disableEnforceFocus
        closeAfterTransition={false}
        aria-labelledby="form-modal"
      >
        <DialogTitle id="form-modal" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {selectedEntity ? `Edit ${entityName}` : `Add New ${entityName}`}
          <IconButton onClick={() => setIsFormModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {FormComponent && (
            <FormComponent
              initialData={selectedEntity}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Detail drawer ── */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 400, md: 450 }, maxWidth: '90vw' } }}
      >
        {viewEntity && DetailComponent && (
          <DetailComponent
            entity={viewEntity}
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onEdit={() => { setIsDrawerOpen(false); handleOpenFormModal(viewEntity); }}
            onArchive={() => { setIsDrawerOpen(false); handleArchive(viewEntity._id); }}
          />
        )}
      </Drawer>

      {/* ── Export / Import dialogs ── */}
      {enableExport && (
        <ExportDialog
          open={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
          apiEndpoint={apiEndpoint}
          entityName={entityName}
          entityNamePlural={entityNamePlural}
          selectedIds={selectedIds}
          filters={filters}
        />
      )}
      {enableImport && (
        <ImportDialog
          open={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          apiEndpoint={apiEndpoint}
          entityName={entityName}
          entityNamePlural={entityNamePlural}
          campusId={campusId}
          onSuccess={handleImportSuccess}
        />
      )}

      {/* ── Bulk modals (extracted) ── */}
      <BulkClassModal
        open={isBulkClassModalOpen}
        onClose={() => setIsBulkClassModalOpen(false)}
        entityName={entityName}
        selectedCount={selectedCount}
        classes={relatedData.classes || []}
        bulkClassId={bulkClassId}
        setBulkClassId={setBulkClassId}
        onSubmit={handleBulkChangeClassSubmit}
        processing={processing}
        isXs={isXs}
      />
      <BulkEmailModal
        open={isBulkEmailModalOpen}
        onClose={() => setIsBulkEmailModalOpen(false)}
        entityName={entityName}
        selectedCount={selectedCount}
        bulkEmail={bulkEmail}
        setBulkEmail={setBulkEmail}
        onSubmit={handleBulkSendEmailSubmit}
        processing={processing}
        isXs={isXs}
      />

      {/* ── Bulk actions menu ── */}
      <Menu anchorEl={bulkMenuAnchor} open={Boolean(bulkMenuAnchor)} onClose={() => setBulkMenuAnchor(null)}>
        {bulkActions.includes('changeClass') && (
          <MenuItem onClick={() => handleBulkAction('changeClass')}><SwapHoriz sx={{ mr: 1 }} /> Change Class</MenuItem>
        )}
        {bulkActions.includes('sendEmail') && (
          <MenuItem onClick={() => handleBulkAction('sendEmail')}><Email sx={{ mr: 1 }} /> Send Email</MenuItem>
        )}
        {bulkActions.includes('archive') && (
          <MenuItem onClick={() => handleBulkAction('archive')}><Block sx={{ mr: 1 }} /> Archive</MenuItem>
        )}
        {bulkActions.includes('export') && (
          <MenuItem onClick={() => handleBulkAction('export')}><Download sx={{ mr: 1 }} /> Export</MenuItem>
        )}
      </Menu>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: isXs ? 'center' : 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GenericEntityPage;