/**
 * @file Home.jsx
 * @description Public landing page — "Luxury Observatory" aesthetic.
 *   Dark navy foundation, gold/amber accents, serif display typography,
 *   geometric light arcs, framer-motion orchestration.
 *
 *   Dependencies (already in project):
 *     framer-motion, react-router-dom, @mui/icons-material
 *
 *   Google Fonts loaded via <style> injection:
 *     - "Cormorant Garamond" (display / headings)
 *     - "DM Sans" (body copy)
 */

import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowForward,
  School,
  Public,
  VerifiedUser,
  SupportAgent,
  KeyboardArrowDown,
  PlayArrow,
  East,
} from '@mui/icons-material';

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// ─── Reusable animated counter ────────────────────────────────────────────────

const AnimatedNumber = ({ target, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref    = useRef(null);
  const isView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isView) return;
    const numeric = parseInt(target.replace(/\D/g, ''), 10);
    if (!numeric) { setCount(target); return; }
    let start = 0;
    const duration = 1800;
    const step = Math.ceil(numeric / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= numeric) { setCount(target); clearInterval(timer); }
      else setCount(start + suffix);
    }, 16);
    return () => clearInterval(timer);
  }, [isView, target, suffix]);

  return <span ref={ref}>{count || 0}</span>;
};

// ─── DATA ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '15K+', label: 'Alumni Worldwide',  icon: School },
  { value: '60+',  label: 'Global Campuses',   icon: Public },
  { value: '99%',  label: 'Visa Success Rate', icon: VerifiedUser },
  { value: '24/7', label: 'VIP Concierge',     icon: SupportAgent },
];

const PROGRAMS = [
  {
    num: '01',
    icon: '🏛️',
    title:   'University Placement',
    sub:     'Global Academic Access',
    desc:    'Exclusive pathways to Ivy League, Oxbridge, and top-ranked institutions worldwide — curated for exceptional candidates.',
    accent:  '#4989c8',
  },
  {
    num: '02',
    icon: '🛂',
    title:   'Visa Strategy',
    sub:     'Premium Legal Navigation',
    desc:    'Complex immigration pathways made seamless. Our specialists craft tailor-made legal strategies with near-perfect success.',
    accent:  '#ff7f3e',
  },
  {
    num: '03',
    icon: '💼',
    title:   'Career Architecture',
    sub:     'Executive Mentorship',
    desc:    'Connect with a global network of industry leaders, securing high-impact roles across 50+ countries.',
    accent:  '#ffda78',
  },
  {
    num: '04',
    icon: '🌍',
    title:   'Cultural Integration',
    sub:     'Language & Adaptation',
    desc:    'Immersive cultural programs and language mastery designed to ensure a smooth, confident transition abroad.',
    accent:  '#4989c8',
  },
];

const TESTIMONIALS = [
  {
    quote:  'The level of expertise and care invested in my file was unparalleled. This team doesn\'t just process applications — they architect futures.',
    author: 'Jean-Pierre N.',
    role:   'MBA Graduate · INSEAD, France',
    initial:'J',
  },
  {
    quote:  'From visa strategy to university placement, every step was handled with surgical precision. I felt like a priority, not a client.',
    author: 'Dr. Sarah L.',
    role:   'Medical Practitioner · Toronto, Canada',
    initial:'S',
  },
  {
    quote:  'ProjetLagno gave my daughter access to opportunities I couldn\'t even imagine. Worth every single investment.',
    author: 'Mr. Emmanuel K.',
    role:   'Parent · Lagos, Nigeria',
    initial:'E',
  },
];

