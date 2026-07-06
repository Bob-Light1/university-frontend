/**
 * @file aiConstants.js
 * @description Frontend mirror of the backend AI entitlement constants
 * (shared/constants/ai.constants.js — the single source of truth, PHASE3
 * design §11.3). Kept in sync manually: plans, per-plan feature presets,
 * report/advisor names and gateway error codes are declared verbatim by the
 * backend and only mirrored here for local gating and label resolution.
 *
 * The UI never trusts these for security — the gateway enforces plan / feature
 * / budget on every call and returns AI_ERROR_CODES. These constants only pick
 * which tabs to render optimistically and how to label an error.
 */

/** Per-campus AI plans (§11.3). */
export const AI_PLANS = Object.freeze({
  FREE: 'free',
  STANDARD: 'standard',
  PREMIUM: 'premium',
});

/** AI features toggled per plan. */
export const AI_FEATURES = Object.freeze({
  CHAT: 'chat',
  SEARCH: 'search',
  ANALYTICS: 'analytics',
  ADVISORS: 'advisors',
});

/**
 * Default feature set per plan (mirror of AI_PLAN_PRESETS.features). Used only
 * to decide which tabs to show optimistically; a campus may override features,
 * so every panel still handles AI_FEATURE_NOT_IN_PLAN at runtime.
 */
export const AI_PLAN_FEATURES = Object.freeze({
  [AI_PLANS.FREE]: Object.freeze({ chat: true, search: true, analytics: false, advisors: false }),
  [AI_PLANS.STANDARD]: Object.freeze({ chat: true, search: true, analytics: true, advisors: false }),
  [AI_PLANS.PREMIUM]: Object.freeze({ chat: true, search: true, analytics: true, advisors: true }),
});

/**
 * Default monthly token budget per plan (mirror of AI_PLAN_PRESETS
 * .monthlyTokenBudget, decision D10). Used by the admin entitlement panel to
 * preview the backend preset when the plan changes; the admin may override it.
 * 0 means unlimited (ADMIN only).
 */
export const AI_PLAN_BUDGETS = Object.freeze({
  [AI_PLANS.FREE]: 200000,
  [AI_PLANS.STANDARD]: 1000000,
  [AI_PLANS.PREMIUM]: 5000000,
});

/** Descriptive analytics reports (Feature 2). */
export const AI_ANALYTICS_REPORTS = Object.freeze({
  CLASS_PERFORMANCE: 'class-performance',
  ATTENDANCE_SUMMARY: 'attendance-summary',
  DROPOUT_RISK: 'dropout-risk',
});

/** Business advisors (Feature §6.6). */
export const AI_ADVISORS = Object.freeze({
  FINANCE: 'finance',
  ACADEMIC: 'academic',
  MARKETING: 'marketing',
});

/** Gateway error codes — frozen API contract (design doc Annexe B). */
export const AI_ERROR_CODES = Object.freeze({
  AI_DISABLED: 'AI_DISABLED',
  AI_NOT_ENABLED: 'AI_NOT_ENABLED',
  AI_FEATURE_NOT_IN_PLAN: 'AI_FEATURE_NOT_IN_PLAN',
  AI_BUDGET_EXCEEDED: 'AI_BUDGET_EXCEEDED',
  UPSTREAM_TIMEOUT: 'UPSTREAM_TIMEOUT',
  INTERNAL: 'INTERNAL',
});

/** Report metadata for the analytics panel (icon color is resolved at render). */
export const ANALYTICS_REPORT_ORDER = [
  AI_ANALYTICS_REPORTS.CLASS_PERFORMANCE,
  AI_ANALYTICS_REPORTS.ATTENDANCE_SUMMARY,
  AI_ANALYTICS_REPORTS.DROPOUT_RISK,
];

export const ADVISOR_ORDER = [
  AI_ADVISORS.FINANCE,
  AI_ADVISORS.ACADEMIC,
  AI_ADVISORS.MARKETING,
];

/**
 * Normalises an error into { code, message } from either an axios error
 * (project sendError shape { success, message, errors: { code } }) or the
 * streamAiChat handler payload ({ code, message }).
 *
 * @param {*} err - Axios error, plain { code, message }, or Error.
 * @returns {{ code: string, message: string }}
 */
export function extractAiError(err) {
  if (!err) return { code: AI_ERROR_CODES.INTERNAL, message: 'Unknown error' };
  // Already-normalised { code, message } (streamAiChat onError).
  if (err.code && !err.response && !err.isAxiosError) {
    return { code: err.code, message: err.message || err.code };
  }
  const data = err.response?.data;
  return {
    code: data?.errors?.code || AI_ERROR_CODES.INTERNAL,
    message: data?.message || err.message || 'Request failed',
  };
}

/** i18n key for a gateway error code, under the `ai` namespace. */
export const errorKey = (code) => `errors.${code || AI_ERROR_CODES.INTERNAL}`;

/**
 * Whether an error code means the whole feature/campus is unavailable (render a
 * full-panel notice) rather than a transient failure (render an inline alert).
 */
export const isUnavailableError = (code) =>
  code === AI_ERROR_CODES.AI_DISABLED ||
  code === AI_ERROR_CODES.AI_NOT_ENABLED ||
  code === AI_ERROR_CODES.AI_FEATURE_NOT_IN_PLAN;

/** Formats a large token count compactly (e.g. 1.2M, 340k). */
export function formatTokens(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1)}k`;
  return String(v);
}
