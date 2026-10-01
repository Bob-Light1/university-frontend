/**
 * @file Navbar.jsx
 * @description Accessible product navigation; enrollment remains in the public portal.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LoginOutlined, Menu, Close, Language, DarkModeOutlined, LightModeOutlined } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { setThemeMode } from '../../../theme/themeMode';
import Brand from '../../../components/shared/Brand';
import { BRAND } from '../../../config/brand';
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import { useLanguage } from '../../../hooks/useLanguage';
import '../../styles/home.css';

/** Public navigation with local-only locale persistence for anonymous visitors. */
export default function Navbar() {
  const dark = useTheme().palette.mode === 'dark';
  const { t } = useAppTranslation('home');
  const { language, changeLanguage, supportedLangs, languageMeta } = useLanguage();
  const { pathname, key } = useLocation();
  const [openAt, setOpenAt] = useState(null);
  const open = openAt === key;
  const header = useRef(null);
  const toggle = useRef(null);
  const close = () => setOpenAt(null);
  useEffect(() => {
    if (!open) return undefined;
    header.current?.querySelector('#product-navigation a')?.focus({ preventScroll: true });
    const dismiss = event => { if (!header.current?.contains(event.target)) setOpenAt(null); };
    const desktop = window.matchMedia('(min-width: 1101px)');
    const resize = () => { if (desktop.matches) setOpenAt(null); };
    document.addEventListener('pointerdown', dismiss);
    desktop.addEventListener('change', resize);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      desktop.removeEventListener('change', resize);
    };
  }, [open]);
  return <header ref={header} className="product-nav" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }} onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { close(); toggle.current?.focus(); }
  }}>
    <a className="product-skip" href="#main-content">{t('skip')}</a>
    <div className="product-container product-nav-inner">
      <Link className="product-brand" to="/" onClick={close} aria-label={`${BRAND.name} — ${t('home')}`}><Brand /></Link>
      <nav id="product-navigation" aria-label={t('navigation')} className={open ? 'product-links is-open' : 'product-links'}>
        {['features', 'preview', 'faq'].map(id => <a key={id} href={`${pathname === '/' ? '' : '/'}#${id}`} onClick={close}>{t(id)}</a>)}
        <Link to="/contact" aria-current={pathname === '/contact' ? 'page' : undefined} onClick={close}>{t('contact')}</Link>
        <label className="product-language"><Language fontSize="small" /><span className="product-sr-only">{t('language')}</span><select data-testid="home-language" value={language.split('-')[0] === 'zh' ? 'zh-CN' : language.split('-')[0]} onChange={event => changeLanguage(event.target.value)}>{supportedLangs.map(code => <option key={code} value={code}>{languageMeta[code].nativeName}</option>)}</select></label>

        {BRAND.salesHref && <a className="product-nav-demo" href={BRAND.salesHref} onClick={close}>{t('requestDemo')}</a>}
      </nav>
      <div className="product-nav-controls">
      <button className="product-theme-toggle" type="button" data-testid="home-theme" aria-label={t(dark ? 'lightMode' : 'darkMode')} title={t(dark ? 'lightMode' : 'darkMode')} onClick={() => setThemeMode(dark ? 'light' : 'dark')}>{dark ? <LightModeOutlined /> : <DarkModeOutlined />}</button>
      <Link className="product-login" to="/login" aria-current={pathname === '/login' ? 'page' : undefined} onClick={close}><LoginOutlined fontSize="small" /><span>{t('login')}</span></Link>
      <button ref={toggle} className="product-menu-toggle" type="button" data-testid="home-menu" aria-label={t('menu')} aria-expanded={open} aria-controls="product-navigation" onClick={() => setOpenAt(open ? null : key)}>{open ? <Close /> : <Menu />}</button>
      </div>
    </div>
  </header>;
}