const CAMPUSES = [
  { city: 'Paris',    country: 'France',  students: '3,500+', emoji: '🗼' },
  { city: 'New York', country: 'USA',     students: '4,200+', emoji: '🗽' },
  { city: 'Toronto',  country: 'Canada',  students: '2,800+', emoji: '🍁' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const Home = () => {
  const navigate           = useNavigate();
  const heroRef            = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY              = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const heroOpacity        = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      {/* ── Google Fonts injection ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        :root {
          --navy:   #003285;
          --navy2:  #002060;
          --blue:   #4989c8;
          --blue2:  #2a629a;
          --orange: #ff7f3e;
          --gold:   #ffda78;
          --cream:  #fdf8f0;
          --white:  #ffffff;
        }

        * { box-sizing: border-box; }

        .home-root {
          font-family: 'DM Sans', sans-serif;
          background: var(--navy2);
          color: var(--white);
          overflow-x: hidden;
        }

        .display-font { font-family: 'Cormorant Garamond', Georgia, serif; }

        /* ── Geometric arc decoration ── */
        .arc-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          pointer-events: none;
        }

        /* ── Glowing underline on headings ── */
        .glow-line {
          display: inline-block;
          position: relative;
        }
        .glow-line::after {
          content: '';
          position: absolute;
          left: 0; bottom: -4px;
          width: 100%; height: 2px;
          background: linear-gradient(90deg, var(--gold), var(--orange));
          border-radius: 2px;
          box-shadow: 0 0 12px var(--gold);
        }

        /* ── Gold gradient text ── */
        .gold-text {
          background: linear-gradient(135deg, var(--gold) 0%, var(--orange) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Primary CTA button ── */
        .btn-primary {
          position: relative;
          display: inline-flex; align-items: center; gap: 10px;
          padding: 16px 36px;
          background: linear-gradient(135deg, var(--orange), #e05a20);
          color: white; font-family: 'DM Sans', sans-serif;
          font-weight: 600; font-size: 1rem;
          border: none; border-radius: 4px;
          cursor: pointer; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 32px rgba(255,127,62,0.35);
          letter-spacing: 0.02em;
        }
        .btn-primary::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(255,127,62,0.4); }
        .btn-primary:hover::before { opacity: 1; }
        .btn-primary:active { transform: translateY(0); }

        /* ── Ghost CTA button ── */
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 15px 35px;
          background: transparent;
          color: rgba(255,255,255,0.85);
          font-family: 'DM Sans', sans-serif;
          font-weight: 500; font-size: 1rem;
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 4px; cursor: pointer;
          transition: all 0.3s;
          letter-spacing: 0.02em;
        }
        .btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.5);
          color: white;
        }

        /* ── Section separator ── */
        .sep-line {
          width: 48px; height: 2px;
          background: linear-gradient(90deg, var(--gold), var(--orange));
          border-radius: 2px;
          box-shadow: 0 0 10px var(--gold);
        }

        /* ── Card hover lift ── */
        .card-lift { transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s; }
        .card-lift:hover { transform: translateY(-8px); }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: var(--navy2); }
        ::-webkit-scrollbar-thumb { background: var(--blue2); border-radius: 3px; }
      `}</style>

      <div className="home-root">

        {/* ══════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          style={{
            position: 'relative',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #002060 0%, #003285 45%, #001845 100%)',
          }}
        >
          {/* Arc rings — decorative geometry */}
          {[600, 900, 1200, 1500].map((size, i) => (
            <div
              key={size}
              className="arc-ring"
              style={{
                width: size, height: size,
                top: '50%', left: '60%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.04 + i * 0.01,
              }}
            />
          ))}

          {/* Gold blob top-right */}
          <div style={{
            position: 'absolute', top: '-10%', right: '-5%',
            width: 600, height: 600,
            background: 'radial-gradient(ellipse, rgba(255,218,120,0.12) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />

          {/* Orange blob bottom-left */}
          <div style={{
            position: 'absolute', bottom: '-10%', left: '-5%',
            width: 500, height: 500,
            background: 'radial-gradient(ellipse, rgba(255,127,62,0.10) 0%, transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />

          {/* Star-field */}
          {[...Array(60)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
                borderRadius: '50%',
                background: 'white',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.5 + 0.1,
              }}
              animate={{ opacity: [0.1, 0.6, 0.1] }}
              transition={{ duration: Math.random() * 4 + 2, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}

          <motion.div
            style={{ y: heroY, opacity: heroOpacity, width: '100%' }}
          >
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>

              {/* LEFT — copy */}
              <motion.div variants={stagger} initial="hidden" animate="visible">

                {/* Badge */}
                <motion.div variants={fadeUp} style={{ marginBottom: 28 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 18px',
                    border: '1px solid rgba(255,218,120,0.4)',
                    borderRadius: 2,
                    background: 'rgba(255,218,120,0.08)',
                    fontSize: '0.7rem', fontWeight: 600,
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: 'var(--gold)',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', boxShadow: '0 0 8px var(--gold)' }} />
                    Premier Immigration Academy
                  </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                  variants={fadeUp}
                  className="display-font"
                  style={{ fontSize: 'clamp(2.8rem, 5vw, 4.4rem)', fontWeight: 700, lineHeight: 1.1, margin: '0 0 12px' }}
                >
                  Your Future,
                  <br />
                  <span className="gold-text">Without Borders.</span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="display-font"
                  style={{ fontSize: '1.35rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.55)', marginBottom: 28, lineHeight: 1.5 }}
                >
                  We don't process files. We architect destinies.
                </motion.p>

                <motion.p
                  variants={fadeUp}
                  style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, maxWidth: 480, marginBottom: 44 }}
                >
                  ProjetLagno is the world's most trusted platform for international education,
                  immigration strategy, and career excellence — serving ambitious minds across 60+ nations.
                </motion.p>

                {/* CTAs */}
                <motion.div variants={fadeUp} style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => navigate('/login')}>
                    Begin Your Journey <ArrowForward style={{ fontSize: 18 }} />
                  </button>
                  <button className="btn-ghost" onClick={() => navigate('/allcampus')}>
                    <PlayArrow style={{ fontSize: 18 }} /> Explore Campuses
                  </button>
                </motion.div>

                {/* Micro proof */}
                <motion.div
                  variants={fadeUp}
                  style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 44 }}
                >
                  <div style={{ display: 'flex' }}>
                    {['#4989c8','#2a629a','#ff7f3e','#ffda78'].map((c, i) => (
                      <div key={c} style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: c, border: '2px solid #001845',
                        marginLeft: i > 0 ? -10 : 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
                    Joined by <strong style={{ color: 'var(--gold)' }}>15,000+</strong> students worldwide
                  </p>
                </motion.div>
              </motion.div>

              {/* RIGHT — floating card mosaic */}
              <motion.div
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                style={{ position: 'relative', height: 500 }}
              >
                {/* Main card */}
                <div style={{
                  position: 'absolute', top: '10%', left: '5%', right: '5%',
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: 32,
                  boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
                }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16 }}>
                    🌍 Global Reach
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                    {CAMPUSES.map((c) => (
                      <div key={c.city} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 6 }}>{c.emoji}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{c.city}</div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>{c.country}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gold)', marginTop: 4 }}>{c.students}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating stat cards */}
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', bottom: '12%', left: '-4%',
                    background: 'linear-gradient(135deg, #ff7f3e, #e05a20)',
                    borderRadius: 12, padding: '14px 20px',
                    boxShadow: '0 20px 40px rgba(255,127,62,0.35)',
                  }}
                >
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Cormorant Garamond, serif' }}>99%</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Visa Success Rate</div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  style={{
                    position: 'absolute', top: '2%', right: '-4%',
                    background: 'linear-gradient(135deg, rgba(73,137,200,0.9), rgba(42,98,154,0.9))',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 12, padding: '14px 20px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                  }}
                >
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Cormorant Garamond, serif' }}>60+</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>Countries Served</div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              opacity: 0.5, cursor: 'pointer',
            }}
            onClick={() => window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' })}
          >
            <span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Scroll</span>
            <KeyboardArrowDown style={{ fontSize: 20 }} />
          </motion.div>
        </section>

        {/* ══════════════════════════════════════════════
            STATS BAR
        ══════════════════════════════════════════════ */}
        <section style={{
          background: 'linear-gradient(90deg, #002875, #003899)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '48px 32px',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
            {STATS.map(({ value, label, icon: Icon }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center', padding: '8px 0' }}
              >
                <Icon style={{ fontSize: 28, color: 'var(--gold)', marginBottom: 10, opacity: 0.85 }} />
                <div className="display-font gold-text" style={{ fontSize: '2.8rem', fontWeight: 700, lineHeight: 1 }}>
                  <AnimatedNumber target={value} />
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            PROGRAMS
        ══════════════════════════════════════════════ */}
        <section style={{ padding: '120px 32px', background: '#001845' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>

            {/* Section header */}
            <motion.div
              initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: true }}
              style={{ marginBottom: 72 }}
            >
              <motion.div variants={fadeUp} style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--orange)' }}>
                  Our Services
                </span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="display-font" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 700, margin: '0 0 16px', maxWidth: 600 }}>
                World-Class Solutions <br />
                <span className="glow-line gold-text">For Global Leaders</span>
              </motion.h2>
              <motion.div variants={fadeUp} className="sep-line" />
            </motion.div>

            {/* Program grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
              {PROGRAMS.map((prog, i) => (
                <motion.div
                  key={prog.num}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  viewport={{ once: true }}
                  className="card-lift"
                  style={{
                    position: 'relative',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 12, padding: 40,
                    overflow: 'hidden', cursor: 'pointer',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.2)',
                  }}
                  whileHover={{
                    background: 'rgba(255,255,255,0.055)',
                    borderColor: prog.accent + '55',
                    boxShadow: `0 8px 48px rgba(0,0,0,0.3), 0 0 0 1px ${prog.accent}33`,
                  }}
                >
                  {/* Number watermark */}
                  <div className="display-font" style={{
                    position: 'absolute', top: 16, right: 24,
                    fontSize: '5rem', fontWeight: 700, lineHeight: 1,
                    color: 'rgba(255,255,255,0.03)', userSelect: 'none',
                  }}>
                    {prog.num}
                  </div>

                  {/* Accent dot */}
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: prog.accent, marginBottom: 20, boxShadow: `0 0 12px ${prog.accent}` }} />

                  <div style={{ fontSize: '2.2rem', marginBottom: 16 }}>{prog.icon}</div>

                  <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: prog.accent, marginBottom: 8 }}>
                    {prog.sub}
                  </div>

                  <h3 className="display-font" style={{ fontSize: '1.55rem', fontWeight: 600, margin: '0 0 14px', lineHeight: 1.2 }}>
                    {prog.title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, margin: 0 }}>
                    {prog.desc}
                  </p>

                  <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600, color: prog.accent }}>
                    Learn more <East style={{ fontSize: 14 }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            WHO WE SERVE
        ══════════════════════════════════════════════ */}
        <section style={{
          padding: '120px 32px',
          background: 'linear-gradient(160deg, #002060 0%, #001030 100%)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Large arc behind content */}
          <div style={{
            position: 'absolute', top: '-50%', right: '-20%',
            width: 1000, height: 1000, borderRadius: '50%',
            border: '1px solid rgba(73,137,200,0.08)',
            pointerEvents: 'none',
          }} />

          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <motion.div initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: true }} style={{ marginBottom: 72, textAlign: 'center' }}>
              <motion.div variants={fadeUp} style={{ marginBottom: 12 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold)' }}>Our Community</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="display-font" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 700, margin: '0 0 16px' }}>
                Designed for <span className="gold-text">Every Stakeholder</span>
              </motion.h2>
              <motion.div variants={fadeUp} className="sep-line" style={{ margin: '0 auto' }} />
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { icon: '👔', title: 'Directors & Managers', points: ['Multi-campus governance','Real-time analytics','Staff & resource oversight'], color: 'var(--blue)' },
                { icon: '📚', title: 'Teachers & Partners', points: ['Schedule management','Course & attendance tools','Collaborative workspace'], color: 'var(--orange)' },
                { icon: '🎓', title: 'Students & Parents', points: ['Personalized portal','Live progress tracking','Document & visa hub'], color: 'var(--gold)' },
              ].map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="card-lift"
                  style={{
                    padding: 36, borderRadius: 12, textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.03)',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: 20 }}>{item.icon}</div>
                  <h3 className="display-font" style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: 20, color: item.color }}>
                    {item.title}
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {item.points.map((pt) => (
                      <li key={pt} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)',
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
                        {pt}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="btn-ghost"
                    style={{ marginTop: 24, width: '100%', justifyContent: 'center', borderColor: item.color + '44', color: item.color }}
                    onClick={() => navigate('/login')}
                  >
                    Access Portal
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════════ */}
        <section style={{ padding: '120px 32px', background: '#001845' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>

            <motion.div initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: true }} style={{ marginBottom: 64 }}>
              <motion.div variants={fadeUp} style={{ marginBottom: 12 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--orange)' }}>Testimonials</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="display-font" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, margin: '0 0 16px' }}>
                Elite <span className="gold-text">Voices</span>
              </motion.h2>
              <motion.div variants={fadeUp} className="sep-line" style={{ margin: '0 auto' }} />
            </motion.div>

            {/* Testimonial rotator */}
            <div style={{ position: 'relative', minHeight: 280 }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    padding: '48px 56px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16,
                    position: 'relative',
                  }}
                >
                  {/* Large quote mark */}
                  <div className="display-font" style={{
                    position: 'absolute', top: 12, left: 28,
                    fontSize: '6rem', color: 'rgba(255,218,120,0.12)',
                    lineHeight: 1, fontStyle: 'italic', userSelect: 'none',
                  }}>
                    "
                  </div>

                  <p className="display-font" style={{
                    fontSize: '1.35rem', fontStyle: 'italic', fontWeight: 400,
                    lineHeight: 1.7, color: 'rgba(255,255,255,0.82)',
                    marginBottom: 36, position: 'relative', zIndex: 1,
                  }}>
                    {TESTIMONIALS[activeTestimonial].quote}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--blue), var(--navy))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '1.1rem', border: '2px solid rgba(255,255,255,0.15)',
                    }}>
                      {TESTIMONIALS[activeTestimonial].initial}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{TESTIMONIALS[activeTestimonial].author}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gold)', opacity: 0.8 }}>{TESTIMONIALS[activeTestimonial].role}</div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Dot indicators */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 28 }}>
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    style={{
                      width: i === activeTestimonial ? 28 : 8,
                      height: 8, borderRadius: 4, border: 'none',
                      background: i === activeTestimonial ? 'var(--gold)' : 'rgba(255,255,255,0.2)',
                      cursor: 'pointer', transition: 'all 0.3s',
                      boxShadow: i === activeTestimonial ? '0 0 10px var(--gold)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            CAMPUSES
        ══════════════════════════════════════════════ */}
        <section style={{ padding: '120px 32px', background: 'linear-gradient(160deg, #001030 0%, #002875 100%)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>

            <motion.div initial="hidden" whileInView="visible" variants={stagger} viewport={{ once: true }} style={{ marginBottom: 72 }}>
              <motion.div variants={fadeUp} style={{ marginBottom: 12 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--blue)' }}>Global Presence</span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="display-font" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 700, margin: '0 0 16px' }}>
                Our <span className="gold-text">World Campuses</span>
              </motion.h2>
              <motion.div variants={fadeUp} className="sep-line" />
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {CAMPUSES.map((campus, i) => (
                <motion.div
                  key={campus.city}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  viewport={{ once: true }}
                  onClick={() => navigate('/allcampus')}
                  style={{
                    borderRadius: 12, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer', background: 'rgba(255,255,255,0.03)',
                  }}
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,218,120,0.25)' }}
                >
                  {/* Visual header */}
                  <div style={{
                    height: 180,
                    background: `linear-gradient(135deg, #002875, #4989c8)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '5rem', position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 30%, rgba(255,218,120,0.1), transparent)' }} />
                    {campus.emoji}
                  </div>

                  <div style={{ padding: '24px 28px' }}>
                    <h3 className="display-font" style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 4px' }}>{campus.city}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 16px' }}>{campus.country}</p>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', borderRadius: 20,
                      background: 'rgba(255,218,120,0.1)', border: '1px solid rgba(255,218,120,0.2)',
                      fontSize: '0.75rem', fontWeight: 600, color: 'var(--gold)',
                    }}>
                      {campus.students} students
                    </div>
                    <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--blue)' }}>
                      Explore campus <East style={{ fontSize: 14 }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            CTA FINALE
        ══════════════════════════════════════════════ */}
        <section style={{ padding: '80px 32px 120px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              viewport={{ once: true }}
              style={{
                position: 'relative', textAlign: 'center',
                padding: '80px 48px',
                borderRadius: 20, overflow: 'hidden',
                background: 'linear-gradient(135deg, #ff7f3e 0%, #e05a20 40%, #c23d00 100%)',
                boxShadow: '0 40px 80px rgba(255,127,62,0.3)',
              }}
            >
              {/* Shimmer overlay */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  width: '40%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                  pointerEvents: 'none',
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🚀</div>
                <h2 className="display-font" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 700, margin: '0 0 16px', color: 'white' }}>
                  Ready to Join the Elite?
                </h2>
                <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', maxWidth: 560, margin: '0 auto 44px', lineHeight: 1.7 }}>
                  Your premium global journey begins with a single step. Join 15,000+ alumni who have already secured their futures with us.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      padding: '16px 44px', borderRadius: 4, border: 'none',
                      background: 'white', color: '#c23d00',
                      fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '1rem',
                      cursor: 'pointer', letterSpacing: '0.02em',
                      transition: 'all 0.2s', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}
                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                  >
                    Get Started Now →
                  </button>
                  <button
                    onClick={() => navigate('/allcampus')}
                    className="btn-ghost"
                    style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
                  >
                    View All Campuses
                  </button>
                </div>
                <p style={{ marginTop: 28, fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)' }}>
                  100% Secure · Trusted by 60+ Nations · 24/7 VIP Support
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════ */}
        <footer style={{
          padding: '32px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: '#001030',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'linear-gradient(135deg, var(--blue), var(--navy))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '0.85rem',
            }}>PL</div>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', opacity: 0.7 }}>ProjetLagno Elite Services</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
            © {new Date().getFullYear()} All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Contact'].map((l) => (
              <span key={l} style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.35)'}
              >{l}</span>
            ))}
          </div>
        </footer>

      </div>
    </>
  );
};

export default Home;