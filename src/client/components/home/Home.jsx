/**
 * @file Home.jsx
 * @description ERP product showcase, separate from the applicant recruitment portal.
 */
import { ArrowForward, ArrowOutward, SchoolOutlined, EventAvailableOutlined, AssessmentOutlined, AccountBalanceWalletOutlined, ForumOutlined, ApartmentOutlined, Check, Language, HubOutlined, TuneOutlined } from '@mui/icons-material';
import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BRAND } from '../../../config/brand';
import { useAppTranslation } from '../../../hooks/useAppTranslation';
import ProductPreview from './ProductPreview';
import '../../styles/home.css';

const FEATURES = [SchoolOutlined, EventAvailableOutlined, AssessmentOutlined, AccountBalanceWalletOutlined, ForumOutlined, ApartmentOutlined];
const FACTS = [HubOutlined, Language, TuneOutlined];

/** Reveal content once without hiding focusable controls from keyboard users. */
function Reveal({ children, className, id, ...props }) {
  const reduced = useReducedMotion();
  return <Motion.section className={className} id={id} {...props}
    initial={false}
    whileInView={reduced ? undefined : { y: [24, 0], opacity: [0.35, 1] }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
    {children}
  </Motion.section>;
}

/** Public product content never grants access to the modules it describes. */
export default function Home() {
  const { t } = useAppTranslation('home');
  return <div className="product-home" data-testid="product-home">
    <Reveal className="product-hero product-container">
      <div className="product-hero-copy"><span className="product-eyebrow"><span/>{t('eyebrow')}</span><h1>{t('heroTitle')} <em>{t('heroAccent')}</em></h1><p className="product-lead">{t('heroBody')}</p><div className="product-actions"><a className="product-button" href={BRAND.salesHref || '#preview'} data-testid="home-primary">{t(BRAND.salesHref ? 'requestDemo' : 'explore')}<ArrowForward fontSize="small"/></a><Link className="product-text-link" to="/login">{t('login')}<ArrowOutward fontSize="small"/></Link></div><div className="product-hero-notes"><span><Check fontSize="small"/>{t('roleAccess')}</span><span><Check fontSize="small"/>{t('multiCampus')}</span></div></div>
      <div className="product-hero-visual" id="preview"><div className="product-preview-caption"><span>{t('previewEyebrow')}</span><span className="product-preview-hint">{t('tryTabs')} ↓</span></div><ProductPreview/><div className="product-preview-footnote"><span className="product-small-line"/>{t('previewFootnote')}</div></div>
    </Reveal>
    <Reveal className="product-facts" aria-label={t('product')}><div className="product-container">{FACTS.map((Icon, index) => <div key={index}><Icon/><div><strong>{t(`facts.title${index}`)}</strong><span>{t(`facts.body${index}`)}</span></div></div>)}</div></Reveal>
    <Reveal className="product-section product-container" id="features"><div className="product-section-heading"><div><span className="product-eyebrow">{t('featuresEyebrow')}</span><h2>{t('featuresTitle')}</h2></div><p>{t('featuresBody')}</p></div><div className="product-features">{FEATURES.map((Icon, index) => <article className="product-feature" key={index}><div className="product-feature-top"><span className="product-feature-icon"><Icon/></span><span className="product-feature-number">0{index + 1}</span></div><h3>{t(`featureTitles.${index}`)}</h3><p>{t(`featureBodies.${index}`)}</p></article>)}</div><p className="product-availability"><TuneOutlined fontSize="small"/>{t('availability')}</p></Reveal>
    <Reveal className="product-roles"><div className="product-container product-roles-inner"><div><span className="product-eyebrow">{t('rolesEyebrow')}</span><h2>{t('rolesTitle')}</h2><p>{t('rolesBody')}</p><Link className="product-text-link" to="/login">{t('accessWorkspace')}<ArrowForward fontSize="small"/></Link></div><div className="product-role-list">{[0, 1, 2].map(index => <article key={index}><span>0{index + 1}</span><div><h3>{t(`roleTitles.${index}`)}</h3><p>{t(`roleBodies.${index}`)}</p></div><ArrowOutward aria-hidden="true"/></article>)}</div></div></Reveal>
    <Reveal className="product-section product-container product-faq" id="faq"><div><span className="product-eyebrow">{t('faqEyebrow')}</span><h2>{t('faqTitle')}</h2><p>{t('faqBody')}</p></div><div>{[0, 1, 2, 3, 4].map(index => <details key={index}><summary>{t(`questions.${index}`)}<span aria-hidden="true">+</span></summary><p>{t(`answers.${index}`)}</p></details>)}</div></Reveal>
    <Reveal className="product-container product-closing"><div><span className="product-eyebrow">{t('closingEyebrow')}</span><h2>{t('closingTitle')}</h2><p>{t('closingBody')}</p></div><a className="product-button" href={BRAND.salesHref || '#preview'}>{t(BRAND.salesHref ? 'requestDemo' : 'explore')}<ArrowForward fontSize="small"/></a></Reveal>
  </div>;
}
