/**
 * RtlProvider — MUI v5 correct RTL implementation.
 *
 * CRITICAL: jss-rtl + StylesProvider are MUI v4 only.
 * MUI v5 uses Emotion. The correct stack is:
 *   stylis-plugin-rtl + @emotion/cache CacheProvider + createTheme({ direction })
 *
 * Wraps the entire app so any language switch immediately mirrors the layout.
 */
import { useMemo, useEffect } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import stylisRTLPlugin from 'stylis-plugin-rtl';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useLanguage } from '../hooks/useLanguage';

const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [stylisRTLPlugin] });
const ltrCache = createCache({ key: 'muiltr' });

export function RtlProvider({ children }) {
  const { isRTL, language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir  = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  const theme = useMemo(
    () => createTheme({ direction: isRTL ? 'rtl' : 'ltr' }),
    [isRTL]
  );

  return (
    <CacheProvider value={isRTL ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
