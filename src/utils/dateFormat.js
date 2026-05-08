/**
 * @file dateFormat.js
 * @description Centralised date/time formatting for the entire app.
 *
 * Convention: DD MMM YYYY · HH:mm  (e.g. "15 Jan 2025 · 14:30")
 *  - Day-first order (standard in Cameroon and most of the world)
 *  - Month as 3-letter abbreviation → unambiguous across locales
 *  - 24-hour clock (standard in Cameroon / francophone Africa)
 *  - All functions are null-safe and return '—' for missing values
 */

// Reuse a single Intl formatter per shape to avoid re-instantiation overhead.
const _fmt = (options) => new Intl.DateTimeFormat('en-GB', options);

const _date     = _fmt({ day: '2-digit', month: 'short',  year: 'numeric' });
const _dateLong = _fmt({ day: 'numeric', month: 'long',   year: 'numeric' });
const _dateShort= _fmt({ day: '2-digit', month: '2-digit',year: 'numeric' });
const _time     = _fmt({ hour: '2-digit', minute: '2-digit', hour12: false });
const _weekday  = _fmt({ weekday: 'short', day: 'numeric', month: 'short' });
const _weekdayL = _fmt({ weekday: 'long',  day: 'numeric', month: 'long', year: 'numeric' });

const _parse = (value) => {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d;
};

/**
 * Standard date — "15 Jan 2025"
 * Use for: profile fields, created/updated timestamps, most table cells.
 */
export const fDate = (value) => {
  const d = _parse(value);
  return d ? _date.format(d) : '—';
};

/**
 * Long date — "15 January 2025"
 * Use for: formal documents, certificates, drawers.
 */
export const fDateLong = (value) => {
  const d = _parse(value);
  return d ? _dateLong.format(d) : '—';
};

/**
 * Short numeric date — "15/01/2025"  (DD/MM/YYYY)
 * Use for: dense data tables where column space is tight.
 */
export const fDateShort = (value) => {
  const d = _parse(value);
  return d ? _dateShort.format(d) : '—';
};

/**
 * Time only — "14:30"  (24-hour)
 * Use for: schedules, session start/end times.
 */
export const fTime = (value) => {
  const d = _parse(value);
  return d ? _time.format(d) : '—';
};

/**
 * Date + time — "15 Jan 2025 · 14:30"
 * Use for: audit logs, exam start times, batch job timestamps.
 */
export const fDateTime = (value) => {
  const d = _parse(value);
  return d ? `${_date.format(d)} · ${_time.format(d)}` : '—';
};

/**
 * Weekday short — "Mon, 15 Jan"
 * Use for: schedule cards, attendance rows.
 */
export const fDateWeekday = (value) => {
  const d = _parse(value);
  return d ? _weekday.format(d) : '—';
};

/**
 * Weekday long — "Monday, 15 January 2025"
 * Use for: schedule detail drawers, formal headings.
 */
export const fDateWeekdayLong = (value) => {
  const d = _parse(value);
  return d ? _weekdayL.format(d) : '—';
};
