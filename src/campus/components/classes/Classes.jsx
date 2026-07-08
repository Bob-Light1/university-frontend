import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogContent,
  TextField,
  MenuItem,
  Chip,
  Stack,
  Tooltip,
  InputAdornment,
  Skeleton,
  Alert,
  CircularProgress,
  Snackbar,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  School as SchoolIcon,
  Groups as GroupsIcon,
  Business as BusinessIcon,
  Layers as LayersIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Restore as RestoreIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

import { Formik, Form } from 'formik';
import { createClassSchema } from '../../../yupSchema/createClassSchema';
import api from '../../../api/axiosInstance';
import ManageLevel from '../levels/ManageLevel';
import MobileClassCard from './MobileClassCard';
import { useParams } from 'react-router-dom';

const Classes = () => {
  const theme = useTheme();
  const { campusId } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [classes, setClasses] = useState([]);
  const [campus, setCampus] = useState(null);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openLevels, setOpenLevels] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const isEditMode = Boolean(selectedClass);

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

  const fetchData = useCallback(async () => {
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(campusId);
    if (!campusId || !isMongoId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({ includeArchived });
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (levelFilter) params.append('level', levelFilter);

      const [clsRes, campRes, lvlRes] = await Promise.all([
        api.get(`/class/campus/${campusId}?${params.toString()}`),
        api.get(`/campus/${campusId}`),
        api.get('/level'),
      ]);

      setClasses(clsRes.data?.data || []);
      setCampus(campRes.data?.data || null);
      setLevels(lvlRes.data?.data || []);

    } catch (err) {
      showNotification(
        err.response?.data?.message ||
        'Unable to load data. Please check your connection or permissions.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  }, [campusId, includeArchived, debouncedSearch, levelFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      if (isEditMode) {
        await api.put(`/class/${selectedClass._id}`, values);
        showNotification('Class updated successfully!', 'success');
      } else {
        await api.post('/class', values);
        showNotification('Class created successfully!', 'success');
      }

      await fetchData();
      resetForm();
      setSelectedClass(null);
      setOpen(false);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        (isEditMode ? 'Failed to update class' : 'Failed to create class');
      showNotification(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /* ----------------SOFT DELETE / RESTORE ---------------- */
  const handleArchive = async (id) => {
    if (!window.confirm('Do you really want to archive this class?')) return;
    try {
      await api.delete(`/class/${id}`);
      showNotification('Class archived successfully', 'success');
      await fetchData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Unable to archive the class', 'error');
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('This class will be restored!')) return;
    try {
      await api.patch(`/class/${id}/restore`, {});
      showNotification('Class restored successfully', 'success');
      await fetchData();
    } catch (e) {
      showNotification(e.response?.data?.message || 'Failed to restore class', 'error');
    }
  };

  const handleOpenCreate = () => {
    setSelectedClass(null);
    setOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setSelectedClass(cls);
    setOpen(true);
  };

  const isEmpty = !loading && classes.length === 0;

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        mt: { xs: 2, sm: 3, md: 4 }, 
        mb: { xs: 4, sm: 5, md: 6 },
        px: { xs: 2, sm: 3 }
      }}
    >
      {/* HEADER - Responsive */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        gap={{ xs: 2, sm: 0 }}
        mb={{ xs: 3, md: 4 }}
      >
        <Box>
          <Typography 
            variant={isMobile ? 'h5' : 'h4'} 
            fontWeight="800" 
            gutterBottom
            textAlign={{ xs: 'center', lg: 'start'}}
          >
            Classes Management
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            display={{ xs: 'none', sm: 'block' }}
            marginBottom={{ xs: 2 }}
            textAlign={{ xs: 'center', lg: 'start'}}
          >
            Creation, modification, and archiving of campus classes
          </Typography>
        </Box>

        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2}
          width={{ xs: '100%', sm: 'auto' }}
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
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            fullWidth={isMobile}
            sx={{ 
              borderRadius: 2, 
              px: { xs: 2, sm: 3 }, 
              py: 1.2 
            }}
          >
            New Class
          </Button>

          <Button
            variant="outlined"
            startIcon={<LayersIcon />}
            onClick={() => setOpenLevels(true)}
            fullWidth={isMobile}
            sx={{ borderRadius: 2 }}
          >
            Manage Levels
          </Button>
        </Stack>
      </Box>

      {/* FILTER BAR */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField
          placeholder="Search classes..."
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
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Level</InputLabel>
          <Select
            value={levelFilter}
            label="Level"
            onChange={(e) => setLevelFilter(e.target.value)}
          >
            <MenuItem value="">All Levels</MenuItem>
            {levels.map((l) => (
              <MenuItem key={l._id} value={l._id}>{l.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
                bgcolor: 'background.neutral'
              }}
            >
              <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No classes yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create your first class to get started
              </Typography>
            </Paper>
          ) : (
            classes.map((cls) => 
              <MobileClassCard 
                key={cls._id} 
                cls={cls} 
                edit={handleOpenEdit} 
                archive={handleArchive}
                restore={handleRestore}
              />
            )
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
              fontSize: isTablet ? '0.875rem' : '1rem'
            }
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Class</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton height={48} animation="wave" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isEmpty ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="subtitle1" color="text.secondary">
                      No classes registered at the moment
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((cls) => (
                  <TableRow key={cls._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <SchoolIcon fontSize="small" color="action" />
                        <Typography fontWeight={600}>{cls.className || '—'}</Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={cls.level?.name || '—'}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <GroupsIcon fontSize="small" color="disabled" />
                        <Typography variant="body2">{cls.maxStudents || 0} students</Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={cls.status || 'active'}
                        color={cls.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                  
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenEdit(cls)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      {cls.status === 'active' ? (
                        <Tooltip title="Archive">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleArchive(cls._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      ): (
                        <Tooltip title="Restore">
                        <IconButton
                          color="success"
                          size="small"
                          onClick={() => handleRestore(cls._id)}
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

      {/* CREATE / EDIT MODAL - Responsive */}
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setSelectedClass(null);
        }}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        disableEnforceFocus={true}
        closeAfterTransition={false}
        aria-labelledby="create-class-title"
        slotProps={{
          paper: {
            sx: {
              borderRadius: isMobile ? 0 : 3,
            }
          }
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'white'
          }}
        >
          <Typography id="create-class-title" variant="h6" fontWeight="700">
            {isEditMode ? 'Edit Class' : 'New Class'}
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
              className: selectedClass?.className || '',
              schoolCampus: selectedClass?.schoolCampus?._id || campusId || '',
              level: selectedClass?.level?._id || '',
              maxStudents: selectedClass?.maxStudents || 50,
            }}
            validationSchema={createClassSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleChange, handleBlur, isSubmitting, errors, touched }) => (
              <Form>
                <Stack spacing={3}>
                  <TextField
                    autoFocus={!isMobile}
                    label="Class Name"
                    name="className"
                    value={values.className || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.className && Boolean(errors.className)}
                    helperText={touched.className && errors.className}
                    fullWidth
                    slotProps={{
                      input: {
                        id: 'className',
                        startAdornment: (
                          <InputAdornment position="start">
                            <SchoolIcon color="primary" />
                          </InputAdornment>
                        ),
                      },
                      inputLabel: {
                        htmlFor: 'className',
                      },
                    }}
                  />

                  {/* Campus field - Read-only, auto-filled */}
                  <TextField
                    label="Campus"
                    name="schoolCampus"
                   value={campus ? (campus.campus_name) : (values.schoolCampus || 'Loading...')}
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
                        shrink: true,
                      },
                    }}
                  />

                  <TextField
                    select
                    label="Level"
                    name="level"
                    value={values.level || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.level && Boolean(errors.level)}
                    helperText={touched.level && errors.level}
                    fullWidth
                    slotProps={{
                      input: {
                        id: 'level',
                        startAdornment: (
                          <InputAdornment position="start">
                            <SchoolIcon color="primary" />
                          </InputAdornment>
                        ),
                      },
                      inputLabel: {
                        htmlFor: 'level',
                      },
                    }}
                  >
                    {(Array.isArray(levels) ? levels : []).map((l) => (
                      <MenuItem key={l._id} value={l._id}>
                        {l.name}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    type="number"
                    label="Maximum Capacity"
                    name="maxStudents"
                    value={values.maxStudents || 50 }
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.maxStudents && Boolean(errors.maxStudents)}
                    helperText={touched.maxStudents && errors.maxStudents}
                    fullWidth
                    slotProps={{
                      input: {
                        id: 'maxStudents',
                        startAdornment: (
                          <InputAdornment position="start">
                            <GroupsIcon />
                          </InputAdornment>
                        ),
                      },
                      inputLabel: {
                        htmlFor: 'maxStudents',
                      },
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
                      sx={{ order: { xs: 2, sm: 1 } }}
                    >
                      Cancel
                    </Button>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      disabled={isSubmitting}
                      sx={{ order: { xs: 1, sm: 2 } }}
                    >
                      {isSubmitting
                        ? 'In progress...'
                        : isEditMode
                        ? 'Update'
                        : 'Create Class'}
                    </Button>
                  </Stack>
                </Stack>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Enhanced Snackbar Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ 
          vertical: isMobile ? 'bottom' : 'top', 
          horizontal: isMobile ? 'center' : 'right' 
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

      {/* Manage Levels Dialog */}
      <ManageLevel 
        open={openLevels}
        onClose={() => setOpenLevels(false)}
        onLevelsUpdated={fetchData}
      />
    </Container>
  );
};

export default Classes;