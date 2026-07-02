/**
 * @file themeMode.js
 * @description App-wide colour-mode store (light | dark | system).
 *
 * The colour mode is driven by the user's `theme` preference
 * (UserPreferences.theme: 'light' | 'dark' | 'system', default 'light').
 * Call setThemeMode(mode) at:
 *   - Login (AuthContext)
 *   - Page reload / server resync (AuthContext)
 *   - Preference change (RegionalPreferences save)
 *
 * Unlike gradeFormat/dateFormat, the colour mode must be reactive: changing it
 * has to re-create the MUI theme. Because AuthProvider wraps RtlProvider (so
 * AuthContext cannot consume a React context living inside the provider), this
 * module exposes a tiny subscribable store that RtlProvider listens to.
 *
 * 'system' is resolved live against the OS preference
 * (prefers-color-scheme) so the app follows the user's OS day/night switch.
 */

export const THEME_MODES = ['light', 'dark', 'system'];

const DEFAULT_MODE = 'light';
export const THEME_STORAGE_KEY = 'erp_theme';

// ── Module-level state ────────────────────────────────────────────────────────
let _mode = _readStoredMode();
const _listeners = new Set();

function _readStoredMode() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEME_MODES.includes(stored) ? stored : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

/** Current colour mode preference ('light' | 'dark' | 'system'). */
export function getThemeMode() {
  return _mode;
}

/**
 * Set the app-wide colour mode, persist it, and notify subscribers.
 * Invalid values fall back to the default. No-ops (same value) are still
 * persisted but do not notify, to avoid needless re-renders.
 * @param {('light'|'dark'|'system')} [mode]
 */
export function setThemeMode(mode) {
  const next = THEME_MODES.includes(mode) ? mode : DEFAULT_MODE;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* storage may be unavailable (private mode) — mode still lives in memory */
  }
  if (next === _mode) return;
  _mode = next;
  _listeners.forEach((fn) => fn(next));
}

/**
 * Subscribe to colour-mode changes.
 * @param {(mode: string) => void} fn
 * @returns {() => void} unsubscribe
 */
export function subscribeThemeMode(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

/**
 * Resolve a mode to a concrete palette ('light' | 'dark').
 * 'system' reads the OS preference via matchMedia.
 * @param {('light'|'dark'|'system')} [mode]
 * @returns {('light'|'dark')}
 */
export function resolveMode(mode = _mode) {
  if (mode === 'dark' || mode === 'light') return mode;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}
