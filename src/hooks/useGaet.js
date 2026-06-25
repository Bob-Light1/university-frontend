/**
 * @file useGaet.js
 * @description State management hook for GAET — Générateur Automatique d'Emploi du Temps.
 *
 * Polling strategy: recursive setTimeout (not setInterval), as specified in GAET v2.
 * Each poll fires 3 seconds AFTER the previous response — no overlapping requests.
 *
 * Status terminal states that stop polling:
 *   GENERATED | PARTIALLY_GENERATED | PUBLISHED | FAILED | CANCELLED
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as gaetService from '../services/gaetService';

const TERMINAL_STATUSES = new Set([
  'GENERATED',
  'PARTIALLY_GENERATED',
  'PUBLISHED',
  'FAILED',
  'CANCELLED',
]);

const POLL_INTERVAL_MS = 3000;

const useGaet = (campusId) => {
  const { t } = useTranslation('gaet');

  const [constraint,    setConstraint]    = useState(null);
  const [status,        setStatus]        = useState(null);
  const [qualityReport, setQualityReport] = useState(null);
  const [preview,       setPreview]       = useState([]);
  const [conflicts,     setConflicts]     = useState({
    conflictCount: 0, conflicts: [], unplacedCourses: [],
  });

  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [generating,  setGenerating]  = useState(false);
  const [publishing,  setPublishing]  = useState(false);
  const [error,       setError]       = useState(null);

  // Polling handle — call .stop() to cancel the next scheduled poll
  const pollingRef = useRef({ stop: () => {} });

  // Stop any in-flight polling when the component unmounts
  useEffect(() => () => pollingRef.current.stop(), []);

  // ─── FETCH A SPECIFIC CONSTRAINT ─────────────────────────────────────────

  const loadConstraint = useCallback(async (academicYear, semester) => {
    if (!campusId) return null;
    pollingRef.current.stop(); // cancel any in-flight poll for the previous constraint
    setLoading(true);
    setError(null);
    try {
      const res  = await gaetService.getConstraints(campusId, { academicYear, semester });
      const list = res.data?.data;
      const doc  = Array.isArray(list) && list.length > 0 ? list[0] : null;
      setConstraint(doc);
      setStatus(doc?.status ?? null);
      setQualityReport(doc?.qualityReport ?? null);
      setPreview([]);
      setConflicts({ conflictCount: 0, conflicts: [], unplacedCourses: [] });
      return doc;
    } catch (err) {
      setError(err.response?.data?.message ?? t('messages.loadFailed'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [campusId, t]);

  // ─── SAVE CONSTRAINTS ────────────────────────────────────────────────────

  const saveConstraints = useCallback(async (payload) => {
    setSaving(true);
    setError(null);
    try {
      const res     = await gaetService.createOrUpdateConstraints(payload);
      const updated = res.data?.data;
      if (updated) {
        setConstraint(updated);
        setStatus(updated.status);
        setQualityReport(updated.qualityReport ?? null);
      }
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message ?? t('messages.saveFailed');
      setError(msg);
      throw new Error(msg);
    } finally {
      setSaving(false);
    }
  }, [t]);

  // ─── POLLING ─────────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    pollingRef.current.stop();
  }, []);

  const startPolling = useCallback((constraintId, onTerminal) => {
    stopPolling();
    let active = true;
    pollingRef.current = { stop: () => { active = false; } };

    const poll = async () => {
      if (!active) return;
      try {
        const res       = await gaetService.getStatus(constraintId);
        const data      = res.data?.data;
        const newStatus = data?.status;

        setStatus(newStatus);
        setQualityReport(data?.qualityReport ?? null);

        if (TERMINAL_STATUSES.has(newStatus)) {
          active = false;
          setGenerating(false);
          // Persist final constraint state locally
          setConstraint((prev) =>
            prev ? { ...prev, status: newStatus, qualityReport: data?.qualityReport ?? null } : prev
          );
          if (onTerminal) onTerminal(newStatus, data);
          return;
        }
      } catch (err) {
        // 4xx (e.g. 404 constraint not found, 403 campus mismatch) → stop immediately
        const httpStatus = err?.response?.status;
        if (httpStatus && httpStatus >= 400 && httpStatus < 500) {
          active = false;
          setGenerating(false);
          setStatus('FAILED');
          return;
        }
        // Network error or 5xx — keep polling silently
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    setTimeout(poll, POLL_INTERVAL_MS);
  }, [stopPolling]);

  // ─── GENERATE ────────────────────────────────────────────────────────────

  const generate = useCallback(async (academicYear, semester, showSnackbar) => {
    setGenerating(true);
    setError(null);
    setPreview([]);
    setConflicts({ conflictCount: 0, conflicts: [], unplacedCourses: [] });
    try {
      const res          = await gaetService.generateSchedule({ academicYear, semester });
      const constraintId = res.data?.data?.constraintId;
      if (!constraintId) {
        throw new Error(t('messages.noConstraintId'));
      }
      setStatus('GENERATING');

      startPolling(constraintId, (terminalStatus, data) => {
        setQualityReport(data?.qualityReport ?? null);
        setConstraint((prev) =>
          prev ? { ...prev, status: terminalStatus, qualityReport: data?.qualityReport ?? null } : prev
        );

        if (!showSnackbar) return;
        if (terminalStatus === 'GENERATED') {
          showSnackbar(t('messages.generatedSuccess'), 'success');
        } else if (terminalStatus === 'PARTIALLY_GENERATED') {
          showSnackbar(t('messages.generatedPartial'), 'warning');
        } else if (terminalStatus === 'FAILED') {
          showSnackbar(t('messages.generatedFailed'), 'error');
        }
      });
    } catch (err) {
      const msg = err.response?.data?.message ?? t('messages.generateStartFailed');
      setError(msg);
      setGenerating(false);
      setStatus(constraint?.status ?? 'DRAFT');
      throw new Error(msg);
    }
  }, [startPolling, constraint, t]);

  // ─── FETCH PREVIEW ───────────────────────────────────────────────────────

  const fetchPreview = useCallback(async (constraintId) => {
    try {
      const res = await gaetService.getPreview(constraintId);
      setPreview(res.data?.data?.sessions ?? []);
    } catch (err) {
      setError(err.response?.data?.message ?? t('messages.previewFailed'));
      setPreview([]);
    }
  }, [t]);

  // ─── FETCH CONFLICTS ─────────────────────────────────────────────────────

  const fetchConflicts = useCallback(async (constraintId) => {
    try {
      const res = await gaetService.getConflicts(constraintId);
      setConflicts(
        res.data?.data ?? { conflictCount: 0, conflicts: [], unplacedCourses: [] }
      );
    } catch (err) {
      setError(err.response?.data?.message ?? t('messages.conflictsFailed'));
      setConflicts({ conflictCount: 0, conflicts: [], unplacedCourses: [] });
    }
  }, [t]);

  // ─── PUBLISH ─────────────────────────────────────────────────────────────

  const publish = useCallback(async (constraintId, showSnackbar) => {
    setPublishing(true);
    setError(null);
    try {
      const res    = await gaetService.publishSchedule(constraintId);
      const result = res.data?.data;
      setStatus('PUBLISHED');
      setConstraint((prev) => prev ? { ...prev, status: 'PUBLISHED' } : prev);
      if (showSnackbar)
        showSnackbar(t('messages.publishedCount', { count: result?.published ?? 0 }), 'success');
      return result;
    } catch (err) {
      const msg = err.response?.data?.message ?? t('messages.publishFailed');
      setError(msg);
      if (showSnackbar) showSnackbar(msg, 'error');
      throw new Error(msg);
    } finally {
      setPublishing(false);
    }
  }, [t]);

  // ─── CANCEL GENERATED ────────────────────────────────────────────────────

  const cancelGenerated = useCallback(async (constraintId, showSnackbar) => {
    setError(null);
    try {
      await gaetService.cancelGenerated(constraintId);
      setStatus('CANCELLED');
      setPreview([]);
      setQualityReport(null);
      setConflicts({ conflictCount: 0, conflicts: [], unplacedCourses: [] });
      setConstraint((prev) => prev ? { ...prev, status: 'CANCELLED' } : prev);
      if (showSnackbar) showSnackbar(t('messages.cancelled'), 'info');
    } catch (err) {
      const msg = err.response?.data?.message ?? t('messages.cancelFailed');
      setError(msg);
      if (showSnackbar) showSnackbar(msg, 'error');
    }
  }, [t]);

  // ─── RESET LOCAL STATE ───────────────────────────────────────────────────

  const reset = useCallback(() => {
    stopPolling();
    setConstraint(null);
    setStatus(null);
    setQualityReport(null);
    setPreview([]);
    setConflicts({ conflictCount: 0, conflicts: [], unplacedCourses: [] });
    setError(null);
    setGenerating(false);
  }, [stopPolling]);

  return {
    // State
    constraint, status, qualityReport, preview, conflicts,
    // Loading flags
    loading, saving, generating, publishing, error,
    // Actions
    loadConstraint, saveConstraints,
    generate, fetchPreview, fetchConflicts,
    publish, cancelGenerated,
    startPolling, stopPolling, reset,
  };
};

export default useGaet;
