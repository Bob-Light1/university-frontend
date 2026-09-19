/**
 * @file Navbar.jsx
 * @description Accessible product navigation; enrollment remains in the public portal.
 */
import { useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowForward, Menu, Close, Language } from '@mui/icons-material';
import Brand from '../../../components/shared/Brand';
import { BRAND } from '../../../config/brand';
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import { useLanguage } from '../../../hooks/useLanguage';
import '../../styles/home.css';

/** Public navigation with local-only locale persistence for anonymous visitors. */
export default function Navbar() {
  const { t } = useAppTranslation('home');
  const { language, changeLanguage, supportedLangs, languageMeta } = useLanguage();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  const close = () => setOpen(false);
  return <header className="product-nav" onKeyDown={(event) => {
    if (event.key === 'Escape' && open) { close(); toggle.current?.focus(); }
  }}>
    <a className="product-skip" href="#main-content">{t('skip')}</a>
    <div className="product-container product-nav-inner">
      <Link className="product-brand" to="/" onClick={close} aria-label={`${BRAND.name} — ${t('home')}`}><Brand /></Link>
      <button ref={toggle} className="product-menu-toggle" type="button" data-testid="home-menu" aria-label={t('menu')} aria-expanded={open} aria-controls="product-navigation" onClick={() => setOpen(!open)}>{open ? <Close /> : <Menu />}</button>
      <nav id="product-navigation" aria-label={t('navigation')} className={open ? 'product-links is-open' : 'product-links'}>
        {['features', 'preview', 'faq'].map(id => <a key={id} href={`${pathname === '/' ? '' : '/'}#${id}`} onClick={close}>{t(id)}</a>)}
        <label className="product-language"><Language fontSize="small" /><span className="product-sr-only">{t('language')}</span><select data-testid="home-language" value={language.split('-')[0] === 'zh' ? 'zh-CN' : language.split('-')[0]} onChange={event => changeLanguage(event.target.value)}>{supportedLangs.map(code => <option key={code} value={code}>{languageMeta[code].nativeName}</option>)}</select></label>
        <Link className="product-login" to="/login" onClick={close}>{t('login')}<ArrowForward fontSize="small" /></Link>
        {BRAND.salesHref && <a className="product-button product-button-small" href={BRAND.salesHref}>{t('requestDemo')}</a>}
      </nav>
    </div>
  </header>;
}
