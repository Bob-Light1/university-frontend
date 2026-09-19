/**
 * @file useEntitlementPilot.js
 * @description The editing engine behind both pilot screens — the ADMIN offer
 * dialog and the CAMPUS_MANAGER modules tab (design doc §5, phase 4).
 *
 * The two screens differ by exactly three things: which endpoints they call,
 * whether they may set the tier, and how they are framed. Everything else —
 * loading the report, holding the pending changes, deciding what is dirty,
 * demanding a justification, submitting only the deviations, and rendering the
 * server's refusal — is identical, so it lives here once (CLAUDE.md §0.1). Two
 * copies would drift, and the half that drifts is always the looser one.
 *
 * ⚠️ NO RULE IS DECIDED HERE. What a layer may select travels on the payload
 * (`allowedStates`, computed by the guard itself), the minimum justification
 * travels on `requirements`, and everything data-driven — a module holding
 * records, a module another collection still needs — is a 409 this hook
 * displays and never predicts (§8.2).
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import { FEATURE_STATES } from '../config/featureConstants';

/** Fallbacks used only until the server's own `requirements` arrive. */
const FALLBACK_REQUIREMENTS = Object.freeze({
  minReasonLength: 10,
  maxReasonLength: 300,
  maxUntilMonths: 12,
});

/** A row the operator has not touched yet. */
const pristine = (feature) => ({
  state: feature.state,
  until: feature.overrides?.campus?.until || feature.overrides?.admin?.until || null,
  reason: '',
});

/**
 * Reads the blockers out of a refusal, whatever shape it arrived in.
 *
 * The entitlement routes answer a refusal with the FULL list under
 * `errors.blockers` (never one at a time — an operator who discovers a refusal
 * item by item is one who will work around it), and a malformed payload with
 * the ordinary `errors: [{ field, message }]` array. Both end up as a list of
 * sentences, because to the operator they are the same event: the save did not
 * go through, and here is why.
 *
 * @param {Error} error - Axios error.
 * @returns {{message: string, blockers: Array}}
 */
export const readRefusal = (error) => {
  const body = error?.response?.data;
  const errors = body?.errors;
  const blockers = Array.isArray(errors?.blockers)
    ? errors.blockers
    : (Array.isArray(errors) ? errors : []);

  return {
    message: body?.message || error?.message || 'Request failed',
    blockers: blockers.map((b) => ({
      code: b.code || null,
      feature: b.feature || b.field || null,
      message: b.message,
      /** Named records / collections the guard listed, when it listed any. */
      detail: [...(b.records || []), ...(b.requires || [])],
    })),
  };
};

/**
 * @param {Object}   params
 * @param {string}   params.campusId
 * @param {Function} params.fetcher  - `(campusId) => Promise<AxiosResponse>`.
 * @param {Function} params.mutator  - `(campusId, payload) => Promise<AxiosResponse>`.
 * @param {boolean}  [params.enabled] - false keeps the hook idle (a closed dialog).
 * @returns {Object} the whole editing surface — see the fields below.
 */
/**
 * "No draft has been made yet" — a sentinel that can never be a report.
 *
 * The drafts below are keyed on the report OBJECT (`draft.source === report`),
 * which is what makes a fresh report drop a stale draft on its own. `null` is
 * therefore the one value that must NOT stand for "no draft": `report` is null
 * while the pilot is idle, so `null === null` matched and the draft's own null
 * value won. `EntitlementDialog` then read `.monthlyTokenBudget` off it and
 * threw on its first render — and both admin screens mount that dialog
 * unconditionally, closed, so the whole page came up blank.
 */
export const NO_DRAFT = Object.freeze({});

