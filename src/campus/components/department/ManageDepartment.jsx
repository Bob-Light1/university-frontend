import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  Button,
  Stack,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Collapse,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Business as BusinessIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Formik, Form } from 'formik';
import { useParams } from 'react-router-dom';
import { departmentSchema } from '../../../yupSchema/departmentSchema';
import api from '../../../api/axiosInstance';

/**
 * MANAGE DEPARTMENT MODAL
 *
 * Inline CRUD for departments, scoped to the current campus.
 * Pattern mirrors ManageLevel.jsx.
 *
 * @param {boolean}  open               - Dialog open state
 * @param {Function} onClose            - Close callback
 * @param {Function} onDepartmentsUpdated - Called after any mutation so parent can refresh
 */
const ManageDepartment = ({ open, onClose, onDepartmentsUpdated }) => {
  const { campusId } = useParams();

  const handleClose = () => {
    document.activeElement?.blur();
    setEditingDept(null);
    setFormOpen(false);
    setErrorMsg(null);
    onClose();
  };

  const [departments, setDepartments]     = useState([]);
  const [editingDept,  setEditingDept]    = useState(null);
  const [loading,      setLoading]        = useState(false);
  const [errorMsg,     setErrorMsg]       = useState(null);
  const [showArchived, setShowArchived]   = useState(false);
  const [formOpen,     setFormOpen]       = useState(false);

  const isEditMode = Boolean(editingDept);

  // ─── FETCH ───────────────────────────────────────────────
  const fetchDepartments = async () => {
    
    if (!campusId) {
        setErrorMsg('Campus not found');
        return;
      }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.get(`/department`, {
        params: {
          campusId,
          includeArchived: showArchived,
          limit: 200,
        },
      });
      setDepartments(res.data?.data || []);
    } catch {
      setErrorMsg('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && campusId) {
      fetchDepartments();
    }
  }, [open, showArchived, campusId]);

  // ─── SUBMIT (create / update) ─────────────────────────────
  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    setErrorMsg(null);

    try {
      const payload = {
        ...values,
        schoolCampus: campusId,
      };

      if (isEditMode) {
        await api.put(
          `/department/${editingDept._id}`,
          payload,
        );
      } else {
        await api.post(`/department`, payload);
      }

      resetForm();
      setEditingDept(null);
      setFormOpen(false);
      await fetchDepartments();
      onDepartmentsUpdated?.();
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || 'Operation failed';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── ARCHIVE ─────────────────────────────────────────────
  const handleArchive = async (dept) => {
    if (!window.confirm(`Archive department "${dept.name}"?`)) return;
    setErrorMsg(null);
    try {
      await api.delete(`/department/${dept._id}`);
      await fetchDepartments();
      onDepartmentsUpdated?.();
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to archive department';
      setErrorMsg(msg);
    }
  };

  // ─── RESTORE ─────────────────────────────────────────────
  const handleRestore = async (dept) => {
    if (!window.confirm(`Restore department "${dept.name}"?`)) return;
    setErrorMsg(null);
    try {
      await api.patch(
        `/department/${dept._id}/restore`,
        {},
      );
      await fetchDepartments();
      onDepartmentsUpdated?.();
    } catch (e) {
      setErrorMsg('Failed to restore department');
    }
  };

  // ─── HELPERS ─────────────────────────────────────────────
  const handleEdit = (dept) => {
    setEditingDept(dept);
    setFormOpen(true);
  };

  const handleCancelForm = (resetForm) => {
    resetForm();
    setEditingDept(null);
    setFormOpen(false);
    setErrorMsg(null);
  };

  const statusColor = (status) =>
    status === 'active' ? 'success' : status === 'inactive' ? 'warning' : 'default';

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEnforceFocus
      closeAfterTransition={false}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white',
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <BusinessIcon />
          <Typography variant="h6" fontWeight={700}>
            Manage Departments
          </Typography>
        </Stack>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {/* ── Toolbar ── */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Button
            size="small"
            variant="text"
            onClick={() => setShowArchived((v) => !v)}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            {showArchived ? 'Hide archived' : 'Show archived'}
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditingDept(null); setFormOpen((v) => !v); }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            New Department
          </Button>
        </Stack>

        {/* ── Form (collapsible) ── */}
        <Collapse in={formOpen}>
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2" fontWeight={700}>
                {isEditMode ? `Edit: ${editingDept?.name}` : 'New Department'}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setFormOpen((v) => !v)}
              >
                {formOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Stack>

            <Formik
              enableReinitialize
              initialValues={{
                name:              editingDept?.name        || '',
                code:              editingDept?.code        || '',
                description:       editingDept?.description || '',
                headOfDepartment:  editingDept?.headOfDepartment?._id || '',
                status:            editingDept?.status      || 'active',
              }}
              validationSchema={departmentSchema(isEditMode)}
              onSubmit={handleSubmit}
            >
              {({ values, handleChange, handleBlur, touched, errors, isSubmitting, resetForm }) => (
                <Form>
                  <Stack spacing={2}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <TextField
                        label="Department Name *"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                        fullWidth
                        size="small"
                        slotProps={{
                          input: { id: 'dept-name' },
                          inputLabel: { htmlFor: 'dept-name' },
                        }}
                      />
                      <TextField
                        label="Code *"
                        name="code"
                        value={values.code}
                        onChange={(e) =>
                          handleChange({
                            target: { name: 'code', value: e.target.value.toUpperCase() },
                          })
                        }
                        onBlur={handleBlur}
                        error={touched.code && Boolean(errors.code)}
                        helperText={touched.code && errors.code}
                        fullWidth
                        size="small"
                        sx={{ maxWidth: { sm: 140 } }}
                        slotProps={{
                          input: { id: 'dept-code' },
                          inputLabel: { htmlFor: 'dept-code' },
                        }}
                      />
                    </Stack>

                    <TextField
                      label="Description"
                      name="description"
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      slotProps={{
                        input: { id: 'dept-desc' },
                        inputLabel: { htmlFor: 'dept-desc' },
                      }}
                    />

                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleCancelForm(resetForm)}
                        disabled={isSubmitting}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="small"
                        variant="contained"
                        startIcon={
                          isSubmitting
                            ? <CircularProgress size={14} color="inherit" />
                            : <AddIcon />
                        }
                        disabled={isSubmitting}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        {isEditMode ? 'Update' : 'Create'}
                      </Button>
                    </Stack>
                  </Stack>
                </Form>
              )}
            </Formik>
          </Box>
        </Collapse>

        {/* ── Department list ── */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : departments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No departments found. Create your first one above.
            </Typography>
          </Box>
        ) : (
         
          <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
             {/* ── Use Box rows instead of ListItem to avoid <li> nesting
               and <p> containing <div> issues ── */}
               
            {departments.map((dept) => (
              <Box
                component="li"
                key={dept._id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  px: 1,
                  py: 1.5,
                  opacity: dept.status === 'archived' ? 0.55 : 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                {/* Left: name + code + status + description */}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="body2" fontWeight={600}>
                      {dept.name}
                    </Typography>
                    <Chip
                      label={dept.code}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                    <Chip
                      label={dept.status}
                      size="small"
                      color={statusColor(dept.status)}
                      sx={{ fontSize: '0.65rem', height: 18, textTransform: 'capitalize' }}
                    />
                  </Stack>
                  {dept.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {dept.description}
                    </Typography>
                  )}
                </Box>

                {/* Right: action buttons */}
                <Stack direction="row" spacing={0.5} flexShrink={0}>
                  {dept.status !== 'archived' && (
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEdit(dept)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {dept.status !== 'archived' ? (
                    <Tooltip title="Archive">
                      <IconButton size="small" color="error" onClick={() => handleArchive(dept)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Tooltip title="Restore">
                      <IconButton size="small" color="success" onClick={() => handleRestore(dept)}>
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageDepartment;