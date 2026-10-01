/**
 * @file Contact.jsx
 * @description Compatible contact route using configured commercial destinations.
 */
import { BRAND } from '../../../config/brand';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

/** Never show a fake form or fabricated contact details. */
export default function Contact() {
  const { t } = useAppTranslation('home');
  return <div className="product-home"><section className="product-container product-contact"><h1>{t('contactTitle')}</h1><p>{t(BRAND.salesHref ? 'contactBody' : 'contactUnavailable')}</p>{BRAND.salesHref && <a className="product-button" href={BRAND.salesHref}>{t('contact')}</a>}</section></div>;
}
