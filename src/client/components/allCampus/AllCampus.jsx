/**
 * @file AllCampus.jsx
 * @description Public campus listing page.
 *   Palette aligned with the dark "Luxury Observatory" theme.
 *   Campus isolation: CAMPUS_MANAGER users are silently redirected
 *   to their own campus if they try to visit another one.
 *
 *   Changes vs previous version:
 *   - Background switched from light grey to dark navy (brand coherence).
 *   - Card background updated to dark glass morphism.
 *   - Stat bar uses dark palette.
 *   - No logic changes — all data fetching, filtering, modal unchanged.
 */

import { useState, useEffect, useRef, useContext } from 'react';
import { motion }               from 'framer-motion';
import {
  Box, Grid, Card, CardMedia, CardContent, Typography,
  IconButton, Modal, Backdrop, Button, Avatar, Chip,
  TextField, InputAdornment,
} from '@mui/material';
import InfoOutlinedIcon  from '@mui/icons-material/InfoOutlined';
import EmailIcon         from '@mui/icons-material/Email';
import PersonIcon        from '@mui/icons-material/Person';
import SearchIcon        from '@mui/icons-material/Search';
import CloseIcon         from '@mui/icons-material/Close';
import LocationOnIcon    from '@mui/icons-material/LocationOn';
import PhoneIcon         from '@mui/icons-material/Phone';
import SchoolIcon        from '@mui/icons-material/School';
import GroupsIcon        from '@mui/icons-material/Groups';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import { useNavigate }   from 'react-router-dom';

import { API_BASE_URL, IMAGE_BASE_URL } from '../../../config/env';
import { AuthContext }                  from '../../../context/AuthContext';

// ─── Motion aliases ───────────────────────────────────────────────────────────

const MotionCard = motion.create(Card);
const MotionBox  = motion.create(Box);
const MotionDiv  = motion.create('div');

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Format a campus location object as a human-readable string.
 */
const formatLocation = (location) => {
  if (!location || typeof location !== 'object') return 'International School';
  const { city, country } = location;
  if (!city && !country) return 'International School';
  if (city && country) return `${city}, ${country}`;
  return city || country;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AllCampus() {
  const [open,           setOpen]           = useState(false);
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [campuses,       setCampuses]       = useState([]);
  const [searchQuery,    setSearchQuery]    = useState('');

  // Guard against double-fetch in React StrictMode
  const fetchedRef = useRef(false);

  const navigate     = useNavigate();
  const { user }     = useContext(AuthContext);

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const handleOpen  = (campus) => { setSelectedCampus(campus); setOpen(true); };
  const handleClose = () => {
    setOpen(false);
    // Delay clearing so the exit animation completes
    setTimeout(() => setSelectedCampus(null), 300);
  };

  // ── Data fetch ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchCampuses = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/campus/all`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const body = await res.json();
        setCampuses(body.data || []);
      } catch (err) {
        console.error('AllCampus fetch error:', err);
      }
    };

    fetchCampuses();
  }, []);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filteredCampuses = campuses.filter(
    (c) =>
      c.campus_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.manager_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c._id?.includes(searchQuery),
  );

  // ── Campus isolation navigation ───────────────────────────────────────────

  /**
   * Navigate to a campus.
   * Client-side guard: CAMPUS_MANAGER is silently redirected to their own
   * campus if they attempt to visit a foreign one.
   * Real isolation is enforced server-side by CampusGuard + ProtectedRoute.
   */
  const handleVisitCampus = (campusId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { from: `/campus/${campusId}` } });
      return;
    }

    if (user?.role === 'CAMPUS_MANAGER') {
      const userCampusId = user?.id;
      if (userCampusId && userCampusId.toString() !== campusId.toString()) {
        navigate(`/campus/${userCampusId}`);
        return;
      }
    }

    navigate(`/campus/${campusId}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #001030 0%, #002060 50%, #001845 100%)',
        position: 'relative',
        overflow: 'hidden',
        pt: 10, // account for fixed navbar height
      }}
    >
      {/* Decorative arc rings */}
      {[500, 800, 1100].map((size) => (
        <Box key={size} sx={{
          position: 'absolute', width: size, height: size,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.03)',
          top: '20%', right: '-10%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }} />
      ))}

      <Box sx={{ position: 'relative', zIndex: 1, p: { xs: 2, sm: 3, md: 4 }, m: 1 }}>

        {/* ── Header ── */}
        <MotionBox
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          sx={{ mb: 4 }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2, mb: 3,
          }}>
            {/* Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MotionDiv
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <SchoolIcon sx={{ fontSize: 48, color: '#ffda78' }} />
              </MotionDiv>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    background: 'linear-gradient(135deg, #ffda78 0%, #ff7f3e 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 0.5,
                  }}
                >
                  Our Elite Campuses
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={`${campuses.length} Active Campuses`}
                    size="small"
                    sx={{
                      background: 'linear-gradient(135deg, #ff7f3e 0%, #ffda78 100%)',
                      color: 'white', fontWeight: 600,
                    }}
                  />
                  <Chip
                    label="Premium Network" size="small" variant="outlined"
                    sx={{ borderColor: '#4989c8', color: '#4989c8', fontWeight: 600 }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Search */}
            <TextField
              placeholder="Search a campus…"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  id: 'campus-search',
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#4989c8' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
                inputLabel: { htmlFor: 'campus-search' },
              }}
              sx={{
                minWidth: { xs: '100%', sm: 225, md: 320 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  '& fieldset': { border: 'none' },
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.09)' },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.35)' },
                  '& input': { color: 'white' },
                },
              }}
            />
          </Box>

          {/* Stats bar */}
          <MotionDiv initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Box sx={{
              display: 'flex', gap: 2, flexWrap: 'wrap', p: 3,
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
            }}>
              {[
                { icon: <LocationOnIcon />, label: 'Countries',    value: '12+',           color: '#4989c8' },
                { icon: <GroupsIcon />,     label: 'Students',     value: '10K+',          color: '#ffda78' },
                { icon: <PersonIcon />,     label: 'Campuses',     value: campuses.length, color: '#ff7f3e' },
                { icon: <TrendingUpIcon />, label: 'Success Rate', value: '98%',           color: '#4989c8' },
              ].map((stat, i) => (
                <MotionDiv key={i} whileHover={{ scale: 1.05 }} style={{ flex: 1, minWidth: 150 }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2,
                    background: `rgba(255,255,255,0.04)`,
                    border: `1px solid ${stat.color}30`,
                  }}>
                    <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: stat.color, lineHeight: 1.2 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                        {stat.label}
                      </Typography>
                    </Box>
                  </Box>
                </MotionDiv>
              ))}
            </Box>
          </MotionDiv>
        </MotionBox>

        {/* ── Campus grid ── */}
        <Grid container spacing={4} justifyContent="center" sx={{ mt: 1 }}>
          {filteredCampuses.map((campus, index) => (
            <Grid
              key={campus._id || index}
              size={{ xs: 12, sm: 12, md: 6, lg: 4 }}
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <MotionCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ y: -12 }}
                onClick={() => handleOpen(campus)}
                sx={{
                  borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                  width: '100%', maxWidth: { md: 420, lg: 460 },
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  transition: 'border-color 0.3s',
                  position: 'relative',
                  '&::before': {
                    content: '""', position: 'absolute',
                    top: 0, left: 0, right: 0, height: 3,
                    background: 'linear-gradient(90deg, #2a629a 0%, #4989c8 50%, #ff7f3e 100%)',
                    transform: 'scaleX(0)', transformOrigin: 'left',
                    transition: 'transform 0.3s ease',
                  },
                  '&:hover': { borderColor: 'rgba(255,218,120,0.25)' },
                  '&:hover::before': { transform: 'scaleX(1)' },
                }}
              >
                {/* Image */}
                <Box sx={{ position: 'relative', overflow: 'hidden', height: { xs: 200, md: 240 } }}>
                  <MotionDiv whileHover={{ scale: 1.08 }} transition={{ duration: 0.6 }} style={{ height: '100%' }}>
                    <CardMedia
                      component="img"
                      image={
                        campus.campus_image
                          ? `${IMAGE_BASE_URL}/uploads/campuses/${campus.campus_image}`
                          : '/hotel.jpg'
                      }
                      alt={campus.campus_name}
                      sx={{ height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = '/hotel.jpg'; }}
                    />
                  </MotionDiv>

                  {/* Overlay */}
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,16,48,0.95) 0%, rgba(0,16,48,0.4) 50%, transparent 100%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 2.5,
                  }}>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, fontFamily: '"Cormorant Garamond", Georgia, serif', mb: 0.5 }}>
                      {campus.campus_name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <LocationOnIcon sx={{ fontSize: 14, color: '#ffda78' }} />
                      <Typography variant="body2" sx={{ color: '#ffda78', fontWeight: 500, fontSize: '0.78rem' }}>
                        {campus.location?.city || 'Cameroon'} — {campus.location?.address || 'Yaoundé'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Premium badge */}
                  <Box sx={{
                    position: 'absolute', top: 14, right: 14,
                    background: 'rgba(0,18,48,0.75)', backdropFilter: 'blur(10px)',
                    borderRadius: 1.5, px: 1.5, py: 0.5,
                    border: '1px solid rgba(255,218,120,0.3)',
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#ffda78', fontSize: '0.7rem' }}>
                      ⭐ Premium
                    </Typography>
                  </Box>
                </Box>

                {/* Content */}
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{
                        width: 36, height: 36, fontWeight: 700, fontSize: '0.9rem',
                        background: 'linear-gradient(135deg, #2a629a 0%, #4989c8 100%)',
                      }}>
                        {campus.manager_name?.charAt(0) || 'M'}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                          Campus Manager
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                          {campus.manager_name}
                        </Typography>
                      </Box>
                    </Box>

                    <IconButton
                      size="small"
                      aria-label={`View details for ${campus.campus_name}`}
                      sx={{
                        background: 'linear-gradient(135deg, #4989c8, #2a629a)',
                        color: 'white',
                        '&:hover': { background: 'linear-gradient(135deg, #2a629a, #4989c8)' },
                      }}
                    >
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip size="small" label="Active"
                      sx={{ bgcolor: 'rgba(46,125,50,0.2)', color: '#81c784', fontWeight: 600, fontSize: '0.7rem', border: '1px solid rgba(129,199,132,0.2)' }}
                    />
                    <Chip size="small" label="Verified"
                      sx={{ bgcolor: 'rgba(21,101,192,0.2)', color: '#90caf9', fontWeight: 600, fontSize: '0.7rem', border: '1px solid rgba(144,202,249,0.2)' }}
                    />
                  </Box>
                </CardContent>
              </MotionCard>
            </Grid>
          ))}
        </Grid>

        {/* ── Empty state ── */}
        {filteredCampuses.length === 0 && (
          <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Box sx={{
              textAlign: 'center', p: 8, mt: 4, borderRadius: 4,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <SearchIcon sx={{ fontSize: 72, color: 'rgba(255,255,255,0.15)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>No campus found</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)' }}>Try a different search term</Typography>
            </Box>
          </MotionDiv>
        )}
      </Box>

      {/* ── Detail modal ── */}
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: { timeout: 500, sx: { backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,16,48,0.7)' } },
        }}
      >
        <MotionDiv
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        >
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95%', sm: '90%', md: 600 },
            maxHeight: '90vh',
            background: '#001845',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5,
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}>

            {/* Header image */}
            <Box sx={{ position: 'relative', height: 260, overflow: 'hidden' }}>
              <motion.img
                src={
                  selectedCampus?.campus_image
                    ? `${IMAGE_BASE_URL}/uploads/campuses/${selectedCampus.campus_image}`
                    : '/hotel.jpg'
                }
                alt={selectedCampus?.campus_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                initial={{ scale: 1.15 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6 }}
                onError={(e) => { e.target.src = '/hotel.jpg'; }}
              />
              <Box sx={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,24,69,0.95) 0%, transparent 50%)',
              }} />

              {/* Close */}
              <IconButton
                onClick={handleClose}
                aria-label="Close campus detail"
                sx={{
                  position: 'absolute', top: 14, right: 14,
                  bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
                  color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                  transition: 'all 0.25s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', transform: 'rotate(90deg)' },
                }}
              >
                <CloseIcon />
              </IconButton>

              {/* Name overlay */}
              <Box sx={{ position: 'absolute', bottom: 20, left: 24, right: 24 }}>
                <Typography variant="h4" sx={{
                  color: 'white', fontWeight: 800,
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  textShadow: '0 4px 12px rgba(0,0,0,0.5)', mb: 1,
                }}>
                  {selectedCampus?.campus_name}
                </Typography>
                <Chip
                  label="Elite Campus Network" size="small"
                  sx={{ background: 'linear-gradient(135deg, #ff7f3e 0%, #ffda78 100%)', color: 'white', fontWeight: 600 }}
                />
              </Box>
            </Box>

            {/* Info rows */}
            <Box sx={{ p: 3.5 }}>
              <Typography variant="h6" sx={{
                fontWeight: 700, mb: 2.5,
                background: 'linear-gradient(135deg, #ffda78 0%, #ff7f3e 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Campus Information
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { icon: <PersonIcon />,     label: 'Campus Manager', value: selectedCampus?.manager_name              || '—', color: '#4989c8' },
                  { icon: <EmailIcon />,      label: 'Contact Email',  value: selectedCampus?.email                     || '—', color: '#ffda78' },
                  { icon: <PhoneIcon />,      label: 'Phone Number',   value: selectedCampus?.manager_phone             || '—', color: '#ff7f3e' },
                  { icon: <LocationOnIcon />, label: 'Location',       value: formatLocation(selectedCampus?.location),         color: '#4989c8' },
                ].map((item, i) => (
                  <MotionDiv
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                  >
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 2, p: 1.75, borderRadius: 2,
                      background: `rgba(255,255,255,0.04)`,
                      border: `1px solid ${item.color}22`,
                      transition: 'all 0.25s',
                      '&:hover': {
                        background: `${item.color}12`,
                        transform: 'translateX(6px)',
                      },
                    }}>
                      <Avatar sx={{ bgcolor: `${item.color}20`, color: item.color, width: 40, height: 40 }}>
                        {item.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', fontWeight: 600 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>
                          {item.value}
                        </Typography>
                      </Box>
                    </Box>
                  </MotionDiv>
                ))}
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  fullWidth variant="contained"
                  onClick={() => { handleClose(); handleVisitCampus(selectedCampus?._id); }}
                  sx={{
                    background: 'linear-gradient(135deg, #2a629a 0%, #4989c8 100%)',
                    borderRadius: 2.5, py: 1.4, fontWeight: 600,
                    textTransform: 'none', fontSize: '0.95rem',
                    boxShadow: '0 4px 16px rgba(42,98,154,0.4)',
                    '&:hover': { boxShadow: '0 6px 24px rgba(42,98,154,0.5)' },
                  }}
                >
                  Visit Campus
                </Button>
                <Button
                  fullWidth variant="outlined"
                  onClick={handleClose}
                  sx={{
                    borderRadius: 2.5, py: 1.4, fontWeight: 600,
                    textTransform: 'none', fontSize: '0.95rem',
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.35)', bgcolor: 'rgba(255,255,255,0.05)' },
                  }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          </Box>
        </MotionDiv>
      </Modal>
    </Box>
  );
}