/**
 * @file dateFormat.js
 * @description Centralised, locale-aware date/time formatting for the entire app.
 *
 * Locale is driven by the user's preferredLanguage + preferredLocale settings.
 * Call configureLocale(langCode, timezone, preferredLocale) at:
 *   - Login (AuthContext)
 *   - Page reload / server resync (AuthContext)
 *   - Language change (useLanguage)
 *
 * All functions are null-safe and return '—' for missing/invalid values.
 */

// ── Language → IANA locale mapping ───────────────────────────────────────────
const LANG_TO_LOCALE = {
  en:      'en-GB',
  fr:      'fr-FR',
  es:      'es-ES',
  ar:      'ar-SA',
  'zh-CN': 'zh-CN',
  de:      'de-DE',
};

// ── Module-level state (updated by configureLocale) ───────────────────────────
let _locale   = 'en-GB';
let _timezone = undefined; // undefined → browser local time
let _cache    = {};        // keyed by format shape string

// ── Internal helpers ─────────────────────────────────────────────────────────

function _fmt(key, options) {
  if (!_cache[key]) {
    const opts = _timezone ? { timeZone: _timezone, ...options } : { ...options };
    _cache[key] = new Intl.DateTimeFormat(_locale, opts);
  }
  return _cache[key];
}

function _parse(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// ── Public configuration ──────────────────────────────────────────────────────

/**
 * Reconfigure all formatters for a new language / timezone.
 * Should be called whenever the user's language or timezone changes.
 *
 * @param {string} langCode       - i18n language code ('en', 'fr', 'ar', …)
 * @param {string} [timezone]     - IANA timezone ('Africa/Douala', 'UTC', …)
 * @param {string} [preferredLocale] - Override locale ('fr-CM', 'en-NG', …)
 */
export function configureLocale(langCode, timezone, preferredLocale) {
  _locale   = preferredLocale || LANG_TO_LOCALE[langCode] || 'en-GB';
  _timezone = timezone && timezone !== 'UTC' ? timezone : undefined;
  _cache    = {}; // invalidate all cached formatters
}

// ── Date / time formatters ────────────────────────────────────────────────────

/** Standard date — "15 Jan 2025" / "15 janv. 2025" / … */
export const fDate = (value) => {
  const d = _parse(value);
  return d ? _fmt('date', { day: '2-digit', month: 'short', year: 'numeric' }).format(d) : '—';
};

/** Long date — "15 January 2025" / "15 janvier 2025" / … */
export const fDateLong = (value) => {
  const d = _parse(value);
  return d ? _fmt('dateLong', { day: 'numeric', month: 'long', year: 'numeric' }).format(d) : '—';
};

/** Short numeric date — "15/01/2025" or locale-appropriate numeric format */
export const fDateShort = (value) => {
  const d = _parse(value);
  return d ? _fmt('dateShort', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d) : '—';
};

/** Time only — "14:30" (24h) */
export const fTime = (value) => {
  const d = _parse(value);
  return d ? _fmt('time', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d) : '—';
};

/** Date + time — "15 Jan 2025 · 14:30" */
export const fDateTime = (value) => {
  const d = _parse(value);
  return d
    ? `${_fmt('date', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)} · ${_fmt('time', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)}`
    : '—';
};

/** Weekday short — "Mon, 15 Jan" / "lun. 15 janv." / … */
export const fDateWeekday = (value) => {
  const d = _parse(value);
  return d ? _fmt('weekday', { weekday: 'short', day: 'numeric', month: 'short' }).format(d) : '—';
};

/** Weekday long — "Monday, 15 January 2025" / "lundi 15 janvier 2025" / … */
export const fDateWeekdayLong = (value) => {
  const d = _parse(value);
  return d ? _fmt('weekdayL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d) : '—';
};