export const useEntitlementPilot = ({ campusId, fetcher, mutator, enabled = true }) => {
  const [report, setReport] = useState(null);
  const [draft, setDraft] = useState({});
  /**
   * The window the `until` picker accepts, resolved WHEN THE REPORT LOADS
   * rather than on every render: "at most twelve months from now" is a reading
   * of the clock, and a component that reads the clock while rendering answers
   * a different question each time React happens to re-run it.
   */
  const [untilBounds, setUntilBounds] = useState({ untilMin: '', untilMax: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refusal, setRefusal] = useState(null);
  const [warnings, setWarnings] = useState([]);

  const load = useCallback(async () => {
    if (!campusId) return;
    setLoading(true);
    setRefusal(null);
    setWarnings([]);
    try {
      const res = await fetcher(campusId);
      const data = res.data?.data || {};
      setReport(data);
      setDraft(Object.fromEntries((data.features || []).map((f) => [f.key, pristine(f)])));

      const months = data.requirements?.maxUntilMonths || FALLBACK_REQUIREMENTS.maxUntilMonths;
      const min = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const max = new Date();
      max.setMonth(max.getMonth() + months);
      setUntilBounds({
        untilMin: min.toISOString().slice(0, 10),
        untilMax: max.toISOString().slice(0, 10),
      });
    } catch (error) {
      setReport(null);
      setRefusal(readRefusal(error));
    } finally {
      setLoading(false);
    }
  }, [campusId, fetcher]);

  useEffect(() => {
    if (enabled) load();
  }, [enabled, load]);

  // ── Draft edition ──────────────────────────────────────────────────────────

  const [planDraft, setPlanDraft] = useState({ source: NO_DRAFT, value: null });
  // Keyed on the report OBJECT: a fresh report (another campus, or the reload
  // that follows a save) drops the draft on its own, where an effect would
  // leave one render showing the previous campus's tier.
  const plan = planDraft.source === report ? planDraft.value : (report?.plan ?? null);
  const setPlan = useCallback((value) => setPlanDraft({ source: report, value }), [report]);

  const patchRow = useCallback((key, patch) => {
    setDraft((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }, []);

  const resetRow = useCallback((key) => {
    setDraft((current) => {
      const feature = report?.features?.find((f) => f.key === key);
      return feature ? { ...current, [key]: pristine(feature) } : current;
    });
  }, [report]);

  const requirements = useMemo(
    () => ({ ...FALLBACK_REQUIREMENTS, ...(report?.requirements || {}), ...untilBounds }),
    [report, untilBounds],
  );

  /**
   * The rows that actually changed — the only ones submitted.
   *
   * A screen that posts all twenty-six rows writes twenty-six overrides, and
   * the stored array must hold ONLY the deviations (§3): the server prunes the
   * redundant ones, but it would still stamp every module with today's date and
   * this operator's name, burying whoever really decided what.
   */
  const changed = useMemo(() => {
    if (!report) return [];
    return report.features
      .filter((f) => {
        const row = draft[f.key];
        if (!row) return false;
        const wasUntil = pristine(f).until;
        return row.state !== f.state
          || String(row.until || '') !== String(wasUntil || '');
      })
      .map((f) => ({ ...draft[f.key], key: f.key, feature: f }));
  }, [report, draft]);

  const planChanged = plan !== null && report && plan !== report.plan;

  /**
   * Restricting a module demands a justification; switching one back on does
   * not. The rule is the server's (`entitlement.controller.js`) — mirrored here
   * only to keep the Save button honest, and re-enforced there regardless.
   */
  const missingReason = useMemo(
    () => changed.filter((row) =>
      row.state !== FEATURE_STATES.ENABLED
      && (row.reason || '').trim().length < requirements.minReasonLength),
    [changed, requirements.minReasonLength],
  );

  const dirty = changed.length > 0 || planChanged;
  const canSave = dirty && !saving && !loading && missingReason.length === 0;

  // ── Submission ─────────────────────────────────────────────────────────────

  /**
   * @param {Object} [extra] - Value fields the caller owns (`quotas`, `ai`).
   *   Offer layer only; the server refuses them on the usage layer.
   * @returns {Promise<boolean>} true when the change was written.
   */
  const save = useCallback(async (extra = {}) => {
    setSaving(true);
    setRefusal(null);
    setWarnings([]);
    try {
      const payload = {
        ...extra,
        ...(planChanged ? { plan } : {}),
        ...(changed.length
          ? {
            modules: changed.map(({ key, state, until, reason }) => ({
              key,
              state,
              until: until || null,
              reason: (reason || '').trim(),
            })),
          }
          : {}),
      };
      const res = await mutator(campusId, payload);
      setWarnings(res.data?.data?.warnings || []);
      await load();
      return true;
    } catch (error) {
      setRefusal(readRefusal(error));
      return false;
    } finally {
      setSaving(false);
    }
  }, [campusId, mutator, changed, plan, planChanged, load]);

  return {
    report,
    features: report?.features || [],
    plan,
    setPlan,
    draft,
    patchRow,
    resetRow,
    requirements,
    changed,
    missingReason,
    dirty,
    canSave,
    loading,
    saving,
    refusal,
    clearRefusal: () => setRefusal(null),
    warnings,
    reload: load,
    save,
  };
};

export default useEntitlementPilot;
