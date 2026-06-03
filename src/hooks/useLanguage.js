import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES, SUPPORTED_LANGUAGES, LANGUAGE_META } from '../i18n/i18n';
import api from '../api/axiosInstance';

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
  const language = i18n.language || 'en';
  const isRTL    = RTL_LANGUAGES.includes(language);

  const changeLanguage = useCallback(
    async (code, persist = true) => {
      if (!SUPPORTED_LANGUAGES.includes(code)) return;

      await i18n.changeLanguage(code);

      // Sync HTML attributes for accessibility and screen readers
      document.documentElement.lang = code;
      document.documentElement.dir  = RTL_LANGUAGES.includes(code) ? 'rtl' : 'ltr';

      // Persist to cookie + localStorage (picked up on next cold load)
      document.cookie = `erp_lang=${code};path=/;SameSite=Lax;max-age=31536000`;
      localStorage.setItem('erp_language', code);

      // Persist to server — non-blocking, fire-and-forget from caller's perspective
      if (persist) {
        api.patch('/api/settings', { preferredLanguage: code }).catch(() => {});
      }
    },
    [i18n]
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
