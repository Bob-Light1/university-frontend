import { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, LANGUAGE_META } from '../i18n/i18n';
import { configureLocale } from '../utils/dateFormat';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosInstance';

const SECURE = location.protocol === 'https:' ? ';Secure' : '';

/**
 * @returns {{
 *   language:       string,
 *   changeLanguage: (code: string, persist?: boolean) => Promise<void>,
 *   isRTL:          boolean,
 *   dir:            'ltr' | 'rtl',
 *   supportedLangs: string[],
 *   languageMeta:   Record<string, { nativeName: string, flagCode: string, rtl?: boolean }>,
 * }}
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const { user } = useContext(AuthContext);
  const language = i18n.language || 'en';
  const isRTL    = RTL_LANGUAGES.includes(language);

  const changeLanguage = useCallback(
    async (code, persist = true) => {
      if (!SUPPORTED_LANGUAGES.includes(code)) return;

      await i18n.changeLanguage(code);

      // Always sync HTML attributes and date formatters — no storage side-effects
      document.documentElement.lang = code;
      document.documentElement.dir  = RTL_LANGUAGES.includes(code) ? 'rtl' : 'ltr';
      // Keep date formatters in sync with the new language (timezone/locale unchanged)
      configureLocale(code, user?.timezone, user?.preferredLocale);

      // Persist to local storage + server only when explicitly requested
      if (persist) {
        document.cookie = `erp_lang=${code};path=/;SameSite=Lax;max-age=31536000${SECURE}`;
        localStorage.setItem('erp_language', code);
        api.patch('/api/settings', { preferredLanguage: code }).catch(() => {});
      }
    },
    [i18n, user?.timezone, user?.preferredLocale]
  );

  return {
    language,
    changeLanguage,
    isRTL,
    dir:           isRTL ? 'rtl' : 'ltr',
    supportedLangs: SUPPORTED_LANGUAGES,
    languageMeta:   LANGUAGE_META,
  };
}
