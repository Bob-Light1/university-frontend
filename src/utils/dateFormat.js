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
let _dateFmt  = null;      // user numeric-date override; null → locale default
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

/**
 * Override the numeric (all-digits) short-date order. When set, `fDateShort`
 * honors the user's explicit preference instead of the locale default; when
 * null/unset it falls back to locale-driven ordering.
 *
 * @param {('DD/MM/YYYY'|'MM/DD/YYYY'|'YYYY-MM-DD'|null)} [pattern]
 */
export function configureDateFormat(pattern) {
  _dateFmt = pattern || null;
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

/** Short numeric date — honors the user's dateFormat override, else locale default */
export const fDateShort = (value) => {
  const d = _parse(value);
  if (!d) return '—';
  // formatToParts respects the configured timezone (carried by _fmt's options).
  const fmt = _fmt('dateShort', { day: '2-digit', month: '2-digit', year: 'numeric' });
  if (!_dateFmt) return fmt.format(d);
  const parts = fmt.formatToParts(d);
  const part = (type) => parts.find((p) => p.type === type)?.value ?? '';
  const dd = part('day');
  const mm = part('month');
  const yyyy = part('year');
  switch (_dateFmt) {
    case 'MM/DD/YYYY': return `${mm}/${dd}/${yyyy}`;
    case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`;
    case 'DD/MM/YYYY':
    default:           return `${dd}/${mm}/${yyyy}`;
  }
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
