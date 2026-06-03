import { useTranslation } from 'react-i18next';

/**
 * Drop-in replacement for useTranslation() across the entire codebase.
 * Logs missing keys in dev, reports to Sentry in production.
 *
 * @param {string|string[]} ns - namespace(s) to load
 */
export function useAppTranslation(ns = 'common') {
  const { t, i18n } = useTranslation(ns);

  const tSafe = (key, opts) => {
    const val = t(key, opts);
    // i18next returns the key itself when missing
    if (val === key || val === `${ns}:${key}`) {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing key: ${Array.isArray(ns) ? ns[0] : ns}:${key} (lang: ${i18n.language})`);
      } else {
        window.Sentry?.addBreadcrumb({
          category: 'i18n',
          level:    'warning',
          message:  `Missing translation: ${Array.isArray(ns) ? ns[0] : ns}:${key}`,
        });
      }
    }
    return val;
  };

  return { t: tSafe, i18n };
}
