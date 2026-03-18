/**
 * @file Navbar.jsx
 * @description Public-facing navigation bar — used on the marketing/home pages.
 *   Fully separate from the authenticated layout NavBars (AppNavBar.jsx).
 *
 *   FIX: Top state now uses a dark gradient overlay so the nav links are
 *        always legible, even when sitting on top of a dark hero background.
 *        The gradient feathers downward so it blends invisibly with the hero.
 *
 *   LOGO: Replaced the plain letter with an inline SVG "compass globe" mark
 *         that is fully cohesive with the brand palette.
 *
 *   Dependencies: react-router-dom, framer-motion, @mui/icons-material
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MenuIcon         from '@mui/icons-material/Menu';
import CloseIcon        from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '/',          label: 'Home'     },
  { href: '/allcampus', label: 'Campuses' },
  { href: '/login',     label: 'Login'    },
];

// ─── SVG Logo mark ────────────────────────────────────────────────────────────
/**
 * Abstract "compass / globe" motif:
 *  - Outer circle (world boundary)
 *  - Dashed equatorial ellipse (globe arc)
 *  - Vertical meridian line
 *  - Diamond center (compass rose)
 * All strokes use a blue→gold gradient. The diamond fill uses gold→orange.
 */
const LogoMark = () => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    {/* Outer ring */}
    <circle cx="18" cy="18" r="15.5" stroke="url(#nb-lg1)" strokeWidth="1.4" />

    {/* Equatorial arc (dashed ellipse) */}
    <ellipse cx="18" cy="18" rx="15.5" ry="5.5"
      stroke="url(#nb-lg1)" strokeWidth="1.1" strokeDasharray="2.5 2" />

    {/* Vertical meridian */}
    <line x1="18" y1="2.5" x2="18" y2="33.5"
      stroke="url(#nb-lg1)" strokeWidth="1.1" />

    {/* Compass diamond center */}
    <path d="M18 12.5 L22.5 18 L18 23.5 L13.5 18 Z"
      fill="url(#nb-lg2)" />

    {/* Tiny center dot */}
    <circle cx="18" cy="18" r="1.5" fill="white" opacity="0.9" />

    <defs>
      <linearGradient id="nb-lg1" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#4989c8" />
        <stop offset="100%" stopColor="#ffda78" />
      </linearGradient>
      <linearGradient id="nb-lg2" x1="13.5" y1="12.5" x2="22.5" y2="23.5" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stopColor="#ffda78" />
        <stop offset="100%" stopColor="#ff7f3e" />
      </linearGradient>
    </defs>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Navbar = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Detect scroll — switch navbar visual state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll(); // run immediately on mount
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu whenever the route changes
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {/* ── Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap');

        /* ─────────────────────────────────────────────────────────────
           ROOT BAR
           Two visual states driven by the .top / .scrolled classes:

           .top
             A downward gradient that is dark at the bar itself and fades
             to transparent, creating a "shade" that makes white text
             perfectly legible against ANY hero background colour below.
             The extra padding-bottom lets the gradient tail reach below
             the 70 px bar so the fade looks natural on the page.

           .scrolled
             Solid glass morphism panel — backdrop-blur + dark tint.
        ───────────────────────────────────────────────────────────── */
        .navbar-root {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1200;
          font-family: 'DM Sans', sans-serif;
          transition:
            background   0.45s ease,
            box-shadow   0.45s ease,
            padding-bottom 0.45s ease;
        }

        /* Always-visible dark shade — feathers downward */
        .navbar-root.top {
          background: linear-gradient(
            to bottom,
            rgba(0, 16, 50, 0.88) 0%,
            rgba(0, 16, 50, 0.50) 55%,
            rgba(0, 16, 50, 0.00) 100%
          );
          padding-bottom: 28px; /* extend gradient below the 70px bar */
          box-shadow: none;
        }

        /* Solid glass on scroll */
        .navbar-root.scrolled {
          background: rgba(0, 18, 50, 0.94);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow:
            0 1px 0 rgba(255,255,255,0.07),
            0 8px 32px rgba(0,0,0,0.35);
          padding-bottom: 0;
        }

        /* ─── Inner layout ─── */
        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
          height: 70px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        /* ─── Logo ─── */
        .nav-logo {
          display: flex; align-items: center; gap: 10px;
          cursor: pointer; flex-shrink: 0;
          text-decoration: none; border: none; background: none;
        }
        .nav-logo-mark {
          line-height: 0;
          filter: drop-shadow(0 0 6px rgba(73,137,200,0.35));
          transition: filter 0.3s ease, transform 0.3s ease;
        }
        .nav-logo:hover .nav-logo-mark {
          filter: drop-shadow(0 0 14px rgba(255,218,120,0.55));
          transform: scale(1.07) rotate(-5deg);
        }
        .nav-logo-wordmark {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.3rem; font-weight: 700; letter-spacing: 0.02em;
          color: white;
          /* subtle shadow so it reads on both .top and .scrolled */
          text-shadow: 0 1px 8px rgba(0,0,0,0.5);
        }
        .nav-logo-wordmark em {
          font-style: normal;
          background: linear-gradient(90deg, #ffda78, #ff7f3e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ─── Desktop links ─── */
        .nav-links {
          display: flex; align-items: center; gap: 2px;
          margin-left: auto;
          list-style: none; padding: 0; margin-bottom: 0;
        }
        .nav-link-item button {
          display: block;
          padding: 7px 16px; border-radius: 6px;
          font-size: 0.875rem; font-weight: 500;
          /* Raised opacity (0.88) + text-shadow = always legible on dark hero */
          color: rgba(255,255,255,0.88);
          text-shadow: 0 1px 4px rgba(0,0,0,0.55);
          border: none; background: none;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: color 0.2s, background 0.2s;
          position: relative; white-space: nowrap;
        }
        .nav-link-item button:hover {
          color: white;
          background: rgba(255,255,255,0.09);
        }
        /* Active indicator */
        .nav-link-item.active button { color: white; }
        .nav-link-item.active button::after {
          content: '';
          position: absolute; bottom: 2px; left: 50%;
          transform: translateX(-50%);
          width: 18px; height: 2px;
          background: linear-gradient(90deg, #ffda78, #ff7f3e);
          border-radius: 2px;
          box-shadow: 0 0 8px rgba(255,218,120,0.7);
        }

        /* ─── Primary CTA ─── */
        .nav-cta {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 22px; border-radius: 5px;
          background: linear-gradient(135deg, #ff7f3e, #e05a20);
          color: white; font-weight: 600; font-size: 0.875rem;
          border: none; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 20px rgba(255,127,62,0.40);
          white-space: nowrap; flex-shrink: 0;
        }
        .nav-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(255,127,62,0.52);
        }
        .nav-cta:active { transform: translateY(0); }

        /* ─── Mobile hamburger ─── */
        .nav-hamburger {
          display: none; margin-left: auto;
          background: rgba(255,255,255,0.10);
          border: 1px solid rgba(255,255,255,0.20);
          color: white; border-radius: 8px;
          padding: 6px; cursor: pointer; line-height: 0;
          transition: background 0.2s;
        }
        .nav-hamburger:hover { background: rgba(255,255,255,0.18); }

        /* ─── Mobile overlay ─── */
        .nav-mobile-overlay {
          position: fixed; inset: 0; z-index: 1199;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(5px);
        }

        /* ─── Mobile drawer ─── */
        .nav-mobile-drawer {
          position: fixed; top: 0; right: 0; bottom: 0;
          width: min(320px, 85vw); z-index: 1201;
          background: #001845;
          border-left: 1px solid rgba(255,255,255,0.09);
          padding: 24px;
          display: flex; flex-direction: column;
        }
        .nav-mobile-close {
          align-self: flex-end;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: white; border-radius: 8px;
          padding: 6px; cursor: pointer; line-height: 0;
          margin-bottom: 32px;
        }
        .nav-mobile-links {
          list-style: none; padding: 0; margin: 0; flex: 1;
        }
        .nav-mobile-links li {
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .nav-mobile-links li button {
          display: block; width: 100%;
          padding: 18px 4px; text-align: left;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.5rem; font-weight: 600;
          color: rgba(255,255,255,0.72);
          border: none; background: none; cursor: pointer;
          transition: color 0.2s, padding-left 0.2s;
        }
        .nav-mobile-links li button:hover { color: white; padding-left: 8px; }
        .nav-mobile-links li.active button {
          background: linear-gradient(90deg, #ffda78, #ff7f3e);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          padding-left: 8px;
        }

        /* ─── Responsive ─── */
        @media (max-width: 768px) {
          .nav-links            { display: none !important; }
          .nav-cta.desktop-only { display: none !important; }
          .nav-hamburger        { display: block; }
          .nav-inner            { padding: 0 20px; }
        }
      `}</style>

      {/* ── AppBar ── */}
      <nav
        className={`navbar-root ${scrolled ? 'scrolled' : 'top'}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="nav-inner">

          {/* Logo */}
          <button
            className="nav-logo"
            onClick={() => navigate('/')}
            aria-label="Go to homepage"
          >
            <span className="nav-logo-mark">
              <LogoMark />
            </span>
            <span className="nav-logo-wordmark">
              wewi<em>go</em>
            </span>
          </button>

          {/* Desktop links */}
          <ul className="nav-links" aria-label="Navigation links">
            {NAV_LINKS.map(({ href, label }) => (
              <li
                key={href}
                className={`nav-link-item ${isActive(href) ? 'active' : ''}`}
              >
                <button
                  onClick={() => navigate(href)}
                  aria-current={isActive(href) ? 'page' : undefined}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>

          {/* Desktop CTA */}
          <button
            className="nav-cta desktop-only"
            onClick={() => navigate('/login')}
            aria-label="Access member area"
          >
            Member Area <ArrowForwardIcon style={{ fontSize: 16 }} />
          </button>

          {/* Mobile hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-drawer"
          >
            <MenuIcon style={{ fontSize: 22 }} />
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="nav-mobile-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              id="mobile-nav-drawer"
              className="nav-mobile-drawer"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              role="dialog" aria-modal="true" aria-label="Navigation menu"
            >
              <button
                className="nav-mobile-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
              >
                <CloseIcon style={{ fontSize: 22 }} />
              </button>

              <ul className="nav-mobile-links">
                {NAV_LINKS.map(({ href, label }) => (
                  <li key={href} className={isActive(href) ? 'active' : ''}>
                    <button
                      onClick={() => navigate(href)}
                      aria-current={isActive(href) ? 'page' : undefined}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>

              <button
                className="nav-cta"
                style={{ width: '100%', marginTop: 32, justifyContent: 'center' }}
                onClick={() => navigate('/login')}
              >
                Member Area <ArrowForwardIcon style={{ fontSize: 16 }} />
              </button>

              <p style={{
                marginTop: 24, fontSize: '0.72rem',
                color: 'rgba(255,255,255,0.25)',
                textAlign: 'center', fontFamily: 'DM Sans, sans-serif',
              }}>
                © {new Date().getFullYear()} wewigo Elite Services
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;