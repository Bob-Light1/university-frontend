import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  Divider,
  Stack,
  Skeleton,
  Alert,
  Container
} from '@mui/material';
import {Grid} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';

import { IMAGE_BASE_URL, API_BASE_URL } from '../../../config/env';
import EditCampusModal from './EditCampusModal';
import { useNavigate, useParams } from 'react-router-dom';


export default function CampusDashboard() {
  const { campusId } = useParams();
  const [campus, setCampus] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  // Campus modules configuration
 const campusModules = [
  // --- GROUP: ACADEMIC
  { 
    id: 1, 
    name: 'Class Management', 
    type: 'Academic', 
    path: `/campus/${campusId}/classes`, 
    icon: '🏫', 
    color: '#4989c8',
    description: 'Manage classes and levels'
  },
  { 
    id: 2, 
    name: 'Schedule', 
    type: 'Academic', 
    path: `/campus/${campusId}/schedule`, 
    icon: '📅', 
    color: '#4989c8',
    description: 'Class timetables'
  },
  { 
    id: 3, 
    name: 'Subjects & Units', 
    type: 'Academic', 
    path: `/campus/${campusId}/subjects`, 
    icon: '📚', 
    color: '#4989c8',
    description: 'Course curriculum'
  },
  { 
    id: 4, 
    name: 'Courses Catalog',
    type: 'Academic', 
    path: `/campus/${campusId}/courses`, 
    icon: '📖', 
    color: '#14b8a6', 
    description: 'Global academic courses'
  },

  // --- GROUP: EVALUATION
  { 
    id: 5, 
    name: 'Exams & Grades', 
    type: 'Evaluation', 
    path: `/campus/${campusId}/examination`, 
    icon: '📊', 
    color: '#f59e0b',
    description: 'Assessment management'
  },
  { 
    id: 6, 
    name: 'Student Reports',
    type: 'Evaluation', 
    path: `/campus/${campusId}/results`, 
    icon: '🏆', 
    color: '#f59e0b',
    description: 'Academic transcripts and reports'
  },

  // --- GROUP: USERS (Green) ---
  { 
    id: 7, 
    name: 'Student Register', 
    type: 'Users', 
    path: `/campus/${campusId}/students`, 
    icon: '👨‍🎓', 
    color: '#10b981',
    description: 'Student database'
  },
  { 
    id: 8, 
    name: 'Teaching Staff', 
    type: 'Users', 
    path: `/campus/${campusId}/teachers`, 
    icon: '👨‍🏫', 
    color: '#10b981',
    description: 'Faculty members'
  },

  // --- GROUP: MANAGEMENT & COMMUNICATION (Indigo / Red) ---
  { 
    id: 10, 
    name: 'Attendance Tracking', 
    type: 'Management', 
    path: `/campus/${campusId}/attendance`, 
    icon: '📝', 
    color: '#6366f1',
    description: 'Daily attendance'
  },
];

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Validate campusId
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(campusId);
    
      if (!campusId || !isMongoId) {
        console.warn('Invalid campusId:', campusId);
        setError('Invalid campus ID');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        const config = { 
          headers: { Authorization: `Bearer ${token}` } 
        };

        // Fetch campus details and stats in parallel
        const [campusRes, statsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/campus/${campusId}`, config),
          axios.get(`${API_BASE_URL}/campus/${campusId}/dashboard`, config)
        ]);
        
        // Handle backend response structure
        if (campusRes.data.success) {
          setCampus(campusRes.data.data);
          
        } else {
          throw new Error(campusRes.data.message || 'Failed to load campus');
        }

        if (statsRes.data.success) {
          setStats(statsRes.data.data);   
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [campusId]);

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 4, mb: 3 }} />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 4 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  // No campus data
  if (!campus) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          Campus data not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Title */}
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 700, color: '#2c3e50' }}>
        Campus Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* CAMPUS PROFILE CARD */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Card 
            sx={{ 
              borderRadius: 4, 
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              height: '100%'
            }}
          >
            {/* Header with gradient */}
            <Box sx={{ 
              height: 120, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              position: 'relative'
            }} />
            
            <CardContent sx={{ mt: -7, position: 'relative' }}>
              {/* Campus Logo */}
              <Avatar
                src={campus.campus_image ? `${IMAGE_BASE_URL}/uploads/campuses/${campus.campus_image}` : null}
                alt={campus.campus_name}
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto', 
                  mb: 2, 
                  border: '4px solid white', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem'
                }}
              >
                {!campus.campus_image && campus.campus_name?.charAt(0)}
              </Avatar>

              {/* Campus Name */}
              <Typography 
                variant="h6" 
                align="center" 
                sx={{ fontWeight: 600, mb: 1 }}
              >
                {campus.campus_name}
              </Typography>

              {/* Status Badge */}
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Chip 
                  label={campus.status || 'Active'} 
                  color="success" 
                  size="small" 
                  sx={{ fontWeight: 600 }} 
                />
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Campus Information */}
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <SupervisorAccountIcon color="action" sx={{ mt: 0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Manager
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {campus.manager_name}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <EmailIcon color="action" sx={{ mt: 0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-word' }}>
                      {campus.email}
                    </Typography>
                  </Box>
                </Box>

                {campus.manager_phone && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <PhoneIcon color="action" sx={{ mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {campus.manager_phone}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {campus.location?.city && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <LocationOnIcon color="action" sx={{ mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {campus.location.city}, {campus.location.country || 'Cameroon'}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Stack>

              {/* Edit Button */}
              <Button
                fullWidth
                startIcon={<EditIcon />}
                variant="contained"
                onClick={() => setModalOpen(true)}
                sx={{ 
                  mt: 3, 
                  borderRadius: 2, 
                  textTransform: 'none', 
                  py: 1.2,
                  fontWeight: 600
                }}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* STATISTICS & MODULES */}
        <Grid size={{ xs: 12, lg: 9 }}>
          <Stack spacing={3}>
            {/* Quick Statistics */}
            <Grid container spacing={2}>
              {[
                { 
                  label: 'Classes', 
                  value: stats?.classes?.total || '0', 
                  icon: <SchoolIcon />, 
                  color: '#4989c8',
                  subtitle: `${stats?.classes?.active || 0} active`
                },
                { 
                  label: 'Students', 
                  value: stats?.students?.total || '0', 
                  icon: <PeopleIcon />, 
                  color: '#10b981',
                  subtitle: `${stats?.students?.newThisMonth || 0} new this month`
                },
                { 
                  label: 'Teachers', 
                  value: stats?.teachers?.total || '0', 
                  icon: <SupervisorAccountIcon />, 
                  color: '#f59e0b',
                  subtitle: `${stats?.teachers?.newThisMonth || 0} new this month`
                }
              ].map((stat, i) => (
                <Grid size={{ xs: 12, sm: 4 }} key={i}>
                  <Card 
                    sx={{ 
                      borderRadius: 3, 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      height: '100%',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
                      }
                    }}
                  >
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box sx={{ 
                          p: 1.5, 
                          borderRadius: 2, 
                          backgroundColor: `${stat.color}15`, 
                          color: stat.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {stat.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" fontWeight={500}>
                            {stat.label}
                          </Typography>
                          {stat.subtitle && (
                            <Typography variant="caption" color="text.secondary">
                              {stat.subtitle}
                            </Typography>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Campus Modules Grid */}
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Campus Modules
              </Typography>
              
              <Grid container spacing={2}>
                {campusModules.map((module) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={module.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: 3, 
                        transition: 'all 0.2s ease-in-out',
                        borderLeft: `4px solid ${module.color}`,
                        cursor: 'pointer',
                        height: '100%',
                        '&:hover': { 
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                          borderColor: module.color
                        } 
                      }}
                      onClick={() => navigate(module.path)}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Box sx={{ 
                            fontSize: '2rem', 
                            backgroundColor: `${module.color}10`,
                            p: 1.5, 
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {module.icon}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                              {module.name}
                            </Typography>
                            <Chip 
                              label={module.type} 
                              size="small" 
                              sx={{ 
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                mb: 0.5
                              }} 
                            />
                            <Typography variant="caption" color="text.secondary" display="block">
                              {module.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Edit Campus Modal */}
      {campus && (
        <EditCampusModal 
          open={modalOpen} 
          handleClose={() => setModalOpen(false)} 
          campusData={campus}
          onUpdate={(updatedCampus) => setCampus(updatedCampus)}
        />
      )}
    </Container>
  );
}