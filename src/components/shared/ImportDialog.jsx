import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Divider,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Link,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
} from '@mui/material';
import {
  Close,
  Upload,
  CloudUpload,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  ExpandMore,
  ExpandLess,
  GetApp,
  ContentCopy,
  VpnKey,
} from '@mui/icons-material';
import api from '../../api/axiosInstance';

/**
 * IMPORT DIALOG - Reusable component
 * 
 * Import entities from CSV or Excel
 * 
 * Features:
 * - File upload (CSV, Excel)
 * - Drag & drop support
 * - Template download links
 * - Dry-run validation
 * - Error reporting
 * 
 * @param {Boolean} open - Dialog open state
 * @param {Function} onClose - Close handler
 * @param {String} apiEndpoint - API endpoint (e.g., 'students')
 * @param {String} entityNamePlural - Plural entity name (dialog title)
 * @param {String} campusId - Campus ID (required for import)
 * @param {Function} onSuccess - Success callback
 */
const ImportDialog = ({
  open,
  onClose,
  apiEndpoint,
  entityNamePlural = 'Entities',
  campusId,
  onSuccess,
}) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copied, setCopied] = useState('');
  // When an import yields activation codes we keep the dialog open so the admin
  // can copy/export them; the parent refresh + snackbar are deferred until close.
  const [pendingSuccessMsg, setPendingSuccessMsg] = useState(null);

  const fileInputRef = useRef(null);

  /** Copies a value to the clipboard and flashes a transient "copied" state. */
  const copyValue = (value, key) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  /**
   * Exports the activation links + offline codes as a CSV so the admin can
   * distribute them — indispensable for accounts created without an email.
   * Built client-side from the import response (the codes are returned once).
   */
  const handleDownloadActivations = () => {
    const activations = result?.activations || [];
    if (!activations.length) return;

    const header = ['row', 'name', 'identifier', 'email', 'code', 'activationUrl'];
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = activations.map((a) => header.map((h) => escape(a[h])).join(','));
    // Prepend a UTF-8 BOM so Excel opens the export with correct encoding.
    const csvContent = '\uFEFF' + `${header.join(',')}\n${lines.join('\n')}\n`;

    const url = window.URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${apiEndpoint}_activation_codes.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    const validExtensions = ['csv', 'xlsx', 'xls'];
    const extension = selectedFile.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      setError('Invalid file type. Please upload a CSV or Excel file.');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setError('File too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async (dryRun = false) => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    if (!campusId) {
      setError('Campus ID is required.');
      return;
    }

    const setState = dryRun ? setValidating : setImporting;
    setState(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('campusId', campusId);
      if (dryRun) {
        formData.append('dryRun', 'true');
      }

      const response = await api.post(`/${apiEndpoint}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        const data = response.data.data;
        setResult(data);

        if (!dryRun && data.failed === 0) {
          const hasActivations = Array.isArray(data.activations) && data.activations.length > 0;
          if (hasActivations) {
            // Keep the dialog open: the one-time activation codes must be copied
            // or exported before leaving. Defer the list refresh + snackbar.
            setPendingSuccessMsg(response.data.message);
          } else if (onSuccess) {
            onSuccess(response.data.message);
          }
        }
      } else {
        setError(response.data?.message || 'Import failed');
      }

    } catch (err) {
      console.error('Import error:', err);
      setError(
        err.response?.data?.message || 
        'Import failed. Please check your file format and try again.'
      );
    } finally {
      setState(false);
    }
  };

  const handleDownloadTemplate = async (format) => {
    try {
      const endpoint = format === 'excel'
        ? `/${apiEndpoint}/import/template/excel`
        : `/${apiEndpoint}/import/template/csv`;

      const response = await api.get(endpoint, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      link.setAttribute('download', `${apiEndpoint}_import_template.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Template download error:', err);
      setError('Failed to download template');
    }
  };

  const handleClose = () => {
    if (!importing && !validating) {
      const successMsg = pendingSuccessMsg;
      setFile(null);
      setError(null);
      setResult(null);
      setShowErrors(false);
      setCopied('');
      setPendingSuccessMsg(null);
      // A deferred success closes the dialog through the parent (refresh + snackbar);
      // otherwise just close locally.
      if (successMsg && onSuccess) {
        onSuccess(successMsg);
      } else {
        onClose();
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      disableEnforceFocus={true}
      closeAfterTransition={false}
      aria-labelledby="import-csv-excel"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Upload color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Import {entityNamePlural}
          </Typography>
        </Stack>
        <IconButton
          onClick={handleClose}
          disabled={importing || validating}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={3}>
          {/* Download Templates */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Download Template
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button
                size="small"
                startIcon={<GetApp />}
                onClick={() => handleDownloadTemplate('csv')}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                CSV Template
              </Button>
              <Button
                size="small"
                startIcon={<GetApp />}
                onClick={() => handleDownloadTemplate('excel')}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Excel Template
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Download a template to see the required format
            </Typography>
          </Box>

          <Divider />

          {/* File Upload Area */}
          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Upload File
            </Typography>
            
            <Paper
              variant="outlined"
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              sx={{
                p: 4,
                textAlign: 'center',
                bgcolor: dragActive ? 'action.hover' : 'background.paper',
                borderColor: dragActive ? 'primary.main' : 'divider',
                borderStyle: 'dashed',
                borderWidth: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                style={{ display: 'none' }}
              />

              <CloudUpload sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              
              {file ? (
                <Box>
                  <Typography fontWeight={600} color="primary">
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(file.size / 1024).toFixed(2)} KB
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Click or drag to replace
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <Typography fontWeight={600} gutterBottom>
                    Click to upload or drag and drop
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    CSV or Excel files (max 10MB)
                  </Typography>
                </Box>
              )}
            </Paper>
          </Box>

          {/* Error message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Import Result */}
          {result && (
            <Alert
              severity={result.failed === 0 ? 'success' : 'warning'}
              icon={result.failed === 0 ? <CheckCircle /> : <Warning />}
            >
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>
                  {validating ? 'Validation' : 'Import'} completed
                </Typography>
                <Box>
                  <Chip
                    label={`✓ ${result.imported} successful`}
                    size="small"
                    color="success"
                    sx={{ mr: 1 }}
                  />
                  {result.failed > 0 && (
                    <Chip
                      label={`✗ ${result.failed} failed`}
                      size="small"
                      color="error"
                    />
                  )}
                </Box>

                {/* Show errors if any */}
                {result.errors && result.errors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      onClick={() => setShowErrors(!showErrors)}
                      endIcon={showErrors ? <ExpandLess /> : <ExpandMore />}
                      sx={{ textTransform: 'none' }}
                    >
                      {showErrors ? 'Hide' : 'Show'} Error Details ({result.errors.length})
                    </Button>
                    
                    <Collapse in={showErrors}>
                      <List dense sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
                        {result.errors.slice(0, 10).map((err, idx) => (
                          <ListItem key={idx} sx={{ px: 0 }}>
                            <ListItemText
                              primary={`Row ${err.row}: ${err.error}`}
                              secondary={err.data?.email || err.data?.firstName}
                              primaryTypographyProps={{ variant: 'caption', color: 'error' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                        {result.errors.length > 10 && (
                          <ListItem sx={{ px: 0 }}>
                            <Typography variant="caption" color="text.secondary">
                              ... and {result.errors.length - 10} more errors
                            </Typography>
                          </ListItem>
                        )}
                      </List>
                    </Collapse>
                  </Box>
                )}
              </Stack>
            </Alert>
          )}

          {/* Activation codes — onboarding by token (no default passwords). */}
          {result?.activations?.length > 0 && (
            <Box>
              <Alert
                severity="warning"
                icon={<VpnKey />}
                action={
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<GetApp />}
                    onClick={handleDownloadActivations}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Download CSV
                  </Button>
                }
              >
                <Typography variant="body2" fontWeight={600}>
                  {result.activations.length} activation {result.activations.length > 1 ? 'codes' : 'code'} — copy or export now
                </Typography>
                <Typography variant="caption">
                  These one-time codes are shown only here. Accounts without an email
                  can only be activated with their identifier + code.
                </Typography>
              </Alert>

              <TableContainer component={Paper} variant="outlined" sx={{ mt: 1.5, maxHeight: 280 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Identifier</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell align="center">Link</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.activations.map((act) => (
                      <TableRow
                        key={act.row}
                        sx={!act.email ? { bgcolor: 'rgba(237, 108, 2, 0.08)' } : undefined}
                      >
                        <TableCell>{act.row}</TableCell>
                        <TableCell>{act.name || '—'}</TableCell>
                        <TableCell>{act.identifier || '—'}</TableCell>
                        <TableCell>
                          {act.email || (
                            <Chip label="no email" size="small" color="warning" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                              {act.code}
                            </Typography>
                            <Tooltip title={copied === `code-${act.row}` ? 'Copied!' : 'Copy code'}>
                              <IconButton size="small" onClick={() => copyValue(act.code, `code-${act.row}`)}>
                                {copied === `code-${act.row}`
                                  ? <CheckCircle fontSize="inherit" color="success" />
                                  : <ContentCopy fontSize="inherit" />}
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={copied === `link-${act.row}` ? 'Copied!' : 'Copy activation link'}>
                            <IconButton size="small" onClick={() => copyValue(act.activationUrl, `link-${act.row}`)}>
                              {copied === `link-${act.row}`
                                ? <CheckCircle fontSize="inherit" color="success" />
                                : <ContentCopy fontSize="inherit" />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        {pendingSuccessMsg ? (
          // Import succeeded and activation codes are displayed: the only action
          // left is to acknowledge (which refreshes the list and closes).
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={handleClose}
            sx={{ borderRadius: 2 }}
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              onClick={handleClose}
              disabled={importing || validating}
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>

            {file && !result && (
              <Button
                variant="outlined"
                startIcon={validating ? <CircularProgress size={20} /> : <CheckCircle />}
                onClick={() => handleImport(true)}
                disabled={importing || validating}
                sx={{ borderRadius: 2 }}
              >
                {validating ? 'Validating...' : 'Validate Only'}
              </Button>
            )}

            <Button
              variant="contained"
              startIcon={importing ? <CircularProgress size={20} /> : <Upload />}
              onClick={() => handleImport(false)}
              disabled={!file || importing || validating}
              sx={{ borderRadius: 2 }}
            >
              {importing ? 'Importing...' : 'Import'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImportDialog;