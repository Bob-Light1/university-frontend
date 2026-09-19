/**
 * @file Footer.jsx
 * @description Single public footer with configured destinations and no placeholder actions.
 */
import { Link } from 'react-router-dom';
import Brand from '../../../components/shared/Brand';
import { BRAND, publicUrl } from '../../../config/brand';
import { PORTAL_URL } from '../../../config/env';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

/** Keep applicant intake separate from product discovery. */
export default function Footer() {
  const { t } = useAppTranslation('home');
  const portal = publicUrl(PORTAL_URL);
  return <footer className="product-footer">
    <div className="product-container">
      <div className="product-footer-top"><div><Link to="/" className="product-brand"><Brand /></Link><p>{t('footerBody')}</p></div><div className="product-footer-links"><a href="/#features">{t('features')}</a><a href="/#preview">{t('preview')}</a><Link to="/login">{t('login')}</Link>{BRAND.salesHref && <a href={BRAND.salesHref}>{t('contact')}</a>}</div></div>
      <div className="product-footer-bottom"><span>© {new Date().getFullYear()} {BRAND.name}</span><div>{BRAND.privacy && <a href={BRAND.privacy}>{t('privacy')}</a>}{BRAND.terms && <a href={BRAND.terms}>{t('terms')}</a>}{portal && <a data-testid="home-enrollment" href={portal}>{t('enrollment')} ↗</a>}</div></div>
    </div>
  </footer>;
}
