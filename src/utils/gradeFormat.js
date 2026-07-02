/**
 * @file gradeFormat.js
 * @description Centralised, preference-aware grade formatting for the entire app.
 *
 * The display format is driven by the user's `gradeFormat` preference
 * (UserPreferences.gradeFormat: FRACTION | PERCENT | LETTER | GPA).
 * Call configureGradeFormat(format) at:
 *   - Login (AuthContext)
 *   - Page reload / server resync (AuthContext)
 *   - Preference change (RegionalPreferences save)
 *
 * All functions are null-safe and return '—' for missing/invalid values.
 * LETTER and GPA rely on the result's persisted `gradeBand` snapshot; when it is
 * absent (e.g. no grading scale attached) they gracefully fall back to FRACTION
 * so a meaningful value is always shown.
 */

export const GRADE_FORMATS = ['FRACTION', 'PERCENT', 'LETTER', 'GPA'];

const DEFAULT_FORMAT = 'FRACTION';

// ── Module-level state (updated by configureGradeFormat) ──────────────────────
let _gradeFormat = DEFAULT_FORMAT;

/**
 * Set the active grade display format app-wide.
 * @param {('FRACTION'|'PERCENT'|'LETTER'|'GPA')} [format]
 */
export function configureGradeFormat(format) {
  _gradeFormat = GRADE_FORMATS.includes(format) ? format : DEFAULT_FORMAT;
}

/** Current active grade format. */
export function getGradeFormat() {
  return _gradeFormat;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Normalised score out of 20, derived from the normalized value or raw/max. */
function _normalized({ normalizedScore, score, maxScore }) {
  if (normalizedScore != null) return normalizedScore;
  if (score != null && maxScore) return (score / maxScore) * 20;
  return null;
}

function _fraction({ normalizedScore, score, maxScore }) {
  const norm = _normalized({ normalizedScore, score, maxScore });
  if (norm != null) return `${norm.toFixed(2)} / 20`;
  if (score != null && maxScore != null) return `${score} / ${maxScore}`;
  return '—';
}

// ── Public formatter ──────────────────────────────────────────────────────────

/**
 * Format a result score according to the active (or an explicit) grade format.
 *
 * @param {Object} result
 * @param {number|null} [result.normalizedScore] - Score normalised to /20.
 * @param {number|null} [result.score]           - Raw score.
 * @param {number|null} [result.maxScore]        - Raw maximum.
 * @param {Object|null} [result.gradeBand]       - Snapshot { letterGrade, gpa, label }.
 * @param {string} [format] - Override the configured format for this call.
 * @returns {string} Human-readable grade, or '—' when unavailable.
 */
export function formatGrade(result = {}, format = _gradeFormat) {
  const { normalizedScore, score, maxScore, gradeBand } = result || {};
  const fmt = GRADE_FORMATS.includes(format) ? format : DEFAULT_FORMAT;

  switch (fmt) {
    case 'PERCENT': {
      const norm = _normalized({ normalizedScore, score, maxScore });
      const pct =
        norm != null ? (norm / 20) * 100
        : score != null && maxScore ? (score / maxScore) * 100
        : null;
      return pct != null ? `${pct.toFixed(1)}%` : '—';
    }

    case 'LETTER':
      if (gradeBand?.letterGrade) return gradeBand.letterGrade;
      return _fraction({ normalizedScore, score, maxScore }); // graceful fallback

    case 'GPA':
      if (gradeBand?.gpa != null) {
        return typeof gradeBand.gpa === 'number' ? gradeBand.gpa.toFixed(2) : String(gradeBand.gpa);
      }
      return _fraction({ normalizedScore, score, maxScore }); // graceful fallback

    case 'FRACTION':
    default:
      return _fraction({ normalizedScore, score, maxScore });
  }
}
