/**
 * RtlProvider — MUI v5 theme provider: RTL direction + colour mode.
 *
 * CRITICAL: jss-rtl + StylesProvider are MUI v4 only.
 * MUI v5 uses Emotion. The correct stack is:
 *   stylis-plugin-rtl + @emotion/cache CacheProvider + createTheme({ direction })
 *
 * Also drives the app-wide colour mode (light | dark | system):
 *   - Listens to the themeMode store (login / resync / preference save).
 *   - Resolves 'system' live against the OS prefers-color-scheme.
 *   - Re-creates the MUI theme so semantic tokens recolour the whole app.
 *   - Mirrors the resolved mode onto <html> (data-theme + color-scheme) so the
 *     inline anti-flash script and native form widgets stay in sync.
 *
 * Wraps the entire app so any language or theme switch applies instantly.
 */
import { useMemo, useEffect, useState } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import stylisRTLPlugin from 'stylis-plugin-rtl';
import { ThemeProvider } from '@mui/material/styles';
import { useLanguage } from '../hooks/useLanguage';
import { buildTheme } from './theme';
import { getThemeMode, subscribeThemeMode, resolveMode } from './themeMode';

const rtlCache = createCache({ key: 'muirtl', stylisPlugins: [stylisRTLPlugin] });
const ltrCache = createCache({ key: 'muiltr' });

export function RtlProvider({ children }) {
  const { isRTL, language } = useLanguage();

  const [mode, setMode] = useState(getThemeMode);
  const [systemDark, setSystemDark] = useState(() => resolveMode('system') === 'dark');

  // React to app-wide mode changes (login, server resync, preference save).
  useEffect(() => subscribeThemeMode(setMode), []);

  // Follow the OS colour scheme live while in 'system' mode.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const resolvedMode = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [language, isRTL]);

  // Keep <html> in sync so native widgets and the anti-flash baseline match.
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedMode;
    document.documentElement.style.colorScheme = resolvedMode;
  }, [resolvedMode]);

  const theme = useMemo(
    () => buildTheme({ direction: isRTL ? 'rtl' : 'ltr', mode: resolvedMode }),
    [isRTL, resolvedMode]
  );

  return (
    <CacheProvider value={isRTL ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}
