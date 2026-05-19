import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Stack,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import {
  Close,
  Download,
  TableChart,
  Description,
  CheckCircle,
} from '@mui/icons-material';
import api from '../../api/axiosInstance';

/**
 * EXPORT DIALOG - Reusable component
 * 
 * Export entities to CSV or Excel
 * 
 * @param {Boolean} open - Dialog open state
 * @param {Function} onClose - Close handler
 * @param {String} apiEndpoint - API endpoint (e.g., 'students')
 * @param {String} entityName - Entity name for display
 * @param {String} entityNamePlural - Plural entity name
 * @param {Array} selectedIds - IDs of selected entities (optional)
 * @param {Object} filters - Current filters applied
 */
const ExportDialog = ({
  open,
  onClose,
  apiEndpoint,
  entityName = 'Entity',
  entityNamePlural = 'Entities',
  selectedIds = [],
  filters = {},
  search = '',
}) => {
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setSuccess(false);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      // Add filters
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });

      // Include active search term so export matches what the user sees
      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      // Add selected IDs if any
      if (selectedIds.length > 0) {
        params.append('entityIds', selectedIds.join(','));
      }

      // Determine endpoint
      const endpoint = format === 'excel' 
        ? `/${apiEndpoint}/export/excel`
        : `/${apiEndpoint}/export/csv`;

      // Make request
      const response = await api.get(`${endpoint}?${params.toString()}`, {
        responseType: 'blob', // Important for file download
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename from Content-Disposition header or generate one
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${apiEndpoint}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(true);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Export error:', err);
      setError(err.response?.data?.message || 'Failed to export. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    if (!exporting) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      disableEnforceFocus={true}
      closeAfterTransition={false}
      aria-labelledby="export-csv-excel"
      fullWidth
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Download color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Export {entityNamePlural}
          </Typography>
        </Stack>
        <IconButton
          onClick={handleClose}
          disabled={exporting}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={3}>
          {/* Info chip */}
          <Box>
            <Chip
              icon={<CheckCircle />}
              label={
                selectedIds.length > 0
                  ? `Exporting ${selectedIds.length} selected ${entityName.toLowerCase()}(s)`
                  : search && search.trim()
                    ? `Exporting results for "${search.trim()}"${Object.values(filters).some(Boolean) ? ' + filters' : ''}`
                    : `Exporting all ${entityNamePlural.toLowerCase()} (with current filters)`
              }
              color="primary"
              variant="outlined"
              sx={{ borderRadius: 2 }}
            />
          </Box>

          <Divider />

          {/* Format selection */}
          <FormControl>
            <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
              Select Export Format
            </FormLabel>
            <RadioGroup
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <FormControlLabel
                value="csv"
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Description color="action" />
                    <Box>
                      <Typography fontWeight={500}>CSV (Comma Separated)</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Compatible with Excel, Google Sheets, and most tools
                      </Typography>
                    </Box>
                  </Stack>
                }
                sx={{
                  border: 1,
                  borderColor: format === 'csv' ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 1.5,
                  mb: 1,
                  bgcolor: format === 'csv' ? 'primary.lighter' : 'transparent',
                }}
              />
              <FormControlLabel
                value="excel"
                control={<Radio />}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TableChart color="action" />
                    <Box>
                      <Typography fontWeight={500}>Excel (.xlsx)</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Professional formatting with colors and filters
                      </Typography>
                    </Box>
                  </Stack>
                }
                sx={{
                  border: 1,
                  borderColor: format === 'excel' ? 'primary.main' : 'divider',
                  borderRadius: 2,
                  p: 1.5,
                  bgcolor: format === 'excel' ? 'primary.lighter' : 'transparent',
                }}
              />
            </RadioGroup>
          </FormControl>

          {/* Error message */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Success message */}
          {success && (
            <Alert severity="success" icon={<CheckCircle />}>
              Export successful! File download started.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          onClick={handleClose}
          disabled={exporting}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={exporting ? <CircularProgress size={20} /> : <Download />}
          onClick={handleExport}
          disabled={exporting || success}
          sx={{ borderRadius: 2 }}
        >
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;