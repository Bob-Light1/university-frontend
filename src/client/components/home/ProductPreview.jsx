/**
 * @file ProductPreview.jsx
 * @description Local, keyboard-accessible illustration with explicitly synthetic data.
 */
import { useRef, useState } from 'react';
import { DashboardOutlined, SchoolOutlined, AccountBalanceWalletOutlined, ArrowUpward, MoreHoriz, CheckCircleOutline } from '@mui/icons-material';
import { BRAND } from '../../../config/brand';
import { useAppTranslation } from '../../../hooks/useAppTranslation';

const VIEWS = ['overview', 'academics', 'finance'];
const ICONS = [DashboardOutlined, SchoolOutlined, AccountBalanceWalletOutlined];
const VALUES = [[1248, 42, 3], [24, 18, 6], [0.84, 12, 36]];
const BARS = [[48, 65, 53, 78, 68, 89, 76], [60, 75, 85, 67, 90, 80, 94], [35, 48, 65, 57, 78, 86, 92]];

/** This is an illustration, never a public business-data session. */
export default function ProductPreview() {
  const { t, i18n } = useAppTranslation('home');
  const [active, setActive] = useState(0);
  const tabs = useRef([]);
  const view = VIEWS[active];
  function move(event) {
    const rtl = i18n.dir() === 'rtl';
    let next = active;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = VIEWS.length - 1;
    else if (event.key === 'ArrowRight') next = (active + (rtl ? 2 : 1)) % 3;
    else if (event.key === 'ArrowLeft') next = (active + (rtl ? 1 : 2)) % 3;
    else return;
    event.preventDefault(); setActive(next); tabs.current[next]?.focus();
  }
  return <div className="product-preview" data-testid="product-preview">
    <div className="preview-chrome"><span className="preview-dots" aria-hidden="true"><i/><i/><i/></span><span>{BRAND.name} <span className="preview-slash">/</span> {t('workspace')}</span><span className="preview-avatar" aria-hidden="true">{BRAND.name[0]}</span></div>
    <div className="preview-tabs" role="tablist" aria-label={t('preview')} onKeyDown={move}>{VIEWS.map((item, index) => { const Icon = ICONS[index]; return <button type="button" key={item} ref={node => { tabs.current[index] = node; }} id={`preview-tab-${item}`} data-testid={`preview-tab-${item}`} role="tab" aria-selected={active === index} aria-controls={`preview-panel-${item}`} tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)}><Icon fontSize="small"/>{t(item)}</button>; })}</div>
    <div className="preview-panel" id={`preview-panel-${view}`} role="tabpanel" aria-labelledby={`preview-tab-${view}`} tabIndex={0} data-testid="preview-panel">
      <div className="preview-heading"><div><span className="preview-overline">{t('sampleCampus')}</span><h3>{t(`previewTitles.${view}`)}</h3></div><span className="preview-live"><span/>{t('illustration')}</span></div>
      <div className="preview-metrics">{VALUES[active].map((value, index) => <div key={index}><span>{t(`metricLabels.${view}${index}`)}</span><strong>{new Intl.NumberFormat(i18n.language, active === 2 && index === 0 ? { style: 'percent' } : {}).format(value)}</strong><small><ArrowUpward sx={{ fontSize: 12 }}/>{t('sampleData')}</small></div>)}</div>
      <div className="preview-chart"><div className="preview-chart-heading"><strong>{t(`charts.${view}`)}</strong><MoreHoriz fontSize="small"/></div><div className="preview-bars" role="img" aria-label={t('chartDescription')}>{BARS[active].map((height, index) => <div key={index}><span style={{ height: `${height}%` }}/><small>{index + 1}</small></div>)}</div></div>
      <div className="preview-record"><span className="preview-record-icon"><CheckCircleOutline fontSize="small"/></span><div><strong>{t(`records.${view}`)}</strong><span>{t('sampleRecord')}</span></div><span className="preview-tag">{t('illustration')}</span></div>
    </div>
    <p className="preview-disclaimer">{t('previewDisclaimer')}</p>
  </div>;
}
