/**
 * @file ExpenseCategoriesPanel.jsx
 * @description Expense-category management dialog: list, create (409 on
 * duplicate name) and delete (409 if the category is still referenced).
 *
 * Backend: /finance/expense-categories — global lookup (no campus scope).
 */

import { useState } from 'react';
import { useFormik } from 'formik';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack,
  TextField, Typography, List, ListItem, ListItemText, IconButton,
  Divider, CircularProgress, Alert, Box,
} from '@mui/material';
import { Category, Add, Delete } from '@mui/icons-material';

import { expenseCategorySchema } from '../../../yupSchema/financeSchemas';

const ROUNDED = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const ExpenseCategoriesPanel = ({ open, categories = [], onClose, onCreate, onDelete }) => {
  const [error,  setError]  = useState(null);
  const [busyId, setBusyId] = useState(null);

  const formik = useFormik({
    initialValues: { name: '', description: '' },
    validate: async (values) => {
      try {
        await expenseCategorySchema.validate(values, { abortEarly: false });
        return {};
      } catch (err) {
        const errors = {};
        (err.inner ?? []).forEach((e) => { if (e.path && !errors[e.path]) errors[e.path] = e.message; });
        return errors;
      }
    },
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setError(null);
      try {
        await onCreate({ name: values.name.trim(), description: values.description?.trim() || undefined });
        resetForm();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to create category.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleDelete = async (cat) => {
    setError(null);
    setBusyId(cat._id);
    try {
      await onDelete(cat._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot delete: the category may still be in use.');
    } finally {
      setBusyId(null);
    }
  };

  const handleClose = () => { document.activeElement?.blur(); setError(null); onClose(); };
  const fieldError = (name) => formik.touched[name] && formik.errors[name];

  return (
    <Dialog
      open={open} onClose={handleClose} maxWidth="sm" fullWidth
      disableEnforceFocus closeAfterTransition={false}
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Category sx={{ color: 'text.secondary' }} />
          <Typography variant="h6" fontWeight={700}>Expense Categories</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        <Stack spacing={2.5}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

          {/* Create form */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
            <TextField
              fullWidth size="small" name="name" label="New category *"
              value={formik.values.name}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={Boolean(fieldError('name'))} helperText={fieldError('name')}
              sx={ROUNDED}
            />
            <TextField
              fullWidth size="small" name="description" label="Description"
              value={formik.values.description}
              onChange={formik.handleChange} onBlur={formik.handleBlur}
              error={Boolean(fieldError('description'))} helperText={fieldError('description')}
              sx={ROUNDED}
            />
            <Button
              variant="contained" disabled={formik.isSubmitting}
              onClick={() => formik.handleSubmit()}
              startIcon={formik.isSubmitting ? <CircularProgress size={14} color="inherit" /> : <Add />}
              sx={{ textTransform: 'none', borderRadius: 2, whiteSpace: 'nowrap' }}
            >
              Add
            </Button>
          </Stack>

          <Divider />

          {/* List */}
          {categories.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No categories yet.</Typography>
            </Box>
          ) : (
            <List dense sx={{ maxHeight: 320, overflow: 'auto' }}>
              {categories.map((cat) => (
                <ListItem
                  key={cat._id}
                  secondaryAction={
                    <IconButton edge="end" color="error" disabled={busyId === cat._id} onClick={() => handleDelete(cat)}>
                      {busyId === cat._id ? <CircularProgress size={16} /> : <Delete fontSize="small" />}
                    </IconButton>
                  }
                >
                  <ListItemText primary={cat.name} secondary={cat.description || null} />
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseCategoriesPanel;
