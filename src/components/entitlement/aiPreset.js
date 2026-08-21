/**
 * @file aiPreset.js
 * @description The AI values a tier grants on its own — the frontend mirror of
 * the backend `AI_PLAN_PRESETS` grid.
 *
 * Its own module rather than a second export of `AiValuesSection.jsx`: a file
 * that exports both a component and a helper breaks fast refresh, and this
 * helper is the kind a second screen will want.
 */

import { AI_PLAN_FEATURES, AI_PLAN_BUDGETS } from '../ai/aiConstants';

/**
 * Budget and sub-features only. The LLM profile has no per-tier preset on the
 * backend either — it defaults to the zero-cost one and is set by hand — so
 * resetting to the preset deliberately leaves it untouched rather than
 * inventing a mapping this side of the wire.
 *
 * @param {string} plan
 * @returns {{monthlyTokenBudget: number, features: Object}}
 */
export const aiPresetFor = (plan) => ({
  monthlyTokenBudget: AI_PLAN_BUDGETS[plan] ?? AI_PLAN_BUDGETS.free,
  features: { ...(AI_PLAN_FEATURES[plan] || AI_PLAN_FEATURES.free) },
});

export default aiPresetFor;
