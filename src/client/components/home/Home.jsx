/**
 * @file Home.jsx
 * @description Public landing page — "Luxury Observatory" aesthetic.
 *   Fully responsive (mobile-first). Styles extracted to home.css.
 *
 *   Layout breakpoints:
 *     < 480px   Single-column, compact paddings, stacked hero
 *     480–767px Two-column CTA buttons, larger text
 *     768–1023px Two-column hero, 3-column grids
 *     1024px+   Full desktop layout, generous spacing
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
  useInView,
} from 'framer-motion';
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

import '../../styles/home.css';

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.11 } },
};

// ─── Animated counter ─────────────────────────────────────────────────────────

const AnimatedNumber = ({ target }) => {
  const [count, setCount] = useState(0);
  const ref    = useRef(null);
  const isView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isView) return;
    const numeric = parseInt(target.replace(/\D/g, ''), 10);
    if (!numeric) { setCount(target); return; }
    let start = 0;
    const step = Math.ceil(numeric / (1800 / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= numeric) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [isView, target]);

  return <span ref={ref}>{count || 0}</span>;
};

// ─── Static data ──────────────────────────────────────────────────────────────

const STATS = [
  { value: '15K+', label: 'Alumni Worldwide',  icon: School },
  { value: '60+',  label: 'Global Campuses',   icon: Public },
  { value: '99%',  label: 'Visa Success Rate', icon: VerifiedUser },
  { value: '24/7', label: 'VIP Concierge',     icon: SupportAgent },
];

const PROGRAMS = [
  {
    num:    '01',
    icon:   '🏛️',
    title:  'University Placement',
    sub:    'Global Academic Access',
    desc:   'Exclusive pathways to Ivy League, Oxbridge, and top-ranked institutions worldwide — curated for exceptional candidates.',
    accent: '#4989c8',
  },
  {
    num:    '02',
    icon:   '🛂',
    title:  'Visa Strategy',
    sub:    'Premium Legal Navigation',
    desc:   'Complex immigration pathways made seamless. Our specialists craft tailor-made legal strategies with near-perfect success.',
    accent: '#ff7f3e',
  },
  {
    num:    '03',
    icon:   '💼',
    title:  'Career Architecture',
    sub:    'Executive Mentorship',
    desc:   'Connect with a global network of industry leaders, securing high-impact roles across 50+ countries.',
    accent: '#ffda78',
  },
  {
    num:    '04',
    icon:   '🌍',
    title:  'Cultural Integration',
    sub:    'Language & Adaptation',
    desc:   'Immersive cultural programs and language mastery designed to ensure a smooth, confident transition abroad.',
    accent: '#4989c8',
  },
];

const TESTIMONIALS = [
  {
    quote:
      "The level of expertise and care invested in my file was unparalleled. This team doesn't just process applications — they architect futures.",
    author:  'Jean-Pierre N.',
    role:    'MBA Graduate · INSEAD, France',
    initial: 'J',
  },
  {
    quote:
      'From visa strategy to university placement, every step was handled with surgical precision. I felt like a priority, not a client.',
    author:  'Dr. Sarah L.',
    role:    'Medical Practitioner · Toronto, Canada',
    initial: 'S',
  },
  {
    quote:
      "ProjetLagno gave my daughter access to opportunities I couldn't even imagine. Worth every single investment.",
    author:  'Mr. Emmanuel K.',
    role:    'Parent · Lagos, Nigeria',
    initial: 'E',
  },
];

const CAMPUSES = [
  { city: 'Paris',    country: 'France', students: '3,500+', emoji: '🗼' },
  { city: 'New York', country: 'USA',    students: '4,200+', emoji: '🗽' },
  { city: 'Toronto',  country: 'Canada', students: '2,800+', emoji: '🍁' },
];

const STAKEHOLDERS = [
  {
    icon:   '👔',
    title:  'Directors & Managers',
    points: ['Multi-campus governance', 'Real-time analytics', 'Staff & resource oversight'],
    color:  'var(--blue)',
  },
  {
    icon:   '📚',
    title:  'Teachers & Partners',
    points: ['Schedule management', 'Course & attendance tools', 'Collaborative workspace'],
    color:  'var(--orange)',
  },
  {
    icon:   '🎓',
    title:  'Students & Parents',
    points: ['Personalized portal', 'Live progress tracking', 'Document & visa hub'],
    color:  'var(--gold)',
  },
];

const AVATAR_COLORS = ['#4989c8', '#2a629a', '#ff7f3e', '#ffda78'];

// ─── Component ────────────────────────────────────────────────────────────────

const Home = () => {
  const navigate                = useNavigate();
  const heroRef                 = useRef(null);
  const { scrollYProgress }     = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY                   = useTransform(scrollYProgress, [0, 1], ['0%', '28%']);
  const heroOpacity             = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(
      () => setActiveTestimonial((p) => (p + 1) % TESTIMONIALS.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  const scrollDown = useCallback(() => {
    window.scrollBy({ top: window.innerHeight * 0.9, behavior: 'smooth' });
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="home-root">

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="hero" ref={heroRef}>

        {/* Decorative arc rings (hidden on small screens via pointer-events:none — kept lightweight) */}
        {[600, 900, 1200].map((size, i) => (
          <div
            key={size}
            className="arc-ring"
            style={{
              width:     size,
              height:    size,
              top:       '50%',
              left:      '60%',
              transform: 'translate(-50%, -50%)',
              opacity:   0.04 + i * 0.01,
            }}
          />
        ))}

        {/* Ambient blobs */}
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 500, height: 500,
          background: 'radial-gradient(ellipse, rgba(255,218,120,0.1) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%',
          width: 400, height: 400,
          background: 'radial-gradient(ellipse, rgba(255,127,62,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Star-field — reduced count on mobile for perf */}
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position:     'absolute',
              width:        Math.random() * 2 + 1,
              height:       Math.random() * 2 + 1,
              borderRadius: '50%',
              background:   'white',
              left:         `${Math.random() * 100}%`,
              top:          `${Math.random() * 100}%`,
              opacity:      Math.random() * 0.4 + 0.1,
            }}
            animate={{ opacity: [0.1, 0.5, 0.1] }}
            transition={{
              duration:  Math.random() * 4 + 2,
              repeat:    Infinity,
              delay:     Math.random() * 3,
            }}
          />
        ))}

        <motion.div style={{ y: heroY, opacity: heroOpacity, width: '100%' }}>
          <div className="hero__inner">

            {/* ── Left: copy ── */}
            <motion.div variants={stagger} initial="hidden" animate="visible">

              {/* Badge */}
              <motion.div variants={fadeUp}>
                <div className="hero__badge">
                  <span className="hero__badge-dot" />
                  Premier Immigration Academy
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="hero__headline display-font"
              >
                Your Future,
                <br />
                <span className="gold-text">Without Borders.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="hero__tagline display-font"
              >
                We don't process files. We architect destinies.
              </motion.p>

              <motion.p variants={fadeUp} className="hero__body">
                ProjetLagno is the world's most trusted platform for international
                education, immigration strategy, and career excellence — serving
                ambitious minds across 60+ nations.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="hero__ctas">
                <button
                  className="btn-primary"
                  onClick={() => navigate('/login')}
                  aria-label="Begin your journey — go to login"
                >
                  Begin Your Journey <ArrowForward style={{ fontSize: 17 }} />
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => navigate('/allcampus')}
                  aria-label="Explore all campuses"
                >
                  <PlayArrow style={{ fontSize: 17 }} /> Explore Campuses
                </button>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={fadeUp} className="hero__social-proof">
                <div className="hero__avatars">
                  {AVATAR_COLORS.map((c, i) => (
                    <div
                      key={c}
                      className="hero__avatar-item"
                      style={{ background: c }}
                      aria-hidden="true"
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <p className="hero__proof-text">
                  Joined by{' '}
                  <strong style={{ color: 'var(--gold)' }}>15,000+</strong>{' '}
                  students worldwide
                </p>
              </motion.div>
            </motion.div>

            {/* ── Right: floating campus card ── */}
            <motion.div
              className="hero__mosaic"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="hero__mosaic-card">
                <div className="hero__mosaic-label">🌍 Global Reach</div>
                <div className="hero__campuses-grid">
                  {CAMPUSES.map((c) => (
                    <div key={c.city}>
                      <div className="hero__campus-emoji">{c.emoji}</div>
                      <div className="hero__campus-city">{c.city}</div>
                      <div className="hero__campus-country">{c.country}</div>
                      <div className="hero__campus-students">{c.students}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating stat — orange */}
              <motion.div
                className="hero__stat-orange"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="hero__stat-value display-font">99%</div>
                <div className="hero__stat-label">Visa Success Rate</div>
              </motion.div>

              {/* Floating stat — blue */}
              <motion.div
                className="hero__stat-blue"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              >
                <div className="hero__stat-value display-font">60+</div>
                <div className="hero__stat-label">Countries Served</div>
              </motion.div>
            </motion.div>

          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="hero__scroll"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={scrollDown}
          role="button"
          aria-label="Scroll down"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && scrollDown()}
        >
          <span>Scroll</span>
          <KeyboardArrowDown style={{ fontSize: 20 }} />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════ */}
      <section className="stats-bar">
        <div className="stats-bar__inner">
          {STATS.map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              className="stats-bar__item"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.09 }}
              viewport={{ once: true }}
            >
              <Icon style={{ fontSize: 26, color: 'var(--gold)', marginBottom: 8, opacity: 0.85 }} />
              <div className="stats-bar__value display-font gold-text">
                <AnimatedNumber target={value} />
              </div>
              <div className="stats-bar__label">{label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════
          PROGRAMS
      ════════════════════════════════════════ */}
      <section className="programs">
        <div className="programs__inner">

          {/* Section header */}
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            variants={stagger}
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp}>
              <span className="section-eyebrow" style={{ color: 'var(--orange)' }}>
                Our Services
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="section-heading display-font">
              World-Class Solutions
              <br />
              <span className="glow-line gold-text">For Global Leaders</span>
            </motion.h2>
            <motion.div variants={fadeUp} className="sep-line" />
          </motion.div>

          {/* Program cards */}
          <div className="programs__grid">
            {PROGRAMS.map((prog, i) => (
              <motion.div
                key={prog.num}
                className="program-card"
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.09, duration: 0.55 }}
                viewport={{ once: true }}
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div
                  className="program-card__watermark display-font"
                  aria-hidden="true"
                >
                  {prog.num}
                </div>
                <div
                  className="program-card__dot"
                  style={{
                    background:  prog.accent,
                    boxShadow:   `0 0 10px ${prog.accent}`,
                  }}
                />
                <div className="program-card__icon" aria-hidden="true">
                  {prog.icon}
                </div>
                <div
                  className="program-card__sub"
                  style={{ color: prog.accent }}
                >
                  {prog.sub}
                </div>
                <h3 className="program-card__title">{prog.title}</h3>
                <p className="program-card__desc">{prog.desc}</p>
                <div
                  className="program-card__link"
                  style={{ color: prog.accent }}
                >
                  Learn more <East style={{ fontSize: 13 }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          WHO WE SERVE
      ════════════════════════════════════════ */}
      <section className="stakeholders">
        <div className="stakeholders__arc" aria-hidden="true" />
        <div className="stakeholders__inner">

          <motion.div
            className="section-header"
            style={{ textAlign: 'center' }}
            initial="hidden"
            whileInView="visible"
            variants={stagger}
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp}>
              <span className="section-eyebrow" style={{ color: 'var(--gold)' }}>
                Our Community
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="section-heading display-font">
              Designed for{' '}
              <span className="gold-text">Every Stakeholder</span>
            </motion.h2>
            <motion.div
              variants={fadeUp}
              className="sep-line"
              style={{ margin: '0 auto' }}
            />
          </motion.div>

          <div className="stakeholders__grid">
            {STAKEHOLDERS.map((item, i) => (
              <motion.div
                key={item.title}
                className="stakeholder-card card-lift"
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12, duration: 0.55 }}
                viewport={{ once: true }}
              >
                <div className="stakeholder-card__icon" aria-hidden="true">
                  {item.icon}
                </div>
                <h3
                  className="stakeholder-card__title"
                  style={{ color: item.color }}
                >
                  {item.title}
                </h3>
                <ul className="stakeholder-card__list">
                  {item.points.map((pt) => (
                    <li key={pt}>
                      <span
                        className="stakeholder-card__bullet"
                        style={{
                          background: item.color,
                          boxShadow:  `0 0 6px ${item.color}`,
                        }}
                        aria-hidden="true"
                      />
                      {pt}
                    </li>
                  ))}
                </ul>
                <button
                  className="btn-ghost stakeholder-card__cta"
                  style={{
                    borderColor: `${item.color}55`,
                    color:       item.color,
                  }}
                  onClick={() => navigate('/login')}
                >
                  Access Portal
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════ */}
      <section className="testimonials">
        <div className="testimonials__inner">

          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            variants={stagger}
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp}>
              <span className="section-eyebrow" style={{ color: 'var(--orange)' }}>
                Testimonials
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="section-heading display-font">
              Elite <span className="gold-text">Voices</span>
            </motion.h2>
            <motion.div
              variants={fadeUp}
              className="sep-line"
              style={{ margin: '0 auto' }}
            />
          </motion.div>

          {/* Testimonial rotator */}
          <div style={{ position: 'relative', minHeight: 240 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                className="testimonial-card"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45 }}
              >
                <div
                  className="testimonial-card__quote-mark"
                  aria-hidden="true"
                >
                  "
                </div>
                <p className="testimonial-card__text">
                  {TESTIMONIALS[activeTestimonial].quote}
                </p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar" aria-hidden="true">
                    {TESTIMONIALS[activeTestimonial].initial}
                  </div>
                  <div>
                    <div className="testimonial-card__name">
                      {TESTIMONIALS[activeTestimonial].author}
                    </div>
                    <div className="testimonial-card__role">
                      {TESTIMONIALS[activeTestimonial].role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation dots */}
            <div className="testimonial-dots" role="tablist" aria-label="Testimonials">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === activeTestimonial}
                  aria-label={`Testimonial ${i + 1}`}
                  className={`testimonial-dot ${i === activeTestimonial ? 'testimonial-dot--active' : ''}`}
                  onClick={() => setActiveTestimonial(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CAMPUSES
      ════════════════════════════════════════ */}
      <section className="campuses">
        <div className="campuses__inner">

          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="visible"
            variants={stagger}
            viewport={{ once: true }}
          >
            <motion.div variants={fadeUp}>
              <span className="section-eyebrow" style={{ color: 'var(--blue)' }}>
                Global Presence
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="section-heading display-font">
              Our <span className="gold-text">World Campuses</span>
            </motion.h2>
            <motion.div variants={fadeUp} className="sep-line" />
          </motion.div>

          <div className="campuses__grid">
            {CAMPUSES.map((campus, i) => (
              <motion.div
                key={campus.city}
                className="campus-card"
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.09, duration: 0.55 }}
                viewport={{ once: true }}
                onClick={() => navigate('/allcampus')}
                role="button"
                tabIndex={0}
                aria-label={`Explore ${campus.city} campus`}
                onKeyDown={(e) => e.key === 'Enter' && navigate('/allcampus')}
              >
                <div className="campus-card__visual">
                  <div
                    className="campus-card__visual-overlay"
                    aria-hidden="true"
                  />
                  <span aria-hidden="true">{campus.emoji}</span>
                </div>
                <div className="campus-card__body">
                  <h3 className="campus-card__city">{campus.city}</h3>
                  <p className="campus-card__country">{campus.country}</p>
                  <div className="campus-card__badge">{campus.students} students</div>
                  <div className="campus-card__link" style={{ color: 'var(--blue)' }}>
                    Explore campus <East style={{ fontSize: 13 }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA FINALE
      ════════════════════════════════════════ */}
      <section className="cta-finale">
        <div className="cta-finale__inner">
          <motion.div
            className="cta-finale__box"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            viewport={{ once: true }}
          >
            {/* Shimmer sweep */}
            <motion.div
              className="cta-finale__shimmer"
              animate={{ x: ['-100%', '200%'] }}
              transition={{
                duration:    4,
                repeat:      Infinity,
                ease:        'linear',
                repeatDelay: 2,
              }}
              aria-hidden="true"
            />

            <div className="cta-finale__content">
              <div className="cta-finale__emoji" aria-hidden="true">🚀</div>
              <h2 className="cta-finale__heading display-font">
                Ready to Join the Elite?
              </h2>
              <p className="cta-finale__body">
                Your premium global journey begins with a single step. Join
                15,000+ alumni who have already secured their futures with us.
              </p>

              <div className="cta-finale__buttons">
                <button
                  className="cta-finale__btn-primary"
                  onClick={() => navigate('/login')}
                >
                  Get Started Now →
                </button>
                <button
                  className="btn-ghost"
                  style={{
                    borderColor: 'rgba(255,255,255,0.4)',
                    color:       'white',
                  }}
                  onClick={() => navigate('/allcampus')}
                >
                  View All Campuses
                </button>
              </div>

              <p className="cta-finale__note">
                100% Secure · Trusted by 60+ Nations · 24/7 VIP Support
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════ */}
      <footer className="home-footer">
        <div className="home-footer__brand">
          <div className="home-footer__logo" aria-hidden="true">PL</div>
          <span className="home-footer__name">ProjetLagno Elite Services</span>
        </div>
        <p className="home-footer__copy">
          © {new Date().getFullYear()} All rights reserved.
        </p>
        <nav className="home-footer__links" aria-label="Footer links">
          {['Privacy', 'Terms', 'Contact'].map((l) => (
            <button key={l} className="home-footer__link">
              {l}
            </button>
          ))}
        </nav>
      </footer>

    </div>
  );
};

export default Home;