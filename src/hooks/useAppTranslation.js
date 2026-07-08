import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Drop-in replacement for useTranslation() across the entire codebase.
 * Logs missing keys in dev, reports to Sentry in production.
 *
 * The returned `t` is referentially stable for a given language + namespace, so
 * it is safe to list in a useCallback / useEffect dependency array.
 *
 * @param {string|string[]} ns - namespace(s) to load
 */
export function useAppTranslation(ns = 'common') {
  const { t, i18n } = useTranslation(ns);

  const tSafe = useCallback((key, opts) => {
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
  // `ns` is an array literal at most call sites — a new reference every render.
  // Its *contents* are static, so depending on the joined form keeps tSafe stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, i18n.language, Array.isArray(ns) ? ns.join(',') : ns]);

  return { t: tSafe, i18n };
}
