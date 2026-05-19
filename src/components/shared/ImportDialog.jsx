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
 * @param {String} entityName - Entity name for display
 * @param {String} entityNamePlural - Plural entity name
 * @param {String} campusId - Campus ID (required for import)
 * @param {Function} onSuccess - Success callback
 */
const ImportDialog = ({
  open,
  onClose,
  apiEndpoint,
  entityName = 'Entity',
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
  
  const fileInputRef = useRef(null);

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
        setResult(response.data.data);
        
        // If not dry-run and successful, call onSuccess and close
        if (!dryRun && response.data.data.failed === 0) {
          if (onSuccess) {
            onSuccess(response.data.message);
          }
          setTimeout(() => {
            handleClose();
          }, 2000);
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
      setFile(null);
      setError(null);
      setResult(null);
      setShowErrors(false);
      onClose();
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
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
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
      </DialogActions>
    </Dialog>
  );
};

export default ImportDialog;