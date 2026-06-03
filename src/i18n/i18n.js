import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import ICU from 'i18next-icu';
import { setLocale } from 'yup';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'es', 'ar', 'zh-CN', 'de'];
export const RTL_LANGUAGES        = ['ar'];
export const DEFAULT_LANG         = 'en';

export const NAMESPACES = [
  'common', 'auth', 'academic', 'schedule', 'results', 'attendance',
  'examination', 'documents', 'finance', 'settings', 'notifications',
  'errors', 'print', 'gaet',
];

// Language metadata (native name + flag country code for country-flag-icons)
export const LANGUAGE_META = {
  en:      { nativeName: 'English',    flagCode: 'GB' },
  fr:      { nativeName: 'Français',   flagCode: 'FR' },
  es:      { nativeName: 'Español',    flagCode: 'ES' },
  ar:      { nativeName: 'العربية',    flagCode: 'SA', rtl: true },
  'zh-CN': { nativeName: '中文',        flagCode: 'CN' },
  de:      { nativeName: 'Deutsch',    flagCode: 'DE' },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(ICU)           // ICU replaces default parser — no {{}} interpolation
  .use(initReactI18next)
  .init({
    fallbackLng:   DEFAULT_LANG,
    supportedLngs: SUPPORTED_LANGUAGES,

    // Always-eager namespaces — loaded at startup
    ns:        ['common', 'errors'],
    defaultNS: 'common',

    backend: {
      loadPath:          '/locales/{lng}/{ns}.json',
      queryStringParams: { v: import.meta.env.VITE_BUILD_HASH ?? '1' },
    },

    detection: {
      order:              ['cookie', 'localStorage', 'navigator'],
      lookupCookie:       'erp_lang',
      lookupLocalStorage: 'erp_language',
      caches:             ['cookie', 'localStorage'],
    },

    interpolation: { escapeValue: false },
    react:         { useSuspense: true },

    saveMissing: true,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing: ${ns}:${key} (${lngs.join(', ')})`);
      } else {
        window.Sentry?.addBreadcrumb({ category: 'i18n', message: `Missing:${ns}:${key}` });
      }
    },
  });

// Sync Yup validation messages whenever language changes
i18n.on('languageChanged', () => {
  setLocale({
    mixed:  { required: () => i18n.t('errors:validation.required') },
    string: {
      email: ()        => i18n.t('errors:validation.email'),
      min:   ({ min }) => i18n.t('errors:validation.minLength', { min }),
      max:   ({ max }) => i18n.t('errors:validation.maxLength', { max }),
    },
    number: {
      min: ({ min }) => i18n.t('errors:validation.numberMin', { min }),
      max: ({ max }) => i18n.t('errors:validation.numberMax', { max }),
    },
  });
});

export default i18n;
