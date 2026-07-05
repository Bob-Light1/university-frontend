import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Button, Container, Typography, Paper, Table,
  TableBody, TableCell, TableContainer, TableHead,
  TableRow, IconButton, Dialog, DialogContent, TextField,
  Stack, Tooltip, InputAdornment, Skeleton, Chip, MenuItem,
  Snackbar, Alert, useTheme, useMediaQuery, Card, CardContent,
  FormControlLabel, Switch, TablePagination,
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restore as RestoreIcon,
  Close as CloseIcon,
  Book as BookIcon,
  Palette as PaletteIcon,
  Business as BusinessIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

import { Formik, Form } from 'formik';
import api from '../../../api/axiosInstance';

import { createSubjectSchema } from '../../../yupSchema/createSubjectSchema';
import MobileSubjectCard from './MobileSubjectCard';
import ConfirmActionDialog from '../../../components/shared/ConfirmActionDialog';
import { useParams } from 'react-router-dom';

// Subject categories — mirrors the backend Subject model enum (source of truth).
const SUBJECT_CATEGORIES = [
  'Science',
  'Mathematics',
  'Languages',
  'Social Studies',
  'Arts',
  'Physical Education',
  'Technology',
  'Other',
];

const Subject = () => {
  const theme = useTheme();
  const { campusId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [subjects, setSubjects] = useState([]);
  const [campus, setCampus] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Server-side pagination state (page is 0-based for MUI TablePagination).
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open:   false,
    action: 'archive',
    id:     null,
    label:  '',
    busy:   false,
  });

  const isEditMode = Boolean(selectedSubject);

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') return;
    setNotification({ ...notification, open: false });
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- FETCH ---------------- */
  const fetchData = useCallback(async () => {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(campusId);
    if (!campusId || !isMongoId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // True server-side pagination — page/limit are sent to the backend, which
      // caps limit at 100. Total count comes back in the `pagination` envelope.
      const params = new URLSearchParams({
        campusId,
        includeArchived,
        page: page + 1,
        limit: rowsPerPage,
      });
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());

      const [subjectRes, campusRes] = await Promise.all([
        api.get(`/subject?${params.toString()}`),
        api.get(`/campus/${campusId}`),
      ]);

      setSubjects(subjectRes.data?.data || []);
      setTotal(subjectRes.data?.pagination?.total ?? 0);
      setCampus(campusRes.data?.data || null);

    } catch (e) {
      showNotification(e.response?.data?.message || 'Failed to load subjects', 'error');
    } finally {
      setLoading(false);
    }
  }, [campusId, includeArchived, debouncedSearch, page, rowsPerPage]);

  // Load the campus departments once (used by the create/edit form select).
  // limit=200 so the picker is not silently capped at the default page size.
  useEffect(() => {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(campusId);
    if (!campusId || !isMongoId) return;

    let active = true;
    api
      .get('/department', { params: { campusId, limit: 200 } })
      .then((res) => { if (active) setDepartments(res.data?.data || []); })
      .catch(() => { if (active) setDepartments([]); });

    return () => { active = false; };
  }, [campusId]);

  // Reset to the first page whenever the result set changes (search / archive toggle).
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, includeArchived]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (isEditMode) {
        await api.put(`/subject/${selectedSubject._id}`, values);
        showNotification('Subject updated successfully!', 'success');
      } else {
        await api.post('/subject', values);
        showNotification('Subject created successfully!', 'success');
      }

      resetForm();
      setOpen(false);
      setSelectedSubject(null);
      await fetchData();
    } catch (e) {
      const msg = e.response?.data?.message ||
        (isEditMode ? 'Failed to update subject' : 'Failed to create subject');
      showNotification(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- DELETE / RESTORE ---------------- */
  const handleArchive = (id, label) => {
    setConfirmDialog({ open: true, action: 'archive', id, label, busy: false });
  };

  const handleRestore = (id, label) => {
    setConfirmDialog({ open: true, action: 'restore', id, label, busy: false });
  };

  const handleConfirmAction = async () => {
    const { action, id } = confirmDialog;
    setConfirmDialog((prev) => ({ ...prev, busy: true }));
    try {
      if (action === 'archive') {
        await api.delete(`/subject/${id}`);
        showNotification('Subject archived successfully', 'success');
      } else {
        await api.patch(`/subject/${id}/restore`, {});
        showNotification('Subject restored successfully', 'success');
      }
      await fetchData();
    } catch (e) {
      showNotification(
        e.response?.data?.message || `Failed to ${action} subject`,
        'error',
      );
    } finally {
      setConfirmDialog((prev) => ({ ...prev, open: false, busy: false }));
    }
  };

  const handleOpenCreate = () => {
    setSelectedSubject(null);
    setOpen(true);
  };

  const handleOpenEdit = (subject) => {
    setSelectedSubject(subject);
    setOpen(true);
  };

  const isEmpty = !loading && subjects.length === 0;
 
  return (
    <Container
      maxWidth="xl"
      sx={{
        mt: { xs: 2, sm: 3, md: 4 },
        mb: { xs: 4, sm: 5, md: 6 },
        px: { xs: 2, sm: 3 },
      }}
    >
      {/* HEADER - Responsive */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={{ xs: 2, md: 0 }}
        mb={{ xs: 3, md: 4 }}
      >
        <Box>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            fontWeight={800}
            gutterBottom
            textAlign={{ xs: 'center', lg: 'start' }}
          >
            Subjects Management
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            display={{ xs: 'none', sm: 'block' }}
            textAlign={{ xs: 'center', lg: 'start' }}
          >
            Manage academic subjects for your campus
          </Typography>
        </Box>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          alignItems="center" 
          width={{ xs: '100%', md: 'auto' }}
        >
          <FormControlLabel
            control={
              <Switch 
                checked={includeArchived} 
                onChange={(e) => setIncludeArchived(e.target.checked)} 
                color="secondary"
              />
            }
            label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Show Archived</Typography>}
            sx={{ mr: { md: 2 } }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            fullWidth={isMobile}
            sx={{ borderRadius: 2, px: 3, py: 1.2 }}
          >
            New Subject
          </Button>
        </Stack>

      </Box>

      {/* FILTER BAR */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField
          placeholder="Search subjects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      {/* Mobile View - Cards */}
      {isMobile ? (
        <Box>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} sx={{ mb: 2, borderRadius: 3 }}>
                <CardContent>
                  <Skeleton height={120} animation="wave" />
                </CardContent>
              </Card>
            ))
          ) : isEmpty ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 3,
                bgcolor: 'grey.50',
              }}
            >
              <BookIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No subjects yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your first subject to get started
              </Typography>
            </Paper>
          ) : (
            subjects.map((subj) => (
              <MobileSubjectCard 
                key={subj._id} 
                subject={subj} 
                edit={handleOpenEdit} 
                archive={handleArchive} 
                restore={handleRestore}
              />
            ))
          )}
        </Box>
      ) : (
        /* Desktop/Tablet View - Table */
        <TableContainer
          component={Paper}
          elevation={3}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            '& .MuiTableCell-root': {
              fontSize: isTablet ? '0.875rem' : '1rem',
            },
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: 'grey.100' }}>
              <TableRow>
                <TableCell>Subject</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Coefficient</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton height={48} animation="wave" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <BookIcon sx={{ fontSize: 64, color: 'grey.300', mb: 2 }} />
                    <Typography variant="subtitle1" color="text.secondary">
                      No subjects registered at the moment
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subj) => (
                  <TableRow key={subj._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <BookIcon fontSize="small" color="action" />
                        <Typography fontWeight={600}>
                          {subj.subject_name || '—'}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip label={subj.subject_code || '—'} size="small" />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {subj.department?.name || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>{subj.coefficient ?? '—'}</TableCell>

                    <TableCell>
                      {subj.color ? (
                        <Box
                          sx={{
                            width: 40,
                            height: 20,
                            bgcolor: subj.color,
                            border: '1px solid #ddd',
                            borderRadius: 1,
                          }}
                        />
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={subj.status !== 'archived' ? 'Active' : 'Archived'}
                        color={subj.status !== 'archived' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenEdit(subj)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {subj.status !== 'archived' ? (
                        <Tooltip title="Archive">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleArchive(subj._id, subj.subject_name)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Restore">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleRestore(subj._id, subj.subject_name)}
                          >
                            <RestoreIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* PAGINATION — server-side, shared by mobile & desktop views */}
      {!loading && total > 0 && (
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ mt: 1 }}
        />
      )}

      {/* CREATE / EDIT MODAL - Responsive */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setSelectedSubject(null);
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        disableEnforceFocus={true}
        closeAfterTransition={false}
        aria-labelledby="create-subject-title"
        slotProps={{
          paper: {
            sx: {
              borderRadius: isMobile ? 0 : 3,
            },
          },
        }}
      >
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
          <Typography id="create-subject-title" variant="h6" fontWeight={700}>
            {isEditMode ? 'Edit Subject' : 'New Subject'}
          </Typography>
          <IconButton
            onClick={() => setOpen(false)}
            size="small"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ pt: 3, px: { xs: 2, sm: 3 } }}>
          <Formik
            enableReinitialize
            initialValues={{
              schoolCampus: selectedSubject?.schoolCampus?._id || campusId || '',
              subject_name: selectedSubject?.subject_name || '',
              subject_code: selectedSubject?.subject_code || '',
              department: selectedSubject?.department?._id || selectedSubject?.department || '',
              category: selectedSubject?.category || 'Other',
              description: selectedSubject?.description || '',
              coefficient: selectedSubject?.coefficient ?? 1,
              color: selectedSubject?.color || '#1976d2',
            }}
            validationSchema={createSubjectSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
              <Form>
                <Stack spacing={3}>
                  {/* Campus field - Read-only, auto-filled */}
                  <TextField
                    label="Campus"
                    name="schoolCampus"
                    value={campus?.campus_name || 'Loading...'}
                    fullWidth
                    disabled
                    slotProps={{
                      input: {
                        id: 'schoolCampus',
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                      inputLabel: {
                        htmlFor: 'schoolCampus',
                      },
                    }}
                  />

                  <TextField
                    autoFocus={!isMobile}
                    label="Subject Name"
                    name="subject_name"
                    value={values.subject_name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.subject_name && Boolean(errors.subject_name)}
                    helperText={touched.subject_name && errors.subject_name}
                    fullWidth
                    slotProps={{
                      input: {
                        id: 'subject_name',
                        startAdornment: (
                          <InputAdornment position="start">
                            <BookIcon color="primary" />
                          </InputAdornment>
                        ),
                      },
                      inputLabel: {
                        htmlFor: 'subject_name',
                      },
                    }}
                  />

                  <TextField
                    label="Subject Code"
                    name="subject_code"
                    value={values.subject_code}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.subject_code && Boolean(errors.subject_code)}
                    helperText={touched.subject_code && errors.subject_code}
                    fullWidth
                    slotProps={{
                      input: { id: 'subject_code' },
                      inputLabel: { htmlFor: 'subject_code' },
                    }}
                  />

                  <TextField
                    select
                    label="Department"
                    name="department"
                    value={values.department}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.department && Boolean(errors.department)}
                    helperText={
                      (touched.department && errors.department) ||
                      'Optional — department this subject belongs to'
                    }
                    fullWidth
                    slotProps={{
                      input: { id: 'department' },
                      inputLabel: { htmlFor: 'department' },
                    }}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Category"
                    name="category"
                    value={values.category}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.category && Boolean(errors.category)}
                    helperText={touched.category && errors.category}
                    fullWidth
                    slotProps={{
                      input: { id: 'category' },
                      inputLabel: { htmlFor: 'category' },
                    }}
                  >
                    {SUBJECT_CATEGORIES.map((cat) => (
                      <MenuItem key={cat} value={cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    type="number"
                    label="Coefficient"
                    name="coefficient"
                    value={values.coefficient}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.coefficient && Boolean(errors.coefficient)}
                    helperText={touched.coefficient && errors.coefficient}
                    fullWidth
                    slotProps={{
                      input: { id: 'coefficient' },
                      inputLabel: { htmlFor: 'coefficient' },
                    }}
                  />

                  <TextField
                    type="color"
                    label="Color"
                    name="color"
                    value={values.color}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    slotProps={{
                      input: {
                        id: 'color',
                        startAdornment: (
                          <InputAdornment position="start">
                            <PaletteIcon />
                          </InputAdornment>
                        ),
                      },
                      inputLabel: {
                        htmlFor: 'color',
                      },
                    }}
                  />

                  <TextField
                    label="Description"
                    name="description"
                    multiline
                    rows={3}
                    value={values.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    fullWidth
                    slotProps={{
                      input: { id: 'description' },
                      inputLabel: { htmlFor: 'description' },
                    }}
                  />

                  <Stack
                    direction={{ xs: 'column', lg: 'row' }}
                    spacing={2}
                    sx={{ mt: 4 }}
                  >
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setOpen(false)}
                      disabled={isSubmitting}
                      sx={{ order: { xs: 2, lg: 1 } }}
                    >
                      Cancel
                    </Button>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{ order: { xs: 1, lg: 2 } }}
                    >
                      {isSubmitting
                        ? 'In progress...'
                        : isEditMode
                        ? 'Update'
                        : 'Create Subject'
                      }
                    </Button>
                  </Stack>
                </Stack>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Confirm archive / restore dialog */}
      <ConfirmActionDialog
        open={confirmDialog.open}
        action={confirmDialog.action}
        entityLabel={confirmDialog.label}
        entityType="Subject"
        busy={confirmDialog.busy}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={handleConfirmAction}
      />

      {/* Enhanced Snackbar Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{
          vertical: isMobile ? 'bottom' : 'top',
          horizontal: isMobile ? 'center' : 'right',
        }}
        sx={{
          bottom: isMobile ? 80 : undefined,
        }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          iconMapping={{
            success: <SuccessIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />,
            warning: <WarningIcon fontSize="inherit" />,
          }}
          sx={{
            width: '100%',
            minWidth: isMobile ? '90vw' : 300,
            boxShadow: 3,
            borderRadius: 2,
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Subject;