/**
 * @file DocumentForm.jsx
 * @description Create / edit document form.
 *
 * Supports two modes:
 *   - Rich content document (JSON body — not yet implemented in UI, Phase 2)
 *   - Imported file upload (multipart/form-data, type = IMPORTED)
 *
 * Role constraints enforced client-side (server-side is the source of truth):
 *   - TEACHER: can only create COURSE_MATERIAL
 *   - CAMPUS_MANAGER and above: all non-restricted types
 *   - ADMIN / DIRECTOR: all types including restricted
 */

import { useCallback, useContext }   from 'react';
import { useFormik }                 from 'formik';
import * as Yup                      from 'yup';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
  Chip,
} from '@mui/material';
import { CloudUpload, Close } from '@mui/icons-material';

import { AuthContext } from '../../context/AuthContext';
import { DOCUMENT_ENUMS, getAccessibleTypes } from './DocumentShared';

// ─── Validation schema ────────────────────────────────────────────────────────

const buildSchema = (isImport) =>
  Yup.object({
    title:       Yup.string().trim().min(3, 'Min 3 characters').max(200).required('Title is required'),
    description: Yup.string().max(500),
    type:        Yup.string().required('Document type is required'),
    category:    Yup.string().required('Category is required'),
    tags:        Yup.string(), // Comma-separated string — split on submit
    isOfficial:  Yup.boolean(),
    // Metadata fields
    academicYear: Yup.string().max(20),
    semester:     Yup.string().oneOf(['S1', 'S2', 'Annual', '']),
    // File import
    file: isImport
      ? Yup.mixed().required('A file is required for import')
      : Yup.mixed().nullable(),
  });

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   open:      boolean,
 *   onClose:   () => void,
 *   onSuccess: (doc: Object) => void,
 *   initial?:  Object,          // Pre-filled values for edit mode
 *   isEdit?:   boolean,
 *   hookRef:   ReturnType<typeof useDocument>,
 *   forceType?: string,          // Lock the type field (e.g. from a parent context)
 * }} props
 */
const DocumentForm = ({
  open,
  onClose,
  onSuccess,
  initial   = null,
  isEdit    = false,
  hookRef,
  forceType = null,
}) => {
  const { getUserRole } = useContext(AuthContext);
  const userRole        = getUserRole();

  const isImportMode = !isEdit && !forceType;
  const accessibleTypes = getAccessibleTypes(userRole);

  // ── Formik ───────────────────────────────────────────────────────────────────

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      title:        initial?.title        ?? '',
      description:  initial?.description  ?? '',
      type:         forceType ?? initial?.type ?? (userRole === 'TEACHER' ? 'COURSE_MATERIAL' : ''),
      category:     initial?.category     ?? '',
      tags:         (initial?.tags ?? []).join(', '),
      isOfficial:   initial?.isOfficial   ?? false,
      academicYear: initial?.metadata?.academicYear ?? '',
      semester:     initial?.metadata?.semester     ?? '',
      importMode:   false,  // Toggle: rich content vs file import
      file:         null,
    },
    validationSchema: buildSchema(false), // dynamic via submitForm override
    onSubmit: async (values, helpers) => {
      try {
        const tagsArray = values.tags
          ? values.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
          : [];

        if (values.file) {
          // File import path — multipart/form-data
          const fd = new FormData();
          fd.append('file',        values.file);
          fd.append('title',       values.title);
          fd.append('description', values.description);
          fd.append('type',        'IMPORTED');
          fd.append('category',    values.category);
          if (tagsArray.length) fd.append('tags', JSON.stringify(tagsArray));
          if (values.academicYear) fd.append('metadata[academicYear]', values.academicYear);
          if (values.semester)     fd.append('metadata[semester]',     values.semester);

          const result = await hookRef.importFile(fd);
          onSuccess(result?.document ?? result);
        } else {
          // Rich content / metadata-only path — JSON
          const payload = {
            title:       values.title,
            description: values.description,
            type:        values.type,
            category:    values.category,
            tags:        tagsArray,
            isOfficial:  values.isOfficial,
            metadata: {
              academicYear: values.academicYear || null,
              semester:     values.semester     || null,
            },
          };

          let result;
          if (isEdit && initial?._id) {
            result = await hookRef.update(initial._id, payload);
          } else {
            result = await hookRef.create(payload);
          }
          onSuccess(result?.document ?? result);
        }

        helpers.resetForm();
        onClose();
      } catch (err) {
        const msg = err?.response?.data?.message ?? err?.message ?? 'Operation failed.';
        helpers.setStatus({ error: msg });
      }
    },
  });

  const handleFileChange = useCallback((e) => {
    const f = e.target.files?.[0] ?? null;
    formik.setFieldValue('file', f);
    // Auto-fill title from filename when empty
    if (f && !formik.values.title) {
      formik.setFieldValue('title', f.name.replace(/\.[^.]+$/, ''));
    }
    // Force type to IMPORTED when file selected
    if (f) formik.setFieldValue('type', 'IMPORTED');
  }, [formik]);

  const handleClose = useCallback(() => {
    formik.resetForm();
    onClose();
  }, [formik, onClose]);

  const typeIsLocked = !!forceType || userRole === 'TEACHER';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      {/* DialogTitle renders as <h2> — avoid nesting block/heading elements inside it */}
      <DialogTitle
        component="div"
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography variant="h6" fontWeight={700} component="span">
          {isEdit ? 'Edit Document' : 'New Document'}
        </Typography>
        <Button size="small" color="inherit" onClick={handleClose} sx={{ minWidth: 0, p: 0.5 }}>
          <Close fontSize="small" />
        </Button>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {formik.status?.error && (
          <Alert severity="error" sx={{ mb: 2 }}>{formik.status.error}</Alert>
        )}

        <Grid container spacing={2}>

          {/* Title */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              id="doc-form-title"
              name="title"
              label="Title *"
              value={formik.values.title}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.title && Boolean(formik.errors.title)}
              helperText={formik.touched.title && formik.errors.title}
            />
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              id="doc-form-description"
              name="description"
              label="Description"
              multiline
              rows={2}
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.description && Boolean(formik.errors.description)}
              helperText={formik.touched.description && formik.errors.description}
            />
          </Grid>

          {/* Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl
              fullWidth
              size="small"
              error={formik.touched.type && Boolean(formik.errors.type)}
              disabled={typeIsLocked}
            >
              <InputLabel id="doc-form-type-label">Type *</InputLabel>
              <Select
                labelId="doc-form-type-label"
                id="doc-form-type"
                name="type"
                label="Type *"
                value={formik.values.type}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {accessibleTypes.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
              {formik.touched.type && formik.errors.type && (
                <FormHelperText>{formik.errors.type}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Category */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl
              fullWidth
              size="small"
              error={formik.touched.category && Boolean(formik.errors.category)}
            >
              <InputLabel id="doc-form-cat-label">Category *</InputLabel>
              <Select
                labelId="doc-form-cat-label"
                id="doc-form-cat"
                name="category"
                label="Category *"
                value={formik.values.category}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                {DOCUMENT_ENUMS.CATEGORY.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
              {formik.touched.category && formik.errors.category && (
                <FormHelperText>{formik.errors.category}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Tags */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size="small"
              id="doc-form-tags"
              name="tags"
              label="Tags (comma-separated)"
              placeholder="e.g. 2024, semester-1, math"
              value={formik.values.tags}
              onChange={formik.handleChange}
              helperText="Up to 20 tags. Lowercase, trimmed automatically."
            />
          </Grid>

          {/* Academic year / Semester */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              id="doc-form-year"
              name="academicYear"
              label="Academic Year"
              placeholder="e.g. 2024-2025"
              value={formik.values.academicYear}
              onChange={formik.handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="doc-form-sem-label">Semester</InputLabel>
              <Select
                labelId="doc-form-sem-label"
                id="doc-form-sem"
                name="semester"
                label="Semester"
                value={formik.values.semester}
                onChange={formik.handleChange}
              >
                <MenuItem value="">None</MenuItem>
                {DOCUMENT_ENUMS.SEMESTER.map((s) => (
                  <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* File upload (import mode or optional attachment) */}
          {!isEdit && (
            <Grid size={{ xs: 12 }}>
              <Box
                component="label"
                htmlFor="doc-form-file"
                sx={{
                  display:       'flex',
                  flexDirection: 'column',
                  alignItems:    'center',
                  border:        '2px dashed',
                  borderColor:   formik.values.file ? 'success.main' : 'divider',
                  borderRadius:  2,
                  p:             2,
                  cursor:        'pointer',
                  '&:hover':     { borderColor: 'primary.main', bgcolor: 'action.hover' },
                  transition:    'border-color .2s',
                }}
              >
                <CloudUpload sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
                {formik.values.file ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      {formik.values.file.name}
                    </Typography>
                    <Chip
                      label={`${(formik.values.file.size / 1024).toFixed(0)} KB`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Drop a file here or <strong>click to browse</strong> (max 25 MB)
                  </Typography>
                )}
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
                  PDF, DOCX, XLSX, PPTX, ODT, images, TXT, CSV, MD
                </Typography>
                <input
                  id="doc-form-file"
                  type="file"
                  hidden
                  accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.odt,.jpg,.jpeg,.png,.webp,.svg,.txt,.csv,.md"
                  onChange={handleFileChange}
                />
              </Box>
              {formik.touched.file && formik.errors.file && (
                <FormHelperText error sx={{ ml: 1 }}>{formik.errors.file}</FormHelperText>
              )}
            </Grid>
          )}

        </Grid>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={handleClose} disabled={formik.isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={formik.submitForm}
          disabled={formik.isSubmitting || !formik.dirty}
          startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isEdit ? 'Save Changes' : formik.values.file ? 'Import File' : 'Create Document'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentForm;