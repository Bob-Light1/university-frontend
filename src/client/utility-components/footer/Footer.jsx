/**
 * @file Footer.jsx
 * @description Public site footer.
 *   Palette aligned with the "Luxury Observatory" dark theme from Home.jsx.
 *   Admin portal access: triple-click on the logo mark → navigates to /admin.
 *   This interaction is invisible to ordinary users (no label, no link).
 *
 *   Features:
 *   - Brand section with animated logo (triple-click easter egg for admin access)
 *   - Quick links (react-router navigation, no full page reloads)
 *   - Contact info
 *   - Social icons
 *   - Privacy / Terms / Cookies bar
 */

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Email,
  Phone,
  LocationOn,
  Facebook,
  Twitter,
  LinkedIn,
  Instagram,
} from '@mui/icons-material';

// ─── Nav links (must stay in sync with Navbar.jsx) ───────────────────────────

const QUICK_LINKS = [
  { label: 'Home',     href: '/'          },
  { label: 'Campuses', href: '/allcampus' },
  { label: 'Login',    href: '/login'     },
  { label: 'About',    href: '#'          },
];

const SOCIAL = [
  { icon: <Facebook  />, color: '#1877f2', label: 'Facebook'  },
  { icon: <Twitter   />, color: '#1da1f2', label: 'Twitter'   },
  { icon: <LinkedIn  />, color: '#0a66c2', label: 'LinkedIn'  },
  { icon: <Instagram />, color: '#e4405f', label: 'Instagram' },
];

const LEGAL = ['Privacy', 'Terms', 'Cookies'];

// ─── Inline logo mark (same as Navbar) ───────────────────────────────────────

const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 36 36" fill="none"
    xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="18" cy="18" r="15.5" stroke="url(#ft-lg1)" strokeWidth="1.4" />
    <ellipse cx="18" cy="18" rx="15.5" ry="5.5"
      stroke="url(#ft-lg1)" strokeWidth="1.1" strokeDasharray="2.5 2" />
    <line x1="18" y1="2.5" x2="18" y2="33.5" stroke="url(#ft-lg1)" strokeWidth="1.1" />
    <path d="M18 12.5 L22.5 18 L18 23.5 L13.5 18 Z" fill="url(#ft-lg2)" />
    <circle cx="18" cy="18" r="1.5" fill="white" opacity="0.9" />
    <defs>
      <linearGradient id="ft-lg1" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#4989c8" />
        <stop offset="100%" stopColor="#ffda78" />
      </linearGradient>
      <linearGradient id="ft-lg2" x1="13.5" y1="12.5" x2="22.5" y2="23.5" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#ffda78" />
        <stop offset="100%" stopColor="#ff7f3e" />
      </linearGradient>
    </defs>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Footer = () => {
  const navigate = useNavigate();

  // Triple-click counter for hidden admin access
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);

  /**
   * Secret admin access via triple-click on the logo mark.
   * - 3 rapid clicks within 600 ms → navigate to /admin
   * - No tooltip, no label, no visual indicator — invisible to regular users.
   * - Real security is enforced server-side; this is just a UX gate.
   */
  const handleLogoClick = () => {
    clickCountRef.current += 1;

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      navigate('/admin');
      return;
    }

    // Reset counter after 600 ms of inactivity
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 600);
  };

  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(160deg, #001030 0%, #002060 60%, #001845 100%)',
        color: 'white',
        pt: 7,
        pb: 3,
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Decorative arcs */}
      {[500, 750, 1000].map((size) => (
        <Box
          key={size}
          sx={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.03)',
            top: '50%',
            right: '-15%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        />
      ))}

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={5}>

          {/* ── Brand column ── */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            {/* Logo — triple-click activates admin route */}
            <Box
              onClick={handleLogoClick}
              sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1.5,
                mb: 2.5, cursor: 'default', userSelect: 'none',
              }}
              aria-label="Brand logo"
            >
              <Box sx={{
                filter: 'drop-shadow(0 0 6px rgba(73,137,200,0.3))',
                lineHeight: 0,
              }}>
                <LogoMark />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontSize: '1.2rem', fontWeight: 700, lineHeight: 1,
                    color: 'white',
                  }}
                >
                  wewi<Box component="span" sx={{
                    background: 'linear-gradient(90deg, #ffda78, #ff7f3e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>go</Box>
                </Typography>
                <Typography sx={{
                  fontSize: '0.6rem', letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
                  mt: 0.25,
                }}>
                  Elite Services
                </Typography>
              </Box>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.85,
                maxWidth: 300,
                fontFamily: '"DM Sans", sans-serif',
              }}
            >
              A comprehensive premium platform for international education,
              immigration strategy, and campus management.
            </Typography>

            {/* Social icons */}
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              {SOCIAL.map(({ icon, color, label }) => (
                <Tooltip key={label} title={label} placement="top">
                  <IconButton
                    aria-label={label}
                    size="small"
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 1.5,
                      p: 0.8,
                      transition: 'all 0.25s',
                      '&:hover': {
                        color: 'white',
                        bgcolor: color,
                        borderColor: color,
                        transform: 'translateY(-3px)',
                        boxShadow: `0 6px 20px ${color}55`,
                      },
                    }}
                  >
                    {icon}
                  </IconButton>
                </Tooltip>
              ))}
            </Box>
          </Grid>

          {/* ── Quick links ── */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block', mb: 2.5,
                fontSize: '0.65rem', letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.35)', fontWeight: 700,
              }}
            >
              Navigation
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {QUICK_LINKS.map(({ label, href }) => (
                <Typography
                  key={label}
                  component="button"
                  onClick={() => navigate(href)}
                  variant="body2"
                  sx={{
                    background: 'none', border: 'none',
                    textAlign: 'left', cursor: 'pointer', p: 0,
                    color: 'rgba(255,255,255,0.5)',
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.875rem',
                    transition: 'color 0.2s, padding-left 0.2s',
                    '&:hover': {
                      color: '#ffda78',
                      paddingLeft: '6px',
                    },
                  }}
                >
                  {label}
                </Typography>
              ))}
            </Box>
          </Grid>

          {/* ── Contact ── */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block', mb: 2.5,
                fontSize: '0.65rem', letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.35)', fontWeight: 700,
              }}
            >
              Contact
            </Typography>

            {[
              { icon: <Email sx={{ fontSize: 15 }} />,       text: 'contact@wewigo.com'  },
              { icon: <Phone sx={{ fontSize: 15 }} />,       text: '+237 6XX XXX XXX'    },
              { icon: <LocationOn sx={{ fontSize: 15 }} />,  text: 'Yaoundé, Cameroon'   },
            ].map(({ icon, text }) => (
              <Box
                key={text}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  mb: 1.5,
                }}
              >
                <Box sx={{
                  width: 28, height: 28, borderRadius: 1,
                  background: 'rgba(73,137,200,0.12)',
                  border: '1px solid rgba(73,137,200,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#4989c8', flexShrink: 0,
                }}>
                  {icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.5)', fontFamily: '"DM Sans", sans-serif' }}
                >
                  {text}
                </Typography>
              </Box>
            ))}
          </Grid>

          {/* ── Newsletter placeholder ── */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography
              variant="overline"
              sx={{
                display: 'block', mb: 2.5,
                fontSize: '0.65rem', letterSpacing: '0.2em',
                color: 'rgba(255,255,255,0.35)', fontWeight: 700,
              }}
            >
              Stay Updated
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.5)', lineHeight: 1.8,
                mb: 2.5, fontFamily: '"DM Sans", sans-serif',
              }}
            >
              Subscribe to our newsletter for the latest news, campus updates,
              and immigration insights.
            </Typography>

            {/* Simple email row */}
            <Box sx={{
              display: 'flex',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 1.5, overflow: 'hidden',
            }}>
              <Box
                component="input"
                type="email"
                placeholder="your@email.com"
                sx={{
                  flex: 1, border: 'none', outline: 'none',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  color: 'white', px: 1.5, py: 1,
                  fontSize: '0.8rem',
                  fontFamily: '"DM Sans", sans-serif',
                  '&::placeholder': { color: 'rgba(255,255,255,0.25)' },
                }}
              />
              <Box
                component="button"
                sx={{
                  border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #ff7f3e, #e05a20)',
                  color: 'white', px: 1.8,
                  fontSize: '0.75rem', fontWeight: 600,
                  fontFamily: '"DM Sans", sans-serif',
                  transition: 'opacity 0.2s',
                  '&:hover': { opacity: 0.88 },
                }}
              >
                Join
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ── Bottom bar ── */}
        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 2,
        }}>
          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.28)', fontFamily: '"DM Sans", sans-serif', fontSize: '0.78rem' }}
          >
            © {new Date().getFullYear()} wewigo Elite Services. All rights reserved.
          </Typography>

          <Box sx={{ display: 'flex', gap: 3 }}>
            {LEGAL.map((item) => (
              <Typography
                key={item}
                component="button"
                variant="body2"
                onClick={() => {}}
                sx={{
                  background: 'none', border: 'none', cursor: 'pointer', p: 0,
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.28)',
                  transition: 'color 0.2s',
                  '&:hover': { color: 'rgba(255,255,255,0.65)' },
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;