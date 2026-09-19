/**
 * @file BrandMetadata.jsx
 * @description Synchronize browser metadata with deployment identity and locale.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BRAND } from '../../config/brand';
import { useAppTranslation } from '../../hooks/useAppTranslation';

/** Apply localized metadata without changing authenticated theme preferences. */
export default function BrandMetadata() {
  const { t } = useAppTranslation('home');
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = `${BRAND.name} — ${t('product')}`;
    for (const [name, content] of [['description', t('heroBody')], ['application-name', BRAND.name]]) {
      let tag = document.querySelector(`meta[name="${name}"]`);
      if (!tag) { tag = document.createElement('meta'); tag.name = name; document.head.append(tag); }
      tag.content = content;
    }
    const icon = document.querySelector('link[rel="icon"]');
    if (icon) { icon.href = BRAND.icon; icon.removeAttribute('type'); }
  }, [t, pathname]);
  return null;
}
